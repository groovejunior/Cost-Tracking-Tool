"use strict";

/**
 * Unit tests for native per-expense currency storage and display totals.
 *
 *   node test/currency.js
 */

const assert = require("assert");
const SpendCurrency = require("../currency.js");

const RATE = 1.6;

assert.strictEqual(SpendCurrency.normalize("eur"), "EUR");
assert.strictEqual(SpendCurrency.expenseCurrency({}), "AUD");
assert.strictEqual(SpendCurrency.expenseCurrency({ currency: "EUR" }), "EUR");

assert.strictEqual(SpendCurrency.convert(10, "EUR", "EUR", RATE), 10);
assert.strictEqual(SpendCurrency.convert(10, "EUR", "AUD", RATE), 16);
assert.strictEqual(SpendCurrency.convert(16, "AUD", "EUR", RATE), 10);

const eurExpense = { amount: 10, currency: "EUR", date: "2026-10-01T12:00:00.000Z", fxRate: RATE };
const audExpense = { amount: 32, currency: "AUD", date: "2026-10-01T12:00:00.000Z", fxRate: RATE };

assert.strictEqual(SpendCurrency.amountInDisplay(eurExpense, "EUR", RATE), 10);
assert.strictEqual(SpendCurrency.amountInDisplay(eurExpense, "AUD", RATE), 16);
assert.strictEqual(SpendCurrency.amountInDisplay(audExpense, "AUD", RATE), 32);
assert.strictEqual(SpendCurrency.amountInDisplay(audExpense, "EUR", RATE), 20);

const mixed = [eurExpense, audExpense];
assert.strictEqual(SpendCurrency.sumInDisplay(mixed, "EUR", RATE), 30);
assert.strictEqual(SpendCurrency.sumInDisplay(mixed, "AUD", RATE), 48);

const oldRate = 1.5;
const newRate = 2;
assert.strictEqual(SpendCurrency.amountInDisplay(eurExpense, "AUD", oldRate), 15);
assert.strictEqual(SpendCurrency.amountInDisplay(eurExpense, "AUD", newRate), 20);
assert.strictEqual(eurExpense.amount, 10, "stored EUR amount unchanged when rate changes");

const stack = SpendCurrency.moneyStackExpenseHtml(eurExpense, "AUD", RATE);
assert(stack.includes("originally"), "cross-currency row shows original");
assert(stack.includes("€") || stack.includes("EUR") || stack.includes("10"), "shows original euro amount");

const same = SpendCurrency.moneyStackExpenseHtml(eurExpense, "EUR", RATE);
assert(!same.includes("originally"), "same currency row has no originally line");

assert.strictEqual(SpendCurrency.convertBudget(1000, "AUD", "EUR", RATE), 625);

console.log("currency.js: all tests passed");
