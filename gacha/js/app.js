// 두근두근 가챠샵
// 화면: 처음(home) · 캡슐 채우기(setup) · 뽑기 기계(machine) · 리모컨(remote)
// 뽑기 순서: idle(기다림) → turning(손잡이 돌기) → dropping(캡슐 떨어짐) → ready(열기 기다림) → open(결과) → idle
"use strict";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

// ───────────── 저장 ─────────────
const store = {
  get(key, fallback) { try { const v = localStorage.getItem("gacha-" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem("gacha-" + key, JSON.stringify(value)); } catch (e) {} }
};

const SAMPLE = [
  { text: "칭찬 스티커 2장", n: 3, star: false },
  { text: "자리 바꾸기권", n: 2, star: false },
  { text: "급식 먼저 먹기", n: 2, star: false },
  { text: "선생님과 하이파이브", n: 3, star: false },
  { text: "숙제 면제권", n: 1, star: true }
];
let items = store.get("items", SAMPLE);          // 선생님이 적은 목록 [{text, n, star}]
let opts = Object.assign({ remove: true, design: "gacha", turns: false, shuffle: false }, store.get("opts", {}));   // design: gacha(캡슐) | claw(인형뽑기)
let pool = store.get("pool", null);               // 기계 안에 남은 캡슐 [{text, n, star}]
let history = store.get("history", []);           // 뽑은 기록 [{text, star}]

const cleanItems = (list) => list.map((it) => ({ text: String(it.text || "").trim().slice(0, 60), n: Math.max(1, Math.min(99, it.n | 0)), star: !!it.star })).filter((it) => it.text);
const countOf = (list) => list.reduce((s, it) => s + it.n, 0);

// ───────────── 차례 (학생 이름) ─────────────
// turnState: {order: 이번 바퀴 순서, i: 지금 차례 번호, round: 몇 바퀴째}
let students = store.get("students", []);
let turnState = store.get("turn", null);
const cleanNames = (list) => list.map((s) => String(s).trim().slice(0, 20)).filter(Boolean);
function shuffleArr(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function resetTurns() {
  const names = cleanNames(students);
  turnState = { order: opts.shuffle ? shuffleArr(names.slice()) : names, i: 0, round: 1 };
  store.set("turn", turnState);
}
const turnsOn = () => !!(opts.turns && turnState && turnState.order.length);
const who = () => (turnsOn() ? turnState.order[turnState.i] : null);
const nextWho = () => (turnsOn() && turnState.order.length > 1 ? turnState.order[(turnState.i + 1) % turnState.order.length] : null);
// d = 1 다음 사람, -1 앞 사람. 한 바퀴를 다 돌면 true
function stepTurn(d) {
  if (!turnsOn()) return false;
  let lap = false;
  turnState.i += d;
  if (turnState.i >= turnState.order.length) { turnState.i = 0; turnState.round++; lap = true; if (opts.shuffle) shuffleArr(turnState.order); }
  if (turnState.i < 0) turnState.i = turnState.order.length - 1;
  store.set("turn", turnState);
  return lap;
}

function fillPool() {
  pool = cleanItems(items);
  history = [];
  store.set("pool", pool); store.set("history", history);
  resetTurns();
}
if (!turnState) resetTurns();
if (!pool) fillPool();

// ───────────── 화면 바꾸기 ─────────────
let current = "home";
function show(name) {
  if (name === "machine" && countOf(cleanItems(items)) === 0) name = "setup";
  ["home", "setup", "machine", "remote"].forEach((s) => { $(s).hidden = s !== name; });
  current = name;
  Sound.unlock();
  if (name === "setup") renderSetup();
  if (name === "machine") Machine.start();
  if (name === "remote") Remote.enter();
  scrollTo(0, 0);
}
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));

// ───────────── 소리 ─────────────
const Sound = (() => {
  let ctx = null;
  function unlock() {
    try { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
  }
  function tone(freq, dur, type = "sine", vol = 0.2, when = 0, slide = 0) {
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  return {
    unlock,
    tick: () => tone(900, 0.05, "square", 0.08),
    thud: () => { tone(160, 0.25, "sine", 0.35, 0, 0.5); tone(320, 0.12, "triangle", 0.12, 0.18, 0.6); },
    pop: () => tone(500, 0.18, "sine", 0.3, 0, 2.4),
    yay: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.18, i * 0.09)),
    fanfare: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i === 6 ? 0.6 : 0.2, "square", 0.1, i * 0.11)); }
  };
})();

// ───────────── 캡슐 채우기 ─────────────
function saveItems() { store.set("items", items); store.set("opts", opts); renderTotal(); }
function renderTotal() {
  const n = countOf(cleanItems(items));
  const kids = cleanNames(students).length;
  let t = n ? `캡슐 모두 ${n}개` : "캡슐 내용을 하나 이상 적어 주세요";
  if (n && opts.turns) {
    t += kids ? ` · 학생 ${kids}명` : " · 학생 이름을 적어 주세요";
    if (kids && opts.remove && n < kids) t += ` (캡슐이 ${kids - n}개 모자라요)`;
  }
  $("total").textContent = t;
  $("fill").disabled = !n;
}
function renderSetup() {
  const box = $("rows");
  box.innerHTML = "";
  if (!items.length) items.push({ text: "", n: 1, star: false });
  items.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<input class="txt" maxlength="60" placeholder="예) 칭찬 스티커">
      <div class="cnt"><button aria-label="하나 빼기">−</button><span></span><button aria-label="하나 더">＋</button></div>
      <button class="star" title="특별 캡슐">⭐</button><button class="del" title="지우기">✕</button>`;
    const [txt] = row.getElementsByTagName("input");
    const [minus, plus] = row.querySelectorAll(".cnt button");
    const num = row.querySelector(".cnt span");
    const star = row.querySelector(".star");
    txt.value = it.text; num.textContent = it.n; star.classList.toggle("on", it.star);
    txt.addEventListener("input", () => { it.text = txt.value; saveItems(); });
    txt.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (i === items.length - 1) addRow(); else box.children[i + 1].querySelector("input").focus(); } });
    minus.onclick = () => { it.n = Math.max(1, it.n - 1); num.textContent = it.n; saveItems(); };
    plus.onclick = () => { it.n = Math.min(99, it.n + 1); num.textContent = it.n; saveItems(); };
    star.onclick = () => { it.star = !it.star; star.classList.toggle("on", it.star); saveItems(); };
    row.querySelector(".del").onclick = () => { items.splice(i, 1); saveItems(); renderSetup(); };
    box.appendChild(row);
  });
  $("optRemove").checked = opts.remove;
  $("optTurns").checked = opts.turns;
  $("optShuffle").checked = opts.shuffle;
  $("turnBox").hidden = !opts.turns;
  if (document.activeElement !== $("names")) $("names").value = students.join("\n");
  namesCount();
  document.querySelectorAll("[data-design]").forEach((b) => b.classList.toggle("on", b.dataset.design === opts.design));
  renderTotal();
}
function addRow() {
  items.push({ text: "", n: 1, star: false });
  renderSetup();
  const inputs = $("rows").querySelectorAll("input"); inputs[inputs.length - 1].focus();
}
$("addRow").onclick = addRow;
document.querySelectorAll("[data-design]").forEach((b) => b.addEventListener("click", () => {
  Machine.setDesign(b.dataset.design);
  renderSetup();
}));
function namesCount() {
  const n = cleanNames(students).length;
  $("namesCount").textContent = n ? `학생 ${n}명` : "한 줄에 한 명씩 적어요";
}
$("optTurns").onchange = () => { opts.turns = $("optTurns").checked; $("turnBox").hidden = !opts.turns; saveItems(); };
$("optShuffle").onchange = () => { opts.shuffle = $("optShuffle").checked; saveItems(); };
$("names").addEventListener("input", () => {
  students = $("names").value.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
  store.set("students", students); namesCount(); renderTotal();
});
$("namesNum").onclick = () => {
  const n = parseInt(prompt("몇 번까지 넣을까요? (우리 반 학생 수)", "25"), 10);
  if (!(n > 0)) return;
  if (cleanNames(students).length && !confirm("지금 적힌 이름을 지우고 번호로 바꿀까요?")) return;
  students = Array.from({ length: Math.min(n, 60) }, (_, i) => `${i + 1}번`);
  store.set("students", students); $("names").value = students.join("\n"); namesCount(); renderTotal();
};
$("optRemove").onchange = () => { opts.remove = $("optRemove").checked; saveItems(); };
function replaceItems(list) {
  if (cleanItems(items).length && !confirm("지금 적힌 내용을 지우고 바꿀까요?")) return;
  items = list; saveItems(); renderSetup();
}
$("preCoupon").onclick = () => replaceItems([
  { text: "칭찬 스티커 2장", n: 4, star: false }, { text: "자리 바꾸기권", n: 2, star: false },
  { text: "급식 먼저 먹기", n: 2, star: false }, { text: "선생님과 하이파이브", n: 4, star: false },
  { text: "원하는 친구와 짝 하기", n: 2, star: false }, { text: "숙제 면제권", n: 1, star: true }
]);
$("preMission").onclick = () => replaceItems([
  { text: "제자리 점프 10번", n: 1, star: false }, { text: "반 친구 칭찬 한마디", n: 1, star: false },
  { text: "좋아하는 노래 한 소절", n: 1, star: false }, { text: "오늘 배운 것 한 가지 말하기", n: 1, star: false },
  { text: "선생님 흉내 내기", n: 1, star: false }, { text: "통과! 다음 사람 지목", n: 1, star: true }
]);
$("preNum").onclick = () => {
  const n = parseInt(prompt("몇 번까지 넣을까요? (우리 반 학생 수)", "25"), 10);
  if (!(n > 0)) return;
  replaceItems(Array.from({ length: Math.min(n, 99) }, (_, i) => ({ text: `${i + 1}번`, n: 1, star: false })));
};
$("preClear").onclick = () => { if (confirm("캡슐 내용을 모두 지울까요?")) { items = []; saveItems(); renderSetup(); } };
$("bulkAdd").onclick = () => {
  const lines = $("bulk").value.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return;
  items = items.filter((it) => String(it.text).trim());
  lines.forEach((line) => {
    let star = false, n = 1;
    if (line.startsWith("*")) { star = true; line = line.slice(1).trim(); }
    const m = line.match(/\s*[xX×]\s*(\d+)$/);
    if (m) { n = parseInt(m[1], 10); line = line.slice(0, m.index).trim(); }
    if (line) items.push({ text: line, n: Math.max(1, Math.min(99, n)), star });
  });
  $("bulk").value = "";
  saveItems(); renderSetup();
};
$("fill").onclick = () => {
  items = cleanItems(items);
  saveItems();
  fillPool();
  Machine.refilled();
  show("machine");
};

// ───────────── 뽑기 기계 ─────────────
const Machine = (() => {
  const W = 600, H = 1000;                        // 그림 좌표
  // 캡슐 기계 그림 위치 (그림 좌표 600×1000 안). 몸통 그림의 왼쪽 위가 BODY예요.
  const BODY = { x: 39, y: 110 };
  const DOMEIMG = { x: 141, y: 214, w: 323, h: 337 };                // 유리 돔 그림 (원본의 0.85배)
  const DOME = { x: DOMEIMG.x + 161.5, y: DOMEIMG.y + 161.5, r: 158 }; // 유리 동그라미
  const DOME_FLOOR = DOMEIMG.y + 290;                                 // 캡슐이 얹히는 받침 높이
  const DOME_BASE = DOMEIMG.y + 272;                                  // 여기부터 아래는 빨간 받침
  const CROWN = { x: BODY.x + 92, y: BODY.y, w: 346, h: 152 };
  const CRANK = { x: BODY.x + 271, y: BODY.y + 579, r: 77 };
  const CHUTE = { x: BODY.x + 206, y: BODY.y + 711, w: 166, h: 56 };   // 아래 아치 구멍
  const DROP_R = 33;
  const COLORS = ["red", "blue", "green", "purple", "clear"];        // 특별 캡슐은 yellow
  const ART = {};
  ["claw-body", "claw-open", "claw-closed", "sparkle", "toy-star", "toy-bear", "toy-bunny", "toy-chick", "toy-panda", "toy-cat", "toy-penguin", "toy-dino",
    "body", "dome", "crown", "crank", "star", "cap-red", "cap-blue", "cap-yellow", "cap-green", "cap-purple", "cap-clear"]
    .forEach((n) => { ART[n] = new Image(); ART[n].src = `assets/${n}.webp`; });
  // 인형뽑기 기계
  const isClaw = () => opts.design === "claw";
  // 몸통 그림(원본 699×1057)을 0.84배로 (6, 40)에 놓아요. 시트 좌표 → 그림 좌표: 6 + (x - 27) × 0.84, 40 + (y - 4) × 0.84
  const BODYC = { x: 6, y: 40, w: 587, h: 888 };
  const GL = { x: 77, y: 215, w: 444, h: 437 };            // 비워 둔 유리 칸
  const BOX = { l: 195, r: 517, top: 260, floor: 644 };    // 인형이 쌓이는 칸
  const HOLE_TOP = 470;                                    // 선물 구멍 칸막이 높이
  const RAIL = 229, HOLE_X = 136, REACH = 106;             // 집게 레일 높이, 구멍 위치, 집게 그림 위에서 인형 가운데까지
  const CLAW_K = 0.42;                                     // 집게 그림 크기
  const CLAWIMG = { open: { w: 230, h: 385, px: 113 }, closed: { w: 217, h: 327, px: 104 } };  // px: 막대 가운데
  const DOOR = { x: 222, y: 800, w: 186, h: 66 };          // 선물 나오는 문
  const DROPC_R = 27;
  const PAD = { l: { x: 128, y: 690 }, r: { x: 242, y: 690 }, stick: { x: 185, y: 680 }, grab: { x: 433, y: 696 } };
  const TOYS = ["bear", "bunny", "chick", "panda", "cat", "penguin", "dino"];
  const TOY_COLORS = ["#a0663c", "#ffd0dc", "#ffd23f", "#f2f2f2", "#ffad5c", "#3b7be0", "#5cc45a"];
  const claw = { x: 365, len: 30, open: 0.45, held: null, target: null, fall: null, stage: 0, fromX: 0, xAt: 0, lenAt: 0,
    remoteDir: 0, remoteAt: 0, padDir: 0, keyDir: 0, padGp: 0, dir: 0 };

  const cv = $("cv"), g = cv.getContext("2d");
  let scale = 1, ox = 0, oy = 0, dpr = 1;
  let started = false, raf = 0;
  let phase = "idle", phaseT = 0, crankA = 0, lastTick = 0;
  let balls = [];
  let drop = null;                                // {color, star, y, vy, landed}
  let result = null;                              // {text, star}
  let net = null, remotes = 0, code = null;

  const left = () => countOf(pool);
  const total = () => opts.remove ? countOf(cleanItems(items)) : left();

  // 기계 안 캡슐 그림: 남은 캡슐 중 최대 36개를 보여 줘요(특별 캡슐은 금색)
  function makeBall(star, i, item) {
    const r = ballR();
    if (isClaw()) {
      return { x: BOX.l + r + Math.random() * (BOX.r - BOX.l - 2 * r), y: BOX.top + 60 + Math.random() * (BOX.floor - BOX.top - 60 - r),
        vx: 0, vy: 0, r, ang: 0, va: 0, star, item, kind: (i + kindShift) % TOYS.length,
        get color() { return star ? "#ff8fc0" : TOY_COLORS[this.kind]; } };
    }
    const a = Math.random() * Math.PI * 2, d = Math.random() * (DOME.r - r - 10);
    return { x: DOME.x + Math.cos(a) * d, y: DOME.y + Math.sin(a) * d * 0.6 + 40, vx: 0, vy: 0, r, ang: Math.random() * 6.28, va: 0, star,
      color: star ? "yellow" : COLORS[(i * 5 + Math.floor(Math.random() * 3)) % COLORS.length] };
  }
  let kindShift = Math.floor(Math.random() * 7);   // 인형 종류가 골고루 섞이게
  function visibleCount() { return Math.min(36, left()); }
  function ballR() {
    const n = Math.max(visibleCount(), 1);
    if (isClaw()) return Math.max(30, Math.min(46, Math.sqrt(20000 / n)));
    return Math.max(22, Math.min(40, Math.sqrt((DOME.r * DOME.r * 0.5) / n)));
  }
  function rebuildBalls() {
    const n = visibleCount();
    claw.held = claw.target = claw.fall = null;
    if (isClaw()) {
      // 인형 하나하나가 진짜 캡슐 내용을 하나씩 품고 있어요 (금색 = 특별)
      balls = shuffle(bag(null)).slice(0, n).map((it, i) => makeBall(it.star, i, it));
      for (let k = 0; k < 200; k++) physics(0);
      return;
    }
    const stars = pool.filter((p) => p.star).reduce((s, p) => s + p.n, 0);
    const starShown = Math.min(stars, Math.max(stars ? 1 : 0, Math.round(n * stars / Math.max(left(), 1))));
    balls = Array.from({ length: n }, (_, i) => makeBall(i < starShown, i));
    // 처음에 아래로 쌓이도록 조금 돌려요
    for (let k = 0; k < 160; k++) physics(1);
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 남은 캡슐을 하나씩 펼친 목록. skip에 있는 인형(이미 기계 안에 보이는 것)은 빼요.
  function bag(skip) {
    const used = new Map();
    (skip || []).forEach((b) => { const k = b.item.text + "|" + b.item.star; used.set(k, (used.get(k) || 0) + 1); });
    const out = [];
    pool.forEach((p) => {
      const k = p.text + "|" + p.star, u = used.get(k) || 0;
      for (let i = 0; i < p.n - u; i++) out.push({ text: p.text, star: p.star });
      used.set(k, Math.max(0, u - p.n));
    });
    return out;
  }
  function takeItem(it) {
    if (!opts.remove) return;
    const i = pool.findIndex((p) => p.text === it.text && p.star === it.star && p.n > 0);
    if (i < 0) return;
    if (--pool[i].n <= 0) pool.splice(i, 1);
    store.set("pool", pool);
  }
  // 뽑혀 나간 인형 자리를 채워요 (위에서 새 인형이 떨어져요)
  function respawn() {
    if (balls.length >= visibleCount()) return;
    const cand = opts.remove ? bag(balls) : bag(null);
    if (!cand.length) return;
    const it = cand[Math.floor(Math.random() * cand.length)];
    const b = makeBall(it.star, balls.length + Math.floor(Math.random() * 7), it);
    b.y = BOX.top + b.r; balls.push(b);
  }
  function removeBall(star) {
    if (!opts.remove) return;
    if (left() >= balls.length && balls.length) { /* 보이는 개수보다 남은 게 많으면 그대로 */ return; }
    let i = balls.findIndex((b) => b.star === star);
    if (i < 0) i = 0;
    balls.splice(i, 1);
  }

  function physics(stir) {
    const grav = 0.55;
    for (const b of balls) {
      if (b.held) continue;
      b.vy += grav;
      if (stir) {
        // 손잡이를 돌리면 아래에서 바람이 올라와 섞여요
        b.vx += (Math.random() - 0.5) * 3 * stir;
        if (b.y > DOME.y) b.vy -= Math.random() * 2.2 * stir;
        b.va += (Math.random() - 0.5) * 0.08 * stir;
      }
      b.vx *= 0.99; b.vy *= 0.99; b.va *= 0.97;
      b.x += b.vx; b.y += b.vy; b.ang += b.va + b.vx * 0.01;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          if (a.held || b.held) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = a.r + b.r;
          if (d2 < min * min && d2 > 0.01) {
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (min - d) / 2;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) { const imp = -rel * 0.6; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; }
          }
        }
        if (a.held) continue;
        if (isClaw()) {
          if (a.x < BOX.l + a.r) { a.x = BOX.l + a.r; if (a.vx < 0) a.vx *= -0.4; }
          if (a.x > BOX.r - a.r) { a.x = BOX.r - a.r; if (a.vx > 0) a.vx *= -0.4; }
          if (a.y > BOX.floor - a.r) { a.y = BOX.floor - a.r; if (a.vy > 0) a.vy *= -0.3; a.vx *= 0.9; }
          continue;
        }
        const dx = a.x - DOME.x, dy = a.y - DOME.y, d = Math.hypot(dx, dy), max = DOME.r - a.r - 6;
        if (d > max) {
          const nx = dx / d, ny = dy / d;
          a.x = DOME.x + nx * max; a.y = DOME.y + ny * max;
          const vn = a.vx * nx + a.vy * ny;
          if (vn > 0) { a.vx -= 1.5 * vn * nx; a.vy -= 1.5 * vn * ny; a.va += vn * 0.01; }
        }
        if (a.y > DOME_FLOOR - a.r) { a.y = DOME_FLOOR - a.r; if (a.vy > 0) a.vy *= -0.3; a.vx *= 0.95; }
      }
    }
  }

  // ── 그리기 ──
  function rr(x, y, w, h, r) {
    // 둥근 네모 (오래된 아이패드도 되게 직접 그려요). r: 숫자 또는 [왼위, 오른위, 오른아래, 왼아래]
    const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
    g.beginPath(); g.moveTo(x + a, y);
    g.arcTo(x + w, y, x + w, y + h, b); g.arcTo(x + w, y + h, x, y + h, c);
    g.arcTo(x, y + h, x, y, d); g.arcTo(x, y, x + w, y, a); g.closePath();
  }
  // ── 캡슐 뽑기 기계 그리기 (gacha/assets/의 그림 조각을 겹쳐요) ──
  function capsule(x, y, r, ang, color, star) {
    const im = ART["cap-" + color];
    if (!im || !im.complete) return;
    g.save(); g.translate(x, y); g.rotate(ang);
    g.drawImage(im, -r * 1.04, -r * 1.04, r * 2.08, r * 2.08);
    if (star && ART.star.complete) { const s = r * 0.8; g.drawImage(ART.star, -s / 2, -r * 0.75, s, s); }
    g.restore();
  }
  function img(name, x, y, w, h) { const im = ART[name]; if (im && im.complete && im.naturalWidth) g.drawImage(im, x, y, w, h); }
  function draw(now) {
    if (isClaw()) return drawClaw(now);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    const font = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";

    // 그림자
    g.fillStyle = "rgba(120,30,60,.15)"; g.beginPath(); g.ellipse(BODY.x + 261, BODY.y + 830, 255, 20, 0, 0, Math.PI * 2); g.fill();

    const shake = phase === "turning" ? Math.sin(now / 30) * 2 : 0;
    g.save(); g.translate(shake, 0);
    img("body", BODY.x, BODY.y, 522, 833);

    // 나오는 곳: 캡슐이 안쪽에서 떨어져 바닥에 멈춰요
    if (drop) {
      g.save(); g.beginPath(); g.rect(CHUTE.x + 6, CHUTE.y - 22, CHUTE.w - 12, CHUTE.h + 40); g.clip();
      const wob = phase === "ready" ? Math.sin(now / 120) * 0.15 : 0;
      capsule(CHUTE.x + CHUTE.w / 2, drop.y, DROP_R, drop.ang + wob, drop.color, drop.star);
      g.restore();
      if (phase === "ready") {
        const p = (Math.sin(now / 200) + 1) / 2;
        g.globalAlpha = 0.5 + p * 0.5;
        img("star", CHUTE.x + CHUTE.w - 20, CHUTE.y - 30 - p * 8, 34, 34);
        img("star", CHUTE.x - 14, CHUTE.y - 18 - (1 - p) * 8, 24, 24);
        g.globalAlpha = 1;
      }
    }

    // 손잡이 (돌아가요)
    if (phase === "idle" && left() > 0) {
      const p = (Math.sin(now / 300) + 1) / 2;
      g.beginPath(); g.arc(CRANK.x, CRANK.y, CRANK.r + 10 + p * 8, 0, Math.PI * 2);
      g.lineWidth = 6; g.strokeStyle = `rgba(255,255,255,${0.35 + p * 0.55})`; g.stroke();
    }
    g.save(); g.translate(CRANK.x, CRANK.y); g.rotate(crankA);
    const cs = CRANK.r / 97;
    img("crank", -101 * cs, -100 * cs, 213 * cs, 199 * cs);
    g.restore();
    g.restore();

    // 유리 돔 안의 캡슐 → 유리(반짝임이 캡슐 위로) → 별 장식
    // 유리가 캡슐을 너무 뿌옇게 가리지 않게: 유리 → 캡슐 → 유리를 연하게 한 번 더, 받침은 진하게 다시
    img("dome", DOMEIMG.x, DOMEIMG.y, DOMEIMG.w, DOMEIMG.h);
    g.save(); g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r - 3, 0, Math.PI * 2); g.clip();
    for (const b of balls) capsule(b.x + shake, b.y, b.r, b.ang, b.color, b.star);
    g.restore();
    g.save(); g.beginPath(); g.rect(0, 0, W, DOME_BASE); g.clip();
    g.globalAlpha = 0.4; img("dome", DOMEIMG.x, DOMEIMG.y, DOMEIMG.w, DOMEIMG.h); g.globalAlpha = 1;
    g.restore();
    g.save(); g.beginPath(); g.rect(0, DOME_BASE, W, H); g.clip();
    img("dome", DOMEIMG.x, DOMEIMG.y, DOMEIMG.w, DOMEIMG.h);
    g.restore();
    img("crown", CROWN.x, CROWN.y, CROWN.w, CROWN.h);

    // 빈 기계
    if (left() === 0 && phase === "idle") {
      g.fillStyle = "rgba(58,36,64,.8)"; g.font = `bold 32px ${font}`;
      g.fillText("캡슐이 다 떨어졌어요", DOME.x, DOME.y - 10);
      g.font = `24px ${font}`; g.fillText("🔄 다시 채우기를 눌러요", DOME.x, DOME.y + 30);
    }
    if (phase === "idle" && left() > 0) bubble("손잡이를 눌러 돌려요!", CRANK.x, 975, now);
    if (phase === "ready") bubble("캡슐을 눌러 열어요!", CHUTE.x + CHUTE.w / 2, 975, now);
  }

  // ── 인형뽑기 기계 그리기 (gacha/assets/의 claw-·toy- 그림을 겹쳐요) ──
  // 인형 kind: TOYS의 번호. 특별 인형은 분홍 별 인형(toy-star)에 반짝이가 붙어요.
  function toyName(star, kind) { return star ? "toy-star" : "toy-" + TOYS[kind % TOYS.length]; }
  function toy(x, y, r, tilt, color, star, kind) {
    const im = ART[toyName(star, kind)];
    if (!im || !im.complete || !im.naturalWidth) return;
    const h = r * 2.35, w = h * im.naturalWidth / im.naturalHeight;
    g.save(); g.translate(x, y); g.rotate(tilt);
    if (star) { g.shadowColor = "rgba(255,210,60,.95)"; g.shadowBlur = 18; }
    g.drawImage(im, -w / 2, -h * 0.55, w, h);
    g.restore();
  }
  function bubble(text, tx, ty, now) {
    const bob = Math.sin(now / 250) * 4;
    g.font = "bold 28px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    const w = g.measureText(text).width + 40;
    const bx = Math.max(20, Math.min(W - 20 - w, tx - w / 2));
    rr(bx, ty + bob - 26, w, 52, 26); g.fillStyle = "#fffdf5"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#3a2440"; g.stroke();
    g.fillStyle = "#3a2440"; g.fillText(text, bx + w / 2, ty + bob + 1);
  }
  function drawClaw(now) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    const font = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";

    g.fillStyle = "rgba(60,40,140,.15)"; g.beginPath(); g.ellipse(300, 935, 270, 20, 0, 0, Math.PI * 2); g.fill();

    // 유리 안쪽: 뒤판 → 바닥 → 천장 불빛
    const bg = g.createLinearGradient(0, GL.y, 0, GL.y + GL.h);
    bg.addColorStop(0, "#d9dcf7"); bg.addColorStop(0.6, "#c9c4ef"); bg.addColorStop(1, "#e7c9e6");
    g.fillStyle = bg; g.fillRect(GL.x - 4, GL.y - 4, GL.w + 8, GL.h + 8);
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(GL.x + 30, GL.y + 34, GL.w - 60, GL.h - 60);
    g.fillStyle = "#e9b9d6"; g.fillRect(BOX.l, BOX.floor, BOX.r - BOX.l + 6, GL.y + GL.h - BOX.floor + 4);
    rr(240, GL.y + 10, 130, 14, 7); g.fillStyle = "#fff6c8"; g.shadowColor = "#fff2a0"; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0;

    g.save(); g.beginPath(); g.rect(GL.x, GL.y, GL.w, GL.h); g.clip();
    for (const b of balls) if (!b.held) toy(b.x, b.y, b.r, Math.sin(b.ang) * 0.12, b.color, b.star, b.kind);
    if (claw.fall) toy(claw.fall.x, claw.fall.y, claw.fall.r, 0.2, claw.fall.color, claw.fall.star, claw.fall.kind);
    // 특별 인형 반짝이
    const tw = (Math.sin(now / 260) + 1) / 2;
    for (const b of balls) if (b.star && !b.held) { g.globalAlpha = 0.4 + tw * 0.6; img("sparkle", b.x + b.r * 0.6, b.y - b.r * 1.3, b.r * 0.7, b.r * 0.7); g.globalAlpha = 1; }

    // 선물 구멍 칸막이 (투명 판)
    g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(GL.x, HOLE_TOP, BOX.l - GL.x - 6, GL.y + GL.h - HOLE_TOP);
    g.fillStyle = "#d8344a"; g.fillRect(BOX.l - 8, HOLE_TOP, 8, GL.y + GL.h - HOLE_TOP);
    g.fillStyle = "#ffd23f"; g.fillRect(GL.x, HOLE_TOP - 8, BOX.l - GL.x, 10);
    g.fillStyle = "#c62a40"; g.font = `bold 21px ${font}`; g.fillText("선물 구멍", (GL.x + BOX.l) / 2, HOLE_TOP + 44);
    g.font = `24px ${font}`; g.fillText("⬇", (GL.x + BOX.l) / 2, HOLE_TOP + 78);

    // 레일 + 집게
    g.fillStyle = "#9aa0b8"; g.fillRect(GL.x, RAIL - 6, GL.w, 9);
    const top = RAIL + claw.len - 20;
    g.fillStyle = "#b9bfd0"; g.fillRect(claw.x - 5, RAIL, 10, Math.max(0, top - RAIL + 6));
    rr(claw.x - 26, RAIL - 12, 52, 22, 7); g.fillStyle = "#e23b4c"; g.fill();
    if (claw.held) toy(claw.held.x, claw.held.y, claw.held.r, 0, claw.held.color, claw.held.star, claw.held.kind);
    const openIm = claw.open > 0.55;
    const ci = openIm ? CLAWIMG.open : CLAWIMG.closed;
    img(openIm ? "claw-open" : "claw-closed", claw.x - ci.px * CLAW_K, top, ci.w * CLAW_K, ci.h * CLAW_K);
    g.restore();

    // 몸통 (유리 칸은 비어 있어서 위의 그림이 보여요)
    img("claw-body", BODYC.x, BODYC.y, BODYC.w, BODYC.h);

    // 유리 반짝임
    g.save(); g.beginPath(); g.rect(GL.x, GL.y, GL.w, GL.h); g.clip();
    g.fillStyle = "rgba(255,255,255,.22)";
    g.beginPath(); g.moveTo(GL.x + 330, GL.y); g.lineTo(GL.x + 380, GL.y); g.lineTo(GL.x + 250, GL.y + GL.h); g.lineTo(GL.x + 200, GL.y + GL.h); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(GL.x + 400, GL.y); g.lineTo(GL.x + 414, GL.y); g.lineTo(GL.x + 284, GL.y + GL.h); g.lineTo(GL.x + 270, GL.y + GL.h); g.closePath(); g.fill();
    g.restore();

    // 조종판: 조이스틱 양옆 ◀ ▶ 와 잡기 단추 둘레가 반짝여요
    for (const [pt, d, label] of [[PAD.l, -1, "◀"], [PAD.r, 1, "▶"]]) {
      const on = phase === "idle" && claw.dir === d;
      g.beginPath(); g.arc(pt.x, pt.y, 25, 0, Math.PI * 2); g.fillStyle = on ? "#7fe3ff" : "rgba(63,195,240,.9)"; g.fill();
      g.lineWidth = 3; g.strokeStyle = "#1f6fa0"; g.stroke();
      g.fillStyle = "#fff"; g.font = `bold 24px ${font}`; g.fillText(label, pt.x, pt.y + 1);
    }
    if (phase === "idle" && left() > 0) {
      const p = (Math.sin(now / 300) + 1) / 2;
      g.beginPath(); g.ellipse(PAD.grab.x, PAD.grab.y, 50 + p * 6, 30 + p * 4, 0, 0, Math.PI * 2);
      g.lineWidth = 4; g.strokeStyle = `rgba(255,255,255,${0.35 + p * 0.6})`; g.stroke();
    }

    // 선물 나오는 문
    if (drop) {
      g.save(); g.beginPath(); g.rect(DOOR.x, DOOR.y - 10, DOOR.w, DOOR.h + 10); g.clip();
      const wob = phase === "ready" ? Math.sin(now / 120) * 0.15 : 0;
      toy(DOOR.x + DOOR.w / 2, drop.y, DROPC_R, wob, drop.color, drop.star, drop.kind);
      g.restore();
      if (phase === "ready") {
        g.globalAlpha = 0.5 + tw * 0.5;
        img("star", DOOR.x + DOOR.w - 6, DOOR.y - 28 - tw * 8, 30, 30);
        img("star", DOOR.x - 22, DOOR.y - 14 - (1 - tw) * 8, 22, 22);
        g.globalAlpha = 1;
      }
    }

    if (left() === 0 && phase === "idle" && !balls.length) {
      g.fillStyle = "rgba(58,36,64,.8)"; g.font = `bold 34px ${font}`; g.fillText("인형이 다 떨어졌어요", 355, 420);
      g.font = `24px ${font}`; g.fillText("🔄 다시 채우기를 눌러요", 355, 462);
    }
    if (phase === "idle" && left() > 0) bubble("◀ ▶ 로 움직이고 잡기!", 300, 965, now);
    if (phase === "ready") bubble("선물을 눌러 열어요!", 300, 965, now);
  }

  // ── 진행 ──
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (current !== "machine") return;
    const dt = Math.min(50, now - (last || now)); last = now;
    phaseT += dt;
    pollGamepad();
    if (isClaw()) { clawStep(dt, now); physics(0); }
    else if (phase === "turning") {
      const k = Math.min(1, phaseT / 1500);
      const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      crankA = ease * Math.PI * 4;
      const step = Math.floor(crankA / (Math.PI / 2));
      if (step !== lastTick) { lastTick = step; Sound.tick(); }
      physics(1.2);
      if (k >= 1) startDrop();
    } else physics(0);
    if (phase === "dropping" && drop) {
      drop.vy += 1.1; drop.y += drop.vy; drop.ang += 0.08;
      const C = isClaw() ? DOOR : CHUTE;
      const floor = isClaw() ? C.y + C.h - 52 : C.y + C.h - DROP_R + 6;
      if (drop.y > floor) {
        drop.y = floor;
        if (drop.vy > 3) { if (!drop.bounced) Sound.thud(); drop.bounced = true; drop.vy = -drop.vy * 0.35; }
        else { drop.vy = 0; setPhase("ready"); }
      }
    }
    draw(now);
  }

  function setPhase(p) { phase = p; phaseT = 0; broadcast(); }

  function pick() {
    const n = left();
    if (!n) return null;
    let r = Math.random() * n;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].n;
      if (r < 0) {
        const it = pool[i];
        const res = { text: it.text, star: it.star };
        if (opts.remove) { it.n--; if (it.n <= 0) pool.splice(i, 1); store.set("pool", pool); }
        return res;
      }
    }
    return null;
  }

  function turn() {
    if (phase !== "idle" || !left()) return;
    Sound.unlock();
    if (isClaw()) return clawGrab();
    result = pick();
    if (!result) return;
    lastTick = 0; crankA = 0;
    setPhase("turning");
  }
  function startDrop() {
    crankA = 0;
    if (isClaw()) {
      drop = { color: result.color, star: result.star, kind: result.kind, y: DOOR.y - 60, vy: 2, ang: 0 };
      return setPhase("dropping");
    }
    removeBall(result.star);
    drop = { color: result.star ? "yellow" : COLORS[Math.floor(Math.random() * COLORS.length)], star: result.star, y: CHUTE.y - 50, vy: 2, ang: Math.random() * 6.28 };
    setPhase("dropping");
  }
  function open() {
    if (phase !== "ready") return;
    result.who = who();
    history.unshift(result); store.set("history", history);
    setPhase("open");
    Result.show(result, drop.color, isClaw());
    updateSide();
  }
  function next() {
    if (phase !== "open") return;
    Result.hide();
    drop = null; result = null;
    const lap = stepTurn(1);
    updateTurn(lap);
    setPhase("idle");
  }

  // 지금 차례 보여 주기 (기계 위 이름표 + 옆 칸)
  let lapTimer = 0;
  function updateTurn(lap) {
    const on = turnsOn();
    if ($("turnTag").hidden === on) { $("turnTag").hidden = !on; resize(); }
    $("turnSide").hidden = !on;
    if (!on) return;
    const w = who(), nx = nextWho();
    $("sideWho").textContent = w;
    $("sideNext").textContent = `${turnState.i + 1} / ${turnState.order.length}번째` + (turnState.round > 1 ? ` · ${turnState.round}바퀴` : "") + (nx ? ` · 다음: ${nx}` : "");
    clearTimeout(lapTimer);
    if (lap) {
      $("turnTag").classList.add("lap");
      $("turnTag").innerHTML = "🎉 모두 한 번씩 했어요! 처음부터 다시 해요";
      lapTimer = setTimeout(() => updateTurn(false), 2600);
      return;
    }
    $("turnTag").classList.remove("lap");
    $("turnTag").innerHTML = "";
    const b = document.createElement("b"); b.textContent = w;
    $("turnTag").append("🙋 지금 차례 ", b);
    if (nx) { const sm = document.createElement("small"); sm.textContent = `다음: ${nx}`; $("turnTag").append(sm); }
  }
  function moveTurn(d) { if (phase !== "idle" || !turnsOn()) return; stepTurn(d); updateTurn(false); broadcast(); }
  $("skipTurn").onclick = () => moveTurn(1);
  $("prevTurn").onclick = () => moveTurn(-1);

  // 화면 누르기: 손잡이 근처(기다릴 때)나 나오는 곳(열 때)
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left - ox) / scale, y = (e.clientY - r.top - oy) / scale;
    if (isClaw()) {
      // 인형뽑기: 판의 ◀ ▶ 를 누르고 있으면 움직이고, 빨간 단추를 누르면 잡아요
      const near = (pt, r) => Math.hypot(x - pt.x, y - pt.y) < r;
      if (phase === "idle") {
        if (near(PAD.l, 36)) claw.padDir = -1;
        else if (near(PAD.r, 36)) claw.padDir = 1;
        else if (near(PAD.stick, 34)) claw.padDir = x < PAD.stick.x ? -1 : 1;
        else if (near(PAD.grab, 52)) turn();
        if (claw.padDir) { try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
      } else if (phase === "ready") { if (y > 760) open(); }
      return;
    }
    if (phase === "idle") { if (y > 540 && x > 40 && x < 560) turn(); }
    else if (phase === "ready") { if (y > 760) open(); }
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) => cv.addEventListener(n, () => { claw.padDir = 0; }));

  // 하나의 단추로 다음 단계 (돌리기/잡기 → 열기 → 확인)
  function action() { if (phase === "idle") turn(); else if (phase === "ready") open(); else if (phase === "open") next(); }

  // 키보드: ← → 로 집게, 스페이스·엔터로 단추
  addEventListener("keydown", (e) => {
    if (current !== "machine" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") claw.keyDir = -1;
    else if (e.key === "ArrowRight") claw.keyDir = 1;
    else if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); action(); }
  });
  addEventListener("keyup", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") claw.keyDir = 0; });

  // 블루투스·USB 게임패드(보드 컴퓨터에 연결): 왼쪽 스틱·방향키로 집게, A·B 단추로 다음 단계
  let gpPrev = false;
  function pollGamepad() {
    claw.padGp = 0;
    if (!navigator.getGamepads) return;
    let btn = false;
    for (const p of navigator.getGamepads()) {
      if (!p) continue;
      const ax = p.axes[0] || 0;
      if (Math.abs(ax) > 0.4) claw.padGp = Math.sign(ax);
      if (p.buttons[14] && p.buttons[14].pressed) claw.padGp = -1;
      if (p.buttons[15] && p.buttons[15].pressed) claw.padGp = 1;
      if ([0, 1, 2, 3, 5, 7, 9].some((i) => p.buttons[i] && p.buttons[i].pressed)) btn = true;
    }
    if (btn && !gpPrev) action();
    gpPrev = btn;
  }
  function padText() {
    const n = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean).length : 0;
    $("padStatus").textContent = n ? `🎮 게임패드 ${n}개 연결됨` : "";
  }
  addEventListener("gamepadconnected", padText);
  addEventListener("gamepaddisconnected", padText);

  const ease = (k) => { k = Math.max(0, Math.min(1, k)); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  function clawDir(now) {
    let d = claw.padDir + claw.keyDir + claw.padGp;
    if (now - claw.remoteAt < 450) d += claw.remoteDir;   // 리모컨 신호가 끊기면 저절로 멈춰요
    return Math.max(-1, Math.min(1, d));
  }
  function clawGrab() {
    // 집게 바로 아래에서 가장 가까운(위쪽에 있는) 인형을 잡아요. 수업용이라 놓치지 않아요.
    let best = null, score = 1e9;
    for (const b of balls) { const sc = Math.abs(b.x - claw.x) + (b.y - BOX.top) * 0.2; if (sc < score) { score = sc; best = b; } }
    if (!best) return;
    claw.target = best; claw.stage = 0; claw.fromX = claw.x;
    result = { text: best.item.text, star: best.item.star, color: best.color, kind: best.kind };
    takeItem(best.item);
    Sound.tick();
    setPhase("turning");
  }
  function clawStep(dt, now) {
    const t = phaseT;
    claw.dir = 0;
    if (phase === "idle" || phase === "dropping" || phase === "ready" || phase === "open") {
      const min = BOX.l + 22, max = BOX.r - 22;
      if (claw.x < min) claw.x = Math.min(min, claw.x + 0.35 * dt);   // 구멍 위에서 돌아와요
      else if (phase === "idle") { claw.dir = clawDir(now); claw.x = Math.max(min, Math.min(max, claw.x + claw.dir * 0.22 * dt)); }
      claw.len += (30 - claw.len) * 0.2; claw.open += (0.45 - claw.open) * 0.1;
    } else if (phase === "turning") {
      const tg = claw.target;
      if (claw.stage === 0) {            // 내려가기
        const k = ease(t / 1000);
        claw.open = Math.min(1, 0.45 + t / 300);
        claw.x = claw.fromX + (tg.x - claw.fromX) * Math.min(1, t / 1000);
        claw.len = 30 + (tg.y - RAIL - REACH - 30) * k;
        if (t >= 1000) claw.stage = 1;
      } else if (claw.stage === 1) {     // 오므리기
        claw.open = Math.max(0.15, 1 - (t - 1000) / 300);
        if (!claw.held && t > 1150) { claw.held = tg; tg.held = true; Sound.tick(); }
        if (t >= 1350) { claw.stage = 2; claw.lenAt = claw.len; }
      } else if (claw.stage === 2) {     // 올라가기
        claw.len = claw.lenAt + (30 - claw.lenAt) * ease((t - 1350) / 800);
        if (t >= 2150) { claw.stage = 3; claw.xAt = claw.x; }
      } else if (claw.stage === 3) {     // 구멍으로 옮기기
        claw.x = claw.xAt + (HOLE_X - claw.xAt) * ease((t - 2150) / 900);
        if (t >= 3050) claw.stage = 4;
      } else if (claw.stage === 4) {     // 놓기
        claw.open = Math.min(1, 0.15 + (t - 3050) / 200);
        if (claw.held) {
          const h = claw.held; h.held = false; claw.held = null;
          balls.splice(balls.indexOf(h), 1);
          claw.fall = Object.assign({}, h, { vy: 0 });
          respawn();
        }
        if (claw.fall) {
          claw.fall.vy += 0.07 * dt; claw.fall.y += claw.fall.vy * dt / 16;
          if (claw.fall.y > 720) { claw.fall = null; startDrop(); }
        }
      }
      if (claw.held) { claw.held.x = claw.x; claw.held.y = RAIL + claw.len + REACH; claw.held.vx = claw.held.vy = 0; }
    }
  }
  function remoteMove(d) { claw.remoteDir = Math.max(-1, Math.min(1, d | 0)); claw.remoteAt = performance.now(); }

  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    scale = Math.min(r.width / W, r.height / H) * 0.96;
    ox = (r.width - W * scale) / 2; oy = (r.height - H * scale) / 2;
  }
  addEventListener("resize", () => { if (current === "machine") resize(); });

  // ── 옆 칸 ──
  function updateSide() {
    $("leftText").textContent = opts.remove ? `남은 캡슐 ${left()} / ${total()}개` : `캡슐 ${pool.length}종류 · 다시 넣으며 뽑아요`;
    const ul = $("hist");
    ul.innerHTML = "";
    history.slice(0, 50).forEach((h, i) => {
      const li = document.createElement("li");
      li.textContent = `${history.length - i}. ${h.who ? h.who + " → " : ""}${h.star ? "⭐ " : ""}${h.text}`;
      ul.appendChild(li);
    });
    if (!history.length) ul.innerHTML = '<li class="muted">아직 뽑은 캡슐이 없어요</li>';
  }

  function remoteUrl() {
    const u = new URL("./", location.href);
    u.search = "";
    u.searchParams.set("remote", code);
    if (params.get("net")) u.searchParams.set("net", params.get("net"));
    return u.href;
  }
  function drawQR() {
    const c = $("qr"), q = c.getContext("2d");
    q.fillStyle = "#fff"; q.fillRect(0, 0, c.width, c.height);
    if (typeof qrcode === "undefined") return;
    try {
      const qr = qrcode(0, "M"); qr.addData(remoteUrl()); qr.make();
      const n = qr.getModuleCount(), s = Math.floor(c.width / (n + 4)), off = Math.floor((c.width - s * n) / 2);
      q.fillStyle = "#3a2440";
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) q.fillRect(off + x * s, off + y * s, s, s);
    } catch (e) {}
  }
  function netText(t) { $("netStatus").textContent = t; }

  function state() {
    return { t: "state", design: opts.design, phase: phase === "idle" && !left() ? "empty" : phase, left: left(), total: total(), remove: opts.remove,
      result: phase === "open" && result ? result : null, who: who(), nextWho: nextWho() };
  }
  function broadcast() { if (net) net.broadcast(state()); }

  function startNet() {
    if (net) return;
    code = store.get("code", null) || String(1000 + Math.floor(Math.random() * 9000));
    $("code").textContent = code;
    drawQR();
    net = Net.host(code, {
      onReady: (c) => {
        if (c !== code) { code = c; $("code").textContent = code; drawQR(); }
        store.set("code", code);
        netText(remotes ? `리모컨 ${remotes}대 연결됨` : "리모컨을 기다리고 있어요");
      },
      onCount: (n) => { remotes = n; netText(n ? `리모컨 ${n}대 연결됨` : "리모컨을 기다리고 있어요"); },
      onMessage: (m, c) => {
        if (m.t === "hello") c.send(state());
        else if (m.t === "turn") turn();
        else if (m.t === "open") open();
        else if (m.t === "next") next();
        else if (m.t === "move") remoteMove(m.d);
      },
      onError: (type) => netText(type === "nolib" || type === "network" || type === "server-error" || type === "socket-error"
        ? "인터넷이 안 돼서 리모컨을 쓸 수 없어요. 화면을 눌러 뽑아요." : "연결을 다시 시도하고 있어요…")
    });
  }

  function start() {
    resize();
    if (!started) { started = true; rebuildBalls(); raf = requestAnimationFrame(loop); }
    // 이름 목록이 바뀌었으면 차례를 처음부터
    const key = (l) => l.slice().sort().join("\n");
    if (opts.turns && key(cleanNames(students)) !== key(turnState.order)) resetTurns();
    updateSide();
    updateTurn(false);
    startNet();
    broadcast();
  }
  function setDesign(d) {
    opts.design = d; store.set("opts", opts);
    refilled();
  }
  function refilled() {
    phase = "idle"; drop = null; result = null; Result.hide(); claw.x = 365;
    if (started) rebuildBalls();
    updateSide(); updateTurn(false); broadcast();
  }

  $("wideBtn").onclick = () => { $("machine").classList.toggle("wide"); resize(); };
  $("fullBtn").onclick = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };
  document.addEventListener("fullscreenchange", () => setTimeout(resize, 100));
  $("refill").onclick = () => { if (confirm("캡슐을 처음처럼 다시 채울까요? 뽑은 기록도 지워져요.")) { fillPool(); refilled(); } };
  $("editBtn").onclick = () => show("setup");
  $("designBtn").onclick = () => { if (phase === "idle") setDesign(isClaw() ? "gacha" : "claw"); };
  $("homeBtn").onclick = () => show("home");
  $("okBtn").onclick = next;

  return { start, refilled, turn, open, next, setDesign };
})();

// ───────────── 결과 화면 + 꽃가루 ─────────────
const Result = (() => {
  const box = $("result"), fx = $("fx"), f = fx.getContext("2d");
  let parts = [], raf = 0;
  const starImg = new Image(); starImg.src = "assets/star.webp";
  function fit(text) {
    const len = [...text].length;
    return len <= 4 ? "5em" : len <= 8 ? "4em" : len <= 14 ? "3em" : len <= 24 ? "2.3em" : "1.7em";
  }
  function show(res, color, isClaw) {
    if (!isClaw) {
      box.querySelector(".half.top").style.backgroundImage = `url(assets/cap-${color}.webp)`;
      box.querySelector(".half.bot").style.backgroundImage = `url(assets/bowl-${color}.webp)`;
    }
    box.querySelector(".halves").hidden = isClaw;
    box.querySelector(".puff").hidden = isClaw;
    $("prize").hidden = !isClaw;
    if (isClaw) $("prize").src = res.star ? "assets/toy-star.webp" : `assets/toy-${["bear", "bunny", "chick", "panda", "cat", "penguin", "dino"][res.kind || 0]}.webp`;
    $("paper").classList.toggle("star", res.star);
    $("banner").textContent = isClaw ? (res.star ? "👑 특별 인형! 👑" : "🧸 잡았다!") : (res.star ? "✨ 특별 캡슐! ✨" : "🎉 뽑았다!");
    $("rwho").hidden = !res.who;
    $("rwho").textContent = res.who ? `🙋 ${res.who}` : "";
    $("rtext").textContent = res.text;
    $("rtext").style.fontSize = fit(res.text);
    box.classList.remove("show"); box.hidden = false; void box.offsetWidth; box.classList.add("show");
    Sound.pop();
    setTimeout(() => (res.star ? Sound.fanfare : Sound.yay)(), 250);
    burst(res.star ? 260 : 120, res.star);
  }
  function hide() { box.hidden = true; box.classList.remove("show"); }
  function burst(n, star) {
    fx.width = innerWidth; fx.height = innerHeight;
    const cols = star ? ["#ffd23f", "#ffb300", "#fff3a8", "#ff6b9a", "#ffffff"] : ["#ff6b9a", "#4da3ff", "#6fd17a", "#ffd23f", "#b88cff", "#ff9f43"];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 6 + Math.random() * 12;
      parts.push({ x: innerWidth / 2, y: innerHeight / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: 5 + Math.random() * 7,
        c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 120 + Math.random() * 60,
        star: i % (star ? 4 : 10) === 0 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    f.clearRect(0, 0, fx.width, fx.height);
    parts = parts.filter((p) => p.life-- > 0 && p.y < fx.height + 40);
    for (const p of parts) {
      p.vy += 0.3; p.vx *= 0.98; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      f.save(); f.translate(p.x, p.y); f.rotate(p.rot); f.fillStyle = p.c; f.globalAlpha = Math.min(1, p.life / 40);
      if (p.star && starImg.complete) { const s = p.r * 4; f.drawImage(starImg, -s / 2, -s / 2, s, s); }
      else f.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      f.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) f.clearRect(0, 0, fx.width, fx.height);
  }
  return { show, hide };
})();

// ───────────── 리모컨 ─────────────
const Remote = (() => {
  let link = null, st = null;
  const errText = {
    "peer-unavailable": "그 코드의 뽑기 기계를 찾지 못했어요. 숫자를 다시 확인해 주세요.",
    timeout: "연결이 오래 걸려요. 인터넷을 확인하고 다시 눌러 주세요.",
    nolib: "인터넷이 안 돼서 연결할 수 없어요."
  };
  function enter() {
    if (link) return;
    $("rJoin").hidden = false; $("rPlay").hidden = true;
    $("rCode").value = params.get("remote") || store.get("lastCode", "") || "";
    $("rErr").textContent = "";
  }
  function connect() {
    const code = $("rCode").value.replace(/\D/g, "");
    if (code.length !== 4) { $("rErr").textContent = "숫자 4개를 넣어 주세요."; return; }
    $("rErr").textContent = "연결하는 중…";
    $("rConnect").disabled = true;
    link = Net.join(code, {
      onOpen: () => {
        store.set("lastCode", code);
        $("rConnect").disabled = false;
        $("rJoin").hidden = true; $("rPlay").hidden = false;
        $("rStatus").textContent = "🟢 뽑기 기계와 연결됐어요";
      },
      onMessage: (m) => { if (m.t === "state") { st = m; render(); } },
      onClose: () => { $("rStatus").textContent = "🟡 다시 연결하는 중…"; },
      onError: (type) => {
        link = null; $("rConnect").disabled = false;
        $("rJoin").hidden = false; $("rPlay").hidden = true;
        $("rErr").textContent = errText[type] || "연결하지 못했어요. 다시 눌러 주세요.";
      }
    });
  }
  function render() {
    $("rStatus").textContent = "🟢 뽑기 기계와 연결됐어요";
    const big = $("rBig");
    $("rLeft").textContent = st.remove ? `남은 캡슐 ${st.left} / ${st.total}개` : "";
    $("rWho").hidden = !st.who;
    if (st.who) { $("rWhoName").textContent = st.result && st.result.who ? st.result.who : st.who; $("rWhoNext").textContent = st.nextWho && !st.result ? `다음: ${st.nextWho}` : ""; }
    big.classList.remove("open");
    big.disabled = false;
    $("rResult").hidden = !st.result;
    if (st.result) {
      $("rPaper").classList.toggle("star", st.result.star);
      $("rBanner").textContent = st.design === "claw" ? (st.result.star ? "👑 특별 인형! 👑" : "🧸 잡았다!") : (st.result.star ? "✨ 특별 캡슐! ✨" : "🎉 뽑았다!");
      $("rText").textContent = st.result.text;
    }
    const claw = st.design === "claw";
    $("rPad").hidden = !(claw && st.phase === "idle");
    if (!claw || st.phase !== "idle") stopMove();
    if (st.phase === "idle") big.innerHTML = claw ? "🖐️<br>잡기!" : "🎰<br>돌리기!";
    else if (st.phase === "turning" || st.phase === "dropping") { big.innerHTML = "두근<br>두근…"; big.disabled = true; }
    else if (st.phase === "ready") { big.innerHTML = claw ? "🎁<br>열어 보기!" : "🥚<br>캡슐 열기!"; big.classList.add("open"); }
    else if (st.phase === "open") big.innerHTML = "👍<br>확인!";
    else if (st.phase === "empty") { big.innerHTML = "캡슐이<br>없어요"; big.disabled = true; }
  }
  $("rBig").onclick = () => {
    if (!link || !st) return;
    if (navigator.vibrate) navigator.vibrate(40);
    const t = { idle: "turn", ready: "open", open: "next" }[st.phase];
    if (t) link.send({ t });
  };
  // 조이스틱: 누르고 있는 동안 0.15초마다 "움직여" 신호를 보내요. 손을 떼거나 연결이 끊기면 기계 쪽에서 멈춰요.
  let moveTimer = 0, moveDir = 0;
  function startMove(d) {
    if (!link) return;
    stopMove(true);
    moveDir = d;
    if (navigator.vibrate) navigator.vibrate(15);
    link.send({ t: "move", d });
    moveTimer = setInterval(() => link && link.send({ t: "move", d }), 150);
    document.querySelectorAll("#rPad button").forEach((b) => b.classList.toggle("on", +b.dataset.dir === d));
  }
  function stopMove(quiet) {
    if (moveTimer) clearInterval(moveTimer);
    moveTimer = 0;
    if (moveDir && !quiet && link) link.send({ t: "move", d: 0 });
    moveDir = 0;
    document.querySelectorAll("#rPad button").forEach((b) => b.classList.remove("on"));
  }
  document.querySelectorAll("#rPad button").forEach((b) => {
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) {} startMove(+b.dataset.dir); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) => b.addEventListener(n, () => stopMove()));
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  addEventListener("blur", () => stopMove());
  $("rConnect").onclick = connect;
  $("rCode").addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
  function leave() { stopMove(); if (link) link.close(); link = null; st = null; }
  $("rLeave").onclick = () => { leave(); enter(); };
  $("rBack").onclick = () => { leave(); show("home"); };
  return { enter, connect };
})();

// ───────────── 설치 ─────────────
(() => {
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  const isApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let prompt = null;
  if (!isApp) $("installBtn").hidden = false;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); prompt = e; });
  $("installBtn").onclick = async () => {
    if (prompt) { prompt.prompt(); await prompt.userChoice; prompt = null; return; }
    $("installHelp").hidden = false;
    $("installHelp").innerHTML = isIOS ? "사파리의 <b>공유 버튼(□↑)</b> → <b>\"홈 화면에 추가\"</b>를 눌러 주세요."
      : "크롬 오른쪽 위 <b>⋮</b> 메뉴에서 <b>\"앱 설치\"</b> 또는 <b>\"홈 화면에 추가\"</b>를 눌러 주세요.";
  };
})();

// 주소로 바로 열기: ?remote=1234 → 리모컨, ?board → 뽑기 기계
if (params.get("remote")) { show("remote"); Remote.connect(); }
else if (params.has("board")) show("machine");
