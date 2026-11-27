// 모모의 코딩 하루 오프라인 지원 (빌드할 때 자동으로 만들어져요. tools/cozy-room/vite.config.js)
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "cozy-room-62c20416";
const FILES = [
  "./",
  "./index.html",
  "./pet.html",
  "./assets/main-D18u0PdA.css",
  "./assets/pet-B8YA3B2b.css",
  "./assets/three-CmsoEPJ3.js",
  "./assets/main-CoST4v-z.js",
  "./assets/pet-CL-am5_s.js",
  "./assets/save-BXsaWFjU.js",
  "./assets/scene-Czf7dJTX.js",
  "./assets/models-WHpnGa9o.js",
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
  "./pet/img/wide.webp"
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
