// 픽셀 마법사 연구소 오프라인 지원 (빌드할 때 자동으로 만들어져요. tools/pixel-lab/vite.config.ts)
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "pixel-lab-95003aae";
const FILES = [
  "./",
  "./index.html",
  "./assets/Jua-subset-CMssbvRY.woff2",
  "./assets/index-s4kxB6En.css",
  "./assets/index-dUfcHbWe.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.json"
];
const SCOPE = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("pixel-lab-") && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 이 앱 폴더 안의 파일만 맡아요.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(SCOPE)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request, { ignoreSearch: true })
          .then((cached) => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
      )
  );
});
