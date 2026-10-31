// 파리 탐방: 3D 세상 만들기 (땅, 센강과 시테섬, 길과 다리, 명소 9곳, 오스만 양식 집, 자동차·유람선, 사람)
// 명소 건물은 상자·원기둥·원뿔을 쌓아서 만들었어요. 건물마다 build_이름 함수가 하나씩 있어요.
// 도구 함수(box, cyl, fbox, makeChibi 등)는 런던 탐방(london/js/world.js)과 같아요.

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

  function frenchFlagTex() {
    return canvasTex(90, 60, (g) => {
      g.fillStyle = "#0055a4"; g.fillRect(0, 0, 30, 60);
      g.fillStyle = "#ffffff"; g.fillRect(30, 0, 30, 60);
      g.fillStyle = "#ef4135"; g.fillRect(60, 0, 30, 60);
    });
  }

  function flag(parent, x, y, z, size = 4) {
    cyl(parent, 0.12, 0.12, size * 2, "#ddd", x, y, z, 6);
    const f = new T.Mesh(new T.PlaneGeometry(size, size / 2), new T.MeshLambertMaterial({ map: frenchFlagTex(), side: T.DoubleSide }));
    f.geometry.translate(size / 2, 0, 0);
    f.position.set(x, y + size * 2 - size / 4, z);
    parent.add(f);
    animated.push((t) => { f.rotation.y = Math.sin(t * 2 + x) * 0.25; });
    return f;
  }

  // 오르세 미술관 시계: 파리 시각을 그려요
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
  // 파리의 다리는 땅과 높이가 같아서 캐릭터를 따로 올릴 필요가 없어요
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

  // 길이 센강을 건너는 곳마다 돌다리를 놓아요 (인도와 찻길이 모두 올라가게 넓게)
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

  // ---------- 파리 거리 소품 ----------
  // 지하철 입구 (초록 철제 아치와 노란 간판)
  function metro() {
    const g = new T.Group();
    box(g, 2.8, 0.05, 1.6, "#2a2a2a", 0, 0, 0);
    for (const [w, d, x, z] of [[3, 0.08, 0, -0.85], [0.08, 1.7, -1.45, 0], [0.08, 1.7, 1.45, 0]]) box(g, w, 0.9, d, "#2f6a4f", x, 0, z);
    for (const x of [-1.45, 1.45]) {
      cyl(g, 0.07, 0.09, 3.1, "#2f6a4f", x, 0, 0.8, 6);
      ball(g, 0.22, "#ef6a2a", x, 3.2, 0.8);
    }
    box(g, 2.9, 0.12, 0.12, "#2f6a4f", 0, 2.9, 0.8);
    box(g, 2.0, 0.5, 0.1, "#f2d36b", 0, 2.25, 0.8);
    return g;
  }
  // 초록색 신문 가판대
  function kiosk() {
    const g = new T.Group();
    cyl(g, 1.1, 1.1, 2.4, "#2f5a45", 0, 0, 0, 8);
    box(g, 1.6, 1.0, 2.24, "#f4e9cf", 0, 0.9, 0.2).material = mat("#f4e9cf");
    ball(g, 1.25, "#2f5a45", 0, 2.4, 0).scale.set(1.25, 0.5, 1.25);
    cone(g, 0.2, 0.6, "#2f5a45", 0, 2.9, 0, 8);
    return g;
  }
  // 공연 포스터를 붙이는 둥근 기둥 (모리스 기둥)
  const posterMat = new T.MeshLambertMaterial({ map: canvasTex(64, 32, (c) => {
    const cols = ["#e94f37", "#f6c90e", "#3a86ff", "#ffffff", "#8ac926", "#ff6fb5"];
    for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.fillRect(i * 11, 0, 11, 32); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(i * 11 + 2, 6, 7, 3); }
  }) });
  function morris() {
    const g = new T.Group();
    cyl(g, 0.75, 0.8, 0.6, "#2f5a45", 0, 0, 0, 12);
    const p = cyl(g, 0.7, 0.7, 2, "#ffffff", 0, 0.6, 0, 12); p.material = posterMat;
    cyl(g, 0.78, 0.78, 0.2, "#2f5a45", 0, 2.6, 0, 12);
    dome(g, 0.7, "#2f5a45", 0, 2.8, 0);
    cone(g, 0.12, 0.4, "#2f5a45", 0, 3.4, 0, 6);
    return g;
  }
  // 카페 테이블과 빨간 파라솔
  function cafe() {
    const g = new T.Group();
    cyl(g, 0.05, 0.05, 0.75, "#333", 0, 0, 0, 6);
    cyl(g, 0.5, 0.5, 0.05, "#e9e4da", 0, 0.75, 0, 12);
    for (const x of [-0.8, 0.8]) { box(g, 0.5, 0.08, 0.5, "#8a5a35", x, 0.45, 0); box(g, 0.5, 0.6, 0.06, "#8a5a35", x, 0.45, x > 0 ? 0.25 : -0.25); }
    cyl(g, 0.04, 0.04, 2.3, "#333", 0, 0.8, 0, 6);
    cone(g, 1.5, 0.6, "#c8102e", 0, 2.7, 0, 8);
    return g;
  }
  function lamp() {
    const g = new T.Group();
    cyl(g, 0.08, 0.13, 4, "#1f2224", 0, 0, 0, 6);
    box(g, 0.45, 0.6, 0.45, "#fff3c4", 0, 4, 0);
    cone(g, 0.42, 0.4, "#1f2224", 0, 4.6, 0, 4);
    return g;
  }
  function tree(scale = 1) {
    const g = new T.Group();
    cyl(g, 0.22 * scale, 0.3 * scale, 2.4 * scale, "#8a7a62", 0, 0, 0, 6);
    ball(g, 1.6 * scale, "#6a9c4c", 0, 3.4 * scale, 0).scale.set(1.6 * scale, 1.3 * scale, 1.6 * scale);
    ball(g, 1.1 * scale, "#79ad58", 0.5 * scale, 4.3 * scale, 0.2 * scale);
    return g;
  }
  function bench() {
    const g = new T.Group();
    box(g, 2.2, 0.12, 0.6, "#2f5a45", 0, 0.5, 0);
    box(g, 2.2, 0.5, 0.1, "#2f5a45", 0, 0.62, -0.28);
    box(g, 0.1, 0.5, 0.5, "#222", -0.95, 0, 0);
    box(g, 0.1, 0.5, 0.5, "#222", 0.95, 0, 0);
    return g;
  }
  function car(color) {
    const g = new T.Group();
    box(g, 1.8, 0.8, 4, color, 0, 0.35, 0);
    box(g, 1.6, 0.7, 2.2, color, 0, 1.15, -0.2);
    box(g, 1.64, 0.5, 2.0, "#3d4a58", 0, 1.25, -0.2);
    for (const [x, z] of [[0.9, 1.3], [-0.9, 1.3], [0.9, -1.3], [-0.9, -1.3]]) {
      const w = cyl(g, 0.36, 0.36, 0.3, "#111", x, 0, z, 10);
      w.rotation.z = Math.PI / 2; w.position.y = 0.36;
    }
    return g;
  }
  function bus() {
    const g = new T.Group();
    box(g, 2.5, 2.8, 11, "#f1f3f2", 0, 0.4, 0);
    box(g, 2.54, 0.6, 11.04, "#3a8f5c", 0, 0.4, 0);
    box(g, 2.56, 1.0, 10.2, "#2b3440", 0, 1.7, 0);
    box(g, 2.2, 1.0, 0.06, "#2b3440", 0, 1.7, 5.5);
    for (const [x, z] of [[1.15, 3.6], [-1.15, 3.6], [1.15, -3.6], [-1.15, -3.6]]) {
      const w = cyl(g, 0.5, 0.5, 0.35, "#111", x, 0, z, 12);
      w.rotation.z = Math.PI / 2; w.position.y = 0.5;
    }
    return g;
  }
  // 센강 유람선 (바토 무슈)
  function boat() {
    const g = new T.Group();
    box(g, 4.4, 1.3, 22, "#f5f5f2", 0, -1.4, 0);
    cone(g, 3.1, 3.2, "#f5f5f2", 0, -1.4, 12.4, 4).scale.set(2.2, 1.3, 3.1);
    box(g, 3.6, 1.6, 16, "#bfe0ee", 0, -0.1, -1);
    box(g, 3.7, 0.2, 16.4, "#2f4f6a", 0, 1.5, -1);
    return g;
  }

  // 오스만 양식 아파트: 크림색 돌벽, 검은 철제 발코니, 비스듬한 회색 지붕과 지붕창
  const WALLS = [["#efe6d2", "#3c4652"], ["#e9dfc8", "#3c4652"], ["#f3ecdc", "#46505c"], ["#e4d8bf", "#3a434e"], ["#ece2cc", "#414b57"]];
  const SHOPS = ["#2f5a45", "#7a1d2b", "#1f3a5c", "#c8102e", "#6b4a32"];
  function haussmann(w, h, d) {
    const g = new T.Group();
    const [wall, win] = WALLS[Math.floor(Math.random() * WALLS.length)];
    fbox(g, w, h, d, wall, win, 0, 0, 0, { roof: "#7b838c", tile: 3.2 });
    for (const y of [6.3, h - 3.1]) {
      box(g, w, 0.12, 0.8, "#2a2a2e", 0, y, d / 2 + 0.4);
      box(g, w, 0.7, 0.06, "#2a2a2e", 0, y + 0.12, d / 2 + 0.8);
    }
    box(g, w + 0.2, 3, 0.3, SHOPS[Math.floor(Math.random() * SHOPS.length)], 0, 0, d / 2 + 0.1);
    if (Math.random() < 0.5) {
      const a = box(g, w * 0.8, 0.15, 1.4, Math.random() < 0.5 ? "#c8102e" : "#2f5a45", 0, 3.2, d / 2 + 0.7);
      a.rotation.x = 0.3;
    }
    frustum(g, w, 4, d, 0.72, "#7b838c", 0, h, 0);
    for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 3.2) box(g, 0.9, 1.1, 0.6, "#e9e4da", x, h + 0.8, d / 2 - 0.9);
    for (const x of [-w / 3, w / 3]) box(g, 0.9, 1.6, 0.9, "#c9a08a", x, h + 3.2, 0);
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
          const w = 11 + Math.random() * 5, d = 10 + Math.random() * 4;
          const h = 14 + Math.random() * 4 + row * 2;
          const off = side * ((side > 0 ? 16 : 11) + d / 2 + row * 16);
          const q = sideAt(s, off);
          const r = Math.max(w, d) * 0.55;
          if (!ok(q.x, q.z, r)) continue;
          placed.push({ x: q.x, z: q.z, r });
          // 집 앞(+z)이 길을 바라보게 돌려요
          place(haussmann(w, h, d), q.x, q.z, Math.atan2(-side * t.z, side * t.x));
        }
      }
    }
    // 인도의 가로등, 나무, 지하철 입구, 가판대, 포스터 기둥, 카페, 벤치
    let n = 0;
    for (let s = 10; s < L - 4; s += 16) {
      n++;
      const t = tanAt(s);
      const q = sideAt(s, -4.2);
      if (inWater(q.x, q.z, 3) || exclusions.some((e) => e.tight && Math.hypot(e.x - q.x, e.z - q.z) < e.tight)) continue;
      const rot = headingRot(t.x, t.z);
      if (n % 9 === 4) place(metro(), q.x, q.z, rot + Math.PI / 2);
      else if (n % 11 === 6) place(kiosk(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 7 === 2) place(morris(), q.x, q.z, 0);
      else if (n % 6 === 1) place(cafe(), sideAt(s, -6.2).x, sideAt(s, -6.2).z, rot);
      else if (n % 5 === 0) place(bench(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 2 === 0) place(lamp(), q.x, q.z, 0);
      else place(tree(0.9 + Math.random() * 0.4), sideAt(s, -6.5).x, sideAt(s, -6.5).z, 0);
    }
    // 샹젤리제 거리: 찻길 건너편에도 가로수를 줄지어 심어요
    const c0 = nearestS(100, -190), c1 = nearestS(430, -62);
    for (let s = c0; s < c1; s += 12) {
      const q = sideAt(s, 14);
      place(tree(1.1), q.x, q.z, 0);
      const r = sideAt(s + 6, -6.5);
      place(tree(1.1), r.x, r.z, 0);
    }
  }

  // ---------- 땅, 하늘, 센강, 시테섬 ----------
  function buildGround(scene) {
    const ground = mat("#b3b893");
    const north = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 900), ground);
    north.rotation.x = -Math.PI / 2;
    north.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zNorth - 450);
    scene.add(north);
    const south = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, 400), ground);
    south.rotation.x = -Math.PI / 2;
    south.position.set((RIVER.x0 + RIVER.x1) / 2, 0, RIVER.zSouth + 200);
    scene.add(south);
    const water = new T.Mesh(new T.PlaneGeometry(RIVER.x1 - RIVER.x0 + 400, RIVER.zSouth - RIVER.zNorth + 4),
      new T.MeshLambertMaterial({ color: "#5f8f8a" }));
    water.rotation.x = -Math.PI / 2;
    water.position.set((RIVER.x0 + RIVER.x1) / 2, -2.4, (RIVER.zNorth + RIVER.zSouth) / 2);
    scene.add(water);
    // 강둑 (돌로 쌓은 벽)
    for (const z of [RIVER.zNorth, RIVER.zSouth]) {
      box(scene, RIVER.x1 - RIVER.x0 + 400, 2.6, 1.6, "#cdbf9f", (RIVER.x0 + RIVER.x1) / 2, -2.5, z);
      box(scene, RIVER.x1 - RIVER.x0 + 400, 0.7, 0.6, "#a99c80", (RIVER.x0 + RIVER.x1) / 2, 0, z + (z === RIVER.zNorth ? -0.6 : 0.6));
    }
    // 시테섬
    const I = ISLAND, iw = I.x1 - I.x0, id = I.z1 - I.z0;
    box(scene, iw + 1.6, 2.6, id + 1.6, "#cdbf9f", (I.x0 + I.x1) / 2, -2.6, (I.z0 + I.z1) / 2);
    const top = new T.Mesh(new T.PlaneGeometry(iw, id), ground);
    top.rotation.x = -Math.PI / 2;
    top.position.set((I.x0 + I.x1) / 2, 0.01, (I.z0 + I.z1) / 2);
    scene.add(top);
    for (let i = 0; i < 10; i++) {
      const x = I.x0 + 4 + Math.random() * (iw - 8), z = I.z0 + 3 + Math.random() * (id - 6);
      if (distToPath(x, z) > 7 && exclusions.every((e) => Math.hypot(e.x - x, e.z - z) > e.r * 0.75)) place(tree(0.9), x, z, 0);
    }
    // 잔디 공원 (튈르리 정원, 뤽상부르 근처, 몽마르트르 아래)
    for (const [x, z, r] of [[560, -10, 30], [300, 160, 30], [900, -140, 26], [180, 20, 26], [-80, 30, 26]]) {
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
  const GOLD = "#e2b33c";

  // 에펠탑: 철골 무늬를 비치는 그림으로 붙였어요. 밤에는 반짝이 전구가 켜져요.
  let eiffelMat = null, sparks = null, sparkleOn = false;
  function latticeTex(arch) {
    const t = canvasTex(128, 128, (c) => {
      c.strokeStyle = "#ffffff"; c.lineWidth = 7; c.strokeRect(3, 3, 122, 122);
      c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 128); c.moveTo(128, 0); c.lineTo(0, 128); c.moveTo(0, 64); c.lineTo(128, 64); c.stroke();
      if (arch) {
        c.globalCompositeOperation = "destination-out";
        c.beginPath(); c.ellipse(64, 128, 44, 86, 0, Math.PI, 0); c.fill();
        c.globalCompositeOperation = "source-over";
        c.lineWidth = 6; c.beginPath(); c.ellipse(64, 128, 46, 88, 0, Math.PI, 0); c.stroke();
      }
    });
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function build_eiffel(g) {
    const BRONZE = "#7b6248";
    const mk = (half0, half1, y0, h, rx, ry, arch) => {
      const tex = latticeTex(arch);
      tex.repeat.set(rx, ry);
      const m = new T.MeshLambertMaterial({ map: tex, color: BRONZE, transparent: true, alphaTest: 0.35, side: T.DoubleSide });
      if (!eiffelMat) eiffelMat = [];
      eiffelMat.push(m);
      const geo = new T.CylinderGeometry(half1 * Math.SQRT2, half0 * Math.SQRT2, h, 4, 1, true).rotateY(Math.PI / 4);
      const mesh = new T.Mesh(geo, m);
      mesh.position.y = y0 + h / 2;
      g.add(mesh);
      return { half0, half1, y0, h };
    };
    const secs = [mk(22, 10, 0, 30, 4, 1, true), mk(9.5, 5, 32.4, 30, 8, 5, false), mk(4.6, 1.5, 63.6, 42, 8, 9, false)];
    box(g, 25, 2.4, 25, "#6a523c", 0, 30, 0);
    box(g, 26, 1.0, 26, "#5a4532", 0, 32.2, 0);
    box(g, 12, 1.6, 12, "#6a523c", 0, 62, 0);
    box(g, 4, 3.6, 4, "#6a523c", 0, 105.6, 0);
    cyl(g, 0.3, 0.4, 12, "#8a8f94", 0, 109.2, 0, 6);
    ball(g, 0.5, "#ff3b30", 0, 121.4, 0);
    for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19]]) box(g, 7, 2, 7, "#c4b89c", x, 0, z);
    // 샹드마르스 잔디밭 (탑 뒤쪽)
    const lawn = new T.Mesh(new T.PlaneGeometry(50, 150), mat("#8db866"));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.03, -110);
    g.add(lawn);
    for (let z = -40; z > -180; z -= 14) for (const x of [-32, 32]) {
      const t = tree(1.1); t.position.set(x, 0, z); g.add(t);
    }
    // 반짝이 전구
    const glow = canvasTex(32, 32, (c) => {
      const r = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,250,220,.9)"); r.addColorStop(1, "rgba(255,240,200,0)");
      c.fillStyle = r; c.fillRect(0, 0, 32, 32);
    });
    const sm = new T.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    sparks = new T.Group();
    sparks.visible = false;
    for (let i = 0; i < 260; i++) {
      const sec = secs[Math.min(2, Math.floor(Math.random() * 3.3))];
      const v = Math.random();
      const half = sec.half0 + (sec.half1 - sec.half0) * v;
      const face = Math.floor(Math.random() * 4), u = Math.random() * 2 - 1;
      const sp = new T.Sprite(sm);
      const fx = face === 0 ? half : face === 1 ? -half : u * half, fz = face === 2 ? half : face === 3 ? -half : u * half;
      sp.position.set(fx, sec.y0 + sec.h * v, fz);
      sp.scale.setScalar(2.2);
      sparks.add(sp);
    }
    g.add(sparks);
  }
  // 반짝이 쇼 켜고 끄기 (밤 장면에서 써요)
  function sparkle(on) {
    sparkleOn = on;
    if (sparks) sparks.visible = on;
    if (eiffelMat) eiffelMat.forEach((m) => m.emissive.set(on ? "#b06a18" : "#000000"));
  }

  function build_arc(g) {
    const S = "#e3d8c0", S2 = "#efe6d2";
    const plaza = new T.Mesh(new T.CircleGeometry(36, 40), mat("#5d6168"));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; g.add(plaza);
    const inner = new T.Mesh(new T.CircleGeometry(20, 40), mat("#d6ccb6"));
    inner.rotation.x = -Math.PI / 2; inner.position.y = 0.06; g.add(inner);
    for (const x of [-9, 9]) {
      box(g, 8, 30, 13, S, x, 0, 0);
      box(g, 5, 8, 0.5, S2, x, 6, 6.7);
      box(g, 5, 8, 0.5, S2, x, 6, -6.7);
    }
    box(g, 10, 10, 13, S, 0, 20, 0);
    // 문 윗부분의 둥근 아치 (양쪽 모서리를 채워요)
    const sp = new T.Shape();
    sp.moveTo(-5, 15); sp.lineTo(-5, 20); sp.lineTo(5, 20); sp.lineTo(5, 15); sp.absarc(0, 15, 5, 0, Math.PI, false);
    const eg = new T.ExtrudeGeometry(sp, { depth: 13, bevelEnabled: false });
    eg.translate(0, 0, -6.5);
    g.add(new T.Mesh(eg, mat(S)));
    box(g, 27, 1.2, 14, S2, 0, 30, 0);
    box(g, 26, 5, 13, S, 0, 31.2, 0);
    box(g, 27, 0.8, 14, S2, 0, 36.2, 0);
    // 꺼지지 않는 불꽃
    box(g, 2, 0.3, 3, "#8a8070", 0, 0, 0);
    const fl = cone(g, 0.35, 1.2, "#ff9a2e", 0, 0.3, 0, 8);
    animated.push((t) => { fl.scale.y = 1.1 + Math.sin(t * 12) * 0.25; });
  }

  function build_concorde(g) {
    const plaza = new T.Mesh(new T.CircleGeometry(30, 40), mat("#d8cfba"));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.05; g.add(plaza);
    box(g, 5, 4.5, 5, "#9a8f80", 0, 0, 0);
    frustum(g, 2.4, 21, 2.4, 0.62, "#c9a07a", 0, 4.5, 0);
    cone(g, 0.75 * Math.SQRT2, 1.8, GOLD, 0, 25.5, 0, 4);
    for (const x of [-16, 16]) {
      cyl(g, 6.2, 6.4, 1.1, "#9b9384", x, 0, 0, 24);
      cyl(g, 5.8, 5.8, 1.15, "#7fb5cf", x, 0, 0, 24);
      cyl(g, 0.8, 1.1, 3, "#5f6b5a", x, 1, 0, 10);
      cyl(g, 2.8, 0.7, 0.8, "#5f6b5a", x, 4, 0, 14);
      cyl(g, 0.4, 0.5, 1.6, "#5f6b5a", x, 4.8, 0, 8);
      cyl(g, 1.4, 0.4, 0.5, "#5f6b5a", x, 6.4, 0, 12);
      const spray = cyl(g, 0.15, 0.6, 2, "#e5f4fb", x, 6.9, 0, 8);
      animated.push((t) => { spray.scale.y = 1.8 + Math.sin(t * 6 + x) * 0.3; });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      cyl(g, 0.35, 0.45, 6, "#3a4a3f", Math.cos(a) * 24, 0, Math.sin(a) * 24, 8);
      ball(g, 0.5, GOLD, Math.cos(a) * 24, 6.4, Math.sin(a) * 24);
    }
  }

  // 알렉상드르 3세 다리: 다리 바닥은 길에서 이미 놓았고, 기둥과 황금 조각, 가로등을 더해요
  function build_alexandre(g) {
    const S = "#d9cfb8";
    const horse = (x, z) => {
      const h = new T.Group();
      ball(h, 1, GOLD, 0, 1.4, 0).scale.set(0.8, 0.8, 1.5);
      box(h, 0.5, 1.4, 0.6, GOLD, 0, 1.4, 1.2).rotation.x = -0.5;
      ball(h, 0.45, GOLD, 0, 2.7, 1.7);
      for (const sx of [-1, 1]) { const w = box(h, 0.1, 1.6, 2.4, GOLD, sx * 0.7, 1.8, -0.2); w.rotation.z = sx * 0.6; }
      for (const [lx, lz] of [[-0.4, 0.8], [0.4, 0.8], [-0.4, -0.8], [0.4, -0.8]]) box(h, 0.25, 1.2, 0.25, GOLD, lx, 0, lz);
      ball(h, 0.45, GOLD, 0, 2.4, -0.2);
      h.position.set(x, 18, z);
      h.rotation.y = z > 0 ? Math.PI : 0;
      g.add(h);
    };
    for (const x of [-8, 16]) for (const z of [-34, 34]) {
      box(g, 4.6, 2, 4.6, "#c4b89c", x, 0, z);
      box(g, 3.2, 16, 3.2, S, x, 2, z);
      box(g, 3.8, 0.6, 3.8, GOLD, x, 17.4, z);
      horse(x, z);
    }
    for (let z = -26; z <= 26; z += 8.6) for (const x of [-5.6, 13.4]) {
      cyl(g, 0.1, 0.16, 3.2, "#1f2224", x, 0, z, 6);
      for (const dx of [-0.4, 0, 0.4]) ball(g, 0.2, "#fff3c4", x + dx, 3.4 + (dx ? 0 : 0.3), z);
    }
    for (const x of [-5.6, 13.4]) box(g, 0.3, 0.5, 60, GOLD, x, -0.9, 0);
  }

  function build_orsay(g) {
    const S = "#ddd2bc";
    fbox(g, 96, 18, 28, S, "#465564", 0, 0, -14, { style: "arch", tile: 4, roof: "#8f9aa3" });
    const roof = new T.Mesh(new T.CylinderGeometry(12, 12, 66, 24, 1, true, 0, Math.PI), new T.MeshLambertMaterial({ color: "#a9c6d6", side: T.DoubleSide }));
    roof.rotation.z = Math.PI / 2; roof.rotation.y = 0; roof.position.set(0, 18, -14);
    g.add(roof);
    for (const x of [-44, 44]) {
      fbox(g, 14, 24, 30, S, "#465564", x, 0, -14, { style: "arch", tile: 3.5, roof: "#7b838c" });
      frustum(g, 14, 5, 30, 0.6, "#7b838c", x, 24, -14);
      flag(g, x, 29, -14, 3);
      const face = new T.Mesh(new T.CircleGeometry(4.2, 32), new T.MeshLambertMaterial({ map: clockTex }));
      face.position.set(x, 17, 1.06); g.add(face);
      const rim = new T.Mesh(new T.TorusGeometry(4.3, 0.35, 8, 32), mat(GOLD));
      rim.position.set(x, 17, 1.1); g.add(rim);
    }
    const sign = new T.Mesh(new T.PlaneGeometry(30, 1.8), new T.MeshLambertMaterial({
      map: canvasTex(512, 30, (c) => { c.fillStyle = S; c.fillRect(0, 0, 512, 30); c.fillStyle = "#5a5040"; c.font = "bold 23px Georgia, serif"; c.textAlign = "center"; c.fillText("MUSÉE  D'ORSAY", 256, 23); })
    }));
    sign.position.set(0, 15.5, 0.05);
    g.add(sign);
  }

  function build_louvre(g) {
    const S = "#e3d7bf", R = "#7b838c";
    const court = new T.Mesh(new T.PlaneGeometry(100, 50), mat("#d9cfb8"));
    court.rotation.x = -Math.PI / 2; court.position.set(0, 0.04, 0); g.add(court);
    fbox(g, 120, 16, 14, S, "#465564", 0, 0, -24, { tile: 3.6, roof: R });
    frustum(g, 120, 5, 14, 0.6, R, 0, 16, -24);
    fbox(g, 22, 22, 16, S, "#465564", 0, 0, -24, { tile: 3.6, roof: R });
    frustum(g, 22, 7, 16, 0.4, R, 0, 22, -24);
    flag(g, 0, 29, -24, 4);
    for (const x of [-53, 53]) {
      fbox(g, 14, 16, 44, S, "#465564", x, 0, -2, { tile: 3.6, roof: R });
      frustum(g, 14, 5, 44, 0.6, R, x, 16, -2);
    }
    // 유리 피라미드
    const glass = new T.MeshLambertMaterial({ color: "#a7d3ea", transparent: true, opacity: 0.6, side: T.DoubleSide });
    const pyr = cone(g, 9 * Math.SQRT2, 12, "#a7d3ea", 0, 0, 22, 4);
    pyr.material = glass;
    const edges = new T.LineSegments(new T.EdgesGeometry(new T.ConeGeometry(1, 1, 4)), new T.LineBasicMaterial({ color: "#45525c" }));
    edges.scale.copy(pyr.scale); edges.position.copy(pyr.position); edges.rotation.copy(pyr.rotation);
    g.add(edges);
    for (const [x, z] of [[-14, 22], [14, 22], [0, 36]]) cone(g, 2 * Math.SQRT2, 2.6, "#a7d3ea", x, 0, z, 4).material = glass;
    for (const [x, z] of [[-22, 10], [22, 10]]) box(g, 14, 0.4, 8, "#7fb5cf", x, 0, z);
  }

  function build_notredame(g) {
    const S = "#d3c8ad", LEAD = "#5d6770", DARK = "#4a4038";
    fbox(g, 14, 20, 54, S, "#3f4d6b", 0, 0, -30, { style: "arch", tile: 5, roof: LEAD });
    gable(g, 14, 8, 54, LEAD, 0, 20, -30);
    fbox(g, 38, 18, 10, S, "#3f4d6b", 0, 0, -36, { style: "arch", tile: 5, roof: LEAD });
    const tg = gable(g, 10, 7, 38, LEAD, 0, 18, -36); tg.rotation.y = Math.PI / 2;
    cyl(g, 7, 7, 20, S, 0, 0, -57, 16);
    dome(g, 7, LEAD, 0, 20, -57).scale.y = 4;
    // 뾰족탑(2024년에 다시 세웠어요)
    cone(g, 1.6, 24, LEAD, 0, 26, -36, 8);
    ball(g, 0.5, GOLD, 0, 50.4, -36);
    // 날개 모양 버팀벽
    for (let z = -12; z >= -52; z -= 8) for (const sx of [-1, 1]) {
      box(g, 1.2, 10, 1.4, S, sx * 13, 0, z);
      const f = box(g, 1, 9, 1, S, sx * 10, 8, z); f.rotation.z = sx * 0.75;
    }
    // 앞모습: 네모난 두 탑과 장미창, 문 세 개
    for (const x of [-11, 11]) {
      fbox(g, 9, 34, 9, S, "#3f4d6b", x, 0, 0, { style: "slit", tile: 3, roof: S });
      for (const dx of [-2, 2]) flat(g, archShape(1.6, 8), DARK, x + dx, 23, 4.56);
      box(g, 9.6, 1.2, 9.6, "#c4b89c", x, 34, 0);
      for (const [dx, dz] of [[-4.6, 4.6], [4.6, 4.6]]) ball(g, 0.5, DARK, x + dx, 34.6, dz);
    }
    box(g, 13, 26, 8, S, 0, 0, 0.5);
    box(g, 32, 1.6, 9.4, "#c4b89c", 0, 10, 0.6);
    const rose = new T.Mesh(new T.CircleGeometry(4.4, 32), new T.MeshLambertMaterial({ map: canvasTex(128, 128, (c) => {
      c.fillStyle = "#2a3a6a"; c.fillRect(0, 0, 128, 128);
      const cols = ["#c8102e", "#f2c230", "#3a86ff", "#7a2a8a", "#2f8f5b"];
      for (let i = 0; i < 16; i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(64, 64); c.arc(64, 64, 60, (i / 16) * Math.PI * 2, ((i + 0.6) / 16) * Math.PI * 2); c.fill(); }
      c.strokeStyle = S; c.lineWidth = 5; c.beginPath(); c.arc(64, 64, 22, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(64, 64, 60, 0, Math.PI * 2); c.stroke();
    }) }));
    rose.position.set(0, 17, 4.56);
    g.add(rose);
    for (const x of [-11, 0, 11]) flat(g, archShape(x ? 4 : 5, x ? 7 : 8), DARK, x, 0.02, x ? 4.56 : 4.56);
    box(g, 13, 1, 8.6, "#c4b89c", 0, 26, 0.5);
  }

  function build_pompidou(g) {
    const plaza = new T.Mesh(new T.PlaneGeometry(56, 24), mat("#cdbfa6"));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.04, 12); g.add(plaza);
    fbox(g, 50, 26, 26, "#e8ecef", "#8fb0c8", 0, 0, -13, { tile: 3, roof: "#cfd6db" });
    for (let x = -24; x <= 24; x += 6) cyl(g, 0.35, 0.35, 26, "#f6f7f8", x, 0, 0.8, 8);
    for (let y = 6.5; y < 26; y += 6.5) box(g, 50, 0.4, 0.4, "#f6f7f8", 0, y, 1);
    const cols = ["#2f6fd8", "#2f9e5b", "#f2c230", "#d8342f"];
    for (let i = 0; i < 12; i++) cyl(g, 0.9, 0.9, 26, cols[i % 4], -22.5 + i * 4.1, 0, 2.6, 12);
    // 빨간 유리관 에스컬레이터
    const tube = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 48, 12, 1, true), new T.MeshLambertMaterial({ color: "#f1d6d4", transparent: true, opacity: 0.7, side: T.DoubleSide }));
    tube.rotation.z = Math.PI / 2 - Math.atan2(22, 44); tube.position.set(0, 13, 5); g.add(tube);
    const rail = box(g, 48, 0.4, 0.4, "#d8342f", 0, 0, 5); rail.position.y = 11.7; rail.rotation.z = Math.atan2(22, 44);
    // 광장의 하얀 환기통
    for (const [x, z, c] of [[-18, 16, "#f6f7f8"], [16, 18, "#2f6fd8"]]) {
      cyl(g, 0.8, 0.8, 4, c, x, 0, z, 10);
      ball(g, 1.1, c, x, 4.4, z).scale.set(1.1, 1, 1.4);
    }
  }

  // 사크레쾨르 대성당: 몽마르트르 언덕(초록 둔덕) 위에 하얀 돔 성당과 긴 계단
  function build_sacrecoeur(g) {
    const W = "#f4f2ea", W2 = "#e9e6dc";
    ball(g, 1, "#8fb36a", 0, 0, -4).scale.set(84, 26, 76);
    for (let i = 0; i < 26; i++) {
      const z = 76 - i * 1.95, y = (i + 1) * 0.92;
      box(g, 14, y, 2, i % 2 ? W2 : W, 0, 0, z);
    }
    box(g, 44, 2, 44, W2, 0, 23, -2);
    fbox(g, 26, 16, 34, W, "#9aa3ab", 0, 25, -6, { style: "arch", tile: 4, roof: W2 });
    box(g, 22, 11, 5, W, 0, 25, 13);
    for (const x of [-6.5, 0, 6.5]) flat(g, archShape(4, 8, true), "#6a6460", x, 25.02, 15.55);
    const domeOn = (x, z, r, y0, k) => {
      cyl(g, r, r, r * 0.9, W, x, y0, z, 20);
      dome(g, r, W, x, y0 + r * 0.9, z).scale.y = r * k;
      cyl(g, r * 0.18, r * 0.18, r * 0.5, W, x, y0 + r * 0.9 + r * k, z, 10);
      dome(g, r * 0.2, W, x, y0 + r * 0.9 + r * k + r * 0.5, z);
      return y0 + r * 0.9 + r * k + r * 0.7;
    };
    const top = domeOn(0, -6, 7.5, 41, 1.5);
    box(g, 0.25, 2, 0.25, GOLD, 0, top, -6);
    box(g, 1.1, 0.25, 0.25, GOLD, 0, top + 1.3, -6);
    for (const [x, z] of [[-10, 6], [10, 6], [-10, -16], [10, -16]]) domeOn(x, z, 2.8, 41, 1.4);
    box(g, 7, 30, 7, W, 0, 25, -26);
    domeOn(0, -26, 3.3, 55, 1.5);
  }

  const landmarks = [];
  function buildLandmarks(scene) {
    const builders = { eiffel: build_eiffel, arc: build_arc, concorde: build_concorde, alexandre: build_alexandre, orsay: build_orsay, louvre: build_louvre, notredame: build_notredame, pompidou: build_pompidou, sacrecoeur: build_sacrecoeur };
    const heights = { eiffel: 126, arc: 41, concorde: 30, alexandre: 24, orsay: 32, louvre: 32, notredame: 54, pompidou: 32, sacrecoeur: 80 };
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
    const r = { eiffel: 60, arc: 42, concorde: 36, alexandre: 20, orsay: 56, louvre: 70, notredame: 40, pompidou: 42, sacrecoeur: 96 };
    for (const st of STOPS) exclusions.push({ x: st.at[0], z: st.at[1], r: r[st.build], tight: r[st.build] * 0.6 });
    exclusions.push({ x: 0, z: 290, r: 70 });       // 샹드마르스 잔디밭
    exclusions.push({ x: 470, z: 70, r: 40, tight: 40 }); // 알렉상드르 3세 다리 양쪽 끝
  }

  // ---------- 움직이는 것들: 자동차, 버스, 유람선, 걷는 사람 ----------
  const movers = [];
  const walkers = [];
  let busEnd;
  const BRIDGE_X = [55, 470, 650, 785, 843];
  function buildTraffic(scene) {
    busEnd = nearestS(984, -200);
    const make = [["bus"], ["car", "#c8102e"], ["car", "#f2f2f2"], ["bus"], ["car", "#1f3a5c"], ["car", "#f2c230"], ["car", "#3a3a3a"]];
    make.forEach(([kind, color], i) => {
      const o = kind === "bus" ? bus() : car(color);
      scene.add(o);
      movers.push({ o, k: i / make.length, speed: kind === "bus" ? 6 : 9 });
    });
    for (let i = 0; i < 4; i++) {
      const b = boat();
      scene.add(b);
      animated.push((t) => {
        const dir = i % 2 ? 1 : -1;
        const span = RIVER.x1 - RIVER.x0;
        let x = ((t * 6 + i * 420) % span);
        x = dir > 0 ? RIVER.x0 + x : RIVER.x1 - x;
        b.position.set(x, 0, dir > 0 ? 88 : 54);
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
    chunkRoot = new T.Group();
    scene.add(chunkRoot);
    buildPath();
    initExclusions();
    buildGround(scene);
    const city = new T.Group();
    scene.add(city);
    ribbon(city, -3.2, 3.2, "#ddd3bd", 0.05);
    ribbon(city, 3.2, 4.6, "#b3ab9c", 0.07);
    ribbon(city, 4.6, 12.2, "#5d6168", 0.06, 0, busEnd || nearestS(984, -200));
    for (let s = 0; s < nearestS(984, -200); s += 8) ribbon(city, 8.3, 8.5, "#f1f1f1", 0.08, s, s + 4, 4);
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
    if (sparkleOn && sparks) for (const sp of sparks.children) sp.visible = Math.random() < 0.3;
    clockTimer -= dt;
    if (clockTimer <= 0) {
      clockTimer = 20;
      const now = cityTime();
      drawClock(now.h, now.m);
    }
  }

  return {
    init, update, updateChunks, posAt, tanAt, sideAt, nearestS, onBridge, makeChibi, animateChibi, makeLabel,
    nearestWalker, sayBubble, sparkle, cityTime, landmarks, samples,
    get L() { return L; }
  };
})();
