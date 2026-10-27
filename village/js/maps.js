// 마을과 건물 안 지도
// 지금 그림은 코드로 그린 임시 그림이에요. assets/ 폴더에 AI 그림(village.png 등)을 넣으면
// 그 그림을 바닥 그림으로 쓰고, 벽·문·NPC 자리는 여기 적힌 대로 써요.
"use strict";

const Maps = (() => {
  const T = 32; // 한 칸 크기(월드 픽셀)

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function grid(w, h, v) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(v)); return g; }

  function newScene(id, name, w, h, opts = {}) {
    return Object.assign({
      id, name, w, h,
      ground: grid(w, h, "grass"),
      solid: grid(w, h, false),
      doors: [], npcs: [], stations: [], sprites: [], labels: [], paints: [],
      spawn: { x: 1, y: 1, dir: "down" }, indoor: false, bgImage: null
    }, opts);
  }

  function fillRect(sc, x, y, w, h, type) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (sc.ground[j] && i >= 0 && i < sc.w) sc.ground[j][i] = type; }
  function solidRect(sc, x, y, w, h, v = true) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (sc.solid[j] && i >= 0 && i < sc.w) sc.solid[j][i] = v; }

  // ───────────────────────── 그림 도구 ─────────────────────────
  // 2월드픽셀을 그림 한 점으로 써서 픽셀 그림 느낌을 내요.
  function painter(ctx) {
    const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    return p;
  }

  function drawGrass(p, x, y, r) {
    p(x, y, T, T, "#8fd16a");
    for (let i = 0; i < 5; i++) {
      const gx = x + Math.floor(r() * 15) * 2, gy = y + Math.floor(r() * 15) * 2;
      p(gx, gy, 2, 4, r() < 0.5 ? "#79bf55" : "#a3dd7d");
      p(gx + 2, gy + 2, 2, 2, "#79bf55");
    }
    if (r() < 0.07) {
      const fx = x + 6 + Math.floor(r() * 10) * 2, fy = y + 6 + Math.floor(r() * 10) * 2;
      const fc = ["#ffffff", "#ffe066", "#ff9ec4", "#b9a6ff"][Math.floor(r() * 4)];
      p(fx - 2, fy, 6, 2, fc); p(fx, fy - 2, 2, 6, fc); p(fx, fy, 2, 2, "#f4a62a");
    }
  }

  function drawPath(p, x, y, r) {
    p(x, y, T, T, "#ecca8c");
    for (let i = 0; i < 4; i++) p(x + Math.floor(r() * 15) * 2, y + Math.floor(r() * 15) * 2, 2, 2, r() < 0.5 ? "#dcb578" : "#f5dba8");
  }

  function drawPlaza(p, x, y, r) {
    p(x, y, T, T, "#efe2c8");
    p(x, y, T, 2, "#d9c6a3"); p(x, y, 2, T, "#d9c6a3");
    p(x + 16, y + 2, 2, 14, "#e2d2b3");
    if (r() < 0.3) p(x + 6 + Math.floor(r() * 8) * 2, y + 20, 4, 2, "#e0cfae");
  }

  function drawWater(p, x, y, r, sc, i, j) {
    p(x, y, T, T, "#69bfe3");
    if (r() < 0.4) p(x + Math.floor(r() * 10) * 2 + 4, y + Math.floor(r() * 12) * 2 + 4, 8, 2, "#a5def3");
    const g = (a, b) => (sc.ground[b] && sc.ground[b][a]) || "grass";
    if (g(i, j - 1) !== "water") p(x, y, T, 4, "#4f9fc4");
    if (g(i - 1, j) !== "water") p(x, y, 4, T, "#4f9fc4");
    if (g(i + 1, j) !== "water") p(x + T - 4, y, 4, T, "#4f9fc4");
    if (g(i, j + 1) !== "water") p(x, y + T - 4, T, 4, "#4f9fc4");
    if (r() < 0.12) { p(x + 10, y + 12, 10, 6, "#5aa64a"); p(x + 14, y + 12, 2, 2, "#69bfe3"); p(x + 18, y + 10, 4, 4, "#ff9ec4"); }
  }

  function drawSoil(p, x, y, r) {
    p(x, y, T, T, "#a06a43");
    p(x + 2, y + 2, T - 4, T - 4, "#8a5636");
    for (let i = 0; i < 3; i++) p(x + 4 + Math.floor(r() * 11) * 2, y + 4 + Math.floor(r() * 11) * 2, 2, 2, "#b57a4f");
  }

  function drawWood(p, x, y, i, j) {
    p(x, y, T, T, "#e3a96a");
    p(x, y + 14, T, 2, "#c98d50"); p(x, y + 30, T, 2, "#c98d50");
    const off = (j % 2) * 16;
    p(x + ((i * 7 + off) % 32), y, 2, 14, "#cf9558");
    p(x + ((i * 11 + 16 + off) % 32), y + 16, 2, 14, "#cf9558");
    p(x + 4, y + 4, 6, 2, "#ecb87c");
  }

  function drawTile(p, type, x, y, r, sc, i, j) {
    if (type === "grass") drawGrass(p, x, y, r);
    else if (type === "path") drawPath(p, x, y, r);
    else if (type === "plaza") drawPlaza(p, x, y, r);
    else if (type === "water") drawWater(p, x, y, r, sc, i, j);
    else if (type === "soil") { p(x, y, T, T, "#8fd16a"); drawSoil(p, x, y, r); }
    else if (type === "wood") drawWood(p, x, y, i, j);
    else if (type === "void") p(x, y, T, T, "#2a1712");
    else if (type === "wall") { p(x, y, T, T, "#c98a55"); p(x, y + 8, T, 2, "#b67845"); p(x, y + 20, T, 2, "#b67845"); p(x + (i % 2) * 16 + 6, y + 10, 2, 10, "#b67845"); }
    else if (type === "walltop") { p(x, y, T, T, "#7a4a2a"); p(x, y + T - 6, T, 6, "#5e3820"); }
    else if (type === "mat") { drawWood(p, x, y, i, j); p(x + 2, y + 6, T - 4, T - 10, "#b8733a"); p(x + 6, y + 10, T - 12, T - 18, "#d79a55"); }
  }

  // ── 건물·가구 ──
  function plaque(ctx, cx, cy, emoji, size = 22) {
    const p = painter(ctx);
    p(cx - 15, cy - 13, 30, 26, "#5e3820"); p(cx - 13, cy - 11, 26, 22, "#fff3d6");
    ctx.font = size + "px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, cx, cy + 1);
  }

  function drawHouse(ctx, b) {
    const p = painter(ctx);
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    const roofH = Math.round(h * 0.48);
    const wallY = y + roofH;
    // 그림자
    p(x + 4, y + h - 2, w, 6, "rgba(0,0,0,.15)");
    // 벽
    p(x + 4, wallY, w - 8, h - roofH, "#f3d9a8");
    for (let yy = wallY + 10; yy < y + h; yy += 10) p(x + 4, yy, w - 8, 2, "#e2c28c");
    p(x + 4, wallY, 4, h - roofH, "#d8b67e"); p(x + w - 8, wallY, 4, h - roofH, "#d8b67e");
    // 지붕
    const rc = b.roof, rd = b.roofDark;
    p(x - 4, y + 6, w + 8, roofH - 2, rc);
    for (let yy = y + 12; yy < wallY; yy += 10) p(x - 4, yy, w + 8, 2, rd);
    p(x - 4, wallY + 2, w + 8, 6, rd);
    p(x + 8, y, w - 16, 8, rd);
    // 창문
    const doorX = (b.door.x - b.x) * T;
    const winY = wallY + 14;
    const doorI = b.door.x - b.x;
    [1, 2, b.w - 3, b.w - 2].filter((i, k, a) => a.indexOf(i) === k && Math.abs(i - doorI) > 1).forEach((i) => {
      const wx = x + i * T + 4;
      p(wx - 2, winY - 2, 28, 24, "#8a5a35"); p(wx, winY, 24, 20, "#9fdcf2"); p(wx + 11, winY, 2, 20, "#8a5a35"); p(wx, winY + 9, 24, 2, "#8a5a35"); p(wx + 2, winY + 2, 6, 4, "#d6f2fb");
      p(wx - 2, winY + 22, 28, 6, "#7cc25a"); p(wx + 2, winY + 22, 4, 4, "#ff7f7f"); p(wx + 16, winY + 22, 4, 4, "#ffe066");
    });
    // 문
    const dx = x + doorX + 4, dy = y + h - 30;
    p(dx - 2, dy - 4, 28, 34, "#6b3f22"); p(dx, dy - 2, 24, 32, b.doorColor || "#b06a3a");
    p(dx + 4, dy + 2, 16, 10, "#c98250"); p(dx + 18, dy + 16, 3, 3, "#ffd76a");
    // 간판
    plaque(ctx, x + w / 2, y + Math.round(roofH / 2) + 3, b.emoji);
  }

  function drawGreenhouse(ctx, b) {
    const p = painter(ctx);
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    p(x + 4, y + h - 2, w, 6, "rgba(0,0,0,.15)");
    p(x, y + 8, w, h - 8, "#bfe8f2");
    p(x, y, w, 14, "#dff4f9");
    for (let xx = x; xx <= x + w; xx += 16) p(xx, y, 2, h, "#ffffff");
    for (let yy = y + 14; yy < y + h; yy += 20) p(x, yy, w, 2, "#ffffff");
    p(x, y, w, 4, "#7aa9b5"); p(x, y, 4, h, "#7aa9b5"); p(x + w - 4, y, 4, h, "#7aa9b5");
    const r = rng(7);
    for (let i = 0; i < 18; i++) { const px = x + 10 + Math.floor(r() * (w - 30)), py = y + 22 + Math.floor(r() * (h - 50)); p(px, py, 10, 8, "#5fb04c"); p(px + 2, py - 4, 6, 4, "#7cc25a"); if (r() < 0.4) p(px + 3, py - 6, 4, 4, ["#ff7f7f", "#ffe066", "#ff9ec4"][i % 3]); }
    const dx = x + (b.door.x - b.x) * T + 4, dy = y + h - 30;
    p(dx - 2, dy - 4, 28, 34, "#7aa9b5"); p(dx, dy - 2, 24, 32, "#e7f7fb"); p(dx + 11, dy - 2, 2, 32, "#7aa9b5");
    plaque(ctx, x + w / 2, y + 26, b.emoji);
  }

  function drawObservatory(ctx, b) {
    const p = painter(ctx);
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    p(x + 4, y + h - 2, w, 6, "rgba(0,0,0,.15)");
    const wallY = y + Math.round(h * 0.5);
    p(x + 4, wallY, w - 8, h - (wallY - y), "#e9e3f2");
    for (let yy = wallY + 10; yy < y + h; yy += 10) p(x + 4, yy, w - 8, 2, "#d3cbe3");
    // 둥근 지붕(계단 모양으로)
    const cx = x + w / 2, rad = w / 2 - 2;
    for (let yy = 0; yy < rad; yy += 4) {
      const half = Math.round(Math.sqrt(rad * rad - (rad - yy) * (rad - yy)) / 4) * 4;
      p(cx - half, wallY - rad + yy, half * 2, 4, yy % 12 === 0 ? "#6f78b8" : "#8790cf");
    }
    p(x, wallY - 2, w, 6, "#5a62a3");
    p(cx - 6, wallY - rad + 2, 12, rad - 4, "#2f2f5a"); p(cx - 2, wallY - rad + 6, 4, 4, "#ffe066");
    // 망원경
    p(cx + 6, wallY - rad - 4, 20, 8, "#c9a227"); p(cx + 22, wallY - rad - 6, 6, 12, "#a7861d");
    const dx = x + (b.door.x - b.x) * T + 4, dy = y + h - 30;
    p(dx - 2, dy - 4, 28, 34, "#4b4f80"); p(dx, dy - 2, 24, 32, "#6f78b8"); p(dx + 18, dy + 16, 3, 3, "#ffd76a");
    for (let i = 0; i < 2; i++) { const wx = x + (i ? w - 44 : 16); p(wx - 2, wallY + 12, 28, 22, "#4b4f80"); p(wx, wallY + 14, 24, 18, "#2f2f5a"); p(wx + 6, wallY + 18, 2, 2, "#ffe066"); p(wx + 16, wallY + 24, 2, 2, "#ffffff"); }
    plaque(ctx, cx, wallY + 22, b.emoji);
  }

  function drawGardenFence(ctx, g) {
    const p = painter(ctx);
    const x = g.x * T, y = g.y * T, w = g.w * T, h = g.h * T;
    const post = (px, py) => { p(px, py - 8, 8, 18, "#fff7ea"); p(px, py + 10, 8, 2, "#d9cbb3"); };
    for (let xx = x; xx <= x + w - 8; xx += 16) {
      const gateL = (g.gate.x - g.x) * T, gateR = gateL + g.gate.w * T;
      if (!(xx - x >= gateL - 4 && xx - x < gateR)) { post(xx, y + 10); }
      post(xx, y + h - 12);
    }
    for (let yy = y + 10; yy <= y + h - 12; yy += 16) { post(x, yy); post(x + w - 8, yy); }
    p(x, y + 8, (g.gate.x - g.x) * T, 4, "#fff7ea");
    p(x + (g.gate.x - g.x + g.gate.w) * T, y + 8, w - (g.gate.x - g.x + g.gate.w) * T, 4, "#fff7ea");
    p(x, y + h - 14, w, 4, "#fff7ea");
    // 문 아치
    const gx = x + (g.gate.x - g.x) * T;
    p(gx - 4, y - 14, 6, 34, "#a0673d"); p(gx + g.gate.w * T - 2, y - 14, 6, 34, "#a0673d");
    p(gx - 4, y - 18, g.gate.w * T + 6, 8, "#a0673d");
    for (let i = 0; i < 6; i++) p(gx + i * 10, y - 22 + (i % 2) * 2, 6, 6, i % 2 ? "#ff9ec4" : "#7cc25a");
    plaque(ctx, gx + g.gate.w * T / 2, y - 34, g.emoji, 20);
  }

  function treeSprite(variant) {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 84;
    const ctx = c.getContext("2d"), p = painter(ctx);
    p(16, 76, 32, 6, "rgba(0,0,0,.18)");
    p(26, 54, 12, 26, "#7a4a2a"); p(26, 54, 4, 26, "#8f5a34"); p(22, 76, 20, 4, "#6b3f22");
    const dark = variant ? "#3f8f3c" : "#4c9a3f", mid = variant ? "#55ad4a" : "#62b552", light = variant ? "#7dcc63" : "#8bd36b";
    const blob = (cx, cy, rr, col) => { for (let yy = -rr; yy <= rr; yy += 2) { const hw = Math.round(Math.sqrt(rr * rr - yy * yy) / 2) * 2; p(cx - hw, cy + yy, hw * 2, 2, col); } };
    blob(32, 36, 28, "#2f6f2e"); blob(32, 34, 26, dark); blob(28, 30, 20, mid); blob(24, 24, 10, light);
    if (variant === 2) for (let i = 0; i < 5; i++) p(12 + i * 9, 22 + (i % 3) * 12, 4, 4, "#ff6b6b");
    return c;
  }
  const TREES = [];

  function furniture(ctx, kind, x, y, w = 1, h = 1) {
    const p = painter(ctx);
    const X = x * T, Y = y * T, W = w * T, H = h * T;
    if (kind === "shelf") {
      p(X, Y, W, H, "#7a4a2a"); p(X + 2, Y + 2, W - 4, H - 4, "#9a6038");
      const cols = ["#e8685a", "#4fb3e8", "#f5d33b", "#6cc56c", "#7b6ef0", "#f59e3b"];
      for (let sy = Y + 6; sy < Y + H - 8; sy += 14) { p(X + 2, sy + 10, W - 4, 3, "#6b3f22"); for (let bx = X + 4, k = 0; bx < X + W - 6; bx += 5, k++) p(bx, sy + (k % 3), 4, 10 - (k % 3), cols[(k + sy) % cols.length]); }
    } else if (kind === "table") {
      p(X + 2, Y + 6, W - 4, H - 8, "#8a5232"); p(X, Y + 2, W, H - 10, "#c98250"); p(X + 4, Y + 6, W - 8, 2, "#dda06a");
      p(X + 4, Y + H - 8, 6, 8, "#6b3f22"); p(X + W - 10, Y + H - 8, 6, 8, "#6b3f22");
    } else if (kind === "labtable") {
      p(X, Y + 2, W, H - 6, "#f4f4f4"); p(X, Y + H - 8, W, 6, "#b9c2c9"); p(X + 4, Y + 6, W - 8, 2, "#ffffff");
    } else if (kind === "plant") {
      p(X + 8, Y + 18, 16, 12, "#c96a3a"); p(X + 8, Y + 18, 16, 3, "#a85530");
      p(X + 6, Y + 6, 8, 10, "#5fb04c"); p(X + 16, Y + 2, 8, 14, "#4c9a3f"); p(X + 12, Y + 10, 8, 8, "#7cc25a");
    } else if (kind === "window") {
      p(X + 2, Y + 4, W - 4, H - 10, "#8a5a35"); p(X + 6, Y + 8, W - 12, H - 18, "#9fdcf2");
      p(X + W / 2 - 1, Y + 8, 2, H - 18, "#8a5a35"); p(X + 8, Y + 10, 8, 4, "#d6f2fb");
    } else if (kind === "board") {
      p(X, Y + 4, W, H - 8, "#8a5a35"); p(X + 4, Y + 8, W - 8, H - 16, "#3f6b4f");
      ctx.strokeStyle = "#f4f4f4"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X + 24, Y + H / 2, 8, Math.PI * 0.1, Math.PI * 1.9, true); ctx.stroke();
      p(X + 40, Y + H / 2 - 2, 20, 2, "#f4f4f4"); p(X + 52, Y + H / 2 - 6, 2, 10, "#f4f4f4");
    } else if (kind === "conveyor") {
      p(X, Y + 6, W, H - 10, "#5c5f6b"); p(X + 2, Y + 8, W - 4, H - 16, "#7d808c");
      for (let i = X + 4; i < X + W - 4; i += 8) p(i, Y + 10, 4, H - 20, "#94979f");
      p(X + 10, Y + 2, 12, 10, "#c9c9d3"); p(X + W - 26, Y + 2, 14, 10, "#e8b04a");
    } else if (kind === "console") {
      p(X + 2, Y + 4, W - 4, H - 6, "#5c5f6b"); p(X + 6, Y + 8, W - 12, 12, "#9ff2c8"); p(X + 8, Y + 10, 6, 2, "#2b6b4b");
      p(X + 8, Y + 24, 4, 4, "#ef5b5b"); p(X + 16, Y + 24, 4, 4, "#f5d33b"); p(X + 24, Y + 24, 4, 4, "#6cc56c");
    } else if (kind === "charger") {
      p(X + 4, Y + 2, W - 8, H - 4, "#5c5f6b"); p(X + 8, Y + 6, W - 16, H - 12, "#2f3240");
      p(X + 12, Y + 10, 8, 14, "#6cc56c"); p(X + 14, Y + 8, 4, 2, "#6cc56c");
    } else if (kind === "gears") {
      p(X + 2, Y + 4, W - 4, H - 6, "#9a6038");
      const gear = (cx, cy, r, c) => { p(cx - r, cy - r / 2, r * 2, r, c); p(cx - r / 2, cy - r, r, r * 2, c); p(cx - 2, cy - 2, 4, 4, "#9a6038"); };
      gear(X + 12, Y + 14, 8, "#c9c9d3"); gear(X + 24, Y + 22, 6, "#e8b04a");
    } else if (kind === "magnets") {
      p(X + 2, Y + 4, W - 4, H - 6, "#9a6038");
      for (let i = 0; i < w; i++) { const mx = X + i * T + 6; p(mx, Y + 8, 6, 14, "#e8505b"); p(mx + 14, Y + 8, 6, 14, "#4f7fe8"); p(mx, Y + 8, 20, 6, i % 2 ? "#4f7fe8" : "#e8505b"); p(mx, Y + 20, 6, 4, "#d9d9d9"); p(mx + 14, Y + 20, 6, 4, "#d9d9d9"); }
    } else if (kind === "jars") {
      p(X + 2, Y + 4, W - 4, H - 6, "#9a6038");
      for (let i = 0; i < w * 2; i++) { const jx = X + 4 + i * 15; p(jx, Y + 8, 12, 16, "#cfeaf3"); p(jx + 2, Y + 14, 8, 8, ["#c9c9d3", "#f5d33b", "#e8b04a"][i % 3]); p(jx, Y + 6, 12, 3, "#7a4a2a"); }
    } else if (kind === "sink") {
      p(X + 2, Y + 4, W - 4, H - 6, "#b9c2c9"); p(X + 6, Y + 10, W - 12, H - 18, "#8fb4c4"); p(X + W / 2 - 2, Y + 2, 4, 10, "#9a9a9a");
    } else if (kind === "sofa") {
      p(X, Y + 4, W, H - 6, "#c96a3a"); p(X + 4, Y + 10, W - 8, H - 18, "#e08a55"); p(X + 8, Y + 12, 12, 10, "#f5d33b");
    } else if (kind === "rug") {
      ctx.fillStyle = "#6fb6b0"; ctx.beginPath(); ctx.ellipse(X + W / 2, Y + H / 2, W / 2, H / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9fd6cf"; ctx.beginPath(); ctx.ellipse(X + W / 2, Y + H / 2, W / 2 - 8, H / 2 - 6, 0, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "stage") {
      p(X, Y, W, H, "#d79a55"); p(X, Y, W, 4, "#ecb87c"); p(X, Y + H - 6, W, 6, "#a5662f");
      for (let i = X + 16; i < X + W; i += 16) p(i, Y + 4, 2, H - 10, "#c98250");
      p(X + 24, Y + 10, W - 48, H - 22, "#e8505b"); p(X + 24, Y + 10, W - 48, 3, "#f07b84");
    } else if (kind === "noticeboard") {
      p(X + 4, Y + 18, 4, 14, "#6b3f22"); p(X + W - 8, Y + 18, 4, 14, "#6b3f22");
      p(X, Y, W, 22, "#8a5a35"); p(X + 3, Y + 3, W - 6, 16, "#d9a86a");
      p(X + 8, Y + 6, 10, 10, "#fff7ea"); p(X + 24, Y + 5, 10, 12, "#fff3a8"); p(X + 40, Y + 7, 12, 9, "#d6f2fb");
    } else if (kind === "signpost") {
      p(X + 14, Y + 4, 6, 28, "#7a4a2a"); p(X + 2, Y + 6, 28, 8, "#a0673d"); p(X + 6, Y + 16, 26, 8, "#a0673d");
    } else if (kind === "bench") {
      p(X, Y + 10, W, 8, "#a0673d"); p(X, Y + 6, W, 3, "#c98250"); p(X + 4, Y + 18, 4, 10, "#6b3f22"); p(X + W - 8, Y + 18, 4, 10, "#6b3f22");
    } else if (kind === "flowerbed") {
      p(X, Y + 4, W, H - 6, "#a0673d"); p(X + 2, Y + 6, W - 4, H - 10, "#8a5636");
      const cols = ["#ff7f7f", "#ffe066", "#ff9ec4", "#b9a6ff", "#ffffff"];
      for (let i = X + 4, k = 0; i < X + W - 6; i += 8, k++) { p(i + 2, Y + 12, 2, 10, "#5fb04c"); p(i, Y + 8 + (k % 2) * 4, 6, 6, cols[k % cols.length]); }
    } else if (kind === "sunflower") {
      p(X + 14, Y + 10, 4, 22, "#5fb04c"); p(X + 18, Y + 18, 6, 4, "#5fb04c");
      p(X + 8, Y + 2, 16, 14, "#f5c518"); p(X + 12, Y + 6, 8, 6, "#7a4a2a");
    } else if (kind === "seedbags") {
      p(X + 4, Y + 10, 10, 18, "#e2c28c"); p(X + 18, Y + 12, 10, 16, "#f3d9a8"); p(X + 6, Y + 14, 6, 6, "#ff7f7f"); p(X + 20, Y + 16, 6, 6, "#ffe066");
    } else if (kind === "crate") {
      p(X + 2, Y + 4, W - 4, H - 6, "#b8733a"); p(X + 4, Y + 6, W - 8, H - 10, "#d79a55"); p(X + 2, Y + H / 2, W - 4, 3, "#8a5232");
    } else if (kind === "telescope") {
      p(X + 10, Y + 22, 4, 10, "#6b3f22"); p(X + 18, Y + 22, 4, 10, "#6b3f22");
      p(X + 4, Y + 8, 22, 10, "#c9a227"); p(X + 22, Y + 4, 8, 16, "#a7861d");
    }
  }

  // ───────────────────────── 마을 ─────────────────────────
  const BUILDINGS = [
    { id: "robot", name: "로봇 공장", emoji: "🤖", x: 3, y: 2, w: 8, h: 7, roof: "#e07a5f", roofDark: "#b85c44", style: "house" },
    { id: "workshop", name: "발명 공방", emoji: "🛠️", x: 18, y: 1, w: 8, h: 6, roof: "#f2b84b", roofDark: "#c98e2a", style: "house" },
    { id: "magnet", name: "자석 실험실", emoji: "🧲", x: 33, y: 2, w: 8, h: 7, roof: "#6a8fd8", roofDark: "#4a6db3", style: "house" },
    { id: "greenhouse", name: "관찰 온실", emoji: "🌱", x: 3, y: 20, w: 8, h: 5, style: "glass" },
    { id: "observatory", name: "별 관측소", emoji: "🔭", x: 33, y: 18, w: 7, h: 7, style: "dome" }
  ];
  BUILDINGS.forEach((b) => { b.door = { x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 }; });

  const OPEN = { robot: true, magnet: true };

  function buildVillage() {
    const W = 44, H = 31;
    const sc = newScene("village", "꼬마 발명가 마을", W, H);
    const r = rng(42);

    // 길
    fillRect(sc, 1, 14, W - 2, 2, "path");                 // 가로 큰길
    BUILDINGS.forEach((b) => {
      const dx = b.door.x;
      if (b.y < 14) fillRect(sc, dx - 1, b.door.y + 1, 2, 14 - b.door.y - 1, "path");
    });
    fillRect(sc, 6, 25, 2, 2, "path"); fillRect(sc, 6, 26, 8, 2, "path"); fillRect(sc, 12, 16, 2, 11, "path"); // 온실
    fillRect(sc, 35, 25, 2, 2, "path"); fillRect(sc, 30, 26, 7, 2, "path"); fillRect(sc, 30, 16, 2, 11, "path"); // 관측소
    fillRect(sc, 21, 16, 2, 5, "path");                    // 반복 정원
    // 광장
    const pcx = 21.5, pcy = 14.5;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const d = Math.hypot(i + 0.5 - (pcx + 0.5), (j + 0.5 - (pcy + 0.5)) * 1.15);
      if (d < 5.2) sc.ground[j][i] = "plaza";
    }
    // 연못
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (((i + 0.5 - 29) / 2.6) ** 2 + ((j + 0.5 - 8.5) / 1.7) ** 2 < 1) sc.ground[j][i] = "water";
    }
    // 반복 정원 (울타리 안 흙밭)
    const garden = { x: 15, y: 21, w: 14, h: 8, gate: { x: 21, w: 2 }, emoji: "🌻" };
    for (let j = garden.y + 2; j < garden.y + garden.h - 1; j += 2) for (let i = garden.x + 2; i < garden.x + garden.w - 2; i++) if (i !== 21 && i !== 22) sc.ground[j][i] = "soil";
    fillRect(sc, 21, garden.y, 2, garden.h - 1, "path");

    // 막히는 곳
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (sc.ground[j][i] === "water") sc.solid[j][i] = true;
    BUILDINGS.forEach((b) => solidRect(sc, b.x, b.y, b.w, b.h));
    // 울타리
    solidRect(sc, garden.x, garden.y, garden.w, 1); solidRect(sc, garden.gate.x, garden.y, garden.gate.w, 1, false);
    solidRect(sc, garden.x, garden.y + garden.h - 1, garden.w, 1);
    solidRect(sc, garden.x, garden.y, 1, garden.h); solidRect(sc, garden.x + garden.w - 1, garden.y, 1, garden.h);

    // 문
    BUILDINGS.forEach((b) => {
      sc.solid[b.door.y][b.door.x] = false;
      sc.doors.push({ x: b.door.x, y: b.door.y, to: OPEN[b.id] ? b.id : null, id: b.id, name: b.name, emoji: b.emoji });
      sc.labels.push({ text: b.emoji + " " + b.name, x: (b.door.x + 0.5) * T, y: (b.door.y + 1) * T + 14, small: true, locked: !OPEN[b.id] });
    });
    sc.doors.push({ x: 21, y: garden.y, w: 2, to: null, id: "garden", name: "반복 정원", emoji: "🌻" });
    sc.labels.push({ text: "🌻 반복 정원", x: 22 * T, y: garden.y * T - 54, small: true, locked: true });

    // 꾸미기: 무대, 게시판, 표지판, 벤치, 꽃밭
    const deco = [
      ["stage", 19, 10, 5, 2, false], ["noticeboard", 25, 10, 2, 1, true], ["signpost", 17, 11, 1, 1, true],
      ["bench", 15, 12, 2, 1, true], ["bench", 27, 17, 2, 1, true], ["flowerbed", 14, 9, 3, 1, true],
      ["flowerbed", 38, 11, 4, 1, true], ["flowerbed", 2, 11, 3, 1, true], ["bench", 9, 17, 2, 1, true],
      ["sunflower", garden.x + 1, garden.y + 1, 1, 1, true], ["sunflower", garden.x + 12, garden.y + 1, 1, 1, true],
      ["sunflower", garden.x + 1, garden.y + 6, 1, 1, true], ["sunflower", garden.x + 12, garden.y + 6, 1, 1, true],
      ["seedbags", garden.x + 4, garden.y + 1, 1, 1, true]
    ];
    deco.forEach(([k, x, y, w, h, s]) => { sc.paints.push([k, x, y, w, h]); if (s) solidRect(sc, x, y, w, h); });
    sc.garden = garden;

    // 나무: 가장자리 + 군데군데
    const free = (i, j, pad) => {
      for (let b = j - pad; b <= j + pad; b++) for (let a = i - pad; a <= i + pad; a++) {
        if (!sc.ground[b] || sc.ground[b][a] === undefined) continue;
        if (sc.ground[b][a] !== "grass" || sc.solid[b][a]) return false;
      }
      return true;
    };
    const addTree = (i, j) => { sc.sprites.push({ kind: "tree", v: Math.floor(r() * 3), x: (i + 0.5) * T, y: (j + 1) * T }); sc.solid[j][i] = true; };
    for (let i = 0; i < W; i += 2) { addTree(i, 0); if (free(i, H - 1, 0)) addTree(i, H - 1); }
    for (let j = 2; j < H - 1; j += 2) { if (free(0, j, 0)) addTree(0, j); if (free(W - 1, j, 0)) addTree(W - 1, j); }
    for (let j = 0; j < H; j++) { sc.solid[j][0] = true; sc.solid[j][W - 1] = true; }
    for (let i = 0; i < W; i++) { sc.solid[0][i] = true; sc.solid[H - 1][i] = true; }
    for (let k = 0; k < 400; k++) {
      const i = 2 + Math.floor(r() * (W - 4)), j = 2 + Math.floor(r() * (H - 4));
      if (free(i, j, 1) && r() < 0.35) addTree(i, j);
    }

    sc.buildings = BUILDINGS;
    sc.spawn = { x: 21, y: 16, dir: "down" };
    sc.gather = { x: 21, y: 14 };
    sc.bgImage = "assets/village.png";

    sc.npcs.push(
      { id: "chief", name: "반짝 촌장", x: 18, y: 13, dir: "down",
        look: { skin: 1, hair: "short", hairColor: "#ffffff", shirt: "#7b6ef0", acc: "glasses" },
        lines: ["안녕! 꼬마 발명가 마을에 온 걸 환영해!", "이 마을 건물마다 코딩 놀이와 과학 실험이 숨어 있어.", "로봇 공장과 자석 실험실은 지금 문이 열려 있어. 문 앞까지 걸어가 봐!", "활동을 마치면 도장을 받아. 오른쪽 아래 📒 도장책을 눌러 봐.", "친구를 만나면 😊 버튼으로 인사해 보자!"] },
      { id: "sprout", name: "새싹 정원사", x: 10, y: 25, dir: "down",
        look: { skin: 2, hair: "bun", hairColor: "#7a4a26", shirt: "#6cc56c", acc: "none" },
        lines: ["여기는 관찰 온실이야. 씨앗이 싹 트고 자라는 걸 볼 수 있지.", "지금은 식물들이 자라는 중이라 문을 닫았어. 곧 열게!"] },
      { id: "luna", name: "별지기 루나", x: 38, y: 26, dir: "down",
        look: { skin: 0, hair: "long", hairColor: "#5b8def", shirt: "#2f3a7a", acc: "bow" },
        lines: ["반가워! 나는 밤하늘을 지키는 루나야.", "별 관측소에서는 낮과 밤, 달 모양이 왜 바뀌는지 알아볼 거야. 조금만 기다려 줘!"] },
      { id: "tinker", name: "뚝딱 발명가", x: 25, y: 8, dir: "down",
        look: { skin: 3, hair: "spiky", hairColor: "#d08a3e", shirt: "#f59e3b", acc: "cap", capColor: "#4fb3e8" },
        lines: ["뚝딱뚝딱! 나는 발명가야.", "발명 공방에서는 바퀴, 프로펠러, 전구를 모아서 나만의 발명품을 만들 거야.", "지금은 공구를 정리하는 중이야. 곧 같이 만들자!"] },
      { id: "farmer", name: "콩콩 농부", x: 24, y: 20, dir: "down",
        look: { skin: 1, hair: "short", hairColor: "#3b2a20", shirt: "#e8b04a", acc: "cap", capColor: "#f5d33b" },
        lines: ["안녕! 여기는 반복 정원이야.", "\"씨앗 심기를 3번 반복해!\" 이렇게 말하면 한 번에 꽃밭을 만들 수 있어.", "반복 정원은 곧 열 거야. 기대해 줘!"] }
    );
    sc.npcs.forEach((n) => { sc.solid[n.y][n.x] = true; });
    return sc;
  }

  // ───────────────────────── 건물 안 ─────────────────────────
  function roomShell(id, name, w, h) {
    const sc = newScene(id, name, w, h, { indoor: true });
    fillRect(sc, 0, 0, w, h, "wood");
    fillRect(sc, 0, 0, w, 1, "walltop"); fillRect(sc, 0, 1, w, 2, "wall");
    fillRect(sc, 0, 0, 1, h, "walltop"); fillRect(sc, w - 1, 0, 1, h, "walltop");
    fillRect(sc, 0, h - 1, w, 1, "walltop");
    const mx = Math.floor(w / 2) - 1;
    fillRect(sc, mx, h - 1, 2, 1, "mat");
    solidRect(sc, 0, 0, w, 3); solidRect(sc, 0, 0, 1, h); solidRect(sc, w - 1, 0, 1, h); solidRect(sc, 0, h - 1, w, 1);
    solidRect(sc, mx, h - 1, 2, 1, false);
    sc.doors.push({ x: mx, y: h - 1, w: 2, to: "village", id: "exit", name: "나가기" });
    sc.labels.push({ text: "▼ 나가기", x: (mx + 1) * T, y: h * T + 22, exit: true });
    sc.spawn = { x: mx, y: h - 2, dir: "up" };
    return sc;
  }

  function place(sc, kind, x, y, w = 1, h = 1, solid = true) { sc.paints.push([kind, x, y, w, h]); if (solid) solidRect(sc, x, y, w, h); }

  function buildRobot() {
    const sc = roomShell("robot", "로봇 공장", 22, 14);
    place(sc, "window", 3, 1, 2, 2); place(sc, "window", 17, 1, 2, 2); place(sc, "board", 9, 1, 4, 2);
    place(sc, "shelf", 1, 3, 2, 2); place(sc, "gears", 3, 3, 2, 1); place(sc, "conveyor", 13, 3, 5, 1);
    place(sc, "charger", 19, 3, 2, 1); place(sc, "shelf", 19, 4, 2, 2);
    place(sc, "crate", 1, 11, 1, 1); place(sc, "crate", 2, 11, 1, 1); place(sc, "plant", 20, 12, 1, 1); place(sc, "plant", 1, 12, 1, 1);
    place(sc, "console", 10, 5, 2, 1);
    sc.floorGrid = { x: 8, y: 6, n: 5 }; // 바닥에 칠한 5x5 칸(장식)
    sc.stations.push({ x: 10, y: 5, w: 2, h: 1, activity: "robot", label: "🎮 로봇 조종대" });
    sc.labels.push({ text: "🎮 로봇 조종대", x: 11 * T, y: 5 * T - 4, small: true });
    sc.npcs.push({ id: "bolt", name: "볼트 박사", x: 5, y: 6, dir: "down", activity: "robot", actionLabel: "🤖 로봇 조종하기",
      look: { skin: 0, hair: "spiky", hairColor: "#9a9a9a", shirt: "#4fb3e8", acc: "glasses", coat: true },
      lines: ["어서 와! 나는 볼트 박사야.", "우리 로봇 삐삐가 배가 고프대. 배터리 🔋까지 가야 해!", "화살표로 길을 알려 주면 삐삐는 그 순서대로 움직여.", "컴퓨터에게 순서대로 일을 알려 주는 것, 이게 바로 코딩이야!"] });
    sc.npcs.forEach((n) => { sc.solid[n.y][n.x] = true; });
    sc.bgImage = "assets/robot.png";
    return sc;
  }

  function buildMagnet() {
    const sc = roomShell("magnet", "자석 실험실", 22, 14);
    place(sc, "window", 2, 1, 2, 2); place(sc, "board", 8, 1, 6, 2); place(sc, "window", 18, 1, 2, 2);
    place(sc, "magnets", 1, 3, 3, 1); place(sc, "jars", 15, 3, 3, 1); place(sc, "sink", 19, 3, 2, 1); place(sc, "shelf", 19, 4, 2, 2);
    place(sc, "labtable", 8, 6, 6, 2);
    place(sc, "plant", 1, 12, 1, 1); place(sc, "plant", 20, 12, 1, 1); place(sc, "rug", 2, 9, 4, 2, false); place(sc, "sofa", 16, 10, 3, 1);
    sc.stations.push({ x: 8, y: 6, w: 6, h: 2, activity: "magnet", label: "🧲 실험 테이블" });
    sc.labels.push({ text: "🧲 실험 테이블", x: 11 * T, y: 6 * T - 4, small: true });
    sc.npcs.push({ id: "snap", name: "찰싹 박사", x: 6, y: 6, dir: "down", activity: "magnet", actionLabel: "🧲 실험 시작",
      look: { skin: 2, hair: "pigtails", hairColor: "#e8685a", shirt: "#e8505b", acc: "glasses", coat: true },
      lines: ["안녕! 나는 찰싹 박사야.", "자석은 어떤 물건을 끌어당겨. 그런데 모든 물건을 당기지는 않아!", "먼저 붙을지 안 붙을지 예상해 보고, 실험으로 확인하자.", "과학자는 이렇게 예상하고 → 실험하고 → 알아낸단다!"] });
    sc.npcs.forEach((n) => { sc.solid[n.y][n.x] = true; });
    sc.bgImage = "assets/magnet.png";
    return sc;
  }

  // ───────────────────────── 바닥 그림 만들기 ─────────────────────────
  function render(sc) {
    const c = document.createElement("canvas");
    c.width = sc.w * T; c.height = sc.h * T;
    const ctx = c.getContext("2d"), p = painter(ctx);
    const r = rng(sc.id.length * 97 + 13);
    for (let j = 0; j < sc.h; j++) for (let i = 0; i < sc.w; i++) drawTile(p, sc.ground[j][i], i * T, j * T, r, sc, i, j);
    if (sc.floorGrid) {
      const g = sc.floorGrid;
      p(g.x * T - 4, g.y * T - 4, g.n * T + 8, g.n * T + 8, "#7d808c");
      for (let j = 0; j < g.n; j++) for (let i = 0; i < g.n; i++) p((g.x + i) * T + 1, (g.y + j) * T + 1, T - 2, T - 2, (i + j) % 2 ? "#c9cdd6" : "#dde0e6");
    }
    sc.paints.forEach(([k, x, y, w, h]) => furniture(ctx, k, x, y, w, h));
    if (sc.buildings) sc.buildings.forEach((b) => (b.style === "glass" ? drawGreenhouse : b.style === "dome" ? drawObservatory : drawHouse)(ctx, b));
    if (sc.garden) drawGardenFence(ctx, sc.garden);
    return c;
  }

  // AI 그림이 있으면 그걸 쓰고, 없으면 코드 그림을 써요
  function background(sc) {
    return new Promise((resolve) => {
      const fallback = () => resolve(render(sc));
      if (!sc.bgImage) return fallback();
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = fallback;
      img.src = sc.bgImage;
    });
  }

  function tree(v) { if (!TREES[v]) TREES[v] = treeSprite(v); return TREES[v]; }

  function buildAll() {
    return { village: buildVillage(), robot: buildRobot(), magnet: buildMagnet() };
  }

  return { T, buildAll, background, tree, render };
})();
