// 체코 탐방: 명소 9곳의 3D 건물 (상자·원기둥·원뿔을 쌓아서 만들어요)
// 각 함수는 g(명소 그룹)에 건물을 붙여요. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, spire, flag, tree, clockTex, animated } = World.kit;
  const SLATE = "#3b3d44", BRONZE = "#5f7468", GOLD = "#e2b33c";

  function dancing(g) {
    // 오른쪽 '프레드': 둥근 건물과 꼭대기 철 장식
    const fred = fbox(g, 1, 1, 1, "#d9d2c3", "#3c4652", 8, 0, 0, { tile: 2.6 });
    fred.geometry = new T.CylinderGeometry(7, 7, 26, 24); fred.position.set(8, 13, 0);
    fred.material = new T.MeshLambertMaterial({ map: (() => { const m = World.kit.facadeMat("#d9d2c3", "#3c4652", "tall").map.clone(); m.repeat.set(10, 8); m.needsUpdate = true; return m; })() });
    const crown = new T.Mesh(new T.SphereGeometry(5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshLambertMaterial({ color: "#9aa3a8", wireframe: true }));
    crown.position.set(8, 26, 0); g.add(crown);
    // 왼쪽 '진저': 허리가 잘록한 유리 탑
    const glass = new T.MeshLambertMaterial({ color: "#a8cde0", transparent: true, opacity: 0.75 });
    for (const [y, rt, rb] of [[0, 4.2, 6], [9, 6, 4.2], [18, 4.8, 6]]) { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, 9, 20), glass); m.position.set(-5, y + 4.5, 2); g.add(m); }
    for (let y = 2; y < 27; y += 3) cyl(g, 0.15, 0.15, 0.3, "#5a6066", -5, y, 2, 8).scale.set(40, 1, 40);
    fbox(g, 20, 22, 16, "#e8e2d4", "#3c4652", 22, 0, -6, { tile: 3 });
  }

  function wenceslas(g) {
    // 국립박물관: 가운데 둥근 지붕
    fbox(g, 60, 18, 18, "#d8cbb0", "#4a4e54", 0, 0, -16, { tile: 3.6, roof: "#5d6770" });
    box(g, 22, 4, 4, "#cdbf9f", 0, 0, -5);
    for (let i = 0; i < 6; i++) cyl(g, 0.8, 0.9, 14, "#e6dcc6", -7.5 + i * 3, 4, -4, 12);
    gable(g, 22, 4, 4, "#cdbf9f", 0, 18, -5);
    domeTop(g, 0, -16, 7, 18, 1.2, "#6a8a7a", "#d8cbb0");
    for (const x of [-26, 26]) { box(g, 8, 22, 8, "#d8cbb0", x, 0, -14); dome(g, 3, "#6a8a7a", x, 22, -14).scale.y = 4; }
    // 말을 탄 성 바츨라프 청동상
    box(g, 6, 5, 5, "#9a8f80", 0, 0, 14);
    ball(g, 1, BRONZE, 0, 7.4, 14).scale.set(1, 1.2, 2.2);
    ball(g, 0.7, BRONZE, 0, 9, 16.4);
    for (const [x, z] of [[-0.6, 12.8], [0.6, 12.8], [-0.6, 15.2], [0.6, 15.2]]) box(g, 0.4, 2.6, 0.4, BRONZE, x, 5, z);
    statue(g, BRONZE, 0, 8, 14, 1.3);
    // 광장의 긴 잔디와 가로등
    for (const x of [-10, 10]) { box(g, 6, 0.1, 40, "#8db866", x, 0, 30); }
  }

  function powder(g) {
    fbox(g, 11, 32, 11, "#5b5550", "#2a2826", 0, 0, 0, { style: "slit", tile: 2.8, roof: "#4a4642" });
    for (const y of [10, 20]) box(g, 11.6, 0.8, 11.6, "#6a645e", 0, y, 0);
    cone(g, 8.4, 18, SLATE, 0, 32, 0, 4);
    for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) cone(g, 1, 7, SLATE, dx, 32, dz, 8);
    ball(g, 0.6, GOLD, 0, 50.6, 0);
    flat(g, archShape(6, 9, false), "#2a2826", 0, 0.02, 5.55);
    box(g, 26, 14, 9, "#e9dcc0", 18, 0, -1);
    box(g, 26, 14, 9, "#e9dcc0", -18, 0, -1).material = mat("#e9c49a");
  }

  function tynTower(g, x) {
    box(g, 7, 34, 7, "#cfc3a8", x, 0, -6);
    cone(g, 5.4, 28, SLATE, x, 34, -6, 8);
    for (const [dx, dz] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) { cone(g, 1, 9, SLATE, x + dx, 34, -6 + dz, 8); ball(g, 0.35, GOLD, x + dx, 43.3, -6 + dz); }
    ball(g, 0.6, GOLD, x, 62.4, -6);
  }
  function oldtown(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(70, 46), mat("#cdbfa6"));
    sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 10); g.add(sq);
    // 틴 성당: 앞 건물과 뒤의 두 탑
    fbox(g, 16, 24, 30, "#cfc3a8", "#3f4d6b", 0, 0, -16, { style: "arch", tile: 4, roof: SLATE });
    gable(g, 16, 10, 30, SLATE, 0, 24, -16);
    tynTower(g, -8); tynTower(g, 8);
    // 성당 앞을 가리는 알록달록한 집들 (실제로도 앞에 집이 있어요)
    [["#f2d98a", -18], ["#f0b8a8", -6], ["#bfe0cf", 6], ["#f4ead6", 18]].forEach(([c, x]) => { fbox(g, 12, 14, 8, c, "#3c4652", x, 0, 2, { tile: 3, roof: "#b5462e" }); const r = gable(g, 8, 4, 12, "#b5462e", x, 14, 2); r.rotation.y = Math.PI / 2; });
    // 얀 후스 동상
    box(g, 12, 2, 6, "#9a8f80", 0, 0, 20);
    for (const x of [-4, -1.5, 1.5, 4]) statue(g, "#4f5d55", x, 2, 20, 1.2, (x / 10));
    statue(g, "#4f5d55", 0, 2, 19, 1.8);
  }

  function orloj(g) {
    // 구시청사 탑
    fbox(g, 11, 44, 11, "#cdbf9f", "#3a3530", 0, 0, -2, { style: "slit", tile: 3, roof: "#4a4642" });
    box(g, 13, 2, 13, "#b9ad94", 0, 44, -2);
    cone(g, 6.4, 12, SLATE, 0, 46, -2, 4);
    for (const [dx, dz] of [[-6, -8], [6, -8], [-6, 4], [6, 4]]) cone(g, 0.9, 6, SLATE, dx, 44, -2 + dz, 8);
    // 시계판 두 개: 위는 천문 시계, 아래는 달력판
    const dial = canvasTex(256, 256, (c) => {
      c.fillStyle = "#1f3f7a"; c.fillRect(0, 0, 256, 256);
      c.fillStyle = "#4a7fc1"; c.beginPath(); c.arc(128, 128, 120, Math.PI, 0); c.fill();
      c.fillStyle = "#c9672c"; c.beginPath(); c.arc(128, 128, 120, 0, Math.PI); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 10; c.beginPath(); c.arc(128, 128, 120, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.arc(150, 112, 60, 0, Math.PI * 2); c.stroke();
      c.fillStyle = GOLD; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; c.fillRect(128 + Math.cos(a) * 104 - 4, 128 + Math.sin(a) * 104 - 4, 8, 8); }
    });
    const face = new T.Mesh(new T.CircleGeometry(4.2, 32), new T.MeshLambertMaterial({ map: dial }));
    face.position.set(0, 14, 3.6); g.add(face);
    const hand = box(g, 0.3, 3.8, 0.1, GOLD, 0, 0, 3.7); hand.geometry = hand.geometry.clone(); hand.position.set(0, 14, 3.7);
    hand.geometry.translate(0, 0.5, 0);
    animated.push((t) => { hand.rotation.z = -t * 0.3; });
    const cal = canvasTex(128, 128, (c) => { c.fillStyle = "#e9dcc0"; c.fillRect(0, 0, 128, 128); c.strokeStyle = GOLD; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.stroke(); c.fillStyle = "#c8102e"; c.beginPath(); c.arc(64, 64, 18, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = "#3a6a4a"; c.beginPath(); c.arc(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40, 8, 0, Math.PI * 2); c.fill(); } });
    const calm = new T.Mesh(new T.CircleGeometry(3.4, 32), new T.MeshLambertMaterial({ map: cal })); calm.position.set(0, 6, 3.6); g.add(calm);
    box(g, 10, 22, 1, "#bfae8a", 0, 2, 3);
    gable(g, 10, 3, 1.2, "#5a5048", 0, 24, 3.2);
    for (const x of [-1.3, 1.3]) box(g, 1.6, 2, 0.2, "#2a2a2a", x, 19.5, 3.56);
    statue(g, "#f2efe6", -4.4, 12, 4, 0.9);
    statue(g, "#f2efe6", 4.4, 12, 4, 0.9);
    // 옆 건물들
    fbox(g, 30, 16, 12, "#e8d3b0", "#3c4652", -20, 0, -4, { tile: 3, roof: "#b5462e" });
  }

  function klementinum(g) {
    fbox(g, 70, 16, 18, "#efe3c9", "#4a4e54", 0, 0, -10, { tile: 3.4, roof: "#7a5a48" });
    box(g, 72, 1, 19, "#e0d2b4", 0, 16, -10);
    frustum(g, 70, 4, 18, 0.7, "#7a5a48", 0, 17, -10);
    // 천문탑과 꼭대기의 아틀라스 동상
    fbox(g, 10, 30, 10, "#efe3c9", "#4a4e54", 0, 0, -8, { tile: 3, roof: "#7a5a48" });
    domeTop(g, 0, -8, 4, 30, 1.2, "#5a7a6a", "#efe3c9");
    statue(g, GOLD, 0, 39, -8, 1.4);
    ball(g, 1.2, GOLD, 0, 43.4, -8);
    // 바로크 도서관 창 (금빛 지구본이 보여요)
    for (const x of [-24, -16, 16, 24]) { flat(g, archShape(3, 6, true), "#3a3530", x, 4, -0.95); ball(g, 0.9, GOLD, x, 5.6, -0.8); }
  }

  // 카렐교: 다리 바닥은 길에서 놓았어요. 양쪽 끝 고딕 탑과 동상 30개(한쪽에 15개)를 세워요.
  function charles(g) {
    const S = "#8a7f6f";
    for (const z of [-36, 36]) {
      fbox(g, 12, 26, 10, S, "#2e2a26", 4, 0, z, { style: "slit", tile: 2.6, roof: SLATE });
      cone(g, 8.6, 14, SLATE, 4, 26, z, 4);
      for (const dx of [-5, 5]) cone(g, 0.9, 6, SLATE, 4 + dx, 26, z + 4, 8);
      flat(g, archShape(8, 10, false), "#2e2a26", 4, 0.02, z + (z < 0 ? 5.05 : -5.05), z < 0 ? 0 : Math.PI);
    }
    for (let i = 0; i < 15; i++) {
      const z = -28 + i * 4;
      for (const x of [-5.6, 13.4]) {
        box(g, 1.2, 1.8, 1.2, "#6a6258", x, 0, z);
        statue(g, "#3f3a35", x, 1.8, z, 1.1, x < 0 ? Math.PI / 2 : -Math.PI / 2);
      }
    }
    for (let z = -26; z <= 26; z += 13) for (const x of [-6.4, 14.2]) { cyl(g, 0.08, 0.12, 3.6, "#25282a", x, 0, z, 6); box(g, 0.4, 0.5, 0.4, "#fff3c4", x, 3.6, z); }
  }

  function lennon(g) {
    const art = canvasTex(512, 96, (c) => {
      c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, 512, 96);
      const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926", "#ff6fb5", "#9b5de5", "#00bbf9", "#ff8a00"];
      for (let i = 0; i < 90; i++) { c.fillStyle = cols[i % cols.length]; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(Math.random() * 512, Math.random() * 96, 6 + Math.random() * 26, 4 + Math.random() * 14, Math.random() * 3, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1; c.font = "bold 22px sans-serif"; c.fillStyle = "#1f2d4a";
      ["PEACE", "LOVE", "♥", "☮", "IMAGINE", "MÍR", "♥", "☮"].forEach((w, i) => c.fillText(w, 20 + i * 62, 30 + (i % 2) * 40));
    });
    const wall = new T.Mesh(new T.BoxGeometry(44, 9, 1), [mat("#e9e1cf"), mat("#e9e1cf"), mat("#c9bea6"), mat("#c9bea6"), new T.MeshLambertMaterial({ map: art }), mat("#e9e1cf")]);
    wall.position.set(0, 4.5, 6); g.add(wall);
    for (const x of [-26, 26]) { const t = tree("round", 1.2); t.position.set(x, 0, 2); g.add(t); }
    fbox(g, 24, 10, 10, "#f0b8a8", "#3c4652", 0, 0, -12, { tile: 3, roof: "#b5462e" });
    const r = gable(g, 10, 4, 24, "#b5462e", 0, 10, -12); r.rotation.y = Math.PI / 2;
  }

  // 프라하 성: 언덕 위의 긴 궁전과 성 비투스 대성당
  function castle(g) {
    hill(g, 46, 16, 40, "#86a85e", 0, -10);
    const Y = 14;
    fbox(g, 80, 14, 14, "#efe6d2", "#4a4e54", 0, Y, 8, { tile: 3, roof: "#7a5a48" });
    frustum(g, 80, 4, 14, 0.7, "#8a6a52", 0, Y + 14, 8);
    flag(g, -30, Y + 18, 8, 3);
    // 대성당: 본당, 앞의 쌍둥이 뾰족탑, 큰 남쪽 탑
    fbox(g, 16, 26, 44, "#a89f8e", "#3f4d6b", 0, Y, -14, { style: "arch", tile: 4, roof: SLATE });
    gable(g, 16, 10, 44, SLATE, 0, Y + 26, -14);
    for (const x of [-6, 6]) { box(g, 6, 40, 6, "#9a9182", x, Y, 6); cone(g, 4.2, 22, "#4a4a50", x, Y + 40, 6, 8); }
    box(g, 12, 46, 12, "#9a9182", 14, Y, -14);
    dome(g, 6, "#5f8f7a", 14, Y + 46, -14).scale.y = 7;
    cone(g, 2.2, 10, "#5f8f7a", 14, Y + 52, -14, 8);
    for (let z = -32; z <= 4; z += 8) for (const sx of [-1, 1]) { const f = box(g, 1, 10, 1, "#9a9182", sx * 10, Y + 12, z); f.rotation.z = sx * 0.6; }
  }

  World.register({
    builders: { dancing, wenceslas, powder, oldtown, orloj, klementinum, charles, lennon, castle },
    heights: { dancing: 32, wenceslas: 36, powder: 52, oldtown: 64, orloj: 60, klementinum: 46, charles: 42, lennon: 16, castle: 86 },
    radii: { dancing: 36, wenceslas: 44, powder: 34, oldtown: 46, orloj: 34, klementinum: 46, charles: 44, lennon: 30, castle: 54 }
  });
})();
