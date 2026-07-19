"use strict";

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
    const { data, error } = await window.spendSupabase.auth.getUser();
    if (error || !data.user) throw new Error("Session expired. Please sign in again.");
    return data.user;
  },

  /** Read the saved login session from the browser (if any). */
  async getSession() {
    if (!this.isEnabled()) return null;
    const { data, error } = await window.spendSupabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /** Register a new account with email + password. */
  async signUp(email, password) {
    const { data, error } = await window.spendSupabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  /** Log in an existing account. */
  async signIn(email, password) {
    const { data, error } = await window.spendSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** End the session and return to the login screen. */
  async signOut() {
    const { error } = await window.spendSupabase.auth.signOut();
    if (error) throw error;
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
