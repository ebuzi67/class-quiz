// 3D 반려동물·아이템 모델 (Three.js)
// ─────────────────────────────────────────────────────────────
//  모든 동물을 공·캡슐·원뿔 같은 단순한 도형으로 만들어서 "말랑한 장난감" 같은 그림체를 맞춰요.
//  동물은 +z 방향(카메라 쪽)을 바라보고, 발바닥이 y=0에 있어요. 키는 1 정도예요.
//
//  buildPet(id, { acc }) → { group, setMood(mood), update(dt, t, action) }
//  buildLife(key, stage) → 곤충 한살이 모델 (알·애벌레·번데기)
//  buildItem(id)         → 꾸미기 아이템 모델
// ─────────────────────────────────────────────────────────────
import * as THREE from "three";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.map && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts });
  if (!opts.map) matCache.set(key, m);
  return m;
}
function mesh(geo, material, pos, scale, rot) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  return m;
}
const sphere = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12);
const cone = (r, h, seg = 16) => new THREE.ConeGeometry(r, h, seg);
const tube = (pts, r, seg = 20) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 8, false);
// 두 점을 잇는 막대 (곤충 다리 등)
function rod(a, b, r, material) {
  const len = a.distanceTo(b);
  const m = mesh(new THREE.CylinderGeometry(r, r * 0.85, len, 8), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
// 무늬 그림(줄무늬·얼룩)을 공에 입혀요
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function patternTexture({ base, accent, belly, kind, seed = 7 }) {
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 128;
  const c = cv.getContext("2d");
  c.fillStyle = base; c.fillRect(0, 0, 256, 128);
  const r = rng(seed);
  if (kind === "stripes") {
    c.strokeStyle = accent; c.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const x = i * (256 / 14) + 4;
      c.lineWidth = 5 + r() * 3;
      c.beginPath(); c.moveTo(x, 14); c.quadraticCurveTo(x + 6, 50, x - 2, 86); c.stroke();
    }
  }
  if (kind === "calico") {
    for (let i = 0; i < 9; i++) {
      c.fillStyle = i % 2 ? "#2F2B34" : "#E9923B";
      c.beginPath(); c.ellipse(r() * 256, 10 + r() * 70, 16 + r() * 22, 10 + r() * 14, r() * 3, 0, Math.PI * 2); c.fill();
    }
  }
  if (belly) { const g = c.createLinearGradient(0, 80, 0, 128); g.addColorStop(0, base); g.addColorStop(0.35, belly); c.fillStyle = g; c.fillRect(0, 80, 256, 48); }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
// 공 표면 위의 점 (털 뭉치·점무늬를 붙일 때)
function onEllipsoid(c, r, theta, phi) {
  return V(c.x + r.x * Math.sin(phi) * Math.cos(theta), c.y + r.y * Math.cos(phi), c.z + r.z * Math.sin(phi) * Math.sin(theta));
}

// ─────────────────────────────────────────────────────────────
//  얼굴 (눈·감은 눈·입·볼)
// ─────────────────────────────────────────────────────────────
function addFace(head, { eyeX, eyeY, eyeZ, eyeR, iris, mouthY, mouthZ, blushX, blushY, blushZ }) {
  const face = { open: [], closed: [], mouth: null, blush: [] };
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * eyeX, eyeY, eyeZ);
    if (iris) {
      eye.add(mesh(sphere(eyeR, 16), mat(iris, { roughness: 0.3 })));
      eye.add(mesh(sphere(eyeR * 0.62, 12), mat("#1E1A22", { roughness: 0.2 }), [0, 0, eyeR * 0.45], [0.55, 1.15, 0.6]));
    } else {
      eye.add(mesh(sphere(eyeR, 16), mat("#1E1A22", { roughness: 0.2 })));
    }
    eye.add(mesh(sphere(eyeR * 0.32, 8), mat("#FFFFFF", { roughness: 0.1 }), [eyeR * 0.35, eyeR * 0.4, eyeR * 0.75]));
    head.add(eye);
    face.open.push(eye);
    // 감은 눈 (^ 모양)
    const arc = mesh(new THREE.TorusGeometry(eyeR * 0.95, eyeR * 0.24, 6, 14, Math.PI), mat("#1E1A22"), [s * eyeX, eyeY - eyeR * 0.3, eyeZ + eyeR * 0.4]);
    arc.visible = false;
    head.add(arc);
    face.closed.push(arc);
    const b = mesh(new THREE.CircleGeometry(eyeR * 1.1, 16), mat("#F59AA6", { transparent: true, opacity: 0.75 }), [s * blushX, blushY, blushZ], null, [0, s * 0.55, 0]);
    b.visible = false;
    head.add(b);
    face.blush.push(b);
  }
  face.mouth = mesh(sphere(eyeR * 0.9, 12), mat("#7A2E3A"), [0, mouthY, mouthZ], [1.1, 0.8, 0.5]);
  face.mouth.add(mesh(sphere(eyeR * 0.55, 10), mat("#F27C8A"), [0, -eyeR * 0.3, eyeR * 0.3]));
  face.mouth.visible = false;
  head.add(face.mouth);
  return face;
}

// ─────────────────────────────────────────────────────────────
//  강아지
// ─────────────────────────────────────────────────────────────
const DOGS = {
  poodle: { fur: "#E8AE78", shade: "#D49058", light: "#F3CFA6", ears: "pom", tail: "pom", curly: true },
  corgi: { fur: "#E8913F", shade: "#C26F25", light: "#FFFFFF", ears: "big", tail: "stub", white: true, short: true },
  shiba: { fur: "#D9803A", shade: "#B45F22", light: "#F8E6C8", ears: "small", tail: "curl", cheeks: true },
  golden: { fur: "#E3AE52", shade: "#C88F33", light: "#F4D48E", ears: "flop", tail: "plume", big: true },
  pomeranian: { fur: "#F0A23F", shade: "#D7841F", light: "#FAD08A", ears: "tiny", tail: "curl", mane: true },
  bichon: { fur: "#FBFAF5", shade: "#ECE6DA", light: "#FFFFFF", ears: "puff", tail: "pom", curly: true, round: true },
};
function buildDog(p) {
  const root = new THREE.Group();
  const fur = mat(p.fur), shade = mat(p.shade), light = mat(p.light);
  const parts = { legs: [] };
  const legLen = p.short ? 0.1 : 0.2;
  const bodyY = p.short ? 0.38 : 0.48;
  const W = p.big ? 1.1 : 1;
  // 몸
  const body = mesh(sphere(0.4), fur, [0, bodyY, -0.05], [0.88 * W, 0.78, 1.12 * W]);
  root.add(body); parts.body = body;
  root.add(mesh(sphere(0.3), light, [0, bodyY - 0.02, 0.22], [0.78, 0.85, 0.62]));
  if (p.mane) root.add(mesh(sphere(0.42), fur, [0, bodyY + 0.22, 0.18], [1.15, 0.95, 0.85]));
  // 다리
  for (const [x, z] of [[-0.19, 0.22], [0.19, 0.22], [-0.19, -0.3], [0.19, -0.3]]) {
    const leg = new THREE.Group();
    leg.position.set(x * W, bodyY - 0.12, z * W);
    leg.add(mesh(capsule(0.085, legLen), fur, [0, -legLen / 2 - 0.06, 0]));
    leg.add(mesh(sphere(0.095, 12), p.white ? light : shade, [0, -legLen - 0.13, 0.02], [1, 0.7, 1.2]));
    root.add(leg); parts.legs.push(leg);
  }
  // 꼬리
  const tail = new THREE.Group();
  tail.position.set(0, bodyY + 0.12, -0.45 * W);
  if (p.tail === "curl") { tail.add(mesh(new THREE.TorusGeometry(0.13, 0.075, 10, 20, Math.PI * 1.6), fur, [0, 0.14, -0.02], null, [0, Math.PI / 2, 0.6])); }
  else if (p.tail === "stub") tail.add(mesh(sphere(0.08, 12), fur, [0, 0.02, -0.02]));
  else if (p.tail === "pom") { tail.add(mesh(capsule(0.04, 0.16), fur, [0, 0.1, -0.05], null, [-0.5, 0, 0])); tail.add(mesh(sphere(0.11, 14), fur, [0, 0.22, -0.11])); }
  else tail.add(mesh(capsule(0.07, 0.28), fur, [0, 0.12, -0.12], null, [-0.9, 0, 0]));
  root.add(tail); parts.tail = tail;
  // 머리
  const head = new THREE.Group();
  head.position.set(0, bodyY + 0.42, 0.3);
  const HR = p.round ? 0.44 : 0.37;
  head.add(mesh(sphere(HR), fur));
  // 주둥이·무늬
  if (p.white) { head.add(mesh(sphere(0.2), light, [0, -0.1, 0.25], [1.1, 0.8, 1])); head.add(mesh(capsule(0.05, 0.22), light, [0, 0.12, 0.31], null, [0.3, 0, 0])); }
  else if (p.cheeks) head.add(mesh(sphere(0.26), light, [0, -0.11, 0.18], [1.15, 0.6, 0.9]));
  else head.add(mesh(sphere(0.17), light, [0, -0.1, HR - 0.08], [1.15, 0.82, 1]));
  head.add(mesh(sphere(0.055, 12), mat("#1E1A22", { roughness: 0.25 }), [0, -0.04, HR + 0.07]));
  // 귀
  const ears = [];
  for (const s of [-1, 1]) {
    let ear;
    if (p.ears === "flop") ear = mesh(sphere(0.13), shade, [s * 0.33, -0.04, 0], [0.55, 1.35, 0.85], [0, 0, s * 0.25]);
    if (p.ears === "pom") ear = mesh(sphere(0.15), shade, [s * 0.36, -0.08, -0.02], [0.75, 1.2, 0.9]);
    if (p.ears === "puff") ear = mesh(sphere(0.15), shade, [s * 0.4, -0.04, 0], [0.7, 1.05, 0.9]);
    if (p.ears === "big") ear = mesh(cone(0.14, 0.34), fur, [s * 0.22, 0.38, -0.02], null, [0, 0, -s * 0.28]);
    if (p.ears === "small") ear = mesh(cone(0.1, 0.2, 12), fur, [s * 0.21, 0.33, 0], null, [0, 0, -s * 0.3]);
    if (p.ears === "tiny") ear = mesh(cone(0.075, 0.14, 12), fur, [s * 0.18, 0.33, 0], null, [0, 0, -s * 0.25]);
    head.add(ear); ears.push(ear);
    if (p.ears === "big") head.add(mesh(cone(0.08, 0.22, 12), mat("#F3B5A6"), [s * 0.215, 0.37, 0.04], null, [0, 0, -s * 0.28]));
  }
  parts.ears = ears;
  if (p.ears === "pom") head.add(mesh(sphere(0.2), fur, [0, 0.34, -0.02], [1.2, 0.8, 1]));
  // 곱슬 털 뭉치
  if (p.curly) {
    const puff = sphere(0.09, 10);
    for (let i = 0; i < 26; i++) {
      const th = (i * 2.4) % (Math.PI * 2), ph = 0.35 + ((i * 0.618) % 1) * 1.6;
      const pt = onEllipsoid(V(0, bodyY, -0.05), V(0.35 * W, 0.31, 0.45 * W), th, ph);
      if (pt.z > 0.18 && pt.y > bodyY) continue;
      root.add(mesh(puff, i % 3 ? fur : shade, pt.toArray()));
    }
    for (let i = 0; i < 14; i++) {
      const th = (i * 2.4) % (Math.PI * 2), ph = 0.2 + ((i * 0.618) % 1) * 0.9;
      const pt = onEllipsoid(V(0, 0, 0), V(HR * 0.95, HR * 0.95, HR * 0.95), th, ph);
      if (pt.z > HR * 0.45) continue;  // 얼굴은 비워 둬요
      head.add(mesh(puff, i % 3 ? fur : shade, pt.toArray()));
    }
  }
  if (p.ears === "flop" && p.big) root.add(mesh(sphere(0.2), mat(p.light), [0, bodyY + 0.12, 0.33], [1, 0.9, 0.6]));
  parts.face = addFace(head, { eyeX: 0.15, eyeY: 0.05, eyeZ: HR - 0.05, eyeR: 0.055, mouthY: -0.19, mouthZ: HR - 0.02, blushX: 0.25, blushY: -0.07, blushZ: HR - 0.12 });
  root.add(head); parts.head = head;
  parts.headAnchor = V(0, HR, 0);
  return { root, parts, kind: "dog" };
}

// ─────────────────────────────────────────────────────────────
//  고양이
// ─────────────────────────────────────────────────────────────
const CATS = {
  cheese: { fur: "#F2A64A", accent: "#CF7424", belly: "#FBE0B5", iris: "#9BCB4E", kind: "stripes" },
  calico: { fur: "#FCF8F0", accent: null, belly: "#FFFFFF", iris: "#E7B43A", kind: "calico" },
  mackerel: { fur: "#A3A7AC", accent: "#4D5258", belly: "#DADDE0", iris: "#C9C24A", kind: "stripes" },
  blackcat: { fur: "#2F2B34", accent: null, belly: null, iris: "#F2C94C", kind: null, roughness: 0.4 },
  russianblue: { fur: "#8A9AB0", accent: null, belly: null, iris: "#62C98A", kind: null, roughness: 0.45 },
  tuxedo: { fur: "#2E2A31", accent: null, belly: null, iris: "#9BD06A", kind: null, tux: true, roughness: 0.45 },
};
function buildCat(p, id) {
  const root = new THREE.Group();
  const parts = { legs: [] };
  const texOpts = p.kind ? { map: patternTexture({ base: p.fur, accent: p.accent, belly: p.belly, kind: p.kind, seed: id.length * 13 }) } : {};
  const fur = new THREE.MeshStandardMaterial({ color: p.kind ? "#FFFFFF" : p.fur, roughness: p.roughness || 0.62, ...texOpts });
  const plain = mat(p.fur, { roughness: p.roughness || 0.62 });
  const white = mat("#FFFFFF");
  const bodyY = 0.46;
  const body = mesh(sphere(0.36), fur, [0, bodyY, -0.05], [0.82, 0.8, 1.22]);
  root.add(body); parts.body = body;
  if (p.tux) root.add(mesh(sphere(0.24), white, [0, bodyY, 0.2], [0.85, 0.95, 0.6]));
  else if (p.belly) root.add(mesh(sphere(0.22), mat(p.belly), [0, bodyY - 0.05, 0.22], [0.8, 0.9, 0.55]));
  for (const [x, z] of [[-0.15, 0.22], [0.15, 0.22], [-0.15, -0.3], [0.15, -0.3]]) {
    const leg = new THREE.Group();
    leg.position.set(x, bodyY - 0.12, z);
    leg.add(mesh(capsule(0.07, 0.2), plain, [0, -0.16, 0]));
    leg.add(mesh(sphere(0.08, 12), p.tux ? white : plain, [0, -0.3, 0.02], [1, 0.7, 1.2]));
    root.add(leg); parts.legs.push(leg);
  }
  // 꼬리 (위로 감아 올림)
  const tail = new THREE.Group();
  tail.position.set(0, bodyY + 0.08, -0.45);
  tail.add(mesh(tube([V(0, 0, 0), V(0.05, 0.22, -0.14), V(0.12, 0.48, -0.12), V(0.06, 0.62, 0.02)], 0.055), fur));
  root.add(tail); parts.tail = tail;
  // 머리
  const head = new THREE.Group();
  head.position.set(0, bodyY + 0.4, 0.28);
  head.add(mesh(sphere(0.36), fur, null, [1.12, 0.94, 1]));
  for (const s of [-1, 1]) {
    head.add(mesh(cone(0.13, 0.25, 4), plain, [s * 0.22, 0.31, -0.02], null, [0, Math.PI / 4, -s * 0.32]));
    head.add(mesh(cone(0.075, 0.16, 4), mat("#F3AFB4"), [s * 0.215, 0.3, 0.035], null, [0, Math.PI / 4, -s * 0.32]));
  }
  parts.ears = [];
  const muzzle = p.tux || p.kind === "calico" ? white : mat(p.belly || p.fur);
  for (const s of [-1, 1]) head.add(mesh(sphere(0.085, 14), muzzle, [s * 0.065, -0.12, 0.3], [1, 0.85, 0.8]));
  if (p.tux) head.add(mesh(sphere(0.16), white, [0, -0.13, 0.22], [1.2, 0.7, 0.7]));
  head.add(mesh(sphere(0.035, 10), mat("#E8818C"), [0, -0.06, 0.355], [1.3, 0.8, 0.8]));
  // 수염
  const wc = mat(p.fur === "#2F2B34" || p.fur === "#2E2A31" ? "#B9B4BF" : "#8D949C");
  for (const s of [-1, 1]) for (const dy of [-0.02, 0.03]) head.add(rod(V(s * 0.12, -0.11 + dy, 0.3), V(s * 0.42, -0.09 + dy * 2.4, 0.26), 0.006, wc));
  parts.face = addFace(head, { eyeX: 0.15, eyeY: 0.04, eyeZ: 0.29, eyeR: 0.065, iris: p.iris, mouthY: -0.2, mouthZ: 0.3, blushX: 0.26, blushY: -0.07, blushZ: 0.24 });
  root.add(head); parts.head = head;
  parts.headAnchor = V(0, 0.34, 0);
  return { root, parts, kind: "cat" };
}

// ─────────────────────────────────────────────────────────────
//  곤충 (딱정벌레)
// ─────────────────────────────────────────────────────────────
const BUGS = {
  stag: { body: "#5B3A23", jaw: "stag" },
  rhino: { body: "#6E3522", horn: true },
  wide: { body: "#2E2622", jaw: "wide", wide: true },
  saw: { body: "#8E3D1F", jaw: "saw" },
  king: { body: "#211D1E", jaw: "king", thick: true },
  chafer: { body: "#3F6B3A", chafer: true },
};
function buildBug(p) {
  const root = new THREE.Group();
  const parts = { legs: [], antennae: [] };
  const shell = new THREE.MeshStandardMaterial({ color: p.body, roughness: p.chafer ? 0.28 : 0.3, metalness: p.chafer ? 0.55 : 0.18 });
  const dark = mat("#1A1210", { roughness: 0.5 });
  const W = p.wide ? 1.12 : 1;
  const Y = 0.3;
  // 딱지날개
  const elytra = mesh(sphere(0.4), shell, [0, Y, -0.22], [0.9 * W, 0.46, 1.3]);
  root.add(elytra); parts.body = elytra;
  // 딱지날개 가운데 선 (몸 곡면을 따라가요)
  const seam = [];
  for (let i = 0; i <= 12; i++) { const z = -0.22 - 0.5 + (i / 12) * 1.0; const k = 1 - ((z + 0.22) / 0.52) ** 2; seam.push(V(0, Y + 0.184 * Math.sqrt(Math.max(0, k)) + 0.004, z)); }
  root.add(mesh(tube(seam, 0.008, 24), dark));
  // 가슴·머리
  root.add(mesh(sphere(0.3), shell, [0, Y, 0.36], [1.05 * W, 0.52, 0.72]));
  const head = new THREE.Group();
  head.position.set(0, Y - 0.02, 0.6);
  head.add(mesh(sphere(0.17), shell, null, [p.thick ? 1.45 : 1.2, 0.62, 1]));
  for (const s of [-1, 1]) {
    head.add(mesh(sphere(0.04, 10), mat("#15100E", { roughness: 0.15 }), [s * 0.17, 0.03, 0.05]));
    head.add(mesh(sphere(0.013, 6), mat("#FFFFFF"), [s * 0.18, 0.05, 0.085]));
  }
  // 큰턱·뿔
  const J = {
    stag: [[0.08, 0, 0.12], [0.2, 0.03, 0.32], [0.2, 0.05, 0.52], [0.07, 0.07, 0.66]],
    wide: [[0.09, -0.01, 0.12], [0.14, 0, 0.36], [0.11, 0, 0.56], [0.03, 0, 0.62]],
    saw: [[0.08, 0, 0.12], [0.27, 0.03, 0.28], [0.27, 0.05, 0.5], [0.09, 0.07, 0.64]],
    king: [[0.1, 0, 0.12], [0.22, 0.02, 0.27], [0.12, 0.03, 0.42]],
  }[p.jaw];
  if (J) {
    for (const s of [-1, 1]) {
      head.add(mesh(tube(J.map(([x, y, z]) => V(s * x, y, z)), p.jaw === "king" ? 0.045 : p.jaw === "wide" ? 0.032 : 0.035), shell));
      const teeth = p.jaw === "saw" ? [0.35, 0.5, 0.62] : p.jaw === "wide" ? [0.3, 0.42, 0.52] : p.jaw === "king" ? [0.55] : [0.5];
      const curve = new THREE.CatmullRomCurve3(J.map(([x, y, z]) => V(s * x, y, z)));
      teeth.forEach((t) => {
        const pt = curve.getPoint(t);
        head.add(mesh(cone(p.jaw === "king" ? 0.03 : 0.018, 0.07, 6), shell, [pt.x - s * 0.03, pt.y, pt.z], null, [0, 0, s * Math.PI / 2]));
      });
      if (p.jaw === "stag") { const tip = curve.getPoint(0.86); head.add(mesh(cone(0.02, 0.08, 6), shell, [tip.x, tip.y + 0.04, tip.z], null, [0, 0, 0])); }
    }
  }
  if (p.horn) {
    head.add(mesh(tube([V(0, 0.04, 0.05), V(0, 0.16, 0.22), V(0, 0.4, 0.34), V(0, 0.62, 0.28)], 0.045), shell));
    for (const s of [-1, 1]) head.add(mesh(tube([V(0, 0.6, 0.29), V(s * 0.07, 0.7, 0.27), V(s * 0.1, 0.76, 0.22)], 0.025, 8), shell));
    root.add(mesh(cone(0.05, 0.2, 10), shell, [0, Y + 0.2, 0.5], null, [0.9, 0, 0]));
  }
  // 더듬이
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    a.position.set(s * 0.12, 0.04, 0.1);
    a.add(mesh(tube([V(0, 0, 0), V(s * 0.1, 0.06, 0.08), V(s * 0.16, 0.1, 0.18)], 0.012, 8), dark));
    a.add(mesh(sphere(0.028, 8), dark, [s * 0.16, 0.1, 0.19], [1, 0.8, 1.4]));
    head.add(a); parts.antennae.push(a);
  }
  root.add(head); parts.head = head;
  // 다리 6개
  [[0.42, 0.25], [0.12, 0], [-0.18, -0.3]].forEach(([z, dz]) => {
    for (const s of [-1, 1]) {
      const leg = new THREE.Group();
      const a = V(s * 0.2 * W, Y - 0.08, z), k = V(s * 0.44 * W, Y + 0.04, z + dz * 0.4), f = V(s * 0.54 * W, 0.01, z + dz);
      leg.add(rod(a, k, 0.03, dark)); leg.add(rod(k, f, 0.022, dark));
      root.add(leg); parts.legs.push(leg);
    }
  });
  // 꽃무지 흰 점무늬
  if (p.chafer) {
    const spot = mat("#F4F1E6", { roughness: 0.5 });
    [[0.15, -0.05], [-0.18, -0.12], [0.2, -0.35], [-0.12, -0.42], [0.05, -0.6], [-0.22, 0.38], [0.22, 0.4]].forEach(([x, z]) => {
      const zc = z < 0.2 ? -0.22 : 0.36, rz = z < 0.2 ? 0.52 : 0.216, rx = z < 0.2 ? 0.36 : 0.315, ry = z < 0.2 ? 0.184 : 0.156;
      const k = 1 - (x / rx) ** 2 - ((z - zc) / rz) ** 2;
      if (k <= 0) return;
      root.add(mesh(sphere(0.03, 8), spot, [x, Y + ry * Math.sqrt(k), z], [1, 0.3, 1]));
    });
  }
  parts.face = null;
  parts.headAnchor = V(0, 0.12, -0.12);
  root.scale.setScalar(1.25);   // 곤충은 강아지·고양이와 비슷한 크기로 보이게 키워요
  return { root, parts, kind: "bug" };
}

// ─────────────────────────────────────────────────────────────
//  반려동물 장식
// ─────────────────────────────────────────────────────────────
function buildAcc(id) {
  const g = new THREE.Group();
  if (id === "acc-ribbon") {
    const m = mat("#F06D8C");
    g.add(mesh(cone(0.07, 0.14, 12), m, [-0.07, 0, 0], null, [0, 0, Math.PI / 2]));
    g.add(mesh(cone(0.07, 0.14, 12), m, [0.07, 0, 0], null, [0, 0, -Math.PI / 2]));
    g.add(mesh(sphere(0.035, 10), mat("#FFC2D1")));
    g.position.set(0.18, 0, 0.05);
    g.rotation.z = -0.4;
  }
  if (id === "acc-crown") {
    g.add(mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24), mat("#7CC36B"), null, null, [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(mesh(sphere(0.045, 10), mat(i % 2 ? "#F59AB8" : "#FFD77A"), [Math.cos(a) * 0.16, 0.03, Math.sin(a) * 0.16]));
    }
  }
  if (id === "acc-leaf") {
    g.add(mesh(sphere(0.2, 16), mat("#5DAA4A"), [0, 0.02, 0], [1, 0.22, 0.75]));
    g.add(mesh(capsule(0.012, 0.08), mat("#3E7D31"), [0, 0.09, 0]));
  }
  return g;
}

// ─────────────────────────────────────────────────────────────
//  반려동물 만들기 + 표정 + 움직임
// ─────────────────────────────────────────────────────────────
export function buildPet(id, opts = {}) {
  let built;
  if (DOGS[id]) built = buildDog(DOGS[id]);
  else if (CATS[id]) built = buildCat(CATS[id], id);
  else built = buildBug(BUGS[id] || BUGS.stag);
  const { root, parts, kind } = built;
  const group = new THREE.Group();
  group.add(root);
  group.userData.kind = kind;
  // 장식
  if (opts.acc === "acc-scarf" && kind !== "bug") {
    const y = parts.head.position.y - 0.3;
    root.add(mesh(new THREE.TorusGeometry(0.22, 0.06, 10, 24), mat("#E2554B"), [0, y, parts.head.position.z - 0.08], [1, 1, 0.9], [Math.PI / 2 - 0.25, 0, 0]));
    root.add(mesh(capsule(0.05, 0.12), mat("#E2554B"), [0.1, y - 0.12, parts.head.position.z + 0.08], null, [0.2, 0, 0.3]));
  } else if (opts.acc && opts.acc !== "acc-scarf") {
    const acc = buildAcc(opts.acc);
    acc.position.add(parts.headAnchor);
    (kind === "bug" ? root : parts.head).add(acc);
    if (kind === "bug") acc.position.set(0, 0.48, 0.36);
  }

  const base = {
    headRot: parts.head.rotation.clone(), headPos: parts.head.position.clone(), scale: root.scale.x,
    tailRot: parts.tail ? parts.tail.rotation.clone() : null,
  };
  let mood = "idle";
  let blinkAt = 2 + Math.random() * 3;

  function setMood(m) {
    mood = m;
    const f = parts.face;
    if (!f) return;
    const closed = m === "happy" || m === "eat" || m === "sleep";
    f.open.forEach((e) => { e.visible = !closed; e.scale.setScalar(m === "wow" ? 1.3 : 1); });
    f.closed.forEach((e) => { e.visible = closed; e.scale.y = m === "sleep" ? 0.15 : 1; });
    f.mouth.visible = m === "eat" || m === "wow" || m === "happy";
    f.mouth.scale.y = m === "eat" ? 0.8 : 0.5;
    f.blush.forEach((b) => { b.visible = m === "happy" || m === "eat" || m === "wow"; });
  }

  // action: { name, t(경과 시간), dur } 또는 null
  function update(dt, time, action) {
    const a = action ? action.name : "idle";
    const k = action ? action.t : 0;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.setScalar(base.scale);
    parts.head.rotation.copy(base.headRot);
    parts.head.position.copy(base.headPos);
    // 숨쉬기
    const breathe = Math.sin(time * 2.2) * 0.015;
    parts.body.scale.y = parts.body.userData.sy ??= parts.body.scale.y;
    parts.body.scale.y = parts.body.userData.sy * (1 + breathe);
    // 꼬리
    if (parts.tail) {
      const wag = a === "idle" ? 0.25 : 0.7;
      const speed = a === "idle" ? 3 : 12;
      parts.tail.rotation.y = base.tailRot.y + Math.sin(time * speed) * wag;
    }
    // 곤충 더듬이·다리
    parts.antennae?.forEach((an, i) => { an.rotation.y = Math.sin(time * 4 + i) * 0.25; an.rotation.x = Math.sin(time * 3 + i) * 0.15; });
    // 눈 깜빡임
    if (parts.face && mood === "idle") {
      blinkAt -= dt;
      const blink = blinkAt < 0.12;
      parts.face.open.forEach((e) => { e.scale.y = blink ? 0.12 : 1; });
      if (blinkAt < 0) blinkAt = 2.5 + Math.random() * 3;
    }
    const legSwing = (amp, spd) => parts.legs.forEach((l, i) => { l.rotation.x = Math.sin(time * spd + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * amp; });
    parts.legs.forEach((l) => { l.rotation.x = 0; });

    switch (a) {
      case "eat":
      case "drink": {
        // 고개 숙여 냠냠
        const down = Math.min(1, k * 3) * (kind === "bug" ? 0.25 : 0.55);
        parts.head.rotation.x = base.headRot.x + down + Math.sin(time * (a === "eat" ? 14 : 8)) * 0.08;
        if (parts.face) parts.face.mouth.scale.y = 0.4 + Math.abs(Math.sin(time * 14)) * 0.5;
        break;
      }
      case "pet": {
        // 말랑하게 눌리며 좋아해요
        const sq = Math.sin(k * 10) * 0.06;
        root.scale.set(base.scale * (1 + sq), base.scale * (1 - sq), base.scale * (1 + sq));
        root.rotation.z = Math.sin(time * 3) * 0.08;
        parts.head.rotation.z = Math.sin(time * 3) * 0.15;
        break;
      }
      case "ball":
      case "jump":
      case "pounce": {
        const hop = Math.abs(Math.sin(k * (a === "pounce" ? 5 : 7)));
        root.position.y = hop * (a === "jump" ? 0.55 : 0.35);
        root.rotation.y = a === "ball" ? Math.sin(k * 4) * 0.6 : 0;
        if (a === "pounce") root.rotation.x = -hop * 0.25;
        legSwing(0.5, 14);
        break;
      }
      case "walk": {
        // 방 안을 동그랗게 돌아요
        const ang = k * 2.2;
        root.position.set(Math.sin(ang) * 0.9, Math.abs(Math.sin(time * 10)) * 0.04, Math.cos(ang) * 0.5 - 0.5);
        root.rotation.y = ang + Math.PI / 2;
        legSwing(kind === "bug" ? 0.3 : 0.6, kind === "bug" ? 18 : 12);
        break;
      }
      case "trot": {
        // 제자리에서 다리만 움직여요 (모모의 방에서 걸어 다닐 때 써요. 위치는 바깥에서 옮겨요)
        root.position.y = Math.abs(Math.sin(time * 10)) * 0.04;
        legSwing(kind === "bug" ? 0.3 : 0.6, kind === "bug" ? 18 : 12);
        break;
      }
      case "observe": {
        root.rotation.y = k * 1.6;
        parts.head.rotation.y = Math.sin(time * 2) * 0.2;
        break;
      }
      default: {
        parts.head.rotation.z = base.headRot.z + Math.sin(time * 0.9) * 0.05;
        parts.head.rotation.y = base.headRot.y + Math.sin(time * 0.6) * 0.12;
      }
    }
  }

  setMood("idle");
  return { group, setMood, update, kind };
}

// ─────────────────────────────────────────────────────────────
//  곤충 한살이 (도감용 · 실제 생태)
// ─────────────────────────────────────────────────────────────
export function buildLife(key, stage) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.12, 28), mat("#7A5A3E"), [0, 0.06, 0]));
  if (stage === "egg") {
    g.add(mesh(sphere(0.22), mat("#F8F4E6", { roughness: 0.35 }), [0, 0.38, 0], [1, 1.15, 1]));
    g.add(mesh(sphere(0.16), mat("#F8F4E6", { roughness: 0.35 }), [0.38, 0.28, 0.1], [1, 1.15, 1]));
  }
  if (stage === "larva") {
    // C자 모양 애벌레(굼벵이)
    const body = mat("#F3EAD3", { roughness: 0.45 });
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = -0.3 + (i / 10) * Math.PI * 1.25; pts.push(V(Math.cos(a) * 0.36, 0.42 + Math.sin(a) * 0.3, 0)); }
    g.add(mesh(tube(pts, 0.16, 32), body));
    for (let i = 1; i < 10; i++) g.add(mesh(new THREE.TorusGeometry(0.16, 0.018, 6, 18), mat("#DCCDA8"), pts[i].toArray(), null, [0, Math.PI / 2, -0.3 + (i / 10) * Math.PI * 1.25]));
    g.add(mesh(sphere(0.15), mat("#C7782B", { roughness: 0.4 }), [pts[10].x - 0.02, pts[10].y - 0.06, 0.02]));
    g.rotation.y = 0.4;
  }
  if (stage === "pupa") {
    g.children[0].scale.set(0.8, 1, 0.8);
    if (key === "chafer") {
      g.add(mesh(sphere(0.36), mat("#9C7A55", { roughness: 0.95 }), [0, 0.42, 0], [1, 0.9, 1.1]));
    } else {
      const c = mat("#E2B877", { roughness: 0.4 });
      g.add(mesh(sphere(0.3), c, [0, 0.38, -0.08], [0.95, 0.75, 1.45]));
      g.add(mesh(sphere(0.2), c, [0, 0.4, 0.32]));
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.TorusGeometry(0.2 - i * 0.03, 0.012, 6, 20), mat("#C99A55"), [0, 0.36, -0.12 - i * 0.09]));
      if (key === "rhino") g.add(mesh(tube([V(0, 0.42, 0.4), V(0, 0.6, 0.5), V(0, 0.78, 0.46)], 0.04, 10), c));
      else for (const s of [-1, 1]) g.add(mesh(tube([V(s * 0.06, 0.38, 0.42), V(s * 0.14, 0.4, 0.58), V(s * 0.06, 0.42, 0.7)], 0.03, 10), c));
      g.rotation.y = -1.25;  // 옆에서 보이게 돌려요
    }
  }
  return g;
}

// ─────────────────────────────────────────────────────────────
//  꾸미기 아이템
// ─────────────────────────────────────────────────────────────
export function buildItem(id) {
  const g = new THREE.Group();
  const add = (...a) => { const m = mesh(...a); g.add(m); return m; };
  switch (id) {
    case "cushion-blue":
    case "cushion-yellow": {
      const c = id === "cushion-blue" ? "#7FAEE3" : "#FFD77A";
      add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 32), mat(c), [0, 0.08, 0]);
      add(new THREE.TorusGeometry(0.52, 0.08, 10, 32), mat(c), [0, 0.1, 0], null, [Math.PI / 2, 0, 0]);
      if (id === "cushion-yellow") add(new THREE.CircleGeometry(0.12, 5), mat("#F2A93B"), [0, 0.145, 0], null, [-Math.PI / 2, 0, 0]);
      break;
    }
    case "toy-ball":
      add(sphere(0.13), mat("#D6E64A"), [0, 0.13, 0]);
      add(new THREE.TorusGeometry(0.13, 0.012, 6, 24), mat("#FFFFFF"), [0, 0.13, 0], null, [0.6, 0.3, 0]);
      break;
    case "toy-yarn":
      add(sphere(0.14), mat("#F28DB2"), [0, 0.14, 0]);
      for (let i = 0; i < 3; i++) add(new THREE.TorusGeometry(0.14, 0.012, 6, 24), mat("#D45E8A"), [0, 0.14, 0], null, [i, i * 0.7, 0]);
      add(tube([V(0.12, 0.05, 0), V(0.3, 0.02, 0.1), V(0.45, 0.02, -0.05)], 0.012, 10), mat("#F28DB2"));
      break;
    case "toy-bone":
      add(capsule(0.05, 0.3), mat("#F6EEDC"), [0, 0.06, 0], null, [0, 0, Math.PI / 2]);
      for (const x of [-0.2, 0.2]) for (const z of [-0.05, 0.05]) add(sphere(0.06, 12), mat("#F6EEDC"), [x, 0.06, z]);
      break;
    case "bowl-white":
      add(new THREE.LatheGeometry([V(0, 0, 0), V(0.22, 0, 0), V(0.28, 0.14, 0), V(0.25, 0.14, 0), V(0.18, 0.03, 0)].map((v) => new THREE.Vector2(v.x, v.y)), 24), mat("#FFFFFF", { side: THREE.DoubleSide }));
      add(new THREE.TorusGeometry(0.265, 0.02, 6, 24), mat("#9CC3EE"), [0, 0.14, 0], null, [Math.PI / 2, 0, 0]);
      break;
    case "bowl-jelly":
      add(new THREE.CylinderGeometry(0.3, 0.32, 0.08, 20), mat("#B98352"), [0, 0.04, 0]);
      add(new THREE.CylinderGeometry(0.1, 0.09, 0.14, 16), mat("#F4F0E8"), [0, 0.15, 0]);
      add(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16), mat("#F29B38", { roughness: 0.2 }), [0, 0.22, 0]);
      break;
    case "house-wood":
      add(new THREE.BoxGeometry(0.7, 0.55, 0.6), mat("#D9A66B"), [0, 0.28, 0]);
      add(new THREE.ConeGeometry(0.62, 0.38, 4), mat("#D0623E"), [0, 0.74, 0], null, [0, Math.PI / 4, 0]);
      add(new THREE.CircleGeometry(0.15, 20), mat("#5A3A22"), [0, 0.22, 0.301]);
      break;
    case "house-tent":
      add(new THREE.ConeGeometry(0.55, 0.8, 4), mat("#6FB7A0"), [0, 0.4, 0], null, [0, Math.PI / 4, 0]);
      add(new THREE.ConeGeometry(0.18, 0.4, 3), mat("#2F5E52"), [0, 0.2, 0.3]);
      add(new THREE.ConeGeometry(0.06, 0.15, 4), mat("#FFD77A"), [0, 0.86, 0]);
      break;
    case "plant-pot":
      add(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 16), mat("#D9774A"), [0, 0.12, 0]);
      add(sphere(0.18), mat("#5DAA4A"), [0, 0.38, 0]);
      add(sphere(0.13), mat("#7ED06A"), [0.1, 0.5, 0.05]);
      add(sphere(0.12), mat("#6CBD58"), [-0.1, 0.48, -0.03]);
      break;
    case "plant-grass":
      for (let i = 0; i < 9; i++) add(cone(0.04, 0.3 + (i % 3) * 0.1, 6), mat(i % 2 ? "#5DAA4A" : "#7ED06A"), [Math.cos(i * 2.1) * 0.15, 0.17, Math.sin(i * 2.1) * 0.12], null, [Math.sin(i) * 0.3, 0, Math.cos(i) * 0.3]);
      break;
    case "plant-oak":
      add(capsule(0.05, 0.7), mat("#7A5434"), [0, 0.12, 0], null, [0, 0, Math.PI / 2 - 0.2]);
      add(sphere(0.16), mat("#5DAA4A"), [-0.25, 0.28, 0], [1, 0.6, 1]);
      add(sphere(0.15), mat("#6CBD58"), [0.25, 0.34, 0.05], [1, 0.6, 1]);
      add(sphere(0.06, 12), mat("#A8763C"), [0.05, 0.08, 0.1], [1, 1.3, 1]);
      break;
    case "log":
      add(new THREE.CylinderGeometry(0.2, 0.22, 0.8, 18), mat("#8B5E3C", { roughness: 0.95 }), [0, 0.2, 0], null, [0, 0, Math.PI / 2]);
      for (const x of [-0.4, 0.4]) add(new THREE.CircleGeometry(0.19, 18), mat("#C49A6C"), [x * 1.01, 0.2, 0], null, [0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0]);
      add(sphere(0.06, 8), mat("#5DAA4A"), [0.1, 0.41, 0], [1.4, 0.5, 1]);
      break;
    case "leaf":
      for (let i = 0; i < 7; i++) add(sphere(0.18, 12), mat(["#B5652E", "#D98B3A", "#C9A13A", "#9C4A24"][i % 4], { roughness: 0.9 }), [Math.cos(i * 1.7) * 0.2, 0.05 + (i % 3) * 0.03, Math.sin(i * 1.7) * 0.15], [1, 0.2, 0.7], [0, i, 0]);
      break;
    case "playground":
      for (const x of [-0.18, 0.18]) add(new THREE.BoxGeometry(0.05, 0.75, 0.05), mat("#A97C50"), [x, 0.37, 0], null, [0.15, 0, 0]);
      for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), mat("#C49A6C"), [0, 0.12 + i * 0.17, 0.02 - i * 0.025], null, [0, 0, Math.PI / 2]);
      break;
    case "bridge":
      for (let i = 0; i < 7; i++) { const t = i / 6 - 0.5; add(new THREE.BoxGeometry(0.09, 0.03, 0.3), mat(i % 2 ? "#8B5E3C" : "#A97C50"), [t * 0.9, 0.08 + (0.25 - t * t) * 0.6, 0]); }
      for (const z of [-0.15, 0.15]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), mat("#7A5434"), [-0.45, 0.06, z]);
      break;
    case "acc-ribbon": case "acc-crown": case "acc-leaf": {
      const a = buildAcc(id); a.position.set(0, 0.15, 0); a.scale.setScalar(1.6); g.add(a); break;
    }
    case "acc-scarf":
      add(new THREE.TorusGeometry(0.2, 0.06, 10, 24), mat("#E2554B"), [0, 0.12, 0], null, [Math.PI / 2, 0, 0]);
      break;
    default:
      add(sphere(0.15), mat("#cccccc"), [0, 0.15, 0]);
  }
  return g;
}

// 다 쓴 모델의 메모리를 비워요
export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); }
  });
}
