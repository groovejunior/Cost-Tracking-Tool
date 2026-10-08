"use strict";

/**
 * Headless-Chrome check that a signed-in user stays signed in when the
 * installed app is reopened offline, and is only signed out when the auth
 * server definitively rejects the session.
 *
 * Serves the repo at /Cost-Tracking-Tool/ (like GitHub Pages) with the real
 * service worker; Supabase and Frankfurter are mocked, nothing touches the
 * live project. "Offline" = browser offline + static server down + every
 * Supabase/FX request failing at the network level.
 *
 *   npm i --prefix /tmp/pw playwright-core   (once)
 *   NODE_PATH=/tmp/pw/node_modules node test/offline-session-browser.js
 *
 * Env: CHROME (default /usr/local/bin/google-chrome), SPEND_ROOT (dir to
 * serve, default repo root), ONLY=<scenario substring>.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.log("SKIP: playwright-core not installed (see header of this file)");
  process.exit(0);
}

const ROOT = path.resolve(process.env.SPEND_ROOT || path.join(__dirname, ".."));
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";
const PORT = 8089;
const HOST = "spend.test";
const ORIGIN = `http://${HOST}:${PORT}`;
const APP_URL = `${ORIGIN}/Cost-Tracking-Tool/`;
const SUPABASE = "https://wwzzyetczulvduucdhoz.supabase.co";
const STORAGE_KEY = "sb-wwzzyetczulvduucdhoz-auth-token";
const USER = { id: "aaaaaaaa-0000-4000-8000-000000000001", email: "owner@example.com", aud: "authenticated", role: "authenticated" };

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

let serverDown = false;
const server = http.createServer((req, res) => {
  if (serverDown) return req.socket.destroy();
  const u = new URL(req.url, ORIGIN);
  if (!u.pathname.startsWith("/Cost-Tracking-Tool/")) {
    res.writeHead(404);
    return res.end();
  }
  let rel = decodeURIComponent(u.pathname.slice("/Cost-Tracking-Tool/".length)) || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(file).pipe(res);
});

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeSession(expiresInSec) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const access_token = [b64url({ alg: "HS256", typ: "JWT" }), b64url({ sub: USER.id, exp, role: "authenticated", session_id: "s1" }), "sig"].join(".");
  return { access_token, token_type: "bearer", expires_in: expiresInSec, expires_at: exp, refresh_token: "rt-" + crypto.randomUUID(), user: USER };
}

/** In-memory Supabase backend shared by all pages of one scenario. */
function makeBackend() {
  return {
    offline: false,
    revoked: false,
    rows: new Map(),
    log: [],
  };
}

async function installMocks(context, be) {
  await context.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const method = req.method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors() });
    if (be.offline) {
      be.log.push(["offline", method, u.pathname]);
      return route.abort("internetdisconnected");
    }
    be.log.push([method, u.pathname + u.search]);
    const json = (status, body) => route.fulfill({ status, headers: { ...cors(), "content-type": "application/json" }, body: JSON.stringify(body) });

    if (u.pathname === "/auth/v1/token" && u.searchParams.get("grant_type") === "refresh_token") {
      if (be.revoked) return json(400, { code: "refresh_token_not_found", error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" });
      return json(200, makeSession(3600));
    }
    if (u.pathname === "/auth/v1/user") {
      if (be.revoked) return json(403, { code: "session_not_found", error_code: "session_not_found", msg: "Session from session_id claim in JWT does not exist" });
      return json(200, USER);
    }
    if (u.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: cors() });

    if (u.pathname === "/rest/v1/expenses") {
      const single = /vnd\.pgrst\.object/.test(req.headers()["accept"] || "");
      if (method === "GET") return json(200, [...be.rows.values()]);
      if (method === "POST") {
        const body = JSON.parse(req.postData() || "{}");
        const list = (Array.isArray(body) ? body : [body]).map((r) => {
          const row = { id: r.id || crypto.randomUUID(), category_id: r.category_id, amount: r.amount, note: r.note || "", expense_date: r.expense_date, fx_rate: r.fx_rate ?? null };
          be.rows.set(row.id, row);
          return row;
        });
        return json(201, single ? list[0] : list);
      }
      if (method === "PATCH") {
        const id = (u.searchParams.get("id") || "").replace(/^eq\./, "");
        const row = be.rows.get(id);
        if (!row) return json(406, { message: "JSON object requested, multiple (or no) rows returned" });
        Object.assign(row, JSON.parse(req.postData() || "{}"));
        return json(200, single ? row : [row]);
      }
      if (method === "DELETE") {
        const id = (u.searchParams.get("id") || "").replace(/^eq\./, "");
        be.rows.delete(id);
        return route.fulfill({ status: 204, headers: cors() });
      }
    }
    if (u.pathname.startsWith("/rest/v1/")) {
      if (method === "GET") return json(200, []);
      return route.fulfill({ status: 204, headers: cors() });
    }
    return json(404, {});
  });

  await context.route("https://api.frankfurter.dev/**", (route) =>
    be.offline
      ? route.abort("internetdisconnected")
      : route.fulfill({ status: 200, headers: { ...cors(), "content-type": "application/json" }, body: JSON.stringify({ amount: 1, base: "EUR", date: "2026-10-01", rates: { AUD: 1.6 } }) })
  );
}

function cors() {
  return { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
}

async function screen(page) {
  return page.evaluate(() => {
    const load = document.getElementById("loadScreen");
    if (load && !load.classList.contains("is-hidden")) return "loading";
    if (document.getElementById("screen-auth")?.classList.contains("active")) return "auth";
    const app = document.getElementById("app");
    const active = document.querySelector(".screen.active");
    if (app && !app.classList.contains("auth-mode") && active && active.id !== "screen-setup") return "app";
    return "loading";
  });
}

async function waitForScreen(page, ms) {
  const end = Date.now() + ms;
  let s = "loading";
  while (Date.now() < end) {
    s = await screen(page);
    if (s !== "loading") return s;
    await page.waitForTimeout(250);
  }
  return s;
}

// Playwright's offline mode doesn't flip navigator.onLine on a freshly loaded
// page, so mirror what a phone in airplane mode reports.
async function forceOnLine(context) {
  await context.addInitScript(() => {
    if (localStorage.getItem("__test_offline")) {
      Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    }
  });
}

async function goOffline(context, be, page) {
  await page.evaluate(() => localStorage.setItem("__test_offline", "1"));
  be.offline = true;
  serverDown = true;
  await context.setOffline(true);
}

async function goOnline(context, be, page) {
  await page.evaluate(() => {
    localStorage.removeItem("__test_offline");
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => true });
  });
  be.offline = false;
  serverDown = false;
  await context.setOffline(false);
}

const appState = (page) =>
  page.evaluate(() => ({
    expenses: expenses.map((e) => ({ id: e.id, amount: e.amount, note: e.note, pending: !!e._pending })),
    pendingDeletes: (() => {
      try {
        return JSON.parse(localStorage.getItem("spend_pending_deletes_" + currentUser.id) || "[]");
      } catch {
        return [];
      }
    })(),
    hasStoredSession: !!localStorage.getItem("sb-wwzzyetczulvduucdhoz-auth-token"),
    user: currentUser ? currentUser.id : null,
  }));

async function addExpense(page, amount, note) {
  await page.evaluate(
    async ({ amount, note }) => {
      editingId = null;
      draft.cat = "groceries";
      draft.day = todayStr();
      document.getElementById("amtInput").value = String(amount);
      document.getElementById("noteInput").value = note;
      await commitAdd();
    },
    { amount, note }
  );
}

async function editExpense(page, id, amount) {
  await page.evaluate(
    async ({ id, amount }) => {
      const e = expenses.find((x) => x.id === id);
      editingId = e.id;
      draft.cat = e.cat;
      draft.day = isoDay(new Date(e.date));
      document.getElementById("amtInput").value = String(amount);
      document.getElementById("noteInput").value = e.note;
      await commitAdd();
    },
    { id, amount }
  );
}

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${detail !== undefined ? "  — " + (typeof detail === "string" ? detail : JSON.stringify(detail)) : ""}`);
}

/**
 * Fresh profile: sign in "online" (session seeded into storage, as after a
 * real sign-in), let the app hydrate two cloud expenses and the service
 * worker precache the shell.
 */
async function installAndSignIn(browser, be) {
  const context = await browser.newContext();
  await installMocks(context, be);
  await forceOnLine(context);
  const pageErrors = [];
  const t0 = new Date(Date.now() - 2 * 86400000).toISOString();
  const a = { id: crypto.randomUUID(), category_id: "groceries", amount: 12.5, note: "milk", expense_date: t0, fx_rate: 1.6 };
  const b = { id: crypto.randomUUID(), category_id: "transport", amount: 4, note: "bus", expense_date: t0, fx_rate: 1.6 };
  be.rows.set(a.id, a);
  be.rows.set(b.id, b);
  await context.addInitScript(
    ({ key, session }) => {
      if (!localStorage.getItem("__seeded")) {
        localStorage.setItem("__seeded", "1");
        localStorage.setItem(key, JSON.stringify(session));
      }
    },
    { key: STORAGE_KEY, session: makeSession(3600) }
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.goto(APP_URL);
  const s = await waitForScreen(page, 20000);
  await page.waitForFunction(() => navigator.serviceWorker.controller && expenses.length >= 2, null, { timeout: 20000 });
  await page.waitForFunction(async () => (await (await caches.open((await caches.keys())[0])).keys()).length >= 20, null, { timeout: 20000 });
  return { context, page, a, b, signedInScreen: s, pageErrors };
}

async function setStoredExpiry(page, secondsFromNow) {
  await page.evaluate(
    ({ key, secs }) => {
      const s = JSON.parse(localStorage.getItem(key));
      s.expires_at = Math.floor(Date.now() / 1000) + secs;
      localStorage.setItem(key, JSON.stringify(s));
    },
    { key: STORAGE_KEY, secs: secondsFromNow }
  );
}

const scenarios = {
  async "reopen offline with a valid cached session"(browser) {
    const be = makeBackend();
    const { context, page, pageErrors } = await installAndSignIn(browser, be);
    await goOffline(context, be, page);
    await page.reload();
    const s = await waitForScreen(page, 30000);
    check("app shell boots from the service worker offline", (await page.title()).length > 0);
    check("lands in the app, not on sign-in", s === "app", s);
    const st = await appState(page);
    check("cached expenses are shown", st.expenses.length === 2, st.expenses.length);
    await addExpense(page, 7, "offline coffee");
    const st2 = await appState(page);
    check("offline add is kept as pending", st2.expenses.some((e) => e.note === "offline coffee" && e.pending));
    check("no page errors", pageErrors.length === 0, pageErrors);
    await context.close();
  },

  async "reopen offline with an expired access token, then back online"(browser) {
    const be = makeBackend();
    const { context, page, a, b, pageErrors } = await installAndSignIn(browser, be);
    await setStoredExpiry(page, -600);
    await goOffline(context, be, page);
    const t0 = Date.now();
    await page.reload();
    const s = await waitForScreen(page, 30000);
    check("lands in the app, not on sign-in", s === "app", `${s} after ${Date.now() - t0} ms`);
    check("does not wait on the failing token refresh", Date.now() - t0 < 3000, `${Date.now() - t0} ms`);
    const st = await appState(page);
    check("cached expenses are shown", st.expenses.length === 2, st.expenses.length);
    check("stored session kept", st.hasStoredSession);

    await addExpense(page, 9, "offline lunch");
    await editExpense(page, a.id, 99);
    await page.evaluate((id) => deleteExpense(id), b.id);
    const st2 = await appState(page);
    check("offline add/edit/delete queued", st2.expenses.filter((e) => e.pending).length === 2 && st2.pendingDeletes.includes(b.id), st2);

    // supabase-js keeps retrying the refresh for ~30 s per attempt and then
    // reports INITIAL_SESSION with no session; that must not sign us out.
    await page.waitForTimeout(70000);
    check("still in the app after supabase-js gives up refreshing offline", (await screen(page)) === "app", await screen(page));
    check("still has the stored session", (await appState(page)).hasStoredSession);

    await goOnline(context, be, page);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForFunction(() => !expenses.some((e) => e._pending), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const st3 = await appState(page);
    const cloud = [...be.rows.values()];
    check("token refreshed once back online", be.log.some(([m, p]) => m === "POST" && /grant_type=refresh_token/.test(p)));
    check("pending changes synced to the cloud", cloud.length === 2 && cloud.some((r) => r.id === a.id && Number(r.amount) === 99) && cloud.some((r) => r.note === "offline lunch") && !be.rows.has(b.id), cloud.map((r) => [r.note, r.amount]));
    check("nothing left pending locally", st3.expenses.every((e) => !e.pending) && st3.pendingDeletes.length === 0, st3);
    check("still in the app", (await screen(page)) === "app");
    check("no page errors", pageErrors.length === 0, pageErrors);
    await context.close();
  },

  async "expired token, no network, but the device still reports online"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    await setStoredExpiry(page, -600);
    await goOffline(context, be, page);
    await page.evaluate(() => localStorage.removeItem("__test_offline"));
    const t0 = Date.now();
    await page.reload();
    const s = await waitForScreen(page, 30000);
    check("lands in the app via the startup fallback", s === "app" && Date.now() - t0 < 8000, `${s} after ${Date.now() - t0} ms`);
    check("cached expenses are shown", (await appState(page)).expenses.length === 2);
    await context.close();
  },

  async "reopen offline with an expired token, close, reopen online"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    await setStoredExpiry(page, -600);
    await goOffline(context, be, page);
    await page.reload();
    check("offline: in the app", (await waitForScreen(page, 30000)) === "app");
    await addExpense(page, 3, "queued");
    await goOnline(context, be, page);
    await page.reload();
    const s = await waitForScreen(page, 30000);
    check("online reopen: in the app", s === "app", s);
    await page.waitForFunction(() => !expenses.some((e) => e._pending), null, { timeout: 30000 }).catch(() => {});
    check("queued expense reached the cloud", [...be.rows.values()].some((r) => r.note === "queued"));
    await context.close();
  },

  async "revoked session (refresh rejected) online goes to sign-in"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    await setStoredExpiry(page, -600);
    be.revoked = true;
    await page.reload();
    const s = await waitForScreen(page, 30000);
    await page.waitForTimeout(1000);
    const final = await screen(page);
    check("shows sign-in", final === "auth", `${s} -> ${final}`);
    check("stored session removed", !(await page.evaluate((k) => !!localStorage.getItem(k), STORAGE_KEY)));
    await context.close();
  },

  async "revoked session (valid token, server says session gone) online goes to sign-in"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    be.revoked = true;
    await page.reload();
    await waitForScreen(page, 30000);
    await page.waitForFunction(() => document.getElementById("screen-auth").classList.contains("active"), null, { timeout: 30000 }).catch(() => {});
    check("shows sign-in", (await screen(page)) === "auth", await screen(page));
    await context.close();
  },

  async "revoked while offline is detected once back online"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    await setStoredExpiry(page, -600);
    await goOffline(context, be, page);
    await page.reload();
    check("offline: in the app", (await waitForScreen(page, 30000)) === "app");
    be.revoked = true;
    await goOnline(context, be, page);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForFunction(() => document.getElementById("screen-auth").classList.contains("active"), null, { timeout: 45000 }).catch(() => {});
    check("shows sign-in after the server rejects the session", (await screen(page)) === "auth", await screen(page));
    await context.close();
  },

  async "signed-out user offline still sees sign-in"(browser) {
    const be = makeBackend();
    const { context, page } = await installAndSignIn(browser, be);
    await page.evaluate(() => handleLogout());
    await page.waitForFunction(() => document.getElementById("screen-auth").classList.contains("active"), null, { timeout: 10000 });
    await goOffline(context, be, page);
    await page.reload();
    const s = await waitForScreen(page, 30000);
    check("shows sign-in", s === "auth", s);
    await context.close();
  },
};

(async () => {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`, `--unsafely-treat-insecure-origin-as-secure=${ORIGIN}`, "--no-sandbox"],
  });
  try {
    for (const [name, fn] of Object.entries(scenarios)) {
      if (process.env.ONLY && !name.includes(process.env.ONLY)) continue;
      console.log(name);
      serverDown = false;
      try {
        await fn(browser);
      } catch (e) {
        check("scenario ran", false, e.message.split("\n")[0]);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\n${pass}/${pass + fail} browser checks passed`);
  process.exit(fail ? 1 : 0);
})();
