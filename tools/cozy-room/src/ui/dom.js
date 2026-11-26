// 화면 도우미: 알림(토스트), 창(모달), 안전한 저장
export const $ = (sel, root = document) => root.querySelector(sel);

export function toast(text, kind = '', ms = 3200) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  box.append(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}

let lastFocus = null;
let onClose = null;
export function openModal(build, { onClosed } = {}) {
  const back = $('#modal');
  const box = back.querySelector('.modal');
  lastFocus = document.activeElement;
  box.replaceChildren();
  build(box, closeModal);
  back.hidden = false;
  onClose = onClosed || null;
  (box.querySelector('[data-autofocus]') || box).focus();
}
export function closeModal() {
  const back = $('#modal');
  if (back.hidden) return;
  back.hidden = true;
  const fn = onClose;
  onClose = null;
  fn?.();
  lastFocus?.focus?.();
}
export const modalOpen = () => !$('#modal').hidden;

// 창 안에서 Tab 이 밖으로 나가지 않게, Esc 로 닫기
document.addEventListener('keydown', (e) => {
  if (!modalOpen()) return;
  if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
  if (e.key !== 'Tab') return;
  const box = $('#modal .modal');
  const items = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

// localStorage 는 막혀 있을 수도 있어서 항상 try 로 감싸요
const PREFIX = 'cozy-room:';
export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(PREFIX + key); } catch { /* 괜찮아요 */ } },
};

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
