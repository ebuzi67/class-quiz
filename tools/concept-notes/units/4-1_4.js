// 4학년 1학기 4단원 평면도형의 이동
const E = require('../engine');
const { C, svg, poly, line, text, label, cap, W, H, grid, dot, hl } = E;

// ---------- 도형 움직이기 (모눈 칸 단위, y는 아래쪽이 +) ----------
const BASE = [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]]; // 좌우·상하 대칭이 없는 ㄴ 모양
const T = {
  LR: ([x, y]) => [-x, y],   // 오른쪽(왼쪽)으로 뒤집기
  UD: ([x, y]) => [x, -y],   // 위쪽(아래쪽)으로 뒤집기
  CW: ([x, y]) => [-y, x],   // 시계 방향 90°
  CCW: ([x, y]) => [y, -x],  // 시계 반대 방향 90°
};
const norm = pts => { const mx = Math.min(...pts.map(p => p[0])), my = Math.min(...pts.map(p => p[1])); return pts.map(([x, y]) => [x - mx, y - my]); };
const apply = (seq, pts = BASE) => norm(seq.reduce((ps, t) => ps.map(T[t]), pts));
const key = pts => pts.map(p => p.join(',')).sort().join(' ');
const same = (a, b) => key(a) === key(b);
const size = pts => [Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
// 도형 그리기: (x, y)에 cell 크기로
const shape = (pts, x, y, cell, fill = C.fillY, opt = {}) =>
  poly(pts.map(([a, b]) => [x + a * cell, y + b * cell]), { fill, stroke: opt.stroke || C.ink, sw: opt.sw || 2.2, dash: opt.dash || '' });
// 가운데 맞춰 그리기
const shapeC = (pts, cx, cy, cell, fill, opt) => { const [w, h] = size(pts); return shape(pts, cx - w * cell / 2, cy - h * cell / 2, cell, fill, opt); };
const arrowLine = (a, b, color = C.red) => line(a, b, { stroke: color, sw: 2, dash: '5 4' }) +
  `<polygon points="${b[0]},${b[1]} ${b[0] - 9},${b[1] - 5} ${b[0] - 9},${b[1] + 5}" fill="${color}" transform="rotate(${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI} ${b[0]} ${b[1]})"/>`;
const NUM = ['①', '②', '③', '④'];

// 고르기 문제 그림: 처음 도형 + 보기 4개. ans = 정답 순서(0~3)
function choice(target, others, ans) {
  const want = apply(target);
  const opts = [...others]; opts.splice(ans, 0, target);
  const shapes = opts.map(o => apply(o));
  shapes.forEach((s, i) => { if (i !== ans && same(s, want)) throw new Error('보기 중복 정답: ' + JSON.stringify(opts)); });
  shapes.forEach((s, i) => shapes.forEach((t, j) => { if (i < j && same(s, t)) throw new Error('보기 겹침: ' + JSON.stringify(opts)); }));
  let s = text(22, 10, '처음', { size: 11, color: '#555' }) + shapeC(BASE, 22, 50, 11, C.fillB);
  s += line([46, 14], [46, 100], { stroke: '#bbb', sw: 1, dash: '3 3' });
  shapes.forEach((p, i) => { const cx = 72 + i * 42; s += shapeC(p, cx, 48, 10, C.fillY) + text(cx, 96, NUM[i], { size: 13 }); });
  return { fig: () => svg(220, 112, s, 'qf'), a: NUM[ans] };
}

const figs = {
  point() {
    let s = '';
    const cell = 26, x0 = 20, y0 = 30;
    s += grid(x0, y0, 14, 6, cell);
    const P = (c, r) => [x0 + c * cell, y0 + r * cell];
    s += arrowLine(P(2, 5), P(7, 5), C.red) + arrowLine(P(7, 5), P(7, 3), C.blue);
    s += dot(P(2, 5), 6, C.ink) + text(P(2, 5)[0] - 12, P(2, 5)[1] - 12, 'ㄱ', { size: 15 });
    s += dot(P(7, 3), 6, C.pink) + text(P(7, 3)[0] + 14, P(7, 3)[1] - 10, 'ㄴ', { size: 15, color: C.pink });
    s += label(P(4.5, 5)[0], P(4.5, 5)[1] + 17, '오른쪽으로 5 cm', { size: 13, color: C.red, term: true, maxw: 120 });
    s += label(P(7, 4)[0] + 8, P(7, 4)[1], '위쪽으로 2 cm', { size: 13, color: C.blue, term: true, anchor: 'start', maxw: 110 });
    s += `<rect x="410" y="50" width="340" height="110" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(580, 76, '모눈 한 칸 = 1 cm', { size: 14 });
    s += text(580, 104, '점 ㄱ → 점 ㄴ : 오른쪽 5 cm, 위쪽 2 cm', { size: 13, color: '#555' });
    s += cap(580, 132, '방향과 거리(몇 cm)로 말해요', { size: 14, color: C.red });
    return svg(W, H, s);
  },
  push() {
    let s = '';
    const cell = 24, x0 = 20, y0 = 34;
    s += grid(x0, y0, 15, 6, cell);
    s += shape(BASE, x0 + 1 * cell, y0 + 1.5 * cell, cell, '#fff', { dash: '5 4', stroke: C.gray });
    s += shape(BASE, x0 + 9 * cell, y0 + 1.5 * cell, cell, C.fillY);
    s += arrowLine([x0 + 3.4 * cell, y0 + 3 * cell], [x0 + 8.6 * cell, y0 + 3 * cell]);
    s += text(x0 + 2 * cell, y0 + 5.2 * cell, '처음 도형', { size: 12, color: '#555' });
    s += label(x0 + 6 * cell, y0 + 2.3 * cell, '오른쪽으로 8 cm', { size: 13, color: C.red, term: true, maxw: 120 });
    s += `<rect x="410" y="50" width="340" height="110" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += label(580, 80, '모양과 크기: 그대로', { size: 14, color: C.blue, term: true, maxw: 200 });
    s += label(580, 110, '위치: 바뀌어요', { size: 14, color: C.red, term: true, maxw: 160 });
    s += cap(580, 138, '밀기 = 미끄러지듯 옮기기', { size: 13, color: '#555' });
    return svg(W, H, s);
  },
  flip() {
    let s = '';
    const cell = 22;
    s += text(110, 22, '처음 도형', { size: 13, color: '#555' }) + shapeC(BASE, 110, 100, cell, C.fillB);
    s += line([260, 40], [260, 160], { stroke: C.pink, sw: 2, dash: '6 4' });
    s += shapeC(BASE, 225, 100, cell, '#fff', { dash: '4 3', stroke: C.gray }) + shapeC(apply(['LR']), 295, 100, cell, C.fillY);
    s += text(260, 22, '오른쪽으로 뒤집기', { size: 13, color: C.pink });
    s += label(260, 184, '왼쪽 ↔ 오른쪽', { size: 13, color: C.red, term: true, maxw: 120 });
    s += line([440, 100], [580, 100], { stroke: C.blue, sw: 2, dash: '6 4' });
    s += shapeC(BASE, 510, 64, 16, '#fff', { dash: '4 3', stroke: C.gray }) + shapeC(apply(['UD']), 510, 136, 16, C.fillY);
    s += text(510, 22, '아래쪽으로 뒤집기', { size: 13, color: C.blue });
    s += label(510, 184, '위쪽 ↔ 아래쪽', { size: 13, color: C.red, term: true, maxw: 120 });
    s += `<rect x="610" y="50" width="140" height="110" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(680, 76, '같은 방향으로', { size: 12 }) + text(680, 96, '2번 뒤집으면', { size: 12 });
    s += label(680, 126, '처음 모양', { size: 14, color: C.red, term: true });
    return svg(W, H, s);
  },
  turn() {
    let s = '';
    const cell = 20, list = [[[], '처음'], [['CW'], '시계 방향 90°'], [['CW', 'CW'], '시계 방향 180°'], [['CW', 'CW', 'CW'], '시계 방향 270°']];
    list.forEach(([seq, name], i) => {
      const cx = 80 + i * 150;
      s += shapeC(apply(seq), cx, 95, cell, i ? C.fillY : C.fillB);
      s += i ? label(cx, 172, name, { size: 13, color: C.red, term: true, maxw: 120 }) : text(cx, 172, name, { size: 13, color: '#555' });
      if (i) s += `<path d="M${cx - 92} 40 A 26 26 0 0 1 ${cx - 50} 40" fill="none" stroke="${C.red}" stroke-width="2"/><polygon points="${cx - 50},40 ${cx - 58},32 ${cx - 60},43" fill="${C.red}"/>`;
    });
    s += `<rect x="600" y="40" width="150" height="130" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(675, 62, '위쪽 → 오른쪽', { size: 12 }) + text(675, 80, '(시계 방향 90°)', { size: 11, color: '#555' });
    s += cap(675, 108, '시계 90° =', { size: 12, color: C.red }) + cap(675, 126, '시계 반대 270°', { size: 12, color: C.red });
    s += cap(675, 154, '360° → 처음 모양', { size: 12, color: C.blue });
    return svg(W, H, s);
  },
  flipTurn() {
    let s = '';
    const cell = 15;
    const row = (y, seq1, n1, seq2, n2) => {
      let r = shapeC(BASE, 60, y, cell, C.fillB);
      r += arrowLine([95, y], [175, y]) + text(135, y - 14, n1, { size: 11, color: C.red });
      r += shapeC(apply(seq1), 215, y, cell, '#fdf3c4');
      r += arrowLine([250, y], [330, y]) + text(290, y - 14, n2, { size: 11, color: C.red });
      r += shapeC(apply(seq2), 370, y, cell, C.fillY, { sw: 2.6 });
      return r;
    };
    s += row(60, ['LR'], '오른쪽으로 뒤집기', ['LR', 'CW'], '시계 방향 90°');
    s += row(150, ['CW'], '시계 방향 90°', ['CW', 'LR'], '오른쪽으로 뒤집기');
    s += text(20, 60, 'ⓐ', { size: 15 }) + text(20, 150, 'ⓑ', { size: 15 });
    s += `<rect x="440" y="50" width="310" height="110" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(595, 76, 'ⓐ와 ⓑ의 마지막 모양이 달라요!', { size: 14 });
    s += label(595, 108, '순서가 바뀌면 결과가 달라질 수 있어요', { size: 13, color: C.red, term: true, maxw: 280 });
    s += text(595, 136, '한 단계씩 차례대로 움직여 봐요', { size: 12, color: '#555' });
    return svg(W, H, s);
  },
  pattern() {
    let s = '';
    const cell = 13;
    const rows = [['밀기', i => []], ['뒤집기', i => (i % 2 ? ['LR'] : [])], ['돌리기', i => Array(i % 4).fill('CW')]];
    rows.forEach(([name, f], r) => {
      const y = 38 + r * 62;
      s += label(50, y, name, { size: 14, color: C.red, term: true });
      for (let i = 0; i < 8; i++) s += shapeC(apply(f(i)), 120 + i * 50, y, cell, [C.fillY, C.fillB, C.fillP][r]);
    });
    s += `<rect x="530" y="30" width="220" height="150" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(640, 56, '규칙을 정해 반복하면', { size: 13 }) + text(640, 78, '무늬가 돼요', { size: 13 });
    s += cap(640, 112, '돌리기 90°는 4번마다', { size: 12, color: C.red }) + cap(640, 132, '처음 모양으로 돌아와요', { size: 12, color: C.red });
    s += cap(640, 160, '뒤집기는 2번마다 반복', { size: 12, color: C.blue });
    return svg(W, H, s);
  },
};

// 고르기 문제
const qFlipN = choice(['LR'], [['CW'], ['UD'], ['CW', 'CW']], 1);
const qFlipT = choice(['UD'], [['LR'], ['CW', 'CW'], ['CCW']], 2);
const qTurnN = choice(['CW'], [['CCW'], ['LR'], ['CW', 'CW']], 0);
const qTurnT = choice(['CW', 'CW'], [['UD'], ['CCW'], ['LR']], 3);
const qFTN = choice(['LR', 'CW'], [['CW'], ['CW', 'LR'], ['UD']], 1);
const qFTT1 = choice(['UD', 'CCW'], [['CCW'], ['UD', 'CW'], ['LR']], 0);
const qFTT2 = choice(['CW', 'LR'], [['LR', 'CW'], ['UD'], ['CW']], 2);
// 확인: 위쪽으로 뒤집고 오른쪽으로 뒤집기 = 180° 돌리기
if (!same(apply(['UD', 'LR']), apply(['CW', 'CW']))) throw new Error('180° 확인 실패');

const cards = [
  {
    title: '점의 이동',
    mean: `점을 이동할 때는 ${hl('어느 방향', 'r')}으로 ${hl('몇 cm', 'b')} 이동했는지 말해요`,
    fig: figs.point,
    exp: [
      `모눈종이에서 ${hl('한 칸이 1 cm', 'b')}이면 칸 수를 세어 이동한 거리를 알 수 있어요.`,
      `점의 이동은 ${hl('방향(오른쪽·왼쪽·위쪽·아래쪽)', 'r')}과 ${hl('거리(몇 cm)', 'b')}로 나타내요.`,
      `<span class="ex">예</span> 점 ㄱ을 오른쪽으로 5 cm, 위쪽으로 2 cm 이동하면 점 ㄴ에 도착해요.`,
      `거꾸로 점 ㄴ에서 점 ㄱ으로 가려면 ${hl('왼쪽으로 5 cm, 아래쪽으로 2 cm', 'r')} 이동해요.`,
      `같은 방향으로 두 번 이동하면 거리를 더하고, 반대 방향이면 빼요.`,
    ],
    quiz: [
      { q: '점을 왼쪽으로 4 cm 이동한 뒤 오른쪽으로 4 cm 이동하면?', a: '처음 위치' },
      { q: '점 ㄱ을 오른쪽 3 cm, 위쪽 2 cm 이동하면 점 ㄴ이에요. 점 ㄴ에서 점 ㄱ으로 가려면?', a: '왼쪽 3 cm, 아래쪽 2 cm' },
      { q: '한 칸이 1 cm인 모눈에서 점을 오른쪽으로 5칸 이동하면 몇 cm 이동한 것인가요?', a: '5 cm' },
    ],
    think: [
      '점의 이동은 방향과 거리를 함께 말해요.',
      '모눈 한 칸의 길이를 먼저 확인해요.',
      '되돌아갈 때는 방향을 반대로 바꿔요.',
      '친구에게 점의 이동을 설명하는 놀이를 해 보세요.',
    ],
    tPrompt: '점을 이동한 방법을 설명할 때 무엇을 꼭 말해야 하는지 설명해 보세요.',
    tQuiz: [
      { q: '점을 위쪽으로 6 cm 이동한 뒤 아래쪽으로 2 cm 이동하면 처음보다 어느 쪽으로 몇 cm?', a: `위쪽으로 ${6 - 2} cm` },
      { q: '점 ㄷ을 아래쪽으로 3 cm 이동했더니 점 ㄹ이 되었어요. 점 ㄹ에서 점 ㄷ으로 가려면?', a: '위쪽으로 3 cm' },
      { q: '점을 오른쪽으로 2 cm, 또 오른쪽으로 5 cm 이동하면 처음보다 몇 cm 이동했나요?', a: `오른쪽으로 ${2 + 5} cm` },
    ],
    keys: '오른쪽으로 5 cm / 위쪽으로 2 cm',
  },
  {
    title: '평면도형 밀기',
    mean: `도형을 밀면 ${hl('모양과 크기는 그대로', 'b')}이고 ${hl('위치만 바뀌어요', 'r')}`,
    fig: figs.push,
    exp: [
      `도형을 오른쪽·왼쪽·위쪽·아래쪽으로 ${hl('미끄러지듯 옮기는 것', 'g')}이 밀기예요.`,
      `밀기를 해도 도형의 ${hl('모양, 크기, 방향은 바뀌지 않아요', 'b')}.`,
      `바뀌는 것은 ${hl('위치', 'r')}뿐이에요.`,
      `<span class="ex">예</span> 오른쪽으로 8 cm 밀기 → 도형 전체가 오른쪽으로 8칸 옮겨져요.`,
      `도형의 한 꼭짓점이 이동한 거리 = 도형이 이동한 거리예요.`,
    ],
    quiz: [
      { q: '도형을 밀면 모양이 바뀌나요? (O, X)', a: 'X (위치만 바뀌어요)' },
      { q: '도형을 왼쪽으로 3 cm 밀고 다시 오른쪽으로 3 cm 밀면?', a: '처음 위치' },
      { q: '도형을 오른쪽으로 2 cm 밀고 또 오른쪽으로 5 cm 밀면 처음보다 몇 cm 이동?', a: `오른쪽으로 ${2 + 5} cm` },
    ],
    think: [
      '밀기는 모양을 그대로 두고 자리만 옮기는 거예요.',
      '꼭짓점 하나를 정해서 몇 칸 옮겼는지 세면 쉬워요.',
      '밀기를 해도 도형의 방향은 바뀌지 않아요.',
      '모눈종이에 도형을 그리고 직접 밀어 보세요.',
    ],
    tPrompt: '도형을 밀면 무엇이 바뀌고 무엇이 바뀌지 않는지 설명해 보세요.',
    tQuiz: [
      { q: '밀기를 하면 바뀌는 것은 무엇인가요?', a: '위치' },
      { q: '도형을 위쪽으로 4 cm 민 다음 아래쪽으로 1 cm 밀면 처음보다 어느 쪽으로 몇 cm?', a: `위쪽으로 ${4 - 1} cm` },
      { q: '도형을 밀면 도형의 방향도 바뀐다. (O, X)', a: 'X' },
    ],
    keys: '오른쪽으로 8 cm / 모양과 크기: 그대로 / 위치: 바뀌어요',
  },
  {
    title: '평면도형 뒤집기',
    mean: `${hl('오른쪽·왼쪽', 'r')}으로 뒤집으면 왼쪽과 오른쪽이, ${hl('위쪽·아래쪽', 'b')}으로 뒤집으면 위쪽과 아래쪽이 서로 바뀌어요`,
    fig: figs.flip,
    exp: [
      `${hl('오른쪽(왼쪽)으로 뒤집기', 'r')}: 도형의 ${hl('왼쪽과 오른쪽이 바뀌어요', 'r')}. (위아래는 그대로)`,
      `${hl('위쪽(아래쪽)으로 뒤집기', 'b')}: 도형의 ${hl('위쪽과 아래쪽이 바뀌어요', 'b')}. (왼쪽·오른쪽은 그대로)`,
      `오른쪽으로 뒤집은 모양과 왼쪽으로 뒤집은 모양은 ${hl('같아요', 'g')}. (위쪽·아래쪽도 마찬가지)`,
      `같은 방향으로 ${hl('2번 뒤집으면 처음 모양', 'r')}이 돼요. → 3번 뒤집기 = 1번 뒤집기`,
      `뒤집기는 거울에 비친 모양을 생각하면 쉬워요.`,
    ],
    quiz: [
      { q: '처음 도형을 오른쪽으로 뒤집은 모양을 고르세요.', fig: qFlipN.fig, a: qFlipN.a },
      { q: '도형을 위쪽으로 2번 뒤집으면 어떤 모양이 되나요?', a: '처음 모양' },
      { q: '왼쪽으로 뒤집은 모양과 오른쪽으로 뒤집은 모양은 같나요? (O, X)', a: 'O' },
    ],
    think: [
      '오른쪽·왼쪽 뒤집기는 왼쪽과 오른쪽이 바뀌어요.',
      '위쪽·아래쪽 뒤집기는 위쪽과 아래쪽이 바뀌어요.',
      '같은 방향으로 2번 뒤집으면 처음으로 돌아와요.',
      '투명 종이에 그려 직접 뒤집어 보면 확실히 알 수 있어요.',
    ],
    tPrompt: '도형을 오른쪽으로 뒤집을 때와 아래쪽으로 뒤집을 때 어떻게 달라지는지 설명해 보세요.',
    tQuiz: [
      { q: '처음 도형을 아래쪽으로 뒤집은 모양을 고르세요.', fig: qFlipT.fig, a: qFlipT.a },
      { q: '오른쪽으로 3번 뒤집은 모양은 오른쪽으로 1번 뒤집은 모양과 같나요? (O, X)', a: 'O' },
      { q: '위쪽으로 뒤집으면 도형의 어느 부분이 서로 바뀌나요?', a: '위쪽과 아래쪽' },
    ],
    keys: '왼쪽 ↔ 오른쪽 / 위쪽 ↔ 아래쪽 / 처음 모양',
  },
  {
    title: '평면도형 돌리기',
    mean: `${hl('시계 방향', 'r')} 또는 ${hl('시계 반대 방향', 'b')}으로 90°, 180°, 270°, 360°만큼 돌려요`,
    fig: figs.turn,
    exp: [
      `시계 방향으로 ${hl('90°', 'r')} 돌리면 도형의 ${hl('위쪽이 오른쪽', 'r')}으로 가요.`,
      `${hl('시계 방향 90° = 시계 반대 방향 270°', 'g')}, 시계 방향 270° = 시계 반대 방향 90°`,
      `${hl('180°', 'r')} 돌리기는 시계 방향이든 시계 반대 방향이든 ${hl('결과가 같아요', 'r')}.`,
      `${hl('360°', 'b')} 돌리면 한 바퀴를 돌아 ${hl('처음 모양', 'b')}이 돼요.`,
      `도형의 한 변(또는 꼭짓점)이 어디로 가는지 따라가 보면 쉬워요.`,
    ],
    quiz: [
      { q: '처음 도형을 시계 방향으로 90° 돌린 모양을 고르세요.', fig: qTurnN.fig, a: qTurnN.a },
      { q: '시계 방향으로 90° 돌린 것은 시계 반대 방향으로 몇 도 돌린 것과 같나요?', a: '270°' },
      { q: '시계 방향으로 90°씩 4번 돌리면 어떤 모양이 되나요?', a: '처음 모양 (360°)' },
    ],
    think: [
      '돌리기는 방향(시계/시계 반대)과 각도를 함께 말해요.',
      '시계 방향 90°와 시계 반대 방향 270°는 같아요.',
      '180°는 어느 방향으로 돌려도 같아요.',
      '종이를 직접 돌려 보며 위쪽이 어디로 가는지 확인해요.',
    ],
    tPrompt: '도형을 시계 방향으로 90°, 180°, 360° 돌리면 어떻게 되는지 설명해 보세요.',
    tQuiz: [
      { q: '처음 도형을 시계 방향으로 180° 돌린 모양을 고르세요.', fig: qTurnT.fig, a: qTurnT.a },
      { q: '시계 반대 방향으로 90° 돌린 것은 시계 방향으로 몇 도 돌린 것과 같나요?', a: '270°' },
      { q: '시계 방향으로 180°, 시계 반대 방향으로 180° 돌린 결과는 같나요? (O, X)', a: 'O' },
    ],
    keys: '시계 방향 90° / 시계 방향 180° / 시계 방향 270°',
  },
  {
    title: '뒤집고 돌리기',
    mean: `뒤집기와 돌리기를 이어서 할 때는 ${hl('순서대로 한 단계씩', 'r')} 움직여요 (순서가 바뀌면 결과가 달라질 수 있어요)`,
    fig: figs.flipTurn,
    exp: [
      `먼저 한 움직임을 하고, ${hl('그 결과 도형', 'r')}을 다시 움직여요.`,
      `ⓐ 오른쪽으로 뒤집고 → 시계 방향 90° 돌리기`,
      `ⓑ 시계 방향 90° 돌리고 → 오른쪽으로 뒤집기 → ⓐ와 ${hl('결과가 달라요', 'r')}!`,
      `위쪽으로 뒤집고 오른쪽으로 뒤집으면 ${hl('180° 돌린 것과 같아요', 'g')}.`,
      `같은 방향으로 2번 뒤집기는 하지 않은 것과 같으니 빼고 생각해도 돼요.`,
    ],
    quiz: [
      { q: '처음 도형을 오른쪽으로 뒤집고 시계 방향으로 90° 돌린 모양을 고르세요.', fig: qFTN.fig, a: qFTN.a },
      { q: '움직이는 순서를 바꾸면 결과가 항상 같나요? (O, X)', a: 'X (달라질 수 있어요)' },
      { q: '위쪽으로 뒤집고 오른쪽으로 뒤집은 모양은 180° 돌린 모양과 같나요? (O, X)', a: 'O' },
    ],
    think: [
      '여러 번 움직일 때는 한 단계씩 차례대로 해요.',
      '순서가 바뀌면 결과가 달라질 수 있어요.',
      '중간 모양을 그려 두면 실수가 줄어요.',
      '두 번 뒤집기가 180° 돌리기와 같은지 직접 확인해 보세요.',
    ],
    tPrompt: '뒤집기와 돌리기를 이어서 할 때 주의할 점을 설명해 보세요.',
    tQuiz: [
      { q: '아래쪽으로 뒤집고 시계 반대 방향으로 90° 돌린 모양을 고르세요.', fig: qFTT1.fig, a: qFTT1.a },
      { q: '시계 방향으로 90° 돌리고 오른쪽으로 뒤집은 모양을 고르세요.', fig: qFTT2.fig, a: qFTT2.a },
      { q: '위쪽으로 2번 뒤집고 시계 방향으로 90° 돌린 모양은 시계 방향으로 90°만 돌린 모양과 같나요? (O, X)', a: 'O' },
    ],
    keys: '순서가 바뀌면 결과가 달라질 수 있어요',
  },
  {
    title: '무늬 만들기',
    mean: `모양을 ${hl('밀기·뒤집기·돌리기', 'r')}로 규칙적으로 움직여 ${hl('무늬', 'b')}를 만들어요`,
    fig: figs.pattern,
    exp: [
      `${hl('밀기', 'g')}로 만든 무늬: 같은 모양이 같은 방향으로 반복돼요.`,
      `${hl('뒤집기', 'g')}로 만든 무늬: 처음 모양과 뒤집은 모양이 번갈아 나와요. (2개마다 반복)`,
      `${hl('돌리기', 'g')}로 만든 무늬(90°씩): ${hl('4개마다', 'r')} 처음 모양으로 돌아와요.`,
      `규칙을 찾으면 다음에 올 모양을 알 수 있어요. 몇 개마다 반복되는지 세어 봐요.`,
      `<span class="ex">예</span> 90°씩 돌리기 무늬의 5번째 모양 = 1번째 모양 (4개마다 반복)`,
    ],
    quiz: [
      { q: '시계 방향으로 90°씩 돌려 만든 무늬에서 5번째 모양은 몇 번째 모양과 같나요?', a: '1번째' },
      { q: '밀기로만 만든 무늬에서 모양의 방향은 모두 같나요? (O, X)', a: 'O' },
      { q: '오른쪽으로 뒤집기를 반복해 만든 무늬에서 3번째 모양은 몇 번째와 같나요?', a: '1번째' },
    ],
    think: [
      '무늬에는 반복되는 규칙이 숨어 있어요.',
      '몇 개마다 같은 모양이 나오는지 세어 봐요.',
      '90° 돌리기는 4개, 뒤집기는 2개마다 반복돼요.',
      '나만의 규칙으로 무늬를 만들어 친구에게 맞혀 보게 하세요.',
    ],
    tPrompt: '밀기, 뒤집기, 돌리기로 만든 무늬는 각각 어떤 규칙이 있는지 설명해 보세요.',
    tQuiz: [
      { q: '시계 방향으로 90°씩 돌려 만든 무늬에서 6번째 모양은 몇 번째와 같나요?', a: '2번째' },
      { q: '아래쪽으로 뒤집기를 반복해 만든 무늬에서 4번째 모양은 몇 번째와 같나요?', a: '2번째' },
      { q: '시계 방향으로 180°씩 돌려 무늬를 만들면 몇 가지 모양이 반복되나요?', a: '2가지' },
    ],
    keys: '밀기 / 뒤집기 / 돌리기',
  },
];

module.exports = {
  code: '4-1', grade: '4학년 1학기', unitNo: 4, unitName: '평면도형의 이동',
  sub: '점의 이동 · 밀기 · 뒤집기 · 돌리기 · 뒤집고 돌리기 · 무늬 만들기',
  keywords: '방향, 거리, 위치, 왼쪽과 오른쪽, 위쪽과 아래쪽, 시계 방향, 90°, 순서 등',
  cards,
};
