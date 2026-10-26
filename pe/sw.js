// 체육시간(게임 고르기) 오프라인 지원
// 이 서비스 워커는 게임 고르기 화면 파일만 맡아요. 각 게임(pe/wall/ 등)은 자기 서비스 워커가 따로 있어서
// 그쪽 파일과 ../lib/ 은 건드리지 않고 그대로 보내요.
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "pe-hub-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];
const MINE = new Set(FILES.map((f) => new URL(f, self.registration.scope).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("pe-hub-") && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

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
          .then((cached) => cached || caches.match("./index.html"))
      )
  );
});
