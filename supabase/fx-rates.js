"use strict";

/**
 * Read-only access to the shared fx_rates table (populated via dashboard / service role).
 * Clients merge these rows into localStorage; they never upsert.
 */
const SpendFxRates = {
  isEnabled() {
    return !!window.spendSupabase && !!window.SpendAuth?.isEnabled();
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Cloud storage is not available.");
    return window.spendSupabase;
  },

  /** Load every stored month (typically a small table). */
  async fetchAll() {
    const { data, error } = await this._db()
      .from("fx_rates")
      .select("month_key, eur_to_aud, fetched_at")
      .order("month_key", { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

window.SpendFxRates = SpendFxRates;
