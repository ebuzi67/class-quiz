// 모드 B. 자유 픽셀 공방
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { BlockEditor } from '../components/BlockEditor';
import { Guard, PaintTools, RunPanel, StatusBar, Tool } from '../components/Bench';
import { Icon } from '../components/Icon';
import { PixelCanvas, PixelThumb } from '../components/PixelCanvas';
import { Modal, useUi } from '../components/Ui';
import { EMPTY, Grid, Program, emptyGrid } from '../engine/types';
import { downloadBlob, gridToPng, safeName } from '../lib/export';
import { play as sound } from '../lib/sound';
import { Artwork, formatDate, josa, loadList, newId, save } from '../lib/storage';
import { useRunner } from '../lib/useRunner';

export const SIZES = [8, 10, 16];

interface State { program: Program; pixels: Grid; handEdited: boolean }

const blank = (size: number): State => ({ program: [], pixels: emptyGrid(size, size), handEdited: false });

export function StudioMode({ guardRef }: { guardRef: MutableRefObject<Guard | null> }) {
  const ui = useUi();
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState(8);
  const [hist, setHist] = useState<{ stack: State[]; i: number }>({ stack: [blank(8)], i: 0 });
  const [dirty, setDirty] = useState(false);
  const [tool, setTool] = useState<Tool>('code');
  const [color, setColor] = useState('K');
  const [gallery, setGallery] = useState(false);
  const [works, setWorks] = useState<Artwork[]>(() => loadList<Artwork>('artworks').filter((w) => Array.isArray(w.pixels) && Array.isArray(w.program) && w.pixels.length === w.size * w.size));
  const stroke = useRef(false);
  const cur = hist.stack[hist.i];

  const commit = (s: State) => {
    setHist((h) => {
      const stack = [...h.stack.slice(Math.max(0, h.i - 60), h.i + 1), s];
      return { stack, i: stack.length - 1 };
    });
    setDirty(true);
  };
  const replace = (s: State) => {
    setHist((h) => ({ stack: h.stack.map((x, i) => (i === h.i ? s : x)), i: h.i }));
    setDirty(true);
  };

  const run = useRunner(cur.program, size, size, (r) => replace({ ...cur, pixels: r.grid, handEdited: false }));
  const v = run.view;
  const busy = v.status === 'running' || v.status === 'paused';
  const grid = v.status === 'idle' ? cur.pixels : v.grid ?? cur.pixels;

  const doSave = (): boolean => {
    const art: Artwork = {
      id: id ?? newId(), name: name.trim() || '이름 없는 작품', size,
      pixels: cur.pixels, program: cur.program, handEdited: cur.handEdited, updatedAt: Date.now(),
    };
    const next = [art, ...works.filter((w) => w.id !== art.id)];
    if (!save('artworks', next)) { ui.toast('저장 공간이 부족해요. 오래된 작품을 지워 주세요.'); return false; }
    setWorks(next); setId(art.id); setName(art.name); setDirty(false);
    ui.toast(`「${art.name}」 저장했어요!`); sound('success');
    return true;
  };

  guardRef.current = { dirty, save: doSave, what: '작품' };
  useEffect(() => () => { guardRef.current = null; }, [guardRef]);

  const askLeave = async (): Promise<boolean> => {
    if (!dirty) return true;
    const a = await ui.confirm({ title: '저장하지 않은 작품이 있어요', body: '지금 작품을 저장할까요?', ok: '저장하지 않고 계속', extra: '저장하고 계속', cancel: '그만두기', icon: 'save' });
    if (a === 'cancel') return false;
    return a === 'extra' ? doSave() : true;
  };

  const fresh = (n: number) => {
    run.reset();
    setId(null); setName(''); setSize(n); setHist({ stack: [blank(n)], i: 0 }); setDirty(false); setTool('code');
  };

  const changeSize = async (n: number) => {
    if (n === size) return;
    const has = cur.pixels.some((c) => c !== EMPTY);
    if (has && (await ui.confirm({ title: `도화지를 ${n}×${n}로 바꿀까요?`, body: '그림은 지워지고 주문서의 블록은 그대로 남아요.', ok: '바꾸기', cancel: '그만두기', icon: 'image' })) !== 'ok') return;
    run.reset();
    setSize(n);
    setHist({ stack: [{ program: cur.program, pixels: emptyGrid(n, n), handEdited: false }], i: 0 });
    setDirty(true);
  };

  const openWork = async (w: Artwork) => {
    if (!(await askLeave())) return;
    run.reset();
    setId(w.id); setName(w.name); setSize(w.size);
    setHist({ stack: [{ program: w.program, pixels: w.pixels, handEdited: w.handEdited }], i: 0 });
    setDirty(false); setGallery(false);
  };

  const removeWork = async (w: Artwork) => {
    if ((await ui.confirm({ title: `「${w.name}」${josa(w.name, '을', '를')} 지울까요?`, body: '지운 작품은 되돌릴 수 없어요.', ok: '지우기', cancel: '그만두기', icon: 'trash' })) !== 'ok') return;
    const next = works.filter((x) => x.id !== w.id);
    save('artworks', next); setWorks(next);
    if (w.id === id) setId(null);
  };

  const png = async (g: Grid, n: number, title: string) => {
    try { downloadBlob(await gridToPng(g, n, n), safeName(title, '픽셀-작품') + '.png'); ui.toast('PNG 그림을 내려받았어요!'); }
    catch { ui.toast('그림을 만들지 못했어요. 다시 해 볼까요?'); }
  };

  const paintCell = (i: number) => {
    const to = tool === 'erase' ? EMPTY : color;
    const first = !stroke.current;
    stroke.current = true;
    if (first) sound(to === EMPTY ? 'erase' : 'paint');
    // 한 번 문지르는 동안은 되돌리기 한 칸으로 묶어요
    setHist((h) => {
      const base = h.stack[h.i];
      if (base.pixels[i] === to && !first) return h;
      const pixels = [...base.pixels];
      pixels[i] = to;
      const s = { ...base, pixels, handEdited: true };
      if (!first) return { stack: h.stack.map((x, k) => (k === h.i ? s : x)), i: h.i };
      const stack = [...h.stack.slice(Math.max(0, h.i - 60), h.i + 1), s];
      return { stack, i: stack.length - 1 };
    });
    setDirty(true);
  };

  const guardRun = async () => {
    if (!cur.handEdited) return true;
    return (await ui.confirm({ title: '손으로 고친 칸이 있어요', body: '실행하면 주문서대로 새로 그려져서 손으로 고친 칸은 사라져요. (되돌리기 버튼으로 되살릴 수 있어요.)', ok: '실행하기', cancel: '그만두기', icon: 'hand' })) === 'ok';
  };

  const undo = () => { run.reset(); setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) })); setDirty(true); };
  const redo = () => { run.reset(); setHist((h) => ({ ...h, i: Math.min(h.stack.length - 1, h.i + 1) })); setDirty(true); };

  return (
    <div className="bench">
      <BlockEditor
        program={cur.program} onChange={(p) => commit({ ...cur, program: p })}
        activeId={v.activeId} loops={v.loops} errorId={v.error?.blockId ?? null} newColor={color}
      />

      <div className="stage">
        <div className="stage-canvas">
          <PixelCanvas
            w={size} h={size} grid={grid}
            pen={tool === 'code' ? { x: v.x, y: v.y, color: v.color, error: !!v.error } : null}
            onPaint={tool !== 'code' && !busy ? paintCell : undefined}
            onPaintEnd={() => { stroke.current = false; }}
          />
        </div>
        <StatusBar run={run}>
          {tool !== 'code' && !v.error ? (
            <div className="status">
              <span className="chip st-paused"><Icon name={tool === 'draw' ? 'hand' : 'erase'} size={14} />{tool === 'draw' ? '손으로 칠하기' : '지우개'}</span>
              <span className="muted">도화지의 칸을 누르거나 문질러 보세요. 주문으로 그리려면 「주문으로」를 눌러요.</span>
            </div>
          ) : null}
        </StatusBar>
      </div>

      <div className="side">
        <section className="panel work" aria-label="작품">
          <h3 className="panel-title"><Icon name="image" size={18} />나의 작품{dirty && <span className="dot-note">저장 안 됨</span>}</h3>
          <input className="name-input" value={name} maxLength={20} placeholder="작품 이름을 지어 주세요" onChange={(e) => { setName(e.target.value); setDirty(true); }} aria-label="작품 이름" />
          <div className="size-row">
            <span className="speed-label">도화지</span>
            <div className="seg">
              {SIZES.map((n) => <button key={n} className={size === n ? 'on' : ''} onClick={() => changeSize(n)} aria-pressed={size === n}>{n}×{n}</button>)}
            </div>
          </div>
          <div className="btn-grid">
            <button className="btn small primary" onClick={doSave}><Icon name="save" size={17} />저장</button>
            <button className="btn small" onClick={() => setGallery(true)}><Icon name="folder" size={17} />내 작품 {works.length}</button>
            <button className="btn small" onClick={() => png(cur.pixels, size, name)}><Icon name="download" size={17} />PNG 받기</button>
            <button className="btn small" onClick={async () => { if (await askLeave()) fresh(size); }}><Icon name="plus" size={17} />새 도화지</button>
            <button className="btn small" disabled={hist.i === 0} onClick={undo}><Icon name="undo" size={17} />되돌리기</button>
            <button className="btn small" disabled={hist.i >= hist.stack.length - 1} onClick={redo}><Icon name="redo" size={17} />다시 하기</button>
          </div>
        </section>
        <PaintTools tool={tool} setTool={(t) => { if (t !== 'code') run.reset(); setTool(t); }} color={color} setColor={setColor} />
        <RunPanel
          run={run} hasBlocks={cur.program.length > 0} guard={guardRun}
          onClear={() => { if (cur.pixels.some((c) => c !== EMPTY)) commit({ ...cur, pixels: emptyGrid(size, size), handEdited: false }); }}
        />
      </div>

      {gallery && (
        <Modal title="내 작품 모음" icon="folder" wide onClose={() => setGallery(false)}>
          {works.length === 0 ? (
            <p className="empty-note">아직 저장한 작품이 없어요. 작품을 만들고 「저장」을 눌러 보세요!</p>
          ) : (
            <div className="gallery">
              {works.map((w) => (
                <div key={w.id} className={'g-card' + (w.id === id ? ' current' : '')}>
                  <PixelThumb w={w.size} h={w.size} grid={w.pixels} />
                  <b>{w.name}</b>
                  <span className="muted">{w.size}×{w.size} · {formatDate(w.updatedAt)}</span>
                  <div className="g-actions">
                    <button className="btn small primary" onClick={() => openWork(w)}>열기</button>
                    <button className="btn small icon" onClick={() => png(w.pixels, w.size, w.name)} aria-label="PNG 받기" title="PNG 받기"><Icon name="download" size={17} /></button>
                    <button className="btn small icon danger" onClick={() => removeWork(w)} aria-label="지우기" title="지우기"><Icon name="trash" size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
