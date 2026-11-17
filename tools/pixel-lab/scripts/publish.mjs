// 빌드 결과(dist/)를 GitHub Pages에 올라가는 폴더(저장소의 pixel-lab/)로 복사해요.
// 실행: npm run publish-site
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist');
const out = resolve(here, '../../../pixel-lab');

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('dist/가 없어요. 먼저 npm run build를 실행해 주세요.');
  process.exit(1);
}
if (!existsSync(resolve(here, '../../../CLAUDE.md'))) {
  console.error('class-quiz 저장소 안이 아니에요. dist/ 폴더를 그대로 웹 호스팅에 올리면 돼요.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });
console.log('복사 완료:', out);
