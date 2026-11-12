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
function refreshDesign(i, code) {
  const c = designCv[i] || (designCv[i] = document.createElement("canvas"));
  c.width = c.height = 16;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 16, 16);
  if (!code) return;
  for (let p = 0; p < 256; p++) {
    const ch = code.charCodeAt(p) - 97;
    if (ch < 0 || ch >= PALETTE.length) continue;
    g.fillStyle = PALETTE[ch];
    g.fillRect(p % 16, p >> 4, 1, 1);
  }
}

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
  g.fillStyle = ((x + y) & 1) ? "#92d672" : "#8bd06b"; g.fillRect(x, y, 1, 1);
  if (h % 5 === 0) {
    g.fillStyle = "#74bd58";
    const ox = x + 0.2 + (h % 6) * 0.1, oy = y + 0.3 + (h % 4) * 0.13;
    g.fillRect(ox, oy, 0.04, 0.13); g.fillRect(ox + 0.09, oy + 0.03, 0.04, 0.1);
  } else if (h % 23 === 0) {
    g.fillStyle = "#fff"; ell(g, x + 0.5, y + 0.5, 0.07, 0.07);
    g.fillStyle = "#ffd84d"; ell(g, x + 0.5, y + 0.5, 0.03, 0.03);
  }
}

function drawFloor(g, f, x, y) {
  if (f === "s") {
    g.fillStyle = "#c9ced8"; rr(g, x + 0.1, y + 0.14, 0.8, 0.72, 0.28); g.fill();
    g.fillStyle = "#e2e6ee"; rr(g, x + 0.16, y + 0.18, 0.6, 0.45, 0.2); g.fill();
  } else if (designCv[f]) {
    g.drawImage(designCv[f], x, y, 1, 1);
  }
}

function drawTree(g, st, x, y, ready, shake) {
  const cx = x + 0.5, ox = shake > 0 ? Math.sin(shake * 45) * 0.06 : 0;
  shadow(g, cx, y + 0.9, 0.42);
  if (st.t === "pine") {
    g.fillStyle = "#9a6a40"; g.fillRect(cx - 0.08, y + 0.55, 0.16, 0.35);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = ["#3f9f6c", "#47ab75", "#52b87f"][i];
      const w = 0.5 - i * 0.1, top = y - 0.75 + (2 - i) * 0.42 - 0.1;
      g.beginPath(); g.moveTo(cx + ox * (i + 1) / 2, top - 0.25); g.lineTo(cx + w, top + 0.5); g.lineTo(cx - w, top + 0.5); g.closePath(); g.fill();
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
  g.fillStyle = "#4dab59";
  ell(g, cx - 0.3 + ox, y + 0.12, 0.36, 0.34); ell(g, cx + 0.3 + ox, y + 0.12, 0.36, 0.34); ell(g, cx + ox, y - 0.18, 0.48, 0.46);
  g.fillStyle = "#68c56c"; ell(g, cx - 0.1 + ox, y - 0.3, 0.27, 0.22);
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
    if (designCv[o.d]) g.drawImage(designCv[o.d], cx - 0.32, y - 0.08, 0.64, 0.64);
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
  g.fillStyle = "#5c5470";
  rr(g, x - 0.15, y - 0.2 + Math.max(0, step), 0.12, 0.2 - Math.max(0, step), 0.05); g.fill();
  rr(g, x + 0.03, y - 0.2 + Math.max(0, -step), 0.12, 0.2 - Math.max(0, -step), 0.05); g.fill();
  // 뒷머리
  g.fillStyle = look.hair;
  if (look.style === "long") { rr(g, x - 0.3, hy - 0.05, 0.6, 0.52, 0.16); g.fill(); }
  if (look.style === "pig") { ell(g, x - 0.34, hy + 0.12, 0.12, 0.16); ell(g, x + 0.34, hy + 0.12, 0.12, 0.16); }
  // 몸
  g.fillStyle = look.skin; ell(g, x - 0.25, by - 0.34 + step * 0.5, 0.07, 0.09); ell(g, x + 0.25, by - 0.34 - step * 0.5, 0.07, 0.09);
  g.fillStyle = look.shirt; rr(g, x - 0.22, by - 0.54, 0.44, 0.4, 0.13); g.fill();
  if (look.design >= 0 && designCv[look.design]) {
    g.save(); rr(g, x - 0.22, by - 0.54, 0.44, 0.4, 0.13); g.clip();
    g.drawImage(designCv[look.design], x - 0.22, by - 0.56, 0.44, 0.44);
    g.restore();
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
}

function drawNpc(g, x, y, t) {
  shadow(g, x + 0.5, y + 0.9, 0.3);
  drawEmo(g, "🐱", x + 0.5, y + 0.95 - Math.abs(Math.sin(t * 2)) * 0.05, 0.85);
}
