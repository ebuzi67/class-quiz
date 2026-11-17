// 코딩 블록 데이터 모델. 화면(UI)과 실행 엔진이 함께 쓰는 약속이에요.

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface MoveBlock { id: string; type: 'move'; dir: Dir }
export interface PaintBlock { id: string; type: 'paint' }
export interface EraseBlock { id: string; type: 'erase' }
export interface ColorBlock { id: string; type: 'color'; color: string }
export interface RepeatBlock { id: string; type: 'repeat'; times: number; body: Block[] }

export type Block = MoveBlock | PaintBlock | EraseBlock | ColorBlock | RepeatBlock;
export type Program = Block[];

/** 블록 서랍에 놓이는 블록 종류 */
export type BlockKind = 'up' | 'down' | 'left' | 'right' | 'paint' | 'erase' | 'color' | 'repeat';

/** 도화지. 길이 w*h, 한 칸은 색 기호 한 글자. '.'은 빈 칸 */
export type Grid = string[];
export const EMPTY = '.';

export interface PaletteColor { key: string; name: string; hex: string }

export const PALETTE: PaletteColor[] = [
  { key: 'P', name: '보라', hex: '#9b7ede' },
  { key: 'K', name: '분홍', hex: '#f48fb1' },
  { key: 'R', name: '빨강', hex: '#ec6a6a' },
  { key: 'O', name: '주황', hex: '#f6a35c' },
  { key: 'Y', name: '노랑', hex: '#f8d458' },
  { key: 'G', name: '초록', hex: '#78c888' },
  { key: 'M', name: '민트', hex: '#6fd3c3' },
  { key: 'B', name: '하늘', hex: '#7fb8f2' },
  { key: 'N', name: '파랑', hex: '#5d80d8' },
  { key: 'W', name: '갈색', hex: '#a0704f' },
  { key: 'H', name: '하양', hex: '#ffffff' },
  { key: 'D', name: '검정', hex: '#4b3c3a' },
];
export const DEFAULT_COLOR = 'P';
export const PAPER_HEX = '#fffdf6';

const byKey = new Map(PALETTE.map((c) => [c.key, c]));
export const colorHex = (key: string) => byKey.get(key)?.hex ?? PAPER_HEX;
export const colorName = (key: string) => byKey.get(key)?.name ?? '빈 칸';

export const DIR_NAME: Record<Dir, string> = { up: '위', down: '아래', left: '왼쪽', right: '오른쪽' };

export const emptyGrid = (w: number, h: number): Grid => new Array(w * h).fill(EMPTY);

/** "..P" 같은 줄 여러 개를 도화지로 바꿔요 */
export function gridFromRows(rows: string[]): { w: number; h: number; grid: Grid } {
  const h = rows.length;
  const w = rows[0].length;
  const grid: Grid = [];
  for (const row of rows) {
    if (row.length !== w) throw new Error('줄 길이가 달라요: ' + row);
    for (const ch of row) grid.push(ch === ' ' ? EMPTY : ch);
  }
  return { w, h, grid };
}

export const gridsEqual = (a: Grid, b: Grid) => a.length === b.length && a.every((v, i) => v === b[i]);

let seq = 0;
export const uid = () => 'b' + Date.now().toString(36) + (seq++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

export function makeBlock(kind: BlockKind, color = 'K'): Block {
  switch (kind) {
    case 'up': case 'down': case 'left': case 'right': return { id: uid(), type: 'move', dir: kind };
    case 'paint': return { id: uid(), type: 'paint' };
    case 'erase': return { id: uid(), type: 'erase' };
    case 'color': return { id: uid(), type: 'color', color };
    case 'repeat': return { id: uid(), type: 'repeat', times: 3, body: [] };
  }
}

export const kindOf = (b: Block): BlockKind => (b.type === 'move' ? b.dir : b.type);

/** 반복 블록과 그 안의 블록까지 모두 세요 */
export const countBlocks = (p: Program): number =>
  p.reduce((n, b) => n + 1 + (b.type === 'repeat' ? countBlocks(b.body) : 0), 0);

/** 새 id를 붙여 통째로 복사해요 */
export const cloneBlocks = (p: Program): Program =>
  p.map((b) => (b.type === 'repeat' ? { ...b, id: uid(), body: cloneBlocks(b.body) } : { ...b, id: uid() }));

// 짧게 쓰는 도우미 (미션 정답, 테스트에서 써요)
export const mv = (dir: Dir): Block => ({ id: uid(), type: 'move', dir });
export const paint = (): Block => ({ id: uid(), type: 'paint' });
export const erase = (): Block => ({ id: uid(), type: 'erase' });
export const setColor = (color: string): Block => ({ id: uid(), type: 'color', color });
export const rep = (times: number, body: Block[]): Block => ({ id: uid(), type: 'repeat', times, body });
