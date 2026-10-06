"use strict";

/**
 * Reproduces bug B1 (pending edit of a cloud expense lost on merge)
 * against the real helpers in app.js.
 *
 *   node test/merge-pending-edits.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const src = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractBetween(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error("missing start marker: " + startMarker);
  const end = src.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error("missing end marker: " + endMarker);
  return src.slice(start, end);
}

const helpers = [
  extractBetween("function isCloudId(", "function makeLocalId("),
  extractBetween("function isPendingExpense(", "function expensePayload("),
  extractBetween("function expensesLookAlike(", "function mergeCloudAndLocal("),
  extractBetween("function mergeCloudAndLocal(", "function pendingExpensesToSync("),
  extractBetween("function pendingExpensesToSync(", "async function fetchCloudExpenses("),
].join("\n");

const sandbox = {};
new Function("exports", helpers + "\nexports.api = { isCloudId, isPendingExpense, expensesLookAlike, mergeCloudAndLocal, pendingExpensesToSync };")(sandbox);
const {
  isCloudId,
  isPendingExpense,
  expensesLookAlike,
  mergeCloudAndLocal,
  pendingExpensesToSync,
} = sandbox.api;

/** The merge as it behaved before this fix. Kept here so the script can show the loss. */
function mergeCloudAndLocalBeforeFix(cloudRows, local) {
  const byId = new Map(cloudRows.map((e) => [e.id, e]));
  for (const item of local) {
    if (byId.has(item.id)) continue;
    if (isPendingExpense(item) && cloudRows.some((c) => expensesLookAlike(c, item))) continue;
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

const LUNCH = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const COFFEE = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const RENT = "cccccccc-dddd-4eee-8fff-000000000000";

function expense(id, amount, extra) {
  return Object.assign(
    {
      id,
      cat: "food",
      amount,
      note: "",
      date: "2026-10-05T01:00:00.000Z",
      fxRate: null,
    },
    extra || {}
  );
}

function byId(rows, id) {
  const found = rows.find((e) => e.id === id);
  assert.ok(found, "missing id " + id);
  return found;
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("  ok  " + name);
}

console.log("\nBug B1 — pending edit vs stale cloud row\n");

const cloud = [
  expense(LUNCH, 20, { note: "lunch", date: "2026-10-05T01:00:00.000Z" }),
  expense(COFFEE, 5, { note: "coffee", cat: "food" }),
];
const local = [
  expense(LUNCH, 25, { note: "lunch", _pending: true, date: "2026-10-05T01:00:00.000Z" }),
  expense(COFFEE, 5, { note: "coffee", cat: "food" }),
];

const before = mergeCloudAndLocalBeforeFix(cloud, local);
const after = mergeCloudAndLocal(cloud, local);

console.log(
  "  before fix: lunch $" +
    byId(before, LUNCH).amount +
    "  pending=" +
    !!byId(before, LUNCH)._pending +
    "  (edit lost)"
);
console.log(
  "  after fix:  lunch $" +
    byId(after, LUNCH).amount +
    "  pending=" +
    !!byId(after, LUNCH)._pending +
    "  (edit kept, still waiting to sync)"
);
console.log("");

check("old merge drops the unsynced $25 edit and keeps the cloud $20", () => {
  assert.strictEqual(byId(before, LUNCH).amount, 20);
  assert.ok(!byId(before, LUNCH)._pending);
});

check("new merge keeps the unsynced $25 edit and the pending flag", () => {
  const lunch = byId(after, LUNCH);
  assert.strictEqual(lunch.amount, 25);
  assert.strictEqual(lunch._pending, true);
  assert.strictEqual(lunch.note, "lunch");
});

check("the kept edit is still something the post-merge sync would upload", () => {
  const waiting = pendingExpensesToSync(after, false).map((e) => e.id);
  assert.deepStrictEqual(waiting, [LUNCH]);
});

check("a failed push (timeout / offline) then a cloud refresh still keeps the edit", () => {
  // refreshFromCloud only feeds pending rows into the merge.
  const pending = local.filter(isPendingExpense);
  const refreshed = mergeCloudAndLocal(cloud, pending);
  assert.strictEqual(byId(refreshed, LUNCH).amount, 25);
  assert.strictEqual(byId(refreshed, LUNCH)._pending, true);
  assert.strictEqual(byId(refreshed, COFFEE).amount, 5);
});

check("a non-pending local copy does not override newer cloud data", () => {
  const newerCloud = [
    expense(LUNCH, 30, { note: "lunch updated elsewhere" }),
    expense(RENT, 400, { note: "rent", cat: "rent", date: "2026-10-01T01:00:00.000Z" }),
  ];
  const staleLocal = [
    expense(LUNCH, 20, { note: "lunch" }),
    expense(RENT, 350, { note: "rent", cat: "rent", date: "2026-10-01T01:00:00.000Z" }),
  ];
  const merged = mergeCloudAndLocal(newerCloud, staleLocal);
  assert.strictEqual(byId(merged, LUNCH).amount, 30);
  assert.strictEqual(byId(merged, LUNCH).note, "lunch updated elsewhere");
  assert.ok(!byId(merged, LUNCH)._pending);
  assert.strictEqual(byId(merged, RENT).amount, 400);
});

check("after a successful push, the edit is no longer pending and matches the cloud", () => {
  const pushedLocal = [
    expense(LUNCH, 25, { note: "lunch" }),
    expense(COFFEE, 4, { note: "coffee" }),
  ];
  const cloudAfterPush = [
    expense(LUNCH, 25, { note: "lunch" }),
    expense(COFFEE, 6, { note: "coffee changed on another phone" }),
  ];
  const merged = mergeCloudAndLocal(cloudAfterPush, pushedLocal);
  assert.strictEqual(byId(merged, LUNCH).amount, 25);
  assert.ok(!byId(merged, LUNCH)._pending);
  assert.strictEqual(byId(merged, COFFEE).amount, 6);
  assert.strictEqual(byId(merged, COFFEE).note, "coffee changed on another phone");
  assert.deepStrictEqual(pendingExpensesToSync(merged, false), []);
});

check("a brand-new local expense is still added, and a lookalike new one is still dropped", () => {
  const fresh = expense("local_42", 12, { note: "new", _pending: true });
  const lookalike = expense("local_43", 5, { note: "coffee", cat: "food", _pending: true, date: cloud[1].date });
  const merged = mergeCloudAndLocal(cloud, [fresh, lookalike]);
  assert.ok(merged.some((e) => e.id === "local_42" && e.amount === 12));
  assert.ok(!merged.some((e) => e.id === "local_43"));
  assert.strictEqual(byId(merged, COFFEE).amount, 5);
});

check("a pending edit is kept even when it now resembles a different cloud row", () => {
  const edited = expense(LUNCH, 5, {
    note: "coffee",
    cat: "food",
    _pending: true,
    date: cloud[1].date,
  });
  const merged = mergeCloudAndLocal(cloud, [edited]);
  assert.strictEqual(byId(merged, LUNCH).amount, 5);
  assert.strictEqual(byId(merged, LUNCH)._pending, true);
  assert.strictEqual(byId(merged, COFFEE).id, COFFEE);
  assert.strictEqual(new Set(merged.map((e) => e.id)).size, merged.length);
});

check("editsOnly sync selects cloud edits and leaves brand-new rows for the later pass", () => {
  const rows = [
    expense(LUNCH, 25, { _pending: true }),
    expense("local_9", 8, { _pending: true, note: "snacks" }),
    expense(COFFEE, 5),
  ];
  assert.ok(isCloudId(LUNCH));
  assert.ok(!isCloudId("local_9"));
  const edits = pendingExpensesToSync(rows, true).map((e) => e.id);
  const all = pendingExpensesToSync(rows, false).map((e) => e.id);
  assert.deepStrictEqual(edits, [LUNCH]);
  assert.deepStrictEqual(all, [LUNCH, "local_9"]);
  assert.deepStrictEqual(
    pendingExpensesToSync(rows, false).map((e) => e.id),
    rows.filter(isPendingExpense).map((e) => e.id)
  );
});

check("category, note, and date on a pending edit all survive the merge", () => {
  const edited = expense(LUNCH, 25, {
    cat: "groceries",
    note: "team lunch",
    date: "2026-10-04T01:00:00.000Z",
    fxRate: 1.72,
    _pending: true,
  });
  const merged = mergeCloudAndLocal(cloud, [edited]);
  const lunch = byId(merged, LUNCH);
  assert.strictEqual(lunch.cat, "groceries");
  assert.strictEqual(lunch.note, "team lunch");
  assert.strictEqual(lunch.date, "2026-10-04T01:00:00.000Z");
  assert.strictEqual(lunch.fxRate, 1.72);
  assert.strictEqual(lunch.amount, 25);
});

console.log("\n" + passed + " checks passed\n");
