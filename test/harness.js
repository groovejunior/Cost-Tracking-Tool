"use strict";

/**
 * Loads the real app.js in a Node VM with a stub DOM, a persistent fake
 * localStorage and an in-memory fake Supabase backend, so sync scenarios
 * (offline, reloads, timeouts, two devices) can be replayed deterministically.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { webcrypto } = require("crypto");

const APP_SRC = fs.readFileSync(process.env.SPEND_APP_JS || path.join(__dirname, "..", "app.js"), "utf8");
const AUTH_VIEW_SRC =
  fs.readFileSync(path.join(__dirname, "..", "auth-view.js"), "utf8") +
  ";if(typeof window!=='undefined')window.SpendAuthView=SpendAuthView;";

function makeElement(id) {
  const listeners = {};
  const store = {
    id: id || "",
    hidden: false,
    disabled: false,
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    type: "text",
    dataset: {},
    style: {},
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      const list = listeners[type];
      if (!list) return;
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    requestSubmit() {
      const evt = { preventDefault() {}, type: "submit" };
      (listeners.submit || []).forEach((fn) => fn(evt));
    },
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      toggle(c, on) {
        const want = on === undefined ? !this._s.has(c) : !!on;
        if (want) this._s.add(c); else this._s.delete(c);
        return want;
      },
      contains(c) { return this._s.has(c); },
    },
  };
  const noop = () => undefined;
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "querySelector" || prop === "closest") return () => null;
      if (prop === "querySelectorAll" || prop === "getElementsByTagName") return () => [];
      if (prop === "getAttribute") return () => null;
      if (/^(parent|next|previous|first|last)(Element|Node|Child|ElementChild|ElementSibling|Sibling)$/.test(prop)) {
        return makeElement();
      }
      if (prop === "getBoundingClientRect") return () => ({ top: 0, left: 0, width: 0, height: 0 });
      if (typeof prop === "symbol") return undefined;
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

function screenEls(els) {
  return [...els.values()].filter((e) => e.id && String(e.id).startsWith("screen-"));
}

function makeDocument() {
  const els = new Map();
  return {
    visibilityState: "visible",
    getElementById(id) {
      if (!els.has(id)) els.set(id, makeElement(id));
      return els.get(id);
    },
    querySelector(sel) {
      if (sel === ".screen.active") {
        return screenEls(els).find((e) => e.classList.contains("active")) || null;
      }
      if (sel === "#screen-auth .auth--hybrid") {
        const auth = els.get("screen-auth");
        return auth || null;
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel === ".screen") return screenEls(els);
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    createElement: (tag) => makeElement(tag),
    body: makeElement("body"),
    documentElement: makeElement("html"),
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((r) => setImmediate(r));
async function settle(n = 20) {
  for (let i = 0; i < n; i++) await flush();
}

/**
 * In-memory "Supabase" table shared by every simulated device.
 * hooks[op] lets a test intercept a call: return a promise to delay it,
 * or throw to fail it. `commitThenFail` simulates a client-side timeout
 * after the server already committed.
 */
class FakeServer {
  constructor() {
    this.rows = new Map();
    this.hooks = {};
    this.log = [];
  }
  seed(userId, list) {
    list.forEach((e) => this.rows.set(e.id, Object.assign({ user_id: userId }, e)));
  }
  forUser(userId) {
    return [...this.rows.values()].filter((r) => r.user_id === userId);
  }
  count(pred) {
    return [...this.rows.values()].filter(pred).length;
  }
  async _hook(op, args) {
    const h = this.hooks[op];
    if (!h) return null;
    return h(...args);
  }
}

function toExpense(row) {
  return {
    id: row.id,
    cat: row.cat,
    amount: Number(row.amount),
    note: row.note || "",
    date: row.date,
    fxRate: row.fxRate != null ? Number(row.fxRate) : null,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function makeSpendData(server) {
  const api = {
    isEnabled: () => true,
    async fetchAll(userId) {
      server.log.push(["fetchAll"]);
      const snapshot = server.forUser(userId).map(toExpense);
      const h = await server._hook("fetchAll", [snapshot]);
      if (h && h.rows) return h.rows;
      return snapshot;
    },
    async insert(userId, payload) {
      const id = webcrypto.randomUUID();
      server.rows.set(id, Object.assign({ id, user_id: userId }, payload));
      server.log.push(["insert", id]);
      return toExpense(server.rows.get(id));
    },
    async upsert(userId, id, payload) {
      if (!UUID_RE.test(String(id))) throw new Error('invalid input syntax for type uuid: "' + id + '"');
      server.log.push(["upsert", id]);
      const h = server.hooks.upsert;
      const commit = () => {
        server.rows.set(id, Object.assign({ id, user_id: userId }, payload));
        return toExpense(server.rows.get(id));
      };
      if (h) return h({ id, payload, commit });
      return commit();
    },
    async update(id, payload) {
      server.log.push(["update", id]);
      const row = server.rows.get(id);
      if (!row) throw new Error("JSON object requested, multiple (or no) rows returned");
      Object.assign(row, payload);
      return toExpense(row);
    },
    async remove(id) {
      server.log.push(["remove", id]);
      const h = server.hooks.remove;
      const commit = () => {
        server.rows.delete(id);
      };
      if (h) return h({ id, commit });
      commit();
    },
  };
  return api;
}

/**
 * Boot one "page load" of the app for `user` against `server`.
 * `storage` is a Map shared across reloads of the same device.
 * `auth`: "ok" = supabase-js reports the session; "stored" = it reports none
 * (expired token, refresh failed offline) but the session is still saved;
 * "none" = signed out / rejected, nothing saved.
 */
async function bootApp({
  server,
  storage,
  user,
  online = true,
  signIn = true,
  auth = "ok",
  userMetadata = { display_name: "Tester" },
}) {
  const document = makeDocument();
  const navigator = { onLine: online };
  const windowListeners = {};
  const toasts = [];
  const warnings = [];
  let authCallback = null;

  // A reload kills the previous page on this device: it stops writing to
  // storage and its network calls never settle.
  const RELOAD = Symbol.for("spend.currentPage");
  if (storage[RELOAD]) storage[RELOAD].alive = false;
  const page = { alive: true };
  storage[RELOAD] = page;

  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => {
      if (page.alive) storage.set(k, String(v));
    },
    removeItem: (k) => {
      if (page.alive) storage.delete(k);
    },
  };

  const metaStorageKey = "spend.harness.user_metadata." + user.id;
  let bootMeta = userMetadata || {};
  try {
    const rawMeta = storage.get(metaStorageKey);
    if (rawMeta) bootMeta = Object.assign({}, bootMeta, JSON.parse(rawMeta));
  } catch (_) {
    /* ignore */
  }

  const session = {
    user: {
      id: user.id,
      email: user.email || "user@example.com",
      user_metadata: bootMeta,
    },
  };

  const ctx = {
    console: {
      log() {},
      info() {},
      warn: (...a) => warnings.push(a.join(" ")),
      error: (...a) => warnings.push("ERROR " + a.join(" ")),
    },
    document,
    navigator,
    localStorage,
    location: { hostname: "localhost", origin: "http://localhost", pathname: "/", hash: "", search: "" },
    crypto: webcrypto,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    Promise,
    Date,
    Intl,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    addEventListener(type, fn) {
      (windowListeners[type] = windowListeners[type] || []).push(fn);
    },
    removeEventListener() {},
  };
  ctx.window = ctx;
  ctx.self = ctx;

  const reported = signIn && auth === "ok" ? session : null;
  ctx.SpendAuth = {
    isEnabled: () => true,
    ensureReady: async () => {
      if (!navigator.onLine) throw new Error("Failed to fetch");
    },
    getSession: async () => reported,
    getStoredSession: () => (signIn && auth !== "none" ? session : null),
    onAuthStateChange(cb) {
      authCallback = cb;
    },
    signOut: async () => {},
    clearLocalSession() {},
    updateDisplayName: async (name) => {
      session.user = Object.assign({}, session.user, {
        user_metadata: Object.assign({}, session.user.user_metadata, { display_name: name }),
      });
      if (page.alive) {
        storage.set(metaStorageKey, JSON.stringify(session.user.user_metadata));
      }
      return { user: session.user };
    },
  };
  const data = makeSpendData(server);
  ctx.SpendData = {};
  for (const [k, fn] of Object.entries(data)) {
    ctx.SpendData[k] =
      k === "isEnabled" ? fn : (...args) => (page.alive ? fn(...args) : new Promise(() => {}));
  }
  ctx.SpendSettings = { isEnabled: () => false };
  ctx.SpendCategories = { isEnabled: () => false };
  ctx.SpendRates = {
    snapshotFor: () => 1.6,
    rateFor: () => 1.6,
    audToEur: (a, r) => a / r,
    monthKey: (d) => new Date(d).toISOString().slice(0, 7),
    currentMonthKey: () => new Date().toISOString().slice(0, 7),
    ensureForDate: async () => false,
    ensureForExpenses: async () => false,
    ensureMonths: async () => false,
  };
  ctx.showToastHook = (m) => toasts.push(m);

  vm.createContext(ctx);
  vm.runInContext(AUTH_VIEW_SRC, ctx, { filename: "auth-view.js" });
  vm.runInContext(APP_SRC, ctx, { filename: "app.js" });

  const app = {
    ctx,
    toasts,
    warnings,
    run: (code) => vm.runInContext(code, ctx),
    get expenses() {
      return vm.runInContext("expenses", ctx);
    },
    stored() {
      return JSON.parse(storage.get("spend_v1_" + user.id) || "[]");
    },
    tombstones() {
      return JSON.parse(storage.get("spend_pending_deletes_" + user.id) || "[]");
    },
    setOnline(v) {
      navigator.onLine = v;
      const evt = v ? "online" : "offline";
      (windowListeners[evt] || []).forEach((fn) => fn({ type: evt }));
    },
    async signInNow() {
      authCallback("INITIAL_SESSION", reported);
    },
    get signedInAs() {
      return vm.runInContext("appReady && currentUser ? currentUser.id : null", ctx);
    },
    activeScreen() {
      const screens = [
        "screen-auth",
        "screen-setup",
        "screen-display-name",
        "screen-home",
        "screen-list",
        "screen-add",
        "screen-analyse",
        "screen-stub",
      ];
      for (const id of screens) {
        if (app.run(`document.getElementById("${id}").classList.contains("active")`)) return id;
      }
      return null;
    },
    accountInitial() {
      return vm.runInContext("document.getElementById('accountInitial').textContent", ctx);
    },
    async submitDisplayName(name) {
      vm.runInContext(`document.getElementById("displayNameInput").value = ${JSON.stringify(name)}`, ctx);
      await vm.runInContext("document.getElementById('displayNameForm').requestSubmit()", ctx);
      await settle(15);
    },
    /** Fill the add form and save, the way the UI does. */
    async addExpense({ cat = "groceries", amount, note = "", day }) {
      vm.runInContext("editingId = null", ctx);
      ctx.__draft = { cat, amount, note, day };
      vm.runInContext(
        "draft.cat = __draft.cat; draft.day = __draft.day || todayStr();" +
          "document.getElementById('amtInput').value = String(__draft.amount);" +
          "document.getElementById('noteInput').value = __draft.note;",
        ctx
      );
      await vm.runInContext("commitAdd()", ctx);
    },
    async editExpense(id, { amount, note }) {
      ctx.__edit = { id, amount, note };
      vm.runInContext(
        "(() => { const e = expenses.find((x) => x.id === __edit.id);" +
          "editingId = e.id; draft.cat = e.cat;" +
          "document.getElementById('amtInput').value = String(__edit.amount);" +
          "draft.day = isoDay(new Date(e.date));" +
          "document.getElementById('noteInput').value = __edit.note != null ? __edit.note : e.note; })()",
        ctx
      );
      await vm.runInContext("commitAdd()", ctx);
    },
    async deleteExpense(id) {
      ctx.__del = id;
      await vm.runInContext("deleteExpense(__del)", ctx);
    },
  };

  if (signIn) {
    await settle();
    authCallback("INITIAL_SESSION", reported);
  }
  return app;
}

/** Wait until the app's background sync work is idle. */
async function idle(app, rounds = 40) {
  for (let i = 0; i < rounds; i++) {
    await settle(5);
    const busy = app.run("(typeof syncPendingInFlight !== \"undefined\" && !!syncPendingInFlight) || enterAppRunning");
    if (!busy) {
      await settle(5);
      if (!app.run("typeof syncPendingInFlight !== \"undefined\" && !!syncPendingInFlight")) return;
    }
  }
}

module.exports = { bootApp, FakeServer, deferred, settle, idle, UUID_RE };
