"use strict";

/**
 * FX rate resolution when a month is not in local cache (offline / API down).
 *
 *   node test/fx-rates.js
 */

const assert = require("assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const storage = {};
const ctx = {
  localStorage: {
    getItem(k) {
      return storage[k] ?? null;
    },
    setItem(k, v) {
      storage[k] = String(v);
    },
  },
  window: null,
  SpendFxRates: {
    isEnabled: () => false,
    upsert() {
      throw new Error("client must not write fx_rates");
    },
  },
  fetch() {
    return Promise.reject(new Error("offline"));
  },
  setTimeout,
  clearTimeout,
  Promise,
  Date,
  Intl,
};
ctx.window = ctx;
vm.createContext(ctx);

const src = fs.readFileSync(path.join(__dirname, "..", "rates.js"), "utf8");
vm.runInContext(src, ctx);
const SpendRates = ctx.SpendRates;

assert.strictEqual(SpendRates.rateFor("2026-10-15"), SpendRates.DEFAULT_RATE, "unlocked month uses default");

const withSnap = { date: "2026-10-15T12:00:00.000Z", fxRate: 1.72 };
assert.strictEqual(SpendRates.rateForExpense(withSnap), 1.72, "uses expense snapshot when month unlocked");

SpendRates.rates["2026-09"] = 1.55;
SpendRates.fetchedAt["2026-09"] = new Date().toISOString();
assert.strictEqual(
  SpendRates.rateForExpense({ date: "2026-09-10T12:00:00.000Z", fxRate: 1.72 }),
  1.55,
  "locked month cache wins over snapshot"
);

let upsertCalls = 0;
ctx.SpendFxRates.isEnabled = () => true;
ctx.SpendFxRates.upsert = () => {
  upsertCalls++;
  return Promise.resolve();
};

(async () => {
  await SpendRates.persistMonth("2026-11", 1.61);
  assert.strictEqual(upsertCalls, 0, "persistMonth does not call cloud upsert");
  console.log("fx-rates.js: all tests passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
