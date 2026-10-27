// 픽셀 꼬마 캐릭터 그리기
// 학생은 피부색·머리 모양·머리색·옷색·꾸미기를 골라요. 같은 모습은 한 번만 그려서 저장해 둬요.
"use strict";

const Avatar = (() => {
  const SKINS = ["#ffdcc0", "#f3c193", "#d79b69", "#a26a43"];
  const HAIR_COLORS = ["#3b2a20", "#7a4a26", "#d08a3e", "#f3cf5d", "#e8685a", "#f08bb4", "#5b8def", "#9a9a9a"];
  const SHIRTS = ["#ef5b5b", "#f59e3b", "#f5d33b", "#6cc56c", "#4fb3e8", "#7b6ef0", "#f07bbf", "#ffffff"];
  const HAIRS = ["short", "spiky", "bob", "pigtails", "bun", "long"];
  const HAIR_NAMES = { short: "짧은 머리", spiky: "삐죽 머리", bob: "단발", pigtails: "양갈래", bun: "똥머리", long: "긴 머리" };
  const ACCS = ["none", "glasses", "cap", "bow"];
  const ACC_NAMES = { none: "없음", glasses: "안경", cap: "모자", bow: "리본" };

  const W = 18, H = 28; // 테두리와 머리 위 장식 자리 포함
  const TOP = 3;
  const OUTLINE = "#3a2a22";
  const cache = new Map();

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")";
  }

  function randomConfig() {
    const pick = (a) => Math.floor(Math.random() * a.length);
    return { skin: pick(SKINS), hair: HAIRS[pick(HAIRS)], hairColor: pick(HAIR_COLORS), shirt: pick(SHIRTS), acc: "none" };
  }

  // 픽셀 판에 칠하기. 좌표는 테두리와 머리 위 여백을 뺀 칸 기준이에요.
  function makeGrid() {
    const g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill(null));
    const px = (x, y, c) => { x += 1; y += TOP; if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
    return { g, px, rect };
  }

  // dir: "down" | "up" | "right" ("left"는 "right"를 뒤집어요), frame: 0 서 있기, 1·2 걷기
  function paint(cfg, dir, frame) {
    const { g, px, rect } = makeGrid();
    const skin = SKINS[cfg.skin] || SKINS[0];
    const hair = typeof cfg.hairColor === "string" ? cfg.hairColor : HAIR_COLORS[cfg.hairColor] || HAIR_COLORS[0];
    const shirt = typeof cfg.shirt === "string" ? cfg.shirt : SHIRTS[cfg.shirt] || SHIRTS[0];
    const hairDark = shade(hair, 0.75);
    const shirtDark = shade(shirt, 0.82);
    const pants = cfg.pants || "#3d5a99";
    const shoe = "#4a3328";
    const bob = 0;

    // 긴 머리·단발 뒷머리는 몸 뒤에 먼저 그려요
    if (dir !== "up" && (cfg.hair === "long")) rect(2, 4, 12, 11, hairDark);

    // 다리
    const legY = 18;
    if (dir === "right") {
      if (frame === 1) { rect(5, legY, 2, 3, pants); rect(8, legY, 2, 2, pants); rect(4, legY + 3, 3, 1, shoe); rect(8, legY + 2, 3, 1, shoe); }
      else if (frame === 2) { rect(5, legY, 2, 2, pants); rect(8, legY, 2, 3, pants); rect(5, legY + 2, 3, 1, shoe); rect(8, legY + 3, 3, 1, shoe); }
      else { rect(6, legY, 4, 3, pants); rect(6, legY + 3, 5, 1, shoe); }
    } else {
      const l = frame === 1 ? 2 : 3, r = frame === 2 ? 2 : 3;
      rect(5, legY, 2, l, pants); rect(9, legY, 2, r, pants);
      rect(5, legY + l, 2, 1, shoe); rect(9, legY + r, 2, 1, shoe);
      rect(7, legY, 2, 1, pants);
    }

    // 몸통과 팔
    if (dir === "right") {
      rect(5, 12, 6, 6, shirt); rect(5, 17, 6, 1, shirtDark);
      const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
      rect(7 + swing, 13, 2, 4, shirtDark); rect(7 + swing, 17, 2, 1, skin);
    } else {
      rect(4, 12, 8, 6, shirt); rect(4, 17, 8, 1, shirtDark);
      const la = frame === 1 ? 1 : 0, ra = frame === 2 ? 1 : 0;
      rect(2, 13 - la, 2, 4, shirt); rect(2, 17 - la, 2, 1, skin);
      rect(12, 13 - ra, 2, 4, shirt); rect(12, 17 - ra, 2, 1, skin);
      if (dir === "down") { rect(7, 12, 2, 1, skin); }
    }

    // 머리(얼굴)
    rect(5, 1 + bob, 6, 1, skin);
    rect(4, 2 + bob, 8, 1, skin);
    rect(3, 3 + bob, 10, 7, skin);
    rect(4, 10 + bob, 8, 1, skin);
    rect(6, 11 + bob, 4, 1, shade(skin, 0.9));

    // 머리카락
    const H0 = 0 + bob;
    const top = () => { rect(5, H0, 6, 1, hair); rect(4, H0 + 1, 8, 1, hair); rect(3, H0 + 2, 10, 2, hair); };
    if (dir === "up") {
      top(); rect(3, H0 + 4, 10, 6, hair); rect(4, H0 + 10, 8, 1, hairDark);
      if (cfg.hair === "short" || cfg.hair === "spiky") rect(4, H0 + 10, 8, 1, shade(skin, 0.9));
      if (cfg.hair === "bob" || cfg.hair === "long") { rect(2, H0 + 3, 1, 8, hair); rect(13, H0 + 3, 1, 8, hair); }
      if (cfg.hair === "long") rect(3, H0 + 10, 10, 4, hair);
    } else if (dir === "right") {
      top(); rect(3, H0 + 4, 5, 4, hair); rect(3, H0 + 8, 3, 2, hair);
      rect(10, H0 + 4, 3, 1, hair);
      if (cfg.hair === "bob" || cfg.hair === "long") rect(2, H0 + 3, 3, 8, hair);
      if (cfg.hair === "long") rect(3, H0 + 10, 4, 4, hair);
    } else {
      top(); rect(3, H0 + 4, 2, 3, hair); rect(11, H0 + 4, 2, 3, hair);
      rect(5, H0 + 4, 2, 1, hair); rect(9, H0 + 4, 2, 1, hair);
      if (cfg.hair === "bob" || cfg.hair === "long") { rect(2, H0 + 3, 2, 8, hair); rect(12, H0 + 3, 2, 8, hair); }
    }
    if (cfg.hair === "spiky") { px(4, H0 - 1, hair); px(7, H0 - 1, hair); px(10, H0 - 1, hair); px(5, H0 - 1, hair); px(11, H0, hair); px(3, H0 + 1, hair); }
    if (cfg.hair === "pigtails") {
      if (dir !== "right") { rect(0, H0 + 4, 3, 4, hair); rect(13, H0 + 4, 3, 4, hair); rect(1, H0 + 8, 2, 1, hairDark); rect(13, H0 + 8, 2, 1, hairDark); }
      else rect(1, H0 + 4, 3, 4, hair);
    }
    if (cfg.hair === "bun") { rect(6, H0 - 2, 4, 2, hair); rect(7, H0 - 3, 2, 1, hair); }

    // 얼굴
    const eye = "#2b1d16", blush = "#f4a3a3";
    if (dir === "down") {
      rect(5, H0 + 6, 2, 2, eye); rect(9, H0 + 6, 2, 2, eye);
      px(5, H0 + 6, "#ffffff"); px(9, H0 + 6, "#ffffff");
      rect(4, H0 + 8, 1, 1, blush); rect(11, H0 + 8, 1, 1, blush);
      rect(7, H0 + 9, 2, 1, "#b0574a");
    } else if (dir === "right") {
      rect(10, H0 + 6, 2, 2, eye); px(10, H0 + 6, "#ffffff");
      rect(10, H0 + 8, 1, 1, blush);
      px(12, H0 + 9, "#b0574a");
    }

    // 꾸미기
    if (cfg.acc === "glasses" && dir !== "up") {
      const gl = "#2d2d3a";
      if (dir === "down") { rect(4, H0 + 5, 4, 1, gl); rect(8, H0 + 5, 4, 1, gl); rect(4, H0 + 8, 4, 1, gl); rect(8, H0 + 8, 4, 1, gl); px(4, H0 + 6, gl); px(4, H0 + 7, gl); px(11, H0 + 6, gl); px(11, H0 + 7, gl); px(7, H0 + 6, gl); px(8, H0 + 6, gl); }
      else { rect(9, H0 + 5, 4, 1, gl); rect(9, H0 + 8, 4, 1, gl); px(9, H0 + 6, gl); px(9, H0 + 7, gl); rect(5, H0 + 5, 4, 1, gl); }
    }
    if (cfg.acc === "cap") {
      const cap = cfg.capColor || shirt, capD = shade(cap, 0.75);
      rect(4, H0 - 1, 8, 1, cap); rect(3, H0, 10, 3, cap);
      if (dir === "down") rect(3, H0 + 3, 10, 1, capD);
      else if (dir === "right") rect(9, H0 + 3, 5, 1, capD);
    }
    if (cfg.acc === "bow" && dir !== "down") { rect(dir === "up" ? 6 : 4, H0, 4, 2, "#ff5d8f"); px(dir === "up" ? 7 : 5, H0, "#ffd1e0"); }
    if (cfg.acc === "bow" && dir === "down") { rect(10, H0, 4, 2, "#ff5d8f"); px(11, H0, "#ffd1e0"); }
    if (cfg.acc === "crown") {
      const c = "#ffcc33";
      rect(4, H0 - 1, 8, 2, c); px(4, H0 - 2, c); px(7, H0 - 2, c); px(8, H0 - 2, c); px(11, H0 - 2, c); px(7, H0, "#e8505b");
    }
    if (cfg.coat) { // 실험 가운(박사님들)
      if (dir === "right") { rect(5, 12, 6, 7, "#f4f4f4"); rect(7, 13, 2, 4, "#dcdcdc"); }
      else { rect(4, 12, 8, 7, "#f4f4f4"); rect(7, 12, 2, 7, shirt); rect(2, 13, 2, 4, "#f4f4f4"); rect(12, 13, 2, 4, "#f4f4f4"); }
    }
    return g;
  }

  // 색이 칠해진 칸 바깥쪽에 진한 테두리를 둘러요
  function outline(g) {
    const out = g.map((row) => row.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      const n = (g[y - 1] && g[y - 1][x]) || (g[y + 1] && g[y + 1][x]) || g[y][x - 1] || g[y][x + 1];
      if (n) out[y][x] = OUTLINE;
    }
    return out;
  }

  function toCanvas(g, flip) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const col = g[y][x];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(flip ? W - 1 - x : x, y, 1, 1);
    }
    return c;
  }

  function sprite(cfg, dir, frame) {
    const key = JSON.stringify(cfg) + dir + frame;
    let c = cache.get(key);
    if (!c) {
      const d = dir === "left" ? "right" : dir;
      c = toCanvas(outline(paint(cfg, d, frame)), dir === "left");
      cache.set(key, c);
    }
    return c;
  }

  // 대화창 얼굴 그림처럼 미리보기용으로 크게 그려요
  function drawPreview(canvas, cfg, dir = "down", frame = 0) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const s = Math.floor(Math.min(canvas.width / W, canvas.height / H));
    ctx.drawImage(sprite(cfg, dir, frame), (canvas.width - W * s) / 2, (canvas.height - H * s) / 2, W * s, H * s);
  }

  function drawFace(canvas, cfg) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const s = canvas.width / 16;
    ctx.drawImage(sprite(cfg, "down", 0), 1, 1, 16, 16, 0, canvas.height - 16 * s, 16 * s, 16 * s);
  }

  return { W, H, SKINS, HAIR_COLORS, SHIRTS, HAIRS, HAIR_NAMES, ACCS, ACC_NAMES, sprite, drawPreview, drawFace, randomConfig };
})();
