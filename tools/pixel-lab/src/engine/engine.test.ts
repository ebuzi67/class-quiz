import { describe, expect, it } from 'vitest';
import { MAX_STEPS, Runner, runAll } from './engine';
import { pixelsToProgram } from './generate';
import { MISSIONS } from './missions';
import { EMPTY, cloneBlocks, countBlocks, erase, gridFromRows, gridsEqual, mv, paint, rep, setColor } from './types';

const rows = (r: string[]) => gridFromRows(r).grid;

describe('실행 엔진', () => {
  it('처음 위치 (0,0)에서는 자동으로 칠하지 않아요', () => {
    const r = runAll([mv('right')], 3, 3);
    expect(r.grid.every((c) => c === EMPTY)).toBe(true);
    expect([r.x, r.y]).toEqual([1, 0]);
  });

  it('이동·색칠·색 고르기·지우기가 정확히 실행돼요', () => {
    const r = runAll([paint(), mv('right'), setColor('K'), paint(), mv('down'), paint(), mv('left'), paint(), mv('up'), erase()], 2, 2);
    expect(r.error).toBeNull();
    expect(r.grid).toEqual(rows(['.K', 'KK']));
    expect(r.steps).toBe(10);
  });

  it('반복문은 안의 명령을 정한 횟수만큼 실행해요', () => {
    const r = runAll([rep(3, [paint(), mv('right')]), paint()], 4, 1);
    expect(r.grid).toEqual(rows(['PPPP']));
    expect(r.steps).toBe(7);
  });

  it('중첩 반복이 돼요', () => {
    const r = runAll([rep(3, [rep(2, [paint(), mv('right')]), paint(), rep(2, [mv('left')]), mv('down')])], 3, 4);
    expect(r.error).toBeNull();
    expect(r.grid).toEqual(rows(['PPP', 'PPP', 'PPP', '...']));
  });

  it('세 겹 중첩과 빈 반복도 문제없어요', () => {
    const r = runAll([rep(5, []), rep(2, [rep(2, [rep(2, [paint()])])])], 2, 2);
    expect(r.error).toBeNull();
    expect(r.steps).toBe(8);
  });

  it('도화지 밖으로 나가면 그 블록에서 멈추고 이유를 알려 줘요', () => {
    for (const dir of ['up', 'left'] as const) {
      const bad = mv(dir);
      const r = runAll([paint(), bad, paint()], 3, 3);
      expect(r.error?.code).toBe('out');
      expect(r.error?.blockId).toBe(bad.id);
      expect(r.error?.message).toContain('밖으로');
      expect([r.x, r.y]).toEqual([0, 0]);
      expect(r.steps).toBe(1);
    }
    expect(runAll([rep(3, [mv('right')])], 3, 3).error?.code).toBe('out');
    expect(runAll([rep(3, [mv('down')])], 3, 3).error?.code).toBe('out');
  });

  it('너무 긴 실행은 안전하게 멈춰요', () => {
    const r = runAll([rep(99, [rep(99, [paint()])])], 2, 2);
    expect(r.error?.code).toBe('tooLong');
    expect(r.steps).toBe(MAX_STEPS);
  });

  it('잘못된 반복 횟수를 막아요', () => {
    expect(runAll([rep(1000, [paint()])], 2, 2).error?.code).toBe('badRepeat');
    expect(runAll([rep(0, [paint()])], 2, 2).error?.code).toBe('badRepeat');
    expect(runAll([rep(2.5, [paint()])], 2, 2).error?.code).toBe('badRepeat');
  });

  it('한 단계씩 실행하면 블록·좌표·색·바뀐 칸·반복 정보를 알려 줘요', () => {
    const p = paint();
    const loop = rep(2, [p, mv('right')]);
    const r = new Runner([setColor('Y'), loop], 3, 1);
    expect(r.step()).toMatchObject({ kind: 'step', color: 'Y', step: 1, change: null });
    const s = r.step();
    expect(s).toMatchObject({ kind: 'step', blockId: p.id, x: 0, y: 0, step: 2, change: { x: 0, y: 0, from: EMPTY, to: 'Y' } });
    expect(s.loops).toEqual([{ id: loop.id, iteration: 1, times: 2 }]);
    r.step();
    expect(r.step().loops[0].iteration).toBe(2);
    expect(r.step()).toMatchObject({ kind: 'step', x: 2 });
    expect(r.step().kind).toBe('done');
    expect(r.step().kind).toBe('done');
  });

  it('블록 세기와 복사', () => {
    const prog = [paint(), rep(2, [mv('right'), rep(2, [paint()])])];
    expect(countBlocks(prog)).toBe(5);
    const copy = cloneBlocks(prog);
    expect(copy[1].id).not.toBe(prog[1].id);
    expect(runAll(copy, 3, 1).grid).toEqual(runAll(prog, 3, 1).grid);
  });
});

describe('미션', () => {
  it('미션이 10개 이상이에요', () => expect(MISSIONS.length).toBeGreaterThanOrEqual(10));

  for (const m of MISSIONS) {
    it(`${m.no}. ${m.title}: 정답 예시로 성공 판정이 나요`, () => {
      const sol = m.solution();
      const r = runAll(sol, m.w, m.h);
      expect(r.error).toBeNull();
      expect(gridsEqual(r.grid, m.target)).toBe(true);
      // 효율 별도 받을 수 있어야 해요
      expect(countBlocks(sol)).toBeLessThanOrEqual(m.par);
      // 미션에서 주는 블록만으로 풀 수 있어야 해요
      const used = new Set<string>();
      const walk = (bs: typeof sol) => bs.forEach((b) => { used.add(b.type === 'move' ? b.dir : b.type); if (b.type === 'repeat') walk(b.body); });
      walk(sol);
      for (const k of used) expect(m.blocks).toContain(k);
      expect(m.hints.length).toBe(3);
      // 목표가 빈 그림이면 안 돼요 (아무것도 안 해도 성공하면 안 되니까요)
      expect(m.target.some((c) => c !== EMPTY)).toBe(true);
    });
  }

  it('그림을 주문으로 바꾸면 같은 그림이 나와요', () => {
    for (const m of MISSIONS) {
      const prog = pixelsToProgram(m.target, m.w, m.h);
      const r = runAll(prog, m.w, m.h);
      expect(r.error).toBeNull();
      expect(gridsEqual(r.grid, m.target)).toBe(true);
    }
  });
});
