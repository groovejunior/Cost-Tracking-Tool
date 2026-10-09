"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.env.OUT || "/opt/cursor/artifacts/screenshots";
const PORT = 8091;
const APP_URL = `http://127.0.0.1:${PORT}/index.html`;
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

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || "/usr/local/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen-auth.active, #screen-setup.active", { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-auth").classList.add("active");
    document.getElementById("app").classList.add("auth-mode");
    setAuthMode("signin");
  });
  await page.waitForTimeout(300);
  await shot(page, "auth-01-sign-in.png");

  await page.evaluate(() => setAuthMode("signup"));
  await page.waitForTimeout(200);
  await shot(page, "auth-02-create-account.png");

  await page.evaluate(() => {
    showCheckEmailPanel({ name: "Mia", email: "mia@example.com" });
    startAuthResendCooldown(42);
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-03-check-email.png");

  await page.evaluate(() => setAuthMode("forgot"));
  await page.waitForTimeout(200);
  await shot(page, "auth-04-forgot-password.png");

  await page.evaluate(() => {
    document.getElementById("authEmail").value = "carlo@example.com";
    setAuthMode("recovery");
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-05-new-password.png");

  await page.evaluate(() => {
    setAuthMode("signin");
    showAuthBanner("Please confirm your email first.", "error", { resend: true });
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-06-error-banner.png");

  await page.evaluate(() => {
    setAuthMode("signup");
    setAuthFieldError("authNameField", "authNameError", "Tell us what to call you.");
    setAuthFieldError("authEmailField", "authEmailError", "Did you mean mia@gmail.com?");
    setAuthFieldError("authPasswordField", "authPasswordError", "Use at least 8 characters.");
    document.getElementById("authSubmit").disabled = true;
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-07-inline-validation.png");

  await page.evaluate(() => {
    setAuthMode("signin");
    clearAuthBanner();
    clearAuthFieldErrors();
    setAuthLoading(true);
    document.getElementById("authSlowNote").hidden = false;
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-08-loading.png");

  await page.evaluate(() => {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-display-name").classList.add("active");
    document.getElementById("app").classList.add("auth-mode");
    showDisplayNameScreen();
  });
  await page.waitForTimeout(200);
  await shot(page, "auth-09-display-name.png");

  await browser.close();
  server.close();
  console.log("Screenshots saved to", OUT);
})();
