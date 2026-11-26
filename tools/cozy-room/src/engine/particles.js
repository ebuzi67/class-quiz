// 하트·별·반짝이·거품·물방울·Zzz·음표·김 파티클과 왕관 효과
import * as THREE from 'three';
import { add, group, cyl, cone, sphere, torus } from './kit.js';

function makeTex(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const heart = (g, col) => {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(32, 54);
  g.bezierCurveTo(4, 36, 6, 10, 22, 10);
  g.bezierCurveTo(28, 10, 32, 16, 32, 20);
  g.bezierCurveTo(32, 16, 36, 10, 42, 10);
  g.bezierCurveTo(58, 10, 60, 36, 32, 54);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.beginPath(); g.ellipse(21, 21, 5, 3.5, -0.6, 0, Math.PI * 2); g.fill();
};
const star = (g, col, points = 5, inner = 0.45) => {
  g.fillStyle = col;
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? 26 * inner : 26;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
};
const TEX = {};
function textures() {
  if (TEX.hearts) return TEX;
  TEX.hearts = makeTex((g) => heart(g, '#ff7fa0'));
  TEX.stars = makeTex((g) => { star(g, '#ffd35a'); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(27, 26, 4, 0, 7); g.fill(); });
  TEX.sparkle = makeTex((g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,.6)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    star(g, '#ffffff', 4, 0.18);
  });
  TEX.bubbles = makeTex((g) => {
    g.strokeStyle = 'rgba(150,210,255,.9)'; g.lineWidth = 4;
    g.fillStyle = 'rgba(220,240,255,.35)';
    g.beginPath(); g.arc(32, 32, 24, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(23, 22, 7, 4, -0.7, 0, 7); g.fill();
  });
  TEX.drops = makeTex((g) => {
    g.fillStyle = '#7cc8ff';
    g.beginPath(); g.moveTo(32, 6); g.bezierCurveTo(46, 28, 52, 36, 52, 42); g.arc(32, 42, 20, 0, Math.PI); g.bezierCurveTo(12, 36, 18, 28, 32, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(25, 40, 4, 7, 0.3, 0, 7); g.fill();
  });
  const glyph = (ch, col) => makeTex((g) => {
    g.font = 'bold 48px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.strokeText(ch, 32, 34);
    g.fillStyle = col; g.fillText(ch, 32, 34);
  });
  TEX.zzz = glyph('Z', '#9b8cf0');
  TEX.notes = glyph('♪', '#ff8fb0');
  TEX.steam = makeTex((g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
  return TEX;
}

// 종류마다 움직임: [크기, 수명, 위로 속도, 퍼짐, 중력]
const KIND = {
  hearts: [0.13, 1.6, 0.6, 0.35, -0.1],
  stars: [0.12, 1.1, 1.3, 0.9, 2.6],
  sparkle: [0.13, 0.8, 0.15, 0.25, 0],
  bubbles: [0.08, 1.4, 0.35, 0.25, -0.15],
  drops: [0.06, 0.8, 0.4, 0.3, 4.5],
  zzz: [0.13, 2.0, 0.35, 0.05, 0],
  notes: [0.13, 1.6, 0.5, 0.3, 0],
  steam: [0.12, 1.4, 0.25, 0.05, -0.05],
};

export class Particles {
  constructor(scene, { reducedMotion = false, max = 140 } = {}) {
    this.scene = scene;
    this.reduced = reducedMotion;
    const tex = textures();
    this.mats = {};
    this.pool = [];
    for (let i = 0; i < max; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.hearts, transparent: true, depthWrite: false }));
      s.visible = false;
      s.renderOrder = 10;
      s.userData = { life: 0 };
      scene.add(s);
      this.pool.push(s);
    }
    this.crowns = [];
  }

  burst(type, pos, n = 6) {
    if (type === 'crown') return this.crown(pos);
    const k = KIND[type];
    if (!k) return;
    const tex = textures()[type];
    const count = Math.max(1, Math.round(this.reduced ? n / 2 : n));
    for (let i = 0; i < count; i++) {
      const s = this.pool.find((p) => !p.visible);
      if (!s) return;
      s.material.map = tex;
      s.material.opacity = 1;
      s.material.rotation = type === 'notes' || type === 'zzz' ? (Math.random() - 0.5) * 0.5 : 0;
      s.position.copy(pos);
      s.position.x += (Math.random() - 0.5) * 0.08;
      s.position.z += (Math.random() - 0.5) * 0.08;
      const ang = Math.random() * Math.PI * 2;
      const spread = k[3] * (this.reduced ? 0.5 : 1);
      s.userData = {
        type, life: 0, max: k[1] * (0.8 + Math.random() * 0.4), size: k[0] * (0.75 + Math.random() * 0.5),
        vel: new THREE.Vector3(Math.cos(ang) * spread * Math.random(), k[2] * (0.7 + Math.random() * 0.6), Math.sin(ang) * spread * Math.random()),
        g: k[4], phase: Math.random() * 6,
      };
      if (type === 'zzz') s.userData.vel.x += 0.15;
      s.scale.setScalar(0.01);
      s.visible = true;
    }
  }

  // 큰 완료 효과: 여러 효과를 한꺼번에
  finish(effects, pos) {
    for (const e of effects) this.burst(e, pos, e === 'crown' ? 1 : 8);
  }

  crown(pos) {
    const g = group(this.scene);
    const gold = new THREE.MeshPhysicalMaterial({ color: '#ffd35a', roughness: 0.25, metalness: 0.3, clearcoat: 1, transparent: true });
    const gem = new THREE.MeshPhysicalMaterial({ color: '#ff7fa0', roughness: 0.1, clearcoat: 1, transparent: true });
    add(g, cyl(0.12, 0.11, 0.07, 24, true), gold, { p: [0, 0.035, 0] }).material.side = THREE.DoubleSide;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      add(g, cone(0.035, 0.09, 8), gold, { p: [Math.cos(a) * 0.105, 0.11, Math.sin(a) * 0.105] });
      add(g, sphere(0.018, 8, 6), gold, { p: [Math.cos(a) * 0.105, 0.16, Math.sin(a) * 0.105] });
      add(g, sphere(0.016, 8, 6), gem, { p: [Math.cos(a + 0.6) * 0.118, 0.035, Math.sin(a + 0.6) * 0.118] });
    }
    add(g, torus(0.115, 0.012, Math.PI * 2, 6, 24), gold, { p: [0, 0.005, 0], r: [Math.PI / 2, 0, 0] });
    g.position.copy(pos);
    g.scale.setScalar(0.01);
    g.userData = { life: 0, base: pos.clone(), mats: [gold, gem] };
    this.crowns.push(g);
    this.burst('sparkle', pos, 6);
  }

  update(dt, camera) {
    for (const s of this.pool) {
      if (!s.visible) continue;
      const u = s.userData;
      u.life += dt;
      const t = u.life / u.max;
      if (t >= 1) { s.visible = false; continue; }
      u.vel.y -= u.g * dt;
      s.position.addScaledVector(u.vel, dt);
      if (u.type === 'hearts' || u.type === 'bubbles' || u.type === 'notes') s.position.x += Math.sin(u.life * 4 + u.phase) * dt * 0.12;
      const grow = Math.min(1, t * 6);
      let size = u.size * grow;
      if (u.type === 'sparkle') size *= 0.6 + Math.abs(Math.sin(u.life * 12)) * 0.6;
      if (u.type === 'steam') size *= 1 + t * 2;
      s.scale.setScalar(Math.max(0.001, size));
      s.material.opacity = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
    }
    for (let i = this.crowns.length - 1; i >= 0; i--) {
      const g = this.crowns[i];
      const u = g.userData;
      u.life += dt;
      const t = u.life / 2.2;
      const pop = t < 0.2 ? Math.sin((t / 0.2) * Math.PI * 0.6) * 1.15 : 1;
      g.scale.setScalar(Math.max(0.01, pop));
      g.position.y = u.base.y + 0.08 + Math.sin(u.life * 3) * 0.02 + t * 0.1;
      g.rotation.y += dt * (this.reduced ? 0.5 : 2);
      const o = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      u.mats.forEach((m) => { m.opacity = o; });
      if (t >= 1) {
        g.removeFromParent();
        g.traverse((o2) => o2.geometry && o2.material && o2.material.dispose && null);
        u.mats.forEach((m) => m.dispose());
        this.crowns.splice(i, 1);
      }
    }
  }
}
