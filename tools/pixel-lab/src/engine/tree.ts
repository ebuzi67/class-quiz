// 블록 나무(프로그램)를 고치는 도우미. 모두 새 배열을 돌려줘서 실행 취소가 쉬워요.
import { Block, Program } from './types';

export interface Loc { parentId: string | null; index: number }

export function findBlock(p: Program, id: string): Block | null {
  for (const b of p) {
    if (b.id === id) return b;
    if (b.type === 'repeat') {
      const f = findBlock(b.body, id);
      if (f) return f;
    }
  }
  return null;
}

export function locate(p: Program, id: string, parentId: string | null = null): Loc | null {
  for (let i = 0; i < p.length; i++) {
    const b = p[i];
    if (b.id === id) return { parentId, index: i };
    if (b.type === 'repeat') {
      const f = locate(b.body, id, b.id);
      if (f) return f;
    }
  }
  return null;
}

export function getBody(p: Program, parentId: string | null): Block[] | null {
  if (parentId === null) return p;
  const b = findBlock(p, parentId);
  return b && b.type === 'repeat' ? b.body : null;
}

function mapBody(p: Program, parentId: string | null, fn: (body: Block[]) => Block[]): Program {
  if (parentId === null) return fn(p);
  return p.map((b) => {
    if (b.type !== 'repeat') return b;
    if (b.id === parentId) return { ...b, body: fn(b.body) };
    return { ...b, body: mapBody(b.body, parentId, fn) };
  });
}

export function updateBlock(p: Program, id: string, fn: (b: Block) => Block): Program {
  return p.map((b) => {
    if (b.id === id) return fn(b);
    if (b.type === 'repeat') return { ...b, body: updateBlock(b.body, id, fn) };
    return b;
  });
}

export function removeBlock(p: Program, id: string): Program {
  return p.filter((b) => b.id !== id).map((b) => (b.type === 'repeat' ? { ...b, body: removeBlock(b.body, id) } : b));
}

export function insertBlock(p: Program, loc: Loc, block: Block): Program {
  if (!getBody(p, loc.parentId)) return [...p, block];
  return mapBody(p, loc.parentId, (body) => {
    const i = Math.max(0, Math.min(loc.index, body.length));
    return [...body.slice(0, i), block, ...body.slice(i)];
  });
}

/** 블록(과 그 안의 블록) 속에 id가 있는지 */
export function containsId(b: Block, id: string | null): boolean {
  if (id === null) return false;
  if (b.id === id) return true;
  return b.type === 'repeat' && b.body.some((c) => containsId(c, id));
}

/** 블록을 새 자리로 옮겨요. loc.index는 옮기기 전 기준이에요. */
export function moveBlock(p: Program, id: string, to: Loc): Program {
  const block = findBlock(p, id);
  const from = locate(p, id);
  if (!block || !from) return p;
  if (containsId(block, to.parentId)) return p; // 자기 자신 안으로는 못 들어가요
  let index = to.index;
  if (from.parentId === to.parentId && from.index < to.index) index--;
  return insertBlock(removeBlock(p, id), { parentId: to.parentId, index }, block);
}

/** 위(-1)/아래(+1)로 한 칸. 반복 블록을 만나면 안으로 들어가고, 끝에서는 밖으로 나와요. */
export function nudge(p: Program, id: string, dir: -1 | 1): Program {
  const loc = locate(p, id);
  if (!loc) return p;
  const sibs = getBody(p, loc.parentId)!;
  const ni = loc.index + dir;
  if (ni >= 0 && ni < sibs.length) {
    const nb = sibs[ni];
    if (nb.type === 'repeat') return moveBlock(p, id, { parentId: nb.id, index: dir === -1 ? nb.body.length : 0 });
    return moveBlock(p, id, { parentId: loc.parentId, index: dir === -1 ? ni : ni + 1 });
  }
  if (loc.parentId === null) return p;
  const ploc = locate(p, loc.parentId)!;
  return moveBlock(p, id, { parentId: ploc.parentId, index: dir === -1 ? ploc.index : ploc.index + 1 });
}
