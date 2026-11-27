// 방(바닥·벽·조명)과 가구·물건을 놓고, 방의 변화(무드등, 창문, 화분, 어지른 물건)를 맡아요.
import * as THREE from 'three';
import { add, group, rbox, sphere, cyl, capsule, circle, mat, gloss, canvasTex, torus } from './kit.js';
import { buildFurniture } from './furnitureKit.js';
import { buildProduct } from './productKit.js';
import { NavGrid } from './path.js';
import { blockFurniture } from './names.js';

const ROOM = { w: 8, d: 6, wallH: 3 };

export class World {
  constructor(scene, { furniture, products }) {
    this.scene = scene;
    this.root = group(scene, { name: 'room' });
    this.furniture = new Map();
    this.products = new Map();
    this.pickables = [];
    this.lampOn = true;
    this.windowOpen = false;
    this.plantSize = 1;
    this.wind = 0;
    this.time = 0;
    this.anims = [];
    this.buildRoom();
    this.buildLights();
    this.grid = new NavGrid();
    for (const f of furniture) this.addFurniture(f);
    for (const p of products) this.addProduct(p);
    this.buildMess();
    this.buildHighlight();
  }

  buildRoom() {
    const floorTex = canvasTex('floor', 256, 256, (g, w, h) => {
      g.fillStyle = '#f2d6b8'; g.fillRect(0, 0, w, h);
      const cols = ['#f4dabd', '#efd0b0', '#f6dec4'];
      for (let i = 0; i < 4; i++) {
        g.fillStyle = cols[i % 3]; g.fillRect(0, i * 64 + 1, w, 62);
        g.fillStyle = 'rgba(160,110,80,.18)';
        g.fillRect((i * 97) % w, i * 64, 2, 64);
        g.fillRect((i * 97 + 140) % w, i * 64, 2, 64);
      }
    }, { repeat: [3, 3] });
    add(this.root, rbox(ROOM.w + 0.4, 0.3, ROOM.d + 0.4, 0.12, 4), mat('#f0c9a8', { rough: 0.8 }), { p: [0, -0.15, 0], receive: true });
    add(this.root, rbox(ROOM.w + 0.2, 0.02, ROOM.d + 0.2, 0.01), mat('#ffffff', { map: floorTex, rough: 0.7 }), { p: [0, 0.0, 0], receive: true, shadow: false });

    const paper = canvasTex('wallpaper', 128, 128, (g, w, h) => {
      g.fillStyle = '#fff4ec'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffe9e2'; g.fillRect(0, 0, w / 2, h);
      g.fillStyle = 'rgba(255,183,196,.6)';
      for (const [x, y] of [[32, 30], [96, 94]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
    }, { repeat: [10, 4] });
    const wallMat = mat('#ffffff', { map: paper, rough: 0.95 });
    const trim = mat('#ffffff', { rough: 0.6 });
    const wain = mat('#f9d9df', { rough: 0.8 });
    // 안쪽 벽
    add(this.root, rbox(ROOM.w + 0.4, ROOM.wallH, 0.2, 0.08), wallMat, { p: [0, ROOM.wallH / 2, -ROOM.d / 2 - 0.1], receive: true });
    add(this.root, rbox(ROOM.w + 0.4, 0.8, 0.06, 0.03), wain, { p: [0, 0.4, -ROOM.d / 2 + 0.03], receive: true });
    add(this.root, rbox(ROOM.w + 0.4, 0.06, 0.1, 0.03), trim, { p: [0, 0.82, -ROOM.d / 2 + 0.04] });
    add(this.root, rbox(ROOM.w + 0.5, 0.12, 0.3, 0.06), trim, { p: [0, ROOM.wallH, -ROOM.d / 2 - 0.08] });
    // 왼쪽 벽
    add(this.root, rbox(0.2, ROOM.wallH, ROOM.d + 0.4, 0.08), wallMat, { p: [-ROOM.w / 2 - 0.1, ROOM.wallH / 2, 0], receive: true });
    add(this.root, rbox(0.06, 0.8, ROOM.d + 0.4, 0.03), wain, { p: [-ROOM.w / 2 + 0.03, 0.4, 0], receive: true });
    add(this.root, rbox(0.1, 0.06, ROOM.d + 0.4, 0.03), trim, { p: [-ROOM.w / 2 + 0.04, 0.82, 0] });
    add(this.root, rbox(0.3, 0.12, ROOM.d + 0.5, 0.06), trim, { p: [-ROOM.w / 2 - 0.08, ROOM.wallH, 0] });

    // 벽 장식: 액자, 가랜드, 시계
    const frame = (x, y, z, ry, col, draw) => {
      const fg = group(this.root, { p: [x, y, z], r: [0, ry, 0] });
      add(fg, rbox(0.5, 0.6, 0.05, 0.03), gloss('#ffffff', { rough: 0.4 }), {});
      const art = canvasTex('art' + col, 64, 80, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); draw(g, w, h); });
      add(fg, new THREE.PlaneGeometry(0.4, 0.5), mat('#ffffff', { map: art, rough: 0.9 }), { p: [0, 0, 0.03], shadow: false });
    };
    frame(-1.0, 2.3, -2.97, 0, '#fff0c8', (g) => { g.fillStyle = '#ff9db1'; g.beginPath(); g.arc(24, 36, 10, 0, 7); g.arc(40, 36, 10, 0, 7); g.fill(); g.beginPath(); g.moveTo(15, 40); g.lineTo(32, 60); g.lineTo(49, 40); g.fill(); });
    frame(-0.3, 2.45, -2.97, 0, '#dff2ff', (g) => { g.fillStyle = '#ffd35a'; g.beginPath(); g.arc(32, 28, 12, 0, 7); g.fill(); g.fillStyle = '#9fd89a'; g.fillRect(0, 56, 64, 24); });
    frame(-3.97, 2.25, -1.35, Math.PI / 2, '#f2e8ff', (g) => { g.fillStyle = '#cbb7f5'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(16 + i * 16, 40, 7, 0, 7); g.fill(); } });
    const flags = ['#ffb3c4', '#ffe08a', '#a9d9a1', '#bfe6ff', '#cbb7f5'];
    for (let i = 0; i < 13; i++) {
      const x = 0.3 + i * 0.28;
      const y = 2.72 - Math.sin((i / 12) * Math.PI) * 0.25;
      add(this.root, new THREE.ConeGeometry(0.09, 0.2, 3), mat(flags[i % flags.length]), { p: [x, y, -2.96], r: [Math.PI, 0, 0], s: [1, 1, 0.15], shadow: false });
    }
    const clock = group(this.root, { p: [-3.97, 2.35, 0.95], r: [0, Math.PI / 2, 0] });
    add(clock, cyl(0.22, 0.22, 0.06, 32), gloss('#ffd3dc'), { r: [Math.PI / 2, 0, 0] });
    add(clock, circle(0.18, 32), mat('#ffffff'), { p: [0, 0, 0.032], shadow: false });
    this.clockHands = [
      add(clock, rbox(0.018, 0.12, 0.01, 0.005), mat('#5a4a52'), { p: [0, 0, 0.04], shadow: false }),
      add(clock, rbox(0.012, 0.16, 0.01, 0.005), mat('#ff8fa3'), { p: [0, 0, 0.045], shadow: false }),
    ];
    this.clockHands.forEach((h) => { h.geometry = h.geometry.clone().translate(0, h === this.clockHands[0] ? 0.05 : 0.07, 0); });
    // 천장 조명
    add(this.root, cyl(0.03, 0.03, 0.3, 8), mat('#e7b866'), { p: [0.6, 2.9, -1.4] });
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight('#fff4ea', '#e8c3cc', 1.1);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0dc', 2.1);
    sun.position.set(4.5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 5;
    this.scene.add(sun);
    this.sun = sun;
    const fill = new THREE.DirectionalLight('#ffd9e6', 0.5);
    fill.position.set(-5, 4, 8);
    this.scene.add(fill);
  }

  setShadowQuality(level) {
    const size = level === 'low' ? 512 : level === 'mid' ? 1024 : 2048;
    if (this.sun.shadow.mapSize.x === size) return;
    this.sun.shadow.mapSize.set(size, size);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
  }

  addFurniture(f) {
    const built = buildFurniture(f);
    const g = built.group;
    g.position.set(f.pos[0], 0, f.pos[1]);
    g.rotation.y = (f.rot * Math.PI) / 180;
    g.userData.pick = { kind: 'furniture', id: f.id };
    this.root.add(g);
    // 보이지 않는 넉넉한 누르기 영역 (잎 사이 같은 빈틈을 눌러도 가구가 골라져요)
    g.updateMatrixWorld(true);
    const box = new THREE.Box3();
    g.traverse((o) => { if (o.isMesh && !o.userData.noPick) box.expandByObject(o, false); });
    const size = box.getSize(new THREE.Vector3()).max(new THREE.Vector3(0.3, 0.12, 0.3));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
    hit.userData.proxy = true;
    hit.position.copy(g.worldToLocal(box.getCenter(new THREE.Vector3())));
    hit.rotation.y = -g.rotation.y;
    g.add(hit);
    this.pickables.push(g);
    blockFurniture(this.grid, f);
    this.furniture.set(f.id, { cfg: f, group: g, slots: built.slots, parts: built.parts });
  }

  addProduct(p) {
    const mesh = buildProduct(p);
    mesh.userData.pick = { kind: 'product', id: p.id };
    const entry = { cfg: p, mesh, held: false };
    this.products.set(p.id, entry);
    this.pickables.push(mesh);
    this.returnProduct(p.id);
  }

  // 물건을 원래 자리로 돌려놓아요
  returnProduct(id) {
    const e = this.products.get(id);
    if (!e) return;
    e.held = false;
    const home = e.cfg.home && this.furniture.get(e.cfg.home);
    e.mesh.position.set(0, 0, 0);
    e.mesh.rotation.set(0, 0, 0);
    if (home) {
      const slot = home.slots[e.cfg.slot] || home.slots[0] || new THREE.Vector3(0, 0.8, 0.3);
      home.group.add(e.mesh);
      e.mesh.position.copy(slot);
      if (e.cfg.shape === 'comb') { e.mesh.rotation.set(-Math.PI / 2, 0, 0.3); e.mesh.position.y += 0.012; }
      if (e.cfg.shape === 'pouch') { e.mesh.rotation.set(-0.25, 0, 0); }
      if (e.cfg.shape === 'book') { e.mesh.rotation.set(0, 0.3, 0); }
    } else {
      e.mesh.removeFromParent();
    }
    e.mesh.visible = true;
  }

  takeProduct(id) {
    const e = this.products.get(id);
    if (!e) return null;
    e.held = true;
    e.mesh.removeFromParent();
    return e.mesh;
  }

  // ── 자리 계산 ──
  // from: 지금 캐릭터 자리 [x, z] (반려동물처럼 움직이는 대상에 필요해요)
  spot(fid, from = [0, 0]) {
    if (fid === 'pet') return this.buddy?.active ? this.buddy.spotFor(from) : null;
    const f = this.furniture.get(fid)?.cfg;
    if (!f) return null;
    return [f.pos[0] + f.spot[0], f.pos[1] + f.spot[1]];
  }
  seat(fid) {
    const f = this.furniture.get(fid)?.cfg;
    if (!f?.seat) return null;
    return { x: f.pos[0] + f.seat.at[0], z: f.pos[1] + f.seat.at[1], y: f.seat.y, face: f.seat.face };
  }
  center(fid) {
    if (fid === 'pet') return this.buddy?.active ? [this.buddy.position.x, this.buddy.position.z] : null;
    const f = this.furniture.get(fid)?.cfg;
    return f ? [f.pos[0], f.pos[1]] : null;
  }
  // 가구나 물건 위쪽 점 (메뉴 띄울 곳)
  anchor(kind, id, out = new THREE.Vector3()) {
    const obj = kind === 'product' ? this.products.get(id)?.mesh : this.furniture.get(id)?.group;
    if (!obj) return null;
    const box = new THREE.Box3().setFromObject(obj);
    return box.getCenter(out).setY(Math.min(box.max.y, 2.2));
  }

  // ── 방의 변화 ──
  toggleLamp() {
    this.lampOn = !this.lampOn;
    this.anims.push({ t: 0, dur: 0.4, fn: (k) => {
      const parts = this.furniture.get('nightstand')?.parts;
      if (!parts?.light) return;
      const v = this.lampOn ? k : 1 - k;
      parts.light.intensity = 1.6 * v;
      parts.shadeMat.emissiveIntensity = 0.05 + 0.85 * v;
    } });
    return this.lampOn;
  }

  toggleWindow() {
    this.windowOpen = !this.windowOpen;
    const parts = [...this.furniture.values()].find((f) => f.cfg.type === 'window')?.parts;
    this.wind = this.windowOpen ? 1 : 0;
    if (!parts) return this.windowOpen;
    const from = parts.curtains[0].cloth.scale.x;
    const to = this.windowOpen ? 0.5 : 1;
    this.anims.push({ t: 0, dur: 0.8, fn: (k) => {
      const e = k * k * (3 - 2 * k);
      for (const c of parts.curtains) c.cloth.scale.x = from + (to - from) * e;
      parts.beamMat.opacity = this.windowOpen ? 0.18 + 0.14 * e : 0.32 - 0.14 * e;
    } });
    return this.windowOpen;
  }

  growPlant() {
    const leaves = this.furniture.get('plant')?.parts.leaves || [...this.furniture.values()].find((f) => f.cfg.type === 'plant')?.parts.leaves;
    if (!leaves) return;
    const from = this.plantSize;
    this.plantSize = this.plantSize >= 1.35 ? 1 : this.plantSize + 0.07;
    const to = this.plantSize;
    this.anims.push({ t: 0, dur: 0.7, fn: (k) => {
      const bounce = Math.sin(k * Math.PI) * 0.12;
      leaves.scale.setScalar(from + (to - from) * k + bounce);
    } });
  }

  // 바닥에 어지른 물건
  buildMess() {
    this.mess = [];
    const items = [
      (g) => { add(g, capsule(0.035, 0.1, 4, 8), mat('#bfe6ff'), { p: [0, 0.035, 0], r: [Math.PI / 2, 0, 0.4] }); add(g, sphere(0.04, 10, 8), mat('#bfe6ff'), { p: [0.03, 0.04, 0.07] }); },
      (g) => { add(g, sphere(0.07, 16, 12), mat('#ffb3c4'), { p: [0, 0.07, 0] }); add(g, torus(0.07, 0.012, Math.PI * 2, 6, 20), mat('#ffffff'), { p: [0, 0.07, 0] }); },
      (g) => { add(g, rbox(0.11, 0.11, 0.11, 0.025), mat('#ffe08a'), { p: [0, 0.055, 0], r: [0, 0.5, 0] }); },
      (g) => { add(g, rbox(0.14, 0.03, 0.18, 0.01), mat('#a9d9a1'), { p: [0, 0.015, 0], r: [0, -0.4, 0] }); },
    ];
    const toyBox = [...this.furniture.values()].find((f) => f.cfg.type === 'toyBox');
    this.messBox = toyBox ? new THREE.Vector3(toyBox.cfg.pos[0], 0.5, toyBox.cfg.pos[1]) : new THREE.Vector3(3, 0.5, 0);
    items.forEach((make, i) => {
      const g = group(this.root, { name: 'mess' + i });
      make(g);
      g.visible = false;
      this.mess.push({ g, active: false });
    });
    this.spawnMess(); this.spawnMess();
    this.messTimer = 40;
  }

  spawnMess() {
    const free = this.mess.find((m) => !m.active);
    if (!free) return false;
    for (let tries = 0; tries < 30; tries++) {
      const x = -1.6 + Math.random() * 3.6, z = -0.4 + Math.random() * 2.6;
      if (!this.grid.isFree(x, z)) continue;
      free.g.position.set(x, 0, z);
      free.g.rotation.y = Math.random() * 6;
      free.g.scale.setScalar(1);
      free.g.visible = true;
      free.active = true;
      return true;
    }
    return false;
  }

  get messCount() { return this.mess.filter((m) => m.active).length; }

  // 정리하기: 어지른 물건이 정리함으로 쏙
  collectMess() {
    const list = this.mess.filter((m) => m.active);
    list.forEach((m, i) => {
      m.active = false;
      const from = m.g.position.clone();
      this.anims.push({ t: -0.5 - i * 0.6, dur: 0.7, fn: (k) => {
        const p = new THREE.Vector3().lerpVectors(from, this.messBox, k);
        p.y += Math.sin(k * Math.PI) * 0.9;
        m.g.position.copy(p);
        m.g.scale.setScalar(1 - k * 0.7);
        if (k >= 1) m.g.visible = false;
      } });
    });
    this.messTimer = 45 + Math.random() * 30;
    return list.length;
  }

  buildHighlight() {
    this.ring = add(this.root, torus(0.5, 0.025, Math.PI * 2, 8, 48), new THREE.MeshBasicMaterial({ color: '#ff8fb0', transparent: true, opacity: 0.85, depthWrite: false }), { r: [Math.PI / 2, 0, 0], shadow: false });
    this.ring.visible = false;
    this.ring.raycast = () => {};
    this.hlCache = new Map();
    this.highlighted = new Map(); // obj → 단계
  }

  // 강조: level 0 끄기, 1 마우스 올림, 2 선택
  highlight(obj, level) {
    if (!obj) return;
    const prev = this.highlighted.get(obj) || 0;
    if (prev === level) return;
    obj.traverse((o) => {
      if (!o.isMesh || o.material.isMeshBasicMaterial || o.material.isSpriteMaterial) return;
      if (!o.userData.origMat) o.userData.origMat = o.material;
      if (level === 0) { o.material = o.userData.origMat; return; }
      const key = o.userData.origMat.uuid + level;
      if (!this.hlCache.has(key)) {
        const m = o.userData.origMat.clone();
        m.emissive = new THREE.Color(level === 2 ? '#ff9ab8' : '#ffd0de');
        m.emissiveIntensity = level === 2 ? 0.38 : 0.22;
        this.hlCache.set(key, m);
      }
      o.material = this.hlCache.get(key);
    });
    if (level === 0) this.highlighted.delete(obj); else this.highlighted.set(obj, level);
  }

  showRing(pos, radius = 0.6) {
    if (!pos) { this.ring.visible = false; return; }
    this.ring.visible = true;
    this.ring.position.set(pos.x, 0.03, pos.z);
    this.ringRadius = radius;
  }

  update(dt, reduced) {
    this.time += dt;
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      a.t += dt;
      if (a.t < 0) continue;
      const k = Math.min(1, a.t / a.dur);
      a.fn(k);
      if (k >= 1) this.anims.splice(i, 1);
    }
    if (this.ring.visible) {
      const s = (this.ringRadius || 0.6) * (1 + (reduced ? 0 : Math.sin(this.time * 5) * 0.06));
      this.ring.scale.setScalar(s / 0.5);
    }
    // 창문이 열리면 커튼이 살랑살랑
    const win = [...this.furniture.values()].find((f) => f.cfg.type === 'window')?.parts;
    if (win) for (const c of win.curtains) c.pivot.rotation.x = this.wind * Math.sin(this.time * 2 + c.side) * (reduced ? 0.03 : 0.09) - this.wind * 0.06;
    // 시계
    const now = new Date();
    if (this.clockHands) {
      this.clockHands[0].rotation.z = -((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2;
      this.clockHands[1].rotation.z = -(now.getMinutes() / 60) * Math.PI * 2;
    }
    // 어지른 물건이 가끔 생겨요
    this.messTimer -= dt;
    if (this.messTimer < 0) { this.spawnMess(); this.messTimer = 45 + Math.random() * 30; }
  }
}
