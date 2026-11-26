// 블록 코드 실행 관리 — ▶ 실행, ■ 멈춤, 한 단계씩, 이벤트(누르면) 스크립트를 맡아요.
// 스크립트는 한 번에 하나씩 차례대로 실행해요 (캐릭터가 한 명이니까요).
import { createRunner, StopRun } from './interpreter.js';
import { Canceled } from '../engine/brain.js';

export class RunController {
  constructor({ brain, char, state, editor, hooks = {} }) {
    Object.assign(this, { brain, char, state, editor, hooks });
    this.running = false;
    this.program = null;
    this.chain = Promise.resolve();
    this.pendingScripts = new Set();
    this.stepMode = false;
    this.stepResolve = null;
    this.lastRun = null;
  }

  // 미션에서 쓰는 실행 기록
  newRun() {
    const log = [];
    return {
      log, completed: false,
      done: (id) => log.filter((x) => x.action === id).length,
      doneBy: (id, via) => log.filter((x) => x.action === id && x.via === via).length,
    };
  }

  start(program) {
    if (this.running) return false;
    const hasBlocks = program.scripts.some((s) => s.body.length);
    if (!hasBlocks) { this.hooks.onState?.('블록이 없어요. 블록 꾸러미에서 블록을 넣어 보세요!', 'err'); return false; }
    this.program = JSON.parse(JSON.stringify(program));
    this.running = true;
    this.ctrl = new AbortController();
    this.run = this.newRun();
    this.brain.programActive = true;
    this.brain.interruptAutoWalk();
    this.hooks.onRunChange?.(true);
    const starts = this.program.scripts.filter((s) => s.event.type === 'start' && s.body.length);
    const listeners = this.program.scripts.filter((s) => s.event.type !== 'start' && s.body.length);
    this.listening = listeners.length > 0;
    if (starts.length) this.hooks.onState?.('▶ 실행 중…', '');
    else this.hooks.onState?.(this.waitingText(), '');
    for (const s of starts) this.enqueue(s);
    const token = this.run;
    this.chain.then(() => {
      if (!this.running || this.run !== token) return;
      this.run.completed = true;
      this.lastRun = this.run;
      this.hooks.onRunEnd?.(this.run);
      if (!this.listening) this.finish('끝까지 실행했어요! 🎉', 'ok');
      else this.hooks.onState?.(this.waitingText(), 'ok');
    });
    return true;
  }

  waitingText() {
    const names = this.program.scripts.filter((s) => s.event.type !== 'start' && s.body.length).map((s) => (s.event.type === 'clickChar' ? '모모' : this.hooks.thingName?.(s.event.thing) || s.event.thing));
    return `👂 기다리는 중 — ${[...new Set(names)].join(', ')}을(를) 눌러 보세요. 끝내려면 ■ 멈춤`;
  }

  enqueue(script) {
    if (this.pendingScripts.has(script.id)) return false;
    this.pendingScripts.add(script.id);
    const via = script.event.type;
    const token = this.run;
    this.chain = this.chain.then(async () => {
      if (!this.running || this.run !== token) return;
      const runner = createRunner({
        signal: this.ctrl.signal,
        perform: async (id) => {
          const r = await this.brain.request(id, 'program');
          if (r === 'done') this.run.log.push({ action: id, via });
        },
        wait: (sec) => this.brain.wait(sec, this.ctrl.signal),
        say: async (text) => { this.hooks.onSay?.(text, 1.8); await this.brain.wait(1.6, this.ctrl.signal); },
        face: async (expr) => { this.char.setExpression(expr, 2.5); await this.brain.wait(0.8, this.ctrl.signal); },
        gauge: (k) => this.state.get(k),
        onBlock: (id) => this.editor.setRunning(id),
        beforeBlock: () => this.waitStep(),
      });
      try {
        await runner.run(script);
      } catch (err) {
        if (err instanceof StopRun || err instanceof Canceled) {
          if (this.running) this.finish(err.message === '멈췄어요' || err instanceof Canceled ? '멈췄어요.' : err.message, err.message === '멈췄어요' ? '' : 'err');
        } else {
          console.error(err);
          this.finish('코드를 실행하다 문제가 생겼어요: ' + err.message, 'err');
        }
      } finally {
        this.pendingScripts.delete(script.id);
        this.editor.setRunning(null);
        if (this.running && via !== 'start') {
          this.lastRun = this.run;
          this.hooks.onRunEnd?.(this.run);
          this.hooks.onState?.(this.waitingText(), 'ok');
        }
      }
    });
    return true;
  }

  // 3D 화면에서 누른 것이 이벤트 스크립트와 맞으면 실행해요. 맞으면 true
  trigger(kind, id) {
    if (!this.running || !this.program) return false;
    const list = this.program.scripts.filter((s) => s.body.length && (
      (kind === 'character' && s.event.type === 'clickChar') || (kind === 'furniture' && s.event.type === 'clickThing' && s.event.thing === id)));
    if (!list.length) return false;
    let any = false;
    for (const s of list) any = this.enqueue(s) || any;
    this.hooks.onState?.(any ? '⚡ 이벤트 스크립트 실행!' : '⚡ 이미 실행 중이에요', '');
    return true;
  }

  setStepMode(on) {
    this.stepMode = on;
    if (!on && this.stepResolve) { this.stepResolve(); this.stepResolve = null; }
    this.hooks.onStepWait?.(false);
  }
  waitStep() {
    if (!this.stepMode) return Promise.resolve();
    this.hooks.onStepWait?.(true);
    return new Promise((resolve) => {
      this.stepResolve = () => { this.hooks.onStepWait?.(false); resolve(); };
      this.ctrl.signal.addEventListener('abort', () => resolve(), { once: true });
    });
  }
  next() { const r = this.stepResolve; this.stepResolve = null; r?.(); }

  stop() {
    if (!this.running) return;
    this.finish('멈췄어요.', '');
  }

  finish(message, kind) {
    if (!this.running) return;
    this.running = false;
    this.ctrl.abort();
    this.brain.cancelSource('program');
    this.brain.programActive = false;
    this.stepResolve = null;
    this.editor.setRunning(null);
    this.chain = Promise.resolve();
    this.pendingScripts.clear();
    this.hooks.onStepWait?.(false);
    this.hooks.onRunChange?.(false);
    this.hooks.onState?.(message, kind);
  }
}
