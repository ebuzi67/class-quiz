// 미션 탭 — 미션 목록, 통과 확인, 도장 저장
import { el, store, toast } from './dom.js';
import { flatten } from '../blocks/program.js';

export class MissionBoard {
  constructor({ root, countEl, missions, getContext, onPass }) {
    Object.assign(this, { root, countEl, missions, getContext, onPass });
    const ids = new Set(missions.map((m) => m.id));
    this.passed = new Set((store.get('missions', []) || []).filter((id) => ids.has(id)));
    this.render();
  }

  render() {
    const r = this.root;
    r.replaceChildren(
      el('p', { class: 'muted', text: '미션을 하나씩 해결하면 도장을 받아요. 위에서부터 차례대로 도전해 보세요!' }),
    );
    for (const m of this.missions) {
      const done = this.passed.has(m.id);
      r.append(el('article', { class: `mission${done ? ' done' : ''}`, 'aria-label': `${m.lesson}차시 미션: ${m.title}${done ? ', 통과' : ''}` },
        el('div', { class: 'm-top' },
          el('span', { class: 'badge', 'aria-hidden': 'true', text: m.badge || '⭐' }),
          el('div', {},
            el('span', { class: 'tag', text: `${m.lesson}차시 · ${m.concept}` }),
            el('h3', { text: `${done ? '✅ ' : ''}${m.title}` })),
        ),
        el('p', { text: m.goal }),
        el('details', {}, el('summary', { text: '💡 도움말 보기' }), el('p', { text: m.hint })),
      ));
    }
    r.append(el('button', { type: 'button', class: 'btn danger', text: '🔄 도장 모두 지우기 (선생님용)', onclick: () => {
      if (!confirm('모든 미션 도장을 지울까요?')) return;
      this.passed.clear();
      store.set('missions', []);
      this.render();
    } }));
    this.countEl.textContent = `${this.passed.size}/${this.missions.length}`;
  }

  // 지금 상태로 미션 통과를 확인해요
  check() {
    const ctx = this.getContext();
    const c = { ...ctx, blocks: flatten(ctx.program), scripts: ctx.program.scripts };
    let changed = false;
    for (const m of this.missions) {
      if (this.passed.has(m.id)) continue;
      let ok = false;
      try { ok = !!m.check(c); } catch (err) { console.warn(`미션 "${m.title}" 확인 중 문제`, err); }
      if (ok) {
        this.passed.add(m.id);
        changed = true;
        toast(`${m.badge} 미션 통과! "${m.title}"`, 'ok', 4500);
        this.onPass?.(m);
      }
    }
    if (changed) {
      store.set('missions', [...this.passed]);
      this.render();
    }
  }
}
