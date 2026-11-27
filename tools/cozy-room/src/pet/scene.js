// 3D 무대: 반려동물이 사는 방(강아지·고양이) / 사육장(곤충)
// ─────────────────────────────────────────────────────────────
//  Stage 하나를 만들어 두고 화면이 바뀔 때마다 그 화면 안으로 옮겨 써요.
//  (태블릿에서 3D 화면을 여러 개 만들면 느려지기 때문이에요)
//  thumb()은 목록용 작은 그림(PNG 데이터)을 한 번 그려서 기억해 둬요.
// ─────────────────────────────────────────────────────────────
import * as THREE from "three";
import { buildPet, buildLife, buildItem, disposeTree } from "./models.js";
import { PNG_ART, PNG_ITEMS } from "./png.js";

let glOK = null;
export function webglOK() {
  if (glOK !== null) return glOK;
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") || c.getContext("webgl");
    glOK = !!ctx;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();  // 검사용 화면은 바로 돌려줘요
  } catch { glOK = false; }
  return glOK;
}

// 방 크기: x는 -ROOM.w ~ ROOM.w, z는 -ROOM.d ~ ROOM.d
const ROOM = { w: 1.9, d: 1.15 };

function lights(scene, shadow) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc0, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(2.5, 5, 3.5);
  if (shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.002;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.5);
  fill.position.set(-3, 2, 2);
  scene.add(fill);
}

const THEMES = {
  "bg-cozy": { wall: "#FFF4E2", wall2: "#FBE7CC", floor: "#D9B48A", rug: "#F3D9B1", trim: "#E8CBA4", window: true },
  "bg-mint": { wall: "#E3F4EC", wall2: "#CDEBDD", floor: "#E6D2B8", rug: "#FFFFFF", trim: "#B9DDCB", window: true },
  "bg-sky": { wall: "#DCEBFA", wall2: "#C7DDF5", floor: "#F4EFE6", rug: "#FFE9B0", trim: "#B7CFEA", window: true, clouds: true },
  "bg-forest": { back: "#BFE3B4", back2: "#8FC786", soil: "#6E4B32", soil2: "#8A6142", glass: "#DFF2FF" },
  "bg-night": { back: "#2E3E6B", back2: "#1E2A4C", soil: "#5A3E2A", soil2: "#74523A", glass: "#BFD4FF", night: true },
  "bg-flower": { back: "#FFF1CC", back2: "#DFF2C8", soil: "#7A5638", soil2: "#9A7050", glass: "#E8F6FF", flowers: true },
};
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });

function buildRoom(bg, space) {
  const g = new THREE.Group();
  const t = THEMES[bg] || THEMES[space === "nature" ? "bg-forest" : "bg-cozy"];
  if (space !== "nature") {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w * 2 + 0.4, 0.1, ROOM.d * 2 + 0.6), M(t.floor));
    floor.position.set(0, -0.05, 0); floor.receiveShadow = true; g.add(floor);
    for (let i = -4; i <= 4; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.002, ROOM.d * 2 + 0.6), M("#00000022", { transparent: true, opacity: 0.08 })); l.position.set(i * 0.45, 0.001, 0); g.add(l); }
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 40), M(t.rug));
    rug.scale.z = 0.55; rug.position.set(0, 0.01, 0.15); rug.receiveShadow = true; g.add(rug);
    const back = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w * 2 + 0.4, 2.6, 0.1), M(t.wall));
    back.position.set(0, 1.25, -ROOM.d - 0.3); back.receiveShadow = true; g.add(back);
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, ROOM.d * 2 + 0.6), M(t.wall2));
    side.position.set(-ROOM.w - 0.2, 1.25, 0); side.receiveShadow = true; g.add(side);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w * 2 + 0.4, 0.14, 0.05), M(t.trim));
    trim.position.set(0, 0.07, -ROOM.d - 0.23); g.add(trim);
    if (t.window) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.04), M("#FFFFFF"));
      frame.position.set(0.7, 1.45, -ROOM.d - 0.24); g.add(frame);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.68), new THREE.MeshBasicMaterial({ color: t.clouds ? "#BFE0FF" : "#CFE8FF" }));
      glass.position.set(0.7, 1.45, -ROOM.d - 0.215); g.add(glass);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.68, 0.02), M("#FFFFFF")); bar.position.set(0.7, 1.45, -ROOM.d - 0.2); g.add(bar);
      if (t.clouds) for (const [x, y] of [[0.45, 1.55], [0.95, 1.35]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: "#FFFFFF" })); c.scale.set(1.8, 0.8, 0.2); c.position.set(x, y, -ROOM.d - 0.2); g.add(c); }
      const frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.03), M("#FFD77A")); frame2.position.set(-0.9, 1.5, -ROOM.d - 0.24); g.add(frame2);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), M("#9CC9A8")); pic.position.set(-0.9, 1.5, -ROOM.d - 0.22); g.add(pic);
    }
  } else {
    // 곤충 사육장: 흙 바닥 + 유리 벽 + 자연 배경
    const soil = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w * 2 + 0.3, 0.3, ROOM.d * 2 + 0.5), M(t.soil, { roughness: 1 }));
    soil.position.set(0, -0.15, 0); soil.receiveShadow = true; g.add(soil);
    for (let i = 0; i < 40; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.02, 8, 6), M(i % 2 ? t.soil2 : "#5DAA4A", { roughness: 1 }));
      s.scale.y = 0.35; s.position.set(Math.sin(i * 12.9) * ROOM.w, 0.0, Math.cos(i * 7.3) * ROOM.d); s.receiveShadow = true; g.add(s);
    }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w * 2 + 6, 6), new THREE.MeshBasicMaterial({ color: t.back }));
    back.position.set(0, 2.5, -ROOM.d - 0.25); g.add(back);
    const hill = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: t.back2 }));
    hill.position.set(-0.6, 0, -ROOM.d - 0.24); g.add(hill);
    const hill2 = hill.clone(); hill2.scale.set(0.8, 0.7, 1); hill2.position.set(1.2, 0, -ROOM.d - 0.235); g.add(hill2);
    if (t.night) {
      const moon = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: "#FFF4C2" })); moon.position.set(1.2, 1.8, -ROOM.d - 0.23); g.add(moon);
      for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: "#E9FF8A" })); f.position.set(Math.sin(i * 3.1) * 1.7, 0.6 + (i % 5) * 0.25, -0.9 + (i % 4) * 0.2); f.userData.firefly = i; g.add(f); }
    }
    if (t.flowers) for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), new THREE.MeshBasicMaterial({ color: ["#F59AB8", "#FFD77A", "#FFFFFF"][i % 3] })); f.position.set(-1.8 + i * 0.4, 0.25 + (i % 3) * 0.12, -ROOM.d - 0.23); g.add(f); }
    // 유리 벽 (살짝 보이게)
    const glassM = new THREE.MeshPhysicalMaterial({ color: t.glass, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0 });
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, ROOM.d * 2 + 0.5), glassM); gl.position.set(-ROOM.w - 0.15, 1.1, 0); g.add(gl);
    const gr = gl.clone(); gr.position.x = ROOM.w + 0.15; g.add(gr);
  }
  return g;
}

// ─────────────────────────────────────────────────────────────
//  무대
// ─────────────────────────────────────────────────────────────
export class Stage {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.className = "stage-canvas";
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    lights(this.scene, true);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.room = null;
    this.items = new THREE.Group();
    this.world.add(this.items);
    this.petHolder = new THREE.Group();
    this.world.add(this.petHolder);
    this.pet = null;
    this.prop = null;
    this.action = null;
    this.mode = "room";
    this.spin = 0;
    this.clock = new THREE.Clock();
    this.running = false;
    this.edit = null;
    this.ray = new THREE.Raycaster();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.bindPointer();
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
  }

  mount(container) {
    if (this.canvas.parentElement !== container) container.prepend(this.canvas);
    this.resizeObs.disconnect();
    this.resizeObs.observe(container);
    this.resize();
    this.start();
  }
  unmount() { this.stop(); this.canvas.remove(); }
  resize() {
    const el = this.canvas.parentElement;
    if (!el) return;
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = "100%"; this.canvas.style.height = "100%";
    this.camera.aspect = w / h;
    this.frame();
    this.camera.updateProjectionMatrix();
  }
  // 카메라 자리
  frame() {
    const narrow = this.camera.aspect < 1;
    if (this.mode === "showcase") {
      this.camera.position.set(0, 1.3, narrow ? 4.3 : 3.6);
      this.camera.lookAt(0, 0.5, 0);
    } else {
      // 화면 가로 폭에 방(가로 약 4.4)이 다 들어오도록 거리를 정해요
      const hfov = 2 * Math.atan(Math.tan((this.camera.fov / 2) * Math.PI / 180) * this.camera.aspect);
      const d = Math.max(5.0, 2.35 / Math.tan(hfov / 2));
      this.camera.position.set(0, 2.5 * (d / 5), d);
      this.camera.lookAt(0, 0.55, -0.1);
    }
  }
  setMode(mode) {
    this.mode = mode;
    this.room && (this.room.visible = mode === "room");
    this.scene.background = mode === "room" && this.roomBg ? this.roomBg : null;
    this.items.visible = mode === "room";
    this.petHolder.rotation.y = mode === "room" ? -0.35 : 0;
    this.petHolder.position.set(0, 0, mode === "room" ? 0.1 : 0);
    this.frame();
    this.camera.updateProjectionMatrix();
  }
  setRoom(bg, space) {
    if (this.room) { this.world.remove(this.room); disposeTree(this.room); }
    this.room = buildRoom(bg, space);
    const t = THEMES[bg] || {};
    this.roomBg = new THREE.Color(space === "nature" ? t.back || "#BFE3B4" : t.wall || "#FFF4E2");
    this.scene.background = this.mode === "room" ? this.roomBg : null;
    this.room.visible = this.mode === "room";
    this.world.add(this.room);
    this.space = space;
  }
  // items: [{ id, x, z }]  x, z는 -1 ~ 1
  setItems(list) {
    this.items.children.slice().forEach((c) => { this.items.remove(c); disposeTree(c); });
    for (const it of list) {
      const m = buildItem(it.id);
      m.userData.itemId = it.id;
      m.position.set(it.x * ROOM.w, this.space === "nature" ? 0.0 : 0.0, it.z * ROOM.d);
      m.rotation.y = it.r || 0;
      this.items.add(m);
    }
  }
  setPet(speciesId, { scale = 1, acc = null } = {}) {
    if (this.pet) { this.petHolder.remove(this.pet.group); disposeTree(this.pet.group); }
    this.pet = buildPet(speciesId, { acc });
    // 곤충은 사육장 안에서 조금 작게 보여요
    this.pet.group.scale.setScalar(scale * (this.pet.kind === "bug" ? 0.85 : 1));
    this.petHolder.add(this.pet.group);
    this.speciesId = speciesId;
  }
  // 행동: 몇 초 동안 움직이고 끝나면 Promise가 풀려요
  play(name, { mood = "happy", dur = 2.4, prop = null } = {}) {
    if (!this.pet) return Promise.resolve();
    this.pet.setMood(mood);
    this.setProp(prop);
    return new Promise((resolve) => {
      this.action = { name, t: 0, dur, resolve };
    });
  }
  setProp(kind) {
    if (this.prop) { this.petHolder.remove(this.prop); disposeTree(this.prop); this.prop = null; }
    if (!kind) return;
    const id = { kibble: "bowl-white", fish: "bowl-white", water: "bowl-white", jelly: "bowl-jelly", ball: "toy-ball", yarn: "toy-yarn", rod: "toy-yarn" }[kind];
    if (!id) return;
    this.prop = buildItem(id);
    this.prop.userData.kind = kind;
    if (kind === "kibble" || kind === "fish") {
      for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: kind === "fish" ? "#F2A0A0" : "#A8682F" })); b.position.set(Math.sin(i) * 0.1, 0.12, Math.cos(i * 2) * 0.1); this.prop.add(b); }
    }
    if (kind === "water") { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), new THREE.MeshStandardMaterial({ color: "#8CC8F0", roughness: 0.1 })); w.position.y = 0.11; this.prop.add(w); }
    const pet = this.pet?.kind;
    this.prop.position.set(0, 0, pet === "bug" ? 1.05 : 0.95);
    this.petHolder.add(this.prop);
  }

  // ── 꾸미기: 아이템을 끌어서 옮겨요 ──
  setEdit(onMove) { this.edit = onMove ? { onMove, drag: null } : null; this.canvas.style.cursor = onMove ? "grab" : ""; }
  bindPointer() {
    const ndc = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    let spinDrag = null;
    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.mode === "showcase") { spinDrag = { x: e.clientX, spin: this.spin }; this.canvas.setPointerCapture(e.pointerId); return; }
      if (!this.edit) return;
      this.ray.setFromCamera(ndc(e), this.camera);
      const hit = this.ray.intersectObjects(this.items.children, true)[0];
      if (!hit) return;
      let obj = hit.object;
      while (obj.parent !== this.items) obj = obj.parent;
      this.edit.drag = obj;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.style.cursor = "grabbing";
      obj.position.y = 0.08;
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (spinDrag) { this.spin = spinDrag.spin + (e.clientX - spinDrag.x) * 0.012; return; }
      if (!this.edit?.drag) return;
      this.ray.setFromCamera(ndc(e), this.camera);
      const p = new THREE.Vector3();
      if (!this.ray.ray.intersectPlane(this.floorPlane, p)) return;
      this.edit.drag.position.x = Math.max(-ROOM.w, Math.min(ROOM.w, p.x));
      this.edit.drag.position.z = Math.max(-ROOM.d, Math.min(ROOM.d, p.z));
    });
    const up = () => {
      spinDrag = null;
      if (!this.edit?.drag) return;
      const o = this.edit.drag;
      o.position.y = 0;
      this.edit.onMove(o.userData.itemId, +(o.position.x / ROOM.w).toFixed(3), +(o.position.z / ROOM.d).toFixed(3));
      this.edit.drag = null;
      this.canvas.style.cursor = "grab";
    };
    this.canvas.addEventListener("pointerup", up);
    this.canvas.addEventListener("pointercancel", up);
  }

  start() {
    if (this.running || !this.canvas.parentElement || document.hidden) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  tick() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;
    if (this.action) {
      this.action.t += dt;
      if (this.action.t >= this.action.dur) {
        const done = this.action.resolve;
        this.action = null;
        this.pet?.setMood("idle");
        this.setProp(null);
        done();
      }
    }
    if (this.pet) this.pet.update(dt, time, this.action);
    // 공·장난감이 통통 튀어요
    if (this.prop && ["ball", "yarn", "rod"].includes(this.prop.userData.kind) && this.action) {
      const k = this.action.t;
      this.prop.position.y = Math.abs(Math.sin(k * 7)) * (this.prop.userData.kind === "rod" ? 0.9 : 0.5) + (this.prop.userData.kind === "rod" ? 0.5 : 0);
      this.prop.position.x = Math.sin(k * 3) * 0.5;
    }
    if (this.mode === "showcase") {
      if (!this.edit) this.spin += dt * 0.35;
      this.petHolder.rotation.y = this.spin;
    }
    this.room?.traverse((o) => { if (o.userData.firefly !== undefined) o.position.y = 0.8 + Math.sin(time * 1.5 + o.userData.firefly) * 0.3; });
    this.renderer.render(this.scene, this.camera);
  }
  // 반려동물 머리 위의 화면 좌표 (말풍선 자리)
  bubbleAnchor() {
    if (!this.pet) return null;
    const box = new THREE.Box3().setFromObject(this.pet.group);
    const p = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y + 0.05, (box.min.z + box.max.z) / 2).project(this.camera);
    return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
  }
}

// ─────────────────────────────────────────────────────────────
//  목록용 미리보기 그림 (한 번 그리면 기억해요)
// ─────────────────────────────────────────────────────────────
let thumbR = null, thumbScene = null, thumbCam = null;
const thumbCache = new Map();
export function thumb(kind, id, opts = {}) {
  const key = `${kind}:${id}:${opts.stage || ""}:${opts.silhouette ? 1 : 0}`;
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (kind === "pet" && PNG_ART[id]) {
    const art = PNG_ART[id];
    if (!opts.silhouette) return typeof art === "string" ? art : art.idle;
    if (typeof art === "object" && art.sil) return art.sil;
  }
  if (kind === "item" && PNG_ITEMS[id]) return PNG_ITEMS[id];
  if (!webglOK()) return "";
  if (!thumbR) {
    thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbR.setSize(256, 256, false);
    thumbR.setClearColor(0x000000, 0);
    thumbScene = new THREE.Scene();
    lights(thumbScene, false);
    thumbCam = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  }
  const obj = kind === "pet" ? buildPet(id).group : kind === "life" ? buildLife(id, opts.stage) : buildItem(id);
  const isBug = kind === "pet" && obj.userData.kind === "bug";
  if (kind === "pet") obj.rotation.y = isBug ? -0.5 : -0.55;
  if (kind === "item") obj.rotation.y = -0.4;
  if (opts.silhouette) obj.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: "#C5CFDC" }); });
  thumbScene.add(obj);
  // 크기에 맞춰 카메라 거리를 정해요
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z) * 0.62;
  const dist = r / Math.tan((thumbCam.fov / 2) * Math.PI / 180) + 0.3;
  // 곤충은 위에서 비스듬히 내려다봐요
  const lift = isBug ? 1.15 : 0.55;
  thumbCam.position.set(center.x, center.y + r * lift, center.z + dist * (isBug ? 0.85 : 1));
  thumbCam.lookAt(center);
  thumbR.render(thumbScene, thumbCam);
  const url = thumbR.domElement.toDataURL("image/png");
  thumbScene.remove(obj);
  disposeTree(obj);
  thumbCache.set(key, url);
  return url;
}
