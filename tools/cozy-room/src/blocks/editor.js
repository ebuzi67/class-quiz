// 블록 편집기 화면 — 블록 꾸러미에서 끌어다 놓거나, 눌러서 선택한 칸에 넣어요.
// 키보드: 블록에서 Delete 지우기, Alt+↑/↓ 순서 바꾸기
import { newBlock, newScript, insertBlock, moveBlock, removeBlock, locate, LIMITS, OPS } from './program.js';
import { EXPRESSIONS, EXPRESSION_NAMES } from '../engine/names.js';
import { GAUGES } from '../engine/state.js';

export const PALETTE = [
  { type: 'action', icon: '🎬', label: '행동하기' },
  { type: 'repeat', icon: '🔁', label: '반복하기' },
  { type: 'if', icon: '🔀', label: '만약 ~이면' },
  { type: 'wait', icon: '⏱️', label: '기다리기' },
  { type: 'say', icon: '💬', label: '말하기' },
  { type: 'face', icon: '😊', label: '표정 바꾸기' },
];
const TYPE_NAMES = { action: '행동', repeat: '반복', if: '만약', wait: '기다리기', say: '말하기', face: '표정' };

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'role' || k === 'type' || k === 'tabindex' || k === 'title' || k === 'for' || k === 'id') el.setAttribute(k, v);
    else el[k] = v;
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};
const options = (sel, list, value) => {
  for (const [v, label] of list) sel.append(h('option', { value: v, text: label, selected: v === value }));
  return sel;
};

export class BlockEditor {
  constructor({ palette, workspace, trash, actions, things, onChange, onToast }) {
    Object.assign(this, { paletteEl: palette, ws: workspace, trash, actions, things, onChange, onToast });
    this.program = null;
    this.activeRef = null;
    this.drag = null;
    this.locked = false;
    this.renderPalette();
    this.bind();
  }

  setProgram(p) {
    this.program = p;
    this.activeRef = p.scripts[0]?.id || null;
    this.render();
  }

  changed() { this.onChange?.(this.program); }

  renderPalette() {
    const p = this.paletteEl;
    p.replaceChildren(h('p', { class: 'pal-title', text: '블록 꾸러미' }));
    for (const item of PALETTE) {
      const b = h('button', {
        type: 'button', class: `blk pal t-${item.type}`, 'data-new': item.type,
        'aria-label': `${item.label} 블록 넣기`, title: '누르면 선택한 칸 끝에 들어가요. 끌어다 놓을 수도 있어요.',
      }, h('span', { class: 'blk-row' }, h('span', { 'aria-hidden': 'true', text: item.icon }), item.label));
      p.append(b);
    }
  }

  // ── 그리기 ──
  render() {
    const focusId = document.activeElement?.closest?.('[data-id]')?.dataset.id;
    const scroll = this.ws.scrollTop;
    this.ws.replaceChildren();
    for (const s of this.program.scripts) this.ws.append(this.renderScript(s));
    if (this.program.scripts.length < LIMITS.scripts) {
      this.ws.append(h('button', { type: 'button', class: 'add-script', 'data-act': 'add-script', text: '+ 스크립트 추가' }));
    }
    this.markActive();
    this.ws.scrollTop = scroll;
    if (focusId) this.ws.querySelector(`[data-id="${focusId}"]`)?.focus({ preventScroll: true });
  }

  renderScript(s) {
    const ev = h('select', { 'data-sfield': 'event', 'aria-label': '언제 시작할까요' });
    options(ev, [['start', '▶ 실행 버튼을 누르면'], ['clickChar', '🙋 모모를 누르면'], ['clickThing', '👆 물건을 누르면']], s.event.type);
    const hat = h('div', { class: 'hat' }, ev);
    if (s.event.type === 'clickThing') {
      const th = h('select', { 'data-sfield': 'thing', 'aria-label': '어떤 물건' });
      options(th, this.things.map((t) => [t.id, `${t.emoji} ${t.name}`]), s.event.thing);
      hat.append(th);
    }
    if (this.program.scripts.length > 1) hat.append(h('button', { type: 'button', class: 'blk-del', 'data-act': 'del-script', 'aria-label': '이 스크립트 지우기', text: '🗑' }));
    const sec = h('section', { class: 'script', 'data-script': s.id, 'aria-label': '스크립트' }, hat, this.renderBody(s.body, s.id));
    return sec;
  }

  renderBody(list, ref) {
    const body = h('div', { class: 'blk-body', 'data-ref': ref, role: 'list' });
    body.append(h('div', { class: 'slot', 'data-ref': ref, 'data-index': 0 }));
    list.forEach((b, i) => {
      body.append(this.renderBlock(b));
      body.append(h('div', { class: 'slot', 'data-ref': ref, 'data-index': i + 1 }));
    });
    if (!list.length) body.append(h('p', { class: 'empty-hint', text: '여기에 블록을 넣어요' }));
    return body;
  }

  renderBlock(b) {
    const el = h('div', { class: `blk t-${b.type}`, 'data-id': b.id, tabindex: 0, role: 'listitem', 'aria-label': this.describe(b) });
    const row = h('div', { class: 'blk-row' }, h('span', { class: 'grip', 'aria-hidden': 'true', text: '⠿' }));
    const del = h('button', { type: 'button', class: 'blk-del', 'data-act': 'del', 'aria-label': `${TYPE_NAMES[b.type]} 블록 지우기`, text: '✕' });
    switch (b.type) {
      case 'action': {
        const sel = h('select', { 'data-field': 'action', 'aria-label': '할 행동' });
        options(sel, this.actions.map((a) => [a.id, `${a.emoji} ${a.name}`]), b.action);
        row.append('🎬', sel, del);
        el.append(row);
        break;
      }
      case 'repeat':
        row.append('🔁', h('input', { type: 'number', min: 1, max: LIMITS.repeat, value: b.times, 'data-field': 'times', 'aria-label': '반복 횟수' }), '번 반복', del);
        el.append(row, this.renderBody(b.body, `${b.id}:body`));
        break;
      case 'if': {
        const g = options(h('select', { 'data-field': 'gauge', 'aria-label': '어떤 상태' }), GAUGES.map((x) => [x.id, `${x.emoji} ${x.name}`]), b.cond.gauge);
        const op = options(h('select', { 'data-field': 'op', 'aria-label': '비교' }), OPS.map((o) => [o, o === '>' ? '> (보다 크면)' : '< (보다 작으면)']), b.cond.op);
        const v = h('input', { type: 'number', min: 0, max: 100, value: b.cond.value, 'data-field': 'value', 'aria-label': '기준 값' });
        row.append('🔀 만약', g, op, v, '이면', del);
        el.append(row, this.renderBody(b.then, `${b.id}:then`), h('div', { class: 'blk-else', text: '아니면' }), this.renderBody(b.else, `${b.id}:else`));
        break;
      }
      case 'wait':
        row.append('⏱️', h('input', { type: 'number', min: 0.1, max: LIMITS.wait, step: 0.5, value: b.sec, 'data-field': 'sec', 'aria-label': '기다릴 초' }), '초 기다리기', del);
        el.append(row);
        break;
      case 'say':
        row.append('💬', h('input', { type: 'text', maxLength: LIMITS.text, value: b.text, 'data-field': 'text', 'aria-label': '할 말' }), '말하기', del);
        el.append(row);
        break;
      case 'face': {
        const sel = options(h('select', { 'data-field': 'expr', 'aria-label': '표정' }), EXPRESSIONS.map((e) => [e, EXPRESSION_NAMES[e]]), b.expr);
        row.append('😊 표정', sel, del);
        el.append(row);
        break;
      }
    }
    return el;
  }

  describe(b) {
    switch (b.type) {
      case 'action': return `행동 블록: ${this.actions.find((a) => a.id === b.action)?.name || b.action}`;
      case 'repeat': return `반복 블록: ${b.times}번`;
      case 'if': return '만약 블록';
      case 'wait': return `기다리기 블록: ${b.sec}초`;
      case 'say': return `말하기 블록: ${b.text}`;
      case 'face': return `표정 블록: ${EXPRESSION_NAMES[b.expr]}`;
      default: return '블록';
    }
  }

  markActive() {
    this.ws.querySelectorAll('.blk-body.active, .script.selected').forEach((e) => e.classList.remove('active', 'selected'));
    let body = this.ws.querySelector(`.blk-body[data-ref="${CSS.escape(this.activeRef || '')}"]`);
    if (!body) { this.activeRef = this.program.scripts[0]?.id; body = this.ws.querySelector(`.blk-body[data-ref="${CSS.escape(this.activeRef || '')}"]`); }
    body?.classList.add('active');
    body?.closest('.script')?.classList.add('selected');
  }

  setRunning(id) {
    this.ws.querySelectorAll('.blk.running').forEach((e) => e.classList.remove('running'));
    if (!id) return;
    const el = this.ws.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (el) {
      el.classList.add('running');
      const r = el.getBoundingClientRect(), wr = this.ws.getBoundingClientRect();
      if (r.top < wr.top || r.bottom > wr.bottom) el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  // ── 고치기 ──
  addBlock(type, ref = this.activeRef) {
    const list = ref && (ref.includes(':') ? locate(this.program, ref.split(':')[0])?.block[ref.split(':')[1]] : this.program.scripts.find((s) => s.id === ref)?.body);
    if (!list) { this.onToast?.('먼저 블록을 넣을 칸을 눌러 주세요.', 'warn'); return null; }
    const b = newBlock(type, { action: this.actions[0]?.id });
    if (!insertBlock(this.program, ref, list.length, b)) {
      this.onToast?.(`블록은 ${LIMITS.blocks}개까지, ${LIMITS.depth}겹까지 넣을 수 있어요.`, 'warn');
      return null;
    }
    if (type === 'repeat' || type === 'if') this.activeRef = `${b.id}:${type === 'repeat' ? 'body' : 'then'}`;
    this.render();
    this.changed();
    const el = this.ws.querySelector(`[data-id="${b.id}"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'nearest' });
    el?.classList.add('fresh');
    return b;
  }

  bind() {
    // 블록 꾸러미 누르기 / 끌기
    this.paletteEl.addEventListener('pointerdown', (e) => {
      const item = e.target.closest('[data-new]');
      if (item) this.startPointer(e, { kind: 'new', type: item.dataset.new, el: item });
    });
    this.paletteEl.addEventListener('click', (e) => {
      const item = e.target.closest('[data-new]');
      if (item && e.detail === 0) this.addBlock(item.dataset.new); // 키보드 Enter/Space
    });

    this.ws.addEventListener('pointerdown', (e) => {
      const body = e.target.closest('.blk-body');
      const hat = e.target.closest('.hat');
      if (body) { this.activeRef = body.dataset.ref; this.markActive(); }
      else if (hat) { this.activeRef = hat.closest('.script').dataset.script; this.markActive(); }
      if (e.target.closest('input, select, button, textarea')) return;
      const blk = e.target.closest('.blk[data-id]');
      if (blk) this.startPointer(e, { kind: 'block', id: blk.dataset.id, el: blk });
    });

    this.ws.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'del') {
        const id = btn.closest('[data-id]').dataset.id;
        removeBlock(this.program, id);
        this.render(); this.changed();
      } else if (act === 'add-script') {
        const hasStart = this.program.scripts.some((s) => s.event.type === 'start');
        const s = newScript(hasStart ? { type: 'clickThing', thing: this.things[0]?.id } : { type: 'start' });
        this.program.scripts.push(s);
        this.activeRef = s.id;
        this.render(); this.changed();
        this.ws.querySelector(`[data-script="${s.id}"]`)?.scrollIntoView({ block: 'nearest' });
      } else if (act === 'del-script') {
        const id = btn.closest('[data-script]').dataset.script;
        const s = this.program.scripts.find((x) => x.id === id);
        if (s.body.length && !confirm('이 스크립트와 안에 든 블록을 모두 지울까요?')) return;
        this.program.scripts = this.program.scripts.filter((x) => x.id !== id);
        this.render(); this.changed();
      }
    });

    const onField = (e) => {
      const t = e.target;
      if (t.dataset.sfield) {
        const s = this.program.scripts.find((x) => x.id === t.closest('[data-script]').dataset.script);
        if (t.dataset.sfield === 'event') s.event = t.value === 'clickThing' ? { type: 'clickThing', thing: this.things[0]?.id } : { type: t.value };
        else s.event.thing = t.value;
        this.render(); this.changed();
        return;
      }
      const f = t.dataset.field;
      if (!f) return;
      const found = locate(this.program, t.closest('[data-id]').dataset.id);
      if (!found) return;
      const b = found.block;
      const num = (lo, hi, d) => { const n = parseFloat(t.value); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
      if (f === 'action' || f === 'expr') b[f] = t.value;
      else if (f === 'text') b.text = t.value.slice(0, LIMITS.text);
      else if (f === 'times') b.times = Math.round(num(1, LIMITS.repeat, 3));
      else if (f === 'sec') b.sec = Math.round(num(0.1, LIMITS.wait, 1) * 10) / 10;
      else if (f === 'gauge' || f === 'op') b.cond[f] = t.value;
      else if (f === 'value') b.cond.value = Math.round(num(0, 100, 50));
      if (e.type === 'change' && (f === 'times' || f === 'sec' || f === 'value')) {
        t.value = f === 'value' ? b.cond.value : b[f];
      }
      t.closest('[data-id]').setAttribute('aria-label', this.describe(b));
      this.changed();
    };
    this.ws.addEventListener('change', onField);
    this.ws.addEventListener('input', (e) => { if (e.target.dataset.field === 'text') onField(e); });

    this.ws.addEventListener('keydown', (e) => {
      const blk = e.target.classList?.contains('blk') ? e.target : null;
      if (!blk) return;
      const id = blk.dataset.id;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const found = locate(this.program, id);
        const next = found.list[found.index + 1]?.id || found.list[found.index - 1]?.id;
        removeBlock(this.program, id);
        this.render(); this.changed();
        if (next) this.ws.querySelector(`[data-id="${next}"]`)?.focus();
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const found = locate(this.program, id);
        const ref = blk.parentElement.dataset.ref;
        const to = e.key === 'ArrowUp' ? found.index - 1 : found.index + 2;
        if (to < 0 || to > found.list.length) return;
        moveBlock(this.program, id, ref, to);
        this.render(); this.changed();
        this.ws.querySelector(`[data-id="${id}"]`)?.focus();
      }
    });

    window.addEventListener('pointermove', (e) => this.movePointer(e));
    window.addEventListener('pointerup', (e) => this.endPointer(e));
    window.addEventListener('pointercancel', () => this.cancelDrag());
  }

  // ── 끌어다 놓기 ──
  startPointer(e, src) {
    if (e.button > 0) return;
    this.drag = { ...src, x0: e.clientX, y0: e.clientY, started: false, pointerId: e.pointerId };
  }

  movePointer(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return;
      d.started = true;
      const r = d.el.getBoundingClientRect();
      d.dx = e.clientX - r.left; d.dy = e.clientY - r.top;
      d.ghost = d.el.cloneNode(true);
      d.ghost.classList.add('ghost-blk');
      d.ghost.removeAttribute('data-id');
      d.ghost.style.width = Math.min(r.width, 320) + 'px';
      document.body.append(d.ghost);
      if (d.kind === 'block') d.el.classList.add('lifted');
      document.body.classList.add('dragging');
    }
    e.preventDefault();
    d.ghost.style.left = e.clientX - d.dx + 'px';
    d.ghost.style.top = e.clientY - d.dy + 'px';
    // 가장자리에 가까우면 저절로 스크롤
    const wr = this.ws.getBoundingClientRect();
    if (e.clientY < wr.top + 40) this.ws.scrollTop -= 12;
    else if (e.clientY > wr.bottom - 40) this.ws.scrollTop += 12;
    const tr = this.trash.getBoundingClientRect();
    const overTrash = d.kind === 'block' && e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom;
    const pr = this.paletteEl.getBoundingClientRect();
    const overPalette = d.kind === 'block' && e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom;
    this.trash.classList.toggle('hot', overTrash || overPalette);
    d.remove = overTrash || overPalette;
    d.slot = d.remove ? null : this.nearestSlot(e.clientX, e.clientY, d);
    this.ws.querySelectorAll('.slot.hot').forEach((s) => s.classList.remove('hot'));
    d.slot?.classList.add('hot');
  }

  nearestSlot(x, y, d) {
    let best = null, bestD = Infinity;
    const wr = this.ws.getBoundingClientRect();
    if (x < wr.left - 60 || x > wr.right + 60 || y < wr.top - 40 || y > wr.bottom + 40) return null;
    for (const s of this.ws.querySelectorAll('.slot')) {
      if (d.kind === 'block' && d.el.contains(s)) continue;
      const r = s.getBoundingClientRect();
      if (r.bottom < wr.top || r.top > wr.bottom) continue;
      const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      const dy = Math.abs(y - (r.top + r.height / 2));
      const dist = dy + dx * 0.6;
      if (dist < bestD) { bestD = dist; best = s; }
    }
    return bestD < 140 ? best : null;
  }

  endPointer(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    if (!d.started) {
      if (d.kind === 'new') this.addBlock(d.type);
      else d.el.focus({ preventScroll: true });
      return;
    }
    const slot = d.slot;
    this.cleanupDrag(d);
    if (d.kind === 'block' && d.remove) {
      removeBlock(this.program, d.id);
      this.onToast?.('블록을 지웠어요.', 'ok');
    } else if (slot) {
      const ref = slot.dataset.ref, index = +slot.dataset.index;
      if (d.kind === 'new') {
        const b = newBlock(d.type, { action: this.actions[0]?.id });
        if (!insertBlock(this.program, ref, index, b)) this.onToast?.(`블록은 ${LIMITS.blocks}개까지, ${LIMITS.depth}겹까지 넣을 수 있어요.`, 'warn');
        else this.activeRef = ref;
      } else if (!moveBlock(this.program, d.id, ref, index)) {
        this.onToast?.('거기에는 놓을 수 없어요.', 'warn');
      } else this.activeRef = ref;
    } else return this.render();
    this.render();
    this.changed();
  }

  cleanupDrag(d) {
    d.ghost?.remove();
    d.el?.classList.remove('lifted');
    document.body.classList.remove('dragging');
    this.trash.classList.remove('hot');
    this.ws.querySelectorAll('.slot.hot').forEach((s) => s.classList.remove('hot'));
  }

  cancelDrag() {
    if (this.drag) this.cleanupDrag(this.drag);
    this.drag = null;
  }
}
