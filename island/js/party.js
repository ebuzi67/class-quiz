"use strict";
// 몽글몽글 섬: 같이 놀기
// 한 사람이 자기 섬에 초대하면(주인), 다른 사람들이 입장 코드로 그 섬에 놀러 와요(손님).
// - 섬의 모습(꾸민 것, 집 안, 나무, 조개, 꽃)은 주인 것이 기준이고, 바뀔 때마다 손님에게 보내요.
// - 가방·코인·도감·섬 친구와의 우정은 각자 자기 것이에요.
// - 손님은 주인이 허락할 때만 꾸밀 수 있어요. 글자로 말하기는 없고 인사 아이콘만 있어요.

const PARTY_MAX = 20;
const EMOTES = [["👋", "안녕"], ["😊", "좋아"], ["👍", "최고"], ["❤️", "좋아해"], ["🙏", "고마워"], ["😂", "하하"], ["😮", "우와"], ["👏", "짝짝짝"],
  ["🎣", "낚시하자"], ["🏃", "따라와"], ["🏠", "집에 가자"], ["😢", "아쉬워"]];
const DIR_NAMES = ["down", "up", "left", "right"];

const party = {
  role: "solo", code: "", handle: null, conn: null, myId: "host", seq: 0,
  guests: new Map(),   // 주인 쪽: 손님 id → { conn, last }
  others: new Map(),   // 화면에 보이는 다른 사람들: id → { name, look, x, y, ... }
  allow: false,        // 주인: 손님도 꾸미기 허락
  world: null,         // 손님: 주인 섬의 모습
  visitCv: [], back: null, mine: { trees: {}, shells: {} }, pending: {},
  emo: "", emoN: 0, emoUntil: 0,
  timers: [], lastWorld: "", lastWho: "", sent: {}, tick: 0, lastSnap: 0,
  view: "", input: "", msg: "", busy: false
};
function inParty() { return party.role !== "solo"; }
function isGuest() { return party.role === "guest"; }
// 지금 보고 있는 섬의 모습: 손님이면 주인 섬, 아니면 내 섬
function W() { return party.role === "guest" && party.world ? party.world : state; }
function partyCount() { return inParty() ? party.others.size + 1 : 1; }
function partySend(m) { if (party.role === "guest" && party.conn) party.conn.send(m); }
function broadcast(m) { party.guests.forEach((g) => g.conn.send(m)); }
function errText(type) {
  if (type === "peer-unavailable") return "그 코드의 섬을 찾지 못했어요. 코드를 다시 확인해 봐요.";
  if (type === "nolib") return "인터넷에 연결한 뒤에 다시 해 봐요.";
  return "연결이 안 돼요. 인터넷(와이파이)을 확인하고 다시 해 봐요.";
}

// ───────── 내 모습 주고받기 ─────────
function myWho() {
  const l = state.look;
  return { name: state.name, dz: l.design >= 0 ? state.designs[l.design] : null,
    look: { skin: l.skin, hair: l.hair, style: l.style, shirt: l.shirt, hat: l.hat, pants: l.pants, fit: l.fit } };
}
function validDesign(d) { return typeof d === "string" && /^[a-t.]{256}$/.test(d) ? d : null; }
function cleanWho(w) {
  w = w && typeof w === "object" ? w : {};
  const l = w.look && typeof w.look === "object" ? w.look : {};
  const col = (c, d) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : d;
  return { name: String(w.name || "친구").slice(0, 8), dz: validDesign(w.dz),
    look: { skin: col(l.skin, SKINS[0]), hair: col(l.hair, HAIRS[0]), style: ["long", "pig", "short"].includes(l.style) ? l.style : "long", shirt: col(l.shirt, SHIRTS[0]),
      design: -1, hat: typeof l.hat === "string" && HATS[l.hat] ? l.hat : null, pants: col(l.pants, PANTS[0]), fit: l.fit === "dress" ? "dress" : "tee" } };
}
function setWho(id, w) {
  const c = cleanWho(w);
  const o = party.others.get(id) || { x: 17.5, y: 14.6, tx: 17.5, ty: 14.6, dir: "down", scene: "island", moving: false, emo: "", emoN: 0, emoUntil: 0, fresh: true };
  o.name = c.name; o.dz = c.dz; o.look = c.look;
  o.look.cv = c.dz ? paintDesign(document.createElement("canvas"), c.dz) : null;
  party.others.set(id, o);
  return o;
}
function whoOut(o) { return { name: o.name, dz: o.dz, look: Object.assign({}, o.look, { cv: undefined }) }; }
function sendWhos() {
  if (party.role !== "host") return;
  const w = { host: myWho() };
  party.others.forEach((o, id) => { w[id] = whoOut(o); });
  broadcast({ t: "who", w });
}

// ───────── 위치 주고받기 ─────────
function myPos() {
  return [Math.round(state.x * 100) / 100, Math.round(state.y * 100) / 100, DIR_NAMES.indexOf(state.dir), state.scene === "home" ? 1 : 0, moving ? 1 : 0, party.emo, party.emoN];
}
function applyPos(id, p) {
  const o = party.others.get(id);
  if (!o || !Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return;
  o.tx = Math.max(0, Math.min(MW, p[0])); o.ty = Math.max(0, Math.min(MH, p[1]));
  o.dir = DIR_NAMES[p[2]] || "down";
  const scene = p[3] ? "home" : "island";
  if (o.fresh || scene !== o.scene || Math.hypot(o.tx - o.x, o.ty - o.y) > 4) { o.x = o.tx; o.y = o.ty; o.fresh = false; }
  o.scene = scene; o.moving = !!p[4];
  if (p[6] !== o.emoN) { o.emoN = p[6]; if (EMOTES.some((e) => e[0] === p[5])) { o.emo = p[5]; o.emoUntil = performance.now() + 3500; } }
}
function partyUpdate(dt) {
  if (!inParty()) return;
  party.others.forEach((o) => {
    const k = Math.min(1, dt * 12);
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
  });
}
function sayEmote(e) {
  party.emo = e; party.emoN = (party.emoN + 1) % 1000; party.emoUntil = performance.now() + 3500;
  sfx("pop");
}

// ───────── 주인: 섬에 초대하기 ─────────
function worldSnap() {
  return { name: state.name, island: state.island, obj: state.obj, floor: state.floor, plants: state.plants, shells: state.shells, trees: state.trees,
    home: state.home, designs: state.designs, cur: state.cur, env: { season: ENV.season, night: ENV.night, sunset: ENV.sunset, label: ENV.label }, allow: party.allow };
}
// 나무 열매 시각은 기기마다 시계가 다를 수 있어서 "남은 시간"으로 바꿔 보내요
function worldOut() {
  const w = worldSnap(), now = Date.now(), trees = {};
  for (const k in w.trees) if (w.trees[k] > now) trees[k] = w.trees[k] - now;
  return Object.assign({}, w, { trees });
}
function pushWorld(force) {
  if (party.role !== "host" || !party.guests.size) return;
  const s = JSON.stringify(worldSnap());
  if (!force && s === party.lastWorld) return;
  party.lastWorld = s;
  broadcast({ t: "world", w: worldOut() });
}
function startHost() {
  if (inParty() || party.busy) return;
  party.busy = true; party.msg = "섬 문을 여는 중…"; partyChanged();
  let code = Net.newCode(), tries = 0;
  const open = () => {
    party.handle = Net.host(code, {
      onReady: () => {
        party.role = "host"; party.code = code; party.myId = "host"; party.busy = false; party.msg = ""; party.allow = false;
        party.timers = [setInterval(hostTick, 120), setInterval(() => { pushWorld(); checkWho(); }, 700)];
        sfx("good"); toast("🏝️ 섬 문을 열었어! 입장 코드는 " + code + " 이야.");
        partyChanged();
      },
      onConn: hostConn,
      onError: (type) => {
        if (party.role === "host") return;   // 모임 중에 생기는 손님 쪽 오류는 넘어가요
        if (type === "unavailable-id" && tries++ < 5) { party.handle.close(); code = Net.newCode(); open(); return; }
        party.busy = false; party.msg = errText(type);
        if (party.handle) party.handle.close();
        party.handle = null; partyChanged();
      }
    });
  };
  open();
}
function hostConn(conn) {
  let id = null;
  conn.onmessage = (m) => {
    if (!m || typeof m !== "object" || party.role !== "host") return;
    if (m.t === "join") {
      if (id) return;
      if (party.guests.size >= PARTY_MAX - 1) { conn.send({ t: "full" }); setTimeout(() => conn.close(), 500); return; }
      id = "g" + (++party.seq);
      party.guests.set(id, { conn, last: Date.now() });
      const o = setWho(id, m.who);
      conn.send({ t: "welcome", you: id });
      conn.send({ t: "world", w: worldOut() });
      sendWhos(); partyChanged(); sfx("pop");
      toast("⛵ " + o.name + " 님이 놀러 왔어!");
      return;
    }
    const gst = id && party.guests.get(id);
    if (!gst) return;
    gst.last = Date.now();
    if (m.t === "pos") applyPos(id, m.p);
    else if (m.t === "who") { setWho(id, m.who); sendWhos(); partyChanged(); }
    else if (m.t === "act") hostAct(conn, m);
  };
  conn.onclose = () => { if (id && party.guests.get(id) && party.guests.get(id).conn === conn) dropGuest(id); };
}
function dropGuest(id) {
  const o = party.others.get(id);
  party.guests.delete(id); party.others.delete(id);
  sendWhos(); partyChanged();
  if (o) toast("👋 " + o.name + " 님이 돌아갔어.");
}
function hostTick() {
  const now = Date.now(), all = ++party.tick % 12 === 0, list = [];
  party.guests.forEach((g, id) => { if (now - g.last > 15000) { g.conn.close(); dropGuest(id); } });
  const add = (id, p) => { const key = p.join(); if (all || party.sent[id] !== key) { party.sent[id] = key; list.push([id].concat(p)); } };
  add("host", myPos());
  party.others.forEach((o, id) => add(id, [Math.round(o.tx * 100) / 100, Math.round(o.ty * 100) / 100, DIR_NAMES.indexOf(o.dir), o.scene === "home" ? 1 : 0, o.moving ? 1 : 0, o.emo, o.emoN]));
  broadcast({ t: "snap", p: list });
}
// 손님이 한 일을 주인 섬에 반영해요
function hostAct(conn, m) {
  const k = String(m.k || ""), now = Date.now();
  if (!/^\d{1,2},\d{1,2}$/.test(k)) return;
  if (m.a === "shake") {
    const st = world.statics.get(k);
    if (st && st.fruit && treeReady(k)) { state.trees[k] = now + REGROW_MS; shakes[k] = 0.45; touch(); }
  } else if (m.a === "shell") {
    if (state.shells[k]) { delete state.shells[k]; touch(); }
  } else if (m.a === "plant") {
    const pl = state.plants[k];
    if (!party.allow || !pl) return;
    if (m.op === "water" && pl.s < 2 && !pl.at) { pl.at = now; touch(); }
    else if (m.op === "pick" && pl.s === 2) { delete state.plants[k]; touch(); }
  } else if (m.a === "build") {
    const msg = hostBuild(m.s === "home" ? "home" : "island", k, String(m.sel || ""));
    conn.send({ t: "built", sel: String(m.sel || ""), ok: !msg, msg: msg || "" });
  } else return;
  pushWorld();
}
// 손님의 꾸미기 부탁. 안 되면 까닭을 돌려줘요. 치운 물건은 주인 가방으로 들어가요.
function hostBuild(scene, k, sel) {
  if (!party.allow) return "섬 주인이 허락해야 꾸밀 수 있어.";
  const a = A(scene), [tx, ty] = k.split(",").map(Number), tt = a.at(tx, ty), it = ITEMS[sel];
  const plants = a.home ? {} : state.plants;
  if (a.home ? tt !== T_ROOM : (tt !== T_SAND && tt !== T_GRASS && tt !== T_PATH)) return "거기에는 놓을 수 없어.";
  if (a.statics.has(k)) return "거기에는 놓을 수 없어.";
  if (sel === "erase") {
    if (plants[k]) delete plants[k];
    else if (a.obj[k]) { if (!addItem(a.obj[k].id)) return "섬 주인의 가방이 꽉 찼어."; delete a.obj[k]; }
    else if (a.floor[k] != null) { const f = a.floor[k]; if (typeof f === "string") addItem(f === "s" ? "stone" : f); delete a.floor[k]; }
    else return "치울 것이 없어.";
  } else {
    if (!it || !["decor", "floor", "seed"].includes(it.k)) return "그건 놓을 수 없어.";
    if (plants[k]) return "꽃이 자라는 자리야.";
    if (it.k === "seed") {
      if (a.home || tt !== T_GRASS || a.obj[k] || a.floor[k] != null) return "꽃씨는 빈 풀밭에 심어요.";
      plants[k] = { s: 0, at: 0 };
    } else if (it.k === "floor") {
      if (a.floor[k] != null) return "이미 바닥이 깔려 있어.";
      a.floor[k] = sel;
    } else {
      if (a.obj[k]) return "이미 물건이 있어.";
      a.obj[k] = sel === "easel" ? { id: sel, d: state.cur } : { id: sel };
    }
    if (!a.home) delete state.shells[k];
  }
  touch();
  return "";
}
function checkWho() {
  const s = JSON.stringify(myWho());
  if (s === party.lastWho) return;
  party.lastWho = s;
  if (party.role === "host") sendWhos(); else partySend({ t: "who", who: myWho() });
}

// ───────── 손님: 친구 섬에 놀러 가기 ─────────
function startJoin(code) {
  if (inParty() || party.busy) return;
  party.busy = true; party.msg = "섬을 찾는 중…"; partyChanged();
  party.handle = Net.join(code, {
    onOpen: (conn) => {
      party.conn = conn; party.code = code;
      conn.onmessage = guestMsg;
      conn.onclose = () => partyLost("섬 주인과 연결이 끊어졌어. 내 섬으로 돌아왔어.");
      conn.send({ t: "join", who: myWho() });
    },
    onError: (type) => {
      if (party.role === "guest") { partyLost("연결이 끊어졌어. 내 섬으로 돌아왔어."); return; }
      joinFailed(errText(type));
    }
  });
}
function joinFailed(msg) {
  party.busy = false; party.msg = msg;
  if (party.handle) party.handle.close();
  party.handle = null; party.conn = null; party.world = null; party.others.clear();
  partyChanged();
}
function cleanWorld(w) {
  w = w && typeof w === "object" ? w : {};
  const obj = (o) => o && typeof o === "object" ? o : {};
  const tile = /^\d{1,2},\d{1,2}$/, now = Date.now();
  const objs = (src) => { const out = {}; for (const k in obj(src)) { const o = src[k]; if (tile.test(k) && o && ITEMS[o.id]) out[k] = { id: o.id, d: o.d | 0 }; } return out; };
  const floors = (src) => { const out = {}; for (const k in obj(src)) { const f = src[k]; if (tile.test(k) && (typeof f === "number" || f === "s" || (ITEMS[f] && ITEMS[f].k === "floor"))) out[k] = f; } return out; };
  const plants = {}, shells = {}, trees = {};
  for (const k in obj(w.plants)) { const p = w.plants[k]; if (tile.test(k) && p) plants[k] = { s: Math.max(0, Math.min(2, p.s | 0)), at: p.at ? 1 : 0, kind: ITEMS[p.kind] ? p.kind : "daisy" }; }
  for (const k in obj(w.shells)) if (tile.test(k) && (w.shells[k] === "shell" || w.shells[k] === "star")) shells[k] = w.shells[k];
  for (const k in obj(w.trees)) if (tile.test(k) && w.trees[k] > 0) trees[k] = now + Math.min(REGROW_MS, +w.trees[k] || 0);
  // 방금 내가 흔든 나무와 주운 조개는, 주인 섬에 반영되기 전 소식이 와도 그대로 둬요
  for (const k in party.mine.trees) { if (party.mine.trees[k] > now) trees[k] = Math.max(trees[k] || 0, party.mine.trees[k]); else delete party.mine.trees[k]; }
  for (const k in party.mine.shells) { if (party.mine.shells[k] > now) delete shells[k]; else delete party.mine.shells[k]; }
  const h = obj(w.home), env = obj(w.env), style = (v, d) => typeof v === "number" || typeof v === "string" ? v : d;
  return { name: String(w.name || "친구").slice(0, 8), island: String(w.island || "").slice(0, 8), obj: objs(w.obj), floor: floors(w.floor), plants, shells, trees,
    home: { obj: objs(h.obj), floor: floors(h.floor), wall: style(h.wall, WALLS[0]), flr: style(h.flr, "wood") },
    designs: (Array.isArray(w.designs) ? w.designs : []).slice(0, 8).map(validDesign), cur: w.cur | 0,
    env: { season: SEASONS[env.season] ? env.season : "summer", night: Math.max(0, Math.min(1, +env.night || 0)), sunset: Math.max(0, Math.min(1, +env.sunset || 0)), label: String(env.label || "").slice(0, 30) },
    allow: !!w.allow };
}
function guestMsg(m) {
  if (!m || typeof m !== "object") return;
  if (m.t === "full") joinFailed("섬이 꽉 찼어요. (최대 " + PARTY_MAX + "명)");
  else if (m.t === "welcome") party.myId = String(m.you);
  else if (m.t === "world") {
    const first = party.role !== "guest", was = party.world && party.world.allow;
    party.world = cleanWorld(m.w);
    party.world.designs.forEach((d, i) => { party.visitCv[i] = paintDesign(party.visitCv[i] || document.createElement("canvas"), d); });
    if (first) enterVisit();
    else if (party.world.allow !== was) toast(party.world.allow ? "🔨 섬 주인이 꾸미기를 허락했어! 내 가방 물건을 놓을 수 있어." : "🔒 섬 주인이 꾸미기를 닫았어.");
    updateEnv(); refreshHud();
    if (build) drawBuildBar();
    partyChanged();
  } else if (m.t === "who") {
    const w = m.w && typeof m.w === "object" ? m.w : {};
    for (const id in w) if (id !== party.myId) setWho(id, w[id]);
    party.others.forEach((o, id) => { if (!w[id]) party.others.delete(id); });
    partyChanged();
  } else if (m.t === "snap") {
    party.lastSnap = Date.now();
    if (Array.isArray(m.p)) for (const e of m.p) if (Array.isArray(e) && e[0] !== party.myId) applyPos(e[0], e.slice(1));
  } else if (m.t === "built") guestBuilt(m);
  else if (m.t === "bye") partyLost("섬 주인이 모임을 끝냈어. 내 섬으로 돌아왔어.");
}
function enterVisit() {
  party.role = "guest"; party.busy = false; party.msg = ""; party.lastSnap = Date.now();
  party.back = { x: state.x, y: state.y, scene: state.scene, dir: state.dir };
  if (build) endBuild();
  fishing = null;
  worldCv = party.visitCv;
  state.scene = "island"; state.dir = "down";
  // 마을 길 위, 서로 겹치지 않게 조금씩 떨어져서 도착해요
  let x = 17.5, y = 14.6;
  for (let i = 0; i < 30; i++) { x = 14 + Math.random() * 9; y = 14.3 + Math.random() * 0.5; if (!boxSolid(x, y)) break; }
  state.x = x; state.y = y;
  closeModal();
  party.timers = [setInterval(guestTick, 120), setInterval(checkWho, 700)];
  sfx("good");
  toast("⛵ " + party.world.name + "의 " + party.world.island + " 섬에 놀러 왔어! 👋 인사해 보자.");
}
function guestTick() {
  if (Date.now() - party.lastSnap > 15000) { partyLost("연결이 끊어졌어. 내 섬으로 돌아왔어."); return; }
  const p = myPos(), key = p.join(), all = ++party.tick % 12 === 0;
  if (!all && key === party.sent.me) return;
  party.sent.me = key;
  partySend({ t: "pos", p });
}
// 모임에서 나오기 (주인이면 모임을 끝내요)
function leaveParty(msg) {
  if (!inParty() && !party.busy) return;
  const wasGuest = party.role === "guest";
  if (party.role === "host") broadcast({ t: "bye" });
  party.timers.forEach(clearInterval); party.timers = [];
  const handle = party.handle;
  setTimeout(() => { if (handle) handle.close(); }, party.role === "host" ? 300 : 0);
  party.handle = null; party.conn = null; party.role = "solo"; party.busy = false; party.code = "";
  party.guests.clear(); party.others.clear(); party.sent = {}; party.pending = {}; party.mine = { trees: {}, shells: {} };
  party.world = null; party.lastWorld = ""; party.lastWho = ""; party.emoUntil = 0; party.msg = "";
  worldCv = designCv;
  if (wasGuest) {
    if (build) endBuild();
    fishing = null;
    if (party.back) { state.x = party.back.x; state.y = party.back.y; state.scene = party.back.scene; state.dir = party.back.dir; }
    if (boxSolid(state.x, state.y)) { const st = A().start; state.x = st[0]; state.y = st[1]; }
    touch();
  }
  updateEnv(); refreshHud(); partyChanged();
  if (msg) toast(msg);
}
function partyLost(msg) { if (party.role === "guest" || party.busy) { if (party.role === "guest") leaveParty(msg); else joinFailed(msg); } }

// 손님의 꾸미기: 주인에게 부탁을 보내고, 됐다는 답이 오면 내 가방에서 꺼내요
function guestBuild(k, tt) {
  const w = party.world, a = A(), sel = build.sel, it = ITEMS[sel];
  if (!w.allow) { toast("🔒 섬 주인이 허락해야 꾸밀 수 있어. 주인에게 부탁해 봐!"); return; }
  if (a.home ? tt !== T_ROOM : (tt !== T_SAND && tt !== T_GRASS && tt !== T_PATH)) return;
  if (a.statics.has(k)) return;
  if (sel === "erase") { if (!a.obj[k] && a.floor[k] == null && !(w.plants[k] && !a.home)) return; }
  else {
    if (!it || (state.bag[sel] || 0) - (party.pending[sel] || 0) <= 0) return;
    party.pending[sel] = (party.pending[sel] || 0) + 1;
  }
  partySend({ t: "act", a: "build", s: state.scene, k, sel });
}
function guestBuilt(m) {
  const sel = String(m.sel || "");
  if (sel !== "erase") {
    party.pending[sel] = Math.max(0, (party.pending[sel] || 0) - 1);
    if (m.ok && takeItem(sel)) { sfx("put"); bump("placed"); if (!state.bag[sel] && build) build.sel = "erase"; }
  } else if (m.ok) sfx("pop");
  if (!m.ok && m.msg) toast(String(m.msg).slice(0, 60));
  if (build) drawBuildBar();
}

// ───────── 화면: 이름표와 인사 말풍선 ─────────
function drawPartyLabels(g) {
  if (!inParty()) return;
  const now = performance.now(), fs = Math.max(11, Math.round(T * 0.2));
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = fs + "px Jua, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  const tag = (name, x, y, face, until, me) => {
    const sx = offX + x * T, sy = offY + (y - 1.32) * T, w = g.measureText(name).width + fs;
    g.fillStyle = me ? "rgba(255,224,138,.92)" : "rgba(255,255,255,.88)"; rr(g, sx - w / 2, sy - fs * 0.75, w, fs * 1.5, fs * 0.7); g.fill();
    g.fillStyle = "#4a3b52"; g.fillText(name, sx, sy + 1);
    if (face && until > now) {
      const r = T * 0.34, by = sy - fs - r - Math.abs(Math.sin(now / 160)) * T * 0.05;
      g.fillStyle = "#fff"; g.strokeStyle = "#6b5876"; g.lineWidth = Math.max(2, T * 0.03);
      g.beginPath(); g.arc(sx, by, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.drawImage(emo(face), sx - r * 0.8, by - r * 0.8, r * 1.6, r * 1.6);
    }
  };
  party.others.forEach((o) => { if (o.scene === state.scene) tag(o.name, o.x, o.y, o.emo, o.emoUntil, false); });
  tag(state.name, state.x, state.y, party.emo, party.emoUntil, true);
}

// ───────── 화면: 같이 놀기 창 ─────────
function partyChanged() {
  $("party-pill").hidden = !inParty();
  if (inParty()) $("party-pill").textContent = "👥 " + (party.role === "host" ? "입장 코드 " + party.code : party.world.name + "의 섬") + " · " + partyCount() + "명";
  $("hi-btn").hidden = !inParty();
  if (!$("modal").hidden && modalKind === "party") openParty();
}
function namesHtml() {
  const names = [];
  if (party.role === "guest") names.push("🏝️ " + esc(party.world.name) + " (주인)");
  party.others.forEach((o, id) => { if (id !== "host") names.push(esc(o.name)); });
  return names.length ? names.join(", ") : "아직 아무도 없어요";
}
function openParty(view) {
  if (view != null) party.view = view;
  let html;
  if (party.role === "host") {
    html = '<p class="note">친구에게 이 입장 코드를 알려 줘요. 친구는 👥 같이 → "친구 섬에 놀러 가기"에서 코드를 넣어요.</p>' +
      '<div class="codebox">' + party.code.split("").map((c) => "<span>" + c + "</span>").join("") + "</div>" +
      '<p class="note">지금 ' + partyCount() + "명 (최대 " + PARTY_MAX + "명) · 손님: " + namesHtml() + "</p>" +
      '<div class="tabs"><button class="btn' + (party.allow ? " go" : "") + '" data-party="allow">' + (party.allow ? "🔨 손님도 꾸미기: 허락함" : "🔒 손님도 꾸미기: 안 됨") + "</button>" +
      '<button class="btn" data-party="leave">🚪 모임 끝내기</button></div>' +
      '<p class="note">허락하면 손님이 자기 가방 물건을 내 섬에 놓거나, 놓인 것을 치울 수 있어요(치운 것은 내 가방으로 와요).</p>';
  } else if (party.role === "guest") {
    html = '<p class="note">지금 <b>' + esc(party.world.name) + "의 " + esc(party.world.island) + " 섬</b>에 놀러 와 있어요. (" + partyCount() + "명)</p>" +
      '<p class="note">같이 있는 사람: ' + namesHtml() + "</p>" +
      '<p class="note">' + (party.world.allow ? "🔨 주인이 꾸미기를 허락했어요. 내 가방 물건을 놓을 수 있어요." : "🔒 꾸미기는 주인이 허락할 때만 할 수 있어요.") + " 낚시·곤충·과일로 얻은 것은 내 가방에 담겨서 내 섬으로 가져가요.</p>" +
      '<div class="tabs"><button class="btn go" data-party="leave">🏝️ 내 섬으로 돌아가기</button></div>';
  } else if (party.view === "join") {
    const d = party.input.padEnd(4, " ").split("");
    html = '<p class="note">친구가 알려 준 입장 코드(숫자 4개)를 넣어요.</p><div class="codebox">' + d.map((c) => "<span>" + (c === " " ? "" : c) + "</span>").join("") + "</div>" +
      '<div class="pad">' + "123456789".split("").map((n) => '<button class="btn" data-pad="' + n + '">' + n + "</button>").join("") +
      '<button class="btn" data-pad="back">←</button><button class="btn" data-pad="0">0</button><button class="btn go" data-party="go"' + (party.input.length === 4 && !party.busy ? "" : " disabled") + ">들어가기</button></div>" +
      '<p class="msg">' + esc(party.msg) + '</p><div class="tabs"><button class="btn small" data-party="menu">← 뒤로</button></div>';
  } else {
    html = '<p class="note">친구나 선생님과 한 섬에서 만나요. 모두 인터넷이 되어야 하고, 한 섬에 ' + PARTY_MAX + "명까지 모일 수 있어요.</p>" +
      '<div class="two"><button class="btn go bigbtn" data-party="host"' + (party.busy ? " disabled" : "") + '>🏝️<b>내 섬에 초대하기</b><small>입장 코드를 만들어요</small></button>' +
      '<button class="btn pink bigbtn" data-party="join"' + (party.busy ? " disabled" : "") + '>⛵<b>친구 섬에 놀러 가기</b><small>입장 코드를 넣어요</small></button></div><p class="msg">' + esc(party.msg) + "</p>";
  }
  openModal("party", "👥 같이 놀기", html);
}
function partyClick(d) {
  if (d.pad) {
    if (party.busy) return;
    party.input = d.pad === "back" ? party.input.slice(0, -1) : (party.input + d.pad).slice(0, 4);
    party.msg = ""; openParty();
  } else if (d.party === "host") startHost();
  else if (d.party === "join") { party.input = ""; party.msg = ""; openParty("join"); }
  else if (d.party === "menu") { party.msg = ""; openParty(""); }
  else if (d.party === "go") { if (party.input.length === 4) startJoin(party.input); }
  else if (d.party === "allow") { party.allow = !party.allow; pushWorld(true); sfx("pop"); openParty(); }
  else if (d.party === "leave") {
    const host = party.role === "host";
    leaveParty(host ? "🚪 모임을 끝냈어." : "🏝️ 내 섬으로 돌아왔어!");
    closeModal();
  }
}
// 노트북에서는 숫자 키로도 코드를 넣어요
function partyKey(e) {
  if ($("modal").hidden || modalKind !== "party" || inParty() || party.view !== "join") return false;
  if (/^[0-9]$/.test(e.key)) partyClick({ pad: e.key });
  else if (e.key === "Backspace") partyClick({ pad: "back" });
  else if (e.key === "Enter") partyClick({ party: "go" });
  else return false;
  return true;
}
function openHi() {
  openModal("hi", "👋 인사하기", '<p class="note">눌러서 인사해요. 내 머리 위에 말풍선으로 보여요.</p><div class="grid">' +
    EMOTES.map(([e, n]) => '<button class="cell" data-emo="' + e + '"><span class="em">' + e + "</span>" + n + "</button>").join("") + "</div>");
}
