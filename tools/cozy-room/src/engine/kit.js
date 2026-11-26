// 3D 도형과 재질을 만들고, 같은 것은 다시 써서(캐시) 빠르게 만들어 주는 도구 상자예요.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const geoCache = new Map();
const matCache = new Map();
const cached = (map, key, make) => {
  if (!map.has(key)) map.set(key, make());
  return map.get(key);
};
const r3 = (n) => Math.round(n * 1000) / 1000;

// ── 도형 ──
export const rbox = (w, h, d, r = 0.04, seg = 3) =>
  cached(geoCache, `rb${r3(w)},${r3(h)},${r3(d)},${r3(r)},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)));
export const sphere = (r, ws = 24, hs = 16, ...rest) =>
  cached(geoCache, `sp${r3(r)},${ws},${hs},${rest.map(r3).join(',')}`, () => new THREE.SphereGeometry(r, ws, hs, ...rest));
export const cyl = (rt, rb, h, seg = 24, open = false) =>
  cached(geoCache, `cy${r3(rt)},${r3(rb)},${r3(h)},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
export const capsule = (r, len, cap = 6, rad = 14) =>
  cached(geoCache, `ca${r3(r)},${r3(len)},${cap},${rad}`, () => new THREE.CapsuleGeometry(r, len, cap, rad));
export const torus = (R, r, arc = Math.PI * 2, rs = 10, ts = 28) =>
  cached(geoCache, `to${r3(R)},${r3(r)},${r3(arc)},${rs},${ts}`, () => new THREE.TorusGeometry(R, r, rs, ts, arc));
export const cone = (r, h, seg = 20) => cached(geoCache, `co${r3(r)},${r3(h)},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const circle = (r, seg = 28) => cached(geoCache, `ci${r3(r)},${seg}`, () => new THREE.CircleGeometry(r, seg));
export const plane = (w, h) => cached(geoCache, `pl${r3(w)},${r3(h)}`, () => new THREE.PlaneGeometry(w, h));

// ── 재질 ── 말랑한 점토 느낌(matte), 반들반들(gloss), 유리 느낌(glass)
export function mat(color, { rough = 0.75, metal = 0, map = null, emissive = null, ei = 0, opacity = 1, side = THREE.FrontSide, key = '' } = {}) {
  const k = `m${color}${rough}${metal}${map?.uuid || ''}${emissive}${ei}${opacity}${side}${key}`;
  return cached(matCache, k, () => new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal, map,
    emissive: emissive || 0x000000, emissiveIntensity: ei,
    transparent: opacity < 1, opacity, side, depthWrite: opacity >= 0.98,
  }));
}
export function gloss(color, { rough = 0.25, clearcoat = 0.8, opacity = 1, key = '' } = {}) {
  const k = `g${color}${rough}${clearcoat}${opacity}${key}`;
  return cached(matCache, k, () => new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, clearcoat, clearcoatRoughness: 0.2,
    transparent: opacity < 1, opacity, depthWrite: opacity >= 0.98,
  }));
}
export const glass = (color) => gloss(color, { rough: 0.1, clearcoat: 1, opacity: 0.72, key: 'glass' });

// 메시 하나 만들기: add(부모, 도형, 재질, { p: [x,y,z], r: [x,y,z], s: 숫자 또는 [x,y,z] })
export function add(parent, geo, material, { p, r, s, shadow = true, receive = false, name } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  if (s != null) Array.isArray(s) ? m.scale.set(s[0], s[1], s[2]) : m.scale.setScalar(s);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  if (name) m.name = name;
  parent.add(m);
  return m;
}

export function group(parent, { p, r, s, name } = {}) {
  const g = new THREE.Group();
  if (p) g.position.set(p[0], p[1], p[2]);
  if (r) g.rotation.set(r[0], r[1], r[2]);
  if (s != null) Array.isArray(s) ? g.scale.set(s[0], s[1], s[2]) : g.scale.setScalar(s);
  if (name) g.name = name;
  parent?.add(g);
  return g;
}

// ── 그림(캔버스) 텍스처 ──
const texCache = new Map();
export function canvasTex(key, w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  return cached(texCache, key + repeat.join('x'), () => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 4;
    return t;
  });
}

export const dotsTex = (bg, dot, repeat = [3, 3]) => canvasTex(`dots${bg}${dot}`, 128, 128, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = dot;
  for (const [x, y] of [[32, 32], [96, 96]]) { g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); }
}, { repeat });

export const stripeTex = (a, b, repeat = [6, 1], vertical = true) => canvasTex(`st${a}${b}${vertical}`, 64, 64, (g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.fillStyle = b;
  if (vertical) g.fillRect(0, 0, w / 2, h); else g.fillRect(0, 0, w, h / 2);
}, { repeat });

export const checkTex = (a, b, repeat = [4, 4]) => canvasTex(`ck${a}${b}`, 64, 64, (g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.fillStyle = b; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
}, { repeat });

export function disposeAll() {
  geoCache.forEach((g) => g.dispose());
  matCache.forEach((m) => m.dispose());
  texCache.forEach((t) => t.dispose());
}
