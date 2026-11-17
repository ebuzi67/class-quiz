// 그림(픽셀)을 보고 그 그림을 그리는 블록 프로그램을 만들어요.
// 극장의 예시 작품에 "진짜로 실행되는 주문"을 붙일 때 써요.
import { Block, DEFAULT_COLOR, Dir, EMPTY, Grid, Program, mv, paint, rep, setColor } from './types';

const moves = (n: number, dir: Dir): Block[] => (n <= 0 ? [] : n === 1 ? [mv(dir)] : [rep(n, [mv(dir)])]);

export function pixelsToProgram(grid: Grid, w: number, h: number): Program {
  const out: Program = [];
  let px = 0;
  let py = 0;
  let color = DEFAULT_COLOR;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = grid[y * w + x];
      if (c === EMPTY) { x++; continue; }
      let len = 1;
      while (x + len < w && grid[y * w + x + len] === c) len++;
      out.push(...moves(y - py, 'down'));
      py = y;
      out.push(...(x >= px ? moves(x - px, 'right') : moves(px - x, 'left')));
      if (c !== color) { out.push(setColor(c)); color = c; }
      if (len > 2) out.push(rep(len - 1, [paint(), mv('right')]));
      else if (len === 2) out.push(paint(), mv('right'));
      out.push(paint());
      px = x + len - 1;
      x += len;
    }
  }
  return out;
}
