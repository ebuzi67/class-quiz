// 브라우저로 앱을 실제로 눌러 보며 확인하는 자동 점검이에요.
// 실행: 먼저 `npm run build && npm run preview`로 앱을 띄운 뒤
//       node e2e/check.cjs http://localhost:4173/
// (Playwright와 Chromium이 설치되어 있어야 해요. 내려받은 파일은 e2e/out/에 저장돼요.)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:4173/';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0;
const fails = [];
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✓', name); } else { fails.push(name); console.log('  ✗', name, extra); }
};

(async () => {
  // 한글 파일 이름으로 내려받는지 보려면 UTF-8 환경이어야 해요
  const browser = await chromium.launch({ env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const drawer = (label) => p.click(`.blk-btn:has-text("${label}")`);
  const speed = (n) => p.click(`.speed .seg button:nth-child(${n})`);
  const run = () => p.click('.runpanel .btn.big');
  const stateText = () => p.textContent('.run-state');
  const painted = () => p.locator('.pcanvas .pc-cell').count();
  const labels = () => p.$$eval('.ws-scroll .blk-head', (els) => els.map((e) => e.textContent.replace(/\s+/g, '')));
  const waitState = (t) => p.waitForFunction((s) => document.querySelector('.run-state')?.textContent.includes(s), t, { timeout: 30000 });
  const noScroll = async (name) => {
    const r = await p.evaluate(() => {
      const side = document.querySelector('.side');
      const big = document.querySelector('.runpanel .btn.big').getBoundingClientRect();
      return {
        page: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth,
        side: side.scrollHeight <= side.clientHeight + 1,
        run: big.bottom <= innerHeight && big.top >= 0,
        canvas: document.querySelector('.pcanvas').getBoundingClientRect().height,
      };
    });
    ok(r.page && r.side && r.run && r.canvas > 250, `${name}: 스크롤 없이 한 화면 (도화지 ${Math.round(r.canvas)}px)`, JSON.stringify(r));
  };

  console.log('■ 처음 열기');
  await p.goto(BASE);
  await p.waitForSelector('.modal');
  ok(await p.isVisible('text=환영해요'), '처음 열면 사용 방법 안내가 나와요');
  await p.click('text=시작하기');
  ok((await p.title()) === '픽셀 마법사 연구소', '제목');
  await p.click('button[aria-label="소리 끄기"]');

  console.log('■ 미션 1: 블록을 눌러 넣고 실행');
  await run();
  ok(await p.isVisible('.toast'), '블록 없이 실행하면 안내만 나오고 멈추지 않아요');
  await drawer('색칠하기');
  ok((await labels()).length === 1, '블록이 주문서에 들어가요');
  await speed(3);
  await run();
  await p.waitForSelector('.modal.success');
  ok((await p.textContent('.modal.success')).includes('블록 1개'), '성공 판정 + 사용한 블록 수 표시');
  ok(await p.isVisible('.modal.success .big-star.bonus'), '효율 별 표시');
  await p.click('.modal.success >> text=다음 미션');
  ok((await p.textContent('.ms-no')).includes('2'), '다음 미션으로 이동');

  console.log('■ 미션 2: 순서, 틀린 그림, 도화지 밖, 일시정지, 한 단계');
  await drawer('색칠하기');
  await speed(4);
  await run();
  await p.waitForSelector('.status.retry');
  ok((await p.textContent('.status.retry')).includes('다른 칸이 3개'), '목표와 다르면 다른 칸 수를 알려 줘요');
  ok((await p.locator('.pc-wrong').count()) === 3, '틀린 칸을 빗금으로 표시해요');
  await p.click('.status.retry >> text=힌트 보기');
  ok(await p.isVisible('.hints li'), '힌트가 열려요');
  await p.click('text=힌트 하나 더');
  ok((await p.locator('.hints li').count()) === 2, '힌트를 단계별로 보여 줘요');
  await p.click('text=해 볼게요');
  for (let i = 0; i < 4; i++) await drawer('오른쪽으로 1칸');
  await run();
  await p.waitForSelector('.status.error');
  ok((await p.textContent('.status.error')).includes('오른쪽 밖으로'), '도화지 밖으로 나가면 이유를 알려 줘요');
  ok((await p.locator('.blk.error').count()) === 1 && (await labels())[4].includes('!'), '오류가 난 블록(다섯째)을 표시해요');
  ok((await p.getAttribute('.pc-pen', 'class')).includes('error'), '펜 위치에 오류 표시');
  // 주문서 비우고 정답 넣기
  await p.click('button[aria-label="주문서 비우기"]');
  await p.click('.modal >> text=비우기');
  ok((await labels()).length === 0, '주문서 비우기');
  for (const b of ['색칠하기', '오른쪽으로 1칸', '색칠하기', '오른쪽으로 1칸', '색칠하기', '오른쪽으로 1칸', '색칠하기']) await drawer(b);
  await speed(1);
  await run();
  await p.waitForFunction(() => document.querySelectorAll('.pcanvas .pc-cell').length >= 1);
  ok((await stateText()).includes('실행 중'), '실행 중 상태 표시');
  ok((await p.locator('.blk.active').count()) === 1, '실행 중인 블록 강조');
  await run(); // 일시정지
  ok((await stateText()).includes('잠깐 멈춤'), '일시정지');
  const before = await p.textContent('.status');
  await p.waitForTimeout(1200);
  ok(before === (await p.textContent('.status')), '일시정지 중에는 멈춰 있어요');
  await p.click('.run-row >> text=한 단계');
  ok(before !== (await p.textContent('.status')), '한 단계 실행하면 한 걸음만 가요');
  await speed(4);
  await run(); // 이어서 실행
  await p.waitForSelector('.modal.success');
  ok(true, '이어서 실행해서 성공');
  await p.click('.modal.success >> text=내 주문 다시 보기');
  await p.click('.run-row >> text=처음부터');
  await p.waitForSelector('.modal.success');
  ok(true, '처음부터 다시 실행');
  await p.click('.modal.success button[aria-label="닫기"]');
  await p.click('.run-row >> text=지우기');
  ok((await painted()) === 0, '실행 결과 지우기');

  console.log('■ 블록 편집: 끌어서 옮기기, 위·아래 버튼, 복사, 삭제');
  const h0 = await p.locator('.ws-scroll .blk-head').nth(0).boundingBox();
  const h1 = await p.locator('.ws-scroll .blk-head').nth(1).boundingBox();
  await p.mouse.move(h0.x + 60, h0.y + h0.height / 2);
  await p.mouse.down();
  await p.mouse.move(h0.x + 70, h0.y + 30, { steps: 4 });
  await p.mouse.move(h1.x + 70, h1.y + h1.height * 0.8, { steps: 6 });
  ok(await p.isVisible('.drop-line'), '끄는 동안 놓일 자리 표시');
  await p.mouse.up();
  await p.waitForTimeout(300);
  let l = await labels();
  ok(l[0].startsWith('오른쪽') && l[1].startsWith('색칠'), '끌어서 순서 바꾸기', l.join(','));
  await p.locator('.ws-scroll .blk-head').nth(1).click();
  await p.click('.blk-tools >> text=위로');
  l = await labels();
  ok(l[0].startsWith('색칠') && l[1].startsWith('오른쪽'), '위로 버튼으로 순서 바꾸기');
  await p.click('.blk-tools >> text=복사');
  ok((await labels()).length === 8, '블록 복사');
  await p.click('.blk-tools >> text=삭제');
  ok((await labels()).length === 7, '블록 삭제');
  // 서랍에서 끌어다 넣기
  await p.waitForTimeout(300);
  const src = await p.locator('.blk-btn:has-text("색칠하기")').boundingBox();
  const dst = await p.locator('.ws-scroll .blk-head').nth(0).boundingBox();
  await p.mouse.move(src.x + 40, src.y + 15);
  await p.mouse.down();
  await p.mouse.move(src.x + 80, src.y + 20, { steps: 3 });
  await p.mouse.move(dst.x + 60, dst.y + 6, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  l = await labels();
  ok(l.length === 8 && l[0].startsWith('색칠') && l[1].startsWith('색칠'), '서랍에서 끌어다 맨 위에 넣기', l.join(','));
  await p.locator('.ws-scroll .blk-head').nth(0).click();
  await p.click('.blk-tools >> text=삭제');

  console.log('■ 잠금과 선생님 모드');
  await p.click('text=미션 지도');
  ok((await p.locator('.map-card.locked').count()) === 9, '아직 안 푼 뒤쪽 미션은 잠겨 있어요');
  ok((await p.locator('.map-card .stamp').count()) === 2, '완료 도장');
  await p.click('.modal button[aria-label="닫기"]');
  await p.click('button[aria-label="선생님 메뉴"]');
  await p.click('.tog.big');
  ok((await p.textContent('.t-table')).includes('블록 1개'), '선생님 메뉴에서 미션 결과 확인');
  await p.click('.modal >> text=닫기');
  await p.click('text=미션 지도');
  ok((await p.locator('.map-card.locked').count()) === 0, '선생님 모드에서는 모든 미션이 열려요');
  const total = await p.locator('.map-card').count();
  ok(total >= 10, `미션 ${total}개`);
  await p.click('.modal button[aria-label="닫기"]');

  console.log('■ 모든 미션: 정답 코드로 실제 실행해서 성공 판정 확인');
  for (let i = 1; i <= total; i++) {
    await p.click('text=미션 지도');
    await p.click(`.map-card:nth-child(${i})`);
    const title = await p.textContent('.ms-title');
    await p.click('text=정답 코드');
    if (await p.isVisible('.modal >> text=불러오기')) await p.click('.modal >> text=불러오기');
    await speed(4);
    await run();
    await p.waitForSelector('.modal.success', { timeout: 30000 });
    const bonus = await p.isVisible('.modal.success .big-star.bonus');
    ok(bonus, `미션 ${i} 「${title}」 성공 + 효율 별`);
    await p.click('.modal.success button[aria-label="닫기"]');
    if (i === 7) { await p.setViewportSize({ width: 1366, height: 650 }); await p.screenshot({ path: path.join(OUT, 'mission.png') }); await p.setViewportSize({ width: 1366, height: 768 }); }
  }
  ok((await p.textContent('.rank-star')).trim() === String(total * 2), `별 ${total * 2}개 모두 획득`);

  console.log('■ 화면 크기 (미션)');
  for (const [w, h] of [[1366, 768], [1366, 650], [1280, 720], [1280, 600]]) { await p.setViewportSize({ width: w, height: h }); await noScroll(`미션 ${w}×${h}`); }
  await p.setViewportSize({ width: 1366, height: 768 });

  console.log('■ 새로고침 뒤에도 진행 기록 유지');
  await p.reload();
  await p.waitForSelector('.bench');
  ok((await p.textContent('.rank-star')).trim() === String(total * 2), '별 기록 유지');
  ok(!(await p.isVisible('text=환영해요')), '안내는 처음 한 번만');
  ok((await labels()).length > 0, '미션에서 만들던 주문서 유지');

  console.log('■ 자유 픽셀 공방: 중첩 반복을 화면에서 직접 조립');
  await p.click('.tab.t-studio');
  await p.click('.size-row .seg button:nth-child(2)'); // 10×10
  await drawer('반복하기'); // 바깥 반복 (커서가 안으로 들어감)
  await drawer('반복하기'); // 안쪽 반복
  await drawer('색칠하기');
  await drawer('오른쪽으로 1칸');
  // 바깥 반복의 「여기에 넣기」로 커서 옮기기
  await p.locator('.ws-scroll > .blk > .blk-body > .slot').click();
  await drawer('반복하기');
  await drawer('왼쪽으로 1칸');
  await p.locator('.ws-scroll > .blk > .blk-body > .slot').click();
  await drawer('아래로 1칸');
  // 반복 횟수: 바깥 4, 안쪽 둘 다 5
  const plus = p.locator('.st-btn[aria-label="반복 횟수 늘리기"]');
  await plus.nth(0).click();
  await plus.nth(1).click(); await plus.nth(1).click();
  await plus.nth(2).click(); await plus.nth(2).click();
  const nums = await p.$$eval('.st-num', (els) => els.map((e) => e.value));
  ok(nums.join(',') === '4,5,5', '반복 횟수 고치기', nums.join(','));
  // 색 블록을 맨 위로: 맨 아래에 넣고 위로 올리기
  await p.locator('.ws-scroll > .slot').click();
  await drawer('색 고르기');
  await p.locator('.ws-scroll > .blk').last().locator('.swatch-btn').click();
  await p.click('.color-pick:has-text("민트")');
  ok((await p.textContent('.ws-scroll > .blk:last-of-type .swatch-btn')).includes('민트'), '색 고르기 블록의 색 바꾸기');
  await p.locator('.ws-scroll > .blk').last().locator('.blk-label').click();
  for (let i = 0; i < 12; i++) await p.click('.blk-tools >> text=위로');
  l = await labels();
  ok(l[0].startsWith('색고르기'), '위로 버튼으로 반복 블록을 지나 맨 위까지', l.join(','));
  await speed(4);
  await run();
  await waitState('실행 끝');
  ok((await painted()) === 20, '중첩 반복 실행 결과: 4줄 × 5칸 = 20칸', String(await painted()));
  ok((await p.textContent('.status')).includes('(0, 4)'), '실행이 끝난 펜 위치 표시');

  console.log('■ 공방: 반복 횟수가 너무 클 때');
  await p.locator('.st-num').nth(0).fill('99');
  await p.locator('.st-num').nth(1).fill('99');
  await run();
  await p.waitForSelector('.status.error');
  ok(/줄여볼까요|밖으로/.test(await p.textContent('.status.error')), '너무 긴 실행도 안전하게 멈춰요');
  await p.click('.side >> text=되돌리기'); await p.click('.side >> text=되돌리기');
  await run();
  await waitState('실행 끝');
  ok((await painted()) === 20, '되돌리기 뒤 다시 실행');

  console.log('■ 공방: 손으로 찍기, 되돌리기, 저장, PNG');
  await p.click('.tools >> text=손으로');
  await p.click('.sw[aria-label="노랑"]');
  const box = await p.locator('.pcanvas').boundingBox();
  await p.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.85);
  ok((await painted()) === 21, '손으로 한 칸 칠하기');
  await p.click('.side >> text=되돌리기');
  ok((await painted()) === 20, '되돌리기');
  await p.click('.side >> text=다시 하기');
  ok((await painted()) === 21, '다시 하기');
  await p.fill('.name-input', '민트 양탄자');
  await p.click('.work .btn.primary');
  ok(await p.isVisible('.toast:has-text("저장했어요")'), '작품 저장');
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('.work >> text=PNG 받기')]);
  const pngPath = path.join(OUT, 'studio.png');
  await dl.saveAs(pngPath);
  const png = fs.readFileSync(pngPath);
  ok(png.length > 200 && png.slice(1, 4).toString() === 'PNG', `PNG 다운로드 (${dl.suggestedFilename()}, ${png.length}바이트)` ); ok(dl.suggestedFilename() === '민트-양탄자.png', '파일 이름이 작품 이름이에요');
  for (const [w, h] of [[1366, 768], [1366, 650], [1280, 720], [1280, 600]]) { await p.setViewportSize({ width: w, height: h }); await noScroll(`공방 ${w}×${h}`); }
  await p.setViewportSize({ width: 1366, height: 650 });
  await p.screenshot({ path: path.join(OUT, 'studio.png'.replace('.png', '-screen.png')) });
  await p.setViewportSize({ width: 1366, height: 768 });

  console.log('■ 공방: 새로고침 뒤 불러오기, 모드 이동 확인');
  await p.reload();
  await p.waitForSelector('.bench');
  await p.click('.tab.t-studio');
  await p.click('.work >> text=내 작품');
  ok((await p.textContent('.gallery')).includes('민트 양탄자'), '새로고침 뒤에도 저장한 작품이 있어요');
  await p.click('.g-card >> text=열기');
  ok((await painted()) === 21 && (await labels()).length === 8 && (await p.inputValue('.name-input')) === '민트 양탄자', '작품 불러오기: 그림·블록·이름·크기 그대로');
  await drawer('색칠하기');
  await p.click('.tab.t-theater');
  ok(await p.isVisible('.modal >> text=저장하지 않은 작품이 있어요'), '저장 안 한 작업이 있으면 모드 이동 전에 물어봐요');
  await p.click('.modal >> text=계속 만들기');
  ok(await p.isVisible('.tab.t-studio.on'), '「계속 만들기」를 누르면 그대로 있어요');
  await p.click('.tab.t-theater');
  await p.click('.modal >> text=저장하지 않고 이동');
  ok(await p.isVisible('.tab.t-theater.on'), '극장으로 이동');

  console.log('■ 움직이는 픽셀 극장');
  await p.click('.work >> text=불러오기·예시');
  ok((await p.locator('.gallery').first().locator('.g-card').count()) === 5, '예시 작품 5개');
  await p.click('.g-card:has-text("반짝이는 별") >> text=열기');
  ok((await p.locator('.fr').count()) === 4, '예시를 열면 프레임이 보여요');
  ok((await labels()).length > 0, '프레임마다 주문(블록)이 있어요');
  const cellsBefore = await painted();
  await speed(4);
  await run();
  await waitState('실행 끝');
  ok((await painted()) === cellsBefore, '예시 프레임의 주문을 실행하면 같은 그림이 그려져요');
  await p.click('.fr:nth-child(4)');
  ok((await p.locator('.pcanvas rect[opacity=".3"]').count()) > 0, '앞 프레임 비추기(어니언 스킨)');
  await p.click('.toggle-row >> text=앞 프레임 비추기');
  ok((await p.locator('.pcanvas rect[opacity=".3"]').count()) === 0, '앞 프레임 비추기 끄기');
  await p.click('.tl-tools >> text=복사');
  ok((await p.locator('.fr').count()) === 5 && (await p.textContent('.tl-title')).includes('5/5'), '프레임 복사');
  await p.click('.tl-tools >> text=새 프레임');
  ok((await p.locator('.fr').count()) === 6 && (await painted()) === 0, '빈 프레임 추가');
  await p.click('.tl-tools >> text=앞으로');
  ok((await p.textContent('.tl-title')).includes('5/6'), '프레임 순서 바꾸기');
  await p.click('.tl-tools >> text=삭제');
  ok((await p.locator('.fr').count()) === 5, '프레임 삭제');
  await p.click('.tl-tools >> text=삭제');
  await p.click('.modal >> text=지우기');
  ok((await p.locator('.fr').count()) === 4, '그림이 있는 프레임은 확인 뒤 삭제');
  await p.click('.play-row >> text=재생');
  const seen = new Set();
  for (let i = 0; i < 14; i++) { seen.add(await p.textContent('.now-playing')); await p.waitForTimeout(110); }
  ok(seen.size >= 3, `재생하면 프레임이 넘어가요 (${[...seen].length}장 확인)`);
  await p.click('.play-row .seg button:nth-child(3)');
  await p.waitForTimeout(1300);
  ok(await p.isVisible('.now-playing'), '반복 재생 + 재생 속도 바꾸기');
  await p.click('.play-row >> text=정지');
  ok(!(await p.isVisible('.now-playing')), '정지');
  await p.click('.toggle-row >> text=반복 재생');
  await p.click('.play-row >> text=재생');
  await p.waitForTimeout(1500);
  ok(!(await p.isVisible('.now-playing')), '반복을 끄면 끝에서 멈춰요');
  await p.click('.toggle-row >> text=반복 재생');
  await p.fill('.name-input', '나의 별');
  await p.click('.work .btn.primary');
  ok(await p.isVisible('.toast:has-text("저장했어요")'), '애니메이션 저장');
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('.work >> text=GIF 받기')]);
  await dl.saveAs(path.join(OUT, 'anim.gif'));
  const gif = fs.readFileSync(path.join(OUT, 'anim.gif'));
  ok(gif.slice(0, 6).toString() === 'GIF89a' && gif.length > 300, `GIF 다운로드 (${dl.suggestedFilename()}, ${gif.length}바이트)`);
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('.work >> text=프레임 PNG')]);
  await dl.saveAs(path.join(OUT, 'sheet.png'));
  ok(fs.readFileSync(path.join(OUT, 'sheet.png')).slice(1, 4).toString() === 'PNG', '프레임 스프라이트 시트 PNG 다운로드');
  for (const [w, h] of [[1366, 768], [1366, 650], [1280, 720], [1280, 600]]) { await p.setViewportSize({ width: w, height: h }); await noScroll(`극장 ${w}×${h}`); }
  await p.setViewportSize({ width: 1366, height: 650 });
  await p.screenshot({ path: path.join(OUT, 'theater-screen.png') });
  await p.setViewportSize({ width: 1366, height: 768 });
  await p.reload();
  await p.waitForSelector('.bench');
  await p.click('.tab.t-theater');
  await p.click('.work >> text=불러오기·예시');
  await p.click('.g-card:has-text("나의 별") >> text=열기');
  ok((await p.locator('.fr').count()) === 4 && (await p.inputValue('.name-input')) === '나의 별', '새로고침 뒤 애니메이션 불러오기');
  // 다른 예시도 모두 열리고 재생되는지
  for (const name of ['눈 깜빡이는 고양이', '통통 뛰는 토끼', '피어나는 꽃', '걷는 공룡']) {
    await p.click('.work >> text=불러오기·예시');
    await p.click(`.g-card:has-text("${name}") >> text=열기`);
    if (await p.isVisible('.modal >> text=저장하지 않고 계속')) await p.click('.modal >> text=저장하지 않고 계속');
    await p.click('.play-row >> text=재생');
    await p.waitForTimeout(300);
    ok(await p.isVisible('.now-playing'), `예시 「${name}」 열고 재생`);
    await p.click('.play-row >> text=정지');
  }

  console.log('■ 태블릿 화면');
  await p.setViewportSize({ width: 1024, height: 768 });
  await noScroll('태블릿 가로 1024×768');
  await p.setViewportSize({ width: 768, height: 1024 });
  const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(wide && await p.isVisible('.runpanel .btn.big'), '태블릿 세로 768×1024: 옆으로 넘치지 않아요');
  await p.screenshot({ path: path.join(OUT, 'tablet-portrait.png'), fullPage: true });
  await p.setViewportSize({ width: 1366, height: 768 });

  console.log('■ 설치(PWA)와 오프라인');
  const man = await p.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  ok(man.start_url === './' && man.scope === './' && man.icons.length >= 2, '매니페스트');
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker?.ready; return r ? r.scope : ''; });
  if (sw) {
    ok(sw.endsWith(new URL(BASE).pathname), '서비스 워커 범위가 앱 폴더예요 ' + sw);
    await p.waitForTimeout(800);
    await ctx.setOffline(true);
    await p.reload();
    await p.waitForSelector('.bench', { timeout: 8000 }).catch(() => {});
    ok(await p.isVisible('.runpanel .btn.big'), '인터넷 없이도 열려요');
    const font = await p.evaluate(() => document.fonts.check('16px Jua'));
    ok(font, '오프라인에서도 글꼴이 나와요');
    await ctx.setOffline(false);
  } else {
    console.log('  (서비스 워커가 없는 환경이라 오프라인 점검은 건너뛰어요)');
  }

  ok(errors.length === 0, '브라우저 오류 없음', errors.join(' | '));
  await browser.close();
  console.log(`\n통과 ${pass}개, 실패 ${fails.length}개`);
  if (fails.length) { console.log('실패한 항목:\n - ' + fails.join('\n - ')); process.exit(1); }
})().catch((e) => { console.error('점검 중 멈춤:', e); process.exit(1); });
