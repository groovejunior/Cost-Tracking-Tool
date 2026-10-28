"use strict";

const av = require("../auth-view.js");
const assert = require("assert");

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

check("short existing passwords still pass sign-in validation", av.validateSigninFields({ email: "a@b.co", password: "short" }).ok);
check("signin mode is not signup validation", av.validateSigninFields({ email: "a@b.co", password: "x" }).ok);
check("signup requires 8 chars", !av.validateSignupPassword("short").ok);
check("signup accepts 8 chars", av.validateSignupPassword("longenuf").ok);
check("name required", !av.validateDisplayName("  ").ok);
check("name max 40", av.validateDisplayName("a".repeat(40)).ok);
check("email typo gmial", /gmail/.test(av.validateEmail("mia@gmial.co").message));
check("invalid credentials copy", /don't match/.test(av.mapAuthError({ message: "Invalid login credentials" }).banner));
check("a generic 422 is not mapped as a weak password", !/longer password/.test(av.mapAuthError({ message: "JSON could not be generated (422)" }).banner));
check("weak password copy", /longer password/.test(av.mapAuthError({ message: "Password should be at least 8 characters" }).banner));
check("email not confirmed resend", av.mapAuthError({ message: "Email not confirmed" }).resend);
check("signup session outcome", av.interpretSignupResponse({ session: {}, user: { identities: [{}] } }).outcome === "session");
check(
  "signup check email when no session",
  av.interpretSignupResponse({ user: { identities: [{}] } }).outcome === "check_email"
);
check(
  "signup already registered",
  av.interpretSignupResponse({ user: { identities: [] } }).outcome === "already_registered"
);
check("user has display name", av.userHasDisplayName({ email: "a@b.co", user_metadata: { display_name: "Mia" } }));
check("user missing display name", !av.userHasDisplayName({ email: "a@b.co", user_metadata: {} }));
check("display name from metadata", av.accountLabelFromUser({ email: "a@b.co", user_metadata: { display_name: "Mia" } }) === "Mia");
check("initial from display name", av.accountInitialFromLabel("Mia") === "M");

console.log(`\n${pass}/${pass + fail} auth-view checks passed`);
process.exit(fail ? 1 : 0);
