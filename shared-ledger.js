"use strict";

/**
 * Shared-group math: currency conversion, share splits, individual balances,
 * and the fewest direct transfers that settle every balance.
 *
 * Balances are integer cents in the group's currency.
 * Positive cents means the group owes that account.
 * Negative cents means that account owes the group.
 * A transfer is one payment from one account to one other account.
 */
const SpendLedger = {
  /** Split totalCents across positive integer weights. Parts sum to totalCents. */
  splitCents(totalCents, weights) {
    const total = Math.round(Number(totalCents));
    if (!Number.isInteger(total) || total < 0) {
      throw new Error("Amount must be a whole number of cents");
    }
    if (!Array.isArray(weights) || weights.length === 0) {
      throw new Error("Choose who shares this cost");
    }
    const clean = weights.map((w) => Math.round(Number(w)));
    if (clean.some((w) => !Number.isInteger(w) || w <= 0)) {
      throw new Error("Shares must be greater than zero");
    }
    const sum = clean.reduce((a, w) => a + w, 0);
    const base = clean.map((w) => Math.floor((total * w) / sum));
    let remainder = total - base.reduce((a, n) => a + n, 0);
    const order = clean
      .map((w, i) => ({ i, frac: (total * w) % sum }))
      .sort((a, b) => b.frac - a.frac || a.i - b.i);
    for (let k = 0; k < remainder; k++) base[order[k].i] += 1;
    return base;
  },

  weightFromShares(shares) {
    const n = Number(shares);
    if (!(n > 0)) return 0;
    return Math.max(0, Math.round(n * 100));
  },

  _currency() {
    if (typeof SpendCurrency !== "undefined") return SpendCurrency;
    return require("./currency.js");
  },

  /** Amount in the group's currency, in cents. */
  toGroupCents(amount, currency, groupCurrency, fxRate) {
    const fx = this._currency();
    const rate = Number(fxRate);
    const converted = fx.convert(Number(amount), currency, groupCurrency, rate > 0 ? rate : 0);
    return Math.round(converted * 100);
  },

  /**
   * Cents each listed share owes for one expense, and the payer's credit.
   * shares: [{ memberId, shares }]
   * Returns { totalCents, parts: [{ memberId, cents }] } where parts are debits.
   */
  expenseParts(expense, groupCurrency) {
    const totalCents = this.toGroupCents(
      expense.amount,
      expense.currency,
      groupCurrency,
      expense.fxRate
    );
    const rows = (expense.shares || [])
      .map((s) => ({
        memberId: s.memberId,
        weight: this.weightFromShares(s.shares),
      }))
      .filter((s) => s.weight > 0 && s.memberId);
    if (!rows.length || totalCents <= 0) {
      return { totalCents: Math.max(0, totalCents), parts: [] };
    }
    const split = this.splitCents(
      totalCents,
      rows.map((r) => r.weight)
    );
    return {
      totalCents,
      parts: rows.map((r, i) => ({ memberId: r.memberId, cents: split[i] })),
    };
  },

  /**
   * Net balance for every member, in group-currency cents.
   * Members missing from the list but present on an expense are included
   * so a removed account cannot hide money.
   */
  balances(members, expenses, groupCurrency) {
    const byId = new Map();
    (members || []).forEach((m) => {
      byId.set(m.id, { memberId: m.id, name: m.displayName || "Someone", cents: 0 });
    });
    const touch = (id) => {
      if (!id) return null;
      if (!byId.has(id)) {
        byId.set(id, { memberId: id, name: "Former member", cents: 0 });
      }
      return byId.get(id);
    };

    (expenses || []).forEach((expense) => {
      const { totalCents, parts } = this.expenseParts(expense, groupCurrency);
      if (totalCents <= 0) return;
      const payer = touch(expense.paidBy);
      if (payer) payer.cents += totalCents;
      parts.forEach((part) => {
        const row = touch(part.memberId);
        if (row) row.cents -= part.cents;
      });
    });

    return [...byId.values()];
  },

  /**
   * Fewest direct transfers that bring every balance back to zero.
   * Each result is one payment: fromName transfers cents to toName.
   * Matching the largest debt to the largest credit keeps the list minimal
   * (never more than one less than the number of people).
   */
  settle(balanceRows) {
    const creditors = [];
    const debtors = [];
    (balanceRows || []).forEach((row) => {
      const cents = Math.round(Number(row.cents) || 0);
      if (cents > 0) creditors.push({ memberId: row.memberId, name: row.name, cents });
      else if (cents < 0) debtors.push({ memberId: row.memberId, name: row.name, cents: -cents });
    });

    const bySize = (a, b) => b.cents - a.cents || String(a.memberId).localeCompare(String(b.memberId));
    const transfers = [];
    while (creditors.length && debtors.length) {
      creditors.sort(bySize);
      debtors.sort(bySize);
      const cred = creditors[0];
      const debt = debtors[0];
      const pay = Math.min(cred.cents, debt.cents);
      if (pay <= 0) break;
      transfers.push({
        fromId: debt.memberId,
        toId: cred.memberId,
        fromName: debt.name,
        toName: cred.name,
        cents: pay,
      });
      cred.cents -= pay;
      debt.cents -= pay;
      if (cred.cents === 0) creditors.shift();
      if (debt.cents === 0) debtors.shift();
    }
    return transfers;
  },
};

if (typeof window !== "undefined") window.SpendLedger = SpendLedger;
if (typeof module !== "undefined" && module.exports) module.exports = SpendLedger;
