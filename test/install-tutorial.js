"use strict";

const it = require("../install-tutorial.js");

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

check("standalone via display-mode", it.isStandalone({ displayMode: "standalone", navigatorStandalone: false }));
check("standalone via navigator.standalone", it.isStandalone({ displayMode: "browser", navigatorStandalone: true }));
check("browser is not standalone", !it.isStandalone({ displayMode: "browser", navigatorStandalone: false }));

check("dismissed flag 1", it.isDismissed("1"));
check("dismissed flag true", it.isDismissed("true"));
check("empty is not dismissed", !it.isDismissed(null));

check(
  "shows on first browser visit",
  it.shouldShowInstallTutorial({ dismissed: null, standalone: false, forceShow: false })
);
check(
  "hidden when dismissed",
  !it.shouldShowInstallTutorial({ dismissed: "1", standalone: false, forceShow: false })
);
check(
  "hidden when installed standalone",
  !it.shouldShowInstallTutorial({ dismissed: null, standalone: true, forceShow: false })
);
check(
  "force reopen ignores dismissal",
  it.shouldShowInstallTutorial({ dismissed: "1", standalone: false, forceShow: true })
);
check(
  "force reopen still blocked in standalone",
  !it.shouldShowInstallTutorial({ dismissed: null, standalone: true, forceShow: true })
);

const iphoneSafari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const iphoneChrome =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
const androidChrome =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

check(
  "detects iOS Safari",
  it.detectInstallPlatform({ userAgent: iphoneSafari, maxTouchPoints: 5, platform: "iPhone" }) === "ios-safari"
);
check(
  "detects iOS non-Safari",
  it.detectInstallPlatform({ userAgent: iphoneChrome, maxTouchPoints: 5, platform: "iPhone" }) === "ios-other"
);
check(
  "detects Android",
  it.detectInstallPlatform({ userAgent: androidChrome, maxTouchPoints: 5, platform: "Linux armv81" }) === "android"
);
check(
  "detects desktop",
  it.detectInstallPlatform({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    maxTouchPoints: 0,
    platform: "MacIntel",
  }) === "desktop"
);

console.log(`\n${pass}/${pass + fail} install-tutorial checks passed`);
process.exit(fail ? 1 : 0);
