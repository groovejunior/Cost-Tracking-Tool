"use strict";

/**
 * Cloud persistence for expenses (Supabase Postgres).
 * Maps between DB rows and the in-memory shape used by app.js:
 *   app:  { id, cat, amount, note, date }
 *   db:   { id, category_id, amount, note, expense_date, user_id }
 */
const SpendData = {
  isEnabled() {
    return !!window.spendSupabase && !!window.SpendAuth?.isEnabled();
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Cloud storage is not available.");
    return window.spendSupabase;
  },

  rowToExpense(row) {
    return {
      id: row.id,
      cat: row.category_id,
      amount: Number(row.amount),
      note: row.note || "",
      date: row.expense_date,
    };
  },

  _toRow(userId, expense) {
    return {
      user_id: userId,
      category_id: expense.cat,
      amount: expense.amount,
      note: expense.note || "",
      expense_date: expense.date,
    };
  },

  /** Load all expenses for the signed-in user, newest first. */
  async fetchAll(userId) {
    const { data, error } = await this._db()
      .from("expenses")
      .select("id, category_id, amount, note, expense_date")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => this.rowToExpense(row));
  },

  /** Create one expense; returns the row with its new UUID. */
  async insert(userId, payload) {
    const { data, error } = await this._db()
      .from("expenses")
      .insert(this._toRow(userId, payload))
      .select("id, category_id, amount, note, expense_date")
      .single();
    if (error) throw error;
    return this.rowToExpense(data);
  },

  /** Update an existing expense by UUID. */
  async update(id, payload) {
    const { data, error } = await this._db()
      .from("expenses")
      .update({
        category_id: payload.cat,
        amount: payload.amount,
        note: payload.note || "",
        expense_date: payload.date,
      })
      .eq("id", id)
      .select("id, category_id, amount, note, expense_date")
      .single();
    if (error) throw error;
    return this.rowToExpense(data);
  },

  /** Delete one expense by UUID. */
  async remove(id) {
    const { error } = await this._db().from("expenses").delete().eq("id", id);
    if (error) throw error;
  },

  /** Bulk insert (demo seed or migrating local data). */
  async insertMany(userId, list) {
    if (!list.length) return [];
    const { data, error } = await this._db()
      .from("expenses")
      .insert(list.map((e) => this._toRow(userId, e)))
      .select("id, category_id, amount, note, expense_date");
    if (error) throw error;
    return (data || []).map((row) => this.rowToExpense(row));
  },
};

window.SpendData = SpendData;
