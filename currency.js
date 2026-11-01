"use strict";

/**
 * Multi-currency helpers. Each expense amount is stored in expense.currency.
 * user_settings.currency is the user's display currency and the currency of variable_budget.
 * EUR→AUD rate (aud per 1 EUR) comes from SpendRates / fx_rate on the expense.
 */
const SpendCurrency = {
  SUPPORTED: ["AUD", "EUR"],
  DEFAULT: "AUD",

  normalize(code) {
    const c = String(code || "").toUpperCase();
    return this.SUPPORTED.includes(c) ? c : this.DEFAULT;
  },

  expenseCurrency(expense) {
    return this.normalize(expense && expense.currency);
  },

  audFmt: new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }),
  eurFmt: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }),

  roundMoney(n) {
    return Math.round(n * 100) / 100;
  },

  format(amount, currency) {
    const n = this.roundMoney(Number(amount));
    return this.normalize(currency) === "EUR" ? this.eurFmt.format(n) : this.audFmt.format(n);
  },

  /** Convert amount between currencies using EUR→AUD rate (AUD per 1 EUR). */
  convert(amount, fromCurrency, toCurrency, eurToAud) {
    const from = this.normalize(fromCurrency);
    const to = this.normalize(toCurrency);
    const n = Number(amount);
    if (!(n >= 0) || from === to) return this.roundMoney(n);
    const rate = eurToAud > 0 ? eurToAud : 1.65;
    if (from === "EUR" && to === "AUD") return this.roundMoney(n * rate);
    if (from === "AUD" && to === "EUR") return this.roundMoney(n / rate);
    return this.roundMoney(n);
  },

  amountInDisplay(expense, displayCurrency, eurToAud) {
    return this.convert(expense.amount, this.expenseCurrency(expense), displayCurrency, eurToAud);
  },

  sumInDisplay(expenses, displayCurrency, rateForExpense) {
    let sum = 0;
    for (const e of expenses || []) {
      const rate = typeof rateForExpense === "function" ? rateForExpense(e) : rateForExpense;
      sum += this.amountInDisplay(e, displayCurrency, rate);
    }
    return this.roundMoney(sum);
  },

  convertBudget(amount, fromCurrency, toCurrency, eurToAud) {
    return this.convert(amount, fromCurrency, toCurrency, eurToAud);
  },

  currencyLabel(displayCurrency) {
    return this.normalize(displayCurrency);
  },

  amountAriaLabel(currency) {
    return this.normalize(currency) === "EUR" ? "Amount in euros" : "Amount in Australian dollars";
  },

  budgetAriaLabel(currency) {
    return this.normalize(currency) === "EUR"
      ? "Variable spending limit in euros"
      : "Variable spending limit in Australian dollars";
  },

  /** HTML for one amount line in display currency. */
  moneyMainHtml(amount, displayCurrency) {
    return `<div class="money-main tabular">${this.format(amount, displayCurrency)}</div>`;
  },

  /** Hero / category total (single currency, no cross-line). */
  moneyHeroHtml(total, displayCurrency) {
    return `<div class="moneyblock hero-money">${this.moneyMainHtml(total, displayCurrency)}</div>`;
  },

  /** Expense row: display-currency amount; if stored currency differs, show original below. */
  moneyStackExpenseHtml(expense, displayCurrency, eurToAud) {
    const origCur = this.expenseCurrency(expense);
    const dispCur = this.normalize(displayCurrency);
    if (origCur === dispCur) {
      return `<div class="moneyblock">${this.moneyMainHtml(expense.amount, origCur)}</div>`;
    }
    const displayAmt = this.amountInDisplay(expense, dispCur, eurToAud);
    const origLabel = this.format(expense.amount, origCur);
    return `<div class="moneyblock">${this.moneyMainHtml(displayAmt, dispCur)}<div class="money-eur tabular">${origLabel} originally</div></div>`;
  },

  moneyStackTotalHtml(total, displayCurrency) {
    return `<div class="moneyblock">${this.moneyMainHtml(total, displayCurrency)}</div>`;
  },
};

if (typeof window !== "undefined") {
  window.SpendCurrency = SpendCurrency;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpendCurrency;
}
