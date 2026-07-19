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
const DEFAULT_CATS = [
  /* Variable spending */
  { id: "groceries", name: "Groceries", color: "#5E9022", icon: "cart", fixed: false },
  { id: "eating", name: "Eating out", color: "#D2582E", icon: "food", fixed: false },
  { id: "transport", name: "Transport", color: "#2F82D6", icon: "bus", fixed: false },
  { id: "trips", name: "Trips", color: "#1B9670", icon: "plane", fixed: false },
  { id: "nightlife", name: "Nightlife", color: "#CB4E77", icon: "glass", fixed: false },
  { id: "household", name: "Household", color: "#726D64", icon: "bucket", fixed: false },
  /* Fixed spending */
  { id: "rent", name: "Rent", color: "#5B51C6", icon: "home", fixed: true },
  { id: "subs", name: "Subscriptions", color: "#B06E14", icon: "refresh", fixed: true },
];
const PICK_COLORS = ["#5B51C6", "#5E9022", "#D2582E", "#2F82D6", "#1B9670", "#CB4E77", "#B06E14", "#726D64"];
const PICK_ICONS = ["home", "cart", "food", "bus", "plane", "glass", "refresh", "bucket", "list", "chart", "dots"];
let categories = DEFAULT_CATS.map((c) => ({ ...c }));
const catById = (id) =>
  categories.find((c) => c.id === id) || { id, name: "Other", color: "#726D64", icon: "dots", fixed: false };
const DEFAULT_VARIABLE_BUDGET = 1000;
let variableBudget = DEFAULT_VARIABLE_BUDGET;
let catEditor = null; /* { id, fixed, isNew } when editing in More */

let uid = 1;
const nid = () => "e" + uid++;
function d(day, h) {
  const n = new Date();
  const dd = Math.max(1, Math.min(day, n.getDate()));
  return new Date(n.getFullYear(), n.getMonth(), dd, h || 12, 0).toISOString();
}

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

/** Build the demo month of sample expenses (shown when a user has no saved data yet). */
function buildDemoExpenses() {
  let counter = 1;
  const nextId = () => "e" + counter++;
  const span = Math.max(1, Math.min(new Date().getDate(), 24));
  const list = [
    { id: nextId(), cat: "rent", amount: 750, note: "", date: d(1, 9) },
    { id: nextId(), cat: "subs", amount: 18, note: "Spotify", date: d(2, 8) },
    { id: nextId(), cat: "subs", amount: 21, note: "Phone plan", date: d(3, 8) },
  ];
  _varSeed.forEach((s, i) => {
    const day = 1 + Math.round((span - 1) * (i / (_varSeed.length - 1)));
    const amount = Math.round(s[1] * window.SpendRates.DEFAULT_RATE * 100) / 100;
    list.push({ id: nextId(), cat: s[0], amount, note: s[2], date: d(day, 9 + (i % 12)) });
  });
  return { expenses: list, uid: counter };
}

let expenses = (() => {
  const demo = buildDemoExpenses();
  uid = demo.uid;
  return demo.expenses;
})();

/* persistence */
let storeKey = "spend_v1";

function useCloud() {
  return !!(window.SpendData && window.SpendData.isEnabled() && currentUser);
}

function setExpenseStoreKey(userId) {
  storeKey = userId ? "spend_v1_" + userId : "spend_v1";
}

function settingsStoreKey(userId) {
  return userId ? "spend_settings_" + userId : "spend_settings";
}

function readLocalSettings(userId) {
  try {
    const raw = localStorage.getItem(settingsStoreKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch (e) {
    return null;
  }
}

function writeLocalSettings(userId, settings) {
  try {
    localStorage.setItem(settingsStoreKey(userId), JSON.stringify(settings));
  } catch (e) {}
}

async function loadUserSettings(userId) {
  if (!userId) {
    variableBudget = DEFAULT_VARIABLE_BUDGET;
    return;
  }

  const local = readLocalSettings(userId);
  if (local && local.variableBudget > 0) variableBudget = local.variableBudget;

  if (!window.SpendSettings?.isEnabled()) return;

  try {
    let row = await window.SpendSettings.fetch(userId);
    if (!row) row = await window.SpendSettings.ensure(userId, DEFAULT_VARIABLE_BUDGET);
    if (row?.variable_budget > 0) {
      variableBudget = Number(row.variable_budget);
      writeLocalSettings(userId, { variableBudget });
    }
  } catch (e) {
    console.warn("[Spend] Could not load settings:", e.message);
  }
}

async function saveVariableBudget(amount) {
  variableBudget = Math.round(amount * 100) / 100;
  if (currentUser) writeLocalSettings(currentUser.id, { variableBudget });
  if (useCloud() && window.SpendSettings) {
    await window.SpendSettings.updateBudget(currentUser.id, variableBudget);
  }
}

function categoriesStoreKey(userId) {
  return userId ? "spend_categories_" + userId : "spend_categories";
}

function readLocalCategories(userId) {
  try {
    const raw = localStorage.getItem(categoriesStoreKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : null;
  } catch (e) {
    return null;
  }
}

function writeLocalCategories(userId, list) {
  try {
    localStorage.setItem(categoriesStoreKey(userId), JSON.stringify(list));
  } catch (e) {}
}

function cloneDefaultCategories() {
  return DEFAULT_CATS.map((c) => ({ ...c }));
}

async function loadCategories(userId) {
  if (!userId) {
    categories = cloneDefaultCategories();
    return;
  }

  const local = readLocalCategories(userId);
  if (local?.length) categories = local.map((c) => ({ ...c }));

  let normalizedGroceries = false;
  const groceriesLocal = categories.find((c) => c.id === "groceries");
  if (groceriesLocal?.fixed) {
    groceriesLocal.fixed = false;
    normalizedGroceries = true;
  }

  if (!window.SpendCategories?.isEnabled()) {
    if (!categories.length) categories = cloneDefaultCategories();
    else if (normalizedGroceries) writeLocalCategories(userId, categories);
    return;
  }

  try {
    let list = await window.SpendCategories.fetchAll(userId);
    if (!list.length) {
      list = cloneDefaultCategories();
      await window.SpendCategories.saveAll(userId, list);
    }
    categories = list.map((c) => ({ ...c }));
    const groceries = categories.find((c) => c.id === "groceries");
    if (groceries?.fixed) {
      groceries.fixed = false;
      await window.SpendCategories.saveAll(userId, categories);
    }
    writeLocalCategories(userId, categories);
  } catch (e) {
    if (!categories.length) categories = cloneDefaultCategories();
    console.warn("[Spend] Could not load categories:", e.message);
  }
}

async function persistCategories() {
  if (currentUser) writeLocalCategories(currentUser.id, categories);
  if (useCloud() && window.SpendCategories) {
    await window.SpendCategories.saveAll(currentUser.id, categories);
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function makeCatId(name) {
  let base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "category";
  let id = base;
  let n = 2;
  while (categories.some((c) => c.id === id)) {
    id = base + "_" + n++;
  }
  return id;
}

function categoryInUse(id) {
  return expenses.some((e) => e.cat === id);
}

function readLocalExpenses() {
  try {
    const r = localStorage.getItem(storeKey);
    if (!r) return [];
    const p = JSON.parse(r);
    return Array.isArray(p) ? p : [];
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(expenses));
  } catch (e) {}
}

function load() {
  try {
    const p = readLocalExpenses();
    if (p.length) expenses = p;
  } catch (e) {}
}

function isOnline() {
  return navigator.onLine !== false;
}

function isCloudId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
}

function makeLocalId() {
  return "local_" + nid();
}

function isPendingExpense(e) {
  return !!e._pending || !isCloudId(e.id);
}

function expensePayload(item) {
  return {
    cat: item.cat,
    amount: item.amount,
    note: item.note || "",
    date: item.date,
    fxRate: item.fxRate ?? null,
  };
}

function syncUidFromExpenses() {
  expenses.forEach((e) => {
    const n = parseInt(String(e.id).replace(/^e/, ""), 10);
    if (!isNaN(n) && n >= uid) uid = n + 1;
  });
}

function mergeCloudAndLocal(cloudRows, local) {
  const byId = new Map(cloudRows.map((e) => [e.id, e]));
  for (const item of local) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

async function fetchCloudExpenses(userId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await window.SpendAuth.ensureReady();
      return await window.SpendData.fetchAll(userId);
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  return [];
}

/** Upload local-only expenses that are not in the cloud yet. */
async function syncPendingToCloud() {
  if (!useCloud() || !isOnline()) return false;

  const pending = expenses.filter(isPendingExpense);
  if (!pending.length) return false;

  let changed = false;
  for (const item of pending) {
    try {
      const created = await window.SpendData.insert(currentUser.id, expensePayload(item));
      const i = expenses.findIndex((e) => e.id === item.id);
      if (i !== -1) expenses[i] = created;
      else expenses.push(created);
      changed = true;
    } catch (e) {
      console.warn("[Spend] Could not sync pending expense:", e.message);
    }
  }

  if (changed) save();
  return changed;
}

async function refreshFromCloud() {
  if (!useCloud() || !isOnline()) return false;
  try {
    await window.SpendAuth.ensureReady();
    const rows = await window.SpendData.fetchAll(currentUser.id);
    expenses = rows;
    save();
    return true;
  } catch (e) {
    console.warn("[Spend] Cloud refresh failed:", e.message);
    return false;
  }
}

async function maybeSeedDemo() {
  const seededKey = storeKey + "_demo_seeded";
  if (!useCloud() || !isOnline() || expenses.length || localStorage.getItem(seededKey)) return;
  expenses = await window.SpendData.insertMany(currentUser.id, buildDemoExpenses().expenses);
  try {
    localStorage.setItem(seededKey, "1");
  } catch (e) {}
  save();
}

/**
 * Load expenses on sign-in:
 * 1. Fetch cloud (when online)
 * 2. Merge in local-only / offline expenses
 * 3. Upload pending local items to cloud, then refresh
 */
async function hydrateExpenses() {
  if (!useCloud()) {
    const demo = buildDemoExpenses();
    uid = demo.uid;
    expenses = demo.expenses;
    load();
    syncUidFromExpenses();
    return;
  }

  const local = readLocalExpenses();
  let cloudRows = [];

  if (isOnline()) {
    try {
      cloudRows = await fetchCloudExpenses(currentUser.id);
    } catch (e) {
      console.warn("[Spend] Cloud fetch failed:", e.message);
    }
  }

  expenses = mergeCloudAndLocal(cloudRows, local);

  syncUidFromExpenses();

  if (isOnline()) {
    const synced = await syncPendingToCloud();
    if (synced) await refreshFromCloud();
  }

  save();
  await maybeSeedDemo();
}

function wireOnlineSync() {
  if (wireOnlineSync._done) return;
  wireOnlineSync._done = true;

  window.addEventListener("online", () => {
    if (!useCloud()) return;
    void (async () => {
      const synced = await syncPendingToCloud();
      if (synced) {
        await refreshFromCloud();
        showToast("Offline expenses synced to the cloud.");
      }
      if (currentScreen === "home") renderHome();
      if (currentScreen === "list") renderList();
    })();
  });
}

let accountMenuOpen = false;

function accountInitial(email) {
  const ch = (email || "?").trim().charAt(0).toUpperCase();
  return ch || "?";
}

function closeAccountMenu() {
  accountMenuOpen = false;
  const pop = document.getElementById("accountPopover");
  const btn = document.getElementById("accountAvatar");
  if (pop) pop.hidden = true;
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  accountMenuOpen = !accountMenuOpen;
  const pop = document.getElementById("accountPopover");
  const btn = document.getElementById("accountAvatar");
  if (!pop || !btn) return;
  pop.hidden = !accountMenuOpen;
  btn.setAttribute("aria-expanded", accountMenuOpen ? "true" : "false");
}

function updateAccountMenu() {
  const menu = document.getElementById("accountMenu");
  const app = document.getElementById("app");
  if (!menu || !app) return;

  const signedIn = !!(window.SpendAuth?.isEnabled() && currentUser);
  menu.hidden = !signedIn;
  app.classList.toggle("signed-in", signedIn);

  if (!signedIn) {
    closeAccountMenu();
    return;
  }

  const email = currentUser.email || "Account";
  document.getElementById("accountInitial").textContent = accountInitial(email);
  document.getElementById("accountPopoverEmail").textContent = email;
}

function wireAccountMenu() {
  const menu = document.getElementById("accountMenu");
  if (!menu || wireAccountMenu._done) return;
  wireAccountMenu._done = true;

  document.getElementById("accountAvatar")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAccountMenu();
  });
  document.getElementById("accountSignOut")?.addEventListener("click", () => {
    closeAccountMenu();
    void handleLogout();
  });
  menu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", () => {
    if (accountMenuOpen) closeAccountMenu();
  });
}

function showToast(message) {
  const el = document.getElementById("toast");
  if (!el || !message) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    el.hidden = true;
  }, 4500);
}

function setAppLoading(loading) {
  const app = document.getElementById("app");
  const screen = document.getElementById("loadScreen");
  if (screen) screen.classList.toggle("is-hidden", !loading);
  if (app) app.setAttribute("aria-busy", loading ? "true" : "false");
}

/* ---------- helpers ---------- */
const audFmt = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const eurFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const money = (n) => audFmt.format(n);
/** EUR/AUD rate for one expense (saved snapshot, or lookup for that month). */
function expenseRate(e) {
  return e.fxRate || window.SpendRates.rateFor(e.date);
}
/** EUR hint: round up to one decimal (e.g. €18.9). */
function moneyEurAt(aud, rate) {
  const eur = aud / rate;
  return eurFmt.format(Math.ceil(eur * 10) / 10);
}
/** Hero total — AUD large + single ≈ € hint. */
function moneyHero(aud, rate) {
  return `<div class="moneyblock hero-money"><div class="money-main tabular">${money(aud)}</div><div class="money-eur tabular">≈ ${moneyEurAt(aud, rate)}</div></div>`;
}
/** AUD + € hint (category cards, expense rows). */
function moneyStack(aud, rate) {
  return `<div class="moneyblock"><div class="money-main tabular">${money(aud)}</div><div class="money-eur tabular">${moneyEurAt(aud, rate)}</div></div>`;
}
function moneyStackExpense(e) {
  return moneyStack(e.amount, expenseRate(e));
}
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
  void window.SpendRates.ensureForDate(viewMonth).then((updated) => {
    if (updated) renderHome();
  });
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
let currentUser = null;
let authMode = "signin";
let filter = "all";
let openRow = null;
let editingId = null;
let appReady = false;
let enterAppRunning = false;
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
  const left = variableBudget - variable;
  const pct = Math.min(100, Math.round((variable / variableBudget) * 100));
  const over = variable > variableBudget;

  const byCat = categories
    .map((c) => ({
    c,
    sum: month.filter((e) => e.cat === c.id).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum);
  const fixedNames = categories
    .filter((c) => c.fixed && month.some((e) => e.cat === c.id))
    .map((c) => c.name)
    .join(", ");
  const recent = [...month].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const fx = window.SpendRates.rateFor(viewMonth);

  const catCards = byCat
    .map(
      ({ c, sum }) => `
    <div class="catcard">
      <div class="dot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></div>
      <div class="cn">${c.name}</div>
      <div class="cv">${moneyStack(sum, fx)}</div>
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
      <div class="rright">${moneyStackExpense(e)}<div class="dt">${dayLabel(e.date)}</div></div>
    </div></div>`;
      })
      .join("") || `<div class="empty">No expenses in this month.</div>`;

  const daysNote = isCurrentViewMonth()
    ? `${daysLeftInMonth()} days left`
    : `${new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()} days`;

  document.getElementById("homeScroll").innerHTML = `
    <div class="hero">
      <div class="lbl">${isCurrentViewMonth() ? "Spent this month" : "Spent in " + viewMonth.toLocaleDateString("en-GB", { month: "long" })}</div>
      <div class="total">${moneyHero(total, fx)}</div>
      <div class="bar ${over ? "over" : ""}"><i style="width:${pct}%"></i></div>
      <div class="budgetrows">
        <div class="budgetrow">
          <span class="budgetlbl">Variable</span>
          <span class="budgetmid"><span class="tabular">${money(variable)}</span> <span class="budget-of">of ${money(variableBudget)}</span></span>
          <span class="budgetright ${over ? "over" : ""} tabular">${over ? money(-left) + " over" : money(left) + " left"}</span>
        </div>
        <div class="budgetrow">
          <span class="budgetlbl"><span class="icon" data-ico="lock"></span> Fixed</span>
          <span class="budgetmid tabular">${money(fixed)}</span>
          <span class="budgetmeta">${fixedNames ? fixedNames + " · " : ""}${daysNote}</span>
        </div>
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
  const used = categories.filter((c) => expenses.some((e) => e.cat === c.id));
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
          <div class="rright">${moneyStackExpense(e)}</div>
        </div>
      </div>`;
  });
  html += "</div>";
  el.innerHTML = html;
  paintIcons(el);
}

/* ---------- ADD ---------- */
function renderPicker() {
  document.getElementById("pickGrid").innerHTML = categories
    .map(
    (c) => `
    <button class="pick ${draft.cat === c.id ? "sel" : ""}" data-cat="${c.id}">
      <span class="pdot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></span>${c.name}
    </button>`
  ).join("");
  paintIcons(document.getElementById("pickGrid"));
}
function parseAmount(str) {
  const s = String(str).trim().replace(/[^0-9.,]/g, "");
  if (!s) return 0;
  if (s.includes(",") && !s.includes(".")) {
    const n = parseFloat(s.replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(s.replace(/,/g, ""));
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
  document.getElementById("amtInput").value = e.amount.toFixed(2);
  document.getElementById("noteInput").value = e.note || "";
  document.getElementById("addTitle").textContent = "Edit expense";
  document.getElementById("saveBtn").textContent = "Save changes";
  openEditor();
}
async function commitAdd() {
  refreshSave();
  if (!(draft.amount > 0 && draft.cat)) return;

  const payload = {
    cat: draft.cat,
    amount: Math.round(draft.amount * 100) / 100,
    note: document.getElementById("noteInput").value.trim(),
    date: stampFor(draft.day),
  };

  await window.SpendRates.ensureForDate(payload.date).catch(() => {});
  payload.fxRate = window.SpendRates.snapshotFor(payload.date);

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;

  try {
    if (editingId) {
      const e = expenses.find((x) => x.id === editingId);
      if (!e) return;
      if (useCloud() && isOnline() && isCloudId(editingId)) {
        const updated = await window.SpendData.update(editingId, payload);
        Object.assign(e, updated);
        save();
      } else if (useCloud()) {
        Object.assign(e, payload, { _pending: true });
        save();
        if (!isOnline()) showToast("Saved offline — will sync when you're back online.");
      } else {
        Object.assign(e, payload);
        save();
      }
      editingId = null;
      showScreen("list");
      renderHome();
    } else {
      if (useCloud() && isOnline()) {
        const created = await window.SpendData.insert(currentUser.id, payload);
        expenses.push(created);
        save();
      } else if (useCloud()) {
        expenses.push(Object.assign({ id: makeLocalId(), _pending: true }, payload));
        save();
        showToast("Saved offline — will sync when you're back online.");
      } else {
        expenses.push(Object.assign({ id: nid() }, payload));
        save();
      }
      showScreen("home");
      renderHome();
      renderList();
    }
  } catch (err) {
    showToast(err.message || "Could not save expense. Check your connection.");
  } finally {
    refreshSave();
  }
}

async function deleteExpense(id) {
  try {
    if (useCloud() && isOnline() && isCloudId(id)) {
      await window.SpendData.remove(id);
    }
    expenses = expenses.filter((x) => x.id !== id);
    save();
    openRow = null;
    renderList();
    renderHome();
  } catch (err) {
    showToast(err.message || "Could not delete expense.");
  }
}

/* ---------- nav ---------- */
function setNav(name) {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.nav === name));
}
function showScreen(name) {
  closeAccountMenu();
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
  if (name === "analyse") renderAnalyse();
  if (name === "more") renderMore();
}

function renderAnalyse() {
  document.getElementById("stubTitle").textContent = "Analysis";
  const el = document.getElementById("stubContent");
  el.className = "stub";
  el.innerHTML = `
    <span class="icon" data-ico="chart"></span>
    <h2>Charts coming next</h2>
    <p>Spending by category, month-over-month, and your daily pace. The natural fourth screen to build once logging feels right.</p>
  `;
  paintIcons(el);
}

function renderCategoryRow(c) {
  return `<button type="button" class="catlist-row" data-edit-cat="${esc(c.id)}">
    <span class="catlist-dot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></span>
    <span class="catlist-name">${esc(c.name)}</span>
    <span class="icon catlist-chev" data-ico="chevronRight"></span>
  </button>`;
}

function renderCategoryList(fixed) {
  const list = categories.filter((c) => !!c.fixed === fixed);
  const rows = list.map(renderCategoryRow).join("");
  const empty = `<div class="catlist-empty">${fixed ? "No fixed categories yet." : "No variable categories yet."}</div>`;
  return `<div class="catlist-block">
    <div class="catlist-head">
      <span class="catlist-title">${fixed ? "Fixed spending" : "Variable spending"}</span>
      <button type="button" class="catlist-add" data-add-cat="${fixed ? "fixed" : "variable"}">+ Add</button>
    </div>
    <div class="catlist-rows">${rows || empty}</div>
  </div>`;
}

function renderCatEditor() {
  if (!catEditor) return "";
  const c = catEditor.isNew
    ? { name: "", color: PICK_COLORS[0], icon: PICK_ICONS[0], fixed: catEditor.fixed }
    : catById(catEditor.id);
  const canDelete = !catEditor.isNew && !categoryInUse(catEditor.id);
  const colorBtns = PICK_COLORS.map(
    (col) =>
      `<button type="button" class="swatch ${c.color === col ? "on" : ""}" data-pick-color="${col}" style="background:${col}" aria-label="Colour ${col}"></button>`
  ).join("");
  const iconBtns = PICK_ICONS.map(
    (ico) =>
      `<button type="button" class="ipick ${c.icon === ico ? "on" : ""}" data-pick-icon="${ico}" aria-label="Icon ${ico}"><span class="icon" data-ico="${ico}"></span></button>`
  ).join("");
  return `<div class="cateditor" id="catEditor">
    <div class="cateditor-title">${catEditor.isNew ? "New category" : "Edit category"}</div>
    <div class="field">
      <div class="fl">Name</div>
      <input class="noteinput" id="catNameInput" value="${esc(c.name)}" placeholder="e.g. Pet care" autocomplete="off">
    </div>
    <div class="field">
      <div class="fl">Colour</div>
      <div class="swatches" id="colorPick">${colorBtns}</div>
    </div>
    <div class="field">
      <div class="fl">Icon</div>
      <div class="iconpicks" id="iconPick">${iconBtns}</div>
    </div>
    <label class="fixedtoggle">
      <input type="checkbox" id="catFixedToggle" ${c.fixed ? "checked" : ""}>
      <span>Fixed spending <span class="fixedtoggle-hint">(rent, subscriptions — not part of variable budget)</span></span>
    </label>
    <div class="cateditor-actions">
      <button type="button" class="savebtn" id="catSaveBtn">${catEditor.isNew ? "Add category" : "Save changes"}</button>
      ${canDelete ? '<button type="button" class="catdelbtn" id="catDeleteBtn">Delete</button>' : ""}
      <button type="button" class="catcancelbtn" id="catCancelBtn">Cancel</button>
    </div>
  </div>`;
}

function openCatEditor(id, fixedDefault) {
  if (id) {
    const c = catById(id);
    catEditor = { id: c.id, fixed: c.fixed, isNew: false };
  } else {
    catEditor = { id: null, fixed: !!fixedDefault, isNew: true };
  }
  renderMore();
}

function closeCatEditor() {
  catEditor = null;
  renderMore();
}

function readCatEditorForm() {
  const name = (document.getElementById("catNameInput")?.value || "").trim();
  const fixed = !!document.getElementById("catFixedToggle")?.checked;
  const colorBtn = document.querySelector("#colorPick .swatch.on");
  const iconBtn = document.querySelector("#iconPick .ipick.on");
  const color = colorBtn?.dataset.pickColor || PICK_COLORS[0];
  const icon = iconBtn?.dataset.pickIcon || PICK_ICONS[0];
  return { name, fixed, color, icon };
}

function wireCatEditor() {
  const panel = document.getElementById("stubContent");
  if (!panel) return;

  panel.querySelector("#catSaveBtn")?.addEventListener("click", () => {
    void handleSaveCategory();
  });
  panel.querySelector("#catDeleteBtn")?.addEventListener("click", () => {
    void handleDeleteCategory();
  });
  panel.querySelector("#catCancelBtn")?.addEventListener("click", closeCatEditor);

  panel.querySelector("#colorPick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-color]");
    if (!btn) return;
    panel.querySelectorAll("#colorPick .swatch").forEach((b) => b.classList.toggle("on", b === btn));
  });
  panel.querySelector("#iconPick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-icon]");
    if (!btn) return;
    panel.querySelectorAll("#iconPick .ipick").forEach((b) => b.classList.toggle("on", b === btn));
  });
}

function wireMorePanel() {
  const panel = document.getElementById("stubContent");
  if (!panel || panel._wired) return;
  panel._wired = true;

  panel.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-cat]");
    if (add) {
      openCatEditor(null, add.dataset.addCat === "fixed");
      return;
    }
    const edit = e.target.closest("[data-edit-cat]");
    if (edit) {
      openCatEditor(edit.dataset.editCat);
    }
  });
}

async function handleSaveCategory() {
  const { name, fixed, color, icon } = readCatEditorForm();
  if (!name) {
    showToast("Enter a category name.");
    return;
  }

  const btn = document.getElementById("catSaveBtn");
  if (btn) btn.disabled = true;
  try {
    if (catEditor.isNew) {
      categories.push({ id: makeCatId(name), name, color, icon, fixed });
    } else {
      const c = categories.find((x) => x.id === catEditor.id);
      if (!c) return;
      c.name = name;
      c.color = color;
      c.icon = icon;
      c.fixed = fixed;
    }
    await persistCategories();
    catEditor = null;
    renderMore();
    if (currentScreen === "home") renderHome();
    if (currentScreen === "list") renderList();
    showToast("Category saved.");
  } catch (err) {
    showToast(err.message || "Could not save category.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleDeleteCategory() {
  if (!catEditor || catEditor.isNew) return;
  if (categoryInUse(catEditor.id)) {
    showToast("Remove expenses from this category first.");
    return;
  }
  if (categories.length <= 1) {
    showToast("Keep at least one category.");
    return;
  }

  try {
    categories = categories.filter((c) => c.id !== catEditor.id);
    await persistCategories();
    catEditor = null;
    renderMore();
    showToast("Category deleted.");
  } catch (err) {
    showToast(err.message || "Could not delete category.");
  }
}

function renderMore() {
  document.getElementById("stubTitle").textContent = "More";
  const el = document.getElementById("stubContent");
  if (window.SpendAuth && window.SpendAuth.isEnabled() && currentUser) {
    el.className = "account-panel";
    el.innerHTML = `
      <div class="account-card">
        <div class="lbl">Variable spending limit</div>
        <p class="settings-hint">Monthly cap for flexible costs. Fixed categories below don't count toward this.</p>
        <div class="budget-field">
          <span class="budget-cur">AUD</span>
          <input class="budget-input tabular" id="budgetInput" type="text" inputmode="decimal"
                 autocomplete="off" aria-label="Variable spending limit in Australian dollars"
                 value="${variableBudget.toFixed(2)}">
        </div>
        <button type="button" class="savebtn settings-save" id="saveBudgetBtn">Save limit</button>
      </div>
      <div class="account-card">
        <div class="lbl">Categories</div>
        <p class="settings-hint">Customise labels for variable and fixed spending. Tap a category to edit.</p>
        ${renderCategoryList(false)}
        ${renderCategoryList(true)}
        ${renderCatEditor()}
      </div>
    `;
    document.getElementById("saveBudgetBtn").addEventListener("click", () => {
      void handleSaveBudget();
    });
    document.getElementById("budgetInput").addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
    });
    document.getElementById("budgetInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSaveBudget();
      }
    });
    wireMorePanel();
    wireCatEditor();
    paintIcons(el);
    if (catEditor) document.getElementById("catNameInput")?.focus();
    return;
  }
  el.className = "stub";
  el.innerHTML = `
    <span class="icon" data-ico="dots"></span>
    <h2>Settings live here</h2>
    <p>Budget, categories, currency, and export. Kept out of the way so the core loop stays fast.</p>
  `;
  paintIcons(el);
}

async function handleSaveBudget() {
  const input = document.getElementById("budgetInput");
  if (!input) return;
  const amount = parseAmount(input.value);
  if (!(amount > 0)) {
    showToast("Enter a valid spending limit.");
    return;
  }

  const btn = document.getElementById("saveBudgetBtn");
  if (btn) btn.disabled = true;
  try {
    await saveVariableBudget(amount);
    input.value = variableBudget.toFixed(2);
    showToast("Spending limit saved.");
    if (currentScreen === "home") renderHome();
  } catch (err) {
    showToast(err.message || "Could not save spending limit.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ---------- auth ---------- */
function showSetupScreen() {
  setAppLoading(false);
  currentUser = null;
  updateAccountMenu();
  const app = document.getElementById("app");
  app.classList.add("auth-mode");
  app.classList.remove("modal");
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-setup").classList.add("active");
}

function showAuthScreen() {
  setAppLoading(false);
  currentUser = null;
  updateAccountMenu();
  appReady = false;
  catEditor = null;
  categories = cloneDefaultCategories();
  const app = document.getElementById("app");
  app.classList.add("auth-mode");
  app.classList.remove("modal");
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-auth").classList.add("active");
  clearAuthMessage();
}

async function enterApp(session) {
  if (enterAppRunning) return;
  enterAppRunning = true;
  currentUser = session ? session.user : null;
  if (currentUser) setExpenseStoreKey(currentUser.id);
  setAppLoading(true);
  try {
    await hydrateExpenses();
    document.getElementById("app").classList.remove("auth-mode");
    paintIcons(document);
    paintIcons(document.getElementById("monthSwitcher"));
    showScreen("home");
    appReady = true;
    updateAccountMenu();
    void loadUserSettings(currentUser?.id)
      .then(() => loadCategories(currentUser?.id))
      .then(() => window.SpendRates.ensureForExpenses(expenses))
      .then((updated) => {
        if (updated && currentScreen === "home") renderHome();
      })
      .catch((e) => console.warn("[Spend] Background sync:", e.message));
  } catch (err) {
    showToast(err.message || "Could not load your expenses.");
    showAuthScreen();
    appReady = false;
  } finally {
    setAppLoading(false);
    enterAppRunning = false;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("authSubmit").textContent = mode === "signin" ? "Sign in" : "Create account";
  document.getElementById("authToggle").textContent =
    mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in";
  document.getElementById("authPassword").autocomplete = mode === "signin" ? "current-password" : "new-password";
  clearAuthMessage();
}

function showAuthMessage(text, type) {
  const el = document.getElementById("authMsg");
  el.textContent = text;
  el.className = "auth-msg " + (type || "error");
  el.hidden = !text;
}

function clearAuthMessage() {
  showAuthMessage("", "");
  document.getElementById("authMsg").hidden = true;
}

function setAuthLoading(loading) {
  document.getElementById("authSubmit").disabled = loading;
  document.getElementById("authSubmit").textContent = loading
    ? "Please wait…"
    : authMode === "signin"
      ? "Sign in"
      : "Create account";
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  clearAuthMessage();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!email || password.length < 6) {
    showAuthMessage("Enter a valid email and a password with at least 6 characters.", "error");
    return;
  }

  setAuthLoading(true);
  try {
    if (authMode === "signup") {
      const data = await window.SpendAuth.signUp(email, password);
      if (data.session) {
        await enterApp(data.session);
      } else {
        showAuthMessage("Account created. Check your email to confirm, then sign in.", "ok");
        setAuthMode("signin");
      }
    } else {
      const data = await window.SpendAuth.signIn(email, password);
      await enterApp(data.session);
    }
  } catch (err) {
    showAuthMessage(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    setAuthLoading(false);
  }
}

async function handleLogout() {
  try {
    await window.SpendAuth.signOut();
  } catch (err) {
    showAuthMessage(err.message || "Could not sign out.", "error");
  }
}

function wireAuthForm() {
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
  document.getElementById("authToggle").addEventListener("click", () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
  });
}

async function bootstrap() {
  setAppLoading(true);
  wireAuthForm();
  wireAccountMenu();
  wireOnlineSync();
  paintIcons(document);

  if (!window.SpendAuth || !window.SpendAuth.isEnabled()) {
    showSetupScreen();
    registerServiceWorker();
    return;
  }

  await new Promise((resolve) => {
    let booted = false;
    const start = (session) => {
      if (booted) return;
      booted = true;
      resolve();
      if (session) void enterApp(session);
      else showAuthScreen();
    };

    const fallback = setTimeout(() => {
      void window.SpendAuth.getSession().then(start);
    }, 4000);

    window.SpendAuth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      if (event === "INITIAL_SESSION") {
        clearTimeout(fallback);
        start(session);
        return;
      }
      if (event === "SIGNED_IN") void enterApp(session);
      if (!session && event === "SIGNED_OUT") showAuthScreen();
    });
  });

  registerServiceWorker();
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
    void deleteExpense(del.dataset.del);
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
document.getElementById("saveBtn").addEventListener("click", () => {
  void commitAdd();
});
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
    void commitAdd();
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
bootstrap();
