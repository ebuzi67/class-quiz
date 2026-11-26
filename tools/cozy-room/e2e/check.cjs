// 브라우저로 앱을 실제로 눌러 보며 확인하는 자동 점검이에요.
// 실행: npm run dev (또는 npm run build && npm run preview) 로 앱을 띄운 뒤
//       node e2e/check.cjs http://localhost:5173/
// 스크린샷은 e2e/out/ 에 저장돼요.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5173/';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
let pass = 0;
const fails = [];
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✓', name); } else { fails.push(name); console.log('  ✗', name, extra); }
};
// 서버의 그래픽카드가 없어도 돌아가게 소프트웨어 WebGL 을 써요
const LAUNCH = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };

(async () => {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const tapThing = async (kind, id) => {
    const pt = await p.evaluate(([k, i]) => app.screenOf(k, i), [kind, id]);
    await p.mouse.click(pt.x, pt.y);
  };
  const waitDoing = (id, timeout = 60000) => p.waitForFunction((a) => app.brain.current?.action.id === a && app.brain.current.phase === 'do', id, { timeout });

  console.log('■ 처음 열기');
  const t0 = Date.now();
  await p.goto(BASE);
  await p.waitForSelector('.modal');
  ok(Date.now() - t0 < 15000, `15초 안에 열려요 (${Date.now() - t0}ms)`);
  ok((await p.title()) === '모모의 코딩 하루', '제목');
  ok(await p.isVisible('text=환영해요'), '처음 열면 조작 안내가 나와요');
  ok(await p.isHidden('#loading') || (await p.$('#loading')) === null, '로딩 화면이 사라져요');
  await p.screenshot({ path: path.join(OUT, '1-help.png') });
  await p.click('text=시작하기');
  ok(await p.isHidden('#modal'), '시작하기를 누르면 안내가 닫혀요');
  ok((await p.locator('.gauge[role="meter"]').count()) === 3, '상태 게이지 3개');
  await p.waitForFunction(() => app.brain.current, null, { timeout: 8000 });
  ok(true, '접속하자마자 자동으로 생활을 시작해요');
  await p.click('[data-act="speed"]');
  ok((await p.getAttribute('[data-act="speed"]', 'aria-pressed')) === 'true', '2배속 켜기');

  console.log('■ 가구를 눌러 행동 부탁하기');
  await p.click('[data-act="camera"]');
  await p.waitForTimeout(1000);
  await tapThing('furniture', 'vanity');
  await p.waitForSelector('#menu:not([hidden])');
  ok((await p.textContent('#menu-title')).includes('화장대'), '화장대를 누르면 화장대 메뉴가 나와요');
  ok(await p.isVisible('#menu [data-action="cream"]'), '메뉴에 크림 바르기가 있어요');
  ok((await p.evaluate(() => app.world.highlighted.size)) >= 1, '누른 가구가 강조돼요');
  await p.click('#menu [data-action="cream"]');
  ok(await p.isHidden('#menu'), '고르면 메뉴가 닫혀요');
  await p.click('[data-act="things"]');
  await p.click('#menu li:has-text("화장대") button');
  await p.click('#menu [data-action="cream"]');
  await p.waitForSelector('.toast:has-text("이미")', { timeout: 3000 }).catch(() => {});
  ok(await p.isVisible('.toast:has-text("이미")'), '같은 부탁을 두 번 하면 한 번만 들어가요');
  await waitDoing('cream');
  await p.waitForFunction(() => !!app.char.held && !app.char.hopping, null, { timeout: 10000 }).catch(() => {});
  const seatOk = await p.evaluate(() => app.char.sitting && Math.abs(app.char.position.x - (-3.06)) < 0.2);
  ok(seatOk, '화장대 의자에 앉아서 해요');
  ok(await p.evaluate(() => !!app.char.held), '크림을 손에 들어요');
  ok((await p.textContent('#status')).includes('크림 바르기'), '현재 행동 문구가 나와요');
  await p.screenshot({ path: path.join(OUT, '2-cream.png') });
  await p.waitForFunction(() => app.brain.current?.action.id !== 'cream', null, { timeout: 30000 });
  ok(await p.evaluate(() => app.world.products.get('cream').mesh.parent?.name === 'furniture-vanity'), '끝나면 크림이 제자리로 돌아가요');

  console.log('■ 도구 버튼');
  await p.click('[data-act="auto"]');
  ok((await p.getAttribute('[data-act="auto"]', 'aria-pressed')) === 'false', '자동 행동 멈춤');
  await p.click('[data-act="sound"]');
  ok((await p.getAttribute('[data-act="sound"]', 'aria-pressed')) === 'true', '소리 켜기');
  await p.click('[data-act="sound"]');
  await p.click('[data-act="things"]');
  ok((await p.locator('#menu li').count()) >= 10, '물건 목록에 가구가 모두 나와요');
  await p.keyboard.press('Escape');
  ok(await p.isHidden('#menu'), 'Esc로 메뉴를 닫아요');
  await p.click('[data-act="big"]');
  ok(await p.evaluate(() => document.documentElement.classList.contains('big')), '큰 화면 모드');
  await p.click('[data-act="big"]');

  console.log('■ 코딩 모드: 순서 (미션 2)');
  await p.click('[data-act="code"]');
  ok(await p.isVisible('#panel'), '코딩 모드 패널이 열려요');
  for (let i = 0; i < 3; i++) await p.click('#palette [data-new="action"]');
  const sels = p.locator('#workspace .blk.t-action select');
  ok((await sels.count()) === 3, '꾸러미 블록을 누르면 코드에 들어가요');
  await sels.nth(0).selectOption('wave');
  await sels.nth(1).selectOption('jump');
  await sels.nth(2).selectOption('stretch');
  await p.click('#run');
  ok(await p.isDisabled('#run'), '실행 중에는 실행 버튼이 잠겨요');
  await p.waitForSelector('.blk.running', { timeout: 15000 });
  ok(true, '실행 중인 블록이 반짝여요');
  await p.waitForFunction(() => document.querySelector('#run-state').textContent.includes('끝까지'), null, { timeout: 60000 });
  ok(await p.evaluate(() => app.missions.passed.has('m2-sequence')), '미션 2 (순서) 통과');
  ok(await p.evaluate(() => app.missions.passed.has('m1-click') === false), '클릭 미션은 아직 (부탁 1가지만 함)');

  console.log('■ 코드 보기, 공유');
  await p.click('#show-code');
  ok((await p.textContent('.code-view')).includes('function 시작하면()'), '글자 코드로 보여 줘요');
  ok((await p.textContent('.code-view')).includes('손흔들기();'), '행동 이름이 함수처럼 나와요');
  await p.keyboard.press('Escape');
  await p.click('#tab-share');
  const code = await p.inputValue('#share-out');
  ok(code.startsWith('MOMO1-'), '공유 코드가 만들어져요');
  await p.fill('#share-in', code);
  await p.click('#load-code');
  ok((await p.locator('#workspace .blk.t-action').count()) === 3, '공유 코드를 불러오면 같은 블록이 생겨요');
  await p.fill('#share-in', '엉터리');
  await p.click('#load-code');
  ok(await p.isVisible('.toast.err'), '잘못된 코드는 알려 주고 무시해요');

  console.log('■ 끌어다 놓기, 반복 (미션 3)');
  await p.click('#tab-share');
  p.once('dialog', (d) => d.accept());
  await p.click('#clear-code');
  await p.click('#tab-blocks');
  const src = await p.locator('#palette [data-new="repeat"]').boundingBox();
  const dst = await p.locator('#workspace .slot').first().boundingBox();
  await p.mouse.move(src.x + 20, src.y + 15);
  await p.mouse.down();
  await p.mouse.move(src.x + 60, src.y + 40, { steps: 5 });
  await p.mouse.move(dst.x + 30, dst.y + 3, { steps: 8 });
  await p.mouse.up();
  ok((await p.locator('#workspace .blk.t-repeat').count()) === 1, '반복 블록을 끌어다 놓아요');
  await p.click('#palette [data-new="action"]'); // 반복 블록 안(선택된 칸)으로 들어가요
  ok((await p.locator('#workspace .t-repeat .blk.t-action').count()) === 1, '반복 블록 안에 행동이 들어가요');
  await p.locator('#workspace .t-repeat .blk.t-action select').selectOption('combHair');
  await p.locator('#workspace .t-repeat input[data-field="times"]').fill('3');
  await p.locator('#workspace .t-repeat input[data-field="times"]').dispatchEvent('change');
  await p.click('#run');
  await p.waitForFunction(() => document.querySelector('#run-state').textContent.includes('끝까지'), null, { timeout: 90000 });
  ok(await p.evaluate(() => app.missions.passed.has('m3-repeat')), '미션 3 (반복) 통과');

  console.log('■ 이벤트 스크립트 (미션 5)');
  await p.click('[data-act="add-script"]');
  const hatSel = p.locator('#workspace .script').nth(1).locator('select[data-sfield="event"]');
  await hatSel.selectOption('clickThing');
  await p.locator('#workspace .script').nth(1).locator('select[data-sfield="thing"]').selectOption('plant');
  await p.locator('#workspace .script').nth(1).locator('.blk-body').first().click({ position: { x: 10, y: 10 } });
  await p.click('#palette [data-new="action"]');
  await p.locator('#workspace .script').nth(1).locator('.blk.t-action select').selectOption('water');
  await p.click('#run');
  await p.waitForFunction(() => document.querySelector('#run-state').textContent.includes('기다리는 중'), null, { timeout: 90000 });
  ok(true, '시작 스크립트가 끝나면 이벤트를 기다려요');
  await p.click('[data-act="close-panel"]');
  await tapThing('furniture', 'plant');
  ok(await p.isHidden('#menu'), '이벤트가 있는 물건은 메뉴 대신 코드를 실행해요');
  await waitDoing('water');
  await p.waitForFunction(() => app.missions.passed.has('m5-event'), null, { timeout: 30000 }).catch(() => {});
  ok(await p.evaluate(() => app.missions.passed.has('m5-event')), '미션 5 (이벤트) 통과');
  await p.click('[data-act="code"]');
  await p.click('#stop');
  ok(await p.isEnabled('#run'), '멈춤을 누르면 다시 실행할 수 있어요');

  console.log('■ 한 단계씩 실행');
  await p.check('#step-mode');
  await p.click('#run');
  await p.waitForSelector('#step-next:not([hidden])', { timeout: 5000 });
  ok(true, '한 단계씩: 다음 버튼이 나와요');
  const before = await p.evaluate(() => document.querySelector('.blk.running')?.dataset.id);
  await p.click('#step-next');
  await p.waitForTimeout(300);
  ok(!!before, '한 단계씩: 지금 블록을 표시해요');
  await p.click('#stop');
  await p.uncheck('#step-mode');

  console.log('■ 미션 1, 키보드로 블록 지우기');
  await p.click('[data-act="close-panel"]');
  await tapThing('character', 'character');
  await p.click('#menu [data-action="wave"]');
  await p.click('[data-act="things"]');
  await p.click('#menu li:has-text("러그") button');
  await p.click('#menu [data-action="dance"]');
  await p.waitForFunction(() => app.missions.passed.has('m1-click'), null, { timeout: 60000 }).catch(() => {});
  ok(await p.evaluate(() => app.missions.passed.has('m1-click')), '미션 1 (부탁 2가지) 통과');
  await p.click('[data-act="code"]');
  const n0 = await p.locator('#workspace .blk').count();
  await p.locator('#workspace .blk').first().focus();
  await p.keyboard.press('Delete');
  ok((await p.locator('#workspace .blk').count()) < n0, 'Delete 키로 블록을 지워요');
  await p.screenshot({ path: path.join(OUT, '3-coding.png') });
  await p.click('#tab-missions');
  ok((await p.locator('.mission.done').count()) >= 4, '미션 탭에 도장이 찍혀요');
  await p.screenshot({ path: path.join(OUT, '4-missions.png') });

  console.log('■ 새로고침해도 코드와 도장이 남아요');
  await p.reload();
  await p.waitForFunction(() => window.app);
  ok(await p.evaluate(() => app.missions.passed.size >= 4 && app.editor.program.scripts.length >= 1), '저장된 진행 상황을 불러와요');

  console.log('■ 성능 (참고: 소프트웨어 그래픽이라 실제 기기보다 느려요)');
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
  const info = await p.evaluate(() => ({ calls: app.renderer.info.render.calls, tris: app.renderer.info.render.triangles, geos: app.renderer.info.memory.geometries }));
  console.log(`  · ${fps.toFixed(1)} fps, 그리기 ${info.calls}번, 삼각형 ${info.tris}, 도형 ${info.geos}`);

  console.log('■ 휴대폰 화면');
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const m = await phone.newPage();
  m.on('pageerror', (e) => errors.push('[폰] ' + e));
  await m.goto(BASE);
  await m.waitForSelector('.modal');
  await m.tap('text=시작하기');
  await m.waitForTimeout(1500);
  const layout = await m.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, w: innerWidth,
    tools: document.querySelector('.tools').getBoundingClientRect().bottom <= innerHeight,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches && app.char.reducedMotion,
  }));
  ok(layout.scrollW <= layout.w, '휴대폰: 가로 스크롤이 없어요');
  ok(layout.tools, '휴대폰: 도구 버튼이 화면 안에 있어요');
  ok(layout.reduced, '동작 줄이기 설정을 따라요');
  await m.screenshot({ path: path.join(OUT, '5-phone.png') });
  const pt = await m.evaluate(() => app.screenOf('furniture', 'teaTable'));
  await m.touchscreen.tap(pt.x, pt.y);
  await m.waitForSelector('#menu:not([hidden])', { timeout: 3000 }).catch(() => {});
  ok(await m.isVisible('#menu'), '휴대폰: 터치로 가구 메뉴가 열려요');
  await m.screenshot({ path: path.join(OUT, '6-phone-menu.png') });
  await m.tap('#menu .icon-btn');
  await m.tap('[data-act="code"]');
  await m.tap('#palette [data-new="action"]');
  ok((await m.locator('#workspace .blk.t-action').count()) === 1, '휴대폰: 블록을 터치로 넣어요');
  await m.screenshot({ path: path.join(OUT, '7-phone-coding.png') });

  console.log('■ 콘솔 오류');
  ok(errors.length === 0, '콘솔 오류 없음', errors.slice(0, 5).join('\n'));

  await browser.close();
  console.log(`\n결과: 통과 ${pass}개, 실패 ${fails.length}개`);
  if (fails.length) { console.log('실패:', fails.join(', ')); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
