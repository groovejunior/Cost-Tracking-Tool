"use strict";

const { bootApp, FakeServer, settle } = require("./harness");

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "tab@example.com" };

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
  console.log("\nAuth tab switch / submit validation\n");

  const server = new FakeServer();
  const app = await bootApp({
    server,
    storage: new Map(),
    user: USER,
    signIn: false,
    auth: "none",
  });
  await settle(25);

  app.run("setAuthMode('signin')");
  app.run("document.getElementById('authEmail').focus()");
  await settle(5);
  app.run("setAuthMode('signup')");
  await settle(20);

  const emailErrHidden = app.run("document.getElementById('authEmailError').hidden");
  const emailFieldOk = !app.run("document.getElementById('authEmailField').classList.contains('field--error')");
  check("signup tab after sign-in email focus shows no email error", emailErrHidden && emailFieldOk, {
    emailErrHidden,
    emailFieldOk,
  });

  app.run("setAuthMode('signup')");
  app.run("document.getElementById('authForm').requestSubmit()");
  await settle(10);

  const nameErr = app.run("document.getElementById('authNameError').textContent");
  const emailErr = app.run("document.getElementById('authEmailError').textContent");
  const pwdErr = app.run("document.getElementById('authPasswordError').textContent");
  check("invalid submit shows name error", nameErr === "Tell us what to call you.", nameErr);
  check("invalid submit shows email error", emailErr === "Enter your email address.", emailErr);
  check("invalid submit shows password error", pwdErr === "Use at least 8 characters.", pwdErr);

  console.log(`\n${pass}/${pass + fail} auth-tab checks passed\n`);
  process.exit(fail ? 1 : 0);
})();
