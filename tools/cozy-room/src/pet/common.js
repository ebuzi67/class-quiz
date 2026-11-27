// 반려동물 화면에서 쓰는 작은 도우미 (저요! 저요! 도와주세요의 common.js에서 필요한 것만 가져왔어요)

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

// 10:32 → "오전 10:32"
export function formatClock(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

// "11월 26일 (목) 오전 10:32"

export function formatDateTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const day = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  return `${day} ${formatClock(ms)}`;
}

// "방금 전", "5분 전", "오늘 오전 9:10", "11월 25일 오후 2:00"


export function formatAgo(ms, now = Date.now()) {
  if (!ms) return "";
  const sec = Math.max(0, Math.round((now - ms) / 1000));
  if (sec < 60) return "방금 전";
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  const d = new Date(ms);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return `오늘 ${formatClock(ms)}`;
  return formatDateTime(ms);
}

// 짧은 안내 메시지(토스트)를 화면에 띄워요

export function showToast(container, { title, text = "", icon = "🔔", tone = "blue", onClick, duration = 6000 }) {
  const el = document.createElement("div");
  el.className = `toast tone-${tone}`;
  el.setAttribute("role", "status");
  el.innerHTML = `<span class="toast-icon">${icon}</span>
    <span class="toast-body"><b>${escapeHtml(title)}</b>${text ? `<small>${escapeHtml(text)}</small>` : ""}</span>
    <button class="toast-close" aria-label="닫기">✕</button>`;
  const close = () => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 250);
  };
  el.querySelector(".toast-close").addEventListener("click", (e) => { e.stopPropagation(); close(); });
  if (onClick) {
    el.classList.add("clickable");
    el.addEventListener("click", () => { onClick(); close(); });
  }
  container.prepend(el);
  if (duration) setTimeout(close, duration);
  return el;
}

// localStorage는 사생활 보호 모드 등에서 막힐 수 있어서 항상 감싸서 써요

export const safeStorage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* 저장이 안 돼도 앱은 계속 써요 */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* 무시 */ }
  },
};

