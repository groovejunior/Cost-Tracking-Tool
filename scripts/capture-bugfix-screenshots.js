"use strict";

/**
 * Phone screenshots for install tutorial + fresh auth after dismiss (390×844).
 * Output: /opt/cursor/artifacts/screenshots/
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.env.OUT || "/opt/cursor/artifacts/screenshots";
const PORT = 8093;
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
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let rel = decodeURIComponent(u.pathname.replace(/^\//, "")) || "index.html";
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

async function waitAuthReady(page) {
  await page.waitForFunction(
    () =>
      document.getElementById("loadScreen")?.classList.contains("is-hidden") &&
      document.getElementById("screen-auth")?.classList.contains("active"),
    null,
    { timeout: 20000 }
  );
}

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const iphoneSafari = {
    ...devices["iPhone 13"],
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  };

  {
    const ctx = await browser.newContext({ ...iphoneSafari, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });
    await waitAuthReady(page);
    await page.waitForSelector("#installTutorial:not([hidden])", { timeout: 8000 });
    await page.waitForTimeout(400);
    await shot(page, "bugfix-01-install-ios-safari-steps.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ ...iphoneSafari, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });
    await waitAuthReady(page);
    await page.click("#installTutorialBrowser");
    await page.waitForFunction(() => document.getElementById("installTutorial").hidden);
    await page.waitForTimeout(400);
    const auth = await page.evaluate(() => ({
      title: document.getElementById("authTitle").textContent,
      mode: typeof authMode !== "undefined" ? authMode : null,
      helpErr: document.getElementById("authPasswordHelp").classList.contains("auth-field-error"),
      help: document.getElementById("authPasswordHelp").textContent,
    }));
    console.log("auth after dismiss:", auth);
    await shot(page, "bugfix-02-auth-signin-fresh-visitor.png");
    await ctx.close();
  }

  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
