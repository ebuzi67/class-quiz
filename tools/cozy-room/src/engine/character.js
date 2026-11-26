// 캐릭터 만들기와 움직임 — 2~3등신 SD 캐릭터예요.
// 뼈대: root(바닥 위치·방향) → lay(눕기) → bob(통통 튀기) → 다리 / upper(상체 → 팔, 머리)
import * as THREE from 'three';
import { add, group, sphere, capsule, cyl, rbox, torus, circle, mat, gloss, dotsTex } from './kit.js';

export const HIP = 0.3;               // 엉덩이 높이
const SHOULDER = [0.165, 0.27, 0];    // 어깨 자리 (상체 기준)
const L1 = 0.16, L2 = 0.19;           // 윗팔, 아래팔 길이
const HEAD_C = [0, 0.26, 0], HEAD_R = 0.3;

export const IDLE = {
  armLX: 0.05, armLZ: 0.2, elbowL: 0.25, armRX: 0.05, armRZ: 0.2, elbowR: 0.25,
  legL: 0, legR: 0, headX: 0, headY: 0, headZ: 0, lean: 0, twist: 0, bodyY: 0,
  lie: 0, sit: 0, gripTilt: 0, gripRoll: 0, showProduct: 1,
};
const POSE_KEYS = Object.keys(IDLE);

// ── 팔 IK: 손을 원하는 곳(상체 기준 좌표)에 가져가는 팔 각도를 찾아요 ──
function handPos(ax, az, el) {
  const sa = Math.sin(az), ca = Math.cos(az), sx = Math.sin(ax), cx = Math.cos(ax), se = Math.sin(el), ce = Math.cos(el);
  const ux = sa, uy = -ca * cx, uz = ca * sx;
  const fx = ce * sa, fy = -ce * ca * cx + se * sx, fz = ce * ca * sx + se * cx;
  return [SHOULDER[0] + L1 * ux + L2 * fx, SHOULDER[1] + L1 * uy + L2 * fy, SHOULDER[2] + L1 * uz + L2 * fz];
}
const ikCache = new Map();
export function solveArm(tx, ty, tz) {
  const key = `${Math.round(tx * 100)},${Math.round(ty * 100)},${Math.round(tz * 100)}`;
  if (ikCache.has(key)) return ikCache.get(key);
  const lim = [[-0.8, 3.1], [-0.7, 1.6], [0, 2.7]];
  const cost = (v) => {
    const h = handPos(v[0], v[1], v[2]);
    return (h[0] - tx) ** 2 + (h[1] - ty) ** 2 + (h[2] - tz) ** 2 + 0.0006 * v[1] * v[1] + 0.0002 * v[2] * v[2];
  };
  let best = [0.8, 0.1, 1.0], bestC = cost(best);
  for (const start of [[0.3, 0.2, 0.3], [1.2, -0.2, 1.8], [2.5, 0.2, 0.3], [0.6, 0.6, 1.2]]) {
    const c = cost(start);
    if (c < bestC) { best = start; bestC = c; }
  }
  best = [...best];
  let step = 0.25;
  for (let it = 0; it < 80 && step > 0.002; it++) {
    let improved = false;
    for (let i = 0; i < 3; i++) {
      for (const d of [step, -step]) {
        const v = [...best];
        v[i] = Math.max(lim[i][0], Math.min(lim[i][1], v[i] + d));
        const c = cost(v);
        if (c < bestC) { best = v; bestC = c; improved = true; }
      }
    }
    if (!improved) step *= 0.5;
  }
  const out = { x: best[0], z: best[1], e: best[2] };
  if (ikCache.size > 4000) ikCache.clear();
  ikCache.set(key, out);
  return out;
}

const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpE = new THREE.Euler();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Character {
  constructor(cfg, { reducedMotion = false } = {}) {
    this.cfg = cfg;
    this.reducedMotion = reducedMotion;
    const C = cfg.colors;
    this.root = new THREE.Group();
    this.root.name = 'character';
    this.root.userData.pick = { kind: 'character', id: 'character' };
    this.root.scale.setScalar(Math.max(0.6, Math.min(1.4, cfg.size || 1)));
    this.lay = group(this.root);
    this.bob = group(this.lay);

    // 재질 (캐릭터만 쓰는 것은 따로 만들어서 반짝임을 바꿀 수 있게 해요)
    this.skinMat = new THREE.MeshPhysicalMaterial({ color: C.skin, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#ffd0c0') });
    this.hairMat = new THREE.MeshPhysicalMaterial({ color: C.hair, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.5, sheenColor: new THREE.Color('#8a6f9a'), side: THREE.DoubleSide });
    this.lipMat = new THREE.MeshPhysicalMaterial({ color: C.lips, roughness: 0.5, clearcoat: 0.2 });
    this.blushMat = new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.4, depthWrite: false });
    const pj = mat('#ffffff', { map: dotsTex(C.pajama, C.pajamaDots, [3, 3]), rough: 0.85 });
    const pjPlain = mat(C.pajama, { rough: 0.85 });
    const collar = mat(C.collar, { rough: 0.8 });
    const eyeMat = gloss(C.eyes, { rough: 0.2, clearcoat: 1 });
    const white = mat('#ffffff', { emissive: '#ffffff', ei: 0.6 });

    // ── 다리 ──
    this.legs = [];
    for (const s of [1, -1]) {
      const leg = group(this.bob, { p: [s * 0.085, HIP, 0] });
      add(leg, capsule(0.072, 0.12, 4, 12), pj, { p: [0, -0.11, 0] });
      add(leg, torus(0.068, 0.018, Math.PI * 2, 8, 20), collar, { p: [0, -0.2, 0], r: [Math.PI / 2, 0, 0] });
      add(leg, rbox(0.12, 0.07, 0.19, 0.035), mat(C.slippers, { rough: 0.95 }), { p: [0, -0.262, 0.025] });
      add(leg, sphere(0.032, 12, 8), mat(C.slipperPom, { rough: 1 }), { p: [0, -0.225, 0.095] });
      this.legs.push(leg);
    }
    add(this.bob, sphere(0.165, 20, 14), pj, { p: [0, HIP, 0], s: [1, 0.62, 0.86] });

    // ── 상체 ──
    this.upper = group(this.bob, { p: [0, HIP, 0] });
    this.torso = group(this.upper);
    add(this.torso, capsule(0.165, 0.12, 6, 18), pj, { p: [0, 0.16, 0], s: [1, 1, 0.82] });
    this.hem = group(this.torso, { p: [0, 0.07, 0] });
    add(this.hem, cyl(0.172, 0.205, 0.09, 24, true), pjPlain, { p: [0, -0.06, 0], s: [1, 1, 0.86] }).material.side = THREE.DoubleSide;
    add(this.hem, torus(0.2, 0.014, Math.PI * 2, 6, 28), collar, { p: [0, -0.105, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.86, 1] });
    add(this.torso, torus(0.085, 0.028, Math.PI * 2, 8, 20), collar, { p: [0, 0.3, 0.005], r: [Math.PI / 2, 0, 0] });
    for (const s of [-1, 1]) add(this.torso, sphere(0.06, 12, 8), collar, { p: [s * 0.055, 0.285, 0.1], r: [0, 0, s * 0.6], s: [1, 0.55, 0.3] });
    for (const y of [0.2, 0.12]) add(this.torso, sphere(0.016, 8, 6), gloss('#ffffff'), { p: [0, y, 0.138] });
    add(this.torso, cyl(0.055, 0.06, 0.07, 12), this.skinMat, { p: [0, 0.33, 0] });

    // ── 팔 ──
    this.arms = {};
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const sh = group(this.upper, { p: [s * SHOULDER[0], SHOULDER[1], SHOULDER[2]] });
      add(sh, sphere(0.058, 12, 10), pj, {});
      add(sh, capsule(0.052, 0.1, 4, 12), pj, { p: [0, -0.08, 0] });
      const el = group(sh, { p: [0, -L1, 0] });
      add(el, capsule(0.047, 0.1, 4, 12), pj, { p: [0, -0.07, 0] });
      add(el, torus(0.045, 0.016, Math.PI * 2, 8, 18), collar, { p: [0, -0.14, 0], r: [Math.PI / 2, 0, 0] });
      const hand = group(el, { p: [0, -L2, 0] });
      add(hand, sphere(0.052, 14, 10), this.skinMat, { s: [1, 1.05, 0.9] });
      add(hand, sphere(0.022, 8, 6), this.skinMat, { p: [-s * 0.035, 0.01, 0.025] });
      const grip = group(hand, { p: [0, -0.01, 0.035] });
      this.arms[side] = { sh, el, hand, grip };
    }

    // ── 머리 ──
    this.head = group(this.upper, { p: [0, 0.31, 0] });
    this.headMesh = add(this.head, sphere(HEAD_R, 40, 30), this.skinMat, { p: HEAD_C, s: [1.04, 0.97, 1] });
    for (const s of [-1, 1]) add(this.head, sphere(0.05, 10, 8), this.skinMat, { p: [s * 0.3, 0.22, 0.01], s: [0.6, 1, 0.8] });
    this.face = group(this.head);
    this.buildFace(eyeMat, white);
    this.buildHair();
    this.buildRibbon(C.ribbon);
    this.buildOverlays();

    // ── 상태 ──
    this.pose = { ...IDLE };
    this.target = { ...IDLE };
    this.fx = { foam: 0, mask: 0, dots: 0, blush: 0, glow: 0, gloss: 0, hairShine: 0 };
    this.motion = null;        // { fn, t, dur }
    this.expression = 'happy';
    this.exprUntil = 0;
    this.baseExpression = 'happy';
    this.blinkT = 2;
    this.held = null;
    this.path = [];
    this.speed = 0;
    this.walkPhase = 0;
    this.heading = 0;
    this.targetHeading = null;
    this.hop = null;
    this.vel = new THREE.Vector3();
    this.prevPos = new THREE.Vector3();
    this.turnRate = 0;
    this.wind = 0;
    this.time = 0;
    this.sitting = false;
    this.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.setExpression('happy');
  }

  // 머리 표면에 붙이기 (x, y 는 머리 가운데 기준)
  onFace(obj, x, y, lift = 0) {
    const r = HEAD_R;
    const z = Math.sqrt(Math.max(0.0001, r * r - x * x - y * y));
    const n = new THREE.Vector3(x * 1.04, y, z).normalize();
    obj.position.set(HEAD_C[0] + x * 1.04 + n.x * lift, HEAD_C[1] + y * 0.97 + n.y * lift, HEAD_C[2] + z + n.z * lift);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    return obj;
  }

  buildFace(eyeMat, white) {
    const C = this.cfg.colors;
    this.eyes = [];
    for (const s of [1, -1]) {
      const eye = this.onFace(group(this.face), s * 0.105, -0.015, 0.002);
      const open = group(eye);
      add(open, sphere(1, 20, 16), eyeMat, { s: [0.058, 0.08, 0.022], shadow: false });
      add(open, sphere(1, 16, 12), gloss('#6e4556', { rough: 0.3 }), { p: [0, -0.025, 0.012], s: [0.04, 0.04, 0.014], shadow: false });
      add(open, sphere(0.021, 10, 8), white, { p: [s * 0.016, 0.028, 0.02], shadow: false });
      add(open, sphere(0.01, 8, 6), white, { p: [-s * 0.017, -0.03, 0.02], shadow: false });
      add(open, capsule(0.006, 0.05, 2, 6), eyeMat, { p: [s * 0.035, 0.07, 0.008], r: [0, 0, s * 1.1], shadow: false });
      const up = add(eye, torus(0.042, 0.011, Math.PI, 6, 16), eyeMat, { p: [0, -0.012, 0.012], shadow: false });
      const down = add(eye, torus(0.04, 0.01, Math.PI, 6, 16), eyeMat, { p: [0, 0.018, 0.012], r: [0, 0, Math.PI], shadow: false });
      const brow = this.onFace(group(this.face), s * 0.11, 0.1, 0.004);
      add(brow, capsule(0.008, 0.04, 2, 6), mat(C.hair), { r: [0, 0, Math.PI / 2 + s * 0.15], shadow: false });
      this.eyes.push({ eye, open, up, down, brow, side: s });
    }
    const mouth = this.onFace(group(this.face), 0, -0.115, 0.002);
    this.mouth = {
      group: mouth,
      smile: add(mouth, torus(0.032, 0.009, Math.PI, 6, 16), this.lipMat, { r: [0, 0, Math.PI], p: [0, 0.015, 0.004], shadow: false }),
      open: group(mouth),
      o: group(mouth),
    };
    add(this.mouth.open, sphere(1, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#b8445e'), { s: [0.042, 0.04, 0.012], shadow: false });
    add(this.mouth.open, sphere(1, 12, 8), mat('#ff8fa3'), { p: [0, -0.022, 0.006], s: [0.022, 0.012, 0.008], shadow: false });
    add(this.mouth.open, rbox(0.084, 0.006, 0.01, 0.003), this.lipMat, { p: [0, 0.002, 0.003], shadow: false });
    add(this.mouth.o, torus(0.016, 0.007, Math.PI * 2, 6, 16), this.lipMat, { shadow: false });
    add(this.mouth.o, circle(0.014, 12), mat('#b8445e'), { p: [0, 0, -0.002], shadow: false });
    this.onFace(add(this.face, sphere(0.012, 8, 6), this.skinMat, { shadow: false }), 0, -0.06, 0);
    this.blushes = [];
    for (const s of [-1, 1]) {
      const b = this.onFace(add(this.face, circle(0.045, 20), this.blushMat, { shadow: false, s: [1.3, 0.8, 1] }), s * 0.175, -0.075, 0.004);
      b.renderOrder = 2;
      this.blushes.push(b);
    }
  }

  buildHair() {
    const H = this.hairMat;
    const c = HEAD_C;
    add(this.head, new THREE.SphereGeometry(0.318, 36, 22, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, 0, Math.PI * 0.64), H, { p: c, s: [1.04, 0.97, 1] });
    add(this.head, new THREE.SphereGeometry(0.322, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.36), H, { p: c, s: [1.04, 0.97, 1] });
    // 앞머리
    for (const [x, y, sx, sy, rz] of [[-0.175, 0.12, 0.07, 0.11, -0.35], [-0.09, 0.15, 0.08, 0.09, -0.1], [0, 0.155, 0.08, 0.085, 0], [0.09, 0.15, 0.08, 0.09, 0.1], [0.175, 0.12, 0.07, 0.11, 0.35]]) {
      const b = this.onFace(group(this.head), x, y, 0.0);
      add(b, sphere(1, 16, 12), H, { s: [sx, sy, 0.045], r: [0, 0, rz] });
    }
    // 옆머리 (얼굴 옆으로 내려와요)
    this.sideLocks = [];
    for (const s of [-1, 1]) {
      const pv = group(this.head, { p: [s * 0.275, 0.33, 0.06] });
      add(pv, capsule(0.055, 0.3, 4, 12), H, { p: [0, -0.2, 0], s: [0.9, 1, 0.7] });
      add(pv, sphere(0.06, 12, 8), H, { p: [s * -0.01, -0.37, 0.005], s: [0.8, 0.6, 0.6] });
      this.sideLocks.push({ pv, a: 0, v: 0, s });
    }
    // 긴 뒷머리 (마디마다 흔들려요)
    this.hairSegs = [];
    const n = Math.max(1, Math.min(5, Math.round(this.cfg.hairLength || 3)));
    let parent = group(this.head, { p: [0, 0.34, -0.2] });
    for (let i = 0; i < n; i++) {
      const w = 2.35 - i * 0.2;
      const seg = i === 0 ? parent : group(parent, { p: [0, -0.22, 0] });
      // 마디끼리 많이 겹치게 해서 한 줄기처럼 보여요
      add(seg, capsule(0.1, 0.24, 8, 20), H, { p: [0, -0.15, 0], s: [w, 1, 0.55] });
      if (i === n - 1) {
        for (const x of [-0.1, 0, 0.1]) add(seg, sphere(0.07, 12, 8), H, { p: [x * w, -0.33 + Math.abs(x) * 0.3, 0], s: [1, 1.2, 0.55] });
      }
      this.hairSegs.push({ pv: seg, a: 0, v: 0, az: 0, vz: 0, base: i === 0 ? 0.32 : -0.12 });
      parent = seg;
    }
  }

  buildRibbon(color) {
    const rm = gloss(color, { rough: 0.35, clearcoat: 0.6 });
    const band = group(this.head, { p: HEAD_C, r: [-0.38, 0, 0] });
    add(band, torus(0.328, 0.024, Math.PI, 8, 40), rm, { s: [1.04, 0.97, 1] });
    const bow = group(band, { p: [0.175, 0.275, 0.02], r: [0, 0.35, -0.55] });
    for (const s of [-1, 1]) {
      add(bow, sphere(1, 16, 12), rm, { p: [s * 0.07, 0, 0], r: [0, 0, s * 0.35], s: [0.075, 0.05, 0.03] });
      add(bow, capsule(0.018, 0.06, 3, 8), rm, { p: [s * 0.03, -0.06, 0], r: [0, 0, s * 0.35] });
    }
    add(bow, sphere(0.03, 12, 8), gloss('#ffffff', { rough: 0.3 }), { s: [1, 1, 0.8] });
  }

  buildOverlays() {
    // 세안 거품
    this.foam = group(this.face);
    const fm = mat('#ffffff', { rough: 0.4 });
    for (const [x, y, r] of [[-0.16, -0.06, 0.04], [0.16, -0.06, 0.04], [-0.12, 0.08, 0.035], [0.13, 0.07, 0.03], [0, 0.12, 0.04], [0, -0.17, 0.035], [-0.2, 0.02, 0.03], [0.2, 0.0, 0.032], [0.07, -0.13, 0.025]]) {
      const b = this.onFace(group(this.foam), x, y, 0.01);
      add(b, sphere(r, 10, 8), fm, { shadow: false });
    }
    // 마스크팩
    this.maskMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, transparent: true, opacity: 0.92, depthWrite: true });
    this.mask = add(this.face, new THREE.SphereGeometry(HEAD_R + 0.008, 32, 16, Math.PI / 2 - 0.85, 1.7, Math.PI * 0.3, Math.PI * 0.42), this.maskMat, { p: HEAD_C, s: [1.04, 0.97, 1], shadow: false });
    // 선크림 점
    this.dots = group(this.face);
    for (const [x, y] of [[-0.16, -0.06], [0.16, -0.06], [0, 0.08], [0, -0.04], [0, -0.16]]) {
      this.onFace(add(this.dots, sphere(0.018, 8, 6), mat('#ffffff'), { shadow: false }), x, y, 0.006);
    }
  }

  // ── 표정 ──
  setExpression(name, seconds = 0) {
    if (seconds > 0) { this.exprUntil = this.time + seconds; } else { this.baseExpression = name; this.exprUntil = 0; }
    this.expression = name;
    const closedUp = name === 'joy' || name === 'proud';
    const closedDown = name === 'closed';
    for (const e of this.eyes) {
      e.open.visible = !closedUp && !closedDown;
      e.up.visible = closedUp;
      e.down.visible = closedDown;
      e.brow.position.y = HEAD_C[1] + (name === 'surprised' ? 0.115 : 0.095) * 0.97;
    }
    this.mouth.smile.visible = name === 'happy' || name === 'closed';
    this.mouth.open.visible = name === 'joy' || name === 'proud';
    this.mouth.o.visible = name === 'surprised' || name === 'sleepy';
    this.eyeScale = name === 'sleepy' ? 0.4 : name === 'surprised' ? 1.15 : 1;
  }

  // ── 물건 들기 ──
  hold(mesh) {
    this.release();
    if (!mesh) return;
    this.held = mesh;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    // 물건의 가운데쯤을 쥐어요
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const holder = group(this.arms.R.grip, { name: 'holder' });
    holder.add(mesh);
    mesh.position.y = -(box.max.y - box.min.y) * 0.45;
    const open = mesh.getObjectByName('open'), closed = mesh.getObjectByName('closed');
    if (open && closed) { open.visible = true; closed.visible = false; }
    this.holder = holder;
  }
  release() {
    const m = this.held;
    if (this.holder) { this.holder.removeFromParent(); this.holder = null; }
    this.held = null;
    if (m) {
      const open = m.getObjectByName('open'), closed = m.getObjectByName('closed');
      if (open && closed) { open.visible = false; closed.visible = true; }
    }
    return m;
  }

  // ── 이동 ──
  get position() { return this.root.position; }
  walkPath(points) { this.path = points.map((p) => [p[0], p[1]]); this.targetHeading = null; }
  stopWalking() { this.path = []; }
  get walking() { return this.path.length > 0; }
  faceTo(angle) { this.targetHeading = angle; }
  get turning() { return this.targetHeading != null && Math.abs(wrap(this.targetHeading - this.heading)) > 0.06; }
  hopTo(x, y, z, dur = 0.5) {
    this.hop = { from: this.root.position.clone(), to: new THREE.Vector3(x, y, z), t: 0, dur };
  }
  get hopping() { return !!this.hop; }

  // 손을 상체 기준 (x, y, z)로 — side 는 'L' 또는 'R'. 오른손은 x를 뒤집어서 계산해요.
  reach(P, side, x, y, z) {
    const s = solveArm(side === 'L' ? x : -x, y, z);
    P['arm' + side + 'X'] = s.x;
    P['arm' + side + 'Z'] = s.z;
    P['elbow' + side] = s.e;
  }

  update(dt, time) {
    this.time = time;
    const P = this.target;
    for (const k of POSE_KEYS) P[k] = IDLE[k];
    if (this.sitting) { P.sit = 1; P.armLX = P.armRX = 0.35; P.elbowL = P.elbowR = 0.7; }

    // 걷기
    let moveSpeed = 0;
    if (this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - this.root.position.x, dz = tz - this.root.position.z;
      const dist = Math.hypot(dx, dz);
      const maxSpeed = (this.cfg.walkSpeed || 1.1) * this.root.scale.x;
      const last = this.path.length === 1;
      const want = last ? Math.min(maxSpeed, dist * 3 + 0.25) : maxSpeed;
      this.speed += (want - this.speed) * Math.min(1, dt * 6);
      const step = Math.min(dist, this.speed * dt);
      if (dist > 0.0001) {
        const desired = Math.atan2(dx, dz);
        const diff = wrap(desired - this.heading);
        // 많이 돌아야 하면 먼저 돌고 걸어요
        const turnFactor = Math.abs(diff) > 1.4 ? 0.15 : 1;
        this.heading += Math.sign(diff) * Math.min(Math.abs(diff), dt * 9);
        this.root.position.x += (dx / dist) * step * turnFactor;
        this.root.position.z += (dz / dist) * step * turnFactor;
      }
      if (dist < 0.03) this.path.shift();
      moveSpeed = this.speed;
    } else {
      this.speed = 0;
      if (this.targetHeading != null) {
        const diff = wrap(this.targetHeading - this.heading);
        this.heading += Math.sign(diff) * Math.min(Math.abs(diff), dt * 7);
      }
    }
    if (this.hop) {
      const h = this.hop;
      h.t = Math.min(1, h.t + dt / h.dur);
      const e = h.t * h.t * (3 - 2 * h.t);
      this.root.position.lerpVectors(h.from, h.to, e);
      this.root.position.y += Math.sin(h.t * Math.PI) * 0.18;
      if (h.t >= 1) this.hop = null;
    }
    const prevHeading = this.root.rotation.y;
    this.root.rotation.y = this.heading;
    this.turnRate = dt > 0 ? wrap(this.heading - prevHeading) / dt : 0;

    if (moveSpeed > 0.05) {
      this.walkPhase += dt * (6 + moveSpeed * 5);
      const w = Math.min(1, moveSpeed / 0.8);
      const s = Math.sin(this.walkPhase);
      P.legL = s * 0.65 * w; P.legR = -s * 0.65 * w;
      P.armLX = -s * 0.5 * w + 0.05; P.armRX = s * 0.5 * w + 0.05;
      P.elbowL = P.elbowR = 0.4;
      P.bodyY = Math.abs(Math.cos(this.walkPhase)) * 0.035 * w;
      P.lean = 0.1 * w;
      P.headZ = Math.sin(this.walkPhase) * 0.05 * w;
      P.twist = s * 0.08 * w;
    }

    // 동작 (행동 중일 때)
    if (this.motion) {
      const m = this.motion;
      m.t += dt;
      m.fn(P, m.t, Math.min(1, m.t / m.dur), this, dt);
    }

    // 숨쉬기
    const breath = Math.sin(time * 2.1);
    this.upper.scale.set(1 + breath * 0.008, 1 + breath * 0.012, 1);

    // 부드럽게 다음 자세로
    const k = 1 - Math.exp(-dt * 10);
    for (const key of POSE_KEYS) this.pose[key] += (P[key] - this.pose[key]) * k;
    const p = this.pose;
    this.arms.L.sh.rotation.set(-p.armLX, 0, p.armLZ);
    this.arms.R.sh.rotation.set(-p.armRX, 0, -p.armRZ);
    this.arms.L.el.rotation.x = -p.elbowL;
    this.arms.R.el.rotation.x = -p.elbowR;
    this.legs[0].rotation.x = -(p.legL + p.sit * 1.45);
    this.legs[1].rotation.x = -(p.legR + p.sit * 1.45);
    this.head.rotation.set(p.headX, p.headY, p.headZ);
    this.upper.rotation.set(p.lean, p.twist, 0);
    this.bob.position.y = p.bodyY;
    // 베개를 높이 베고 비스듬히 누워요 (큰 머리가 베개 위, 몸은 이불 속, 얼굴은 앞쪽)
    this.lay.rotation.x = -p.lie * (Math.PI / 2 - 0.38);
    this.lay.position.y = p.lie * 0.1;

    // 몸이 움직인 만큼 머리카락과 옷이 흔들려요
    const pos = this.root.position;
    const v = dt > 0 ? pos.clone().sub(this.prevPos).divideScalar(Math.max(dt, 1e-3)) : this.vel;
    const acc = v.clone().sub(this.vel).divideScalar(Math.max(dt, 1e-3));
    this.vel.copy(v);
    this.prevPos.copy(pos);
    const fwd = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const fSpeed = this.vel.dot(fwd);
    const fAcc = Math.max(-8, Math.min(8, acc.dot(fwd)));
    const amp = this.reducedMotion ? 0.4 : 1;
    const sway = Math.sin(time * 1.3) * 0.02 + this.wind * Math.sin(time * 3.1) * 0.08;
    this.hairSegs.forEach((seg, i) => {
      const lieBase = p.lie * (i === 0 ? -0.2 : -0.05);
      const tgt = seg.base + lieBase + amp * (Math.max(0, fSpeed) * 0.35 + fAcc * 0.025 + p.bodyY * 2 + p.lean * -0.6) * (1 + i * 0.25) + sway * (1 + i);
      seg.v += (tgt - seg.a) * 70 * dt - seg.v * 9 * dt;
      seg.a += seg.v * dt;
      // 누우면 머리카락이 베개 옆으로 퍼져요
      const tz = amp * (-this.turnRate * 0.06 + Math.sin(this.walkPhase) * 0.04 * Math.min(1, fSpeed)) * (1 + i * 0.4) + sway * 0.5 + p.lie * (i === 0 ? 0.6 : 0.1);
      seg.vz += (tz - seg.az) * 60 * dt - seg.vz * 8 * dt;
      seg.az += seg.vz * dt;
      seg.pv.rotation.set(seg.a, 0, seg.az);
    });
    for (const l of this.sideLocks) {
      const tgt = amp * (Math.max(0, fSpeed) * 0.25 + p.headX * -0.5) + sway;
      l.v += (tgt - l.a) * 80 * dt - l.v * 10 * dt;
      l.a += l.v * dt;
      l.pv.rotation.set(l.a, 0, l.s * Math.abs(this.hairSegs[0]?.az || 0) * 0.5);
    }
    const hemT = amp * (fSpeed * 0.12 + Math.sin(this.walkPhase * 2) * 0.03 * Math.min(1, fSpeed));
    this.hem.rotation.x += (hemT - this.hem.rotation.x) * Math.min(1, dt * 8);
    this.hem.rotation.z = Math.sin(this.walkPhase) * 0.04 * Math.min(1, fSpeed) * amp;

    // 눈 깜빡임과 잠깐 표정
    if (this.exprUntil && time > this.exprUntil) this.setExpression(this.baseExpression);
    this.blinkT -= dt;
    let blink = 1;
    if (this.blinkT < 0) { blink = 0.12; if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3; }
    for (const e of this.eyes) e.open.scale.set(this.eyeScale > 1 ? 1.1 : 1, this.eyeScale * blink, 1);

    // 피부·머릿결 반짝임, 거품, 마스크
    const f = this.fx;
    f.glow = Math.max(0, f.glow - dt * 0.006);
    f.blush = Math.max(0, f.blush - dt * 0.01);
    f.gloss = Math.max(0, f.gloss - dt * 0.01);
    f.hairShine = Math.max(0, f.hairShine - dt * 0.01);
    this.skinMat.clearcoat = 0.12 + f.glow * 0.85;
    this.skinMat.clearcoatRoughness = 0.4 - f.glow * 0.3;
    this.skinMat.sheen = 0.4 + f.glow * 0.6;
    this.hairMat.clearcoat = 0.3 + f.hairShine * 0.7;
    this.lipMat.clearcoat = 0.2 + f.gloss * 0.8;
    this.lipMat.roughness = 0.5 - f.gloss * 0.4;
    const blushBase = this.expression === 'proud' || this.expression === 'joy' ? 0.55 : 0.4;
    this.blushMat.opacity = Math.min(0.95, blushBase + f.blush * 0.5);
    this.foam.visible = f.foam > 0.02;
    this.foam.scale.setScalar(Math.max(0.01, f.foam));
    this.mask.visible = f.mask > 0.02;
    this.maskMat.opacity = 0.92 * Math.min(1, f.mask);
    this.dots.visible = f.dots > 0.02;
    this.dots.scale.setScalar(Math.max(0.01, f.dots));

    // 든 물건은 항상 바로 서 있게 (기울기는 동작이 정해요)
    if (this.holder) {
      this.holder.visible = p.showProduct > 0.5;
      this.root.updateMatrixWorld(true);
      this.arms.R.grip.getWorldQuaternion(tmpQ);
      this.upper.getWorldQuaternion(tmpQ2);
      tmpQ2.multiply(new THREE.Quaternion().setFromEuler(tmpE.set(p.gripTilt, 0, p.gripRoll)));
      this.holder.quaternion.copy(tmpQ.invert().multiply(tmpQ2));
    }
  }

  // 화면 위 말풍선을 띄울 머리 위 점
  headTop(out = new THREE.Vector3()) {
    this.head.updateWorldMatrix(true, false);
    return out.set(0, 0.68, 0).applyMatrix4(this.head.matrixWorld);
  }
  faceWorld(out = new THREE.Vector3(), x = 0, y = 0, z = 0.32) {
    this.head.updateWorldMatrix(true, false);
    return out.set(x, HEAD_C[1] + y, z).applyMatrix4(this.head.matrixWorld);
  }
  handWorld(side = 'R', out = new THREE.Vector3()) {
    return this.arms[side].hand.getWorldPosition(out);
  }
}
