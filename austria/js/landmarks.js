// 오스트리아 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, flag, makeChibi, tree, animated } = World.kit;
  const GOLD = "#e2b33c", COPPER = "#6f9a86", CREAM = "#efe3c9";

  function stephansdom(g) {
    const S = "#9a9182";
    fbox(g, 22, 22, 64, S, "#2f3a52", 0, 0, -34, { style: "arch", tile: 4, roof: "#3a3a3a" });
    // 알록달록한 타일 지붕 (지그재그와 독수리 무늬)
    const tiles = canvasTex(256, 128, (c) => {
      c.fillStyle = "#e9c64a"; c.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#1f6a4a" : "#1f1f1f"; c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16 + 8, 24); c.lineTo(i * 16 + 16, 0); c.fill(); }
      c.fillStyle = "#1f1f1f"; c.beginPath(); c.moveTo(128, 50); c.lineTo(100, 70); c.lineTo(112, 100); c.lineTo(128, 86); c.lineTo(144, 100); c.lineTo(156, 70); c.fill();
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#c8102e" : "#ffffff"; c.fillRect(i * 16, 112, 16, 16); }
    });
    const roof = gable(g, 22, 18, 64, "#3a3a3a", 0, 22, -34);
    roof.material = new T.MeshLambertMaterial({ map: tiles });
    // 남쪽의 아주 높은 탑과 북쪽의 작은 탑
    box(g, 12, 50, 12, S, 16, 0, -18);
    cone(g, 7.5, 70, "#7a7264", 16, 50, -18, 8);
    for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) cone(g, 0.8, 9, S, 16 + dx, 48, -18 + dz, 8);
    ball(g, 0.6, GOLD, 16, 120.4, -18);
    box(g, 11, 40, 11, S, -16, 0, -18);
    domeTop(g, -16, -18, 4.4, 40, 1.1, COPPER, S);
    box(g, 16, 26, 4, S, 0, 0, 0);
    flat(g, archShape(6, 10, true), "#2f2b26", 0, 0.02, 2.05);
    const sq = new T.Mesh(new T.PlaneGeometry(70, 30), mat("#cfc6b2")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 16); g.add(sq);
  }

  function staatsoper(g) {
    fbox(g, 56, 20, 34, "#d8cbb0", "#4a4e54", 0, 0, -16, { style: "arch", tile: 4, roof: COPPER });
    frustum(g, 56, 6, 34, 0.6, COPPER, 0, 20, -16);
    // 앞쪽 아치 회랑(로지아)과 위층 테라스
    box(g, 40, 14, 6, "#e0d4ba", 0, 0, 3);
    for (let i = 0; i < 5; i++) flat(g, archShape(5, 10, true), "#5a4c3c", -14 + i * 7, 0.02, 6.05);
    box(g, 40, 1, 7, "#cdbf9f", 0, 14, 3);
    for (let i = 0; i < 6; i++) statue(g, "#6a8a7a", -15 + i * 6, 15, 5, 1.1);
    for (const x of [-12, 12]) statue(g, GOLD, x, 26, -2, 1.4);
    flag(g, 0, 26, -10, 3);
  }

  function horse(g, x, z, color, rot = 0) {
    const h = new T.Group();
    ball(h, 1, color, 0, 1.6, 0).scale.set(0.7, 0.8, 1.4);
    box(h, 0.5, 1.4, 0.6, color, 0, 1.6, 1.2).rotation.x = -0.5;
    ball(h, 0.45, color, 0, 2.8, 1.7);
    for (const [lx, lz] of [[-0.4, 0.8], [0.4, 0.8], [-0.4, -0.8], [0.4, -0.8]]) box(h, 0.25, 1.2, 0.25, color, lx, 0, lz);
    h.position.set(x, 0, z); h.rotation.y = rot;
    g.add(h);
    return h;
  }
  function hofburg(g) {
    // 반원 모양의 신왕궁(노이에 부르크)과 미하엘 문의 초록 돔
    for (let i = 0; i < 9; i++) {
      const a = (-0.5 + i / 8) * 1.6;
      const b = fbox(g, 10, 20, 12, CREAM, "#4a4e54", Math.sin(a) * 40, 0, -40 + Math.cos(a) * 30, { tile: 3.4, roof: COPPER });
      b.rotation.y = a;
    }
    for (let i = 0; i < 14; i++) { const a = (-0.5 + i / 13) * 1.6; cyl(g, 0.7, 0.8, 14, "#f6efe0", Math.sin(a) * 33, 0, -40 + Math.cos(a) * 24, 10); }
    domeTop(g, 0, -24, 8, 20, 1.3, COPPER, CREAM);
    // 하얀 말 리피차너
    const sq = new T.Mesh(new T.PlaneGeometry(60, 30), mat("#d9cfb8")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 6); g.add(sq);
    for (const [x, z, r] of [[-8, 8, 0.5], [0, 12, 0], [8, 8, -0.5]]) {
      const h = horse(g, x, z, "#f6f4ee", r);
      const rider = makeChibi({ shirt: "#6b3a26", pants: "#f2efe6", hat: "tudor" }); rider.group.position.set(0, 2.1, 0); rider.group.scale.setScalar(0.9); rider.legL.rotation.z = 0.6; rider.legR.rotation.z = -0.6; h.add(rider.group);
      animated.push((t) => { h.position.y = Math.abs(Math.sin(t * 3 + x)) * 0.4; });
    }
  }

  function belvedere(g) {
    const pond = new T.Mesh(new T.PlaneGeometry(40, 18), mat("#7fb5cf")); pond.rotation.x = -Math.PI / 2; pond.position.set(0, 0.06, 18); g.add(pond);
    box(g, 42, 0.5, 20, "#d8cfba", 0, 0, 18);
    for (const x of [-30, 30]) for (let z = 8; z <= 30; z += 7) { const t = tree("cypress", 1); t.position.set(x, 0, z); g.add(t); }
    fbox(g, 70, 16, 16, "#f4ecd8", "#4a4e54", 0, 0, -8, { tile: 3.4, roof: COPPER });
    // 초록 구리 지붕 여러 개
    for (const [x, w, h] of [[-27, 16, 7], [-11, 12, 5], [0, 14, 9], [11, 12, 5], [27, 16, 7]]) frustum(g, w, h, 16, 0.3, COPPER, x, 16, -8);
    box(g, 14, 6, 4, "#f4ecd8", 0, 0, 1);
    for (let i = 0; i < 4; i++) cyl(g, 0.6, 0.7, 12, "#fbf6ea", -4.5 + i * 3, 0, 2.6, 10);
    statue(g, GOLD, 0, 25, -8, 1.2);
  }

  function hundertwasser(g) {
    const patch = (seed) => canvasTex(128, 128, (c) => {
      const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926", "#ff6fb5", "#ffffff", "#9b5de5", "#f2a541"];
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { c.fillStyle = cols[(i * 3 + j * 5 + seed) % cols.length]; c.fillRect(i * 22 + (j % 2) * 4, j * 22, 24, 22); }
      c.fillStyle = "#1f2d4a"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) c.fillRect(10 + i * 30, 10 + j * 30, 10, 12);
    });
    const blocks = [[-16, 14, 18], [-2, 18, 16], [12, 12, 14], [24, 16, 12]];
    blocks.forEach(([x, h, w], i) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, 16), new T.MeshLambertMaterial({ map: patch(i) }));
      m.position.set(x, h / 2, -8); m.rotation.y = (i % 2 ? 0.04 : -0.05); g.add(m);
      for (let k = 0; k < 3; k++) { const t = tree("round", 0.7); t.position.set(x - w / 3 + k * w / 3, h, -8); g.add(t); }
    });
    cyl(g, 2, 2, 4, "#f6c90e", -2, 18, -8, 12);
    ball(g, 2.4, GOLD, -2, 23.4, -8).scale.set(2.4, 2.8, 2.4);
    cone(g, 0.4, 2, GOLD, -2, 25.6, -8, 8);
    for (let x = -24; x <= 30; x += 2.4) box(g, 2.2, 0.3 + Math.random() * 0.5, 2, ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926"][Math.floor(Math.random() * 4)], x, 0, 4);
  }

  function riesenrad(g) {
    const wheel = new T.Group(); wheel.position.set(0, 34, 0); g.add(wheel);
    const STEEL = "#3f5a4a";
    for (const z of [-1.4, 1.4]) {
      const rim = new T.Mesh(new T.TorusGeometry(30, 0.5, 6, 64), mat(STEEL)); rim.position.z = z; wheel.add(rim);
      const inner = new T.Mesh(new T.TorusGeometry(24, 0.3, 6, 60), mat(STEEL)); inner.position.z = z; wheel.add(inner);
    }
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; const sp = box(wheel, 0.16, 30, 0.16, STEEL, 0, 0, 0); sp.position.set(Math.sin(a) * 15, Math.cos(a) * 15, 0); sp.rotation.z = -a; }
    const cabins = [];
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 2;
      const c = new T.Group();
      box(c, 3.2, 2.2, 2.4, "#c8102e", 0, -2.6, 0); box(c, 3.3, 0.8, 2.5, "#f4efe4", 0, -1.6, 0); box(c, 3.4, 0.3, 2.6, "#7a1a1a", 0, -0.4, 0);
      c.userData.a = a; wheel.add(c); cabins.push(c);
    }
    for (const x of [-10, 10]) { const leg = box(g, 1.4, 38, 1.4, STEEL, x / 2, 0, 0); leg.rotation.z = x > 0 ? -0.26 : 0.26; leg.position.set(x * 0.6, 17, -3); }
    box(g, 26, 3, 8, "#d8cbb0", 0, 0, 0);
    animated.push((t) => {
      const r = t * 0.04;
      for (const c of cabins) { const a = c.userData.a + r; c.position.set(Math.sin(a) * 30, Math.cos(a) * 30, 0); c.rotation.z = 0; }
    });
  }

  function schoenbrunn(g) {
    const Y = "#f2c64a";
    fbox(g, 110, 18, 18, Y, "#3c4652", 0, 0, -10, { tile: 3.4, roof: "#8a5a48" });
    frustum(g, 110, 4, 18, 0.7, "#8a5a48", 0, 18, -10);
    box(g, 22, 22, 20, Y, 0, 0, -9);
    for (let i = 0; i < 6; i++) cyl(g, 0.7, 0.8, 16, "#fbf2d0", -7.5 + i * 3, 2, 1.2, 10);
    gable(g, 22, 4, 20, "#8a5a48", 0, 22, -9);
    // 정원과 언덕 위 글로리에테
    const lawn = new T.Mesh(new T.PlaneGeometry(90, 26), mat("#8db866")); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.04, 14); g.add(lawn);
    hill(g, 34, 12, 14, "#86a85e", 0, -54);
    box(g, 30, 7, 3, "#efe6d2", 0, 11, -54);
    for (let i = 0; i < 7; i++) flat(g, archShape(2.6, 5, true), "#8a9a8a", -12 + i * 4, 11, -52.45);
    statue(g, GOLD, 0, 18, -54, 1.2);
    flag(g, 0, 22, -14, 3);
  }

  function hallstatt(g) {
    // 뒤의 눈 덮인 산
    for (const [x, z, r, h] of [[-30, -60, 30, 60], [10, -70, 36, 74], [44, -56, 26, 50]]) { cone(g, r, h, "#7a8a7a", x, 0, z, 10); cone(g, r * 0.34, h * 0.34, "#f4f6f8", x, h * 0.66, z, 10); }
    // 산비탈의 집들
    for (let i = 0; i < 9; i++) {
      const x = -32 + i * 8, y = (i % 3) * 3, z = -14 - (i % 3) * 6;
      fbox(g, 7, 8, 7, ["#f4efe4", "#efe2b8", "#e9c9b0", "#d9e8d8"][i % 4], "#3c4652", x, y, z, { tile: 2.4, roof: "#6b4a32" });
      const r = gable(g, 7, 3, 7.4, "#6b4a32", x, y + 8, z); r.rotation.y = Math.PI / 2;
    }
    // 뾰족탑 교회
    fbox(g, 8, 12, 14, "#f4efe4", "#3c4652", 18, 0, 4, { tile: 3, roof: "#5a4a3a" });
    box(g, 4, 24, 4, "#f4efe4", 18, 0, 12);
    cone(g, 2.6, 14, "#3a4a5a", 18, 24, 12, 8);
    // 호숫가 백조
    for (const x of [-12, -6]) { ball(g, 0.6, "#ffffff", x, 0.4, 20).scale.set(0.6, 0.4, 0.9); box(g, 0.2, 0.9, 0.2, "#ffffff", x, 0.6, 20.6); }
  }

  function mozart(g) {
    const Y = "#f2c64a";
    fbox(g, 12, 26, 12, Y, "#3c4652", 0, 0, -4, { tile: 2.6, roof: "#8a5a48" });
    frustum(g, 12, 4, 12, 0.5, "#8a5a48", 0, 26, -4);
    const sign = new T.Mesh(new T.PlaneGeometry(10, 1.6), new T.MeshLambertMaterial({ map: canvasTex(512, 80, (c) => { c.fillStyle = Y; c.fillRect(0, 0, 512, 80); c.fillStyle = "#3a2a1a"; c.font = "bold 44px Georgia, serif"; c.textAlign = "center"; c.fillText("Mozarts Geburtshaus", 256, 56); }) }));
    sign.position.set(0, 9, 2.05); g.add(sign);
    for (const x of [-14, 14]) fbox(g, 14, 20, 12, ["#f4efe4", "#e9c9b0"][x > 0 ? 1 : 0], "#3c4652", x, 0, -4, { tile: 2.6, roof: "#8a5a48" });
    // 모차르트 동상과 바이올린
    box(g, 3, 3, 3, "#c9bea6", 0, 0, 14);
    const m = statue(g, "#5f7a6a", 0, 3, 14, 1.8); m.armR.rotation.x = -1.4;
    box(g, 0.7, 0.2, 1.6, "#8a4a1a", -0.6, 5.6, 15).rotation.x = 0.4;
    // 모차르트쿠겔 초콜릿 (금박 공)
    for (let i = 0; i < 5; i++) ball(g, 0.5, i % 2 ? GOLD : "#c8102e", -4 + i * 2, 0.5, 18);
  }

  World.register({
    builders: { stephansdom, staatsoper, hofburg, belvedere, hundertwasser, riesenrad, schoenbrunn, hallstatt, mozart },
    heights: { stephansdom: 120, staatsoper: 32, hofburg: 40, belvedere: 30, hundertwasser: 28, riesenrad: 68, schoenbrunn: 30, hallstatt: 40, mozart: 32 },
    radii: { stephansdom: 50, staatsoper: 46, hofburg: 56, belvedere: 48, hundertwasser: 42, riesenrad: 40, schoenbrunn: 62, hallstatt: 48, mozart: 36 }
  });
})();
