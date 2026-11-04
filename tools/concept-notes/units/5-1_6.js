// 5학년 1학기 6단원 다각형의 둘레와 넓이
const E = require('../engine');
const { C, svg, poly, line, text, label, cap, sub, add, mul, unit, mid, rightAngle, foot, dim, grid, G, arrowR, xMark, oMark,
  W, H, qfig, regPts, rect, tick, arc, dot, hl, isBlank } = E;
const figs = {
  para() {
    let s = '';
    // 평행사변형
    let a = [20, 150], b = [150, 150], c = [195, 55], d = [65, 55];
    s += poly([a, b, c, d], { fill: '#f7fbff', stroke: 'none' });
    s += line(a, b, { stroke: C.red, sw: 4 }) + line(d, c, { stroke: C.red, sw: 4 }) + line(a, d, { stroke: C.blue, sw: 4 }) + line(b, c, { stroke: C.blue, sw: 4 });
    s += label(108, 180, '평행사변형', { size: 15, term: true });
    // 직사각형
    a = [240, 150]; b = [345, 150]; c = [345, 55]; d = [240, 55];
    s += poly([a, b, c, d], { fill: '#f7fbff', stroke: 'none' });
    s += line(a, b, { stroke: C.red, sw: 4 }) + line(d, c, { stroke: C.red, sw: 4 }) + line(a, d, { stroke: C.blue, sw: 4 }) + line(b, c, { stroke: C.blue, sw: 4 });
    s += (isBlank() ? label(278, 180, '직사각형', { size: 15, term: true, anchor: 'middle' }) + text(330, 180, '도', { size: 15 }) : text(292, 180, '직사각형도', { size: 15 }));
    // 마름모
    a = [390, 102]; b = [445, 52]; c = [500, 102]; d = [445, 152];
    s += poly([a, b, c, d], { fill: '#f7fbff', stroke: 'none' });
    s += line(a, b, { stroke: C.red, sw: 4 }) + line(d, c, { stroke: C.red, sw: 4 }) + line(b, c, { stroke: C.blue, sw: 4 }) + line(a, d, { stroke: C.blue, sw: 4 });
    s += (isBlank() ? label(436, 180, '마름모', { size: 15, term: true }) + text(479, 180, '도', { size: 15 }) : text(445, 180, '마름모도', { size: 15 }));
    // 정사각형
    a = [540, 150]; b = [635, 150]; c = [635, 55]; d = [540, 55];
    s += poly([a, b, c, d], { fill: '#f7fbff', stroke: 'none' });
    s += line(a, b, { stroke: C.red, sw: 4 }) + line(d, c, { stroke: C.red, sw: 4 }) + line(a, d, { stroke: C.blue, sw: 4 }) + line(b, c, { stroke: C.blue, sw: 4 });
    s += (isBlank() ? label(578, 180, '정사각형', { size: 15, term: true }) + text(630, 180, '도', { size: 15 }) : text(588, 180, '정사각형도', { size: 15 }));
    s += cap(392, 22, '모두 마주 보는 변끼리 평행 → 모두 평행사변형!', { size: 15, color: '#2a7f78' });
    // 아닌 것: 사다리꼴
    a = [670, 150]; b = [750, 150]; c = [730, 85]; d = [690, 85];
    s += line(a, b, { stroke: C.red, sw: 3 }) + line(d, c, { stroke: C.red, sw: 3 }) + line(a, d, { sw: 2.5 }) + line(b, c, { sw: 2.5 });
    s += xMark(710, 60, 11) + text(710, 180, '한 쌍만 평행', { size: 12, color: C.red });
    return svg(W, H, s);
  },
  paraBH() {
    let s = '';
    // 왼쪽: 아래/위 변이 밑변
    const a = [40, 165], b = [260, 165], c = [320, 50], d = [100, 50];
    s += poly([a, b, c, d], { fill: '#f3f9ff', stroke: C.ink });
    s += line(a, b, { stroke: C.blue, sw: 4 }) + line(d, c, { stroke: C.blue, sw: 4 });
    s += line([130, 50], [130, 165], { stroke: C.pink, sw: 3 }) + rightAngle([130, 165], [1, 0], [0, -1]);
    s += label(150, 186, '밑변', { size: 15, color: C.blue, term: true });
    s += label(210, 34, '밑변', { size: 15, color: C.blue, term: true });
    s += label(160, 108, '높이', { size: 15, color: C.pink, term: true });
    // 오른쪽: 비스듬한 두 변이 밑변
    const e = [420, 165], f = [580, 165], g = [660, 50], h = [500, 50];
    s += poly([e, f, g, h], { fill: '#f3f9ff', stroke: C.ink });
    s += line(e, h, { stroke: C.blue, sw: 4 }) + line(f, g, { stroke: C.blue, sw: 4 });
    const p = add(e, mul(sub(h, e), 0.78)), q = foot(p, f, g);
    s += line(p, q, { stroke: C.pink, sw: 3 }) + rightAngle(q, sub(p, q), sub(f, g));
    s += label(432, 100, '밑변', { size: 15, color: C.blue, term: true, anchor: 'end' });
    s += label(672, 112, '밑변', { size: 15, color: C.blue, term: true, anchor: 'start' });
    s += label(560, 95, '높이', { size: 15, color: C.pink, term: true });
    s += cap(380, 200, '평행한 두 변 = 밑변 · 두 밑변 사이의 거리 = 높이 (밑변과 높이는 수직!)', { size: 13, color: '#2a7f78' });
    return svg(W, H, s);
  },
  paraArea() {
    let s = '';
    const cell = 26;
    // 1단계: 평행사변형 자르기
    let g = G(20, 30, cell);
    s += grid(20, 30, 9, 5, cell);
    s += poly(g([[0, 5], [6, 5], [8, 1], [2, 1]]), { fill: C.fillP, stroke: C.ink });
    s += poly(g([[0, 5], [2, 5], [2, 1]]), { fill: '#f19fbf', stroke: C.ink });
    s += line(g([[2, 1]])[0], g([[2, 5]])[0], { stroke: C.red, sw: 2.5, dash: '6 4' });
    s += text(20 + 4.5 * cell, 18, '① 높이를 따라 잘라서', { size: 14, color: C.red });
    s += arrowR(272, 95, 44);
    // 2단계: 직사각형
    g = G(330, 30, cell);
    s += grid(330, 30, 9, 5, cell);
    s += poly(g([[2, 5], [8, 5], [8, 1], [2, 1]]), { fill: C.fillP, stroke: C.ink, sw: 2.5 });
    s += poly(g([[6, 5], [8, 5], [8, 1]]), { fill: '#f19fbf', stroke: C.ink });
    s += line(g([[6, 5]])[0], g([[8, 1]])[0], { stroke: C.red, sw: 1.5, dash: '4 3' });
    s += rightAngle(g([[2, 5]])[0], [1, 0], [0, -1]);
    s += text(330 + 4.5 * cell, 18, '② 옮겨 붙이면 직사각형!', { size: 14, color: C.red });
    s += dim(g([[2, 5]])[0], g([[8, 5]])[0], '밑변 6 cm', { side: -1, off: 10, term: false });
    s += dim(g([[2, 1]])[0], g([[2, 5]])[0], '높이 4 cm', { side: 1, off: 12 });
    // 식
    s += `<rect x="600" y="62" width="152" height="92" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += label(676, 82, '가로 = 밑변', { size: 13, term: true });
    s += label(676, 109, '세로 = 높이', { size: 13, term: true });
    s += text(676, 138, '6 × 4 = 24(cm²)', { size: 14, color: C.red });
    return svg(W, H, s);
  },
  triBH() {
    let s = '';
    // ① 기본
    let a = [20, 170], b = [200, 170], c = [110, 35];
    s += poly([a, b, c], { fill: '#fff', stroke: C.ink });
    s += line(a, b, { stroke: C.blue, sw: 4 }) + line(c, [110, 170], { stroke: C.pink, sw: 3 }) + rightAngle([110, 170], [-1, 0], [0, -1]);
    s += label(110, 192, '밑변', { size: 15, color: C.blue, term: true }) + label(136, 112, '높이', { size: 15, color: C.pink, term: true });
    // ② 옆 변이 밑변
    a = [250, 170]; b = [470, 170]; c = [330, 35];
    s += poly([a, b, c], { fill: '#fff', stroke: C.ink });
    s += line(a, c, { stroke: C.blue, sw: 4 });
    let f = foot(b, a, c);
    s += line(b, f, { stroke: C.pink, sw: 3 }) + rightAngle(f, sub(a, c), sub(b, f));
    s += label(268, 92, '밑변', { size: 15, color: C.blue, term: true }) + label(380, 112, '높이', { size: 15, color: C.pink, term: true });
    // ③ 둔각삼각형: 높이가 밖에
    a = [490, 170]; b = [600, 170]; c = [700, 35];
    s += poly([a, b, c], { fill: '#fff', stroke: C.ink });
    s += line(a, b, { stroke: C.blue, sw: 4 }) + line(b, [700, 170], { stroke: C.gray, sw: 1.5, dash: '5 4' });
    s += line(c, [700, 170], { stroke: C.pink, sw: 3 }) + rightAngle([700, 170], [-1, 0], [0, -1]);
    s += label(545, 192, '밑변', { size: 15, color: C.blue, term: true }) + label(710, 112, '높이', { size: 15, color: C.pink, term: true, anchor: 'start' });
    s += cap(385, 14, '밑변에 따라 높이가 정해져요 (높이가 삼각형 밖에 있을 수도 있어요)', { size: 13, color: '#2a7f78' });
    return svg(W, H, s);
  },
  triArea() {
    let s = '';
    const cell = 26;
    let g = G(20, 40, cell);
    s += grid(20, 40, 8, 5, cell);
    s += poly(g([[1, 5], [6, 5], [3, 1]]), { fill: C.fillY, stroke: C.ink });
    s += line(g([[3, 1]])[0], g([[3, 5]])[0], { stroke: C.pink, sw: 2, dash: '4 3' }) + rightAngle(g([[3, 5]])[0], [1, 0], [0, -1]);
    s += dim(g([[1, 5]])[0], g([[6, 5]])[0], '밑변 5 cm', { side: -1, off: 9 });
    s += text(20 + 4 * cell, 26, '똑같은 삼각형 2개를 붙이면', { size: 14, color: C.red });
    s += arrowR(245, 105, 44);
    g = G(305, 40, cell);
    s += grid(305, 40, 10, 5, cell);
    s += poly(g([[1, 5], [6, 5], [3, 1]]), { fill: C.fillY, stroke: C.ink });
    s += poly(g([[6, 5], [8, 1], [3, 1]]), { fill: C.fillB, stroke: C.ink });
    s += line(g([[3, 1]])[0], g([[3, 5]])[0], { stroke: C.pink, sw: 2, dash: '4 3' }) + rightAngle(g([[3, 5]])[0], [1, 0], [0, -1]);
    s += text(305 + 2.15 * cell, 40 + 1.9 * cell, '높이 4 cm', { size: 12, color: C.pink, anchor: 'end' });
    s += text(305 + 5 * cell, 26, '평행사변형이 돼요!', { size: 14, color: C.red });
    s += `<rect x="572" y="62" width="184" height="96" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(664, 82, '평행사변형: 5 × 4 = 20(cm²)', { size: 12 });
    s += text(664, 106, '삼각형은 그 절반', { size: 13, color: '#555' });
    s += label(664, 132, '5 × 4 ÷ 2 = 10(cm²)', { size: 14, color: C.red, term: true, maxw: 150 });
    return svg(W, H, s);
  },
  rhom() {
    let s = '';
    const cell = 26;
    let g = G(20, 40, cell);
    s += grid(20, 40, 10, 6, cell);
    s += poly(g([[1, 3], [5, 1], [9, 3], [5, 5]]), { fill: '#f3f9ff', stroke: C.ink, sw: 2.5 });
    s += line(g([[1, 3]])[0], g([[9, 3]])[0], { stroke: C.pink, sw: 2.5, dash: '6 4' });
    s += line(g([[5, 1]])[0], g([[5, 5]])[0], { stroke: C.blue, sw: 2.5, dash: '6 4' });
    s += rightAngle(g([[5, 3]])[0], [-1, 0], [0, -1]);
    s += text(20 + 3 * cell, 40 + 3 * cell + 9, '8 cm', { size: 12, color: C.pink });
    s += text(20 + 5 * cell + 5, 40 + 4.1 * cell, '4 cm', { size: 12, color: C.blue, anchor: 'start' });
    s += cap(20 + 5 * cell, 26, '두 대각선은 수직으로 만나고 서로를 이등분', { size: 13, color: C.red });
    s += arrowR(298, 118, 40);
    g = G(350, 40, cell);
    s += grid(350, 40, 10, 6, cell);
    const q = [[1, 1], [5, 1], [5, 3], [1, 3]];
    s += poly(g([[1, 1], [5, 1], [1, 3]]), { fill: C.fillY, stroke: 'none' }) + poly(g([[5, 1], [5, 3], [1, 3]]), { fill: '#fbf3c8', stroke: 'none' });
    s += poly(g([[5, 1], [9, 1], [9, 3]]), { fill: C.fillG, stroke: 'none' }) + poly(g([[5, 1], [9, 3], [5, 3]]), { fill: '#e2f2d6', stroke: 'none' });
    s += poly(g([[1, 3], [5, 5], [1, 5]]), { fill: C.fillP, stroke: 'none' }) + poly(g([[1, 3], [5, 3], [5, 5]]), { fill: '#fbe0ea', stroke: 'none' });
    s += poly(g([[9, 3], [9, 5], [5, 5]]), { fill: C.fillB, stroke: 'none' }) + poly(g([[5, 3], [9, 3], [5, 5]]), { fill: '#dfecfa', stroke: 'none' });
    s += poly(g([[1, 1], [9, 1], [9, 5], [1, 5]]), { stroke: C.red, sw: 3 });
    s += poly(g([[1, 3], [5, 1], [9, 3], [5, 5]]), { stroke: C.ink, sw: 2.5 });
    s += text(350 + 5 * cell, 26, '둘러싼 직사각형의 절반!', { size: 14, color: C.red });
    s += `<rect x="616" y="60" width="140" height="116" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(686, 78, '직사각형의 넓이', { size: 12 });
    s += text(686, 98, '8 × 4 = 32(cm²)', { size: 12 });
    s += text(686, 122, '마름모는 그 절반', { size: 12, color: '#555' });
    s += label(686, 150, '8 × 4 ÷ 2 = 16(cm²)', { size: 12, color: C.red, term: true, maxw: 128 });
    void q;
    return svg(W, H, s);
  },
  trapBH() {
    let s = '';
    let a = [40, 165], b = [320, 165], c = [235, 50], d = [115, 50];
    s += poly([a, b, c, d], { fill: '#fffaf3', stroke: C.ink });
    s += line(d, c, { stroke: C.blue, sw: 4 }) + line(a, b, { stroke: C.orange, sw: 4 });
    s += line(d, [115, 165], { stroke: C.pink, sw: 3, dash: '6 4' }) + rightAngle([115, 165], [1, 0], [0, -1]);
    s += label(175, 32, '윗변', { size: 15, color: C.blue, term: true });
    s += label(180, 188, '아랫변', { size: 15, color: C.orange, term: true });
    s += label(142, 108, '높이', { size: 15, color: C.pink, term: true });
    s += cap(180, 12, '평행한 두 변 = 밑변 (위: 윗변, 아래: 아랫변)', { size: 12, color: '#2a7f78' });
    // 직각 사다리꼴
    a = [430, 165]; b = [680, 165]; c = [600, 50]; d = [430, 50];
    s += poly([a, b, c, d], { fill: '#fffaf3', stroke: C.ink });
    s += line(d, c, { stroke: C.blue, sw: 4 }) + line(a, b, { stroke: C.orange, sw: 4 });
    s += line(d, a, { stroke: C.pink, sw: 4 }) + rightAngle(a, [1, 0], [0, -1]) + rightAngle(d, [1, 0], [0, 1]);
    s += label(515, 32, '윗변', { size: 15, color: C.blue, term: true });
    s += label(555, 188, '아랫변', { size: 15, color: C.orange, term: true });
    s += label(420, 108, '높이', { size: 15, color: C.pink, term: true, anchor: 'end' });
    s += cap(560, 12, '이 변이 수직이면 그 변이 바로 높이!', { size: 12, color: '#2a7f78' });
    return svg(W, H, s);
  },
  trapArea() {
    let s = '';
    const cell = 26;
    let g = G(20, 40, cell);
    s += grid(20, 40, 8, 5, cell);
    s += poly(g([[1, 4], [7, 4], [5, 1], [3, 1]]), { fill: C.fillY, stroke: C.ink });
    s += line(g([[3, 1]])[0], g([[5, 1]])[0], { stroke: C.blue, sw: 4 }) + line(g([[1, 4]])[0], g([[7, 4]])[0], { stroke: C.orange, sw: 4 });
    s += line(g([[3, 1]])[0], g([[3, 4]])[0], { stroke: C.pink, sw: 2, dash: '4 3' }) + rightAngle(g([[3, 4]])[0], [1, 0], [0, -1]);
    s += text(20 + 4 * cell, 40 + 0.5 * cell, '윗변 2 cm', { size: 12, color: C.blue });
    s += text(20 + 4 * cell, 40 + 4.55 * cell, '아랫변 6 cm', { size: 12, color: C.orange });
    s += text(20 + 3 * cell + 5, 40 + 2.5 * cell, '높이 3 cm', { size: 11, color: C.pink, anchor: 'start' });
    s += text(20 + 4 * cell, 26, '똑같은 사다리꼴 2개를 붙이면', { size: 14, color: C.red });
    s += arrowR(240, 105, 44);
    g = G(300, 40, cell);
    s += grid(300, 40, 11, 5, cell);
    s += poly(g([[1, 4], [7, 4], [5, 1], [3, 1]]), { fill: C.fillY, stroke: C.ink });
    s += poly(g([[5, 1], [11, 1], [9, 4], [7, 4]]), { fill: C.fillB, stroke: C.ink });
    s += line(g([[1, 4]])[0], g([[7, 4]])[0], { stroke: C.orange, sw: 4 }) + line(g([[7, 4]])[0], g([[9, 4]])[0], { stroke: C.blue, sw: 4 });
    s += dim(g([[1, 4]])[0], g([[9, 4]])[0], '윗변 + 아랫변 = 8 cm', { side: -1, off: 9, size: 12 });
    s += text(300 + 5.5 * cell, 26, '평행사변형이 돼요!', { size: 14, color: C.red });
    s += `<rect x="592" y="58" width="164" height="100" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += text(674, 78, '평행사변형: 8 × 3 = 24(cm²)', { size: 11 });
    s += text(674, 100, '사다리꼴은 그 절반', { size: 12, color: '#555' });
    s += label(674, 126, '(2 + 6) × 3 ÷ 2', { size: 13, color: C.red, term: true, maxw: 120 });
    s += label(674, 146, '= 12(cm²)', { size: 13, color: C.red, term: true, maxw: 120 });
    return svg(W, H, s);
  },
};

const oldCards = [
  {
    title: '평행사변형',
    mean: `${hl('마주 보는 두 쌍의 변', 'r')}이 서로 ${hl('평행', 'b')}한 사각형`,
    fig: figs.para,
    exp: [
      `${hl('평행')}: 아무리 길게 늘여도 서로 ${hl('만나지 않는', 'r')} 두 직선이에요.`,
      `${hl('평행사변형', 'g')}은 마주 보는 변끼리 ${hl('2쌍 모두', 'r')} 평행한 사각형이에요. ("평행!"한 사각형~)`,
      `${hl('직사각형', 'g')}, ${hl('마름모', 'g')}, ${hl('정사각형', 'g')}도 마주 보는 변끼리 평행하니까 모두 평행사변형이에요.`,
      `평행한 변이 ${hl('하나도 없으면', 'r')} → 평행사변형이 아니에요.`,
      `${hl('한 쌍의 변만', 'r')} 평행하면(사다리꼴) → 평행사변형이 될 수 없어요.`,
    ],
    quiz: [
      { q: '직사각형은 평행사변형일까요? (O, X)', a: 'O (마주 보는 변끼리 평행)' },
      { q: '평행사변형은 평행한 변이 몇 쌍 있나요?', a: '2쌍' },
      { q: '이 사각형은 평행사변형일까요? 이유는?', fig: () => qfig.shapes(), a: 'X, 한 쌍만 평행해요' },
    ],
    think: [
      '평행사변형은 "평행"한 변이 두 쌍 있는 사각형이에요.',
      '직사각형, 마름모, 정사각형도 모두 평행사변형 가족이에요.',
      '한 쌍만 평행하면 평행사변형이 아니라는 것도 기억해요.',
      '주변에서 평행사변형 모양을 찾아보며 눈을 길러 보세요.',
    ],
    tPrompt: '평행사변형은 어떤 사각형인지, 평행사변형인 것과 아닌 것을 설명해 보세요.',
    tQuiz: [
      { q: '마름모는 평행사변형일까요? (O, X)', a: 'O' },
      { q: '평행한 변이 하나도 없는 사각형은 평행사변형일까요? (O, X)', a: 'X' },
      { q: '평행사변형이 되려면 마주 보는 변끼리 평행한 것이 (  )쌍 있어야 해요.', a: '2(두)쌍' },
    ],
    keys: '평행사변형 / 직사각형 / 마름모 / 정사각형',
  },
  {
    title: '평행사변형의 밑변과 높이',
    small: true,
    mean: `${hl('밑변')}: 평행사변형에서 ${hl('평행한 두 변', 'b')}<br>${hl('높이', 'p')}: ${hl('두 밑변 사이의 거리', 'p')}`,
    fig: figs.paraBH,
    exp: [
      `평행사변형에서 ${hl('평행한 두 변')}을 ${hl('밑변')}이라고 해요. (위쪽 변도 밑변이에요!)`,
      `${hl('두 밑변 사이의 거리', 'p')}를 ${hl('높이', 'p')}라고 해요.`,
      `밑변과 높이는 항상 ${hl('수직', 'r')}으로 만나요. → 직각 표시(ㄱ)를 꼭 확인해요.`,
      `비스듬한 두 변을 밑변으로 정하면 높이도 그 변에 수직으로 바뀌어요.`,
      `높이는 두 밑변 사이 ${hl('어디에서 재어도 길이가 같아요', 'r')}. (비스듬한 옆변의 길이는 높이가 아니에요!)`,
    ],
    quiz: [
      { q: '밑변과 높이는 어떻게 만나나요?', a: '수직으로 만나요' },
      { q: '이 평행사변형의 높이는 몇 cm일까요?', fig: () => qfig.para(6, 4, 3, '6 cm', '4 cm', '5 cm'), a: '4 cm (5 cm는 옆변)' },
      { q: '평행사변형에서 위쪽 변도 밑변이 될 수 있나요? (O, X)', a: 'O (평행한 두 변 모두 밑변)' },
    ],
    think: [
      '밑변은 "평행한 두 변", 높이는 "두 밑변 사이의 거리"예요.',
      '밑변과 높이는 언제나 수직으로 만나요.',
      '비스듬한 옆변의 길이를 높이로 착각하지 않도록 조심해요.',
      '직각 표시가 있는 선을 찾으면 높이가 보여요!',
    ],
    tPrompt: '평행사변형의 밑변과 높이가 무엇인지, 둘은 어떻게 만나는지 설명해 보세요.',
    tQuiz: [
      { q: '평행사변형에서 (    )한 두 변을 밑변이라고 해요.', a: '평행' },
      { q: '이 평행사변형의 높이는 몇 cm일까요?', fig: () => qfig.para(7, 4, 3, '7 cm', '4 cm', '5 cm'), a: '4 cm' },
      { q: '어느 변을 밑변으로 정하느냐에 따라 높이가 달라질 수 있다. (O, X)', a: 'O' },
    ],
    keys: '밑변 / 밑변 / 높이 (왼쪽 그림) · 밑변 / 밑변 / 높이 (오른쪽 그림)',
  },
  {
    title: '평행사변형의 넓이',
    mean: `(평행사변형의 넓이) = ${hl('밑변의 길이')} × ${hl('높이', 'p')}`,
    fig: figs.paraArea,
    exp: [
      `${hl('방법 1', 'g')} 모눈종이에서 1 cm² 칸 수 세기: 반쪽 삼각형 칸 2개를 합하면 1 cm² 1개가 돼요.`,
      `${hl('방법 2', 'g')} 높이를 따라 한쪽 삼각형을 잘라 반대쪽에 붙이면 ${hl('직사각형', 'r')}으로 변해요.`,
      `만든 직사각형의 ${hl('가로 = 평행사변형의 밑변')}, ${hl('세로 = 평행사변형의 높이', 'p')}예요.`,
      `그래서 (직사각형의 넓이) = 가로 × 세로 → (평행사변형의 넓이) = ${hl('밑변 × 높이', 'r')}`,
      `<span class="ex">예</span> 밑변 5 cm, 높이 7 cm → 5 × 7 = 35(cm²)`,
      `밑변과 높이가 같으면 모양이 달라도 넓이가 같아요.`,
    ],
    quiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.para(8, 5, 3, '8 cm', '5 cm'), a: '8 × 5 = 40(cm²)' },
      { q: '밑변 9 cm, 높이 4 cm인 평행사변형의 넓이는?', a: '9 × 4 = 36(cm²)' },
      { q: '넓이가 48 cm², 밑변이 8 cm일 때 높이는?', a: '48 ÷ 8 = 6(cm)' },
    ],
    think: [
      '평행사변형을 잘라 붙이면 직사각형이 된다는 걸 기억해요.',
      '직사각형의 가로는 밑변, 세로는 높이가 돼요.',
      '그래서 평행사변형의 넓이는 밑변 × 높이!',
      '옆변이 아니라 꼭 "높이"를 곱해야 해요.',
    ],
    tPrompt: '평행사변형의 넓이를 구하는 방법을 직사각형과 연결해서 설명해 보세요.',
    tQuiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.para(6, 4, 3, '6 cm', '4 cm', '5 cm'), a: '6 × 4 = 24(cm²)' },
      { q: '밑변 12 cm, 높이 5 cm인 평행사변형의 넓이는?', a: '12 × 5 = 60(cm²)' },
      { q: '넓이가 45 cm², 높이가 5 cm일 때 밑변은?', a: '45 ÷ 5 = 9(cm)' },
    ],
    keys: '가로 = 밑변 / 세로 = 높이',
  },
  {
    title: '삼각형의 밑변과 높이',
    small: true,
    mean: `${hl('밑변')}: 삼각형의 ${hl('한 변')}<br>${hl('높이', 'p')}: 밑변과 ${hl('마주 보는 꼭짓점', 'p')}에서 밑변에 ${hl('수직', 'r')}으로 그은 선분의 길이`,
    fig: figs.triBH,
    exp: [
      `삼각형의 세 변 중 ${hl('어느 변이든')} 밑변이 될 수 있어요.`,
      `밑변을 정하면, 그 밑변과 ${hl('마주 보는 꼭짓점', 'p')}에서 밑변에 수직으로 그은 선분이 높이예요.`,
      `${hl('밑변에 따라 높이가 정해져요', 'r')}. → 밑변을 바꾸면 높이도 바뀌어요.`,
      `둔각삼각형은 높이가 ${hl('삼각형 밖', 'r')}에 생길 수 있어요. 밑변을 점선으로 늘이고 수직으로 그어요.`,
      `직각삼각형은 직각을 낀 두 변 중 하나를 밑변으로 하면 ${hl('다른 한 변이 바로 높이', 'p')}예요.`,
    ],
    quiz: [
      { q: '삼각형에서 밑변이 될 수 있는 변은 몇 개인가요?', a: '3개 (어느 변이든 가능)' },
      { q: '밑변이 3 cm일 때 높이는 몇 cm일까요?', fig: () => qfig.rightTri(3, 4, '3 cm', '4 cm', '5 cm'), a: '4 cm' },
      { q: '삼각형의 높이는 항상 삼각형 안에 있다. (O, X)', a: 'X (밖에 있을 수도 있어요)' },
    ],
    think: [
      '삼각형은 어느 변이든 밑변이 될 수 있어요.',
      '밑변이 정해지면 마주 보는 꼭짓점에서 수직으로 높이를 그어요.',
      '높이가 삼각형 밖에 있을 때도 당황하지 말아요!',
      '삼각형을 돌려 가며 밑변과 높이를 직접 그려 보세요.',
    ],
    tPrompt: '삼각형의 밑변과 높이가 무엇인지, 높이를 어떻게 긋는지 설명해 보세요.',
    tQuiz: [
      { q: '높이는 밑변과 마주 보는 (      )에서 밑변에 수직으로 그은 선분의 길이예요.', a: '꼭짓점' },
      { q: '밑변이 8 cm일 때 높이는 몇 cm일까요?', fig: () => qfig.rightTri(8, 6, '8 cm', '6 cm', '10 cm'), a: '6 cm' },
      { q: '한 삼각형의 높이는 하나뿐이다. (O, X)', a: 'X (밑변마다 높이가 있어요)' },
    ],
    keys: '밑변 / 높이 (세 그림 모두)',
  },
  {
    title: '삼각형의 넓이',
    mean: `(삼각형의 넓이) = ${hl('밑변의 길이')} × ${hl('높이', 'p')} ${hl('÷ 2', 'r')}`,
    fig: figs.triArea,
    exp: [
      `${hl('방법 1', 'g')} 똑같은 삼각형 2개를 붙이면 ${hl('평행사변형', 'r')}이 돼요. → 삼각형 = 평행사변형 ÷ 2`,
      `${hl('방법 2', 'g')} 높이의 절반에서 잘라 뒤집어 붙이면 평행사변형이 돼요. → 밑변 × (높이 ÷ 2)`,
      `두 방법 모두 (삼각형의 넓이) = ${hl('밑변 × 높이 ÷ 2', 'r')}`,
      `<span class="ex">예</span> 밑변 5 cm, 높이 6 cm → 5 × 6 ÷ 2 = 15(cm²)`,
      `밑변의 길이와 높이가 같으면 ${hl('모양이 달라도 넓이가 모두 같아요', 'p')}.`,
    ],
    quiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.tri(8, 5, 3, '8 cm', '5 cm'), a: '8 × 5 ÷ 2 = 20(cm²)' },
      { q: '밑변 10 cm, 높이 7 cm인 삼각형의 넓이는?', a: '10 × 7 ÷ 2 = 35(cm²)' },
      { q: '넓이가 24 cm², 밑변이 8 cm일 때 높이는?', a: '24 × 2 ÷ 8 = 6(cm)' },
    ],
    think: [
      '삼각형 2개를 붙이면 평행사변형이 된다는 걸 떠올려요.',
      '그래서 삼각형의 넓이는 평행사변형의 절반, ÷ 2!',
      '÷ 2를 빠뜨리는 실수를 가장 많이 해요. 꼭 확인해요.',
      '밑변과 높이가 같으면 모양이 달라도 넓이가 같아요.',
    ],
    tPrompt: '삼각형의 넓이 공식이 왜 "÷ 2"인지 평행사변형을 이용해 설명해 보세요.',
    tQuiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.tri(6, 4, 4, '6 cm', '4 cm'), a: '6 × 4 ÷ 2 = 12(cm²)' },
      { q: '밑변 9 cm, 높이 8 cm인 삼각형의 넓이는?', a: '9 × 8 ÷ 2 = 36(cm²)' },
      { q: '넓이가 30 cm², 높이가 6 cm일 때 밑변은?', a: '30 × 2 ÷ 6 = 10(cm)' },
    ],
    keys: '5 × 4 ÷ 2 = 10(cm²)',
  },
  {
    title: '마름모의 넓이',
    mean: `(마름모의 넓이) = ${hl('한 대각선의 길이')} × ${hl('다른 대각선의 길이', 'p')} ${hl('÷ 2', 'r')}`,
    fig: figs.rhom,
    exp: [
      `마름모의 ${hl('두 대각선', 'p')}은 ${hl('수직', 'r')}으로 만나고 서로를 ${hl('이등분', 'r')}해요.`,
      `${hl('방법 1', 'g')} 마름모를 대각선을 따라 잘라 붙이면 평행사변형이나 직사각형이 돼요.`,
      `${hl('방법 2', 'g')} 마름모를 둘러싼 ${hl('직사각형')}을 그리면, 가로·세로가 두 대각선의 길이와 같아요.`,
      `마름모의 넓이는 그 ${hl('직사각형 넓이의 절반', 'r')}! → 두 대각선의 곱 ÷ 2`,
      `<span class="ex">예</span> 대각선 7 cm, 6 cm → 7 × 6 ÷ 2 = 21(cm²)`,
    ],
    quiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.rhom(8, 6, '8 cm', '6 cm'), a: '8 × 6 ÷ 2 = 24(cm²)' },
      { q: '두 대각선이 10 cm, 12 cm인 마름모의 넓이는?', a: '10 × 12 ÷ 2 = 60(cm²)' },
      { q: '마름모를 둘러싼 직사각형의 넓이가 40 cm²라면 마름모의 넓이는?', a: '40 ÷ 2 = 20(cm²)' },
    ],
    think: [
      '마름모의 넓이는 두 대각선의 길이만 알면 돼요.',
      '두 대각선을 곱하고 ÷ 2를 잊지 말아요.',
      '둘러싼 직사각형을 떠올리면 왜 절반인지 알 수 있어요.',
      '변의 길이가 아니라 "대각선"의 길이를 쓰는지 꼭 확인해요.',
    ],
    tPrompt: '마름모의 넓이 구하는 방법을 둘러싼 직사각형을 이용해 설명해 보세요.',
    tQuiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.rhom(10, 6, '10 cm', '6 cm'), a: '10 × 6 ÷ 2 = 30(cm²)' },
      { q: '두 대각선이 14 cm, 8 cm인 마름모의 넓이는?', a: '14 × 8 ÷ 2 = 56(cm²)' },
      { q: '넓이가 36 cm², 한 대각선이 9 cm일 때 다른 대각선은?', a: '36 × 2 ÷ 9 = 8(cm)' },
    ],
    keys: '8 × 4 ÷ 2 = 16(cm²)',
  },
  {
    title: '사다리꼴의 밑변과 높이',
    small: true,
    mean: `${hl('사다리꼴', 'g')}: 평행한 변이 ${hl('한 쌍이라도', 'r')} 있는 사각형<br>${hl('밑변')}: 평행한 두 변 (${hl('윗변')}, ${hl('아랫변', 'o')}) · ${hl('높이', 'p')}: 두 밑변 사이의 거리`,
    fig: figs.trapBH,
    exp: [
      `사다리꼴에서 ${hl('평행한 두 변')}을 ${hl('밑변')}이라고 해요.`,
      `밑변 중 위쪽 변을 ${hl('윗변')}, 아래쪽 변을 ${hl('아랫변', 'o')}이라고 해요.`,
      `${hl('두 밑변 사이의 거리', 'p')}를 ${hl('높이', 'p')}라고 해요. 높이는 밑변과 ${hl('수직', 'r')}으로 만나요.`,
      `한 옆변이 밑변과 수직이면 ${hl('그 옆변의 길이가 바로 높이', 'p')}예요.`,
      `비스듬한 옆변의 길이는 높이가 아니에요! 직각 표시를 찾아요.`,
    ],
    quiz: [
      { q: '사다리꼴에서 평행한 두 변을 무엇이라고 하나요?', a: '밑변 (윗변, 아랫변)' },
      { q: '윗변과 아랫변 사이의 거리를 무엇이라고 하나요?', a: '높이' },
      { q: '이 사다리꼴의 높이는 몇 cm일까요?', fig: () => qfig.trap(4, 10, 4, 3, '4 cm', '10 cm', '4 cm', '5 cm'), a: '4 cm (5 cm는 옆변)' },
    ],
    think: [
      '사다리꼴은 평행한 변이 한 쌍이라도 있는 사각형이에요.',
      '평행한 두 변이 윗변과 아랫변, 그 사이 거리가 높이예요.',
      '높이는 언제나 밑변과 수직으로 만나요.',
      '윗변·아랫변·높이에 색칠하며 이름을 익혀 보세요.',
    ],
    tPrompt: '사다리꼴은 어떤 사각형인지, 윗변·아랫변·높이가 무엇인지 설명해 보세요.',
    tQuiz: [
      { q: '사다리꼴은 평행한 변이 (    ) 쌍이라도 있는 사각형이에요.', a: '한' },
      { q: '사다리꼴의 높이는 무엇과 무엇 사이의 거리인가요?', a: '윗변과 아랫변(두 밑변) 사이' },
      { q: '윗변, 아랫변, 높이를 각각 쓰세요.', fig: () => qfig.trap(5, 9, 4, 1, '5 cm', '9 cm', '4 cm', '5 cm'), a: '윗변 5 cm, 아랫변 9 cm, 높이 4 cm' },
    ],
    keys: '윗변 / 아랫변 / 높이 (두 그림 모두)',
  },
  {
    title: '사다리꼴의 넓이',
    mean: `(사다리꼴의 넓이) = ( ${hl('윗변의 길이')} + ${hl('아랫변의 길이', 'o')} ) × ${hl('높이', 'p')} ${hl('÷ 2', 'r')}`,
    fig: figs.trapArea,
    exp: [
      `${hl('방법 1', 'g')} 똑같은 사다리꼴 2개를 붙이면 평행사변형! 밑변 = ${hl('윗변 + 아랫변', 'r')}, 높이는 같아요. → ÷ 2`,
      `${hl('방법 2', 'g')} 높이의 절반에서 잘라 돌려 붙이면 평행사변형: 밑변 = 윗변 + 아랫변, 높이 = 높이 ÷ 2`,
      `${hl('방법 3', 'g')} 대각선으로 잘라 삼각형 2개로: (윗변 × 높이 ÷ 2) + (아랫변 × 높이 ÷ 2)`,
      `<span class="ex">예</span> 윗변 3 cm, 아랫변 7 cm, 높이 4 cm → (3 + 7) × 4 ÷ 2 = 20(cm²)`,
      `<span class="ex">예</span> 삼각형으로: 3 × 4 ÷ 2 + 8 × 4 ÷ 2 = 6 + 16 = 22(cm²) (윗변 3, 아랫변 8, 높이 4)`,
    ],
    quiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.trap(4, 6, 5, 1, '4 cm', '6 cm', '5 cm'), a: '(4 + 6) × 5 ÷ 2 = 25(cm²)' },
      { q: '윗변 5 cm, 아랫변 9 cm, 높이 6 cm인 사다리꼴의 넓이는?', a: '(5 + 9) × 6 ÷ 2 = 42(cm²)' },
      { q: '윗변 3 cm, 아랫변 7 cm, 넓이 30 cm²일 때 높이는?', a: '30 × 2 ÷ (3 + 7) = 6(cm)' },
    ],
    think: [
      '윗변과 아랫변을 먼저 더하는 것이 핵심이에요.',
      '더한 것에 높이를 곱하고, ÷ 2를 잊지 말아요.',
      '사다리꼴 2개를 붙여 평행사변형을 만든 그림을 떠올려요.',
      '삼각형 2개로 나누어 구해도 답이 같아요. 직접 확인해 보세요!',
    ],
    tPrompt: '사다리꼴의 넓이 공식이 나온 이유를 평행사변형(또는 삼각형)을 이용해 설명해 보세요.',
    tQuiz: [
      { q: '넓이를 구하세요.', fig: () => qfig.trap(2, 6, 5, 2, '2 cm', '6 cm', '5 cm'), a: '(2 + 6) × 5 ÷ 2 = 20(cm²)' },
      { q: '윗변 6 cm, 아랫변 10 cm, 높이 7 cm인 사다리꼴의 넓이는?', a: '(6 + 10) × 7 ÷ 2 = 56(cm²)' },
      { q: '윗변 4 cm, 아랫변 8 cm, 넓이 36 cm²일 때 높이는?', a: '36 × 2 ÷ (4 + 8) = 6(cm)' },
    ],
    keys: '(2+6) × 3 ÷ 2 = 12(cm²)',
  },
];


// ---------- 둘레·넓이 단위·직사각형 (새 카드) ----------
const sideLabel = (a, b, s, out = 1, size = 13, color = '#333') => {
  const m = mid(a, b), d = unit(sub(b, a)), n = [d[1] * out, -d[0] * out];
  const t = add(m, mul(n, 14)); return text(t[0], t[1], s, { size, color });
};
const figs2 = {
  perim() {
    let s = cap(380, 16, '정다각형은 변의 길이가 모두 같아요 → 한 변 × 변의 수', { size: 13, color: '#2a7f78' });
    const items = [[3, 120, 5, '정삼각형'], [4, 380, 4, '정사각형'], [5, 630, 6, '정오각형']];
    for (const [n, cx, len, name] of items) {
      const pts = regPts(cx, 94, n === 4 ? 58 : 60, n, n === 4 ? -135 : -90);
      s += poly(pts, { fill: '#eef7f6', stroke: C.ink, sw: 2.4 });
      for (let i = 0; i < n; i++) s += tick(pts[i], pts[(i + 1) % n]);
      const a = pts[n === 4 ? 2 : Math.floor(n / 2)], b = pts[n === 4 ? 3 : Math.floor(n / 2) + 1];
      s += sideLabel(a, b, `${len} cm`, n === 4 ? 1 : -1);
      s += text(cx, 178, name, { size: 13, color: '#555' });
      s += label(cx, 199, `${len} × ${n} = ${len * n}(cm)`, { size: 14, color: C.red, term: true, maxw: 150 });
    }
    return svg(W, H, s);
  },
  quadPerim() {
    let s = '';
    s += rect(30, 50, 180, 110, { fill: '#eef7f6', stroke: C.ink, sw: 2.4 });
    s += text(120, 176, '가로 6 cm', { size: 13 }) + text(222, 105, '세로 4 cm', { size: 13, anchor: 'start' });
    s += text(120, 30, '직사각형', { size: 14, color: '#2a7f78' });
    s += label(120, 200, '(6 + 4) × 2 = 20(cm)', { size: 13, color: C.red, term: true, maxw: 170 });
    const p = [[320, 160], [500, 160], [550, 60], [370, 60]];
    s += poly(p, { fill: '#eef7f6', stroke: C.ink, sw: 2.4 });
    s += text(410, 176, '7 cm', { size: 13 }) + text(538, 115, '5 cm', { size: 13, anchor: 'start' });
    s += text(435, 30, '평행사변형', { size: 14, color: '#2a7f78' });
    s += label(435, 200, '(7 + 5) × 2 = 24(cm)', { size: 13, color: C.red, term: true, maxw: 170 });
    const r = [[600, 110], [665, 60], [730, 110], [665, 160]];
    s += poly(r, { fill: '#eef7f6', stroke: C.ink, sw: 2.4 });
    for (let i = 0; i < 4; i++) s += tick(r[i], r[(i + 1) % 4]);
    s += text(712, 148, '5 cm', { size: 13, anchor: 'start' });
    s += text(665, 30, '마름모', { size: 14, color: '#2a7f78' });
    s += label(665, 200, '5 × 4 = 20(cm)', { size: 13, color: C.red, term: true, maxw: 130 });
    return svg(W, H, s);
  },
  units() {
    let s = '';
    s += rect(60, 80, 40, 40, { fill: C.fillY, stroke: C.ink });
    s += text(80, 134, '1 cm', { size: 12 }) + text(108, 100, '1 cm', { size: 12, anchor: 'start' });
    s += label(85, 160, '1 cm²', { size: 16, color: C.red, term: true });
    s += text(85, 184, '(1 제곱센티미터)', { size: 11, color: '#555' });
    s += rect(240, 45, 110, 110, { fill: '#eef7f6', stroke: C.ink });
    s += text(295, 100, '1 m²', { size: 18, color: '#2a7f78' });
    s += text(295, 170, '1 m = 100 cm', { size: 12 });
    s += label(295, 194, '1 m² = 10000 cm²', { size: 13, color: C.red, term: true, maxw: 160 });
    s += rect(470, 30, 140, 140, { fill: '#eef4fd', stroke: C.ink });
    s += text(540, 100, '1 km²', { size: 20, color: C.blue });
    s += text(540, 184, '1 km = 1000 m', { size: 12 });
    s += label(680, 100, '1 km²', { size: 13, color: C.ink }) + label(690, 124, '= 1000000 m²', { size: 13, color: C.red, term: true, maxw: 130 });
    s += cap(380, 14, '한 변이 1인 정사각형의 넓이가 넓이의 단위예요', { size: 13, color: '#2a7f78' });
    return svg(W, H, s);
  },
  rectArea() {
    let s = '';
    const cell = 26;
    s += grid(30, 40, 7, 5, cell);
    let g = G(30, 40, cell);
    s += poly(g([[1, 1], [6, 1], [6, 4], [1, 4]]), { fill: C.fillP, stroke: C.ink, sw: 2.4 });
    s += label(30 + 3.5 * cell, 40 + 4.6 * cell, '가로', { size: 13, term: true }) + text(30 + 4.6 * cell, 40 + 4.6 * cell, '5 cm', { size: 12, anchor: 'start' });
    s += label(30 + 6.2 * cell, 40 + 2.2 * cell, '세로', { size: 13, term: true, anchor: 'start' }) + text(30 + 6.2 * cell, 40 + 3 * cell, '3 cm', { size: 12, anchor: 'start' });
    s += label(30 + 3.5 * cell, 22, '5 × 3 = 15(cm²)', { size: 14, color: C.red, term: true, maxw: 150 });
    s += grid(330, 40, 5, 5, cell);
    g = G(330, 40, cell);
    s += poly(g([[1, 1], [4, 1], [4, 4], [1, 4]]), { fill: C.fillB, stroke: C.ink, sw: 2.4 });
    s += text(330 + 2.5 * cell, 40 + 4.6 * cell, '한 변 3 cm', { size: 12 });
    s += label(330 + 2.5 * cell, 22, '3 × 3 = 9(cm²)', { size: 14, color: C.red, term: true, maxw: 140 });
    s += `<rect x="520" y="60" width="230" height="100" rx="10" fill="#fff8d6" stroke="#e6cf6a"/>`;
    s += cap(635, 82, '1 cm² 가 가로로 5개씩', { size: 12 });
    s += cap(635, 104, '세로로 3줄 → 5 × 3 = 15개', { size: 12 });
    s += cap(635, 134, '칸 수 = 가로 × 세로', { size: 14, color: C.red });
    return svg(W, H, s);
  },
};
const qRect = (w, h, lw, lh) => {
  const k = Math.min(150 / w, 70 / h), x0 = (220 - w * k) / 2, y0 = 14;
  return svg(220, 112, rect(x0, y0, w * k, h * k, { fill: '#eef7f6', stroke: C.ink }) +
    text(110, y0 + h * k + 13, lw, { size: 12 }) + text(x0 + w * k + 6, y0 + h * k / 2, lh, { size: 12, anchor: 'start' }), 'qf');
};
const qReg = (n, lab) => {
  const pts = regPts(110, 54, 40, n, n === 4 ? -135 : -90);
  let s = poly(pts, { fill: '#eef7f6', stroke: C.ink });
  for (let i = 0; i < n; i++) s += tick(pts[i], pts[(i + 1) % n]);
  const i0 = n === 4 ? 2 : Math.floor(n / 2);
  s += sideLabel(pts[i0], pts[(i0 + 1) % n], lab, n === 4 ? 1 : -1, 12);
  return svg(220, 112, s, 'qf');
};

const newCards = [
  {
    title: '정다각형의 둘레',
    mean: `(정다각형의 둘레) = ${hl('한 변의 길이')} × ${hl('변의 수', 'p')}`,
    fig: figs2.perim,
    exp: [
      `${hl('둘레', 'g')}: 도형의 테두리를 ${hl('한 바퀴', 'r')} 돈 길이예요. (모든 변의 길이의 합)`,
      `${hl('정다각형', 'g')}은 변의 길이가 ${hl('모두 같아요', 'r')}. → 같은 길이를 변의 수만큼 더하면 돼요.`,
      `같은 수를 여러 번 더하는 것은 곱셈! → ${hl('한 변의 길이 × 변의 수', 'r')}`,
      `<span class="ex">예</span> 한 변이 6 cm인 정오각형 → 6 × 5 = 30(cm)`,
      `둘레를 알면 거꾸로: (한 변의 길이) = (둘레) ÷ (변의 수)`,
    ],
    quiz: [
      { q: '한 변이 7 cm인 정삼각형의 둘레는?', a: `7 × 3 = ${7 * 3}(cm)` },
      { q: '둘레를 구하세요.', fig: () => qReg(6, '4 cm'), a: `4 × 6 = ${4 * 6}(cm)` },
      { q: '둘레가 40 cm인 정팔각형의 한 변의 길이는?', a: `40 ÷ 8 = ${40 / 8}(cm)` },
    ],
    think: [
      '둘레는 도형의 테두리를 한 바퀴 돈 길이예요.',
      '정다각형은 변의 길이가 모두 같아서 곱셈으로 쉽게 구해요.',
      '변의 수를 정확히 세는 것이 가장 중요해요.',
      '둘레를 알 때 한 변의 길이를 구하는 방법도 연습해 보세요.',
    ],
    tPrompt: '정다각형의 둘레를 왜 곱셈으로 구할 수 있는지 설명해 보세요.',
    tQuiz: [
      { q: '한 변이 9 cm인 정사각형의 둘레는?', a: `9 × 4 = ${9 * 4}(cm)` },
      { q: '둘레를 구하세요.', fig: () => qReg(5, '8 cm'), a: `8 × 5 = ${8 * 5}(cm)` },
      { q: '둘레가 42 cm인 정육각형의 한 변의 길이는?', a: `42 ÷ 6 = ${42 / 6}(cm)` },
    ],
    keys: '5 × 3 = 15(cm) / 4 × 4 = 16(cm) / 6 × 5 = 30(cm)',
  },
  {
    title: '사각형의 둘레',
    mean: `(직사각형의 둘레) = ( ${hl('가로')} + ${hl('세로', 'p')} ) × 2<br>(평행사변형) = (한 변 + 다른 한 변) × 2 · (마름모) = 한 변 × 4`,
    fig: figs2.quadPerim,
    exp: [
      `${hl('직사각형', 'g')}은 마주 보는 변의 길이가 같아요. → 가로 2개 + 세로 2개 = ${hl('(가로 + 세로) × 2', 'r')}`,
      `${hl('평행사변형', 'g')}도 마주 보는 변의 길이가 같아요. → ${hl('(한 변 + 다른 한 변) × 2', 'r')}`,
      `${hl('마름모', 'g')}는 네 변의 길이가 모두 같아요. → ${hl('한 변 × 4', 'r')}`,
      `<span class="ex">예</span> 가로 6 cm, 세로 4 cm인 직사각형 → (6 + 4) × 2 = 20(cm)`,
      `주의! 6 + 4 × 2 로 쓰면 곱셈을 먼저 해서 틀려요. 꼭 ${hl('괄호', 'r')}를 써요.`,
    ],
    quiz: [
      { q: '가로 8 cm, 세로 3 cm인 직사각형의 둘레는?', a: `(8 + 3) × 2 = ${(8 + 3) * 2}(cm)` },
      { q: '두 변이 9 cm, 6 cm인 평행사변형의 둘레는?', a: `(9 + 6) × 2 = ${(9 + 6) * 2}(cm)` },
      { q: '둘레가 28 cm인 마름모의 한 변의 길이는?', a: `28 ÷ 4 = ${28 / 4}(cm)` },
    ],
    think: [
      '마주 보는 변의 길이가 같은 사각형은 (두 변의 합) × 2!',
      '마름모와 정사각형은 네 변이 같아서 한 변 × 4예요.',
      '덧셈을 먼저 해야 하니까 괄호를 꼭 써요.',
      '둘레를 알 때 모르는 변의 길이를 구하는 연습도 해 보세요.',
    ],
    tPrompt: '직사각형, 평행사변형, 마름모의 둘레를 구하는 방법을 각각 설명해 보세요.',
    tQuiz: [
      { q: '둘레를 구하세요.', fig: () => qRect(10, 7, '10 cm', '7 cm'), a: `(10 + 7) × 2 = ${(10 + 7) * 2}(cm)` },
      { q: '두 변이 12 cm, 8 cm인 평행사변형의 둘레는?', a: `(12 + 8) × 2 = ${(12 + 8) * 2}(cm)` },
      { q: '둘레가 30 cm, 가로가 9 cm인 직사각형의 세로는?', a: `30 ÷ 2 − 9 = ${30 / 2 - 9}(cm)` },
    ],
    keys: '(6 + 4) × 2 = 20(cm) / (7 + 5) × 2 = 24(cm) / 5 × 4 = 20(cm)',
  },
  {
    title: '넓이의 단위',
    mean: `한 변이 1 cm인 정사각형의 넓이 → ${hl('1 cm²', 'r')} (1 제곱센티미터)<br>${hl('1 m² = 10000 cm²')} · ${hl('1 km² = 1000000 m²', 'p')}`,
    fig: figs2.units,
    exp: [
      `넓이는 ${hl('1 cm²가 몇 개', 'r')} 들어가는지로 나타내요. 1 cm² = 한 변이 1 cm인 정사각형의 넓이`,
      `${hl('1 m²', 'g')} (1 제곱미터): 한 변이 1 m인 정사각형의 넓이. 1 m = 100 cm이므로 100 × 100 = ${hl('10000 cm²', 'r')}`,
      `${hl('1 km²', 'g')} (1 제곱킬로미터): 한 변이 1 km인 정사각형의 넓이. 1 km = 1000 m이므로 1000 × 1000 = ${hl('1000000 m²', 'r')}`,
      `작은 물건은 cm², 교실·운동장은 m², 도시·나라처럼 넓은 곳은 km²를 써요.`,
      `주의! 1 m = 100 cm 이지만 1 m²는 100 cm²가 ${hl('아니라 10000 cm²', 'r')}예요.`,
    ],
    quiz: [
      { q: '3 m²는 몇 cm²인가요?', a: `${3 * 10000} cm²` },
      { q: '50000 cm²는 몇 m²인가요?', a: `${50000 / 10000} m²` },
      { q: '2 km²는 몇 m²인가요?', a: `${2 * 1000000} m²` },
    ],
    think: [
      '넓이의 단위는 한 변이 1인 정사각형의 넓이예요.',
      '1 m²는 1 cm²가 가로 100개, 세로 100줄 들어가요.',
      '그래서 0을 4개 붙여요: 1 m² = 10000 cm²',
      '1 km²는 0을 6개! 단위를 바꿀 때 0의 개수를 꼭 세어요.',
    ],
    tPrompt: '1 cm², 1 m², 1 km²가 무엇인지, 1 m²가 왜 10000 cm²인지 설명해 보세요.',
    tQuiz: [
      { q: '7 m²는 몇 cm²인가요?', a: `${7 * 10000} cm²` },
      { q: '40000 cm²는 몇 m²인가요?', a: `${40000 / 10000} m²` },
      { q: '5000000 m²는 몇 km²인가요?', a: `${5000000 / 1000000} km²` },
    ],
    keys: '1 cm² / 1 m² = 10000 cm² / = 1000000 m²',
  },
  {
    title: '직사각형과 정사각형의 넓이',
    mean: `(직사각형의 넓이) = ${hl('가로')} × ${hl('세로', 'p')}<br>(정사각형의 넓이) = ${hl('한 변의 길이')} × ${hl('한 변의 길이')}`,
    fig: figs2.rectArea,
    exp: [
      `넓이는 도형 안에 ${hl('1 cm²가 몇 개', 'r')} 들어가는지 세어서 구해요.`,
      `직사각형에는 1 cm²가 가로로 (가로)개씩, 세로로 (세로)줄 들어가요. → ${hl('가로 × 세로', 'r')}`,
      `${hl('정사각형', 'g')}은 가로와 세로가 같으니까 ${hl('한 변 × 한 변', 'r')}이에요.`,
      `<span class="ex">예</span> 가로 5 cm, 세로 3 cm → 5 × 3 = 15(cm²)`,
      `넓이를 알면 거꾸로: (세로) = (넓이) ÷ (가로), (가로) = (넓이) ÷ (세로)`,
    ],
    quiz: [
      { q: '넓이를 구하세요.', fig: () => qRect(8, 6, '8 cm', '6 cm'), a: `8 × 6 = ${8 * 6}(cm²)` },
      { q: '한 변이 7 cm인 정사각형의 넓이는?', a: `7 × 7 = ${7 * 7}(cm²)` },
      { q: '넓이가 72 cm², 가로가 9 cm인 직사각형의 세로는?', a: `72 ÷ 9 = ${72 / 9}(cm)` },
    ],
    think: [
      '넓이는 1 cm²가 몇 개 들어가는지를 나타내요.',
      '직사각형은 가로 × 세로, 정사각형은 한 변 × 한 변!',
      '둘레(cm)와 넓이(cm²)의 단위가 다르다는 것을 기억해요.',
      '모든 다각형의 넓이는 직사각형의 넓이에서 시작해요.',
    ],
    tPrompt: '직사각형의 넓이를 왜 가로 × 세로로 구하는지 1 cm²를 이용해 설명해 보세요.',
    tQuiz: [
      { q: '가로 12 cm, 세로 5 cm인 직사각형의 넓이는?', a: `12 × 5 = ${12 * 5}(cm²)` },
      { q: '한 변이 9 cm인 정사각형의 넓이는?', a: `9 × 9 = ${9 * 9}(cm²)` },
      { q: '넓이가 63 cm², 세로가 7 cm인 직사각형의 가로는?', a: `63 ÷ 7 = ${63 / 7}(cm)` },
    ],
    keys: '가로 / 세로 / 5 × 3 = 15(cm²) / 3 × 3 = 9(cm²)',
  },
];

module.exports = {
  code: '5-1', grade: '5학년 1학기', unitNo: 6, unitName: '다각형의 둘레와 넓이',
  sub: '둘레 · 넓이의 단위 · 직사각형 · 평행사변형 · 삼각형 · 마름모 · 사다리꼴',
  keywords: '한 변 × 변의 수, 괄호, cm², 가로 × 세로, 밑변, 높이, 수직, ÷ 2 등',
  cards: [...newCards, ...oldCards],
};
