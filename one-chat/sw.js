// 원이랑 대화하기 오프라인 지원
// 화면 파일만 맡아요. 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
// index.html은 manifest.json?v=숫자 로 불러요. 앱 이름·아이콘을 바꾸면 그 숫자를 올려야 휴대폰이 옛 이름을 안 써요.
// 원의 대답은 모두 brain.js 안에 들어 있어서, 한 번 열어 두면 인터넷 없이도 이야기할 수 있어요.
const CACHE = "one-chat-v6";
const FILES = [
  "./",
  "./index.html",
  "./brain.js",
  "./words.js",
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
      Promise.all(keys.filter((key) => key.startsWith("one-chat-") && key !== CACHE).map((key) => caches.delete(key)))
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
