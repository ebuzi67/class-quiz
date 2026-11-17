// 모드 C. 움직이는 픽셀 극장
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { BlockEditor } from '../components/BlockEditor';
import { Guard, PaintTools, RunPanel, StatusBar, Tool } from '../components/Bench';
import { Icon } from '../components/Icon';
import { PixelCanvas, PixelThumb } from '../components/PixelCanvas';
import { Modal, useUi } from '../components/Ui';
import { EMPTY, cloneBlocks, emptyGrid } from '../engine/types';
import { downloadBlob, framesToGif, framesToSpriteSheet, safeName } from '../lib/export';
import { play as sound } from '../lib/sound';
import { Animation, Frame, formatDate, josa, loadList, newId, save } from '../lib/storage';
import { TEMPLATES, fromTemplate } from '../lib/templates';
import { useRunner } from '../lib/useRunner';
import { SIZES } from './StudioMode';

const FPS = [{ name: '느리게', fps: 2 }, { name: '보통', fps: 4 }, { name: '빠르게', fps: 8 }];
const MAX_FRAMES = 24;

const blankFrame = (size: number): Frame => ({ id: newId(), pixels: emptyGrid(size, size), program: [], handEdited: false });
const blankAnim = (size: number): Animation => ({ id: '', name: '', size, fps: 4, loop: true, frames: [blankFrame(size)], updatedAt: 0 });

export function TheaterMode({ guardRef }: { guardRef: MutableRefObject<Guard | null> }) {
  const ui = useUi();
  const [anim, setAnimState] = useState<Animation>(() => blankAnim(8));
  const [at, setAt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [tool, setTool] = useState<Tool>('code');
  const [color, setColor] = useState('K');
  const [onion, setOnion] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playAt, setPlayAt] = useState(0);
  const [library, setLibrary] = useState(false);
  const [sizeAsk, setSizeAsk] = useState(false);
  const [saved, setSaved] = useState<Animation[]>(() => loadList<Animation>('animations').filter((a) => Array.isArray(a.frames) && a.frames.length > 0 && a.frames.every((f) => Array.isArray(f.pixels) && Array.isArray(f.program) && f.pixels.length === a.size * a.size)));
  const strip = useRef<HTMLDivElement>(null);
  const size = anim.size;
  const idx = Math.min(at, anim.frames.length - 1);
  const frame = anim.frames[idx];

  const setAnim = (a: Animation) => { setAnimState(a); setDirty(true); };
  const setFrame = (f: Frame) => setAnim({ ...anim, frames: anim.frames.map((x, i) => (i === idx ? f : x)) });

  const run = useRunner(frame.program, size, size, (r) => setFrame({ ...frame, pixels: r.grid, handEdited: false }));
  const v = run.view;
  const busy = v.status === 'running' || v.status === 'paused';
  const grid = playing ? anim.frames[Math.min(playAt, anim.frames.length - 1)].pixels : v.status === 'idle' ? frame.pixels : v.grid ?? frame.pixels;

  // 재생: 프레임을 차례대로 넘겨요
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setPlayAt((p) => {
        if (p + 1 < anim.frames.length) return p + 1;
        if (anim.loop) return 0;
        setPlaying(false);
        return p;
      });
    }, 1000 / anim.fps);
    return () => window.clearInterval(t);
  }, [playing, anim.fps, anim.loop, anim.frames.length]);

  useEffect(() => {
    strip.current?.querySelector('.fr.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [idx, playAt, playing, anim.frames.length]);

  const togglePlay = () => {
    sound('click');
    if (playing) { setPlaying(false); return; }
    if (anim.frames.length < 2) { ui.toast('프레임이 2장 이상 있어야 움직여요. 「복사」로 한 장 더 만들어 보세요!'); return; }
    run.reset(); setPlayAt(0); setPlaying(true);
  };

  const doSave = (): boolean => {
    const a: Animation = { ...anim, id: anim.id || newId(), name: anim.name.trim() || '이름 없는 애니메이션', updatedAt: Date.now() };
    const next = [a, ...saved.filter((x) => x.id !== a.id)];
    if (!save('animations', next)) { ui.toast('저장 공간이 부족해요. 오래된 작품을 지워 주세요.'); return false; }
    setSaved(next); setAnimState(a); setDirty(false);
    ui.toast(`「${a.name}」 저장했어요!`); sound('success');
    return true;
  };
  guardRef.current = { dirty, save: doSave, what: '애니메이션' };
  useEffect(() => () => { guardRef.current = null; }, [guardRef]);

  const askLeave = async (): Promise<boolean> => {
    if (!dirty) return true;
    const a = await ui.confirm({ title: '저장하지 않은 애니메이션이 있어요', body: '지금 애니메이션을 저장할까요?', ok: '저장하지 않고 계속', extra: '저장하고 계속', cancel: '그만두기', icon: 'save' });
    if (a === 'cancel') return false;
    return a === 'extra' ? doSave() : true;
  };

  const load_ = (a: Animation, isDirty: boolean) => {
    run.reset(); setPlaying(false); setAnimState(a); setAt(0); setDirty(isDirty); setLibrary(false); setSizeAsk(false); setTool('code');
  };

  const select = (i: number) => { if (playing) setPlaying(false); run.reset(); setAt(i); };
  const addFrame = (copy: boolean) => {
    if (anim.frames.length >= MAX_FRAMES) { ui.toast(`프레임은 ${MAX_FRAMES}장까지 만들 수 있어요.`); return; }
    const f: Frame = copy ? { id: newId(), pixels: [...frame.pixels], program: cloneBlocks(frame.program), handEdited: frame.handEdited } : blankFrame(size);
    const frames = [...anim.frames.slice(0, idx + 1), f, ...anim.frames.slice(idx + 1)];
    run.reset(); setPlaying(false); setAnim({ ...anim, frames }); setAt(idx + 1); sound('add');
  };
  const delFrame = async () => {
    if (anim.frames.length <= 1) { ui.toast('프레임이 한 장은 있어야 해요.'); return; }
    const has = frame.pixels.some((c) => c !== EMPTY) || frame.program.length > 0;
    if (has && (await ui.confirm({ title: `${idx + 1}번 프레임을 지울까요?`, body: '이 프레임의 그림과 주문이 사라져요.', ok: '지우기', cancel: '그만두기', icon: 'trash' })) !== 'ok') return;
    run.reset(); setPlaying(false);
    setAnim({ ...anim, frames: anim.frames.filter((_, i) => i !== idx) });
    setAt(Math.max(0, idx - (idx === anim.frames.length - 1 ? 1 : 0)));
  };
  const moveFrame = (d: -1 | 1) => {
    const j = idx + d;
    if (j < 0 || j >= anim.frames.length) return;
    const frames = [...anim.frames];
    [frames[idx], frames[j]] = [frames[j], frames[idx]];
    run.reset(); setAnim({ ...anim, frames }); setAt(j);
  };

  const stroke = useRef(false);
  const paintCell = (i: number) => {
    const to = tool === 'erase' ? EMPTY : color;
    if (!stroke.current) { stroke.current = true; sound(to === EMPTY ? 'erase' : 'paint'); }
    setAnimState((a) => {
      const f = a.frames[idx];
      if (!f || f.pixels[i] === to) return a;
      const pixels = [...f.pixels];
      pixels[i] = to;
      return { ...a, frames: a.frames.map((x, k) => (k === idx ? { ...f, pixels, handEdited: true } : x)) };
    });
    setDirty(true);
  };

  const guardRun = async () => {
    if (!frame.handEdited) return true;
    return (await ui.confirm({ title: '손으로 고친 칸이 있어요', body: '실행하면 이 프레임이 주문서대로 새로 그려져서 손으로 고친 칸은 사라져요.', ok: '실행하기', cancel: '그만두기', icon: 'hand' })) === 'ok';
  };

  const exportGif = () => {
    try {
      downloadBlob(framesToGif(anim.frames.map((f) => f.pixels), size, anim.fps, anim.loop), safeName(anim.name, '픽셀-애니메이션') + '.gif');
      ui.toast('GIF 움직이는 그림을 내려받았어요!');
    } catch { ui.toast('GIF를 만들지 못했어요. 다시 해 볼까요?'); }
  };
  const exportSheet = async () => {
    try {
      downloadBlob(await framesToSpriteSheet(anim.frames.map((f) => f.pixels), size), safeName(anim.name, '픽셀-애니메이션') + '-프레임.png');
      ui.toast('프레임을 한 장에 모은 PNG를 내려받았어요!');
    } catch { ui.toast('그림을 만들지 못했어요. 다시 해 볼까요?'); }
  };

  const removeSaved = async (a: Animation) => {
    if ((await ui.confirm({ title: `「${a.name}」${josa(a.name, '을', '를')} 지울까요?`, body: '지운 애니메이션은 되돌릴 수 없어요.', ok: '지우기', cancel: '그만두기', icon: 'trash' })) !== 'ok') return;
    const next = saved.filter((x) => x.id !== a.id);
    save('animations', next); setSaved(next);
    if (a.id === anim.id) setAnimState({ ...anim, id: '' });
  };

  const fpsIdx = Math.max(0, FPS.findIndex((f) => f.fps === anim.fps));

  return (
    <div className="bench theater">
      <BlockEditor
        program={frame.program} onChange={(p) => { if (playing) setPlaying(false); setFrame({ ...frame, program: p }); }}
        activeId={v.activeId} loops={v.loops} errorId={v.error?.blockId ?? null} newColor={color}
      />

      <div className="stage">
        <div className="stage-canvas">
          <PixelCanvas
            w={size} h={size} grid={grid}
            ghost={!playing && onion && idx > 0 ? anim.frames[idx - 1].pixels : null} ghostStyle="onion"
            pen={!playing && tool === 'code' ? { x: v.x, y: v.y, color: v.color, error: !!v.error } : null}
            onPaint={!playing && tool !== 'code' && !busy ? paintCell : undefined}
            onPaintEnd={() => { stroke.current = false; }}
            label={`프레임 ${idx + 1} 도화지`}
          />
          {playing && <span className="now-playing"><Icon name="film" size={16} />재생 중 · {playAt + 1}/{anim.frames.length}</span>}
        </div>
        <StatusBar run={run}>
          {playing ? null : tool !== 'code' && !v.error ? (
            <div className="status">
              <span className="chip st-paused"><Icon name={tool === 'draw' ? 'hand' : 'erase'} size={14} />{tool === 'draw' ? '손으로 칠하기' : '지우개'}</span>
              <span className="muted">도화지의 칸을 누르거나 문질러 보세요.</span>
            </div>
          ) : null}
        </StatusBar>
        <section className="panel timeline" aria-label="프레임">
          <div className="tl-tools">
            <span className="tl-title"><Icon name="film" size={17} />프레임 {idx + 1}/{anim.frames.length}</span>
            <button className="btn tiny mint" onClick={() => addFrame(true)} title="지금 프레임을 똑같이 한 장 더 만들어요"><Icon name="copy" size={15} />복사</button>
            <button className="btn tiny" onClick={() => addFrame(false)} title="빈 프레임을 추가해요"><Icon name="plus" size={15} />새 프레임</button>
            <button className="btn tiny" disabled={idx === 0} onClick={() => moveFrame(-1)} title="순서를 앞으로"><Icon name="prev" size={15} />앞으로</button>
            <button className="btn tiny" disabled={idx === anim.frames.length - 1} onClick={() => moveFrame(1)} title="순서를 뒤로">뒤로<Icon name="next" size={15} /></button>
            <button className="btn tiny danger" onClick={delFrame} title="지금 프레임을 지워요"><Icon name="trash" size={15} />삭제</button>
          </div>
          <div className="tl-strip" ref={strip}>
            {anim.frames.map((f, i) => (
              <button key={f.id} className={'fr' + ((playing ? playAt : idx) === i ? ' on' : '')} onClick={() => select(i)} aria-label={`프레임 ${i + 1}`} aria-pressed={idx === i}>
                <PixelThumb w={size} h={size} grid={f.pixels} />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="side">
        <section className="panel work" aria-label="애니메이션">
          <h3 className="panel-title"><Icon name="film" size={18} />나의 애니메이션{dirty && <span className="dot-note">저장 안 됨</span>}</h3>
          <input className="name-input" value={anim.name} maxLength={20} placeholder="애니메이션 이름" onChange={(e) => setAnim({ ...anim, name: e.target.value })} aria-label="애니메이션 이름" />
          <div className="play-row">
            <button className={'btn small ' + (playing ? 'butter' : 'mint')} onClick={togglePlay}><Icon name={playing ? 'stop' : 'play'} size={18} />{playing ? '정지' : '재생'}</button>
            <div className="seg">
              {FPS.map((f, i) => <button key={f.fps} className={fpsIdx === i ? 'on' : ''} onClick={() => setAnim({ ...anim, fps: f.fps })} aria-pressed={fpsIdx === i}>{f.name}</button>)}
            </div>
          </div>
          <div className="toggle-row">
            <button className={'tog' + (anim.loop ? ' on' : '')} onClick={() => setAnim({ ...anim, loop: !anim.loop })} aria-pressed={anim.loop}><i /><Icon name="loop" size={16} />반복 재생</button>
            <button className={'tog' + (onion ? ' on' : '')} onClick={() => setOnion(!onion)} aria-pressed={onion} title="앞 프레임을 흐릿하게 비춰 줘요"><i /><Icon name="layers" size={16} />앞 프레임 비추기</button>
          </div>
          <div className="btn-grid">
            <button className="btn small primary" onClick={doSave}><Icon name="save" size={17} />저장</button>
            <button className="btn small" onClick={() => setLibrary(true)}><Icon name="folder" size={17} />불러오기·예시</button>
            <button className="btn small" onClick={exportGif}><Icon name="download" size={17} />GIF 받기</button>
            <button className="btn small" onClick={exportSheet}><Icon name="image" size={17} />프레임 PNG</button>
          </div>
        </section>
        <PaintTools tool={tool} setTool={(t) => { if (t !== 'code') run.reset(); setPlaying(false); setTool(t); }} color={color} setColor={setColor} />
        <RunPanel
          run={run} hasBlocks={frame.program.length > 0} guard={guardRun} disabled={playing}
          onClear={() => setFrame({ ...frame, pixels: emptyGrid(size, size), handEdited: false })}
        />
      </div>

      {library && (
        <Modal title="애니메이션 불러오기" icon="folder" wide onClose={() => setLibrary(false)}>
          <div className="lib-head">
            <h3>예시 작품 <span className="muted">열어서 마음대로 바꿔 보세요</span></h3>
            <button className="btn small mint" onClick={async () => { if (await askLeave()) { setLibrary(false); setSizeAsk(true); } }}><Icon name="plus" size={16} />새 애니메이션</button>
          </div>
          <div className="gallery">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="g-card">
                <AnimThumb frames={t.frames} size={t.size} fps={t.fps} />
                <b>{t.name}</b>
                <span className="muted">{t.desc}</span>
                <div className="g-actions"><button className="btn small primary" onClick={async () => { if (await askLeave()) load_(fromTemplate(t), true); }}>열기</button></div>
              </div>
            ))}
          </div>
          <div className="lib-head"><h3>내가 저장한 애니메이션</h3></div>
          {saved.length === 0 ? <p className="empty-note">아직 저장한 애니메이션이 없어요.</p> : (
            <div className="gallery">
              {saved.map((a) => (
                <div key={a.id} className={'g-card' + (a.id === anim.id ? ' current' : '')}>
                  <AnimThumb frames={a.frames.map((f) => f.pixels)} size={a.size} fps={a.fps} />
                  <b>{a.name}</b>
                  <span className="muted">{a.frames.length}장 · {formatDate(a.updatedAt)}</span>
                  <div className="g-actions">
                    <button className="btn small primary" onClick={async () => { if (await askLeave()) load_(a, false); }}>열기</button>
                    <button className="btn small icon danger" onClick={() => removeSaved(a)} aria-label="지우기" title="지우기"><Icon name="trash" size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {sizeAsk && (
        <Modal title="새 애니메이션 도화지 크기" icon="film" onClose={() => setSizeAsk(false)}>
          <p className="confirm-body">칸이 적을수록 만들기 쉬워요. 처음에는 8×8을 추천해요!</p>
          <div className="modal-actions center">
            {SIZES.map((n) => <button key={n} className="btn primary" onClick={() => load_(blankAnim(n), false)}>{n}×{n}</button>)}
          </div>
        </Modal>
      )}
    </div>
  );
}

/** 혼자서 움직이는 작은 미리보기 */
function AnimThumb({ frames, size, fps }: { frames: string[][]; size: number; fps: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((x) => (x + 1) % frames.length), 1000 / fps);
    return () => window.clearInterval(t);
  }, [frames.length, fps]);
  return <PixelThumb w={size} h={size} grid={frames[i % frames.length]} />;
}
