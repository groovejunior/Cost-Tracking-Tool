"use strict";

/**
 * Per-user expense categories (variable / fixed / one-off).
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
      oneOff: !!row.one_off,
    };
  },

  _toRow(userId, cat, sortOrder) {
    return {
      user_id: userId,
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      fixed: !!cat.fixed && !cat.oneOff,
      one_off: !!cat.oneOff,
      sort_order: sortOrder,
    };
  },

  async fetchAll(userId) {
    const db = this._db();
    let { data, error } = await db
      .from("categories")
      .select("id, name, color, icon, fixed, one_off, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    if (error && /one_off/i.test(error.message || "")) {
      ({ data, error } = await db
        .from("categories")
        .select("id, name, color, icon, fixed, sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }));
    }
    if (error) throw error;
    return (data || []).map((row) => this.rowToCat(row));
  },

  /** Replace the user's full category list (expenses reference ids as plain text). */
  async saveAll(userId, list) {
    const db = this._db();
    const { error: delErr } = await db.from("categories").delete().eq("user_id", userId);
    if (delErr) throw delErr;
    if (!list.length) return;
    const rows = list.map((cat, i) => this._toRow(userId, cat, i));
    let { error } = await db.from("categories").insert(rows);
    if (error && /one_off/i.test(error.message || "")) {
      const legacy = rows.map(({ one_off, ...rest }) => rest);
      ({ error } = await db.from("categories").insert(legacy));
    }
    if (error) throw error;
  },
};

window.SpendCategories = SpendCategories;
