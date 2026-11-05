// 유럽 탐방 공통 3D 세상 (tools/walk/shared/world.js에서 복사돼요. 고칠 때는 그 파일을 고치고 build.py를 다시 실행해요)
// 땅, 강과 다리, 길가의 집과 소품, 차와 사람, 마지막 장면 효과를 만들어요. 명소 건물은 나라마다 landmarks.js에 있어요.
// 도구 함수(box, cyl, fbox, makeChibi 등)는 런던·파리·로마 탐방과 같아요.

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
      else if (style === "azulejo") {
        // 포르투갈의 파랗고 하얀 타일 벽
        for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if ((i + j) % 2) { g.fillStyle = "rgba(31,95,168,.22)"; g.fillRect(i * 4, j * 4, 4, 4); }
        g.fillStyle = win; g.fillRect(22, 14, 20, 32); g.fillStyle = "#ffffff"; g.fillRect(20, 46, 24, 3);
      }
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

  // 나라 국기: CITY.flagSpec = { dir: "v"(세로 줄) 또는 "h"(가로 줄), colors: [...], tri: 왼쪽 세모 색(체코) }
  function flagTex() {
    const F = CITY.flagSpec || { dir: "v", colors: ["#ffffff"] };
    return canvasTex(90, 60, (g) => {
      const n = F.colors.length;
      F.colors.forEach((c, i) => { g.fillStyle = c; if (F.dir === "h") g.fillRect(0, (i * 60) / n, 90, 60 / n + 1); else g.fillRect((i * 90) / n, 0, 90 / n + 1, 60); });
      if (F.tri) { g.fillStyle = F.tri; g.beginPath(); g.moveTo(0, 0); g.lineTo(45, 30); g.lineTo(0, 60); g.fill(); }
      if (F.cross) { g.fillStyle = F.cross; g.fillRect(0, 24, 90, 12); g.fillRect(30, 0, 12, 60); }
    });
  }

  function flag(parent, x, y, z, size = 4) {
    cyl(parent, 0.12, 0.12, size * 2, "#ddd", x, y, z, 6);
    const f = new T.Mesh(new T.PlaneGeometry(size, size / 2), new T.MeshLambertMaterial({ map: flagTex(), side: T.DoubleSide }));
    f.geometry.translate(size / 2, 0, 0);
    f.position.set(x, y + size * 2 - size / 4, z);
    parent.add(f);
    animated.push((t) => { f.rotation.y = Math.sin(t * 2 + x) * 0.25; });
    return f;
  }

  // 시계 그림: 명소에 시계를 달 때 kit.clockTex를 써요 (그 나라의 지금 시각을 가리켜요)
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
  const S = Object.assign({
    ground: "#c4bb90", water: "#6f9fb0", pave: "#ddd3bd", sky: "#cfe3ee",
    walls: [["#e9dfc8", "#3c4652"]], window: "tall", roof: "pitched", roofColors: ["#b5543a"],
    trees: ["round"], parasol: "#c8102e", stall: "#2f5a45",
    cars: ["#c8102e", "#f2f2f2", "#1f3a5c", "#f2c230"], bus: ["#f1f3f2", "#3a8f5c"], tram: null
  }, CITY.style || {});

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
  function posAt(s) { return curve.getPointAt(Math.min(1, Math.max(0, s / L))); }
  function tanAt(s) { return curve.getTangentAt(Math.min(1, Math.max(0, s / L))); }
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
  // 다리는 땅과 높이가 같아서 캐릭터를 따로 올릴 필요가 없어요
  function onBridge() { return false; }
  // 강(RIVER)이 없는 나라도 있어요
  function inWater(x, z, margin = 0) {
    return !!RIVER && z > RIVER.zNorth - margin && z < RIVER.zSouth + margin;
  }
  function nearRiver(z, margin = 0) { return inWater(0, z, margin); }

  // 길(인도)과 찻길을 띠 모양으로 깔아요. 물 위는 다리(deck)를 따로 놓아요.
  function ribbon(parent, offA, offB, color, y, sFrom = 0, sTo = L, step = 2) {
    const pos = [], idx = [];
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
      const t = tanAt(s), rot = Math.atan2(t.x, t.z) + Math.PI / 2;
      const put = (m, q) => { m.position.x = q.x; m.position.z = q.z; m.rotation.y = rot; };
      put(box(parent, 19, 1.6, 2.3, "#cbbfa6", 0, -1.55, 0), sideAt(s, 4));
      put(box(parent, 6.6, 0.06, 2.3, S.pave, 0, 0.02, 0), sideAt(s, 0));
      put(box(parent, 7.8, 0.06, 2.3, "#5d6168", 0, 0.03, 0), sideAt(s, 8.4));
      for (const off of [-5.6, 13.4]) put(box(parent, 0.5, 1.0, 2.3, "#b9ad94", 0, 0, 0), sideAt(s, off));
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
    for (const c of chunks.values()) c.visible = Math.hypot(c.userData.cx - px, c.userData.cz - pz) < 320;
    for (const lm of landmarks) {
      const d = Math.hypot(lm.x - px, lm.z - pz);
      lm.group.visible = d < 520;
      if (lm.label) lm.label.visible = d < 230;
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
  // 아치(문, 창) 모양. round면 반원, 아니면 뾰족한 아치
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
  // 흰 대리석이나 청동 동상: 꼬마 캐릭터를 한 가지 색으로 칠해요
  function statue(parent, color, x, y, z, scale = 1.3, rotY = 0) {
    const f = makeChibi({ shirt: color, pants: color, skin: color, hair: color });
    f.group.traverse((o) => { if (o.isMesh) o.material = mat(color); });
    f.group.position.set(x, y, z); f.group.scale.setScalar(scale); f.group.rotation.y = rotY;
    parent.add(f.group);
    return f;
  }
  // 초록 언덕 (성이나 성당을 위에 올려요)
  function hill(parent, rx, h, rz, color, x = 0, z = 0) {
    const m = ball(parent, 1, color || "#8fb36a", x, 0, z);
    m.scale.set(rx, h, rz);
    return m;
  }
  // 둥근 지붕과 꼭대기 장식을 한 번에
  function domeTop(parent, x, z, r, y0, k, color, wall) {
    cyl(parent, r, r, r * 0.9, wall, x, y0, z, 20);
    dome(parent, r, color, x, y0 + r * 0.9, z).scale.y = r * k;
    cyl(parent, r * 0.18, r * 0.18, r * 0.5, wall, x, y0 + r * 0.9 + r * k, z, 10);
    dome(parent, r * 0.2, color, x, y0 + r * 0.9 + r * k + r * 0.5, z);
    return y0 + r * 0.9 + r * k + r * 0.7;
  }
  // 뾰족한 탑 지붕
  function spire(parent, x, z, w, y0, h, color, seg = 8) {
    return cone(parent, w, h, color, x, y0, z, seg);
  }

  // ---------- 거리 소품 (나라마다 CITY.style로 색과 종류가 달라요) ----------
  function lamp() {
    const g = new T.Group();
    cyl(g, 0.08, 0.13, 4, "#25282a", 0, 0, 0, 6);
    box(g, 0.45, 0.6, 0.45, "#fff3c4", 0, 4, 0);
    cone(g, 0.42, 0.4, "#25282a", 0, 4.6, 0, 4);
    return g;
  }
  function tree(kind, scale = 1) {
    const g = new T.Group();
    if (kind === "conifer") {
      cyl(g, 0.2, 0.28, 1.4 * scale, "#6b4a32", 0, 0, 0, 6);
      cone(g, 1.8 * scale, 3.4 * scale, "#2f5f3a", 0, 1.2 * scale, 0, 8);
      cone(g, 1.4 * scale, 2.8 * scale, "#356a40", 0, 3.2 * scale, 0, 8);
    } else if (kind === "palm") {
      const t = cyl(g, 0.22 * scale, 0.32 * scale, 6 * scale, "#8a6a4a", 0, 0, 0, 6); t.rotation.z = 0.08;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const l = box(g, 0.5 * scale, 0.1, 3.2 * scale, "#4f8f3a", Math.sin(a) * 1.3 * scale, 6 * scale, Math.cos(a) * 1.3 * scale);
        l.rotation.y = a; l.rotation.x = 0.5;
      }
    } else if (kind === "pine") {
      const t = cyl(g, 0.25 * scale, 0.35 * scale, 7 * scale, "#7a5c44", 0, 0, 0, 6); t.rotation.z = 0.08;
      ball(g, 1, "#5a7f3e", 0.4 * scale, 7.6 * scale, 0).scale.set(3.4 * scale, 1.1 * scale, 3.2 * scale);
    } else if (kind === "cypress") {
      cyl(g, 0.15, 0.2, 0.8 * scale, "#6b4a32", 0, 0, 0, 6);
      cone(g, 0.9 * scale, 6 * scale, "#3e6a3a", 0, 0.6 * scale, 0, 8);
    } else {
      cyl(g, 0.22 * scale, 0.3 * scale, 2.4 * scale, "#7a5c44", 0, 0, 0, 6);
      ball(g, 1.6 * scale, "#6a9c4c", 0, 3.4 * scale, 0).scale.set(1.6 * scale, 1.3 * scale, 1.6 * scale);
      ball(g, 1.1 * scale, "#79ad58", 0.5 * scale, 4.3 * scale, 0.2 * scale);
    }
    return g;
  }
  const pickTree = () => S.trees[Math.floor(Math.random() * S.trees.length)];
  function bench() {
    const g = new T.Group();
    box(g, 2.2, 0.12, 0.6, "#6b4a32", 0, 0.5, 0);
    box(g, 2.2, 0.5, 0.1, "#6b4a32", 0, 0.62, -0.28);
    box(g, 0.1, 0.5, 0.5, "#222", -0.95, 0, 0);
    box(g, 0.1, 0.5, 0.5, "#222", 0.95, 0, 0);
    return g;
  }
  function cafe() {
    const g = new T.Group();
    cyl(g, 0.05, 0.05, 0.75, "#333", 0, 0, 0, 6);
    cyl(g, 0.5, 0.5, 0.05, "#f0ebe0", 0, 0.75, 0, 12);
    for (const x of [-0.8, 0.8]) { box(g, 0.5, 0.08, 0.5, "#8a5a35", x, 0.45, 0); box(g, 0.5, 0.6, 0.06, "#8a5a35", x, 0.45, x > 0 ? 0.25 : -0.25); }
    cyl(g, 0.04, 0.04, 2.3, "#333", 0, 0.8, 0, 6);
    cone(g, 1.5, 0.6, S.parasol, 0, 2.7, 0, 8);
    return g;
  }
  // 작은 가게 수레 (꽃, 과자, 기념품)
  function stall() {
    const g = new T.Group();
    box(g, 2, 1, 1, "#efe6d2", 0, 0.3, 0);
    for (const [x, c] of [[-0.6, "#e86a9a"], [0, "#f2c230"], [0.6, "#7fc4d6"]]) box(g, 0.5, 0.25, 0.7, c, x, 1.3, 0);
    for (const x of [-0.9, 0.9]) cyl(g, 0.04, 0.04, 2.1, "#555", x, 0.3, 0.4, 6);
    const roof = box(g, 2.3, 0.12, 1.5, S.stall, 0, 2.4, 0.1); roof.rotation.x = -0.15;
    for (const x of [-0.7, 0.7]) { const w = cyl(g, 0.28, 0.28, 0.12, "#333", x, 0, 0.55, 10); w.rotation.x = Math.PI / 2; w.position.y = 0.28; }
    return g;
  }
  function fountainSmall() {
    const g = new T.Group();
    cyl(g, 1.6, 1.7, 0.6, "#cfc6b2", 0, 0, 0, 16);
    cyl(g, 1.4, 1.4, 0.62, "#7fc4d6", 0, 0, 0, 16);
    cyl(g, 0.25, 0.3, 1.6, "#cfc6b2", 0, 0.6, 0, 8);
    cyl(g, 0.6, 0.2, 0.3, "#cfc6b2", 0, 2.2, 0, 10);
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
    box(g, 2.5, 2.8, 11, S.bus[0], 0, 0.4, 0);
    box(g, 2.54, 0.6, 11.04, S.bus[1], 0, 0.4, 0);
    box(g, 2.56, 1.0, 10.2, "#2b3440", 0, 1.7, 0);
    box(g, 2.2, 1.0, 0.06, "#2b3440", 0, 1.7, 5.5);
    for (const [x, z] of [[1.15, 3.6], [-1.15, 3.6], [1.15, -3.6], [-1.15, -3.6]]) {
      const w = cyl(g, 0.5, 0.5, 0.35, "#111", x, 0, z, 12);
      w.rotation.z = Math.PI / 2; w.position.y = 0.5;
    }
    return g;
  }
  // 노면 전차 (프라하·빈·부다페스트·리스본의 트램)
  function tram() {
    const g = new T.Group();
    const c = S.tram || "#e8b62c";
    box(g, 2.4, 2.6, S.tramShort ? 7 : 13, c, 0, 0.3, 0);
    box(g, 2.44, 0.5, S.tramShort ? 7.04 : 13.04, "#f4efe4", 0, 0.3, 0);
    box(g, 2.46, 1.0, S.tramShort ? 6.4 : 12.2, "#2b3440", 0, 1.4, 0);
    box(g, 2.2, 0.2, S.tramShort ? 6 : 11, "#3a3a3a", 0, 2.9, 0);
    box(g, 0.08, 1.6, 0.08, "#333", 0, 3.1, 0);
    return g;
  }
  function boat() {
    const g = new T.Group();
    box(g, 3.6, 1.2, 14, "#f5f5f2", 0, -1.4, 0);
    cone(g, 2.5, 2.6, "#f5f5f2", 0, -1.4, 8.3, 4).scale.set(1.8, 1.2, 2.5);
    box(g, 3, 1.4, 8, "#9fc7d9", 0, -0.2, -1.5);
    box(g, 3.1, 0.2, 8.3, S.boatRoof || "#2f4f6a", 0, 1.2, -1.5);
    return g;
  }

  // 길가의 집: 벽 색, 창문 모양, 지붕 모양이 나라마다 달라요
  function house(w, h, d) {
    const g = new T.Group();
    const [wall, win] = S.walls[Math.floor(Math.random() * S.walls.length)];
    const roofC = S.roofColors[Math.floor(Math.random() * S.roofColors.length)];
    fbox(g, w, h, d, wall, win, 0, 0, 0, { roof: roofC, tile: 3.2, style: S.window });
    box(g, w + 0.2, 3, 0.3, ["#3e5a3a", "#7a1d2b", "#2f4f6a", "#6b4a32"][Math.floor(Math.random() * 4)], 0, 0, d / 2 + 0.1);
    if (Math.random() < 0.4) { const a = box(g, w * 0.8, 0.15, 1.4, S.parasol, 0, 3.2, d / 2 + 0.7); a.rotation.x = 0.3; }
    if (S.roof === "pitched") {
      const r = gable(g, d + 0.4, 5, w + 0.4, roofC, 0, h, 0); r.rotation.y = Math.PI / 2;
      if (S.gableFront) gable(g, w, 5, 0.4, wall, 0, h, d / 2 - 0.2);
    } else if (S.roof === "mansard") {
      frustum(g, w, 4, d, 0.72, roofC, 0, h, 0);
      for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 3.2) box(g, 0.9, 1.1, 0.6, "#e9e4da", x, h + 0.8, d / 2 - 0.9);
    } else if (S.roof === "tile") {
      box(g, w + 0.6, 0.5, d + 0.6, "#efe6d2", 0, h, 0);
      frustum(g, w + 0.4, 2.2, d + 0.4, 0.25, roofC, 0, h + 0.5, 0);
    } else {
      box(g, w + 0.3, 1, d + 0.3, wall, 0, h, 0);
    }
    if (S.balcony) for (const y of [6.3, h - 3]) { box(g, w * 0.7, 0.12, 0.8, "#2a2a2e", 0, y, d / 2 + 0.4); box(g, w * 0.7, 0.7, 0.06, "#2a2a2e", 0, y + 0.12, d / 2 + 0.8); }
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
          const h = (S.houseH || 12) + Math.random() * 5 + row * 3;
          const off = side * ((side > 0 ? 16 : 11) + d / 2 + row * 16);
          const q = sideAt(s, off);
          const r = Math.max(w, d) * 0.55;
          if (!ok(q.x, q.z, r)) continue;
          placed.push({ x: q.x, z: q.z, r });
          // 집 앞(+z)이 길을 바라보게 돌려요
          place(house(w, h, d), q.x, q.z, Math.atan2(-side * t.z, side * t.x));
        }
      }
    }
    // 인도의 가로등, 나무, 가게 수레, 카페, 분수, 벤치
    let n = 0;
    for (let s = 10; s < L - 4; s += 16) {
      n++;
      const t = tanAt(s);
      const q = sideAt(s, -4.2);
      if (inWater(q.x, q.z, 3) || exclusions.some((e) => e.tight && Math.hypot(e.x - q.x, e.z - q.z) < e.tight)) continue;
      const rot = headingRot(t.x, t.z);
      if (n % 11 === 6) place(stall(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 13 === 9) place(fountainSmall(), sideAt(s, -6).x, sideAt(s, -6).z, 0);
      else if (n % 6 === 1) place(cafe(), sideAt(s, -6.2).x, sideAt(s, -6.2).z, rot);
      else if (n % 5 === 0) place(bench(), q.x, q.z, rot - Math.PI / 2);
      else if (n % 2 === 0) place(lamp(), q.x, q.z, 0);
      else place(tree(pickTree(), 0.9 + Math.random() * 0.3), sideAt(s, -6.8).x, sideAt(s, -6.8).z, 0);
    }
  }

  // ---------- 땅, 하늘, 강 ----------
  function buildGround(scene) {
    const ground = mat(S.ground);
    const g = new T.Mesh(new T.PlaneGeometry(4000, 4000), ground);
    g.rotation.x = -Math.PI / 2;
    g.position.set(500, 0, 0);
    scene.add(g);
    if (RIVER) {
      // 강 자리는 땅을 뚫을 수 없어서, 땅보다 조금 낮은 물을 깔고 강둑 벽을 세워요. 땅 판은 강 위아래로 나눠요.
      scene.remove(g);
      const north = new T.Mesh(new T.PlaneGeometry(4000, 2000), ground);
      north.rotation.x = -Math.PI / 2; north.position.set(500, 0, RIVER.zNorth - 1000); scene.add(north);
      const south = new T.Mesh(new T.PlaneGeometry(4000, 2000), ground);
      south.rotation.x = -Math.PI / 2; south.position.set(500, 0, RIVER.zSouth + 1000); scene.add(south);
      const water = new T.Mesh(new T.PlaneGeometry(4000, RIVER.zSouth - RIVER.zNorth + 4), new T.MeshLambertMaterial({ color: S.water }));
      water.rotation.x = -Math.PI / 2; water.position.set(500, -2.4, (RIVER.zNorth + RIVER.zSouth) / 2); scene.add(water);
      for (const z of [RIVER.zNorth, RIVER.zSouth]) {
        box(scene, 4000, 2.6, 1.6, "#cdbf9f", 500, -2.5, z);
        box(scene, 4000, 0.7, 0.6, "#a99c80", 500, 0, z + (z === RIVER.zNorth ? -0.6 : 0.6));
      }
    }
    // 공원
    for (const [x, z, r] of (CITY.parks || [])) {
      const p = new T.Mesh(new T.CircleGeometry(r, 24), mat("#8db866"));
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.04, z);
      scene.add(p);
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, rr = r * (0.3 + Math.random() * 0.6);
        const tx = x + Math.cos(a) * rr, tz = z + Math.sin(a) * rr;
        if (distToPath(tx, tz) > 8 && !nearRiver(tz, 3)) place(tree(pickTree(), 1 + Math.random() * 0.5), tx, tz, 0);
      }
    }
  }

  const clouds = [];
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
      c.position.set(-300 + Math.random() * 1700, 150 + Math.random() * 40, -550 + Math.random() * 900);
      scene.add(c);
      clouds.push(c);
      const sp = 1 + Math.random() * 2;
      animated.push((t, dt) => { c.position.x += dt * sp; if (c.position.x > 1500) c.position.x = -350; });
    }
  }

  // ---------- 명소 9곳: 나라마다 landmarks.js가 register()로 건물 만드는 법을 알려 줘요 ----------
  let LM = { builders: {}, heights: {}, radii: {}, extra: null };
  function register(def) { LM = Object.assign(LM, def); }
  const landmarks = [];
  function buildLandmarks(scene) {
    for (const st of STOPS) {
      const g = new T.Group();
      const [ax, az] = st.at, [sx, sz] = st.stop;
      (LM.builders[st.build] || (() => box(g, 10, 10, 10, "#ccc", 0, 0, 0)))(g);
      g.position.set(ax, 0, az);
      g.rotation.y = sx === ax && sz === az ? 0 : Math.atan2(sx - ax, sz - az);
      scene.add(g);
      const h = LM.heights[st.build] || 30;
      const label = makeLabel(`${st.emoji} ${st.ko}`, st.en, { scale: 18 });
      label.position.set(ax, h + 4, az);
      scene.add(label);
      landmarks.push({ id: st.id, group: g, label, x: ax, z: az, h });
    }
  }
  function initExclusions() {
    for (const st of STOPS) {
      const r = LM.radii[st.build] || 40;
      exclusions.push({ x: st.at[0], z: st.at[1], r, tight: r * 0.6 });
      // 길에서 명소까지 보이는 길목에도 집을 짓지 않아요 (카메라가 집에 가리지 않게)
      const dx = st.at[0] - st.stop[0], dz = st.at[1] - st.stop[1], d = Math.hypot(dx, dz);
      if (d > 10) exclusions.push({ x: st.stop[0] + dx * 0.5, z: st.stop[1] + dz * 0.5, r: d * 0.45 });
    }
    for (const e of (LM.exclusions || [])) exclusions.push(e);
  }

  // ---------- 움직이는 것들: 자동차, 버스, 트램, 배, 걷는 사람 ----------
  const movers = [], walkers = [];
  let busEnd;
  function buildTraffic(scene) {
    busEnd = L - 40;
    const make = [["bus"], ["car", 0], ["car", 1], S.tram ? ["tram"] : ["car", 2], ["car", 3], ["car", 0], ["car", 2]];
    make.forEach(([kind, ci], i) => {
      const o = kind === "bus" ? bus() : kind === "tram" ? tram() : car(S.cars[ci % S.cars.length]);
      scene.add(o);
      movers.push({ o, k: i / make.length, speed: kind === "car" ? 9 : 6 });
    });
    if (RIVER) {
      for (let i = 0; i < 3; i++) {
        const b = boat();
        scene.add(b);
        const crossX = samples.filter((q) => inWater(q.x, q.z)).map((q) => q.x);
        animated.push((t) => {
          const dir = i % 2 ? 1 : -1, span = 1900;
          let x = (t * 6 + i * 560) % span;
          x = dir > 0 ? -400 + x : 1500 - x;
          const lane = (RIVER.zSouth - RIVER.zNorth) * (dir > 0 ? 0.72 : 0.3);
          b.position.set(x, 0, RIVER.zNorth + lane);
          b.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          b.visible = crossX.every((cx) => Math.abs(x - cx) > 18);
        });
      }
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

  // ---------- 마지막 장면 효과: 불꽃놀이, 눈, 불빛, 음표, 비둘기, 노을 ----------
  const effects = [];
  let sceneRef = null, finaleOn = null, finaleTimer = 0, lit = [];
  const glowTex = canvasTex(32, 32, (c) => {
    const r = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.8)"); r.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = r; c.fillRect(0, 0, 32, 32);
  });
  function glow(color, size) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    s.scale.setScalar(size);
    return s;
  }
  function finaleCenter() {
    const lm = landmarks.find((l) => l.id === CITY.finaleStop) || landmarks[landmarks.length - 1];
    return { x: lm.x, z: lm.z, h: lm.h, lm };
  }
  function burst(c) {
    const cols = ["#ff5a5a", "#ffd23f", "#5ad1ff", "#9b6bff", "#5aff8a", "#ff8ad8", "#ffffff"];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const o = new T.Vector3(c.x + (Math.random() - 0.5) * 60, c.h + 25 + Math.random() * 35, c.z + (Math.random() - 0.5) * 60);
    const parts = [];
    for (let i = 0; i < 46; i++) {
      const s = glow(col, 2.4);
      s.position.copy(o);
      const v = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(14 + Math.random() * 6);
      sceneRef.add(s);
      parts.push({ s, v });
    }
    let t = 0;
    effects.push((dt) => {
      t += dt;
      for (const p of parts) {
        p.v.y -= 9 * dt; p.v.multiplyScalar(0.985);
        p.s.position.addScaledVector(p.v, dt);
        p.s.material.opacity = Math.max(0, 1 - t / 1.8);
      }
      if (t < 1.8) return true;
      parts.forEach((p) => sceneRef.remove(p.s));
      return false;
    });
  }
  let snowField = null;
  function snow(on) {
    if (on && !snowField) {
      snowField = new T.Group();
      const c = finaleCenter();
      for (let i = 0; i < 420; i++) {
        const s = glow("#ffffff", 0.9);
        s.position.set(c.x + (Math.random() - 0.5) * 260, Math.random() * 90, c.z + (Math.random() - 0.5) * 260);
        s.userData.v = 4 + Math.random() * 4;
        snowField.add(s);
      }
      sceneRef.add(snowField);
    } else if (!on && snowField) { sceneRef.remove(snowField); snowField = null; }
  }
  function lights(on) {
    const c = finaleCenter();
    if (on) {
      lit = [];
      c.lm.group.traverse((o) => {
        if (!o.isMesh) return;
        const old = o.material;
        const list = Array.isArray(old) ? old : [old];
        const neu = list.map((m) => { const k = m.clone(); if (k.emissive) k.emissive.set("#b8801e"); if (k.map) k.emissiveMap = k.map; return k; });
        lit.push([o, old]);
        o.material = Array.isArray(old) ? neu : neu[0];
      });
    } else {
      lit.forEach(([o, old]) => { o.material = old; });
      lit = [];
    }
  }
  function note(c) {
    const ch = ["♪", "♫", "♩", "♬"][Math.floor(Math.random() * 4)];
    const col = ["#ffd23f", "#ff8ad8", "#5ad1ff", "#ffffff", "#9b6bff"][Math.floor(Math.random() * 5)];
    const t0 = canvasTex(64, 64, (g) => { g.fillStyle = col; g.font = "52px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 32, 34); });
    const s = new T.Sprite(new T.SpriteMaterial({ map: t0, transparent: true, depthWrite: false, fog: false }));
    s.scale.setScalar(5);
    const x0 = c.x + (Math.random() - 0.5) * 50, z0 = c.z + (Math.random() - 0.5) * 50;
    s.position.set(x0, 4, z0);
    sceneRef.add(s);
    let t = 0;
    effects.push((dt) => {
      t += dt;
      s.position.y += dt * 9;
      s.position.x = x0 + Math.sin(t * 2.4) * 3;
      s.material.opacity = Math.max(0, 1 - t / 5);
      if (t < 5) return true;
      sceneRef.remove(s);
      return false;
    });
  }
  function doves() {
    const c = finaleCenter();
    for (let i = 0; i < 36; i++) {
      const d = new T.Group();
      ball(d, 0.4, "#f8f8f6", 0, 0, 0).scale.set(0.35, 0.3, 0.6);
      const wl = box(d, 1.1, 0.06, 0.4, "#f8f8f6", -0.5, 0, 0), wr = box(d, 1.1, 0.06, 0.4, "#f8f8f6", 0.5, 0, 0);
      d.position.set(c.x + (Math.random() - 0.5) * 40, 0.5, c.z + (Math.random() - 0.5) * 40);
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
  let sun = null;
  // 마지막 장면 켜고 끄기. type: fireworks, snow, lights, music, doves, sunset
  function finale(type, on) {
    finaleOn = on ? type : null;
    finaleTimer = 0;
    if (type === "snow") snow(on);
    if (type === "lights") lights(on);
    if (type === "doves" && on) doves();
    if (type === "sunset") {
      if (on) {
        const c = finaleCenter();
        sun = glow("#ff9a3c", 90);
        sun.position.set(c.x - 220, 30, c.z + 120);
        sceneRef.add(sun);
      } else if (sun) { sceneRef.remove(sun); sun = null; }
    }
    clouds.forEach((cl) => cl.children.forEach((m) => m.material.emissive.set(on && (type === "fireworks" || type === "lights") ? "#222233" : on && type === "sunset" ? "#d0784a" : "#bbbbbb")));
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
    ribbon(city, -3.2, 3.2, S.pave, 0.05);
    ribbon(city, 3.2, 4.6, "#b3ab9c", 0.07);
    ribbon(city, 4.6, 12.2, "#5d6168", 0.06, 0, L - 40);
    for (let s = 0; s < L - 40; s += 8) ribbon(city, 8.3, 8.5, "#f1f1f1", 0.08, s, s + 4, 4);
    buildDecks(city);
    buildLandmarks(scene);
    if (LM.extra) LM.extra(scene, kit);
    scatterCity();
    buildClouds(scene);
    buildTraffic(scene);
    // 멈추는 곳(명소) 위치를 길 위의 거리(s)로 바꿔 둬요
    for (const st of STOPS) st.s = nearestS(st.stop[0], st.stop[1]);
  }

  function cityTime() {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: CITY.tz, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      return { h: +parts.find((p) => p.type === "hour").value, m: +parts.find((p) => p.type === "minute").value };
    } catch (e) {
      const d = new Date(); return { h: d.getUTCHours(), m: d.getUTCMinutes() };
    }
  }

  let clockTimer = 0;
  function update(t, dt, playerS) {
    for (const f of animated) f(t, dt);
    updateMovers(t, dt, playerS);
    for (let i = effects.length - 1; i >= 0; i--) if (!effects[i](dt)) effects.splice(i, 1);
    if (finaleOn) {
      finaleTimer -= dt;
      const c = finaleCenter();
      if (finaleOn === "fireworks" && finaleTimer <= 0) { finaleTimer = 0.45 + Math.random() * 0.4; burst(c); }
      if (finaleOn === "music" && finaleTimer <= 0) { finaleTimer = 0.25; note(c); }
    }
    if (snowField) for (const s of snowField.children) { s.position.y -= s.userData.v * dt; s.position.x += Math.sin(t + s.position.z) * dt; if (s.position.y < 0) s.position.y = 90; }
    clockTimer -= dt;
    if (clockTimer <= 0) { clockTimer = 20; const now = cityTime(); drawClock(now.h, now.m); }
  }

  // landmarks.js에서 건물을 만들 때 쓰는 도구 상자
  const kit = { T, mat, box, cyl, cone, ball, dome, gable, fbox, facadeMat, canvasTex, frustum, archShape, flat, statue, hill, domeTop, spire, flag, makeChibi, tree, lamp, clockTex, animated, glow };

  return {
    init, update, updateChunks, posAt, tanAt, sideAt, nearestS, onBridge, makeChibi, animateChibi, makeLabel,
    nearestWalker, sayBubble, finale, cityTime, landmarks, samples, register, kit,
    get L() { return L; }
  };
})();
