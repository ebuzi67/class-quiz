"use strict";
// 몽글몽글 섬: 그림 그리는 곳. 모든 길이는 "땅 한 칸 = 1" 단위예요.

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const emoCache = new Map();
function emo(e) {
  let c = emoCache.get(e);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d");
    g.font = "74px " + EMOJI_FONT;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(e, 48, 53);
    emoCache.set(e, c);
  }
  return c;
}
// 아래쪽 가운데(cx, by)를 기준으로 그림 문자를 그려요
function drawEmo(g, e, cx, by, s) { g.drawImage(emo(e), cx - s / 2, by - s, s, s); }

function ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function shadow(g, cx, y, rx) { g.fillStyle = "rgba(40,60,40,.2)"; ell(g, cx, y, rx, rx * 0.35); }

// 내 디자인 8칸을 작은 그림(16x16)으로 만들어 둬요
const designCv = [];
// 땅·벽·이젤에 그릴 때 쓰는 그림들. 친구 섬에 놀러 가면 그 섬 주인의 그림으로 바뀌어요.
let worldCv = designCv;
function paintDesign(c, code) {
  c.width = c.height = 16;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 16, 16);
  if (!code) return c;
  for (let p = 0; p < 256; p++) {
    const ch = code.charCodeAt(p) - 97;
    if (ch < 0 || ch >= PALETTE.length) continue;
    g.fillStyle = PALETTE[ch];
    g.fillRect(p % 16, p >> 4, 1, 1);
  }
  return c;
}
function refreshDesign(i, code) { paintDesign(designCv[i] || (designCv[i] = document.createElement("canvas")), code); }

// 지금 계절과 밤낮 (game.js가 채워요)
const ENV = { season: "summer", night: 0, sunset: 0, label: "" };
const GRASS = { spring: ["#9fe07c", "#97da74"], summer: ["#92d672", "#8bd06b"], autumn: ["#c3d273", "#bbcb6b"], winter: ["#f2f6fb", "#e8eff7"] };
const LEAF = { spring: ["#7fd27c", "#9be08f"], summer: ["#4dab59", "#68c56c"], winter: ["#dbe6f0", "#ffffff"] };
const AUTUMN = [["#e9963b", "#f3b55a"], ["#dc6f3c", "#ee9562"], ["#e8b93b", "#f5d46a"]];

function drawTile(g, world, x, y, time) {
  const t = world.at(x, y), h = tileHash(x, y);
  if (t === T_SEA || t === T_SHALLOW || t === T_WATER || t === T_BRIDGE) {
    g.fillStyle = t === T_SEA ? "#49a6e0" : t === T_SHALLOW ? "#74c4ee" : "#69bfec";
    g.fillRect(x, y, 1, 1);
    if (h % 4 === 0) {
      const w = Math.sin(time * 1.6 + h % 7) * 0.08;
      g.fillStyle = "rgba(255,255,255,.45)";
      rr(g, x + 0.2 + w, y + 0.3 + (h % 5) * 0.1, 0.4, 0.06, 0.03); g.fill();
    }
    if (t === T_SHALLOW) {
      // 파도 거품
      const f = 0.08 + Math.sin(time * 2 + (x + y) * 0.7) * 0.04;
      g.fillStyle = "rgba(255,255,255,.75)";
      const land = (tt) => tt === T_SAND || tt === T_GRASS || tt === T_PATH;
      if (land(world.at(x, y - 1))) g.fillRect(x, y, 1, f);
      if (land(world.at(x, y + 1))) g.fillRect(x, y + 1 - f, 1, f);
      if (land(world.at(x - 1, y))) g.fillRect(x, y, f, 1);
      if (land(world.at(x + 1, y))) g.fillRect(x + 1 - f, y, f, 1);
    }
    if (t === T_BRIDGE) {
      g.fillStyle = "#c9955c"; g.fillRect(x, y + 0.06, 1, 0.88);
      g.fillStyle = "#a87745";
      for (let i = 0; i < 4; i++) g.fillRect(x + i * 0.25, y + 0.06, 0.03, 0.88);
      g.fillStyle = "#8a5a35"; g.fillRect(x, y, 1, 0.1); g.fillRect(x, y + 0.9, 1, 0.1);
    }
    return;
  }
  if (t === T_SAND) {
    g.fillStyle = "#f7e4ac"; g.fillRect(x, y, 1, 1);
    if (h % 3 === 0) { g.fillStyle = "#ecd28e"; ell(g, x + 0.2 + (h % 6) * 0.1, y + 0.25 + (h % 5) * 0.12, 0.04, 0.03); }
    return;
  }
  if (t === T_PATH) {
    g.fillStyle = "#ecd3a0"; g.fillRect(x, y, 1, 1);
    g.fillStyle = "#dfc189";
    ell(g, x + 0.3 + (h % 4) * 0.1, y + 0.3, 0.09, 0.06); ell(g, x + 0.6, y + 0.65 + (h % 3) * 0.08, 0.07, 0.05);
    return;
  }
  const se = ENV.season;
  g.fillStyle = GRASS[se][(x + y) & 1]; g.fillRect(x, y, 1, 1);
  if (se === "winter") {
    if (h % 6 === 0) { g.fillStyle = "#dbe6f2"; ell(g, x + 0.3 + (h % 5) * 0.1, y + 0.5, 0.12, 0.05); }
    return;
  }
  if (se === "autumn" && h % 9 === 0) {
    g.fillStyle = AUTUMN[h % 3][0]; g.beginPath(); g.ellipse(x + 0.3 + (h % 5) * 0.1, y + 0.6, 0.07, 0.04, h % 3, 0, Math.PI * 2); g.fill();
    return;
  }
  if (h % 5 === 0) {
    g.fillStyle = se === "autumn" ? "#a3b85a" : "#74bd58";
    const ox = x + 0.2 + (h % 6) * 0.1, oy = y + 0.3 + (h % 4) * 0.13;
    g.fillRect(ox, oy, 0.04, 0.13); g.fillRect(ox + 0.09, oy + 0.03, 0.04, 0.1);
  } else if (h % 23 === 0 || (se === "spring" && h % 11 === 0)) {
    g.fillStyle = se === "spring" && h % 2 ? "#ffc1d6" : "#fff"; ell(g, x + 0.5, y + 0.5, 0.07, 0.07);
    g.fillStyle = "#ffd84d"; ell(g, x + 0.5, y + 0.5, 0.03, 0.03);
  }
}

function drawFloor(g, f, x, y) {
  if (f === "rug") {
    g.fillStyle = "#c9a3f0"; ell(g, x + 0.5, y + 0.5, 0.49, 0.44);
    g.fillStyle = "#e3cdfa"; ell(g, x + 0.5, y + 0.5, 0.36, 0.31);
    g.fillStyle = "#fff"; ell(g, x + 0.5, y + 0.5, 0.14, 0.12);
  } else if (f === "s" || f === "stone") {
    g.fillStyle = "#c9ced8"; rr(g, x + 0.1, y + 0.14, 0.8, 0.72, 0.28); g.fill();
    g.fillStyle = "#e2e6ee"; rr(g, x + 0.16, y + 0.18, 0.6, 0.45, 0.2); g.fill();
  } else if (worldCv[f]) {
    g.drawImage(worldCv[f], x, y, 1, 1);
  }
}

function drawTree(g, st, x, y, ready, shake) {
  const cx = x + 0.5, ox = shake > 0 ? Math.sin(shake * 45) * 0.06 : 0;
  shadow(g, cx, y + 0.9, 0.42);
  if (st.t === "pine") {
    g.fillStyle = "#9a6a40"; g.fillRect(cx - 0.08, y + 0.55, 0.16, 0.35);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = ["#3f9f6c", "#47ab75", "#52b87f"][i];
      const w = 0.5 - i * 0.1, top = y - 0.75 + (2 - i) * 0.42 - 0.1, px = cx + ox * (i + 1) / 2;
      g.beginPath(); g.moveTo(px, top - 0.25); g.lineTo(cx + w, top + 0.5); g.lineTo(cx - w, top + 0.5); g.closePath(); g.fill();
      if (ENV.season === "winter") {
        g.fillStyle = "#fff"; g.beginPath(); g.moveTo(px, top - 0.25); g.lineTo(px + w * 0.45, top + 0.1); g.lineTo(px, top + 0.02); g.lineTo(px - w * 0.45, top + 0.1); g.closePath(); g.fill();
      }
    }
    return;
  }
  if (st.t === "palm") {
    g.strokeStyle = "#b98a55"; g.lineWidth = 0.17; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx, y + 0.88); g.quadraticCurveTo(cx - 0.15, y + 0.2, cx + 0.1 + ox, y - 0.35); g.stroke();
    const tx = cx + 0.1 + ox, ty = y - 0.4;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.75;
      g.fillStyle = i % 2 ? "#4fb564" : "#63c873";
      g.beginPath(); g.ellipse(tx + Math.cos(a) * 0.3, ty + Math.sin(a) * 0.22 + 0.12, 0.38, 0.12, a, 0, Math.PI * 2); g.fill();
    }
    if (ready) { drawEmo(g, "🥥", tx - 0.12, ty + 0.38, 0.26); drawEmo(g, "🥥", tx + 0.14, ty + 0.36, 0.26); }
    return;
  }
  g.fillStyle = "#9a6a40"; rr(g, cx - 0.11, y + 0.3, 0.22, 0.6, 0.06); g.fill();
  const leaf = ENV.season === "autumn" ? AUTUMN[tileHash(x, y) % 3] : LEAF[ENV.season];
  g.fillStyle = leaf[0];
  ell(g, cx - 0.3 + ox, y + 0.12, 0.36, 0.34); ell(g, cx + 0.3 + ox, y + 0.12, 0.36, 0.34); ell(g, cx + ox, y - 0.18, 0.48, 0.46);
  g.fillStyle = leaf[1]; ell(g, cx - 0.1 + ox, y - 0.3, 0.27, 0.22);
  if (ENV.season === "spring") {
    g.fillStyle = "#ffb7d0";
    for (const [bx, by] of [[-0.42, 0.0], [0.38, -0.12], [0.12, -0.5], [-0.2, -0.42], [0.44, 0.22], [-0.05, 0.3]]) ell(g, cx + bx + ox, y + by, 0.07, 0.07);
  }
  if (ready) {
    const e = ITEMS[st.fruit].e;
    drawEmo(g, e, cx - 0.3 + ox, y + 0.38, 0.3); drawEmo(g, e, cx + 0.3 + ox, y + 0.34, 0.3); drawEmo(g, e, cx + ox, y + 0.02, 0.3);
  }
}

function drawRock(g, x, y) {
  const cx = x + 0.5;
  shadow(g, cx, y + 0.88, 0.42);
  g.fillStyle = "#9aa0ad"; ell(g, cx, y + 0.6, 0.4, 0.3);
  g.fillStyle = "#b7bcc8"; ell(g, cx - 0.08, y + 0.52, 0.26, 0.18);
}

function drawBuilding(g, b, x, y) {
  const shop = b === "shop";
  g.fillStyle = "rgba(40,60,40,.18)"; ell(g, x + 1.5, y + 1.95, 1.55, 0.16);
  g.fillStyle = shop ? "#fff1d6" : "#ffe6ee"; rr(g, x + 0.1, y + 0.15, 2.8, 1.8, 0.12); g.fill();
  g.fillStyle = shop ? "#ff8a65" : "#a78be0";
  g.beginPath(); g.moveTo(x - 0.15, y + 0.4); g.lineTo(x + 0.55, y - 0.8); g.lineTo(x + 2.45, y - 0.8); g.lineTo(x + 3.15, y + 0.4); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x + 0.6, y - 0.55, 1.8, 0.08); g.fillRect(x + 0.35, y - 0.15, 2.3, 0.08);
  if (shop) for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "#fff" : "#ff6f7d"; rr(g, x + 0.1 + i * 0.4, y + 0.4, 0.4, 0.28, 0.08); g.fill(); }
  g.fillStyle = "#8a5a35"; rr(g, x + 1.2, y + 1.0, 0.6, 0.95, 0.12); g.fill();
  g.fillStyle = "#ffd84d"; ell(g, x + 1.68, y + 1.5, 0.045, 0.045);
  g.fillStyle = "#bfe8ff";
  rr(g, x + 0.38, y + 0.9, 0.55, 0.5, 0.08); g.fill(); rr(g, x + 2.07, y + 0.9, 0.55, 0.5, 0.08); g.fill();
  g.fillStyle = "#fff"; ell(g, x + 1.5, y - 0.25, 0.42, 0.42);
  drawEmo(g, shop ? "🛍️" : "👗", x + 1.5, y + 0.07, 0.62);
}

function drawObj(g, o, x, y, objAt) {
  const it = ITEMS[o.id], cx = x + 0.5;
  if (it.draw === "fence") {
    g.fillStyle = "#b98a55";
    g.fillRect(x, y + 0.42, 1, 0.09); g.fillRect(x, y + 0.66, 1, 0.09);
    if (objAt(x, y - 1) === "fence") g.fillRect(cx - 0.045, y - 0.3, 0.09, 0.8);
    g.fillStyle = "#d3a56e";
    for (const px of [0.12, 0.5, 0.88]) { rr(g, x + px - 0.07, y + 0.25, 0.14, 0.65, 0.06); g.fill(); }
    return;
  }
  shadow(g, cx, y + 0.9, 0.3);
  if (it.draw === "table") {
    g.fillStyle = "#a87745"; g.fillRect(x + 0.16, y + 0.45, 0.1, 0.45); g.fillRect(x + 0.74, y + 0.45, 0.1, 0.45);
    g.fillStyle = "#c9955c"; rr(g, x + 0.04, y + 0.18, 0.92, 0.5, 0.12); g.fill();
    g.fillStyle = "#deb07a"; rr(g, x + 0.1, y + 0.22, 0.8, 0.3, 0.1); g.fill();
    return;
  }
  if (it.draw === "lamp") {
    g.fillStyle = "rgba(255,240,150,.35)"; ell(g, cx, y - 0.25, 0.42, 0.42);
    g.fillStyle = "#5a6072"; g.fillRect(cx - 0.05, y - 0.1, 0.1, 1.0); rr(g, cx - 0.14, y + 0.8, 0.28, 0.1, 0.04); g.fill();
    g.fillStyle = "#fff3a8"; ell(g, cx, y - 0.25, 0.2, 0.2);
    g.fillStyle = "#5a6072"; rr(g, cx - 0.2, y - 0.52, 0.4, 0.09, 0.04); g.fill();
    return;
  }
  if (it.draw === "easel") {
    g.strokeStyle = "#a87745"; g.lineWidth = 0.07; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx - 0.3, y + 0.9); g.lineTo(cx - 0.12, y - 0.15); g.moveTo(cx + 0.3, y + 0.9); g.lineTo(cx + 0.12, y - 0.15); g.stroke();
    g.fillStyle = "#fff"; g.fillRect(cx - 0.36, y - 0.12, 0.72, 0.72);
    if (worldCv[o.d]) g.drawImage(worldCv[o.d], cx - 0.32, y - 0.08, 0.64, 0.64);
    g.strokeStyle = "#8a5a35"; g.lineWidth = 0.05; g.strokeRect(cx - 0.36, y - 0.12, 0.72, 0.72);
    return;
  }
  drawEmo(g, it.e, cx, y + 0.95, it.s || 0.8);
}

// 사람 그리기. (x, y)는 발밑 가운데
function drawPerson(g, x, y, look, dir, t, moving) {
  const bob = moving ? Math.abs(Math.sin(t * 12)) * 0.04 : Math.sin(t * 2.5) * 0.012;
  const step = moving ? Math.sin(t * 12) * 0.06 : 0;
  const by = y - bob, hy = by - 0.74;
  const side = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  shadow(g, x, y + 0.03, 0.27);
  const dress = look.fit === "dress";
  g.fillStyle = dress ? look.skin : (look.pants || "#5c5470");
  rr(g, x - 0.15, y - 0.2 + Math.max(0, step), 0.12, 0.2 - Math.max(0, step), 0.05); g.fill();
  rr(g, x + 0.03, y - 0.2 + Math.max(0, -step), 0.12, 0.2 - Math.max(0, -step), 0.05); g.fill();
  // 뒷머리
  g.fillStyle = look.hair;
  if (look.style === "long") { rr(g, x - 0.3, hy - 0.05, 0.6, 0.52, 0.16); g.fill(); }
  if (look.style === "pig") { ell(g, x - 0.34, hy + 0.12, 0.12, 0.16); ell(g, x + 0.34, hy + 0.12, 0.12, 0.16); }
  // 몸
  g.fillStyle = look.skin; ell(g, x - 0.25, by - 0.34 + step * 0.5, 0.07, 0.09); ell(g, x + 0.25, by - 0.34 - step * 0.5, 0.07, 0.09);
  // 티셔츠는 둥근 네모, 원피스는 아래로 퍼지는 치마 모양
  const bodyPath = () => {
    if (!dress) { rr(g, x - 0.22, by - 0.54, 0.44, 0.4, 0.13); return; }
    g.beginPath(); g.moveTo(x - 0.16, by - 0.54); g.lineTo(x + 0.16, by - 0.54);
    g.quadraticCurveTo(x + 0.24, by - 0.4, x + 0.33, by - 0.1); g.quadraticCurveTo(x, by - 0.02, x - 0.33, by - 0.1);
    g.quadraticCurveTo(x - 0.24, by - 0.4, x - 0.16, by - 0.54); g.closePath();
  };
  g.fillStyle = look.shirt; bodyPath(); g.fill();
  const dcv = look.cv || (look.design >= 0 && designCv[look.design]);   // look.cv: 같이 노는 친구가 보내 준 옷 그림
  if (dcv) {
    g.save(); bodyPath(); g.clip();
    if (dress) g.drawImage(dcv, x - 0.33, by - 0.6, 0.66, 0.66);
    else g.drawImage(dcv, x - 0.22, by - 0.56, 0.44, 0.44);
    g.restore();
  }
  const hat = look.hat && HATS[look.hat];
  if (hat && hat.pos === "neck") drawEmo(g, hat.e, x, by - 0.3, 0.36);
  if (hat && hat.pos === "ears") {
    for (const sx of [-1, 1]) {
      g.fillStyle = look.hair; g.beginPath(); g.moveTo(x + sx * 0.26, hy - 0.12); g.lineTo(x + sx * 0.2, hy - 0.42); g.lineTo(x + sx * 0.05, hy - 0.24); g.closePath(); g.fill();
      g.fillStyle = "#ffb7d0"; g.beginPath(); g.moveTo(x + sx * 0.21, hy - 0.17); g.lineTo(x + sx * 0.19, hy - 0.34); g.lineTo(x + sx * 0.1, hy - 0.24); g.closePath(); g.fill();
    }
  }
  // 머리
  g.fillStyle = look.skin; ell(g, x, hy, 0.27, 0.26);
  g.fillStyle = look.hair;
  if (dir === "up") {
    ell(g, x, hy - 0.01, 0.29, 0.28);
  } else {
    g.beginPath(); g.ellipse(x, hy - 0.02, 0.29, 0.28, 0, Math.PI, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x - side * 0.05, hy - 0.04, 0.27, 0.13, 0, 0, Math.PI); g.fill();
    if (side) { g.beginPath(); g.ellipse(x - side * 0.1, hy, 0.2, 0.27, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#3a2a22";
    if (side) ell(g, x + side * 0.16, hy + 0.07, 0.035, 0.045);
    else { ell(g, x - 0.1, hy + 0.08, 0.035, 0.045); ell(g, x + 0.1, hy + 0.08, 0.035, 0.045); }
    g.fillStyle = "rgba(255,120,140,.45)";
    if (side) ell(g, x + side * 0.2, hy + 0.15, 0.045, 0.035);
    else { ell(g, x - 0.18, hy + 0.15, 0.05, 0.035); ell(g, x + 0.18, hy + 0.15, 0.05, 0.035); }
  }
  if (hat && hat.pos === "top") drawEmo(g, hat.e, x, hy - 0.14 + (hat.dy || 0), hat.s || 0.5);
  if (hat && hat.pos === "side") drawEmo(g, hat.e, x + (side ? -side * 0.1 : 0.2), hy - 0.08, 0.24);
  if (hat && hat.pos === "face" && dir !== "up") drawEmo(g, hat.e, x + side * 0.1, hy + 0.22, 0.4);
}

function drawNpc(g, x, y, t) {
  shadow(g, x + 0.5, y + 0.9, 0.3);
  drawEmo(g, "🐱", x + 0.5, y + 0.95 - Math.abs(Math.sin(t * 2)) * 0.05, 0.85);
}

// 밤에 건물 창문과 불빛이 켜져요
function drawBuildingLights(g, x, y, n) {
  g.fillStyle = "rgba(255,229,138," + n + ")";
  rr(g, x + 0.38, y + 0.9, 0.55, 0.5, 0.08); g.fill(); rr(g, x + 2.07, y + 0.9, 0.55, 0.5, 0.08); g.fill();
}
function drawGlow(g, cx, cy, r, n) {
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  gr.addColorStop(0, "rgba(255,236,150," + 0.55 * n + ")");
  gr.addColorStop(1, "rgba(255,236,150,0)");
  g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
}

// ───── 집 안 ─────
function drawRoomTile(g, home, t, x, y) {
  if (t === T_WALL) {
    if (typeof home.wall === "number" && worldCv[home.wall]) { g.fillStyle = "#fff"; g.fillRect(x, y, 1, 1); g.drawImage(worldCv[home.wall], x, y, 1, 1); }
    else { g.fillStyle = home.wall; g.fillRect(x, y, 1, 1); }
    if (y === 0) { g.fillStyle = "rgba(74,59,82,.25)"; g.fillRect(x, y, 1, 0.1); }
    else { g.fillStyle = "#fff"; g.fillRect(x, y + 0.84, 1, 0.16); g.fillStyle = "rgba(74,59,82,.18)"; g.fillRect(x, y + 0.96, 1, 0.04); }
  } else if (t === T_ROOM) {
    if (typeof home.flr === "number" && worldCv[home.flr]) { g.fillStyle = "#fff"; g.fillRect(x, y, 1, 1); g.drawImage(worldCv[home.flr], x, y, 1, 1); }
    else {
      const c = FLOORS[home.flr] || FLOORS.wood;
      g.fillStyle = c[(x + y) & 1]; g.fillRect(x, y, 1, 1);
      if (home.flr === "wood") { g.fillStyle = "rgba(120,80,40,.18)"; g.fillRect(x, y + 0.48, 1, 0.03); g.fillRect(x + (y & 1 ? 0.3 : 0.7), y, 0.03, 0.5); }
    }
  } else if (t === T_EXIT) {
    g.fillStyle = "#8a5a35"; g.fillRect(x, y, 1, 0.55);
    g.fillStyle = "#ff9db5"; rr(g, x + (x === 5 ? 0.2 : -0.2), y + 0.06, 1, 0.38, 0.12); g.fill();
  }
}
// 벽에 달린 창문: 바깥 하늘이 보여요
function drawRoomWindow(g, x, y) {
  g.fillStyle = "#fff"; rr(g, x - 0.08, y - 0.08, 2.16, 1.26, 0.14); g.fill();
  g.fillStyle = ENV.night > 0.5 ? "#243a6b" : ENV.sunset > 0.3 ? "#ffb27a" : "#9fdcf5"; rr(g, x, y, 2, 1.1, 0.08); g.fill();
  drawEmo(g, ENV.night > 0.5 ? "🌙" : ENV.sunset > 0.3 ? "🌇" : "⛅", x + 1.45, y + 0.8, 0.6);
  g.fillStyle = "#fff"; g.fillRect(x + 0.96, y, 0.08, 1.1); g.fillRect(x, y + 0.51, 2, 0.08);
}
function drawWardrobe(g, x, y) {
  g.fillStyle = "rgba(40,30,50,.2)"; ell(g, x + 0.5, y + 0.92, 0.5, 0.1);
  g.fillStyle = "#b98a55"; rr(g, x + 0.04, y - 0.75, 0.92, 1.65, 0.1); g.fill();
  g.fillStyle = "#d3a56e"; rr(g, x + 0.1, y - 0.68, 0.37, 1.4, 0.06); g.fill(); rr(g, x + 0.53, y - 0.68, 0.37, 1.4, 0.06); g.fill();
  g.fillStyle = "#ffd84d"; ell(g, x + 0.41, y + 0.05, 0.04, 0.04); ell(g, x + 0.59, y + 0.05, 0.04, 0.04);
  drawEmo(g, "👗", x + 0.5, y - 0.72, 0.4);
}

// ───── 3단계: 친구, 곤충, 꽃 ─────
function drawPal(g, f, pal, t, bubble) {
  const hop = pal.moving ? Math.abs(Math.sin(t * 9)) * 0.08 : Math.abs(Math.sin(t * 2 + pal.x)) * 0.03;
  shadow(g, pal.x, pal.y + 0.02, 0.28);
  drawEmo(g, f.e, pal.x, pal.y + 0.08 - hop, 0.82);
  if (bubble) drawEmo(g, bubble, pal.x + 0.3, pal.y - 0.72 - Math.sin(t * 3) * 0.04, 0.36);
}
function drawBug(g, b, t) {
  const it = ITEMS[b.id], up = it.fly ? 0.45 + Math.sin(t * 6 + b.seed) * 0.08 : 0;
  g.globalAlpha = Math.min(1, b.fade);
  g.fillStyle = "rgba(40,60,40,.16)"; ell(g, b.x, b.y + 0.02, 0.14, 0.05);
  drawEmo(g, it.e, b.x, b.y + 0.12 - up - b.rise, it.fly ? 0.42 : 0.34);
  g.globalAlpha = 1;
}
function drawPlant(g, pl, x, y, t) {
  const cx = x + 0.5;
  if (pl.s < 2) {
    g.fillStyle = "#a87745"; ell(g, cx, y + 0.72, 0.26, 0.11);
    g.fillStyle = "#8a5a35"; ell(g, cx, y + 0.7, 0.18, 0.07);
    drawEmo(g, "🌱", cx, y + 0.74, pl.s ? 0.55 : 0.3);
    if (!pl.at) drawEmo(g, "💧", cx + 0.26, y + 0.3 - Math.abs(Math.sin(t * 3)) * 0.06, 0.26);
  } else {
    shadow(g, cx, y + 0.86, 0.2);
    drawEmo(g, ITEMS[pl.kind].e, cx, y + 0.92 + Math.sin(t * 2 + x) * 0.015, 0.72);
    drawEmo(g, "✨", cx + 0.28, y + 0.36 + Math.sin(t * 4) * 0.04, 0.22);
  }
}
