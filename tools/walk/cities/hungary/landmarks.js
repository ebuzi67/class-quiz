// 헝가리 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, flag, makeChibi, tree, animated } = World.kit;
  const GOLD = "#e2b33c", BRONZE = "#4f6a5a", STONE = "#e6dcc6", COPPER = "#6f9a86";

  function horseman(g, x, z, rot) {
    const h = new T.Group();
    ball(h, 1, BRONZE, 0, 1.6, 0).scale.set(0.7, 0.8, 1.4);
    ball(h, 0.45, BRONZE, 0, 2.8, 1.7);
    for (const [lx, lz] of [[-0.4, 0.8], [0.4, 0.8], [-0.4, -0.8], [0.4, -0.8]]) box(h, 0.25, 1.2, 0.25, BRONZE, lx, 0, lz);
    statue(h, BRONZE, 0, 2.1, 0, 0.9);
    h.position.set(x, 4, z); h.rotation.y = rot; h.scale.setScalar(1.4);
    g.add(h);
  }
  // 타일 무늬 지붕 그림 (졸너이 타일)
  function tileTex(cols) {
    const t = canvasTex(128, 128, (c) => {
      c.fillStyle = cols[0]; c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = cols[1 + ((i + j) % (cols.length - 1))]; c.beginPath(); c.moveTo(i * 16 + 8, j * 16); c.lineTo(i * 16 + 16, j * 16 + 8); c.lineTo(i * 16 + 8, j * 16 + 16); c.lineTo(i * 16, j * 16 + 8); c.fill(); }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 3);
    return new T.MeshLambertMaterial({ map: t });
  }

  function heroes(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(90, 60), mat("#d9cfb8")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 6); g.add(sq);
    // 뒤쪽 반달 모양 기둥 회랑 두 개
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      const a = side * (0.25 + i * 0.12);
      const x = Math.sin(a) * 34, z = -24 + Math.cos(a) * 8;
      cyl(g, 0.7, 0.8, 12, STONE, x, 0, z, 10);
      if (i % 2 === 0) statue(g, BRONZE, x, 0, z + 1.4, 1.2);
    }
    for (const side of [-1, 1]) { box(g, 28, 2, 4, STONE, side * 18, 12, -18); statue(g, GOLD, side * 30, 14, -18, 1.3); }
    // 가운데 기둥과 천사 가브리엘, 일곱 부족장
    box(g, 12, 4, 10, STONE, 0, 0, 0);
    cyl(g, 1.3, 1.6, 34, STONE, 0, 4, 0, 14);
    box(g, 3, 1.4, 3, STONE, 0, 38, 0);
    const angel = statue(g, GOLD, 0, 39.4, 0, 1.6); angel.armR.rotation.x = -2.6;
    for (const sx of [-1, 1]) { const w = box(g, 0.1, 2.6, 1.6, GOLD, sx * 0.8, 42.4, -0.8); w.rotation.z = sx * 0.5; }
    for (let i = 0; i < 7; i++) horseman(g, -9 + i * 3, 6, 0);
  }

  function szechenyi(g) {
    const Y = "#f2cf5a";
    fbox(g, 70, 16, 14, Y, "#3c4652", 0, 0, -22, { tile: 3.4, roof: COPPER });
    for (const x of [-30, 30]) fbox(g, 12, 16, 40, Y, "#3c4652", x, 0, -4, { tile: 3.4, roof: COPPER });
    domeTop(g, 0, -22, 7, 16, 1.2, COPPER, Y);
    // 하늘색 야외 온천탕과 김
    for (const [x, w] of [[-10, 18], [12, 16]]) { box(g, w + 1.6, 0.6, 22, "#efe6d2", x, 0, 0); const p = new T.Mesh(new T.PlaneGeometry(w, 20), mat("#5fc4dc")); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.62, 0); g.add(p); }
    for (let i = 0; i < 10; i++) {
      const s = ball(g, 1.2, "#ffffff", 0, 0, 0); s.material = new T.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.45 });
      const x0 = -18 + Math.random() * 36, z0 = -8 + Math.random() * 16, ph = Math.random();
      animated.push((t) => { const u = (t * 0.2 + ph) % 1; s.position.set(x0, 1 + u * 8, z0); s.scale.setScalar(1 + u * 2); s.material.opacity = 0.45 * (1 - u); });
    }
    // 물속에서 체스 두는 사람들
    box(g, 1.6, 0.6, 1.6, "#f4efe4", -10, 0.6, 4);
    for (const z of [2.6, 5.4]) { const p = makeChibi({ shirt: "#f2a5a5" }); p.group.position.set(-10, -0.4, z); p.group.rotation.y = z < 4 ? 0 : Math.PI; g.add(p.group); }
  }

  function opera(g) {
    fbox(g, 44, 20, 30, "#e2d4b8", "#4a4e54", 0, 0, -14, { style: "arch", tile: 4, roof: "#7b838c" });
    frustum(g, 44, 5, 30, 0.6, "#7b838c", 0, 20, -14);
    box(g, 28, 12, 6, STONE, 0, 0, 3);
    for (let i = 0; i < 3; i++) flat(g, archShape(5, 9, true), "#5a4c3c", -8 + i * 8, 0.02, 6.05);
    box(g, 28, 1, 7, "#cdbf9f", 0, 12, 3);
    for (let i = 0; i < 6; i++) cyl(g, 0.6, 0.7, 7, "#f6efe0", -11 + i * 4.4, 13, 5, 10);
    gable(g, 28, 4, 6, "#cdbf9f", 0, 20, 3);
    for (const x of [-13, 13]) statue(g, "#f6efe0", x, 0, 8, 1.6);
    domeTop(g, 0, -20, 5, 25, 0.9, "#7b838c", "#e2d4b8");
  }

  function basilica(g) {
    fbox(g, 36, 22, 44, STONE, "#4a4e54", 0, 0, -22, { style: "arch", tile: 4, roof: "#7b838c" });
    for (const x of [-15, 15]) { box(g, 9, 40, 9, STONE, x, 0, 0); domeTop(g, x, 0, 3.6, 40, 1.1, COPPER, STONE); }
    box(g, 20, 3, 6, STONE, 0, 0, 3);
    for (let i = 0; i < 6; i++) cyl(g, 0.8, 0.9, 16, "#f6efe0", -7.5 + i * 3, 3, 5, 12);
    gable(g, 20, 5, 6, "#cdbf9f", 0, 22, 4);
    // 큰 둥근 지붕
    cyl(g, 11, 11, 10, STONE, 0, 22, -22, 24);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cyl(g, 0.5, 0.5, 9, "#f6efe0", Math.sin(a) * 11.6, 22, -22 + Math.cos(a) * 11.6, 8); }
    dome(g, 11, COPPER, 0, 32, -22).scale.y = 14;
    cyl(g, 2, 2, 5, STONE, 0, 46, -22, 10);
    dome(g, 2, COPPER, 0, 51, -22);
    box(g, 0.25, 2, 0.25, GOLD, 0, 53, -22); box(g, 1.1, 0.25, 0.25, GOLD, 0, 54.2, -22);
  }

  function parliament(g) {
    const W = "#f2ede2", R = "#b5462e";
    fbox(g, 110, 18, 22, W, "#4a4e54", 0, 0, -8, { style: "arch", tile: 3, roof: R });
    gable(g, 22, 6, 110, R, 0, 18, -8).rotation.y = Math.PI / 2;
    for (let x = -52; x <= 52; x += 6) { cone(g, 0.6, 6, W, x, 18, 3, 8); cone(g, 0.6, 6, W, x, 18, -19, 8); }
    for (const x of [-30, 30]) { box(g, 6, 34, 6, W, x, 0, 4); cone(g, 2, 10, W, x, 34, 4, 8); for (const dx of [-12, 12]) { box(g, 4, 26, 4, W, x + dx, 0, 4); cone(g, 1.4, 7, W, x + dx, 26, 4, 8); } }
    // 가운데 빨간 둥근 지붕과 뾰족탑
    cyl(g, 10, 10, 12, W, 0, 18, -8, 16);
    dome(g, 10, R, 0, 30, -8).scale.y = 13;
    cone(g, 2.2, 16, W, 0, 41, -8, 8);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; cone(g, 0.6, 5, W, Math.sin(a) * 10.4, 30, -8 + Math.cos(a) * 10.4, 8); }
    flag(g, -54, 18, -8, 3);
  }

  function market(g) {
    const roofMat = tileTex(["#3a6a4a", "#e9a03a", "#c8402e", "#f2d24a"]);
    fbox(g, 40, 16, 60, "#c9a07a", "#4a4e54", 0, 0, -26, { style: "arch", tile: 4, roof: "#3a6a4a" });
    const r = gable(g, 40, 18, 60, "#3a6a4a", 0, 16, -26); r.material = roofMat;
    box(g, 22, 22, 4, "#c9a07a", 0, 0, 4);
    flat(g, archShape(10, 16, true), "#4a3a2a", 0, 0.02, 6.05);
    for (const x of [-12, 12]) { box(g, 6, 28, 6, "#c9a07a", x, 0, 4); const c = cone(g, 4.4, 8, "#3a6a4a", x, 28, 4, 4); c.material = roofMat; }
    // 파프리카 묶음
    for (let i = 0; i < 8; i++) for (let k = 0; k < 4; k++) { const p = ball(g, 0.35, "#c8102e", -9 + i * 2.6, 3.4 - k * 0.6, 7); p.scale.set(0.28, 0.5, 0.28); }
  }

  // 세체니 사슬다리: 강 양쪽의 개선문 모양 돌탑, 늘어진 사슬, 다리 끝 돌사자
  function chainbridge(g) {
    const S = "#cfc4a8", CH = "#4a5a52";
    for (const z of [-26, 26]) {
      box(g, 24, 4, 10, "#bfb49a", 4, -4, z);
      for (const dx of [-8, 8]) box(g, 5, 26, 8, S, 4 + dx, 0, z);
      box(g, 22, 8, 8, S, 4, 18, z);
      flat(g, archShape(11, 16, true), "#5a6a62", 4, 0.02, z + (z < 0 ? 4.05 : -4.05), z < 0 ? 0 : Math.PI);
      box(g, 24, 1.4, 9, "#bfb49a", 4, 26, z);
    }
    for (const x of [-5.4, 13.4]) {
      for (let i = 0; i < 26; i++) {
        const z0 = -26 + i * 2, z1 = z0 + 2, y = (z) => 3 + (z / 26) ** 2 * 21;
        const seg = box(g, 0.7, 0.7, 2.2, CH, x, y((z0 + z1) / 2), (z0 + z1) / 2); seg.rotation.x = -Math.atan2(y(z1) - y(z0), 2);
        if (i % 2 === 0) box(g, 0.12, y(z0) - 1, 0.12, CH, x, 1, z0);
      }
      for (const z of [-36, 36]) { const seg = box(g, 0.7, 0.7, 12, CH, x, 12, z); seg.rotation.x = z < 0 ? -1.1 : 1.1; }
    }
    // 다리 끝 돌사자 (양쪽 끝에 두 마리씩)
    for (const z of [-34, 34]) for (const x of [-8, 16]) {
      const l = new T.Group();
      box(l, 3, 2, 5, "#bfb49a", 0, 0, 0);
      box(l, 2.2, 1.6, 3.6, S, 0, 2, -0.3);
      ball(l, 1.3, S, 0, 4.4, z < 0 ? -1.6 : 1.6).scale.set(1.3, 1.4, 1.1);
      l.position.set(x, 0, z); g.add(l);
    }
  }

  function matthias(g) {
    const W = "#efe8da";
    const roofMat = tileTex(["#e9a03a", "#3a6a4a", "#c8402e", "#f6efe0"]);
    fbox(g, 22, 18, 44, W, "#3f4d6b", 0, 0, -22, { style: "arch", tile: 4, roof: "#3a6a4a" });
    const r = gable(g, 22, 14, 44, "#3a6a4a", 0, 18, -22); r.material = roofMat;
    box(g, 9, 44, 9, W, 14, 0, -2);
    for (const y of [16, 28, 38]) box(g, 9.6, 0.8, 9.6, "#ddd4c2", 14, y, -2);
    cone(g, 5.4, 22, "#5a5a5a", 14, 44, -2, 8); cone(g, 5.5, 8, "#5a5a5a", 14, 44, -2, 8).material = roofMat;
    ball(g, 0.6, GOLD, 14, 66.6, -2);
    box(g, 16, 22, 4, W, -2, 0, 0.5);
    flat(g, archShape(5, 10, false), "#3a3530", -2, 0.02, 2.55);
    const rose = new T.Mesh(new T.CircleGeometry(2.6, 24), mat("#4a5a8a")); rose.position.set(-2, 15, 2.56); g.add(rose);
  }

  // 어부의 요새: 언덕 위의 하얀 성벽과 고깔 탑 7개
  function bastion(g) {
    hill(g, 46, 14, 34, "#86a85e", 0, -10);
    const W = "#f4f1ea", Y = 12;
    box(g, 70, 8, 6, W, 0, Y, 6);
    for (let i = 0; i < 11; i++) flat(g, archShape(3.4, 5, true), "#b9b0a0", -30 + i * 6, Y + 0.02, 9.05);
    for (let x = -34; x <= 34; x += 2.4) box(g, 1.2, 1.2, 6, W, x, Y + 8, 6);
    const towerXs = [-30, -20, -10, 0, 10, 20, 30];
    towerXs.forEach((x, i) => {
      const h = i === 3 ? 16 : 10 + (i % 2) * 2;
      cyl(g, 2.2, 2.4, h, W, x, Y, 6 - (i === 3 ? 4 : 0), 12);
      cone(g, 2.8, 6, "#f0ece2", x, Y + h, 6 - (i === 3 ? 4 : 0), 10);
    });
    // 성 이슈트반 왕의 기마상
    box(g, 4, 4, 6, "#d8cfba", -16, Y, -6);
    horseman(g, -16, -6, 0);
    g.children[g.children.length - 1].position.y = Y + 4;
    // 뒤의 마차시 성당 지붕이 살짝 보여요
    box(g, 6, 30, 6, W, 18, Y, -18); cone(g, 3.6, 14, "#5a5a5a", 18, Y + 30, -18, 8);
  }

  World.register({
    builders: { heroes, szechenyi, opera, basilica, parliament, market, chainbridge, matthias, bastion },
    heights: { heroes: 44, szechenyi: 32, opera: 32, basilica: 54, parliament: 56, market: 34, chainbridge: 28, matthias: 66, bastion: 40 },
    radii: { heroes: 50, szechenyi: 48, opera: 44, basilica: 48, parliament: 60, market: 46, chainbridge: 44, matthias: 46, bastion: 52 }
  });
})();
