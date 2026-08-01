"use strict";

/* ---------- icons (inline SVG, offline-safe) ---------- */
const P = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;
const ICONS = {
  home: P('<path d="M3 11.2 12 4l9 7.2"/><path d="M5 10v10h14V10"/>'),
  cart: P('<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6"/>'),
  food: P('<path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11"/><path d="M16 3c-1.5 0-2.5 2-2.5 4.5S15 12 16 12v9"/>'),
  bus: P('<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/><path d="M7 16v2M17 16v2"/>'),
  plane: P('<path d="M21 3.5 12.5 12"/><path d="M21 3.5 14.5 21l-2.5-7.5L5 11.5 21 3.5Z"/>'),
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
  search: P('<circle cx="11" cy="11" r="6.5"/><path d="M16.5 16.5 21 21"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  eye: P('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>'),
  eyeOff: P('<path d="M3 4l18 16"/><path d="M10.6 10.7a2.5 2.5 0 0 0 3.5 3.5"/><path d="M7 8.2C4.4 9.6 2.8 12 2.8 12s3.5 6 9.2 6c1.5 0 2.8-.3 4-.8M10.2 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 3.6"/>'),
  lock: P('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  chevron: P('<path d="M6 9l6 6 6-6"/>'),
  chevronLeft: P('<path d="M15 6l-6 6 6 6"/>'),
  chevronRight: P('<path d="M9 6l6 6-6 6"/>'),
  /* category pick icons */
  coffee: P('<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M7 4v2M10 3v3M13 4v2"/>'),
  car: P('<path d="M4 14h16l-1.2-4.2A2 2 0 0 0 16.9 8H7.1a2 2 0 0 0-1.9 1.8L4 14Z"/><path d="M5 14v3h2.5M19 14v3h-2.5"/><circle cx="8" cy="17" r="1.3"/><circle cx="16" cy="17" r="1.3"/><path d="M4 11h16"/>'),
  train: P('<rect x="6" y="4" width="12" height="13" rx="2"/><path d="M6 11h12M9 17l-2 3M15 17l2 3"/><circle cx="9.5" cy="14" r="1"/><circle cx="14.5" cy="14" r="1"/>'),
  bike: P('<circle cx="6.5" cy="16.5" r="3"/><circle cx="17.5" cy="16.5" r="3"/><path d="M6.5 16.5 11 8h3l3.5 8.5M11 8l-2 5h6"/>'),
  fuel: P('<rect x="5" y="4" width="10" height="16" rx="1.5"/><path d="M15 7h2.5a2 2 0 0 1 2 2v7.5a1.5 1.5 0 0 0 1.5 1.5"/><path d="M8 8h4"/>'),
  heart: P('<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z"/>'),
  gift: P('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M4 13h16"/><path d="M12 9c-2 0-3.5-1.4-3.5-3S11 4 12 6.2C13 4 14.5 3 15.5 6S14 9 12 9Z"/>'),
  game: P('<path d="M7 9h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z"/><path d="M8.5 13v3M7 14.5h3M15.5 13.5h.01M17.5 15.5h.01"/>'),
  music: P('<path d="M9 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M11.5 16V6l7-2v9"/><path d="M16 15a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>'),
  film: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>'),
  book: P('<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z"/><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19"/>'),
  fitness: P('<path d="M7 9v6M17 9v6M4 11v2M20 11v2M9 8h6v8H9z"/>'),
  medical: P('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'),
  pet: P('<circle cx="12" cy="14" r="4"/><circle cx="6.5" cy="9" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="14" cy="6.5" r="2"/><circle cx="17.5" cy="9" r="2"/>'),
  shirt: P('<path d="M8 5 5 8l2 2 2-1v10h6V9l2 1 2-2-3-3-2 1h-2L8 5Z"/>'),
  phone: P('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
  wifi: P('<path d="M5 10.5a9 9 0 0 1 14 0"/><path d="M8 13.5a5 5 0 0 1 8 0"/><circle cx="12" cy="17.5" r="1.2"/>'),
  wallet: P('<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M16 14h3"/>'),
  bank: P('<path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 18h18M12 4 3 9h18L12 4Z"/>'),
  key: P('<circle cx="8" cy="12" r="3.5"/><path d="M11 12h10l-2 2 2 2"/>'),
  wrench: P('<path d="M15.5 5.5a4 4 0 0 0-5.3 5.3L5 16l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-3 3-2.5-2.5 3-3Z"/>'),
  camera: P('<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.2"/>'),
  map: P('<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>'),
  building: P('<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/>'),
  baby: P('<circle cx="12" cy="9" r="3.5"/><path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M9 9.5c0 0 .8-1.5 3-1.5s3 1.5 3 1.5"/>'),
  leaf: P('<path d="M5 14c0-5 4-9 11-9 0 7-4 11-11 9Z"/><path d="M8 14c2-2 5-4 9-5"/>'),
  pill: P('<path d="M9.5 4.5a4 4 0 0 1 5.7 5.7l-7 7A4 4 0 0 1 2.5 11.5l7-7Z"/><path d="M8 13.5 13.5 8"/>'),
  sun: P('<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
  umbrella: P('<path d="M12 12v7a2 2 0 0 0 4 0"/><path d="M4 12a8 8 0 0 1 16 0H4Z"/>'),
  star: P('<path d="M12 3.5 14.2 9l5.8.5-4.4 3.7 1.4 5.6L12 15.8 6.9 18.8l1.4-5.6L4 9.5 9.8 9 12 3.5Z"/>'),
  zap: P('<path d="M13 3 5 14h7l-1 7 8-11h-7l1-7Z"/>'),
  smile: P('<circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 14.5S10 16.5 12 16.5s3.5-2 3.5-2"/>'),
  scissors: P('<circle cx="7" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><path d="M9 8.5 20 18M9 15.5 20 6"/>'),
  tree: P('<path d="M12 21v-6"/><path d="M12 15c-3.5 0-6-2-6-5 0 0 2.5.5 4-.5C9 6 11 4 12 4s3 2 2 5.5c1.5 1 4 .5 4 .5 0 3-2.5 5-6 5Z"/>'),
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
  { id: "groceries", name: "Groceries", color: "#5E9022", icon: "cart", fixed: false, oneOff: false },
  { id: "eating", name: "Eating out", color: "#D2582E", icon: "food", fixed: false, oneOff: false },
  { id: "transport", name: "Transport", color: "#2F82D6", icon: "bus", fixed: false, oneOff: false },
  { id: "trips", name: "Trips", color: "#1B9670", icon: "plane", fixed: false, oneOff: false },
  { id: "nightlife", name: "Nightlife", color: "#CB4E77", icon: "glass", fixed: false, oneOff: false },
  { id: "household", name: "Household", color: "#726D64", icon: "bucket", fixed: false, oneOff: false },
  /* Fixed spending */
  { id: "rent", name: "Rent", color: "#5B51C6", icon: "home", fixed: true, oneOff: false },
  { id: "subs", name: "Subscriptions", color: "#B06E14", icon: "refresh", fixed: true, oneOff: false },
  /* Unique / one-off (outside variable budget; in Analysis except weekend/weekday) */
  { id: "oneoffs", name: "Unique", color: "#9333EA", icon: "gift", fixed: false, oneOff: true },
];
const PICK_COLORS = [
  "#5B51C6", "#7C3AED", "#9333EA", "#2F82D6", "#0EA5E9", "#0891B2",
  "#1B9670", "#10B981", "#5E9022", "#84CC16", "#D2582E", "#F97316",
  "#E11D48", "#CB4E77", "#DB2777", "#B06E14", "#CA8A04", "#726D64",
  "#475569", "#0F766E",
];
const PICK_ICONS = [
  "cart", "food", "coffee", "glass", "bus", "car", "train", "bike", "fuel", "plane",
  "home", "building", "bucket", "shirt", "gift", "heart", "pet", "baby", "fitness", "medical",
  "pill", "game", "music", "film", "book", "camera", "phone", "wifi", "wallet", "bank",
  "key", "wrench", "calendar", "map", "leaf", "tree", "sun", "umbrella", "star", "zap",
  "smile", "scissors", "refresh", "lock", "chart", "list", "dots",
];
const ICON_NAME_HINTS = [
  { icon: "cart", words: ["grocer", "supermarket", "shop", "store", "market", "aldi", "coles", "woolworth"] },
  { icon: "food", words: ["eat", "food", "restaurant", "lunch", "dinner", "cafe", "meal", "takeaway", "dining"] },
  { icon: "coffee", words: ["coffee", "cafe", "tea", "barista"] },
  { icon: "glass", words: ["night", "bar", "drink", "beer", "wine", "pub", "club", "alcohol"] },
  { icon: "bus", words: ["transport", "transit", "bus", "tram", "opal", "ticket"] },
  { icon: "car", words: ["car", "uber", "taxi", "drive", "parking", "rego"] },
  { icon: "train", words: ["train", "rail", "metro", "subway"] },
  { icon: "bike", words: ["bike", "cycle", "scooter"] },
  { icon: "fuel", words: ["fuel", "petrol", "gas", "diesel"] },
  { icon: "plane", words: ["trip", "travel", "flight", "plane", "holiday", "vacation", "airbnb"] },
  { icon: "home", words: ["rent", "home", "house", "mortgage", "apartment"] },
  { icon: "building", words: ["office", "work", "cowork", "building"] },
  { icon: "bucket", words: ["house", "household", "cleaning", "laundry", "homeware"] },
  { icon: "shirt", words: ["cloth", "fashion", "apparel", "shoe", "wear"] },
  { icon: "gift", words: ["gift", "present", "birthday", "donate", "charity", "unique", "one-off", "oneoff", "shoes", "bag", "purchase"] },
  { icon: "heart", words: ["date", "love", "wedding", "partner"] },
  { icon: "pet", words: ["pet", "dog", "cat", "vet", "animal"] },
  { icon: "baby", words: ["baby", "kid", "child", "daycare", "school"] },
  { icon: "fitness", words: ["gym", "fitness", "sport", "yoga", "workout"] },
  { icon: "medical", words: ["health", "doctor", "hospital", "dental", "medical", "clinic"] },
  { icon: "pill", words: ["pharmacy", "medicine", "chemist", "drug"] },
  { icon: "game", words: ["game", "gaming", "playstation", "xbox", "steam"] },
  { icon: "music", words: ["music", "spotify", "concert", "festival"] },
  { icon: "film", words: ["movie", "film", "cinema", "netflix", "disney", "streaming"] },
  { icon: "book", words: ["book", "education", "course", "study", "uni", "university"] },
  { icon: "camera", words: ["photo", "camera", "picture"] },
  { icon: "phone", words: ["phone", "mobile", "telstra", "optus", "vodafone"] },
  { icon: "wifi", words: ["internet", "wifi", "nbn", "broadband"] },
  { icon: "wallet", words: ["cash", "atm", "wallet", "pocket"] },
  { icon: "bank", words: ["bank", "fee", "transfer", "finance", "insurance"] },
  { icon: "key", words: ["key", "locksmith", "security"] },
  { icon: "wrench", words: ["repair", "maintenance", "fix", "tool", "service"] },
  { icon: "calendar", words: ["event", "ticket", "booking", "appointment"] },
  { icon: "map", words: ["map", "tour", "sightseeing"] },
  { icon: "leaf", words: ["garden", "plant", "green", "organic"] },
  { icon: "tree", words: ["park", "nature", "outdoor", "camp"] },
  { icon: "sun", words: ["summer", "beach", "holiday sun"] },
  { icon: "umbrella", words: ["rain", "weather", "insurance"] },
  { icon: "star", words: ["fun", "hobby", "misc", "other"] },
  { icon: "zap", words: ["power", "electric", "energy", "utility", "utilities"] },
  { icon: "smile", words: ["fun", "leisure", "entertainment"] },
  { icon: "scissors", words: ["hair", "salon", "barber", "beauty", "cut"] },
  { icon: "refresh", words: ["sub", "subscription", "membership", "recurring"] },
  { icon: "lock", words: ["fixed", "secure"] },
];
let categories = DEFAULT_CATS.map((c) => ({ ...c }));
const catById = (id) =>
  categories.find((c) => c.id === id) || {
    id,
    name: "Other",
    color: "#726D64",
    icon: "dots",
    fixed: false,
    oneOff: false,
  };

function normalizeCat(c) {
  const oneOff = !!c.oneOff;
  return {
    ...c,
    oneOff,
    fixed: oneOff ? false : !!c.fixed,
  };
}

function catKind(c) {
  if (c?.oneOff) return "unique";
  if (c?.fixed) return "fixed";
  return "variable";
}

function isVariableCat(c) {
  return catKind(c) === "variable";
}
function isFixedCat(c) {
  return catKind(c) === "fixed";
}
function isOneOffCat(c) {
  return catKind(c) === "unique";
}

/** Ensure the Unique one-off category exists (for existing accounts). */
function ensureUniqueCategory(list) {
  const cats = list.map(normalizeCat);
  if (cats.some((c) => c.oneOff || c.id === "oneoffs")) return cats;
  cats.push({
    id: "oneoffs",
    name: "Unique",
    color: "#9333EA",
    icon: "gift",
    fixed: false,
    oneOff: true,
  });
  return cats;
}

const DEFAULT_VARIABLE_BUDGET = 1000;
let variableBudget = DEFAULT_VARIABLE_BUDGET;
/** @type {{ id: string|null, isNew: boolean, kind: 'variable'|'fixed'|'unique', name: string, color: string, icon: string, iconLocked: boolean } | null} */
let catEditor = null;

let uid = 1;
const nid = () => "e" + uid++;

let expenses = [];

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
  return DEFAULT_CATS.map((c) => normalizeCat(c));
}

async function loadCategories(userId) {
  if (!userId) {
    categories = cloneDefaultCategories();
    return;
  }

  const local = readLocalCategories(userId);
  if (local?.length) {
    categories = ensureUniqueCategory(local);
    const groceriesLocal = categories.find((c) => c.id === "groceries");
    if (groceriesLocal?.fixed) groceriesLocal.fixed = false;
  }

  if (!window.SpendCategories?.isEnabled()) {
    if (!categories.length) categories = cloneDefaultCategories();
    else writeLocalCategories(userId, categories);
    return;
  }

  try {
    let list = await window.SpendCategories.fetchAll(userId);
    let dirty = false;
    if (!list.length) {
      list = cloneDefaultCategories();
      dirty = true;
    }
    const hadUnique = list.some((c) => c.oneOff || c.id === "oneoffs");
    categories = ensureUniqueCategory(list.map((c) => normalizeCat(c)));
    if (!hadUnique && categories.some((c) => c.oneOff)) dirty = true;
    const groceries = categories.find((c) => c.id === "groceries");
    if (groceries?.fixed) {
      groceries.fixed = false;
      dirty = true;
    }
    if (dirty) await window.SpendCategories.saveAll(userId, categories);
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

async function hydrateExpenses() {
  if (!useCloud()) {
    expenses = [];
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
}

function pendingCount() {
  if (!useCloud()) return 0;
  return expenses.filter(isPendingExpense).length;
}

function refreshSyncStatus() {
  const el = document.getElementById("syncStatus");
  if (!el) return;

  if (!useCloud() || !currentUser) {
    el.hidden = true;
    return;
  }

  const n = pendingCount();
  const offline = !isOnline();

  if (!n && !offline) {
    el.hidden = true;
    el.className = "sync-status";
    el.textContent = "";
    return;
  }

  el.hidden = false;
  if (n && offline) {
    el.className = "sync-status warn";
    el.textContent =
      n === 1
        ? "1 unsynced expense · you're offline"
        : n + " unsynced expenses · you're offline";
  } else if (n) {
    el.className = "sync-status";
    el.textContent =
      n === 1
        ? "1 unsynced expense · will sync when possible"
        : n + " unsynced expenses · will sync when possible";
  } else {
    el.className = "sync-status";
    el.textContent = "You're offline — new saves stay on this device";
  }
}

function offlineSaveToast() {
  const n = pendingCount();
  const waiting =
    n <= 1 ? "It will sync when you're back online." : n + " expenses waiting to sync.";
  showToast("Saved on this device. " + waiting);
  refreshSyncStatus();
}

function wireOnlineSync() {
  if (wireOnlineSync._done) return;
  wireOnlineSync._done = true;

  window.addEventListener("online", () => {
    refreshSyncStatus();
    if (!useCloud()) return;
    void (async () => {
      const synced = await syncPendingToCloud();
      if (synced) {
        await refreshFromCloud();
        showToast("All caught up — offline expenses synced.");
        if (currentScreen === "home") renderHome();
        if (currentScreen === "list") renderList();
        if (currentScreen === "analyse") renderAnalyse();
      }
      refreshSyncStatus();
    })();
  });

  window.addEventListener("offline", () => {
    refreshSyncStatus();
    if (useCloud()) showToast("You're offline. Changes will sync later.");
  });
}

let confirmResolver = null;

function askConfirm({ title, body, confirmLabel = "Delete" }) {
  const dialog = document.getElementById("confirmDialog");
  const titleEl = document.getElementById("confirmTitle");
  const bodyEl = document.getElementById("confirmBody");
  const okBtn = document.getElementById("confirmOk");
  if (!dialog || !titleEl || !bodyEl || !okBtn) return Promise.resolve(false);

  titleEl.textContent = title;
  bodyEl.textContent = body;
  okBtn.textContent = confirmLabel;

  dialog.hidden = false;
  okBtn.focus();

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirm(result) {
  const dialog = document.getElementById("confirmDialog");
  if (dialog) dialog.hidden = true;
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(!!result);
  }
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
function expenseInViewMonth(e) {
  const d = new Date(e.date);
  return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
}
function isCurrentViewMonth() {
  const n = new Date();
  return viewMonth.getFullYear() === n.getFullYear() && viewMonth.getMonth() === n.getMonth();
}
function viewMonthLabel() {
  return viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
function matchesListQuery(e, q) {
  if (!q) return true;
  const c = catById(e.cat);
  const hay = `${e.note || ""} ${c.name}`.toLowerCase();
  return hay.includes(q);
}
function syncMonthSwitcher(which) {
  const map = {
    home: { label: "monthLabel", prev: "monthPrev", next: "monthNext" },
    list: { label: "listMonthLabel", prev: "listMonthPrev", next: "listMonthNext" },
    analyse: { label: "analyseMonthLabel", prev: "analyseMonthPrev", next: "analyseMonthNext" },
  };
  const ids = map[which] || map.home;
  const label = document.getElementById(ids.label);
  const prev = document.getElementById(ids.prev);
  const next = document.getElementById(ids.next);
  if (label) label.textContent = viewMonthLabel();
  if (prev) prev.disabled = false;
  if (next) next.disabled = isCurrentViewMonth();
}
function refreshViewMonthScreens() {
  if (currentScreen === "home") renderHome();
  else if (currentScreen === "list") renderList();
  else if (currentScreen === "analyse") renderAnalyse();
  else {
    syncMonthSwitcher("home");
    syncMonthSwitcher("list");
    syncMonthSwitcher("analyse");
  }
  void window.SpendRates.ensureForDate(viewMonth).then((updated) => {
    if (!updated) return;
    if (currentScreen === "home") renderHome();
    if (currentScreen === "list") renderList();
    if (currentScreen === "analyse") renderAnalyse();
  });
}
function shiftViewMonth(delta) {
  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  if (next > current) return;
  viewMonth = next;
  openRow = null;
  refreshViewMonthScreens();
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
let listQuery = "";
let openRow = null;
let editingId = null;
let appReady = false;
let enterAppRunning = false;
const now = new Date();
let viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const draft = { amount: 0, cat: null, note: "", day: todayStr() };

/* ---------- HOME ---------- */
function renderHome() {
  syncMonthSwitcher("home");

  const month = expenses.filter(expenseInViewMonth);
  const total = month.reduce((s, e) => s + e.amount, 0);
  const fixed = month
    .filter((e) => isFixedCat(catById(e.cat)))
    .reduce((s, e) => s + e.amount, 0);
  const oneOff = month
    .filter((e) => isOneOffCat(catById(e.cat)))
    .reduce((s, e) => s + e.amount, 0);
  const variable = total - fixed - oneOff;
  const left = variableBudget - variable;
  const pct = Math.min(100, Math.round((variable / variableBudget) * 100));
  const over = variable > variableBudget;

  const byCat = categories
    .filter((c) => !isOneOffCat(c))
    .map((c) => ({
      c,
      sum: month.filter((e) => e.cat === c.id).reduce((s, e) => s + e.amount, 0),
    }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum);
  const fixedNames = categories
    .filter((c) => isFixedCat(c) && month.some((e) => e.cat === c.id))
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
        ${
          oneOff > 0
            ? `<div class="budgetrow">
          <span class="budgetlbl"><span class="icon" data-ico="gift"></span> Unique</span>
          <span class="budgetmid tabular">${money(oneOff)}</span>
          <span class="budgetmeta">Outside budget</span>
        </div>`
            : ""
        }
      </div>
    </div>
    <button class="addbtn" data-nav="add"><span class="icon" data-ico="plus"></span>Add expense</button>
    <div class="sectlabel">Where it's going</div>
    ${
      catCards
        ? `<div class="catgrid">${catCards}</div>`
        : `<div class="empty empty--section">No spending to break down yet.</div>`
    }
    <div class="sectlabel">Recent <a data-nav="list" aria-label="See all">See all <span class="icon" style="width:16px;height:16px" data-ico="chevron"></span></a></div>
    <div class="rows">${recentRows}</div>
  `;
  paintIcons(document.getElementById("screen-home"));
  paintIcons(document.getElementById("monthSwitcher"));
}

/* ---------- LIST ---------- */
function renderFilters() {
  const monthItems = expenses.filter(expenseInViewMonth);
  const used = categories.filter((c) => monthItems.some((e) => e.cat === c.id));
  if (filter !== "all" && !used.some((c) => c.id === filter)) filter = "all";
  const chips = [{ id: "all", name: "All" }, ...used];
  document.getElementById("filterChips").innerHTML = chips
    .map((c) => `<button class="chip ${filter === c.id ? "active" : ""}" data-filter="${c.id}">${c.name}</button>`)
    .join("");
}
function renderList() {
  syncMonthSwitcher("list");
  paintIcons(document.getElementById("listMonthSwitcher"));
  paintIcons(document.getElementById("listSearch")?.parentElement);

  const searchEl = document.getElementById("listSearch");
  if (searchEl && searchEl.value !== listQuery) searchEl.value = listQuery;

  renderFilters();
  const q = listQuery.trim().toLowerCase();
  const monthItems = expenses.filter(expenseInViewMonth);
  let items = monthItems;
  if (filter !== "all") items = items.filter((e) => e.cat === filter);
  if (q) items = items.filter((e) => matchesListQuery(e, q));
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  const el = document.getElementById("listScroll");
  if (!items.length) {
    const monthName = viewMonth.toLocaleDateString("en-GB", { month: "long" });
    let emptyMsg = `Nothing in ${monthName} yet. Tap Add to log an expense.`;
    if (monthItems.length && (q || filter !== "all")) {
      emptyMsg = q ? "No expenses match your search." : "No expenses in this category.";
    }
    el.innerHTML = `<div class="empty">${emptyMsg}</div>`;
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
    const pending =
      useCloud() && isPendingExpense(e)
        ? ` <span class="row-pending">· Unsynced</span>`
        : "";
    html += `
      <div class="rowwrap list-row ${openRow === e.id ? "open" : ""}" data-row="${e.id}">
        <div class="actions">
          <button class="act edit" data-edit="${e.id}"><span class="icon" data-ico="edit"></span>Edit</button>
          <button class="act del" data-del="${e.id}"><span class="icon" data-ico="trash"></span>Delete</button>
        </div>
        <div class="row">
          <div class="badge" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></div>
          <div class="rmid"><div class="t">${e.note || c.name}</div><div class="s">${c.name}${pending}</div></div>
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
        offlineSaveToast();
      } else {
        Object.assign(e, payload);
        save();
      }
      editingId = null;
      showScreen("list");
      renderHome();
      refreshSyncStatus();
    } else {
      if (useCloud() && isOnline()) {
        const created = await window.SpendData.insert(currentUser.id, payload);
        expenses.push(created);
        save();
      } else if (useCloud()) {
        expenses.push(Object.assign({ id: makeLocalId(), _pending: true }, payload));
        save();
        offlineSaveToast();
      } else {
        expenses.push(Object.assign({ id: nid() }, payload));
        save();
      }
      showScreen("home");
      renderHome();
      renderList();
      refreshSyncStatus();
    }
  } catch (err) {
    showToast(err.message || "Could not save expense. Check your connection.");
  } finally {
    refreshSave();
  }
}

function deleteConfirmCopy(e) {
  const c = catById(e.cat);
  const label = e.note || c.name;
  const amount = money(e.amount);
  return {
    title: "Delete this expense?",
    body: `${label} · ${amount}. This can’t be undone.`,
  };
}

async function requestDeleteExpense(id) {
  const e = expenses.find((x) => x.id === id);
  if (!e) return;
  const copy = deleteConfirmCopy(e);
  const ok = await askConfirm({
    title: copy.title,
    body: copy.body,
    confirmLabel: "Delete",
  });
  if (!ok) {
    openRow = null;
    renderList();
    return;
  }
  await deleteExpense(id);
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
    refreshSyncStatus();
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
  const map = {
    home: "screen-home",
    list: "screen-list",
    analyse: "screen-analyse",
    more: "screen-stub",
  };
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(map[name]).classList.add("active");
  setNav(name);
  if (name === "home") renderHome();
  if (name === "list") renderList();
  if (name === "analyse") renderAnalyse();
  if (name === "more") renderMore();
}

function expensesInMonthDate(monthDate) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

function sumAmounts(items) {
  return items.reduce((s, e) => s + e.amount, 0);
}

function catBreakdownFor(items) {
  return categories
    .map((c) => ({
      c,
      sum: sumAmounts(items.filter((e) => e.cat === c.id)),
    }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum);
}

function analyseMonthStats(monthDate) {
  const items = expensesInMonthDate(monthDate);
  const variableItems = items.filter((e) => isVariableCat(catById(e.cat)));
  const fixedItems = items.filter((e) => isFixedCat(catById(e.cat)));
  const oneOffItems = items.filter((e) => isOneOffCat(catById(e.cat)));
  const variable = sumAmounts(variableItems);
  const fixed = sumAmounts(fixedItems);
  const oneOff = sumAmounts(oneOffItems);
  return {
    items,
    variableItems,
    fixedItems,
    oneOffItems,
    total: variable + fixed + oneOff,
    variable,
    fixed,
    oneOff,
    byCatAll: catBreakdownFor(items),
  };
}

function isWeekendDate(iso) {
  const day = new Date(iso).getDay();
  return day === 0 || day === 6;
}

function fmtDelta(n) {
  const abs = money(Math.abs(n));
  if (n > 0.009) return "+" + abs;
  if (n < -0.009) return "−" + abs;
  return money(0);
}

/** Neutral highlight lines — full spend; weekend note uses variable only. */
function buildAnalyseHighlights(cur, prev) {
  const lines = [];
  const top = cur.byCatAll[0];
  if (top && cur.total > 0) {
    const pct = Math.round((top.sum / cur.total) * 100);
    lines.push(
      `<strong>${esc(top.c.name)}</strong> is ${pct}% of spend (${money(top.sum)}).`,
    );
  }

  if (cur.total > 0) {
    const bits = [
      `<strong>${Math.round((cur.variable / cur.total) * 100)}% variable</strong> (${money(cur.variable)})`,
      `<strong>${Math.round((cur.fixed / cur.total) * 100)}% fixed</strong> (${money(cur.fixed)})`,
    ];
    if (cur.oneOff > 0) {
      bits.push(
        `<strong>${Math.round((cur.oneOff / cur.total) * 100)}% unique</strong> (${money(cur.oneOff)})`,
      );
    }
    lines.push(bits.join(" · ") + ".");
  }

  if (prev.items.length || cur.items.length) {
    const diff = cur.total - prev.total;
    if (Math.abs(diff) >= 1) {
      lines.push(`Total spend is <strong>${fmtDelta(diff)}</strong> vs last month.`);
    }
  }

  const weekend = sumAmounts(cur.variableItems.filter((e) => isWeekendDate(e.date)));
  const weekday = cur.variable - weekend;
  if (cur.variable > 0 && Math.abs(weekend - weekday) >= 1) {
    const heavier = weekend > weekday ? "Weekends" : "Weekdays";
    lines.push(
      `<strong>${heavier}</strong> account for more variable spend this month.`,
    );
  }

  return lines.slice(0, 3);
}

function moneyCompact(n) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "$" + Math.round(n);
}

/** Multi-segment donut for category share of total spend. */
function svgCategoryDonut(rows, total) {
  if (total <= 0 || !rows.length) return "";
  const r = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = rows
    .map(({ c, sum }) => {
      const len = (sum / total) * circ;
      const el = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${c.color}" stroke-width="14"
        stroke-dasharray="${len.toFixed(2)} ${circ.toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 50 50)"/>`;
      offset += len;
      return el;
    })
    .join("");
  return `<svg class="an-donut" viewBox="0 0 100 100" aria-hidden="true">
    <circle class="an-donut-track" cx="50" cy="50" r="${r}" fill="none" stroke-width="14"/>
    ${segments}
    <text x="50" y="47" text-anchor="middle" class="an-donut-total tabular">${moneyCompact(total)}</text>
    <text x="50" y="61" text-anchor="middle" class="an-donut-sub">total</text>
  </svg>`;
}

function renderSplitChartRows(variable, fixed, oneOff, total) {
  const rows = [
    { name: "Variable", color: "#0F766E", icon: "chart", sum: variable },
    { name: "Fixed", color: "#5B51C6", icon: "lock", sum: fixed },
    { name: "Unique", color: "#9333EA", icon: "gift", sum: oneOff },
  ].filter((r) => r.sum > 0);
  if (!rows.length) return `<div class="an-meta">Nothing to show.</div>`;
  const max = Math.max(...rows.map((r) => r.sum), 1);
  return rows
    .map((r) => {
      const pct = total > 0 ? Math.round((r.sum / total) * 100) : 0;
      const bar = Math.round((r.sum / max) * 100);
      return `<div class="an-catrow">
        <div class="an-catdot" style="background:${r.color}"><span class="icon" data-ico="${r.icon}"></span></div>
        <div class="an-catname">${r.name}</div>
        <div>
          <div class="an-catamt tabular">${money(r.sum)}</div>
          <div class="an-catpct tabular">${pct}%</div>
        </div>
        <div class="an-catbarwrap"><i style="width:${bar}%;background:${r.color}"></i></div>
      </div>`;
    })
    .join("");
}

function renderCategoryLegend(rows, total) {
  return rows
    .map(({ c, sum }) => {
      const pct = total > 0 ? Math.round((sum / total) * 100) : 0;
      return `<div class="an-legend-row">
        <span class="an-swatch" style="background:${c.color}"></span>
        <span class="an-legend-name">${esc(c.name)}</span>
        <span class="tabular">${money(sum)} · ${pct}%</span>
      </div>`;
    })
    .join("");
}

function renderAnalyse() {
  syncMonthSwitcher("analyse");
  paintIcons(document.getElementById("analyseMonthSwitcher"));

  const el = document.getElementById("analyseScroll");
  if (!el) return;

  const cur = analyseMonthStats(viewMonth);
  const prevMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  const prev = analyseMonthStats(prevMonth);

  if (!cur.items.length) {
    el.innerHTML = `<div class="an-empty">No expenses in ${esc(
      viewMonth.toLocaleDateString("en-GB", { month: "long" }),
    )} yet.<br>Log a few to see insights.</div>`;
    return;
  }

  const highlights = buildAnalyseHighlights(cur, prev);
  const highlightsHtml = highlights.length
    ? `<div class="an-card"><div class="an-kicker">Highlights</div><div class="an-highlights">${highlights
        .map((h) => `<div class="an-highlight">${h}</div>`)
        .join("")}</div></div>`
    : "";

  const varDiff = cur.variable - prev.variable;
  const fixDiff = cur.fixed - prev.fixed;
  const oneOffDiff = cur.oneOff - prev.oneOff;
  const totDiff = cur.total - prev.total;
  const showUniqueMom = cur.oneOff > 0 || prev.oneOff > 0;
  const momMax = Math.max(
    cur.variable,
    prev.variable,
    cur.fixed,
    prev.fixed,
    cur.oneOff,
    prev.oneOff,
    1,
  );

  const prevById = new Map(prev.byCatAll.map((x) => [x.c.id, x.sum]));
  const movers = cur.byCatAll
    .map(({ c, sum }) => ({ c, sum, diff: sum - (prevById.get(c.id) || 0) }))
    .filter((x) => Math.abs(x.diff) >= 1)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 2);
  const moversHtml = movers.length
    ? `<div class="an-movers">${movers
        .map(
          (m) =>
            `<div class="an-mover"><span class="an-mover-name">${esc(m.c.name)}</span><span class="an-mover-delta tabular">${fmtDelta(m.diff)}</span></div>`,
        )
        .join("")}</div>`
    : "";

  /* Weekend/weekday uses variable only — Unique one-offs would skew the pattern. */
  const weekendItems = cur.variableItems.filter((e) => isWeekendDate(e.date));
  const weekdayItems = cur.variableItems.filter((e) => !isWeekendDate(e.date));
  const weekendSum = sumAmounts(weekendItems);
  const weekdaySum = sumAmounts(weekdayItems);
  const weekendDays = new Set(weekendItems.map((e) => isoDay(new Date(e.date)))).size || 1;
  const weekdayDays = new Set(weekdayItems.map((e) => isoDay(new Date(e.date)))).size || 1;
  const splitMax = Math.max(weekendSum, weekdaySum, 1);

  const whereBody = cur.total
    ? `<div class="an-donut-wrap">
        ${svgCategoryDonut(cur.byCatAll, cur.total)}
        <div class="an-legend">
          ${renderCategoryLegend(cur.byCatAll, cur.total)}
        </div>
      </div>`
    : `<div class="an-meta">Nothing to show.</div>`;

  const uniqueMomCol = showUniqueMom
    ? `<div class="an-mom-col">
          <div class="an-mom-bars">
            <div class="an-mom-bar prev" style="height:${Math.round((prev.oneOff / momMax) * 100)}%"></div>
            <div class="an-mom-bar cur" style="height:${Math.round((cur.oneOff / momMax) * 100)}%;background:#9333EA"></div>
          </div>
          <div class="an-mom-col-lbl">Unique</div>
        </div>`
    : "";

  const uniqueMomCell = showUniqueMom
    ? `<div class="an-momcell">
          <div class="an-momlbl">Unique</div>
          <div class="an-momval tabular">${money(cur.oneOff)}</div>
          <div class="an-momdelta">${prev.items.length || cur.oneOff ? fmtDelta(oneOffDiff) : "—"} vs prior</div>
        </div>`
    : "";

  el.innerHTML = `
    ${highlightsHtml}
    <div class="an-card">
      <div class="an-kicker">Where it went</div>
      ${whereBody}
    </div>
    <div class="an-card">
      <div class="an-kicker">By type</div>
      ${renderSplitChartRows(cur.variable, cur.fixed, cur.oneOff, cur.total)}
    </div>
    <div class="an-card">
      <div class="an-kicker">vs last month</div>
      <div class="an-mom-chart" aria-hidden="true">
        <div class="an-mom-col">
          <div class="an-mom-bars">
            <div class="an-mom-bar prev" style="height:${Math.round((prev.variable / momMax) * 100)}%"></div>
            <div class="an-mom-bar cur" style="height:${Math.round((cur.variable / momMax) * 100)}%"></div>
          </div>
          <div class="an-mom-col-lbl">Variable</div>
        </div>
        <div class="an-mom-col">
          <div class="an-mom-bars">
            <div class="an-mom-bar prev" style="height:${Math.round((prev.fixed / momMax) * 100)}%"></div>
            <div class="an-mom-bar cur fixed" style="height:${Math.round((cur.fixed / momMax) * 100)}%"></div>
          </div>
          <div class="an-mom-col-lbl">Fixed</div>
        </div>
        ${uniqueMomCol}
      </div>
      <div class="an-mom-legend"><span><i class="prev"></i> Last month</span><span><i class="cur"></i> This month</span></div>
      <div class="an-mom">
        <div class="an-momcell">
          <div class="an-momlbl">Variable</div>
          <div class="an-momval tabular">${money(cur.variable)}</div>
          <div class="an-momdelta">${prev.items.length || cur.variable ? fmtDelta(varDiff) : "—"} vs prior</div>
        </div>
        <div class="an-momcell">
          <div class="an-momlbl">Fixed</div>
          <div class="an-momval tabular">${money(cur.fixed)}</div>
          <div class="an-momdelta">${prev.items.length || cur.fixed ? fmtDelta(fixDiff) : "—"} vs prior</div>
        </div>
        ${uniqueMomCell}
        <div class="an-momcell an-momcell--wide">
          <div class="an-momlbl">Total</div>
          <div class="an-momval tabular">${money(cur.total)}</div>
          <div class="an-momdelta">${prev.items.length || cur.total ? fmtDelta(totDiff) : "—"} vs prior</div>
        </div>
      </div>
      ${moversHtml}
    </div>
    <div class="an-card">
      <div class="an-kicker">Weekend vs weekday</div>
      <div class="an-hchart">
        <div class="an-hchart-row">
          <div class="an-hchart-lbl">Weekends</div>
          <div class="an-hchart-track"><i style="width:${Math.round((weekendSum / splitMax) * 100)}%"></i></div>
          <div class="an-hchart-val tabular">${money(weekendSum)}</div>
        </div>
        <div class="an-hchart-row">
          <div class="an-hchart-lbl">Weekdays</div>
          <div class="an-hchart-track"><i class="weekday" style="width:${Math.round((weekdaySum / splitMax) * 100)}%"></i></div>
          <div class="an-hchart-val tabular">${money(weekdaySum)}</div>
        </div>
      </div>
      <div class="an-split">
        <div class="an-splitcell">
          <div class="an-splitlbl">Weekend avg</div>
          <div class="an-splitval tabular">${money(weekendSum / weekendDays)}</div>
          <div class="an-splitmeta">per active day</div>
        </div>
        <div class="an-splitcell">
          <div class="an-splitlbl">Weekday avg</div>
          <div class="an-splitval tabular">${money(weekdaySum / weekdayDays)}</div>
          <div class="an-splitmeta">per active day</div>
        </div>
      </div>
      ${
        cur.oneOff > 0
          ? `<div class="an-meta">Variable spend only — Unique ${money(cur.oneOff)} left out of this comparison.</div>`
          : ""
      }
    </div>
  `;
  paintIcons(el);
}

function suggestIconForName(name) {
  const q = String(name || "").toLowerCase().trim();
  if (!q) return "dots";
  let best = null;
  let bestLen = 0;
  for (const hint of ICON_NAME_HINTS) {
    for (const w of hint.words) {
      if (q.includes(w) && w.length > bestLen) {
        best = hint.icon;
        bestLen = w.length;
      }
    }
  }
  return best || "star";
}

function nextSuggestedColor() {
  const used = new Set(categories.map((c) => c.color));
  return PICK_COLORS.find((c) => !used.has(c)) || PICK_COLORS[categories.length % PICK_COLORS.length];
}

function setIconEl(el, ico) {
  if (!el) return;
  el.dataset.ico = ico;
  delete el.dataset.done;
  el.innerHTML = ICONS[ico] || "";
  el.classList.add("icon");
  el.dataset.done = "1";
}

function renderCategoryRow(c) {
  const kind = catKind(c);
  const tag =
    kind === "fixed"
      ? '<span class="catlist-tag">Fixed</span>'
      : kind === "unique"
        ? '<span class="catlist-tag catlist-tag--unique">Unique</span>'
        : "";
  return `<button type="button" class="catlist-row" data-edit-cat="${esc(c.id)}">
      <span class="catlist-dot" style="background:${c.color}"><span class="icon" data-ico="${c.icon}"></span></span>
      <span class="catlist-name">${esc(c.name)}</span>
      ${tag}
      <span class="icon catlist-chev" data-ico="chevronRight"></span>
    </button>`;
}

function renderCategoriesSection() {
  const variable = categories.filter((c) => isVariableCat(c));
  const fixed = categories.filter((c) => isFixedCat(c));
  const unique = categories.filter((c) => isOneOffCat(c));
  const varRows =
    variable.map(renderCategoryRow).join("") ||
    `<div class="catlist-empty">No variable categories yet.</div>`;
  const fixRows =
    fixed.map(renderCategoryRow).join("") ||
    `<div class="catlist-empty">No fixed categories yet.</div>`;
  const uniqueRows =
    unique.map(renderCategoryRow).join("") ||
    `<div class="catlist-empty">No unique categories yet.</div>`;
  return `<div class="catlist">
    <button type="button" class="catlist-addbtn" data-add-cat="variable">
      <span class="icon" data-ico="plus"></span>Add category
    </button>
    <div class="catlist-group">
      <div class="catlist-label">Variable</div>
      <div class="catlist-rows">${varRows}</div>
    </div>
    <div class="catlist-group">
      <div class="catlist-label">Fixed</div>
      <div class="catlist-rows">${fixRows}</div>
    </div>
    <div class="catlist-group">
      <div class="catlist-label">Unique</div>
      <p class="catlist-note">One-offs like shoes or bags — outside your variable budget; shown in Analysis except weekend vs weekday.</p>
      <div class="catlist-rows">${uniqueRows}</div>
    </div>
  </div>`;
}

function renderCatEditor() {
  if (!catEditor) return "";
  const { name, color, icon, kind, isNew } = catEditor;
  const colorBtns = PICK_COLORS.map(
    (col) =>
      `<button type="button" class="swatch ${color === col ? "on" : ""}" data-pick-color="${col}" style="background:${col}" aria-label="Colour ${col}"></button>`,
  ).join("");
  const iconBtns = PICK_ICONS.map(
    (ico) =>
      `<button type="button" class="ipick ${icon === ico ? "on" : ""}" data-pick-icon="${ico}" aria-label="Icon ${ico}"><span class="icon" data-ico="${ico}"></span></button>`,
  ).join("");
  const previewName = name.trim() || "Category name";
  return `<div class="cateditor" id="catEditor">
    <div class="cateditor-top">
      <div class="cateditor-title">${isNew ? "New category" : "Edit category"}</div>
      <button type="button" class="cateditor-close" id="catCancelBtn" aria-label="Close">
        <span class="icon" data-ico="x"></span>
      </button>
    </div>
    <div class="cat-preview" id="catPreview">
      <span class="cat-preview-dot" id="catPreviewDot" style="background:${color}">
        <span class="icon" id="catPreviewIcon" data-ico="${icon}"></span>
      </span>
      <span class="cat-preview-name" id="catPreviewName">${esc(previewName)}</span>
    </div>
    <div class="field">
      <div class="fl">Name</div>
      <input class="noteinput" id="catNameInput" value="${esc(name)}" placeholder="e.g. Coffee" autocomplete="off">
    </div>
    <div class="field">
      <div class="fl">Colour</div>
      <div class="swatches" id="colorPick">${colorBtns}</div>
    </div>
    <div class="field">
      <div class="fl">Icon ${isNew && !catEditor.iconLocked ? '<span class="fl-hint">suggested from name</span>' : ""}</div>
      <div class="iconpicks" id="iconPick">${iconBtns}</div>
    </div>
    <div class="cat-type cat-type--3" id="catTypePick" role="group" aria-label="Category type">
      <button type="button" class="cat-type-btn ${kind === "variable" ? "on" : ""}" data-cat-type="variable">Variable</button>
      <button type="button" class="cat-type-btn ${kind === "fixed" ? "on" : ""}" data-cat-type="fixed">Fixed</button>
      <button type="button" class="cat-type-btn ${kind === "unique" ? "on" : ""}" data-cat-type="unique">Unique</button>
    </div>
    <p class="cat-type-hint">${
      kind === "unique"
        ? "Outside your variable budget. Included in Analysis, but not weekend vs weekday."
        : kind === "fixed"
          ? "Fixed costs don’t count toward your variable spending limit."
          : "Counts toward your monthly variable budget."
    }</p>
    <div class="cateditor-actions">
      <button type="button" class="savebtn" id="catSaveBtn">${isNew ? "Add category" : "Save"}</button>
      ${isNew ? "" : '<button type="button" class="catdelbtn" id="catDeleteBtn">Delete</button>'}
    </div>
  </div>`;
}

function openCatEditor(id, kindDefault) {
  if (id) {
    const c = normalizeCat(catById(id));
    catEditor = {
      id: c.id,
      isNew: false,
      kind: catKind(c),
      name: c.name,
      color: c.color,
      icon: PICK_ICONS.includes(c.icon) ? c.icon : "dots",
      iconLocked: true,
    };
  } else {
    const kind =
      kindDefault === "fixed" || kindDefault === "unique" ? kindDefault : "variable";
    catEditor = {
      id: null,
      isNew: true,
      kind,
      name: "",
      color: nextSuggestedColor(),
      icon: kind === "unique" ? "gift" : "dots",
      iconLocked: kind === "unique",
    };
  }
  renderMore();
}

function closeCatEditor() {
  catEditor = null;
  renderMore();
}

function syncCatPreview() {
  if (!catEditor) return;
  const nameEl = document.getElementById("catPreviewName");
  const dot = document.getElementById("catPreviewDot");
  const ico = document.getElementById("catPreviewIcon");
  if (nameEl) nameEl.textContent = catEditor.name.trim() || "Category name";
  if (dot) dot.style.background = catEditor.color;
  setIconEl(ico, catEditor.icon);
}

function selectCatIcon(ico, { lock = false } = {}) {
  if (!catEditor || !PICK_ICONS.includes(ico)) return;
  catEditor.icon = ico;
  if (lock) catEditor.iconLocked = true;
  const panel = document.getElementById("stubContent");
  panel?.querySelectorAll("#iconPick .ipick").forEach((b) => {
    b.classList.toggle("on", b.dataset.pickIcon === ico);
  });
  const hint = panel?.querySelector(".fl-hint");
  if (hint && catEditor.iconLocked) hint.remove();
  syncCatPreview();
}

function readCatEditorForm() {
  const kind = catEditor?.kind || "variable";
  return {
    name: (catEditor?.name || "").trim(),
    kind,
    fixed: kind === "fixed",
    oneOff: kind === "unique",
    color: catEditor?.color || PICK_COLORS[0],
    icon: catEditor?.icon || "dots",
  };
}

function wireCatEditor() {
  const panel = document.getElementById("stubContent");
  if (!panel || !catEditor) return;

  panel.querySelector("#catSaveBtn")?.addEventListener("click", () => {
    void handleSaveCategory();
  });
  panel.querySelector("#catDeleteBtn")?.addEventListener("click", () => {
    void handleDeleteCategory();
  });
  panel.querySelector("#catCancelBtn")?.addEventListener("click", closeCatEditor);

  const nameInput = panel.querySelector("#catNameInput");
  nameInput?.addEventListener("input", (e) => {
    if (!catEditor) return;
    catEditor.name = e.target.value;
    if (catEditor.isNew && !catEditor.iconLocked) {
      selectCatIcon(suggestIconForName(catEditor.name), { lock: false });
    } else {
      syncCatPreview();
    }
  });

  panel.querySelector("#colorPick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-color]");
    if (!btn || !catEditor) return;
    catEditor.color = btn.dataset.pickColor;
    panel.querySelectorAll("#colorPick .swatch").forEach((b) => b.classList.toggle("on", b === btn));
    syncCatPreview();
  });

  panel.querySelector("#iconPick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-icon]");
    if (!btn) return;
    selectCatIcon(btn.dataset.pickIcon, { lock: true });
  });

  panel.querySelector("#catTypePick")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat-type]");
    if (!btn || !catEditor) return;
    catEditor.kind = btn.dataset.catType;
    panel.querySelectorAll("#catTypePick .cat-type-btn").forEach((b) => {
      b.classList.toggle("on", b === btn);
    });
    const hint = panel.querySelector(".cat-type-hint");
    if (hint) {
      hint.textContent =
        catEditor.kind === "unique"
          ? "One-offs stay out of your variable budget and don’t skew Analysis charts."
          : catEditor.kind === "fixed"
            ? "Fixed costs don’t count toward your variable spending limit."
            : "Counts toward your monthly variable budget.";
    }
  });
}

function wireMorePanel() {
  const panel = document.getElementById("stubContent");
  if (!panel || panel._wired) return;
  panel._wired = true;

  panel.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add-cat]");
    if (add) {
      openCatEditor(null, add.dataset.addCat || "variable");
      return;
    }
    const edit = e.target.closest("[data-edit-cat]");
    if (edit) {
      openCatEditor(edit.dataset.editCat);
    }
  });
}

async function handleSaveCategory() {
  const { name, fixed, oneOff, color, icon } = readCatEditorForm();
  if (!name) {
    showToast("Enter a category name.");
    return;
  }

  const btn = document.getElementById("catSaveBtn");
  if (btn) btn.disabled = true;
  try {
    if (catEditor.isNew) {
      categories.push(
        normalizeCat({ id: makeCatId(name), name, color, icon, fixed, oneOff }),
      );
    } else {
      const c = categories.find((x) => x.id === catEditor.id);
      if (!c) return;
      c.name = name;
      c.color = color;
      c.icon = icon;
      c.fixed = fixed;
      c.oneOff = oneOff;
      Object.assign(c, normalizeCat(c));
    }
    await persistCategories();
    catEditor = null;
    renderMore();
    if (currentScreen === "home") renderHome();
    if (currentScreen === "list") renderList();
    if (currentScreen === "analyse") renderAnalyse();
    showToast("Category saved.");
  } catch (err) {
    showToast(err.message || "Could not save category.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteCategoryById(id) {
  if (!id) return false;
  if (categoryInUse(id)) {
    showToast("Remove expenses from this category first.");
    return false;
  }
  if (categories.length <= 1) {
    showToast("Keep at least one category.");
    return false;
  }

  try {
    categories = categories.filter((c) => c.id !== id);
    await persistCategories();
    if (catEditor?.id === id) catEditor = null;
    renderMore();
    if (currentScreen === "home") renderHome();
    if (currentScreen === "list") renderList();
    if (currentScreen === "analyse") renderAnalyse();
    showToast("Category deleted.");
    return true;
  } catch (err) {
    showToast(err.message || "Could not delete category.");
    return false;
  }
}

async function handleDeleteCategory() {
  if (!catEditor || catEditor.isNew) return;
  await deleteCategoryById(catEditor.id);
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
        <p class="settings-hint">Tap a category to edit. Fixed and Unique stay out of your variable budget.</p>
        ${catEditor ? renderCatEditor() : renderCategoriesSection()}
      </div>
    `;
    document.getElementById("saveBudgetBtn")?.addEventListener("click", () => {
      void handleSaveBudget();
    });
    document.getElementById("budgetInput")?.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
    });
    document.getElementById("budgetInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSaveBudget();
      }
    });
    wireMorePanel();
    wireCatEditor();
    paintIcons(el);
    if (catEditor) {
      syncCatPreview();
      document.getElementById("catNameInput")?.focus();
    }
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
  refreshSyncStatus();
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
    refreshSyncStatus();
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

function setAuthToggleLabel(mode) {
  const btn = document.getElementById("authToggle");
  if (!btn) return;
  if (mode === "signin") {
    btn.innerHTML =
      '<span class="auth-toggle-lead">Need an account?</span>' +
      '<span class="auth-toggle-action">Sign up</span>';
  } else {
    btn.innerHTML =
      '<span class="auth-toggle-lead">Already have an account?</span>' +
      '<span class="auth-toggle-action">Sign in</span>';
  }
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("authSubmit").textContent = mode === "signin" ? "Sign in" : "Create account";
  setAuthToggleLabel(mode);
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
  const eye = document.getElementById("authPasswordToggle");
  if (eye) {
    eye.addEventListener("click", () => {
      const input = document.getElementById("authPassword");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      eye.setAttribute("aria-pressed", show ? "true" : "false");
      eye.setAttribute("aria-label", show ? "Hide password" : "Show password");
      const ico = eye.querySelector("[data-ico]");
      if (ico) {
        delete ico.dataset.done;
        ico.setAttribute("data-ico", show ? "eyeOff" : "eye");
        paintIcons(eye);
      }
    });
  }
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
    void requestDeleteExpense(del.dataset.del);
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
document.getElementById("listMonthPrev").addEventListener("click", () => shiftViewMonth(-1));
document.getElementById("listMonthNext").addEventListener("click", () => shiftViewMonth(1));
document.getElementById("analyseMonthPrev").addEventListener("click", () => shiftViewMonth(-1));
document.getElementById("analyseMonthNext").addEventListener("click", () => shiftViewMonth(1));
document.getElementById("listSearch").addEventListener("input", (e) => {
  listQuery = e.target.value;
  openRow = null;
  renderList();
});
document.getElementById("confirmOk").addEventListener("click", () => closeConfirm(true));
document.getElementById("confirmCancel").addEventListener("click", () => closeConfirm(false));
document.getElementById("confirmCancelBg").addEventListener("click", () => closeConfirm(false));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const dialog = document.getElementById("confirmDialog");
  if (dialog && !dialog.hidden) closeConfirm(false);
});
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
