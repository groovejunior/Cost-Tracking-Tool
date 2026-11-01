"use strict";

/**
 * Cloud persistence for expenses (Supabase Postgres).
 * Maps between DB rows and the in-memory shape used by app.js:
 *   app:  { id, cat, amount, note, date, fxRate?, currency? }
 *   db:   { id, category_id, amount, note, expense_date, fx_rate, currency, user_id }
 */
const SpendData = {
  isEnabled() {
    return !!window.spendSupabase && !!window.SpendAuth?.isEnabled();
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Cloud storage is not available.");
    return window.spendSupabase;
  },

  _normalizeCurrency(row) {
    if (window.SpendCurrency) return window.SpendCurrency.normalize(row.currency);
    const c = String(row.currency || "AUD").toUpperCase();
    return c === "EUR" ? "EUR" : "AUD";
  },

  rowToExpense(row) {
    return {
      id: row.id,
      cat: row.category_id,
      amount: Number(row.amount),
      note: row.note || "",
      date: row.expense_date,
      fxRate: row.fx_rate != null ? Number(row.fx_rate) : null,
      currency: this._normalizeCurrency(row),
    };
  },

  _toRow(userId, expense, includeCurrency) {
    const row = {
      user_id: userId,
      category_id: expense.cat,
      amount: expense.amount,
      note: expense.note || "",
      expense_date: expense.date,
    };
    if (expense.fxRate != null) row.fx_rate = expense.fxRate;
    if (includeCurrency !== false) {
      row.currency = window.SpendCurrency
        ? window.SpendCurrency.expenseCurrency(expense)
        : expense.currency === "EUR"
          ? "EUR"
          : "AUD";
    }
    return row;
  },

  _missingCurrencyColumn(error) {
    const msg = (error && error.message) || String(error || "");
    return /currency/i.test(msg) && /(column|schema cache|does not exist)/i.test(msg);
  },

  /** Load all expenses for the signed-in user, newest first (paginated past PostgREST max). */
  async fetchAll(userId) {
    const pageSize = 1000;
    const selectFull = "id, category_id, amount, note, expense_date, fx_rate, currency";
    const selectLegacy = "id, category_id, amount, note, expense_date, fx_rate";
    let select = selectFull;
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      let data;
      let error;
      ({ data, error } = await this._db()
        .from("expenses")
        .select(select)
        .eq("user_id", userId)
        .order("expense_date", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1));
      if (error && select === selectFull && this._missingCurrencyColumn(error)) {
        select = selectLegacy;
        from = 0;
        rows.length = 0;
        continue;
      }
      if (error) throw error;
      const chunk = data || [];
      rows.push(...chunk);
      if (chunk.length < pageSize) break;
    }
    return rows.map((row) => this.rowToExpense(row));
  },

  async _writeRow(method, userId, id, payload) {
    const tryWrite = async (includeCurrency) => {
      if (method === "insert") {
        const { data, error } = await this._db()
          .from("expenses")
          .insert(this._toRow(userId, payload, includeCurrency))
          .select("id, category_id, amount, note, expense_date, fx_rate, currency")
          .single();
        if (error) throw error;
        return this.rowToExpense(data);
      }
      if (method === "upsert") {
        const row = Object.assign({ id }, this._toRow(userId, payload, includeCurrency));
        const { data, error } = await this._db()
          .from("expenses")
          .upsert(row, { onConflict: "id" })
          .select("id, category_id, amount, note, expense_date, fx_rate, currency")
          .single();
        if (error) throw error;
        return this.rowToExpense(data);
      }
      const patch = {
        category_id: payload.cat,
        amount: payload.amount,
        note: payload.note || "",
        expense_date: payload.date,
        fx_rate: payload.fxRate ?? null,
      };
      if (includeCurrency !== false) {
        patch.currency = window.SpendCurrency
          ? window.SpendCurrency.expenseCurrency(payload)
          : payload.currency === "EUR"
            ? "EUR"
            : "AUD";
      }
      const { data, error } = await this._db()
        .from("expenses")
        .update(patch)
        .eq("id", id)
        .select("id, category_id, amount, note, expense_date, fx_rate, currency")
        .single();
      if (error) throw error;
      return this.rowToExpense(data);
    };

    try {
      return await tryWrite(true);
    } catch (e) {
      if (!this._missingCurrencyColumn(e)) throw e;
      return tryWrite(false);
    }
  },

  async insert(userId, payload) {
    return this._writeRow("insert", userId, null, payload);
  },

  async upsert(userId, id, payload) {
    return this._writeRow("upsert", userId, id, payload);
  },

  async update(id, payload) {
    return this._writeRow("update", null, id, payload);
  },

  async remove(id) {
    const { error } = await this._db().from("expenses").delete().eq("id", id);
    if (error) throw error;
  },

  async insertMany(userId, list) {
    if (!list.length) return [];
    const build = (includeCurrency) =>
      list.map((e) => this._toRow(userId, e, includeCurrency));
    let data;
    let error;
    ({ data, error } = await this._db()
      .from("expenses")
      .insert(build(true))
      .select("id, category_id, amount, note, expense_date, fx_rate, currency"));
    if (error && this._missingCurrencyColumn(error)) {
      ({ data, error } = await this._db()
        .from("expenses")
        .insert(build(false))
        .select("id, category_id, amount, note, expense_date, fx_rate"));
    }
    if (error) throw error;
    return (data || []).map((row) => this.rowToExpense(row));
  },
};

window.SpendData = SpendData;
