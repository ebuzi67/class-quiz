// 화장품·소품 모양 만들기. 모든 물건은 바닥 가운데가 (0,0,0)이고 위로 서 있어요.
import * as THREE from 'three';
import { add, group, cyl, sphere, rbox, torus, capsule, mat, gloss, glass, stripeTex } from './kit.js';

export function buildProduct(p) {
  const g = new THREE.Group();
  g.name = 'product-' + p.id;
  const body = p.color, cap = p.cap;
  const label = mat('#ffffff', { rough: 0.6 });
  switch (p.shape) {
    case 'bottle':
      add(g, cyl(0.04, 0.042, 0.12, 20), glass(body), { p: [0, 0.06, 0] });
      add(g, cyl(0.041, 0.041, 0.04, 20, true), label, { p: [0, 0.06, 0] });
      add(g, cyl(0.022, 0.022, 0.025, 14), mat(cap), { p: [0, 0.13, 0] });
      add(g, sphere(0.024, 12, 8), gloss(cap), { p: [0, 0.148, 0], s: [1, 0.6, 1] });
      break;
    case 'dropper':
      add(g, cyl(0.034, 0.036, 0.09, 18), glass(body), { p: [0, 0.045, 0] });
      add(g, cyl(0.02, 0.022, 0.025, 14), gloss('#f2f2f2'), { p: [0, 0.102, 0] });
      add(g, sphere(0.02, 12, 10), gloss(cap), { p: [0, 0.128, 0], s: [1, 1.3, 1] });
      break;
    case 'jar':
      add(g, cyl(0.055, 0.055, 0.05, 24), gloss(body), { p: [0, 0.025, 0] });
      add(g, cyl(0.058, 0.058, 0.026, 24), gloss(cap), { p: [0, 0.062, 0] });
      add(g, sphere(0.014, 10, 8), mat('#ffffff'), { p: [0, 0.078, 0] });
      break;
    case 'tube':
      add(g, cyl(0.026, 0.026, 0.03, 16), gloss(cap), { p: [0, 0.015, 0] });
      add(g, cyl(0.048, 0.034, 0.12, 18), gloss(body), { p: [0, 0.09, 0], s: [1, 1, 0.55] });
      add(g, rbox(0.1, 0.014, 0.03, 0.006), gloss(body), { p: [0, 0.152, 0] });
      add(g, cyl(0.049, 0.045, 0.03, 18, true), label, { p: [0, 0.1, 0], s: [1, 1, 0.56] });
      break;
    case 'stick':
      add(g, cyl(0.018, 0.018, 0.06, 14), gloss(body), { p: [0, 0.03, 0] });
      add(g, cyl(0.019, 0.019, 0.04, 14), gloss(cap), { p: [0, 0.08, 0] });
      add(g, sphere(0.019, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gloss(cap), { p: [0, 0.1, 0] });
      break;
    case 'compact':
      add(g, cyl(0.045, 0.045, 0.02, 24), gloss(cap, { rough: 0.3 }), { p: [0, 0.01, 0] });
      add(g, cyl(0.036, 0.036, 0.006, 24), mat(body, { rough: 0.9 }), { p: [0, 0.022, 0] });
      add(g, sphere(0.012, 10, 8), mat('#ffffff'), { p: [0.018, 0.026, 0.01], s: [1, 0.4, 1] });
      break;
    case 'comb': {
      // 세워서 들고 있어요 (손잡이가 아래)
      add(g, rbox(0.03, 0.16, 0.014, 0.007), gloss(body), { p: [-0.012, 0.08, 0] });
      for (let i = 0; i < 8; i++) add(g, rbox(0.03, 0.008, 0.008, 0.003), gloss(body), { p: [0.016, 0.03 + i * 0.016, 0], shadow: false });
      break;
    }
    case 'toothbrush':
      add(g, capsule(0.009, 0.15, 4, 8), gloss(body), { p: [0, 0.085, 0] });
      add(g, rbox(0.022, 0.035, 0.018, 0.006), mat('#ffffff', { rough: 0.9 }), { p: [0, 0.16, 0.014] });
      add(g, rbox(0.012, 0.032, 0.012, 0.004), mat('#9fe3ff'), { p: [0, 0.16, 0.026], shadow: false });
      break;
    case 'pouch':
      add(g, rbox(0.1, 0.13, 0.016, 0.008), mat(body, { map: stripeTex(body, cap, [3, 1]), rough: 0.5 }), { p: [0, 0.065, 0] });
      add(g, rbox(0.104, 0.012, 0.018, 0.004), mat('#ffffff'), { p: [0, 0.122, 0] });
      break;
    case 'book': {
      const closed = group(g, { name: 'closed' });
      add(closed, rbox(0.12, 0.16, 0.034, 0.008), mat(body, { rough: 0.6 }), { p: [0, 0.08, 0] });
      add(closed, rbox(0.11, 0.15, 0.03, 0.004), mat(cap), { p: [0.008, 0.08, 0] });
      add(closed, sphere(0.022, 12, 8), mat('#ff9db1'), { p: [0, 0.1, 0.018], s: [1, 1, 0.3] });
      const open = group(g, { name: 'open' });
      open.visible = false;
      for (const side of [-1, 1]) {
        const page = group(open, { p: [0, 0.08, 0], r: [0, side * 0.45, 0] });
        add(page, rbox(0.12, 0.16, 0.012, 0.005), mat(body, { rough: 0.6 }), { p: [side * 0.06, 0, -0.004] });
        add(page, rbox(0.11, 0.15, 0.012, 0.004), mat(cap), { p: [side * 0.058, 0, 0.004] });
        add(page, rbox(0.06, 0.008, 0.002, 0.001), mat('#c9b6ff'), { p: [side * 0.06, 0.03, 0.011], shadow: false });
        add(page, rbox(0.07, 0.008, 0.002, 0.001), mat('#c9b6ff'), { p: [side * 0.06, 0.0, 0.011], shadow: false });
      }
      break;
    }
    case 'cup':
      add(g, cyl(0.045, 0.032, 0.05, 20, true), gloss(body, { key: 'cup' }), { p: [0, 0.027, 0] }).material.side = THREE.DoubleSide;
      add(g, cyl(0.032, 0.032, 0.006, 20), gloss(body), { p: [0, 0.004, 0] });
      add(g, cyl(0.041, 0.041, 0.006, 20), mat('#c98f5a', { rough: 0.3 }), { p: [0, 0.042, 0] });
      add(g, cyl(0.046, 0.044, 0.012, 20, true), gloss(cap), { p: [0, 0.046, 0] });
      add(g, torus(0.016, 0.005, Math.PI * 1.3), gloss(body), { p: [0.046, 0.028, 0], r: [0, 0, -Math.PI * 0.65] });
      break;
    case 'can': {
      add(g, cyl(0.06, 0.065, 0.1, 22), gloss(body), { p: [0, 0.05, 0] });
      add(g, cyl(0.062, 0.062, 0.012, 22), gloss(cap), { p: [0, 0.1, 0] });
      const spout = group(g, { p: [0, 0.04, 0.05], r: [0.9, 0, 0] });
      add(spout, cyl(0.009, 0.014, 0.13, 10), gloss(body), { p: [0, 0.065, 0] });
      add(spout, cyl(0.02, 0.01, 0.02, 12), gloss(cap), { p: [0, 0.135, 0] });
      add(g, torus(0.04, 0.008, Math.PI), gloss(cap), { p: [0, 0.11, -0.02], r: [0, Math.PI / 2, 0] });
      g.userData.spout = new THREE.Vector3(0, 0.15, 0.17);
      break;
    }
    default:
      add(g, rbox(0.08, 0.1, 0.08, 0.02), mat(body), { p: [0, 0.05, 0] });
  }
  if (p.size && p.size !== 1) g.scale.setScalar(p.size);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
