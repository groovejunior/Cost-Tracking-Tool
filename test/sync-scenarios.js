"use strict";

/**
 * End-to-end sync scenarios against the real app.js with a fake Supabase
 * backend: offline edits/deletes, reloads mid-sync, timeouts after the
 * server committed, two devices, and localStorage left by older versions.
 *
 *   node test/sync-scenarios.js
 */

const assert = require("assert");
const { bootApp, FakeServer, deferred, settle, idle, UUID_RE } = require("./harness");

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "carlo@example.com" };
const A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";

function isoDaysAgo(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function dayStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function row(id, amount, extra) {
  return Object.assign({ id, cat: "groceries", amount, note: "", date: isoDaysAgo(1), fxRate: 1.6 }, extra || {});
}
function only(list, pred, msg) {
  const hits = list.filter(pred);
  assert.strictEqual(hits.length, 1, msg + " (found " + hits.length + ")");
  return hits[0];
}
function noDupIds(list) {
  assert.strictEqual(new Set(list.map((e) => e.id)).size, list.length, "duplicate ids in list");
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * Random adds/edits/deletes on two devices with offline spells, reloads that
 * abandon in-flight uploads, and timeouts that fire after the server committed.
 * Each device only edits/deletes its own expenses, so the end state is defined:
 * every surviving expense exists exactly once everywhere with its last amount.
 */
async function fuzz(seed) {
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const server = new FakeServer();
  const devices = [
    { name: "phone", storage: new Map(), app: null },
    { name: "laptop", storage: new Map(), app: null },
  ];
  const expected = new Map();
  let serial = 0;

  const setFaults = () => {
    const r = rand();
    if (r < 0.15) {
      server.hooks.upsert = async ({ commit }) => {
        commit();
        throw new Error("Save timed out");
      };
    } else if (r < 0.25) {
      server.hooks.upsert = async () => {
        throw new Error("Failed to fetch");
      };
    } else if (r < 0.32) {
      server.hooks.upsert = ({ commit }) => {
        commit();
        return new Promise(() => {});
      };
    } else {
      delete server.hooks.upsert;
    }
    if (rand() < 0.15) {
      server.hooks.remove = async () => {
        throw new Error("Delete timed out");
      };
    } else {
      delete server.hooks.remove;
    }
  };

  for (const d of devices) {
    d.app = await bootApp({ server, storage: d.storage, user: USER });
    await idle(d.app, 10);
  }

  for (let step = 0; step < 60; step++) {
    const d = pick(devices);
    setFaults();
    const action = rand();
    const mine = d.app.expenses.filter((e) => expected.has(e.note) && expected.get(e.note).owner === d.name);
    if (action < 0.35) {
      const note = "x" + serial++;
      const amount = 1 + Math.floor(rand() * 50);
      expected.set(note, { owner: d.name, amount });
      await d.app.addExpense({ amount, note, day: dayStr(Math.floor(rand() * 3)) });
    } else if (action < 0.55 && mine.length) {
      const e = pick(mine);
      const amount = 1 + Math.floor(rand() * 50);
      expected.get(e.note).amount = amount;
      await d.app.editExpense(e.id, { amount });
    } else if (action < 0.7 && mine.length) {
      const e = pick(mine);
      expected.delete(e.note);
      await d.app.deleteExpense(e.id);
    } else if (action < 0.8) {
      d.app.setOnline(!d.app.ctx.navigator.onLine);
    } else {
      d.app = await bootApp({ server, storage: d.storage, user: USER, online: rand() < 0.8 });
    }
    await settle(3 + Math.floor(rand() * 10));
  }

  delete server.hooks.upsert;
  delete server.hooks.remove;
  for (let round = 0; round < 3; round++) {
    for (const d of devices) {
      d.app = await bootApp({ server, storage: d.storage, user: USER, online: true });
      await idle(d.app);
    }
  }

  const serverNotes = server.forUser(USER.id).map((r) => r.note).sort();
  const want = [...expected.keys()].sort();
  assert.deepStrictEqual(serverNotes, want, "cloud contents");
  for (const r of server.forUser(USER.id)) {
    assert.strictEqual(r.amount, expected.get(r.note).amount, "cloud amount for " + r.note);
  }
  for (const d of devices) {
    const notes = d.app.expenses.map((e) => e.note).sort();
    const missing = want.filter((n) => !notes.includes(n));
    const extra = notes.filter((n) => !want.includes(n));
    assert.ok(!missing.length && !extra.length && notes.length === want.length,
      d.name + " contents: missing " + JSON.stringify(missing) + " extra " + JSON.stringify(extra) +
      " (" + notes.length + " vs " + want.length + ")");
    noDupIds(d.app.expenses);
    assert.ok(!d.app.expenses.some(isPendingLike), d.name + " still has unsynced rows");
    assert.deepStrictEqual(d.app.tombstones(), [], d.name + " still has pending deletes");
  }
}

function isPendingLike(e) {
  return e._pending || !UUID_RE.test(e.id);
}

const results = [];
async function scenario(name, fn) {
  try {
    await fn();
    results.push([true, name]);
    console.log("  ok    " + name);
  } catch (e) {
    results.push([false, name]);
    console.log("  FAIL  " + name + "\n        " + (e && e.message));
  }
}

(async () => {
  console.log("\nSync scenarios (real app.js, fake Supabase)\n");

  await scenario("B1: offline edit survives reload and lands in the cloud", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20, { note: "lunch" })]);
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app.setOnline(false);
    await app.editExpense(A, { amount: 25 });
    assert.strictEqual(app.stored().find((e) => e.id === A).amount, 25);
    app = await bootApp({ server, storage, user: USER, online: true });
    await idle(app);
    assert.strictEqual(only(app.expenses, (e) => e.id === A, "lunch").amount, 25);
    assert.strictEqual(server.rows.get(A).amount, 25);
  });

  await scenario("B2: offline delete survives reload and is deleted in the cloud", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20), row(B, 7)]);
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app.setOnline(false);
    await app.deleteExpense(A);
    app = await bootApp({ server, storage, user: USER, online: false });
    await idle(app);
    assert.ok(!app.expenses.some((e) => e.id === A), "deleted row back while offline");
    app = await bootApp({ server, storage, user: USER, online: true });
    await idle(app);
    assert.ok(!app.expenses.some((e) => e.id === A), "deleted row back after reload");
    assert.ok(!server.rows.has(A), "row still in cloud");
    assert.deepStrictEqual(app.tombstones(), []);
  });

  await scenario("B3: upsert commits but times out client-side, retry does not duplicate", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    server.hooks.upsert = async ({ commit }) => {
      commit();
      throw new Error("Save timed out");
    };
    await app.addExpense({ amount: 9.5, note: "coffee" });
    await idle(app);
    delete server.hooks.upsert;
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "coffee"), 1, "cloud copies");
    only(app.expenses, (e) => e.note === "coffee", "local copies");
    assert.ok(!app.expenses.some((e) => e._pending), "still pending");
  });

  await scenario("B3: reload mid-upload (response lost) does not duplicate", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    server.hooks.upsert = ({ commit }) => {
      commit();
      return new Promise(() => {});
    };
    await app.addExpense({ amount: 4, note: "tram" });
    await settle();
    delete server.hooks.upsert;
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "tram"), 1, "cloud copies");
    only(app.expenses, (e) => e.note === "tram", "local copies");
  });

  await scenario("B3: a second save while a sync is in flight is uploaded too", async () => {
    const server = new FakeServer();
    const storage = new Map();
    const app = await bootApp({ server, storage, user: USER });
    await idle(app);
    const gate = deferred();
    server.hooks.upsert = async ({ commit }) => {
      await gate.promise;
      return commit();
    };
    await app.addExpense({ amount: 3, note: "first" });
    await settle();
    await app.addExpense({ amount: 4, note: "second" });
    await settle();
    delete server.hooks.upsert;
    gate.resolve();
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "first"), 1);
    assert.strictEqual(server.count((r) => r.note === "second"), 1, "second save not uploaded");
    assert.ok(!app.expenses.some((e) => e._pending), "something left unsynced");
  });

  await scenario("B4: two identical past-day expenses are both kept", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    await app.addExpense({ amount: 5, day: dayStr(1) });
    await idle(app);
    await app.addExpense({ amount: 5, day: dayStr(1) });
    await idle(app);
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.amount === 5), 2);
    assert.strictEqual(app.expenses.filter((e) => e.amount === 5).length, 2);
  });

  await scenario("expense added while the startup fetch is slow is not dropped", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20)]);
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    const gate = deferred();
    server.hooks.fetchAll = () => gate.promise.then(() => null);
    server.hooks.upsert = async () => {
      throw new Error("Save timed out");
    };
    app = await bootApp({ server, storage, user: USER });
    await settle();
    await app.addExpense({ amount: 11, note: "during fetch" });
    await settle();
    gate.resolve();
    await idle(app);
    only(app.expenses, (e) => e.note === "during fetch", "in memory");
    only(app.stored(), (e) => e.note === "during fetch", "in localStorage");
    delete server.hooks.fetchAll;
    delete server.hooks.upsert;
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "during fetch"), 1);
  });

  await scenario("edit made while that row's upload is in flight is not reverted", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    const gate = deferred();
    server.hooks.upsert = async ({ commit }) => {
      await gate.promise;
      return commit();
    };
    await app.addExpense({ amount: 10, note: "dinner" });
    await settle();
    const id = app.expenses.find((e) => e.note === "dinner").id;
    delete server.hooks.upsert;
    await app.editExpense(id, { amount: 12 });
    gate.resolve();
    await idle(app);
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(only(app.expenses, (e) => e.note === "dinner", "dinner").amount, 12);
    assert.strictEqual(server.rows.get(id).amount, 12);
  });

  await scenario("delete while that row's upload is in flight does not resurrect it", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    const gate = deferred();
    server.hooks.upsert = async ({ commit }) => {
      await gate.promise;
      return commit();
    };
    await app.addExpense({ amount: 10, note: "oops" });
    await settle();
    const id = app.expenses.find((e) => e.note === "oops").id;
    await app.deleteExpense(id);
    delete server.hooks.upsert;
    gate.resolve();
    await idle(app);
    assert.ok(!app.expenses.some((e) => e.note === "oops"), "back locally");
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.ok(!app.expenses.some((e) => e.note === "oops"), "back after reload");
    assert.strictEqual(server.count((r) => r.note === "oops"), 0, "back in cloud");
  });

  await scenario("two devices: a delete on one device disappears on the other after reload", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20), row(B, 7)]);
    const phone = new Map();
    const laptop = new Map();
    let p = await bootApp({ server, storage: phone, user: USER });
    await idle(p);
    const l = await bootApp({ server, storage: laptop, user: USER });
    await idle(l);
    await l.deleteExpense(A);
    assert.ok(!server.rows.has(A));
    p = await bootApp({ server, storage: phone, user: USER });
    await idle(p);
    assert.ok(!p.expenses.some((e) => e.id === A), "ghost of deleted expense on the other device");
    p = await bootApp({ server, storage: phone, user: USER, online: false });
    await idle(p);
    assert.ok(!p.expenses.some((e) => e.id === A), "ghost while offline");
  });

  await scenario("two devices: an edit on one device shows on the other", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20)]);
    const phone = new Map();
    const laptop = new Map();
    let p = await bootApp({ server, storage: phone, user: USER });
    await idle(p);
    const l = await bootApp({ server, storage: laptop, user: USER });
    await idle(l);
    await l.editExpense(A, { amount: 33 });
    await idle(l);
    p = await bootApp({ server, storage: phone, user: USER });
    await idle(p);
    assert.strictEqual(only(p.expenses, (e) => e.id === A, "A").amount, 33);
  });

  await scenario("upgrade: old pending edit (cloud id + _pending) is uploaded and wins", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20), row(B, 7)]);
    const storage = new Map();
    storage.set("spend_v1_" + USER.id, JSON.stringify([row(A, 21, { _pending: true }), row(B, 7)]));
    const app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.rows.get(A).amount, 21);
    assert.strictEqual(only(app.expenses, (e) => e.id === A, "A").amount, 21);
    assert.ok(!app.expenses.some((e) => e._pending));
  });

  await scenario("upgrade: old never-uploaded local_* expense is uploaded exactly once", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20)]);
    const storage = new Map();
    storage.set(
      "spend_v1_" + USER.id,
      JSON.stringify([row(A, 20), row("local_e7", 6, { _pending: true, note: "offline buy" })])
    );
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "offline buy"), 1);
    const e = only(app.expenses, (x) => x.note === "offline buy", "local");
    assert.ok(UUID_RE.test(e.id), "still has a local id");
    noDupIds(app.expenses);
  });

  await scenario("upgrade: old local_* whose insert committed before a timeout is not duplicated", async () => {
    const server = new FakeServer();
    const committed = row("cccccccc-dddd-4eee-8fff-000000000000", 6, { note: "offline buy", date: isoDaysAgo(2, 9) });
    server.seed(USER.id, [row(A, 20), committed]);
    const storage = new Map();
    storage.set(
      "spend_v1_" + USER.id,
      JSON.stringify([
        row(A, 20),
        row("local_e7", 6, { _pending: true, note: "offline buy", date: committed.date }),
      ])
    );
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "offline buy"), 1, "cloud copies");
    only(app.expenses, (x) => x.note === "offline buy", "local copies");
  });

  await scenario("upgrade: old local_* that is a genuine twin of a known row is kept", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 5, { note: "" })]);
    const storage = new Map();
    storage.set(
      "spend_v1_" + USER.id,
      JSON.stringify([row(A, 5), row("local_e8", 5, { _pending: true, date: row(A, 5).date })])
    );
    const app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.amount === 5), 2, "cloud copies");
    assert.strictEqual(app.expenses.filter((e) => e.amount === 5).length, 2, "local copies");
  });

  await scenario("upgrade: old local_* upload interrupted by a reload is not duplicated", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20)]);
    const storage = new Map();
    storage.set(
      "spend_v1_" + USER.id,
      JSON.stringify([row(A, 20), row("local_e9", 8, { _pending: true, note: "legacy", date: isoDaysAgo(3) })])
    );
    server.hooks.upsert = ({ commit }) => {
      commit();
      return new Promise(() => {});
    };
    let app = await bootApp({ server, storage, user: USER });
    await idle(app, 10);
    delete server.hooks.upsert;
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "legacy"), 1, "cloud copies");
    only(app.expenses, (x) => x.note === "legacy", "local copies");
    noDupIds(app.expenses);
  });

  await scenario("offline delete of a never-uploaded expense never reaches the cloud", async () => {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app.setOnline(false);
    await app.addExpense({ amount: 2, note: "typo" });
    const id = app.expenses.find((e) => e.note === "typo").id;
    await app.deleteExpense(id);
    app.setOnline(true);
    await idle(app);
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "typo"), 0);
    assert.ok(!app.expenses.some((e) => e.note === "typo"));
  });

  await scenario("failed cloud fetch at startup keeps every local expense", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20), row(B, 7)]);
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER });
    await idle(app);
    server.hooks.fetchAll = async () => {
      throw new Error("Cloud fetch timed out");
    };
    app = await bootApp({ server, storage, user: USER });
    await idle(app);
    assert.strictEqual(app.expenses.length, 2);
    assert.strictEqual(app.stored().length, 2);
  });

  await scenario("coming back online uploads offline adds once and keeps everything", async () => {
    const server = new FakeServer();
    server.seed(USER.id, [row(A, 20)]);
    const storage = new Map();
    const app = await bootApp({ server, storage, user: USER });
    await idle(app);
    app.setOnline(false);
    await app.addExpense({ amount: 1, note: "o1" });
    await app.addExpense({ amount: 2, note: "o2" });
    app.setOnline(true);
    await idle(app);
    app.setOnline(false);
    app.setOnline(true);
    await idle(app);
    assert.strictEqual(server.count((r) => r.note === "o1"), 1);
    assert.strictEqual(server.count((r) => r.note === "o2"), 1);
    assert.strictEqual(app.expenses.length, 3);
    noDupIds(app.expenses);
  });

  await scenario("signing in as someone else mid-upload does not leak the old user's expense", async () => {
    const server = new FakeServer();
    const storage = new Map();
    const app = await bootApp({ server, storage, user: USER });
    await idle(app);
    const gate = deferred();
    server.hooks.upsert = async ({ commit }) => {
      await gate.promise;
      return commit();
    };
    await app.addExpense({ amount: 10, note: "mine" });
    await settle();
    app.run("currentUser = { id: '99999999-2222-4333-8444-555555555555' }; setExpenseStoreKey(currentUser.id); expenses = [];");
    delete server.hooks.upsert;
    gate.resolve();
    await idle(app);
    assert.ok(!app.expenses.some((e) => e.note === "mine"));
    assert.ok(!storage.get("spend_v1_99999999-2222-4333-8444-555555555555"), "written to other user's cache");
  });

  const seeds = Number(process.env.FUZZ_SEEDS || 12);
  for (let seed = 1; seed <= seeds; seed++) {
    await scenario("randomised two-device run, seed " + seed, () => fuzz(seed));
  }

  const failed = results.filter((r) => !r[0]);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " scenarios passed\n");
  process.exit(failed.length ? 1 : 0);
})();
