"use strict";

/**
 * Cloud persistence for expenses (Supabase Postgres).
 * Maps between DB rows and the in-memory shape used by app.js:
 *   app:  { id, cat, amount, note, date, fxRate? }
 *   db:   { id, category_id, amount, note, expense_date, fx_rate, user_id }
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
      fxRate: row.fx_rate != null ? Number(row.fx_rate) : null,
    };
  },

  _toRow(userId, expense) {
    const row = {
      user_id: userId,
      category_id: expense.cat,
      amount: expense.amount,
      note: expense.note || "",
      expense_date: expense.date,
    };
    if (expense.fxRate != null) row.fx_rate = expense.fxRate;
    return row;
  },

  /** Load all expenses for the signed-in user, newest first (paginated past PostgREST max). */
  async fetchAll(userId) {
    const pageSize = 1000;
    const select =
      "id, category_id, amount, note, expense_date, fx_rate";
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await this._db()
        .from("expenses")
        .select(select)
        .eq("user_id", userId)
        .order("expense_date", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const chunk = data || [];
      rows.push(...chunk);
      if (chunk.length < pageSize) break;
    }
    return rows.map((row) => this.rowToExpense(row));
  },

  /** Create one expense; returns the row with its new UUID. */
  async insert(userId, payload) {
    const { data, error } = await this._db()
      .from("expenses")
      .insert(this._toRow(userId, payload))
      .select("id, category_id, amount, note, expense_date, fx_rate")
      .single();
    if (error) throw error;
    return this.rowToExpense(data);
  },

  /** Insert or update by id (idempotent retries for client-generated UUIDs). */
  async upsert(userId, id, payload) {
    const row = Object.assign({ id }, this._toRow(userId, payload));
    const { data, error } = await this._db()
      .from("expenses")
      .upsert(row, { onConflict: "id" })
      .select("id, category_id, amount, note, expense_date, fx_rate")
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
        fx_rate: payload.fxRate ?? null,
      })
      .eq("id", id)
      .select("id, category_id, amount, note, expense_date, fx_rate")
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
      .select("id, category_id, amount, note, expense_date, fx_rate");
    if (error) throw error;
    return (data || []).map((row) => this.rowToExpense(row));
  },
};

window.SpendData = SpendData;
