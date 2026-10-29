// 마을과 건물 안 지도
// 바닥 그림은 assets/의 AI 그림이에요. 여기에는 그 그림 위의 "보이지 않는 지도"를 적어요:
// 걸을 수 있는 곳, 막힌 곳, 문, NPC 자리, 활동 자리.
// 좌표는 칸 단위예요. 마을 그림(1536x1024)은 48x32칸, 건물 안 그림(1312x1199)은 20x18칸으로 나눠요.
// 사각형은 [왼쪽 x, 위 y, 오른쪽 x, 아래 y] (양 끝 포함)이에요.
// NPC는 assets/npc/아이디.webp 그림으로 그려요. look은 그 그림을 못 불러올 때 쓰는 코드 캐릭터예요.
"use strict";

const Maps = (() => {
  const T = 32; // 한 칸 크기(월드 픽셀)

  function grid(w, h, v) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(v)); return g; }
  function paint(g, [x0, y0, x1, y1], v) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < g[y].length) g[y][x] = v; }

  // ───────────────────────── 마을 ─────────────────────────
  const VILLAGE = {
    id: "village", name: "꼬마 발명가 마을", w: 48, h: 32, img: "assets/village.webp", backdrop: "#4e8a3a",
    walk: [
      [2, 9, 45, 30],                 // 가운데 넓은 풀밭과 길
      [13, 4, 19, 8], [28, 4, 33, 9], // 건물 사이 풀밭
      [23, 8, 23, 8]                  // 자석 실험실 앞 계단
    ],
    solid: [
      [0, 0, 47, 3], [0, 0, 2, 31], [45, 0, 47, 31], [0, 31, 47, 31],     // 가장자리 숲
      // 🤖 로봇 공장과 앞 상자·꽃
      [3, 2, 15, 9], [3, 10, 9, 10], [12, 10, 13, 10], [4, 11, 8, 11], [0, 7, 5, 10],
      // 🧲 자석 실험실, 기둥, 꽃밭, 탁자
      [18, 4, 19, 6], [18, 7, 22, 8], [19, 0, 28, 6], [19, 7, 22, 7], [25, 7, 28, 8], [27, 7, 29, 8], [28, 4, 30, 6],
      // 🌱 관찰 온실, 앞 화단, 울타리
      [31, 6, 35, 9], [33, 3, 44, 10], [32, 10, 35, 11], [39, 10, 44, 12], [31, 4, 32, 5], [44, 6, 47, 17],
      // 무대·게시판·광장 울타리·벤치·덤불
      [21, 13, 25, 15], [20, 14, 20, 14], [26, 14, 28, 16], [17, 11, 20, 12], [25, 11, 29, 12],
      [15, 15, 18, 18], [25, 18, 27, 19],
      // 🔭 별 관측소, 울타리, 바위, 덤불
      [5, 14, 18, 20], [5, 21, 9, 21], [11, 21, 13, 21], [2, 17, 5, 23], [6, 21, 9, 23],
      // 왼쪽 나무들
      [0, 10, 4, 25], [0, 25, 15, 31],
      // 🌻 반복 정원(울타리 안)
      [16, 22, 30, 31],
      // 🛠️ 발명 공방, 앞 탁자·상자·꽃
      [32, 14, 44, 19], [32, 20, 34, 20], [37, 20, 44, 20], [38, 21, 44, 22], [42, 21, 47, 23],
      // 연못, 표지판, 아래쪽 나무
      [37, 23, 47, 31], [36, 28, 36, 28], [31, 25, 33, 30], [34, 26, 35, 26]
    ],
    // 문: 이 칸에 닿으면 들어가요. out은 나올 때 서는 칸이에요.
    doors: [
      { id: "robot", x: 10, y: 10, w: 2, out: { x: 10, y: 11, dir: "down" } },
      { id: "magnet", x: 23, y: 7, w: 1, out: { x: 23, y: 9, dir: "down" } },
      { id: "greenhouse", x: 36, y: 11, w: 2, out: { x: 36, y: 13, dir: "down" } },
      { id: "observatory", x: 10, y: 21, w: 1, out: { x: 10, y: 22, dir: "down" } },
      { id: "workshop", x: 35, y: 20, w: 2, out: { x: 35, y: 21, dir: "down" } },
      { id: "garden", x: 22, y: 22, w: 3, out: { x: 23, y: 20, dir: "up" } },
      // 아래쪽 길 끝: 배움 동산(수학 탑·국어 도서관)으로 가는 길
      { id: "hill", x: 34, y: 30, w: 3, out: { x: 35, y: 28, dir: "up" }, name: "배움 동산", emoji: "📚" }
    ],
    // 건물 그림을 누르면 그 건물 문으로 걸어가요
    areas: [
      { id: "robot", r: [3, 2, 15, 10] }, { id: "magnet", r: [19, 0, 28, 8] }, { id: "greenhouse", r: [33, 3, 44, 12] },
      { id: "observatory", r: [5, 13, 18, 21] }, { id: "workshop", r: [32, 13, 44, 20] }, { id: "garden", r: [16, 22, 30, 30] }
    ],
    spawn: { x: 23, y: 19, dir: "down" },
    gather: { x: 23, y: 18 },
    npcs: [
      { id: "chief", name: "반짝 촌장", x: 19, y: 16, dir: "down",
        look: { skin: 1, hair: "short", hairColor: "#ffffff", shirt: "#7b6ef0", acc: "glasses" },
        lines: ["안녕! 꼬마 발명가 마을에 온 걸 환영해!", "이 마을 건물마다 코딩 놀이와 과학 실험이 숨어 있어.", "건물 여섯 곳에서 모두 활동을 할 수 있어. 가고 싶은 건물 문 앞까지 걸어가 봐!", "활동을 마치면 도장을 받아. 오른쪽 아래 📒 도장책을 눌러 봐.", "친구를 만나면 😊 버튼으로 인사해 보자!"] }
    ]
  };

  // ───────────────────────── 건물 안 ─────────────────────────
  // 문 옆 등불 기둥은 대부분의 방에 똑같이 있어요
  const LAMPS = [[7, 14, 8, 14], [11, 14, 12, 14]];

  const ROOMS = {
    robot: {
      name: "로봇 공장", emoji: "🤖", floor: [3, 5, 18, 14], door: { x: 9, y: 15, w: 2 },
      solid: [[16, 5, 18, 9], [16, 10, 18, 13], [3, 10, 3, 13], [6, 5, 6, 5], ...LAMPS],
      stations: [
        { x: 6, y: 6, w: 8, h: 7, walkable: true, activity: "robot" },   // 바닥 격자
        { x: 16, y: 10, w: 3, h: 3, activity: "robot", label: "🎮 로봇 조종대" }
      ],
      npcs: [{ id: "bolt", name: "볼트 박사", x: 4, y: 7, dir: "right", activity: "robot", actionLabel: "🤖 로봇 조종하기",
        look: { skin: 0, hair: "spiky", hairColor: "#9a9a9a", shirt: "#4fb3e8", acc: "glasses", coat: true },
        lines: ["어서 와! 나는 볼트 박사야.", "우리 로봇 삐삐가 배가 고프대. 배터리 🔋까지 가야 해!", "화살표로 길을 알려 주면 삐삐는 그 순서대로 움직여.", "컴퓨터에게 순서대로 일을 알려 주는 것, 이게 바로 코딩이야!"] }]
    },
    magnet: {
      name: "자석 실험실", emoji: "🧲", floor: [3, 5, 18, 14], door: { x: 9, y: 15, w: 2 },
      solid: [[7, 7, 12, 11], [6, 8, 6, 8], [6, 10, 6, 10], [13, 8, 13, 8], [13, 10, 13, 10], [3, 5, 3, 7], [3, 11, 3, 13],
        [5, 5, 6, 5], [17, 5, 18, 8], [17, 9, 18, 11], [17, 12, 18, 14], ...LAMPS],
      stations: [{ x: 7, y: 7, w: 6, h: 5, activity: "magnet", label: "🧲 실험 테이블" }],
      npcs: [{ id: "snap", name: "찰싹 박사", x: 4, y: 8, dir: "right", activity: "magnet", actionLabel: "🧲 실험 시작",
        look: { skin: 2, hair: "pigtails", hairColor: "#e8685a", shirt: "#e8505b", acc: "glasses", coat: true },
        lines: ["안녕! 나는 찰싹 박사야.", "자석은 어떤 물건을 끌어당겨. 그런데 모든 물건을 당기지는 않아!", "먼저 붙을지 안 붙을지 예상해 보고, 실험으로 확인하자.", "과학자는 이렇게 예상하고 → 실험하고 → 알아낸단다!"] }]
    },
    greenhouse: {
      name: "관찰 온실", emoji: "🌱", floor: [3, 5, 17, 13], door: { x: 9, y: 14, w: 2 },
      solid: [[6, 5, 13, 5], [14, 5, 17, 6], [17, 6, 17, 13], [3, 5, 4, 6], [3, 7, 4, 7], [3, 8, 3, 11], [7, 7, 12, 11]],
      stations: [{ x: 7, y: 7, w: 6, h: 5, activity: "greenhouse", label: "🌱 관찰 탁자" }],
      npcs: [{ id: "sprout", name: "새싹 정원사", x: 15, y: 9, dir: "left", activity: "greenhouse", actionLabel: "🌱 새싹 키우기",
        look: { skin: 2, hair: "bun", hairColor: "#7a4a26", shirt: "#6cc56c", acc: "none" },
        lines: ["어서 와! 여기는 관찰 온실이야.", "저기 화분들 보이니? 씨앗 → 싹 → 잎 → 꽃 순서로 자라고 있어.", "식물은 무엇을 먹고 자랄까? 직접 새싹을 키워 보면서 알아보자!"] }]
    },
    observatory: {
      name: "별 관측소", emoji: "🔭", floor: [2, 5, 18, 14], door: { x: 9, y: 15, w: 2 }, backdrop: "#1c1a33",
      solid: [[2, 5, 7, 5], [2, 6, 3, 6], [9, 5, 11, 6], [13, 5, 18, 5], [16, 6, 18, 6], [2, 7, 3, 10], [2, 11, 4, 13], [4, 12, 4, 13],
        [16, 7, 18, 10], [16, 11, 18, 14], [15, 13, 15, 14], ...LAMPS],
      stations: [{ x: 9, y: 5, w: 3, h: 2, activity: "observatory", label: "🔭 망원경" }],
      npcs: [{ id: "luna", name: "별지기 루나", x: 6, y: 8, dir: "right", activity: "observatory", actionLabel: "🔭 관측 시작",
        look: { skin: 0, hair: "long", hairColor: "#5b8def", shirt: "#2f3a7a", acc: "bow" },
        lines: ["반가워! 나는 밤하늘을 지키는 루나야.", "망원경으로 보면 달 모양이 날마다 조금씩 바뀌어.", "낮과 밤은 왜 생길까? 달 모양은 어떻게 바뀔까? 같이 관측해 보자!"] }]
    },
    workshop: {
      name: "발명 공방", emoji: "🛠️", floor: [3, 5, 16, 14], door: { x: 9, y: 15, w: 2 },
      solid: [[3, 6, 3, 10], [8, 5, 8, 5], [7, 7, 13, 11], [6, 8, 6, 10], [16, 9, 16, 9], [3, 11, 3, 13], ...LAMPS],
      stations: [{ x: 7, y: 7, w: 7, h: 5, activity: "workshop", label: "🛠️ 작업대" }],
      npcs: [{ id: "tinker", name: "뚝딱 발명가", x: 5, y: 6, dir: "down", activity: "workshop", actionLabel: "🛠️ 발명 시작",
        look: { skin: 3, hair: "spiky", hairColor: "#d08a3e", shirt: "#f59e3b", acc: "cap", capColor: "#4fb3e8" },
        lines: ["뚝딱뚝딱! 나는 발명가야.", "여기 바퀴, 프로펠러, 용수철, 전구가 잔뜩 있지?", "자동차, 날아다니는 것, 등불, 배! 부품을 잘 골라서 미션을 해결해 보자!"] }]
    },
    garden: {
      name: "반복 정원", emoji: "🌻", floor: [3, 4, 17, 12], door: { x: 9, y: 14, w: 2 }, backdrop: "#3f7a34",
      extra: [[6, 13, 13, 13]],
      solid: [[15, 4, 17, 4], [17, 4, 17, 6], [3, 5, 3, 7], [17, 10, 17, 12]],
      stations: [{ x: 4, y: 5, w: 12, h: 7, walkable: true, activity: "garden", label: "🌻 꽃밭" }],
      npcs: [{ id: "farmer", name: "콩콩 농부", x: 16, y: 8, dir: "left", activity: "garden", actionLabel: "🌻 꽃 심기",
        look: { skin: 1, hair: "short", hairColor: "#3b2a20", shirt: "#e8b04a", acc: "cap", capColor: "#f5d33b" },
        lines: ["안녕! 여기는 반복 정원이야.", "밭이 가로 6칸, 세로 4칸이야. 한 칸씩 심으면 24번이나 해야 해!", "\"해바라기 심기를 6번 반복해!\" 이렇게 말하면 한 줄을 한 번에 심을 수 있지. 같이 해 보자!"] }]
    }
  };

  // ───────────────────────── 배움 동산 ─────────────────────────
  // 그림 1312x1199를 40x36칸으로 나눠요. 위쪽 길과 아래쪽 문은 마을로 이어져요.
  // 수학 탑·국어 도서관 문에 들어가면 학년(1-2, 3-4, 5-6)을 골라 그 방으로 가요.
  const HILL = {
    id: "hill", name: "배움 동산", w: 40, h: 36, img: "assets/hill.webp", backdrop: "#4e8a3a",
    walk: [[3, 14, 37, 27], [19, 0, 21, 13], [19, 28, 21, 34]],
    solid: [
      [2, 14, 7, 15], [10, 14, 14, 14], [15, 14, 17, 14],          // 수학 탑 앞 꽃밭, 벤치
      [26, 14, 29, 15], [32, 14, 38, 16], [22, 14, 24, 14],        // 국어 도서관 앞 꽃밭, 벤치
      [18, 16, 23, 21], [13, 19, 13, 20], [26, 19, 26, 20],        // 분수, 가로등
      [14, 22, 16, 23], [23, 22, 25, 23],                          // 광장 벤치
      [3, 18, 5, 27], [6, 19, 7, 21], [2, 21, 6, 23], [4, 23, 7, 26], [8, 25, 11, 26], [6, 27, 9, 27], [15, 27, 18, 27], // 왼쪽 나무·게시판·울타리
      [25, 26, 29, 27], [30, 27, 32, 27], [32, 22, 38, 28], [35, 17, 39, 21], [37, 14, 39, 17] // 오른쪽 표지판·쉼터·나무
    ],
    doors: [
      { id: "tower", x: 8, y: 14, w: 2, out: { x: 8, y: 16, dir: "down" }, pick: ["math12", "math34", "math56"], name: "수학 탑", emoji: "🔢" },
      { id: "library", x: 30, y: 14, w: 2, out: { x: 30, y: 16, dir: "down" }, pick: ["kor12", "kor34", "kor56"], name: "국어 도서관", emoji: "📖" },
      { id: "top", x: 19, y: 0, w: 3, to: "village", out: { x: 20, y: 2, dir: "down" }, name: "마을로", emoji: "🏡" },
      { id: "bottom", x: 19, y: 34, w: 3, to: "village", out: { x: 20, y: 31, dir: "up" }, name: "마을로", emoji: "🏡" }
    ],
    areas: [{ id: "tower", r: [3, 0, 14, 13] }, { id: "library", r: [26, 3, 38, 13] }],
    spawn: { x: 20, y: 2, dir: "down" },
    npcs: [
      { id: "semsem", name: "셈셈 박사", x: 11, y: 17, dir: "down",
        lines: ["반가워! 나는 셈셈 박사야. 저기 도형 모자를 쓴 건물이 수학 탑이야.", "수학 탑에 들어가면 1-2학년, 3-4학년, 5-6학년 방 중에서 고를 수 있어.", "방마다 미션이 5개! 모두 통과하면 도장을 받아."] },
      { id: "mallang", name: "말랑 작가", x: 28, y: 18, dir: "down",
        lines: ["안녕! 나는 이야기를 쓰는 말랑 작가야.", "책 지붕 건물이 국어 도서관이야. 들어가서 내 학년 방을 골라 봐.", "한글 놀이방, 이야기 도서관, 꼬마 방송국이 기다리고 있어!"] }
    ]
  };

  // 수학·국어 방: 그림이 모두 같은 구조(아래 가운데 문, 가운데 큰 탁자)라 바닥은 같고 가구만 달라요.
  const TABLE = [[7, 7, 12, 10], [6, 8, 6, 9], [13, 8, 13, 9]];
  const QUIZ_ROOMS = {
    math12: { name: "숫자 놀이방", emoji: "🧸", parent: "hill", npc: "semsem", solid: [[2, 5, 2, 10], [2, 11, 4, 13], [17, 5, 17, 9], [17, 13, 17, 14]] },
    math34: { name: "측정 공방", emoji: "⚖️", parent: "hill", npc: "semsem", solid: [[2, 5, 4, 6], [2, 7, 2, 10], [2, 11, 3, 14], [17, 6, 17, 11], [17, 13, 17, 14], [13, 14, 16, 14]] },
    math56: { name: "수학 탐정 사무소", emoji: "🕵️", parent: "hill", npc: "semsem", solid: [[2, 7, 2, 13], [3, 11, 3, 13], [16, 8, 17, 11], [17, 5, 17, 7], [17, 12, 17, 14]] },
    kor12: { name: "한글 놀이방", emoji: "🧩", parent: "hill", npc: "mallang", solid: [[2, 5, 3, 8], [2, 9, 2, 13], [3, 13, 4, 13], [14, 5, 17, 6], [17, 7, 17, 9], [16, 10, 17, 12]] },
    kor34: { name: "이야기 도서관", emoji: "📚", parent: "hill", npc: "mallang", solid: [[2, 5, 5, 6], [2, 7, 2, 9], [2, 10, 3, 11], [2, 12, 2, 14], [4, 14, 4, 14], [15, 7, 17, 9], [17, 5, 17, 6], [16, 12, 17, 14], [15, 13, 15, 14]] },
    kor56: { name: "꼬마 방송국", emoji: "🎙️", parent: "hill", npc: "mallang", solid: [[2, 5, 4, 6], [3, 7, 3, 7], [2, 9, 2, 13], [3, 10, 3, 13], [4, 11, 4, 13], [16, 5, 17, 6], [16, 8, 17, 11], [16, 12, 17, 14]] }
  };
  const QUIZ_NPC = {
    semsem: { name: "셈셈 박사", line: (r) => ["어서 와! 여기는 " + r.name + "이야.", "가운데 탁자에서 수학 미션을 풀 수 있어. 5문제 중 4문제를 맞히면 통과!", "미션 5개를 모두 통과하면 도장을 줄게."] },
    mallang: { name: "말랑 작가", line: (r) => ["어서 와! 여기는 " + r.name + "이야.", "가운데 탁자에서 국어 미션을 풀 수 있어. 5문제 중 4문제를 맞히면 통과!", "미션 5개를 모두 통과하면 도장을 줄게."] }
  };
  Object.entries(QUIZ_ROOMS).forEach(([id, q]) => {
    ROOMS[id] = {
      name: q.name, emoji: q.emoji, parent: q.parent, floor: [2, 5, 17, 14], door: { x: 9, y: 15, w: 2 },
      solid: q.solid.concat(TABLE, LAMPS),
      stations: [{ x: 7, y: 7, w: 6, h: 4, activity: id, label: "📝 미션 탁자" }],
      npcs: [{ id: q.npc, name: QUIZ_NPC[q.npc].name, x: 4, y: 8, dir: "right", activity: id, actionLabel: "📝 미션 시작", lines: QUIZ_NPC[q.npc].line(q) }]
    };
  });

  function finish(sc) {
    sc.npcs.forEach((n) => { sc.solid[n.y][n.x] = true; });
    return sc;
  }

  function buildOutdoor(v) {
    const sc = { id: v.id, name: v.name, w: v.w, h: v.h, img: v.img, backdrop: v.backdrop, indoor: false,
      spawn: v.spawn, gather: v.gather, npcs: v.npcs.map((n) => Object.assign({}, n)), stations: [], labels: [], doors: [], areas: [] };
    sc.solid = grid(v.w, v.h, true);
    v.walk.forEach((r) => paint(sc.solid, r, false));
    v.solid.forEach((r) => paint(sc.solid, r, true));
    v.doors.forEach((d) => {
      const room = ROOMS[d.id] || d;
      paint(sc.solid, [d.x, d.y, d.x + d.w - 1, d.y], false);
      sc.doors.push({ x: d.x, y: d.y, w: d.w, to: d.pick ? null : d.to || d.id, pick: d.pick, id: d.id, name: room.name, emoji: room.emoji, out: d.out });
      const edge = d.y === 0 ? "top" : d.y === v.h - 2 || d.y === v.h - 1 || d.id === "hill" ? "bottom" : null;
      const text = room.emoji + " " + room.name + (edge === "top" ? " ▲" : edge === "bottom" ? " ▼" : "");
      const above = d.id === "garden" || edge === "bottom";
      sc.labels.push({ text, x: (d.x + d.w / 2) * T, y: above ? d.y * T - 4 : (d.y + 2) * T + 6, small: true });
    });
    v.areas.forEach((a) => sc.areas.push({ id: a.id, r: a.r, door: sc.doors.find((d) => d.id === a.id) }));
    return finish(sc);
  }

  function buildRoom(id) {
    const r = ROOMS[id];
    const sc = { id, name: r.name, emoji: r.emoji, w: 20, h: 18, img: "assets/" + id + ".webp", backdrop: r.backdrop || "#2a1712", indoor: true,
      npcs: r.npcs.map((n) => Object.assign({}, n)), stations: r.stations.map((s) => Object.assign({}, s)), labels: [], doors: [], areas: [] };
    sc.solid = grid(20, 18, true);
    paint(sc.solid, r.floor, false);
    (r.extra || []).forEach((x) => paint(sc.solid, x, false));
    r.solid.forEach((x) => paint(sc.solid, x, true));
    sc.stations.forEach((s) => { if (!s.walkable) paint(sc.solid, [s.x, s.y, s.x + s.w - 1, s.y + s.h - 1], true); });
    const d = r.door;
    paint(sc.solid, [d.x, d.y, d.x + d.w - 1, d.y], false);
    sc.doors.push({ x: d.x, y: d.y, w: d.w, to: r.parent || "village", id: "exit", name: "나가기" });
    sc.labels.push({ text: "▼ 나가기", x: (d.x + d.w / 2) * T, y: (d.y + 3) * T - 2, exit: true });
    sc.stations.forEach((s) => { if (s.label) sc.labels.push({ text: s.label, x: (s.x + s.w / 2) * T, y: s.y * T - 2, small: true }); });
    sc.spawn = { x: d.x, y: d.y - 1, dir: "up" };
    return finish(sc);
  }

  // 그림을 못 불러오면 칸 모양만이라도 보여 줘요
  function fallback(sc) {
    const c = document.createElement("canvas");
    c.width = sc.w * T; c.height = sc.h * T;
    const g = c.getContext("2d");
    for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) {
      g.fillStyle = sc.solid[y][x] ? (sc.indoor ? "#5e3820" : "#4c9a3f") : (sc.indoor ? "#e3a96a" : "#8fd16a");
      g.fillRect(x * T, y * T, T, T);
    }
    return c;
  }

  function background(sc) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(fallback(sc));
      img.src = sc.img;
    });
  }

  function buildAll() {
    const all = { village: buildOutdoor(VILLAGE), hill: buildOutdoor(HILL) };
    Object.keys(ROOMS).forEach((id) => { all[id] = buildRoom(id); });
    return all;
  }

  return { T, buildAll, background, fallback };
})();
