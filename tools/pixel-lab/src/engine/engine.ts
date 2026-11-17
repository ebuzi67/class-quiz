// 실행 엔진. 블록 프로그램을 한 걸음씩 풀어서 결과를 알려 줘요.
// 화면과는 완전히 떨어져 있어서 테스트하기 쉬워요.
import { Block, DEFAULT_COLOR, Dir, EMPTY, Grid, Program, emptyGrid } from './types';

export const MAX_STEPS = 1500;
export const MAX_REPEAT = 99;

export type ErrorCode = 'out' | 'tooLong' | 'badRepeat';
export interface RunError { code: ErrorCode; blockId: string; dir?: Dir; message: string }

export interface LoopInfo { id: string; iteration: number; times: number }
export interface PixelChange { x: number; y: number; from: string; to: string }

export interface StepResult {
  kind: 'step' | 'done' | 'error';
  /** 방금 실행한(또는 오류가 난) 블록 */
  blockId: string | null;
  /** 지금 돌고 있는 반복 블록들 (바깥 → 안쪽) */
  loops: LoopInfo[];
  x: number;
  y: number;
  color: string;
  /** 이번 걸음에 바뀐 칸 */
  change: PixelChange | null;
  /** 지금까지 실행한 걸음 수 */
  step: number;
  error: RunError | null;
}

interface Frame { blocks: Block[]; index: number; loop: LoopInfo | null }

const SIDE: Record<Dir, string> = { up: '위쪽', down: '아래쪽', left: '왼쪽', right: '오른쪽' };
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export class Runner {
  x = 0;
  y = 0;
  color = DEFAULT_COLOR;
  grid: Grid;
  steps = 0;
  status: 'ready' | 'done' | 'error' = 'ready';
  error: RunError | null = null;
  private stack: Frame[];

  constructor(program: Program, readonly w: number, readonly h: number, readonly maxSteps = MAX_STEPS) {
    this.grid = emptyGrid(w, h);
    this.stack = [{ blocks: program, index: 0, loop: null }];
  }

  private loops(): LoopInfo[] {
    return this.stack.filter((f) => f.loop).map((f) => ({ ...f.loop! }));
  }

  private result(kind: StepResult['kind'], blockId: string | null, change: PixelChange | null = null): StepResult {
    return { kind, blockId, loops: this.loops(), x: this.x, y: this.y, color: this.color, change, step: this.steps, error: this.error };
  }

  private fail(error: RunError): StepResult {
    this.status = 'error';
    this.error = error;
    return this.result('error', error.blockId);
  }

  /** 블록 하나를 실행해요. 반복 블록은 안으로 들어가서 첫 명령을 실행해요. */
  step(): StepResult {
    if (this.status === 'error') return this.result('error', this.error!.blockId);
    if (this.status === 'done') return this.result('done', null);

    while (this.stack.length) {
      const f = this.stack[this.stack.length - 1];
      if (f.index >= f.blocks.length) {
        if (f.loop && f.loop.iteration < f.loop.times) {
          f.loop.iteration++;
          f.index = 0;
        } else {
          this.stack.pop();
        }
        continue;
      }
      const b = f.blocks[f.index++];
      if (b.type === 'repeat') {
        if (!Number.isInteger(b.times) || b.times < 1 || b.times > MAX_REPEAT) {
          return this.fail({
            code: 'badRepeat', blockId: b.id,
            message: b.times > MAX_REPEAT ? '반복 횟수가 너무 커요. 조금 줄여볼까요?' : '반복 횟수는 1번부터 넣을 수 있어요.',
          });
        }
        if (b.body.length) this.stack.push({ blocks: b.body, index: 0, loop: { id: b.id, iteration: 1, times: b.times } });
        continue;
      }
      if (this.steps >= this.maxSteps) {
        return this.fail({ code: 'tooLong', blockId: b.id, message: '마법이 너무 길어졌어요. 반복 횟수를 조금 줄여볼까요?' });
      }
      return this.exec(b);
    }
    this.status = 'done';
    return this.result('done', null);
  }

  private exec(b: Exclude<Block, { type: 'repeat' }>): StepResult {
    let change: PixelChange | null = null;
    if (b.type === 'move') {
      const [dx, dy] = DELTA[b.dir];
      const nx = this.x + dx;
      const ny = this.y + dy;
      if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) {
        return this.fail({
          code: 'out', blockId: b.id, dir: b.dir,
          message: `앗! 마법 펜이 도화지 ${SIDE[b.dir]} 밖으로 나가려고 해요!`,
        });
      }
      this.x = nx;
      this.y = ny;
    } else if (b.type === 'color') {
      this.color = b.color;
    } else {
      const i = this.y * this.w + this.x;
      const to = b.type === 'paint' ? this.color : EMPTY;
      change = { x: this.x, y: this.y, from: this.grid[i], to };
      this.grid[i] = to;
    }
    this.steps++;
    return this.result('step', b.id, change);
  }
}

export interface RunSummary { grid: Grid; steps: number; x: number; y: number; error: RunError | null }

/** 처음부터 끝까지 한 번에 실행해요 */
export function runAll(program: Program, w: number, h: number): RunSummary {
  const r = new Runner(program, w, h);
  for (;;) {
    const s = r.step();
    if (s.kind !== 'step') break;
  }
  return { grid: r.grid, steps: r.steps, x: r.x, y: r.y, error: r.error };
}
