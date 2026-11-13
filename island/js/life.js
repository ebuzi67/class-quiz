"use strict";
// 몽글몽글 섬 3단계: 섬 친구, 곤충 잡기, 꽃 키우기, 사진 찍기
// (state, toast, addItem 같은 것은 game.js에 있고, 여기 함수들은 게임이 시작된 뒤에 불려요)

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// ───────── 섬 친구 ─────────
const pals = {};
function initPals() {
  const isle = A("island");
  for (const id in FRIENDS) {
    let [hx, hy] = FRIENDS[id].home;
    // 집 자리가 막혀 있으면 가까운 빈 땅을 찾아요
    search: for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (!solid(hx + dx, hy + dy, isle)) { hx += dx; hy += dy; break search; }
    }
    pals[id] = { id, hx: hx + 0.5, hy: hy + 0.5, x: hx + 0.5, y: hy + 0.5, tx: null, ty: 0, wait: rand(0, 3), moving: false };
  }
}
function palState(id) { return state.pals[id] || (state.pals[id] = { p: 0, req: null, reqAt: 0, giftAt: 0, got: 0 }); }
function palHearts(id) { return Math.min(5, Math.floor(palState(id).p / 3)); }
function palSolid(x, y) {
  const a = A("island");
  return solid(Math.floor(x - 0.22), Math.floor(y - 0.15), a) || solid(Math.floor(x + 0.22), Math.floor(y - 0.15), a) ||
    solid(Math.floor(x - 0.22), Math.floor(y + 0.1), a) || solid(Math.floor(x + 0.22), Math.floor(y + 0.1), a);
}
function updatePals(dt) {
  for (const id in pals) {
    const p = pals[id];
    p.moving = false;
    if (Math.hypot(p.x - state.x, p.y - state.y) < 0.9) { p.wait = Math.max(p.wait, 0.6); continue; }   // 내가 가까이 오면 멈춰서 기다려요
    if (p.wait > 0) { p.wait -= dt; continue; }
    if (p.tx == null) { p.tx = p.hx + rand(-3.5, 3.5); p.ty = p.hy + rand(-2.5, 2.5); }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d < 0.1) { p.tx = null; p.wait = rand(1.5, 5); continue; }
    const nx = p.x + dx / d * 1.1 * dt, ny = p.y + dy / d * 1.1 * dt;
    if (palSolid(nx, ny)) { p.tx = null; p.wait = rand(0.5, 2); continue; }
    p.x = nx; p.y = ny; p.moving = true;
  }
}
function nearestPal() {
  const [dx, dy] = DIRS[state.dir];
  let best = null, bd = 1.25;
  for (const id in pals) {
    const d = Math.hypot(pals[id].x - (state.x + dx * 0.5), pals[id].y - (state.y + dy * 0.5));
    if (d < bd) { bd = d; best = id; }
  }
  return best;
}
// 지금 계절에 구할 수 있는 물건만 부탁해요
function makeRequest(id) {
  const pool = FRIENDS[id].pool.filter((it) => !ITEMS[it].seasons || ITEMS[it].seasons.includes(ENV.season));
  const item = pickOne(pool), kind = ITEMS[item].k;
  const n = kind === "fruit" ? 2 + Math.floor(Math.random() * 2) : sellPrice(item) >= 300 ? 1 : 1 + Math.floor(Math.random() * 2);
  return { item, n };
}
function questReward(req) { return sellPrice(req.item) * req.n + 150 + 50 * req.n; }
function heartsHtml(id) { const h = palHearts(id); return "❤️".repeat(h) + "🤍".repeat(5 - h); }
function openTalk(id, said) {
  const f = FRIENDS[id], ps = palState(id), now = Date.now();
  if (!ps.req && now >= ps.reqAt) { ps.req = makeRequest(id); touch(); }
  let line = said;
  if (!line) {
    if (ps.req) { const it = ITEMS[ps.req.item]; line = f.ask.replace("{item}", it.e + " " + it.n + " " + ps.req.n + "개"); }
    else {
      const extra = ENV.night > 0.5 ? ["하암… 밤이 깊었네. 별이 예쁘다."] : ENV.season === "winter" ? ["눈이 온다! 눈사람 만들고 싶어."] : ENV.season === "autumn" ? ["단풍이 정말 예쁜 가을이야."] : ENV.season === "spring" ? ["꽃잎이 날려! 봄이 왔어."] : ["여름 바다는 반짝반짝해!"];
      line = pickOne(f.lines.concat(extra));
    }
  }
  let html = '<div class="talk"><div class="face">' + f.e + '</div><div class="bubble"><b>' + f.n + '</b> <span class="hearts">' + heartsHtml(id) + '</span><p>' + line + "</p></div></div>" +
    '<p class="note">' + f.n + "는 " + f.favName + "을(를) 좋아해요. 부탁을 들어주거나 선물을 하면 하트가 늘고, 하트가 1·3·5개가 되면 특별한 선물을 받아요.</p><div class=\"tabs\">";
  if (ps.req) {
    const have = state.bag[ps.req.item] || 0, it = ITEMS[ps.req.item];
    html += '<button class="btn pink" data-give="' + id + '"' + (have >= ps.req.n ? "" : " disabled") + ">" + it.e + " 건네주기 (" + Math.min(have, ps.req.n) + "/" + ps.req.n + ") → 💰 " + questReward(ps.req) + "</button>";
  }
  html += '<button class="btn" data-gift="' + id + '"' + (now < ps.giftAt || !bagCount() ? " disabled" : "") + ">💝 선물하기</button>" +
    '<button class="btn" data-bye="1">👋 안녕!</button></div>';
  openModal("talk", "💬 " + f.n, html);
}
function palLevelUp(id, before) {
  const f = FRIENDS[id], ps = palState(id), h = palHearts(id);
  for (const lv of [1, 3, 5]) {
    if (lv <= before || lv > h || ps.got >= lv) continue;
    ps.got = lv;
    const g = f.gifts[lv];
    if (g.startsWith("h:")) {
      const hid = g.slice(2);
      if (!state.hats.includes(hid)) state.hats.push(hid);
      showCard('<div class="big">' + HATS[hid].e + "</div><b>" + HATS[hid].n + '</b><span>' + f.n + '가 우정의 선물을 줬어! 👗 옷장에서 써 봐.</span><i class="new">❤️ 하트 ' + lv + "개 달성!</i>");
    } else {
      if (!addItem(g)) { ps.got = lv - 1; toast("가방이 꽉 차서 선물을 못 받았어. 비우고 다시 말을 걸어 봐!"); return; }
      showCard('<div class="big">' + ITEMS[g].e + "</div><b>" + ITEMS[g].n + '</b><span>' + f.n + '가 우정의 선물을 줬어! 가방에 들어 있어.</span><i class="new">❤️ 하트 ' + lv + "개 달성!</i>");
    }
    sfx("good");
    return;
  }
}
function giveQuest(id) {
  const ps = palState(id), req = ps.req;
  if (!req || (state.bag[req.item] || 0) < req.n) return;
  const before = palHearts(id);
  for (let i = 0; i < req.n; i++) takeItem(req.item);
  state.coins += questReward(req);
  ps.p += 2; ps.req = null; ps.reqAt = Date.now() + QUEST_MS;
  sfx("coin"); bump("quest");
  openTalk(id, FRIENDS[id].thanks + " (💰 " + questReward(req) + " 받았어!)");
  palLevelUp(id, before);
}
function openGift(id) {
  const f = FRIENDS[id];
  let html = '<p class="note">' + f.n + "에게 줄 선물을 골라요. " + f.favName + '을(를) 주면 더 좋아해요!</p><div class="grid">';
  for (const it in state.bag) html += '<button class="cell" data-giftitem="' + it + '" data-to="' + id + '"><span class="em">' + ITEMS[it].e + "</span>" + ITEMS[it].n + '<i class="cnt">' + state.bag[it] + "</i></button>";
  openModal("talk", "💝 " + f.n + "에게 선물하기", html + "</div>");
}
function giveGift(id, item) {
  const f = FRIENDS[id], ps = palState(id), before = palHearts(id);
  if (!takeItem(item)) return;
  const loved = f.fav.includes(itemKind(item)), trash = ITEMS[item].k === "trash";
  ps.p += trash ? 0 : loved ? 2 : 1;
  ps.giftAt = Date.now() + GIFT_MS;
  sfx(trash ? "fail" : "good"); touch();
  openTalk(id, trash ? "어… 이건 쓰레기잖아…? 그, 그래도 마음은 고마워." : loved ? "우와아! 내가 제일 좋아하는 거야! 정말 고마워! 💕" : "나한테 주는 거야? 고마워, 잘 간직할게!");
  palLevelUp(id, before);
}

// ───────── 곤충 ─────────
const bugs = [];
let bugTimer = 3;
function bugPool() {
  const night = ENV.night > 0.5;
  return Object.keys(ITEMS).filter((id) => {
    const it = ITEMS[id];
    return it.k === "bug" && (it.when === "any" || (it.when === "night") === night) && (!it.seasons || it.seasons.includes(ENV.season));
  });
}
function spawnBug() {
  const pool = bugPool();
  if (!pool.length) return;
  let r = Math.random() * pool.reduce((s, id) => s + ITEMS[id].w, 0), id = pool[0];
  for (const p of pool) { r -= ITEMS[p].w; if (r <= 0) { id = p; break; } }
  const isle = A("island");
  for (let tries = 0; tries < 30; tries++) {
    const a = rand(0, Math.PI * 2), d = rand(5, 10), x = state.x + Math.cos(a) * d, y = state.y + Math.sin(a) * d * 0.7;
    const t = isle.at(Math.floor(x), Math.floor(y));
    if (t !== T_GRASS && t !== T_SAND && t !== T_PATH) continue;
    if (!ITEMS[id].fly && solid(Math.floor(x), Math.floor(y), isle)) continue;
    bugs.push({ id, x, y, a: rand(0, 6.28), seed: rand(0, 6.28), life: rand(40, 80), fade: 0, rise: 0, gone: false, pause: 0 });
    return;
  }
}
function updateBugs(dt) {
  if ((bugTimer -= dt) <= 0) { bugTimer = rand(4, 9); if (bugs.length < 6) spawnBug(); }
  const isle = A("island");
  for (let i = bugs.length - 1; i >= 0; i--) {
    const b = bugs[i], it = ITEMS[b.id], far = Math.hypot(b.x - state.x, b.y - state.y);
    b.life -= dt;
    if (b.gone) {   // 놀라서 달아나는 중
      b.rise += dt * 2.5; b.fade -= dt * 1.2; b.x += Math.cos(b.a) * 4 * dt; b.y += Math.sin(b.a) * 4 * dt;
      if (b.fade <= 0) bugs.splice(i, 1);
      continue;
    }
    b.fade = Math.min(1, b.fade + dt * 2);
    if (far > 22 || (b.life <= 0 && far > 9)) { bugs.splice(i, 1); continue; }
    if (it.fly) {
      b.a += Math.sin(time * 1.3 + b.seed) * 2.2 * dt;
      const nx = b.x + Math.cos(b.a) * 1.3 * dt, ny = b.y + Math.sin(b.a) * 1.0 * dt, t = isle.at(Math.floor(nx), Math.floor(ny));
      if (t === T_SEA || t === T_SHALLOW) b.a += Math.PI * 0.6; else { b.x = nx; b.y = ny; }
    } else {
      if (b.pause > 0) { b.pause -= dt; continue; }
      const nx = b.x + Math.cos(b.a) * 0.35 * dt, ny = b.y + Math.sin(b.a) * 0.35 * dt;
      if (solid(Math.floor(nx), Math.floor(ny), isle)) b.a += rand(1.5, 3.5);
      else { b.x = nx; b.y = ny; }
      if (Math.random() < dt * 0.4) { b.pause = rand(0.5, 2.5); b.a += rand(-1, 1); }
    }
  }
}
function nearestBug() {
  const [dx, dy] = DIRS[state.dir];
  let best = null, bd = 1.3;
  for (const b of bugs) {
    if (b.gone) continue;
    const d = Math.hypot(b.x - (state.x + dx * 0.5), b.y - (state.y + dy * 0.5));
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
function catchBug(b) {
  const it = ITEMS[b.id];
  if (bagCount() >= BAG_MAX) { toast("가방이 꽉 찼어! 상점에서 팔고 오자 🎒"); return; }
  if (Math.random() > it.catch) {
    b.gone = true; b.a = Math.atan2(b.y - state.y, b.x - state.x);
    sfx("fail"); toast(it.fly ? "앗, 팔랑팔랑 날아가 버렸어!" : "앗, 쏙 숨어 버렸어!");
    return;
  }
  bugs.splice(bugs.indexOf(b), 1);
  addItem(b.id);
  const isNew = found(b.id);
  sfx("good");
  showCard('<div class="big">' + it.e + "</div><b>" + it.n + "를 잡았다!</b><span>💰 " + it.sell.toLocaleString() + "</span>" + (isNew ? '<i class="new">✨ 도감에 새로 등록!</i>' : ""));
  bump("bug");
}

// ───────── 꽃 키우기 ─────────
// plants["x,y"] = { s: 0 씨앗 / 1 새싹 / 2 꽃, at: 물 준 시각(0이면 물이 필요), kind: 핀 꽃 }
function growPlants() {
  if (!state.plants) return;
  const now = Date.now();
  for (const k in state.plants) {
    const pl = state.plants[k];
    if (pl.s >= 2 || !pl.at || now - pl.at < GROW_MS) continue;
    pl.s++; pl.at = 0;
    if (pl.s === 2) {
      let r = Math.random() * BLOOMS.reduce((s, b) => s + b[1], 0);
      for (const [id, w] of BLOOMS) { r -= w; if (r <= 0) { pl.kind = id; break; } }
      pl.kind = pl.kind || "daisy";
    }
    touch();
  }
}
function plantAction(k) {
  const plants = W().plants, pl = plants[k];
  // 친구 섬에서는 주인이 허락해야 꽃을 돌볼 수 있어요
  if (isGuest() && !W().allow) return { label: "🔒 주인의 꽃", fn: () => toast("섬 주인의 꽃이야. 주인이 꾸미기를 허락하면 돌볼 수 있어!") };
  if (pl.s === 2) {
    return { label: ITEMS[pl.kind].e + " 꽃 따기", fn: () => {
      if (!addItem(pl.kind)) { toast("가방이 꽉 찼어! 🎒"); return; }
      delete plants[k];
      partySend({ t: "act", a: "plant", k, op: "pick" });
      const it = ITEMS[pl.kind], isNew = found(pl.kind), [x, y] = k.split(",").map(Number);
      float(it.e, x, y); sfx("good");
      toast(it.e + " " + it.n + "을(를) 땄어!" + (isNew ? " (도감에 새로 등록 ✨)" : "") + (pl.kind === "bouquet" || pl.kind === "hibiscus" ? " 아주 귀한 꽃이야!" : ""));
      bump("flower");
    } };
  }
  if (!pl.at) {
    return { label: "💧 물 주기", fn: () => {
      pl.at = Date.now(); touch(); sfx("splash");
      partySend({ t: "act", a: "plant", k, op: "water" });
      const [x, y] = k.split(",").map(Number);
      float("💧", x, y);
      toast(pl.s ? "쑥쑥! 1분쯤 뒤에 꽃이 필 거야 🌸" : "촉촉해졌어! 1분쯤 뒤에 싹이 틀 거야 🌱");
    } };
  }
  if (isGuest()) return { label: "🌱 자라는 중", fn: () => toast("쑥쑥 자라는 중이야!") };
  return { label: "🌱 자라는 중", fn: () => toast("쑥쑥 자라는 중이야. " + Math.max(1, Math.ceil((GROW_MS - (Date.now() - pl.at)) / 1000)) + "초쯤 남았어!") };
}

// ───────── 사진 찍기 ─────────
function takePhoto() {
  render();
  const c = document.createElement("canvas");
  c.width = canvas.width; c.height = canvas.height;
  const g = c.getContext("2d"), fs = Math.round(20 * dpr), text = "🏝️ " + state.island + " 섬 · " + state.name;
  g.drawImage(canvas, 0, 0);
  g.font = fs + "px Jua, sans-serif";
  const w = g.measureText(text).width + fs * 1.4;
  g.fillStyle = "rgba(255,248,234,.92)"; rr(g, fs * 0.6, c.height - fs * 2.6, w, fs * 2, fs); g.fill();
  g.fillStyle = "#4a3b52"; g.textBaseline = "middle"; g.fillText(text, fs * 1.3, c.height - fs * 1.55);
  $("flash").hidden = false;
  setTimeout(() => { $("flash").hidden = true; }, 350);
  sfx("put"); bump("photo");
  c.toBlob(async (blob) => {
    if (!blob) return;
    const name = "monggle-island-" + Date.now() + ".png", file = new File([blob], name, { type: "image/png" });
    // 태블릿·휴대폰은 공유 창(사진에 저장 등)을 띄우고, 노트북은 파일로 내려받아요
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "몽글몽글 섬" }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("📸 찰칵! 사진을 저장했어 (내려받기 폴더).");
  }, "image/png");
}
