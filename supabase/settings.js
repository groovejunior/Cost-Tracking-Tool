"use strict";

/**
 * Per-user settings (variable spending limit, etc.)
 * Maps to public.user_settings in Supabase.
 */
const SpendSettings = {
  isEnabled() {
    return !!window.spendSupabase && !!window.SpendAuth?.isEnabled();
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Cloud storage is not available.");
    return window.spendSupabase;
  },

  async fetch(userId) {
    const { data, error } = await this._db()
      .from("user_settings")
      .select("variable_budget, currency")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateBudget(userId, amount) {
    const { data, error } = await this._db()
      .from("user_settings")
      .update({ variable_budget: amount, currency: "AUD" })
      .eq("user_id", userId)
      .select("variable_budget")
      .single();
    if (error) throw error;
    return Number(data.variable_budget);
  },

  /** Create a settings row if signup trigger did not run (older accounts). */
  async ensure(userId, defaultBudget) {
    const existing = await this.fetch(userId);
    if (existing) return existing;
    const { data, error } = await this._db()
      .from("user_settings")
      .insert({ user_id: userId, variable_budget: defaultBudget, currency: "AUD" })
      .select("variable_budget, currency")
      .single();
    if (error) throw error;
    return data;
  },
};

window.SpendSettings = SpendSettings;
