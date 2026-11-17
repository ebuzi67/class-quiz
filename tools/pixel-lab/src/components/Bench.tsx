// 세 모드가 함께 쓰는 부품: 실행 도구, 상태 줄, 그리기 도구
import { ReactNode } from 'react';
import { PALETTE, colorHex, colorName } from '../engine/types';
import { RunnerApi, SPEEDS } from '../lib/useRunner';
import { play as sound } from '../lib/sound';
import { Icon } from './Icon';
import { useUi } from './Ui';

const STATE_LABEL = { idle: '준비', running: '실행 중', paused: '잠깐 멈춤', done: '실행 끝', error: '멈췄어요' } as const;

interface RunPanelProps {
  run: RunnerApi;
  hasBlocks: boolean;
  /** 새로 실행하기 전에 물어볼 것이 있으면 false를 돌려줘요 */
  guard?: () => Promise<boolean>;
  onClear: () => void;
  disabled?: boolean;
}

export function RunPanel({ run, hasBlocks, guard, onClear, disabled }: RunPanelProps) {
  const ui = useUi();
  const st = run.view.status;
  const ready = async (fresh: boolean) => {
    if (!hasBlocks) { ui.toast('블록 서랍에서 블록을 먼저 넣어 보세요!'); return false; }
    if (fresh && guard && !(await guard())) return false;
    return true;
  };
  const main = async () => {
    sound('click');
    if (st === 'running') return run.pause();
    if (await ready(st !== 'paused')) run.play();
  };
  return (
    <section className={'panel runpanel st-' + st} aria-label="실행 도구">
      <h3 className="panel-title">
        <Icon name="flag" size={18} />실행 도구
        <span className={'run-state st-' + st}><i />{STATE_LABEL[st]}</span>
      </h3>
      <button className={'btn big ' + (st === 'running' ? 'butter' : 'primary')} onClick={main} disabled={disabled}>
        <Icon name={st === 'running' ? 'pause' : 'play'} size={24} />
        {st === 'running' ? '일시정지' : st === 'paused' ? '이어서 실행' : '실행'}
      </button>
      <div className="run-row">
        <button className="btn small" disabled={disabled} onClick={async () => { sound('click'); if (await ready(st !== 'paused' && st !== 'running')) run.stepOnce(); }} title="블록 하나만 실행해요">
          <Icon name="step" size={18} />한 단계
        </button>
        <button className="btn small" disabled={disabled} onClick={async () => { sound('click'); if (await ready(true)) run.restart(); }} title="처음부터 다시 실행해요">
          <Icon name="restart" size={18} />처음부터
        </button>
        <button className="btn small" disabled={disabled} onClick={() => { sound('click'); run.reset(); onClear(); }} title="그려진 결과를 지워요">
          <Icon name="broom" size={18} />지우기
        </button>
      </div>
      <div className="speed" role="group" aria-label="실행 속도">
        <span className="speed-label">속도</span>
        <div className="seg">
          {SPEEDS.map((s, i) => (
            <button key={s.name} className={run.speed === i ? 'on' : ''} onClick={() => run.setSpeed(i)} aria-pressed={run.speed === i}>{s.name}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 도화지 아래 상태 줄: 지금 몇 걸음째인지, 펜이 어디 있는지, 무슨 색인지 */
export function StatusBar({ run, children }: { run: RunnerApi; children?: ReactNode }) {
  const v = run.view;
  if (v.error) {
    return (
      <div className="status error" role="alert">
        <span className="status-ico"><Icon name="hint" size={22} /></span>
        <div><b>{v.error.message}</b><span>주문서에서 느낌표(!)가 붙은 블록을 살펴보세요. 블록을 고치면 다시 실행할 수 있어요.</span></div>
      </div>
    );
  }
  if (children) return <>{children}</>;
  return (
    <div className="status">
      <span className={'chip st-' + v.status}>{STATE_LABEL[v.status]}</span>
      <span className="chip"><Icon name="step" size={14} />{v.step}걸음</span>
      <span className="chip"><Icon name="wand" size={14} />펜 위치 ({v.x}, {v.y})</span>
      <span className="chip"><span className="swatch" style={{ background: colorHex(v.color) }} />펜 색 {colorName(v.color)}</span>
    </div>
  );
}

export type Tool = 'code' | 'draw' | 'erase';

export function PaintTools({ tool, setTool, color, setColor }: { tool: Tool; setTool: (t: Tool) => void; color: string; setColor: (c: string) => void }) {
  return (
    <section className="panel tools" aria-label="그리기 도구">
      <h3 className="panel-title"><Icon name="color" size={18} />그리기 도구</h3>
      <div className="seg wide">
        <button className={tool === 'code' ? 'on' : ''} onClick={() => setTool('code')} title="블록 주문으로 그려요"><Icon name="wand" size={16} />주문으로</button>
        <button className={tool === 'draw' ? 'on' : ''} onClick={() => setTool('draw')} title="도화지를 눌러 직접 칠해요"><Icon name="hand" size={16} />손으로</button>
        <button className={tool === 'erase' ? 'on' : ''} onClick={() => setTool('erase')} title="도화지를 눌러 지워요"><Icon name="erase" size={16} />지우개</button>
      </div>
      <div className="swatches" role="group" aria-label="색 고르기">
        {PALETTE.map((c) => (
          <button
            key={c.key} className={'sw' + (color === c.key ? ' on' : '')} style={{ background: c.hex }}
            onClick={() => { setColor(c.key); if (tool === 'erase') setTool('draw'); }}
            title={c.name} aria-label={c.name} aria-pressed={color === c.key}
          />
        ))}
      </div>
    </section>
  );
}

/** 모드가 App에 알려 주는 "저장 안 한 작업" 정보 */
export interface Guard { dirty: boolean; save: () => boolean; what: string }
