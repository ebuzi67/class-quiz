// 독일 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, flag, makeChibi, tree, animated } = World.kit;
  const SAND = "#ddd0b0", BRONZE = "#5f7a6a", GOLD = "#e2b33c";

  // 말 네 마리가 끄는 전차 (콰드리가)
  function quadriga(g, x, y, z, color) {
    const q = new T.Group();
    for (let i = 0; i < 4; i++) {
      const hx = -1.8 + i * 1.2;
      ball(q, 0.6, color, hx, 1.6, 1.4).scale.set(0.45, 0.6, 1.1);
      ball(q, 0.32, color, hx, 2.4, 2.4);
      for (const lz of [0.8, 2]) box(q, 0.2, 1.2, 0.2, color, hx, 0, lz);
    }
    box(q, 2.4, 1.4, 1.6, color, 0, 0.6, -0.6);
    const f = statue(q, color, 0, 1.4, -0.6, 1.3); f.armR.rotation.x = -2.6;
    for (const sx of [-1, 1]) { const w = box(q, 0.1, 1.6, 1.4, color, sx * 0.6, 4, -0.8); w.rotation.z = sx * 0.5; }
    q.position.set(x, y, z); q.scale.setScalar(1.6);
    g.add(q);
  }

  function brandenburg(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(80, 50), mat("#cfc6b2")); sq.rotation.x = -Math.PI / 2; sq.position.y = 0.04; g.add(sq);
    box(g, 44, 2, 12, SAND, 0, 0, 0);
    for (let i = 0; i < 6; i++) for (const z of [-3.5, 3.5]) cyl(g, 1, 1.15, 16, "#e6dcc2", -17.5 + i * 7, 2, z, 14);
    box(g, 44, 3, 12, SAND, 0, 18, 0);
    box(g, 30, 4, 10, "#e6dcc2", 0, 21, 0);
    quadriga(g, 0, 25, 0, BRONZE);
    for (const x of [-26, 26]) fbox(g, 8, 14, 12, SAND, "#4a4e54", x, 0, 0, { tile: 3 });
  }

  function reichstag(g) {
    fbox(g, 70, 20, 36, "#d8cbb0", "#4a4e54", 0, 0, -16, { tile: 3.6, roof: "#8a8f94" });
    for (const [x, z] of [[-31, 0], [31, 0], [-31, -32], [31, -32]]) box(g, 10, 26, 10, "#d8cbb0", x, 0, z);
    box(g, 26, 2, 6, "#cdbf9f", 0, 0, 4);
    for (let i = 0; i < 6; i++) cyl(g, 0.9, 1, 16, "#e6dcc6", -9 + i * 3.6, 2, 5, 12);
    gable(g, 26, 5, 6, "#cdbf9f", 0, 18, 4);
    const sign = new T.Mesh(new T.PlaneGeometry(18, 1.4), new T.MeshLambertMaterial({ map: canvasTex(512, 40, (c) => { c.fillStyle = "#cdbf9f"; c.fillRect(0, 0, 512, 40); c.fillStyle = "#4a4038"; c.font = "bold 26px Georgia, serif"; c.textAlign = "center"; c.fillText("DEM DEUTSCHEN VOLKE", 256, 30); }) }));
    sign.position.set(0, 18.7, 7.05); g.add(sign);
    // 유리 돔과 뼈대
    const glass = new T.Mesh(new T.SphereGeometry(10, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshLambertMaterial({ color: "#bcd8e6", transparent: true, opacity: 0.55, side: T.DoubleSide }));
    glass.position.set(0, 20, -16); g.add(glass);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI; const rib = new T.Mesh(new T.TorusGeometry(10, 0.15, 4, 24, Math.PI), mat("#7a8288")); rib.rotation.y = a; rib.position.set(0, 20, -16); g.add(rib); }
    cone(g, 3, 10, "#cfd6db", 0, 20, -16, 12).rotation.x = Math.PI;
    flag(g, -31, 26, 0, 3); flag(g, 31, 26, 0, 3);
  }

  function wall(g) {
    const art = canvasTex(512, 80, (c) => {
      c.fillStyle = "#e9e6dc"; c.fillRect(0, 0, 512, 80);
      const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926", "#ff6fb5", "#9b5de5", "#00bbf9"];
      for (let i = 0; i < 14; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(i * 37, 0, 30 + Math.random() * 10, 80); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(i * 37 + 16, 34, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = "#1f2d4a"; c.fillRect(i * 37 + 11, 31, 3, 3); c.fillRect(i * 37 + 18, 31, 3, 3); }
      c.font = "bold 18px sans-serif"; c.fillStyle = "#ffffff"; c.fillText("FRIEDEN ♥ PEACE ♥ 1989", 150, 70);
    });
    art.wrapS = T.RepeatWrapping; art.repeat.set(2, 1);
    const w = new T.Mesh(new T.BoxGeometry(64, 4, 1.2), [mat("#cfcac0"), mat("#cfcac0"), mat("#bdb8ae"), mat("#bdb8ae"), new T.MeshLambertMaterial({ map: art }), mat("#cfcac0")]);
    w.position.set(0, 2, 4); g.add(w);
    for (let x = -30; x <= 30; x += 3) box(g, 0.3, 0.6, 1.4, "#bdb8ae", x, 4, 4);
    const river = new T.Mesh(new T.PlaneGeometry(90, 16), mat("#5a8a9a")); river.rotation.x = -Math.PI / 2; river.position.set(0, 0.05, -12); g.add(river);
  }

  function tvtower(g) {
    cyl(g, 4.5, 6, 10, "#d6d8da", 0, 0, 0, 16);
    cyl(g, 2.6, 3.4, 78, "#e8eaec", 0, 10, 0, 16);
    const ball0 = ball(g, 9, "#c9ced2", 0, 92, 0);
    cyl(g, 9.15, 9.15, 1.6, "#3a4652", 0, 91, 0, 24);
    cyl(g, 1.4, 2, 10, "#e8eaec", 0, 100, 0, 12);
    cyl(g, 0.5, 0.7, 22, "#e8eaec", 0, 110, 0, 8);
    for (let y = 112; y < 132; y += 4) cyl(g, 0.55, 0.55, 2, "#d64545", 0, y, 0, 8);
    ball(g, 0.6, "#ff3b30", 0, 132.4, 0);
    for (const x of [-20, 20]) fbox(g, 14, 8, 20, "#e8e2d4", "#3c4652", x, 0, 0, { tile: 3 });
  }

  function elbphil(g) {
    fbox(g, 44, 24, 26, "#9a4a32", "#3a2a22", 0, 0, -6, { tile: 2.6, roof: "#7a3a28" });
    // 파도 모양 유리 건물
    const glass = new T.MeshLambertMaterial({ color: "#a9c9dc", transparent: true, opacity: 0.85 });
    const top = new T.Mesh(new T.BoxGeometry(44, 22, 26), glass); top.position.set(0, 35, -6); g.add(top);
    for (let i = 0; i < 9; i++) for (let y = 26; y < 46; y += 3) box(g, 3.6, 0.4, 0.2, "#e9f2f6", -18 + i * 4.5, y, 7.1);
    for (const [x, h] of [[-16, 6], [-6, 9], [4, 7], [14, 10]]) { const wv = ball(g, 1, "#e9f2f6", x, 46, -6); wv.scale.set(7, h, 13); }
    box(g, 44, 1.6, 26, "#e9f2f6", 0, 24, -6);
    const harbor = new T.Mesh(new T.PlaneGeometry(90, 18), mat("#5a8a9a")); harbor.rotation.x = -Math.PI / 2; harbor.position.set(0, 0.05, -30); g.add(harbor);
  }

  function miniatur(g) {
    fbox(g, 60, 20, 24, "#9a4a32", "#3a2a22", 0, 0, -12, { tile: 3, roof: "#5d5a58" });
    const sign = new T.Mesh(new T.PlaneGeometry(26, 2.4), new T.MeshLambertMaterial({ map: canvasTex(512, 48, (c) => { c.fillStyle = "#f2c230"; c.fillRect(0, 0, 512, 48); c.fillStyle = "#1f2d4a"; c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("MINIATUR WUNDERLAND", 256, 36); }) }));
    sign.position.set(0, 16, 0.05); g.add(sign);
    // 앞마당의 모형 기차가 빙글빙글 돌아요
    cyl(g, 10, 10, 1, "#7fb06a", 0, 0, 12, 32);
    const track = new T.Mesh(new T.TorusGeometry(8, 0.25, 4, 40), mat("#5a4a3a")); track.rotation.x = -Math.PI / 2; track.position.set(0, 1.05, 12); g.add(track);
    const train = new T.Group(); train.position.set(0, 1.1, 12); g.add(train);
    ["#c8102e", "#2f6fd8", "#f2c230", "#2f9e5b"].forEach((c, i) => { const car = box(train, 1.2, 1, 2, c, 0, 0, 0); const a = -i * 0.32; car.position.set(Math.sin(a) * 8, 0.5, Math.cos(a) * 8); car.rotation.y = a + Math.PI / 2; });
    animated.push((t) => { train.rotation.y = t * 0.6; });
    for (const [x, z] of [[-4, 12], [4, 11], [0, 15]]) { box(g, 1.6, 1.8, 1.6, "#f4efe4", x, 1, z); cone(g, 1.2, 1, "#b5462e", x, 2.8, z, 4); }
    const t = tree("conifer", 0.5); t.position.set(-2, 1, 9); g.add(t);
  }

  // 호엔촐레른 다리: 다리 위 철제 아치 세 개와 난간의 사랑의 자물쇠
  function hohenzollern(g) {
    const STEEL = "#4f6a5a";
    for (const x of [-5.8, 13.6]) for (let k = 0; k < 3; k++) {
      const zc = -20 + k * 20;
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * i / 10, z = zc + Math.cos(a) * 10, y = 1 + Math.sin(a) * 9;
        box(g, 0.6, 0.6, 3.2, STEEL, x, y, z).rotation.x = Math.cos(a) * 0.9;
        if (i % 2 === 0) box(g, 0.25, y, 0.25, STEEL, x, 0, z);
      }
    }
    const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#8ac926", "#ff6fb5", "#c0c0c0", "#e2b33c"];
    for (let z = -28; z <= 28; z += 0.7) for (const x of [-5.2, 13]) if (Math.random() < 0.8) box(g, 0.25, 0.3, 0.2, cols[Math.floor(Math.random() * cols.length)], x, 0.4 + Math.random() * 0.5, z);
  }

  function koelnTower(g, x) {
    box(g, 13, 60, 13, "#6f6a62", x, 0, 0);
    for (const y of [20, 40]) box(g, 13.6, 1, 13.6, "#5f5a52", x, y, 0);
    for (const dz of [6.6]) for (let y = 6; y < 58; y += 9) flat(g, archShape(3, 7, false), "#2f2b26", x, y, dz);
    cone(g, 6.4, 48, "#5f5a52", x, 60, 0, 8);
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) cone(g, 0.9, 10, "#5f5a52", x + dx, 58, dz, 8);
    ball(g, 0.8, GOLD, x, 108.6, 0);
  }
  function koeln(g) {
    fbox(g, 20, 34, 64, "#6f6a62", "#2f3a52", 0, 0, -36, { style: "arch", tile: 4, roof: "#4a4a4c" });
    gable(g, 20, 12, 64, "#4a4a4c", 0, 34, -36);
    for (let z = -64; z <= -10; z += 8) for (const sx of [-1, 1]) { box(g, 2, 26, 2, "#6f6a62", sx * 14, 0, z); cone(g, 0.9, 8, "#5f5a52", sx * 14, 26, z, 8); const f = box(g, 1.2, 12, 1.2, "#6f6a62", sx * 11.5, 22, z); f.rotation.z = sx * 0.7; }
    koelnTower(g, -11); koelnTower(g, 11);
    box(g, 9, 40, 4, "#6f6a62", 0, 0, 4);
    flat(g, archShape(6, 16, false), "#2f2b26", 0, 0.02, 6.05);
    const sq = new T.Mesh(new T.PlaneGeometry(70, 30), mat("#cfc6b2")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 20); g.add(sq);
  }

  // 노이슈반슈타인 성: 산 위의 하얀 성과 뾰족한 회색 탑들
  function neuschwanstein(g) {
    hill(g, 46, 18, 40, "#6f9a52", 0, -8);
    for (const [x, z] of [[-34, -26], [30, -30], [-20, -40]]) { const t = tree("conifer", 2); t.position.set(x, 0, z); g.add(t); }
    const Y = 16, W = "#f2efe8", R = "#5f7380";
    fbox(g, 34, 22, 14, W, "#3c4652", 0, Y, -4, { style: "arch", tile: 3, roof: R });
    gable(g, 14, 10, 34, R, 0, Y + 22, -4).rotation.y = Math.PI / 2;
    fbox(g, 14, 14, 12, "#e6b08a", "#3c4652", 0, Y, 12, { tile: 3, roof: R });
    for (const x of [-4, 4]) { cyl(g, 2.2, 2.2, 22, W, x, Y, 18, 14); cone(g, 2.6, 7, R, x, Y + 22, 18, 12); }
    const tower = (x, z, r, h) => { cyl(g, r, r, h, W, x, Y, z, 16); cyl(g, r + 0.4, r + 0.4, 1, "#e6e1d6", x, Y + h, z, 16); cone(g, r + 0.6, r * 3, R, x, Y + h + 1, z, 12); ball(g, 0.4, GOLD, x, Y + h + 1 + r * 3, z); };
    tower(-18, -2, 3, 30); tower(18, -6, 2.4, 26); tower(-10, -12, 2, 36); tower(12, 4, 1.8, 24); tower(0, -14, 2.6, 40);
    flag(g, 0, Y + 46, -14, 2.4);
  }

  World.register({
    builders: { brandenburg, reichstag, wall, tvtower, elbphil, miniatur, hohenzollern, koeln, neuschwanstein },
    heights: { brandenburg: 36, reichstag: 32, wall: 12, tvtower: 134, elbphil: 54, miniatur: 24, hohenzollern: 18, koeln: 110, neuschwanstein: 80 },
    radii: { brandenburg: 36, reichstag: 46, wall: 42, tvtower: 34, elbphil: 44, miniatur: 42, hohenzollern: 44, koeln: 50, neuschwanstein: 54 }
  });
})();
