// 가구 모양 만들기 — 둥글고 말랑한 파스텔 미니어처 스타일이에요.
// 모든 가구는 바닥 가운데가 (0,0,0)이고, 앞쪽이 +z 예요.
// 돌려주는 값: { group, slots: [물건 놓을 자리...], parts: { 움직이는 부분 } }
import * as THREE from 'three';
import { add, group, rbox, sphere, cyl, torus, cone, circle, plane, mat, gloss, glass, checkTex, stripeTex, canvasTex } from './kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wood = (c) => mat(c, { rough: 0.65 });
const lighten = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k).getHexString();
const darken = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#5a4a52'), k).getHexString();

const builders = {
  bed(f) {
    const g = new THREE.Group();
    const c = f.color || '#f6d7b8', a = f.accent || '#ffc7d6';
    add(g, rbox(1.4, 0.26, 2.0, 0.1), wood(c), { p: [0, 0.17, 0], receive: true });
    for (const [x, z] of [[-0.6, -0.9], [0.6, -0.9], [-0.6, 0.9], [0.6, 0.9]]) add(g, cyl(0.06, 0.05, 0.08, 12), wood(darken(c, 0.2)), { p: [x, 0.04, z] });
    add(g, rbox(1.3, 0.18, 1.9, 0.08), mat('#fffaf4', { rough: 0.9 }), { p: [0, 0.37, 0], receive: true });
    // 이불 (체크 무늬)
    add(g, rbox(1.36, 0.08, 1.15, 0.05), mat('#ffffff', { map: checkTex(lighten(a, 0.35), a, [3, 3]), rough: 0.95 }), { p: [0, 0.47, 0.42], receive: true });
    add(g, rbox(1.38, 0.1, 0.16, 0.05), mat(lighten(a, 0.5), { rough: 0.95 }), { p: [0, 0.48, -0.15] });
    // 베개
    add(g, rbox(0.72, 0.18, 0.4, 0.08, 4), mat('#ffffff', { rough: 0.95 }), { p: [0, 0.55, -0.7], r: [0.25, 0, 0] });
    // 동그란 머리판
    const head = group(g, { p: [0, 0, -0.98] });
    add(head, rbox(1.4, 0.75, 0.1, 0.05), wood(c), { p: [0, 0.38, 0] });
    add(head, cyl(0.7, 0.7, 0.1, 40), wood(c), { p: [0, 0.75, 0], r: [Math.PI / 2, 0, 0], s: [1, 1, 0.5] });
    add(head, sphere(0.09, 16, 12), mat(a), { p: [0, 0.98, 0.06], s: [1, 1, 0.5] });
    for (const x of [-0.45, 0, 0.45]) add(head, circle(0.08), mat(lighten(a, 0.3)), { p: [x, 0.55, 0.052], shadow: false });
    // 곰 인형
    const bear = group(g, { p: [0.47, 0.47, -0.55], r: [0, -0.5, 0] });
    const fur = mat('#e7c39f', { rough: 0.95 });
    add(bear, sphere(0.1, 16, 12), fur, { p: [0, 0.09, 0] });
    add(bear, sphere(0.085, 16, 12), fur, { p: [0, 0.24, 0] });
    for (const s of [-1, 1]) add(bear, sphere(0.032, 10, 8), fur, { p: [s * 0.06, 0.31, 0] });
    add(bear, sphere(0.03, 10, 8), mat('#fff3e6'), { p: [0, 0.22, 0.075] });
    for (const s of [-1, 1]) add(bear, sphere(0.011, 8, 6), mat('#3a2c33'), { p: [s * 0.032, 0.255, 0.075] });
    // 낮잠 잘 때 덮는 이불
    const quilt = group(g, { p: [0, 0, 0.12] });
    add(quilt, rbox(1.24, 0.4, 0.9, 0.15, 4), mat('#ffffff', { map: checkTex(lighten(a, 0.6), lighten(a, 0.2), [3, 3]), rough: 0.95 }), { p: [0, 0.66, 0], r: [-0.12, 0, 0] });
    add(quilt, rbox(1.26, 0.13, 0.18, 0.065, 3), mat('#ffffff', { rough: 0.95 }), { p: [0, 0.86, -0.4], r: [-0.12, 0, 0] });
    quilt.visible = false;
    return { group: g, slots: [], parts: { quilt } };
  },

  nightstand(f) {
    const g = new THREE.Group();
    const c = f.color || '#f3dcc2';
    add(g, rbox(0.55, 0.5, 0.45, 0.06), wood(c), { p: [0, 0.27, 0] });
    add(g, rbox(0.45, 0.16, 0.02, 0.02), wood(lighten(c, 0.3)), { p: [0, 0.32, 0.225] });
    add(g, sphere(0.025, 10, 8), gloss('#e7b866'), { p: [0, 0.32, 0.245] });
    for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]]) add(g, cyl(0.03, 0.025, 0.04, 10), wood(darken(c, 0.2)), { p: [x, 0.02, z] });
    // 무드등
    const lamp = group(g, { p: [0.06, 0.52, 0] });
    add(lamp, cyl(0.08, 0.1, 0.05, 20), gloss('#ffffff'), { p: [0, 0.025, 0] });
    add(lamp, cyl(0.015, 0.015, 0.16, 8), gloss('#e7b866'), { p: [0, 0.12, 0] });
    const shadeMat = new THREE.MeshStandardMaterial({ color: f.accent || '#ffe7a3', roughness: 0.6, emissive: new THREE.Color('#ffc46b'), emissiveIntensity: 0.9 });
    add(lamp, cyl(0.1, 0.17, 0.2, 24), shadeMat, { p: [0, 0.27, 0] });
    const light = new THREE.PointLight('#ffb766', 1.6, 3.2, 1.5);
    light.position.set(0, 0.25, 0.1);
    lamp.add(light);
    add(g, rbox(0.12, 0.03, 0.09, 0.01), mat('#a8d8ff'), { p: [-0.16, 0.535, 0.05] });
    add(g, rbox(0.11, 0.03, 0.085, 0.01), mat('#ffc2cf'), { p: [-0.16, 0.565, 0.05] });
    return { group: g, slots: [], parts: { light, shadeMat } };
  },

  sink(f) {
    const g = new THREE.Group();
    const c = f.color || '#bfeadf';
    add(g, rbox(0.85, 0.7, 0.5, 0.06), mat(c, { rough: 0.6 }), { p: [0, 0.36, 0] });
    for (const x of [-0.2, 0.2]) {
      add(g, rbox(0.36, 0.5, 0.02, 0.03), mat(lighten(c, 0.35)), { p: [x, 0.33, 0.25] });
      add(g, sphere(0.022, 10, 8), gloss('#e7b866'), { p: [x - Math.sign(x) * 0.12, 0.45, 0.27] });
    }
    add(g, rbox(0.92, 0.07, 0.56, 0.03), gloss('#ffffff', { rough: 0.3 }), { p: [0, 0.74, 0] });
    add(g, cyl(0.2, 0.15, 0.06, 28), gloss('#eaf7ff', { rough: 0.15 }), { p: [0, 0.75, 0.04] });
    add(g, circle(0.16, 28), mat('#a9dcff', { rough: 0.1, opacity: 0.85 }), { p: [0, 0.785, 0.04], r: [-Math.PI / 2, 0, 0], shadow: false });
    // 수도꼭지
    add(g, cyl(0.022, 0.026, 0.14, 12), gloss('#dfe6ea', { rough: 0.2 }), { p: [0, 0.84, -0.2] });
    add(g, torus(0.07, 0.018, Math.PI), gloss('#dfe6ea', { rough: 0.2 }), { p: [0, 0.91, -0.13], r: [0, Math.PI / 2, 0] });
    for (const x of [-0.12, 0.12]) add(g, sphere(0.03, 12, 8), gloss(x < 0 ? '#ff9fb2' : '#9fd6ff'), { p: [x, 0.8, -0.2] });
    // 동그란 거울
    add(g, torus(0.25, 0.035, Math.PI * 2, 10, 40), gloss(f.accent || '#ffffff'), { p: [0, 1.4, -0.22] });
    add(g, circle(0.25, 40), gloss('#dff3ff', { rough: 0.05, clearcoat: 1 }), { p: [0, 1.4, -0.23], shadow: false });
    add(g, rbox(0.05, 0.25, 0.01, 0.005), mat('#ffffff', { opacity: 0.7 }), { p: [-0.1, 1.45, -0.215], r: [0, 0, -0.5], shadow: false });
    // 수건
    add(g, cyl(0.012, 0.012, 0.5, 8), gloss('#e7b866'), { p: [0.6, 1.0, -0.2], r: [0, 0, Math.PI / 2] });
    add(g, rbox(0.3, 0.38, 0.05, 0.025), mat('#ffffff', { map: stripeTex('#ffe0e8', '#ffffff', [4, 1]), rough: 0.95 }), { p: [0.6, 0.83, -0.18] });
    // 칫솔 컵
    add(g, cyl(0.04, 0.035, 0.08, 16), gloss('#ffd3dc'), { p: [0.3, 0.82, -0.12] });
    return { group: g, slots: [V(-0.3, 0.775, 0.0), V(0.3, 0.8, -0.12)], parts: {} };
  },

  vanity(f) {
    const g = new THREE.Group();
    const c = f.color || '#fbe3ea', a = f.accent || '#ffd36e';
    add(g, rbox(1.15, 0.07, 0.5, 0.03), gloss(c, { rough: 0.35, clearcoat: 0.5 }), { p: [0, 0.72, 0] });
    add(g, rbox(1.05, 0.16, 0.45, 0.04), mat(c), { p: [0, 0.6, 0] });
    for (const x of [-0.27, 0.27]) {
      add(g, rbox(0.46, 0.12, 0.02, 0.02), mat(lighten(c, 0.4)), { p: [x, 0.6, 0.23] });
      add(g, sphere(0.02, 10, 8), gloss(a), { p: [x, 0.6, 0.25] });
    }
    for (const [x, z] of [[-0.5, -0.18], [0.5, -0.18], [-0.5, 0.18], [0.5, 0.18]]) add(g, cyl(0.035, 0.025, 0.52, 10), mat(c), { p: [x, 0.26, z] });
    // 타원 거울과 전구
    const mirror = group(g, { p: [0, 1.2, -0.17] });
    add(mirror, torus(0.3, 0.04, Math.PI * 2, 10, 48), gloss(a, { rough: 0.3 }), { s: [1, 1.3, 1] });
    add(mirror, circle(0.3, 48), gloss('#e4f4ff', { rough: 0.05, clearcoat: 1 }), { p: [0, 0, -0.01], s: [1, 1.3, 1], shadow: false });
    add(mirror, rbox(0.06, 0.3, 0.01, 0.005), mat('#ffffff', { opacity: 0.65 }), { p: [-0.12, 0.08, 0.005], r: [0, 0, -0.45], shadow: false });
    const bulbMat = mat('#fff7d6', { emissive: '#ffe9a8', ei: 0.8 });
    for (let i = 0; i < 7; i++) {
      const t = (i / 6) * Math.PI;
      add(mirror, sphere(0.03, 10, 8), bulbMat, { p: [Math.cos(t) * 0.36, Math.sin(t) * 0.44, 0.03], shadow: false });
    }
    add(g, rbox(0.1, 0.42, 0.06, 0.03), mat(c), { p: [0, 0.94, -0.19] });
    // 둥근 의자
    const stool = group(g, { p: [0, 0, 0.62] });
    add(stool, cyl(0.21, 0.2, 0.09, 28), mat('#ffffff', { map: checkTex('#ffd7e2', '#ffffff', [6, 1]), rough: 0.9 }), { p: [0, 0.3, 0] });
    add(stool, sphere(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffc6d4', { rough: 0.95 }), { p: [0, 0.34, 0], s: [1, 0.25, 1] });
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * Math.PI * 2;
      add(stool, cyl(0.025, 0.02, 0.27, 8), gloss(a), { p: [Math.cos(t) * 0.12, 0.13, Math.sin(t) * 0.12] });
    }
    // 장식 꽃병
    add(g, cyl(0.035, 0.045, 0.1, 14), gloss('#cbb7f5'), { p: [0.48, 0.81, -0.12] });
    for (const [x, y, col] of [[0.47, 0.92, '#ff9db1'], [0.5, 0.9, '#ffd36e'], [0.46, 0.89, '#ffffff']]) add(g, sphere(0.028, 10, 8), mat(col), { p: [x, y, -0.12] });
    const slots = [];
    for (let i = 0; i < 6; i++) slots.push(V(-0.47 + i * 0.165, 0.755, 0.1 - (i % 2) * 0.06));
    return { group: g, slots, parts: {} };
  },

  shelf(f) {
    const g = new THREE.Group();
    const c = f.color || '#f7e6cf', a = f.accent || '#cbb7f5';
    add(g, rbox(1.35, 1.55, 0.06, 0.03), wood(lighten(c, 0.2)), { p: [0, 0.8, -0.16] });
    for (const x of [-0.65, 0.65]) add(g, rbox(0.06, 1.6, 0.38, 0.03), wood(c), { p: [x, 0.8, 0] });
    for (const y of [0.05, 0.5, 0.95, 1.4]) add(g, rbox(1.36, 0.05, 0.38, 0.02), wood(c), { p: [0, y + 0.025, 0] });
    add(g, cyl(0.12, 0.12, 0.06, 28, false), wood(c), { p: [0, 1.62, -0.03], r: [Math.PI / 2, 0, 0], s: [4.5, 1, 1] });
    // 책 줄
    const cols = ['#ffb3c4', '#a9d9a1', '#bfe6ff', '#ffe08a', '#cbb7f5', '#ffcba4'];
    let x = 0.08;
    for (let i = 0; i < 7; i++) {
      const h = 0.26 + ((i * 37) % 7) * 0.012;
      add(g, rbox(0.06, h, 0.24, 0.015), mat(cols[i % cols.length]), { p: [x, 1.0 + h / 2, -0.02], r: [0, 0, i === 6 ? -0.25 : 0] });
      x += i === 5 ? 0.09 : 0.068;
    }
    // 장식 병과 다육이
    for (const [px, col] of [[-0.5, '#ffd6e0'], [-0.36, '#d6f0ff'], [-0.22, '#fff1b8']]) {
      add(g, cyl(0.04, 0.045, 0.12, 16), glass(col), { p: [px, 1.06, 0.02] });
      add(g, sphere(0.03, 12, 8), gloss('#ffffff'), { p: [px, 1.13, 0.02] });
    }
    add(g, cyl(0.07, 0.055, 0.08, 16), mat(a), { p: [0.45, 1.49, 0] });
    for (const [dx, dz] of [[0, 0], [0.04, 0.03], [-0.04, 0.02], [0.01, -0.04]]) add(g, sphere(0.04, 12, 8), mat('#9fd89a'), { p: [0.45 + dx, 1.56, dz], s: [0.8, 1.2, 0.8] });
    add(g, rbox(0.3, 0.2, 0.22, 0.05), mat('#ffffff', { map: checkTex('#fff0d6', '#ffe0b8', [3, 2]) }), { p: [-0.35, 1.56, 0] });
    add(g, rbox(0.28, 0.18, 0.2, 0.05), mat(a), { p: [0.35, 0.18, 0], r: [0, 0.1, 0] });
    add(g, sphere(0.07, 14, 10), mat('#ffd8a8'), { p: [-0.42, 0.62, 0.02] });
    const slots = [V(-0.3, 0.1, 0.05), V(0.12, 0.1, 0.05), V(0.4, 0.55, 0.03)];
    return { group: g, slots, parts: {} };
  },

  window(f) {
    const g = new THREE.Group();
    const frame = gloss(f.color || '#ffffff', { rough: 0.4 });
    const sky = canvasTex('sky', 64, 128, (c2, w, h) => {
      const gr = c2.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#9fd3ff'); gr.addColorStop(0.7, '#d9f0ff'); gr.addColorStop(1, '#fff1d9');
      c2.fillStyle = gr; c2.fillRect(0, 0, w, h);
      c2.fillStyle = 'rgba(255,255,255,.95)';
      for (const [x, y, r] of [[18, 40, 9], [28, 36, 12], [40, 42, 8], [44, 80, 7], [52, 77, 9]]) { c2.beginPath(); c2.arc(x, y, r, 0, Math.PI * 2); c2.fill(); }
    });
    add(g, plane(0.95, 1.05), new THREE.MeshBasicMaterial({ map: sky }), { p: [0, 1.6, 0.02], shadow: false });
    add(g, rbox(1.08, 0.08, 0.1, 0.03), frame, { p: [0, 2.15, 0.05] });
    add(g, rbox(1.2, 0.07, 0.24, 0.03), frame, { p: [0, 1.05, 0.1] });
    for (const x of [-0.52, 0.52]) add(g, rbox(0.08, 1.15, 0.1, 0.03), frame, { p: [x, 1.6, 0.05] });
    add(g, rbox(0.04, 1.05, 0.05, 0.015), frame, { p: [0, 1.6, 0.05] });
    add(g, rbox(0.95, 0.04, 0.05, 0.015), frame, { p: [0, 1.62, 0.05] });
    // 창틀 위 작은 화분
    add(g, cyl(0.06, 0.045, 0.08, 14), mat('#f7b9a0'), { p: [0.33, 1.13, 0.12] });
    add(g, sphere(0.06, 12, 10), mat('#8fcf8a'), { p: [0.33, 1.21, 0.12] });
    // 커튼
    const curtains = [];
    const cm = mat('#ffffff', { map: stripeTex(f.accent || '#b9e3c6', '#ffffff', [5, 1]), rough: 0.95 });
    for (const s of [-1, 1]) {
      const pivot = group(g, { p: [s * 0.55, 2.25, 0.16] });
      const cloth = group(pivot);
      add(cloth, rbox(0.32, 1.25, 0.05, 0.025), cm, { p: [-s * 0.13, -0.62, 0] });
      add(cloth, sphere(0.04, 10, 8), gloss('#ffd36e'), { p: [-s * 0.1, -0.7, 0.04] });
      curtains.push({ pivot, cloth, side: s });
    }
    add(g, cyl(0.02, 0.02, 1.5, 10), gloss('#e7b866'), { p: [0, 2.27, 0.16], r: [0, 0, Math.PI / 2] });
    // 햇살
    const beamMat = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
    const beam = add(g, plane(0.9, 2.2), beamMat, { p: [-0.1, 0.75, 0.9], r: [-1.05, 0, 0.12], shadow: false });
    beam.raycast = () => {};
    beam.userData.noPick = true;
    return { group: g, slots: [], parts: { curtains, beam, beamMat } };
  },

  plant(f) {
    const g = new THREE.Group();
    const c = f.color || '#f7b9a0', a = f.accent || '#8fcf8a';
    add(g, cyl(0.26, 0.19, 0.36, 28), mat(c, { rough: 0.8 }), { p: [0, 0.18, 0] });
    add(g, torus(0.25, 0.04, Math.PI * 2, 10, 32), mat(lighten(c, 0.2)), { p: [0, 0.36, 0], r: [Math.PI / 2, 0, 0] });
    add(g, cyl(0.23, 0.23, 0.02, 24), mat('#8a6a55'), { p: [0, 0.35, 0] });
    const leaves = group(g, { p: [0, 0.35, 0] });
    const lm = [mat(a), mat(lighten(a, 0.2)), mat(darken(a, 0.15))];
    const spots = [[0, 0.55, 0, 0.17], [0.13, 0.4, 0.06, 0.14], [-0.14, 0.42, 0.03, 0.15], [0.05, 0.3, -0.13, 0.13], [-0.05, 0.75, -0.03, 0.12], [0.12, 0.63, -0.05, 0.11], [-0.12, 0.6, 0.08, 0.11]];
    spots.forEach(([x, y, z, r], i) => {
      add(leaves, cyl(0.012, 0.015, y, 6), mat('#7aa86a'), { p: [x / 2, y / 2, z / 2], r: [z * 0.8, 0, -x * 0.8], shadow: false });
      add(leaves, sphere(r, 16, 12), lm[i % 3], { p: [x, y, z], s: [1, 0.8, 1] });
    });
    add(leaves, sphere(0.04, 10, 8), mat('#ffb3c4'), { p: [0.02, 0.73, 0.1] });
    add(leaves, sphere(0.035, 10, 8), mat('#ffe08a'), { p: [-0.15, 0.52, 0.15] });
    // 물뿌리개 자리 (화분 옆 바닥)
    return { group: g, slots: [V(-0.42, 0, 0.18)], parts: { leaves } };
  },

  teaTable(f) {
    const g = new THREE.Group();
    const c = f.color || '#fff2e2', a = f.accent || '#ffb8c6';
    add(g, cyl(0.5, 0.48, 0.06, 40), gloss(c, { rough: 0.4, clearcoat: 0.6 }), { p: [0, 0.38, 0] });
    add(g, cyl(0.42, 0.42, 0.005, 40), mat(lighten(a, 0.4)), { p: [0, 0.413, 0], shadow: false });
    add(g, cyl(0.06, 0.08, 0.34, 14), gloss(c), { p: [0, 0.18, 0] });
    add(g, cyl(0.26, 0.28, 0.04, 28), gloss(c), { p: [0, 0.02, 0] });
    // 찻주전자
    const pot = group(g, { p: [0.12, 0.42, -0.1] });
    add(pot, sphere(0.1, 20, 14), gloss('#ffffff'), { p: [0, 0.09, 0], s: [1, 0.85, 1] });
    add(pot, torus(0.1, 0.012, Math.PI * 2), gloss(a), { p: [0, 0.09, 0], r: [Math.PI / 2, 0, 0] });
    add(pot, cyl(0.012, 0.022, 0.12, 8), gloss('#ffffff'), { p: [0.11, 0.12, 0], r: [0, 0, -0.9] });
    add(pot, torus(0.045, 0.012, Math.PI * 1.2), gloss('#ffffff'), { p: [-0.1, 0.11, 0], r: [0, 0, Math.PI * 0.4] });
    add(pot, sphere(0.025, 10, 8), gloss(a), { p: [0, 0.18, 0] });
    // 과자 접시
    add(g, cyl(0.1, 0.08, 0.015, 20), gloss('#ffffff'), { p: [-0.18, 0.42, 0.18] });
    for (const [x, z, col] of [[-0.2, 0.15, '#f2c48d'], [-0.15, 0.2, '#ffb3c4'], [-0.22, 0.21, '#f2c48d']]) add(g, cyl(0.035, 0.035, 0.015, 14), mat(col), { p: [x, 0.437, z] });
    // 받침 접시
    add(g, cyl(0.065, 0.055, 0.01, 20), gloss('#ffffff'), { p: [-0.25, 0.418, -0.12] });
    // 방석 두 개
    const cushion = mat('#ffffff', { map: checkTex(lighten(a, 0.45), lighten(a, 0.15), [4, 1]), rough: 0.95 });
    add(g, cyl(0.27, 0.29, 0.12, 28), cushion, { p: [-0.62, 0.06, -0.42] });
    add(g, sphere(0.27, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(lighten(a, 0.3), { rough: 0.95 }), { p: [-0.62, 0.11, -0.42], s: [1, 0.12, 1] });
    add(g, cyl(0.25, 0.27, 0.11, 28), cushion, { p: [0.65, 0.055, 0.4] });
    return { group: g, slots: [V(-0.25, 0.423, -0.12)], parts: {} };
  },

  rug(f) {
    const g = new THREE.Group();
    const c = f.color || '#fff3e6', a = f.accent || '#cdb8f2';
    const tex = canvasTex(`rug${c}${a}`, 256, 256, (c2, w, h) => {
      c2.fillStyle = c; c2.fillRect(0, 0, w, h);
      const rings = [[124, a], [104, c], [96, lighten(a, 0.5)], [70, c], [44, lighten(a, 0.3)], [30, c]];
      for (const [r, col] of rings) { c2.fillStyle = col; c2.beginPath(); c2.arc(w / 2, h / 2, r, 0, Math.PI * 2); c2.fill(); }
      c2.fillStyle = '#ffffff';
      for (let i = 0; i < 12; i++) { const t = (i / 12) * Math.PI * 2; c2.beginPath(); c2.arc(w / 2 + Math.cos(t) * 84, h / 2 + Math.sin(t) * 84, 4, 0, Math.PI * 2); c2.fill(); }
    });
    add(g, cyl(1.25, 1.25, 0.025, 56), mat('#ffffff', { map: tex, rough: 1 }), { p: [0, 0.013, 0], shadow: false, receive: true });
    add(g, torus(1.25, 0.022, Math.PI * 2, 8, 64), mat(a, { rough: 1 }), { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0], shadow: false });
    return { group: g, slots: [], parts: {} };
  },

  toyBox(f) {
    const g = new THREE.Group();
    const c = f.color || '#ffe59a', a = f.accent || '#ff9db1';
    add(g, rbox(0.75, 0.42, 0.45, 0.07), mat(c), { p: [0, 0.22, 0] });
    add(g, sphere(0.07, 16, 12), mat(a), { p: [-0.035, 0.24, 0.225], s: [1, 1, 0.3] });
    add(g, sphere(0.07, 16, 12), mat(a), { p: [0.035, 0.24, 0.225], s: [1, 1, 0.3] });
    add(g, cone(0.098, 0.1, 4), mat(a), { p: [0, 0.18, 0.225], r: [Math.PI, Math.PI / 4, 0], s: [1, 1, 0.3] });
    const lid = group(g, { p: [0, 0.43, -0.22], r: [-0.35, 0, 0] });
    add(lid, rbox(0.78, 0.06, 0.47, 0.03), mat(lighten(c, 0.25)), { p: [0, 0.03, 0.225] });
    // 안에 든 장난감
    add(g, sphere(0.09, 14, 10), mat('#bfe6ff'), { p: [-0.18, 0.43, 0] });
    add(g, rbox(0.12, 0.12, 0.12, 0.03), mat('#a9d9a1'), { p: [0.1, 0.42, 0.02], r: [0.3, 0.5, 0] });
    return { group: g, slots: [], parts: { lid } };
  },
};

export function buildFurniture(f) {
  const make = builders[f.type];
  const out = make(f);
  out.group.name = 'furniture-' + f.id;
  out.group.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return out;
}
