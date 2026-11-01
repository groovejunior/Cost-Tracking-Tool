"use strict";

/**
 * Mobile screenshots for native currency storage (390×844).
 *
 *   NODE_PATH=/tmp/pw/node_modules node test/currency-screenshots.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error("Install playwright-core first (see file header).");
  process.exit(1);
}

const ROOT = path.resolve(process.env.SPEND_ROOT || path.join(__dirname, ".."));
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";
const PORT = 8091;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const APP_URL = `${ORIGIN}/Cost-Tracking-Tool/`;
const SUPABASE = "https://wwzzyetczulvduucdhoz.supabase.co";
const STORAGE_KEY = "sb-wwzzyetczulvduucdhoz-auth-token";
const USER = { id: "aaaaaaaa-0000-4000-8000-000000000001", email: "owner@example.com", aud: "authenticated", role: "authenticated" };
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
  const access_token = [b64url({ alg: "HS256", typ: "JWT" }), b64url({ sub: USER.id, exp, role: "authenticated", session_id: "s1" }), "sig"].join(".");
  return { access_token, token_type: "bearer", expires_in: expiresInSec, expires_at: exp, refresh_token: "rt-" + crypto.randomUUID(), user: USER };
}

function cors() {
  return { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
}

function makeBackend() {
  return {
    rows: new Map(),
    settings: { variable_budget: 1000, currency: "AUD" },
  };
}

async function installMocks(context, be) {
  await context.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const method = req.method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors() });
    const json = (status, body) =>
      route.fulfill({ status, headers: { ...cors(), "content-type": "application/json" }, body: JSON.stringify(body) });

    if (u.pathname === "/auth/v1/token" && u.searchParams.get("grant_type") === "refresh_token") {
      return json(200, makeSession(3600));
    }
    if (u.pathname === "/auth/v1/user") return json(200, USER);
    if (u.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: cors() });

    if (u.pathname === "/rest/v1/expenses") {
      if (method === "GET") return json(200, [...be.rows.values()]);
      if (method === "POST") {
        const body = JSON.parse(req.postData() || "{}");
        const list = (Array.isArray(body) ? body : [body]).map((r) => {
          const row = {
            id: r.id || crypto.randomUUID(),
            category_id: r.category_id,
            amount: r.amount,
            note: r.note || "",
            expense_date: r.expense_date,
            fx_rate: r.fx_rate ?? 1.6,
            currency: r.currency || "AUD",
          };
          be.rows.set(row.id, row);
          return row;
        });
        return json(201, list[0]);
      }
    }

    if (u.pathname === "/rest/v1/user_settings") {
      if (method === "GET") return json(200, { user_id: USER.id, ...be.settings });
      if (method === "PATCH") {
        Object.assign(be.settings, JSON.parse(req.postData() || "{}"));
        return json(200, { user_id: USER.id, ...be.settings });
      }
      if (method === "POST") return json(201, { user_id: USER.id, ...be.settings });
    }

    if (u.pathname.startsWith("/rest/v1/")) {
      if (method === "GET") return json(200, []);
      return route.fulfill({ status: 204, headers: cors() });
    }
    return json(404, {});
  });

  await context.route("https://api.frankfurter.dev/**", (route) =>
    route.fulfill({
      status: 200,
      headers: { ...cors(), "content-type": "application/json" },
      body: JSON.stringify({ amount: 1, base: "EUR", date: "2026-10-01", rates: { AUD: 1.6 } }),
    })
  );
}

async function waitApp(page) {
  await page.waitForFunction(
    () => {
      const load = document.getElementById("loadScreen");
      return load && load.classList.contains("is-hidden") && document.getElementById("screen-home")?.classList.contains("active");
    },
    null,
    { timeout: 20000 }
  );
}

async function hideToast(page) {
  await page.evaluate(() => {
    const t = document.getElementById("toast");
    if (t) t.hidden = true;
  });
}

async function shot(page, name) {
  await hideToast(page);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

  const be = makeBackend();
  const t0 = new Date().toISOString();
  const id1 = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  const id3 = crypto.randomUUID();
  be.rows.set(id1, {
    id: id1,
    category_id: "groceries",
    amount: 160,
    note: "Weekly shop",
    expense_date: t0,
    fx_rate: 1.6,
    currency: "AUD",
  });
  be.rows.set(id2, {
    id: id2,
    category_id: "transport",
    amount: 32,
    note: "Train pass",
    expense_date: t0,
    fx_rate: 1.6,
    currency: "AUD",
  });
  be.rows.set(id3, {
    id: id3,
    category_id: "food",
    amount: 20,
    note: "Lunch in Paris",
    expense_date: t0,
    fx_rate: 1.6,
    currency: "EUR",
  });

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
  await installMocks(context, be);
  await context.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: makeSession(3600) }
  );

  const page = await context.newPage();
  await page.goto(APP_URL);
  await waitApp(page);
  await page.waitForTimeout(500);

  await page.click('button[data-nav="more"]');
  await page.waitForSelector(".currency-seg");
  await shot(page, "settings-currency-aud.png");

  await page.click('button[data-nav="home"]');
  await page.waitForSelector(".hero .total");
  await shot(page, "home-totals-aud.png");

  await page.click('button[data-nav="list"]');
  await page.waitForSelector(".listcard");
  await shot(page, "list-mixed-currency-aud.png");

  await page.click('button[data-nav="more"]');
  await page.waitForSelector(".currency-seg");
  await page.click('button[data-currency="EUR"]');
  await page.waitForSelector("#confirmDialog:not([hidden])");
  await shot(page, "settings-currency-switch-confirm.png");
  await page.click("#confirmOk");
  await page.waitForFunction(() => document.getElementById("confirmDialog").hidden);
  await page.waitForTimeout(600);
  await hideToast(page);
  await shot(page, "settings-currency-eur.png");

  await page.click('button[data-nav="home"]');
  await page.waitForSelector(".hero .total");
  await hideToast(page);
  await shot(page, "home-totals-eur.png");

  await page.click('button[data-nav="add"]');
  await page.waitForSelector("#amtInput");
  await hideToast(page);
  await shot(page, "add-expense-eur.png");

  await browser.close();
  server.close();
  console.log("Done — screenshots in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
