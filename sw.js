const CACHE_NAME = "spend-v54";
const NETWORK_FIRST_TIMEOUT_MS = 3000;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./rates.js",
  "./vendor/supabase-js.js",
  "./supabase/config.js",
  "./supabase/client.js",
  "./supabase/auth.js",
  "./supabase/data.js",
  "./supabase/settings.js",
  "./supabase/categories.js",
  "./supabase/fx-rates.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable.png",
  "./assets/brand-mark.svg",
  "./assets/brand-mark.png",
  "./assets/auth-australia.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isAppShell(url) {
  return /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/");
}

function timeoutError(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), ms);
  });
}

async function networkFirst(request) {
  try {
    const response = await Promise.race([fetch(request), timeoutError(NETWORK_FIRST_TIMEOUT_MS)]);
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch {
      return Response.error();
    }
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  /* Only cache this app's own files — never Supabase, FX APIs, or CDNs. */
  if (url.origin !== self.location.origin) return;

  if (isAppShell(url)) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
