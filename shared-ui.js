"use strict";

/**
 * Groups screen: create a shared trip, invite people, log who paid,
 * and show the fewest transfers that settle every individual balance.
 */
const SpendSharedUI = {
  state: {
    view: "list",
    tab: "expenses",
    loading: false,
    offline: false,
    error: "",
    groups: [],
    invites: [],
    groupId: null,
    draft: null,
    busy: false,
  },

  _wired: false,

  show() {
    this.state.view = "list";
    this.state.tab = "expenses";
    this.state.groupId = null;
    this.state.draft = null;
    this.state.error = "";
    this._wire();
    this._render();
    void this._reload();
  },

  _wire() {
    if (this._wired) return;
    const root = document.getElementById("screen-shared");
    if (!root) return;
    this._wired = true;
    root.addEventListener("click", (e) => {
      void this._onClick(e);
    });
    root.addEventListener("input", (e) => {
      if (e.target && (e.target.id === "sharedAmount" || e.target.id === "sharedNameInput" || e.target.classList.contains("sh-share-input"))) {
        this._paintPreview();
      }
    });
    root.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.state.busy) return;
      const form = e.target;
      if (!form || !form.id) return;
      if (form.id === "sharedCreateForm") void this._createGroup();
      if (form.id === "sharedAddPerson") void this._addPerson();
      if (form.id === "sharedExpenseForm") void this._saveExpense();
    });
    document.getElementById("sharedBack")?.addEventListener("click", () => this._back());
  },

  async _reload() {
    const seq = (this._seq = (this._seq || 0) + 1);
    if (!window.SpendShared?.isEnabled() || !(typeof currentUser !== "undefined" && currentUser)) {
      this.state.loading = false;
      this.state.groups = [];
      this.state.invites = [];
      this._render();
      return;
    }
    this.state.loading = true;
    this.state.error = "";
    if (!this.state.groups.length && this.state.view === "list") this._render();
    try {
      const bundle = await window.SpendShared.load();
      if (seq !== this._seq) return;
      this.state.groups = bundle.groups || [];
      this.state.invites = bundle.invites || [];
      this.state.offline = !!bundle.offline;
      if (this.state.groupId && !this._group()) {
        this.state.view = "list";
        this.state.groupId = null;
      }
    } catch (err) {
      if (seq !== this._seq) return;
      this.state.error = err.message || "Could not load groups.";
    } finally {
      if (seq === this._seq) {
        this.state.loading = false;
        if (this.state.view !== "create" && this.state.view !== "expense") this._render();
      }
    }
  },

  _group() {
    return this.state.groups.find((g) => g.id === this.state.groupId) || null;
  },

  _meId() {
    return typeof currentUser !== "undefined" && currentUser ? currentUser.id : null;
  },

  _myName() {
    if (typeof accountDisplayLabel === "function") {
      const name = accountDisplayLabel();
      if (name) return name.slice(0, 40);
    }
    return "Me";
  },

  _esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  _money(cents, currency) {
    const amount = Math.abs(Number(cents) || 0) / 100;
    return window.SpendCurrency.format(amount, currency);
  },

  _signed(cents, currency) {
    const abs = this._money(cents, currency);
    if (cents > 0) return "+" + abs;
    if (cents < 0) return "−" + abs;
    return this._money(0, currency);
  },

  _memberName(group, id) {
    return group.members.find((m) => m.id === id)?.displayName || "Someone";
  },

  _balances(group) {
    return window.SpendLedger.balances(group.members, group.expenses, group.currency);
  },

  _myCents(group) {
    const me = group.members.find((m) => m.userId && m.userId === this._meId());
    if (!me) return null;
    const row = this._balances(group).find((b) => b.memberId === me.id);
    return row ? row.cents : 0;
  },

  _back() {
    if (this.state.view === "expense" || this.state.view === "people") {
      this.state.view = "detail";
      this.state.draft = null;
      this._render();
      return;
    }
    this.state.view = "list";
    this.state.groupId = null;
    this.state.draft = null;
    this._render();
  },

  _syncChrome() {
    const title = document.getElementById("sharedTitle");
    const back = document.getElementById("sharedBack");
    const bar = document.getElementById("sharedTopbar");
    if (!title || !back || !bar) return;
    const group = this._group();
    const titles = {
      list: "Groups",
      create: "New group",
      detail: group ? group.name : "Group",
      expense: this.state.draft?.id ? "Edit cost" : "Shared cost",
      people: "People",
    };
    title.textContent = titles[this.state.view] || "Groups";
    const showBack = this.state.view !== "list";
    back.hidden = !showBack;
    bar.classList.toggle("has-back", showBack);
    if (typeof paintIcons === "function") paintIcons(bar);
  },

  _render() {
    this._syncChrome();
    const el = document.getElementById("sharedScroll");
    if (!el) return;
    const top = el.scrollTop;
    el.innerHTML = this._html();
    if (typeof paintIcons === "function") paintIcons(el);
    if (top) el.scrollTop = top;
  },

  _html() {
    if (!window.SpendShared?.isEnabled() || !this._meId()) {
      return `<div class="empty"><p>Sign in to start a shared group and split a trip with friends.</p></div>`;
    }
    if (this.state.view === "create") return this._createHtml();
    if (this.state.view === "people") return this._peopleHtml();
    if (this.state.view === "expense") return this._expenseHtml();
    if (this.state.view === "detail") return this._detailHtml();
    return this._listHtml();
  },

  _listHtml() {
    const bits = [];
    if (this.state.offline) {
      bits.push(`<p class="sh-note">You're offline. This is the last saved copy of your groups.</p>`);
    }
    if (this.state.error) bits.push(`<p class="sh-error">${this._esc(this.state.error)}</p>`);
    if (this.state.loading && !this.state.groups.length && !this.state.invites.length) {
      bits.push(`<div class="empty">Loading groups…</div>`);
      return bits.join("");
    }
    this.state.invites.forEach((inv) => {
      bits.push(`
        <article class="sh-card sh-invite">
          <div class="sh-kicker">Invitation</div>
          <h2 class="sh-card-title">${this._esc(inv.groupName)}</h2>
          <p class="sh-note">Join this group to see your balance and shared costs.</p>
          <div class="sh-row-actions">
            <button type="button" class="savebtn sh-btn" data-shared-accept="${this._esc(inv.id)}">Join</button>
            <button type="button" class="auth-ghost-btn" data-shared-decline="${this._esc(inv.id)}">Decline</button>
          </div>
        </article>`);
    });
    if (!this.state.groups.length && !this.state.invites.length) {
      bits.push(`
        <div class="sh-hero">
          <span class="icon" data-ico="users"></span>
          <h2>Split a trip</h2>
          <p>Create a group, add the people going, and log each shared cost against the account that paid.</p>
        </div>`);
    }
    this.state.groups.forEach((group) => {
      const cents = this._myCents(group);
      const bal =
        cents == null
          ? ""
          : `<span class="sh-bal-fig ${cents < 0 ? "is-neg" : cents > 0 ? "is-pos" : ""}">${this._esc(this._signed(cents, group.currency))}</span>`;
      const hint = cents == null ? "" : cents > 0 ? "You are owed" : cents < 0 ? "You owe" : "You are settled";
      bits.push(`
        <button type="button" class="sh-group" data-shared-open="${this._esc(group.id)}">
          <span class="sh-group-copy">
            <span class="sh-group-name">${this._esc(group.name)}</span>
            <span class="sh-group-meta">${group.members.length} ${group.members.length === 1 ? "person" : "people"} · ${this._esc(group.currency)}${hint ? " · " + hint : ""}</span>
          </span>
          ${bal}
          <span class="icon sh-chev" data-ico="chevronRight"></span>
        </button>`);
    });
    bits.push(`<button type="button" class="addbtn" data-shared-create>New group</button>`);
    return bits.join("");
  },

  _createHtml() {
    const currency = this.state.createCurrency || (typeof displayCurrency !== "undefined" && displayCurrency) || "AUD";
    return `
      <form id="sharedCreateForm" class="sh-form">
        <div class="field">
          <label class="fl" for="sharedGroupName">Group name</label>
          <input class="noteinput" id="sharedGroupName" maxlength="60" placeholder="e.g. Lisbon trip" autocomplete="off" required>
        </div>
        <div class="field">
          <div class="fl">Settlement currency</div>
          <p class="sh-note">Balances and transfers use this currency. Each cost can still be entered in AUD or EUR.</p>
          <div class="currency-seg" role="group" aria-label="Settlement currency">
            <button type="button" class="currency-opt ${currency === "AUD" ? "active" : ""}" data-shared-create-currency="AUD">AUD</button>
            <button type="button" class="currency-opt ${currency === "EUR" ? "active" : ""}" data-shared-create-currency="EUR">EUR</button>
          </div>
        </div>
        <button type="submit" class="savebtn" id="sharedCreateBtn">Create group</button>
      </form>`;
  },

  _detailHtml() {
    const group = this._group();
    if (!group) return `<div class="empty">That group is no longer available.</div>`;
    const tab = this.state.tab;
    const tabs = ["expenses", "balances", "settle"]
      .map((id) => {
        const label = id === "expenses" ? "Costs" : id === "balances" ? "Balances" : "Settle";
        return `<button type="button" class="sh-tab ${tab === id ? "on" : ""}" data-shared-tab="${id}" role="tab" aria-selected="${tab === id}">${label}</button>`;
      })
      .join("");
    let body = "";
    if (tab === "balances") body = this._balancesHtml(group);
    else if (tab === "settle") body = this._settleHtml(group);
    else body = this._expensesHtml(group);
    return `
      <button type="button" class="sh-people-link" data-shared-people>
        <span class="icon" data-ico="users"></span>
        <span>${group.members.length} ${group.members.length === 1 ? "account" : "accounts"}</span>
        <span class="sh-people-names">${this._esc(group.members.map((m) => m.displayName).join(", "))}</span>
        <span class="icon sh-chev" data-ico="chevronRight"></span>
      </button>
      <div class="sh-tabs" role="tablist">${tabs}</div>
      ${body}`;
  },

  _expensesHtml(group) {
    const costs = group.expenses.filter((e) => e.kind !== "transfer");
    const transfers = group.expenses.filter((e) => e.kind === "transfer");
    const rows = costs.length
      ? costs.map((e) => this._expenseRow(group, e)).join("")
      : `<div class="empty empty--section">No shared costs yet.</div>`;
    const transferBlock = transfers.length
      ? `<div class="sectlabel">Transfers</div><div class="listcard">${transfers.map((e) => this._expenseRow(group, e)).join("")}</div>`
      : "";
    const needsPeople = group.members.length < 2;
    return `
      ${needsPeople ? `<p class="sh-note">Add the other people on the trip before logging a shared cost.</p>` : ""}
      <button type="button" class="addbtn" data-shared-add-cost ${needsPeople ? "disabled" : ""}>Add shared cost</button>
      <div class="listcard">${rows}</div>
      ${transferBlock}`;
  },

  _expenseRow(group, expense) {
    const payer = this._memberName(group, expense.paidBy);
    const when = this._formatDay(expense.date);
    const mode = expense.kind === "transfer" ? "Transfer" : expense.splitMode === "shares" ? "By shares" : this._equalLabel(group, expense);
    const original = window.SpendCurrency.format(expense.amount, expense.currency);
    let extra = "";
    if (expense.currency !== group.currency) {
      const cents = window.SpendLedger.toGroupCents(expense.amount, expense.currency, group.currency, expense.fxRate);
      extra = `<div class="money-eur tabular">${this._esc(this._money(cents, group.currency))} in ${this._esc(group.currency)}</div>`;
    }
    return `
      <button type="button" class="sh-cost" data-shared-edit="${this._esc(expense.id)}">
        <span class="sh-cost-copy">
          <span class="sh-cost-title">${this._esc(expense.title)}</span>
          <span class="sh-cost-meta">${this._esc(payer)} paid · ${mode}${when ? " · " + this._esc(when) : ""}</span>
        </span>
        <span class="sh-cost-amt tabular">${this._esc(original)}${extra}</span>
      </button>`;
  },

  _balancesHtml(group) {
    const rows = this._balances(group);
    const body = rows
      .map((row) => {
        const member = group.members.find((m) => m.id === row.memberId);
        const label = row.cents > 0 ? "Is owed" : row.cents < 0 ? "Owes" : "Settled";
        const cls = row.cents > 0 ? "is-pos" : row.cents < 0 ? "is-neg" : "";
        return `
          <div class="sh-account" data-shared-balance="${this._esc(row.memberId)}">
            <span class="sh-avatar" aria-hidden="true">${this._esc(this._initial(row.name))}</span>
            <span class="sh-account-copy">
              <span class="sh-account-name">${this._esc(row.name)}</span>
              <span class="sh-account-sub">${label}${member?.userId ? "" : " · not joined yet"}</span>
            </span>
            <span class="sh-account-amt tabular ${cls}">${this._esc(this._signed(row.cents, group.currency))}</span>
          </div>`;
      })
      .join("");
    return `
      <p class="sh-note">Each person has their own account. A positive balance means the group owes them. A negative balance means they owe the group.</p>
      <div class="sh-card sh-accounts">${body}</div>`;
  },

  _settleHtml(group) {
    const rows = this._balances(group);
    const transfers = window.SpendLedger.settle(rows);
    if (!transfers.length) {
      return `
        <div class="sh-hero">
          <span class="icon" data-ico="check"></span>
          <h2>All settled</h2>
          <p>Nobody needs to transfer anything.</p>
        </div>`;
    }
    const lead =
      transfers.length === 1
        ? "One transfer settles the group."
        : "These are the fewest transfers that settle everyone. Each line is one payment from one person to another.";
    const cards = transfers
      .map((t) => {
        const amount = this._money(t.cents, group.currency);
        return `
          <article class="sh-card sh-transfer" data-shared-transfer>
            <p class="sh-transfer-line"><strong>${this._esc(t.fromName)}</strong> transfers <strong class="tabular">${this._esc(amount)}</strong> to <strong>${this._esc(t.toName)}</strong>.</p>
            <button type="button" class="savebtn sh-btn" data-shared-record
              data-from="${this._esc(t.fromId)}" data-to="${this._esc(t.toId)}" data-cents="${t.cents}">Record transfer</button>
          </article>`;
      })
      .join("");
    return `<p class="sh-lead">${lead}</p>${cards}`;
  },

  _peopleHtml() {
    const group = this._group();
    if (!group) return `<div class="empty">That group is no longer available.</div>`;
    const mine = group.members.find((m) => m.userId && m.userId === this._meId());
    const isOwner = mine?.role === "owner" || group.createdBy === this._meId();
    const people = group.members
      .map((m) => {
        const pending = group.invites.find((i) => i.memberId === m.id);
        let action = "";
        if (m.role === "owner") {
          action = `<span class="sh-pill">Owner</span>`;
        } else if (m.userId) {
          action = `<span class="sh-pill">Joined</span>`;
        } else if (pending) {
          action = `<button type="button" class="sh-textbtn" data-shared-cancel-invite="${this._esc(pending.id)}">Cancel ${this._esc(pending.email)}</button>`;
        } else {
          action = `
            <form class="sh-invite-form">
              <input class="noteinput" type="email" data-invite-for="${this._esc(m.id)}" placeholder="Email to invite" autocomplete="off">
              <button type="button" class="sh-textbtn" data-shared-invite="${this._esc(m.id)}">Invite</button>
            </form>`;
        }
        const remove =
          m.role === "owner"
            ? ""
            : `<button type="button" class="sh-textbtn sh-danger" data-shared-remove="${this._esc(m.id)}">Remove</button>`;
        return `
          <div class="sh-person">
            <span class="sh-avatar" aria-hidden="true">${this._esc(this._initial(m.displayName))}</span>
            <span class="sh-person-copy">
              <span class="sh-account-name">${this._esc(m.displayName)}</span>
              ${action}
            </span>
            ${remove}
          </div>`;
      })
      .join("");
    const currency = isOwner
      ? `
        <div class="sh-card">
          <div class="lbl">Settlement currency</div>
          <p class="sh-note">Costs stay in the currency they were entered in. Balances convert into this one.</p>
          <div class="currency-seg" role="group" aria-label="Settlement currency">
            <button type="button" class="currency-opt ${group.currency === "AUD" ? "active" : ""}" data-shared-group-currency="AUD">AUD</button>
            <button type="button" class="currency-opt ${group.currency === "EUR" ? "active" : ""}" data-shared-group-currency="EUR">EUR</button>
          </div>
        </div>`
      : "";
    const destroy = isOwner
      ? `<button type="button" class="catdelbtn" data-shared-delete-group>Delete group</button>`
      : "";
    return `
      <form id="sharedAddPerson" class="sh-card">
        <div class="lbl">Add someone</div>
        <p class="sh-note">They get their own account immediately. Add an email if they should join on their phone.</p>
        <div class="field">
          <label class="fl" for="sharedPersonName">Name</label>
          <input class="noteinput" id="sharedPersonName" maxlength="40" placeholder="Their name" autocomplete="off">
        </div>
        <div class="field">
          <label class="fl" for="sharedPersonEmail">Email, optional</label>
          <input class="noteinput" id="sharedPersonEmail" type="email" placeholder="name@email.com" autocomplete="off">
        </div>
        <button type="submit" class="savebtn sh-btn">Add to group</button>
      </form>
      <div class="sh-card sh-people">${people}</div>
      ${currency}
      ${destroy}`;
  },

  _expenseHtml() {
    const group = this._group();
    const draft = this.state.draft;
    if (!group || !draft) return `<div class="empty">Choose a group first.</div>`;
    const payers = group.members
      .map((m) => {
        const on = m.id === draft.paidBy;
        return `<button type="button" class="sh-choice ${on ? "on" : ""}" data-shared-payer="${this._esc(m.id)}" aria-pressed="${on}">${this._esc(m.displayName)}</button>`;
      })
      .join("");
    const parts = this._partMap(group, draft);
    const shareRows =
      draft.splitMode === "shares"
        ? `<div class="sh-shares">${group.members
            .map((m) => {
              const value = draft.shares[m.id] ?? 0;
              return `
                <div class="sh-share">
                  <span>${this._esc(m.displayName)}</span>
                  <span class="sh-stepper">
                    <button type="button" data-shared-share="${this._esc(m.id)}" data-delta="-1" aria-label="Fewer shares for ${this._esc(m.displayName)}">−</button>
                    <input class="sh-share-input tabular" data-share-input="${this._esc(m.id)}" inputmode="decimal" value="${this._esc(value)}" aria-label="Shares for ${this._esc(m.displayName)}">
                    <button type="button" data-shared-share="${this._esc(m.id)}" data-delta="1" aria-label="More shares for ${this._esc(m.displayName)}">+</button>
                  </span>
                </div>`;
            })
            .join("")}</div>`
        : `
          <p class="sh-note">Tick who this cost is split between.${draft.currency !== group.currency ? ` Amounts are in ${this._esc(group.currency)}.` : ""}</p>
          <div class="sh-split-list" role="group" aria-label="Who shares this cost">${group.members
            .map((m) => {
              const on = draft.included[m.id] !== false;
              const amt = on ? this._money(parts.get(m.id) || 0, group.currency) : "";
              return `
                <button type="button" class="sh-split-row ${on ? "on" : ""}" data-shared-include="${this._esc(m.id)}" aria-pressed="${on}">
                  <span class="sh-tick" aria-hidden="true">${on ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>` : ""}</span>
                  <span class="sh-split-name">${this._esc(m.displayName)}</span>
                  <span class="sh-split-amt tabular" data-shared-share-amt="${this._esc(m.id)}">${this._esc(amt)}</span>
                </button>`;
            })
            .join("")}</div>`;
    const remove = draft.id
      ? `<button type="button" class="catdelbtn" data-shared-delete-expense="${this._esc(draft.id)}">Delete cost</button>`
      : "";
    return `
      <form id="sharedExpenseForm" class="sh-form">
        <div class="field">
          <label class="fl" for="sharedNameInput">What was it</label>
          <input class="noteinput" id="sharedNameInput" maxlength="80" placeholder="e.g. Dinner" value="${this._esc(draft.title)}" autocomplete="off">
        </div>
        <div class="field">
          <label class="fl" for="sharedAmount">Amount</label>
          <div class="sh-amount">
            <input class="noteinput tabular" id="sharedAmount" inputmode="decimal" placeholder="0.00" value="${this._esc(draft.amount)}" autocomplete="off">
            <div class="currency-seg sh-amount-cur" role="group" aria-label="Cost currency">
              <button type="button" class="currency-opt ${draft.currency === "AUD" ? "active" : ""}" data-shared-cost-currency="AUD">AUD</button>
              <button type="button" class="currency-opt ${draft.currency === "EUR" ? "active" : ""}" data-shared-cost-currency="EUR">EUR</button>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="fl" for="sharedDay">Date</label>
          <input class="noteinput" id="sharedDay" type="date" value="${this._esc(draft.day)}">
        </div>
        <div class="field">
          <div class="fl">Charged to</div>
          <p class="sh-note">The individual account that paid. Their balance goes up by the full amount.</p>
          <div class="sh-choices">${payers}</div>
        </div>
        <div class="field">
          <div class="fl">Split</div>
          <div class="sh-tabs" role="group" aria-label="How to split">
            <button type="button" class="sh-tab ${draft.splitMode === "equal" ? "on" : ""}" data-shared-split="equal">Equally</button>
            <button type="button" class="sh-tab ${draft.splitMode === "shares" ? "on" : ""}" data-shared-split="shares">By shares</button>
          </div>
          ${shareRows}
        </div>
        <div class="sh-card" id="sharedPreview">${this._previewHtml(group, draft)}</div>
        <button type="submit" class="savebtn" id="sharedSaveExpense">${draft.id ? "Save changes" : "Add cost"}</button>
        ${remove}
      </form>`;
  },

  _draftFromForm() {
    const draft = this.state.draft;
    if (!draft) return null;
    const title = document.getElementById("sharedNameInput");
    const amount = document.getElementById("sharedAmount");
    const day = document.getElementById("sharedDay");
    if (title) draft.title = title.value;
    if (amount) draft.amount = amount.value;
    if (day && day.value) draft.day = day.value;
    document.querySelectorAll("[data-share-input]").forEach((input) => {
      const id = input.getAttribute("data-share-input");
      const n = typeof parseAmount === "function" ? parseAmount(input.value) : Number(String(input.value).replace(",", "."));
      draft.shares[id] = n > 0 ? Math.round(n * 100) / 100 : 0;
    });
    return draft;
  },

  _equalLabel(group, expense) {
    const n = (expense.shares || []).filter((s) => Number(s.shares) > 0).length;
    if (n > 0 && n < group.members.length) return `Equally · ${n} ${n === 1 ? "person" : "people"}`;
    return "Equally";
  },

  _shareList(group, draft) {
    if (draft.splitMode === "equal") {
      return group.members
        .filter((m) => draft.included?.[m.id] !== false)
        .map((m) => ({ memberId: m.id, shares: 1 }));
    }
    return group.members
      .map((m) => ({ memberId: m.id, shares: Number(draft.shares[m.id] || 0) }))
      .filter((s) => s.shares > 0);
  },

  _partMap(group, draft) {
    const map = new Map();
    const amount = typeof parseAmount === "function" ? parseAmount(draft.amount) : Number(draft.amount);
    if (!(amount > 0)) return map;
    const shares = this._shareList(group, draft);
    if (!shares.length) return map;
    try {
      const parts = window.SpendLedger.expenseParts(
        {
          amount,
          currency: draft.currency,
          fxRate: window.SpendRates.snapshotFor(typeof stampFor === "function" ? stampFor(draft.day) : new Date().toISOString()),
          paidBy: draft.paidBy,
          shares,
        },
        group.currency
      );
      parts.parts.forEach((part) => map.set(part.memberId, part.cents));
    } catch {
      return map;
    }
    return map;
  },

  _previewHtml(group, draft) {
    const amount = typeof parseAmount === "function" ? parseAmount(draft.amount) : Number(draft.amount);
    if (!(amount > 0)) return `<p class="sh-note">Enter an amount to see each person's share.</p>`;
    const shares = this._shareList(group, draft);
    if (!shares.length) return `<p class="sh-note">${draft.splitMode === "equal" ? "Tick at least one person." : "Give at least one person a share."}</p>`;
    const partMap = this._partMap(group, draft);
    if (!partMap.size) return `<p class="sh-note">Check the shares.</p>`;
    const payer = this._memberName(group, draft.paidBy);
    const charged = `${this._esc(payer)}'s account is charged ${this._esc(window.SpendCurrency.format(amount, draft.currency))}.`;
    if (draft.splitMode === "equal") {
      return `
        <div class="lbl">Charged</div>
        <p class="sh-note">${charged}</p>`;
    }
    const lines = shares
      .filter((share) => partMap.has(share.memberId))
      .map((share) => ({ memberId: share.memberId, cents: partMap.get(share.memberId) }))
      .map((part) => {
        const name = this._memberName(group, part.memberId);
        return `<div class="sh-preview-line"><span>${this._esc(name)}</span><span class="tabular">${this._esc(this._money(part.cents, group.currency))}</span></div>`;
      })
      .join("");
    return `
      <div class="lbl">Preview</div>
      <p class="sh-note">${charged}</p>
      ${lines}`;
  },

  _paintPreview() {
    const group = this._group();
    const draft = this._draftFromForm();
    const el = document.getElementById("sharedPreview");
    if (!group || !draft || !el) return;
    el.innerHTML = this._previewHtml(group, draft);
    const parts = this._partMap(group, draft);
    document.querySelectorAll("[data-shared-share-amt]").forEach((node) => {
      const id = node.getAttribute("data-shared-share-amt");
      if (draft.included?.[id] === false) {
        node.textContent = "";
        return;
      }
      node.textContent = this._money(parts.get(id) || 0, group.currency);
    });
  },

  _formatDay(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  },

  _initial(name) {
    const ch = String(name || "?").trim().charAt(0).toUpperCase();
    return ch || "?";
  },

  _toast(message) {
    if (typeof showToast === "function") showToast(message);
  },

  async _onClick(e) {
    const el = e.target.closest("[data-shared-open], [data-shared-create], [data-shared-save-group], [data-shared-tab], [data-shared-people], [data-shared-add-cost], [data-shared-edit], [data-shared-payer], [data-shared-split], [data-shared-include], [data-shared-share], [data-shared-cost-currency], [data-shared-create-currency], [data-shared-save-expense], [data-shared-delete-expense], [data-shared-save-person], [data-shared-invite], [data-shared-remove], [data-shared-accept], [data-shared-decline], [data-shared-cancel-invite], [data-shared-record], [data-shared-group-currency], [data-shared-delete-group]");
    if (!el || this.state.busy) return;
    if (el.hasAttribute("data-shared-open")) {
      this.state.groupId = el.getAttribute("data-shared-open");
      this.state.view = "detail";
      this.state.tab = "expenses";
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-create")) {
      this.state.view = "create";
      this.state.createCurrency = (typeof displayCurrency !== "undefined" && displayCurrency) || "AUD";
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-create-currency")) {
      this.state.createCurrency = el.getAttribute("data-shared-create-currency");
      const name = document.getElementById("sharedGroupName")?.value || "";
      this._render();
      const input = document.getElementById("sharedGroupName");
      if (input) {
        input.value = name;
        input.focus();
      }
      return;
    }
    if (el.hasAttribute("data-shared-tab")) {
      this.state.tab = el.getAttribute("data-shared-tab");
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-people")) {
      this.state.view = "people";
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-add-cost")) {
      if (el.disabled) return;
      this._openExpense(null);
      return;
    }
    if (el.hasAttribute("data-shared-edit")) {
      this._openExpense(el.getAttribute("data-shared-edit"));
      return;
    }
    if (el.hasAttribute("data-shared-payer")) {
      this._draftFromForm();
      this.state.draft.paidBy = el.getAttribute("data-shared-payer");
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-split")) {
      this._draftFromForm();
      const next = el.getAttribute("data-shared-split");
      const draft = this.state.draft;
      const members = this._group()?.members || [];
      if (next === "shares" && draft.splitMode !== "shares") {
        members.forEach((m) => {
          const current = Number(draft.shares[m.id]) || 0;
          draft.shares[m.id] = draft.included?.[m.id] === false ? 0 : current > 0 ? current : 1;
        });
      }
      if (next === "equal" && draft.splitMode !== "equal") {
        members.forEach((m) => {
          draft.included[m.id] = Number(draft.shares[m.id]) > 0;
        });
        if (!members.some((m) => draft.included[m.id])) {
          members.forEach((m) => {
            draft.included[m.id] = true;
          });
        }
      }
      draft.splitMode = next;
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-include")) {
      this._draftFromForm();
      const id = el.getAttribute("data-shared-include");
      const draft = this.state.draft;
      const members = this._group()?.members || [];
      const turningOff = draft.included?.[id] !== false;
      if (turningOff && members.filter((m) => m.id !== id && draft.included?.[m.id] !== false).length === 0) {
        this._toast("Tick at least one person.");
        return;
      }
      draft.included[id] = !turningOff;
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-share")) {
      this._draftFromForm();
      const id = el.getAttribute("data-shared-share");
      const delta = Number(el.getAttribute("data-delta")) || 0;
      const next = Math.round(((Number(this.state.draft.shares[id]) || 0) + delta) * 100) / 100;
      this.state.draft.shares[id] = next > 0 ? next : 0;
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-cost-currency")) {
      this._draftFromForm();
      this.state.draft.currency = el.getAttribute("data-shared-cost-currency");
      this._render();
      return;
    }
    if (el.hasAttribute("data-shared-delete-expense")) {
      await this._deleteExpense(el.getAttribute("data-shared-delete-expense"));
      return;
    }
    if (el.hasAttribute("data-shared-invite")) {
      await this._invite(el.getAttribute("data-shared-invite"));
      return;
    }
    if (el.hasAttribute("data-shared-remove")) {
      await this._remove(el.getAttribute("data-shared-remove"));
      return;
    }
    if (el.hasAttribute("data-shared-accept")) {
      await this._answerInvite(el.getAttribute("data-shared-accept"), true);
      return;
    }
    if (el.hasAttribute("data-shared-decline")) {
      await this._answerInvite(el.getAttribute("data-shared-decline"), false);
      return;
    }
    if (el.hasAttribute("data-shared-cancel-invite")) {
      await this._cancelInvite(el.getAttribute("data-shared-cancel-invite"));
      return;
    }
    if (el.hasAttribute("data-shared-record")) {
      await this._recordTransfer(el);
      return;
    }
    if (el.hasAttribute("data-shared-group-currency")) {
      await this._setCurrency(el.getAttribute("data-shared-group-currency"));
      return;
    }
    if (el.hasAttribute("data-shared-delete-group")) {
      await this._deleteGroup();
    }
  },

  _openExpense(id) {
    const group = this._group();
    if (!group) return;
    const existing = id ? group.expenses.find((item) => item.id === id) : null;
    if (existing?.kind === "transfer") {
      void this._deleteExpense(existing.id);
      return;
    }
    const shares = {};
    const included = {};
    const saved = new Map((existing?.shares || []).map((s) => [s.memberId, Number(s.shares) || 0]));
    group.members.forEach((m) => {
      if (!existing) {
        shares[m.id] = 1;
        included[m.id] = true;
      } else if (existing.splitMode === "shares") {
        shares[m.id] = saved.get(m.id) || 0;
        included[m.id] = (saved.get(m.id) || 0) > 0;
      } else {
        shares[m.id] = 1;
        included[m.id] = saved.has(m.id) && saved.get(m.id) > 0;
      }
    });
    const me = group.members.find((m) => m.userId && m.userId === this._meId());
    this.state.draft = {
      id: existing?.id || null,
      title: existing?.title || "",
      amount: existing ? String(existing.amount) : "",
      currency: existing?.currency || group.currency,
      paidBy: existing?.paidBy || me?.id || group.members[0]?.id,
      splitMode: existing?.splitMode || "equal",
      shares,
      included,
      day: existing ? this._dayValue(existing.date) : typeof todayStr === "function" ? todayStr() : "",
    };
    this.state.view = "expense";
    this._render();
  },

  _dayValue(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return typeof todayStr === "function" ? todayStr() : "";
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  },

  async _createGroup() {
    const name = (document.getElementById("sharedGroupName")?.value || "").trim();
    if (!name) {
      this._toast("Name the group.");
      return;
    }
    const currency = this.state.createCurrency || "AUD";
    this.state.busy = true;
    try {
      const id = await window.SpendShared.createGroup({
        name,
        currency,
        displayName: this._myName(),
      });
      await this._reload();
      this.state.groupId = id;
      this.state.view = "people";
      this.state.tab = "expenses";
      this._render();
      this._toast("Group created. Add the people on the trip.");
    } catch (err) {
      this._toast(err.message || "Could not create the group.");
    } finally {
      this.state.busy = false;
    }
  },

  async _saveExpense() {
    const group = this._group();
    const draft = this._draftFromForm();
    if (!group || !draft) return;
    const title = draft.title.trim();
    const amount = typeof parseAmount === "function" ? parseAmount(draft.amount) : Number(draft.amount);
    const shares = this._shareList(group, draft);
    if (!title) {
      this._toast("Name this cost.");
      return;
    }
    if (!(amount > 0)) {
      this._toast("Enter an amount.");
      return;
    }
    if (!draft.paidBy) {
      this._toast("Choose which account is charged.");
      return;
    }
    if (!shares.length) {
      this._toast("Choose who shares this cost.");
      return;
    }
    const date = typeof stampFor === "function" ? stampFor(draft.day) : new Date().toISOString();
    this.state.busy = true;
    try {
      await window.SpendShared.saveExpense({
        id: draft.id,
        groupId: group.id,
        title,
        amount: Math.round(amount * 100) / 100,
        currency: draft.currency,
        fxRate: window.SpendRates.snapshotFor(date),
        paidBy: draft.paidBy,
        splitMode: draft.splitMode,
        kind: "expense",
        date,
        shares,
      });
      this.state.view = "detail";
      this.state.tab = "expenses";
      this.state.draft = null;
      await this._reload();
      this._toast(draft.id ? "Cost updated." : "Cost added.");
    } catch (err) {
      this._toast(err.message || "Could not save this cost.");
    } finally {
      this.state.busy = false;
    }
  },

  async _deleteExpense(id) {
    const group = this._group();
    const expense = group?.expenses.find((item) => item.id === id);
    if (!expense) return;
    const ok = await askConfirm({
      title: expense.kind === "transfer" ? "Remove transfer?" : "Delete cost?",
      body: expense.kind === "transfer" ? "Balances will include this payment again." : "It will come out of everyone's balances.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    this.state.busy = true;
    try {
      await window.SpendShared.deleteExpense(id);
      this.state.view = "detail";
      this.state.draft = null;
      await this._reload();
      this._toast(expense.kind === "transfer" ? "Transfer removed." : "Cost deleted.");
    } catch (err) {
      this._toast(err.message || "Could not delete that.");
    } finally {
      this.state.busy = false;
    }
  },

  async _addPerson() {
    const group = this._group();
    if (!group) return;
    const name = (document.getElementById("sharedPersonName")?.value || "").trim();
    const email = (document.getElementById("sharedPersonEmail")?.value || "").trim();
    if (!name) {
      this._toast("Enter their name.");
      return;
    }
    this.state.busy = true;
    try {
      await window.SpendShared.addPerson({ groupId: group.id, displayName: name, email });
      await this._reload();
      this.state.view = "people";
      this._toast(email ? `${name} added and invited.` : `${name} added.`);
    } catch (err) {
      this._toast(err.message || "Could not add them.");
    } finally {
      this.state.busy = false;
    }
  },

  async _invite(memberId) {
    const group = this._group();
    if (!group) return;
    const input = document.querySelector(`[data-invite-for="${CSS.escape(memberId)}"]`);
    const email = (input?.value || "").trim();
    if (!email) {
      this._toast("Enter an email to invite.");
      return;
    }
    this.state.busy = true;
    try {
      await window.SpendShared.invitePerson({ groupId: group.id, memberId, email });
      await this._reload();
      this.state.view = "people";
      this._toast("Invite saved.");
    } catch (err) {
      this._toast(err.message || "Could not send the invite.");
    } finally {
      this.state.busy = false;
    }
  },

  async _remove(memberId) {
    const group = this._group();
    const member = group?.members.find((m) => m.id === memberId);
    if (!member) return;
    const ok = await askConfirm({
      title: `Remove ${member.displayName}?`,
      body: "Their account is removed only if they are not on a cost yet.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    this.state.busy = true;
    try {
      await window.SpendShared.removePerson(memberId);
      await this._reload();
      this.state.view = "people";
      this._toast(`${member.displayName} removed.`);
    } catch (err) {
      this._toast(err.message || "Could not remove them.");
    } finally {
      this.state.busy = false;
    }
  },

  async _answerInvite(inviteId, accept) {
    this.state.busy = true;
    try {
      if (accept) await window.SpendShared.acceptInvite(inviteId, this._myName());
      else await window.SpendShared.declineInvite(inviteId);
      this.state.view = "list";
      await this._reload();
      this._toast(accept ? "You joined the group." : "Invite declined.");
    } catch (err) {
      this._toast(err.message || "Could not update the invite.");
    } finally {
      this.state.busy = false;
    }
  },

  async _cancelInvite(inviteId) {
    this.state.busy = true;
    try {
      await window.SpendShared.cancelInvite(inviteId);
      await this._reload();
      this.state.view = "people";
      this._toast("Invite cancelled.");
    } catch (err) {
      this._toast(err.message || "Could not cancel the invite.");
    } finally {
      this.state.busy = false;
    }
  },

  async _recordTransfer(el) {
    const group = this._group();
    if (!group) return;
    const fromId = el.getAttribute("data-from");
    const toId = el.getAttribute("data-to");
    const cents = Number(el.getAttribute("data-cents"));
    const fromName = this._memberName(group, fromId);
    const toName = this._memberName(group, toId);
    const amount = Math.round(cents) / 100;
    const ok = await askConfirm({
      title: "Record this transfer?",
      body: `${fromName} paid ${this._money(cents, group.currency)} to ${toName}. Their balances update, and this payment drops off the list if nothing else is owed.`,
      confirmLabel: "Record",
      danger: false,
    });
    if (!ok) return;
    const date = new Date().toISOString();
    this.state.busy = true;
    try {
      await window.SpendShared.saveExpense({
        groupId: group.id,
        title: `Transfer to ${toName}`.slice(0, 80),
        amount,
        currency: group.currency,
        fxRate: window.SpendRates.snapshotFor(date),
        paidBy: fromId,
        splitMode: "shares",
        kind: "transfer",
        date,
        shares: [{ memberId: toId, shares: 1 }],
      });
      this.state.view = "detail";
      this.state.tab = "settle";
      await this._reload();
      this._toast("Transfer recorded.");
    } catch (err) {
      this._toast(err.message || "Could not record the transfer.");
    } finally {
      this.state.busy = false;
    }
  },

  async _setCurrency(currency) {
    const group = this._group();
    if (!group || group.currency === currency) return;
    const ok = await askConfirm({
      title: `Show balances in ${currency}?`,
      body: "Each cost keeps the currency it was entered in. Balances and transfers convert at the rate saved with the cost.",
      confirmLabel: `Use ${currency}`,
      danger: false,
    });
    if (!ok) return;
    this.state.busy = true;
    try {
      await window.SpendShared.updateCurrency(group.id, currency);
      await this._reload();
      this.state.view = "people";
      this._toast(`Balances now use ${currency}.`);
    } catch (err) {
      this._toast(err.message || "Could not change the currency.");
    } finally {
      this.state.busy = false;
    }
  },

  async _deleteGroup() {
    const group = this._group();
    if (!group) return;
    const ok = await askConfirm({
      title: `Delete ${group.name}?`,
      body: "Costs, balances, and invites in this group are removed for everyone.",
      confirmLabel: "Delete group",
      danger: true,
    });
    if (!ok) return;
    this.state.busy = true;
    try {
      await window.SpendShared.deleteGroup(group.id);
      this.state.groupId = null;
      this.state.view = "list";
      await this._reload();
      this._toast("Group deleted.");
    } catch (err) {
      this._toast(err.message || "Could not delete the group.");
    } finally {
      this.state.busy = false;
    }
  },
};

window.SpendSharedUI = SpendSharedUI;
