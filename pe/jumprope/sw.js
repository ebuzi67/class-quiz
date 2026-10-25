// 줄넘기 챌린지 오프라인 지원
// 화면 파일: 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
// ../lib/ 안의 포즈 인식 파일(무궁화 꽃과 함께 씀, 크고 잘 안 바뀜): 한 번 받으면 저장해 둔 것을 바로 써요.
const CACHE = "pe-jumprope-v1";
const LIB = "pe-jumprope-lib-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전(과 잠깐 있던 "체육시간" 통합 앱 저장분)만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => (key.startsWith("pe-jumprope-") && key !== CACHE && key !== LIB) || key.startsWith("pe-time-")).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.includes("/lib/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(LIB).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }))
    );
    return;
  }
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
