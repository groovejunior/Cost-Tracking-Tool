"use strict";

/**
 * Creates the Supabase client used by auth and data layers.
 * Returns null when config.js still has placeholder values — the app then
 * falls back to localStorage (demo mode) until you finish setup.
 */
function createSpendSupabaseClient() {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    console.warn("[Spend] Missing SUPABASE_CONFIG — running in offline demo mode.");
    return null;
  }

  const looksLikePlaceholder =
    cfg.url.includes("YOUR_PROJECT") || cfg.anonKey.includes("YOUR_");
  if (looksLikePlaceholder) {
    console.warn("[Spend] Supabase not configured yet — running in offline demo mode.");
    return null;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("[Spend] Supabase JS library not loaded.");
    return null;
  }

  return window.supabase.createClient(cfg.url, cfg.anonKey);
}

/** Global client — null until config.js is filled in. */
window.spendSupabase = createSpendSupabaseClient();
