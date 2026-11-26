// 학생 화면과 선생님 화면이 함께 쓰는 정보와 작은 도구들이에요.

// 도움 요청 종류 6가지. id는 데이터베이스에 저장되는 이름이라 바꾸지 않아요.
// private: true인 종류는 선생님 화면에서 🔒 표시를 하고, '화면 가리기' 때 더 조심해서 가려요.
export const TYPES = [
  {
    id: "teacher", short: "선생님", icon: "🙋", title: "선생님이 필요해요", desc: "선생님을 불러요",
    color: "blue",
    options: ["질문이 있어요", "검사를 받고 싶어요", "자리로 와 주세요", "따로 이야기하고 싶어요"],
  },
  {
    id: "study", short: "공부", icon: "📚", title: "공부가 어려워요", desc: "모르는 것을 물어봐요",
    color: "yellow",
    options: ["문제를 모르겠어요", "푸는 방법을 모르겠어요", "다시 설명해 주세요", "과제가 어려워요"],
  },
  {
    id: "supplies", short: "준비물", icon: "🎒", title: "준비물이 필요해요", desc: "빌리고 싶은 물건",
    color: "mint",
    options: ["연필·지우개", "공책·종이", "가위·풀", "색연필·사인펜", "교과서", "자·각도기"],
  },
  {
    id: "friend", short: "친구", icon: "🤝", title: "친구와 문제가 있어요", desc: "선생님만 볼 수 있어요",
    color: "cream", private: true,
    options: ["다툼이 있었어요", "속상한 일이 있어요", "놀림을 받았어요", "따로 이야기하고 싶어요"],
  },
  {
    id: "health", short: "몸·건강", icon: "🩺", title: "아프거나 불편해요", desc: "몸이 안 좋을 때",
    color: "red", private: true,
    options: ["머리가 아파요", "배가 아파요", "다쳤어요", "화장실이 급해요", "보건실에 가고 싶어요", "추워요·더워요"],
  },
  {
    id: "etc", short: "기타", icon: "💬", title: "기타 도움이 필요해요", desc: "그 밖의 모든 일",
    color: "navy",
    options: ["기기가 안 돼요", "물을 마시고 싶어요", "자리를 바꾸고 싶어요", "그 밖의 일"],
  },
];

export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]));

// 요청 상태 4가지 (학생 화면 순서대로)
export const STATUSES = [
  { id: "sent", label: "요청 완료", icon: "📨", tone: "blue" },
  { id: "checking", label: "선생님 확인 중", icon: "👀", tone: "yellow" },
  { id: "progress", label: "처리 중", icon: "🏃", tone: "purple" },
  { id: "done", label: "해결 완료", icon: "✅", tone: "green" },
];
export const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

// 입력 길이 제한 (firestore.rules와 같은 숫자예요)
export const LIMITS = { message: 300, name: 20, detail: 40 };

// 요청 고유번호: 화면에 보여 주기 쉬운 짧은 글자 (헷갈리는 0/O, 1/I는 뺐어요)
export function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

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
