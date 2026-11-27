// 나의 반려동물 & 동물 도감 화면
// 도움 요청 기능과는 따로 움직여요. 도움 요청 횟수는 보상과 전혀 연결하지 않아요.
import {
  CATEGORIES, CATEGORY_BY_ID, SPECIES, SPECIES_BY_ID, LIFECYCLES, GROWTH, growthOf,
  ACTIONS, OBSERVE, OBSERVE_TIPS, ITEMS, ITEM_BY_ID, ITEM_KINDS, unlockText, BADGES, BADGE_BY_ID,
} from "./data.js";
import { load, saveLocal, blank, normalize, newPet, today, daysTogether, nextGrowth, prettyCode, cleanCode } from "./save.js";
import { escapeHtml, showToast, formatAgo } from "../common.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
// 알림은 3개까지만 보여요 (버튼을 가리지 않게)
const toast = (o) => {
  const el = showToast($("#toasts"), { duration: 3500, ...o });
  [...$("#toasts").children].slice(3).forEach((t) => t.remove());
  return el;
};

let data = load() || blank();
let store = null;              // 도움 요청과 같은 연결(방 번호·Firebase)을 이어하기에만 써요
let stage = null;              // 3D 무대 (하나만 만들어 화면마다 옮겨 써요)
let threeMod = null;
let busy = false;
let pickCat = "dog";
let dexCat = "all";
let decorKind = "bg";
let pendingSpecies = null;
let lastSync = 0;
let syncTimer = null;

const pet = () => data.pets[data.activePetId] || null;
// 받침에 맞는 조사: josa("콩이", "이", "가") → "콩이가", josa("보람", "과", "와") → "보람과"
function josa(word, withBatchim, without) {
  const last = String(word).charCodeAt(String(word).length - 1);
  const has = last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 !== 0 : false;
  return `${word}${has ? withBatchim : without}`;
}
const spaceOf = (speciesId) => CATEGORY_BY_ID[SPECIES_BY_ID[speciesId].cat].space;

// ─────────────────────────────────────────────
//  저장 (이 기기 + 이어하기)
// ─────────────────────────────────────────────
function persist() {
  data.updatedAt = Date.now();
  saveLocal(data);
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushRemote, 1500);
}
async function pushRemote() {
  if (!store?.petSave) return;
  const ok = await store.petSave(data.code, JSON.stringify(data)).catch(() => false);
  if (ok) { lastSync = Date.now(); renderSyncState(); }
}
// 다른 기기에서 더 최근에 놀았으면 그 기록을 가져와요
async function pullRemote() {
  if (!store?.petLoad) return;
  try {
    const raw = await store.petLoad(data.code);
    const remote = raw ? normalize(JSON.parse(raw)) : null;
    if (remote && remote.updatedAt > data.updatedAt + 1000) {
      data = remote;
      saveLocal(data);
      route();
      toast({ title: "다른 기기에서 놀던 기록을 이어 왔어요", icon: "📲", tone: "green" });
    } else if (!remote || remote.updatedAt < data.updatedAt) {
      pushRemote();
    } else { lastSync = Date.now(); renderSyncState(); }
  } catch { /* 연결이 없으면 이 기기에서 계속 놀아요 */ }
}

// ─────────────────────────────────────────────
//  3D 무대
// ─────────────────────────────────────────────
async function getStage() {
  if (stage) return stage;
  try {
    threeMod = await import("./scene.js");
    if (!threeMod.webglOK()) throw new Error("no webgl");
    stage = new threeMod.Stage();
  } catch {
    stage = null;
  }
  return stage;
}
// 화면에 3D 무대를 붙여요 (안 되는 기기에서는 사진으로 대신해요)
async function mountStage(box, setup) {
  const s = await getStage();
  if (!s) {
    box.querySelector(".no3d")?.remove();
    box.insertAdjacentHTML("afterbegin", `<div class="no3d">이 기기에서는 3D 화면을 볼 수 없어요 😢</div>`);
    return null;
  }
  setup(s);
  s.mount(box);
  return s;
}
const thumb = (kind, id, opts) => (threeMod ? threeMod.thumb(kind, id, opts) : "");
async function ensureThumbs() { if (!threeMod) await getStage(); }

// ─────────────────────────────────────────────
//  화면 바꾸기 (#pet, #pet/decor, #pet/rewards, #pet/sync, #dex, #dex/동물)
// ─────────────────────────────────────────────
const VIEWS = ["pick", "name", "home", "decor", "rewards", "sync", "dex", "dexd"];
function show(v) {
  VIEWS.forEach((x) => { $(`#v-${x}`).hidden = x !== v; });
  $$(".pet-tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (v.startsWith("dex") ? "dex" : "pet")));
  if (!["home", "decor", "name", "dexd"].includes(v)) stage?.stop();
  scrollTo({ top: 0 });
}
async function route() {
  const [top, sub] = location.hash.slice(1).split("/");
  await ensureThumbs();
  if (top === "dex") return sub && SPECIES_BY_ID[sub] ? openDexDetail(sub) : openDex();
  if (sub === "sync") return openSync();  // 새 기기에서도 불러올 수 있게 반려동물이 없어도 열어요
  if (!pet()) return sub === "name" && pendingSpecies ? openName() : openPick();
  if (sub === "decor") return openDecor();
  if (sub === "rewards") return openRewards();
  return openHome();
}
addEventListener("hashchange", route);

// ─────────────────────────────────────────────
//  1. 반려동물 고르기
// ─────────────────────────────────────────────
function catTabs(el, current, withAll, onPick) {
  const list = withAll ? [{ id: "all", icon: "✨", name: "전체" }, ...CATEGORIES] : CATEGORIES;
  el.innerHTML = list.map((c) => `<button class="cat-tab ${c.id === current ? "on" : ""}" data-cat="${c.id}" role="tab" aria-selected="${c.id === current}">${c.icon} ${c.name}</button>`).join("");
  el.onclick = (e) => { const b = e.target.closest(".cat-tab"); if (b) onPick(b.dataset.cat); };
}
function openPick() {
  catTabs($("#pick-tabs"), pickCat, false, (c) => { pickCat = c; openPick(); });
  $("#pick-note").hidden = pickCat !== "bug";
  $("#pick-grid").innerHTML = SPECIES.filter((s) => s.cat === pickCat).map((s) => `
    <div class="pick-card">
      <div class="pick-img"><img src="${thumb("pet", s.id)}" alt="${s.name}"></div>
      <b>${s.name}</b>
      <small>${s.trait}</small>
      <button class="btn btn-primary btn-block" data-species="${s.id}">선택하기</button>
    </div>`).join("");
  $("#pick-grid").onclick = (e) => {
    const b = e.target.closest("[data-species]");
    if (!b) return;
    pendingSpecies = b.dataset.species;
    location.hash = "pet/name";
  };
  show("pick");
}

// ─────────────────────────────────────────────
//  2. 이름 짓기
// ─────────────────────────────────────────────
const NAME_IDEAS = { dog: ["콩이", "보리", "초코", "구름이", "단추"], cat: ["나비", "호떡", "모카", "별이", "치즈"], bug: ["장군이", "번개", "도토리", "참나무", "반짝이"] };
async function openName() {
  const s = SPECIES_BY_ID[pendingSpecies];
  $("#name-species").textContent = `${CATEGORY_BY_ID[s.cat].icon} ${s.name}`;
  $("#name-input").value = "";
  $("#name-error").textContent = "";
  $("#name-ideas").innerHTML = NAME_IDEAS[s.cat].map((n) => `<button type="button" class="chip">${n}</button>`).join("");
  $("#name-ideas").onclick = (e) => { const c = e.target.closest(".chip"); if (c) $("#name-input").value = c.textContent; };
  show("name");
  await mountStage($("#name-stage"), (st) => { st.setMode("showcase"); st.setPet(s.id, { scale: 1 }); st.pet.setMood("happy"); });
}
$("#name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#name-input").value.trim();
  if (!name) { $("#name-error").textContent = "✏️ 이름을 적거나 아래에서 골라 주세요."; return; }
  const p = newPet(pendingSpecies, name.slice(0, 10), spaceOf(pendingSpecies));
  data.pets[p.id] = p;
  data.activePetId = p.id;
  pendingSpecies = null;
  checkRewards(true);
  persist();
  location.hash = "pet";
  setTimeout(() => toast({ title: `${josa(name, "과", "와")} 친구가 되었어요!`, text: "버튼을 눌러 함께 놀아요.", icon: "🐾", tone: "green" }), 400);
});

// ─────────────────────────────────────────────
//  3. 나의 반려동물
// ─────────────────────────────────────────────
function actionsFor(p) {
  const cat = SPECIES_BY_ID[p.species].cat;
  const list = [...ACTIONS[cat]];
  if (cat !== "bug") list.push(OBSERVE);
  return list;
}
function renderInfo() {
  const p = pet();
  const s = SPECIES_BY_ID[p.species];
  const { g, next, pct } = nextGrowth(p.exp);
  $("#h-name").textContent = p.name;
  $("#h-species").textContent = `${CATEGORY_BY_ID[s.cat].icon} ${s.name}`;
  $("#h-days").textContent = `함께한 지 ${daysTogether(p)}일째`;
  $("#h-love").textContent = `${p.love}/100`;
  $("#h-love-bar").style.width = `${p.love}%`;
  $("#h-stage").textContent = `${g.name} 단계`;
  $("#h-exp").textContent = next ? `경험치 ${p.exp} / ${next.exp}` : `경험치 ${p.exp} · 최고 단계`;
  $("#h-exp-bar").style.width = `${Math.round(pct * 100)}%`;
}
async function openHome() {
  const p = pet();
  renderInfo();
  $("#actions").innerHTML = actionsFor(p).map((a) => `<button class="act" data-act="${a.id}"><span>${a.icon}</span>${a.label}</button>`).join("")
    + `<button class="act decor" data-act="decor"><span>🎨</span>꾸미기</button>`;
  show("home");
  await mountStage($("#home-stage"), (st) => {
    st.setMode("room");
    st.setRoom(p.decor.bg, spaceOf(p.species));
    st.setItems(p.decor.items);
    st.setPet(p.species, { scale: growthOf(p.exp).scale, acc: p.acc });
    st.setEdit(null);
  });
  idleBubble(true);
}
$("#actions").addEventListener("click", (e) => {
  const b = e.target.closest(".act");
  if (!b || busy) return;
  if (b.dataset.act === "decor") { location.hash = "pet/decor"; return; }
  doAction(b.dataset.act);
});

// 말풍선
let bubbleTimer = null;
function say(text, ms = 4200) {
  const el = $("#bubble");
  el.innerHTML = text;
  el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop", "show");
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => idleBubble(), ms);
}
const IDLE = {
  dog: ["멍! 오늘도 반가워요!", "꼬리가 저절로 흔들려요 🐾", "공놀이 할까요?", "킁킁, 좋은 냄새가 나요"],
  cat: ["냐옹~ 기분 좋아요", "햇살이 따뜻해요 ☀️", "꾹꾹이 해 줄까요?", "장난감 어디 있어요?"],
  bug: ["(더듬이를 살랑살랑)", "참나무 수액 냄새가 나요", "통나무 위를 걸어 볼까요?", "(조용히 주위를 살펴요)"],
};
function idleBubble(first) {
  const p = pet();
  if (!p || $("#v-home").hidden) return;
  const cat = SPECIES_BY_ID[p.species].cat;
  const care = p.care || {};
  const last = (ids) => Math.max(0, ...ids.map((id) => care[id]?.last || 0));
  const hungry = Date.now() - last(["feed", "snack", "jelly"]) > 4 * 3600e3;
  const bored = Date.now() - last(["walk", "ball", "toy", "rod", "climb"]) > 4 * 3600e3;
  let text;
  if (first && Date.now() - (p.adoptedAt || 0) < 60e3) text = `안녕! 나는 ${escapeHtml(p.name)}! 잘 부탁해요 💕`;
  else if (hungry && Math.random() < 0.6) text = cat === "bug" ? "젤리 냄새가 그리워요… 🍯" : "배가 조금 출출해요… 🍽️";
  else if (bored && Math.random() < 0.6) text = "같이 놀고 싶어요! 🎈";
  else text = IDLE[cat][Math.floor(Math.random() * IDLE[cat].length)];
  const el = $("#bubble");
  el.innerHTML = text;
  el.classList.add("show");
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => idleBubble(), 12000);
}
// 하트·별 같은 작은 효과
function fx(symbol, n = 6) {
  const box = $("#fx");
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = symbol;
    s.style.left = `${38 + Math.random() * 24}%`;
    s.style.top = `${40 + Math.random() * 20}%`;
    s.style.animationDelay = `${i * 0.12}s`;
    box.appendChild(s);
    setTimeout(() => s.remove(), 2200);
  }
}

const ACTION_SAY = {
  feed: "냠냠! 정말 맛있어요 😋", snack: "생선 간식 최고예요! 😻", jelly: "(수액 같은 젤리를 할짝할짝) 🍯",
  water: "꿀꺽꿀꺽, 시원해요 💧", mist: "촉촉해서 좋아요 💦",
  walk: "산책은 언제나 신나요! 🌼", ball: "공 잡았다! 또 던져 주세요 🎾", toy: "털실 잡았다! 😼", rod: "저 깃털 꼭 잡을 거예요! 🪶",
  climb: "통나무 위가 제일 좋아요 🪵", pet: "(눈을 감고 행복해해요) 💕",
};
async function doAction(id) {
  const p = pet();
  const a = actionsFor(p).find((x) => x.id === id);
  if (!a) return;
  if (a.lifecycle) { openLifeModal(p.species); reward(p, a); return; }
  busy = true;
  $$(".act").forEach((b) => (b.disabled = true));
  const prop = a.bowl || { water: "water", ball: "ball", toy: "yarn", rod: "rod" }[a.id] || null;
  const gained = reward(p, a);
  if (a.observe) say(observeText(p), 7000);
  else say(gained.limited ? `${ACTION_SAY[a.id] || "좋아요!"}<br><small>오늘은 이 놀이로 충분히 자랐어요. 내일 또 해요!</small>` : ACTION_SAY[a.id] || "좋아요!");
  fx(a.fx, a.id === "pet" ? 7 : 5);
  if (stage) await stage.play(a.anim, { mood: a.mood, dur: a.observe ? 3.6 : a.anim === "walk" ? 3.2 : 2.4, prop });
  else await new Promise((r) => setTimeout(r, 1200));
  busy = false;
  $$(".act").forEach((b) => (b.disabled = false));
  afterGain(p, gained);
}
function observeText(p) {
  const s = SPECIES_BY_ID[p.species];
  const pool = [...OBSERVE_TIPS[s.cat], ...(s.dex.features || []), ...(s.dex.facts || [])];
  return `🔍 <b>관찰 노트</b><br>${escapeHtml(pool[Math.floor(Math.random() * pool.length)])}<br><a href="#dex/${s.id}">도감에서 더 알아보기 →</a>`;
}

// 경험치·친밀도 (하루 횟수까지만 오르고, 넘어도 계속 놀 수 있어요. 돌보지 않아도 줄어들지 않아요)
function reward(p, a) {
  const day = today();
  p.care ||= {};
  const c = p.care[a.id] ||= { day, n: 0, total: 0, last: 0 };
  if (c.day !== day) { c.day = day; c.n = 0; }
  const first = c.total === 0;
  c.total += 1; c.last = Date.now();
  p.log = [{ t: Date.now(), a: a.id }, ...(p.log || [])].slice(0, 30);
  const before = growthOf(p.exp).stage;
  if (c.n >= a.daily) { persist(); return { limited: true, before, exp: 0 }; }
  c.n += 1;
  const exp = a.exp + (first ? 10 : 0);
  p.exp += exp;
  p.love = Math.min(100, p.love + a.love);
  persist();
  return { exp, first, before };
}
function afterGain(p, g) {
  if (g.exp) toast({ title: `경험치 +${g.exp}${g.first ? " (새로운 놀이!)" : ""}`, icon: "✨", tone: "green", duration: 2200 });
  const now = growthOf(p.exp);
  if (now.stage > g.before) growUp(p, now);
  checkRewards();
  renderInfo();
}
function growUp(p, g) {
  stage?.setPet(p.species, { scale: g.scale, acc: p.acc });
  modal(`<div class="grow-modal"><div class="grow-img"><img src="${thumb("pet", p.species)}" alt=""></div>
    <h3>🎉 ${escapeHtml(josa(p.name, "이", "가"))} '${g.name}' 단계가 되었어요!</h3>
    <p>몸이 조금 더 커졌어요.<br><small>※ 아기·어린이·성장·성숙은 게임 속 성장 단계예요. 실제 동물이 자라는 과정과는 달라요.</small></p>
    <div class="modal-actions"><button class="btn btn-primary" data-close>좋아요!</button></div></div>`);
  fx("🌟", 8);
}

// ─────────────────────────────────────────────
//  보상 (아이템·배지)
// ─────────────────────────────────────────────
function stats() {
  const p = pet();
  const seen = Object.keys(data.dex.seen).length;
  if (!p) return { stage: 0, exp: 0, plays: 0, dex: seen };
  const cat = SPECIES_BY_ID[p.species].cat;
  const tried = actionsFor(p).filter((a) => (a.play || a.observe || a.lifecycle) && p.care?.[a.id]?.total).length;
  return { stage: growthOf(p.exp).stage, exp: p.exp, plays: tried, dex: seen, cat };
}
function isUnlocked(item, st) {
  const u = item.unlock;
  return !!(u.start || (u.stage && st.stage >= u.stage) || (u.exp && st.exp >= u.exp) || (u.dex && st.dex >= u.dex) || (u.plays && st.plays >= u.plays));
}
function checkRewards(silent) {
  const st = stats();
  const p = pet();
  // 아이템
  for (const it of ITEMS) {
    if (data.unlocked.includes(it.id) || !isUnlocked(it, st)) continue;
    data.unlocked.push(it.id);
    if (!silent && !it.unlock.start) toast({ title: `새 아이템을 받았어요: ${it.name}`, text: "꾸미기에서 써 볼 수 있어요.", icon: "🎁", tone: "yellow", duration: 4500 });
  }
  // 배지
  const seen = data.dex.seen;
  const catDone = (c) => SPECIES.filter((s) => s.cat === c).every((s) => seen[s.id]);
  const earn = {
    "first-friend": !!p,
    "dex-first": Object.keys(seen).length > 0,
    "dex-dog": catDone("dog"), "dex-cat": catDone("cat"), "dex-bug": catDone("bug"),
    "dex-all": SPECIES.every((s) => seen[s.id]),
    lifecycle: ["rhino", "stag", "chafer"].every((k) => data.dex.life[k]),
    "stage-4": st.stage >= 4,
    "love-100": !!p && p.love >= 100,
    "all-plays": !!p && actionsFor(p).every((a) => p.care?.[a.id]?.total),
  };
  for (const [id, ok] of Object.entries(earn)) {
    if (!ok || data.badges[id]) continue;
    data.badges[id] = Date.now();
    const b = BADGE_BY_ID[id];
    if (!silent) toast({ title: `배지를 받았어요: ${b.name}`, text: b.desc, icon: b.icon, tone: "yellow", duration: 5000 });
  }
  persist();
}
function openRewards() {
  $("#badge-grid").innerHTML = BADGES.map((b) => `<div class="badge ${data.badges[b.id] ? "got" : ""}">
    <span class="badge-ico">${data.badges[b.id] ? b.icon : "🔒"}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join("");
  const p = pet();
  const space = p ? spaceOf(p.species) : "indoor";
  const list = ITEMS.filter((i) => i.space === "any" || i.space === space);
  const st = stats();
  $("#item-count").textContent = `${list.filter((i) => data.unlocked.includes(i.id)).length} / ${list.length}`;
  $("#reward-items").innerHTML = list.map((i) => itemCard(i, data.unlocked.includes(i.id) || isUnlocked(i, st), false)).join("");
  show("rewards");
}
function itemCard(it, owned, placed) {
  return `<button class="item ${owned ? "" : "locked"} ${placed ? "placed" : ""}" data-item="${it.id}" ${owned ? "" : "aria-disabled=\"true\""}>
    ${it.kind === "bg" ? `<span class="bg-swatch ${it.id}"></span>` : `<img src="${thumb("item", it.id)}" alt="">`}
    <b>${it.name}</b><small>${owned ? (placed ? "✓ 놓여 있어요" : "가지고 있어요") : `🔒 ${unlockText(it.unlock)}`}</small></button>`;
}

// ─────────────────────────────────────────────
//  4. 공간 꾸미기
// ─────────────────────────────────────────────
const KIND_SPACE = { indoor: ["bg", "cushion", "toy", "bowl", "house", "plant", "acc"], nature: ["bg", "bowl", "plant", "terrarium", "playground", "acc"] };
async function openDecor() {
  const p = pet();
  const space = spaceOf(p.species);
  const kinds = ITEM_KINDS.filter((k) => KIND_SPACE[space].includes(k.id));
  if (!kinds.some((k) => k.id === decorKind)) decorKind = "bg";
  const tabs = $("#decor-tabs");
  tabs.innerHTML = kinds.map((k) => `<button class="cat-tab ${k.id === decorKind ? "on" : ""}" data-kind="${k.id}">${k.icon} ${k.name}</button>`).join("");
  tabs.onclick = (e) => { const b = e.target.closest(".cat-tab"); if (b) { decorKind = b.dataset.kind; openDecor(); } };
  renderDecorItems();
  show("decor");
  await mountStage($("#decor-stage"), (st) => {
    st.setMode("room");
    st.setRoom(p.decor.bg, space);
    st.setItems(p.decor.items);
    st.setPet(p.species, { scale: growthOf(p.exp).scale, acc: p.acc });
    st.setEdit((itemId, x, z) => {
      const it = p.decor.items.find((i) => i.id === itemId);
      if (it) { it.x = x; it.z = z; persist(); }
    });
  });
}
function renderDecorItems() {
  const p = pet();
  const space = spaceOf(p.species);
  const list = ITEMS.filter((i) => i.kind === decorKind && (i.space === "any" || i.space === space));
  const placed = (id) => (decorKind === "bg" ? p.decor.bg === id : decorKind === "acc" ? p.acc === id : p.decor.items.some((x) => x.id === id));
  $("#decor-items").innerHTML = list.map((i) => itemCard(i, data.unlocked.includes(i.id), placed(i.id))).join("") || `<p class="sub-note">이 공간에 맞는 아이템이 없어요.</p>`;
  $("#decor-note").textContent = decorKind === "bg" ? "배경을 눌러 바꿔요." : decorKind === "acc" ? "장식을 누르면 반려동물에게 달아 줘요. 한 번 더 누르면 빼요." : "아이템을 누르면 놓고, 한 번 더 누르면 치워요. 방 안의 물건은 끌어서 옮겨요.";
}
$("#decor-items").addEventListener("click", (e) => {
  const b = e.target.closest(".item");
  if (!b) return;
  const it = ITEM_BY_ID[b.dataset.item];
  if (!data.unlocked.includes(it.id)) { toast({ title: "아직 잠겨 있어요", text: unlockText(it.unlock), icon: "🔒", duration: 2500 }); return; }
  const p = pet();
  if (it.kind === "bg") { p.decor.bg = it.id; stage?.setRoom(it.id, spaceOf(p.species)); stage?.setItems(p.decor.items); }
  else if (it.kind === "acc") { p.acc = p.acc === it.id ? null : it.id; stage?.setPet(p.species, { scale: growthOf(p.exp).scale, acc: p.acc }); }
  else {
    const i = p.decor.items.findIndex((x) => x.id === it.id);
    if (i >= 0) p.decor.items.splice(i, 1);
    else {
      if (p.decor.items.length >= 10) { toast({ title: "물건은 10개까지 놓을 수 있어요", icon: "📦", duration: 2500 }); return; }
      const spots = [[-0.7, -0.6], [0.7, -0.6], [-0.75, 0.45], [0.75, 0.45], [0, -0.8], [-0.35, 0.7], [0.35, 0.7], [-0.95, 0], [0.95, 0], [0.3, -0.7]];
      const free = spots.find(([x, z]) => !p.decor.items.some((o) => Math.hypot(o.x - x, o.z - z) < 0.3)) || [0.5, 0.5];
      p.decor.items.push({ id: it.id, x: free[0], z: free[1] });
    }
    stage?.setItems(p.decor.items);
  }
  persist();
  renderDecorItems();
});

// ─────────────────────────────────────────────
//  5. 이어하기
// ─────────────────────────────────────────────
function renderSyncState() {
  const el = $("#sync-state");
  if (!el) return;
  if (!store) { el.textContent = "이 기기에만 저장되고 있어요."; return; }
  if (store.mode === "firebase") el.textContent = lastSync ? `✅ 인터넷에 저장됨 · ${formatAgo(lastSync)}` : "인터넷에 저장하는 중…";
  else if (store.mode === "room") {
    const online = store.__status === "online";
    el.textContent = online ? (lastSync ? `✅ 선생님 기기에 저장됨 · ${formatAgo(lastSync)}` : "선생님 기기에 저장하는 중…") : "선생님 방에 연결되면 선생님 기기에도 저장돼요. 지금은 이 기기에 저장돼요.";
  } else el.textContent = "이 기기에만 저장되고 있어요. (시험 모드)";
}
function openSync() {
  $("#save-code").textContent = prettyCode(data.code);
  $("#sync-error").textContent = "";
  $("#sync-input").value = "";
  renderSyncState();
  show("sync");
}
$("#sync-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = cleanCode($("#sync-input").value);
  const err = $("#sync-error");
  if (code.length !== 8) { err.textContent = "코드 8자리를 넣어 주세요."; return; }
  if (code === data.code) { err.textContent = "지금 이 기기의 코드예요."; return; }
  if (!store?.petLoad) { err.textContent = "선생님 방에 연결되어 있을 때 불러올 수 있어요."; return; }
  err.textContent = "불러오는 중…";
  try {
    const raw = await store.petLoad(code);
    const remote = raw ? normalize(JSON.parse(raw)) : null;
    if (!remote) { err.textContent = "그 코드로 저장된 친구를 찾지 못했어요. 코드를 확인하거나, 선생님 화면이 켜져 있는지 확인해 주세요."; return; }
    const rp = remote.pets[remote.activePetId];
    const ok = await confirmModal("이 친구를 불러올까요?", `${rp ? `${escapeHtml(rp.name)}(${SPECIES_BY_ID[rp.species]?.name || ""})` : "도감 기록"}의 기록을 불러와요. 이 기기에 있던 기록은 불러온 기록으로 바뀌어요.`);
    if (!ok) { err.textContent = ""; return; }
    data = remote;
    saveLocal(data);
    toast({ title: "불러왔어요! 이어서 놀아요", icon: "📲", tone: "green" });
    location.hash = "pet";
  } catch (ex) {
    err.textContent = ex.message || "불러오지 못했어요.";
  }
});

// ─────────────────────────────────────────────
//  6. 동물 도감
// ─────────────────────────────────────────────
function openDex() {
  const seen = data.dex.seen;
  const total = SPECIES.length, got = SPECIES.filter((s) => seen[s.id]).length;
  $("#dex-pct").textContent = `${Math.round((got / total) * 100)}%`;
  $("#dex-bar").style.width = `${(got / total) * 100}%`;
  $("#dex-count").textContent = `${got} / ${total} 발견`;
  $("#dex-cats").innerHTML = CATEGORIES.map((c) => {
    const list = SPECIES.filter((s) => s.cat === c.id), n = list.filter((s) => seen[s.id]).length;
    return `<div class="dex-cat ${n === list.length ? "done" : ""}"><span>${c.icon}</span><b>${c.name} 도감</b><em>${n}/${list.length}</em><span class="bar"><i class="exp" style="width:${(n / list.length) * 100}%"></i></span></div>`;
  }).join("");
  catTabs($("#dex-tabs"), dexCat, true, (c) => { dexCat = c; openDex(); });
  $("#dex-grid").innerHTML = SPECIES.filter((s) => dexCat === "all" || s.cat === dexCat).map((s) => {
    const found = !!seen[s.id];
    return `<a class="dex-card ${found ? "found" : ""}" href="#dex/${s.id}">
      <span class="dex-img"><img src="${thumb("pet", s.id, { silhouette: !found })}" alt=""></span>
      <b>${found ? s.name : "???"}</b>
      <small>${found ? "✓ 발견" : "눌러서 알아보기"}</small></a>`;
  }).join("");
  show("dex");
}
function lifeHtml(key, speciesId) {
  const lc = LIFECYCLES[key];
  return `<h3>🥚 ${lc.title}</h3>
    <p class="real-note">📌 실제 곤충의 한살이예요. 반려동물 키우기의 성장 단계(아기 → 어린이 → 성장 → 성숙)는 게임 규칙이라 실제와 달라요.</p>
    <ol class="life-steps">${lc.stages.map((st, i) => `
      <li>
        <span class="life-img"><img src="${st.stage === "adult" ? thumb("pet", speciesId) : thumb("life", key, { stage: st.stage })}" alt=""></span>
        <b>${i + 1}. ${st.name}</b><em>${st.time}</em>
        <p>${st.text}</p>
      </li>`).join("")}</ol>`;
}
async function openDexDetail(id) {
  const s = SPECIES_BY_ID[id];
  const list = SPECIES.filter((x) => x.cat === s.cat);
  const idx = list.indexOf(s);
  const isNew = !data.dex.seen[id];
  const d = s.dex;
  const sec = (title, body) => (body ? `<section><h3>${title}</h3>${body}</section>` : "");
  const ul = (arr) => `<ul>${arr.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
  const p = (t) => `<p>${escapeHtml(t).replace(/\n/g, "<br>")}</p>`;
  $("#dexd-info").innerHTML = `
    <span class="pill tone-blue">${CATEGORY_BY_ID[s.cat].icon} ${CATEGORY_BY_ID[s.cat].name} 도감</span>
    <h1>${s.name}</h1>
    <p class="dexd-trait">${s.trait}</p>
    ${sec("📂 분류", d.group && p(d.group))}
    ${sec("🌍 원산지", d.origin && p(d.origin))}
    ${sec("🏞️ 서식지", d.habitat && p(d.habitat))}
    ${sec("🍯 먹이", d.food && p(d.food))}
    ${sec("👀 외형적 특징", d.looks && p(d.looks))}
    ${sec("🎨 털색과 무늬 특징", d.pattern && p(d.pattern))}
    ${sec("✨ 특징", d.features && ul(d.features))}
    ${sec("💭 성격 및 행동 특성", d.personality && p(d.personality))}
    ${sec("💡 재미있는 사실", ul(d.facts))}`;
  $("#dexd-pos").textContent = `${CATEGORY_BY_ID[s.cat].name} ${idx + 1} / ${list.length}`;
  $("#dexd-prev").onclick = () => { location.hash = `dex/${list[(idx - 1 + list.length) % list.length].id}`; };
  $("#dexd-next").onclick = () => { location.hash = `dex/${list[(idx + 1) % list.length].id}`; };
  const life = $("#dexd-life");
  life.hidden = !d.lifecycle;
  if (d.lifecycle) { life.innerHTML = lifeHtml(d.lifecycle, s.id); data.dex.life[d.lifecycle] = true; }
  show("dexd");
  await mountStage($("#dex-stage"), (st) => { st.setMode("showcase"); st.spin = 0; st.setPet(s.id, { scale: 1 }); });
  if (isNew) {
    data.dex.seen[id] = Date.now();
    const pp = pet();
    if (pp) { pp.exp += 5; }
    toast({ title: `새로운 동물을 발견했어요: ${s.name}`, text: pp ? `${pp.name}의 경험치 +5` : "도감에 기록했어요.", icon: "🔎", tone: "green" });
    if (pp && growthOf(pp.exp).stage > growthOf(pp.exp - 5).stage) growUp(pp, growthOf(pp.exp));
  }
  checkRewards();
}
function openLifeModal(speciesId) {
  const key = SPECIES_BY_ID[speciesId].dex.lifecycle;
  data.dex.life[key] = true;
  modal(`<div class="life-modal">${lifeHtml(key, speciesId)}<div class="modal-actions"><a class="btn" href="#dex/${speciesId}" data-close>📖 도감에서 보기</a><button class="btn btn-primary" data-close>닫기</button></div></div>`, true);
  checkRewards();
}

// ─────────────────────────────────────────────
//  창 (모달)
// ─────────────────────────────────────────────
function modal(html, wide) {
  const m = $("#modal");
  $("#modal-card").innerHTML = html;
  $("#modal-card").classList.toggle("wide", !!wide);
  m.hidden = false;
  return new Promise((resolve) => {
    m.onclick = (e) => {
      const t = e.target.closest("[data-close],[data-yes],[data-no]");
      if (e.target === m || t) { m.hidden = true; resolve(!!e.target.closest("[data-yes]")); }
    };
  });
}
const confirmModal = (title, text) => modal(`<h3>${title}</h3><p>${text}</p><div class="modal-actions"><button class="btn" data-no>취소</button><button class="btn btn-primary" data-yes>네</button></div>`);

// ─────────────────────────────────────────────
//  시작
// ─────────────────────────────────────────────
// 시험 모드 주소(?net=local 등)를 도움 요청 화면 링크에도 붙여요
["#home-link", "#help-link"].forEach((s) => { $(s).href = `./${location.search}`; });
if (!location.hash) location.replace("#pet");
checkRewards(true);
route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

// 이어하기용 연결 (도움 요청과 같은 방 번호·Firebase 설정을 써요)
try {
  const { openStore } = await import("../store.js");
  store = await openStore("student");
  if (store.mode === "room") {
    store.onStatus((st) => {
      store.__status = st.state;
      if (st.state === "online") pullRemote();
      renderSyncState();
    });
  }
  await store.ensureStudent();
  if (store.mode === "firebase") pullRemote();
} catch {
  store = null;
}
