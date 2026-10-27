// 꼬마 발명가 마을 오프라인 지원
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
// (친구들과 함께 놀기는 인터넷이 있어야 해요. 혼자 둘러보기는 저장분으로도 돼요.)
const CACHE = "village-v5";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./js/avatar.js",
  "./js/maps.js",
  "./js/net.js",
  "./js/activities.js",
  "./js/act-garden.js",
  "./js/act-greenhouse.js",
  "./js/act-observatory.js",
  "./js/act-workshop.js",
  "./js/main.js",
  "./lib/peerjs.min.js",
  "./assets/village.webp",
  "./assets/robot.webp",
  "./assets/magnet.webp",
  "./assets/greenhouse.webp",
  "./assets/observatory.webp",
  "./assets/workshop.webp",
  "./assets/garden.webp",
  "./assets/npc/chief.webp",
  "./assets/npc/bolt.webp",
  "./assets/npc/snap.webp",
  "./assets/npc/sprout.webp",
  "./assets/npc/luna.webp",
  "./assets/npc/tinker.webp",
  "./assets/npc/farmer.webp",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];
const SCOPE = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("village-") && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 이 앱 폴더 안의 파일만 맡아요.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.href.startsWith(SCOPE)) return;
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
