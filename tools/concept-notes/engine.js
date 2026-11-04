// 5-1 6단원 개념노트 + 백지테스트 생성기

const C = {
  red: '#d9534f', blue: '#3b82f6', pink: '#e0457b', orange: '#e8963a', green: '#6aa84f',
  ink: '#222', gray: '#888', yellow: '#f6e27a', fillY: '#fbeea0', fillB: '#bcd7f5',
  fillP: '#f4bfd3', fillG: '#c8e6b0', fillPara: '#cfe8e6',
};

// ---------- SVG helpers ----------
const svg = (w, h, inner, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const P = pts => pts.map(p => p.join(',')).join(' ');
const poly = (pts, { fill = 'none', stroke = C.ink, sw = 2, dash = '' } = {}) =>
  `<polygon points="${P(pts)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const line = (a, b, { stroke = C.ink, sw = 2, dash = '' } = {}) =>
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const text = (x, y, s, { size = 14, color = C.ink, anchor = 'middle', weight = 700 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}" dominant-baseline="middle">${s}</text>`;
// 라벨: 백지 모드면 빈칸 상자
let BLANK = false;
const label = (x, y, s, opt = {}) => {
  if (BLANK && opt.term) {
    const w = Math.min(opt.maxw || 999, Math.max(44, [...s].length * (opt.size || 14) + 14)), h = (opt.size || 14) + 10;
    const x0 = opt.anchor === 'start' ? x : opt.anchor === 'end' ? x - w : x - w / 2;
    return `<rect x="${x0}" y="${y - h / 2}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="${opt.color || C.ink}" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  }
  return text(x, y, s, opt);
};
const cap = (...a) => BLANK ? '' : text(...a);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const unit = v => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
// 직각 표시: 꼭짓점 p, 두 방향 u, v
const rightAngle = (p, u, v, s = 9, color = C.red) => {
  u = unit(u); v = unit(v);
  const a = add(p, mul(u, s)), b = add(add(p, mul(u, s)), mul(v, s)), c = add(p, mul(v, s));
  return `<polyline points="${P([a, b, c])}" fill="none" stroke="${color}" stroke-width="1.6"/>`;
};
// 점 p에서 직선 ab로 내린 수선의 발
const foot = (p, a, b) => {
  const d = sub(b, a), t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
  return add(a, mul(d, t));
};
// 길이 표시(점선 곡선 + 글자). side: 곡선이 휘는 방향 부호
const dim = (a, b, s, { off = 14, color = C.gray, size = 13, side = 1, term = false, tcolor } = {}) => {
  const m = mid(a, b), n = unit([-(b[1] - a[1]), b[0] - a[0]]);
  const c = add(m, mul(n, off * 2 * side));
  const t = add(m, mul(n, (off + 9) * side));
  return `<path d="M${a} Q${c} ${b}" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3"/>` +
    `<rect x="${t[0] - [...s].length * size * 0.33 - 3}" y="${t[1] - size * 0.65}" width="${[...s].length * size * 0.66 + 6}" height="${size * 1.3}" fill="#fff" opacity="${BLANK && term ? 0 : 0.9}"/>` +
    label(t[0], t[1], s, { size, color: tcolor || '#555', weight: 600, term });
};
// 모눈 (1칸 = cell px)
const grid = (x0, y0, cols, rows, cell) => {
  let s = `<rect x="${x0}" y="${y0}" width="${cols * cell}" height="${rows * cell}" fill="#fff" stroke="#bbb" stroke-width="1"/>`;
  for (let i = 1; i < cols; i++) s += line([x0 + i * cell, y0], [x0 + i * cell, y0 + rows * cell], { stroke: '#ccc', sw: 0.8, dash: '2 2' });
  for (let j = 1; j < rows; j++) s += line([x0, y0 + j * cell], [x0 + cols * cell, y0 + j * cell], { stroke: '#ccc', sw: 0.8, dash: '2 2' });
  s += `<rect x="${x0}" y="${y0}" width="${cell}" height="${cell}" fill="#ddd"/>` + text(x0 + cell / 2, y0 + cell / 2, '1 cm²', { size: 7, color: '#555', weight: 500 });
  return s;
};
const G = (x0, y0, cell) => (pts) => pts.map(([x, y]) => [x0 + x * cell, y0 + y * cell]);
const arrowR = (x, y, w = 36) =>
  `<path d="M${x} ${y - 7} h${w - 14} v-7 l14 14 l-14 14 v-7 h-${w - 14} z" fill="#7fb8ad"/>`;
const xMark = (x, y, r = 12) => line([x - r, y - r], [x + r, y + r], { stroke: C.red, sw: 3 }) + line([x - r, y + r], [x + r, y - r], { stroke: C.red, sw: 3 });
const oMark = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.blue}" stroke-width="3"/>`;


// 정다각형 꼭짓점
const regPts = (cx, cy, r, n, rot = -90) => Array.from({ length: n }, (_, i) => {
  const t = (rot + 360 * i / n) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
});
const rect = (x, y, w, h, opt = {}) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], opt);
// 같은 길이 표시(변 가운데 짧은 눈금)
const tick = (a, b, n = 1, color = C.ink) => {
  const m = mid(a, b), d = unit(sub(b, a)), nn = [-d[1], d[0]]; let s = '';
  for (let i = 0; i < n; i++) { const c = add(m, mul(d, (i - (n - 1) / 2) * 5)); s += line(add(c, mul(nn, 6)), sub(c, mul(nn, 6)), { stroke: color, sw: 1.6 }); }
  return s;
};
// 각 표시(꼭짓점 p, 두 점 a·b 방향), 라벨은 각 안쪽
const arc = (p, a, b, r = 18, lab = '', opt = {}) => {
  const u = unit(sub(a, p)), v = unit(sub(b, p));
  const s1 = add(p, mul(u, r)), s2 = add(p, mul(v, r));
  const cross = u[0] * v[1] - u[1] * v[0];
  let out = `<path d="M${s1} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${s2}" fill="none" stroke="${opt.color || C.red}" stroke-width="1.6"/>`;
  if (lab) { const m = unit(add(u, v)); const t = add(p, mul(m, r + (opt.loff || 14))); out += label(t[0], t[1], lab, { size: opt.size || 12, color: opt.color || C.red, term: opt.term }); }
  return out;
};
const dot = (p, r = 3.5, color = C.ink) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${color}"/>`;

const W = 760, H = 210; // 예시 그림 크기
// ---------- 퀴즈용 작은 그림 (viewBox 220 x 112) ----------
const QW = 220, QH = 112;
const qfig = {
  para(b, h, off, lb, lh, side) {
    const k = Math.min(150 / (b + off), 76 / h), x0 = (QW - (b + off) * k) / 2, y0 = 14;
    const A = [x0, y0 + h * k], B = [x0 + b * k, y0 + h * k], Cc = [x0 + (b + off) * k, y0], D = [x0 + off * k, y0];
    let s = poly([A, B, Cc, D], { fill: '#eef7f6', stroke: C.ink });
    const hx = D[0] + 4;
    s += line([hx, y0], [hx, A[1]], { stroke: C.pink, sw: 1.6, dash: '4 3' }) + rightAngle([hx, A[1]], [1, 0], [0, -1], 7);
    s += text((A[0] + B[0]) / 2, A[1] + 13, lb, { size: 12, color: '#333' });
    s += text(hx + 6, y0 + h * k / 2, lh, { size: 12, color: C.pink, anchor: 'start' });
    if (side) s += text((B[0] + Cc[0]) / 2 + 8, (B[1] + Cc[1]) / 2, side, { size: 12, color: '#333', anchor: 'start' });
    return svg(QW, QH, s, 'qf');
  },
  tri(b, h, ax, lb, lh) {
    const k = Math.min(150 / b, 76 / h), x0 = (QW - b * k) / 2, y0 = 14;
    const A = [x0, y0 + h * k], B = [x0 + b * k, y0 + h * k], Cc = [x0 + ax * k, y0];
    let s = poly([A, B, Cc], { fill: '#fff7d6', stroke: C.ink });
    s += line(Cc, [Cc[0], A[1]], { stroke: C.pink, sw: 1.6, dash: '4 3' }) + rightAngle([Cc[0], A[1]], [1, 0], [0, -1], 7);
    s += text((A[0] + B[0]) / 2, A[1] + 13, lb, { size: 12 });
    s += text(Cc[0] + 6, y0 + h * k / 2 + 6, lh, { size: 12, color: C.pink, anchor: 'start' });
    return svg(QW, QH, s, 'qf');
  },
  rightTri(b, h, lb, lh, lc) {
    const k = Math.min(140 / b, 76 / h), x0 = (QW - b * k) / 2 - 10, y0 = 14;
    const A = [x0, y0 + h * k], B = [x0 + b * k, y0 + h * k], Cc = [x0 + b * k, y0];
    let s = poly([A, B, Cc], { fill: '#fff7d6', stroke: C.ink }) + rightAngle(B, [-1, 0], [0, -1], 8);
    s += text((A[0] + B[0]) / 2, A[1] + 13, lb, { size: 12 });
    s += text(B[0] + 6, y0 + h * k / 2, lh, { size: 12, anchor: 'start' });
    s += text((A[0] + Cc[0]) / 2 - 8, (A[1] + Cc[1]) / 2 - 6, lc, { size: 12, anchor: 'end' });
    return svg(QW, QH, s, 'qf');
  },
  rhom(d1, d2, l1, l2) {
    const k = Math.min(150 / d1, 84 / d2), cx = QW / 2, cy = 52;
    const A = [cx - d1 * k / 2, cy], B = [cx, cy - d2 * k / 2], Cc = [cx + d1 * k / 2, cy], D = [cx, cy + d2 * k / 2];
    let s = poly([A, B, Cc, D], { fill: '#eef4fd', stroke: C.ink });
    s += line(A, Cc, { stroke: C.pink, sw: 1.5, dash: '4 3' }) + line(B, D, { stroke: C.blue, sw: 1.5, dash: '4 3' }) + rightAngle([cx, cy], [-1, 0], [0, -1], 7);
    s += text(cx - d1 * k / 4, cy + 10, l1, { size: 12, color: C.pink });
    s += text(cx + 5, cy - d2 * k / 4, l2, { size: 12, color: C.blue, anchor: 'start' });
    return svg(QW, QH, s, 'qf');
  },
  trap(t, b, h, off, lt, lb, lh, ls) {
    const k = Math.min(150 / b, 72 / h), x0 = (QW - b * k) / 2, y0 = 18;
    const A = [x0, y0 + h * k], B = [x0 + b * k, y0 + h * k], Cc = [x0 + (off + t) * k, y0], D = [x0 + off * k, y0];
    let s = poly([A, B, Cc, D], { fill: '#fff4e6', stroke: C.ink });
    s += line(D, [D[0], A[1]], { stroke: C.pink, sw: 1.6, dash: '4 3' }) + rightAngle([D[0], A[1]], [1, 0], [0, -1], 7);
    s += text((D[0] + Cc[0]) / 2, y0 - 9, lt, { size: 12, color: C.blue });
    s += text((A[0] + B[0]) / 2, A[1] + 13, lb, { size: 12, color: C.orange });
    s += text(D[0] + 6, y0 + h * k / 2, lh, { size: 12, color: C.pink, anchor: 'start' });
    if (ls) s += text((B[0] + Cc[0]) / 2 + 8, (B[1] + Cc[1]) / 2, ls, { size: 12, anchor: 'start' });
    return svg(QW, QH, s, 'qf');
  },
  shapes() { // 사다리꼴 (평행사변형 아님)
    const s = poly([[40, 92], [180, 92], [140, 22], [80, 22]], { fill: '#f3f3f3', stroke: C.ink }) +
      line([40, 92], [180, 92], { stroke: C.red, sw: 3 }) + line([80, 22], [140, 22], { stroke: C.red, sw: 3 });
    return svg(QW, QH - 6, s, 'qf');
  },
};

// ---------- 내용 ----------
const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans KR', sans-serif; color: #222; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 7mm 8mm; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
table.card { width: 100%; height: 283mm; border-collapse: collapse; table-layout: fixed; border: 2.2px solid #333; }
.card td, .card th { border: 1px solid #555; padding: 0; vertical-align: middle; }
col.c1 { width: 19mm; } col.c2 { width: 33mm; } col.c4 { width: 34mm; }
.num { background: #b5524f; color: #fff; font-weight: 900; font-size: 30pt; text-align: center; letter-spacing: -1px; border-bottom: 2.2px solid #333 !important; }
.meta { text-align: center; font-size: 10.5pt; font-weight: 500; height: 10.5mm; }
.title { text-align: center; font-weight: 900; font-size: 26pt; letter-spacing: -1px; border-bottom: 2.2px solid #333 !important; }
.title.small { font-size: 20pt; }
.side { font-size: 9.5pt; padding-left: 2.5mm !important; color: #555; }
.side .tag { display: inline-block; background: #b5524f; color: #fff; border-radius: 3mm; padding: 0.4mm 3mm; font-weight: 700; }
.side .tag.t { background: #2a7f78; }
tr.hd2 td { border-bottom: 2.2px solid #333 !important; }
th { background: #f3dedd; font-size: 14pt; font-weight: 900; text-align: center; }
th.two { line-height: 1.35; }
.mean { height: 24mm; } .fig { height: 66mm; } .exp { height: 80mm; } .quiz { height: 57mm; } .think { height: 34mm; }
.mean td { font-size: 14pt; font-weight: 700; text-align: center; line-height: 1.55; padding: 0 4mm; }
.fig td { text-align: center; padding: 1mm 2mm; }
.fig svg { width: 100%; height: 63mm; }
.exp td { padding: 3mm 5mm; vertical-align: top; }
.exp ul { margin: 0; padding: 0; list-style: none; }
.exp li { position: relative; padding-left: 6mm; font-size: 12.2pt; line-height: 1.5; margin-bottom: 2.4mm; }
.exp li::before { content: '✔'; position: absolute; left: 0; color: #2a7f78; font-weight: 900; }
.ex { display: inline-block; border: 1.5px solid #222; border-radius: 50%; width: 6.2mm; height: 6.2mm; line-height: 5.6mm; text-align: center; font-size: 9pt; font-weight: 700; margin-right: 1mm; }
b.b { color: #2f6fd6; } b.r { color: #d9433b; } b.p { color: #d63c74; } b.g { color: #2a7f78; } b.o { color: #d9822b; }
.qwrap { display: grid; grid-template-columns: 1fr 1fr 1fr; height: 100%; }
.qcol { border-right: 1px solid #555; display: flex; flex-direction: column; }
.qcol:last-child { border-right: none; }
.qhead { text-align: center; font-family: 'Times New Roman', serif; font-size: 12pt; height: 7.5mm; line-height: 7.5mm; border-bottom: 1px dashed #777; }
.qbody { flex: 1; padding: 2mm 2.5mm; display: flex; flex-direction: column; font-size: 10.4pt; line-height: 1.45; font-weight: 500; }
.qbody .qf { width: 100%; height: 25mm; margin-top: 1mm; }
.qans { margin-top: auto; font-weight: 700; color: #d9433b; font-size: 10.2pt; border-top: 1px dotted #d9a; padding-top: 1mm; }
.qans.blank { color: #333; font-weight: 500; border-top: none; }
.qans.blank span { display: inline-block; width: 70%; border-bottom: 1px solid #333; height: 5mm; vertical-align: bottom; }
.think td { padding: 2.5mm 5mm; font-size: 11pt; line-height: 1.75; font-weight: 500; }
.lines { height: 100%; background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(9mm - 1px), #bbb calc(9mm - 1px), #bbb 9mm); }
.prompt { font-size: 10.5pt; color: #2a7f78; font-weight: 700; margin-bottom: 1mm; }
.exp .lines { height: calc(100% - 7mm); }
.mean .lines { height: 18mm; margin-top: 1mm; background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(9mm - 1px), #bbb calc(9mm - 1px), #bbb 9mm); }
.check { font-size: 10.5pt; line-height: 1.9; }
.check .box { display: inline-block; width: 4mm; height: 4mm; border: 1.3px solid #333; vertical-align: -0.5mm; margin-right: 1.2mm; }
.check .star { color: #e3b400; font-size: 13pt; letter-spacing: 1mm; }
.check .ln { display: inline-block; width: 120mm; border-bottom: 1px solid #999; }
/* 표지/정답 */
.cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.cover h1 { font-size: 34pt; font-weight: 900; margin: 6mm 0 2mm; letter-spacing: -1px; }
.cover .badge { background: #b5524f; color: #fff; padding: 2mm 7mm; border-radius: 6mm; font-weight: 700; font-size: 14pt; }
.cover .badge.t { background: #2a7f78; }
.cover .sub { font-size: 13pt; color: #555; margin-bottom: 10mm; }
.toc { border: 2px solid #333; border-collapse: collapse; width: 140mm; font-size: 12.5pt; }
.toc td { border: 1px solid #888; padding: 2.6mm 4mm; text-align: left; }
.toc td.n { width: 18mm; text-align: center; background: #f3dedd; font-weight: 900; }
.cover .how { margin-top: 10mm; width: 150mm; text-align: left; font-size: 11.5pt; line-height: 1.8; background: #fff8d6; border: 1px solid #e6cf6a; border-radius: 4mm; padding: 4mm 6mm; }
.cover .name { margin-top: 10mm; font-size: 13pt; }
.cover .name span { display: inline-block; width: 50mm; border-bottom: 1.5px solid #333; }
.ans h2 { margin: 0 0 4mm; font-size: 20pt; font-weight: 900; text-align: center; }
.ans table { width: 100%; border-collapse: collapse; font-size: 9.6pt; table-layout: fixed; }
.ans td, .ans th { border: 1px solid #777; padding: 1.6mm 2.2mm; vertical-align: top; line-height: 1.45; }
.ans th { background: #f3dedd; font-size: 10pt; }
.ans td.n { text-align: center; font-weight: 900; background: #f3dedd; vertical-align: middle; }
.ans .q { color: #d9433b; font-weight: 700; }
`;


// ---------- 페이지 ----------
const pad = n => String(n).padStart(2, '0');
const titleSize = t => { const n = [...t].length; return n <= 7 ? 26 : n <= 10 ? 22 : n <= 13 ? 19 : 16; };
function header(U, i, c, mode) {
  const side1 = mode === 'note' ? '<span class="tag">개념노트</span>' : '<span class="tag t">백지테스트</span>';
  const side2 = mode === 'note' ? '날짜:' : '이름:';
  return `
  <tr><td class="num" rowspan="2">${pad(i + 1)}</td><td class="meta">${U.grade}</td>
      <td class="title" style="font-size:${titleSize(c.title)}pt" rowspan="2">${c.title}</td><td class="side">${side1}</td></tr>
  <tr class="hd2"><td class="meta">${U.unitNo}단원 · 도형과 측정</td><td class="side">${side2}</td></tr>`;
}
function quizCell(items, mode) {
  return `<div class="qwrap">${items.map((it, k) => `
    <div class="qcol"><div class="qhead">Q${k + 1}</div><div class="qbody">
      <div>${it.q}</div>${it.fig ? it.fig() : ''}
      ${mode === 'note' ? `<div class="qans">정답 ▶ ${it.a}</div>` : `<div class="qans blank">답: <span></span></div>`}
    </div></div>`).join('')}</div>`;
}
const COLS = '<colgroup><col class="c1"><col class="c2"><col><col class="c4"></colgroup>';
function notePage(U, c, i) {
  BLANK = false;
  return `<section class="page"><table class="card">${COLS}
  ${header(U, i, c, 'note')}
  <tr class="mean"><th>뜻</th><td colspan="3">${c.mean}</td></tr>
  <tr class="fig"><th>예시</th><td colspan="3">${c.fig()}</td></tr>
  <tr class="exp"><th>설명</th><td colspan="3"><ul>${c.exp.map(e => `<li>${e}</li>`).join('')}</ul></td></tr>
  <tr class="quiz"><th>퀴즈</th><td colspan="3">${quizCell(c.quiz, 'note')}</td></tr>
  <tr class="think"><th class="two">생각<br>하기</th><td colspan="3">${c.think.join('<br>')}</td></tr>
  </table></section>`;
}
function testPage(U, c, i) {
  BLANK = true;
  const html = `<section class="page"><table class="card">${COLS}
  ${header(U, i, c, 'test')}
  <tr class="mean"><th>뜻</th><td colspan="3" style="text-align:left;font-weight:500"><div class="prompt" style="font-size:10pt">✏️ ‘${c.title}’의 뜻(또는 공식)을 써 보세요.</div><div class="lines"></div></td></tr>
  <tr class="fig"><th>예시</th><td colspan="3">${c.fig()}</td></tr>
  <tr class="exp"><th>설명</th><td colspan="3"><div class="prompt">✏️ ${c.tPrompt}</div><div class="lines"></div></td></tr>
  <tr class="quiz"><th>퀴즈</th><td colspan="3">${quizCell(c.tQuiz, 'test')}</td></tr>
  <tr class="think"><th class="two">생각<br>하기</th><td colspan="3"><div class="check">
    <span class="box"></span>뜻(공식)을 보지 않고 썼어요 &nbsp; <span class="box"></span>그림의 빈칸을 채웠어요 &nbsp; <span class="box"></span>퀴즈를 모두 풀었어요<br>
    나의 이해도: <span class="star">☆☆☆☆☆</span><br>
    헷갈린 점: <span class="ln"></span></div></td></tr>
  </table></section>`;
  BLANK = false;
  return html;
}
function coverPage(U, mode) {
  const isNote = mode === 'note';
  return `<section class="page cover">
    <div class="badge ${isNote ? '' : 't'}">${isNote ? '개념노트' : '개념 백지테스트'}</div>
    <h1>${U.unitNo}단원 ${U.unitName}</h1>
    <div class="sub">${U.grade} · ${U.sub}</div>
    <table class="toc">${U.cards.map((c, i) => `<tr><td class="n">${pad(i + 1)}</td><td>${c.title}</td></tr>`).join('')}</table>
    <div class="how">${isNote
      ? '📘 <b>이렇게 공부해요</b><br>① 뜻과 그림을 소리 내어 읽어요.<br>② 설명을 읽으며 왜 그런지 생각해요.<br>③ 퀴즈를 풀고 정답을 확인해요. → 다 했으면 백지테스트에 도전!'
      : '📝 <b>이렇게 풀어요</b><br>① 개념노트를 덮고, 기억나는 대로 뜻·설명을 써요.<br>② 그림의 점선 빈칸에 알맞은 말이나 식을 써요.<br>③ 퀴즈를 풀고 맨 뒤 정답지로 채점해요. 틀린 부분은 개념노트에서 다시 확인!'}</div>
    ${isNote ? '' : '<div class="name">이름: <span></span></div>'}
  </section>`;
}
function answerPages(U) {
  const strip = s => s.replace(/<br>/g, ' / ').replace(/<[^>]+>/g, '');
  const per = 9, pages = [];
  for (let s = 0; s < U.cards.length; s += per) {
    const rows = U.cards.slice(s, s + per).map((c, k) => { const i = s + k; return `<tr><td class="n">${pad(i + 1)}</td><td><b>${c.title}</b><br>${strip(c.mean)}</td><td>${c.keys}</td>
    <td>${c.tQuiz.map((q, j) => `<span class="q">Q${j + 1}</span> ${q.a}`).join('<br>')}</td></tr>`; }).join('');
    const last = s + per >= U.cards.length;
    pages.push(`<section class="page ans"><h2>✅ 백지테스트 정답${U.cards.length > per ? ` (${pages.length + 1})` : ''}</h2>
  <table><colgroup><col style="width:9mm"><col style="width:58mm"><col style="width:38mm"><col></colgroup>
  <tr><th>번호</th><th>뜻 (공식)</th><th>그림 빈칸</th><th>퀴즈 정답</th></tr>${rows}</table>
  ${last ? `<p style="font-size:9.6pt;color:#555;margin-top:3mm">※ 설명 칸은 정해진 답이 없어요. 개념노트의 ‘설명’과 비교하며 빠진 핵심 단어(${U.keywords})가 있는지 확인해 보세요.</p>` : ''}
  </section>`);
  }
  return pages.join('');
}
const doc = body => `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>${css}</style></head><body>${body}</body></html>`;
const hl = (s, c = 'b') => `<b class="${c}">${s}</b>`;
const isBlank = () => BLANK;

function unitHtml(U) {
  return {
    note: doc(coverPage(U, 'note') + U.cards.map((c, i) => notePage(U, c, i)).join('')),
    test: doc(coverPage(U, 'test') + U.cards.map((c, i) => testPage(U, c, i)).join('') + answerPages(U)),
  };
}

module.exports = { C, svg, P, poly, line, text, label, cap, sub, add, mul, unit, mid, rightAngle, foot, dim, grid, G, arrowR, xMark, oMark,
  W, H, QW, QH, qfig, regPts, rect, tick, arc, dot, hl, isBlank, unitHtml };
