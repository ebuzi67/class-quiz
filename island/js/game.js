"use strict";
// 몽글몽글 섬: 게임이 움직이는 곳 (걷기, 낚시, 상점, 꾸미기, 그림판, 저장)

const SAVE_KEY = "island-save-v1";
const $ = (id) => document.getElementById(id);
const world = buildMap(), room = buildRoom();
const ZOOM = +new URLSearchParams(location.search).get("zoom") || 16;   // 화면 가로에 보이는 칸 수
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ───────── 저장 ─────────
const HEART = "................" + "................" + "..ee....ee......" + ".effe..effe....." + ".efffeefffe....." + ".effffffffe....." +
  "..effffffe......" + "...effffe......." + "....effe........" + ".....ee........." + "................" + "..........dd.dd." +
  "..........ddddd." + "...........ddd.." + "............d..." + "................";
function newState() {
  return {
    v: 1, started: false, name: "하늘", island: "몽글몽글", coins: 300, x: world.start[0], y: world.start[1], dir: "down",
    look: { skin: SKINS[0], hair: HAIRS[1], style: "long", shirt: SHIRTS[0], design: -1 },
    bag: { daisy: 2, fence: 4 }, trees: {}, obj: {}, floor: {}, shells: {}, shellAt: 0,
    designs: [HEART, null, null, null, null, null, null, null], cur: 0, dex: {},
    stats: { fruit: 0, fish: 0, sold: 0, design: 0, placed: 0, shell: 0, bought: 0, home: 0 }, claimed: {}, mute: false,
    scene: "island", home: { obj: {}, floor: {}, wall: WALLS[0], flr: "wood" }, sky: "auto"
  };
}
function loadState() {
  const base = newState();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1) {
      Object.assign(base, s);
      base.look = Object.assign(newState().look, s.look);
      base.stats = Object.assign(newState().stats, s.stats);
      base.home = Object.assign(newState().home, s.home);
      if (!s.sky && s.realTime === false) base.sky = "day";   // 예전 "항상 낮" 설정 이어받기
    }
  } catch (e) { /* 저장분이 깨졌으면 새로 시작 */ }
  return base;
}
let state = loadState();
let dirty = false;
function save() {
  dirty = false;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 공간이 없으면 넘어가요 */ }
}
function touch() { dirty = true; }
setInterval(() => { if (dirty) save(); }, 3000);
addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

// ───────── 소리 ─────────
let audio = null;
const SOUNDS = {
  pop: [[660, 0, 0.08], [880, 0.07, 0.1]], coin: [[990, 0, 0.07], [1320, 0.07, 0.14]], splash: [[220, 0, 0.12], [160, 0.08, 0.12]],
  nib: [[520, 0, 0.05]], bite: [[880, 0, 0.08], [880, 0.12, 0.08]], fail: [[300, 0, 0.14], [220, 0.13, 0.2]],
  good: [[660, 0, 0.1], [830, 0.1, 0.1], [990, 0.2, 0.1], [1320, 0.3, 0.22]], shake: [[180, 0, 0.05], [240, 0.06, 0.05], [180, 0.12, 0.05]], put: [[440, 0, 0.06]]
};
function sfx(name) {
  if (state.mute) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    for (const [f, at, len] of SOUNDS[name]) {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + at;
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
      o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + len + 0.02);
    }
  } catch (e) { /* 소리가 안 나도 게임은 계속 */ }
}

// ───────── 가방, 알림 ─────────
function bagCount() { return Object.values(state.bag).reduce((a, b) => a + b, 0); }
function addItem(id, n) {
  const room = Math.max(0, BAG_MAX - bagCount()), add = Math.min(room, n == null ? 1 : n);
  if (add > 0) { state.bag[id] = (state.bag[id] || 0) + add; touch(); }
  return add;
}
function takeItem(id) {
  if (!state.bag[id]) return false;
  if (--state.bag[id] <= 0) delete state.bag[id];
  touch();
  return true;
}
function found(id, size) {
  const isNew = !(id in state.dex);
  state.dex[id] = Math.max(state.dex[id] || 0, size || 1);
  return isNew;
}
let toastTimer = 0;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.remove("hide");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.add("hide"), 2600);
}
let cardUntil = 0, cardTimer = 0;
function showCard(html) {
  $("card").innerHTML = html;
  $("card").hidden = false;
  cardUntil = performance.now() + 500;
  clearTimeout(cardTimer);
  cardTimer = setTimeout(hideCard, 3200);
}
function hideCard() { $("card").hidden = true; }
const floaters = [];
function float(text, x, y) { floaters.push({ text, x, y, t: 0 }); }

const MISSIONS = [
  { id: "fruit", e: "🍎", n: "과일 5개 따기", need: 5, r: 300 },
  { id: "shell", e: "🐚", n: "바닷가에서 조개 5개 줍기", need: 5, r: 300 },
  { id: "fish", e: "🎣", n: "물고기 3마리 낚기", need: 3, r: 500 },
  { id: "sold", e: "🛍️", n: "상점에서 물건 5개 팔기", need: 5, r: 300 },
  { id: "design", e: "🎨", n: "그림판에서 내 디자인 그리기", need: 1, r: 500 },
  { id: "placed", e: "🔨", n: "꾸미기로 섬에 10개 놓기", need: 10, r: 500 },
  { id: "home", e: "🏠", n: "우리 집 안에 가구 5개 놓기", need: 5, r: 800 },
  { id: "bought", e: "🎁", n: "상점에서 물건 3개 사기", need: 3, r: 300 },
  { id: "dex", e: "📖", n: "도감 10종 모으기", need: 10, r: 1500 },
  { id: "fish20", e: "🦈", n: "물고기 20마리 낚기", need: 20, r: 2000, stat: "fish" }
];
function missionValue(m) { return m.id === "dex" ? Object.keys(state.dex).length : state.stats[m.stat || m.id]; }
function refreshHud() {
  $("coins").textContent = "💰 " + state.coins.toLocaleString();
  $("island-name").textContent = "🏝️ " + state.island + " 섬 · " + state.name;
  $("env").textContent = ENV.label;
  $("note-dot").hidden = !MISSIONS.some((m) => !state.claimed[m.id] && missionValue(m) >= m.need);
}
function bump(stat, n) {
  state.stats[stat] += n == null ? 1 : n;
  touch();
  refreshHud();
}

// ───────── 화면 크기 ─────────
const canvas = $("game"), ctx = canvas.getContext("2d");
let T = 64, dpr = 1, offX = 0, offY = 0, viewW = 0, viewH = 0;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewW = canvas.width = Math.round(innerWidth * dpr);
  viewH = canvas.height = Math.round(innerHeight * dpr);
  T = Math.round(Math.max(40, Math.min(innerWidth / ZOOM, innerHeight / (ZOOM * 0.6), 110)) * dpr);
  if (ZOOM > 16) T = Math.round(innerWidth / ZOOM * dpr);
}
addEventListener("resize", resize);
resize();

// ───────── 계절과 밤낮 (실제 날짜와 시각을 따라가요) ─────────
function updateEnv() {
  const q = new URLSearchParams(location.search), d = new Date();
  const m = +q.get("month") || d.getMonth() + 1, h = q.has("hour") ? +q.get("hour") : d.getHours() + d.getMinutes() / 60;
  ENV.season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
  let n = h >= 20.5 || h < 5 ? 1 : h >= 18.5 ? (h - 18.5) / 2 : h < 7 ? 1 - (h - 5) / 2 : 0;
  let s = h >= 17 && h < 18.5 ? (h - 17) / 1.5 : h >= 18.5 && h < 20.5 ? 1 - (h - 18.5) / 2 : 0;
  // 하늘 단추로 고른 때: auto(실제 시각), day(낮), sunset(저녁), night(밤)
  if (state.sky === "day") n = s = 0;
  else if (state.sky === "sunset") { n = 0; s = 1; }
  else if (state.sky === "night") { n = 1; s = 0; }
  ENV.night = n; ENV.sunset = s;
  ENV.label = SEASONS[ENV.season] + " · " + (n > 0.5 ? "🌙 밤" : s > 0.3 ? "🌇 저녁" : h < 7 && state.sky === "auto" ? "🌅 새벽" : "☀️ 낮");
  const sk = SKIES[state.sky] || SKIES.auto;
  $("sky-icon").textContent = sk[0]; $("sky-name").textContent = sk[1];
}
const SKIES = { auto: ["🕒", "자동", "🕒 지금 시각을 따라가요."], day: ["☀️", "낮", "☀️ 환한 낮이야!"], sunset: ["🌇", "저녁", "🌇 노을 지는 저녁이야."], night: ["🌙", "밤", "🌙 밤이 됐어. 귀한 물고기가 잘 잡혀!"] };
function nextSky() {
  const order = Object.keys(SKIES);
  state.sky = order[(order.indexOf(state.sky) + 1) % order.length];
  touch(); updateEnv(); refreshHud(); sfx("pop"); toast(SKIES[state.sky][2]);
}

// ───────── 지도 살피기 ─────────
// 지금 있는 곳: 섬 또는 집 안
function A() {
  return state.scene === "home"
    ? { home: true, W: RW, H: RH, at: room.at, statics: room.statics, obj: state.home.obj, floor: state.home.floor, buildings: [], start: room.start }
    : { home: false, W: MW, H: MH, at: world.at, statics: world.statics, obj: state.obj, floor: state.floor, buildings: world.buildings, start: world.start };
}
function enterHome() {
  state.scene = "home"; state.x = room.start[0]; state.y = room.start[1]; state.dir = "up";
  ptr = null; sfx("pop"); touch();
  toast("🏠 우리 집! 🔨 꾸미기로 가구를 놓고 벽지와 바닥도 바꿔 봐.");
}
function leaveHome() {
  state.scene = "island"; state.x = 14.5; state.y = 13.4; state.dir = "down";
  ptr = null; sfx("pop"); touch();
}
function isWater(t) { return t === T_SEA || t === T_SHALLOW || t === T_WATER; }
function solid(tx, ty) {
  const a = A();
  if (tx < 0 || ty < 0 || tx >= a.W || ty >= a.H) return true;
  const t = a.at(tx, ty);
  if (isWater(t) || t === T_VOID || t === T_WALL) return true;
  const k = tx + "," + ty;
  if (a.statics.has(k)) return true;
  const o = a.obj[k];
  return !!(o && ITEMS[o.id] && ITEMS[o.id].block);
}
function boxSolid(x, y) {
  return solid(Math.floor(x - 0.26), Math.floor(y - 0.2)) || solid(Math.floor(x + 0.26), Math.floor(y - 0.2)) ||
    solid(Math.floor(x - 0.26), Math.floor(y + 0.12)) || solid(Math.floor(x + 0.26), Math.floor(y + 0.12));
}
function facing() {
  const [dx, dy] = DIRS[state.dir];
  return [Math.floor(state.x + dx * 0.8), Math.floor(state.y - 0.04 + dy * 0.8)];
}
function treeReady(k) { return (state.trees[k] || 0) <= Date.now(); }

function spawnShells() {
  const now = Date.now();
  if (!state.shellAt) { state.shellAt = now - SHELL_MS * 5; }
  if (state.shellAt < now - SHELL_MS * SHELL_MAX) state.shellAt = now - SHELL_MS * SHELL_MAX;
  while (state.shellAt <= now) {
    state.shellAt += SHELL_MS;
    if (Object.keys(state.shells).length >= SHELL_MAX) continue;
    for (let tries = 0; tries < 20; tries++) {
      const [x, y] = world.sand[Math.floor(Math.random() * world.sand.length)], k = x + "," + y;
      if (state.shells[k] || state.obj[k] || state.floor[k] != null) continue;
      state.shells[k] = Math.random() < 0.25 ? "star" : "shell";
      touch();
      break;
    }
  }
}

// ───────── 행동 ─────────
const shakes = {};
function shake(k, st) {
  shakes[k] = 0.45;
  sfx("shake");
  if (st.t === "pine") { toast("바스락바스락… 🌲 솔잎 냄새가 좋아!"); return; }
  if (!treeReady(k)) {
    const min = Math.ceil((state.trees[k] - Date.now()) / 60000);
    toast("아직 열매가 없어. " + min + "분쯤 뒤에 다시 열려!");
    return;
  }
  const n = st.t === "palm" ? 2 : 3, got = addItem(st.fruit, n);
  if (!got) { toast("가방이 꽉 찼어! 상점에서 팔고 오자 🎒"); return; }
  state.trees[k] = Date.now() + REGROW_MS;
  const it = ITEMS[st.fruit], [tx, ty] = k.split(",").map(Number);
  const isNew = found(st.fruit);
  for (let i = 0; i < got; i++) setTimeout(() => { float(it.e, tx + 0.2 + i * 0.3, ty); sfx("pop"); }, i * 130);
  toast(it.e + " " + it.n + " " + got + "개를 땄어!" + (isNew ? " (도감에 새로 등록 ✨)" : ""));
  bump("fruit", got);
}

function pickObj(k) {
  const store = A().obj, o = store[k];
  if (!addItem(o.id)) { toast("가방이 꽉 찼어! 🎒"); return; }
  delete store[k];
  sfx("pop");
  toast(ITEMS[o.id].e + " " + ITEMS[o.id].n + "을(를) 가방에 넣었어.");
}

let fishing = null;
function pickFish(where) {
  const pool = Object.keys(ITEMS).filter((id) => ITEMS[id].where === where);
  // 밤에는 귀한 물고기가 두 배로 잘 나와요
  const w = (id) => ITEMS[id].w * (ENV.night > 0.5 && ITEMS[id].w <= 12 ? 2 : 1);
  let r = Math.random() * pool.reduce((s, id) => s + w(id), 0);
  for (const id of pool) { r -= w(id); if (r <= 0) return id; }
  return pool[0];
}
function cast(tt) {
  if (bagCount() >= BAG_MAX) { toast("가방이 꽉 찼어! 상점에서 팔고 오자 🎒"); return; }
  const [dx, dy] = DIRS[state.dir];
  const far = isWater(world.at(Math.floor(state.x + dx * 1.9), Math.floor(state.y + dy * 1.9))) ? 1.9 : 1.15;
  fishing = {
    phase: "wait", t: 0, bt: 0, x: state.x + dx * far, y: state.y + dy * far - 0.1, id: pickFish(tt === T_WATER ? "fresh" : "sea"),
    biteAt: 1.8 + Math.random() * 4, nibs: [], dip: 0
  };
  const nibs = Math.floor(Math.random() * 3);
  for (let i = 0; i < nibs; i++) fishing.nibs.push(0.7 + Math.random() * (fishing.biteAt - 1.3));
  sfx("splash");
  toast("찌가 쑥! 들어가면 얼른 당겨요 🎣");
}
function endFishing(msg) {
  fishing = null;
  if (msg) { toast(msg); sfx("fail"); }
}
function hook() {
  if (fishing.phase === "wait") {
    if (fishing.t < 0.45) return;
    endFishing("앗, 너무 빨리 당겼어! 찌가 쑥 들어갈 때까지 기다려 봐.");
    return;
  }
  const id = fishing.id, it = ITEMS[id];
  fishing = null;
  addItem(id);
  sfx("good");
  if (it.k === "trash") {
    showCard('<div class="big">' + it.e + "</div><b>" + it.n + '…?</b><span>누가 버린 걸까? 그래도 ' + it.sell + "코인에 팔 수 있어.</span>");
    return;
  }
  const size = Math.round(it.size[0] + Math.pow(Math.random(), 1.6) * (it.size[1] - it.size[0]));
  const best = (state.dex[id] || 0) < size, isNew = found(id, size);
  showCard('<div class="big">' + it.e + "</div><b>" + it.n + "를 낚았다!</b><span>" + size + "cm · 💰 " + it.sell.toLocaleString() + "</span>" +
    (isNew ? '<i class="new">✨ 도감에 새로 등록!</i>' : best ? '<i class="new">🏆 내 최고 기록!</i>' : ""));
  bump("fish");
}

function context() {
  if (fishing) return fishing.phase === "bite" ? { label: "❗ 당겨!", hot: true, fn: hook } : { label: "🎣 기다려…", fn: hook };
  const a = A(), [fx, fy] = facing(), k = fx + "," + fy, st = a.statics.get(k);
  if (st) {
    if (st.t === "wardrobe") return { label: "👗 옷장", fn: openLook };
    if (st.t === "bld" || st.t === "npc") return st.b === "home" ? { label: "🏠 들어가기", fn: enterHome } : { label: "🛍️ 상점", fn: () => openShop("sell") };
    if (st.t === "rock") return null;
    return { label: "🌳 흔들기", fn: () => shake(k, st) };
  }
  if (a.obj[k]) return { label: "✋ 줍기", fn: () => pickObj(k) };
  const tt = a.at(fx, fy);
  if (isWater(tt)) return { label: "🎣 낚시", fn: () => cast(tt) };
  return null;
}
let actLabel = "";
function doAction() {
  if (!$("card").hidden) { if (performance.now() > cardUntil) hideCard(); return; }
  if (modalOpen() || build) return;
  const c = context();
  if (c) c.fn();
}

// ───────── 입력 ─────────
const keys = {};
let ptr = null;
function modalOpen() { return !$("modal").hidden || !$("intro").hidden; }
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Escape") { if (!$("modal").hidden) closeModal(); else if (build) endBuild(); return; }
  if ((e.code === "Space" || e.code === "Enter") && !e.repeat) { e.preventDefault(); doAction(); return; }
  if (e.code.startsWith("Arrow")) e.preventDefault();
  keys[e.code] = true;
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; ptr = null; });
function toWorld(e) { return [(e.clientX * dpr - offX) / T, (e.clientY * dpr - offY) / T]; }
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!$("card").hidden) { if (performance.now() > cardUntil) hideCard(); return; }
  if (fishing) { hook(); return; }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 못 잡아도 괜찮아요 */ }
  ptr = { e, last: "" };
  if (build) buildAt(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (build) { const [wx, wy] = toWorld(e); build.hover = [Math.floor(wx), Math.floor(wy)]; }
  if (!ptr) return;
  ptr.e = e;
  if (build) buildAt(e);
});
const ptrEnd = () => { ptr = null; };
canvas.addEventListener("pointerup", ptrEnd);
canvas.addEventListener("pointercancel", ptrEnd);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
$("act").addEventListener("pointerdown", (e) => { e.preventDefault(); doAction(); });

// ───────── 꾸미기 모드 ─────────
let build = null;
function startBuild(sel) {
  closeModal();
  if (fishing) fishing = null;
  build = { sel: sel || "erase", hover: null };
  $("buildbar").hidden = $("build-tip").hidden = false;
  $("act").hidden = true;
  $("toast").classList.add("hide");
  drawBuildBar();
}
function endBuild() {
  build = null;
  $("buildbar").hidden = $("build-tip").hidden = true;
  $("act").hidden = false;
  save();
}
function drawBuildBar() {
  const box = $("build-items");
  let html = A().home ? '<button class="slot txt" data-room="wall">🎨<small>벽지</small></button><button class="slot txt" data-room="flr">🧹<small>바닥</small></button>' : "";
  html += '<button class="slot' + (build.sel === "erase" ? " on" : "") + '" data-sel="erase" title="도로 줍기">🧽</button>';
  state.designs.forEach((d, i) => {
    if (d) html += '<button class="slot' + (build.sel === "d" + i ? " on" : "") + '" data-sel="d' + i + '"><img src="' + designCv[i].toDataURL() + '" alt="내 디자인"></button>';
  });
  for (const id in state.bag) {
    const it = ITEMS[id];
    if (it.k !== "decor" && it.k !== "floor") continue;
    html += '<button class="slot' + (build.sel === id ? " on" : "") + '" data-sel="' + id + '" title="' + it.n + '">' + it.e + '<i class="cnt">' + state.bag[id] + "</i></button>";
  }
  box.innerHTML = html;
}
$("build-items").addEventListener("click", (e) => {
  const r = e.target.closest("[data-room]");
  if (r) { openRoomStyle(r.dataset.room); return; }
  const b = e.target.closest("[data-sel]");
  if (!b) return;
  build.sel = b.dataset.sel;
  drawBuildBar();
  const it = ITEMS[build.sel];
  $("build-tip").textContent = build.sel === "erase" ? "🧽 놓은 것을 누르면 도로 가방에 넣어요" : build.sel[0] === "d" && !it ? "🎨 내 디자인 바닥은 마음껏 깔 수 있어요" : it.e + " " + it.n + " 놓기 · 땅을 눌러요";
});
$("build-done").addEventListener("click", endBuild);
function buildAt(e) {
  const [wx, wy] = toWorld(e), tx = Math.floor(wx), ty = Math.floor(wy), k = tx + "," + ty;
  if (ptr.last === k) return;
  ptr.last = k;
  const a = A(), tt = a.at(tx, ty);
  if (a.home ? tt !== T_ROOM : (tt !== T_SAND && tt !== T_GRASS && tt !== T_PATH)) return;
  if (a.statics.has(k)) return;
  const sel = build.sel, it = ITEMS[sel];
  // 바닥에 깐 것: 숫자는 내 디자인, 글자는 물건 이름 ("s"는 예전 저장분의 디딤돌)
  const liftFloor = () => { const f = a.floor[k]; if (typeof f === "string") addItem(f === "s" ? "stone" : f); delete a.floor[k]; };
  if (sel === "erase") {
    if (a.obj[k]) { if (!addItem(a.obj[k].id)) { toast("가방이 꽉 찼어! 🎒"); return; } delete a.obj[k]; }
    else if (a.floor[k] != null) liftFloor();
    else return;
    sfx("pop");
  } else if (!it) {
    const d = +sel.slice(1);
    if (a.floor[k] === d) return;
    liftFloor();
    a.floor[k] = d;
    if (!a.home) delete state.shells[k];
    sfx("put"); bump("placed");
  } else {
    if (!state.bag[sel]) return;
    if (it.k === "floor") {
      if (a.floor[k] === sel || (sel === "stone" && a.floor[k] === "s")) return;
      liftFloor();
      takeItem(sel);
      a.floor[k] = sel;
    } else {
      if (a.obj[k]) return;
      if (it.block && Math.floor(state.x) === tx && Math.floor(state.y) === ty) { toast("내가 서 있는 자리에는 놓을 수 없어!"); return; }
      takeItem(sel);
      a.obj[k] = sel === "easel" ? { id: sel, d: state.cur } : { id: sel };
    }
    if (a.home) bump("home"); else delete state.shells[k];
    sfx("put"); bump("placed");
    if (!state.bag[sel]) build.sel = "erase";
  }
  touch();
  drawBuildBar();
}

// ───────── 움직이기 ─────────
let time = 0, moving = false;
function update(dt) {
  time += dt;
  for (const k in shakes) if ((shakes[k] -= dt) <= 0) delete shakes[k];
  for (let i = floaters.length - 1; i >= 0; i--) if ((floaters[i].t += dt) > 1) floaters.splice(i, 1);
  moving = false;
  if (modalOpen()) return;

  let vx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  let vy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  if (!vx && !vy && ptr && !build) {
    const [wx, wy] = toWorld(ptr.e), dx = wx - state.x, dy = wy - (state.y - 0.3);
    if (Math.hypot(dx, dy) > 0.3) { vx = dx; vy = dy; }
  }
  if (fishing) {
    if (vx || vy) { if (fishing.t > 0.5) fishing = null; return; }
    const f = fishing;
    f.t += dt;
    f.dip = Math.max(0, f.dip - dt * 3);
    if (f.phase === "wait") {
      if (f.nibs.length && f.t >= Math.min(...f.nibs)) { f.nibs.splice(f.nibs.indexOf(Math.min(...f.nibs)), 1); f.dip = 0.6; sfx("nib"); }
      if (f.t >= f.biteAt) { f.phase = "bite"; sfx("bite"); if (navigator.vibrate) navigator.vibrate(80); }
    } else if ((f.bt += dt) > ITEMS[f.id].win) {
      endFishing("아쉬워, 놓쳤다… 물고기가 도망갔어.");
    }
    return;
  }
  if (vx || vy) {
    const len = Math.hypot(vx, vy), sp = 4.2 * dt;
    vx = vx / len * sp; vy = vy / len * sp;
    state.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    const ox = state.x, oy = state.y;
    if (!boxSolid(state.x + vx, state.y)) state.x += vx;
    if (!boxSolid(state.x, state.y + vy)) state.y += vy;
    moving = ox !== state.x || oy !== state.y;
    if (moving && state.scene === "home") {
      touch();
      if (room.at(Math.floor(state.x), Math.floor(state.y)) === T_EXIT && state.y > 8.25 && !build) leaveHome();
    } else if (moving) {
      touch();
      const k = Math.floor(state.x) + "," + Math.floor(state.y), sh = state.shells[k];
      if (sh && addItem(sh)) {
        delete state.shells[k];
        const isNew = found(sh);
        float(ITEMS[sh].e, state.x - 0.2, state.y - 1); sfx("pop");
        toast(ITEMS[sh].e + " " + ITEMS[sh].n + "을(를) 주웠어!" + (isNew ? " (도감에 새로 등록 ✨)" : ""));
        bump("shell");
      }
    }
  }
}

// ───────── 그리기 ─────────
function render() {
  const g = ctx, a = A(), vw = viewW / T, vh = viewH / T;
  let cx = state.x, cy = state.y - 0.5;
  cx = vw >= a.W ? a.W / 2 : Math.max(vw / 2, Math.min(a.W - vw / 2, cx));
  cy = vh >= a.H ? a.H / 2 : Math.max(vh / 2, Math.min(a.H - vh / 2, cy));
  offX = Math.round(viewW / 2 - cx * T); offY = Math.round(viewH / 2 - cy * T);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = a.home ? "#3a2f45" : "#49a6e0"; g.fillRect(0, 0, viewW, viewH);
  g.setTransform(T, 0, 0, T, offX, offY);
  g.imageSmoothingEnabled = false;
  const x0 = Math.max(0, Math.floor(cx - vw / 2)), x1 = Math.min(a.W - 1, Math.ceil(cx + vw / 2));
  const y0 = Math.max(0, Math.floor(cy - vh / 2)), y1 = Math.min(a.H - 1, Math.ceil(cy + vh / 2) + 2);
  const things = [], lights = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (a.home) drawRoomTile(g, state.home, a.at(x, y), x, y); else drawTile(g, world, x, y, time);
    const k = x + "," + y;
    if (a.floor[k] != null) drawFloor(g, a.floor[k], x, y);
    const st = a.statics.get(k);
    if (st && st.t !== "bld") things.push({ y: y + 0.9, st, x, ty: y, k });
    const o = a.obj[k];
    if (o && ITEMS[o.id]) {
      things.push({ y: y + (ITEMS[o.id].block ? 0.9 : 0.3), o, x, ty: y });
      if (ITEMS[o.id].glow) lights.push([x, y]);
    }
    if (!a.home && state.shells[k]) things.push({ y: y + 0.2, sh: state.shells[k], x, ty: y });
  }
  g.imageSmoothingEnabled = true;
  if (a.home) drawRoomWindow(g, 7, 0.3);
  for (const b of a.buildings) things.push({ y: b.y + 1.95, b });
  things.push({ y: state.y, me: true });
  things.sort((p, q) => p.y - q.y);
  const objAt = (x, y) => { const o = a.obj[x + "," + y]; return o && o.id; };
  for (const th of things) {
    if (th.me) {
      drawPerson(g, state.x, state.y, state.look, state.dir, time, moving);
      if (fishing) drawFishing(g);
    } else if (th.b) drawBuilding(g, th.b.b, th.b.x, th.b.y);
    else if (th.sh) drawEmo(g, ITEMS[th.sh].e, th.x + 0.5, th.ty + 0.78, 0.5);
    else if (th.o) {
      if (th.o.id === "easel") g.imageSmoothingEnabled = false;
      drawObj(g, th.o, th.x, th.ty, objAt);
      g.imageSmoothingEnabled = true;
    } else if (th.st.t === "npc") drawNpc(g, th.x, th.ty, time);
    else if (th.st.t === "rock") drawRock(g, th.x, th.ty);
    else if (th.st.t === "wardrobe") drawWardrobe(g, th.x, th.ty);
    else drawTree(g, th.st, th.x, th.ty, th.st.fruit && treeReady(th.k), shakes[th.k] || 0);
  }
  for (const f of floaters) {
    g.globalAlpha = 1 - f.t * f.t;
    drawEmo(g, f.text, f.x + 0.5, f.y + 0.6 - f.t * 0.9, 0.5);
  }
  g.globalAlpha = 1;
  if (!a.home) drawSky(g, lights);
  else if (ENV.night > 0.2) { g.globalCompositeOperation = "lighter"; for (const [x, y] of lights) drawGlow(g, x + 0.5, y + 0.3, 1.1, ENV.night * 0.5); g.globalCompositeOperation = "source-over"; }
  if (build) {
    g.strokeStyle = a.home ? "rgba(74,59,82,.2)" : "rgba(255,255,255,.35)"; g.lineWidth = 1 / T;
    g.beginPath();
    for (let x = x0; x <= x1 + 1; x++) { g.moveTo(x, y0); g.lineTo(x, y1 + 1); }
    for (let y = y0; y <= y1 + 1; y++) { g.moveTo(x0, y); g.lineTo(x1 + 1, y); }
    g.stroke();
    if (build.hover) { g.strokeStyle = "#ff5f7a"; g.lineWidth = 0.07; g.strokeRect(build.hover[0] + 0.04, build.hover[1] + 0.04, 0.92, 0.92); }
  }
  const c = build ? null : context(), label = c ? c.label : "…";
  if (label !== actLabel) {
    actLabel = label;
    $("act").textContent = label;
    $("act").className = c ? (c.hot ? "hot" : "") : "off";
  }
}
// 섬 위의 하늘빛: 저녁노을, 밤, 불빛, 반딧불이, 계절에 따라 날리는 꽃잎·낙엽·눈
function drawSky(g, lights) {
  const n = ENV.night, s = ENV.sunset, se = ENV.season;
  if (n > 0 || s > 0) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (s > 0) { g.fillStyle = "rgba(255,140,60," + 0.2 * s + ")"; g.fillRect(0, 0, viewW, viewH); }
    if (n > 0) { g.fillStyle = "rgba(20,30,90," + 0.42 * n + ")"; g.fillRect(0, 0, viewW, viewH); }
    g.setTransform(T, 0, 0, T, offX, offY);
    if (n > 0.2) {
      for (const b of world.buildings) drawBuildingLights(g, b.x, b.y, n);
      g.globalCompositeOperation = "lighter";
      for (const [x, y] of lights) drawGlow(g, x + 0.5, y + 0.1, 1.6, n);
      g.globalCompositeOperation = "source-over";
      if (se !== "winter") for (let i = 0; i < 12; i++) {
        g.fillStyle = "rgba(255,245,150," + (0.5 + 0.5 * Math.sin(time * 3 + i * 1.9)) * n + ")";
        ell(g, state.x + Math.sin(time * 0.23 + i * 2.1) * 6 + Math.cos(i * 5.3) * 3, state.y - 1 + Math.cos(time * 0.19 + i * 1.7) * 4, 0.05, 0.05);
      }
    }
  }
  if (se === "summer") return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const count = se === "winter" ? 34 : 14;
  for (let i = 0; i < count; i++) {
    const px = (((i * 197.3 + time * (se === "winter" ? 10 : 22) + Math.sin(time * 0.8 + i) * 26) * dpr) % viewW + viewW) % viewW;
    const py = ((i * 131.7 + time * (28 + (i % 5) * 9)) * dpr) % viewH;
    if (se === "winter") { g.fillStyle = "rgba(255,255,255,.9)"; ell(g, px, py, (2 + i % 3) * dpr, (2 + i % 3) * dpr); }
    else {
      g.fillStyle = se === "spring" ? "#ffc1d6" : AUTUMN[i % 3][0];
      g.beginPath(); g.ellipse(px, py, 6 * dpr, 3.5 * dpr, time * 1.5 + i, 0, Math.PI * 2); g.fill();
    }
  }
}
function drawFishing(g) {
  const f = fishing, [dx] = DIRS[state.dir];
  const sink = f.phase === "bite" ? 0.16 : f.dip * 0.08, bx = f.x, by = f.y + sink + Math.sin(time * 3) * 0.02;
  const hx = state.x + (dx || 0.2) * 0.3, hy = state.y - 0.45, tipX = state.x + (f.x - state.x) * 0.35, tipY = state.y - 1.15;
  g.strokeStyle = "#8a5a35"; g.lineWidth = 0.06; g.lineCap = "round";
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(tipX, tipY); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 0.025;
  g.beginPath(); g.moveTo(tipX, tipY); g.quadraticCurveTo((tipX + bx) / 2, Math.min(tipY, by) + 0.5, bx, by); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 0.03;
  const ring = f.phase === "bite" ? 0.3 + (f.bt * 2 % 0.3) : 0.2 + f.dip * 0.2;
  g.beginPath(); g.ellipse(f.x, f.y + 0.06, ring, ring * 0.4, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#fff"; ell(g, bx, by, 0.09, 0.09);
  g.fillStyle = "#ff5f7a"; g.beginPath(); g.arc(bx, by, 0.09, Math.PI, Math.PI * 2); g.fill();
  if (f.phase === "bite") drawEmo(g, "❗", state.x, state.y - 1.15, 0.6);
}

// ───────── 창 열기 ─────────
let modalKind = "", onClose = null;
function openModal(kind, title, html) {
  modalKind = kind;
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = html;
  $("modal").hidden = false;
  ptr = null;
  for (const k in keys) keys[k] = false;
}
function closeModal() {
  if ($("modal").hidden) return;
  $("modal").hidden = true;
  if (onClose) { const fn = onClose; onClose = null; fn(); }
  save();
}
$("modal-close").addEventListener("click", closeModal);
$("modal").addEventListener("pointerdown", (e) => { if (e.target === $("modal")) closeModal(); });
$("hud-right").addEventListener("click", (e) => {
  const b = e.target.closest("[data-open]");
  if (!b || !$("intro").hidden) return;
  if (b.dataset.open === "sky") { nextSky(); return; }
  if (build) endBuild();
  ({ bag: openBag, build: () => startBuild(), studio: openStudio, dex: openDex, note: openNote, set: openSet })[b.dataset.open]();
});
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

function openBag() {
  let html = '<p class="note">가방 ' + bagCount() + " / " + BAG_MAX + "칸 · 꽃이나 가구를 누르면 바로 섬에 놓으러 가요.</p><div class=\"grid\">";
  const ids = Object.keys(state.bag);
  for (const id of ids) {
    const it = ITEMS[id], can = it.k === "decor" || it.k === "floor";
    html += "<" + (can ? 'button data-put="' + id + '"' : "div") + ' class="cell"><span class="em">' + it.e + "</span>" + it.n + '<i class="cnt">' + state.bag[id] +
      "</i><small>" + (can ? "🔨 놓기" : "💰 " + sellPrice(id)) + "</small></" + (can ? "button" : "div") + ">";
  }
  if (!ids.length) html += '<div class="cell none"><span class="em">🍃</span>텅 비었어</div>';
  openModal("bag", "🎒 가방", html + "</div>");
}

let shopTab = "sell";
function openShop(tab) {
  shopTab = tab;
  const tabs = [["sell", "팔기"], ["out", "🌷 바깥 꾸미기"], ["in", "🛋️ 가구"], ["season", SEASONS[ENV.season] + " 한정"]];
  let html = '<div class="tabs">' + tabs.map(([t, n]) => '<button class="btn' + (tab === t ? " on" : "") + '" data-tab="' + t + '">' + n + "</button>").join("") +
    '<span class="pill" style="margin-left:auto">💰 ' + state.coins.toLocaleString() + "</span></div>";
  if (tab === "sell") {
    const ids = Object.keys(state.bag), loot = ids.filter((id) => ITEMS[id].sell != null);
    const total = loot.reduce((s, id) => s + ITEMS[id].sell * state.bag[id], 0);
    html += '<p class="note">🐱 모카: "어서 와! 뭐든 좋은 값에 살게냥~" (누르면 1개씩 팔아요)</p>';
    if (total) html += '<p><button class="btn pink" data-sellall="1">잡은 것·딴 것 모두 팔기 → 💰 ' + total.toLocaleString() + "</button></p>";
    html += '<div class="grid">';
    for (const id of ids) html += '<button class="cell" data-sell="' + id + '"><span class="em">' + ITEMS[id].e + "</span>" + ITEMS[id].n + '<i class="cnt">' + state.bag[id] + "</i><small>💰 " + sellPrice(id).toLocaleString() + "</small></button>";
    if (!ids.length) html += '<div class="cell none"><span class="em">🍃</span>팔 물건이 없어</div>';
    html += "</div>";
  } else {
    html += '<p class="note">🐱 모카: "' + (tab === "in" ? "가구는 보라 지붕 집 안에 놓아 보라냥!" : tab === "season" ? "이 계절에만 파는 물건이다냥. 계절이 바뀌면 다른 걸 가져올게냥!" : "섬을 예쁘게 꾸며 보라냥!") +
      '" (산 물건은 🔨 꾸미기로 놓아요)</p><div class="grid">';
    for (const id of shopList(tab, ENV.season)) {
      const it = ITEMS[id];
      html += '<button class="cell' + (state.coins < it.buy ? " dim" : "") + '" data-buy="' + id + '"><span class="em">' + it.e + "</span>" + it.n +
        (state.bag[id] ? '<i class="cnt">' + state.bag[id] + "</i>" : "") + "<small>💰 " + it.buy.toLocaleString() + "</small></button>";
    }
    html += "</div>";
  }
  const top = $("modal-body").scrollTop, same = modalKind === "shop" && !$("modal").hidden;
  openModal("shop", "🛍️ 모카 상점", html);
  if (same) $("modal-body").scrollTop = top;
}

// 방 벽지·바닥 고르기
function openRoomStyle(kind) {
  const cur = state.home[kind], wall = kind === "wall";
  let html = '<p class="note">' + (wall ? "벽지" : "바닥") + '를 골라요. 🎨 그림판에서 그린 내 디자인도 쓸 수 있어요!</p><div class="field">';
  if (wall) html += WALLS.map((c) => '<button class="sw big' + (cur === c ? " on" : "") + '" data-roomset="wall" data-v="' + c + '" style="background:' + c + '"></button>').join("");
  else html += Object.keys(FLOORS).map((f) => '<button class="sw big' + (cur === f ? " on" : "") + '" data-roomset="flr" data-v="' + f + '" style="background:' + FLOORS[f][0] + '"></button>').join("");
  html += '</div><div class="field"><span>내 디자인</span>' + state.designs.map((d, i) => d ? '<button class="sw big thumb' + (cur === i ? " on" : "") + '" data-roomset="' + kind +
    '" data-dv="' + i + '" style="background-image:url(' + designCv[i].toDataURL() + ')"></button>' : "").join("") + "</div>";
  openModal("room", wall ? "🎨 벽지 고르기" : "🧹 바닥 고르기", html);
}

function openDex() {
  let html = '<p class="note">찾은 것 ' + Object.keys(state.dex).length + " / " + DEX_TOTAL + "종</p>";
  for (const grp of DEX_GROUPS) {
    html += "<h3>" + grp.n + '</h3><div class="grid">';
    for (const id of grp.ids) {
      const it = ITEMS[id];
      html += id in state.dex
        ? '<div class="cell"><span class="em">' + it.e + "</span>" + it.n + "<small>" + (it.k === "fish" ? "최고 " + state.dex[id] + "cm" : "💰 " + it.sell) + "</small></div>"
        : '<div class="cell none"><span class="em">❓</span>???</div>';
    }
    html += "</div>";
  }
  openModal("dex", "📖 도감", html);
}

function openNote() {
  let html = '<p class="note">할 일을 해내면 모카가 선물을 줘요!</p>';
  for (const m of MISSIONS) {
    const v = Math.min(m.need, missionValue(m)), done = v >= m.need;
    html += '<div class="mission"><span class="em">' + m.e + '</span><div class="mid">' + m.n + " (" + v + "/" + m.need + ')<div class="bar"><i style="width:' + (v / m.need * 100) + '%"></i></div></div>' +
      (state.claimed[m.id] ? "<span>✅ 완료</span>" : '<button class="btn small' + (done ? " pink" : "") + '" data-claim="' + m.id + '"' + (done ? "" : " disabled") + ">💰 " + m.r + " 받기</button>") + "</div>";
  }
  openModal("note", "📝 섬 수첩", html);
}

function openSet() {
  openModal("set", "⚙️ 설정", '<div class="field"><button class="btn" data-mute="1">' + (state.mute ? "🔇 소리 꺼짐" : "🔊 소리 켜짐") + "</button> " +
    '<button class="btn" data-rt="1">하늘: ' + SKIES[state.sky][0] + " " + SKIES[state.sky][1] + "</button></div>" +
    '<div class="how">🚶 <b>걷기</b>: 가고 싶은 곳을 꾹 누르기 (키보드는 방향키나 WASD)<br>✨ <b>행동</b>: 오른쪽 아래 노란 단추 (키보드는 스페이스)<br>' +
    "🎣 <b>낚시</b>: 물가를 보고 행동 → 찌가 쑥 들어가고 ❗가 뜨면 얼른 한 번 더!<br>🌳 과일은 " + (REGROW_MS / 60000) + "분마다 다시 열려요.<br>" +
    "🔨 <b>꾸미기</b>: 아래에서 물건을 고르고 땅을 눌러요. 🧽는 도로 줍기.<br>🏠 보라 지붕 집에 들어가면 가구를 놓고 벽지·바닥을 바꿀 수 있어요. 옷장도 집 안에 있어요.<br>🌙 위쪽 하늘 단추를 누르면 낮 → 저녁 → 밤 → 자동(실제 시각)으로 바뀌어요. 밤에는 귀한 물고기가 더 잘 잡혀요.<br>🍁 계절마다 풍경과 상점의 한정 물건이 바뀌어요.<br>💾 놀던 내용은 이 기기에 저절로 저장돼요.</div>" +
    (isStandalone() ? "" : '<div class="field"><button class="btn go" data-install="1">📲 몽글몽글 섬을 앱으로 설치하기</button></div>') +
    '<div class="field"><button class="btn small" data-reset="1">🗑️ 섬을 처음부터 다시 시작</button></div>');
}

$("modal-body").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || modalKind === "studio" || modalKind === "look") return;
  const d = b.dataset;
  if (d.put) startBuild(d.put);
  else if (d.tab) openShop(d.tab);
  else if (d.sell) {
    takeItem(d.sell); state.coins += sellPrice(d.sell); sfx("coin"); bump("sold"); openShop("sell");
  } else if (d.sellall) {
    let n = 0;
    for (const id of Object.keys(state.bag)) if (ITEMS[id].sell != null) { n += state.bag[id]; state.coins += ITEMS[id].sell * state.bag[id]; delete state.bag[id]; }
    sfx("good"); bump("sold", n); openShop("sell");
  } else if (d.buy) {
    const it = ITEMS[d.buy];
    if (state.coins < it.buy) { toast("코인이 모자라! 낚시랑 과일로 모아 보자 💰"); return; }
    if (!addItem(d.buy)) { toast("가방이 꽉 찼어! 🎒"); return; }
    state.coins -= it.buy; sfx("coin"); bump("bought"); openShop(shopTab);
  } else if (d.roomset) {
    state.home[d.roomset] = d.dv != null ? +d.dv : d.v; touch(); sfx("put"); openRoomStyle(d.roomset);
  } else if (d.rt) {
    nextSky(); openSet();
  } else if (d.claim) {
    const m = MISSIONS.find((x) => x.id === d.claim);
    state.claimed[m.id] = 1; state.coins += m.r; sfx("good"); touch(); refreshHud(); openNote();
  } else if (d.mute) { state.mute = !state.mute; touch(); sfx("pop"); openSet(); }
  else if (d.install) installApp();
  else if (d.reset) {
    if (confirm("정말 처음부터 다시 시작할까요?\n모은 물건과 꾸민 섬이 모두 사라져요.")) { localStorage.removeItem(SAVE_KEY); dirty = false; removeEventListener("pagehide", save); state = newState(); location.reload(); }
  }
});

// ───────── 앱으로 설치하기 ─────────
// 크롬이 설치 창을 줄 수 있으면 바로 띄우고, 아니면 설치 순서를 알려 줘요.
let installEv = null;
function isStandalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEv = e; });
addEventListener("appinstalled", () => { installEv = null; $("intro-install").hidden = true; toast("📲 앱으로 설치했어요! 홈 화면에서 열어요."); });
async function installApp() {
  if (installEv) { const e = installEv; installEv = null; e.prompt(); try { await e.userChoice; } catch (err) { /* 취소해도 괜찮아요 */ } return; }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  openModal("install", "📲 앱으로 설치하기", '<div class="how">' + (ios
    ? "1. <b>사파리</b>에서 이 페이지를 열어요.<br>2. 위쪽의 <b>공유 단추</b>(□↑)를 눌러요.<br>3. <b>홈 화면에 추가</b>를 누르고 <b>추가</b>를 눌러요."
    : "1. 크롬 오른쪽 위 <b>⋮</b> 메뉴(노트북은 주소창 오른쪽 설치 그림)를 눌러요.<br>2. <b>앱 설치</b>(또는 <b>홈 화면에 추가</b>)를 눌러요.<br>3. 메뉴에 없으면 이미 설치되어 있을 수 있어요. 홈 화면에서 아이콘을 찾아보세요.") + "</div>");
}

// ───────── 그림판 ─────────
function openStudio() {
  let slot = state.cur, tool = "pen", color = 3, px = [], undo = [], down = false;
  const decode = (code) => { px = []; for (let i = 0; i < 256; i++) px.push(code ? code.charCodeAt(i) - 97 : -1); };
  const encode = () => px.some((c) => c >= 0) ? px.map((c) => c >= 0 ? String.fromCharCode(97 + c) : ".").join("") : null;
  let html = '<div class="two"><div><div id="st-slots"></div><canvas id="st-cv" width="480" height="480"></canvas></div><div class="side">' +
    '<div class="tabs"><button class="btn small" data-tool="pen">✏️ 연필</button><button class="btn small" data-tool="fill">🪣 채우기</button><button class="btn small" data-tool="erase">🧽 지우개</button></div>' +
    '<div id="st-pal"></div><div class="tabs"><button class="btn small" data-do="undo">↩️ 되돌리기</button><button class="btn small" data-do="clear">🗑️ 모두 지우기</button></div>' +
    '<div class="tabs"><button class="btn pink" data-do="wear">👕 옷으로 입기</button><button class="btn go" data-do="floor">🔨 바닥에 깔기</button></div>' +
    '<p class="note">그린 그림은 옷, 바닥, 이젤(상점)에 쓸 수 있어요. 8장까지 저장돼요.</p></div></div>';
  openModal("studio", "🎨 그림판", html);
  const cv = $("st-cv"), g = cv.getContext("2d");
  const paint = () => {
    for (let i = 0; i < 256; i++) {
      const x = i % 16, y = i >> 4;
      g.fillStyle = px[i] >= 0 ? PALETTE[px[i]] : ((x + y) & 1 ? "#f4eff7" : "#fff");
      g.fillRect(x * 30, y * 30, 30, 30);
    }
    g.strokeStyle = "rgba(107,88,118,.18)"; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 16; i++) { g.moveTo(i * 30, 0); g.lineTo(i * 30, 480); g.moveTo(0, i * 30); g.lineTo(480, i * 30); }
    g.stroke();
  };
  const ui = () => {
    $("st-slots").innerHTML = state.designs.map((d, i) => '<button class="sw thumb' + (i === slot ? " on" : "") + '" data-slot="' + i + '" style="background-image:url(' + designCv[i].toDataURL() + ')"></button>').join("");
    $("st-pal").innerHTML = PALETTE.map((c, i) => '<button class="sw' + (i === color && tool !== "erase" ? " on" : "") + '" data-color="' + i + '" style="background:' + c + '"></button>').join("");
    document.querySelectorAll("#modal-body [data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool));
  };
  const commit = () => {
    state.designs[slot] = encode();
    refreshDesign(slot, state.designs[slot]);
    if (state.designs[slot] && !state.stats.design) bump("design");
    touch();
  };
  const draw = (e) => {
    const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * 16), y = Math.floor((e.clientY - r.top) / r.height * 16);
    if (x < 0 || y < 0 || x > 15 || y > 15) return;
    const i = y * 16 + x, to = tool === "erase" ? -1 : color;
    if (tool === "fill") {
      const from = px[i];
      if (from === to) return;
      const stack = [i];
      while (stack.length) {
        const p = stack.pop();
        if (px[p] !== from) continue;
        px[p] = to;
        if (p % 16 > 0) stack.push(p - 1);
        if (p % 16 < 15) stack.push(p + 1);
        if (p >= 16) stack.push(p - 16);
        if (p < 240) stack.push(p + 16);
      }
    } else px[i] = to;
    paint();
  };
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 못 잡아도 괜찮아요 */ } undo.push(px.slice()); if (undo.length > 30) undo.shift(); down = true; draw(e); });
  cv.addEventListener("pointermove", (e) => { if (down && tool !== "fill") draw(e); });
  const up = () => { if (down) { down = false; commit(); ui(); } };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  $("modal-body").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b || modalKind !== "studio") return;
    const d = b.dataset;
    if (d.slot) { slot = state.cur = +d.slot; decode(state.designs[slot]); undo = []; }
    else if (d.color) { color = +d.color; if (tool === "erase") tool = "pen"; }
    else if (d.tool) tool = d.tool;
    else if (d.do === "undo") { if (undo.length) { px = undo.pop(); commit(); } }
    else if (d.do === "clear") { undo.push(px.slice()); px.fill(-1); commit(); }
    else if (d.do === "wear") {
      if (!state.designs[slot]) { toast("먼저 그림을 그려 봐! ✏️"); return; }
      state.look.design = slot; touch(); sfx("good"); toast("👕 내가 그린 옷으로 갈아입었어!");
      closeModal(); return;
    } else if (d.do === "floor") {
      if (!state.designs[slot]) { toast("먼저 그림을 그려 봐! ✏️"); return; }
      startBuild("d" + slot); return;
    }
    paint(); ui();
  };
  onClose = () => { $("modal-body").onclick = null; };
  decode(state.designs[slot]);
  paint(); ui();
}

// ───────── 옷장 ─────────
function openLook() {
  const sw = (list, key) => list.map((c) => '<button class="sw' + (state.look[key] === c && (key !== "shirt" || state.look.design < 0) ? " on" : "") + '" data-k="' + key + '" data-v="' + c + '" style="background:' + c + '"></button>').join("");
  const html = () => '<div class="two"><canvas id="look-cv" width="340" height="400"></canvas><div class="side">' +
    '<div class="field"><span>이름</span><input id="look-name" maxlength="8" value="' + esc(state.name) + '"></div>' +
    '<div class="field"><span>피부</span>' + sw(SKINS, "skin") + '</div><div class="field"><span>머리색</span>' + sw(HAIRS, "hair") + "</div>" +
    '<div class="field"><span>머리</span>' + HAIR_STYLES.map(([v, n]) => '<button class="btn small' + (state.look.style === v ? " on" : "") + '" data-k="style" data-v="' + v + '">' + n + "</button>").join("") + "</div>" +
    '<div class="field"><span>옷</span>' + sw(SHIRTS, "shirt") + '</div><div class="field"><span>내 디자인 옷</span>' +
    state.designs.map((d, i) => d ? '<button class="sw thumb' + (state.look.design === i ? " on" : "") + '" data-k="design" data-v="' + i + '" style="background-image:url(' + designCv[i].toDataURL() + ')"></button>' : "").join("") +
    '<button class="btn small" data-k="studio">🎨 새로 그리기</button></div></div></div>';
  const show = () => {
    $("modal-body").innerHTML = html();
    const g = $("look-cv").getContext("2d");
    g.setTransform(300, 0, 0, 300, 170, 360);
    g.imageSmoothingEnabled = false;
    drawPerson(g, 0, 0, state.look, "down", 0, false);
    $("look-name").addEventListener("input", (e) => { state.name = e.target.value.trim() || "하늘"; touch(); refreshHud(); });
  };
  openModal("look", "👗 옷장", "");
  show();
  $("modal-body").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b || modalKind !== "look") return;
    const { k, v } = b.dataset;
    if (k === "studio") { closeModal(); openStudio(); return; }
    if (k === "design") state.look.design = +v;
    else { state.look[k] = v; if (k === "shirt") state.look.design = -1; }
    touch(); sfx("pop"); show();
  };
  onClose = () => { $("modal-body").onclick = null; };
}

// ───────── 시작 ─────────
state.designs.forEach((d, i) => refreshDesign(i, d));
if (boxSolid(state.x, state.y)) { const st = A().start; state.x = st[0]; state.y = st[1]; }
updateEnv();
setInterval(() => { updateEnv(); refreshHud(); }, 30000);
spawnShells();
setInterval(spawnShells, 5000);
refreshHud();
if (!state.started) {
  $("intro").hidden = false;
  $("intro-install").hidden = isStandalone();
  $("intro-install").addEventListener("click", installApp);
  $("intro-go").addEventListener("click", () => {
    state.name = $("in-name").value.trim() || "하늘";
    state.island = $("in-island").value.trim() || "몽글몽글";
    state.started = true;
    state.seen2 = true;
    $("intro").hidden = true;
    refreshHud(); save(); sfx("good");
    toast("🐱 모카: \"" + state.name + ", " + state.island + " 섬에 온 걸 환영한다냥! 📝 수첩을 열어 봐.\"");
  });
}
if (state.started && !state.seen2) {
  state.seen2 = true; touch();
  setTimeout(() => toast("🎉 새 소식! 보라 지붕 집에 들어가서 방을 꾸밀 수 있어. 상점에 가구도 들어왔어!"), 600);
}
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if ("serviceWorker" in navigator && location.protocol === "https:" || location.hostname === "localhost") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
