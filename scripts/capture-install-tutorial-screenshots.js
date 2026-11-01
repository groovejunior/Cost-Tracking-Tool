"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.env.OUT || "/opt/cursor/artifacts/screenshots";
const PORT = 8092;
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
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

async function prepAuth(page) {
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof showAuthScreen === "function", null, { timeout: 15000 });
  await page.evaluate(() => {
    localStorage.removeItem("spend_install_tutorial_dismissed");
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById("app").classList.add("auth-mode");
    showAuthScreen();
    setAuthMode("signin");
  });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || chromium.executablePath(),
    args: ["--no-sandbox"],
  });

  const iphoneSafari = devices["iPhone 13"];

  {
    const ctx = await browser.newContext({
      ...iphoneSafari,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await ctx.newPage();
    await prepAuth(page);
    await page.evaluate(() => showInstallTutorial({ force: true }));
    await page.waitForSelector("#installTutorial:not([hidden])", { timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, "install-01-ios-safari-steps.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      ...iphoneSafari,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
    });
    const page = await ctx.newPage();
    await prepAuth(page);
    await page.evaluate(() => showInstallTutorial({ force: true }));
    await page.waitForSelector("#installPanelIosOther:not([hidden])", { timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, "install-02-ios-open-safari.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    });
    const page = await ctx.newPage();
    await prepAuth(page);
    await page.evaluate(() => {
      const evt = Object.assign(new Event("beforeinstallprompt"), {
        preventDefault() {},
        prompt() {
          return Promise.resolve();
        },
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(evt);
      showInstallTutorial({ force: true });
      updateInstallTutorialPanels();
    });
    await page.waitForSelector("#installPromptBtn:not([hidden])", { timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, "install-03-android-install-btn.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ ...iphoneSafari });
    const page = await ctx.newPage();
    await prepAuth(page);
    await page.evaluate(() => {
      dismissInstallTutorial({ persist: true });
      syncAuthInstallLink();
    });
    await page.waitForSelector("#authInstallLinkWrap:not([hidden])", { timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, "install-04-auth-reopen-link.png");
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log("Install tutorial screenshots saved to", OUT);
})();
