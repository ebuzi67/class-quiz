// 몸동작 모음 — 행동(actions.js)의 motion 에 이 이름을 적어요.
// 함수 모양: (P 자세, t 지난 시간(초), p 진행률 0~1, ch 캐릭터, dt)
// 손 위치는 상체 기준 좌표예요: x 왼쪽(+)/오른쪽(-), y 위, z 앞
import * as THREE from 'three';

const S = Math.sin, C = Math.cos;
const F = {
  cheekL: [0.155, 0.5, 0.25], cheekR: [-0.155, 0.5, 0.25], mouth: [0, 0.455, 0.31], chin: [0, 0.41, 0.28],
  chest: [0, 0.2, 0.27], lap: [0.06, 0.08, 0.3],
};
const tmp = new THREE.Vector3();

// interval 초마다 한 번 true
function every(ch, key, interval) {
  const m = ch.motion;
  m.last = m.last || {};
  if (m.last[key] == null) m.last[key] = m.t - interval * 0.5;
  if (m.t - m.last[key] >= interval) { m.last[key] = m.t; return true; }
  return false;
}
const emit = (ch, type, pos, n) => ch.onEmit?.(type, pos.clone ? pos.clone() : pos, n);
const ease = (x) => x * x * (3 - 2 * x);

function showProductFront(P, ch) {
  ch.reach(P, 'R', -0.05, 0.27, 0.27);
  ch.reach(P, 'L', 0.06, 0.24, 0.27);
  P.headX = 0.22;
}

function patCheeks(P, t, ch, speed = 8) {
  const k = S(t * speed);
  ch.reach(P, 'L', F.cheekL[0] + 0.012, F.cheekL[1], F.cheekL[2] + 0.025 + 0.025 * k);
  ch.reach(P, 'R', F.cheekR[0] - 0.012, F.cheekR[1], F.cheekR[2] + 0.025 - 0.025 * k);
  P.headZ = 0.06 * S(t * 2.5);
}

export const LIE_MOTIONS = new Set(['nap']);
export const SIT_MOTIONS = new Set(['drink', 'read']);

export const motions = {
  idle() {},

  pat(P, t, p, ch, dt) {
    if (p < 0.28) {
      showProductFront(P, ch);
      ch.reach(P, 'L', 0.03, 0.22, 0.28);
    } else {
      P.showProduct = 0;
      patCheeks(P, t, ch);
      ch.fx.glow = Math.min(1, ch.fx.glow + dt * 0.05);
      if (every(ch, 'drop', 0.5)) emit(ch, 'sparkle', ch.faceWorld(tmp, 0.18, -0.05), 1);
    }
  },

  dropper(P, t, p, ch, dt) {
    if (p < 0.4) {
      ch.reach(P, 'R', -0.09, 0.56, 0.36);
      ch.reach(P, 'L', 0.05, 0.22, 0.26);
      P.headX = -0.08; P.headZ = 0.1;
      if (p > 0.12 && every(ch, 'drop', 0.55)) emit(ch, 'drops', ch.faceWorld(tmp, -0.12, 0.0, 0.36), 1);
    } else {
      P.showProduct = 0;
      patCheeks(P, t, ch, 6);
      ch.fx.glow = Math.min(1, ch.fx.glow + dt * 0.06);
    }
  },

  washFace(P, t, p, ch, dt) {
    P.lean = 0.32; P.headX = 0.25;
    if (p < 0.18) {
      showProductFront(P, ch);
      return;
    }
    P.showProduct = 0;
    const a = t * 7;
    ch.reach(P, 'L', F.cheekL[0] + 0.02 * C(a), F.cheekL[1] + 0.03 * S(a), 0.28);
    ch.reach(P, 'R', F.cheekR[0] - 0.02 * C(a + 1), F.cheekR[1] + 0.03 * S(a + 1), 0.28);
    if (p < 0.65) ch.fx.foam = Math.min(1, ch.fx.foam + dt * 1.5);
    else {
      ch.fx.foam = Math.max(0, ch.fx.foam - dt * 2.2);
      if (every(ch, 'splash', 0.25)) emit(ch, 'drops', ch.faceWorld(tmp, 0, -0.1, 0.4), 3);
    }
    if (every(ch, 'bub', 0.4)) emit(ch, 'bubbles', ch.faceWorld(tmp, 0, 0.05, 0.3), 2);
    ch.fx.glow = Math.min(1, ch.fx.glow + dt * 0.03);
  },

  brushTeeth(P, t, p, ch) {
    const k = S(t * 18) * 0.03;
    ch.reach(P, 'R', -0.06 + k, 0.45, 0.33);
    P.gripRoll = Math.PI / 2 + 0.2;
    P.gripTilt = -0.3;
    ch.reach(P, 'L', 0.22, 0.12, 0.08);
    P.headZ = 0.05 * S(t * 3);
    if (every(ch, 'bub', 0.6)) emit(ch, 'bubbles', ch.faceWorld(tmp, 0.04, -0.12, 0.34), 1);
  },

  lipBalm(P, t, p, ch, dt) {
    if (p < 0.2) { showProductFront(P, ch); return; }
    const k = S(t * 3) * 0.035;
    ch.reach(P, 'R', -0.04 + k, 0.46, 0.33);
    P.gripRoll = Math.PI / 2;
    ch.reach(P, 'L', 0.05, 0.22, 0.25);
    P.headX = -0.05;
    ch.fx.gloss = Math.min(1, ch.fx.gloss + dt * 0.4);
    if (every(ch, 'sp', 0.6)) emit(ch, 'sparkle', ch.faceWorld(tmp, 0.05, -0.12, 0.33), 1);
  },

  blush(P, t, p, ch, dt) {
    // 팩트는 왼손 앞, 오른손으로 볼을 톡톡
    ch.reach(P, 'L', 0.05, 0.27, 0.28);
    const side = Math.floor(t / 1.1) % 2 === 0 ? -1 : 1;
    const tap = Math.abs(S(t * 9)) * 0.03;
    ch.reach(P, 'R', side * 0.15, 0.49, 0.27 + tap);
    P.headZ = side * -0.08;
    P.showProduct = p < 0.25 ? 1 : 0;
    if (p >= 0.25) {
      ch.fx.blush = Math.min(1, ch.fx.blush + dt * 0.35);
      if (every(ch, 'h', 0.7)) emit(ch, 'hearts', ch.faceWorld(tmp, side * 0.18, -0.05, 0.3), 1);
    }
  },

  comb(P, t, p, ch, dt) {
    const cyc = (t % 1.2) / 1.2;
    const y = 0.6 - ease(Math.min(1, cyc * 1.25)) * 0.33;
    ch.reach(P, 'R', -0.3, y, 0.1);
    P.gripRoll = -0.4;
    P.headZ = -0.14; P.headY = 0.1;
    ch.reach(P, 'L', 0.18, 0.16, 0.2);
    ch.fx.hairShine = Math.min(1, ch.fx.hairShine + dt * 0.25);
    if (cyc > 0.7 && every(ch, 's', 1.2)) emit(ch, 'sparkle', ch.faceWorld(tmp, -0.32, -0.25, 0.05), 1);
  },

  sunscreen(P, t, p, ch, dt) {
    if (p < 0.25) {
      showProductFront(P, ch);
      ch.reach(P, 'L', 0.04, 0.24, 0.29);
      if (p > 0.18) ch.fx.dots = Math.min(1, ch.fx.dots + dt * 6);
      return;
    }
    P.showProduct = 0;
    const a = t * 6;
    ch.reach(P, 'L', F.cheekL[0] + 0.02 * C(a), F.cheekL[1] + 0.025 * S(a), 0.28);
    ch.reach(P, 'R', F.cheekR[0] - 0.02 * C(a), F.cheekR[1] + 0.025 * S(a), 0.28);
    ch.fx.dots = Math.max(0, 1 - (p - 0.25) / 0.6);
    ch.fx.glow = Math.min(1, ch.fx.glow + dt * 0.04);
  },

  maskPack(P, t, p, ch, dt) {
    P.sit = 1;
    if (p < 0.15) {
      ch.reach(P, 'L', 0.1, 0.62, 0.3);
      ch.reach(P, 'R', -0.1, 0.62, 0.3);
      ch.fx.mask = Math.min(1, p / 0.12);
      P.showProduct = p < 0.06 ? 1 : 0;
    } else if (p < 0.88) {
      P.showProduct = 0;
      ch.fx.mask = 1;
      ch.reach(P, 'L', 0.12, 0.05, 0.28);
      ch.reach(P, 'R', -0.12, 0.05, 0.28);
      P.headX = -0.15 + S(t * 1.2) * 0.04;
      P.headZ = S(t * 0.9) * 0.1;
      if (every(ch, 'sp', 1.1)) emit(ch, 'sparkle', ch.faceWorld(tmp, 0, 0.05, 0.34), 1);
    } else {
      P.showProduct = 0;
      ch.reach(P, 'L', 0.16, 0.6, 0.3);
      ch.reach(P, 'R', -0.16, 0.6, 0.3);
      ch.fx.mask = Math.max(0, 1 - (p - 0.88) / 0.1);
      ch.fx.glow = Math.min(1, ch.fx.glow + dt * 0.5);
    }
  },

  drink(P, t, p, ch) {
    P.sit = 1;
    const cyc = t % 2.4;
    const sip = cyc > 0.9 && cyc < 1.9;
    if (sip) {
      ch.reach(P, 'R', -0.03, 0.43, 0.31);
      P.gripTilt = 0.7; P.headX = -0.12;
    } else {
      ch.reach(P, 'R', -0.04, 0.24, 0.3);
      P.headX = 0.12;
    }
    ch.reach(P, 'L', 0.02, sip ? 0.38 : 0.2, 0.29);
    if (every(ch, 'steam', 0.7)) emit(ch, 'steam', ch.handWorld('R', tmp).add(new THREE.Vector3(0, 0.06, 0)), 1);
    if (sip && every(ch, 'h', 2.4)) emit(ch, 'hearts', ch.faceWorld(tmp, 0.15, 0.1), 1);
  },

  read(P, t, p, ch) {
    P.sit = 1;
    ch.reach(P, 'R', -0.06, 0.24, 0.3);
    ch.reach(P, 'L', 0.08, 0.24, 0.29);
    P.headX = 0.18 + S(t * 0.8) * 0.04;
    P.headZ = S(t * 0.6) * 0.06;
    if (every(ch, 'page', 1.6)) emit(ch, 'notes', ch.faceWorld(tmp, 0.2, 0.2), 1);
  },

  nap(P, t, p, ch) {
    P.lie = 1;
    P.armLX = 0.1; P.armLZ = 0.15; P.elbowL = 0.5;
    P.armRX = 0.1; P.armRZ = 0.15; P.elbowR = 0.5;
    P.headY = S(t * 0.4) * 0.15;
    P.bodyY = S(t * 1.5) * 0.008;
    if (every(ch, 'z', 1.1)) emit(ch, 'zzz', ch.faceWorld(tmp, 0, 0.3), 1);
  },

  water(P, t, p, ch) {
    const pour = p > 0.2 && p < 0.85;
    ch.reach(P, 'R', -0.12, 0.22, 0.32);
    P.gripTilt = pour ? 0.75 + S(t * 4) * 0.06 : 0;
    ch.reach(P, 'L', 0.2, 0.12, 0.14);
    P.lean = 0.12; P.headX = 0.2;
    if (pour && every(ch, 'w', 0.18) && ch.held?.userData.spout) {
      const sp = ch.held.localToWorld(ch.held.userData.spout.clone());
      emit(ch, 'drops', sp, 2);
    }
  },

  tidy(P, t, p, ch) {
    const cyc = (t % 1.5) / 1.5;
    const down = cyc < 0.5;
    P.lean = down ? 0.65 : 0.2;
    P.bodyY = down ? -0.05 : 0;
    P.legL = down ? -0.3 : 0; P.legR = down ? 0.3 : 0;
    ch.reach(P, 'L', 0.1, down ? -0.08 : 0.28, down ? 0.32 : 0.34);
    ch.reach(P, 'R', -0.1, down ? -0.08 : 0.28, down ? 0.32 : 0.34);
    P.headX = down ? 0.3 : 0;
  },

  press(P, t, p, ch) {
    const reachOut = p > 0.25 && p < 0.75;
    if (reachOut) ch.reach(P, 'R', -0.05, 0.42, 0.42);
    P.headX = -0.1;
    if (reachOut && every(ch, 'press', 5)) emit(ch, 'sparkle', ch.handWorld('R', tmp), 2);
  },

  dance(P, t, p, ch) {
    const b = t * 6;
    P.armLX = 2.4 + S(b) * 0.4; P.armLZ = 0.5 + S(b) * 0.3; P.elbowL = 0.6;
    P.armRX = 2.4 - S(b) * 0.4; P.armRZ = 0.5 - S(b) * 0.3; P.elbowR = 0.6;
    P.bodyY = Math.abs(S(b)) * 0.06;
    P.twist = S(b * 0.5) * 0.35;
    P.headZ = S(b) * 0.15;
    P.legL = Math.max(0, S(b)) * 0.4; P.legR = Math.max(0, -S(b)) * 0.4;
    if (every(ch, 'n', 0.6)) emit(ch, 'notes', ch.headTop(tmp), 1);
  },

  stretch(P, t, p, ch) {
    const up = ease(Math.min(1, p * 2.5)) * (p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1);
    P.armLX = 0.05 + up * 2.9; P.armLZ = 0.2 + up * 0.05; P.elbowL = 0.25 - up * 0.2;
    P.armRX = 0.05 + up * 2.9; P.armRZ = 0.2 + up * 0.05; P.elbowR = 0.25 - up * 0.2;
    P.lean = -0.12 * up; P.headX = -0.25 * up;
    P.bodyY = 0.03 * up;
  },

  wave(P, t, p, ch) {
    P.armRX = 2.5; P.armRZ = 0.55 + S(t * 9) * 0.3; P.elbowR = 0.5;
    P.headZ = 0.12;
  },

  jump(P, t, p, ch) {
    const cyc = (t % 0.66) / 0.66;
    const h = S(cyc * Math.PI);
    P.bodyY = h * 0.22;
    P.legL = P.legR = -h * 0.3;
    P.armLX = P.armRX = 0.4 + h * 1.6;
    P.armLZ = P.armRZ = 0.5;
    P.elbowL = P.elbowR = 0.3;
    if (cyc < 0.08 && every(ch, 'j', 0.6)) emit(ch, 'stars', ch.position, 1);
  },
};
