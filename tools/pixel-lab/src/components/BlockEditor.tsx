// 블록 서랍 + 마법 주문서. 블록을 눌러 넣고, 끌어서 옮기고, 고칠 수 있어요.
import { Fragment, PointerEvent as RPointerEvent, useEffect, useRef, useState } from 'react';
import { LoopInfo } from '../engine/engine';
import { Loc, containsId, findBlock, getBody, insertBlock, locate, moveBlock, nudge, removeBlock, updateBlock } from '../engine/tree';
import { Block, BlockKind, DIR_NAME, PALETTE, Program, cloneBlocks, colorHex, colorName, countBlocks, kindOf, makeBlock } from '../engine/types';
import { MAX_REPEAT } from '../engine/engine';
import { play as sound } from '../lib/sound';
import { Icon } from './Icon';
import { Modal, useUi } from './Ui';

const KIND_LABEL: Record<BlockKind, string> = {
  up: '위로 1칸', down: '아래로 1칸', left: '왼쪽으로 1칸', right: '오른쪽으로 1칸',
  paint: '색칠하기', erase: '지우기', color: '색 고르기', repeat: '반복하기',
};
const KIND_GROUP: Record<BlockKind, string> = {
  up: 'move', down: 'move', left: 'move', right: 'move', paint: 'paint', erase: 'erase', color: 'color', repeat: 'repeat',
};
const ALL_KINDS: BlockKind[] = ['up', 'down', 'left', 'right', 'paint', 'color', 'erase', 'repeat'];

interface Props {
  program: Program;
  onChange: (p: Program) => void;
  kinds?: BlockKind[];
  activeId: string | null;
  loops: LoopInfo[];
  errorId: string | null;
  /** 새 「색 고르기」 블록의 처음 색 */
  newColor?: string;
}

type DragSrc = { id: string } | { kind: BlockKind };

export function BlockEditor({ program, onChange, kinds = ALL_KINDS, activeId, loops, errorId, newColor = 'K' }: Props) {
  const ui = useUi();
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; block: Block } | null>(null);
  const [drop, setDrop] = useState<Loc | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const programRef = useRef(program);
  programRef.current = program;
  const dragRef = useRef<{ src: DragSrc; sx: number; sy: number; active: boolean; block: Block } | null>(null);
  const dropRef = useRef<Loc | null>(null);
  const suppressClick = useRef(false);
  const scrollToCursor = useRef(false);

  // 사라진 블록을 가리키고 있으면 정리해요
  const cursorOk = cursor === null || !!getBody(program, cursor);
  const cur = cursorOk ? cursor : null;
  const sel = selected && findBlock(program, selected) ? selected : null;

  // 실행 중인 블록이 보이도록 따라가요
  useEffect(() => {
    const id = errorId ?? activeId;
    if (!id) return;
    scroller.current?.querySelector(`[data-head="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId, errorId]);

  useEffect(() => {
    if (!scrollToCursor.current) return;
    scrollToCursor.current = false;
    scroller.current?.querySelector('.slot.on')?.scrollIntoView({ block: 'nearest' });
  }, [program]);

  const add = (kind: BlockKind) => {
    const block = makeBlock(kind, newColor);
    const body = getBody(program, cur) ?? program;
    onChange(insertBlock(program, { parentId: cur, index: body.length }, block));
    if (kind === 'repeat') setCursor(block.id);
    setSelected(null);
    scrollToCursor.current = true;
    sound('add');
  };

  const del = (id: string) => { onChange(removeBlock(program, id)); setSelected(null); sound('erase'); };
  const dup = (id: string) => {
    const loc = locate(program, id);
    const b = findBlock(program, id);
    if (!loc || !b) return;
    const [copy] = cloneBlocks([b]);
    onChange(insertBlock(program, { parentId: loc.parentId, index: loc.index + 1 }, copy));
    setSelected(copy.id);
    sound('add');
  };
  const setTimes = (id: string, n: number) => {
    const v = Math.max(1, Math.min(MAX_REPEAT, Math.round(n) || 1));
    onChange(updateBlock(program, id, (b) => (b.type === 'repeat' ? { ...b, times: v } : b)));
  };

  // ── 끌어서 옮기기 ──
  const hitTest = (x: number, y: number, src: DragSrc): Loc | null => {
    const p = programRef.current;
    const el = document.elementFromPoint(x, y);
    if (!el || !scroller.current?.contains(el)) return null;
    let loc: Loc | null = null;
    const slot = el.closest<HTMLElement>('[data-end]');
    let head = el.closest<HTMLElement>('[data-head]');
    if (!head && !slot) {
      // 블록 사이 틈이나 놓일 자리 표시 위에 있을 때: 가장 가까운 블록을 기준으로 해요
      const heads = [...scroller.current.querySelectorAll<HTMLElement>('[data-head]')];
      const rootSlot = scroller.current.querySelector<HTMLElement>(':scope > .slot');
      if (!heads.length || (rootSlot && y > rootSlot.getBoundingClientRect().top)) return { parentId: null, index: p.length };
      const dist = (h: HTMLElement) => { const r = h.getBoundingClientRect(); return Math.abs(y - (r.top + r.height / 2)); };
      head = heads.reduce((best, h) => (dist(h) < dist(best) ? h : best));
    }
    if (head) {
      const id = head.dataset.head!;
      const at = locate(p, id);
      const b = findBlock(p, id);
      if (at && b) {
        const r = head.getBoundingClientRect();
        if (y < r.top + r.height / 2) loc = at;
        else if (b.type === 'repeat') loc = { parentId: id, index: 0 };
        else loc = { parentId: at.parentId, index: at.index + 1 };
      }
    } else if (slot) {
      const parentId = slot.dataset.end || null;
      loc = { parentId, index: (getBody(p, parentId) ?? p).length };
    }
    if (loc && 'id' in src) {
      const b = findBlock(p, src.id);
      if (!b || containsId(b, loc.parentId)) return null;
    }
    return loc;
  };

  const onMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
      d.active = true;
      document.body.classList.add('dragging-block');
    }
    e.preventDefault();
    dropRef.current = hitTest(e.clientX, e.clientY, d.src);
    setDrop(dropRef.current);
    setDrag({ x: e.clientX, y: e.clientY, block: d.block });
  };
  const onUp = () => {
    const d = dragRef.current;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    document.body.classList.remove('dragging-block');
    dragRef.current = null;
    if (d?.active) {
      // 끌기를 끝낸 바로 뒤에 따라오는 '누르기'는 무시해요
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 200);
      const to = dropRef.current;
      const p = programRef.current;
      if (to) {
        if ('id' in d.src) {
          onChange(moveBlock(p, d.src.id, to));
        } else {
          const block = makeBlock(d.src.kind, newColor);
          onChange(insertBlock(p, to, block));
          if (block.type === 'repeat') setCursor(block.id);
        }
        sound('add');
      }
    }
    dropRef.current = null;
    setDrop(null);
    setDrag(null);
  };
  const startDrag = (e: RPointerEvent, src: DragSrc, block: Block) => {
    if (e.button !== 0) return;
    dragRef.current = { src, sx: e.clientX, sy: e.clientY, active: false, block };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  useEffect(() => () => onUp(), []); // eslint-disable-line

  const headDown = (e: RPointerEvent, b: Block) => {
    const t = e.target as HTMLElement;
    if (t.closest('button, input')) return;
    // 터치로는 손잡이(점 여섯 개)를 잡아야 끌려요. 그래야 주문서를 밀어서 넘길 수 있어요.
    if (e.pointerType !== 'mouse' && !t.closest('.grip')) return;
    startDrag(e, { id: b.id }, b);
  };

  const dropAt = (parentId: string | null, index: number) =>
    drop && drop.parentId === parentId && drop.index === index ? <div className="drop-line" /> : null;

  const face = (b: Block, inPalette = false) => {
    const kind = kindOf(b);
    return (
      <>
        <span className="blk-ico"><Icon name={kind} size={20} /></span>
        {b.type === 'repeat' && !inPalette ? (
          <>
            <span className="stepper">
              <button className="st-btn" onClick={() => setTimes(b.id, b.times - 1)} aria-label="반복 횟수 줄이기">−</button>
              <input
                className="st-num" inputMode="numeric" value={b.times} aria-label="반복 횟수"
                onChange={(e) => setTimes(b.id, parseInt(e.target.value.replace(/\D/g, '').slice(-2) || '1', 10))}
                onFocus={(e) => e.target.select()}
              />
              <button className="st-btn" onClick={() => setTimes(b.id, b.times + 1)} aria-label="반복 횟수 늘리기">+</button>
            </span>
            <span className="blk-label">번 반복</span>
          </>
        ) : b.type === 'color' && !inPalette ? (
          <>
            <span className="blk-label">색 고르기</span>
            <button className="swatch-btn" onClick={() => setPickFor(b.id)} aria-label={`지금 색: ${colorName(b.color)}. 눌러서 바꾸기`}>
              <span className="swatch" style={{ background: colorHex(b.color) }} />{colorName(b.color)}
            </button>
          </>
        ) : (
          <span className="blk-label">{b.type === 'move' ? `${DIR_NAME[b.dir]}${b.dir === 'up' || b.dir === 'down' ? '로' : '으로'} 1칸` : KIND_LABEL[kind]}</span>
        )}
      </>
    );
  };

  const renderList = (blocks: Block[], parentId: string | null) => (
    <>
      {blocks.map((b, i) => {
        const loop = loops.find((l) => l.id === b.id);
        const cls = ['blk', 'g-' + KIND_GROUP[kindOf(b)]];
        if (activeId === b.id) cls.push('active');
        if (loop) cls.push('looping');
        if (errorId === b.id) cls.push('error');
        if (sel === b.id) cls.push('sel');
        if (drag && 'id' in (dragRef.current?.src ?? {}) && (dragRef.current!.src as { id: string }).id === b.id) cls.push('dragging');
        return (
          <Fragment key={b.id}>
            {dropAt(parentId, i)}
            <div className={cls.join(' ')}>
              <div
                className="blk-head" data-head={b.id}
                onPointerDown={(e) => headDown(e, b)}
                onClick={(e) => {
                  if (suppressClick.current || (e.target as HTMLElement).closest('button, input')) return;
                  setSelected(sel === b.id ? null : b.id);
                }}
              >
                <span className="grip" title="끌어서 옮기기"><Icon name="grip" size={16} /></span>
                {face(b)}
                {loop && <span className="loop-count">{loop.iteration}/{loop.times}</span>}
                {errorId === b.id && <span className="err-mark" aria-label="여기서 멈췄어요">!</span>}
              </div>
              {sel === b.id && (
                <div className="blk-tools">
                  <button onClick={() => { onChange(nudge(program, b.id, -1)); }} title="위로 옮기기"><Icon name="up" size={16} />위로</button>
                  <button onClick={() => { onChange(nudge(program, b.id, 1)); }} title="아래로 옮기기"><Icon name="down" size={16} />아래로</button>
                  <button onClick={() => dup(b.id)} title="똑같이 하나 더"><Icon name="copy" size={16} />복사</button>
                  <button className="danger" onClick={() => del(b.id)} title="지우기"><Icon name="trash" size={16} />삭제</button>
                </div>
              )}
              {b.type === 'repeat' && <div className="blk-body">{renderList(b.body, b.id)}</div>}
            </div>
          </Fragment>
        );
      })}
      {dropAt(parentId, blocks.length)}
      <button
        className={'slot' + (cur === parentId ? ' on' : '')} data-end={parentId ?? ''}
        onClick={() => setCursor(parentId)}
      >
        {cur === parentId ? <><Icon name="wand" size={15} />다음 블록이 여기에 들어가요</> : <><Icon name="plus" size={15} />여기에 넣기</>}
      </button>
    </>
  );

  const total = countBlocks(program);
  const pickBlock = pickFor ? findBlock(program, pickFor) : null;

  return (
    <div className="editor">
      <section className="panel drawer" aria-label="블록 서랍">
        <h3 className="panel-title"><Icon name="book" size={18} />블록 서랍</h3>
        <div className="drawer-list">
          {kinds.map((k) => {
            const sample = makeBlock(k, newColor);
            return (
              <button
                key={k} className={'blk-btn g-' + KIND_GROUP[k]}
                onPointerDown={(e) => startDrag(e, { kind: k }, sample)}
                onClick={() => { if (!suppressClick.current) add(k); }}
                title={KIND_LABEL[k] + ' 블록 넣기'}
              >
                <span className="blk-ico"><Icon name={k} size={20} /></span>
                <span className="blk-label">{k === 'repeat' ? '반복하기' : KIND_LABEL[k]}</span>
              </button>
            );
          })}
        </div>
        <p className="drawer-tip">블록을 누르면 주문서에 들어가요</p>
      </section>

      <section className="panel script" aria-label="마법 주문서">
        <h3 className="panel-title">
          <Icon name="wand" size={18} />마법 주문서
          <span className="count">블록 {total}개</span>
          <button
            className="btn tiny ghost icon" disabled={!total} title="주문서 비우기" aria-label="주문서 비우기"
            onClick={async () => {
              if (total > 2 && (await ui.confirm({ title: '주문서를 모두 비울까요?', body: '넣어 둔 블록이 모두 사라져요.', ok: '비우기', cancel: '그만두기', icon: 'broom' })) !== 'ok') return;
              onChange([]); setCursor(null); setSelected(null);
            }}
          ><Icon name="broom" size={17} /></button>
        </h3>
        <div className="ws-scroll" ref={scroller}>
          {total === 0 && !drag && (
            <div className="ws-empty">
              <b>여기는 마법 주문서예요</b>
              <span>① 블록 서랍에서 블록을 눌러요</span>
              <span>② 「실행」을 누르면 마법 펜이 움직여요</span>
            </div>
          )}
          {renderList(program, null)}
        </div>
      </section>

      {drag && (
        <div className={'blk ghost g-' + KIND_GROUP[kindOf(drag.block)]} style={{ left: drag.x + 10, top: drag.y - 18 }}>
          <div className="blk-head"><span className="blk-ico"><Icon name={kindOf(drag.block)} size={20} /></span><span className="blk-label">{KIND_LABEL[kindOf(drag.block)]}</span></div>
        </div>
      )}

      {pickBlock && pickBlock.type === 'color' && (
        <Modal title="어떤 색으로 칠할까요?" icon="color" onClose={() => setPickFor(null)}>
          <div className="color-grid">
            {PALETTE.map((c) => (
              <button
                key={c.key} className={'color-pick' + (pickBlock.color === c.key ? ' on' : '')}
                onClick={() => { onChange(updateBlock(program, pickBlock.id, (b) => ({ ...b, color: c.key } as Block))); setPickFor(null); sound('color'); }}
              >
                <span className="swatch big" style={{ background: c.hex }} />{c.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
