"use strict";

/**
 * Cloud persistence for shared trip groups.
 * Rows are mapped into the shape SpendLedger and the Groups screen use.
 */
const SpendShared = {
  CACHE_PREFIX: "spend_shared_v1_",

  isEnabled() {
    return !!(window.spendSupabase && window.SpendAuth?.isEnabled());
  },

  _db() {
    if (!this.isEnabled()) throw new Error("Sign in to use shared groups.");
    return window.spendSupabase;
  },

  _user() {
    const user = typeof currentUser !== "undefined" ? currentUser : null;
    if (!user?.id) throw new Error("Sign in to use shared groups.");
    return user;
  },

  _cacheKey(userId) {
    return this.CACHE_PREFIX + userId;
  },

  _readCache(userId) {
    try {
      const raw = localStorage.getItem(this._cacheKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.groups)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  },

  _writeCache(userId, bundle) {
    try {
      localStorage.setItem(this._cacheKey(userId), JSON.stringify(bundle));
    } catch (e) {}
  },

  _friendly(error) {
    const msg = (error && error.message) || String(error || "Something went wrong");
    if (/schema cache|does not exist|could not find the function|shared_groups/i.test(msg)) {
      return new Error(
        "Shared groups aren't on the server yet. Run supabase/migrations/20261105120000_shared_groups.sql in the Supabase SQL editor."
      );
    }
    if (/foreign key|violates foreign key|still referenced/i.test(msg)) {
      return new Error("This person is on a shared cost, so their account stays.");
    }
    if (/duplicate key|unique/i.test(msg)) return new Error("That's already in this group.");
    if (/valid email/i.test(msg)) return new Error("Enter a valid email address.");
    if (/already taken/i.test(msg)) return new Error("That place in the group is already taken.");
    if (/not in this group|not found|Choose|Enter|transfer|share|Sign in|invite/i.test(msg)) {
      return new Error(msg.replace(/^.*ERROR:\s*/i, ""));
    }
    return new Error(msg);
  },

  _num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  },

  _member(row) {
    return {
      id: row.id,
      userId: row.user_id || null,
      displayName: row.display_name || "Someone",
      role: row.role === "owner" ? "owner" : "member",
      inviteEmail: row.invite_email || "",
    };
  },

  _expense(row) {
    const shareRows = row.shared_expense_shares || [];
    return {
      id: row.id,
      title: row.title || "",
      amount: this._num(row.amount),
      currency: window.SpendCurrency ? window.SpendCurrency.normalize(row.currency) : row.currency || "AUD",
      fxRate: row.fx_rate != null ? this._num(row.fx_rate) : null,
      paidBy: row.paid_by,
      splitMode: row.split_mode === "shares" ? "shares" : "equal",
      kind: row.kind === "transfer" ? "transfer" : "expense",
      date: row.expense_date,
      shares: shareRows.map((s) => ({
        memberId: s.member_id,
        shares: this._num(s.shares),
      })),
    };
  },

  _group(row, userId) {
    const members = (row.shared_group_members || []).map((m) => this._member(m));
    members.sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
    const expenses = (row.shared_expenses || [])
      .map((e) => this._expense(e))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)));
    const invites = (row.shared_invites || [])
      .filter((i) => i.status === "pending")
      .map((i) => ({
        id: i.id,
        memberId: i.member_id || null,
        email: i.email || "",
      }));
    return {
      id: row.id,
      name: row.name || "Group",
      currency: window.SpendCurrency ? window.SpendCurrency.normalize(row.currency) : row.currency || "AUD",
      createdBy: row.created_by,
      createdAt: row.created_at,
      members,
      expenses,
      invites,
      mine: members.some((m) => m.userId === userId),
    };
  },

  _selectGroups() {
    return [
      "id",
      "name",
      "currency",
      "created_by",
      "created_at",
      "shared_group_members(id,user_id,display_name,role,invite_email,joined_at)",
      "shared_expenses(id,title,amount,currency,fx_rate,paid_by,split_mode,kind,expense_date,shared_expense_shares(member_id,shares))",
      "shared_invites(id,member_id,email,status)",
    ].join(",");
  },

  async load() {
    const user = this._user();
    try {
      const db = this._db();
      const [groupsRes, invitesRes] = await Promise.all([
        db.from("shared_groups").select(this._selectGroups()).order("created_at", { ascending: false }),
        db
          .from("shared_invites")
          .select("id,group_id,member_id,email,status,shared_groups(name,currency)")
          .eq("status", "pending"),
      ]);
      if (groupsRes.error) throw groupsRes.error;
      if (invitesRes.error) throw invitesRes.error;

      const groups = (groupsRes.data || [])
        .map((row) => this._group(row, user.id))
        .filter((g) => g.mine);
      const memberOf = new Set(groups.map((g) => g.id));
      const invites = (invitesRes.data || [])
        .filter((row) => row.status === "pending" && !memberOf.has(row.group_id))
        .map((row) => ({
          id: row.id,
          groupId: row.group_id,
          groupName: row.shared_groups?.name || "A group",
          currency: row.shared_groups?.currency || "AUD",
          memberId: row.member_id || null,
          email: row.email || "",
        }));
      const bundle = { groups, invites, offline: false };
      this._writeCache(user.id, bundle);
      return bundle;
    } catch (error) {
      const cached = this._readCache(user.id);
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (cached && offline) return { groups: cached.groups || [], invites: cached.invites || [], offline: true };
      throw this._friendly(error);
    }
  },

  async createGroup({ name, currency, displayName }) {
    const user = this._user();
    const db = this._db();
    const { data, error } = await db
      .from("shared_groups")
      .insert({
        name: String(name || "").trim(),
        currency: window.SpendCurrency ? window.SpendCurrency.normalize(currency) : currency,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw this._friendly(error);
    const { error: memberError } = await db.from("shared_group_members").insert({
      group_id: data.id,
      user_id: user.id,
      display_name: String(displayName || "Me").trim().slice(0, 40) || "Me",
      role: "owner",
    });
    if (memberError) {
      await db.from("shared_groups").delete().eq("id", data.id);
      throw this._friendly(memberError);
    }
    return data.id;
  },

  async addPerson({ groupId, displayName, email }) {
    const user = this._user();
    const db = this._db();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const { data, error } = await db
      .from("shared_group_members")
      .insert({
        group_id: groupId,
        display_name: String(displayName || "").trim().slice(0, 40),
        role: "member",
        invite_email: cleanEmail || null,
      })
      .select("id")
      .single();
    if (error) throw this._friendly(error);
    if (cleanEmail) {
      const { error: inviteError } = await db.from("shared_invites").insert({
        group_id: groupId,
        member_id: data.id,
        email: cleanEmail,
        invited_by: user.id,
        status: "pending",
      });
      if (inviteError) throw this._friendly(inviteError);
    }
    return data.id;
  },

  async invitePerson({ groupId, memberId, email }) {
    const user = this._user();
    const db = this._db();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const { error: nameError } = await db
      .from("shared_group_members")
      .update({ invite_email: cleanEmail })
      .eq("id", memberId);
    if (nameError) throw this._friendly(nameError);
    const { error } = await db.from("shared_invites").insert({
      group_id: groupId,
      member_id: memberId,
      email: cleanEmail,
      invited_by: user.id,
      status: "pending",
    });
    if (error) throw this._friendly(error);
  },

  async acceptInvite(inviteId, displayName) {
    const { error } = await this._db().rpc("spend_accept_invite", {
      p_invite_id: inviteId,
      p_display_name: String(displayName || "").trim(),
    });
    if (error) throw this._friendly(error);
  },

  async declineInvite(inviteId) {
    const { error } = await this._db()
      .from("shared_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);
    if (error) throw this._friendly(error);
  },

  async cancelInvite(inviteId) {
    const { error } = await this._db().from("shared_invites").delete().eq("id", inviteId);
    if (error) throw this._friendly(error);
  },

  async removePerson(memberId) {
    const { error } = await this._db().from("shared_group_members").delete().eq("id", memberId);
    if (error) throw this._friendly(error);
  },

  async updateCurrency(groupId, currency) {
    const code = window.SpendCurrency ? window.SpendCurrency.normalize(currency) : currency;
    const { error } = await this._db().from("shared_groups").update({ currency: code }).eq("id", groupId);
    if (error) throw this._friendly(error);
  },

  async deleteGroup(groupId) {
    const { error } = await this._db().from("shared_groups").delete().eq("id", groupId);
    if (error) throw this._friendly(error);
  },

  _sharePayload(shares) {
    return (shares || [])
      .filter((s) => Number(s.shares) > 0 && s.memberId)
      .map((s) => ({ member_id: s.memberId, shares: Math.round(Number(s.shares) * 100) / 100 }));
  },

  async saveExpense(input) {
    const payload = {
      p_expense_id: input.id || null,
      p_group_id: input.groupId,
      p_title: String(input.title || "").trim(),
      p_amount: input.amount,
      p_currency: input.currency,
      p_fx_rate: input.fxRate,
      p_paid_by: input.paidBy,
      p_split_mode: input.splitMode === "shares" ? "shares" : "equal",
      p_expense_date: input.date,
      p_kind: input.kind === "transfer" ? "transfer" : "expense",
      p_shares: this._sharePayload(input.shares),
    };
    const { error } = await this._db().rpc("spend_write_shared_expense", payload);
    if (error) throw this._friendly(error);
  },

  async deleteExpense(expenseId) {
    const { error } = await this._db().from("shared_expenses").delete().eq("id", expenseId);
    if (error) throw this._friendly(error);
  },
};

window.SpendShared = SpendShared;
