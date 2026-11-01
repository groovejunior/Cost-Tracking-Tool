"use strict";

/**
 * Sign-out must clear this device's session even when offline, and must
 * never ask Supabase to revoke the session on other devices.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const AUTH_SRC = fs.readFileSync(path.join(__dirname, "..", "supabase", "auth.js"), "utf8");

function makeStorage() {
  const map = new Map();
  return {
    map,
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

function bootAuth({ online, signOutImpl }) {
  const storage = makeStorage();
  const storageKey = "sb-test-auth-token";
  storage.setItem(storageKey, JSON.stringify({
    refresh_token: "rt",
    user: { id: "u1", email: "a@b.co" },
  }));
  storage.setItem(storageKey + "-user", "{}");
  const scopes = [];
  const ctx = {
    localStorage: storage,
    location: { origin: "http://localhost", pathname: "/Cost-Tracking-Tool/" },
    navigator: { onLine: online },
    window: {},
    setTimeout,
    clearTimeout,
    Promise,
    spendSupabase: {
      auth: {
        storageKey,
        signOut: async (opts) => {
          scopes.push(opts && opts.scope);
          if (signOutImpl) return signOutImpl(opts);
          storage.removeItem(storageKey);
        },
      },
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(AUTH_SRC, ctx);
  return { ctx, storage, storageKey, scopes };
}

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
  {
    const { ctx, scopes, storageKey, storage } = bootAuth({
      online: false,
      signOutImpl: async () => {
        throw new Error("Failed to fetch");
      },
    });
    check("offline: session present before sign-out", !!ctx.SpendAuth.getStoredSession());
    await ctx.SpendAuth.signOut();
    check("offline: session cleared when supabase-js rejects", !ctx.SpendAuth.getStoredSession());
    check("offline: only local scope was requested", scopes.length === 1 && scopes[0] === "local", scopes);
    check("offline: leftover -user key cleared", storage.getItem(storageKey + "-user") === null);
  }

  {
    const { ctx, scopes, storage, storageKey } = bootAuth({
      online: true,
      signOutImpl: async ({ scope }) => {
        if (scope === "global") throw new Error("should not revoke globally");
        storage.removeItem(storageKey);
      },
    });
    await ctx.SpendAuth.signOut();
    check("online: only local scope (other devices stay signed in)", JSON.stringify(scopes) === '["local"]', scopes);
    check("online: session gone after local sign-out", !ctx.SpendAuth.getStoredSession());
  }

  console.log(`\n${pass}/${pass + fail} auth-signout checks passed`);
  process.exit(fail ? 1 : 0);
})();
