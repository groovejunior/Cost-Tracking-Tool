"use strict";

const AUTH_TIMEOUT_MS = 15000;

function authRedirectTo() {
  if (typeof location === "undefined") return undefined;
  return location.origin + location.pathname;
}

function withAuthTimeout(promise, label) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + " timed out")), AUTH_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Thin wrapper around Supabase Auth.
 * app.js calls these instead of talking to Supabase directly — keeps auth logic in one place.
 */
const SpendAuth = {
  /** True when config.js is filled in and the client was created. */
  isEnabled() {
    return !!window.spendSupabase;
  },

  /** Validate the session with Supabase before reading protected data. */
  async ensureReady() {
    if (!this.isEnabled()) throw new Error("Auth is not available.");
    const { data, error } = await withAuthTimeout(
      window.spendSupabase.auth.getUser(),
      "Auth"
    );
    if (error || !data.user) throw new Error("Session expired. Please sign in again.");
    return data.user;
  },

  /** Read the saved login session from the browser (if any). */
  async getSession() {
    if (!this.isEnabled()) return null;
    const { data, error } = await withAuthTimeout(
      window.spendSupabase.auth.getSession(),
      "Session"
    );
    if (error) throw error;
    return data.session;
  },

  /**
   * The session saved on this device, read without any network call.
   * supabase-js keeps it when a token refresh fails because the device is
   * offline and deletes it when the auth server rejects it, so while it is
   * present the user is still signed in even if getSession() returns null.
   */
  getStoredSession() {
    if (!this.isEnabled()) return null;
    try {
      const raw = localStorage.getItem(window.spendSupabase.auth.storageKey);
      const session = raw ? JSON.parse(raw) : null;
      return session && session.refresh_token && session.user && session.user.id ? session : null;
    } catch {
      return null;
    }
  },

  /** Register a new account with email + password and optional display name in user metadata. */
  async signUp(email, password, displayName) {
    const meta = {};
    const name = (displayName || "").trim();
    if (name) meta.display_name = name;
    const { data, error } = await window.spendSupabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        emailRedirectTo: authRedirectTo(),
      },
    });
    if (error) throw error;
    return data;
  },

  /** Log in an existing account. */
  async signIn(email, password) {
    const { data, error } = await window.spendSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** Email a password reset link. */
  async resetPasswordForEmail(email) {
    const { error } = await window.spendSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo(),
    });
    if (error) throw error;
  },

  /** Set a new password after opening the reset link (PASSWORD_RECOVERY session). */
  async updatePassword(password) {
    const { error } = await window.spendSupabase.auth.updateUser({ password });
    if (error) throw error;
  },

  /** Save display name in user metadata (one-time prompt for older accounts). */
  async updateDisplayName(displayName) {
    const name = (displayName || "").trim();
    const { data, error } = await window.spendSupabase.auth.updateUser({
      data: { display_name: name },
    });
    if (error) throw error;
    return data;
  },

  /** Resend the sign-up confirmation email. */
  async resendSignup(email) {
    const { error } = await window.spendSupabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authRedirectTo() },
    });
    if (error) throw error;
  },

  /** Remove the saved session from this browser (no network required). */
  clearLocalSession() {
    if (!this.isEnabled()) return;
    try {
      const key = window.spendSupabase.auth.storageKey;
      if (!key) return;
      localStorage.removeItem(key);
      localStorage.removeItem(key + "-user");
      localStorage.removeItem(key + "-code-verifier");
    } catch {
      /* ignore */
    }
  },

  /**
   * Sign out on this device only. Other phones/laptops stay signed in
   * (a personal tracker should not kick you out everywhere). Always
   * clears the local session even when offline so the auth screen shows.
   * Other tabs on this browser still hear SIGNED_OUT via supabase-js.
   */
  async signOut() {
    if (!this.isEnabled()) return;
    try {
      await withAuthTimeout(
        window.spendSupabase.auth.signOut({ scope: "local" }),
        "Sign out"
      );
    } catch (err) {
      this.clearLocalSession();
      if (this.getStoredSession()) throw err;
    }
  },

  /**
   * Subscribe to login/logout events (e.g. session expired, sign out elsewhere).
   * Returns a subscription you can unsubscribe from.
   */
  onAuthStateChange(callback) {
    if (!this.isEnabled()) {
      return { data: { subscription: { unsubscribe() {} } } };
    }
    return window.spendSupabase.auth.onAuthStateChange(callback);
  },
};

window.SpendAuth = SpendAuth;
