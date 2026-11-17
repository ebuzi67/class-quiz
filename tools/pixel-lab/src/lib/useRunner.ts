// 실행 엔진을 화면에 이어 주는 훅. 엔진이 한 걸음씩 알려 주는 결과를 받아 상태로 바꿔요.
import { useCallback, useEffect, useRef, useState } from 'react';
import { LoopInfo, RunError, Runner } from '../engine/engine';
import { DEFAULT_COLOR, EMPTY, Grid, Program, emptyGrid } from '../engine/types';
import { play as sound } from './sound';

export type RunStatus = 'idle' | 'running' | 'paused' | 'done' | 'error';

export interface RunView {
  status: RunStatus;
  grid: Grid | null;
  x: number;
  y: number;
  color: string;
  activeId: string | null;
  loops: LoopInfo[];
  step: number;
  error: RunError | null;
}

export interface RunFinish { grid: Grid; error: RunError | null; steps: number }

export const SPEEDS = [
  { name: '느리게', ms: 750 },
  { name: '보통', ms: 380 },
  { name: '빠르게', ms: 130 },
  { name: '번쩍', ms: 22 },
];

const IDLE: RunView = { status: 'idle', grid: null, x: 0, y: 0, color: DEFAULT_COLOR, activeId: null, loops: [], step: 0, error: null };

export function useRunner(program: Program, w: number, h: number, onFinish: (r: RunFinish) => void) {
  const [view, setView] = useState<RunView>(IDLE);
  const [speed, setSpeed] = useState(1);
  const runner = useRef<Runner | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const status = useRef<RunStatus>('idle');
  const speedRef = useRef(speed);
  const programRef = useRef(program);
  const finishRef = useRef(onFinish);
  speedRef.current = speed;
  programRef.current = program;
  finishRef.current = onFinish;

  const setStatus = (s: RunStatus) => {
    status.current = s;
    setView((v) => ({ ...v, status: s }));
  };

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    runner.current = null;
    status.current = 'idle';
    setView(IDLE);
  }, []);

  const begin = () => {
    window.clearTimeout(timer.current);
    runner.current = new Runner(programRef.current, w, h);
    setView({ ...IDLE, status: status.current, grid: emptyGrid(w, h) });
  };

  /** 한 걸음 실행. 계속할 수 있으면 true */
  const tick = (): boolean => {
    const r = runner.current;
    if (!r) return false;
    const prevColor = r.color;
    const s = r.step();
    if (s.kind === 'step') {
      if (speedRef.current < 3) sound(s.change ? (s.change.to === EMPTY ? 'erase' : 'paint') : s.color !== prevColor ? 'color' : 'move');
      setView({ status: status.current, grid: [...r.grid], x: s.x, y: s.y, color: s.color, activeId: s.blockId, loops: s.loops, step: s.step, error: null });
      return true;
    }
    status.current = s.kind === 'error' ? 'error' : 'done';
    setView({ status: status.current, grid: [...r.grid], x: s.x, y: s.y, color: s.color, activeId: s.blockId, loops: s.kind === 'error' ? s.loops : [], step: s.step, error: s.error });
    finishRef.current({ grid: [...r.grid], error: s.error, steps: s.step });
    return false;
  };

  const loop = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (status.current !== 'running') return;
      if (tick()) loop(SPEEDS[speedRef.current].ms);
    }, delay);
  };

  const play = () => {
    if (status.current === 'running') return;
    if (status.current !== 'paused' || !runner.current) {
      status.current = 'running';
      begin();
      loop(Math.min(350, SPEEDS[speedRef.current].ms));
    } else {
      setStatus('running');
      loop(0);
    }
  };

  const pause = () => {
    if (status.current !== 'running') return;
    window.clearTimeout(timer.current);
    setStatus('paused');
  };

  const stepOnce = () => {
    window.clearTimeout(timer.current);
    if (!runner.current || status.current === 'idle' || status.current === 'done' || status.current === 'error') {
      status.current = 'paused';
      begin();
    } else {
      status.current = 'paused';
    }
    if (tick()) setStatus('paused');
  };

  const restart = () => {
    status.current = 'running';
    begin();
    loop(Math.min(350, SPEEDS[speedRef.current].ms));
  };

  // 블록이나 도화지 크기가 바뀌면 실행을 멈추고 처음으로 돌아가요
  useEffect(() => { reset(); }, [program, w, h, reset]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { view, speed, setSpeed, play, pause, stepOnce, restart, reset };
}

export type RunnerApi = ReturnType<typeof useRunner>;
