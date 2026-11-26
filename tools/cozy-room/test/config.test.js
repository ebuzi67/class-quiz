import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/engine/validate.js';
import { furniture } from '../src/config/furniture.js';
import { products } from '../src/config/products.js';
import { actions } from '../src/config/actions.js';
import { missions } from '../src/config/missions.js';
import { NavGrid } from '../src/engine/path.js';
import { blockFurniture } from '../src/engine/names.js';
import { createState, testWant } from '../src/engine/state.js';

describe('설정 파일', () => {
  it('기본 설정에는 잘못된 곳이 없어요', () => {
    const r = validateConfig({ furniture, products, actions });
    expect(r.warnings).toEqual([]);
    expect(r.actions).toHaveLength(actions.length);
  });

  it('미션 id가 겹치지 않아요', () => {
    expect(new Set(missions.map((m) => m.id)).size).toBe(missions.length);
  });

  it('잘못 적어도 멈추지 않고 한국어로 알려 줘요', () => {
    const r = validateConfig({
      furniture: [...furniture, { id: 'bed', type: 'bed', pos: [0, 0] }, { id: 'ufo', type: 'spaceship', pos: [0, 0] }],
      products: [...products, { id: 'x', shape: 'banana' }],
      actions: [...actions, { id: 'fly', name: '날기', target: 'moon', motion: 'pat' }, { id: 'spin', motion: 'helicopter' }, { id: 'ok', motion: 'wave', duration: -1, finish: 'boom' }],
    });
    expect(r.warnings.length).toBeGreaterThanOrEqual(6);
    expect(r.warnings.join('\n')).toMatch(/가구가 없어요/);
    expect(r.actions.find((a) => a.id === 'ok').duration).toBe(3);
  });

  it('모든 서는 자리까지 길이 있어요', () => {
    const r = validateConfig({ furniture, products, actions });
    const grid = new NavGrid();
    for (const f of r.furniture) blockFurniture(grid, f);
    for (const f of r.furniture) {
      const to = [f.pos[0] + f.spot[0], f.pos[1] + f.spot[1]];
      const path = grid.findPath([0.2, 1.5], to);
      expect(path.at(-1)).toEqual(to);
      expect(path.length).toBeLessThan(10);
    }
  });
});

describe('길 찾기와 상태', () => {
  it('가운데 벽을 돌아서 가요', () => {
    const g = new NavGrid();
    g.block(0, 0, 0.4, 4.6, 0, 0.1);
    const path = g.findPath([-2, 0], [2, 0]);
    expect(path.length).toBeGreaterThan(1);
    let prev = [-2, 0];
    for (const p of path) { expect(g.clearLine(prev[0], prev[1], p[0], p[1]) || p === path.at(-1)).toBe(true); prev = p; }
  });

  it('상태는 0~100 사이, 조건 글자를 읽어요', () => {
    const s = createState();
    s.add({ clean: 999, mood: -999 });
    expect(s.values.clean).toBe(100);
    expect(s.values.mood).toBe(0);
    expect(testWant(70, '>65')).toBe(true);
    expect(testWant(30, '<= 30')).toBe(true);
    expect(testWant(30, 'abc')).toBe(false);
  });
});
