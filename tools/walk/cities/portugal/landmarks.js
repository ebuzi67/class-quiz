// 포르투갈 탐방: 명소 9곳의 3D 건물. 앞쪽(+z)이 길을 바라봐요.
(() => {
  const { T, mat, box, cyl, cone, ball, dome, gable, fbox, canvasTex, frustum, archShape, flat, statue, hill, domeTop, flag, makeChibi, tree, animated } = World.kit;
  const LIME = "#efe6d2", GOLD = "#e2b33c", BRONZE = "#5f7a6a", YELLOW = "#f0cf6a";

  function comercio(g) {
    const sq = new T.Mesh(new T.PlaneGeometry(80, 70), mat("#e6dcc8")); sq.rotation.x = -Math.PI / 2; sq.position.set(0, 0.04, 6); g.add(sq);
    // 세 방향의 노란 건물 (아래층은 아치 회랑)
    fbox(g, 80, 14, 12, YELLOW, "#3c4652", 0, 0, -22, { tile: 3.4, roof: "#c0603f" });
    for (const x of [-34, 34]) fbox(g, 12, 14, 40, YELLOW, "#3c4652", x, 0, 0, { tile: 3.4, roof: "#c0603f" });
    for (let x = -36; x <= 36; x += 4.5) if (Math.abs(x) > 8) flat(g, archShape(3, 4, true), "#8a6a3a", x, 0.02, -15.95);
    // 아우구스타 거리 개선문
    box(g, 18, 18, 6, LIME, 0, 0, -18);
    flat(g, archShape(7, 13, true), "#5a4c3c", 0, 0.02, -14.95);
    for (const x of [-6.5, 6.5]) cyl(g, 0.8, 0.9, 14, "#f6efe0", x, 0, -14.5, 12);
    box(g, 12, 4, 5, LIME, 0, 18, -18);
    statue(g, "#f6efe0", 0, 22, -18, 1.4);
    // 말을 탄 주제 1세 동상
    box(g, 5, 6, 8, "#d8cfba", 0, 0, 10);
    ball(g, 1, BRONZE, 0, 8.6, 10).scale.set(1, 1.2, 2.2); ball(g, 0.7, BRONZE, 0, 10.2, 12.4);
    for (const [x, z] of [[-0.6, 8.8], [0.6, 8.8], [-0.6, 11.2], [0.6, 11.2]]) box(g, 0.4, 2.6, 0.4, BRONZE, x, 6, z);
    statue(g, BRONZE, 0, 9.2, 10, 1.3);
  }

  function latticeTex(rx, ry) {
    const t = canvasTex(64, 64, (c) => { c.strokeStyle = "#ffffff"; c.lineWidth = 6; c.strokeRect(3, 3, 58, 58); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 64); c.moveTo(64, 0); c.lineTo(0, 64); c.stroke(); c.beginPath(); c.arc(32, 32, 10, 0, Math.PI * 2); c.stroke(); });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
    return t;
  }
  function santajusta(g) {
    const m = new T.MeshLambertMaterial({ map: latticeTex(3, 10), color: "#4a4e54", transparent: true, alphaTest: 0.35, side: T.DoubleSide });
    const tower = new T.Mesh(new T.BoxGeometry(7, 30, 7), m); tower.position.set(0, 15, 0); g.add(tower);
    box(g, 5, 30, 5, "#2f3338", 0, 0, 0).material = new T.MeshLambertMaterial({ color: "#c9b48e" });
    box(g, 8.4, 4, 8.4, "#4a4e54", 0, 30, 0);
    cone(g, 3, 4, "#3a3e44", 0, 34, 0, 8);
    // 꼭대기에서 언덕 동네로 건너가는 다리
    box(g, 26, 1.6, 3, "#4a4e54", -16, 28, -1);
    fbox(g, 22, 34, 18, "#f0b8a8", "#2f4f6a", -30, 0, -6, { style: "azulejo", tile: 3, roof: "#c0603f" });
    for (const x of [14, 26]) fbox(g, 10, 14, 12, YELLOW, "#2f4f6a", x, 0, -4, { style: "azulejo", tile: 3 });
  }

  function saojorge(g) {
    hill(g, 44, 18, 36, "#8aa860", 0, -8);
    const Y = 15, S = "#c9b48e";
    for (const [x, z, w, d] of [[0, -22, 50, 3], [0, 10, 50, 3], [-24, -6, 3, 34], [24, -6, 3, 34]]) {
      box(g, w, 9, d, S, x, Y, z);
      const n = Math.round(Math.max(w, d) / 3);
      for (let i = 0; i < n; i++) { const u = -Math.max(w, d) / 2 + 1.5 + i * 3; box(g, w > d ? 1.4 : d, 1.4, w > d ? d : 1.4, S, w > d ? x + u : x, Y + 9, w > d ? z : z + u); }
    }
    for (const [x, z] of [[-24, -22], [24, -22], [-24, 10], [24, 10], [0, 10]]) { box(g, 7, 15, 7, "#bba47c", x, Y, z); for (const [dx, dz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) box(g, 1.4, 1.6, 1.4, "#bba47c", x + dx, Y + 15, z + dz); }
    flag(g, 0, Y + 16.6, 10, 3);
    // 공작새
    for (const [x, z] of [[-8, 16], [10, 18]]) {
      ball(g, 0.6, "#2f6fb8", x, 0.8, z).scale.set(0.5, 0.7, 0.6); ball(g, 0.3, "#2f6fb8", x, 1.6, z + 0.4);
      const tail = new T.Mesh(new T.CircleGeometry(1.6, 16, 0, Math.PI), mat("#2f9e6b")); tail.position.set(x, 0.6, z - 0.4); tail.rotation.y = Math.PI; g.add(tail);
    }
  }

  function tram28(g) {
    // 가파른 알파마 골목과 노란 전차
    for (let i = 0; i < 6; i++) {
      const x = -26 + i * 10;
      fbox(g, 9, 10 + (i % 2) * 2, 9, ["#ffffff", "#bcd6ea", "#f2d98a", "#f0b8a8"][i % 4], "#2f4f6a", x, i * 1.2, -8, { style: "azulejo", tile: 2.6, roof: "#c0603f" });
    }
    for (let i = 0; i < 6; i++) box(g, 10, i * 1.2 + 0.1, 10, "#cdbfa6", -26 + i * 10, 0, 4);
    const tr = new T.Group();
    box(tr, 2.4, 2.4, 7.6, YELLOW, 0, 0.4, 0); box(tr, 2.44, 0.5, 7.64, "#f4efe4", 0, 0.4, 0);
    box(tr, 2.46, 1, 7, "#2b3440", 0, 1.4, 0); box(tr, 2.2, 0.2, 6.6, "#3a3a3a", 0, 2.8, 0);
    box(tr, 0.08, 1.6, 0.08, "#333", 0, 3, 0);
    const sign = new T.Mesh(new T.PlaneGeometry(1.2, 0.6), new T.MeshLambertMaterial({ map: canvasTex(64, 32, (c) => { c.fillStyle = "#1b1b1b"; c.fillRect(0, 0, 64, 32); c.fillStyle = "#f2c230"; c.font = "bold 24px sans-serif"; c.textAlign = "center"; c.fillText("28", 32, 25); }) }));
    sign.position.set(0, 2.5, 3.83); tr.add(sign);
    tr.position.set(0, 3, 4); tr.rotation.y = Math.PI / 2; tr.rotation.z = 0.12; g.add(tr);
    animated.push((t) => { tr.position.x = Math.sin(t * 0.25) * 18; tr.position.y = 3 + tr.position.x * 0.12; });
    for (let x = -30; x <= 30; x += 2) box(g, 1.8, 0.05, 0.12, "#6a6a6a", x, 3 + x * 0.12 + 0.02, 3.2);
  }

  function oceanario(g) {
    const lake = new T.Mesh(new T.CircleGeometry(30, 32), mat("#4f8fae")); lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0.05, -4); g.add(lake);
    box(g, 30, 12, 30, "#dfe6ea", 0, 0, -4);
    const glass = new T.Mesh(new T.BoxGeometry(22, 8, 22), new T.MeshLambertMaterial({ color: "#7fb9d6", transparent: true, opacity: 0.5 })); glass.position.set(0, 16, -4); g.add(glass);
    box(g, 32, 1, 32, "#c9d2d8", 0, 12, -4);
    box(g, 4, 1, 26, "#cdbfa6", 0, 0, 22);
    // 물고기들이 헤엄쳐요
    for (let i = 0; i < 10; i++) {
      const f = ball(g, 0.8, ["#f2a541", "#3a86ff", "#e94f37", "#f6c90e"][i % 4], 0, 0, 0); f.scale.set(0.5, 0.4, 0.9);
      const r = 4 + (i % 3) * 2.5, y = 13 + (i % 4) * 1.4, ph = i;
      animated.push((t) => { const a = t * 0.5 + ph; f.position.set(Math.cos(a) * r, y, -4 + Math.sin(a) * r); f.rotation.y = -a; });
    }
    for (const x of [-6, -3]) { const p = makeChibi({ shirt: "#1b1b1b", pants: "#1b1b1b", skin: "#f4f1ea" }); p.group.position.set(x, 0, 16); p.group.scale.setScalar(0.8); g.add(p.group); }
  }

  function jeronimos(g) {
    fbox(g, 90, 18, 18, LIME, "#5a5e62", 0, 0, -10, { style: "arch", tile: 4, roof: "#c0603f" });
    box(g, 92, 1.4, 19, "#e2d8c0", 0, 18, -10);
    for (let x = -42; x <= 42; x += 4) cone(g, 0.5, 2.6, LIME, x, 19.4, -1, 8);
    // 정교한 남쪽 문
    box(g, 12, 22, 3, "#f4ecd8", -8, 0, 0.5);
    flat(g, archShape(5, 10, false), "#4a4038", -8, 0.02, 2.05);
    for (let y = 11; y < 21; y += 2.4) for (const x of [-12, -8, -4]) statue(g, "#efe6d2", x, y, 2.4, 0.6);
    // 종탑
    box(g, 10, 30, 10, LIME, 30, 0, -10);
    domeTop(g, 30, -10, 4.2, 30, 1, "#bfae8a", LIME);
  }

  function pasteis(g) {
    fbox(g, 30, 12, 12, "#f4efe4", "#2f4f6a", 0, 0, -6, { style: "azulejo", tile: 3, roof: "#c0603f" });
    for (let x = -12; x <= 12; x += 4) { const a = box(g, 3.6, 0.2, 2, "#1f5fa8", x, 3.6, 1); a.rotation.x = 0.35; }
    const sign = new T.Mesh(new T.PlaneGeometry(18, 1.6), new T.MeshLambertMaterial({ map: canvasTex(512, 48, (c) => { c.fillStyle = "#1f5fa8"; c.fillRect(0, 0, 512, 48); c.fillStyle = "#ffffff"; c.font = "bold 28px Georgia, serif"; c.textAlign = "center"; c.fillText("PASTÉIS DE BELÉM", 256, 34); }) }));
    sign.position.set(0, 6.4, 0.05); g.add(sign);
    // 커다란 에그타르트 간판
    const tart = new T.Group();
    cyl(tart, 3, 2.6, 1.2, "#d99a4a", 0, 0, 0, 24);
    const top = cyl(tart, 2.5, 2.5, 0.2, "#f2c84a", 0, 1.05, 0, 24);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; box(tart, 0.6, 0.12, 0.5, "#8a4a1a", Math.cos(a) * 1.4, 1.25, Math.sin(a) * 1.4); }
    tart.position.set(0, 13, -2); tart.rotation.x = 1.1; g.add(tart);
    animated.push((t) => { tart.rotation.z = Math.sin(t) * 0.2; });
    // 줄 선 사람들
    for (let i = 0; i < 5; i++) { const p = makeChibi({ shirt: ["#e07a5f", "#3d405b", "#81b29a", "#f2cc8f", "#6d597a"][i] }); p.group.position.set(-14 + i * 1.6, 0, 6); p.group.rotation.y = Math.PI / 2; g.add(p.group); }
  }

  // 4월 25일 다리: 강 위의 빨간 현수교 (옆에서 보이게 놓아요)
  function ponte25(g) {
    const R = "#c0392b";
    for (const x of [-38, 38]) {
      box(g, 6, 4, 8, "#bfb7a6", x, -3, 0);
      for (const z of [-2.6, 2.6]) box(g, 1.6, 58, 1.6, R, x, 0, z);
      for (const y of [20, 40, 56]) box(g, 1.6, 2, 7, R, x, y, 0);
    }
    box(g, 220, 3, 7, R, 0, 16, 0);
    box(g, 220, 0.4, 7.4, "#3a3a3a", 0, 19, 0);
    // 커다란 케이블 (사슬 모양 곡선)
    for (const z of [-2.6, 2.6]) {
      for (let i = 0; i < 40; i++) {
        const x0 = -38 + i * 1.9, x1 = x0 + 1.9;
        const y = (x) => 19 + ((x / 38) ** 2) * 39;
        const seg = box(g, 2, 0.5, 0.5, R, (x0 + x1) / 2, y((x0 + x1) / 2), z);
        seg.rotation.z = Math.atan2(y(x1) - y(x0), 1.9);
      }
      for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
        const x0 = side * (38 + i * 3), x1 = x0 + side * 3;
        const y = (x) => 58 - (Math.abs(x) - 38) * 0.6;
        const seg = box(g, 3.2, 0.5, 0.5, R, (x0 + x1) / 2, Math.max(19, y((x0 + x1) / 2)), z);
        seg.rotation.z = side * -0.54;
      }
    }
    for (let x = -36; x <= 36; x += 4) for (const z of [-2.6, 2.6]) box(g, 0.15, 19 + ((x / 38) ** 2) * 39 - 19, 0.15, "#7a2a20", x, 19, z);
  }

  function belem(g) {
    const S = "#efe6d2";
    // 물 위의 다각형 보루와 네모 탑
    cyl(g, 12, 12.6, 9, S, 0, -3, 6, 8);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; box(g, 1.6, 1.4, 1.6, S, Math.sin(a) * 11.6, 6, 6 + Math.cos(a) * 11.6); }
    fbox(g, 11, 26, 11, S, "#5a5e62", 0, 0, -6, { style: "arch", tile: 3.4, roof: S });
    for (const y of [10, 18]) box(g, 13, 1, 2, "#e2d8c0", 0, y, 0);
    for (const [x, z] of [[-6, -1], [6, -1], [-6, -11], [6, -11]]) { cyl(g, 1.1, 1.1, 3, S, x, 24, z, 10); dome(g, 1.1, "#d8c9a8", x, 27, z).scale.y = 1.6; }
    for (const [x, z] of [[-11, 13], [11, 13], [0, 18]]) { cyl(g, 1, 1, 2.6, S, x, 6, z, 10); dome(g, 1, "#d8c9a8", x, 8.6, z).scale.y = 1.5; }
    for (let x = -4.5; x <= 4.5; x += 1.5) box(g, 0.8, 1, 0.8, S, x, 26, -0.6);
    // 숨은 코뿔소 조각
    ball(g, 0.6, "#cfc3a8", 5.6, 13, -0.4).scale.set(0.8, 0.5, 0.4);
    cone(g, 0.15, 0.4, "#cfc3a8", 6.3, 13.3, -0.4, 6);
  }

  World.register({
    builders: { comercio, santajusta, saojorge, tram28, oceanario, jeronimos, pasteis, ponte25, belem },
    heights: { comercio: 28, santajusta: 38, saojorge: 36, tram28: 22, oceanario: 26, jeronimos: 40, pasteis: 18, ponte25: 62, belem: 32 },
    exclusions: [{ x: 900, z: 236, r: 40, tight: 30 }, { x: 1006, z: 236, r: 36, tight: 30 }],
    radii: { comercio: 46, santajusta: 40, saojorge: 50, tram28: 40, oceanario: 44, jeronimos: 52, pasteis: 52, ponte25: 30, belem: 30 }
  });
})();
