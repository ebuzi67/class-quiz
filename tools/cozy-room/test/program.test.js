import { describe, it, expect } from 'vitest';
import { emptyProgram, newBlock, newScript, insertBlock, moveBlock, removeBlock, flatten, encodeProgram, decodeProgram, sanitizeProgram, toCode, LIMITS } from '../src/blocks/program.js';

describe('블록 프로그램', () => {
  it('블록을 넣고, 옮기고, 지워요', () => {
    const p = emptyProgram();
    const s = p.scripts[0];
    const a = newBlock('action', { action: 'washFace' });
    const r = newBlock('repeat');
    expect(insertBlock(p, s.id, 0, a)).toBe(true);
    expect(insertBlock(p, s.id, 1, r)).toBe(true);
    expect(moveBlock(p, a.id, `${r.id}:body`, 0)).toBe(true);
    expect(s.body).toHaveLength(1);
    expect(r.body[0].id).toBe(a.id);
    expect(moveBlock(p, r.id, `${r.id}:body`, 0)).toBe(false); // 자기 안으로는 못 넣어요
    expect(removeBlock(p, a.id).id).toBe(a.id);
    expect(flatten(p)).toHaveLength(1);
  });

  it('같은 칸 안에서 아래로 옮길 때 자리가 맞아요', () => {
    const p = emptyProgram();
    const s = p.scripts[0];
    const [x, y, z] = ['washFace', 'tea', 'nap'].map((action) => newBlock('action', { action }));
    [x, y, z].forEach((b, i) => insertBlock(p, s.id, i, b));
    moveBlock(p, x.id, s.id, 3);
    expect(s.body.map((b) => b.action)).toEqual(['tea', 'nap', 'washFace']);
  });

  it('너무 깊게 겹치거나 너무 많으면 막아요', () => {
    const p = emptyProgram();
    let ref = p.scripts[0].id;
    let ok = true, depth = 0;
    while (ok && depth < 10) {
      const r = newBlock('repeat');
      ok = insertBlock(p, ref, 0, r);
      if (ok) { ref = `${r.id}:body`; depth++; }
    }
    expect(depth).toBe(LIMITS.depth);
    const q = emptyProgram();
    for (let i = 0; i < LIMITS.blocks + 5; i++) insertBlock(q, q.scripts[0].id, 0, newBlock('wait'));
    expect(flatten(q)).toHaveLength(LIMITS.blocks);
  });

  it('공유 코드로 바꿨다가 그대로 되살려요', () => {
    const p = emptyProgram();
    const s = p.scripts[0];
    const r = newBlock('repeat'); r.times = 4;
    insertBlock(p, s.id, 0, r);
    insertBlock(p, `${r.id}:body`, 0, newBlock('action', { action: 'combHair' }));
    const i = newBlock('if');
    insertBlock(p, s.id, 1, i);
    insertBlock(p, `${i.id}:then`, 0, newBlock('action', { action: 'nap' }));
    insertBlock(p, `${i.id}:else`, 0, Object.assign(newBlock('say'), { text: '한글 말풍선 😀' }));
    const ev = newScript({ type: 'clickThing', thing: 'plant' });
    p.scripts.push(ev);
    insertBlock(p, ev.id, 0, newBlock('action', { action: 'water' }));
    const code = encodeProgram(p);
    expect(code.startsWith('MOMO1-')).toBe(true);
    const back = decodeProgram(code, { actionIds: ['combHair', 'nap', 'water'], thingIds: ['plant'] });
    const strip = (prog) => JSON.parse(JSON.stringify(prog, (k, v) => (k === 'id' ? undefined : v)));
    expect(strip(back)).toEqual(strip(p));
  });

  it('잘못된 공유 코드는 null, 모르는 블록은 빼요', () => {
    expect(decodeProgram('아무말')).toBeNull();
    expect(decodeProgram('MOMO1-!!!!')).toBeNull();
    const fixed = sanitizeProgram({ scripts: [{ event: { type: 'start' }, body: [
      { type: 'action', action: 'hack' }, { type: 'evil' }, { type: 'repeat', times: 9999, body: [] }, { type: 'say', text: 'x'.repeat(100) },
    ] }] }, { actionIds: ['washFace'] });
    const body = fixed.scripts[0].body;
    expect(body.map((b) => b.type)).toEqual(['repeat', 'say']);
    expect(body[0].times).toBe(LIMITS.repeat);
    expect(body[1].text).toHaveLength(LIMITS.text);
  });

  it('글자 코드를 만들어요', () => {
    const p = emptyProgram();
    const r = newBlock('repeat');
    insertBlock(p, p.scripts[0].id, 0, r);
    insertBlock(p, `${r.id}:body`, 0, newBlock('action', { action: 'combHair' }));
    const text = toCode(p, { actionCode: (id) => ({ combHair: '머리빗기' })[id] });
    expect(text).toContain('function 시작하면()');
    expect(text).toContain('for (let i = 0; i < 3; i++) {');
    expect(text).toContain('    머리빗기();');
  });
});
