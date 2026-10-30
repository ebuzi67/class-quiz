// 런던 탐방: 3D 세상 만들기 (땅, 템스강, 길, 명소 9곳, 집, 버스, 사람)
// 명소 건물은 상자·원기둥·원뿔을 쌓아서 만들었어요. 건물마다 build_이름 함수가 하나씩 있어요.

const World = (() => {
  const T = THREE;
  const BOX = new T.BoxGeometry(1, 1, 1);
  const mats = {};
  const geos = {};

  function mat(color) {
    return mats[color] || (mats[color] = new T.MeshLambertMaterial({ color }));
  }
  function cachedGeo(key, make) {
    return geos[key] || (geos[key] = make());
  }

  // 아래 면(y)을 기준으로 놓는 도형들
  function box(parent, w, h, d, color, x, y, z) {
    const m = new T.Mesh(BOX, typeof color === "string" ? mat(color) : color);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }
  function cyl(parent, rt, rb, h, color, x, y, z, seg = 14) {
    const g = cachedGeo(`c${rt}_${rb}_${seg}`, () => new T.CylinderGeometry(rt, rb, 1, seg));
    const m = new T.Mesh(g, mat(color));
    m.scale.y = h;
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }
  function cone(parent, r, h, color, x, y, z, seg = 4) {
    const g = cachedGeo(`k${seg}`, () => new T.ConeGeometry(1, 1, seg));
    const m = new T.Mesh(g, mat(color));
    m.scale.set(r, h, r);
    m.position.set(x, y + h / 2, z);
    if (seg === 4) m.rotation.y = Math.PI / 4;
    parent.add(m);
    return m;
  }
  function ball(parent, r, color, x, y, z) {
    const g = cachedGeo("s", () => new T.SphereGeometry(1, 16, 12));
    const m = new T.Mesh(g, mat(color));
    m.scale.set(r, r, r);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function dome(parent, r, color, x, y, z) {
    const g = cachedGeo("dome", () => new T.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2));
    const m = new T.Mesh(g, mat(color));
    m.scale.set(r, r, r);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  // 앞(+z)을 바라보는 세모 지붕(박공). 폭 w, 높이 h, 두께 d
  function gable(parent, w, h, d, color, x, y, z) {
    const g = cachedGeo(`gable`, () => {
      const s = new T.Shape();
      s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.lineTo(-0.5, 0);
      const e = new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
      e.translate(0, 0, -0.5);
      return e;
    });
    const m = new T.Mesh(g, mat(color));
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // ---------- 그림(텍스처) ----------
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  // 창문 한 칸짜리 벽 그림 (여러 번 반복해서 붙여요)
  const facadeCache = {};
  function facadeMat(wall, win, style = "tall") {
    const key = wall + win + style;
    if (facadeCache[key]) return facadeCache[key];
    const t = canvasTex(64, 64, (g) => {
      g.fillStyle = wall; g.fillRect(0, 0, 64, 64);
      g.fillStyle = win;
      if (style === "tall") { g.fillRect(20, 12, 24, 36); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(20, 50, 24, 4); }
      else if (style === "slit") { g.fillRect(26, 8, 12, 48); }
      else if (style === "arch") { g.beginPath(); g.moveTo(20, 54); g.lineTo(20, 26); g.arc(32, 26, 12, Math.PI, 0); g.lineTo(44, 54); g.fill(); }
      g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, 60, 64, 4);
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    facadeCache[key] = new T.MeshLambertMaterial({ map: t });
    return facadeCache[key];
  }

  // 창문 무늬가 있는 상자. 창문 한 칸이 tile 크기가 되도록 그림 좌표를 늘려요.
  function fbox(parent, w, h, d, wall, win, x, y, z, opt = {}) {
    const tile = opt.tile || 5;
    const g = new T.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) {
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        uv.setXY(k, uv.getX(k) * Math.max(1, Math.round(sizes[f][0] / tile)), uv.getY(k) * Math.max(1, Math.round(sizes[f][1] / tile)));
      }
    }
    const side = facadeMat(wall, win, opt.style);
    const roof = mat(opt.roof || "#5b5f66");
    const m = new T.Mesh(g, [side, side, roof, roof, side, side]);
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }

  function unionFlagTex() {
    return canvasTex(120, 60, (g) => {
      g.fillStyle = "#012169"; g.fillRect(0, 0, 120, 60);
      g.strokeStyle = "#fff"; g.lineWidth = 12;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(120, 60); g.moveTo(120, 0); g.lineTo(0, 60); g.stroke();
      g.strokeStyle = "#c8102e"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(120, 60); g.moveTo(120, 0); g.lineTo(0, 60); g.stroke();
      g.fillStyle = "#fff"; g.fillRect(50, 0, 20, 60); g.fillRect(0, 20, 120, 20);
      g.fillStyle = "#c8102e"; g.fillRect(54, 0, 12, 60); g.fillRect(0, 24, 120, 12);
    });
  }

  function flag(parent, x, y, z, size = 4) {
    cyl(parent, 0.12, 0.12, size * 2, "#ddd", x, y, z, 6);
    const f = new T.Mesh(new T.PlaneGeometry(size, size / 2), new T.MeshLambertMaterial({ map: unionFlagTex(), side: T.DoubleSide }));
    f.geometry.translate(size / 2, 0, 0);
    f.position.set(x, y + size * 2 - size / 4, z);
    parent.add(f);
    animated.push((t) => { f.rotation.y = Math.sin(t * 2 + x) * 0.25; });
    return f;
  }

  // 빅벤 시계: 런던 시각을 그려요
  const clockCanvas = document.createElement("canvas");
  clockCanvas.width = clockCanvas.height = 128;
  const clockTex = new T.CanvasTexture(clockCanvas);
  clockTex.colorSpace = T.SRGBColorSpace;
  function drawClock(h, m) {
    const g = clockCanvas.getContext("2d");
    g.fillStyle = "#c9ad72"; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#2c3a48"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fbf6e6"; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#2c3a48"; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(64 + Math.sin(a) * 42, 64 - Math.cos(a) * 42); g.lineTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); g.stroke();
    }
    const hand = (a, len, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(a) * len, 64 - Math.cos(a) * len); g.stroke(); };
    g.strokeStyle = "#1b2430";
    hand(((h % 12) + m / 60) / 12 * Math.PI * 2, 28, 6);
    hand(m / 60 * Math.PI * 2, 42, 4);
    clockTex.needsUpdate = true;
  }

  // 글자 표지판(스프라이트). 항상 카메라를 바라봐요.
  function makeLabel(text, sub, opt = {}) {
    const W = 512, H = sub ? 150 : 104;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.font = "44px Jua, sans-serif";
    const tw = Math.max(g.measureText(text).width, sub ? (g.font = "30px Jua, sans-serif", g.measureText(sub).width) : 0);
    const bw = Math.min(W - 8, tw + 60);
    g.fillStyle = opt.bg || "rgba(255,255,255,.88)";
    roundRect(g, (W - bw) / 2, 4, bw, H - 8, 34); g.fill();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = opt.color || "#2d2a32";
    g.font = "44px Jua, sans-serif";
    g.fillText(text, W / 2, sub ? 54 : H / 2 + 2);
    if (sub) { g.font = "30px Jua, sans-serif"; g.fillStyle = "#7a6f86"; g.fillText(sub, W / 2, 108); }
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: opt.depthTest !== false, transparent: true }));
    const scale = opt.scale || 10;
    s.scale.set(scale, scale * H / W, 1);
    if (opt.depthTest === false) s.renderOrder = 10;
    return s;
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // ---------- 사람(꼬마 캐릭터) ----------
  const SKINS = ["#f6d2b4", "#e8b48f", "#c98e64", "#8d5a3b", "#f3c9a5"];
  function makeChibi(o = {}) {
    const g = new T.Group();
    const skin = o.skin || "#f6d2b4", shirt = o.shirt || "#4a7fc1", pants = o.pants || "#33456b";
    const legPivot = (x) => {
      const p = new T.Group(); p.position.set(x, 0.62, 0); g.add(p);
      cyl(p, 0.15, 0.15, 0.6, pants, 0, -0.6, 0, 8);
      box(p, 0.3, 0.14, 0.42, "#3a2a22", 0, -0.62, 0.06);
      return p;
    };
    const legL = legPivot(0.17), legR = legPivot(-0.17);
    cyl(g, 0.32, 0.4, 0.72, shirt, 0, 0.58, 0, 12);
    const armPivot = (x) => {
      const p = new T.Group(); p.position.set(x, 1.22, 0); g.add(p);
      cyl(p, 0.09, 0.1, 0.5, shirt, 0, -0.5, 0, 8);
      ball(p, 0.12, skin, 0, -0.55, 0);
      return p;
    };
    const armL = armPivot(0.43), armR = armPivot(-0.43);
    ball(g, 0.52, skin, 0, 1.82, 0);
    ball(g, 0.065, "#2b2230", 0.18, 1.86, 0.47);
    ball(g, 0.065, "#2b2230", -0.18, 1.86, 0.47);
    ball(g, 0.07, "#f0a0a0", 0.3, 1.72, 0.4).scale.set(0.09, 0.05, 0.03);
    ball(g, 0.07, "#f0a0a0", -0.3, 1.72, 0.4).scale.set(0.09, 0.05, 0.03);
    if (o.hair) ball(g, 0.53, o.hair, 0, 1.9, -0.06).scale.set(0.54, 0.5, 0.52);
    const hat = o.hat || "none", hc = o.hatColor || "#e8c77a";
    if (hat === "straw") {
      cyl(g, 0.9, 0.9, 0.06, hc, 0, 2.12, 0, 20);
      cyl(g, 0.42, 0.48, 0.36, hc, 0, 2.16, 0, 16);
      cyl(g, 0.485, 0.485, 0.1, "#8a4b2a", 0, 2.18, 0, 16);
    } else if (hat === "bearskin") {
      cyl(g, 0.5, 0.56, 1.05, "#141414", 0, 1.98, -0.02, 14);
      ball(g, 0.5, "#141414", 0, 3.02, -0.02).scale.set(0.5, 0.25, 0.5);
    } else if (hat === "beanie") {
      ball(g, 0.55, hc, 0, 2.05, 0).scale.set(0.56, 0.42, 0.56);
      ball(g, 0.15, "#ffffff", 0, 2.5, 0);
    } else if (hat === "crown") {
      cyl(g, 0.42, 0.42, 0.24, "#f2c230", 0, 2.2, 0, 16);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        cone(g, 0.09, 0.22, "#f2c230", Math.sin(a) * 0.38, 2.44, Math.cos(a) * 0.38, 6);
      }
      ball(g, 0.07, "#e04060", 0, 2.32, 0.42);
    } else if (hat === "cap") {
      ball(g, 0.53, hc, 0, 1.98, 0).scale.set(0.54, 0.38, 0.54);
      box(g, 0.6, 0.06, 0.42, hc, 0, 2.02, 0.52);
    } else if (hat === "tudor") {
      cyl(g, 0.62, 0.62, 0.16, "#1b1b1b", 0, 2.16, 0, 16);
    }
    if (o.bag) {
      box(g, 0.52, 0.56, 0.26, o.bag, 0, 0.66, -0.42);
      box(g, 0.42, 0.18, 0.06, "#ffffff", 0, 0.96, -0.56).material = mat(o.bagMark || "#ffe08a");
    }
    if (o.belt) box(g, 0.82, 0.1, 0.82, o.belt, 0, 0.62, 0);
    return { group: g, legL, legR, armL, armR, phase: Math.random() * 6 };
  }

  function animateChibi(c, dt, moving, speed = 1) {
    if (moving) {
      c.phase += dt * 7 * speed;
      const s = Math.sin(c.phase);
      c.legL.rotation.x = s * 0.6; c.legR.rotation.x = -s * 0.6;
      if (!c.waving) { c.armL.rotation.x = -s * 0.5; c.armR.rotation.x = s * 0.5; }
      c.bob = Math.abs(Math.cos(c.phase)) * 0.07;
    } else {
      c.legL.rotation.x *= 0.8; c.legR.rotation.x *= 0.8;
      if (!c.waving) { c.armL.rotation.x *= 0.8; c.armR.rotation.x *= 0.8; }
      c.bob = 0;
    }
    if (c.waving) {
      c.waving -= dt;
      c.armR.rotation.x = -2.8;
      c.armR.rotation.z = Math.sin(c.waving * 14) * 0.35 - 0.2;
      if (c.waving <= 0) { c.waving = 0; c.armR.rotation.z = 0; }
    }
  }

  // ---------- 길 ----------
  const animated = [];
  let curve, L, samples = [];
  const exclusions = [];

  function buildPath() {
    const pts = ROUTE.map(([x, z]) => new T.Vector3(x, 0, z));
    curve = new T.CatmullRomCurve3(pts, false, "centripetal");
    curve.arcLengthDivisions = 3000;
    L = curve.getLength();
    for (let s = 0; s <= L; s += 4) {
      const p = curve.getPointAt(s / L);
      samples.push({ s, x: p.x, z: p.z });
    }
  }
  const tmpV = new T.Vector3();
  function posAt(s) {
    return curve.getPointAt(Math.min(1, Math.max(0, s / L)));
  }
  function tanAt(s) {
    return curve.getTangentAt(Math.min(1, Math.max(0, s / L)));
  }
  // 길 위 s 지점에서 왼쪽으로 off만큼 떨어진 곳
  function sideAt(s, off) {
    const p = posAt(s), t = tanAt(s);
    return { x: p.x + t.z * off, z: p.z - t.x * off, hx: t.x, hz: t.z };
  }
  function nearestS(x, z) {
    let best = 0, bd = Infinity;
    for (const q of samples) {
      const d = (q.x - x) ** 2 + (q.z - z) ** 2;
      if (d < bd) { bd = d; best = q.s; }
    }
    return best;
  }
  function distToPath(x, z) {
    let bd = Infinity;
    for (const q of samples) bd = Math.min(bd, (q.x - x) ** 2 + (q.z - z) ** 2);
    return Math.sqrt(bd);
  }
  function onBridge(x, z) {
    return Math.abs(x - 1060) < 6 && z > 48 && z < 124;
  }
  function inRiver(z, margin = 0) {
    return z > RIVER.zNorth - margin && z < RIVER.zSouth + margin;
  }

  // 길(인도)과 찻길을 띠 모양으로 깔아요. 강 위(다리 구간)는 다리가 따로 있어서 건너뛰어요.
  function ribbon(parent, offA, offB, color, y, sFrom = 0, sTo = L, step = 2) {
    const pos = [];
    const idx = [];
    let prev = null;
    for (let s = sFrom; s <= sTo + 0.001; s += step) {
      const a = sideAt(s, offA), b = sideAt(s, offB);
      const ok = !inRiver(a.z, -3) && !inRiver(b.z, -3);
      const n = pos.length / 3;
      pos.push(a.x, y, a.z, b.x, y, b.z);
      if (prev !== null && ok && prev) idx.push(n - 2, n - 1, n, n - 1, n + 1, n);
      prev = ok;
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ color, side: T.DoubleSide }));
    parent.add(m);
    return m;
  }

  // ---------- 조각(chunk)별로 묶어서 멀리 있는 것은 그리지 않아요 ----------
  const chunks = new Map();
  let chunkRoot;
  function chunkFor(x, z) {
    const k = Math.floor(x / 120) + "," + Math.floor(z / 120);
    let c = chunks.get(k);
    if (!c) {
      c = new T.Group();
      c.userData.cx = (Math.floor(x / 120) + 0.5) * 120;
      c.userData.cz = (Math.floor(z / 120) + 0.5) * 120;
      chunks.set(k, c);
      chunkRoot.add(c);
    }
    return c;
  }
  function place(obj, x, z, rotY = 0) {
    obj.position.x = x; obj.position.z = z;
    obj.rotation.y = rotY;
    chunkFor(x, z).add(obj);
    return obj;
  }
  function updateChunks(px, pz) {
    for (const c of chunks.values()) {
      c.visible = Math.hypot(c.userData.cx - px, c.userData.cz - pz) < 320;
    }
    for (const lm of landmarks) {
      lm.group.visible = Math.hypot(lm.x - px, lm.z - pz) < 480;
      if (lm.label) lm.label.visible = Math.hypot(lm.x - px, lm.z - pz) < 230;
    }
  }

  function headingRot(hx, hz) { return Math.atan2(hx, hz); }

  // ---------- 런던 거리 소품 ----------
  function phoneBox() {
    const g = new T.Group();
    box(g, 1.3, 2.5, 1.3, "#c8102e", 0, 0, 0);
    box(g, 1.1, 1.4, 1.36, "#29333f", 0, 0.7, 0).material = mat("#3b4652");
    box(g, 1.36, 1.4, 1.1, "#3b4652", 0, 0.7, 0);
    box(g, 1.45, 0.25, 1.45, "#c8102e", 0, 2.5, 0);
    box(g, 1.2, 0.18, 1.2, "#a00c24", 0, 2.75, 0);
    box(g, 1.4, 0.22, 1.4, "#f4f0e6", 0, 2.25, 0);
    return g;
  }
  function postBox() {
    const g = new T.Group();
    cyl(g, 0.38, 0.38, 1.3, "#c8102e", 0, 0, 0, 12);
    ball(g, 0.4, "#c8102e", 0, 1.32, 0).scale.set(0.42, 0.18, 0.42);
    box(g, 0.4, 0.06, 0.1, "#1a1a1a", 0, 1.0, 0.36);
    return g;
  }
  function lamp() {
    const g = new T.Group();
    cyl(g, 0.08, 0.12, 4.2, "#1f2a24", 0, 0, 0, 6);
    box(g, 0.5, 0.6, 0.5, "#fff3c4", 0, 4.2, 0);
    cone(g, 0.45, 0.35, "#1f2a24", 0, 4.8, 0, 4);
    return g;
  }
  function tree(scale = 1) {
    const g = new T.Group();
    cyl(g, 0.22 * scale, 0.3 * scale, 2.2 * scale, "#6b4a32", 0, 0, 0, 6);
    ball(g, 1.7 * scale, "#5f9a4a", 0, 3.2 * scale, 0);
    ball(g, 1.2 * scale, "#6fae55", 0.6 * scale, 4.1 * scale, 0.3 * scale);
    return g;
  }
  function bench() {
    const g = new T.Group();
    box(g, 2.2, 0.12, 0.6, "#6b4a32", 0, 0.5, 0);
    box(g, 2.2, 0.5, 0.1, "#6b4a32", 0, 0.62, -0.28);
    box(g, 0.1, 0.5, 0.5, "#222", -0.95, 0, 0);
    box(g, 0.1, 0.5, 0.5, "#222", 0.95, 0, 0);
    return g;
  }
  function bus() {
    const g = new T.Group();
    box(g, 2.6, 2.1, 10, "#d32f2f", 0, 0.5, 0);
    box(g, 2.6, 2.0, 10, "#d32f2f", 0, 2.6, 0);
    box(g, 2.66, 0.9, 9.4, "#2b3440", 0, 1.35, 0.1);
    box(g, 2.66, 0.9, 9.4, "#2b3440", 0, 3.3, 0.1);
    box(g, 2.3, 0.6, 0.06, "#2b3440", 0, 3.3, 5.0);
    box(g, 2.3, 0.4, 0.06, "#f6c945", 0, 3.95, 5.0);
    box(g, 2.62, 0.08, 10.02, "#f2f2f2", 0, 2.55, 0);
    for (const [x, z] of [[1.2, 3.4], [-1.2, 3.4], [1.2, -3.2], [-1.2, -3.2]]) {
      const w = cyl(g, 0.55, 0.55, 0.4, "#1b1b1b", x, 0, z, 12);
      w.rotation.z = Math.PI / 2; w.position.y = 0.55;
    }
    return g;
  }
  function cab() {
    const g = new T.Group();
    box(g, 2, 1.0, 4.4, "#1c1c1f", 0, 0.4, 0);
    box(g, 1.8, 0.9, 2.4, "#1c1c1f", 0, 1.4, -0.3);
    box(g, 1.84, 0.6, 2.2, "#3d4a58", 0, 1.55, -0.3);
    box(g, 0.5, 0.2, 0.3, "#f5b400", 0, 2.3, 0.2);
    for (const [x, z] of [[0.95, 1.4], [-0.95, 1.4], [0.95, -1.4], [-0.95, -1.4]]) {
      const w = cyl(g, 0.4, 0.4, 0.3, "#111", x, 0, z, 10);
      w.rotation.z = Math.PI / 2; w.position.y = 0.4;
    }
    return g;
  }
  function boat(color = "#ffffff") {
    const g = new T.Group();
    box(g, 4, 1.4, 16, color, 0, -1.4, 0);
    cone(g, 2.83, 3, color, 0, -1.4, 9.4, 4).scale.set(2, 1.4, 2.83);
    box(g, 3.2, 1.8, 9, "#3c6f9a", 0, 0, -1);
    box(g, 3.3, 0.8, 9.1, "#d8eef8", 0, 0.6, -1);
    box(g, 3.4, 0.2, 9.4, "#ffffff", 0, 1.8, -1);
    return g;
  }
  function tallShip() {
    const g = new T.Group();
    box(g, 5, 2.4, 22, "#6b3d22", 0, -2.2, 0);
    box(g, 5.2, 0.4, 22.2, "#e9d9a6", 0, 0, 0);
    for (const [z, h] of [[6, 18], [-4, 20]]) {
      cyl(g, 0.25, 0.3, h, "#4a2f1d", 0, 0, z, 6);
      box(g, 7, 4, 0.2, "#f7f2e2", 0, h * 0.35, z + 0.3);
      box(g, 5.5, 3.4, 0.2, "#f7f2e2", 0, h * 0.62, z + 0.3);
    }
    flag(g, 0, 19.5, -4, 1.6);
    return g;
  }

  // 런던의 줄지어 선 집들
  const WALLS = [["#b9643f", "#2b3440"], ["#c98a5c", "#2b3440"], ["#ece4d2", "#3a4552"], ["#e3d7bd", "#3a4552"], ["#a95b44", "#25303b"], ["#f2ede2", "#4a5866"], ["#d4c3a3", "#2e3945"]];
  function townhouse(w, h, d) {
    const g = new T.Group();
    const [wall, win] = WALLS[Math.floor(Math.random() * WALLS.length)];
    fbox(g, w, h, d, wall, win, 0, 0, 0, { roof: "#4f545c" });
    box(g, w + 0.4, 0.6, d + 0.4, "#f4efe4", 0, h, 0);
    if (Math.random() < 0.5) {
      for (let x = -w / 2 + 1.5; x < w / 2; x += 3) box(g, 0.8, 1.6, 0.8, "#9b5a43", x, h + 0.6, -d / 4);
    }
    if (Math.random() < 0.35) box(g, w * 0.98, 0.9, 0.3, ["#2f5d50", "#7a1d2b", "#1f3a5c"][Math.floor(Math.random() * 3)], 0, 2.6, d / 2 + 0.15);
    return g;
  }

  function scatterCity() {
    const placed = [];
    const ok = (x, z, r) => {
      if (inRiver(z, r + 6)) return false;
      for (const e of exclusions) if (Math.hypot(e.x - x, e.z - z) < e.r + r) return false;
      if (distToPath(x, z) < r + 7) return false;
      for (const p of placed) if (Math.hypot(p.x - x, p.z - z) < p.r + r + 0.5) return false;
      return true;
    };
    for (let s = 6; s < L; s += 7) {
      const t = tanAt(s);
      for (const side of [1, -1]) {
        for (const row of [0, 1]) {
          const w = 9 + Math.random() * 6, d = 9 + Math.random() * 5;
          const h = 8 + Math.random() * 10 + row * 8;
          const off = side * ((side > 0 ? 16 : 11) + d / 2 + row * 16);
          const q = sideAt(s, off);
          const r = Math.max(w, d) * 0.55;
          if (!ok(q.x, q.z, r)) continue;
          placed.push({ x: q.x, z: q.z, r });
          // 집 앞(+z)이 길을 바라보게 돌려요
          place(townhouse(w, h, d), q.x, q.z, Math.atan2(-side * t.z, side * t.x));
        }
      }
    }
    // 인도의 가로등, 나무, 공중전화, 우체통, 벤치
    let n = 0;
    for (let s = 10; s < L - 4; s += 18) {
      n++;
      const t = tanAt(s);
      const q = sideAt(s, -4.2);
      if (inRiver(q.z, 2) || exclusions.some((e) => e.tight && Math.hypot(e.x - q.x, e.z - q.z) < e.tight)) continue;
      const rot = headingRot(t.x, t.z);
      if (n % 7 === 3) place(phoneBox(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 11 === 5) place(postBox(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 5 === 0) place(bench(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 2 === 0) place(lamp(), q.x, q.z, 0);
      else place(tree(0.9 + Math.random() * 0.4), sideAt(s, -6.5).x, sideAt(s, -6.5).z, 0);
    }
  }

  // ---------- 땅, 하늘, 템스강 ----------
  function buildGround(scene) {
    const ground = mat("#a9b48f");
    const north = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 700), ground);
    north.rotation.x = -Math.PI / 2;
    north.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zNorth - 350);
    scene.add(north);
    const south = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 300), ground);
    south.rotation.x = -Math.PI / 2;
    south.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zSouth + 150);
    scene.add(south);
    const water = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, RIVER.zSouth - RIVER.zNorth + 4),
      new T.MeshLambertMaterial({ color: "#5a8ea3" }));
    water.rotation.x = -Math.PI / 2;
    water.position.set((RIVER.x0 + RIVER.x1) / 2, -2.4, (RIVER.zNorth + RIVER.zSouth) / 2);
    scene.add(water);
    // 강둑
    for (const z of [RIVER.zNorth, RIVER.zSouth]) {
      box(scene, RIVER.x1 - RIVER.x0 + 400, 2.6, 1.6, "#b7ad98", (RIVER.x0 + RIVER.x1) / 2, -2.5, z);
      box(scene, RIVER.x1 - RIVER.x0 + 400, 0.8, 0.6, "#8f8676", (RIVER.x0 + RIVER.x1) / 2, 0, z + (z === RIVER.zNorth ? -0.6 : 0.6));
    }
    // 잔디 공원 (세인트 제임스 공원, 런던 아이 옆, 탑 옆)
    for (const [x, z, r] of [[60, 40, 34], [100, -60, 30], [380, 150, 28], [-60, 30, 26], [1000, -10, 22], [640, -120, 26]]) {
      const p = new T.Mesh(new T.CircleGeometry(r, 24), mat("#86b462"));
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.04, z);
      scene.add(p);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, rr = r * (0.3 + Math.random() * 0.6);
        const tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr;
        if (distToPath(tx, tz) > 8 && !inRiver(tz, 3)) place(tree(1 + Math.random() * 0.5), tx, tz, 0);
      }
    }
  }

  function buildClouds(scene) {
    const white = new T.MeshLambertMaterial({ color: "#ffffff", emissive: "#bbbbbb" });
    for (let i = 0; i < 26; i++) {
      const c = new T.Group();
      for (let k = 0; k < 4; k++) {
        const m = new T.Mesh(cachedGeo("s", () => new T.SphereGeometry(1, 16, 12)), white);
        const r = 8 + Math.random() * 8;
        m.scale.set(r * 1.6, r * 0.6, r);
        m.position.set(k * 12 - 18, Math.random() * 3, Math.random() * 8);
        c.add(m);
      }
      c.position.set(-300 + Math.random() * 1700, 110 + Math.random() * 40, -450 + Math.random() * 700);
      scene.add(c);
      const sp = 1 + Math.random() * 2;
      animated.push((t, dt) => { c.position.x += dt * sp; if (c.position.x > 1500) c.position.x = -350; });
    }
  }

  // ---------- 명소 9곳 ----------
  const STONE = "#e6dfcc";

  function build_palace(g) {
    fbox(g, 104, 20, 22, STONE, "#4c5560", 0, 0, -11, { roof: "#b8b2a2" });
    box(g, 106, 1.2, 23, "#d6cfbb", 0, 20, -11);
    box(g, 30, 3, 4, STONE, 0, 0, 1.5);
    for (let i = 0; i < 6; i++) cyl(g, 0.8, 0.9, 14, "#f1ebdc", -10 + i * 4, 3, 2.2, 12);
    box(g, 28, 2, 3, "#d6cfbb", 0, 17, 1.8);
    gable(g, 28, 5, 2.4, "#d6cfbb", 0, 19, 1.5);
    box(g, 12, 0.4, 2, "#d6cfbb", 0, 8, 1.2);
    box(g, 12, 1, 0.12, "#a5122a", 0, 8.4, 2.2);
    flag(g, 0, 21, -8, 4);
    // 울타리와 문
    for (let x = -50; x <= 50; x += 2.5) {
      cyl(g, 0.09, 0.09, 3, "#1b1b1b", x, 0, 18, 5);
      cone(g, 0.18, 0.4, "#d4af37", x, 3, 18, 5);
    }
    box(g, 101, 0.2, 0.2, "#1b1b1b", 0, 2.6, 18);
    box(g, 101, 0.4, 0.5, "#e6dfcc", 0, 0, 18);
    for (const x of [-6, 6]) { box(g, 1.4, 5, 1.4, "#e6dfcc", x, 0, 18); ball(g, 0.6, "#d4af37", x, 5.6, 18); }
    box(g, 10, 4, 0.3, "#d4af37", 0, 0, 18).material = mat("#c9a23a");
    // 빅토리아 기념비
    cyl(g, 7, 8, 1.2, "#ece7da", -34, 0, 30, 20);
    cyl(g, 3.5, 4, 5, "#f4f1e8", -34, 1.2, 30, 12);
    box(g, 2.6, 6, 2.6, "#f4f1e8", -34, 6, 30);
    ball(g, 1, "#e8b923", -34, 13, 30);
    cone(g, 0.8, 1.8, "#e8b923", -34, 13.4, 30, 8);
    box(g, 3.4, 0.3, 0.8, "#e8b923", -34, 13.5, 30).rotation.z = 0.3;
    // 근위병 (두 명은 앞뒤로 걸어요)
    for (const x of [-22, 22]) {
      box(g, 1.8, 3.4, 1.8, "#1e2a3a", x, 0, 15);
      box(g, 2, 0.3, 2, "#c9a23a", x, 3.4, 15);
      const gd = makeChibi({ shirt: "#c8102e", pants: "#121a2a", hat: "bearskin", belt: "#ffffff" });
      gd.group.position.set(x + (x < 0 ? 2.2 : -2.2), 0, 15.6);
      g.add(gd.group);
    }
    for (const x0 of [-12, 12]) {
      const gd = makeChibi({ shirt: "#c8102e", pants: "#121a2a", hat: "bearskin", belt: "#ffffff" });
      g.add(gd.group);
      animated.push((t, dt) => {
        const k = (t * 0.12 + (x0 > 0 ? 0.5 : 0)) % 1;
        const fwd = k < 0.5;
        const u = fwd ? k * 2 : 2 - k * 2;
        gd.group.position.set(x0 - 6 + u * 12, 0, 13.5);
        gd.group.rotation.y = fwd ? Math.PI / 2 : -Math.PI / 2;
        animateChibi(gd, dt, true, 0.7);
        gd.group.position.y = gd.bob;
      });
    }
  }

  function build_abbey(g) {
    const S = "#d8ccb0", R = "#7a7f86", WIN = "#3f4d6b";
    fbox(g, 18, 24, 58, S, WIN, 0, 0, -32, { style: "arch", tile: 6, roof: R });
    const roof = gable(g, 18, 8, 58, R, 0, 24, -32);
    for (let z = -58; z <= -8; z += 10) for (const x of [-10, 10]) { box(g, 2, 20, 3, S, x, 0, z); cone(g, 0.9, 4, S, x, 20, z, 4); }
    // 앞의 두 탑
    for (const x of [-11, 11]) {
      fbox(g, 8, 44, 8, S, WIN, x, 0, 0, { style: "slit", tile: 4, roof: S });
      box(g, 8.8, 1.2, 8.8, "#cbbfa3", x, 44, 0);
      for (const [dx, dz] of [[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]]) cone(g, 0.8, 7, S, x + dx, 44, dz, 4);
      cone(g, 1.4, 4, S, x, 44, 0, 4);
    }
    box(g, 14, 30, 2, S, 0, 0, 1.5);
    gable(g, 14, 6, 2, S, 0, 30, 1.5);
    // 뾰족한 아치 창과 문
    const arch = (w, h) => {
      const s = new T.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w * 0.6);
      s.quadraticCurveTo(w / 2, h - w * 0.1, 0, h); s.quadraticCurveTo(-w / 2, h - w * 0.1, -w / 2, h - w * 0.6);
      return new T.ShapeGeometry(s);
    };
    const win = new T.Mesh(arch(8, 13), mat(WIN)); win.position.set(0, 12, 2.6); g.add(win);
    const tr = new T.Mesh(arch(1, 13), mat(S)); tr.scale.x = 0.5; tr.position.set(0, 12, 2.65); g.add(tr);
    box(g, 8, 0.4, 0.1, S, 0, 17, 2.66);
    const door = new T.Mesh(arch(4.4, 8), mat("#5a3b28")); door.position.set(0, 0.01, 2.6); g.add(door);
  }

  function build_bigben(g) {
    const S = "#cdb27a", W = "#6b5a3a", R = "#3b4a46";
    // 엘리자베스 타워
    fbox(g, 8, 50, 8, S, W, 0, 0, 0, { style: "slit", tile: 2.6, roof: S });
    box(g, 10, 10, 10, S, 0, 50, 0);
    const face = new T.MeshLambertMaterial({ map: clockTex });
    for (let i = 0; i < 4; i++) {
      const p = new T.Mesh(new T.PlaneGeometry(8.4, 8.4), face);
      const a = (i * Math.PI) / 2;
      p.position.set(Math.sin(a) * 5.03, 55, Math.cos(a) * 5.03);
      p.rotation.y = a;
      g.add(p);
    }
    fbox(g, 8.6, 6, 8.6, "#bfa36c", "#3a3328", 0, 60, 0, { style: "arch", tile: 2.1, roof: S });
    for (const [dx, dz] of [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]]) cone(g, 0.6, 5, S, dx, 60, dz, 4);
    cone(g, 6.6, 13, R, 0, 66, 0, 4);
    cone(g, 1, 9, "#c9a23a", 0, 79, 0, 4);
    // 국회의사당
    fbox(g, 88, 16, 16, S, W, 52, 0, 0, { style: "arch", tile: 3.4, roof: R });
    box(g, 88, 1, 16.4, "#bfa36c", 52, 16, 0);
    for (let x = 10; x <= 94; x += 6) { cone(g, 0.5, 3, S, x, 17, 8, 4); cone(g, 0.5, 3, S, x, 17, -8, 4); }
    cyl(g, 3.6, 3.6, 10, S, 50, 17, 0, 8);
    cone(g, 3.6, 12, R, 50, 27, 0, 8);
    fbox(g, 13, 44, 13, S, W, 92, 0, 0, { style: "slit", tile: 3, roof: S });
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) cone(g, 0.9, 7, S, 92 + dx, 44, dz, 4);
    flag(g, 92, 44, 0, 4);
  }

  function build_eye(g) {
    const wheel = new T.Group();
    wheel.position.set(0, 35, 0);
    g.add(wheel);
    const white = mat("#f2f5f7");
    for (const z of [-1.4, 1.4]) {
      const rim = new T.Mesh(new T.TorusGeometry(30, 0.45, 6, 72), white); rim.position.z = z; wheel.add(rim);
      const inner = new T.Mesh(new T.TorusGeometry(26, 0.25, 6, 60), white); inner.position.z = z; wheel.add(inner);
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const sp = new T.Mesh(BOX, white);
      sp.scale.set(0.18, 30, 0.18);
      sp.position.set(Math.sin(a) * 15, Math.cos(a) * 15, 0);
      sp.rotation.z = -a;
      wheel.add(sp);
    }
    const hub = cyl(wheel, 1.6, 1.6, 4, "#d8dde2", 0, -2, 0, 16); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0, 0);
    const glass = new T.MeshLambertMaterial({ color: "#cfe8f4", emissive: "#203038" });
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const c = new T.Mesh(cachedGeo("s", () => new T.SphereGeometry(1, 16, 12)), glass);
      c.scale.set(1.3, 1.3, 2.2);
      c.position.set(Math.sin(a) * 31.6, Math.cos(a) * 31.6, 0);
      wheel.add(c);
    }
    // 받침 다리
    for (const x of [-9, 9]) {
      const leg = new T.Mesh(BOX, white);
      leg.scale.set(1.2, 40, 1.2);
      leg.position.set(x / 2, 18, -9);
      leg.rotation.x = 0.27;
      leg.rotation.z = x > 0 ? -0.13 : 0.13;
      g.add(leg);
    }
    box(g, 30, 1.6, 12, "#c9c4b6", 0, 0, 0);
    box(g, 8, 3, 5, "#3c6f9a", 0, 1.6, 4);
    animated.push((t, dt) => { wheel.rotation.z += dt * 0.025; });
  }

  function build_trafalgar(g) {
    const B = "#4b4136";
    const plaza = new T.Mesh(new T.CylinderGeometry(30, 30, 0.2, 32), mat("#cfc4ad"));
    plaza.position.y = 0.06; g.add(plaza);
    box(g, 8, 6, 8, "#d8d0bf", 0, 0, 0);
    box(g, 6, 2, 6, "#d8d0bf", 0, 6, 0);
    cyl(g, 1.3, 1.5, 36, "#e2dccd", 0, 8, 0, 14);
    box(g, 3.4, 1.6, 3.4, "#7a6a50", 0, 44, 0);
    cyl(g, 0.5, 0.7, 2.6, "#6a6a6a", 0, 45.6, 0, 8);
    ball(g, 0.5, "#6a6a6a", 0, 48.6, 0);
    // 사자 네 마리
    const lion = (x, z, rot) => {
      const l = new T.Group();
      box(l, 3, 1.6, 6, "#d8d0bf", 0, 0, 0);
      box(l, 2.2, 1.4, 4.2, B, 0, 1.6, -0.4);
      ball(l, 1.25, B, 0, 3.3, 1.6).scale.set(1.25, 1.35, 1.1);
      box(l, 0.9, 0.7, 0.9, B, 0, 2.9, 2.7);
      box(l, 0.6, 0.6, 1.6, B, 0.6, 1.6, 2.2);
      box(l, 0.6, 0.6, 1.6, B, -0.6, 1.6, 2.2);
      l.position.set(x, 0, z);
      l.rotation.y = rot;
      g.add(l);
    };
    lion(0, 8.2, 0); lion(0, -8.2, Math.PI); lion(8.2, 0, Math.PI / 2); lion(-8.2, 0, -Math.PI / 2);
    for (const x of [-15, 15]) {
      cyl(g, 4.5, 4.8, 1.1, "#cfc6b2", x, 0, 8, 20);
      cyl(g, 4.1, 4.1, 1.15, "#7fb5cf", x, 0, 8, 20);
      cyl(g, 0.4, 0.6, 2.6, "#cfc6b2", x, 1, 8, 8);
      cyl(g, 1.6, 0.6, 0.6, "#cfc6b2", x, 3.4, 8, 12);
      const spray = cyl(g, 0.15, 0.6, 2.2, "#e5f4fb", x, 4, 8, 8);
      animated.push((t) => { spray.scale.y = 2 + Math.sin(t * 6 + x) * 0.3; });
    }
    // 내셔널 갤러리
    fbox(g, 70, 14, 14, "#e2dccd", "#58606a", 0, 0, -40, { roof: "#9aa3a6" });
    box(g, 22, 1.6, 6, "#e2dccd", 0, 0, -30.5);
    for (let i = 0; i < 6; i++) cyl(g, 0.7, 0.8, 11, "#f0ebde", -7.5 + i * 3, 1.6, -29.5, 10);
    gable(g, 22, 4, 4, "#e2dccd", 0, 12.6, -30.5);
    cyl(g, 4, 4, 3, "#e2dccd", 0, 14, -40, 12);
    dome(g, 4, "#8a9ba0", 0, 17, -40);
    // 비둘기
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, r = 11 + Math.random() * 12;
      ball(g, 0.25, "#8a8f99", Math.cos(a) * r, 0.35, Math.sin(a) * r).scale.set(0.25, 0.22, 0.38);
    }
  }

  function build_museum(g) {
    const S = "#e8e2d2";
    fbox(g, 80, 18, 30, S, "#58606a", 0, 0, -16, { roof: "#9aa3a6" });
    for (let i = 0; i < 4; i++) box(g, 64 - i * 2, 0.6, 3, "#d9d2c0", 0, i * 0.6, 12 - i * 1.2);
    box(g, 60, 2.4, 12, "#ddd6c4", 0, 0, 3);
    for (let i = 0; i < 12; i++) cyl(g, 0.9, 1.05, 14, "#f3eee2", -27.5 + i * 5, 2.4, 6.5, 14);
    for (let i = 0; i < 8; i++) cyl(g, 0.9, 1.05, 14, "#f3eee2", -17.5 + i * 5, 2.4, 1, 14);
    box(g, 60, 2.6, 12, S, 0, 16.4, 3);
    gable(g, 60, 7, 2.6, S, 0, 19, 7.6);
    gable(g, 56, 6, 9, "#d9d2c0", 0, 19, 2.5);
    const sign = new T.Mesh(new T.PlaneGeometry(34, 1.8), new T.MeshLambertMaterial({
      map: canvasTex(512, 28, (c) => { c.fillStyle = S; c.fillRect(0, 0, 512, 28); c.fillStyle = "#6a6250"; c.font = "bold 22px Georgia, serif"; c.textAlign = "center"; c.fillText("BRITISH  MUSEUM", 256, 22); })
    }));
    sign.position.set(0, 17.7, 9.02);
    g.add(sign);
    for (const x of [-36, 36]) {
      fbox(g, 14, 16, 22, S, "#58606a", x, 0, 0, { roof: "#9aa3a6" });
      for (let i = 0; i < 3; i++) cyl(g, 0.8, 0.9, 13, "#f3eee2", x - 4 + i * 4, 1, 11.6, 12);
    }
    // 현수막
    for (const x of [-20, 20]) box(g, 3, 8, 0.2, "#c8102e", x, 6, 9.4);
  }

  function build_stpauls(g) {
    const S = "#e9e3d3", LEAD = "#8e9ea3", W = "#5c6670";
    fbox(g, 26, 22, 72, S, W, 0, 0, -38, { roof: "#9aa3a6" });
    fbox(g, 62, 20, 18, S, W, 0, 0, -32, { roof: "#9aa3a6" });
    for (const x of [-11, 11]) {
      fbox(g, 7, 30, 7, S, W, x, 0, -3, { style: "arch", tile: 3.5, roof: S });
      cyl(g, 3, 3, 5, S, x, 30, -3, 12);
      dome(g, 3, LEAD, x, 35, -3);
      cone(g, 0.6, 3, "#d4af37", x, 37.6, -3, 8);
    }
    box(g, 16, 1.2, 6, S, 0, 0, 2);
    for (let i = 0; i < 6; i++) cyl(g, 0.6, 0.7, 9, "#f4f0e4", -6.25 + i * 2.5, 1.2, 4, 10);
    box(g, 16, 1.4, 5, S, 0, 10.2, 2.5);
    for (let i = 0; i < 4; i++) cyl(g, 0.55, 0.6, 7, "#f4f0e4", -4.5 + i * 3, 11.6, 4, 10);
    box(g, 16, 1.2, 5, S, 0, 18.6, 2.5);
    gable(g, 17, 4, 5, S, 0, 19.8, 2.5);
    // 큰 돔
    cyl(g, 13, 13, 9, S, 0, 22, -32, 32);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      cyl(g, 0.5, 0.55, 8, "#f6f2e8", Math.sin(a) * 14, 22, -32 + Math.cos(a) * 14, 8);
    }
    cyl(g, 14.6, 14.6, 1, S, 0, 30, -32, 32);
    cyl(g, 11, 11, 4, S, 0, 31, -32, 32);
    dome(g, 11, LEAD, 0, 35, -32);
    cyl(g, 2, 2, 5, S, 0, 45.4, -32, 12);
    dome(g, 2, LEAD, 0, 50.4, -32);
    ball(g, 0.8, "#e8b923", 0, 53.2, -32);
    box(g, 0.3, 2.2, 0.3, "#e8b923", 0, 53.6, -32);
    box(g, 1.2, 0.3, 0.3, "#e8b923", 0, 54.8, -32);
  }

  function build_tower(g) {
    const W = "#cfc5ad", WH = "#ece5d4", LEAD = "#5f6f6a";
    const grass = new T.Mesh(new T.PlaneGeometry(54, 54), mat("#80a85c"));
    grass.rotation.x = -Math.PI / 2; grass.position.y = 0.05; g.add(grass);
    for (const [x, z, w, d] of [[0, -28, 58, 2.6], [0, 28, 58, 2.6], [-28, 0, 2.6, 58], [28, 0, 2.6, 58]]) {
      box(g, w, 7, d, W, x, 0, z);
      const n = Math.round(Math.max(w, d) / 3);
      for (let i = 0; i < n; i++) {
        const u = -Math.max(w, d) / 2 + 1.5 + i * 3;
        box(g, w > d ? 1.4 : d, 1.2, w > d ? d : 1.4, W, w > d ? x + u : x, 7, w > d ? z : z + u);
      }
    }
    for (const [x, z] of [[-28, -28], [28, -28], [-28, 28], [28, 28]]) {
      cyl(g, 3.6, 3.8, 10, W, x, 0, z, 14);
      cyl(g, 4, 4, 1, W, x, 10, z, 14);
    }
    // 정문
    for (const x of [-5, 5]) { cyl(g, 3, 3.2, 11, W, x, 0, 28, 12); cone(g, 3.3, 3, LEAD, x, 11, 28, 12); }
    box(g, 5, 4.4, 3, "#4a3a2c", 0, 0, 28.4);
    // 화이트 타워
    fbox(g, 22, 22, 22, WH, "#3e3a36", 0, 0, -2, { style: "arch", tile: 4.4, roof: "#a9a59a" });
    for (let x = -10; x <= 10; x += 2.5) for (const z of [-13, 9]) box(g, 1.2, 1, 1, WH, x, 22, z);
    const capped = (x, z, round) => {
      if (round) cyl(g, 2.6, 2.6, 6, WH, x, 22, z, 14);
      else box(g, 4.6, 6, 4.6, WH, x, 22, z);
      ball(g, 2.4, LEAD, x, 29, z).scale.set(2.4, 2.2, 2.4);
      cone(g, 0.6, 2.2, LEAD, x, 31, z, 8);
      box(g, 0.12, 2.4, 0.12, "#d4af37", x, 33, z);
      box(g, 1.2, 0.5, 0.06, "#d4af37", x + 0.6, 34.6, z);
    };
    capped(-10, -13, false); capped(10, -13, false); capped(-10, 9, false); capped(10, 9, true);
    // 까마귀들
    for (let i = 0; i < 6; i++) {
      const x = -18 + Math.random() * 36, z = 14 + Math.random() * 10;
      const r = new T.Group();
      ball(r, 0.5, "#1a1a20", 0, 0.5, 0).scale.set(0.42, 0.45, 0.7);
      ball(r, 0.28, "#1a1a20", 0, 0.95, 0.5);
      cone(r, 0.1, 0.4, "#333", 0, 0.85, 0.85, 6).rotation.x = Math.PI / 2;
      r.position.set(x, 0, z);
      r.rotation.y = Math.random() * 6;
      g.add(r);
      animated.push((t) => { r.position.y = Math.max(0, Math.sin(t * 3 + i * 2)) * 0.3; });
    }
    // 비피터(근위병)
    for (const x of [-9, 9]) {
      const b = makeChibi({ shirt: "#7a1020", pants: "#7a1020", hat: "tudor", belt: "#e8b923" });
      b.group.position.set(x, 0, 31);
      g.add(b.group);
    }
  }

  let bridge = null;
  function build_bridge(g) {
    // 이 명소만 세상 좌표 그대로 만들어요 (g는 위치 0, 회전 0)
    const X = 1060, S = "#d3cab4", BLUE = "#3d6fa8", R = "#4b5560";
    const deckY = 0;
    // 양쪽 강둑에서 탑까지 이어지는 다리 바닥
    for (const [z0, z1] of [[46, 68], [102, 124]]) {
      box(g, 10, 0.8, z1 - z0, "#55595f", X, deckY - 0.5, (z0 + z1) / 2);
      for (const x of [-4.8, 4.8]) box(g, 0.3, 1.1, z1 - z0, BLUE, X + x, deckY + 0.3, (z0 + z1) / 2);
    }
    // 두 탑
    for (const zc of [72, 98]) {
      box(g, 26, 4.5, 14, "#a8a090", X, -4.4, zc);
      for (const dx of [-7.5, 7.5]) fbox(g, 5, 36, 8, S, "#4f5a66", X + dx, 0, zc, { style: "arch", tile: 2.5, roof: S });
      fbox(g, 20, 24, 8, S, "#4f5a66", X, 10, zc, { style: "arch", tile: 2.5, roof: S });
      box(g, 20.4, 0.8, 8.4, "#c2b89f", X, 34, zc);
      for (const [dx, dz] of [[-8.5, -3], [8.5, -3], [-8.5, 3], [8.5, 3]]) {
        box(g, 2.6, 5, 2.6, S, X + dx, 34.8, zc + dz);
        cone(g, 1.8, 4.5, R, X + dx, 39.8, zc + dz, 4);
        ball(g, 0.3, "#d4af37", X + dx, 44.6, zc + dz);
      }
      cone(g, 7, 9, R, X, 34.8, zc, 4);
      ball(g, 0.4, "#d4af37", X, 44, zc);
      // 강둑 쪽으로 늘어진 파란 줄(현수 사슬)
      for (const dx of [-7.5, 7.5]) {
        const toBank = zc < 85 ? -1 : 1;
        const ch = box(g, 0.9, 0.9, 34, BLUE, X + dx, 0, zc + toBank * 15);
        ch.position.y = 15;
        ch.rotation.x = toBank * 0.87;
      }
    }
    // 위쪽 파란 통로
    for (const dx of [-6, 6]) {
      box(g, 3, 3.2, 22, BLUE, X + dx, 29, 85);
      box(g, 3.1, 0.5, 22, "#e9e6dc", X + dx, 31, 85);
    }
    // 가운데 열리는 다리 두 쪽
    const mk = (pivotZ, dir) => {
      const p = new T.Group();
      p.position.set(X, deckY, pivotZ);
      box(p, 10, 0.8, 9, "#55595f", 0, -0.5, dir * 4.5);
      for (const x of [-4.8, 4.8]) box(p, 0.3, 1.1, 9, BLUE, x, 0.3, dir * 4.5);
      box(p, 0.4, 0.06, 8.6, "#f2f2f2", 0, -0.08, dir * 4.5);
      g.add(p);
      return p;
    };
    const a = mk(76, 1), b = mk(94, -1);
    const ship = tallShip();
    ship.position.set(900, 0, 85);
    ship.rotation.y = Math.PI / 2;
    g.add(ship);
    bridge = { a, b, ship, open: 0, t: 0, state: "idle", onDone: null };
  }

  // 배가 지나가도록 다리를 열고 닫아요
  function openBridge(onDone) {
    if (!bridge) { onDone && onDone(); return; }
    bridge.state = "run"; bridge.t = 0; bridge.onDone = onDone;
  }
  function updateBridge(dt) {
    if (!bridge || bridge.state !== "run") return;
    const B = bridge;
    B.t += dt;
    const t = B.t;
    B.open = t < 4 ? t / 4 : t < 13 ? 1 : t < 17 ? 1 - (t - 13) / 4 : 0;
    const ang = (1 - Math.cos(B.open * Math.PI)) / 2 * 1.15;
    B.a.rotation.x = -ang;
    B.b.rotation.x = ang;
    B.ship.position.x = 990 + Math.max(0, Math.min(1, (t - 2.5) / 10)) * 150;
    if (t >= 17.5) {
      B.state = "idle";
      B.ship.position.x = 900;
      const cb = B.onDone; B.onDone = null;
      cb && cb();
    }
  }

  const landmarks = [];
  function buildLandmarks(scene) {
    const builders = { palace: build_palace, abbey: build_abbey, bigben: build_bigben, eye: build_eye, trafalgar: build_trafalgar, museum: build_museum, stpauls: build_stpauls, tower: build_tower, bridge: build_bridge };
    const heights = { palace: 30, abbey: 58, bigben: 92, eye: 72, trafalgar: 54, museum: 32, stpauls: 60, tower: 42, bridge: 52 };
    for (const st of STOPS) {
      const g = new T.Group();
      const [ax, az] = st.at, [sx, sz] = st.stop;
      builders[st.build](g);
      if (st.build !== "bridge") {
        g.position.set(ax, 0, az);
        g.rotation.y = Math.atan2(sx - ax, sz - az);
      }
      scene.add(g);
      const label = makeLabel(`${st.emoji} ${st.ko}`, st.en, { scale: 18 });
      label.position.set(ax, heights[st.build] + 4, az);
      scene.add(label);
      landmarks.push({ id: st.id, group: g, label, x: ax, z: az, h: heights[st.build] });
    }
  }

  function initExclusions() {
    const r = { palace: 62, abbey: 44, bigben: 30, eye: 48, trafalgar: 48, museum: 50, stpauls: 58, tower: 46, bridge: 30 };
    for (const st of STOPS) exclusions.push({ x: st.at[0], z: st.at[1], r: r[st.build], tight: r[st.build] * 0.6 });
    exclusions.push({ x: 205, z: 45, r: 58 });
    exclusions.push({ x: 1060, z: 40, r: 18, tight: 18 });
  }

  // ---------- 움직이는 것들: 버스, 택시, 배, 걷는 사람 ----------
  const movers = [];
  const walkers = [];
  let busEnd;
  function buildTraffic(scene) {
    busEnd = nearestS(1050, 44) - 4;
    const make = [bus, cab, bus, cab, cab, bus, cab];
    make.forEach((fn, i) => {
      const o = fn();
      scene.add(o);
      movers.push({ o, k: i / make.length, speed: fn === bus ? 6 : 9 });
    });
    for (let i = 0; i < 4; i++) {
      const b = boat(i % 2 ? "#ffffff" : "#f6e7b4");
      scene.add(b);
      animated.push((t) => {
        const dir = i % 2 ? 1 : -1;
        const span = RIVER.x1 - RIVER.x0;
        let x = ((t * 7 + i * 420) % span);
        x = dir > 0 ? RIVER.x0 + x : RIVER.x1 - x;
        b.position.set(x, 0, dir > 0 ? 95 : 72);
        b.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        b.visible = !(Math.abs(x - 1060) < 30);
      });
    }
    const shirts = ["#e07a5f", "#3d405b", "#81b29a", "#f2cc8f", "#6d597a", "#b56576", "#457b9d", "#2a9d8f", "#e9c46a", "#264653"];
    const hats = ["none", "none", "cap", "beanie", "none", "straw"];
    const hair = ["#2b1d14", "#5a3a22", "#c58b4a", "#1a1a1a", "#7a4a2a"];
    for (let i = 0; i < 26; i++) {
      const c = makeChibi({
        skin: SKINS[i % SKINS.length], shirt: shirts[i % shirts.length], pants: i % 3 ? "#33456b" : "#5a4a3a",
        hat: hats[i % hats.length], hatColor: shirts[(i + 3) % shirts.length], hair: hair[i % hair.length], bag: i % 4 === 0 ? "#c0563c" : null
      });
      scene.add(c.group);
      walkers.push({ c, s: Math.random() * L, dir: i % 2 ? 1 : -1, off: (i % 2 ? -1.8 : 1.6) + Math.random() * 0.6, speed: 1.6 + Math.random() * 0.8, bubble: null, bubbleT: 0 });
    }
  }

  function updateMovers(t, dt, ps) {
    for (const m of movers) {
      const span = busEnd * 2;
      const u = ((t * m.speed) / span + m.k) % 1;
      const fwd = u < 0.5;
      const s = fwd ? u * 2 * busEnd : (1 - u) * 2 * busEnd;
      const q = sideAt(s, fwd ? 10.2 : 6.6);
      m.o.position.set(q.x, 0, q.z);
      m.o.rotation.y = headingRot(q.hx, q.hz) + (fwd ? 0 : Math.PI);
      m.o.visible = Math.abs(s - ps) < 260;
    }
    for (const w of walkers) {
      w.s += w.dir * w.speed * dt;
      if (w.s > L - 30) w.s = 2;
      if (w.s < 2) w.s = L - 30;
      const near = Math.abs(w.s - ps) < 200;
      w.c.group.visible = near;
      if (!near) continue;
      const q = sideAt(w.s, w.off);
      const y = onBridge(q.x, q.z) ? 0.3 : 0;
      w.c.group.position.set(q.x, y, q.z);
      animateChibi(w.c, dt, true, w.speed / 2);
      w.c.group.position.y = y + w.c.bob;
      w.c.group.rotation.y = headingRot(q.hx, q.hz) + (w.dir > 0 ? 0 : Math.PI);
      if (w.bubble) {
        w.bubbleT -= dt;
        w.bubble.position.set(q.x, y + 4.2, q.z);
        if (w.bubbleT <= 0) { w.bubble.parent.remove(w.bubble); w.bubble = null; }
      }
    }
  }

  // 가장 가까운 사람이 인사해요
  function nearestWalker(x, z, maxD = 22) {
    let best = null, bd = maxD;
    for (const w of walkers) {
      if (!w.c.group.visible) continue;
      const d = Math.hypot(w.c.group.position.x - x, w.c.group.position.z - z);
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }
  function sayBubble(scene, w, text) {
    if (w.bubble) w.bubble.parent.remove(w.bubble);
    w.bubble = makeLabel(text, null, { scale: 7, depthTest: false, bg: "rgba(255,255,255,.95)" });
    scene.add(w.bubble);
    w.bubbleT = 3.5;
    w.c.waving = 1.6;
  }

  // ---------- 시작 ----------
  function init(scene) {
    chunkRoot = new T.Group();
    scene.add(chunkRoot);
    buildPath();
    initExclusions();
    buildGround(scene);
    const city = new T.Group();
    scene.add(city);
    ribbon(city, -3.2, 3.2, "#d9d2c3", 0.05);
    ribbon(city, 3.2, 4.6, "#b3ab9c", 0.07);
    ribbon(city, 4.6, 12.2, "#5d6168", 0.06, 0, nearestS(1050, 44));
    for (let s = 0; s < nearestS(1050, 44); s += 8) ribbon(city, 8.3, 8.5, "#f1f1f1", 0.08, s, s + 4, 4);
    buildLandmarks(scene);
    scatterCity();
    buildClouds(scene);
    buildTraffic(scene);
    const now = londonTime();
    drawClock(now.h, now.m);
    // 멈추는 곳(명소) 위치를 길 위의 거리(s)로 바꿔 둬요
    for (const st of STOPS) st.s = nearestS(st.stop[0], st.stop[1]);
  }

  function londonTime() {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      const h = +parts.find((p) => p.type === "hour").value, m = +parts.find((p) => p.type === "minute").value;
      return { h, m };
    } catch (e) {
      const d = new Date(); return { h: d.getUTCHours(), m: d.getUTCMinutes() };
    }
  }

  let clockTimer = 0;
  function update(t, dt, playerS, px, pz) {
    for (const f of animated) f(t, dt);
    updateMovers(t, dt, playerS);
    updateBridge(dt);
    clockTimer -= dt;
    if (clockTimer <= 0) {
      clockTimer = 20;
      const now = londonTime();
      drawClock(now.h, now.m);
    }
  }

  return {
    init, update, updateChunks, posAt, tanAt, sideAt, nearestS, onBridge, makeChibi, animateChibi, makeLabel,
    nearestWalker, sayBubble, openBridge, londonTime, landmarks, samples,
    get L() { return L; }, get bridgeState() { return bridge ? bridge.state : "idle"; }
  };
})();
