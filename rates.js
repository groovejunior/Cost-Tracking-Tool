"use strict";

/**
 * Monthly EUR→AUD rates for mixed-currency totals and conversion hints.
 *
 * Storage layers:
 *  1. In-memory cache while the app is open
 *  2. localStorage (`spend_fx_rates`) — offline / per device (PR #1)
 *  3. Supabase fx_rates — read-only sync from shared table (if populated)
 *  4. Frankfurter API — fetches missing months into local cache only
 *
 * Clients never write fx_rates (RLS read-only). Each expense also stores
 * fxRate at save time as a fallback when that month is not locked locally.
 */
const SpendRates = {
  STORAGE_KEY: "spend_fx_rates",
  DEFAULT_RATE: 1.65,
  SEED_RATES: { "2026-07": 1.65 },

  rates: {},
  fetchedAt: {},

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        this._seedJulyLocal();
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.rates) {
        this.rates = parsed.rates;
        this.fetchedAt = parsed.fetchedAt || {};
      } else {
        this.rates = parsed;
        this.fetchedAt = {};
      }
    } catch (e) {
      this.rates = {};
      this.fetchedAt = {};
    }
    this._seedJulyLocal();
  },

  save() {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({ rates: this.rates, fetchedAt: this.fetchedAt })
      );
    } catch (e) {}
  },

  _cloudEnabled() {
    return !!(window.SpendFxRates && window.SpendFxRates.isEnabled());
  },

  _timeout(promise, ms, label) {
    let timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(label + " timed out")), ms);
      }),
    ]).finally(() => clearTimeout(timer));
  },

  /** A month is locked only after a real persist (API, cloud, or seed). */
  _hasLockedRate(monthKey) {
    return !!(this.rates[monthKey] && this.fetchedAt[monthKey]);
  },

  _seedJulyLocal() {
    const key = "2026-07";
    if (this._hasLockedRate(key)) return;
    this.rates[key] = this.SEED_RATES[key];
    this.fetchedAt[key] = new Date().toISOString();
    this.save();
  },

  /** Pull the shared monthly table from Supabase into local cache. */
  async syncFromCloud() {
    if (!this._cloudEnabled()) return [];
    try {
      const rows = await this._timeout(window.SpendFxRates.fetchAll(), 15000, "FX sync");
      const keys = [];
      (rows || []).forEach((row) => {
        this.rates[row.month_key] = Number(row.eur_to_aud);
        this.fetchedAt[row.month_key] = row.fetched_at;
        keys.push(row.month_key);
      });
      this.save();
      return keys;
    } catch (e) {
      console.warn("[Spend] Could not sync FX rates from cloud:", e.message);
      return [];
    }
  },

  /** "YYYY-MM" from an ISO date string or Date. */
  monthKey(isoOrDate) {
    const d = new Date(isoOrDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  },

  /** AUD per 1 EUR for the month of this date (locked cache or DEFAULT_RATE). */
  rateFor(isoOrDate) {
    const key = this.monthKey(isoOrDate);
    if (this._hasLockedRate(key)) return this.rates[key];
    return this.DEFAULT_RATE;
  },

  /**
   * Best rate for one expense: locked month cache, else saved snapshot, else default.
   */
  rateForExpense(expense) {
    if (!expense) return this.DEFAULT_RATE;
    const key = this.monthKey(expense.date);
    if (this._hasLockedRate(key)) return this.rates[key];
    const snap = expense.fxRate != null ? Number(expense.fxRate) : 0;
    if (snap > 0) return snap;
    return this.DEFAULT_RATE;
  },

  audToEur(aud, rate) {
    return aud / rate;
  },

  currentMonthKey() {
    return this.monthKey(new Date());
  },

  /** Always the 1st — Frankfurter returns the last ECB day on/before that date. */
  _queryDate(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    const mm = String(m).padStart(2, "0");
    return `${y}-${mm}-01`;
  },

  async persistMonth(monthKey, rate) {
    this.rates[monthKey] = rate;
    this.fetchedAt[monthKey] = new Date().toISOString();
    this.save();
  },

  async fetchMonth(monthKey) {
    const day = this._queryDate(monthKey);
    const url = `https://api.frankfurter.dev/v1/${day}?from=EUR&to=AUD`;
    const res = await this._timeout(fetch(url), 15000, "FX fetch");
    if (!res.ok) throw new Error("Could not fetch exchange rate");
    const data = await res.json();
    const rate = data.rates && data.rates.AUD;
    if (!rate) throw new Error("No AUD rate in response");
    await this.persistMonth(monthKey, Math.round(rate * 10000) / 10000);
  },

  /**
   * Make sure we have rates for these months.
   * 1. Merge read-only fx_rates from Supabase into localStorage (if signed in)
   * 2. Seed known months locally when missing
   * 3. Fetch any still-unlocked months from Frankfurter → local cache only
   */
  async ensureMonths(monthKeys) {
    await this.syncFromCloud();
    let updated = false;

    for (const [key, rate] of Object.entries(this.SEED_RATES)) {
      if (!this._hasLockedRate(key)) {
        await this.persistMonth(key, rate);
        updated = true;
      }
    }

    const unique = [...new Set(monthKeys)];
    const need = unique.filter((key) => !this._hasLockedRate(key) && !this.SEED_RATES[key]);

    if (!need.length) return updated;

    await Promise.all(
      need.map((key) =>
        this.fetchMonth(key)
          .then(() => {
            updated = true;
          })
          .catch((e) => {
            console.warn("[Spend] Could not fetch FX rate for", key, e && e.message);
          })
      )
    );
    return updated;
  },

  async ensureForDate(isoDate) {
    return this.ensureMonths([this.monthKey(isoDate)]);
  },

  async ensureForExpenses(expenses) {
    const keys = (expenses || []).map((e) => this.monthKey(e.date));
    keys.push(this.currentMonthKey());
    return this.ensureMonths(keys);
  },

  /** Rate to store on a new/updated expense (snapshot for that month). */
  snapshotFor(isoDate) {
    const key = this.monthKey(isoDate);
    if (this._hasLockedRate(key)) return this.rates[key];
    return this.DEFAULT_RATE;
  },
};

SpendRates.load();
window.SpendRates = SpendRates;

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpendRates;
}
