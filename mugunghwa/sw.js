// 무궁화 꽃 게임은 체육시간/ 으로 옮겼어요.
// 예전 주소(mugunghwa/)에 남은 서비스 워커와 저장분을 지워서 새 주소로 넘어가게 해요.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter((k) => k.startsWith("mugunghwa-")).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
