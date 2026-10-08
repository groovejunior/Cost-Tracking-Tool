"use strict";

/**
 * Offline sign-out: local session must clear even when Supabase signOut rejects.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const AUTH_SRC = fs.readFileSync(path.join(__dirname, "..", "supabase", "auth.js"), "utf8");

function makeStorage() {
  const map = new Map();
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(k, v);
    },
    removeItem(k) {
      map.delete(k);
    },
  };
}

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

(async () => {
  const storage = makeStorage();
  const storageKey = "sb-test-auth-token";
  const session = JSON.stringify({
    refresh_token: "rt",
    user: { id: "u1", email: "a@b.co" },
  });
  storage.setItem(storageKey, session);

  const ctx = {
    localStorage: storage,
    location: { origin: "http://localhost", pathname: "/Cost-Tracking-Tool/" },
    navigator: { onLine: false },
    window: {},
    setTimeout,
    clearTimeout,
    Promise,
    spendSupabase: {
      auth: {
        storageKey,
        signOut: async () => {
          throw new Error("Failed to fetch");
        },
      },
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(AUTH_SRC, ctx);

  check("stored session present", !!ctx.SpendAuth.getStoredSession());
  await ctx.SpendAuth.signOut();
  check("stored session cleared offline", !ctx.SpendAuth.getStoredSession());

  console.log(`\n${pass}/${pass + fail} auth-signout checks passed`);
  process.exit(fail ? 1 : 0);
})();
