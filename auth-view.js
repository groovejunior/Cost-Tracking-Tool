"use strict";

/** Pure auth UI logic (validation, error mapping, signup outcomes) — testable without DOM. */
const MIN_SIGNUP_PASSWORD = 8;

const EMAIL_TYPO_DOMAINS = {
  "gmial.com": "gmail.com",
  "gmial.co": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yaho.com": "yahoo.com",
};

function trimName(name) {
  return (name || "").trim();
}

function validateDisplayName(name) {
  const n = trimName(name);
  if (!n) return { ok: false, message: "Tell us what to call you." };
  if (n.length > 40) return { ok: false, message: "Use 40 characters or fewer." };
  return { ok: true, value: n };
}

function basicEmailOk(email) {
  const e = (email || "").trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function validateEmail(email) {
  const e = (email || "").trim();
  if (!e) return { ok: false, message: "Enter your email address." };
  if (!basicEmailOk(e)) return { ok: false, message: "Enter a valid email address." };
  const typo = suggestEmailTypo(e);
  if (typo) return { ok: false, message: "Did you mean " + typo + "?", typo };
  return { ok: true, value: e };
}

function suggestEmailTypo(email) {
  const e = (email || "").trim();
  const at = e.lastIndexOf("@");
  if (at < 1) return null;
  const domain = e.slice(at + 1).toLowerCase();
  const fix = EMAIL_TYPO_DOMAINS[domain];
  if (!fix) return null;
  return e.slice(0, at + 1) + fix;
}

function passwordStrength(password) {
  const p = password || "";
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const segments = Math.min(4, Math.max(0, score));
  let label = "";
  if (!p.length) label = "";
  else if (p.length < MIN_SIGNUP_PASSWORD) label = "Use at least 8 characters.";
  else if (segments <= 1) label = "Fair · at least 8 characters";
  else if (segments === 2) label = "Good · at least 8 characters";
  else label = "Strong";
  return { segments, label, weak: p.length > 0 && p.length < MIN_SIGNUP_PASSWORD };
}

function validateSignupPassword(password) {
  const p = password || "";
  if (p.length < MIN_SIGNUP_PASSWORD) {
    return { ok: false, message: "Use at least 8 characters." };
  }
  return { ok: true };
}

function validateSigninFields({ email, password }) {
  const em = validateEmail(email);
  if (!em.ok) return em;
  if (!(password || "").length) return { ok: false, message: "Enter your password." };
  return { ok: true, email: em.value };
}

function validateSignupFields({ name, email, password }) {
  const nm = validateDisplayName(name);
  if (!nm.ok) return nm;
  const em = validateEmail(email);
  if (!em.ok) return em;
  const pw = validateSignupPassword(password);
  if (!pw.ok) return pw;
  return { ok: true, name: nm.value, email: em.value };
}

function validateRecoveryFields({ password, confirm }) {
  const pw = validateSignupPassword(password);
  if (!pw.ok) return pw;
  if ((password || "") !== (confirm || "")) {
    return { ok: false, message: "Passwords don't match." };
  }
  return { ok: true };
}

function mapAuthError(err) {
  const msg = (err && err.message) || String(err || "");
  if (/invalid login credentials/i.test(msg)) {
    return {
      banner: "That email and password don't match. Try again or reset your password.",
      resend: false,
    };
  }
  if (/email not confirmed/i.test(msg)) {
    return {
      banner: "Please confirm your email first.",
      resend: true,
    };
  }
  if (/timed out/i.test(msg) || /failed to fetch|load failed|network|internet disconnected/i.test(msg)) {
    return {
      banner: "Can't reach Spend right now. Check your connection and try again.",
      resend: false,
    };
  }
  if (/rate limit|too many requests|429|over_email_send_rate_limit/i.test(msg)) {
    return {
      banner: "Too many emails just now. Please try again in a few minutes.",
      resend: false,
    };
  }
  if (/weak password|password.*weak|422/i.test(msg)) {
    return { banner: "Choose a longer password (8+ characters).", resend: false };
  }
  return { banner: msg || "Something went wrong. Please try again.", resend: false };
}

function interpretSignupResponse(data) {
  if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { outcome: "already_registered" };
  }
  if (data && data.session) return { outcome: "session" };
  return { outcome: "check_email" };
}

function accountLabelFromUser(user) {
  if (!user) return "";
  const meta = user.user_metadata || user.raw_user_meta_data || {};
  const name = trimName(meta.display_name || meta.full_name || "");
  return name || user.email || "";
}

function accountInitialFromLabel(label) {
  const ch = (label || "?").trim().charAt(0).toUpperCase();
  return ch || "?";
}

const SpendAuthView = {
  MIN_SIGNUP_PASSWORD,
  trimName,
  validateDisplayName,
  validateEmail,
  suggestEmailTypo,
  passwordStrength,
  validateSignupPassword,
  validateSigninFields,
  validateSignupFields,
  validateRecoveryFields,
  mapAuthError,
  interpretSignupResponse,
  accountLabelFromUser,
  accountInitialFromLabel,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpendAuthView;
}
if (typeof window !== "undefined") {
  window.SpendAuthView = SpendAuthView;
}
