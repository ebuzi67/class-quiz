// 스페인 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, flag, makeChibi, tree, animated } = World.kit;
  const GOLD = "#e2b33c", WHITE = "#f4f1ea", BRONZE = "#5f7a6a";

  const mosaic = (cols, n = 10) => {
    const t = canvasTex(128, 128, (c) => {
      for (let i = 0; i < n * n; i++) { c.fillStyle = cols[Math.floor(Math.random() * cols.length)]; const x = (i % n) * (128 / n), y = Math.floor(i / n) * (128 / n); c.beginPath(); c.moveTo(x + Math.random() * 4, y); c.lineTo(x + 128 / n, y + Math.random() * 4); c.lineTo(x + 128 / n - Math.random() * 4, y + 128 / n); c.lineTo(x, y + 128 / n - Math.random() * 3); c.fill(); }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return new T.MeshLambertMaterial({ map: t });
  };

  function palacio(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(100, 40), mat("#e6dcc8")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 14); g.add(sq);
    fbox(g, 90, 22, 30, WHITE, "#4a4e54", 0, 0, -14, { tile: 3.6, roof: "#cfc8b8" });
    box(g, 92, 2, 31, "#e6e1d6", 0, 22, -14);
    for (let x = -44; x <= 44; x += 4) box(g, 0.8, 2, 0.8, "#e6e1d6", x, 24, 1);
    for (let i = 0; i < 14; i++) statue(g, WHITE, -39 + i * 6, 24, 1, 1);
    for (let i = 0; i < 8; i++) cyl(g, 0.8, 0.9, 18, "#f8f5ee", -10.5 + i * 3, 3, 1.6, 12);
    box(g, 26, 3, 3, "#e6e1d6", 0, 0, 1.5);
    flag(g, 0, 24, -14, 4);
  }

  function prado(g) {
    fbox(g, 100, 16, 22, "#d9a87a", "#4a4e54", 0, 0, -12, { style: "arch", tile: 4, roof: "#9aa3a6" });
    box(g, 30, 3, 8, "#e6dcc6", 0, 0, 2);
    for (let i = 0; i < 6; i++) cyl(g, 1, 1.1, 14, "#f4efe4", -10 + i * 4, 3, 4.6, 12);
    box(g, 30, 2, 8, "#e6dcc6", 0, 17, 2);
    // 벨라스케스 동상
    box(g, 3, 4, 3, "#9a8f80", 0, 0, 18);
    statue(g, BRONZE, 0, 4, 18, 1.7);
    for (const x of [-30, 30]) { const t = tree("round", 1.3); t.position.set(x, 0, 14); g.add(t); }
  }

  function retiro(g) {
    const lake = new T.Mesh(new T.CircleGeometry(20, 32), mat("#5fa8c8")); lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0.05, 16); g.add(lake);
    const glass = new T.MeshLambertMaterial({ color: "#c4e2ef", transparent: true, opacity: 0.55, side: T.DoubleSide });
    box(g, 36, 2, 20, "#d8cfba", 0, 0, -8);
    const body = new T.Mesh(new T.BoxGeometry(32, 12, 16), glass); body.position.set(0, 8, -8); g.add(body);
    const top = new T.Mesh(new T.SphereGeometry(8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass); top.position.set(0, 14, -8); top.scale.y = 1.4; g.add(top);
    const vault = new T.Mesh(new T.CylinderGeometry(8, 8, 32, 20, 1, true, 0, Math.PI), glass); vault.rotation.z = Math.PI / 2; vault.position.set(0, 14, -8); g.add(vault);
    for (let x = -16; x <= 16; x += 4) box(g, 0.25, 12, 0.25, "#5a6a72", x, 2, 0);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI; const r = new T.Mesh(new T.TorusGeometry(8, 0.12, 4, 20, Math.PI), mat("#5a6a72")); r.rotation.y = a; r.position.set(0, 14, -8); r.scale.y = 1.4; g.add(r); }
    // 호수의 보트
    for (const [x, z] of [[-8, 18], [6, 22]]) { const b = box(g, 1.6, 0.6, 3.4, "#2f6fd8", x, 0.1, z); animated.push((t) => { b.position.x = x + Math.sin(t * 0.4 + z) * 4; }); }
  }

  function plazaespana(g) {
    const BRICK = "#c96a4a";
    // 반달 모양 건물
    for (let i = 0; i < 13; i++) {
      const a = (-0.5 + i / 12) * Math.PI * 0.95;
      const b = fbox(g, 10, 14, 10, BRICK, "#4a3a2a", Math.sin(a) * 44, 0, -10 + Math.cos(a) * -20 + 20, { style: "arch", tile: 3, roof: "#b5543a" });
      b.position.set(Math.sin(a) * 44, 7, 20 - Math.cos(a) * 36);
      b.rotation.y = a;
    }
    for (const side of [-1, 1]) { box(g, 7, 40, 7, BRICK, side * 44, 0, 20); domeTop(g, side * 44, 20, 3, 40, 1.2, "#c8a050", BRICK); }
    // 물길과 다리 4개
    for (let i = 0; i < 20; i++) {
      const a = (-0.5 + i / 19) * Math.PI * 0.9;
      const w = box(g, 7.4, 0.2, 3, "#5fa8c8", Math.sin(a) * 32, 0.05, 20 - Math.cos(a) * 26); w.rotation.y = a + Math.PI / 2;
    }
    for (const a of [-0.9, -0.3, 0.3, 0.9]) { const b = box(g, 3, 1.2, 6, "#e6dcc6", Math.sin(a) * 32, 0, 20 - Math.cos(a) * 26); b.rotation.y = a; }
    // 지역별 타일 벤치
    const tiles = mosaic(["#1f5fa8", "#f2c230", "#ffffff", "#c8402e", "#3a8f5c"], 6);
    for (let i = 0; i < 9; i++) { const a = (-0.5 + i / 8) * Math.PI * 0.85; const b = box(g, 4, 1.2, 1, tiles, Math.sin(a) * 38, 0, 20 - Math.cos(a) * 31); b.rotation.y = a; }
  }

  function alhambra(g) {
    hill(g, 46, 14, 36, "#8a9a5a", 0, -12);
    const R = "#c27a54", Y = 12;
    for (const [x, z, w, d] of [[0, -26, 56, 3], [0, 6, 56, 3], [-28, -10, 3, 34], [28, -10, 3, 34]]) {
      box(g, w, 9, d, R, x, Y, z);
      const n = Math.round(Math.max(w, d) / 3);
      for (let i = 0; i < n; i++) { const u = -Math.max(w, d) / 2 + 1.5 + i * 3; box(g, w > d ? 1.4 : d, 1.2, w > d ? d : 1.4, R, w > d ? x + u : x, Y + 9, w > d ? z : z + u); }
    }
    for (const [x, z, h] of [[-28, -26, 20], [28, -26, 16], [-28, 6, 16], [28, 6, 22], [-8, -26, 18]]) box(g, 8, h, 8, "#b86a46", x, Y, z);
    // 사자 12마리가 받치는 분수 (성 앞마당)
    cyl(g, 5, 5.2, 0.8, "#efe6d2", 0, 0, 20, 24);
    cyl(g, 4.6, 4.6, 0.82, "#7fc4d6", 0, 0, 20, 24);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const l = ball(g, 0.6, "#efe6d2", Math.sin(a) * 2.4, 1.2, 20 + Math.cos(a) * 2.4); l.scale.set(0.5, 0.6, 0.8); }
    cyl(g, 2.6, 1.2, 0.8, "#efe6d2", 0, 1.8, 20, 16);
    for (let i = 0; i < 7; i++) flat(g, archShape(2.4, 5, true), "#8a5a3a", -12 + i * 4, 0.02, 10);
    box(g, 30, 7, 2, "#efe0c8", 0, 0, 9);
  }

  function boqueria(g) {
    fbox(g, 40, 10, 30, "#d8cfba", "#4a4e54", 0, 0, -14, { tile: 3, roof: "#5a6a72" });
    // 알록달록한 스테인드글라스 간판
    const sign = canvasTex(512, 160, (c) => {
      const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926", "#ff6fb5", "#9b5de5"];
      for (let i = 0; i < 40; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect((i % 10) * 51, Math.floor(i / 10) * 40, 50, 39); }
      c.fillStyle = "#1b1b1b"; c.fillRect(30, 50, 452, 60); c.fillStyle = "#ffffff"; c.font = "bold 38px sans-serif"; c.textAlign = "center"; c.fillText("MERCAT DE LA BOQUERIA", 256, 94);
    });
    const arch = new T.Mesh(new T.PlaneGeometry(20, 6), new T.MeshLambertMaterial({ map: sign })); arch.position.set(0, 12, 1.2); g.add(arch);
    for (const x of [-10, 10]) box(g, 1, 15, 1, "#3a3a3a", x, 0, 1);
    // 과일 가게
    const cols = ["#c8102e", "#f2a541", "#f6c90e", "#8ac926", "#9b5de5", "#ff6fb5"];
    for (let i = 0; i < 6; i++) {
      const x = -15 + i * 6;
      box(g, 5, 1.2, 3, "#8a5a35", x, 0, 8);
      for (let k = 0; k < 8; k++) ball(g, 0.4, cols[(i + k) % cols.length], x - 2 + (k % 4) * 1.3, 1.6 + Math.floor(k / 4) * 0.5, 7.4 + Math.floor(k / 4) * 0.8);
    }
    for (let i = 0; i < 4; i++) { const h = ball(g, 0.6, "#a0402e", -12 + i * 2, 4, 6); h.scale.set(0.5, 1.4, 0.5); }
  }

  function batllo(g) {
    const wall = mosaic(["#6fb0c8", "#9fd0d8", "#c8e0d0", "#f2d0a0", "#a8c8e8", "#e8b0c0"], 12);
    wall.map.repeat.set(3, 4);
    const body = box(g, 18, 26, 14, wall, 0, 0, -4);
    // 뼈 모양 기둥과 가면 모양 발코니
    for (const x of [-6, 0, 6]) { for (const y of [0]) { box(g, 1.2, 7, 1.2, "#efe6d2", x - 2.4, y, 3.2); box(g, 1.2, 7, 1.2, "#efe6d2", x + 2.4, y, 3.2); } flat(g, archShape(4, 6, true), "#3a4a5a", x, 0.02, 3.05); }
    for (let r = 0; r < 4; r++) for (const x of [-6, 0, 6]) { box(g, 2.6, 1.6, 0.8, "#efe6d2", x, 9 + r * 4, 3.4); ball(g, 0.3, "#3a4a5a", x - 0.6, 10 + r * 4, 3.85); ball(g, 0.3, "#3a4a5a", x + 0.6, 10 + r * 4, 3.85); }
    // 용의 등 같은 지붕
    const scales = ["#3a8f7a", "#e9a03a", "#c8402e", "#6fb0c8", "#9b5de5"];
    for (let i = 0; i < 12; i++) { const b = ball(g, 1.4, scales[i % scales.length], -8 + i * 1.45, 27 + Math.sin(i * 0.6) * 0.8, -4); b.scale.set(1, 1.6 - Math.abs(i - 6) * 0.08, 6); }
    // 십자가 탑
    cyl(g, 1.2, 1.2, 4, "#efe6d2", -7, 26, 1, 10); ball(g, 1, GOLD, -7, 31, 1);
    for (const x of [-18, 18]) fbox(g, 16, 22, 14, WHITE, "#3a4a35", x, 0, -4, { style: "shutter", tile: 3, roof: "#c0603f" });
  }

  function guell(g) {
    hill(g, 44, 10, 30, "#a8b070", 0, -16);
    // 과자 집 같은 입구 건물 두 채
    for (const [x, c] of [[-14, "#f2d2a0"], [14, "#efe0c0"]]) {
      box(g, 8, 8, 8, c, x, 0, 4);
      const roof = cone(g, 6, 8, "#a0602e", x, 8, 4, 10); roof.material = mosaic(["#a0602e", "#ffffff", "#c88040", "#5a3a20"], 8);
      cyl(g, 0.8, 1.2, 3, WHITE, x, 15, 4, 8); ball(g, 1.2, "#c8402e", x, 18.6, 4).scale.set(1.4, 0.7, 1.4);
      for (let k = 0; k < 6; k++) ball(g, 0.25, WHITE, x - 1 + (k % 3), 19.1, 3.4 + Math.floor(k / 3) * 1.2);
    }
    // 계단과 모자이크 도마뱀
    for (let i = 0; i < 8; i++) box(g, 10, (i + 1) * 0.6, 1.4, "#e6dcc6", 0, 0, 12 - i * 1.4);
    const liz = new T.Group();
    const lm = mosaic(["#3a8f5c", "#f2c230", "#3a86ff", "#e94f37", "#ff8a00"], 8);
    const bodyL = ball(liz, 1, "#3a8f5c", 0, 0, 0); bodyL.scale.set(1.2, 0.7, 3); bodyL.material = lm;
    const head = ball(liz, 0.8, "#3a8f5c", 0, 0.2, 3); head.material = lm;
    const tail = cone(liz, 0.6, 3, "#3a8f5c", 0, -0.2, -3, 8); tail.rotation.x = -Math.PI / 2; tail.material = lm;
    for (const [x, z] of [[-1.2, 1.2], [1.2, 1.2], [-1.2, -1.4], [1.2, -1.4]]) { const l = box(liz, 1.2, 0.3, 0.4, "#3a8f5c", x, -0.3, z); l.material = lm; }
    liz.position.set(0, 3.4, 9); liz.rotation.x = 0.35; g.add(liz);
    // 구불구불 긴 타일 벤치 (위쪽 광장)
    const bm = mosaic(["#ffffff", "#3a86ff", "#f2c230", "#e94f37", "#8ac926"], 10);
    for (let i = 0; i < 26; i++) { const x = -26 + i * 2; const b = box(g, 2.2, 1.6, 1.2, bm, x, 10, -8 + Math.sin(i * 0.6) * 2.4); b.rotation.y = Math.cos(i * 0.6) * 0.6; }
  }

  function sagradaTower(g, x, z, h, r) {
    cyl(g, r * 0.6, r, h, "#c9b490", x, 0, z, 12);
    for (let y = 4; y < h; y += 5) cyl(g, r * 0.62 + 0.1, r * 0.62 + 0.1, 0.6, "#b8a07a", x, y, z, 12);
    cone(g, r * 0.6, h * 0.25, "#c9b490", x, h, z, 12);
    ball(g, r * 0.35, ["#c8402e", "#f2c230", "#e9a03a"][Math.floor(Math.abs(x)) % 3], x, h + h * 0.25 + r * 0.2, z);
  }
  function sagrada(g) {
    fbox(g, 30, 30, 50, "#c9b490", "#4a5a7a", 0, 0, -24, { style: "arch", tile: 4, roof: "#a89470" });
    // 앞의 탄생의 파사드: 뾰족탑 네 개
    sagradaTower(g, -9, 0, 50, 3.2); sagradaTower(g, -3, 1, 58, 3.4); sagradaTower(g, 3, 1, 58, 3.4); sagradaTower(g, 9, 0, 50, 3.2);
    box(g, 22, 22, 4, "#b8a07a", 0, 0, 3);
    flat(g, archShape(6, 14, false), "#3a3530", 0, 0.02, 5.05);
    for (let i = 0; i < 20; i++) statue(g, "#c9b490", -9 + (i % 5) * 4.5, 14 + Math.floor(i / 5) * 2, 5.2, 0.5);
    // 가운데 가장 높은 탑과 주변 탑
    sagradaTower(g, 0, -24, 74, 5);
    for (const [x, z] of [[-8, -16], [8, -16], [-8, -32], [8, -32]]) sagradaTower(g, x, z, 56, 3.4);
    // 아직 짓는 중: 노란 크레인
    box(g, 1.4, 70, 1.4, "#f2c230", 20, 0, -10);
    const pivot = new T.Group(); pivot.position.set(20, 70, -10); g.add(pivot);
    box(pivot, 30, 1, 1, "#f2c230", -8, 0, 0);
    box(pivot, 4, 3, 3, "#3a3a3a", 6, -3, 0);
    animated.push((t) => { pivot.rotation.y = Math.sin(t * 0.2) * 0.6; });
  }

  World.register({
    builders: { palacio, prado, retiro, plazaespana, alhambra, boqueria, batllo, guell, sagrada },
    heights: { palacio: 30, prado: 22, retiro: 26, plazaespana: 46, alhambra: 36, boqueria: 18, batllo: 32, guell: 24, sagrada: 96 },
    radii: { palacio: 52, prado: 52, retiro: 42, plazaespana: 56, alhambra: 50, boqueria: 40, batllo: 52, guell: 50, sagrada: 50 }
  });
})();
