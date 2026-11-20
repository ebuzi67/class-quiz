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
let opts = store.get("opts", { remove: true });
let pool = store.get("pool", null);               // 기계 안에 남은 캡슐 [{text, n, star}]
let history = store.get("history", []);           // 뽑은 기록 [{text, star}]

const cleanItems = (list) => list.map((it) => ({ text: String(it.text || "").trim().slice(0, 60), n: Math.max(1, Math.min(99, it.n | 0)), star: !!it.star })).filter((it) => it.text);
const countOf = (list) => list.reduce((s, it) => s + it.n, 0);

function fillPool() {
  pool = cleanItems(items);
  history = [];
  store.set("pool", pool); store.set("history", history);
}
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
  $("total").textContent = n ? `캡슐 모두 ${n}개` : "캡슐 내용을 하나 이상 적어 주세요";
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
  renderTotal();
}
function addRow() {
  items.push({ text: "", n: 1, star: false });
  renderSetup();
  const inputs = $("rows").querySelectorAll("input"); inputs[inputs.length - 1].focus();
}
$("addRow").onclick = addRow;
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
  const DOME = { x: 300, y: 300, r: 228 };
  const CRANK = { x: 190, y: 735, r: 74 };
  const CHUTE = { x: 345, y: 690, w: 150, h: 135 };
  const COLORS = ["#ff6b9a", "#4da3ff", "#6fd17a", "#b88cff", "#ff9f43", "#3fd0d4", "#ff6b6b", "#f78fb3"];

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
  function makeBall(star, i) {
    const r = ballR();
    const a = Math.random() * Math.PI * 2, d = Math.random() * (DOME.r - r - 10);
    return { x: DOME.x + Math.cos(a) * d, y: DOME.y + Math.sin(a) * d * 0.6 + 40, vx: 0, vy: 0, r, ang: Math.random() * 6.28, va: 0, star,
      color: star ? "#ffc21a" : COLORS[(i * 5 + Math.floor(Math.random() * 3)) % COLORS.length] };
  }
  function visibleCount() { return Math.min(36, left()); }
  function ballR() {
    const n = Math.max(visibleCount(), 1);
    return Math.max(30, Math.min(54, Math.sqrt((DOME.r * DOME.r * 0.5) / n)));
  }
  function rebuildBalls() {
    const n = visibleCount();
    const stars = pool.filter((p) => p.star).reduce((s, p) => s + p.n, 0);
    const starShown = Math.min(stars, Math.max(stars ? 1 : 0, Math.round(n * stars / Math.max(left(), 1))));
    balls = Array.from({ length: n }, (_, i) => makeBall(i < starShown, i));
    // 처음에 아래로 쌓이도록 조금 돌려요
    for (let k = 0; k < 160; k++) physics(1);
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
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = a.r + b.r;
          if (d2 < min * min && d2 > 0.01) {
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (min - d) / 2;
            a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) { const imp = -rel * 0.6; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; }
          }
        }
        const dx = a.x - DOME.x, dy = a.y - DOME.y, d = Math.hypot(dx, dy), max = DOME.r - a.r - 6;
        if (d > max) {
          const nx = dx / d, ny = dy / d;
          a.x = DOME.x + nx * max; a.y = DOME.y + ny * max;
          const vn = a.vx * nx + a.vy * ny;
          if (vn > 0) { a.vx -= 1.5 * vn * nx; a.vy -= 1.5 * vn * ny; a.va += vn * 0.01; }
        }
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
  function capsule(x, y, r, ang, color, star) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fillStyle = color; g.fill();
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.closePath(); g.fillStyle = star ? "#fff4c2" : "#ffffff"; g.fill();
    g.lineWidth = Math.max(2, r * 0.07); g.strokeStyle = "rgba(60,20,40,.35)";
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-r * 0.38, -r * 0.5, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); g.fill();
    if (star) { g.fillStyle = "#fff"; g.font = `${r * 0.7}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("★", 0, -r * 0.42); }
    g.restore();
  }
  function draw(now) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    // 그림자
    g.fillStyle = "rgba(120,30,60,.15)"; g.beginPath(); g.ellipse(300, 975, 250, 22, 0, 0, Math.PI * 2); g.fill();

    // 몸통
    const shake = phase === "turning" ? Math.sin(now / 30) * 2 : 0;
    g.save(); g.translate(shake, 0);
    rr(70, 500, 460, 450, 40); g.fillStyle = "#e84855"; g.fill();
    rr(70, 500, 460, 450, 40); g.lineWidth = 6; g.strokeStyle = "#b8323f"; g.stroke();
    rr(92, 520, 40, 400, 20); g.fillStyle = "rgba(255,255,255,.18)"; g.fill();
    rr(55, 905, 490, 60, 24); g.fillStyle = "#b8323f"; g.fill();

    // 간판
    rr(150, 540, 300, 74, 22); g.fillStyle = "#fffdf5"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#ffd23f"; g.stroke();
    g.fillStyle = "#e84855"; g.font = "bold 40px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("두근두근 가챠", 300, 579);

    // 손잡이
    g.beginPath(); g.arc(CRANK.x, CRANK.y, CRANK.r + 8, 0, Math.PI * 2); g.fillStyle = "#b8323f"; g.fill();
    g.beginPath(); g.arc(CRANK.x, CRANK.y, CRANK.r, 0, Math.PI * 2);
    const cg = g.createRadialGradient(CRANK.x - 20, CRANK.y - 25, 10, CRANK.x, CRANK.y, CRANK.r);
    cg.addColorStop(0, "#fff3a8"); cg.addColorStop(1, "#ffc21a"); g.fillStyle = cg; g.fill();
    g.save(); g.translate(CRANK.x, CRANK.y); g.rotate(crankA);
    rr(-CRANK.r * 0.92, -15, CRANK.r * 1.84, 30, 15); g.fillStyle = "#fffdf5"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#d99a00"; g.stroke();
    g.beginPath(); g.arc(CRANK.r * 0.62, 0, 13, 0, Math.PI * 2); g.fillStyle = "#e84855"; g.fill();
    g.restore();
    g.beginPath(); g.arc(CRANK.x, CRANK.y, 12, 0, Math.PI * 2); g.fillStyle = "#d99a00"; g.fill();
    if (phase === "idle" && left() > 0) {
      const p = (Math.sin(now / 300) + 1) / 2;
      g.beginPath(); g.arc(CRANK.x, CRANK.y, CRANK.r + 14 + p * 8, 0, Math.PI * 2);
      g.lineWidth = 5; g.strokeStyle = `rgba(255,255,255,${0.4 + p * 0.5})`; g.stroke();
    }

    // 나오는 곳
    rr(CHUTE.x - 10, CHUTE.y - 10, CHUTE.w + 20, CHUTE.h + 20, 30); g.fillStyle = "#b8323f"; g.fill();
    rr(CHUTE.x, CHUTE.y, CHUTE.w, CHUTE.h, 24); g.fillStyle = "#4a1020"; g.fill();
    if (drop) {
      g.save(); rr(CHUTE.x, CHUTE.y, CHUTE.w, CHUTE.h, 24); g.clip();
      const wob = phase === "ready" ? Math.sin(now / 120) * 0.15 : 0;
      capsule(CHUTE.x + CHUTE.w / 2, drop.y, 48, drop.ang + wob, drop.color, drop.star);
      g.restore();
    }
    rr(CHUTE.x, CHUTE.y, CHUTE.w, 26, [24, 24, 0, 0]); g.fillStyle = "rgba(255,255,255,.12)"; g.fill();
    g.restore();

    // 유리 받침
    rr(115, 470, 370, 48, 20); g.fillStyle = "#c93a48"; g.fill();

    // 유리 돔
    g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2);
    g.fillStyle = "rgba(220,240,255,.55)"; g.fill();
    g.save(); g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r - 4, 0, Math.PI * 2); g.clip();
    for (const b of balls) capsule(b.x + shake, b.y, b.r, b.ang, b.color, b.star);
    g.restore();
    g.lineWidth = 8; g.strokeStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 14; g.strokeStyle = "rgba(255,255,255,.6)"; g.lineCap = "round";
    g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r - 34, Math.PI * 1.08, Math.PI * 1.38); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.arc(DOME.x, DOME.y, DOME.r - 34, Math.PI * 1.46, Math.PI * 1.52); g.stroke();
    g.lineCap = "butt";
    // 꼭지
    rr(250, 56, 100, 32, 14); g.fillStyle = "#e84855"; g.fill();
    g.beginPath(); g.arc(300, 54, 20, 0, Math.PI * 2); g.fillStyle = "#ffd23f"; g.fill();

    // 빈 기계
    if (left() === 0 && phase === "idle") {
      g.fillStyle = "rgba(58,36,64,.75)"; g.font = "bold 36px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
      g.fillText("캡슐이 다 떨어졌어요", DOME.x, DOME.y - 10);
      g.font = "26px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
      g.fillText("🔄 다시 채우기를 눌러요", DOME.x, DOME.y + 36);
    }

    // 말풍선
    let tip = null, tx = 0, ty = 0;
    if (phase === "idle" && left() > 0) { tip = "손잡이를 눌러 돌려요!"; tx = CRANK.x + 40; ty = 860; }
    if (phase === "ready") { tip = "캡슐을 눌러 열어요!"; tx = CHUTE.x + CHUTE.w / 2 - 40; ty = 862; }
    if (tip) {
      const bob = Math.sin(now / 250) * 4;
      g.font = "bold 28px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
      const w = g.measureText(tip).width + 40;
      const bx = Math.max(20, Math.min(W - 20 - w, tx - w / 2));
      rr(bx, ty + bob - 26, w, 52, 26); g.fillStyle = "#fffdf5"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#3a2440"; g.stroke();
      g.fillStyle = "#3a2440"; g.textAlign = "center"; g.fillText(tip, bx + w / 2, ty + bob + 1);
    }
  }

  // ── 진행 ──
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (current !== "machine") return;
    const dt = Math.min(50, now - (last || now)); last = now;
    phaseT += dt;
    if (phase === "turning") {
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
      const floor = CHUTE.y + CHUTE.h - 52;
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
    result = pick();
    if (!result) return;
    lastTick = 0; crankA = 0;
    setPhase("turning");
  }
  function startDrop() {
    crankA = 0;
    removeBall(result.star);
    drop = { color: result.star ? "#ffc21a" : COLORS[Math.floor(Math.random() * COLORS.length)], star: result.star, y: CHUTE.y - 60, vy: 2, ang: Math.random() * 6.28 };
    setPhase("dropping");
  }
  function open() {
    if (phase !== "ready") return;
    history.unshift(result); store.set("history", history);
    setPhase("open");
    Result.show(result, drop.color);
    updateSide();
  }
  function next() {
    if (phase !== "open") return;
    Result.hide();
    drop = null; result = null;
    setPhase("idle");
  }

  // 화면 누르기: 손잡이 근처(기다릴 때)나 나오는 곳(열 때)
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left - ox) / scale, y = (e.clientY - r.top - oy) / scale;
    if (phase === "idle") { if (y > 450 && x > 40 && x < 560) turn(); }
    else if (phase === "ready") { if (y > 620) open(); }
  });

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
      li.textContent = `${history.length - i}. ${h.star ? "⭐ " : ""}${h.text}`;
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
    return { t: "state", phase: phase === "idle" && !left() ? "empty" : phase, left: left(), total: total(), remove: opts.remove,
      result: phase === "open" && result ? result : null };
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
      },
      onError: (type) => netText(type === "nolib" || type === "network" || type === "server-error" || type === "socket-error"
        ? "인터넷이 안 돼서 리모컨을 쓸 수 없어요. 화면을 눌러 뽑아요." : "연결을 다시 시도하고 있어요…")
    });
  }

  function start() {
    resize();
    if (!started) { started = true; rebuildBalls(); raf = requestAnimationFrame(loop); }
    updateSide();
    startNet();
    broadcast();
  }
  function refilled() {
    phase = "idle"; drop = null; result = null; Result.hide();
    if (started) rebuildBalls();
    updateSide(); broadcast();
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
  $("homeBtn").onclick = () => show("home");
  $("okBtn").onclick = next;

  return { start, refilled, turn, open, next };
})();

// ───────────── 결과 화면 + 꽃가루 ─────────────
const Result = (() => {
  const box = $("result"), fx = $("fx"), f = fx.getContext("2d");
  let parts = [], raf = 0;
  function fit(text) {
    const len = [...text].length;
    return len <= 4 ? "5em" : len <= 8 ? "4em" : len <= 14 ? "3em" : len <= 24 ? "2.3em" : "1.7em";
  }
  function show(res, color) {
    box.querySelector(".half.top").style.setProperty("--c", color);
    $("paper").classList.toggle("star", res.star);
    $("banner").textContent = res.star ? "✨ 특별 캡슐! ✨" : "🎉 뽑았다!";
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
        c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 120 + Math.random() * 60 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    f.clearRect(0, 0, fx.width, fx.height);
    parts = parts.filter((p) => p.life-- > 0 && p.y < fx.height + 40);
    for (const p of parts) {
      p.vy += 0.3; p.vx *= 0.98; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      f.save(); f.translate(p.x, p.y); f.rotate(p.rot); f.fillStyle = p.c; f.globalAlpha = Math.min(1, p.life / 40);
      f.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); f.restore();
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
    big.classList.remove("open");
    big.disabled = false;
    $("rResult").hidden = !st.result;
    if (st.result) {
      $("rPaper").classList.toggle("star", st.result.star);
      $("rBanner").textContent = st.result.star ? "✨ 특별 캡슐! ✨" : "🎉 뽑았다!";
      $("rText").textContent = st.result.text;
    }
    if (st.phase === "idle") big.innerHTML = "🎰<br>돌리기!";
    else if (st.phase === "turning" || st.phase === "dropping") { big.innerHTML = "두근<br>두근…"; big.disabled = true; }
    else if (st.phase === "ready") { big.innerHTML = "🥚<br>캡슐 열기!"; big.classList.add("open"); }
    else if (st.phase === "open") big.innerHTML = "👍<br>확인!";
    else if (st.phase === "empty") { big.innerHTML = "캡슐이<br>없어요"; big.disabled = true; }
  }
  $("rBig").onclick = () => {
    if (!link || !st) return;
    if (navigator.vibrate) navigator.vibrate(40);
    const t = { idle: "turn", ready: "open", open: "next" }[st.phase];
    if (t) link.send({ t });
  };
  $("rConnect").onclick = connect;
  $("rCode").addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
  function leave() { if (link) link.close(); link = null; st = null; }
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
