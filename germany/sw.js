// 이 앱은 europe/germany/ 로 옮겼어요. (수학 앱은 math/, 유럽 나라 앱은 europe/ 아래로 모았어요.)
// 예전 주소(germany/)에 남은 서비스 워커와, 이 예전 주소의 저장분만 지워서 새 주소로 넘어가게 해요.
// 새 주소의 저장분은 주소가 달라서 건드리지 않아요.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const scope = self.registration.scope;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (request.url.startsWith(scope)) await cache.delete(request);
      }
    }
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
