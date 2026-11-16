"use strict";
// 몽글몽글 섬: 놀이 (낚시 대회, 곤충 대회, 보물찾기), 매일 선물
// 놀이는 혼자서도 할 수 있고, 같이 놀 때는 섬 주인이 시작해요. 점수는 주인 기기가 모아서 순위를 보내요.

const GAMES = {
  fish: { n: "낚시 대회", e: "🎣", sec: 180, tip: "3분 동안 물고기를 낚아 점수를 모아요. 귀한 물고기일수록 점수가 커요!" },
  bug:  { n: "곤충 대회", e: "🦋", sec: 180, tip: "3분 동안 곤충을 잡아 점수를 모아요. 대회 중에는 곤충이 많이 나와요!" },
  hunt: { n: "보물찾기", e: "🗺️", sec: 240, tip: "섬에 숨은 보물 6개를 찾아요. 가까이 갈수록 🔥 뜨거워져요. 바로 위에서 ⛏️ 파기!" }
};
const PRIZES = [500, 300, 200];
let game = null;   // { kind, endAt, score, rank: [[이름, 점수, id]], tr: [{x, y, f}], scores: {id: 점수} }

function gameLeft() { return game ? Math.max(0, game.endAt - Date.now()) : 0; }
function myGameId() { return party.role === "guest" ? party.myId : "host"; }
function gameName(id) { return id === myGameId() ? state.name : (party.others.get(id) || { name: "친구" }).name; }
function pickTreasures() {
  const isle = A("island"), out = [];
  for (let tries = 0; tries < 4000 && out.length < 6; tries++) {
    const x = 4 + Math.floor(Math.random() * (MW - 8)), y = 4 + Math.floor(Math.random() * (MH - 8)), t = isle.at(x, y);
    if ((t !== T_GRASS && t !== T_SAND && t !== T_PATH) || solid(x, y, isle)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 6)) continue;
    out.push({ x, y, f: false });
  }
  return out;
}
function startGame(kind) {
  if (game || isGuest() || !GAMES[kind]) return;
  if (state.scene !== "island") { toast("놀이는 섬 밖(마을)에서 시작해요. 집에서 나와 줘!"); return; }
  game = { kind, endAt: Date.now() + GAMES[kind].sec * 1000, score: 0, rank: [], scores: {}, tr: kind === "hunt" ? pickTreasures() : [] };
  if (party.role === "host") broadcast({ t: "game", g: { kind, left: gameLeft(), tr: game.tr } });
  closeModal(); sfx("good");
  toast(GAMES[kind].e + " " + GAMES[kind].n + " 시작! " + GAMES[kind].tip);
  showGameBar();
}
function gameScore(kind, pts) {
  if (!game || game.kind !== kind || pts <= 0) return;
  game.score += pts;
  float("⭐", state.x - 0.5, state.y - 1.3);
  partySend({ t: "score", s: game.score });
  showGameBar();
}
function buildRank() {
  const list = [["host", game.score]];
  party.guests.forEach((g, id) => list.push([id, game.scores[id] || 0]));
  return list.sort((a, b) => b[1] - a[1]).map(([id, s]) => [gameName(id), s, id]);
}
function endGame(rank) {
  if (!game) return;
  const g = game, me = myGameId(), place = rank.findIndex((r) => r[2] === me);
  game = null;
  $("game-bar").hidden = true;
  const many = rank.length > 1, prize = many ? (PRIZES[place] || 100) : 100 + Math.min(900, g.score * (g.kind === "hunt" ? 50 : 1));
  state.best = state.best || {};
  const record = !many && g.score > (state.best[g.kind] || 0);
  if (record) state.best[g.kind] = g.score;
  state.coins += prize; bump("game"); sfx("good");
  const medal = ["🥇", "🥈", "🥉"], unit = g.kind === "hunt" ? "개" : "점";
  let html = '<p class="note">' + GAMES[g.kind].e + " " + GAMES[g.kind].n + " 끝! " + (many ? "순위를 볼까요?" : "내 점수는 " + g.score + unit + (record ? " · 🏆 새 기록!" : " (최고 기록 " + (state.best[g.kind] || 0) + unit + ")")) + "</p>";
  rank.forEach((r, i) => { html += '<div class="mission' + (r[2] === me ? " mine" : "") + '"><span class="em">' + (medal[i] || (i + 1) + "등") + '</span><div class="mid">' + esc(r[0]) + "</div><b>" + r[1] + unit + "</b></div>"; });
  html += '<p class="note">🎁 상으로 코인 ' + prize + '개를 받았어요!</p><div class="tabs"><button class="btn go" data-bye="1">좋아!</button></div>';
  openModal("result", "🏆 " + GAMES[g.kind].n + " 결과", html);
}
function stopGame() {   // 주인이나 혼자 하는 사람이 도중에 그만둘 때
  if (!game || isGuest()) return;
  const rank = buildRank();
  if (party.role === "host") broadcast({ t: "gameEnd", r: rank });
  endGame(rank);
}
// 0.5초마다: 시간 확인, 순위 보내기, 위쪽 띠 고치기
function playTick() {
  if (!game) return;
  if (!isGuest()) {
    game.rank = buildRank();
    if (party.role === "host") broadcast({ t: "rank", r: game.rank, left: gameLeft() });
    if (gameLeft() <= 0 || (game.kind === "hunt" && game.tr.length && game.tr.every((t) => t.f))) { stopGame(); return; }
  } else if (gameLeft() <= -5000) { game = null; $("game-bar").hidden = true; return; }   // 주인 소식이 끊겼을 때
  showGameBar();
}
function nearestTreasure() {
  if (!game || game.kind !== "hunt" || state.scene !== "island") return null;
  let best = null, bd = 1e9;
  game.tr.forEach((t, i) => { if (t.f) return; const d = Math.hypot(t.x + 0.5 - state.x, t.y + 0.5 - state.y); if (d < bd) { bd = d; best = { i, d, t }; } });
  return best;
}
function showGameBar() {
  if (!game) return;
  const g = GAMES[game.kind], left = Math.ceil(gameLeft() / 1000), medal = ["🥇", "🥈", "🥉"];
  let text = g.e + " " + g.n + " · ⏱️ " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  if (game.kind === "hunt") {
    const n = nearestTreasure(), found = game.tr.filter((t) => t.f).length;
    text += " · 찾은 보물 " + found + "/" + game.tr.length + " · " + (!n ? "섬 밖으로 나가 봐!" : n.d < 1.2 ? "⛏️ 바로 여기야!" : n.d < 3 ? "🔥🔥🔥 아주 뜨거워!" : n.d < 6 ? "🔥 따뜻해" : n.d < 10 ? "🙂 미지근해" : "❄️ 차가워");
  } else text += " · 내 점수 " + game.score;
  if (game.rank.length > 1) text += " · " + game.rank.slice(0, 3).map((r, i) => medal[i] + r[0] + " " + r[1]).join(" ");
  $("game-bar").textContent = text;
  $("game-bar").hidden = false;
}
function digTreasure(i) {
  const t = game && game.tr[i];
  if (!t || t.f) return;
  t.f = true;
  const coins = 150 + Math.floor(Math.random() * 16) * 10;
  state.coins += coins; touch(); refreshHud(); sfx("good");
  float("💰", t.x, t.y);
  showCard('<div class="big">🎁</div><b>보물을 찾았다!</b><span>코인 ' + coins + "개가 들어 있었어.</span>");
  game.score++;
  if (party.role === "host") broadcast({ t: "dug", i }); else partySend({ t: "dig", i, s: game.score });
  sendFx(["got", "bouquet"]);
  showGameBar();
}
// 같이 놀 때 주고받는 소식
function playHostMsg(id, m) {
  if (!game) return;
  if (m.t === "score") game.scores[id] = Math.max(0, Math.min(99999, m.s | 0));
  else if (m.t === "dig") {
    const t = game.tr[m.i | 0];
    game.scores[id] = Math.max(0, Math.min(99, m.s | 0));
    if (t && !t.f) { t.f = true; toast("🎁 " + gameName(id) + " 님이 보물을 찾았어!"); }
    broadcast({ t: "dug", i: m.i | 0, id });
  }
}
function playGuestMsg(m) {
  if (m.t === "game" && m.g && GAMES[m.g.kind]) {
    const tr = (Array.isArray(m.g.tr) ? m.g.tr : []).slice(0, 10).map((t) => ({ x: t.x | 0, y: t.y | 0, f: !!t.f }));
    game = { kind: m.g.kind, endAt: Date.now() + Math.max(0, Math.min(600000, +m.g.left || 0)), score: 0, rank: [], scores: {}, tr };
    sfx("good"); toast(GAMES[game.kind].e + " " + GAMES[game.kind].n + " 시작! " + GAMES[game.kind].tip);
    showGameBar();
  } else if (m.t === "rank" && game && Array.isArray(m.r)) {
    game.rank = m.r.slice(0, PARTY_MAX).map((r) => [String(r[0]).slice(0, 8), r[1] | 0, String(r[2])]);
    game.endAt = Date.now() + Math.max(0, Math.min(600000, +m.left || 0));
  } else if (m.t === "dug" && game) {
    const t = game.tr[m.i | 0];
    if (t && !t.f) { t.f = true; if (m.id !== party.myId) toast("🎁 누가 보물을 찾았어! 남은 보물을 찾아보자."); }
  } else if (m.t === "gameEnd" && game && Array.isArray(m.r)) endGame(m.r.slice(0, PARTY_MAX).map((r) => [String(r[0]).slice(0, 8), r[1] | 0, String(r[2])]));
}
function playOnJoin(conn) { if (game) conn.send({ t: "game", g: { kind: game.kind, left: gameLeft(), tr: game.tr } }); }
function playReset() { game = null; $("game-bar").hidden = true; }
// 같이 놀기 창에 붙는 "놀이" 칸
function playMenuHtml() {
  if (game) return '<h3>🎮 놀이</h3><p class="note">' + GAMES[game.kind].e + " " + GAMES[game.kind].n + " 하는 중이에요." + (isGuest() ? "" : ' <button class="btn small" data-game="stop">그만하기</button>') + "</p>";
  let html = '<h3>🎮 놀이</h3><div class="tabs">';
  if (!isGuest()) for (const k in GAMES) html += '<button class="btn" data-game="' + k + '">' + GAMES[k].e + " " + GAMES[k].n + "</button>";
  html += '<button class="btn" data-game="jump">🏁 점프맵</button></div>';
  return html + '<p class="note">' + (isGuest() ? "대회와 보물찾기는 섬 주인이 시작해요. 점프맵은 언제든 할 수 있어요." : inParty() ? "시작하면 섬에 있는 모두가 함께 겨뤄요. 끝나면 순위와 상이 나와요." : "혼자서 기록에 도전해요. 👥 친구를 초대하면 함께 겨룰 수 있어요.") + "</p>";
}

// ───────── 매일 선물 ─────────
const DAILY = [["💰", "코인 300"], ["🌱", "꽃씨 3개"], ["💰", "코인 500"], ["🎁", "꾸미기 물건"], ["💰", "코인 700"], ["🛋️", "가구"], ["👑", "코인 2000"]];
function dayKey(ms) { const d = new Date(ms); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function giveDaily(i) {
  const coin = [300, 0, 500, 0, 700, 0, 2000][i];
  if (coin) { state.coins += coin; return "💰 코인 " + coin + "개"; }
  if (i === 1) return addItem("seed", 3) ? "🌱 꽃씨 3개" : (state.coins += 100, "💰 코인 100개 (가방이 꽉 차서)");
  const pool = shopList(i === 3 ? "out" : "in", ENV.season).filter((id) => ITEMS[id].buy <= (i === 3 ? 600 : 1500) && ITEMS[id].k === "decor");
  const id = pool[Math.floor(Math.random() * pool.length)];
  return addItem(id) ? ITEMS[id].e + " " + ITEMS[id].n : (state.coins += 300, "💰 코인 300개 (가방이 꽉 차서)");
}
function checkDaily() {
  if (!state.started || modalOpen() || build || fishing || pose || game || jumpOpen() || !$("card").hidden) return;
  const today = dayKey(Date.now()), d = state.daily || (state.daily = { day: "", streak: 0 });
  if (d.day === today) return;
  d.streak = d.day === dayKey(Date.now() - 86400000) ? d.streak + 1 : 1;
  d.day = today;
  const i = (d.streak - 1) % 7, got = giveDaily(i);
  touch(); refreshHud(); sfx("good");
  let html = '<div class="talk"><div class="face">🐱</div><div class="bubble"><b>모카</b><p>오늘도 와 줬구나냥! 출석 선물이다냥. (' + d.streak + '일째 연속 출석)</p></div></div><div class="daily">';
  DAILY.forEach(([e, n], k) => { html += '<div class="day' + (k < i ? " done" : k === i ? " today" : "") + '"><small>' + (k + 1) + "일</small><span>" + (k < i ? "✅" : e) + "</span><small>" + n + "</small></div>"; });
  html += '</div><p class="note">오늘 받은 선물: <b>' + got + '</b><br>매일 오면 더 좋은 선물을 받아요. 하루를 빠지면 1일부터 다시 시작해요.</p><div class="tabs"><button class="btn go" data-bye="1">고마워!</button></div>';
  openModal("daily", "🎁 오늘의 선물", html);
}
