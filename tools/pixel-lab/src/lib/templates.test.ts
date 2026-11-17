import { describe, expect, it } from 'vitest';
import { runAll } from '../engine/engine';
import { gridsEqual } from '../engine/types';
import { TEMPLATES, fromTemplate } from './templates';

describe('극장 예시 작품', () => {
  for (const t of TEMPLATES) {
    it(`${t.name}: 프레임마다 주문을 실행하면 같은 그림이 나와요`, () => {
      const a = fromTemplate(t);
      expect(a.frames.length).toBeGreaterThanOrEqual(2);
      for (const f of a.frames) {
        expect(f.pixels.length).toBe(t.size * t.size);
        const r = runAll(f.program, t.size, t.size);
        expect(r.error).toBeNull();
        expect(gridsEqual(r.grid, f.pixels)).toBe(true);
      }
    });
  }
});
