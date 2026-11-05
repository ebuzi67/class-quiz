// 유럽 탐방 모음 페이지 오프라인 지원
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "europe-v2";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./london/icons/icon-192.png",
  "./paris/icons/icon-192.png",
  "./rome/icons/icon-192.png",
  "./italy/icons/icon-192.png",
  "./spain/icons/icon-192.png",
  "./portugal/icons/icon-192.png",
  "./germany/icons/icon-192.png",
  "./austria/icons/icon-192.png",
  "./czech/icons/icon-192.png",
  "./hungary/icons/icon-192.png"
];
const SCOPE = self.registration.scope;
const MINE = new Set(FILES.map((file) => new URL(file, SCOPE).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("europe-") && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 모음 페이지 자체의 파일만 맡아요. 나라 앱(london/ 등)은 자기 서비스 워커가 따로 맡아요.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  url.search = "";
  if (event.request.method !== "GET" || !MINE.has(url.href)) return;
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
