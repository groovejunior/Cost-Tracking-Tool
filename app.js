"use strict";

/* ---------- icons (inline SVG, offline-safe) ---------- */
const P = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;
const ICONS = {
  home: P('<path d="M3 11.2 12 4l9 7.2"/><path d="M5 10v10h14V10"/>'),
  cart: P('<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6"/>'),
  food: P('<path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11"/><path d="M16 3c-1.5 0-2.5 2-2.5 4.5S15 12 16 12v9"/>'),
  bus: P('<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/><path d="M7 16v2M17 16v2"/>'),
  plane: P('<path d="M10.5 2.5c.8-.8 2-.8 2.6 0 .5.7.4 1.6-.2 2.2L11 6.6l1.6 6.4 2-2a1.4 1.4 0 0 1 2 2l-2.6 2.6.6 3.2-1.6 1-2-3.6-2 3.6-1.6-1 .6-3.2L5.4 15a1.4 1.4 0 0 1-2-2l2-2L7 12.6l-1.9-6.4-1.9 1.1c-.6.4-1.4.2-1.7-.4"/>'),
  glass: P('<path d="M5 4h14l-6 7v6"/><path d="M9 20h6"/>'),
  refresh: P('<path d="M4 12a8 8 0 0 1 13.7-5.6L21 9"/><path d="M21 4v5h-5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L3 15"/><path d="M3 20v-5h5"/>'),
  bucket: P('<path d="M4 7h16l-1.4 12.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8L4 7Z"/><path d="M3 7h18"/><path d="M9 4h6"/>'),
  list: P('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'),
  chart: P('<path d="M4 20V10M10 20V4M16 20v-6M4 20h16"/>'),
  dots: P('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  trash: P('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>'),
  edit: P('<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/>'),
  calendar: P('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>'),
  settings: P('<path d="M9 4h6l.6 2.5 2.2 1.3 2.4-.8 3 5.2-1.8 1.7v2.6l1.8 1.7-3 5.2-2.4-.8-2.2 1.3L15 22H9l-.6-2.6-2.2-1.3-2.4.8-3-5.2 1.8-1.7v-2.6L.8 8.5l3-5.2 2.4.8L8.4 2.8" transform="scale(.8) translate(3 3)"/><circle cx="12" cy="12" r="3"/>'),
  filter: P('<path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/>'),
  lock: P('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  chevron: P('<path d="M6 9l6 6 6-6"/>'),
  chevronLeft: P('<path d="M15 6l-6 6 6 6"/>'),
  chevronRight: P('<path d="M9 6l6 6-6 6"/>'),
};
function paintIcons(root) {
  (root || document).querySelectorAll("[data-ico]").forEach((e) => {
    if (!e.dataset.done) {
      e.innerHTML = ICONS[e.dataset.ico] || "";
      e.classList.add("icon");
      e.dataset.done = "1";
    }
  });
}

/* ---------- data ---------- */
const CATS = [
  { id: "rent", name: "Rent", color: "#5B51C6", icon: "home", fixed: true },
  { id: "groceries", name: "Groceries", color: "#5E9022", icon: "cart", fixed: false },
  { id: "eating", name: "Eating out", color: "#D2582E", icon: "food", fixed: false },
  { id: "transport", name: "Transport", color: "#2F82D6", icon: "bus", fixed: false },
  { id: "trips", name: "Trips", color: "#1B9670", icon: "plane", fixed: false },
  { id: "nightlife", name: "Nightlife", color: "#CB4E77", icon: "glass", fixed: false },
  { id: "subs", name: "Subscriptions", color: "#B06E14", icon: "refresh", fixed: true },
  { id: "household", name: "Household", color: "#726D64", icon: "bucket", fixed: false },
];
const catById = (id) => CATS.find((c) => c.id === id);
const VARIABLE_BUDGET = 600;

let uid = 1;
const nid = () => "e" + uid++;
function d(day, h) {
  const n = new Date();
  const dd = Math.max(1, Math.min(day, n.getDate()));
  return new Date(n.getFullYear(), n.getMonth(), dd, h || 12, 0).toISOString();
}

const _span = Math.max(1, Math.min(new Date().getDate(), 24));
const _varSeed = [
  ["eating", 4.8, "Coffee"],
  ["household", 8.4, "Detergent"],
  ["nightlife", 16.0, "Club"],
  ["trips", 42.0, "Weekend trip"],
  ["transport", 7.8, "Train"],
  ["groceries", 31.2, "Lidl run"],
  ["eating", 14.9, "Burger"],
  ["nightlife", 22.0, "Bar"],
  ["transport", 9.0, "Metro card"],
  ["groceries", 23.8, "Albert Heijn"],
  ["eating", 12.5, "Ramen"],
];
let expenses = [
  { id: nid(), cat: "rent", amount: 450, note: "", date: d(1, 9) },
  { id: nid(), cat: "subs", amount: 10.99, note: "Spotify", date: d(2, 8) },
  { id: nid(), cat: "subs", amount: 12.5, note: "Phone plan", date: d(3, 8) },
];
_varSeed.forEach((s, i) => {
  const day = 1 + Math.round((_span - 1) * (i / (_varSeed.length - 1)));
  expenses.push({ id: nid(), cat: s[0], amount: s[1], note: s[2], date: d(day, 9 + (i % 12)) });
});

/* persistence */
const STORE = "spend_v1";
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(expenses));
  } catch (e) {}
}
function load() {
  try {
    const r = localStorage.getItem(STORE);
    if (r) {
      const p = JSON.parse(r);
      if (Array.isArray(p) && p.length) {
        expenses = p;
      }
    }
  } catch (e) {}
}

/* ---------- helpers ---------- */
const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const money = (n) => eur.format(n);
function thisMonth(e) {
  const d = new Date(e.date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
function expenseInViewMonth(e) {
  const d = new Date(e.date);
  return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
}
function isCurrentViewMonth() {
  const n = new Date();
  return viewMonth.getFullYear() === n.getFullYear() && viewMonth.getMonth() === n.getMonth();
}
function shiftViewMonth(delta) {
  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  if (next > current) return;
  viewMonth = next;
  renderHome();
}
function startDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function dayLabel(iso) {
  const d = new Date(iso);
  const diff = Math.round((startDay(new Date()) - startDay(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function daysLeftInMonth() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate();
}
const pad2 = (n) => String(n).padStart(2, "0");
function isoDay(dt) {
  return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate());
}
function todayStr() {
  return isoDay(new Date());
}
function stampFor(dayStr) {
  if (dayStr === todayStr()) return new Date().toISOString();
  const [y, m, dd] = dayStr.split("-").map(Number);
  return new Date(y, m - 1, dd, 12, 0).toISOString();
}

/* ---------- state ---------- */
let currentScreen = "home";
let filter = "all";
let openRow = null;
let editingId = null;
const now = new Date();
let viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const draft = { amount: 0, cat: null, note: "", day: todayStr() };

/* ---------- HOME ---------- */
function renderHome() {
  document.getElementById("monthLabel").textContent = viewMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  document.getElementById("monthPrev").disabled = false;
  document.getElementById("monthNext").disabled = isCurrentViewMonth();

  const month = expenses.filter(expenseInViewMonth);
  const total = month.reduce((s, e) => s + e.amount, 0);
  const fixed = month.filter((e) => catById(e.cat).fixed).reduce((s, e) => s + e.amount, 0);
  const variable = total - fixed;
  const left = VARIABLE_BUDGET - variable;
  const pct = Math.min(100, Math.round((variable / VARIABLE_BUDGET) * 100));
  const over = variable > VARIABLE_BUDGET;

  const byCat = CATS.map((c) => ({
    c,
    sum: month.filter((e) => e.cat === c.id).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum);
  const fixedNames = CATS.filter((c) => c.fixed && month.some((e) => e.cat === c.id))
    .map((c) => c.name)
    .join(", ");
  const recent = [...month].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const catCards = byCat
    .map(
      ({ c, sum }) => `
    <div class="catcard">
      <div class="dot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></div>
      <div class="cn">${c.name}</div>
      <div class="cv tabular">${money(sum)}</div>
    </div>`
    )
    .join("");

  const recentRows =
    recent
      .map((e) => {
        const c = catById(e.cat);
        return `
    <div class="rowwrap"><div class="row">
      <div class="badge" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></div>
      <div class="rmid"><div class="t">${e.note || c.name}</div><div class="s">${c.name}</div></div>
      <div class="rright"><div class="amt tabular">${money(e.amount)}</div><div class="dt">${dayLabel(e.date)}</div></div>
    </div></div>`;
      })
      .join("") || `<div class="empty">No expenses in this month.</div>`;

  const daysNote = isCurrentViewMonth()
    ? `${daysLeftInMonth()} days left`
    : `${new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()} days`;

  document.getElementById("homeScroll").innerHTML = `
    <div class="hero">
      <div class="lbl">${isCurrentViewMonth() ? "Spent this month" : "Spent in " + viewMonth.toLocaleDateString("en-GB", { month: "long" })}</div>
      <div class="total tabular">${money(total)}</div>
      <div class="bar ${over ? "over" : ""}"><i style="width:${pct}%"></i></div>
      <div class="budgetline">
        <span class="a tabular">${money(variable)} <span style="color:var(--muted);font-weight:400">of ${money(VARIABLE_BUDGET)} variable</span></span>
        <span class="b tabular">${over ? money(-left) + " over" : money(left) + " left"}</span>
      </div>
      <div class="fixedline">
        <span class="icon" data-ico="lock"></span>
        Fixed ${money(fixed)}${fixedNames ? " · " + fixedNames : ""} · ${daysNote}
      </div>
    </div>
    <button class="addbtn" data-nav="add"><span class="icon" data-ico="plus"></span>Add expense</button>
    <div class="sectlabel">Where it's going</div>
    <div class="catgrid">${catCards || ""}</div>
    <div class="sectlabel">Recent <a data-nav="list" aria-label="See all">See all <span class="icon" style="width:16px;height:16px" data-ico="chevron"></span></a></div>
    <div class="rows">${recentRows}</div>
  `;
  paintIcons(document.getElementById("screen-home"));
  paintIcons(document.getElementById("monthSwitcher"));
}

/* ---------- LIST ---------- */
function renderFilters() {
  const used = CATS.filter((c) => expenses.some((e) => e.cat === c.id));
  const chips = [{ id: "all", name: "All" }, ...used];
  document.getElementById("filterChips").innerHTML = chips
    .map((c) => `<button class="chip ${filter === c.id ? "active" : ""}" data-filter="${c.id}">${c.name}</button>`)
    .join("");
}
function renderList() {
  renderFilters();
  let items = expenses.filter(thisMonth);
  if (filter !== "all") items = items.filter((e) => e.cat === filter);
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  const el = document.getElementById("listScroll");
  if (!items.length) {
    el.innerHTML = `<div class="empty">Nothing here yet. Tap Add to log an expense.</div>`;
    return;
  }

  let html = '<div class="listcard">';
  let lastDay = null;
  items.forEach((e) => {
    const c = catById(e.cat);
    const dl = dayLabel(e.date);
    if (dl !== lastDay) {
      html += `<div class="daygroup">${dl}</div>`;
      lastDay = dl;
    }
    html += `
      <div class="rowwrap list-row ${openRow === e.id ? "open" : ""}" data-row="${e.id}">
        <div class="actions">
          <button class="act edit" data-edit="${e.id}"><span class="icon" data-ico="edit"></span>Edit</button>
          <button class="act del" data-del="${e.id}"><span class="icon" data-ico="trash"></span>Delete</button>
        </div>
        <div class="row">
          <div class="badge" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></div>
          <div class="rmid"><div class="t">${e.note || c.name}</div><div class="s">${c.name}</div></div>
          <div class="rright"><div class="amt tabular">${money(e.amount)}</div></div>
        </div>
      </div>`;
  });
  html += "</div>";
  el.innerHTML = html;
  paintIcons(el);
}

/* ---------- ADD ---------- */
function renderPicker() {
  document.getElementById("pickGrid").innerHTML = CATS.map(
    (c) => `
    <button class="pick ${draft.cat === c.id ? "sel" : ""}" data-cat="${c.id}">
      <span class="pdot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></span>${c.name}
    </button>`
  ).join("");
  paintIcons(document.getElementById("pickGrid"));
}
function parseAmount(str) {
  const n = parseFloat(String(str).replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function refreshSave() {
  draft.amount = parseAmount(document.getElementById("amtInput").value);
  document.getElementById("saveBtn").disabled = !(draft.amount > 0 && draft.cat);
}
function syncDate() {
  document.getElementById("dateText").textContent = dayLabel(stampFor(draft.day));
  document.getElementById("dateInput").value = draft.day;
}
function openEditor() {
  const di = document.getElementById("dateInput");
  di.max = todayStr();
  renderPicker();
  syncDate();
  refreshSave();
  showScreen("add");
}
function openAdd() {
  editingId = null;
  draft.amount = 0;
  draft.cat = null;
  draft.note = "";
  draft.day = todayStr();
  const ai = document.getElementById("amtInput");
  ai.value = "";
  document.getElementById("noteInput").value = "";
  document.getElementById("addTitle").textContent = "New expense";
  document.getElementById("saveBtn").textContent = "Save expense";
  openEditor();
  setTimeout(() => ai.focus(), 120);
}
function openEdit(id) {
  const e = expenses.find((x) => x.id === id);
  if (!e) return;
  editingId = id;
  draft.amount = e.amount;
  draft.cat = e.cat;
  draft.note = e.note || "";
  draft.day = isoDay(new Date(e.date));
  document.getElementById("amtInput").value = e.amount.toFixed(2).replace(".", ",");
  document.getElementById("noteInput").value = e.note || "";
  document.getElementById("addTitle").textContent = "Edit expense";
  document.getElementById("saveBtn").textContent = "Save changes";
  openEditor();
}
function commitAdd() {
  refreshSave();
  if (!(draft.amount > 0 && draft.cat)) return;
  const payload = {
    cat: draft.cat,
    amount: Math.round(draft.amount * 100) / 100,
    note: document.getElementById("noteInput").value.trim(),
    date: stampFor(draft.day),
  };
  if (editingId) {
    const e = expenses.find((x) => x.id === editingId);
    if (e) Object.assign(e, payload);
    editingId = null;
    save();
    showScreen("list");
    renderHome();
  } else {
    expenses.push(Object.assign({ id: nid() }, payload));
    save();
    showScreen("home");
    renderHome();
    renderList();
  }
}

/* ---------- nav ---------- */
function setNav(name) {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.nav === name));
}
function showScreen(name) {
  const app = document.getElementById("app");
  if (name === "add") {
    app.classList.add("modal");
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-add").classList.add("active");
    return;
  }
  app.classList.remove("modal");
  currentScreen = name;
  openRow = null;
  const map = { home: "screen-home", list: "screen-list", analyse: "screen-stub", more: "screen-stub" };
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(map[name]).classList.add("active");
  setNav(name);
  if (name === "home") renderHome();
  if (name === "list") renderList();
  if (name === "analyse") {
    document.getElementById("stubTitle").textContent = "Analysis";
    document.getElementById("stubHead").textContent = "Charts coming next";
    document.getElementById("stubBody").textContent =
      "Spending by category, month-over-month, and your daily pace. The natural fourth screen to build once logging feels right.";
  }
  if (name === "more") {
    document.getElementById("stubTitle").textContent = "More";
    document.getElementById("stubHead").textContent = "Settings live here";
    document.getElementById("stubBody").textContent =
      "Budget, categories, currency, and export. Kept out of the way so the core loop stays fast.";
  }
}

/* ---------- events (delegated) ---------- */
document.getElementById("nav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-nav]");
  if (!b) return;
  b.dataset.nav === "add" ? openAdd() : showScreen(b.dataset.nav);
});
document.getElementById("app").addEventListener("click", (e) => {
  const navEl = e.target.closest("[data-nav]");
  if (navEl && !navEl.closest("#nav")) {
    navEl.dataset.nav === "add" ? openAdd() : showScreen(navEl.dataset.nav);
    return;
  }

  const chip = e.target.closest("[data-filter]");
  if (chip) {
    filter = chip.dataset.filter;
    openRow = null;
    renderList();
    return;
  }

  const ed = e.target.closest("[data-edit]");
  if (ed) {
    openEdit(ed.dataset.edit);
    return;
  }

  const del = e.target.closest("[data-del]");
  if (del) {
    expenses = expenses.filter((x) => x.id !== del.dataset.del);
    openRow = null;
    save();
    renderList();
    return;
  }

  const rw = e.target.closest(".list-row[data-row]");
  if (rw) {
    openRow = openRow === rw.dataset.row ? null : rw.dataset.row;
    renderList();
    return;
  }

  const pick = e.target.closest("[data-cat]");
  if (pick) {
    draft.cat = pick.dataset.cat;
    renderPicker();
    refreshSave();
    return;
  }
});
document.getElementById("monthPrev").addEventListener("click", () => shiftViewMonth(-1));
document.getElementById("monthNext").addEventListener("click", () => shiftViewMonth(1));
document.getElementById("addBack").addEventListener("click", () => {
  const back = editingId ? "list" : "home";
  editingId = null;
  showScreen(back);
});
document.getElementById("saveBtn").addEventListener("click", commitAdd);
document.getElementById("amtInput").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
  refreshSave();
});
document.getElementById("dateInput").addEventListener("change", (e) => {
  draft.day = e.target.value || todayStr();
  syncDate();
});
document.getElementById("noteInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    commitAdd();
  }
});

/* ---------- service worker ---------- */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        reg.update();
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {});
  });
}

/* ---------- init ---------- */
load();
paintIcons(document);
paintIcons(document.getElementById("monthSwitcher"));
showScreen("home");
registerServiceWorker();
