// 행동 실행기(뇌) — 부탁받은 행동을 줄 세우고, 없으면 스스로 할 일을 골라요.
// 행동 순서: (물건 집으러 가기) → 가구까지 걷기 → 방향 맞추기 → (앉기/눕기) → 동작 → 효과 → 정리
import { motions, LIE_MOTIONS } from './motions.js';
import { testWant } from './state.js';
import { HIP } from './character.js';

export class Canceled extends Error {
  constructor() { super('취소됐어요'); this.name = 'Canceled'; }
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Brain {
  constructor({ world, char, actions, state, particles, sound, getCameraPos, hooks = {} }) {
    Object.assign(this, { world, char, state, particles, sound, getCameraPos, hooks });
    this.actions = new Map(actions.map((a) => [a.id, a]));
    this.queue = [];
    this.waiters = [];
    this.current = null;
    this.auto = true;
    this.programActive = false;
    this.lastAuto = null;
    this.time = 0;
    this.seated = null;
    this.running = false;
  }

  // ── 게임 시간 기다리기 (배속·탭 숨김을 따라가요) ──
  wait(sec, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Canceled());
      const w = { end: this.time + sec, resolve, reject, signal };
      this.waiters.push(w);
    });
  }
  until(cond, signal, timeout = 30) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Canceled());
      if (cond()) return resolve();
      this.waiters.push({ cond, end: this.time + timeout, resolve, reject, signal });
    });
  }

  tick(dt) {
    this.time += dt;
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      const w = this.waiters[i];
      if (w.signal?.aborted) { this.waiters.splice(i, 1); w.reject(new Canceled()); continue; }
      if ((w.cond && w.cond()) || this.time >= w.end) { this.waiters.splice(i, 1); w.resolve(); }
    }
  }

  // ── 부탁하기 ──
  // source: 'click'(메뉴) 'program'(블록 코드)
  request(actionId, source = 'click', meta = {}) {
    const action = this.actions.get(actionId);
    if (!action) return Promise.reject(new Error(`"${actionId}" 행동이 없어요`));
    if (source === 'click') {
      const dup = this.queue.find((r) => r.action.id === actionId && r.source === 'click');
      if (dup) return dup.promise.then(() => 'duplicate');
      if (this.current?.action.id === actionId && this.current.source === 'click') return Promise.resolve('duplicate');
      if (this.queue.filter((r) => r.source === 'click').length >= 4) return Promise.resolve('full');
    }
    const req = { action, source, meta };
    req.promise = new Promise((resolve, reject) => { req.resolve = resolve; req.reject = reject; });
    req.promise.catch(() => {});
    // 블록 코드는 클릭 부탁보다 먼저 해요
    if (source === 'program') {
      const i = this.queue.findIndex((r) => r.source !== 'program');
      this.queue.splice(i < 0 ? this.queue.length : i, 0, req);
    } else this.queue.push(req);
    this.interruptAutoWalk();
    this.hooks.onQueue?.(this.queue);
    return req.promise;
  }

  // 자동 행동이 아직 걸어가는 중이면 멈추고 부탁부터 들어줘요 (이미 시작한 행동은 끝까지 해요)
  interruptAutoWalk() {
    const c = this.current;
    if (c && c.source === 'auto' && c.phase === 'go') c.ctrl.abort();
  }

  // 블록 코드를 멈출 때: 코드가 시킨 행동을 모두 취소해요
  cancelSource(source) {
    this.queue = this.queue.filter((r) => {
      if (r.source !== source) return true;
      r.reject(new Canceled());
      return false;
    });
    if (this.current?.source === source) this.current.ctrl.abort();
    this.hooks.onQueue?.(this.queue);
  }

  setAuto(on) {
    this.auto = on;
    if (!on) this.interruptAutoWalk();
  }

  // ── 자동으로 할 일 고르기 ──
  pickAuto() {
    const v = this.state.values;
    const list = [];
    let total = 0;
    for (const a of this.actions.values()) {
      let w = a.weight ?? 1;
      if (w <= 0 || a.id === this.lastAuto) continue;
      if (a.wants) for (const [k, rule] of Object.entries(a.wants)) if (k in v && testWant(v[k], rule)) w *= 4;
      if (a.motion === 'tidy') w *= this.world.messCount ? 1 + this.world.messCount : 0;
      if (a.motion === 'nap' && v.sleepy < 40) w *= 0.2;
      if (w <= 0) continue;
      total += w;
      list.push([a, total]);
    }
    const r = Math.random() * total;
    return list.find(([, t]) => r < t)?.[0] || null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  async loop() {
    while (this.running) {
      try {
        let req = this.queue.shift();
        if (req) this.hooks.onQueue?.(this.queue);
        if (!req) {
          if (this.auto && !this.programActive) {
            const a = this.pickAuto();
            if (!a) { await this.wait(1); continue; }
            req = { action: a, source: 'auto', resolve() {}, reject() {} };
            this.lastAuto = a.id;
          } else {
            this.hooks.onStatus?.(this.programActive ? '코드를 기다리는 중…' : '쉬는 중 (자동 행동 멈춤)', 'idle');
            await this.until(() => this.queue.length > 0 || (this.auto && !this.programActive), null, 3);
            continue;
          }
        }
        try {
          await this.perform(req);
          req.resolve('done');
        } catch (err) {
          req.reject(err instanceof Canceled ? err : new Canceled());
          if (!(err instanceof Canceled)) console.error(err);
        }
        // 자동 행동 사이에는 잠깐 쉬어요
        if (!this.queue.length && this.auto && !this.programActive) {
          this.hooks.onStatus?.('두리번두리번…', 'idle');
          this.char.setExpression('happy');
          await this.wait(0.8 + Math.random() * 1.2);
        }
      } catch (err) {
        console.error(err);
        await this.wait(1).catch(() => {});
      }
    }
  }

  async walkTo(point, signal) {
    const ch = this.char;
    const from = [ch.position.x, ch.position.z];
    if (Math.hypot(point[0] - from[0], point[1] - from[1]) < 0.05) return;
    ch.walkPath(this.world.grid.findPath(from, point));
    try {
      await this.until(() => !ch.walking, signal, 25);
    } finally {
      ch.stopWalking();
    }
  }

  async turnTo(angle, signal) {
    this.char.faceTo(angle);
    await this.until(() => !this.char.turning, signal, 2);
  }

  angleTo(x, z) { return Math.atan2(x - this.char.position.x, z - this.char.position.z); }

  faceAngle(action) {
    const f = action.face;
    if (typeof f === 'number') return (f * Math.PI) / 180;
    if (f === 'camera' || !action.target) {
      const cam = this.getCameraPos();
      return this.angleTo(cam.x, cam.z);
    }
    const c = this.world.center(action.target);
    return this.angleTo(c[0], c[1]);
  }

  async perform(req) {
    const { action } = req;
    const ctrl = new AbortController();
    const sig = ctrl.signal;
    const ch = this.char;
    const w = this.world;
    this.current = { action, source: req.source, phase: 'go', ctrl };
    this.hooks.onAction?.(action, req.source, 'start');
    const verb = `${action.emoji} ${action.name}`;
    let mesh = null;
    let seated = false;
    try {
      // 1) 물건을 다른 곳에서 집어 와야 하면 먼저 가요
      const home = action.product ? w.products.get(action.product)?.cfg.home : null;
      if (action.pickup && home && home !== action.target) {
        this.hooks.onStatus?.(`${verb} — 물건 가지러 가는 중`, 'go');
        await this.walkTo(w.spot(home), sig);
        const c = w.center(home);
        await this.turnTo(this.angleTo(c[0], c[1]), sig);
        ch.motion = { fn: motions.press, t: 0, dur: 0.7 };
        await this.wait(0.45, sig);
        mesh = w.takeProduct(action.product);
        ch.hold(mesh);
        await this.wait(0.25, sig);
        ch.motion = null;
      }
      // 2) 가구까지 걸어가요
      if (action.target) {
        this.hooks.onStatus?.(`${verb} — 가는 중`, 'go');
        await this.walkTo(w.spot(action.target), sig);
      }
      // 3) 앉거나 눕거나, 알맞은 방향으로 서요
      const seat = action.seat ? w.seat(action.target) : null;
      const lie = LIE_MOTIONS.has(action.motion);
      if (seat) {
        await this.turnTo(this.angleTo(seat.x, seat.z), sig);
        this.current.phase = 'do';
        ch.hopTo(seat.x, lie ? seat.y : seat.y - HIP + 0.05, seat.z, 0.5);
        seated = true;
        this.seated = seat;
        const faceA = seat.face === 'camera' ? this.faceAngle({ face: 'camera' }) : ((seat.face ?? 0) * Math.PI) / 180;
        ch.faceTo(faceA);
        ch.sitting = !lie;
        await this.until(() => !ch.hopping, sig, 2);
        if (lie) {
          ch.motion = { fn: (P, t) => { P.lie = Math.min(1, t / 0.5); }, t: 0, dur: 1 };
          await this.wait(0.45, sig);
          const quilt = w.furniture.get(action.target)?.parts.quilt;
          if (quilt) quilt.visible = true;
        }
        await this.until(() => !ch.turning, sig, 1.5);
      } else {
        await this.turnTo(this.faceAngle(action), sig);
      }
      // 4) 행동 시작! (여기부터는 끝까지 해요)
      this.current.phase = 'do';
      if (!mesh && action.product) {
        mesh = w.takeProduct(action.product);
        ch.hold(mesh);
      }
      this.hooks.onStatus?.(`${verb} 하는 중`, 'do');
      ch.setExpression(action.expression);
      if (action.say) this.hooks.onSay?.(action.say, 2);
      this.sound?.play('start');
      if (action.onStart) this.safeHook(action, 'onStart');
      ch.motion = { fn: motions[action.motion] || motions.idle, t: 0, dur: action.duration };
      await this.wait(action.duration, sig);
      ch.motion = null;
      // 5) 완료 효과
      this.state.add(action.effects || {});
      if (action.glow) ch.fx.glow = Math.min(1, ch.fx.glow + action.glow);
      const top = ch.headTop();
      for (const e of action.finish || []) this.particles.burst(e, e === 'crown' ? top.clone() : top.clone().setY(top.y - 0.15), e === 'crown' ? 1 : 8);
      this.sound?.play('finish');
      if (action.onFinish) this.safeHook(action, 'onFinish');
      this.hooks.onAction?.(action, req.source, 'done');
      ch.setExpression(lie ? 'happy' : 'proud', 1.3);
      if (lie) this.hooks.onSay?.('잘 잤다~!', 1.5);
      await this.wait(0.7, sig);
    } finally {
      // 6) 정리 — 취소돼도 꼭 해요
      ch.motion = null;
      ch.stopWalking();
      ch.fx.foam = 0; ch.fx.mask = 0; ch.fx.dots = 0;
      const quilt = action.target && w.furniture.get(action.target)?.parts.quilt;
      if (quilt) quilt.visible = false;
      ch.sitting = false;
      if (seated) {
        const spot = w.spot(action.target);
        ch.hopTo(spot[0], 0, spot[1], 0.45);
        this.seated = null;
        await this.until(() => !ch.hopping, null, 2).catch(() => {});
      }
      if (ch.held) {
        ch.release();
        w.returnProduct(action.product);
        const p = w.products.get(action.product)?.mesh;
        if (p?.parent) {
          const wp = p.getWorldPosition(ch.position.clone());
          wp.y += 0.1;
          this.particles.burst('sparkle', wp, 2);
        }
      }
      if (this.current?.ctrl === ctrl) this.current = null;
    }
  }

  safeHook(action, name) {
    try {
      action[name](this.world, { char: this.char, state: this.state, say: (t) => this.hooks.onSay?.(t, 2) });
    } catch (err) {
      console.warn(`행동 "${action.name}"의 ${name}에서 문제가 생겼어요`, err);
      this.hooks.onWarn?.(`행동 "${action.name}"의 ${name} 함수에 문제가 있어요.`);
    }
  }
}
