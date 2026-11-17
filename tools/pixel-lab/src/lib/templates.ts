// 움직이는 픽셀 극장의 예시 작품. 프레임마다 그 그림을 그리는 주문(블록)도 함께 만들어요.
import { pixelsToProgram } from '../engine/generate';
import { EMPTY, Grid, emptyGrid, gridFromRows } from '../engine/types';
import { Animation, newId } from './storage';

interface Template { id: string; name: string; desc: string; size: number; fps: number; frames: Grid[] }

const g = (rows: string[]) => gridFromRows(rows).grid;

/** 작은 그림(sprite)을 큰 도화지의 (ox, oy)에 올려요 */
function place(size: number, sprite: string[], ox: number, oy: number, base?: Grid): Grid {
  const out = base ? [...base] : emptyGrid(size, size);
  sprite.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== EMPTY) out[(oy + y) * size + ox + x] = ch; }));
  return out;
}

const star1 = g(['........', '........', '........', '...YY...', '...YY...', '........', '........', '........']);
const star2 = g(['........', '...YY...', '...YY...', '.YYYYYY.', '.YYYYYY.', '...YY...', '...YY...', '........']);
const star3 = g(['...YY...', '...YY...', '..YYYY..', 'YYYHHYYY', 'YYYHHYYY', '..YYYY..', '...YY...', '...YY...']);

const catOpen = g(['O......O', 'OO....OO', 'OOOOOOOO', 'ODOOOODO', 'ODOOOODO', 'OOOKKOOO', 'OOOOOOOO', '.OOOOOO.']);
const catShut = g(['O......O', 'OO....OO', 'OOOOOOOO', 'OOOOOOOO', 'ODOOOODO', 'OOOKKOOO', 'OOOOOOOO', '.OOOOOO.']);

const bunny = ['.K..K.', '.K..K.', '.KKKK.', '.DKKD.', '.KKKK.', 'KKHHKK', '.K..K.'];
const bunnyLow = ['......', '.K..K.', '.K..K.', '.KKKK.', '.DKKD.', 'KKHHKK', 'KK..KK'];
const grass = place(10, ['GGGGGGGGGG'], 0, 9);
const hop = (sprite: string[], oy: number) => place(10, sprite, 2, oy, grass);

const flower1 = g(['........', '........', '........', '........', '........', '...G....', '..GG....', '...G....']);
const flower2 = g(['........', '........', '........', '...K....', '...G....', '...GG...', '..GG....', '...G....']);
const flower3 = g(['........', '...K....', '..KYK...', '...K....', '...G....', '...GG...', '..GG....', '...G....']);
const flower4 = g(['..KKK...', '.KKKKK..', '.KKYKK..', '.KKKKK..', '..KKK...', '...GG...', '..GG....', '...G....']);

const dinoBody = ['.....GGGG.', '.....GDGG.', '.....GGGG.', 'G....GGG..', 'G...GGGG..', 'GG.GGGGGG.', '.GGGGGGG..', '..GGGGGG..'];
const dinoA = g([...dinoBody, '..G...G...', '..GG..GG..']);
const dinoB = g([...dinoBody, '...G.G....', '...GG.GG..']);

export const TEMPLATES: Template[] = [
  { id: 'star', name: '반짝이는 별', desc: '별이 커졌다 작아졌다 반짝여요', size: 8, fps: 4, frames: [star1, star2, star3, star2] },
  { id: 'cat', name: '눈 깜빡이는 고양이', desc: '고양이가 눈을 깜빡여요', size: 8, fps: 2, frames: [catOpen, catOpen, catShut] },
  { id: 'bunny', name: '통통 뛰는 토끼', desc: '토끼가 풀밭에서 통통 뛰어요', size: 10, fps: 4, frames: [hop(bunnyLow, 2), hop(bunny, 1), hop(bunny, 0), hop(bunny, 1)] },
  { id: 'flower', name: '피어나는 꽃', desc: '새싹이 자라 꽃이 피어요', size: 8, fps: 2, frames: [flower1, flower2, flower3, flower4, flower4] },
  { id: 'dino', name: '걷는 공룡', desc: '공룡이 뚜벅뚜벅 걸어요', size: 10, fps: 4, frames: [dinoA, dinoB] },
];

export function fromTemplate(t: Template): Animation {
  return {
    id: newId(), name: t.name, size: t.size, fps: t.fps, loop: true, updatedAt: Date.now(),
    frames: t.frames.map((pixels) => ({ id: newId(), pixels: [...pixels], program: pixelsToProgram(pixels, t.size, t.size), handEdited: false })),
  };
}
