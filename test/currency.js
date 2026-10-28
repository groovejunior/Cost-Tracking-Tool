"use strict";

/**
 * Unit tests for display-currency formatting and AUD storage conversions.
 *
 *   node test/currency.js
 */

const assert = require("assert");
const SpendCurrency = require("../currency.js");

const RATE = 1.6;

assert.strictEqual(SpendCurrency.normalize("eur"), "EUR");
assert.strictEqual(SpendCurrency.normalize("usd"), "AUD");
assert.strictEqual(SpendCurrency.normalize(""), "AUD");

assert.strictEqual(SpendCurrency.inputToStored(100, "AUD", RATE), 100);
assert.strictEqual(SpendCurrency.inputToStored(50, "EUR", RATE), 80);
assert.strictEqual(SpendCurrency.storedToInput(80, "EUR", RATE), "50.00");

const audMain = SpendCurrency.formatStored(160, "AUD", RATE);
assert(audMain.includes("160"), "AUD format shows stored amount");
const eurMain = SpendCurrency.formatStored(160, "EUR", RATE);
assert(eurMain.includes("100") || eurMain.includes("100,00"), "EUR format converts 160 AUD at 1.6");

const hintAud = SpendCurrency.formatHint(160, "AUD", RATE);
assert(hintAud.includes("€") || hintAud.toLowerCase().includes("eur"), "AUD mode EUR hint");
const hintEur = SpendCurrency.formatHint(160, "EUR", RATE);
assert(hintEur.includes("$") || hintEur.includes("A"), "EUR mode AUD hint");

const roundTrip = SpendCurrency.inputToStored(
  parseFloat(SpendCurrency.storedToInput(160, "EUR", RATE)),
  "EUR",
  RATE
);
assert.strictEqual(roundTrip, 160);

const hero = SpendCurrency.moneyHeroHtml(160, RATE, "AUD");
assert(hero.includes("moneyblock") && hero.includes("≈"), "hero HTML for AUD");

console.log("currency.js: all tests passed");
