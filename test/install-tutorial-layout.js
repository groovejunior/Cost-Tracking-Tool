"use strict";

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log("  ✓", name);
  } else {
    fail++;
    console.log("  ✗", name, detail || "");
  }
}

const stepBlocks = html.match(/<ol class="auth-steps install-steps"[\s\S]*?<\/ol>/g) || [];
check("install step lists present", stepBlocks.length >= 2, stepBlocks.length);

const stepItems = html.match(/<li><span class="install-step-ico[\s\S]*?<\/li>/g) || [];
check("install steps found", stepItems.length >= 5, stepItems.length);

for (let i = 0; i < stepItems.length; i++) {
  const li = stepItems[i];
  const textSpans = (li.match(/install-step-text/g) || []).length;
  const strongInText = /<span class="install-step-text">[\s\S]*<strong>/.test(li);
  check(`step ${i + 1} has one text wrapper with inline strong`, textSpans === 1 && strongInText, li.slice(0, 80));
}

console.log(`\n${pass}/${pass + fail} install-tutorial-layout checks passed`);
process.exit(fail ? 1 : 0);
