// 학생 화면: 도움 요청 고르기 → 자세히 적기 → 보내기 → 내 요청 진행 상황 보기
import { TYPES, TYPE_BY_ID, STATUSES, STATUS_BY_ID, escapeHtml, formatAgo, showToast, safeStorage } from "./common.js";
import { openStore } from "./store.js";

const $ = (sel) => document.querySelector(sel);
const NAME_KEY = "helpme.studentName";

const screens = ["start", "join", "main", "detail", "done", "mine"];
let store = null;
let current = null;        // 지금 고른 요청 종류
let chosenOption = "";
let myRequests = [];
let lastStatuses = null;   // 상태가 바뀌면 알려 주려고 기억해요
let stopWatch = null;

// ── 화면 바꾸기 (주소 뒤 #으로 기억해서 뒤로 가기 버튼도 돼요) ──
function show(name) {
  for (const s of screens) $(`#screen-${s}`).hidden = s !== name;
  document.body.dataset.screen = name;
  scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function route() {
  const hash = location.hash.slice(1);
  // 방 번호 모드에서 아직 방 번호가 없으면 첫 화면(학생/선생님 고르기)부터 보여 줘요
  if (store?.mode === "room" && hash === "join") {
    openJoin();
  } else if (store?.mode === "room" && !store.room) {
    show("start");
  } else if (hash.startsWith("help-") && TYPE_BY_ID[hash.slice(5)]) {
    openDetail(hash.slice(5));
  } else if (hash === "mine") {
    renderMine();
    show("mine");
  } else if (hash === "done") {
    show("done");
  } else {
    renderHello();
    show("main");
  }
}

function go(name) {
  const target = name === "main" ? "" : name;
  if (location.hash.slice(1) === target) {
    route();
  } else if (!target) {
    history.pushState(null, "", location.pathname + location.search);  // 주소에서 #을 지워요
    route();
  } else {
    location.hash = target;
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-go]");
  if (!btn) return;
  e.preventDefault();
  go(btn.dataset.go);
});
addEventListener("hashchange", route);
addEventListener("popstate", route);

// ── 1. 메인 카드 ──
function renderGrid() {
  $("#help-grid").innerHTML = TYPES.map((t) => `
    <button class="help-card" data-type="${t.id}">
      ${t.private ? '<span class="lock pill tone-gray">🔒 비밀</span>' : ""}
      <span class="card-icon c-${t.color}" aria-hidden="true">${t.icon}</span>
      <b>${t.title}</b>
      <small>${t.desc}</small>
      <span class="arrow" aria-hidden="true">→</span>
    </button>`).join("");
  $("#help-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".help-card");
    if (card) location.hash = `help-${card.dataset.type}`;
  });
}

function renderHello() {
  const name = safeStorage.get(NAME_KEY, "");
  $("#hello").hidden = !name;
  $("#hello-name").textContent = name ? `${name} 학생, 안녕하세요!` : "";
}

// ── 2. 상세 요청 ──
function openDetail(typeId) {
  current = TYPE_BY_ID[typeId];
  chosenOption = "";
  $("#d-icon").className = `card-icon c-${current.color}`;
  $("#d-icon").textContent = current.icon;
  $("#d-title").textContent = current.title;
  $("#d-private").hidden = !current.private;
  $("#d-options").innerHTML = current.options
    .map((o) => `<button type="button" class="chip" aria-pressed="false">${escapeHtml(o)}</button>`).join("");
  $("#d-message").value = "";
  $("#d-count").textContent = "0";
  $("#d-urgent").checked = false;
  $("#d-name").value = safeStorage.get(NAME_KEY, "");
  $("#d-error").textContent = "";
  $("#d-send").disabled = false;
  show("detail");
}

$("#d-options").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const on = chip.getAttribute("aria-pressed") !== "true";
  for (const c of $("#d-options").children) c.setAttribute("aria-pressed", "false");
  chip.setAttribute("aria-pressed", String(on));
  chosenOption = on ? chip.textContent : "";
  $("#d-error").textContent = "";
});
$("#d-message").addEventListener("input", (e) => {
  $("#d-count").textContent = e.target.value.length;
  $("#d-error").textContent = "";
});

$("#request-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = $("#d-message").value.trim();
  const studentName = $("#d-name").value.trim();
  if (!chosenOption && !message) {
    $("#d-error").textContent = "👆 위에서 하나를 고르거나, 하고 싶은 말을 적어 주세요.";
    return;
  }
  if (!studentName) {
    $("#d-error").textContent = "✏️ 이름 또는 번호를 적어 주세요.";
    $("#d-name").focus();
    return;
  }
  if (!store) {
    $("#d-error").textContent = "아직 준비 중이에요. 잠시 뒤에 다시 눌러 주세요.";
    return;
  }
  $("#d-send").disabled = true;
  $("#d-send").textContent = "보내는 중…";
  try {
    safeStorage.set(NAME_KEY, studentName);
    const { code } = await store.addRequest({
      type: current.id, detail: chosenOption, message, studentName, urgent: $("#d-urgent").checked,
    });
    $("#done-code").textContent = `요청 번호 #${code}`;
    location.hash = "done";
    confetti();
  } catch (err) {
    $("#d-error").textContent = `😢 보내지 못했어요. ${err.message}`;
  } finally {
    $("#d-send").disabled = false;
    $("#d-send").textContent = "📨 요청 보내기";
  }
});

// ── 3. 완료 화면의 작은 축하 효과 ──
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#5B91D6", "#FFD77A", "#DDF2EA", "#253B5B", "#F7B2A8"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.5}s`;
    p.style.animationDuration = `${1.4 + Math.random()}s`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

// ── 4. 내 요청 확인 ──
function renderMine() {
  const list = $("#mine-list");
  if (!myRequests.length) {
    list.innerHTML = `<div class="empty"><span class="big">📭</span>아직 보낸 요청이 없어요.<br>
      <button class="btn btn-primary" data-go="main" style="margin-top:16px">도움 요청하러 가기</button></div>`;
    return;
  }
  list.innerHTML = myRequests.map((r) => {
    const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
    const status = STATUS_BY_ID[r.status] || STATUSES[0];
    const nowIdx = STATUSES.findIndex((s) => s.id === status.id);
    const text = [r.detail, r.message].filter(Boolean).join(" · ");
    return `<article class="mine-item st-${status.id}">
      <div class="mine-top">
        <span class="ico" aria-hidden="true">${type.icon}</span>
        <b>${type.title}</b>
        <span class="pill tone-${status.tone}">${status.icon} ${status.label}</span>
      </div>
      ${text ? `<p class="mine-detail">${escapeHtml(text)}</p>` : ""}
      <div class="mine-time">${formatAgo(r.createdAt)} · 요청 번호 #${escapeHtml(r.code || "")}</div>
      <div class="steps" aria-label="진행 상황: ${status.label}">
        ${STATUSES.map((s, i) => `<div class="step s-${s.id} ${i <= nowIdx ? "on" : ""} ${i === nowIdx ? "now" : ""}">
          <span class="dot">${s.icon}</span>${s.label}</div>`).join("")}
      </div>
    </article>`;
  }).join("");
}

function updateMineCount() {
  const active = myRequests.filter((r) => r.status !== "done").length;
  $("#mine-count").hidden = active === 0;
  $("#mine-count").textContent = active;
}

function onMine(list) {
  // 선생님이 상태를 바꾸면 학생 화면에도 알려 줘요
  if (lastStatuses) {
    for (const r of list) {
      const before = lastStatuses.get(r.id);
      if (before && before !== r.status) {
        const s = STATUS_BY_ID[r.status];
        const type = TYPE_BY_ID[r.type] || TYPE_BY_ID.etc;
        const msg = {
          checking: "선생님이 요청을 확인했어요!",
          progress: "선생님이 도와주는 중이에요!",
          done: "요청이 해결되었어요!",
          sent: "요청 상태가 바뀌었어요.",
        }[r.status];
        showToast($("#toasts"), {
          title: msg, text: type.title, icon: s?.icon || "🔔",
          tone: s?.tone === "purple" ? "blue" : s?.tone || "blue",
          onClick: () => go("mine"),
        });
      }
    }
  }
  lastStatuses = new Map(list.map((r) => [r.id, r.status]));
  myRequests = list;
  updateMineCount();
  if (!$("#screen-mine").hidden) renderMine();
}

function startWatching() {
  stopWatch?.();
  lastStatuses = null;
  stopWatch = store.watchMine(onMine, (err) => showError(err.message));
}

// ── 다른 친구로 바꾸기 (여러 학생이 한 기기를 쓸 때) ──
$("#switch-btn").addEventListener("click", () => { $("#switch-modal").hidden = false; });
$("#switch-cancel").addEventListener("click", () => { $("#switch-modal").hidden = true; });
$("#switch-ok").addEventListener("click", async () => {
  $("#switch-modal").hidden = true;
  safeStorage.remove(NAME_KEY);
  try {
    await store.newStudentIdentity();
    startWatching();
  } catch (err) {
    showError(err.message);
  }
  renderHello();
  showToast($("#toasts"), { title: "새 친구로 바뀌었어요", text: "이제 새로 보내는 요청만 보여요.", icon: "👋", tone: "green", duration: 3500 });
});

function showError(text) {
  $("#error-bar").textContent = `⚠️ ${text}`;
  $("#error-bar").hidden = false;
}

// ── 0. 방 번호 넣기 (방 번호 모드) ──
let pendingCode = "";
let joining = false;
let previousRoom = "";

function openJoin() {
  previousRoom = store.room || "";
  pendingCode = "";
  joining = false;
  $("#join-msg").textContent = "";
  $("#join-msg").className = "join-msg";
  $("#join-cancel").textContent = previousRoom ? "← 원래 방으로 돌아가기" : "← 처음으로";
  drawCode();
  show("join");
}

function drawCode() {
  $("#code-slots").innerHTML = [0, 1, 2, 3]
    .map((i) => `<span class="slot ${pendingCode[i] ? "filled" : ""}">${pendingCode[i] || ""}</span>`).join("");
}

$("#keypad").innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "지우기", "0", "⌫"]
  .map((k) => `<button type="button" class="key ${/\d/.test(k) ? "" : "key-fn"}" data-key="${k}">${k}</button>`).join("");
$("#keypad").addEventListener("click", (e) => {
  const key = e.target.closest(".key")?.dataset.key;
  if (!key || joining) return;
  if (/\d/.test(key)) { if (pendingCode.length < 4) pendingCode += key; }
  else if (key === "⌫") pendingCode = pendingCode.slice(0, -1);
  else pendingCode = "";
  $("#join-msg").textContent = "";
  drawCode();
  if (pendingCode.length === 4) {
    joining = true;
    $("#join-msg").className = "join-msg wait";
    $("#join-msg").textContent = "🔌 선생님 방을 찾는 중…";
    store.setRoom(pendingCode);
  }
});
// 키보드로도 넣을 수 있어요
addEventListener("keydown", (e) => {
  if ($("#screen-join").hidden) return;
  const map = { Backspace: "⌫", Escape: "지우기" };
  const key = /^\d$/.test(e.key) ? e.key : map[e.key];
  if (key) $(`#keypad [data-key="${key}"]`)?.click();
});
$("#join-cancel").addEventListener("click", () => {
  if (previousRoom && previousRoom !== store.room) store.setRoom(previousRoom);
  go("main");  // 방 번호가 없으면 첫 화면으로 가요
});

// 첫 화면 버튼
$("#start-student").addEventListener("click", () => { location.hash = "join"; });
// 시험 모드(?net=local)라면 선생님 화면에도 그대로 붙여 줘요
$("#start-teacher").href = `admin.html${location.search}`;

function onConnStatus(st) {
  const chip = $("#conn-chip");
  const label = {
    online: `🟢 방 ${st.room}`,
    connecting: "🟡 연결 중…",
    offline: "🔴 연결 끊김",
    notfound: "🔴 연결 안 됨",
    noroom: "🚪 방 번호 넣기",
  }[st.state];
  chip.textContent = label;
  chip.className = `conn-chip ${{ online: "on", connecting: "wait", noroom: "" }[st.state] ?? "off"}`;

  // 메인·상세 화면 위의 안내 띠
  const bar = $("#conn-bar");
  if (st.state === "offline" || st.state === "notfound") {
    bar.hidden = false;
    bar.innerHTML = `🔴 <span><b>선생님 화면과 연결되지 않았어요.</b> 선생님 화면이 켜지면 자동으로 연결돼요. (방 ${st.room})${st.error ? ` ${st.error}` : ""}</span>`;
  } else {
    bar.hidden = true;
  }

  // 방 번호를 넣는 중이었다면 결과를 알려 줘요
  if (joining) {
    const msg = $("#join-msg");
    if (st.state === "online") {
      joining = false;
      msg.className = "join-msg good";
      msg.textContent = "✅ 연결됐어요!";
      setTimeout(() => go("main"), 600);
    } else if (st.state === "notfound" || st.state === "offline") {
      joining = false;
      msg.className = "join-msg bad";
      msg.textContent = st.state === "notfound"
        ? "😢 그런 방이 없어요. 숫자를 다시 확인하거나, 선생님 화면이 켜져 있는지 물어봐요."
        : `😢 연결이 안 돼요. 선생님께 알려 주세요.${st.error ? ` (${st.error})` : ""}`;
      pendingCode = "";
      drawCode();
    }
  }
}
$("#conn-chip").addEventListener("click", () => { if (store?.mode === "room") location.hash = "join"; });

// ── 앱 설치 버튼 ──
let installPrompt = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  $("#install-btn").hidden = false;
});
$("#install-btn").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#install-btn").hidden = true;
});

// 쉬는 시간 메뉴: 시험 모드 주소(?net=local 등)를 그대로 이어 줘요
document.querySelectorAll("[data-pet-link]").forEach((a) => {
  const [path, hash] = a.getAttribute("href").split("#");
  a.href = `${path}${location.search}#${hash}`;
});

// ── 시작 ──
renderGrid();
route();
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

try {
  store = await openStore("student");
  const chip = $("#conn-chip");
  chip.hidden = false;
  if (store.mode === "room") {
    store.onStatus(onConnStatus);
  } else {
    chip.textContent = store.mode === "firebase" ? "🟢 실시간 연결" : "한 브라우저 시험 모드";
    chip.className = `conn-chip ${store.mode === "firebase" ? "on" : "wait"}`;
    chip.disabled = true;
  }
  await store.ensureStudent();
  startWatching();
  route();
} catch (err) {
  showError(`선생님과 연결하지 못했어요. ${err.message}`);
}
