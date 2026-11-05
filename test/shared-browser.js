"use strict";

/**
 * End-to-end check of shared groups against the real UI and ledger.
 * Supabase is stubbed in-memory; split math and settlement run in the page.
 *
 *   NODE_PATH=/tmp/pw/node_modules node test/shared-browser.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error("Install playwright-core first.");
  process.exit(1);
}

const ROOT = path.resolve(process.env.SPEND_ROOT || path.join(__dirname, ".."));
const CHROME = process.env.CHROME || chromium.executablePath();
const PORT = 8094;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const APP_URL = `${ORIGIN}/Cost-Tracking-Tool/`;
const SUPABASE = "https://wwzzyetczulvduucdhoz.supabase.co";
const STORAGE_KEY = "sb-wwzzyetczulvduucdhoz-auth-token";
const USER = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  email: "owner@example.com",
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { display_name: "Owner" },
};
const OUT = process.env.SPEND_SCREENSHOT_DIR || path.join("/opt/cursor/artifacts", "screenshots");

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const u = new URL(req.url, ORIGIN);
  if (!u.pathname.startsWith("/Cost-Tracking-Tool/")) {
    res.writeHead(404);
    return res.end();
  }
  let rel = decodeURIComponent(u.pathname.slice("/Cost-Tracking-Tool/".length)) || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    "content-type": TYPES[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-cache",
  });
  fs.createReadStream(file).pipe(res);
});

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeSession(expiresInSec) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const access_token = [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({ sub: USER.id, exp, role: "authenticated", email: USER.email, session_id: "s1" }),
    "sig",
  ].join(".");
  return {
    access_token,
    token_type: "bearer",
    expires_in: expiresInSec,
    expires_at: exp,
    refresh_token: "rt-" + crypto.randomUUID(),
    user: USER,
  };
}

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  };
}

function makeStore() {
  return { groups: [], members: [], expenses: [], shares: [], invites: [] };
}

function nestGroup(store, group) {
  return {
    ...group,
    shared_group_members: store.members.filter((m) => m.group_id === group.id),
    shared_expenses: store.expenses
      .filter((e) => e.group_id === group.id)
      .map((e) => ({
        ...e,
        shared_expense_shares: store.shares.filter((s) => s.expense_id === e.id),
      })),
    shared_invites: store.invites.filter((i) => i.group_id === group.id),
  };
}

function idEq(url) {
  const raw = url.searchParams.get("id") || "";
  const match = raw.match(/^eq\.(.+)$/);
  return match ? match[1] : null;
}

async function installMocks(context, store) {
  await context.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const method = req.method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors() });
    const accept = req.headers()["accept"] || "";
    const one = accept.includes("vnd.pgrst.object");
    const json = (status, body) =>
      route.fulfill({
        status,
        headers: { ...cors(), "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const body = () => {
      try {
        return JSON.parse(req.postData() || "{}");
      } catch {
        return {};
      }
    };

    if (u.pathname === "/auth/v1/token" && u.searchParams.get("grant_type") === "refresh_token") {
      return json(200, makeSession(3600));
    }
    if (u.pathname === "/auth/v1/user") return json(200, USER);
    if (u.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: cors() });

    if (u.pathname === "/rest/v1/user_settings") {
      if (method === "GET") return json(200, { variable_budget: 1000, currency: "AUD" });
      return json(200, { variable_budget: 1000, currency: "AUD" });
    }
    if (u.pathname === "/rest/v1/expenses") {
      if (method === "GET") return json(200, []);
      return json(201, {});
    }
    if (u.pathname === "/rest/v1/categories") {
      if (method === "GET") return json(200, []);
      if (method === "DELETE") return route.fulfill({ status: 204, headers: cors() });
      return json(201, []);
    }
    if (u.pathname === "/rest/v1/fx_rates") {
      return json(200, [
        { month_key: "2026-11", eur_to_aud: 1.6, fetched_at: "2026-11-01T00:00:00.000Z" },
      ]);
    }

    if (u.pathname === "/rest/v1/rpc/spend_write_shared_expense" && method === "POST") {
      const row = body();
      const id = row.p_expense_id || crypto.randomUUID();
      const next = {
        id,
        group_id: row.p_group_id,
        title: String(row.p_title || "").trim(),
        amount: row.p_amount,
        currency: row.p_currency,
        fx_rate: row.p_fx_rate,
        paid_by: row.p_paid_by,
        split_mode: row.p_split_mode,
        kind: row.p_kind,
        expense_date: row.p_expense_date,
        created_by: USER.id,
      };
      if (row.p_expense_id) {
        const existing = store.expenses.find((e) => e.id === id);
        if (!existing) return json(404, { message: "Expense not found" });
        next.group_id = existing.group_id;
        Object.assign(existing, next);
        store.shares = store.shares.filter((s) => s.expense_id !== id);
      } else {
        store.expenses.push(next);
      }
      (row.p_shares || []).forEach((share) => {
        store.shares.push({
          expense_id: id,
          member_id: share.member_id,
          shares: share.shares,
        });
      });
      return json(200, id);
    }

    if (u.pathname === "/rest/v1/shared_groups") {
      if (method === "GET") {
        const rows = [...store.groups]
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map((g) => nestGroup(store, g));
        return json(200, rows);
      }
      if (method === "POST") {
        const row = body();
        const saved = {
          id: crypto.randomUUID(),
          name: row.name,
          currency: row.currency,
          created_by: row.created_by,
          created_at: new Date().toISOString(),
        };
        store.groups.push(saved);
        return json(201, one ? saved : [saved]);
      }
      if (method === "PATCH") {
        const id = idEq(u);
        const row = store.groups.find((g) => g.id === id);
        if (row) Object.assign(row, body());
        return json(200, one && row ? row : [row].filter(Boolean));
      }
      if (method === "DELETE") {
        const id = idEq(u);
        store.groups = store.groups.filter((g) => g.id !== id);
        store.members = store.members.filter((m) => m.group_id !== id);
        store.invites = store.invites.filter((i) => i.group_id !== id);
        const expenseIds = store.expenses.filter((e) => e.group_id === id).map((e) => e.id);
        store.expenses = store.expenses.filter((e) => e.group_id !== id);
        store.shares = store.shares.filter((s) => !expenseIds.includes(s.expense_id));
        return route.fulfill({ status: 204, headers: cors() });
      }
    }

    if (u.pathname === "/rest/v1/shared_group_members") {
      if (method === "GET") return json(200, store.members);
      if (method === "POST") {
        const row = body();
        const saved = {
          id: crypto.randomUUID(),
          group_id: row.group_id,
          user_id: row.user_id || null,
          display_name: row.display_name,
          role: row.role || "member",
          invite_email: row.invite_email || null,
          joined_at: new Date().toISOString(),
        };
        store.members.push(saved);
        return json(201, one ? saved : [saved]);
      }
      if (method === "PATCH") {
        const id = idEq(u);
        const row = store.members.find((m) => m.id === id);
        if (row) Object.assign(row, body());
        return json(200, one && row ? row : []);
      }
      if (method === "DELETE") {
        const id = idEq(u);
        const used =
          store.expenses.some((e) => e.paid_by === id) || store.shares.some((s) => s.member_id === id);
        if (used) {
          return json(409, { message: "violates foreign key constraint on shared_group_members" });
        }
        store.members = store.members.filter((m) => m.id !== id);
        return route.fulfill({ status: 204, headers: cors() });
      }
    }

    if (u.pathname === "/rest/v1/shared_invites") {
      if (method === "GET") {
        const rows = store.invites
          .filter((i) => i.status === "pending")
          .map((i) => ({
            ...i,
            shared_groups: store.groups.find((g) => g.id === i.group_id) || null,
          }));
        return json(200, rows);
      }
      if (method === "POST") {
        const row = body();
        const saved = {
          id: crypto.randomUUID(),
          group_id: row.group_id,
          member_id: row.member_id || null,
          email: String(row.email || "").toLowerCase(),
          invited_by: row.invited_by,
          status: "pending",
          created_at: new Date().toISOString(),
        };
        store.invites.push(saved);
        return json(201, one ? saved : [saved]);
      }
      if (method === "PATCH") {
        const id = idEq(u);
        const row = store.invites.find((i) => i.id === id);
        if (row) Object.assign(row, body());
        return json(200, one && row ? row : []);
      }
      if (method === "DELETE") {
        const id = idEq(u);
        store.invites = store.invites.filter((i) => i.id !== id);
        return route.fulfill({ status: 204, headers: cors() });
      }
    }

    if (u.pathname === "/rest/v1/shared_expenses" && method === "DELETE") {
      const id = idEq(u);
      store.expenses = store.expenses.filter((e) => e.id !== id);
      store.shares = store.shares.filter((s) => s.expense_id !== id);
      return route.fulfill({ status: 204, headers: cors() });
    }

    if (u.pathname.startsWith("/rest/v1/")) {
      if (method === "GET") return json(200, []);
      return route.fulfill({ status: 204, headers: cors() });
    }
    return json(404, { message: "not mocked", path: u.pathname });
  });

  await context.route("https://api.frankfurter.dev/**", (route) =>
    route.fulfill({
      status: 200,
      headers: { ...cors(), "content-type": "application/json" },
      body: JSON.stringify({ amount: 1, base: "EUR", date: "2026-11-01", rates: { AUD: 1.6 } }),
    })
  );
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const store = makeStore();
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  await installMocks(context, store);
  await context.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem(
        "spend_fx_rates",
        JSON.stringify({
          rates: { "2026-11": 1.6 },
          fetchedAt: { "2026-11": "2026-11-01T00:00:00.000Z" },
        })
      );
    },
    { key: STORAGE_KEY, session: makeSession(3600) }
  );

  const page = await context.newPage();
  page.on("pageerror", (err) => console.log("PAGEERROR", err.message));
  await page.goto(APP_URL);
  await page.waitForFunction(
    () => {
      const load = document.getElementById("loadScreen");
      return load && load.classList.contains("is-hidden") && document.getElementById("screen-home")?.classList.contains("active");
    },
    null,
    { timeout: 20000 }
  );

  await page.click('button[data-nav="shared"]');
  await page.waitForSelector("#screen-shared.active");
  await page.waitForSelector("[data-shared-create]");
  await shot(page, "shared-groups-empty.png");

  await page.click("[data-shared-create]");
  await page.fill("#sharedGroupName", "Lisbon");
  await page.click("#sharedCreateBtn");
  await page.waitForSelector("#sharedPersonName");
  await page.fill("#sharedPersonName", "Mia");
  await page.click("#sharedAddPerson button[type=submit]");
  await page.waitForSelector("text=Mia");
  await page.fill("#sharedPersonName", "Luca");
  await page.fill("#sharedPersonEmail", "luca@example.com");
  await page.click("#sharedAddPerson button[type=submit]");
  await page.waitForSelector("text=luca@example.com");
  assert(store.members.length === 3, "owner, Mia, and Luca are accounts");
  assert(store.invites.length === 1, "Luca was invited by email");
  await shot(page, "shared-people.png");

  await page.click("#sharedBack");
  await page.waitForSelector("[data-shared-add-cost]:not([disabled])");
  await page.click("[data-shared-add-cost]");
  await page.fill("#sharedNameInput", "Dinner");
  await page.fill("#sharedAmount", "90");
  await page.waitForSelector(".sh-split-row.on");
  let splitText = await page.locator(".sh-split-list").innerText();
  assert((splitText.match(/30\.00/g) || []).length === 3, "equal split of 90 shows 30 each, got: " + splitText);
  await page.click('button[data-shared-include]:has-text("Luca")');
  const lucaOut = await page.locator('button[data-shared-include]:has-text("Luca") .sh-split-amt').innerText();
  const ownerHalf = await page.locator('button[data-shared-include]:has-text("Owner") .sh-split-amt').innerText();
  assert(lucaOut.trim() === "", "unticking Luca leaves them out, got: " + lucaOut);
  assert(ownerHalf.includes("45.00"), "90 split between the two ticked people is 45, got: " + ownerHalf);
  await page.click('button[data-shared-include]:has-text("Luca")');
  splitText = await page.locator(".sh-split-list").innerText();
  assert((splitText.match(/30\.00/g) || []).length === 3, "ticking Luca again restores an even three-way split, got: " + splitText);
  const preview = await page.locator("#sharedPreview").innerText();
  assert(preview.includes("90.00"), "charge line shows the full amount, got: " + preview);
  await shot(page, "shared-add-cost.png");
  await page.click("#sharedSaveExpense");
  await page.waitForSelector("text=Dinner");

  await page.click('[data-shared-tab="balances"]');
  await page.waitForSelector("[data-shared-balance]");
  const balances = await page.locator("#sharedScroll").innerText();
  assert(balances.includes("60.00"), "payer is owed 60, got: " + balances);
  assert((balances.match(/30\.00/g) || []).length >= 2, "two people owe 30, got: " + balances);
  await shot(page, "shared-balances.png");

  await page.click('[data-shared-tab="settle"]');
  await page.waitForSelector("[data-shared-transfer]");
  const settle = await page.locator("#sharedScroll").innerText();
  assert(/fewest transfers/i.test(settle), "settle explains the minimum set, got: " + settle);
  assert((await page.locator("[data-shared-transfer]").count()) === 2, "two transfers settle three people");
  await shot(page, "shared-settle-two.png");

  const firstTransfer = await page.locator("[data-shared-transfer]").first().innerText();
  const lucaSettledDinner = /Luca transfers/.test(firstTransfer);
  await page.click("[data-shared-record]");
  await page.waitForSelector("#confirmDialog:not([hidden])");
  await page.click("#confirmOk");
  await page.waitForFunction(() => /One transfer settles the group/.test(document.getElementById("sharedScroll").innerText));
  assert((await page.locator("[data-shared-transfer]").count()) === 1, "recording one payment leaves one transfer");
  await shot(page, "shared-settle-one.png");

  await page.click('[data-shared-tab="expenses"]');
  await page.click("[data-shared-add-cost]");
  await page.fill("#sharedNameInput", "Gelato");
  await page.fill("#sharedAmount", "12");
  await page.click('[data-shared-cost-currency="EUR"]');
  await page.click('button[data-shared-payer]:has-text("Mia")');
  await page.click('[data-shared-split="shares"]');
  await page.click('button[aria-label="Fewer shares for Owner"]');
  const sharePreview = await page.locator("#sharedPreview").innerText();
  assert(sharePreview.includes("9.60"), "12 EUR at 1.6 split two ways is 9.60 AUD, got: " + sharePreview);
  assert(!/Owner/.test(sharePreview.split("Preview")[1] || ""), "Owner has zero shares so is left out");
  await page.click("#sharedSaveExpense");
  await page.waitForSelector("text=Gelato");

  await page.click('[data-shared-tab="balances"]');
  const mixedNeedle = lucaSettledDinner ? "20.40" : "39.60";
  await page.waitForFunction((needle) => document.getElementById("sharedScroll").innerText.includes(needle), mixedNeedle);
  const mixed = await page.locator("#sharedScroll").innerText();
  assert(mixed.includes("30.00"), "Owner is still owed the unsettled dinner share, got: " + mixed);
  if (lucaSettledDinner) {
    assert(mixed.includes("20.40"), "Mia's dinner debt is reduced by paying for gelato, got: " + mixed);
    assert(mixed.includes("9.60"), "Luca owes half the gelato after settling dinner, got: " + mixed);
  } else {
    assert(mixed.includes("39.60"), "Luca owes dinner plus half the gelato, got: " + mixed);
    assert(mixed.includes("9.60"), "Mia is owed half the gelato back, got: " + mixed);
  }
  await shot(page, "shared-balances-mixed.png");

  await browser.close();
  server.close();
  console.log("shared-browser: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
