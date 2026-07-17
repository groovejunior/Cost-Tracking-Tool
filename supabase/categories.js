"use strict";

/**
 * Per-user expense categories (name, color, icon, fixed vs variable).
 * Maps to public.categories in Supabase.
 */
const SpendCategories = {
  isEnabled() {
    return !!window.spendSupabase && !!window.SpendAuth?.isEnabled();
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Cloud storage is not available.");
    return window.spendSupabase;
  },

  rowToCat(row) {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      fixed: !!row.fixed,
    };
  },

  _toRow(userId, cat, sortOrder) {
    return {
      user_id: userId,
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      fixed: !!cat.fixed,
      sort_order: sortOrder,
    };
  },

  async fetchAll(userId) {
    const { data, error } = await this._db()
      .from("categories")
      .select("id, name, color, icon, fixed, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => this.rowToCat(row));
  },

  /** Replace the user's full category list (expenses reference ids as plain text). */
  async saveAll(userId, list) {
    const { error: delErr } = await this._db().from("categories").delete().eq("user_id", userId);
    if (delErr) throw delErr;
    if (!list.length) return;
    const rows = list.map((cat, i) => this._toRow(userId, cat, i));
    const { error } = await this._db().from("categories").insert(rows);
    if (error) throw error;
  },
};

window.SpendCategories = SpendCategories;
