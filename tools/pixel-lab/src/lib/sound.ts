// 작은 효과음. 파일 없이 브라우저의 소리 합성 기능으로 만들어요.
let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export type SoundName = 'add' | 'move' | 'paint' | 'color' | 'erase' | 'success' | 'retry' | 'error' | 'click';

export function play(name: SoundName) {
  if (muted) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    switch (name) {
      case 'add': tone(660, 0, 0.08, 'triangle'); break;
      case 'click': tone(520, 0, 0.05, 'triangle', 0.05); break;
      case 'move': tone(440, 0, 0.05, 'sine', 0.05); break;
      case 'paint': tone(784, 0, 0.09, 'triangle'); tone(1175, 0.04, 0.09, 'sine', 0.04); break;
      case 'color': tone(587, 0, 0.07, 'sine'); tone(880, 0.05, 0.07, 'sine', 0.05); break;
      case 'erase': tone(330, 0, 0.08, 'sine', 0.05); break;
      case 'success': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle')); break;
      case 'retry': tone(494, 0, 0.14, 'sine', 0.06); tone(440, 0.12, 0.18, 'sine', 0.06); break;
      case 'error': tone(311, 0, 0.16, 'sine', 0.07); tone(262, 0.13, 0.22, 'sine', 0.07); break;
    }
  } catch { /* 소리가 안 나도 앱은 계속돼요 */ }
}
