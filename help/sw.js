// 저요! 저요! 도와주세요 — 오프라인 지원과 브라우저 알림 클릭 처리
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 화면을 보여 줘요.
// (요청을 주고받는 일은 인터넷이 있어야 해요. Firebase 요청은 여기서 건드리지 않아요.)
const CACHE = "helpme-v1";
const FILES = [
  "./",
  "./index.html",
  "./admin.html",
  "./style.css",
  "./common.js",
  "./store.js",
  "./script.js",
  "./admin.js",
  "./firebase.js",
  "./firebase-config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];
const SCOPE = self.registration.scope;
const MINE = new Set(FILES.map((file) => new URL(file, SCOPE).href));

self.addEventListener("install", (event) => {
  // GitHub Pages는 파일을 브라우저에 10분까지 저장해 두게 해요. 그 저장분을 건너뛰어야 새 버전이 바로 들어와요.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("helpme-") && key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  url.search = "";
  url.hash = "";
  if (event.request.method !== "GET" || !MINE.has(url.href)) return;
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
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

// 선생님이 브라우저 알림을 누르면: 열려 있는 선생님 화면을 앞으로 가져와 그 요청을 열어요.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const id = event.notification.data?.id;
  const adminUrl = new URL(`admin.html${id ? `#req=${encodeURIComponent(id)}` : ""}`, SCOPE).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const admin = all.find((c) => new URL(c.url).pathname.endsWith("/admin.html"));
    if (admin) {
      await admin.focus();
      admin.postMessage({ type: "open-request", id });
    } else {
      await self.clients.openWindow(adminUrl);
    }
  })());
});

// ── 나중에 Firebase Cloud Messaging(FCM)으로 "창을 닫아도 오는 푸시 알림"을 붙일 자리 ──
// README.md의 "더 나아가기: 백그라운드 푸시 알림"을 보세요. 서버(Cloud Functions)가 보낸 푸시는
// 아래 push 이벤트로 들어와요. 지금은 서버가 없으니 아무 일도 일어나지 않아요.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* 글자만 온 경우 */ }
  const n = data.notification || data;
  event.waitUntil(self.registration.showNotification(n.title || "새로운 도움 요청이 도착했어요!", {
    body: n.body || "학생의 도움 요청을 확인해 주세요.",
    icon: "icons/icon-192.png",
    tag: data.data?.id ? `helpme-${data.data.id}` : "helpme-push",
    data: { id: data.data?.id },
  }));
});
