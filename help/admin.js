// 선생님 관리자 화면: 로그인 → 전체 요청 실시간 확인, 상태 바꾸기, 새 요청 알림(토스트·알림음·브라우저 알림)
import { TYPES, TYPE_BY_ID, STATUSES, STATUS_BY_ID, escapeHtml, formatAgo, formatClock, formatDateTime, showToast, safeStorage } from "./common.js";
import { openStore } from "./store.js";

const $ = (sel) => document.querySelector(sel);
const SOUND_KEY = "helpme.admin.sound";
const NOTIFY_KEY = "helpme.admin.notify";
const PRIVACY_KEY = "helpme.admin.privacy";
const BASE_TITLE = document.title;

let store = null;
let requests = [];
let knownIds = null;          // 처음 불러온 요청은 알림을 띄우지 않으려고 기억해요
const freshIds = new Set();   // 방금 도착한 요청 (목록에서 미끄러져 들어오는 효과)
let selectedId = null;
let pendingOpenId = null;     // 브라우저 알림을 눌러서 열 요청
let typeFilter = "all";
let statusFilter = "all";
let stopWatch = null;

// ─────────────────────────────────────────────
//  알림음 (Web Audio로 짧고 부드러운 "띵-동")
//  브라우저는 사용자가 화면을 한 번 누르기 전에는 소리를 막아요(자동 재생 제한).
//  그래서 처음 누를 때 소리 장치를 깨우고, 막혀 있으면 안내 띠를 보여 줘요.
// ─────────────────────────────────────────────
let audioCtx = null;
let soundOn = safeStorage.get(SOUND_KEY, "1") === "1";

function wakeAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch { /* 소리를 못 내는 브라우저 */ }
  setTimeout(updateSoundHint, 50);
}
addEventListener("pointerdown", wakeAudio, { capture: true });
addEventListener("keydown", wakeAudio, { capture: true });

function chime() {
  if (!soundOn || !audioCtx || audioCtx.state !== "running") return;
  const t = audioCtx.currentTime;
  [[784, 0], [1047, 0.16]].forEach(([freq, delay]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.12, t + delay + 0.03);   // 작은 소리
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.7);  // 부드럽게 사라져요
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 0.75);
  });
}

function updateSoundHint() {
  const blocked = soundOn && (!audioCtx || audioCtx.state !== "running");
  $("#sound-hint").hidden = !blocked || $("#dash").hidden;
}
function renderSoundBtn() {
  $("#sound-btn").textContent = soundOn ? "🔔" : "🔕";
  $("#sound-btn").classList.toggle("off", !soundOn);
  $("#sound-btn").title = soundOn ? "알림음 켜짐 (누르면 꺼요)" : "알림음 꺼짐 (누르면 켜요)";
}
$("#sound-btn").addEventListener("click", () => {
  soundOn = !soundOn;
  safeStorage.set(SOUND_KEY, soundOn ? "1" : "0");
  renderSoundBtn();
  wakeAudio();
  if (soundOn) setTimeout(chime, 80);
  toast({ title: soundOn ? "알림음을 켰어요" : "알림음을 껐어요", icon: soundOn ? "🔔" : "🔕", tone: "green", duration: 2500 });
});
$("#sound-unlock").addEventListener("click", () => { wakeAudio(); setTimeout(chime, 80); });
$("#m-sound-test").addEventListener("click", () => { closeMenus(); wakeAudio(); setTimeout(chime, 80); });

// ─────────────────────────────────────────────
//  브라우저 알림 (Notification API)
//  허용하지 않아도 화면 안 알림(토스트·배지·알림음)은 그대로 돼요.
// ─────────────────────────────────────────────
const canNotify = "Notification" in window;
const notifyWanted = () => safeStorage.get(NOTIFY_KEY, "1") === "1";

function renderNotifyMenu() {
  let text = "브라우저 알림 켜기";
  if (!canNotify) text = "브라우저 알림 (지원 안 됨)";
  else if (Notification.permission === "denied") text = "브라우저 알림 (차단됨)";
  else if (Notification.permission === "granted") text = notifyWanted() ? "브라우저 알림 끄기" : "브라우저 알림 켜기";
  $("#m-notify-text").textContent = text;
}
$("#m-notify").addEventListener("click", async () => {
  closeMenus();
  if (!canNotify) return toast({ title: "이 브라우저는 알림을 지원하지 않아요", text: "화면 안 알림은 그대로 작동해요.", icon: "ℹ️" });
  if (Notification.permission === "denied") {
    return toast({ title: "알림이 차단되어 있어요", text: "주소창 왼쪽 🔒(사이트 설정)에서 알림을 '허용'으로 바꿔 주세요.", icon: "🚫", tone: "yellow", duration: 9000 });
  }
  if (Notification.permission === "granted") {
    safeStorage.set(NOTIFY_KEY, notifyWanted() ? "0" : "1");
  } else {
    const result = await Notification.requestPermission();
    safeStorage.set(NOTIFY_KEY, "1");
    if (result !== "granted") toast({ title: "브라우저 알림을 허용하지 않았어요", text: "화면 안 알림은 그대로 작동해요.", icon: "ℹ️" });
  }
  renderNotifyMenu();
  if (Notification.permission === "granted" && notifyWanted()) {
    toast({ title: "브라우저 알림을 켰어요", text: "다른 창을 보고 있어도 새 요청을 알려 줘요.", icon: "🖥️", tone: "green" });
  }
});

async function browserNotify(r) {
  if (!canNotify || Notification.permission !== "granted" || !notifyWanted()) return;
  // 이 창을 보고 있을 때는 화면 안 알림으로 충분해요
  if (!document.hidden && document.hasFocus()) return;
  const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
  // 다른 사람이 볼 수 있는 알림 창에는 학생 이름과 내용을 적지 않아요
  const title = r.urgent ? "🚨 급한 도움 요청이 도착했어요!" : "새로운 도움 요청이 도착했어요!";
  const options = {
    body: `${type.icon} ${type.title} — 학생의 도움 요청을 확인해 주세요.`,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: `helpme-${r.id}`,
    data: { id: r.id },
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, options);  // 안드로이드 크롬은 이 방법만 돼요
    const n = new Notification(title, options);
    n.onclick = () => { focus(); openRequest(r.id); n.close(); };
  } catch { /* 알림을 못 띄워도 화면 안 알림은 돼요 */ }
}
// 서비스 워커가 브라우저 알림 클릭을 전해 주면 그 요청을 열어요
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.type === "open-request") openRequest(e.data.id);
});

// ─────────────────────────────────────────────
//  로그인
// ─────────────────────────────────────────────
function showLogin(auth) {
  $("#login").hidden = false;
  $("#dash").hidden = true;
  $("#admin-tools").hidden = true;
  updateSoundHint();
  const local = store.mode === "local";
  $("#email-row").hidden = local;
  $("#login-email").required = !local;
  $("#reset-btn").hidden = local;
  $("#login-pw").autocomplete = local && store.localNeedsPinSetup() ? "new-password" : "current-password";
  if (local) {
    $("#login-desc").innerHTML = store.localNeedsPinSetup()
      ? "<b>처음이에요!</b> 이 브라우저에서 쓸 선생님 비밀번호(4자 이상)를 정해 주세요.<br><small>로컬 테스트 모드: 비밀번호는 이 브라우저에만 저장돼요.</small>"
      : "선생님 비밀번호를 입력해 주세요.<br><small>로컬 테스트 모드</small>";
    $("#login-btn").textContent = store.localNeedsPinSetup() ? "비밀번호 정하고 시작하기" : "로그인";
  }
  const box = $("#not-admin");
  if (auth.state === "notAdmin") {
    box.hidden = false;
    box.innerHTML = `<b>${escapeHtml(auth.email || "")}</b> 계정은 아직 관리자로 등록되지 않았어요.<br><br>
      Firebase 콘솔 → Firestore → <b>admins</b> 컬렉션에 아래 값을 <b>문서 ID</b>로 하는 문서를 만들어 주세요. (README 5단계)<br><br>
      <code>${escapeHtml(auth.uid)}</code><br><br>
      <button class="btn btn-sm btn-white" id="na-logout">로그아웃</button>`;
    $("#na-logout").addEventListener("click", () => store.adminSignOut());
  } else {
    box.hidden = true;
  }
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#login-msg");
  msg.className = "login-msg";
  msg.textContent = "";
  $("#login-btn").disabled = true;
  try {
    await store.adminSignIn($("#login-email").value.trim(), $("#login-pw").value);
    $("#login-pw").value = "";
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    $("#login-btn").disabled = false;
  }
});
$("#reset-btn").addEventListener("click", async () => {
  const msg = $("#login-msg");
  const email = $("#login-email").value.trim();
  if (!email) { msg.className = "login-msg"; msg.textContent = "이메일을 먼저 적어 주세요."; return; }
  try {
    await store.resetPassword(email);
    msg.className = "login-msg ok";
    msg.textContent = "비밀번호를 바꾸는 메일을 보냈어요. 메일함을 확인해 주세요.";
  } catch (err) {
    msg.className = "login-msg";
    msg.textContent = err.message;
  }
});
$("#m-logout").addEventListener("click", async () => {
  closeMenus();
  await store.adminSignOut();
});

function onAuth(auth) {
  if (auth.state !== "admin") {
    stopWatch?.();
    stopWatch = null;
    requests = [];
    knownIds = null;
    selectedId = null;
    document.title = BASE_TITLE;
    showLogin(auth);
    return;
  }
  $("#login").hidden = true;
  $("#dash").hidden = false;
  $("#admin-tools").hidden = false;
  $("#m-who").textContent = `로그인: ${auth.email || ""}`;
  updateSoundHint();
  if (!stopWatch) {
    stopWatch = store.watchAll(onRequests, (err) => showError(err.message));
  }
}

// ─────────────────────────────────────────────
//  실시간 요청 받기
// ─────────────────────────────────────────────
function onRequests(list) {
  $("#error-bar").hidden = true;
  if (knownIds) {
    const arrived = list.filter((r) => !knownIds.has(r.id) && !r.read && !r.sample);
    if (arrived.length) announce(arrived);
  }
  knownIds = new Set(list.map((r) => r.id));
  requests = list;
  render();
  if (pendingOpenId && requests.some((r) => r.id === pendingOpenId)) {
    const id = pendingOpenId;
    pendingOpenId = null;
    openRequest(id);
  }
}

function announce(arrived) {
  chime();
  arrived.forEach((r) => freshIds.add(r.id));
  setTimeout(() => arrived.forEach((r) => freshIds.delete(r.id)), 1500);
  // 한꺼번에 많이 오면 토스트는 3개까지만
  arrived.slice(0, 3).forEach((r) => {
    const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
    toast({
      title: r.urgent ? "🚨 급한 도움 요청이 도착했어요!" : "새로운 도움 요청이 도착했어요!",
      text: `학생의 도움 요청을 확인해 주세요. · ${type.icon} ${type.title} · ${formatClock(r.createdAt)}`,
      icon: type.icon,
      tone: r.urgent ? "red" : "blue",
      duration: 9000,
      onClick: () => openRequest(r.id),
    });
    browserNotify(r);
  });
  if (arrived.length > 3) toast({ title: `새 요청이 ${arrived.length - 3}개 더 있어요`, icon: "📥", onClick: () => setStatusFilter("new") });
}

function toast(opts) {
  return showToast($("#toasts"), opts);
}
function showError(text) {
  $("#error-bar").textContent = `⚠️ ${text}`;
  $("#error-bar").hidden = false;
}

// ─────────────────────────────────────────────
//  화면 그리기
// ─────────────────────────────────────────────
const isNew = (r) => !r.read;
const isActive = (r) => r.read && r.status !== "done";
const isDone = (r) => r.status === "done";

function readBadge(r) {
  if (isDone(r)) return '<span class="read-badge done">해결 완료</span>';
  if (!r.read) return '<span class="read-badge unread">미확인</span>';
  return '<span class="read-badge read">확인 완료</span>';
}

function render() {
  const unread = requests.filter(isNew);
  // 요약 카드
  $("#n-all").textContent = requests.length;
  $("#n-new").textContent = unread.length;
  $("#n-active").textContent = requests.filter(isActive).length;
  $("#n-done").textContent = requests.filter(isDone).length;
  $(".sum-card.new").classList.toggle("has", unread.length > 0);
  for (const card of document.querySelectorAll(".sum-card")) {
    card.setAttribute("aria-pressed", String(card.dataset.filter === statusFilter && statusFilter !== "all"));
  }
  // 오른쪽 위 배지와 창 제목
  $("#bell-count").hidden = unread.length === 0;
  $("#bell-count").textContent = unread.length;
  $("#bell-count").classList.toggle("pulse", unread.length > 0);
  document.title = unread.length ? `(${unread.length}) 새 요청 · ${BASE_TITLE}` : BASE_TITLE;
  renderBell(unread);
  renderList();
  renderDetail();
}

function renderTypeFilters() {
  const chips = [{ id: "all", icon: "", title: "전체" }, ...TYPES];
  $("#type-filters").innerHTML = chips.map((t) => `
    <button class="filter-chip" data-type="${t.id}" aria-pressed="${t.id === typeFilter}">
      ${t.icon} ${t.id === "all" ? "전체" : t.short}
    </button>`).join("");
}
$("#type-filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  typeFilter = chip.dataset.type;
  renderTypeFilters();
  renderList();
});
function setStatusFilter(value) {
  statusFilter = value;
  $("#status-filter").value = value;
  render();
}
$("#status-filter").addEventListener("change", (e) => setStatusFilter(e.target.value));
$("#summary").addEventListener("click", (e) => {
  const card = e.target.closest(".sum-card");
  if (!card) return;
  const f = card.dataset.filter;
  setStatusFilter(statusFilter === f ? "all" : f);
});

function filtered() {
  return requests.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter === "new") return isNew(r);
    if (statusFilter === "active") return isActive(r);
    if (statusFilter === "done") return isDone(r);
    return true;
  });
}

function rowHtml(r) {
  const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
  const sub = [r.detail, r.message].filter(Boolean).join(" · ") || "내용 없음";
  const classes = ["req", !r.read && "unread", r.urgent && "urgent", isDone(r) && "is-done",
    r.id === selectedId && "selected", freshIds.has(r.id) && "fresh"].filter(Boolean).join(" ");
  return `<button class="${classes}" data-id="${escapeHtml(r.id)}">
    <span class="req-ico c-${type.color}" aria-hidden="true">${type.icon}</span>
    <span class="req-main">
      <span class="req-title">${type.title}
        ${r.urgent ? '<span class="mini mini-urgent">급해요</span>' : ""}
        ${type.private ? '<span class="mini mini-lock">🔒 비밀</span>' : ""}
      </span>
      <span class="req-sub"><span class="who">${escapeHtml(r.studentName || "이름 없음")}</span> · ${escapeHtml(sub)}</span>
    </span>
    <span class="req-meta">${readBadge(r)}<span class="req-time" title="${formatDateTime(r.createdAt)}">${formatAgo(r.createdAt)}</span></span>
  </button>`;
}

function renderList() {
  const items = filtered();
  const list = $("#list");
  if (!requests.length) {
    list.innerHTML = `<div class="empty"><span class="big">🌤️</span>아직 도움 요청이 없어요.<br>
      학생이 요청을 보내면 여기에 바로 나타나요.<br>
      <button class="btn btn-white" id="empty-samples" style="margin-top:16px">📦 샘플 데이터 넣어 보기</button></div>`;
    $("#empty-samples").addEventListener("click", addSamples);
    return;
  }
  if (!items.length) {
    list.innerHTML = `<div class="empty"><span class="big">🔍</span>조건에 맞는 요청이 없어요.</div>`;
    return;
  }
  // 새로운(미확인) 요청을 맨 위에, 그 안에서는 최신 순
  const fresh = items.filter(isNew);
  const rest = items.filter((r) => !isNew(r));
  let html = "";
  if (fresh.length) html += `<div class="list-label">🔵 새로운 요청 ${fresh.length}개</div>${fresh.map(rowHtml).join("")}`;
  if (rest.length) html += `<div class="list-label">확인한 요청</div>${rest.map(rowHtml).join("")}`;
  list.innerHTML = html;
}
$("#list").addEventListener("click", (e) => {
  const row = e.target.closest(".req");
  if (row) openRequest(row.dataset.id);
});

function renderBell(unread) {
  $("#bell-list").innerHTML = unread.length
    ? unread.slice(0, 8).map((r) => {
      const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
      return `<button class="bell-item" data-id="${escapeHtml(r.id)}">
        <span class="ico">${type.icon}</span>
        <span><b>${r.urgent ? "🚨 " : ""}${type.title}</b><small>${escapeHtml(r.studentName || "")} · ${formatAgo(r.createdAt)}</small></span>
      </button>`;
    }).join("")
    : '<div class="bell-empty">새로운 요청이 없어요 😊</div>';
}
$("#bell-list").addEventListener("click", (e) => {
  const item = e.target.closest(".bell-item");
  if (!item) return;
  closeMenus();
  openRequest(item.dataset.id);
});

// ── 상세 내용 ──
function renderDetail() {
  const box = $("#detail");
  const r = requests.find((x) => x.id === selectedId);
  if (!r) {
    box.innerHTML = '<div class="detail-empty"><span class="big">👈</span>요청을 누르면 자세한 내용이 여기에 나와요.</div>';
    closeSheet();
    return;
  }
  const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
  const status = STATUS_BY_ID[r.status] || STATUSES[0];
  box.innerHTML = `
    <div class="detail-head">
      <span class="req-ico c-${type.color}">${type.icon}</span>
      <div>
        <h2>${type.title}</h2>
        <div class="sub">${readBadge(r)} <span class="pill tone-${status.tone}">${status.icon} ${status.label}</span></div>
      </div>
      <button class="icon-btn detail-close" id="detail-close" aria-label="닫기">✕</button>
    </div>
    ${r.urgent ? '<div class="error-bar" style="margin-bottom:12px">🚨 학생이 "급해요"를 눌렀어요</div>' : ""}
    ${type.private ? '<div class="privacy-note" style="margin-bottom:14px">🔒 개인적인 내용일 수 있어요. 다른 학생이 보지 않도록 해 주세요.</div>' : ""}
    <dl class="kv">
      <dt>보낸 학생</dt><dd class="who-dd">${escapeHtml(r.studentName || "이름 없음")}</dd>
      <dt>세부 항목</dt><dd>${escapeHtml(r.detail || "—")}</dd>
      <dt>요청 시간</dt><dd>${formatDateTime(r.createdAt)} <span style="color:var(--gray)">(${formatAgo(r.createdAt)})</span></dd>
      ${r.readAt ? `<dt>확인한 시간</dt><dd>${formatClock(r.readAt)}</dd>` : ""}
      ${r.doneAt && isDone(r) ? `<dt>해결 시간</dt><dd>${formatClock(r.doneAt)}</dd>` : ""}
      <dt>요청 번호</dt><dd>#${escapeHtml(r.code || r.id)}</dd>
    </dl>
    <div class="detail-title">학생이 적은 내용</div>
    <div class="message-box ${r.message ? "" : "empty-msg"}">${r.message ? escapeHtml(r.message) : "적은 내용이 없어요."}</div>
    <div class="detail-title">진행 상태 바꾸기 (학생 화면에도 바로 보여요)</div>
    <div class="status-btns">
      ${STATUSES.map((s) => `<button class="status-btn s-${s.id}" data-status="${s.id}" aria-pressed="${s.id === r.status}">${s.icon} ${s.label}</button>`).join("")}
    </div>
    <div class="detail-actions">
      ${isDone(r) ? "" : '<button class="btn btn-primary btn-lg" data-act="done">✅ 해결 완료로 처리</button>'}
      ${r.read && !isDone(r) ? '<button class="btn btn-sm" data-act="unread">🔵 미확인으로 되돌리기</button>' : ""}
      <button class="btn btn-sm btn-danger" data-act="delete">🗑️ 이 요청 지우기</button>
    </div>`;
}

$("#detail").addEventListener("click", async (e) => {
  const r = requests.find((x) => x.id === selectedId);
  if (!r) return;
  if (e.target.closest("#detail-close")) { selectedId = null; renderList(); renderDetail(); return; }
  const statusBtn = e.target.closest(".status-btn");
  const act = e.target.closest("[data-act]")?.dataset.act;
  try {
    if (statusBtn) {
      const next = statusBtn.dataset.status;
      await store.updateRequest(r.id, { status: next, read: next === "sent" ? r.read : true }, r);
      toast({ title: `"${STATUS_BY_ID[next].label}"(으)로 바꿨어요`, icon: STATUS_BY_ID[next].icon, tone: "green", duration: 2500 });
    } else if (act === "done") {
      await store.updateRequest(r.id, { status: "done", read: true }, r);
      toast({ title: "해결 완료로 처리했어요", text: "학생 화면에도 '해결 완료'로 보여요.", icon: "✅", tone: "green", duration: 3000 });
    } else if (act === "unread") {
      await store.updateRequest(r.id, { read: false, status: "sent" }, r);
      selectedId = null;
      render();
    } else if (act === "delete") {
      if (await confirmBox("이 요청을 지울까요?", "지우면 학생 화면에서도 사라지고 되돌릴 수 없어요.")) {
        await store.deleteRequest(r.id);
        selectedId = null;
        render();
      }
    }
  } catch (err) {
    toast({ title: "바꾸지 못했어요", text: err.message, icon: "⚠️", tone: "red" });
  }
});

// 요청을 열면: 상세 내용을 보여 주고, 미확인이면 '확인 완료(선생님 확인 중)'로 바꿔요
async function openRequest(id) {
  const r = requests.find((x) => x.id === id);
  if (!r) { pendingOpenId = id; return; }
  selectedId = id;
  if (statusFilter !== "all" && !filtered().some((x) => x.id === id)) setStatusFilter("all");
  renderList();
  renderDetail();
  openSheet();
  document.querySelector(`.req[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (!r.read) {
    try {
      await store.updateRequest(id, { read: true, status: r.status === "sent" ? "checking" : r.status }, r);
    } catch (err) {
      toast({ title: "확인 표시를 하지 못했어요", text: err.message, icon: "⚠️", tone: "red" });
    }
  }
}

// 태블릿·휴대폰에서는 상세 내용이 아래에서 올라와요
const narrow = matchMedia("(max-width: 900px)");
function openSheet() {
  if (!narrow.matches) return;
  $("#detail").classList.add("open");
  $("#detail-backdrop").hidden = false;
}
function closeSheet() {
  $("#detail").classList.remove("open");
  $("#detail-backdrop").hidden = true;
}
$("#detail-backdrop").addEventListener("click", () => { selectedId = null; renderList(); renderDetail(); });

// ── 메뉴 ──
function closeMenus() {
  $("#bell-menu").hidden = true;
  $("#menu").hidden = true;
  $("#bell-btn").setAttribute("aria-expanded", "false");
  $("#menu-btn").setAttribute("aria-expanded", "false");
}
function toggleMenu(btn, menu) {
  const open = menu.hidden;
  closeMenus();
  menu.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
}
$("#bell-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleMenu($("#bell-btn"), $("#bell-menu")); });
$("#menu-btn").addEventListener("click", (e) => { e.stopPropagation(); renderNotifyMenu(); toggleMenu($("#menu-btn"), $("#menu")); });
document.addEventListener("click", (e) => { if (!e.target.closest(".bell-wrap")) closeMenus(); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeMenus();
  if ($("#detail").classList.contains("open")) { selectedId = null; renderList(); renderDetail(); }
});

// 화면 가리기: 전자칠판에 선생님 화면을 띄울 때 학생 이름과 내용을 흐리게 해요
function applyPrivacy(on) {
  document.body.classList.toggle("privacy", on);
  $("#m-privacy-text").textContent = on ? "화면 가리기 끄기" : "화면 가리기 (전자칠판용)";
  safeStorage.set(PRIVACY_KEY, on ? "1" : "0");
}
$("#m-privacy").addEventListener("click", () => { closeMenus(); applyPrivacy(!document.body.classList.contains("privacy")); });

async function addSamples() {
  closeMenus();
  try {
    await store.addSamples();
    toast({ title: "샘플 요청 6개를 넣었어요", icon: "📦", tone: "green", duration: 3000 });
  } catch (err) {
    toast({ title: "샘플을 넣지 못했어요", text: err.message, icon: "⚠️", tone: "red" });
  }
}
$("#m-samples").addEventListener("click", addSamples);
$("#m-test").addEventListener("click", () => {
  closeMenus();
  toast({ title: "3초 뒤에 테스트 요청이 도착해요", text: "다른 창을 보고 있으면 브라우저 알림도 시험할 수 있어요.", icon: "🧪", duration: 3000 });
  setTimeout(() => store.addTestRequest().catch((err) => toast({ title: "테스트 요청을 보내지 못했어요", text: err.message, icon: "⚠️", tone: "red" })), 3000);
});
$("#m-clean").addEventListener("click", async () => {
  closeMenus();
  const done = requests.filter(isDone);
  if (!done.length) return toast({ title: "지울 해결 완료 요청이 없어요", icon: "🧹", duration: 2500 });
  if (!(await confirmBox(`해결 완료된 요청 ${done.length}개를 지울까요?`, "지우면 되돌릴 수 없어요."))) return;
  try {
    for (const r of done) await store.deleteRequest(r.id);
    toast({ title: `${done.length}개를 지웠어요`, icon: "🧹", tone: "green", duration: 2500 });
  } catch (err) {
    toast({ title: "지우지 못했어요", text: err.message, icon: "⚠️", tone: "red" });
  }
});

function confirmBox(title, text) {
  return new Promise((resolve) => {
    $("#confirm-title").textContent = title;
    $("#confirm-text").textContent = text;
    $("#confirm").hidden = false;
    const done = (v) => {
      $("#confirm").hidden = true;
      $("#confirm-yes").onclick = $("#confirm-no").onclick = null;
      resolve(v);
    };
    $("#confirm-yes").onclick = () => done(true);
    $("#confirm-no").onclick = () => done(false);
  });
}

// "방금 전", "5분 전" 같은 시간을 30초마다 새로 그려요
setInterval(() => { if (requests.length) { renderList(); renderBell(requests.filter(isNew)); } }, 30000);

// ── 시작 ──
renderSoundBtn();
renderTypeFilters();
applyPrivacy(safeStorage.get(PRIVACY_KEY, "0") === "1");
const hashId = new URLSearchParams(location.hash.slice(1)).get("req");
if (hashId) pendingOpenId = hashId;
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

try {
  store = await openStore("admin");
  const chip = $("#mode-chip");
  chip.hidden = false;
  chip.textContent = store.mode === "firebase" ? "● Firebase 실시간 연결" : "로컬 테스트 모드";
  chip.classList.toggle("live", store.mode === "firebase");
  store.onAdminAuth(onAuth);
} catch (err) {
  $("#login").hidden = false;
  $("#login-msg").textContent = `연결하지 못했어요. ${err.message}`;
}
