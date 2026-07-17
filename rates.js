"use strict";

/**
 * Monthly EUR→AUD rates for the small € hints under AUD amounts.
 *
 * Storage layers (fastest → source of truth):
 *  1. In-memory cache while the app is open
 *  2. localStorage — offline / instant startup
 *  3. Supabase fx_rates table — syncs across your devices
 *  4. Frankfurter API — fills in any month nobody has fetched yet
 *
 * Past months are fetched once and kept. The current month refreshes weekly
 * or when a new calendar month starts. Each expense also stores fxRate at save time.
 */
const SpendRates = {
  STORAGE_KEY: "spend_fx_rates",
  FETCH_KEY: "spend_fx_current_fetch", /* legacy — migrated into fetchedAt */
  DEFAULT_RATE: 1.65,

  rates: {},
  fetchedAt: {},

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
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

  /** Pull the shared monthly table from Supabase into local cache. */
  async syncFromCloud() {
    if (!this._cloudEnabled()) return;
    try {
      const rows = await window.SpendFxRates.fetchAll();
      rows.forEach((row) => {
        this.rates[row.month_key] = Number(row.eur_to_aud);
        this.fetchedAt[row.month_key] = row.fetched_at;
      });
      this.save();
    } catch (e) {
      console.warn("[Spend] Could not sync FX rates from cloud:", e.message);
    }
  },

  /** "YYYY-MM" from an ISO date string or Date. */
  monthKey(isoOrDate) {
    const d = new Date(isoOrDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  },

  /** AUD per 1 EUR for the month of this date. */
  rateFor(isoOrDate) {
    const key = this.monthKey(isoOrDate);
    return this.rates[key] || this.DEFAULT_RATE;
  },

  audToEur(aud, rate) {
    return aud / rate;
  },

  currentMonthKey() {
    return this.monthKey(new Date());
  },

  _isStale(date) {
    const now = new Date();
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return true;
    return now - date > 7 * 86400000;
  },

  shouldRefreshCurrent(monthKey) {
    if (monthKey !== this.currentMonthKey()) return false;
    const last = this.fetchedAt[monthKey];
    if (last) return this._isStale(new Date(last));
    try {
      const legacy = localStorage.getItem(this.FETCH_KEY);
      if (legacy) return this._isStale(new Date(legacy));
    } catch (e) {}
    return true;
  },

  /** Pick a day Frankfurter is likely to have for that month. */
  _queryDate(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    const now = new Date();
    if (y === now.getFullYear() && m === now.getMonth() + 1) {
      const d = String(now.getDate()).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      return `${y}-${mm}-${d}`;
    }
    const mm = String(m).padStart(2, "0");
    return `${y}-${mm}-15`;
  },

  async persistMonth(monthKey, rate) {
    this.rates[monthKey] = rate;
    this.fetchedAt[monthKey] = new Date().toISOString();
    this.save();
    if (this._cloudEnabled()) {
      try {
        await window.SpendFxRates.upsert(monthKey, rate);
      } catch (e) {
        console.warn("[Spend] Could not save FX rate to cloud:", e.message);
      }
    }
  },

  async fetchMonth(monthKey) {
    const day = this._queryDate(monthKey);
    const url = `https://api.frankfurter.app/${day}?from=EUR&to=AUD`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch exchange rate");
    const data = await res.json();
    const rate = data.rates && data.rates.AUD;
    if (!rate) throw new Error("No AUD rate in response");
    await this.persistMonth(monthKey, Math.round(rate * 10000) / 10000);
  },

  /**
   * Make sure we have rates for these months.
   * 1. Sync from Supabase (another device may already have them)
   * 2. Fetch any still-missing months from Frankfurter → save local + cloud
   */
  async ensureMonths(monthKeys) {
    await this.syncFromCloud();

    const unique = [...new Set(monthKeys)];
    const current = this.currentMonthKey();
    const need = [];

    unique.forEach((key) => {
      if (!this.rates[key]) need.push(key);
      else if (key === current && this.shouldRefreshCurrent(key)) need.push(key);
    });

    if (!need.length) return false;

    await Promise.all(
      need.map((key) =>
        this.fetchMonth(key).catch(() => {
          if (!this.rates[key]) this.rates[key] = this.DEFAULT_RATE;
        })
      )
    );
    this.save();
    return true;
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
    return this.rateFor(isoDate);
  },
};

SpendRates.load();
window.SpendRates = SpendRates;
