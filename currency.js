"use strict";

/**
 * Display currency helpers. Expense amounts and budgets are always stored in AUD;
 * this module formats and converts for the user's AUD/EUR display preference.
 */
const SpendCurrency = {
  SUPPORTED: ["AUD", "EUR"],
  DEFAULT: "AUD",

  normalize(code) {
    const c = String(code || "").toUpperCase();
    return this.SUPPORTED.includes(c) ? c : this.DEFAULT;
  },

  audFmt: new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }),
  eurFmt: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }),
  eurHintFmt: new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  audHintFmt: new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),

  roundMoney(n) {
    return Math.round(n * 100) / 100;
  },

  audToEur(aud, rate) {
    if (!(rate > 0)) return aud;
    return aud / rate;
  },

  eurToAud(eur, rate) {
    if (!(rate > 0)) return eur;
    return eur * rate;
  },

  /** Format a stored AUD amount for the user's display currency. */
  formatStored(aud, displayCurrency, rate) {
    const cur = this.normalize(displayCurrency);
    if (cur === "EUR") {
      return this.eurFmt.format(this.roundMoney(this.audToEur(aud, rate)));
    }
    return this.audFmt.format(this.roundMoney(aud));
  },

  /** Secondary hint under the main amount (opposite currency). */
  formatHint(aud, displayCurrency, rate) {
    const cur = this.normalize(displayCurrency);
    if (cur === "EUR") {
      return this.audHintFmt.format(this.roundMoney(aud));
    }
    const eur = this.audToEur(aud, rate);
    return this.eurHintFmt.format(Math.ceil(eur * 10) / 10);
  },

  currencyLabel(displayCurrency) {
    return this.normalize(displayCurrency);
  },

  amountAriaLabel(displayCurrency) {
    return this.normalize(displayCurrency) === "EUR"
      ? "Amount in euros"
      : "Amount in Australian dollars";
  },

  budgetAriaLabel(displayCurrency) {
    return this.normalize(displayCurrency) === "EUR"
      ? "Variable spending limit in euros"
      : "Variable spending limit in Australian dollars";
  },

  /** User typed amount in display currency → AUD for storage. */
  inputToStored(displayAmount, displayCurrency, rate) {
    const n = Number(displayAmount);
    if (!(n > 0)) return 0;
    if (this.normalize(displayCurrency) === "EUR") {
      return this.roundMoney(this.eurToAud(n, rate));
    }
    return this.roundMoney(n);
  },

  /** Stored AUD → value for amount/budget inputs in display currency. */
  storedToInput(storedAud, displayCurrency, rate) {
    const aud = Number(storedAud);
    if (!(aud > 0)) return "";
    if (this.normalize(displayCurrency) === "EUR") {
      return this.roundMoney(this.audToEur(aud, rate)).toFixed(2);
    }
    return this.roundMoney(aud).toFixed(2);
  },

  moneyHeroHtml(aud, rate, displayCurrency) {
    const main = this.formatStored(aud, displayCurrency, rate);
    const hint = this.formatHint(aud, displayCurrency, rate);
    const prefix = this.normalize(displayCurrency) === "AUD" ? "≈ " : "";
    return `<div class="moneyblock hero-money"><div class="money-main tabular">${main}</div><div class="money-eur tabular">${prefix}${hint}</div></div>`;
  },

  moneyStackHtml(aud, rate, displayCurrency) {
    const main = this.formatStored(aud, displayCurrency, rate);
    const hint = this.formatHint(aud, displayCurrency, rate);
    return `<div class="moneyblock"><div class="money-main tabular">${main}</div><div class="money-eur tabular">${hint}</div></div>`;
  },
};

if (typeof window !== "undefined") {
  window.SpendCurrency = SpendCurrency;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpendCurrency;
}
