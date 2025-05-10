// Service workers are specialized JavaScript assets that act as proxies between web browsers and web servers.
// They aim to improve reliability by providing offline access, as well as boost page performance.

// self.addEventListener("install", event => {
//     self.skipWaiting();
//   });
  
//   self.addEventListener("activate", event => {
//     clients.claim();
//   });
  
//   self.addEventListener("fetch", event => {
//     event.respondWith(fetch(event.request));
//   });


const CACHE_NAME = "sleep-tracker-cache-v2.1";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./sleepPic.png",
  "./html/summary.html",
  "./html/chart.html",
  "./html/export.html"
];

// Install and cache essential files
self.addEventListener("install", event => {
  self.skipWaiting(); // Activate new service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate and remove old caches
self.addEventListener("activate", event => {
  clients.claim(); // Take control of all clients
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Fetch from cache first, then fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
