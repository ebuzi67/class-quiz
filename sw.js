// 전체 메뉴(사이트 맨 앞 페이지) 오프라인 지원
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
// 이 주소(/class-quiz/) 아래에는 다른 앱들이 모두 있어서, 전체 메뉴 자체의 파일만 맡아요.
// 각 앱은 자기 서비스 워커가 따로 맡아요.
const CACHE = "home-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./math/icons/icon-192.png",
  "./europe/icons/icon-192.png",
  "./pe/icons/icon-192.png",
  "./motion/icons/icon-192.png",
  "./roblox/icons/icon-192.png",
  "./village/icons/icon-192.png",
  "./one-chat/icons/icon-192.png"
];
const SCOPE = self.registration.scope;
const MINE = new Set(FILES.map((file) => new URL(file, SCOPE).href));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 이 앱의 옛 버전과, 예전에 이 주소에 있던 수학 퀴즈·분수 퀴즈 저장분만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((key) => (key.startsWith("home-") && key !== CACHE) || key === "math-home-v1" || key === "fraction-quiz-v1")
        .map((key) => caches.delete(key)))
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
          .then((cached) => cached || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
      )
  );
});
