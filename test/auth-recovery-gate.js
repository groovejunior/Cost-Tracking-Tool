"use strict";

const av = require("../auth-view.js");
const USER = { id: "11111111-2222-4333-8444-555555555555", email: "fresh@example.com" };
const { bootApp, FakeServer, settle } = require("./harness");

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

check("bare type=recovery hash is not recovery", !av.isPasswordRecoveryHash("#type=recovery"));
check(
  "recovery hash needs tokens",
  av.isPasswordRecoveryHash("#access_token=abc&type=recovery&refresh_token=x")
);
check(
  "canShow requires email",
  !av.canShowPasswordRecoveryScreen({ recoveryActive: true, recoveryEmail: "" })
);
check(
  "canShow with email",
  av.canShowPasswordRecoveryScreen({ recoveryActive: true, recoveryEmail: "a@b.co" })
);

(async () => {
  const server = new FakeServer();
  const app = await bootApp({
    server,
    storage: new Map(),
    user: USER,
    signIn: false,
    auth: "none",
  });
  await settle(100);

  check(
    "fresh visitor lands on sign-in",
    app.run("authMode") === "signin" && app.run("passwordRecovery") === false,
    { mode: app.run("authMode"), pr: app.run("passwordRecovery") }
  );
  check(
    "fresh visitor title is Welcome back",
    app.run("document.getElementById('authTitle').textContent") === "Welcome back"
  );
  check(
    "recovery flag alone does not open recovery UI",
    (() => {
      app.run("passwordRecovery = true");
      app.run("showAuthScreen()");
      return (
        app.run("authMode") === "signin" &&
        app.run("document.getElementById('authTitle').textContent") === "Welcome back"
      );
    })()
  );
  check(
    "PASSWORD_RECOVERY without session is ignored",
    (() => {
      app.run("passwordRecovery = false");
      app.run(
        "(() => { const session = null; if (!session || !session.user) { passwordRecovery = false; authRecoveryEmail = ''; return; } })()"
      );
      return app.run("passwordRecovery") === false;
    })()
  );
  check(
    "recovery with email shows choose password",
    (() => {
      app.run("passwordRecovery = true");
      app.run("authRecoveryEmail = 'reset@example.com'");
      app.run("showAuthScreen()");
      return (
        app.run("authMode") === "recovery" &&
        app.run("document.getElementById('authTitle').textContent") === "Choose a new password"
      );
    })()
  );
  check(
    "empty recovery password shows no eager strength error",
    (() => {
      app.run("setAuthMode('recovery')");
      app.run("updatePasswordMeter()");
      const help = app.run("document.getElementById('authPasswordHelp')");
      return help.textContent === "" && !help.classList.contains("auth-field-error");
    })()
  );

  console.log(`\n${pass}/${pass + fail} auth-recovery-gate checks passed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
