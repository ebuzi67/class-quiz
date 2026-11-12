"use strict";
// 몽글몽글 섬: 물건 목록과 섬 지도를 만드는 곳

const MW = 46, MH = 34;
const T_SEA = 0, T_SHALLOW = 1, T_SAND = 2, T_GRASS = 3, T_WATER = 4, T_BRIDGE = 5, T_PATH = 6;
const T_VOID = 7, T_WALL = 8, T_ROOM = 9, T_EXIT = 10;   // 집 안: 바깥, 벽, 방바닥, 나가는 문
const RW = 12, RH = 9;
const BAG_MAX = 30;
const REGROW_MS = 4 * 60 * 1000;   // 과일이 다시 열리는 시간
const SHELL_MS = 45 * 1000;        // 조개가 새로 밀려오는 시간
const SHELL_MAX = 7;

// k: 종류, sell: 팔 때 값, buy: 살 때 값, block: 지나갈 수 없음, s: 그림 크기
// 물고기는 w(잘 나오는 정도), win(당길 수 있는 시간·초), size(cm), where(사는 곳)
const ITEMS = {
  apple:   { n: "사과", e: "🍎", k: "fruit", sell: 100 },
  peach:   { n: "복숭아", e: "🍑", k: "fruit", sell: 100 },
  orange:  { n: "귤", e: "🍊", k: "fruit", sell: 100 },
  cherry:  { n: "체리", e: "🍒", k: "fruit", sell: 100 },
  pear:    { n: "배", e: "🍐", k: "fruit", sell: 100 },
  coconut: { n: "코코넛", e: "🥥", k: "fruit", sell: 250 },

  shell: { n: "조개", e: "🐚", k: "shell", sell: 60 },
  star:  { n: "불가사리", e: "⭐", k: "shell", sell: 150 },

  crucian:  { n: "붕어", e: "🐟", k: "fish", sell: 100, w: 50, win: 1.0, size: [12, 30], where: "fresh" },
  frog:     { n: "개구리", e: "🐸", k: "fish", sell: 150, w: 30, win: 0.9, size: [5, 12], where: "fresh" },
  crayfish: { n: "가재", e: "🦞", k: "fish", sell: 450, w: 12, win: 0.75, size: [8, 18], where: "fresh" },
  turtle:   { n: "자라", e: "🐢", k: "fish", sell: 800, w: 5, win: 0.65, size: [20, 40], where: "fresh" },
  shrimp:   { n: "새우", e: "🦐", k: "fish", sell: 200, w: 40, win: 1.0, size: [6, 15], where: "sea" },
  tropical: { n: "열대어", e: "🐠", k: "fish", sell: 300, w: 30, win: 0.9, size: [8, 20], where: "sea" },
  crab:     { n: "꽃게", e: "🦀", k: "fish", sell: 350, w: 22, win: 0.85, size: [10, 22], where: "sea" },
  squid:    { n: "오징어", e: "🦑", k: "fish", sell: 400, w: 18, win: 0.8, size: [20, 45], where: "sea" },
  puffer:   { n: "복어", e: "🐡", k: "fish", sell: 500, w: 12, win: 0.75, size: [15, 35], where: "sea" },
  octopus:  { n: "문어", e: "🐙", k: "fish", sell: 650, w: 8, win: 0.7, size: [30, 80], where: "sea" },
  shark:    { n: "상어", e: "🦈", k: "fish", sell: 3000, w: 1.5, win: 0.55, size: [150, 400], where: "sea" },
  can:  { n: "빈 깡통", e: "🥫", k: "trash", sell: 5, w: 6, win: 1.2, where: "fresh" },
  boot: { n: "낡은 장화", e: "👢", k: "trash", sell: 5, w: 6, win: 1.2, where: "sea" },

  daisy:     { n: "데이지", e: "🌼", k: "decor", buy: 60, s: 0.6 },
  tulip:     { n: "튤립", e: "🌷", k: "decor", buy: 80, s: 0.65 },
  sunflower: { n: "해바라기", e: "🌻", k: "decor", buy: 80, s: 0.75 },
  rose:      { n: "장미", e: "🌹", k: "decor", buy: 120, s: 0.65 },
  stone:     { n: "디딤돌", e: "⚪", k: "floor", buy: 30 },
  fence:     { n: "울타리", e: "🚧", k: "decor", buy: 60, block: true, draw: "fence" },
  mushroom:  { n: "버섯 장식", e: "🍄", k: "decor", buy: 150, block: true, s: 0.7 },
  balloon:   { n: "풍선", e: "🎈", k: "decor", buy: 200, block: true, s: 0.85 },
  lantern:   { n: "등불", e: "🏮", k: "decor", buy: 300, block: true, s: 0.75, glow: true },
  easel:     { n: "내 그림 이젤", e: "🖼️", k: "decor", buy: 300, block: true, draw: "easel" },
  lamp:      { n: "가로등", e: "💡", k: "decor", buy: 400, block: true, draw: "lamp", glow: true },
  snowman:   { n: "눈사람", e: "⛄", k: "decor", buy: 800, block: true, s: 0.9, season: "winter" },
  moai:      { n: "돌 조각상", e: "🗿", k: "decor", buy: 1200, block: true, s: 0.95 },
  tent:      { n: "텐트", e: "⛺", k: "decor", buy: 1500, block: true, s: 1.1 },
  fountain:  { n: "분수", e: "⛲", k: "decor", buy: 2000, block: true, s: 1.1 },
  carousel:  { n: "회전목마", e: "🎠", k: "decor", buy: 5000, block: true, s: 1.2 },
  wheel:     { n: "관람차", e: "🎡", k: "decor", buy: 8000, block: true, s: 1.5 },

  // 가구 (cat: "in")
  candle:   { n: "양초", e: "🕯️", k: "decor", buy: 200, cat: "in", s: 0.6, glow: true },
  cactus:   { n: "선인장 화분", e: "🌵", k: "decor", buy: 250, cat: "in", block: true, s: 0.7 },
  rug:      { n: "폭신 러그", e: "🧶", k: "floor", buy: 300, cat: "in" },
  books:    { n: "책 더미", e: "📚", k: "decor", buy: 300, cat: "in", block: true, s: 0.7 },
  cake:     { n: "케이크", e: "🎂", k: "decor", buy: 400, cat: "in", block: true, s: 0.65 },
  table:    { n: "나무 탁자", e: "🍽️", k: "decor", buy: 400, cat: "in", block: true, draw: "table" },
  sofa:     { n: "소파", e: "🛋️", k: "decor", buy: 500, cat: "in", block: true, s: 0.9 },
  bear:     { n: "곰 인형", e: "🧸", k: "decor", buy: 600, cat: "in", block: true, s: 0.75 },
  clock:    { n: "탁상시계", e: "🕰️", k: "decor", buy: 700, cat: "in", block: true, s: 0.7 },
  slate:    { n: "촬영 슬레이트", e: "🎬", k: "decor", buy: 800, cat: "in", block: true, s: 0.7 },
  globe:    { n: "지구본", e: "🌎", k: "decor", buy: 900, cat: "in", block: true, s: 0.7 },
  mic:      { n: "방송 마이크", e: "🎤", k: "decor", buy: 1000, cat: "in", block: true, s: 0.75 },
  guitar:   { n: "기타", e: "🎸", k: "decor", buy: 1200, cat: "in", block: true, s: 0.85 },
  bed:      { n: "침대", e: "🛏️", k: "decor", buy: 1500, cat: "in", block: true, s: 1.05 },
  gamepad:  { n: "게임기", e: "🎮", k: "decor", buy: 1800, cat: "in", block: true, s: 0.7 },
  bath:     { n: "욕조", e: "🛁", k: "decor", buy: 2000, cat: "in", block: true, s: 1.0 },
  tv:       { n: "텔레비전", e: "📺", k: "decor", buy: 2500, cat: "in", block: true, s: 0.9, glow: true },
  camera:   { n: "촬영 카메라", e: "🎥", k: "decor", buy: 2500, cat: "in", block: true, s: 0.85 },
  computer: { n: "컴퓨터", e: "🖥️", k: "decor", buy: 3000, cat: "in", block: true, s: 0.85 },
  trophy:   { n: "트로피", e: "🏆", k: "decor", buy: 3000, cat: "in", block: true, s: 0.75 },
  piano:    { n: "피아노", e: "🎹", k: "decor", buy: 4000, cat: "in", block: true, s: 1.0 },

  // 계절 한정 (그 계절에만 팔아요)
  blossom:  { n: "벚꽃", e: "🌸", k: "decor", buy: 200, season: "spring", s: 0.65 },
  clover:   { n: "네잎클로버", e: "🍀", k: "decor", buy: 400, season: "spring", s: 0.6 },
  parasol:  { n: "파라솔", e: "⛱️", k: "decor", buy: 600, season: "summer", block: true, s: 1.1 },
  melon:    { n: "수박", e: "🍉", k: "decor", buy: 300, season: "summer", block: true, s: 0.65 },
  pumpkin:  { n: "호박 등", e: "🎃", k: "decor", buy: 300, season: "autumn", block: true, s: 0.75, glow: true },
  maple:    { n: "단풍잎 더미", e: "🍁", k: "decor", buy: 200, season: "autumn", s: 0.65 },
  chestnut: { n: "알밤", e: "🌰", k: "decor", buy: 150, season: "autumn", s: 0.5 },
  xmas:     { n: "반짝 트리", e: "🎄", k: "decor", buy: 1000, season: "winter", block: true, s: 1.15, glow: true },
  gift:     { n: "선물 상자", e: "🎁", k: "decor", buy: 400, season: "winter", block: true, s: 0.7 }
};
const SEASONS = { spring: "🌸 봄", summer: "🌻 여름", autumn: "🍁 가을", winter: "⛄ 겨울" };
// 상점 진열대: out(바깥 꾸미기), in(가구), season(이번 계절 한정)
function shopList(tab, season) {
  return Object.keys(ITEMS).filter((id) => {
    const it = ITEMS[id];
    if (!it.buy) return false;
    if (it.season) return tab === "season" && it.season === season;
    return tab === (it.cat || "out");
  });
}
// 방 벽지와 바닥 (내 디자인도 쓸 수 있어요)
const WALLS = ["#ffe6ee", "#e3f4ff", "#e6f7dc", "#fff3c9", "#ece3ff", "#ffffff", "#ffd9b8", "#cfe9e2"];
const FLOORS = { wood: ["#e2b784", "#d8aa72"], cream: ["#fff3dc", "#f8e8c8"], pink: ["#ffd9e3", "#ffc9d8"], mint: ["#d3f3e3", "#c2ebd6"], sky: ["#d6ecfb", "#c5e2f7"], gray: ["#e3e5ec", "#d5d8e2"] };
const DEX_GROUPS = [
  { n: "바다 친구", ids: Object.keys(ITEMS).filter((id) => ITEMS[id].k === "fish" && ITEMS[id].where === "sea") },
  { n: "강·연못 친구", ids: Object.keys(ITEMS).filter((id) => ITEMS[id].k === "fish" && ITEMS[id].where === "fresh") },
  { n: "과일", ids: Object.keys(ITEMS).filter((id) => ITEMS[id].k === "fruit") },
  { n: "바닷가", ids: ["shell", "star"] }
];
const DEX_TOTAL = DEX_GROUPS.reduce((sum, g) => sum + g.ids.length, 0);

function sellPrice(id) {
  const it = ITEMS[id];
  return it.sell != null ? it.sell : Math.floor(it.buy / 2);
}

// 그림판 물감 20색
const PALETTE = ["#ffffff", "#2b2b3a", "#9aa0ad", "#e8505b", "#ffa3b8", "#ff5fa2", "#ff9a3c", "#ffd84d", "#b8e04a", "#4caf50",
  "#2bb5a0", "#7fd4f5", "#3f7fe0", "#8a5fd6", "#cdb4f5", "#8a5a35", "#f1dcb4", "#ffd2b0", "#b9f0d6", "#243a6b"];

const SKINS = ["#ffe0c8", "#ffd2b0", "#f1b98c", "#c98d5e", "#8d5a3b"];
const HAIRS = ["#3a2a22", "#6b4226", "#b5763a", "#f2c14e", "#ff8fb1", "#8a5fd6", "#3f7fe0", "#2bb5a0"];
const SHIRTS = ["#ff7f8f", "#ffb347", "#ffe066", "#7ed07a", "#6ec6f0", "#9b8cf0", "#ffffff", "#444a5c"];
const HAIR_STYLES = [["long", "긴 머리"], ["pig", "양갈래"], ["short", "단발"]];

function tileHash(x, y) {
  return (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0;
}

function buildRoom() {
  const at = (x, y) => {
    if (x < 1 || x > 10 || y < 0 || y > 8) return T_VOID;
    if (y < 2) return T_WALL;
    if (y <= 7) return T_ROOM;
    return (x === 5 || x === 6) ? T_EXIT : T_VOID;
  };
  return { at, statics: new Map([["2,2", { t: "wardrobe" }]]), start: [6, 7.4] };
}

function buildMap() {
  const tile = new Uint8Array(MW * MH);
  const cx = 23, cy = 17, rx = 18, ry = 12.5;
  const dist = (x, y) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    const a = Math.atan2(dy, dx);
    const wob = 1 + 0.08 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a + 2) + 0.04 * Math.sin(9 * a);
    return Math.hypot(dx, dy) / wob;
  };
  const riverX = (y) => 30 + Math.round(2 * Math.sin(y / 3));
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const d = dist(x, y);
      let t = d > 1 ? T_SEA : d > 0.84 ? T_SAND : T_GRASS;
      if (t !== T_SEA) {
        const r = riverX(y);
        if (x === r || x === r + 1) t = (y === 14 || y === 23) ? T_BRIDGE : T_WATER;
        else if (y === 14 && x >= 11 && x <= 36 && t === T_GRASS) t = T_PATH;
        else if (Math.hypot((x - 12) / 2.7, (y - 23) / 1.9) < 1) t = T_WATER;
      }
      tile[y * MW + x] = t;
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? T_SEA : tile[y * MW + x];
  const isLand = (t) => t === T_SAND || t === T_GRASS || t === T_PATH || t === T_BRIDGE;
  // 땅 바로 옆 바다는 얕은 바다
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (at(x, y) !== T_SEA) continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isLand(at(x + dx, y + dy)) || at(x + dx, y + dy) === T_WATER) near = true;
    if (near) tile[y * MW + x] = T_SHALLOW;
  }

  const statics = new Map();
  const put = (x, y, o) => {
    const k = x + "," + y;
    if (statics.has(k)) return false;
    statics.set(k, o);
    return true;
  };
  const buildings = [{ b: "home", x: 13, y: 11 }, { b: "shop", x: 19, y: 11 }];
  for (const bd of buildings) for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) put(bd.x + i, bd.y + j, { t: "bld", b: bd.b });
  put(22, 13, { t: "npc", b: "shop" });

  const trees = [["apple", 10, 16], ["apple", 17, 18], ["peach", 22, 20], ["peach", 25, 9], ["orange", 34, 11], ["orange", 37, 17],
    ["cherry", 9, 20], ["cherry", 20, 24], ["pear", 34, 21], ["pear", 26, 25], ["apple", 27, 17], ["peach", 16, 22]];
  for (const [fruit, x, y] of trees) if (at(x, y) === T_GRASS) put(x, y, { t: "tree", fruit });
  for (const [x, y] of [[8, 13], [17, 8], [23, 7], [36, 14], [38, 20], [24, 15], [14, 18], [33, 25], [6, 17], [35, 8], [21, 27], [11, 10]]) {
    if (at(x, y) === T_GRASS) put(x, y, { t: "pine" });
  }
  for (const [x, y] of [[18, 21], [33, 17], [8, 18], [26, 12]]) if (at(x, y) === T_GRASS) put(x, y, { t: "rock" });
  // 야자수: 가운데에서 바깥으로 나가다가 처음 만나는 모래밭에 심어요
  for (const deg of [15, 75, 150, 205, 265, 330]) {
    const a = deg * Math.PI / 180;
    for (let r = 4; r < 30; r += 0.25) {
      const x = Math.floor(cx + Math.cos(a) * r), y = Math.floor(cy + Math.sin(a) * r);
      if (at(x, y) === T_SAND && dist(x, y) > 0.9) { put(x, y, { t: "palm", fruit: "coconut" }); break; }
      if (at(x, y) === T_SEA || at(x, y) === T_SHALLOW) break;
    }
  }
  const sand = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (at(x, y) === T_SAND && !statics.has(x + "," + y)) sand.push([x, y]);
  return { tile, at, statics, buildings, sand, start: [17.5, 14.6] };
}
