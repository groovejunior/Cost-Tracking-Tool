"use strict";

/** Pure install-tutorial logic — testable without DOM. */
const STORAGE_KEY = "spend_install_tutorial_dismissed";

function isStandalone({ displayMode, navigatorStandalone }) {
  if (displayMode === "standalone") return true;
  if (navigatorStandalone === true) return true;
  return false;
}

function isDismissed(storageValue) {
  if (storageValue == null || storageValue === "") return false;
  return storageValue === "1" || storageValue === "true" || storageValue === "yes";
}

/**
 * @param {{ dismissed?: string|null, standalone?: boolean, forceShow?: boolean }} opts
 */
function shouldShowInstallTutorial(opts) {
  const { dismissed, standalone, forceShow } = opts || {};
  if (standalone) return false;
  if (forceShow) return true;
  if (isDismissed(dismissed)) return false;
  return true;
}

/**
 * @param {{ userAgent?: string, maxTouchPoints?: number, platform?: string }} env
 * @returns {"ios-safari"|"ios-other"|"android"|"desktop"}
 */
function detectInstallPlatform(env) {
  const ua = env && env.userAgent ? env.userAgent : "";
  const platform = env && env.platform ? env.platform : "";
  const maxTouchPoints = env && typeof env.maxTouchPoints === "number" ? env.maxTouchPoints : 0;
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);

  if (isAppleMobile) {
    const nonSafari = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|Instagram|FBAN|FBAV/.test(ua);
    if (nonSafari) return "ios-other";
    if (/Safari/.test(ua) && /AppleWebKit/.test(ua) && !/Chrome|Chromium/.test(ua)) return "ios-safari";
    /* In-app browsers often omit Safari token */
    if (/AppleWebKit/.test(ua) && !/Safari/.test(ua)) return "ios-other";
    return "ios-safari";
  }
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const SpendInstallTutorial = {
  STORAGE_KEY,
  isStandalone,
  isDismissed,
  shouldShowInstallTutorial,
  detectInstallPlatform,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpendInstallTutorial;
}
if (typeof window !== "undefined") {
  window.SpendInstallTutorial = SpendInstallTutorial;
}
