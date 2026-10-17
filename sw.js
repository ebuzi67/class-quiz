// 예전에는 분수 퀴즈가 이 주소(/class-quiz/)에 있었어요. 지금은 fraction4/로 옮겼어요.
// 예전 버전이 남긴 서비스 워커와 저장분을 지워서, 넓이 퀴즈(area5/)와 분수 퀴즈(fraction4/)가
// 각자 따로 동작하게 해요.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await caches.delete("fraction-quiz-v1");
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
