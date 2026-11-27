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
import { VIEW_SPECIES, viewPath } from "./png.js";

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
function addFace(head, { eyeX, eyeY, eyeZ, eyeR, iris, mouthY, mouthZ, blushX, blushY, blushZ, eyeColor = "#1E1A22", smile = false, tongue = false, blushAlways = false, lineColor = "#4A2E28" }) {
  const face = { open: [], closed: [], mouth: null, blush: [], smile: null, blushAlways };
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * eyeX, eyeY, eyeZ);
    if (iris) {
      eye.add(mesh(sphere(eyeR, 16), mat(iris, { roughness: 0.3 })));
      eye.add(mesh(sphere(eyeR * 0.62, 12), mat("#1E1A22", { roughness: 0.2 }), [0, 0, eyeR * 0.45], [0.55, 1.15, 0.6]));
    } else {
      eye.add(mesh(sphere(eyeR, 16), mat(eyeColor, { roughness: 0.25 }), null, [1, 1.08, 0.75]));
    }
    eye.add(mesh(sphere(eyeR * (iris ? 0.32 : 0.24), 8), mat("#FFFFFF", { roughness: 0.1 }), [eyeR * 0.3, eyeR * 0.38, eyeR * 0.62]));
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
  // 평소 입: 작은 "w" 모양 미소 (참고 그림처럼)
  if (smile) {
    const g = new THREE.Group();
    g.position.set(0, mouthY + eyeR * 0.6, mouthZ + eyeR * 0.2);
    const lm = mat(lineColor, { roughness: 0.4 });
    for (const sx of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(eyeR * 0.62, eyeR * 0.16, 6, 12, Math.PI), lm, [sx * eyeR * 0.6, 0, 0], null, [0, 0, Math.PI]));
    if (tongue) g.add(mesh(sphere(eyeR * 0.62, 10), mat("#F08A96"), [0, -eyeR * 0.85, eyeR * 0.1], [0.85, 1, 0.45]));
    head.add(g);
    face.smile = g;
  }
  return face;
}

// ─────────────────────────────────────────────────────────────
//  강아지
// ─────────────────────────────────────────────────────────────
// 참고 그림: tools/cozy-room/art/ref-dogs.png (앞·옆·뒤·비스듬히)
const DOGS = {
  poodle: { fur: "#D9AF89", shade: "#C99C75", light: "#E8CBAA", ears: "pom", tail: "pom", curly: true, topknot: true },
  corgi: { fur: "#E5A35B", shade: "#D18E47", light: "#F8EEDF", ears: "big", tail: "stub", blaze: true, chest: true, socks: true, short: true, long: true },
  shiba: { fur: "#E3A762", shade: "#CC8D48", light: "#F7E9D3", ears: "small", tail: "curl", brows: true, chest: true, blush: true },
  golden: { fur: "#EBD3A7", shade: "#DEC192", light: "#F4E5C9", ears: "flop", tail: "plume", tongue: true },
  pomeranian: { fur: "#E3B07D", shade: "#D29D68", light: "#F2DAB8", ears: "tiny", tail: "fluff", mane: true },
  bichon: { fur: "#F6F3EE", shade: "#E7E2DA", light: "#FFFFFF", ears: "puff", tail: "pom", curly: true, round: true, tongue: true },
};
function buildDog(p) {
  const root = new THREE.Group();
  const fur = mat(p.fur, { roughness: 0.78 }), shade = mat(p.shade, { roughness: 0.8 }), light = mat(p.light, { roughness: 0.78 });
  const parts = { legs: [] };
  const bodyY = p.short ? 0.33 : 0.41;
  const L = p.long ? 1.25 : 1.08;          // 몸 길이
  const puff = sphere(0.062, 10);
  const fluff = (parent, c, r, n, seed, opt = {}) => {
    // 털 뭉치를 공 표면에 붙여요 (곱슬·풍성한 털)
    const rnd = rng(1000 + seed * 97);
    const c0 = Math.cos(opt.ph0 ?? 0.15), c1 = Math.cos((opt.ph0 ?? 0.15) + (opt.phSpan ?? 2.5));
    for (let i = 0; i < n; i++) {
      // 공 표면에 고르게 흩어 놓아요 (줄지어 보이지 않게)
      const th = rnd() * Math.PI * 2, ph = Math.acos(c0 + (c1 - c0) * rnd());
      const pt = onEllipsoid(c, r.clone().multiplyScalar(0.95), th, ph);  // 반쯤 묻혀서 부드럽게
      if (opt.skip && opt.skip(pt)) continue;
      const k = (opt.size ?? 1) * (0.75 + rnd() * 0.5);
      parent.add(mesh(puff, rnd() < 0.75 ? fur : shade, pt.toArray(), [k, k, k]));
    }
  };
  // 몸 (통통하게)
  const body = mesh(sphere(0.36), fur, [0, bodyY, -0.04], [0.98, 0.86, L]);
  root.add(body); parts.body = body;
  if (p.chest) root.add(mesh(sphere(0.25), light, [0, bodyY + 0.02, 0.2], [0.82, 0.9, 0.62]));
  if (p.curly) fluff(root, V(0, bodyY, -0.04), V(0.34, 0.3, 0.37 * L), 46, 1);
  if (p.mane) {
    root.add(mesh(sphere(0.4), fur, [0, bodyY + 0.12, 0.08], [1.18, 1.02, 1.05]));
    root.add(mesh(sphere(0.3), light, [0, bodyY + 0.06, 0.26], [1, 0.95, 0.7]));
    fluff(root, V(0, bodyY + 0.12, 0.08), V(0.45, 0.39, 0.41), 44, 3, { size: 1.15 });
  }
  // 다리 (짧고 통통하게)
  const hip = bodyY - 0.08;
  for (const [x, z] of [[-0.17, 0.2], [0.17, 0.2], [-0.17, -0.22 * L], [0.17, -0.22 * L]]) {
    const leg = new THREE.Group();
    leg.position.set(x, hip, z);
    const len = Math.max(0.02, hip - 0.12);
    leg.add(mesh(capsule(0.1, len), fur, [0, -len / 2 - 0.04, 0]));
    leg.add(mesh(sphere(0.105, 12), p.socks ? light : fur, [0, -hip + 0.065, 0.02], [1, 0.68, 1.15]));
    if (p.curly || p.mane) for (let k = 0; k < 5; k++) leg.add(mesh(puff, k % 2 ? fur : shade, [Math.cos(k * 1.3) * 0.09, -hip * 0.45 - (k % 2) * 0.05, Math.sin(k * 1.3) * 0.09]));
    root.add(leg); parts.legs.push(leg);
  }
  // 꼬리
  const tail = new THREE.Group();
  tail.position.set(0, bodyY + 0.1, -0.36 * L);
  if (p.tail === "curl") { tail.add(mesh(new THREE.TorusGeometry(0.11, 0.07, 10, 20, Math.PI * 1.7), fur, [0, 0.16, 0.04], null, [0, Math.PI / 2, 0.4])); tail.add(mesh(sphere(0.06, 10), light, [0, 0.2, 0.15])); }
  else if (p.tail === "stub") tail.add(mesh(sphere(0.075, 12), fur, [0, 0.03, -0.02], [1, 1.2, 1]));
  else if (p.tail === "pom") { tail.add(mesh(capsule(0.04, 0.14), fur, [0, 0.08, -0.04], null, [-0.6, 0, 0])); tail.add(mesh(sphere(0.12, 14), fur, [0, 0.2, -0.1])); fluff(tail, V(0, 0.2, -0.1), V(0.1, 0.1, 0.1), 7, 2, { size: 0.8 }); }
  else if (p.tail === "fluff") { tail.add(mesh(sphere(0.2), fur, [0, 0.16, 0.06], [0.9, 0.8, 1.1])); fluff(tail, V(0, 0.16, 0.06), V(0.17, 0.14, 0.2), 12, 5); }
  else tail.add(mesh(tube([V(0, 0, 0), V(0, 0.12, -0.12), V(0, 0.3, -0.18), V(0, 0.42, -0.12)], 0.06), fur));
  root.add(tail); parts.tail = tail;
  // 머리 (크게)
  const head = new THREE.Group();
  head.position.set(0, bodyY + 0.37, 0.2);
  const HR = p.round ? 0.43 : 0.4;
  head.add(mesh(sphere(HR), fur, null, [1.06, 0.96, 0.96]));
  const fz = HR * 0.96;   // 얼굴 앞면
  // 주둥이·무늬
  head.add(mesh(sphere(0.15), p.curly ? fur : light, [0, -0.11, fz - 0.07], [1.3, 0.78, 0.82]));
  if (p.blaze) head.add(mesh(capsule(0.05, 0.2), light, [0, 0.07, fz - 0.035], [1, 1, 0.6], [0.25, 0, 0]));
  if (p.chest) head.add(mesh(sphere(0.22), light, [0, -0.2, fz - 0.16], [1.25, 0.6, 0.8]));
  if (p.brows) for (const sx of [-1, 1]) head.add(mesh(sphere(0.035, 10), light, [sx * 0.13, 0.13, fz - 0.03], [1.2, 0.8, 0.6]));
  head.add(mesh(sphere(0.04, 12), mat("#3B2622", { roughness: 0.3 }), [0, -0.075, fz + 0.035], [1.35, 0.95, 0.85]));
  // 귀
  const ears = [];
  const pink = mat("#F2B3AB");
  for (const s of [-1, 1]) {
    let ear;
    if (p.ears === "flop") ear = mesh(sphere(0.15), shade, [s * 0.38, -0.02, -0.02], [0.55, 1.3, 0.85], [0, 0, s * 0.18]);
    if (p.ears === "pom") ear = mesh(sphere(0.17), fur, [s * 0.39, -0.08, -0.03], [0.75, 1.15, 0.9]);
    if (p.ears === "puff") ear = mesh(sphere(0.15), fur, [s * 0.4, -0.04, -0.02], [0.75, 1.05, 0.9]);
    if (p.ears === "big") ear = mesh(cone(0.14, 0.3), fur, [s * 0.22, 0.4, -0.05], null, [0, 0, -s * 0.3]);
    if (p.ears === "small") ear = mesh(cone(0.11, 0.2, 12), fur, [s * 0.22, 0.36, -0.03], null, [0, 0, -s * 0.32]);
    if (p.ears === "tiny") ear = mesh(cone(0.08, 0.14, 12), fur, [s * 0.18, 0.37, -0.02], null, [0, 0, -s * 0.28]);
    head.add(ear); ears.push(ear);
    if (p.ears === "big" || p.ears === "small" || p.ears === "tiny") {
      const sc = p.ears === "big" ? 1 : p.ears === "small" ? 0.7 : 0.5;
      head.add(mesh(cone(0.085 * sc, 0.2 * sc, 12), pink, [s * (p.ears === "big" ? 0.215 : 0.21), (p.ears === "big" ? 0.39 : 0.36), (p.ears === "big" ? 0.0 : 0.01)], null, [0, 0, -s * 0.3]));
    }
    if (p.ears === "pom" || p.ears === "puff") fluff(head, V(s * 0.4, -0.06, -0.03), V(0.12, 0.17, 0.13), 8, s + 3, { size: 0.85 });
  }
  parts.ears = ears;
  if (p.topknot) { head.add(mesh(sphere(0.2), fur, [0, 0.33, -0.02], [1.25, 0.8, 1.05])); fluff(head, V(0, 0.33, -0.02), V(0.22, 0.15, 0.18), 12, 4); }
  // 곱슬 털 (얼굴은 비워요)
  if (p.curly) fluff(head, V(0, 0, 0), V(HR * 0.98, HR * 0.94, HR * 0.94), 34, 2, { ph0: 0.1, phSpan: 1.9, skip: (pt) => pt.z > HR * 0.3 && pt.y < HR * 0.55 });
  if (p.mane) fluff(head, V(0, -0.05, -0.02), V(HR * 1.05, HR * 0.9, HR * 0.9), 18, 6, { ph0: 0.9, phSpan: 1.6, skip: (pt) => pt.z > HR * 0.3 });
  parts.face = addFace(head, {
    eyeX: 0.155, eyeY: 0.03, eyeZ: fz - 0.03, eyeR: 0.046, eyeColor: "#3A2723",
    mouthY: -0.19, mouthZ: fz - 0.02, blushX: 0.25, blushY: -0.08, blushZ: fz - 0.12,
    smile: true, tongue: !!p.tongue, blushAlways: !!p.blush,
  });
  root.add(head); parts.head = head;
  parts.headAnchor = V(0, HR, 0);
  return { root, parts, kind: "dog" };
}

// ─────────────────────────────────────────────────────────────
//  고양이
// ─────────────────────────────────────────────────────────────
// 참고 그림: tools/cozy-room/art/ref-cats.png (앞·옆·뒤·비스듬히)
const CATS = {
  cheese: { fur: "#F0B06B", accent: "#D6864A", white: "#FFF5E8", kind: "stripes", muzzle: true, chest: true, paws: true },
  calico: { fur: "#FFF8EF", kind: "calico", muzzle: true },
  mackerel: { fur: "#ACACA9", accent: "#707074", white: "#EEE8DE", kind: "stripes", muzzle: true, chest: true, paws: true },
  blackcat: { fur: "#3A363C", iris: "#E8D27C" },
  russianblue: { fur: "#8FA4AD" },
  tuxedo: { fur: "#3A363C", white: "#FFFFFF", muzzle: true, chest: true, paws: true, tailTip: true, iris: "#E8D27C" },
};
// 고양이 무늬 그림 (공의 무늬: 가로 0~256 = 오른쪽→앞→왼쪽→뒤, 세로 0 = 위)
function catTexture(p, part) {
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 128;
  const c = cv.getContext("2d");
  c.fillStyle = p.fur; c.fillRect(0, 0, 256, 128);
  const blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); if (x - rx < 0) { c.beginPath(); c.ellipse(x + 256, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); } };
  if (p.kind === "stripes") {
    c.strokeStyle = p.accent; c.lineCap = "round"; c.lineWidth = 7;
    if (part === "body") for (let i = 0; i < 9; i++) { const x = 140 + i * 13; c.beginPath(); c.moveTo(x, 6); c.lineTo(x + 2, 58); c.stroke(); }
    if (part === "body") for (const x of [10, 24, 104, 118]) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x + 3, 62); c.stroke(); }
    if (part === "head") { c.lineWidth = 6; for (const x of [56, 64, 72]) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x, 26); c.stroke(); } for (const x of [10, 20, 108, 118]) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + 2, 60); c.stroke(); } }
    if (part === "tail") { c.lineWidth = 10; for (let i = 0; i < 6; i++) { const x = 30 + i * 38; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); } }
  }
  if (p.kind === "calico") {
    const brown = "#6E5B4E", orange = "#E3A24C";
    if (part === "head") { blob(26, 22, 44, 34, brown); blob(104, 20, 34, 26, orange); }
    if (part === "body") { blob(200, 22, 50, 26, brown); blob(132, 48, 30, 20, orange); blob(14, 58, 18, 14, brown); blob(176, 70, 16, 12, orange); }
    if (part === "tail") { c.fillStyle = orange; c.fillRect(0, 0, 150, 128); c.fillStyle = brown; c.fillRect(150, 0, 106, 128); }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
function buildCat(p) {
  const root = new THREE.Group();
  const parts = { legs: [] };
  const R = 0.82;
  const texMat = (part) => (p.kind ? new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: R, map: catTexture(p, part) }) : mat(p.fur, { roughness: R }));
  const plain = mat(p.fur, { roughness: R });
  const white = mat(p.white || "#FFFFFF", { roughness: R });
  const bodyY = 0.4;
  const body = mesh(sphere(0.34), texMat("body"), [0, bodyY, -0.04], [0.95, 0.86, 1.18]);
  root.add(body); parts.body = body;
  if (p.chest) root.add(mesh(sphere(0.22), white, [0, bodyY + 0.02, 0.2], [0.8, 0.95, 0.6]));
  const hip = bodyY - 0.08;
  for (const [x, z] of [[-0.15, 0.19], [0.15, 0.19], [-0.15, -0.24], [0.15, -0.24]]) {
    const leg = new THREE.Group();
    leg.position.set(x, hip, z);
    const len = hip - 0.12;
    const legMat = p.kind === "calico" ? white : plain;
    leg.add(mesh(capsule(0.09, len), legMat, [0, -len / 2 - 0.04, 0]));
    leg.add(mesh(sphere(0.095, 12), p.paws ? white : legMat, [0, -hip + 0.06, 0.02], [1, 0.68, 1.15]));
    root.add(leg); parts.legs.push(leg);
  }
  // 꼬리 (위로 감아 올림)
  const tail = new THREE.Group();
  tail.position.set(0, bodyY + 0.06, -0.38);
  const tailPts = [V(0, 0, 0), V(0, 0.16, -0.12), V(0, 0.38, -0.14), V(0, 0.52, -0.04)];
  tail.add(mesh(tube(tailPts, 0.06), texMat("tail")));
  tail.add(mesh(sphere(0.06, 12), p.tailTip ? white : p.kind === "calico" ? mat("#6E5B4E", { roughness: R }) : p.kind === "stripes" ? mat(p.accent, { roughness: R }) : plain, tailPts[3].toArray()));
  root.add(tail); parts.tail = tail;
  // 머리 (크게)
  const head = new THREE.Group();
  head.position.set(0, bodyY + 0.36, 0.2);
  const HR = 0.38;
  head.add(mesh(sphere(HR), texMat("head"), null, [1.1, 0.95, 0.97]));
  const fz = HR * 0.96;
  const pink = mat("#F2AEB2");
  const earCol = (s) => (p.kind === "calico" ? mat(s < 0 ? "#6E5B4E" : "#E3A24C", { roughness: R }) : plain);
  for (const s of [-1, 1]) {
    head.add(mesh(cone(0.16, 0.3, 4), earCol(s), [s * 0.235, 0.34, -0.03], null, [0, Math.PI / 4, -s * 0.3]));
    head.add(mesh(cone(0.1, 0.2, 4), pink, [s * 0.23, 0.33, 0.02], null, [0, Math.PI / 4, -s * 0.3]));
  }
  parts.ears = [];
  if (p.muzzle) {
    head.add(mesh(sphere(0.13), white, [0, -0.12, fz - 0.06], [1.3, 0.78, 0.62]));
  }
  head.add(mesh(sphere(0.03, 10), mat("#E8939A"), [0, -0.07, fz + 0.02], [1.3, 0.85, 0.8]));
  parts.face = addFace(head, {
    eyeX: 0.155, eyeY: 0.02, eyeZ: fz - 0.04, eyeR: p.iris ? 0.065 : 0.048, iris: p.iris, eyeColor: "#3A2723",
    mouthY: -0.17, mouthZ: fz - 0.02, blushX: 0.25, blushY: -0.08, blushZ: fz - 0.12,
    smile: true, lineColor: p.fur === "#3A363C" && !p.muzzle ? "#8A8290" : "#4A2E28",
  });
  root.add(head); parts.head = head;
  parts.headAnchor = V(0, HR, 0);
  return { root, parts, kind: "cat" };
}

// ─────────────────────────────────────────────────────────────
//  곤충 (딱정벌레)
// ─────────────────────────────────────────────────────────────
// 참고 그림: tools/cozy-room/art/ref-bugs.png (앞·옆·뒤·비스듬히)
// 큰 동그란 머리에 눈이 있고, 큰턱·뿔이 머리 위로 솟은 귀여운 캐릭터 모양이에요.
const BUGS = {
  stag: { body: "#B8875E", head: "#C49770", jaw: "#7C5A45", jawType: "stag" },
  rhino: { body: "#7B3F2C", head: "#8A4A35", jaw: "#7B3F2C", horn: true },
  wide: { body: "#5E4E42", head: "#857160", jaw: "#6E5B4C", jawType: "wide", arms: true, snout: true, wide: true },
  saw: { body: "#8A4632", head: "#9A5340", jaw: "#6E4235", jawType: "saw", arms: true, snout: true },
  king: { body: "#58504C", head: "#665D58", jaw: "#5B4A40", jawType: "king" },
  chafer: { body: "#F2B07A", legs: "#5B4FA8", chafer: true },
};
function chaferTexture() {
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 128;
  const c = cv.getContext("2d");
  const g = c.createLinearGradient(0, 0, 256, 0);
  [["#7FD3C8", 0], ["#F4C46A", 0.2], ["#F08C78", 0.42], ["#7FD3C8", 0.6], ["#F4C46A", 0.8], ["#F08C78", 1]].forEach(([col, t]) => g.addColorStop(t, col));
  c.fillStyle = g; c.fillRect(0, 0, 256, 128);
  const r = rng(11);
  for (let k = 0; k < 16; k++) {
    c.fillStyle = k % 3 ? "#6E63C7" : "#3FA9A0";
    c.beginPath(); c.arc(r() * 256, 12 + r() * 70, 7 + r() * 7, 0, Math.PI * 2); c.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
function buildBug(p) {
  const root = new THREE.Group();
  const parts = { legs: [], antennae: [] };
  const R = 0.72;
  const shell = p.chafer ? new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.6, map: chaferTexture() }) : mat(p.body, { roughness: R });
  const headMat = p.chafer ? shell : mat(p.head, { roughness: R });
  const jaw = mat(p.jaw || p.body, { roughness: R });
  const legMat = mat(p.legs || p.jaw || p.body, { roughness: R });
  const line = mat("#2E2320", { roughness: 0.5 });
  const W = p.wide ? 1.1 : 1;
  // 몸 (딱지날개): 머리 뒤에 동그랗게
  const bodyC = V(0, 0.34, -0.14);
  const bodyR = p.chafer ? V(0.36, 0.3, 0.4) : V(0.31 * W, 0.28, 0.34);
  const body = mesh(sphere(1), shell, bodyC.toArray(), bodyR.toArray());
  root.add(body); parts.body = body;
  // 딱지날개 가운데 선 (뒤에서 보여요)
  const seam = [];
  for (let k = 0; k <= 10; k++) { const ph = 0.25 + (k / 10) * 1.55; seam.push(onEllipsoid(bodyC, bodyR.clone().multiplyScalar(1.005), -Math.PI / 2, ph)); }
  if (!p.chafer) root.add(mesh(tube(seam, 0.007, 20), line));
  // 머리: 크고 동그랗게, 앞을 봐요
  const head = new THREE.Group();
  head.position.set(0, p.chafer ? 0.3 : 0.44, p.chafer ? 0.16 : 0.12);
  const HR = p.chafer ? 0.2 : 0.25;
  head.add(mesh(sphere(HR), headMat, null, [1.08 * W, 0.95, 0.92]));
  const fz = HR * 0.9;
  for (const sx of [-1, 1]) {
    head.add(mesh(sphere(0.032, 12), mat("#2A1F1C", { roughness: 0.25 }), [sx * 0.1, 0.0, fz], [1, 1.1, 0.7]));
    head.add(mesh(sphere(0.009, 6), mat("#FFFFFF"), [sx * 0.1 + 0.01, 0.013, fz + 0.022]));
  }
  if (p.snout) head.add(mesh(sphere(0.1), mat(p.head, { roughness: R }), [0, -0.07, fz - 0.01], [1.25, 0.7, 0.8]));
  // 큰턱 (머리 위로 솟은 사슴뿔 모양)
  const J = {
    stag: [[0.11, 0.17, 0.0], [0.18, 0.3, 0.02], [0.18, 0.42, 0.0], [0.1, 0.5, -0.02]],
    wide: [[0.12, 0.16, 0.0], [0.17, 0.27, 0.0], [0.15, 0.36, -0.01], [0.09, 0.4, -0.02]],
    saw: [[0.11, 0.17, 0.0], [0.2, 0.3, 0.03], [0.2, 0.44, 0.01], [0.11, 0.52, -0.02]],
    king: [[0.12, 0.17, 0.0], [0.19, 0.3, 0.01], [0.17, 0.42, -0.01], [0.1, 0.47, -0.02]],
  }[p.jawType];
  if (J) {
    const r0 = p.jawType === "king" ? 0.062 : p.jawType === "wide" ? 0.058 : 0.052;
    for (const sx of [-1, 1]) {
      const pts = J.map(([x, y, z]) => V(sx * x * W, y, z));
      head.add(mesh(tube(pts, r0, 20), jaw));
      head.add(mesh(sphere(r0 * 1.05, 10), jaw, pts[pts.length - 1].toArray()));
      const curve = new THREE.CatmullRomCurve3(pts);
      const teeth = p.jawType === "saw" ? [0.35, 0.55, 0.75] : p.jawType === "stag" ? [0.6] : p.jawType === "king" ? [0.5] : [0.55];
      for (const t of teeth) {
        const pt = curve.getPoint(t);
        // 안쪽으로 비스듬히 솟은 가지 돌기
        head.add(mesh(cone(p.jawType === "king" ? 0.04 : 0.032, 0.12, 8), jaw, [pt.x - sx * 0.05, pt.y + 0.03, pt.z], null, [0, 0, sx * Math.PI * 0.3]));
      }
    }
  }
  // 장수풍뎅이 뿔 (위로 길게, 끝이 갈라져요)
  if (p.horn) {
    const hp = [V(0, 0.18, 0.02), V(0, 0.34, 0.04), V(0, 0.48, 0.0)];
    head.add(mesh(tube(hp, 0.065, 16), jaw));
    head.add(mesh(sphere(0.06, 10), jaw, [0, 0.49, 0.0]));
    for (const sx of [-1, 1]) {
      head.add(mesh(tube([V(0, 0.48, 0.0), V(sx * 0.06, 0.56, 0.0), V(sx * 0.08, 0.63, -0.01)], 0.035, 8), jaw));
      head.add(mesh(sphere(0.035, 8), jaw, [sx * 0.08, 0.63, -0.01]));
      head.add(mesh(tube([V(0, 0.38, 0.01), V(sx * 0.06, 0.43, 0.02)], 0.026, 6), jaw));
    }
    head.add(mesh(tube([V(0, 0.5, 0.0), V(0, 0.6, 0.0), V(0, 0.66, -0.01)], 0.03, 6), jaw));
  }
  // 꽃무지 더듬이 (보라색, 끝이 동그래요)
  if (p.chafer) {
    for (const sx of [-1, 1]) {
      const a = new THREE.Group();
      a.position.set(sx * 0.07, 0.12, 0.08);
      a.add(mesh(tube([V(0, 0, 0), V(sx * 0.03, 0.08, 0.02), V(sx * 0.07, 0.15, 0.0)], 0.018, 8), legMat));
      a.add(mesh(sphere(0.035, 10), legMat, [sx * 0.07, 0.16, 0.0]));
      head.add(a); parts.antennae.push(a);
    }
  }
  root.add(head); parts.head = head;
  // 다리 6개 (짧고 통통하게)
  const legY = 0.16;
  [[0.1, 0.5], [-0.1, 0.0], [-0.28, -0.5]].forEach(([z, out]) => {
    for (const sx of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * 0.17 * W, legY, z);
      leg.add(mesh(capsule(0.05, 0.08), legMat, [sx * 0.015, -0.07, 0.0], null, [0, 0, sx * (0.12 + out * 0.05)]));
      leg.add(mesh(sphere(0.055, 10), legMat, [sx * 0.025, -0.135, 0.015], [1, 0.7, 1.2]));
      root.add(leg); parts.legs.push(leg);
    }
  });
  // 앞으로 뻗은 앞다리 (넓적사슴벌레·톱사슴벌레)
  if (p.arms) {
    for (const sx of [-1, 1]) {
      root.add(mesh(capsule(0.04, 0.12), legMat, [sx * 0.33 * W, 0.34, 0.12], null, [0.3, 0, sx * 1.1]));
      for (const k of [-1, 0, 1]) root.add(mesh(cone(0.018, 0.06, 6), legMat, [sx * (0.43 * W), 0.37 + k * 0.025, 0.14], null, [0, 0, -sx * Math.PI / 2]));
    }
  }
  parts.face = null;
  parts.headAnchor = V(0, 0.12, -0.12);
  parts.accPos = V(0, head.position.y + (p.horn || J ? 0.25 : HR), head.position.z - 0.02);
  root.scale.setScalar(1.15);
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
// ─────────────────────────────────────────────────────────────
//  그림으로 보여 주는 반려동물 (방향별 그림 4장)
//  카메라가 반려동물을 어느 쪽에서 보는지 계산해서 앞·비스듬히·옆·뒤 그림을 골라요.
//  왼쪽을 보는 그림을 좌우로 뒤집으면 오른쪽에서 본 모습이 돼요.
//  움직임은 그림 전체를 통통 튀기고, 눌렀다 펴고, 기울여서 표현해요.
// ─────────────────────────────────────────────────────────────
const texCache = new Map();
const texLoader = new THREE.TextureLoader();
function viewTexture(id, view) {
  const key = `${id}-${view}`;
  if (!texCache.has(key)) {
    const t = texLoader.load(viewPath(id, view));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    texCache.set(key, t);
  }
  return texCache.get(key);
}
let blobTex = null;
function shadowTexture() {
  if (blobTex) return blobTex;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const c = cv.getContext("2d");
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(60,40,40,0.35)"); g.addColorStop(1, "rgba(60,40,40,0)");
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(cv);
  return blobTex;
}
const tmpV = new THREE.Vector3();
function buildSpritePet(id, kind, opts) {
  const group = new THREE.Group();
  group.userData.kind = kind;
  const root = new THREE.Group();          // 움직임은 이 묶음을 움직여요
  group.add(root);
  const H = kind === "bug" ? 1.05 : 1.2;   // 그림 한 변의 길이 (기본 도형 모델과 비슷한 키)
  const tex = { front: viewTexture(id, "front"), side: viewTexture(id, "side"), back: viewTexture(id, "back"), q: viewTexture(id, "q") };
  const material = new THREE.MeshBasicMaterial({ map: tex.front, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, toneMapped: false });
  const yaw = new THREE.Group();            // 늘 카메라 쪽을 보게 돌려요
  root.add(yaw);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(H, H).translate(0, H * 0.47, 0), material);
  yaw.add(plane);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(H * 0.32, 24), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  shadow.scale.set(1.15, 0.8, 1);
  shadow.raycast = () => {};
  group.add(shadow);
  plane.onBeforeRender = (renderer, scene, camera) => {
    // 반려동물 기준으로 카메라가 어느 쪽에 있는지 (0 = 정면, + = 반려동물의 왼쪽)
    camera.getWorldPosition(tmpV);
    root.worldToLocal(tmpV);
    const a = Math.atan2(tmpV.x, tmpV.z);
    const d = Math.abs(a) * 180 / Math.PI;
    const view = d < 24 ? "front" : d < 66 ? "q" : d < 128 ? "side" : "back";
    material.map = tex[view];
    plane.scale.x = a < 0 && view !== "front" && view !== "back" ? -1 : 1;
    yaw.rotation.y = a;
    yaw.updateMatrixWorld(true);
  };
  // 장식은 머리 위쯤에 달아요
  const head = new THREE.Group();
  head.position.set(0, H * (kind === "bug" ? 0.62 : 0.72), 0.05);
  root.add(head);
  if (opts.acc === "acc-scarf" && kind !== "bug") {
    root.add(mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 24), mat("#E2554B"), [0, H * 0.42, 0.04], [1, 1, 0.8], [Math.PI / 2, 0, 0]));
  } else if (opts.acc && opts.acc !== "acc-scarf") {
    const acc = buildAcc(opts.acc);
    acc.position.set(0, kind === "bug" ? 0.12 : 0.18, 0);
    head.add(acc);
  }
  let mood = "idle";
  function setMood(m) { mood = m; }
  function update(dt, time, action) {
    const a = action ? action.name : "idle";
    const k = action ? action.t : 0;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    const breathe = Math.sin(time * 2.2) * 0.012;
    let sx = 1 - breathe * 0.5, sy = 1 + breathe;
    shadow.scale.set(1.15, 0.8, 1);
    switch (a) {
      case "eat":
      case "drink": {
        // 고개 숙여 냠냠: 꾸벅꾸벅 눌렸다 펴져요
        const nod = Math.abs(Math.sin(time * (a === "eat" ? 10 : 7)));
        sy = 0.94 + nod * 0.05; sx = 1.03 - nod * 0.03;
        root.position.z = 0.03;
        break;
      }
      case "pet": {
        const sq = Math.sin(k * 10) * 0.06;
        sx = 1 + sq; sy = 1 - sq;
        root.rotation.z = Math.sin(time * 3) * 0.06;
        break;
      }
      case "ball":
      case "jump":
      case "pounce": {
        const hop = Math.abs(Math.sin(k * (a === "pounce" ? 5 : 7)));
        root.position.y = hop * (a === "jump" ? 0.45 : 0.3);
        sy = 1 + hop * 0.06; sx = 1 - hop * 0.04;
        if (a === "ball") root.rotation.y = Math.sin(k * 4) * 0.8;
        shadow.scale.set(1.15 * (1 - hop * 0.3), 0.8 * (1 - hop * 0.3), 1);
        break;
      }
      case "walk": {
        // 방 안을 동그랗게 돌아요 (보는 방향이 바뀌면 그림도 바뀌어요)
        const ang = k * 2.2;
        root.position.set(Math.sin(ang) * 0.9, Math.abs(Math.sin(time * 10)) * 0.05, Math.cos(ang) * 0.5 - 0.5);
        root.rotation.y = ang + Math.PI / 2;
        root.rotation.z = Math.sin(time * 10) * 0.04;
        shadow.position.set(root.position.x, 0.005, root.position.z);
        break;
      }
      case "trot": {
        root.position.y = Math.abs(Math.sin(time * 10)) * 0.045;
        root.rotation.z = Math.sin(time * 10) * 0.035;
        break;
      }
      case "observe": {
        root.rotation.y = k * 1.6;   // 천천히 한 바퀴: 여러 방향 그림이 차례로 보여요
        break;
      }
      default:
        root.rotation.z = Math.sin(time * 0.9) * 0.015;
    }
    if (a !== "walk") shadow.position.set(0, 0.005, 0);
    root.scale.set(sx, sy, sx);
  }
  return { group, setMood, update, kind, sprite: true };
}

export function buildPet(id, opts = {}) {
  const kindOf = DOGS[id] ? "dog" : CATS[id] ? "cat" : "bug";
  if (VIEW_SPECIES.includes(id) && !opts.model) return buildSpritePet(id, kindOf, opts);
  let built;
  if (DOGS[id]) built = buildDog(DOGS[id]);
  else if (CATS[id]) built = buildCat(CATS[id]);
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
    if (kind === "bug") acc.position.copy(parts.accPos || V(0, 0.48, 0.36));
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
    if (f.smile) f.smile.visible = !f.mouth.visible;
    f.blush.forEach((b) => { b.visible = f.blushAlways || m === "happy" || m === "eat" || m === "wow"; });
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
