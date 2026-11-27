// 모모의 코딩 하루 오프라인 지원 (빌드할 때 자동으로 만들어져요. tools/cozy-room/vite.config.js)
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "cozy-room-6c9b03d1";
const FILES = [
  "./",
  "./index.html",
  "./pet.html",
  "./assets/main-D18u0PdA.css",
  "./assets/pet-B8YA3B2b.css",
  "./assets/three-ByohY-x_.js",
  "./assets/main-86mAoO0v.js",
  "./assets/pet-B06DGUaM.js",
  "./assets/save-C9-_3zd7.js",
  "./assets/scene-DrKEJGFD.js",
  "./assets/models-BMlAQgXo.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.json",
  "./pet/img/bichon-sil.png",
  "./pet/img/bichon.webp",
  "./pet/img/blackcat-sil.png",
  "./pet/img/blackcat.webp",
  "./pet/img/calico-sil.png",
  "./pet/img/calico.webp",
  "./pet/img/chafer-sil.png",
  "./pet/img/chafer.webp",
  "./pet/img/cheese-sil.png",
  "./pet/img/cheese.webp",
  "./pet/img/corgi-sil.png",
  "./pet/img/corgi.webp",
  "./pet/img/golden-sil.png",
  "./pet/img/golden.webp",
  "./pet/img/king-sil.png",
  "./pet/img/king.webp",
  "./pet/img/mackerel-sil.png",
  "./pet/img/mackerel.webp",
  "./pet/img/pomeranian-sil.png",
  "./pet/img/pomeranian.webp",
  "./pet/img/poodle-sil.png",
  "./pet/img/poodle.webp",
  "./pet/img/rhino-sil.png",
  "./pet/img/rhino.webp",
  "./pet/img/russianblue-sil.png",
  "./pet/img/russianblue.webp",
  "./pet/img/saw-sil.png",
  "./pet/img/saw.webp",
  "./pet/img/shiba-sil.png",
  "./pet/img/shiba.webp",
  "./pet/img/stag-sil.png",
  "./pet/img/stag.webp",
  "./pet/img/tuxedo-sil.png",
  "./pet/img/tuxedo.webp",
  "./pet/img/wide-sil.png",
  "./pet/img/wide.webp",
  "./pet/views/bichon-back.webp",
  "./pet/views/bichon-front.webp",
  "./pet/views/bichon-q.webp",
  "./pet/views/bichon-side.webp",
  "./pet/views/blackcat-back.webp",
  "./pet/views/blackcat-front.webp",
  "./pet/views/blackcat-q.webp",
  "./pet/views/blackcat-side.webp",
  "./pet/views/calico-back.webp",
  "./pet/views/calico-front.webp",
  "./pet/views/calico-q.webp",
  "./pet/views/calico-side.webp",
  "./pet/views/chafer-back.webp",
  "./pet/views/chafer-front.webp",
  "./pet/views/chafer-q.webp",
  "./pet/views/chafer-side.webp",
  "./pet/views/cheese-back.webp",
  "./pet/views/cheese-front.webp",
  "./pet/views/cheese-q.webp",
  "./pet/views/cheese-side.webp",
  "./pet/views/corgi-back.webp",
  "./pet/views/corgi-front.webp",
  "./pet/views/corgi-q.webp",
  "./pet/views/corgi-side.webp",
  "./pet/views/golden-back.webp",
  "./pet/views/golden-front.webp",
  "./pet/views/golden-q.webp",
  "./pet/views/golden-side.webp",
  "./pet/views/king-back.webp",
  "./pet/views/king-front.webp",
  "./pet/views/king-q.webp",
  "./pet/views/king-side.webp",
  "./pet/views/mackerel-back.webp",
  "./pet/views/mackerel-front.webp",
  "./pet/views/mackerel-q.webp",
  "./pet/views/mackerel-side.webp",
  "./pet/views/pomeranian-back.webp",
  "./pet/views/pomeranian-front.webp",
  "./pet/views/pomeranian-q.webp",
  "./pet/views/pomeranian-side.webp",
  "./pet/views/poodle-back.webp",
  "./pet/views/poodle-front.webp",
  "./pet/views/poodle-q.webp",
  "./pet/views/poodle-side.webp",
  "./pet/views/rhino-back.webp",
  "./pet/views/rhino-front.webp",
  "./pet/views/rhino-q.webp",
  "./pet/views/rhino-side.webp",
  "./pet/views/russianblue-back.webp",
  "./pet/views/russianblue-front.webp",
  "./pet/views/russianblue-q.webp",
  "./pet/views/russianblue-side.webp",
  "./pet/views/saw-back.webp",
  "./pet/views/saw-front.webp",
  "./pet/views/saw-q.webp",
  "./pet/views/saw-side.webp",
  "./pet/views/shiba-back.webp",
  "./pet/views/shiba-front.webp",
  "./pet/views/shiba-q.webp",
  "./pet/views/shiba-side.webp",
  "./pet/views/stag-back.webp",
  "./pet/views/stag-front.webp",
  "./pet/views/stag-q.webp",
  "./pet/views/stag-side.webp",
  "./pet/views/tuxedo-back.webp",
  "./pet/views/tuxedo-front.webp",
  "./pet/views/tuxedo-q.webp",
  "./pet/views/tuxedo-side.webp",
  "./pet/views/wide-back.webp",
  "./pet/views/wide-front.webp",
  "./pet/views/wide-q.webp",
  "./pet/views/wide-side.webp"
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
      Promise.all(keys.filter((key) => key.startsWith("cozy-room-") && key !== CACHE).map((key) => caches.delete(key)))
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
