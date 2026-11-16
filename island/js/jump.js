"use strict";
// 몽글몽글 섬: 점프맵 (옆에서 보는 발판 뛰기 놀이)와 점프맵 만들기
// 코스는 가로 60칸, 세로 11칸. 칸 글자: . 빈칸, # 풀 발판, b 돌 발판, ^ 가시, S 용수철, * 별, F 깃발, P 시작

const JC = 60, JR = 11;
const JUMP_TOOLS = [["#", "🟩", "발판"], ["b", "🧱", "돌"], ["^", "🔺", "가시"], ["S", "🌀", "용수철"], ["*", "⭐", "별"], ["P", "🙂", "시작"], ["F", "🚩", "깃발"], [".", "🧽", "지우개"]];
function defaultJump() {
  const g = Array.from({ length: JR }, () => Array(JC).fill("."));
  const seg = (x0, x1, y, ch) => { for (let x = x0; x <= x1; x++) g[y][x] = ch || "#"; };
  seg(0, 8, 10); g[9][2] = "P"; seg(11, 14, 10); g[8][13] = "*"; seg(17, 19, 8); seg(22, 24, 6); g[4][23] = "*";
  seg(26, 34, 10); g[9][29] = "^"; seg(37, 39, 8); seg(42, 44, 6); g[4][43] = "*";
  seg(47, 55, 10); g[9][49] = "^"; g[9][55] = "S"; seg(57, 59, 6, "b"); g[5][59] = "F";
  return g.map((r) => r.join(""));
}
function validJump(rows) {
  return Array.isArray(rows) && rows.length === JR && rows.every((r) => typeof r === "string" && r.length === JC && /^[.#b^S*FP]+$/.test(r));
}
function jumpRows() {
  const src = isGuest() ? W().jump : state.jump && state.jump.rows;
  return validJump(src) ? src : defaultJump();
}

const jp = { open: false, mode: "play", grid: [], tool: "#", cam: 0, keys: {}, raf: 0, last: 0, p: null, t: 0, stars: 0, total: 0, deaths: 0, done: false, mine: true, paint: false };
function jumpOpen() { return jp.open; }

function openJump() {
  const best = state.jump && state.jump.best, guest = isGuest();
  let html = '<p class="note">발판을 뛰어넘어 🚩 깃발까지 가요! 가시(🔺)에 닿거나 떨어지면 처음부터 다시 해요. 🌀 용수철을 밟으면 높이 뛰어요.</p><div class="two">' +
    '<button class="btn go bigbtn" data-jump="play">▶️<b>' + (guest ? esc(W().name) + "의 코스 도전" : "도전하기") + "</b><small>" + (best && !guest ? "내 최고 기록 " + (best / 1000).toFixed(1) + "초" : "깃발까지 달려요") + "</small></button>";
  if (!guest) html += '<button class="btn pink bigbtn" data-jump="edit">🔧<b>코스 만들기</b><small>발판·가시·용수철을 놓아요</small></button>';
  html += '</div><p class="note">⌨️ 노트북: ← → 로 달리고 스페이스로 뛰어요. 📱 태블릿: 화면의 화살표와 점프 단추를 눌러요.' + (guest ? "" : ' <button class="btn small" data-jump="reset">처음 코스로 되돌리기</button>') + "</p>";
  openModal("jump", "🏁 점프맵", html);
}
function jumpClick(what) {
  if (what === "reset") {
    if (!confirm("내가 만든 코스를 지우고 처음 코스로 되돌릴까요?")) return;
    state.jump = { rows: defaultJump(), best: 0 }; touch(); toast("처음 코스로 되돌렸어."); openJump(); return;
  }
  closeModal();
  startJump(what === "edit" ? "edit" : "play");
}

function jumpEl() {
  let el = $("jump");
  if (el) return el;
  el = document.createElement("div");
  el.id = "jump";
  el.innerHTML = '<canvas id="jump-cv"></canvas><div id="jump-top"><span class="pill" id="jump-info"></span><span style="flex:1"></span>' +
    '<button class="btn small" id="jump-mode"></button><button class="btn small" id="jump-exit">✕ 나가기</button></div>' +
    '<div id="jump-pad"><button class="jbtn" data-jk="left">◀</button><button class="jbtn" data-jk="right">▶</button><span style="flex:1"></span><button class="jbtn big" data-jk="jump">⤴ 점프</button></div>' +
    '<div id="jump-tools"></div>';
  const css = document.createElement("style");
  css.textContent = "#jump{position:fixed;inset:0;z-index:4;background:#9fdcf5}#jump-cv{position:absolute;inset:0;width:100%;height:100%;touch-action:none}" +
    "#jump-top{position:absolute;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top));display:flex;gap:8px;align-items:center}" +
    "#jump-pad{position:absolute;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));display:flex;gap:10px;align-items:flex-end;pointer-events:none}" +
    ".jbtn{pointer-events:auto;width:84px;height:84px;border-radius:24px;border:4px solid var(--line);background:rgba(255,248,234,.9);font-size:30px;touch-action:none;font-family:inherit;color:inherit}" +
    ".jbtn.big{width:150px;background:var(--sun);font-size:26px}.jbtn:active{background:var(--pink)}" +
    "#jump-tools{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(255,248,234,.96);border-top:4px solid var(--line);overflow-x:auto}";
  document.head.append(css);
  document.body.append(el);
  el.querySelectorAll("[data-jk]").forEach((b) => {
    const set = (on) => (e) => { e.preventDefault(); if (on && b.dataset.jk === "jump") jumpPress(); jp.keys[b.dataset.jk] = on; if (!on && b.dataset.jk === "jump") jumpRelease(); };
    b.addEventListener("pointerdown", set(true));
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, set(false));
  });
  $("jump-exit").addEventListener("click", closeJump);
  $("jump-mode").addEventListener("click", () => { if (jp.mode === "edit") { saveJump(); startJump("play"); } else startJump("edit"); });
  $("jump-tools").addEventListener("click", (e) => { const b = e.target.closest("[data-jt]"); if (b) { jp.tool = b.dataset.jt; drawJumpTools(); } });
  $("jump-tools").addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-js]"); if (b) jp.keys[b.dataset.js] = true; });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) $("jump-tools").addEventListener(ev, () => { jp.keys.left = jp.keys.right = false; });
  const cv = $("jump-cv");
  const cell = (e) => { const r = cv.getBoundingClientRect(), s = jp.ts / jp.dpr; return [Math.floor((e.clientX - r.left) / s + jp.cam), Math.floor((e.clientY - r.top - jp.oy / jp.dpr) / s)]; };
  const paint = (e) => {
    const [x, y] = cell(e);
    if (x < 0 || y < 0 || x >= JC || y >= JR || jp.grid[y][x] === jp.tool) return;
    if (jp.tool === "P" || jp.tool === "F") for (const row of jp.grid) { const i = row.indexOf(jp.tool); if (i >= 0) row[i] = "."; }   // 시작과 깃발은 하나씩만
    jp.grid[y][x] = jp.tool; sfx("put");
  };
  cv.addEventListener("pointerdown", (e) => { if (jp.mode !== "edit") return; e.preventDefault(); jp.paint = true; paint(e); });
  cv.addEventListener("pointermove", (e) => { if (jp.mode === "edit" && jp.paint) paint(e); });
  for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, () => { jp.paint = false; });
  addEventListener("keydown", (e) => {
    if (!jp.open) return;
    if (e.code === "Escape") { closeJump(); return; }
    if (e.code === "ArrowLeft" || e.code === "KeyA") jp.keys.left = true;
    else if (e.code === "ArrowRight" || e.code === "KeyD") jp.keys.right = true;
    else if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !e.repeat) jumpPress();
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  addEventListener("keyup", (e) => {
    if (!jp.open) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") jp.keys.left = false;
    else if (e.code === "ArrowRight" || e.code === "KeyD") jp.keys.right = false;
    else if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") jumpRelease();
  }, true);
  return el;
}
function drawJumpTools() {
  $("jump-tools").innerHTML = '<button class="slot" data-js="left">◀</button>' +
    JUMP_TOOLS.map(([ch, e, n]) => '<button class="slot txt' + (jp.tool === ch ? " on" : "") + '" data-jt="' + ch + '">' + e + "<small>" + n + "</small></button>").join("") +
    '<button class="slot" data-js="right">▶</button><span style="flex:1"></span><span class="note" style="margin:0;white-space:nowrap">칸을 눌러 놓아요 · ◀▶로 옆으로</span>';
}
function startJump(mode) {
  jumpEl().hidden = false;
  jp.open = true; jp.mode = mode; jp.mine = !isGuest(); jp.keys = {};
  jp.grid = jumpRows().map((r) => r.split(""));
  $("jump-pad").hidden = mode !== "play"; $("jump-tools").hidden = mode !== "edit";
  $("jump-mode").hidden = !jp.mine; $("jump-mode").textContent = mode === "edit" ? "▶ 저장하고 해 보기" : "🔧 만들기";
  if (mode === "edit") drawJumpTools(); else respawn(true);
  cancelAnimationFrame(jp.raf); jp.last = performance.now(); jp.raf = requestAnimationFrame(jumpFrame);
}
function saveJump() {
  if (!jp.mine || jp.mode !== "edit") return;
  const rows = jp.grid.map((r) => r.join("")), old = state.jump && state.jump.rows;
  state.jump = { rows, best: old && old.join() === rows.join() ? state.jump.best || 0 : 0 };   // 코스가 바뀌면 기록도 새로
  touch();
}
function closeJump() {
  saveJump();
  jp.open = false; cancelAnimationFrame(jp.raf);
  if ($("jump")) $("jump").hidden = true;
  save();
}
function findTile(ch) { for (let y = 0; y < JR; y++) { const x = jp.grid[y].indexOf(ch); if (x >= 0) return [x, y]; } return null; }
function respawn(fresh) {
  const s = findTile("P") || [1, 5];
  jp.p = { x: s[0] + 0.5, y: s[1] + 1, vx: 0, vy: 0, ground: false, coy: 0, dir: "right" };
  if (fresh) { jp.t = 0; jp.deaths = 0; jp.done = false; }
  jp.got = {}; jp.stars = 0; jp.total = jp.grid.reduce((n, r) => n + r.filter((c) => c === "*").length, 0);
  jp.cam = Math.max(0, jp.p.x - 6);
}
function jumpPress() { const p = jp.p; if (jp.mode !== "play" || !p || jp.done) return; if (p.ground || p.coy > 0) { p.vy = -13.5; p.ground = false; p.coy = 0; sfx("pop"); } }
function jumpRelease() { const p = jp.p; if (p && p.vy < -5) p.vy = -5; }
function jSolid(x, y) { if (x < 0 || x >= JC) return true; if (y < 0 || y >= JR) return false; const c = jp.grid[y][x]; return c === "#" || c === "b"; }
function jumpStep(dt) {
  const p = jp.p;
  if (jp.done) return;
  jp.t += dt;
  const dir = (jp.keys.right ? 1 : 0) - (jp.keys.left ? 1 : 0);
  p.vx = dir * 6.5; if (dir) p.dir = dir > 0 ? "right" : "left";
  p.vy = Math.min(22, p.vy + 38 * dt); p.coy -= dt;
  // 옆으로
  let nx = p.x + p.vx * dt;
  const top = Math.floor(p.y - 0.88), bot = Math.floor(p.y - 0.02);
  for (let y = top; y <= bot; y++) { if (jSolid(Math.floor(nx + 0.3 * Math.sign(p.vx || 1)), y) && p.vx) { nx = p.x; break; } }
  p.x = Math.max(0.3, Math.min(JC - 0.3, nx));
  // 위아래로
  let ny = p.y + p.vy * dt;
  const l = Math.floor(p.x - 0.28), r = Math.floor(p.x + 0.28);
  p.ground = false;
  if (p.vy >= 0) { const fy = Math.floor(ny); if ((jSolid(l, fy) || jSolid(r, fy)) && p.y <= fy + 0.001) { ny = fy; p.vy = 0; p.ground = true; p.coy = 0.09; } }
  else { const hy = Math.floor(ny - 0.9); if (jSolid(l, hy) || jSolid(r, hy)) { ny = p.y; p.vy = 0; } }
  p.y = ny;
  // 닿은 칸
  for (const [cx, cy] of [[Math.floor(p.x), Math.floor(p.y - 0.3)], [Math.floor(p.x), Math.floor(p.y - 0.8)]]) {
    const c = cy >= 0 && cy < JR && cx >= 0 && cx < JC ? jp.grid[cy][cx] : ".";
    if (c === "^") { jp.deaths++; sfx("fail"); respawn(false); return; }
    if (c === "S" && p.vy >= 0) { p.vy = -20; p.ground = false; sfx("good"); }
    if (c === "*" && !jp.got[cx + "," + cy]) { jp.got[cx + "," + cy] = 1; jp.stars++; sfx("coin"); }
    if (c === "F") { finishJump(); return; }
  }
  if (p.y > JR + 3) { jp.deaths++; sfx("fail"); respawn(false); }
}
function finishJump() {
  jp.done = true;
  // 코인은 5초 넘게 걸리는 코스에서, 1분에 한 번만 받아요 (아주 짧은 코스로 코인만 모으지 못하게)
  const ms = Math.round(jp.t * 1000), sec = (ms / 1000).toFixed(1), paid = jp.t >= 5 && Date.now() - (state.jumpAt || 0) > 60000, coins = paid ? 30 + jp.stars * 10 : 0;
  if (paid) state.jumpAt = Date.now();
  let record = false;
  if (jp.mine) { state.jump = state.jump || { rows: jumpRows(), best: 0 }; if (!state.jump.best || ms < state.jump.best) { state.jump.best = ms; record = true; } }
  state.coins += coins; bump("jump"); sfx("good");
  sendFx(["jump", sec]);
  closeJump();
  showCard('<div class="big">🏁</div><b>점프맵 성공!</b><span>' + sec + "초 · ⭐ " + jp.stars + "/" + jp.total + " · 다시 한 횟수 " + jp.deaths + "번<br>" + (coins ? "💰 코인 " + coins + "개를 받았어." : "코인은 5초 넘는 코스에서 1분에 한 번 받아요.") + "</span>" + (record ? '<i class="new">🏆 새 기록!</i>' : ""));
}
function jumpFrame(now) {
  if (!jp.open) return;
  const dt = Math.min(0.033, (now - jp.last) / 1000);
  jp.last = now;
  const cv = $("jump-cv"), d = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(innerWidth * d) || cv.height !== Math.round(innerHeight * d)) { cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
  const ts = Math.floor(Math.min(cv.height / (JR + 3.2), 72 * d)), view = cv.width / ts;
  jp.ts = ts; jp.dpr = d; jp.oy = Math.round((cv.height - JR * ts) * 0.42);
  if (jp.mode === "play") { for (let i = 0; i < 2; i++) jumpStep(dt / 2); if (!jp.open) return; jp.cam += (jp.p.x - view * 0.4 - jp.cam) * Math.min(1, dt * 8); }
  else jp.cam += ((jp.keys.right ? 1 : 0) - (jp.keys.left ? 1 : 0)) * 14 * dt;
  jp.cam = Math.max(0, Math.min(Math.max(0, JC - view), jp.cam));
  const g = cv.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  const sky = g.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, "#8fd6f5"); sky.addColorStop(1, "#d9f3e4");
  g.fillStyle = sky; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "rgba(255,255,255,.7)";
  for (let i = 0; i < 7; i++) { const cx = ((i * 9.7 - jp.cam * 0.3) % (view + 6) + view + 6) % (view + 6) - 3; ell(g, cx * ts, (1 + (i % 3) * 1.4) * ts + jp.oy * 0.3, ts * 1.3, ts * 0.42); }
  g.setTransform(ts, 0, 0, ts, Math.round(-jp.cam * ts), jp.oy);
  const x0 = Math.floor(jp.cam), x1 = Math.min(JC - 1, Math.ceil(jp.cam + view));
  if (jp.mode === "edit") {
    g.strokeStyle = "rgba(74,59,82,.14)"; g.lineWidth = 1 / ts; g.beginPath();
    for (let x = x0; x <= x1 + 1; x++) { g.moveTo(x, 0); g.lineTo(x, JR); }
    for (let y = 0; y <= JR; y++) { g.moveTo(x0, y); g.lineTo(x1 + 1, y); }
    g.stroke();
  }
  for (let y = 0; y < JR; y++) for (let x = x0; x <= x1; x++) {
    const c = jp.grid[y][x];
    if (c === "#") { g.fillStyle = "#b98a55"; rr(g, x, y, 1, 1, 0.12); g.fill(); g.fillStyle = "#7ed07a"; rr(g, x, y, 1, 0.32, 0.12); g.fill(); }
    else if (c === "b") { g.fillStyle = "#9aa0ad"; rr(g, x, y, 1, 1, 0.12); g.fill(); g.fillStyle = "#b7bcc8"; rr(g, x + 0.08, y + 0.08, 0.84, 0.3, 0.08); g.fill(); }
    else if (c === "^") { g.fillStyle = "#e8505b"; g.beginPath(); for (let i = 0; i < 2; i++) { g.moveTo(x + i * 0.5, y + 1); g.lineTo(x + 0.25 + i * 0.5, y + 0.25); g.lineTo(x + 0.5 + i * 0.5, y + 1); } g.fill(); }
    else if (c === "S") { g.fillStyle = "#8a93a8"; g.fillRect(x + 0.2, y + 0.55, 0.6, 0.12); g.fillRect(x + 0.2, y + 0.78, 0.6, 0.12); g.fillStyle = "#ff8fb1"; rr(g, x + 0.08, y + 0.32, 0.84, 0.22, 0.08); g.fill(); }
    else if (c === "*") { if (jp.mode === "edit" || !jp.got[x + "," + y]) drawEmo(g, "⭐", x + 0.5, y + 0.85 + Math.sin(now / 250 + x) * 0.05, 0.7); }
    else if (c === "F") drawEmo(g, "🚩", x + 0.6, y + 1, 1.1);
    else if (c === "P" && jp.mode === "edit") drawEmo(g, "🙂", x + 0.5, y + 0.9, 0.8);
  }
  if (jp.mode === "play") drawPerson(g, jp.p.x, jp.p.y, state.look, jp.p.dir, now / 1000, jp.p.ground && !!jp.p.vx);
  $("jump-info").textContent = jp.mode === "edit" ? "🔧 점프맵 만들기 · 🙂 시작과 🚩 깃발을 꼭 놓아요" : "⏱️ " + jp.t.toFixed(1) + "초 · ⭐ " + jp.stars + "/" + jp.total + (jp.deaths ? " · 다시 " + jp.deaths + "번" : "");
  jp.raf = requestAnimationFrame(jumpFrame);
}
