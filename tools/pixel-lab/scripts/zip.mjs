// 프로젝트 전체(소스 + 빌드 결과 dist/)를 pixel-magic-lab.zip으로 묶어요.
// 실행: npm run build && npm run zip   (zip 명령이 있어야 해요)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'pixel-magic-lab.zip');
if (!existsSync(join(root, 'dist/index.html'))) {
  console.error('dist/가 없어요. 먼저 npm run build를 실행해 주세요.');
  process.exit(1);
}
const stage = mkdtempSync(join(tmpdir(), 'pml-'));
const dest = join(stage, 'pixel-magic-lab');
const skip = ['node_modules', 'pixel-magic-lab.zip', join('e2e', 'out')].map((p) => join(root, p));
cpSync(root, dest, { recursive: true, filter: (src) => !skip.includes(src) });
rmSync(out, { force: true });
execFileSync('zip', ['-rqX', out, 'pixel-magic-lab'], { cwd: stage });
rmSync(stage, { recursive: true, force: true });
console.log('만듦:', out);
