"use strict";

/**
 * Sync + merge checks for per-expense currency.
 *
 *   node test/currency-sync.js
 */

const assert = require("assert");
const { bootApp, FakeServer, settle } = require("./harness");

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "u@example.com" };

async function testOfflineEurSyncsWithCurrency() {
  const server = new FakeServer();
  const storage = new Map();
  const app = await bootApp({ server, storage, user: USER });
  await settle();

  app.run("displayCurrency = 'EUR'");
  await app.addExpense({ cat: "groceries", amount: 10, note: "bread" });
  await settle(30);

  const local = app.expenses[0];
  assert.strictEqual(local.currency, "EUR");
  assert.strictEqual(local.amount, 10);

  app.setOnline(true);
  await settle(40);

  const cloud = server.forUser(USER.id);
  assert.strictEqual(cloud.length, 1);
  assert.strictEqual(cloud[0].currency, "EUR");
  assert.strictEqual(Number(cloud[0].amount), 10);
  console.log("  ok  offline EUR add syncs currency to cloud");
}

async function testLegacyRowDefaultsAud() {
  const server = new FakeServer();
  const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  server.seed(USER.id, [
    {
      id,
      cat: "groceries",
      amount: 5,
      note: "",
      date: new Date().toISOString(),
      fxRate: 1.6,
    },
  ]);
  const app = await bootApp({ server, storage: new Map(), user: USER });
  await settle(30);
  const row = app.expenses.find((e) => e.id === id);
  assert.ok(row);
  assert.strictEqual(row.currency, "AUD");
  console.log("  ok  cloud row without currency loads as AUD");
}

async function testPendingEditKeepsCurrency() {
  const id = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
  const app = await bootApp({ server: new FakeServer(), storage: new Map(), user: USER });
  const out = app.run(`
    mergeCloudAndLocal(
      [{ id: "${id}", cat: "food", amount: 12, currency: "EUR", note: "lunch", date: "2026-10-05T01:00:00.000Z", fxRate: 1.6 }],
      [{ id: "${id}", cat: "food", amount: 15, currency: "EUR", note: "lunch", date: "2026-10-05T01:00:00.000Z", fxRate: 1.6, _pending: true }],
      new Set(["${id}"])
    )
  `);
  assert.strictEqual(out.find((e) => e.id === id).amount, 15);
  assert.strictEqual(out.find((e) => e.id === id).currency, "EUR");
  console.log("  ok  pending edit keeps EUR currency on merge");
}

(async () => {
  console.log("\nCurrency sync tests\n");
  await testOfflineEurSyncsWithCurrency();
  await testLegacyRowDefaultsAud();
  await testPendingEditKeepsCurrency();
  console.log("");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
