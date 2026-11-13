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
// ───── 3단계: 곤충, 꽃, 친구 선물 ─────
// 곤충: fly(날아다님), when(day/night/any), seasons(없으면 사계절), catch(잡힐 확률), w(잘 나오는 정도)
Object.assign(ITEMS, {
  butterfly:   { n: "나비", e: "🦋", k: "bug", sell: 150, fly: true, when: "day", seasons: ["spring", "summer", "autumn"], catch: 0.7, w: 30 },
  bee:         { n: "꿀벌", e: "🐝", k: "bug", sell: 200, fly: true, when: "day", seasons: ["spring", "summer", "autumn"], catch: 0.6, w: 14 },
  ladybug:     { n: "무당벌레", e: "🐞", k: "bug", sell: 120, when: "day", catch: 0.9, w: 25 },
  ant:         { n: "개미", e: "🐜", k: "bug", sell: 50, when: "day", catch: 1, w: 22 },
  caterpillar: { n: "애벌레", e: "🐛", k: "bug", sell: 80, when: "any", seasons: ["spring", "summer", "autumn"], catch: 1, w: 18 },
  snail:       { n: "달팽이", e: "🐌", k: "bug", sell: 100, when: "any", catch: 1, w: 18 },
  cricket:     { n: "귀뚜라미", e: "🦗", k: "bug", sell: 250, when: "night", seasons: ["summer", "autumn"], catch: 0.8, w: 25 },
  spider:      { n: "거미", e: "🕷️", k: "bug", sell: 300, when: "night", catch: 0.8, w: 15 },
  scorpion:    { n: "전갈", e: "🦂", k: "bug", sell: 1500, when: "night", seasons: ["summer", "autumn"], catch: 0.6, w: 3 },

  seed:     { n: "꽃씨", e: "🌱", k: "seed", buy: 30 },
  hibiscus: { n: "히비스커스", e: "🌺", k: "decor", sell: 400, s: 0.7 },
  bouquet:  { n: "무지개 꽃다발", e: "💐", k: "decor", sell: 900, s: 0.75 },

  // 친구가 주는 선물 (상점에서는 안 팔아요)
  carrot:  { n: "당근 쿠션", e: "🥕", k: "decor", sell: 300, block: true, s: 0.7 },
  honey:   { n: "꿀단지", e: "🍯", k: "decor", sell: 300, block: true, s: 0.65 },
  sherbet: { n: "빙수 모형", e: "🍧", k: "decor", sell: 300, block: true, s: 0.7 },
  crystal: { n: "수정 구슬", e: "🔮", k: "decor", sell: 300, block: true, s: 0.7, glow: true },
  circus:  { n: "서커스 천막", e: "🎪", k: "decor", sell: 1500, block: true, s: 1.3 },
  castle:  { n: "작은 성", e: "🏰", k: "decor", sell: 1500, block: true, s: 1.4 },
  boat:    { n: "돛단배", e: "⛵", k: "decor", sell: 1500, block: true, s: 1.2 },
  coaster: { n: "롤러코스터", e: "🎢", k: "decor", sell: 1500, block: true, s: 1.4 }
});
const BLOOMS = [["tulip", 25], ["daisy", 25], ["sunflower", 20], ["rose", 18], ["hibiscus", 9], ["bouquet", 3]];
const GROW_MS = 60 * 1000;      // 물을 주고 나서 한 단계 자라는 시간
const QUEST_MS = 4 * 60 * 1000; // 부탁을 들어준 뒤 다음 부탁까지
const GIFT_MS = 2 * 60 * 1000;  // 선물을 다시 받을 때까지

// 머리에 쓰는 것. pos: top(머리 위), side(옆머리), face(얼굴), neck(목), ears(직접 그림). buy가 없으면 친구 선물
const HATS = {
  pin:     { n: "꽃 머리핀", e: "🌸", buy: 250, pos: "side" },
  cap:     { n: "야구 모자", e: "🧢", buy: 300, pos: "top", s: 0.52, dy: 0.02 },
  straw:   { n: "밀짚모자", e: "👒", buy: 400, pos: "top", s: 0.6, dy: 0.04 },
  shades:  { n: "선글라스", e: "🕶️", buy: 500, pos: "face" },
  helmet:  { n: "안전모", e: "⛑️", buy: 500, pos: "top", s: 0.56, dy: 0.06 },
  ears:    { n: "고양이 귀", e: "🐱", buy: 600, pos: "ears" },
  phones:  { n: "헤드폰", e: "🎧", buy: 700, pos: "top", s: 0.64, dy: 0.17 },
  grad:    { n: "학사모", e: "🎓", buy: 800, pos: "top", s: 0.6, dy: 0.06 },
  ribbon:  { n: "토리의 리본", e: "🎀", pos: "top", s: 0.4, dy: 0.02 },
  tophat:  { n: "곰곰의 신사 모자", e: "🎩", pos: "top", s: 0.56, dy: 0.04 },
  scarf:   { n: "핑의 목도리", e: "🧣", pos: "neck" },
  crown:   { n: "루비의 왕관", e: "👑", pos: "top", s: 0.46, dy: 0.0 }
};
const PANTS = ["#5c5470", "#3f7fe0", "#ff8fb1", "#7ed07a", "#ffd84d", "#ffffff", "#8a5a35", "#2b2b3a"];

// 섬 친구. fav: 좋아하는 종류(선물하면 우정이 더 올라요), pool: 부탁하는 물건, gifts: 하트 1·3·5개 때 주는 선물("h:"는 모자)
const FRIENDS = {
  tori: { n: "토리", e: "🐰", home: [24, 21], fav: ["fruit"], favName: "과일", pool: ["apple", "peach", "orange", "cherry", "pear", "coconut", "daisy"], gifts: { 1: "carrot", 3: "h:ribbon", 5: "circus" },
    ask: "{item}만 가져다줄 수 있어? 간식으로 먹고 싶다 깡총!", thanks: "우와, 고마워! 역시 최고의 친구다 깡총!",
    lines: ["오늘도 깡총깡총 산책 중이야!", "나는 과일이 세상에서 제일 좋아 깡총.", "나무를 흔들면 과일이 톡 떨어지는 게 너무 신기해!", "네가 꾸민 섬, 정말 예쁘다 깡총!"] },
  gom: { n: "곰곰", e: "🐻", home: [9, 16], fav: ["fish"], favName: "물고기", pool: ["crucian", "shrimp", "tropical", "frog", "crab", "squid"], gifts: { 1: "honey", 3: "h:tophat", 5: "castle" },
    ask: "음… {item}가 필요한데, 좀 구해 줄 수 있겠곰?", thanks: "고맙곰! 덕분에 든든하곰.", 
    lines: ["낚시는 기다림이 중요하곰.", "찌가 쑥 들어갈 때 딱! 당기는 거곰.", "밤에는 귀한 물고기가 잘 잡힌다곰.", "배가 고프곰… 물고기 생각만 나곰."] },
  ping: { n: "핑", e: "🐧", home: [20, 26], fav: ["shell", "fish"], favName: "조개와 물고기", pool: ["shell", "star", "shrimp", "crucian", "coconut", "shell"], gifts: { 1: "sherbet", 3: "h:scarf", 5: "boat" },
    ask: "{item}를 모으고 있어 핑! 찾아 줄래?", thanks: "꺄, 반짝반짝해! 고마워 핑!",
    lines: ["바닷가에는 조개가 밀려와 핑!", "파도 소리 들으면 잠이 솔솔 와 핑.", "나는 추운 겨울이 제일 좋아 핑!", "불가사리는 별처럼 생겼어 핑!"] },
  ruby: { n: "루비", e: "🦊", home: [35, 19], fav: ["bug", "flower"], favName: "곤충과 꽃", pool: ["butterfly", "ladybug", "snail", "ant", "caterpillar", "tulip", "daisy", "rose"], gifts: { 1: "crystal", 3: "h:crown", 5: "coaster" },
    ask: "{item}를 관찰하고 싶어. 구해 줄 수 있어 콩?", thanks: "와, 멋지다! 내 보물로 삼을게 콩!",
    lines: ["나는 곤충 박사가 될 거야 콩!", "꽃씨를 심고 물을 주면 꽃이 핀대 콩.", "나비는 살금살금 다가가야 해 콩.", "밤에는 귀뚜라미가 노래해 콩."] }
};
const FLOWER_IDS = ["daisy", "tulip", "sunflower", "rose", "hibiscus", "bouquet", "blossom"];
function itemKind(id) { return FLOWER_IDS.includes(id) ? "flower" : ITEMS[id].k; }

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
  { n: "바닷가", ids: ["shell", "star"] },
  { n: "곤충", ids: ["butterfly", "bee", "ladybug", "ant", "caterpillar", "snail", "cricket", "spider", "scorpion"] },
  { n: "내가 키운 꽃", ids: ["tulip", "daisy", "sunflower", "rose", "hibiscus", "bouquet"] }
];
const DEX_TOTAL = DEX_GROUPS.reduce((sum, g) => sum + g.ids.length, 0);

function sellPrice(id) {
  const it = ITEMS[id];
  return it.sell != null ? it.sell : Math.floor((it.buy || 0) / 2);
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
