// 이탈리아 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, facadeMat, canvasTex, frustum, archShape, flat, statue, hill, domeTop, spire, flag, makeChibi, tree, animated } = World.kit;
  const MARBLE = "#f4f1ea", GOLD = "#e2b33c", TRAV = "#e6dcc5";

  function amalfi(g) {
    // 바다 쪽 절벽과 층층이 붙은 알록달록한 집
    hill(g, 40, 30, 26, "#9a8a6a", 0, -16);
    const cols = ["#f2d98a", "#f0b8a8", "#ffffff", "#bfe0cf", "#e8a86a", "#f6e3b0", "#e98f7a"];
    let k = 0;
    for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) {
      const x = -16 + i * 7 + row * 3.5, y = row * 6.5, z = 6 - row * 5;
      fbox(g, 6, 6, 5, cols[k++ % cols.length], "#3e5a3a", x, y, z, { tile: 2, style: "shutter", roof: "#e9e1cf" });
    }
    domeTop(g, 4, -6, 3.4, 26, 1.1, "#3a8f5c", "#f6e3b0");
    for (const [x, z] of [[-24, 10], [22, 8], [-20, -2]]) { cyl(g, 0.2, 0.25, 1.6, "#6b4a32", x, 0, z, 6); ball(g, 1.4, "#4f8f3a", x, 2.4, z); for (let j = 0; j < 4; j++) ball(g, 0.3, "#f2d23a", x + Math.cos(j) * 1.2, 2.2 + (j % 2), z + Math.sin(j) * 1.2); }
    const sea = new T.Mesh(new T.PlaneGeometry(90, 40), mat("#3f8fb8")); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.03, -44); g.add(sea);
  }

  function pompeii(g) {
    const dirt = new T.Mesh(new T.PlaneGeometry(80, 56), mat("#cdb88e")); dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.03; g.add(dirt);
    for (let i = 0; i < 10; i++) cyl(g, 0.7, 0.8, 8 + (i % 3) * 2, "#e2d2b0", -22 + i * 4.8, 0, -8, 12);
    box(g, 50, 1.4, 4, "#d8c7a4", 0, 0, -8);
    box(g, 20, 1.6, 6, "#d8c7a4", 6, 10, -8);
    for (const [x, z, w, d, h] of [[-26, 8, 14, 1.2, 4], [-20, 14, 1.2, 12, 3], [18, 10, 16, 1.2, 5], [26, 4, 1.2, 12, 4], [0, 18, 10, 1.2, 2.5], [-10, -20, 18, 1.2, 6], [14, -22, 1.2, 10, 5]]) box(g, w, h, d, "#c9a37a", x, 0, z);
    // 아치 문과 빵집 화덕
    box(g, 8, 9, 3, "#c9a37a", -30, 0, -2); flat(g, archShape(4, 6, true), "#5a4c3c", -30, 0.02, -0.45);
    cyl(g, 1.6, 1.8, 1, "#9a8f80", 8, 0, 14, 12); dome(g, 1.6, "#a88a6a", 8, 1, 14);
    for (let x = -36; x <= 36; x += 3) box(g, 2.6, 0.12, 2.6, "#a89a86", x, 0, 24).rotation.y = Math.random() * 0.3;
  }

  function vesuvius(g) {
    const cone0 = new T.Mesh(new T.CylinderGeometry(12, 50, 34, 32), mat("#7a6a58")); cone0.position.set(0, 17, -16); g.add(cone0);
    const green = new T.Mesh(new T.CylinderGeometry(36, 52, 10, 32), mat("#7f9a5a")); green.position.set(0, 5, -16); g.add(green);
    const crater = new T.Mesh(new T.CircleGeometry(9, 24), mat("#3a2e26")); crater.rotation.x = -Math.PI / 2; crater.position.set(0, 34.05, -16); g.add(crater);
    for (let i = 0; i < 5; i++) {
      const p = ball(g, 3, "#d9d6d0", 0, 36, -16);
      const ph = i / 5;
      animated.push((t) => { const u = (t * 0.12 + ph) % 1; p.position.set(Math.sin(u * 6) * 2, 36 + u * 26, -16 + u * 4); p.scale.setScalar(2 + u * 6); p.material = mat(u > 0.6 ? "#e6e3dd" : "#cfcac2"); });
    }
    const sign = makeChibi({ shirt: "#f2c230", pants: "#3a4a6b", hat: "cap", hatColor: "#c8102e" });
    sign.group.position.set(10, 0, 26); g.add(sign.group);
  }

  function pisa(g) {
    const lawn = new T.Mesh(new T.PlaneGeometry(80, 50), mat("#8db866")); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.04, 0); g.add(lawn);
    // 기울어진 종탑: 아치가 둘러싼 원통 여러 층
    const tower = new T.Group(); tower.position.set(12, 0, 0); g.add(tower);
    const arcade = canvasTex(64, 64, (c) => { c.fillStyle = MARBLE; c.fillRect(0, 0, 64, 64); c.fillStyle = "#cfc8b8"; c.beginPath(); c.moveTo(16, 64); c.lineTo(16, 28); c.arc(32, 28, 16, Math.PI, 0); c.lineTo(48, 64); c.fill(); c.fillStyle = "#e9e4d8"; c.fillRect(0, 0, 64, 5); });
    arcade.wrapS = arcade.wrapT = T.RepeatWrapping; arcade.repeat.set(16, 1);
    const am = new T.MeshLambertMaterial({ map: arcade });
    for (let i = 0; i < 8; i++) {
      const h = i === 0 ? 7 : i === 7 ? 4 : 5.2, r = i === 7 ? 3.4 : 4.6;
      const y0 = i === 0 ? 0 : 7 + (i - 1) * 5.2;
      const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 24), [am, mat("#e9e4d8"), mat("#e9e4d8")]); m.position.y = y0 + h / 2; tower.add(m);
      cyl(tower, r + 0.3, r + 0.3, 0.4, "#e2dccd", 0, y0 + h - 0.2, 0, 24);
    }
    tower.rotation.z = 0.075;
    // 옆의 대성당
    fbox(g, 16, 16, 40, MARBLE, "#cfc8b8", -16, 0, -6, { style: "arch", tile: 3, roof: "#c9bea6" });
    gable(g, 16, 6, 40, "#c9bea6", -16, 16, -6);
    domeTop(g, -16, -10, 5, 18, 0.9, "#c9bea6", MARBLE);
    box(g, 18, 22, 2, MARBLE, -16, 0, 14.6);
    gable(g, 18, 6, 2, MARBLE, -16, 22, 14.6);
  }

  // 흰·초록 줄무늬 대리석 벽
  function stripeMat(base, line) {
    const t = canvasTex(64, 64, (c) => { c.fillStyle = base; c.fillRect(0, 0, 64, 64); c.fillStyle = line; c.fillRect(0, 0, 64, 6); c.fillRect(0, 0, 6, 64); c.fillRect(29, 20, 6, 30); c.fillStyle = "#e7a7a7"; c.fillRect(12, 40, 40, 4); });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(6, 4);
    return new T.MeshLambertMaterial({ map: t });
  }
  function florence(g) {
    const sm = stripeMat("#f4f1ea", "#3f7a5a");
    const nave = box(g, 18, 20, 56, sm, 0, 0, -16);
    gable(g, 18, 6, 56, "#b5543a", 0, 20, -16);
    const tr = box(g, 44, 18, 14, sm, 0, 0, -32);
    // 팔각형 빨간 지붕과 꼭대기 랜턴
    cyl(g, 13, 13, 8, "#f4f1ea", 0, 20, -32, 8);
    const d = dome(g, 13, "#c0603f", 0, 28, -32); d.scale.y = 20;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const rib = box(g, 0.6, 18, 0.6, "#f4f1ea", Math.sin(a) * 9, 29, -32 + Math.cos(a) * 9); rib.rotation.x = Math.cos(a) * -0.6; rib.rotation.z = Math.sin(a) * 0.6; }
    cyl(g, 2, 2, 5, "#f4f1ea", 0, 47, -32, 8); cone(g, 2.2, 4, "#f4f1ea", 0, 52, -32, 8); ball(g, 0.7, GOLD, 0, 56.6, -32);
    // 지오토의 종탑
    box(g, 8, 44, 8, sm, 18, 0, 8);
    box(g, 9, 1.2, 9, "#f4f1ea", 18, 44, 8);
    box(g, 20, 24, 2, sm, 0, 0, 12.4); gable(g, 20, 5, 2, "#f4f1ea", 0, 24, 12.4);
  }

  function milan(g) {
    const W = "#f2efe8";
    fbox(g, 50, 26, 50, W, "#c9c2b2", 0, 0, -24, { style: "arch", tile: 3, roof: "#e2ddd2" });
    box(g, 50, 30, 3, W, 0, 0, 1.5);
    gable(g, 50, 12, 3, W, 0, 30, 1.5);
    for (let i = 0; i < 11; i++) { const x = -22.5 + i * 4.5; cone(g, 0.7, 7 + (i % 2) * 3, W, x, 30 - Math.abs(x) * 0.35, 1.5, 8); }
    for (let x = -22; x <= 22; x += 4) for (let z = -44; z <= -6; z += 9) cone(g, 0.5, 6, W, x, 26, z, 6);
    for (const x of [-15, -5, 5, 15]) flat(g, archShape(x === -5 || x === 5 ? 5 : 3.6, 10, false), "#6a645c", x, 0.02, 3.05);
    // 가장 높은 탑의 금빛 마돈니나
    box(g, 4, 18, 4, W, 0, 26, -24);
    cone(g, 2.2, 10, W, 0, 44, -24, 8);
    statue(g, GOLD, 0, 53.6, -24, 1.2);
  }

  // 리알토 다리: 다리 바닥 위에 가게 줄과 가운데 아치 지붕
  function rialto(g) {
    const S = "#efe6d2";
    for (const side of [-1, 1]) for (let z = -22; z <= 22; z += 5.5) {
      if (Math.abs(z) < 4) continue;
      const x = side > 0 ? 10 : -2;
      fbox(g, 4, 3.6, 5, S, "#5a4c3c", x, 0, z, { style: "arch", tile: 2.5, roof: "#c0603f" });
    }
    box(g, 16, 7, 7, S, 4, 0, 0);
    gable(g, 16, 3, 7.4, "#c0603f", 4, 7, 0).rotation.y = Math.PI / 2;
    flat(g, archShape(4, 5, true), "#5a4c3c", 4, 0.02, 3.55);
    // 다리 아래 커다란 아치
    const arch = new T.Mesh(new T.TorusGeometry(26, 1.2, 8, 30, Math.PI), mat(S)); arch.rotation.y = Math.PI / 2; arch.position.set(4, -24, 0); arch.scale.set(1, 0.18, 1); g.add(arch);
    // 곤돌라
    for (const [x, z, r] of [[-30, 40 - 70, 0.3], [40, 60 - 70, -0.4], [-20, 85 - 70, 0.1]]) {
      const b = new T.Group();
      box(b, 1.4, 0.6, 11, "#151515", 0, -0.9, 0);
      box(b, 0.5, 1.6, 0.4, "#151515", 0, -0.6, 5.4); box(b, 0.3, 0.9, 0.3, "#d0b060", 0, -0.4, -5.2);
      const gond = makeChibi({ shirt: "#ffffff", pants: "#1b1b1b", hat: "straw", hatColor: "#e8c77a" }); gond.group.position.set(0, -0.3, -3.6); b.add(gond.group);
      cyl(b, 0.06, 0.06, 4.5, "#6b4a32", 0.6, -0.3, -3.6, 6).rotation.z = 0.5;
      b.position.set(x, -1.4, z); b.rotation.y = r; g.add(b);
      animated.push((t) => { b.position.x = x + Math.sin(t * 0.2 + z) * 8; });
    }
  }

  function burano(g) {
    const cols = ["#e9365c", "#f2c230", "#3aa0d8", "#3aa564", "#ff7f2a", "#9b5de5", "#00bbaa", "#f06aa0"];
    for (let i = 0; i < 8; i++) {
      const x = -28 + i * 8;
      fbox(g, 7.6, 10 + (i % 3) * 1.5, 8, cols[i], "#f4f1ea", x, 0, -4, { style: "shutter", tile: 2.6, roof: "#c0603f" });
    }
    const canal = new T.Mesh(new T.PlaneGeometry(70, 8), mat("#4f8fb0")); canal.rotation.x = -Math.PI / 2; canal.position.set(0, 0.05, 6); g.add(canal);
    for (const x of [-20, 4, 22]) { box(g, 4.4, 0.6, 1.4, "#1f6aa8", x, 0.05, 6).rotation.y = 0.2; }
    // 기울어진 종탑
    const t = box(g, 4, 30, 4, "#d8b088", 34, 0, -10); t.rotation.z = -0.06;
    cone(g, 3, 6, "#9aa3a6", 34 + 1.8, 30, -10, 4);
  }

  function sanmarco(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(70, 70), mat("#d9cfb8")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 30); g.add(sq);
    fbox(g, 46, 18, 34, "#e6d6b8", "#7a6a50", 0, 0, -14, { style: "arch", tile: 4, roof: "#a99a80" });
    box(g, 48, 2, 4, "#e6d6b8", 0, 18, 2);
    // 황금빛 모자이크 아치 다섯 개
    for (const [x, w] of [[-18, 6], [-9, 6], [0, 8], [9, 6], [18, 6]]) {
      flat(g, archShape(w, 12, true), "#5a4c3c", x, 0.02, 3.05);
      flat(g, archShape(w, 6, true), GOLD, x, 12, 3.05);
    }
    for (const [x, z, r] of [[0, -10, 7], [-14, -6, 5], [14, -6, 5], [0, -24, 5], [0, 4, 5]]) domeTop(g, x, z, r, 20, 1.1, "#8a9a9e", "#e6d6b8");
    // 붉은 벽돌 종탑과 초록 뾰족 지붕
    box(g, 9, 46, 9, "#b2563f", 30, 0, 18);
    box(g, 10, 6, 10, "#efe6d2", 30, 46, 18);
    cone(g, 7, 14, "#5f8f7a", 30, 52, 18, 4);
    statue(g, GOLD, 30, 66, 18, 1.1);
    flag(g, -16, 0, 34, 4); flag(g, 16, 0, 34, 4);
  }

  World.register({
    builders: { amalfi, pompeii, vesuvius, pisa, florence, milan, rialto, burano, sanmarco },
    heights: { amalfi: 34, pompeii: 20, vesuvius: 46, pisa: 44, florence: 56, milan: 56, rialto: 20, burano: 30, sanmarco: 64 },
    radii: { amalfi: 44, pompeii: 46, vesuvius: 54, pisa: 46, florence: 50, milan: 50, rialto: 44, burano: 40, sanmarco: 54 }
  });
})();
