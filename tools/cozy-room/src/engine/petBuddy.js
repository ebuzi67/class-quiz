// 내 반려동물이 모모의 방에 놀러 와요.
// 반려동물 화면(pet.html)에서 고른 친구를 이 기기 저장에서 읽어 와서, 방 안을 돌아다니게 해요.
// 모모가 "반려동물 쓰다듬기·놀기·밥 주기"를 하면 반려동물도 같이 움직이고, 반려동물 화면의 친밀도·경험치가 조금 올라요.
import * as THREE from 'three';
import { buildPet, disposeTree } from '../pet/models.js';
import { SPECIES_BY_ID, growthOf } from '../pet/data.js';
import { load, saveLocal, today } from '../pet/save.js';

const SIZE = { dog: 0.42, cat: 0.4, bug: 0.28 };    // 모모 옆에서 알맞은 크기
const MOMO_DAILY = 5;                                // 하루에 경험치를 받는 횟수 (넘겨도 계속 놀 수 있어요)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class PetBuddy {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.group = new THREE.Group();
    this.group.name = 'pet-buddy';
    this.group.userData.pick = { kind: 'buddy', id: 'pet' };
    scene.add(this.group);
    this.model = null;
    this.info = null;
    this.target = null;      // 걸어갈 곳 [x, z]
    this.rest = 2;
    this.heading = 0;
    this.hold = false;       // 모모와 놀 때는 가만히 있어요
    this.action = null;
    this.time = 0;
    this.reload();
  }

  get active() { return !!this.model; }

  // 저장에서 반려동물을 다시 읽어요 (반려동물 화면에서 돌아왔을 때)
  reload() {
    const data = load();
    const p = data?.pets?.[data.activePetId];
    const sp = p && SPECIES_BY_ID[p.species];
    const key = p ? `${p.species}|${p.acc}|${growthOf(p.exp).stage}|${p.name}` : '';
    if (key === this.key) return;
    this.key = key;
    if (this.model) { this.group.remove(this.model.group); disposeTree(this.model.group); this.model = null; }
    this.info = null;
    if (!sp) { this.group.visible = false; return; }
    this.model = buildPet(p.species, { acc: p.acc });
    this.model.group.scale.setScalar(SIZE[sp.cat] * growthOf(p.exp).scale);
    this.model.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    this.group.add(this.model.group);
    // 작은 친구도 쉽게 누를 수 있게 보이지 않는 누르기 영역을 넣어요
    if (!this.hit) {
      this.hit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
      this.hit.userData.proxy = true;
      this.hit.position.y = 0.22;
      this.group.add(this.hit);
    }
    this.group.visible = true;
    this.info = { id: p.id, name: p.name, species: sp.name, cat: sp.cat, emoji: { dog: '🐶', cat: '🐱', bug: '🪲' }[sp.cat] };
    if (!this.placed) {
      const start = this.freePoint() || [1, 1.5];
      this.group.position.set(start[0], 0, start[1]);
      this.placed = true;
    }
  }

  freePoint() {
    const g = this.world.grid;
    for (let i = 0; i < 40; i++) {
      const x = -2.6 + Math.random() * 5.4, z = -1 + Math.random() * 3.4;
      if (g.isFree(x, z)) return [x, z];
    }
    return null;
  }

  get position() { return this.group.position; }

  // 모모가 와서 설 자리 (반려동물 앞, 모모가 있는 쪽)
  spotFor(from) {
    const p = this.group.position;
    let dx = from[0] - p.x, dz = from[1] - p.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    const dist = this.info?.cat === 'bug' ? 0.7 : 0.62;
    let spot = [p.x + dx * dist, p.z + dz * dist];
    if (!this.world.grid.isFree(spot[0], spot[1])) {
      // 막혀 있으면 반려동물 둘레에서 빈 곳을 찾아요
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const c = [p.x + Math.sin(a) * dist, p.z + Math.cos(a) * dist];
        if (this.world.grid.isFree(c[0], c[1])) { spot = c; break; }
      }
    }
    return spot;
  }

  faceToward(x, z) { this.wantHeading = Math.atan2(x - this.group.position.x, z - this.group.position.z); }

  // 모모와 함께하는 움직임 (anim: 'pet' 'jump' 'ball' 'eat' 'drink')
  play(anim, dur, mood = 'happy') {
    if (!this.model) return;
    this.model.setMood(mood);
    this.action = { name: anim, t: 0, dur };
  }

  // 반려동물 화면의 기록에도 남겨요 (친밀도 +1, 경험치 +3, 하루 5번까지)
  rewardFromMomo(kind) {
    const data = load();
    const p = data?.pets?.[data.activePetId];
    if (!p) return null;
    p.care ||= {};
    const day = today();
    const c = p.care.momo ||= { day, n: 0, total: 0, last: 0 };
    if (c.day !== day) { c.day = day; c.n = 0; }
    c.total += 1; c.last = Date.now();
    p.log = [{ t: Date.now(), a: `momo-${kind}` }, ...(p.log || [])].slice(0, 30);
    let gained = false;
    if (c.n < MOMO_DAILY) { c.n += 1; p.exp += 3; p.love = Math.min(100, p.love + 1); gained = true; }
    data.updatedAt = Date.now();
    saveLocal(data);
    const before = this.key;
    this.reload();
    return { gained, grew: before !== this.key };
  }

  update(dt, char, reduced) {
    if (!this.model) return;
    this.time += dt;
    const pos = this.group.position;
    let moving = false;
    if (!this.hold) {
      if (this.target) {
        const dx = this.target[0] - pos.x, dz = this.target[1] - pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.05) { this.target = null; this.rest = 2 + Math.random() * 4; }
        else {
          const speed = this.info.cat === 'bug' ? 0.25 : 0.6;
          const step = Math.min(d, speed * dt);
          const nx = pos.x + (dx / d) * step, nz = pos.z + (dz / d) * step;
          if (this.world.grid.isFree(nx, nz)) { pos.x = nx; pos.z = nz; moving = true; this.wantHeading = Math.atan2(dx, dz); }
          else this.target = null;
        }
      } else {
        this.rest -= dt;
        if (this.rest < 0) {
          // 가끔은 모모 곁으로, 가끔은 방 구경을 가요
          const cp = char.position;
          if (Math.random() < 0.45 && Math.hypot(cp.x - pos.x, cp.z - pos.z) > 1.2) {
            const a = Math.random() * Math.PI * 2;
            const t = [cp.x + Math.sin(a) * 0.8, cp.z + Math.cos(a) * 0.8];
            this.target = this.world.grid.isFree(t[0], t[1]) ? t : this.freePoint();
          } else this.target = this.freePoint();
          if (!this.target) this.rest = 2;
        }
        if (!this.target && Math.random() < dt * 0.3) this.faceToward(char.position.x, char.position.z);
      }
    }
    if (this.wantHeading != null) {
      const diff = wrap(this.wantHeading - this.heading);
      this.heading += Math.sign(diff) * Math.min(Math.abs(diff), dt * 6);
      this.group.rotation.y = this.heading;
    }
    if (this.action) {
      this.action.t += dt;
      if (this.action.t >= this.action.dur) { this.action = null; this.model.setMood('idle'); }
    }
    const act = this.action || (moving ? { name: 'trot', t: this.time } : null);
    this.model.update(dt, this.time, act);
  }

  // 머리 위 점 (말풍선, 효과 자리)
  top(out = new THREE.Vector3()) {
    const box = new THREE.Box3().setFromObject(this.group);
    return out.set((box.min.x + box.max.x) / 2, box.max.y + 0.05, (box.min.z + box.max.z) / 2);
  }
}
