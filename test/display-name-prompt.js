"use strict";

const assert = require("assert");
const { bootApp, FakeServer, idle, settle } = require("./harness");

const USER = { id: "11111111-2222-4333-8444-555555555555", email: "legacy@example.com" };

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
  console.log("\nDisplay name prompt (existing accounts)\n");

  {
    const server = new FakeServer();
    const app = await bootApp({ server, storage: new Map(), user: USER, userMetadata: {} });
    await idle(app);
    check("shown when name missing and online", app.activeScreen() === "screen-display-name", app.activeScreen());
    check("not in the app yet", !app.signedInAs, app.signedInAs);
  }

  {
    const server = new FakeServer();
    const app = await bootApp({
      server,
      storage: new Map(),
      user: USER,
      userMetadata: { display_name: "Mia" },
    });
    await idle(app);
    check("not shown when name already present", app.activeScreen() === "screen-home", app.activeScreen());
    check("signed in", app.signedInAs === USER.id, app.signedInAs);
    check("avatar uses display name initial", app.accountInitial() === "M", app.accountInitial());
  }

  {
    const server = new FakeServer();
    const app = await bootApp({ server, storage: new Map(), user: USER, online: false, userMetadata: {} });
    await idle(app);
    check("offline does not block on the prompt", app.activeScreen() === "screen-home", app.activeScreen());
    check("signed in offline without a name", app.signedInAs === USER.id, app.signedInAs);
  }

  {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER, userMetadata: {} });
    await idle(app);
    assert.strictEqual(app.activeScreen(), "screen-display-name");
    await app.submitDisplayName("Carlo");
    await idle(app);
    check("enters the app after save", app.activeScreen() === "screen-home", app.activeScreen());
    check("avatar initial updated", app.accountInitial() === "C", app.accountInitial());
    app = await bootApp({ server, storage, user: USER, userMetadata: {} });
    await idle(app);
    check("does not ask again after name was saved", app.activeScreen() === "screen-home", app.activeScreen());
    const meta = app.run("currentUser.user_metadata.display_name");
    check("saved name on the user object", meta === "Carlo", meta);
  }

  {
    const server = new FakeServer();
    const storage = new Map();
    let app = await bootApp({ server, storage, user: USER, userMetadata: {} });
    await idle(app);
    app.ctx.SpendAuth.updateDisplayName = async () => {
      throw new Error("Failed to fetch");
    };
    await app.submitDisplayName("Sam");
    await idle(app);
    check("save failure still enters the app", app.activeScreen() === "screen-home", app.activeScreen());
    app = await bootApp({ server, storage, user: USER, userMetadata: {} });
    await idle(app);
    check("prompt returns on next open when save failed", app.activeScreen() === "screen-display-name", app.activeScreen());
  }

  console.log(`\n${pass}/${pass + fail} display-name checks passed\n`);
  process.exit(fail ? 1 : 0);
})();
