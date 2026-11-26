// 카메라 — 드래그·터치로 돌리고, 휠·핀치로 확대해요. 방 밖으로 너무 나가지 않게 막아요.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const HOME = { pos: new THREE.Vector3(5.0, 5.0, 7.0), target: new THREE.Vector3(-0.1, 0.7, -0.1) };
const BOUNDS = { minX: -3, maxX: 3, minY: 0.3, maxY: 2.2, minZ: -2.5, maxZ: 2.5 };

export class CameraRig {
  constructor(camera, dom, { reducedMotion = false } = {}) {
    this.camera = camera;
    this.reduced = reducedMotion;
    camera.position.copy(HOME.pos);
    const c = new OrbitControls(camera, dom);
    c.target.copy(HOME.target);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 4.5;
    c.maxDistance = 17;
    c.minPolarAngle = 0.35;
    c.maxPolarAngle = 1.38;
    // 벽 뒤로는 못 돌아가게
    c.minAzimuthAngle = -0.35;
    c.maxAzimuthAngle = 1.45;
    c.screenSpacePanning = true;
    c.panSpeed = 0.7;
    c.rotateSpeed = 0.7;
    c.zoomSpeed = 0.9;
    c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls = c;
    this.anim = null;
    this.fitAspect(camera.aspect);
  }

  // 세로 화면(휴대폰)에서는 조금 멀리서 봐요
  fitAspect(aspect) {
    this.homeDist = aspect < 0.8 ? 1.45 : aspect < 1.2 ? 1.2 : 1;
  }

  homePos() {
    return HOME.target.clone().add(HOME.pos.clone().sub(HOME.target).multiplyScalar(this.homeDist));
  }

  reset(instant = false) {
    const to = this.homePos();
    if (instant || this.reduced) {
      this.camera.position.copy(to);
      this.controls.target.copy(HOME.target);
      this.controls.update();
      return;
    }
    this.anim = { t: 0, fromP: this.camera.position.clone(), fromT: this.controls.target.clone(), toP: to, toT: HOME.target.clone() };
  }

  // 키보드로 돌리기 (화살표, +, -)
  nudge(dAzimuth, dPolar, zoom = 1) {
    const c = this.controls;
    const off = this.camera.position.clone().sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta = THREE.MathUtils.clamp(sph.theta + dAzimuth, c.minAzimuthAngle, c.maxAzimuthAngle);
    sph.phi = THREE.MathUtils.clamp(sph.phi + dPolar, c.minPolarAngle, c.maxPolarAngle);
    sph.radius = THREE.MathUtils.clamp(sph.radius * zoom, c.minDistance, c.maxDistance);
    this.camera.position.copy(c.target).add(new THREE.Vector3().setFromSpherical(sph));
  }

  update(dt) {
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / 0.8);
      const e = 1 - Math.pow(1 - a.t, 3);
      this.camera.position.lerpVectors(a.fromP, a.toP, e);
      this.controls.target.lerpVectors(a.fromT, a.toT, e);
      if (a.t >= 1) this.anim = null;
    }
    const t = this.controls.target;
    t.x = THREE.MathUtils.clamp(t.x, BOUNDS.minX, BOUNDS.maxX);
    t.y = THREE.MathUtils.clamp(t.y, BOUNDS.minY, BOUNDS.maxY);
    t.z = THREE.MathUtils.clamp(t.z, BOUNDS.minZ, BOUNDS.maxZ);
    this.controls.update();
  }
}
