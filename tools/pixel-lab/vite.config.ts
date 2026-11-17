import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// 빌드할 때 서비스 워커(sw.js)를 만들어요. 빌드에서 나온 파일 목록을 넣어서 오프라인에서도 열려요.
function serviceWorker(): Plugin {
  const walk = (dir: string, base = ''): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f), base + f + '/') : [base + f]));
  return {
    name: 'pixel-lab-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['./', './index.html', ...Object.keys(bundle).filter((f) => f !== 'index.html').map((f) => './' + f), ...walk('public').map((f) => './' + f)];
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 8);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// 픽셀 마법사 연구소 오프라인 지원 (빌드할 때 자동으로 만들어져요. tools/pixel-lab/vite.config.ts)
// 인터넷이 되면 항상 새 버전을 받아 오고, 안 되면 저장해 둔 버전을 보여 줘요.
const CACHE = "pixel-lab-${version}";
const FILES = ${JSON.stringify(files, null, 2)};
const SCOPE = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

// 같은 사이트의 다른 앱 저장분은 건드리지 않고, 이 앱의 옛 버전만 지워요.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("pixel-lab-") && key !== CACHE).map((key) => caches.delete(key)))
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
`,
      });
    },
  };
}

export default defineConfig({
  // 상대 경로로 빌드해서 어느 폴더에 올려도 열려요
  base: './',
  plugins: [react(), serviceWorker()],
  build: { outDir: 'dist', emptyOutDir: true },
});
