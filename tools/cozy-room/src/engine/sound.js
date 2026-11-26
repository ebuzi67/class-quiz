// 효과음 — 파일 없이 소리를 직접 만들어요 (Web Audio). 교실을 위해 처음에는 꺼져 있어요.
export class Sound {
  constructor() { this.on = false; this.ctx = null; }

  setOn(on) {
    this.on = on;
    if (on && !this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
    }
    if (on) this.ctx?.resume?.();
  }

  tone(freq, start, dur, type = 'sine', vol = 0.12) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  }

  play(name) {
    if (!this.on || !this.ctx) return;
    try {
      switch (name) {
        case 'click': this.tone(880, 0, 0.08, 'triangle', 0.08); break;
        case 'start': this.tone(660, 0, 0.1, 'sine', 0.06); this.tone(880, 0.07, 0.12, 'sine', 0.06); break;
        case 'finish': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, i * 0.07, 0.25, 'triangle', 0.07)); break;
        case 'mission': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.09, 0.35, 'triangle', 0.09)); break;
        case 'error': this.tone(300, 0, 0.18, 'square', 0.04); break;
        case 'pop': this.tone(520, 0, 0.06, 'sine', 0.08); break;
      }
    } catch { /* 소리가 안 나도 앱은 계속 돌아가요 */ }
  }
}
