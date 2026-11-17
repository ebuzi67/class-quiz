import { describe, expect, it } from 'vitest';
import { insertBlock, locate, moveBlock, nudge, removeBlock, updateBlock } from './tree';
import { Program, mv, paint, rep } from './types';

const shape = (p: Program): string => p.map((b) => (b.type === 'repeat' ? `[${shape(b.body)}]` : b.type === 'move' ? b.dir[0] : 'P')).join('');

describe('블록 편집', () => {
  it('넣기·빼기·고치기', () => {
    const loop = rep(2, []);
    let p: Program = [paint(), loop];
    p = insertBlock(p, { parentId: loop.id, index: 0 }, mv('right'));
    p = insertBlock(p, { parentId: null, index: 0 }, mv('down'));
    expect(shape(p)).toBe('dP[r]');
    p = updateBlock(p, loop.id, (b) => ({ ...b, times: 5 } as typeof b));
    expect((p[2] as { times: number }).times).toBe(5);
    expect(shape(removeBlock(p, loop.id))).toBe('dP');
  });

  it('끌어서 옮기기: 같은 줄, 반복 안으로, 자기 안으로는 안 돼요', () => {
    const a = paint(), b = mv('right'), loop = rep(2, [mv('up')]);
    const p: Program = [a, b, loop];
    expect(shape(moveBlock(p, a.id, { parentId: null, index: 2 }))).toBe('rP[u]');
    expect(shape(moveBlock(p, a.id, { parentId: loop.id, index: 1 }))).toBe('r[uP]');
    expect(moveBlock(p, loop.id, { parentId: loop.id, index: 0 })).toBe(p);
  });

  it('위·아래 버튼: 반복 블록을 드나들어요', () => {
    const a = paint(), loop = rep(2, [mv('up')]);
    let p: Program = [a, loop];
    p = nudge(p, a.id, 1); expect(shape(p)).toBe('[Pu]');
    p = nudge(p, a.id, 1); expect(shape(p)).toBe('[uP]');
    p = nudge(p, a.id, 1); expect(shape(p)).toBe('[u]P');
    p = nudge(p, a.id, 1); expect(shape(p)).toBe('[u]P');
    p = nudge(p, a.id, -1); expect(shape(p)).toBe('[uP]');
    p = nudge(p, a.id, -1); p = nudge(p, a.id, -1); expect(shape(p)).toBe('P[u]');
    expect(locate(p, a.id)).toEqual({ parentId: null, index: 0 });
  });
});
