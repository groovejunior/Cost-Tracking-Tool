"use strict";

/**
 * Browser regression: fresh visitor auth after install tutorial dismiss (390×844).
 *   NODE_PATH=./node_modules node test/phone-fresh-auth-browser.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8094;
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let rel = decodeURIComponent(u.pathname.replace(/^\//, "")) || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(file).pipe(res);
});

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log("  ok   ", name);
  } else {
    fail++;
    console.log("  FAIL ", name, detail || "");
  }
}

(async () => {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
  });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.getElementById("loadScreen")?.classList.contains("is-hidden"),
    null,
    { timeout: 20000 }
  );

  const steps = await page.evaluate(() => {
    const li = document.querySelector("#installStepsIosSafari li");
    if (!li) return null;
    return { childCount: li.childElementCount, hasTextWrap: !!li.querySelector(".install-step-text") };
  });
  check("install step is icon + one text element", steps && steps.childCount === 2 && steps.hasTextWrap, steps);

  await page.evaluate(() => document.getElementById("installTutorialBrowser").click());
  await page.waitForFunction(() => document.getElementById("installTutorial").hidden);

  const auth = await page.evaluate(() => ({
    mode: authMode,
    title: document.getElementById("authTitle").textContent,
    segHidden: document.getElementById("authSeg").hidden,
    helpErr: document.getElementById("authPasswordHelp").classList.contains("auth-field-error"),
    submit: document.getElementById("authSubmit").textContent.trim(),
  }));
  check("sign-in mode after tutorial dismiss", auth.mode === "signin", auth);
  check("Welcome back heading", auth.title === "Welcome back", auth.title);
  check("segmented control visible", !auth.segHidden);
  check("no eager password error", !auth.helpErr);
  check("Sign in submit label", auth.submit === "Sign in", auth.submit);

  await browser.close();
  server.close();
  console.log(`\n${pass}/${pass + fail} phone fresh-auth checks passed\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
