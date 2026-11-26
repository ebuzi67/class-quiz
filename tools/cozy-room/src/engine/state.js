// 캐릭터 상태(변수) — 기분, 졸림, 깨끗함. 0부터 100까지예요.
export const GAUGES = [
  { id: 'mood', name: '기분', emoji: '💖' },
  { id: 'sleepy', name: '졸림', emoji: '💤' },
  { id: 'clean', name: '깨끗함', emoji: '🫧' },
];

// 1초마다 저절로 바뀌는 양
const DRIFT = { mood: -0.12, sleepy: 0.3, clean: -0.25 };

export function createState(init = {}) {
  const values = { mood: 70, sleepy: 30, clean: 60, ...init };
  const listeners = new Set();
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const emit = () => listeners.forEach((fn) => fn(values));
  return {
    values,
    get: (k) => values[k],
    set(k, v) { values[k] = clamp(v); emit(); },
    add(changes = {}) {
      for (const [k, v] of Object.entries(changes)) if (k in values) values[k] = clamp(values[k] + v);
      emit();
    },
    tick(dt) {
      for (const [k, v] of Object.entries(DRIFT)) values[k] = clamp(values[k] + v * dt);
      emit();
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// '>65', '<40' 같은 글자 조건을 확인해요
export function testWant(value, rule) {
  const m = /^\s*([<>]=?|=)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(rule));
  if (!m) return false;
  const n = Number(m[2]);
  switch (m[1]) {
    case '>': return value > n;
    case '>=': return value >= n;
    case '<': return value < n;
    case '<=': return value <= n;
    default: return value === n;
  }
}
