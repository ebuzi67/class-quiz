// 체육시간 앱은 pe/ 로 옮겼어요(주소에 한글이 있으면 링크가 깨질 수 있어서).
// 예전 주소(체육시간/)에 남은 서비스 워커와 저장분을 지워서 새 주소로 넘어가게 해요.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter((k) => k.startsWith("pe-time-")).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
