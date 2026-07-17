"use strict";

/**
 * Cloud storage for the shared monthly EUR→AUD rate table.
 * One row per calendar month — the same for all users (market rates, not personal).
 */
const SpendFxRates = {
  isEnabled() {
    return !!window.spendSupabase;
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

  /** Save or update one month's rate (any signed-in user can refresh the shared cache). */
  async upsert(monthKey, eurToAud) {
    const { error } = await this._db().from("fx_rates").upsert(
      {
        month_key: monthKey,
        eur_to_aud: eurToAud,
        fetched_at: new Date().toISOString(),
        source: "frankfurter",
      },
      { onConflict: "month_key" }
    );
    if (error) throw error;
  },
};

window.SpendFxRates = SpendFxRates;
