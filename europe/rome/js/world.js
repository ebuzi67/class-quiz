// 로마 탐방: 3D 세상 만들기 (땅, 테베레강, 길과 다리, 명소 9곳, 로마의 집, 작은 자동차·스쿠터, 사람)
// 명소 건물은 상자·원기둥·원뿔을 쌓아서 만들었어요. 건물마다 build_이름 함수가 하나씩 있어요.
// 도구 함수(box, cyl, fbox, makeChibi 등)는 런던·파리 탐방과 같아요.

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
      else if (style === "shutter") { g.fillStyle = "#2c3036"; g.fillRect(24, 12, 16, 36); g.fillStyle = win; g.fillRect(14, 12, 9, 36); g.fillRect(41, 12, 9, 36); }
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

  function italianFlagTex() {
    return canvasTex(90, 60, (g) => {
      g.fillStyle = "#009246"; g.fillRect(0, 0, 30, 60);
      g.fillStyle = "#ffffff"; g.fillRect(30, 0, 30, 60);
      g.fillStyle = "#ce2b37"; g.fillRect(60, 0, 30, 60);
    });
  }

  function flag(parent, x, y, z, size = 4) {
    cyl(parent, 0.12, 0.12, size * 2, "#ddd", x, y, z, 6);
    const f = new T.Mesh(new T.PlaneGeometry(size, size / 2), new T.MeshLambertMaterial({ map: italianFlagTex(), side: T.DoubleSide }));
    f.geometry.translate(size / 2, 0, 0);
    f.position.set(x, y + size * 2 - size / 4, z);
    parent.add(f);
    animated.push((t) => { f.rotation.y = Math.sin(t * 2 + x) * 0.25; });
    return f;
  }

  // 시계 그림 (로마 탐방에서는 쓰지 않지만 런던·파리와 같은 틀이라 남겨 뒀어요)
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
    // fixed: 멀든 가깝든 화면에서 같은 크기 (말풍선용)
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: opt.depthTest !== false, transparent: true, sizeAttenuation: !opt.fixed }));
    const scale = opt.fixed ? opt.fixed : opt.scale || 10;
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
  // 로마의 다리는 땅과 높이가 같아서 캐릭터를 따로 올릴 필요가 없어요
  function onBridge() { return false; }
  function onIsland(x, z) { return x > ISLAND.x0 && x < ISLAND.x1 && z > ISLAND.z0 && z < ISLAND.z1; }
  // 물 위인지 (강 띠 안이면서 시테섬이 아닌 곳)
  function inWater(x, z, margin = 0) {
    return z > RIVER.zNorth - margin && z < RIVER.zSouth + margin && !onIsland(x, z);
  }
  // 집을 짓지 않는 강가 (섬도 포함)
  function nearRiver(z, margin = 0) {
    return z > RIVER.zNorth - margin && z < RIVER.zSouth + margin;
  }

  // 길(인도)과 찻길을 띠 모양으로 깔아요. 물 위는 다리(deck)를 따로 놓아요.
  function ribbon(parent, offA, offB, color, y, sFrom = 0, sTo = L, step = 2) {
    const pos = [];
    const idx = [];
    let prev = null;
    for (let s = sFrom; s <= sTo + 0.001; s += step) {
      const a = sideAt(s, offA), b = sideAt(s, offB);
      const ok = !inWater(a.x, a.z) && !inWater(b.x, b.z);
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

  // 길이 강을 건너는 곳마다 돌다리를 놓아요 (인도와 찻길이 모두 올라가게 넓게)
  function buildDecks(parent) {
    for (let s = 0; s <= L; s += 2) {
      const p = posAt(s);
      if (!inWater(p.x, p.z, 2)) continue;
      const t = tanAt(s), rot = Math.atan2(t.x, t.z);
      const c = sideAt(s, 4);
      const slab = box(parent, 19, 1.6, 2.3, "#cbbfa6", 0, -1.55, 0);
      slab.position.x = c.x; slab.position.z = c.z; slab.rotation.y = rot + Math.PI / 2;
      const top = box(parent, 6.6, 0.06, 2.3, "#d9cfba", 0, 0.02, 0);
      top.position.x = p.x; top.position.z = p.z; top.rotation.y = rot + Math.PI / 2;
      const road = box(parent, 7.8, 0.06, 2.3, "#5d6168", 0, 0.03, 0);
      const r = sideAt(s, 8.4);
      road.position.x = r.x; road.position.z = r.z; road.rotation.y = rot + Math.PI / 2;
      for (const off of [-5.6, 13.4]) {
        const q = sideAt(s, off);
        const rail = box(parent, 0.5, 1.0, 2.3, "#b9ad94", 0, 0, 0);
        rail.position.x = q.x; rail.position.z = q.z; rail.rotation.y = rot + Math.PI / 2;
      }
    }
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
      lm.group.visible = Math.hypot(lm.x - px, lm.z - pz) < 520;
      if (lm.label) lm.label.visible = Math.hypot(lm.x - px, lm.z - pz) < 230;
    }
  }

  function headingRot(hx, hz) { return Math.atan2(hx, hz); }

  // 아래가 넓고 위가 좁은 네모 기둥(지붕, 오벨리스크). 바닥 한 변 1, 윗변 top
  function frustum(parent, w, h, d, top, color, x, y, z) {
    const g = cachedGeo("fr" + top, () => new T.CylinderGeometry(top * Math.SQRT1_2, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4));
    const m = new T.Mesh(g, typeof color === "string" ? mat(color) : color);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }

  // 뾰족한 아치(문, 창) 모양
  function archShape(w, h, round) {
    const s = new T.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0);
    if (round) { s.lineTo(w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); }
    else { s.lineTo(w / 2, h - w * 0.6); s.quadraticCurveTo(w / 2, h - w * 0.1, 0, h); s.quadraticCurveTo(-w / 2, h - w * 0.1, -w / 2, h - w * 0.6); }
    s.lineTo(-w / 2, 0);
    return new T.ShapeGeometry(s);
  }
  function flat(parent, geo, color, x, y, z, rotY = 0) {
    const m = new T.Mesh(geo, typeof color === "string" ? mat(color) : color);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    parent.add(m);
    return m;
  }

  // ---------- 로마 거리 소품 ----------
  // 길가의 작은 식수대 '나소네' (큰 코라는 뜻)
  function nasone() {
    const g = new T.Group();
    cyl(g, 0.3, 0.38, 1.2, "#4a4f52", 0, 0, 0, 10);
    ball(g, 0.3, "#4a4f52", 0, 1.2, 0).scale.set(0.3, 0.15, 0.3);
    box(g, 0.08, 0.08, 0.35, "#6a7074", 0, 0.75, 0.38);
    cyl(g, 0.03, 0.03, 0.72, "#9fd3e6", 0, 0.03, 0.55, 6);
    return g;
  }
  // 젤라또 수레
  function gelato() {
    const g = new T.Group();
    box(g, 1.8, 1.0, 0.9, "#f7e3c4", 0, 0.3, 0);
    box(g, 1.7, 0.3, 0.8, "#ffffff", 0, 1.3, 0);
    for (const [x, c] of [[-0.55, "#f7b2c4"], [-0.18, "#c9e8a8"], [0.18, "#fff2a6"], [0.55, "#c7a27c"]]) ball(g, 0.16, c, x, 1.6, 0);
    for (const x of [-0.7, 0.7]) { const w = cyl(g, 0.3, 0.3, 0.12, "#333", x, 0, 0.5, 10); w.rotation.x = Math.PI / 2; w.position.y = 0.3; }
    cyl(g, 0.04, 0.04, 1.6, "#888", 0, 1.5, 0, 6);
    cone(g, 1.2, 0.5, "#e6a04a", 0, 3.1, 0, 8);
    return g;
  }
  // 우산 소나무 (로마의 키 크고 납작한 소나무)
  function pine(scale = 1) {
    const g = new T.Group();
    const t = cyl(g, 0.25 * scale, 0.35 * scale, 7 * scale, "#7a5c44", 0, 0, 0, 6);
    t.rotation.z = 0.08;
    ball(g, 3.2 * scale, "#5a7f3e", 0.4 * scale, 7.6 * scale, 0).scale.set(3.4 * scale, 1.1 * scale, 3.2 * scale);
    return g;
  }
  // 측백나무 (가늘고 뾰족한 나무)
  function cypress(scale = 1) {
    const g = new T.Group();
    cyl(g, 0.15, 0.2, 0.8 * scale, "#6b4a32", 0, 0, 0, 6);
    cone(g, 0.9 * scale, 6 * scale, "#3e6a3a", 0, 0.6 * scale, 0, 8);
    return g;
  }
  function cafe() {
    const g = new T.Group();
    cyl(g, 0.05, 0.05, 0.75, "#333", 0, 0, 0, 6);
    cyl(g, 0.5, 0.5, 0.05, "#f0ebe0", 0, 0.75, 0, 12);
    for (const x of [-0.8, 0.8]) { box(g, 0.5, 0.08, 0.5, "#8a5a35", x, 0.45, 0); box(g, 0.5, 0.6, 0.06, "#8a5a35", x, 0.45, x > 0 ? 0.25 : -0.25); }
    cyl(g, 0.04, 0.04, 2.3, "#333", 0, 0.8, 0, 6);
    cone(g, 1.5, 0.6, "#f2efe6", 0, 2.7, 0, 8);
    return g;
  }
  function lamp() {
    const g = new T.Group();
    cyl(g, 0.08, 0.13, 4, "#2a2622", 0, 0, 0, 6);
    box(g, 0.45, 0.6, 0.45, "#fff3c4", 0, 4, 0);
    cone(g, 0.42, 0.4, "#2a2622", 0, 4.6, 0, 4);
    return g;
  }
  function tree(scale = 1) { return pine(scale * 0.8); }
  function bench() {
    const g = new T.Group();
    box(g, 2.2, 0.5, 0.6, "#d8cdb5", 0, 0, 0);
    box(g, 0.4, 0.5, 0.6, "#c9bea6", -0.9, 0, 0);
    box(g, 0.4, 0.5, 0.6, "#c9bea6", 0.9, 0, 0);
    return g;
  }
  // 작은 자동차(로마에는 작은 차가 많아요)와 스쿠터
  function car(color) {
    const g = new T.Group();
    box(g, 1.6, 0.8, 3.2, color, 0, 0.35, 0);
    ball(g, 1, color, 0, 1.15, -0.1).scale.set(0.78, 0.55, 1.1);
    box(g, 1.5, 0.35, 1.6, "#3d4a58", 0, 1.15, -0.1);
    for (const [x, z] of [[0.8, 1.0], [-0.8, 1.0], [0.8, -1.0], [-0.8, -1.0]]) {
      const w = cyl(g, 0.32, 0.32, 0.25, "#111", x, 0, z, 10);
      w.rotation.z = Math.PI / 2; w.position.y = 0.32;
    }
    return g;
  }
  function scooter(color) {
    const g = new T.Group();
    box(g, 0.5, 0.5, 1.4, color, 0, 0.35, 0);
    box(g, 0.45, 0.25, 0.7, "#2a2a2a", 0, 0.85, -0.2);
    cyl(g, 0.04, 0.04, 0.9, "#666", 0, 0.5, 0.6, 6);
    box(g, 0.7, 0.06, 0.06, "#333", 0, 1.4, 0.6);
    for (const z of [-0.6, 0.6]) { const w = cyl(g, 0.28, 0.28, 0.15, "#111", 0, 0, z, 10); w.rotation.z = Math.PI / 2; w.position.y = 0.28; }
    const rider = makeChibi({ shirt: color === "#c8102e" ? "#2f4f6a" : "#7a1d2b", pants: "#33456b", hat: "cap", hatColor: "#f2f2f2" });
    rider.group.position.set(0, 0.55, -0.15);
    rider.group.scale.setScalar(0.85);
    rider.legL.rotation.x = rider.legR.rotation.x = -1.2;
    rider.armL.rotation.x = rider.armR.rotation.x = -1.2;
    g.add(rider.group);
    return g;
  }
  function bus() {
    const g = new T.Group();
    box(g, 2.5, 2.8, 11, "#ececec", 0, 0.4, 0);
    box(g, 2.54, 0.6, 11.04, "#b5302c", 0, 0.4, 0);
    box(g, 2.56, 1.0, 10.2, "#2b3440", 0, 1.7, 0);
    box(g, 2.2, 1.0, 0.06, "#2b3440", 0, 1.7, 5.5);
    for (const [x, z] of [[1.15, 3.6], [-1.15, 3.6], [1.15, -3.6], [-1.15, -3.6]]) {
      const w = cyl(g, 0.5, 0.5, 0.35, "#111", x, 0, z, 12);
      w.rotation.z = Math.PI / 2; w.position.y = 0.5;
    }
    return g;
  }
  // 테베레강의 작은 유람선
  function boat() {
    const g = new T.Group();
    box(g, 3.6, 1.2, 14, "#f5f5f2", 0, -1.4, 0);
    cone(g, 2.5, 2.6, "#f5f5f2", 0, -1.4, 8.3, 4).scale.set(1.8, 1.2, 2.5);
    box(g, 3, 1.4, 8, "#9fc7d9", 0, -0.2, -1.5);
    box(g, 3.1, 0.2, 8.3, "#7a1d2b", 0, 1.2, -1.5);
    return g;
  }

  // 로마의 집: 주황·황토·분홍 벽, 초록 덧창, 낮은 기와지붕
  const WALLS = [["#e2a65e", "#3e5a3a"], ["#d98e58", "#3e5a3a"], ["#e8c27a", "#4a5a3a"], ["#cf7e5c", "#3a4a35"], ["#efd7a8", "#3e5a3a"], ["#e3b49a", "#3a4a35"]];
  const SHOPS = ["#3e5a3a", "#7a1d2b", "#2f4f6a", "#b5302c", "#6b4a32"];
  function romanHouse(w, h, d) {
    const g = new T.Group();
    const [wall, win] = WALLS[Math.floor(Math.random() * WALLS.length)];
    fbox(g, w, h, d, wall, win, 0, 0, 0, { roof: "#b5543a", tile: 3.2, style: "shutter" });
    box(g, w + 0.6, 0.5, d + 0.6, "#efe6d2", 0, h, 0);
    frustum(g, w + 0.4, 2.2, d + 0.4, 0.25, "#b5543a", 0, h + 0.5, 0);
    box(g, w + 0.2, 3, 0.3, SHOPS[Math.floor(Math.random() * SHOPS.length)], 0, 0, d / 2 + 0.1);
    if (Math.random() < 0.5) {
      const a = box(g, w * 0.8, 0.15, 1.4, Math.random() < 0.5 ? "#b5302c" : "#3e5a3a", 0, 3.2, d / 2 + 0.7);
      a.rotation.x = 0.3;
    }
    if (Math.random() < 0.4) for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 3.2) box(g, 1.4, 0.3, 0.5, "#cf6a4a", x, 6.6, d / 2 + 0.3);
    return g;
  }

  function scatterCity() {
    const placed = [];
    const ok = (x, z, r) => {
      if (nearRiver(z, r + 6)) return false;
      for (const e of exclusions) if (Math.hypot(e.x - x, e.z - z) < e.r + r) return false;
      if (distToPath(x, z) < r + 7) return false;
      for (const p of placed) if (Math.hypot(p.x - x, p.z - z) < p.r + r + 0.5) return false;
      return true;
    };
    for (let s = 6; s < L; s += 7) {
      const t = tanAt(s);
      for (const side of [1, -1]) {
        for (const row of [0, 1]) {
          const w = 10 + Math.random() * 6, d = 10 + Math.random() * 4;
          const h = 11 + Math.random() * 6 + row * 3;
          const off = side * ((side > 0 ? 16 : 11) + d / 2 + row * 16);
          const q = sideAt(s, off);
          const r = Math.max(w, d) * 0.55;
          if (!ok(q.x, q.z, r)) continue;
          placed.push({ x: q.x, z: q.z, r });
          // 집 앞(+z)이 길을 바라보게 돌려요
          place(romanHouse(w, h, d), q.x, q.z, Math.atan2(-side * t.z, side * t.x));
        }
      }
    }
    // 인도의 가로등, 나무, 식수대, 젤라또 수레, 카페, 벤치
    let n = 0;
    for (let s = 10; s < L - 4; s += 16) {
      n++;
      const t = tanAt(s);
      const q = sideAt(s, -4.2);
      if (inWater(q.x, q.z, 3) || exclusions.some((e) => e.tight && Math.hypot(e.x - q.x, e.z - q.z) < e.tight)) continue;
      const rot = headingRot(t.x, t.z);
      if (n % 9 === 4) place(nasone(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 11 === 6) place(gelato(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 6 === 1) place(cafe(), sideAt(s, -6.2).x, sideAt(s, -6.2).z, rot);
      else if (n % 5 === 0) place(bench(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 2 === 0) place(lamp(), q.x, q.z, 0);
      else if (n % 3 === 0) place(cypress(1), sideAt(s, -6.5).x, sideAt(s, -6.5).z, 0);
      else place(pine(0.8 + Math.random() * 0.3), sideAt(s, -7).x, sideAt(s, -7).z, 0);
    }
    // 화해의 길(비아 델라 콘칠리아치오네): 성 베드로 대성당까지 가로등이 줄지어 서 있어요
    const c0 = nearestS(790, 138), c1 = nearestS(965, 140);
    for (let s = c0; s < c1; s += 10) {
      const q = sideAt(s, 14);
      place(lamp(), q.x, q.z, 0);
    }
  }

  // ---------- 땅, 하늘, 테베레강 ----------
  function buildGround(scene) {
    const ground = mat("#c4bb90");
    const north = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 900), ground);
    north.rotation.x = -Math.PI / 2;
    north.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zNorth - 450);
    scene.add(north);
    const south = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 400), ground);
    south.rotation.x = -Math.PI / 2;
    south.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zSouth + 200);
    scene.add(south);
    const water = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, RIVER.zSouth - RIVER.zNorth + 4),
      new T.MeshLambertMaterial({ color: "#6f8f6a" }));
    water.rotation.x = -Math.PI / 2;
    water.position.set((RIVER.x0 + RIVER.x1) / 2, -2.4, (RIVER.zNorth + RIVER.zSouth) / 2);
    scene.add(water);
    // 강둑 (돌로 쌓은 벽)
    for (const z of [RIVER.zNorth, RIVER.zSouth]) {
      box(scene, RIVER.x1 - RIVER.x0 + 400, 2.6, 1.6, "#cdbf9f", (RIVER.x0 + RIVER.x1) / 2, -2.5, z);
      box(scene, RIVER.x1 - RIVER.x0 + 400, 0.7, 0.6, "#a99c80", (RIVER.x0 + RIVER.x1) / 2, 0, z + (z === RIVER.zNorth ? -0.6 : 0.6));
    }
    // 강 가운데 섬 (ISLAND 크기가 0이면 만들지 않아요)
    const I = ISLAND, iw = I.x1 - I.x0, id = I.z1 - I.z0;
    if (iw > 0 && id > 0) {
      box(scene, iw + 1.6, 2.6, id + 1.6, "#cdbf9f", (I.x0 + I.x1) / 2, -2.6, (I.z0 + I.z1) / 2);
      const top = new T.Mesh(new T.PlaneGeometry(iw, id), ground);
      top.rotation.x = -Math.PI / 2;
      top.position.set((I.x0 + I.x1) / 2, 0.01, (I.z0 + I.z1) / 2);
      scene.add(top);
    }
    // 소나무 공원 (콜로세움 옆 언덕, 보르게세 공원 쪽, 강가)
    for (const [x, z, r] of [[-60, -110, 32], [60, 30, 26], [420, -290, 34], [600, 20, 26], [860, 220, 30], [250, 30, 24]]) {
      const p = new T.Mesh(new T.CircleGeometry(r, 24), mat("#8db866"));
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.04, z);
      scene.add(p);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, rr = r * (0.3 + Math.random() * 0.6);
        const tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr;
        if (distToPath(tx, tz) > 8 && !nearRiver(tz, 3)) place(tree(1 + Math.random() * 0.5), tx, tz, 0);
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
      c.position.set(-300 + Math.random() * 1700, 140 + Math.random() * 40, -550 + Math.random() * 800);
      scene.add(c);
      const sp = 1 + Math.random() * 2;
      animated.push((t, dt) => { c.position.x += dt * sp; if (c.position.x > 1500) c.position.x = -350; });
    }
  }

  // ---------- 명소 9곳 ----------
  const GOLD = "#e2b33c", TRAV = "#e6dcc5", MARBLE = "#f4f1ea", BRONZE = "#6f8a7a";

  // 아치가 줄지어 있는 벽 그림 (콜로세움). see: 아치 안이 비쳐 보여요
  function arcadeTex(see, rows) {
    const t = canvasTex(64, 64 * rows, (c) => {
      c.fillStyle = "#d8c7a4"; c.fillRect(0, 0, 64, 64 * rows);
      for (let r = 0; r < rows; r++) {
        const y0 = r * 64;
        c.fillStyle = "#c4b089"; c.fillRect(0, y0, 64, 6); c.fillRect(0, y0, 6, 64); c.fillRect(58, y0, 6, 64);
        if (see) { c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000"; }
        else c.fillStyle = "#5a4c3c";
        c.beginPath(); c.moveTo(14, y0 + 64); c.lineTo(14, y0 + 30); c.arc(32, y0 + 30, 18, Math.PI, 0); c.lineTo(50, y0 + 64); c.fill();
        c.globalCompositeOperation = "source-over";
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function ringWall(parent, rx, rz, y0, h, mat0, thetaStart = 0, thetaLength = Math.PI * 2) {
    const m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 64, 1, true, thetaStart, thetaLength), mat0);
    m.scale.set(rx, h, rz);
    m.position.y = y0 + h / 2;
    parent.add(m);
    return m;
  }

  function build_colosseum(g) {
    const outerTex = arcadeTex(true, 3); outerTex.repeat.set(40, 1);
    const outer = new T.MeshLambertMaterial({ map: outerTex, transparent: true, alphaTest: 0.4, side: T.DoubleSide });
    const innerTex = arcadeTex(false, 3); innerTex.repeat.set(36, 1);
    const inner = new T.MeshLambertMaterial({ map: innerTex, side: T.DoubleSide });
    const atticTex = facadeMat("#d8c7a4", "#5a4c3c", "slit").map.clone(); atticTex.repeat.set(40, 1); atticTex.needsUpdate = true;
    const attic = new T.MeshLambertMaterial({ map: atticTex, side: T.DoubleSide });
    // 바깥벽: 한쪽은 무너져서 낮아요
    ringWall(g, 30, 24, 0, 24, outer, Math.PI * 0.15, Math.PI * 1.25);
    ringWall(g, 30, 24, 24, 8, attic, Math.PI * 0.15, Math.PI * 1.25);
    const lowTex = arcadeTex(true, 2); lowTex.repeat.set(14, 1);
    ringWall(g, 30, 24, 0, 16, new T.MeshLambertMaterial({ map: lowTex, transparent: true, alphaTest: 0.4, side: T.DoubleSide }), Math.PI * 1.4, Math.PI * 0.75);
    // 안쪽 벽과 관중석
    ringWall(g, 26.5, 20.5, 0, 22, inner);
    const seats = new T.Mesh(new T.CylinderGeometry(1, 0.62, 1, 64, 1, true), new T.MeshLambertMaterial({ color: "#c9b48e", side: T.DoubleSide }));
    seats.scale.set(26.5, 20, 20.5); seats.position.y = 12; g.add(seats);
    // 경기장 바닥과 지하 통로
    const arena = new T.Mesh(new T.CircleGeometry(1, 48), mat("#d9c08a"));
    arena.rotation.x = -Math.PI / 2; arena.scale.set(16.4, 12.7, 1); arena.position.y = 2.05; g.add(arena);
    const floor = new T.Mesh(new T.CircleGeometry(1, 48), mat("#a07a52"));
    floor.rotation.x = -Math.PI / 2; floor.scale.set(16.4, 12.7, 1); floor.position.set(0, 2.1, 0);
    floor.geometry = new T.CircleGeometry(1, 48, 0, Math.PI); g.add(floor);
    for (let x = -12; x <= 12; x += 3) box(g, 0.6, 2, 18, "#8a7258", x, 0, 0).scale.z = Math.max(4, 22 * Math.sqrt(Math.max(0, 1 - (x / 16.4) ** 2)));
  }

  function build_forum(g) {
    const dirt = new T.Mesh(new T.PlaneGeometry(80, 56), mat("#cdbb94"));
    dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.03; g.add(dirt);
    // 사투르누스 신전: 기둥 8개와 지붕 조각
    box(g, 20, 3, 10, "#bdae90", -18, 0, -10);
    for (let i = 0; i < 6; i++) cyl(g, 0.8, 0.9, 13, TRAV, -24 + i * 2.4, 3, -6, 12);
    for (const z of [-8.4, -10.8]) cyl(g, 0.8, 0.9, 13, TRAV, -24, 3, z, 12);
    box(g, 14.6, 2.2, 6.6, "#e0d4ba", -18, 16, -8.4);
    // 카스토르와 폴룩스 신전: 기둥 3개
    box(g, 9, 6, 6, "#bdae90", 14, 0, -16);
    for (let i = 0; i < 3; i++) cyl(g, 0.9, 1.0, 16, TRAV, 11 + i * 3, 6, -15, 12);
    box(g, 9.4, 2.4, 2.6, "#e0d4ba", 14, 22, -15);
    // 셉티미우스 세베루스 개선문
    box(g, 22, 18, 7, "#e3d7bd", 4, 0, -24);
    for (const [x, w, h] of [[-3, 3.4, 8], [4, 5, 12], [11, 3.4, 8]]) {
      flat(g, archShape(w, h, true), "#5a4c3c", x, 0.02, -20.45);
    }
    // 포카스 기둥과 부러진 기둥, 무너진 담
    cyl(g, 0.8, 0.9, 16, TRAV, -2, 1.5, 8, 12); box(g, 3, 1.5, 3, "#bdae90", -2, 0, 8);
    for (const [x, z, h] of [[-26, 12, 3], [-20, 16, 5], [-12, 14, 2], [20, 10, 4], [26, 4, 2.5], [8, 16, 3], [-30, 0, 2]]) cyl(g, 0.8, 0.9, h, TRAV, x, 0, z, 10);
    for (const [x, z, w, d] of [[-30, -22, 12, 1.4], [26, -6, 1.4, 14], [28, 16, 10, 1.4], [-8, -2, 8, 1.2]]) box(g, w, 2.2, d, "#b8a683", x, 0, z);
    for (const [x, z] of [[32, -22], [-34, 18], [30, 22]]) { const c = cypress(1.4); c.position.set(x, 0, z); g.add(c); }
    const p = pine(1.2); p.position.set(-34, 0, -24); g.add(p);
  }

  function build_vittoriano(g) {
    for (let i = 0; i < 6; i++) box(g, 66 - i * 2, 1.2, 30 - i * 1.5, MARBLE, 0, i * 1.2, 4 - i * 0.75);
    box(g, 60, 10, 20, MARBLE, 0, 7.2, -6);
    box(g, 62, 1.2, 21, "#e6e1d6", 0, 17.2, -6);
    for (let i = 0; i < 16; i++) cyl(g, 0.7, 0.8, 11, MARBLE, -22.5 + i * 3, 18.4, 2, 12);
    box(g, 50, 2.2, 6, "#e6e1d6", 0, 29.4, 1);
    box(g, 50, 12, 10, "#ece8dd", 0, 18.4, -8);
    // 양쪽 끝 탑과 청동 전차(콰드리가)
    const quadriga = (x) => {
      const q = new T.Group();
      for (let i = 0; i < 4; i++) {
        const hx = -1.8 + i * 1.2;
        ball(q, 0.6, BRONZE, hx, 1.6, 1.4).scale.set(0.45, 0.6, 1.1);
        ball(q, 0.32, BRONZE, hx, 2.4, 2.4);
        for (const lz of [0.8, 2]) box(q, 0.2, 1.2, 0.2, BRONZE, hx, 0, lz);
      }
      box(q, 2.4, 1.4, 1.6, BRONZE, 0, 0.6, -0.6);
      const f = makeChibi({ shirt: BRONZE, pants: BRONZE, skin: BRONZE }); f.group.position.set(0, 1.4, -0.6); f.group.scale.setScalar(1.3); f.armR.rotation.x = -2.6;
      f.group.traverse((o) => { if (o.isMesh) o.material = mat(BRONZE); });
      q.add(f.group);
      for (const sx of [-1, 1]) { const w = box(q, 0.1, 1.6, 1.4, BRONZE, sx * 0.6, 4, -0.8); w.rotation.z = sx * 0.5; }
      q.position.set(x, 31.6, 0);
      g.add(q);
    };
    for (const x of [-27, 27]) { box(g, 10, 18, 12, MARBLE, x, 13.6, -2); quadriga(x); }
    // 말을 탄 왕의 청동상
    box(g, 6, 6, 4, MARBLE, 0, 7.2, 8);
    ball(g, 1, BRONZE, 0, 15, 8).scale.set(1, 1.2, 2.2);
    ball(g, 0.7, BRONZE, 0, 16.6, 10.4);
    for (const [x, z] of [[-0.6, 6.8], [0.6, 6.8], [-0.6, 9.2], [0.6, 9.2]]) box(g, 0.4, 2.6, 0.4, BRONZE, x, 13.2, z);
    const king = makeChibi({ shirt: BRONZE, pants: BRONZE, skin: BRONZE }); king.group.position.set(0, 15.6, 8); king.group.scale.setScalar(1.3);
    king.group.traverse((o) => { if (o.isMesh) o.material = mat(BRONZE); });
    g.add(king.group);
    flag(g, -20, 30, -8, 3); flag(g, 20, 30, -8, 3);
    // 무명용사의 무덤을 지키는 군인
    for (const x of [-4, 4]) {
      const s = makeChibi({ shirt: "#2c3e5a", pants: "#2c3e5a", hat: "cap", hatColor: "#2c3e5a", belt: "#ffffff" });
      s.group.position.set(x, 7.2, 11); g.add(s.group);
    }
  }

  function build_spanish(g) {
    box(g, 70, 12, 34, "#d7b48a", 0, 0, -20);
    for (let i = 0; i < 20; i++) {
      const z = 24 - i * 1.5, y = (i + 1) * 0.6;
      box(g, 22 - (i > 10 ? (i - 10) * 0.5 : 0), y, 1.6, i % 4 === 3 ? "#e9e1cf" : TRAV, 0, 0, z);
    }
    for (let i = 2; i < 20; i += 3) for (const x of [-10.5, 10.5]) box(g, 1.2, 0.6, 1.2, "#e86a9a", x * (1 - Math.max(0, i - 10) * 0.02), (i + 1) * 0.6, 24 - i * 1.5);
    // 바르카차 분수 (낡은 배 모양)
    cyl(g, 4.6, 4.6, 0.6, "#c9bea6", 0, 0, 30, 20).scale.set(1, 0.6, 1);
    cyl(g, 4.2, 4.2, 0.55, "#7fc4d6", 0, 0.02, 30, 20);
    box(g, 4, 1.4, 1.8, "#d8cdb5", 0, 0.3, 30);
    for (const sx of [-1, 1]) cone(g, 0.9, 1.6, "#d8cdb5", sx * 2.6, 0.3, 30, 4).rotation.z = sx * -Math.PI / 2;
    // 언덕 위 트리니타 데이 몬티 성당 (쌍둥이 탑)과 오벨리스크
    box(g, 20, 14, 8, "#f0e7d6", 0, 12, -14);
    gable(g, 12, 3, 8.4, "#e6dcc6", 0, 26, -14);
    for (const x of [-7.5, 7.5]) {
      box(g, 4.6, 20, 4.6, "#f0e7d6", x, 12, -12);
      for (const yy of [26, 29]) flat(g, archShape(1.6, 2.4, true), "#4a4038", x, yy, -9.65);
      frustum(g, 4.6, 3, 4.6, 0.1, "#9aa3a6", x, 32, -12);
      ball(g, 0.3, GOLD, x, 35.2, -12);
    }
    flat(g, archShape(3, 5, true), "#4a4038", 0, 12.02, -9.95);
    box(g, 2, 2, 2, "#c9bea6", 0, 12, -4);
    frustum(g, 1.2, 10, 1.2, 0.5, "#d8c9a8", 0, 14, -4);
  }

  // 트레비 분수: 궁전 벽 앞의 바다의 신, 바위, 넓은 물웅덩이
  let treviPool = null, coinsInPool = null;
  function build_trevi(g) {
    fbox(g, 46, 24, 10, "#ebe2cf", "#5a5e62", 0, 0, -6, { tile: 3.6, roof: "#cfc6b4" });
    box(g, 48, 2.5, 11, "#e2d8c3", 0, 24, -6);
    box(g, 20, 4, 11, "#e2d8c3", 0, 26.5, -6);
    for (const x of [-9, -4.5, 4.5, 9]) cyl(g, 0.9, 1, 20, "#f3ecdc", x, 4, -0.4, 12);
    flat(g, archShape(6, 14, true), "#b9ad94", 0, 4, -0.95);
    // 바다의 신과 해마
    const god = makeChibi({ shirt: "#f6f2e8", pants: "#f6f2e8", skin: "#f6f2e8", hair: "#f6f2e8" });
    god.group.traverse((o) => { if (o.isMesh) o.material = mat("#f6f2e8"); });
    god.group.scale.setScalar(2.4); god.group.position.set(0, 5, 0.5); god.armR.rotation.x = -1.2;
    g.add(god.group);
    ball(g, 1.8, "#f0eadb", 0, 5, 1.6).scale.set(2.2, 0.8, 1.4);
    for (const sx of [-1, 1]) {
      ball(g, 1, "#f0eadb", sx * 4, 2.6, 5).scale.set(0.9, 1, 1.8);
      ball(g, 0.6, "#f0eadb", sx * 4, 4.2, 6.4);
      const tr = makeChibi({ shirt: "#f0eadb", pants: "#f0eadb", skin: "#f0eadb" });
      tr.group.traverse((o) => { if (o.isMesh) o.material = mat("#f0eadb"); });
      tr.group.scale.setScalar(1.4); tr.group.position.set(sx * 6, 2.6, 4); g.add(tr.group);
    }
    // 바위 폭포
    for (let i = 0; i < 26; i++) {
      const x = (Math.random() - 0.5) * 30, z = Math.random() * 4;
      box(g, 2 + Math.random() * 3, 1 + Math.random() * 3, 2 + Math.random() * 2, i % 3 ? "#ded6c4" : "#cfc6b0", x, 0, z).rotation.y = Math.random();
    }
    for (const x of [-3, 3]) { const w = box(g, 1.8, 3, 0.2, "#d6f0f7", x, 1, 3.6); w.material = new T.MeshLambertMaterial({ color: "#d6f0f7", transparent: true, opacity: 0.75 }); }
    // 물웅덩이 (반달 모양)
    const rim = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40, 1, false, -Math.PI / 2, Math.PI), mat("#d8cfba"));
    rim.scale.set(19, 1, 13); rim.position.set(0, 0.5, 3); g.add(rim);
    const water = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40, 1, false, -Math.PI / 2, Math.PI), mat("#59b9c9"));
    water.scale.set(18, 1, 12); water.position.set(0, 0.55, 3); g.add(water);
    treviPool = new T.Object3D(); treviPool.position.set(0, 1.1, 10); g.add(treviPool);
    coinsInPool = new T.Group(); coinsInPool.position.set(0, 1.07, 3); g.add(coinsInPool);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI, r = Math.random();
      box(coinsInPool, 0.25, 0.04, 0.25, i % 3 ? GOLD : "#b8b8b8", Math.cos(a) * 16 * r, 0, Math.sin(a) * 10 * r);
    }
  }

  function build_pantheon(g) {
    const S = "#cbbba0";
    box(g, 26, 1.6, 14, "#bfb092", 0, 0, 6);
    for (let i = 0; i < 8; i++) cyl(g, 0.9, 1.0, 12, "#d8cdb5", -10.5 + i * 3, 1.6, 11, 12);
    for (const x of [-10.5, 10.5]) for (const z of [7.5, 4]) cyl(g, 0.9, 1.0, 12, "#d8cdb5", x, 1.6, z, 12);
    box(g, 25, 2.2, 10, "#d8cdb5", 0, 13.6, 8);
    gable(g, 25, 5, 10, "#d0c4aa", 0, 15.8, 8);
    box(g, 22, 18, 8, S, 0, 0, 0);
    cyl(g, 20, 20, 20, S, 0, 0, -22, 40);
    for (const y of [20, 21.5]) cyl(g, 20.4 - (y - 20), 20.6 - (y - 20), 1.2, "#bdb09a", 0, y, -22, 40);
    dome(g, 19, "#a9a49a", 0, 21.5, -22).scale.y = 10;
    const ocu = new T.Mesh(new T.CircleGeometry(2.6, 24), mat("#2a2a2e"));
    ocu.rotation.x = -Math.PI / 2; ocu.position.set(0, 31.55, -22); g.add(ocu);
    // 앞 광장의 분수와 오벨리스크
    cyl(g, 4.4, 4.6, 1, "#d8cdb5", 0, 0, 30, 20);
    cyl(g, 4, 4, 1.05, "#7fc4d6", 0, 0.02, 30, 20);
    box(g, 2, 3, 2, "#d8cdb5", 0, 0, 30);
    frustum(g, 1.1, 8, 1.1, 0.5, "#c9a07a", 0, 3, 30);
  }

  function build_navona(g) {
    const pav = new T.Mesh(new T.PlaneGeometry(80, 30), mat("#d8cdb5"));
    pav.rotation.x = -Math.PI / 2; pav.position.set(0, 0.04, 2); g.add(pav);
    // 4대강 분수
    const basin = cyl(g, 8, 8.2, 1, "#d8cfba", 0, 0, 2, 32); basin.scale.x = 1.5;
    const w = cyl(g, 7.6, 7.6, 1.05, "#7fc4d6", 0, 0.02, 2, 32); w.scale.x = 1.5;
    for (let i = 0; i < 14; i++) box(g, 2 + Math.random() * 2, 1.5 + Math.random() * 2.5, 2 + Math.random() * 2, "#e2dccd", (Math.random() - 0.5) * 6, 0.6, 2 + (Math.random() - 0.5) * 4).rotation.y = Math.random();
    for (const [x, z] of [[-4.5, -1], [4.5, -1], [-4.5, 5], [4.5, 5]]) {
      const r = makeChibi({ shirt: "#f4f1ea", pants: "#f4f1ea", skin: "#f4f1ea", hair: "#f4f1ea" });
      r.group.traverse((o) => { if (o.isMesh) o.material = mat("#f4f1ea"); });
      r.group.scale.setScalar(1.6); r.group.position.set(x, 1.2, z); r.group.rotation.y = Math.atan2(x, z - 2); r.armR.rotation.x = -1.6;
      g.add(r.group);
    }
    box(g, 2.2, 2, 2.2, "#e2dccd", 0, 4, 2);
    frustum(g, 1.4, 14, 1.4, 0.5, "#c9a07a", 0, 6, 2);
    ball(g, 0.4, GOLD, 0, 20.4, 2);
    for (const x of [-30, 30]) {
      cyl(g, 4, 4.2, 0.9, "#d8cfba", x, 0, 2, 20); cyl(g, 3.6, 3.6, 0.95, "#7fc4d6", x, 0.02, 2, 20);
      const t = makeChibi({ shirt: "#f4f1ea", pants: "#f4f1ea", skin: "#f4f1ea" }); t.group.traverse((o) => { if (o.isMesh) o.material = mat("#f4f1ea"); });
      t.group.scale.setScalar(1.2); t.group.position.set(x, 0.9, 2); g.add(t.group);
    }
    // 산타녜세 성당 (둥근 지붕과 쌍둥이 종탑)
    box(g, 24, 14, 8, "#efe3c9", 0, 0, -18);
    for (let i = 0; i < 4; i++) cyl(g, 0.6, 0.7, 11, "#f6eedd", -4.5 + i * 3, 0, -13.6, 10);
    for (const x of [-10, 10]) { box(g, 5, 22, 5, "#efe3c9", x, 0, -17); dome(g, 2.4, "#9aa3a6", x, 22, -17); }
    cyl(g, 6, 6, 6, "#efe3c9", 0, 14, -22, 20);
    dome(g, 6, "#9aa3a6", 0, 20, -22).scale.y = 8;
    cyl(g, 1, 1, 3, "#efe3c9", 0, 28, -22, 10);
    // 거리 화가의 이젤
    for (const [x, z] of [[-18, 8], [16, -4], [22, 9]]) {
      const e = new T.Group();
      for (const sx of [-0.4, 0.4]) { const l = box(e, 0.08, 1.8, 0.08, "#8a5a35", sx, 0, 0); l.rotation.z = -sx * 0.25; }
      box(e, 1.2, 0.9, 0.06, ["#f2c230", "#3a86ff", "#e94f37"][Math.floor(Math.random() * 3)], 0, 1.1, 0.06);
      e.position.set(x, 0, z); g.add(e);
    }
  }

  // 날개 달린 하얀 천사상 (다리 위)
  function angel(parent, x, z, color = "#f4f1ea", scale = 1) {
    const a = new T.Group();
    box(a, 1.4, 2.4, 1.4, "#d8cfba", 0, 0, 0);
    const f = makeChibi({ shirt: color, pants: color, skin: color, hair: color });
    f.group.traverse((o) => { if (o.isMesh) o.material = mat(color); });
    f.group.position.y = 2.4; f.group.scale.setScalar(1.3); f.armR.rotation.x = -2;
    a.add(f.group);
    for (const sx of [-1, 1]) { const w = box(a, 0.1, 1.8, 1.2, color, sx * 0.55, 4.4, -0.6); w.rotation.z = sx * 0.5; }
    a.scale.setScalar(scale);
    a.position.set(x, 0, z);
    parent.add(a);
    return a;
  }

  function build_santangelo(g) {
    const S = "#b9a07c";
    box(g, 62, 8, 62, "#a98f6c", 0, 0, 0);
    for (const [x, z] of [[-31, -31], [31, -31], [-31, 31], [31, 31]]) cyl(g, 6, 6.4, 9, "#a98f6c", x, 0, z, 16);
    const drumTex = facadeMat(S, "#4a3f35", "slit").map.clone(); drumTex.repeat.set(24, 4); drumTex.needsUpdate = true;
    const drum = new T.Mesh(new T.CylinderGeometry(22, 23, 22, 40), [new T.MeshLambertMaterial({ map: drumTex }), mat("#a99878"), mat("#a99878")]);
    drum.position.y = 8 + 11; g.add(drum);
    fbox(g, 18, 9, 18, "#c9b08a", "#4a3f35", 0, 30, 0, { tile: 3, roof: "#a99878" });
    box(g, 6, 3, 6, "#c9b08a", 0, 39, 0);
    flag(g, -6, 39, -6, 3);
    angel(g, 0, 0, BRONZE, 1.4).position.y = 42;
    // 다리 위 천사상 10개 (양쪽에 5개씩)
    for (let z = 64; z <= 104; z += 10) for (const x of [5.6, -13.4]) angel(g, x, z);
  }

  function build_stpeter(g) {
    // 대성당
    fbox(g, 52, 26, 60, TRAV, "#5a5e62", 0, 0, -30, { tile: 4, roof: "#c9bea6" });
    box(g, 54, 3, 6, "#ece3cf", 0, 26, 2);
    for (let i = 0; i < 8; i++) cyl(g, 1.1, 1.2, 22, "#f2ead8", -17.5 + i * 5, 2, 4.6, 14);
    box(g, 44, 2, 4, TRAV, 0, 0, 5.5);
    gable(g, 16, 4, 4, "#ece3cf", 0, 29, 3);
    for (let i = 0; i < 13; i++) {
      const s = makeChibi({ shirt: MARBLE, pants: MARBLE, skin: MARBLE });
      s.group.traverse((o) => { if (o.isMesh) o.material = mat(MARBLE); });
      s.group.position.set(-24 + i * 4, 29, 3.5); g.add(s.group);
    }
    for (const x of [-6, 0, 6]) flat(g, archShape(3, 8, true), "#4a4038", x, 2.02, 5.6);
    // 미켈란젤로의 둥근 지붕
    cyl(g, 14, 14, 10, TRAV, 0, 26, -38, 36);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; cyl(g, 0.6, 0.6, 9, "#f2ead8", Math.sin(a) * 14.6, 26, -38 + Math.cos(a) * 14.6, 8); }
    cyl(g, 15, 15, 1.2, "#ece3cf", 0, 36, -38, 36);
    dome(g, 13.5, "#9aa7ab", 0, 37.2, -38).scale.y = 18;
    cyl(g, 2.4, 2.4, 5, TRAV, 0, 55, -38, 12);
    dome(g, 2.4, "#9aa7ab", 0, 60, -38);
    ball(g, 0.7, GOLD, 0, 63, -38);
    box(g, 0.25, 2.2, 0.25, GOLD, 0, 63.4, -38);
    box(g, 1.2, 0.25, 0.25, GOLD, 0, 64.6, -38);
    for (const x of [-20, 20]) { cyl(g, 4, 4, 4, TRAV, x, 26, -20, 16); dome(g, 4, "#9aa7ab", x, 30, -20).scale.y = 5; }
    // 성 베드로 광장: 가운데 오벨리스크, 분수 두 개, 두 팔처럼 둘러싼 기둥들
    const sq = new T.Mesh(new T.CircleGeometry(1, 48), mat("#d9cfb8"));
    sq.rotation.x = -Math.PI / 2; sq.scale.set(46, 40, 1); sq.position.set(0, 0.05, 72); g.add(sq);
    box(g, 3, 2.4, 3, "#c9bea6", 0, 0, 72);
    frustum(g, 1.8, 18, 1.8, 0.5, "#d2b48c", 0, 2.4, 72);
    box(g, 0.25, 2.4, 0.25, GOLD, 0, 20.4, 72);
    box(g, 1.2, 0.25, 0.25, GOLD, 0, 21.6, 72);
    for (const x of [-22, 22]) {
      cyl(g, 3.6, 3.8, 1, "#d8cfba", x, 0, 72, 20); cyl(g, 3.2, 3.2, 1.05, "#7fc4d6", x, 0.02, 72, 20);
      cyl(g, 0.5, 0.7, 3, "#d8cfba", x, 1, 72, 8); cyl(g, 1.6, 0.4, 0.6, "#d8cfba", x, 4, 72, 12);
      const sp = cyl(g, 0.15, 0.5, 2, "#e5f4fb", x, 4.6, 72, 8);
      animated.push((t) => { sp.scale.y = 1.8 + Math.sin(t * 5 + x) * 0.3; });
    }
    for (const side of [-1, 1]) {
      for (let k = 0; k < 18; k++) {
        const th = (-60 + k * (120 / 17)) * Math.PI / 180;
        for (const rr of [0, 3]) {
          const x = side * (46 + rr) * Math.cos(th), z = 72 + (40 + rr) * Math.sin(th);
          cyl(g, 0.7, 0.8, 11, "#f2ead8", x, 0, z, 10);
        }
        if (k % 2 === 0) {
          const x = side * 47.5 * Math.cos(th), z = 72 + 41.5 * Math.sin(th);
          const r = box(g, 5, 2, 7.4, "#ece3cf", x, 11, z); r.rotation.y = Math.atan2(-side * 46 * Math.sin(th), 40 * Math.cos(th));
          const s = makeChibi({ shirt: MARBLE, pants: MARBLE, skin: MARBLE });
          s.group.traverse((o) => { if (o.isMesh) o.material = mat(MARBLE); });
          s.group.position.set(x, 13, z); g.add(s.group);
        }
      }
      box(g, 4, 13, 34, "#ece3cf", side * 26, 0, 20);
    }
    // 스위스 근위대
    for (const x of [-4, 4]) {
      const s = makeChibi({ shirt: "#f2b632", pants: "#2a4fa0", hat: "beanie", hatColor: "#1b1b1b", belt: "#c8102e" });
      s.group.position.set(x, 0, 8.5); g.add(s.group);
    }
  }

  const landmarks = [];
  function buildLandmarks(scene) {
    const builders = { colosseum: build_colosseum, forum: build_forum, vittoriano: build_vittoriano, spanish: build_spanish, trevi: build_trevi, pantheon: build_pantheon, navona: build_navona, santangelo: build_santangelo, stpeter: build_stpeter };
    const heights = { colosseum: 36, forum: 26, vittoriano: 40, spanish: 38, trevi: 32, pantheon: 34, navona: 30, santangelo: 50, stpeter: 68 };
    for (const st of STOPS) {
      const g = new T.Group();
      const [ax, az] = st.at, [sx, sz] = st.stop;
      builders[st.build](g);
      g.position.set(ax, 0, az);
      g.rotation.y = sx === ax && sz === az ? 0 : Math.atan2(sx - ax, sz - az);
      scene.add(g);
      const label = makeLabel(`${st.emoji} ${st.ko}`, st.en, { scale: 18 });
      label.position.set(ax, heights[st.build] + 4, az);
      scene.add(label);
      landmarks.push({ id: st.id, group: g, label, x: ax, z: az, h: heights[st.build] });
    }
  }

  function initExclusions() {
    const r = { colosseum: 42, forum: 50, vittoriano: 44, spanish: 46, trevi: 30, pantheon: 44, navona: 46, santangelo: 50, stpeter: 70 };
    for (const st of STOPS) exclusions.push({ x: st.at[0], z: st.at[1], r: r[st.build], tight: r[st.build] * 0.6 });
    exclusions.push({ x: 1010, z: 140, r: 60, tight: 50 });  // 성 베드로 광장
    exclusions.push({ x: 760, z: 85, r: 30, tight: 30 });    // 산탄젤로 다리
  }

  // ---------- 트레비 분수 동전 던지기, 마지막 장면의 비둘기 ----------
  const effects = [];
  function tossCoin(fx, fz, onDone) {
    if (!treviPool) { onDone && onDone(); return; }
    const to = treviPool.getWorldPosition(new T.Vector3());
    const from = new T.Vector3(fx, 3.2, fz);
    const coin = cyl(sceneRef, 0.35, 0.35, 0.08, GOLD, 0, 0, 0, 16);
    coin.material = new T.MeshLambertMaterial({ color: GOLD, emissive: "#6a4a10" });
    let t = 0;
    effects.push((dt) => {
      t += dt / 1.3;
      const u = Math.min(1, t);
      coin.position.lerpVectors(from, to, u);
      coin.position.y += Math.sin(u * Math.PI) * 7;
      coin.rotation.x += dt * 14;
      if (u < 1) return true;
      sceneRef.remove(coin);
      // 퐁당! 물결이 퍼져요
      const ring = new T.Mesh(new T.TorusGeometry(0.6, 0.12, 6, 24), new T.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9 }));
      ring.rotation.x = Math.PI / 2; ring.position.copy(to); sceneRef.add(ring);
      const c = box(coinsInPool, 0.25, 0.04, 0.25, GOLD, (Math.random() - 0.5) * 8, 0, 4 + Math.random() * 4);
      let k = 0;
      effects.push((dt2) => {
        k += dt2;
        ring.scale.setScalar(1 + k * 5);
        ring.material.opacity = Math.max(0, 0.9 - k);
        if (k < 1) return true;
        sceneRef.remove(ring);
        return false;
      });
      onDone && onDone();
      return false;
    });
  }
  // 광장에서 비둘기 떼가 날아올라요
  function doves() {
    const lm = landmarks.find((l) => l.id === "stpeter");
    if (!lm) return;
    const c = lm.group.localToWorld(new T.Vector3(0, 0, 60));
    for (let i = 0; i < 36; i++) {
      const d = new T.Group();
      ball(d, 0.4, "#f8f8f6", 0, 0, 0).scale.set(0.35, 0.3, 0.6);
      const wl = box(d, 1.1, 0.06, 0.4, "#f8f8f6", -0.5, 0, 0), wr = box(d, 1.1, 0.06, 0.4, "#f8f8f6", 0.5, 0, 0);
      d.position.set(c.x + (Math.random() - 0.5) * 30, 0.5, c.z + (Math.random() - 0.5) * 30);
      const v = new T.Vector3((Math.random() - 0.5) * 6, 6 + Math.random() * 5, (Math.random() - 0.5) * 6);
      d.rotation.y = Math.atan2(v.x, v.z);
      sceneRef.add(d);
      let t = -Math.random() * 1.5;
      effects.push((dt) => {
        t += dt;
        if (t < 0) return true;
        d.position.addScaledVector(v, dt);
        const flap = Math.sin(t * 22) * 0.7;
        wl.rotation.z = flap; wr.rotation.z = -flap;
        if (t < 9) return true;
        sceneRef.remove(d);
        return false;
      });
    }
  }
  let sceneRef = null;

  // ---------- 움직이는 것들: 자동차, 버스, 유람선, 걷는 사람 ----------
  const movers = [];
  const walkers = [];
  let busEnd;
  const BRIDGE_X = [760];
  function buildTraffic(scene) {
    busEnd = nearestS(965, 140);
    const make = [["bus"], ["car", "#e9e2c8"], ["scooter", "#c8102e"], ["car", "#8fc1d9"], ["scooter", "#9fd3a8"], ["car", "#f2c230"], ["car", "#c8102e"], ["scooter", "#f2f2f2"]];
    make.forEach(([kind, color], i) => {
      const o = kind === "bus" ? bus() : kind === "scooter" ? scooter(color) : car(color);
      scene.add(o);
      movers.push({ o, k: i / make.length, speed: kind === "bus" ? 6 : 9 });
    });
    for (let i = 0; i < 2; i++) {
      const b = boat();
      scene.add(b);
      animated.push((t) => {
        const dir = i % 2 ? 1 : -1;
        const span = RIVER.x1 - RIVER.x0;
        let x = ((t * 6 + i * 420) % span);
        x = dir > 0 ? RIVER.x0 + x : RIVER.x1 - x;
        b.position.set(x, 0, dir > 0 ? 96 : 74);
        b.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        b.visible = !(x > ISLAND.x0 - 20 && x < ISLAND.x1 + 20) && BRIDGE_X.every((bx) => Math.abs(x - bx) > 18);
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
      w.c.group.position.set(q.x, 0, q.z);
      animateChibi(w.c, dt, true, w.speed / 2);
      w.c.group.position.y = w.c.bob;
      w.c.group.rotation.y = headingRot(q.hx, q.hz) + (w.dir > 0 ? 0 : Math.PI);
      if (w.bubble) {
        w.bubbleT -= dt;
        w.bubble.position.set(q.x, 4.2, q.z);
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
    w.bubble = makeLabel(text, null, { fixed: 0.3, depthTest: false, bg: "rgba(255,255,255,.95)" });
    scene.add(w.bubble);
    w.bubbleT = 3.5;
    w.c.waving = 1.6;
  }

  // ---------- 시작 ----------
  function init(scene) {
    sceneRef = scene;
    chunkRoot = new T.Group();
    scene.add(chunkRoot);
    buildPath();
    initExclusions();
    buildGround(scene);
    const city = new T.Group();
    scene.add(city);
    ribbon(city, -3.2, 3.2, "#ddd3bd", 0.05);
    ribbon(city, 3.2, 4.6, "#b3ab9c", 0.07);
    ribbon(city, 4.6, 12.2, "#5d6168", 0.06, 0, busEnd || nearestS(965, 140));
    for (let s = 0; s < nearestS(965, 140); s += 8) ribbon(city, 8.3, 8.5, "#f1f1f1", 0.08, s, s + 4, 4);
    buildDecks(city);
    buildLandmarks(scene);
    scatterCity();
    buildClouds(scene);
    buildTraffic(scene);
    const now = cityTime();
    drawClock(now.h, now.m);
    // 멈추는 곳(명소) 위치를 길 위의 거리(s)로 바꿔 둬요
    for (const st of STOPS) st.s = nearestS(st.stop[0], st.stop[1]);
  }

  function cityTime() {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: CITY.tz, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      const h = +parts.find((p) => p.type === "hour").value, m = +parts.find((p) => p.type === "minute").value;
      return { h, m };
    } catch (e) {
      const d = new Date(); return { h: d.getUTCHours(), m: d.getUTCMinutes() };
    }
  }

  let clockTimer = 0;
  function update(t, dt, playerS) {
    for (const f of animated) f(t, dt);
    updateMovers(t, dt, playerS);
    for (let i = effects.length - 1; i >= 0; i--) if (!effects[i](dt)) effects.splice(i, 1);
    clockTimer -= dt;
    if (clockTimer <= 0) {
      clockTimer = 20;
      const now = cityTime();
      drawClock(now.h, now.m);
    }
  }

  return {
    init, update, updateChunks, posAt, tanAt, sideAt, nearestS, onBridge, makeChibi, animateChibi, makeLabel,
    nearestWalker, sayBubble, tossCoin, doves, cityTime, landmarks, samples,
    get L() { return L; }
  };
})();
