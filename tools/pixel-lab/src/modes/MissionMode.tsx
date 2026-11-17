// 모드 A. 마법 따라 그리기
import { useEffect, useMemo, useState } from 'react';
import { BlockEditor } from '../components/BlockEditor';
import { RunPanel, StatusBar } from '../components/Bench';
import { Icon } from '../components/Icon';
import { PixelCanvas, PixelThumb } from '../components/PixelCanvas';
import { Modal, useUi } from '../components/Ui';
import { MISSIONS, Mission } from '../engine/missions';
import { Grid, Program, countBlocks, emptyGrid, gridsEqual } from '../engine/types';
import { play as sound } from '../lib/sound';
import { josa } from '../lib/storage';
import { Progress, load, loadList, save } from '../lib/storage';
import { RunFinish, useRunner } from '../lib/useRunner';

const PRAISE = ['마법이 통했어요!', '멋진 주문이에요!', '픽셀이 반짝반짝!', '차근차근 잘 해냈어요!'];

interface Props {
  progress: Progress;
  setProgress: (p: Progress) => void;
  teacher: boolean;
  onGoStudio: () => void;
}

export function MissionMode({ progress, setProgress, teacher, onGoStudio }: Props) {
  const ui = useUi();
  const [idx, setIdx] = useState(() => {
    const saved = load<string>('mission:current', '');
    const i = MISSIONS.findIndex((m) => m.id === saved);
    return i >= 0 ? i : 0;
  });
  const m = MISSIONS[idx];
  const [program, setProgramState] = useState<Program>(() => loadList<Program[number]>('draft:' + m.id));
  const [pixels, setPixels] = useState<Grid>(() => emptyGrid(m.w, m.h));
  const [wrong, setWrong] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<'none' | 'success' | 'mismatch'>('none');
  const [success, setSuccess] = useState<{ blocks: number; bonus: boolean; first: boolean } | null>(null);
  const [hintN, setHintN] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [ghost, setGhost] = useState(false);

  const unlocked = (i: number) => teacher || i === 0 || !!progress[MISSIONS[i - 1].id]?.done;

  const setProgram = (p: Program) => {
    setProgramState(p);
    save('draft:' + m.id, p);
    setWrong([]);
    setOutcome('none');
  };

  const open = (i: number) => {
    const next = MISSIONS[i];
    setIdx(i);
    save('mission:current', next.id);
    setProgramState(loadList<Program[number]>('draft:' + next.id));
    setPixels(emptyGrid(next.w, next.h));
    setWrong([]); setOutcome('none'); setSuccess(null); setHintN(0); setShowHints(false); setShowMap(false);
  };

  const finish = (r: RunFinish) => {
    setPixels(r.grid);
    if (r.error) { sound('error'); setOutcome('none'); setWrong([]); return; }
    if (gridsEqual(r.grid, m.target)) {
      const blocks = countBlocks(program);
      const bonus = blocks <= m.par;
      const prev = progress[m.id];
      setProgress({ ...progress, [m.id]: { done: true, bonus: bonus || !!prev?.bonus, blocks: prev?.done ? Math.min(prev.blocks, blocks) : blocks } });
      setWrong([]); setOutcome('success');
      setSuccess({ blocks, bonus, first: !prev?.done });
      sound('success');
    } else {
      setWrong(r.grid.map((c, i) => (c === m.target[i] ? -1 : i)).filter((i) => i >= 0));
      setOutcome('mismatch');
      sound('retry');
    }
  };

  const run = useRunner(program, m.w, m.h, finish);
  const v = run.view;
  const grid = v.status === 'idle' ? pixels : v.grid ?? pixels;
  const clear = () => { setPixels(emptyGrid(m.w, m.h)); setWrong([]); setOutcome('none'); };

  // 미션이 바뀌면 처음 한 번 개념 소개가 눈에 띄게
  useEffect(() => { setGhost(false); }, [idx]);

  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [success]); // eslint-disable-line
  const rec = progress[m.id];
  const hasNext = idx < MISSIONS.length - 1;

  return (
    <div className="bench">
      <BlockEditor program={program} onChange={setProgram} kinds={m.blocks} activeId={v.activeId} loops={v.loops} errorId={v.error?.blockId ?? null} />

      <div className="stage">
        <div className="stage-canvas">
          <PixelCanvas
            w={m.w} h={m.h} grid={grid} wrong={v.status === 'idle' || v.status === 'done' ? wrong : []}
            ghost={ghost ? m.target : null}
            pen={{ x: v.x, y: v.y, color: v.color, error: !!v.error }}
          />
        </div>
        <StatusBar run={run}>
          {outcome === 'mismatch' && v.status !== 'running' && v.status !== 'paused' ? (
            <div className="status retry" role="status">
              <span className="status-ico"><Icon name="eye" size={22} /></span>
              <div>
                <b>목표 그림과 다른 칸이 {wrong.length}개 있어요. 다시 살펴볼까요?</b>
                <span><i className="hatch-key" />빗금 친 칸이 목표와 달라요.</span>
              </div>
              <button className="btn small" onClick={() => { setHintN(Math.max(1, hintN)); setShowHints(true); }}><Icon name="hint" size={16} />힌트 보기</button>
              <button className="btn small mint" onClick={() => { run.reset(); clear(); }}><Icon name="restart" size={16} />다시 도전</button>
            </div>
          ) : null}
        </StatusBar>
      </div>

      <div className="side">
        <section className="panel mission" aria-label="미션">
          <div className="ms-nav">
            <button className="btn icon small" disabled={idx === 0} onClick={() => open(idx - 1)} aria-label="이전 미션"><Icon name="prev" size={18} /></button>
            <span className="ms-no">미션 {m.no}</span>
            <span className={'lv lv-' + m.level}>{m.level}</span>
            <button className="btn icon small" disabled={!hasNext || !unlocked(idx + 1)} onClick={() => open(idx + 1)} aria-label="다음 미션"><Icon name="next" size={18} /></button>
            <button className="btn small lav ms-map" onClick={() => setShowMap(true)}><Icon name="map" size={16} />미션 지도</button>
          </div>
          <div className="ms-head">
            <h2 className="ms-title">{m.title}</h2>
            {rec?.done && <span className="ms-stars" title="이 미션에서 받은 별"><Icon name="star" size={20} />{rec.bonus && <Icon name="sparkle" size={18} />}</span>}
          </div>
          <div className="ms-main">
            <figure className="target">
              <PixelThumb w={m.w} h={m.h} grid={m.target} lines />
              <figcaption>목표 그림</figcaption>
            </figure>
            <p className="goal">{m.goal}</p>
          </div>
          <p className="concept"><b>{m.skill}</b>{m.concept}</p>
          <div className="ms-actions">
            <button className="btn small butter" onClick={() => { setHintN(Math.max(1, hintN)); setShowHints(true); }}><Icon name="hint" size={16} />힌트 {hintN}/3</button>
            <button className={'btn small' + (ghost ? ' on' : '')} onClick={() => setGhost(!ghost)} aria-pressed={ghost} title="도화지에 목표 그림을 작은 점으로 비춰요"><Icon name="eye" size={16} />목표 비춰 보기</button>
            {teacher && (
              <button
                className="btn small" title="선생님 모드: 정답 예시를 주문서에 불러와요"
                onClick={async () => {
                  if (program.length && (await ui.confirm({ title: '정답 예시를 불러올까요?', body: '지금 주문서의 블록은 정답 예시로 바뀌어요.', ok: '불러오기', cancel: '그만두기', icon: 'hat' })) !== 'ok') return;
                  run.reset(); clear(); setProgram(m.solution());
                }}
              ><Icon name="hat" size={16} />정답 코드</button>
            )}
          </div>
        </section>
        <RunPanel run={run} hasBlocks={program.length > 0} onClear={clear} />
      </div>

      {showHints && (
        <Modal title={`힌트 · ${m.title}`} icon="hint" onClose={() => setShowHints(false)}>
          <ol className="hints">
            {m.hints.slice(0, hintN).map((h, i) => <li key={i}><span>{i + 1}</span>{h}</li>)}
          </ol>
          <div className="modal-actions">
            {hintN < 3
              ? <button className="btn butter" onClick={() => setHintN(hintN + 1)}><Icon name="hint" size={18} />힌트 하나 더 ({hintN}/3)</button>
              : <span className="muted">힌트를 모두 봤어요. 한 단계씩 실행하며 확인해 보세요!</span>}
            <button className="btn primary" onClick={() => setShowHints(false)}>해 볼게요</button>
          </div>
        </Modal>
      )}

      {showMap && (
        <Modal title="미션 지도" icon="map" wide onClose={() => setShowMap(false)}>
          <div className="map-grid">
            {MISSIONS.map((mm, i) => <MapCard key={mm.id} m={mm} rec={progress[mm.id]} locked={!unlocked(i)} current={i === idx} onOpen={() => open(i)} />)}
          </div>
          <p className="muted center">앞 미션을 성공하면 다음 미션이 열려요. <Icon name="star" size={14} /> 완성 별 · <Icon name="sparkle" size={14} /> 효율 별</p>
        </Modal>
      )}

      {success && (
        <Modal className="success" onClose={() => setSuccess(null)}>
          <div className="burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
          <div className="success-stars">
            <span className="big-star"><Icon name="star" size={64} /></span>
            {success.bonus && <span className="big-star bonus"><Icon name="sparkle" size={52} /></span>}
          </div>
          <h2>미션 성공! {praise}</h2>
          <p className="success-line">「{m.title}」{josa(m.title, '을', '를')} 블록 <b>{success.blocks}개</b>로 완성했어요.</p>
          {success.bonus
            ? <p className="bonus-line"><Icon name="sparkle" size={18} />효율 별 획득! 블록 {m.par}개 이하로 만들었어요.</p>
            : <p className="bonus-line soft"><Icon name="sparkle" size={18} />블록 {m.par}개 이하로도 만들 수 있어요. 나중에 도전해 볼래요?</p>}
          {!hasNext && <p className="success-line">모든 미션을 마쳤어요! 이제 자유 픽셀 공방에서 나만의 작품을 만들어 보세요.</p>}
          <div className="modal-actions">
            <button className="btn" onClick={() => setSuccess(null)}>내 주문 다시 보기</button>
            {hasNext
              ? <button className="btn primary" autoFocus onClick={() => open(idx + 1)}>다음 미션<Icon name="next" size={18} /></button>
              : <button className="btn primary" autoFocus onClick={onGoStudio}>자유 픽셀 공방 가기<Icon name="next" size={18} /></button>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function MapCard({ m, rec, locked, current, onOpen }: { m: Mission; rec?: { done: boolean; bonus: boolean }; locked: boolean; current: boolean; onOpen: () => void }) {
  return (
    <button className={'map-card' + (current ? ' current' : '') + (locked ? ' locked' : '') + (rec?.done ? ' done' : '')} disabled={locked} onClick={onOpen}>
      <span className="map-no">{m.no}</span>
      <span className="map-thumb">
        {locked ? <Icon name="lock" size={30} /> : <PixelThumb w={m.w} h={m.h} grid={m.target} />}
        {rec?.done && <span className="stamp">완료</span>}
      </span>
      <span className="map-title">{m.title}</span>
      <span className="map-meta">
        <span className={'lv lv-' + m.level}>{m.level}</span>
        <span className="map-stars">
          <span className={rec?.done ? 'got' : ''}><Icon name="star" size={15} /></span>
          <span className={rec?.bonus ? 'got' : ''}><Icon name="sparkle" size={14} /></span>
        </span>
      </span>
    </button>
  );
}
