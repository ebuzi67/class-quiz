// 요청 데이터를 저장하고 읽는 곳이에요. 학생 화면과 선생님 화면은 이 파일만 써요.
//
// 두 가지 방식이 같은 모양(같은 함수 이름)으로 움직여요.
//  · 로컬 테스트 모드: localStorage에 저장. 같은 브라우저의 다른 탭끼리만 바로 전달돼요.
//  · Firebase 모드: Firestore에 저장. 여러 기기 사이에 실시간으로 전달돼요. (firebase.js)
// firebase-config.js가 채워져 있으면 Firebase 모드, 비어 있으면 로컬 테스트 모드예요.
// 주소 뒤에 ?local=1 을 붙이면 설정이 있어도 로컬 테스트 모드로 열려요.
//
// ── 요청 한 개의 모양 (Firestore 문서 requests/{id}와 같아요) ──
//  id          요청 고유번호 (문서 id)
//  code        화면에 보여 주는 짧은 번호 (예: "K7Q2M")
//  type        요청 종류 id (common.js의 TYPES)
//  detail      고른 세부 항목 (없으면 "")
//  message     학생이 적은 내용 (없으면 "")
//  urgent      급해요 표시 (true/false)
//  studentName 학생 이름 또는 번호 (선생님만 봐요)
//  studentUid  이 요청을 보낸 기기(학생)의 id. 학생은 이 값이 자기 것인 요청만 볼 수 있어요.
//  status      "sent" 요청 완료 → "checking" 확인 중 → "progress" 처리 중 → "done" 해결 완료
//  read        선생님이 열어 봤는지 (false = 미확인)
//  createdAt   요청 시간, updatedAt 바뀐 시간, readAt 처음 열어 본 시간, doneAt 해결 시간 (밀리초)

import { firebaseConfig } from "./firebase-config.js";
import { makeCode, safeStorage, TYPES, LIMITS } from "./common.js";

const forceLocal = new URLSearchParams(location.search).has("local");
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export async function openStore(role) {
  if (isFirebaseConfigured && !forceLocal) {
    const { openFirebaseStore } = await import("./firebase.js");
    return openFirebaseStore(firebaseConfig, role);
  }
  return openLocalStore(role);
}

// 학생이 보낸 값을 정리해요 (길이 제한, 종류 확인). 두 방식이 함께 써요.
export function cleanRequestInput({ type, detail = "", message = "", studentName = "", urgent = false }) {
  if (!TYPES.some((t) => t.id === type)) throw new Error("알 수 없는 요청 종류예요.");
  return {
    type,
    detail: String(detail).trim().slice(0, LIMITS.detail),
    message: String(message).trim().slice(0, LIMITS.message),
    studentName: String(studentName).trim().slice(0, LIMITS.name),
    urgent: Boolean(urgent),
    code: makeCode(),
  };
}

// 선생님 화면을 시험해 볼 샘플 요청들
export const SAMPLE_REQUESTS = [
  { type: "study", detail: "푸는 방법을 모르겠어요", message: "수학 익힘책 42쪽 3번이요", studentName: "3번", minutesAgo: 2, status: "sent", read: false },
  { type: "health", detail: "배가 아파요", message: "", studentName: "11번", minutesAgo: 6, status: "sent", read: false, urgent: true },
  { type: "supplies", detail: "가위·풀", message: "풀을 안 가져왔어요", studentName: "7번", minutesAgo: 14, status: "checking", read: true },
  { type: "friend", detail: "속상한 일이 있어요", message: "쉬는 시간에 있었던 일을 이야기하고 싶어요", studentName: "15번", minutesAgo: 25, status: "progress", read: true },
  { type: "teacher", detail: "검사를 받고 싶어요", message: "", studentName: "2번", minutesAgo: 40, status: "done", read: true },
  { type: "etc", detail: "기기가 안 돼요", message: "태블릿 소리가 안 나요", studentName: "20번", minutesAgo: 75, status: "done", read: true },
];

const TEST_MESSAGES = [
  { type: "teacher", detail: "질문이 있어요", message: "" },
  { type: "study", detail: "다시 설명해 주세요", message: "분수 나눗셈이 헷갈려요" },
  { type: "supplies", detail: "연필·지우개", message: "" },
  { type: "health", detail: "머리가 아파요", message: "", urgent: true },
  { type: "etc", detail: "물을 마시고 싶어요", message: "" },
];
export function randomTestRequest() {
  const pick = TEST_MESSAGES[Math.floor(Math.random() * TEST_MESSAGES.length)];
  return { ...pick, studentName: `${1 + Math.floor(Math.random() * 25)}번 (테스트)` };
}

// ─────────────────────────────────────────────────────────────
//  로컬 테스트 모드
// ─────────────────────────────────────────────────────────────
const KEY = "helpme.requests.v1";
const UID_KEY = "helpme.studentUid";
const PIN_KEY = "helpme.adminPinHash";
const SESSION_KEY = "helpme.adminSession";

function openLocalStore(role) {
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("helpme") : null;
  const listeners = new Set();

  const readAll = () => {
    try { return JSON.parse(safeStorage.get(KEY, "[]")) || []; } catch { return []; }
  };
  const writeAll = (list) => {
    safeStorage.set(KEY, JSON.stringify(list));
    notify();
    channel?.postMessage("changed");  // 다른 탭에 알려요
  };
  const notify = () => listeners.forEach((fn) => fn());
  // 다른 탭에서 바뀌면 storage 이벤트(또는 BroadcastChannel)로 알 수 있어요
  addEventListener("storage", (e) => { if (e.key === KEY) notify(); });
  channel?.addEventListener("message", notify);

  const watch = (filter, cb) => {
    const run = () => cb(readAll().filter(filter).sort((a, b) => b.createdAt - a.createdAt));
    listeners.add(run);
    run();
    return () => listeners.delete(run);
  };

  const add = (fields) => {
    const now = Date.now();
    const item = {
      id: `local-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      status: "sent", read: false, readAt: null, doneAt: null,
      createdAt: now, updatedAt: now, ...fields,
    };
    writeAll([item, ...readAll()]);
    return item;
  };

  let session = (() => { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } })();
  const authListeners = new Set();
  const authState = () => (session ? { state: "admin", email: "로컬 테스트 선생님" } : { state: "signedOut" });
  const setSession = (on) => {
    session = on;
    try { on ? sessionStorage.setItem(SESSION_KEY, "1") : sessionStorage.removeItem(SESSION_KEY); } catch { /* 무시 */ }
    authListeners.forEach((fn) => fn(authState()));
  };

  return {
    mode: "local",
    role,

    // ── 학생 ──
    async ensureStudent() {
      let uid = safeStorage.get(UID_KEY);
      if (!uid) {
        uid = `device-${makeCode()}${makeCode()}`;
        safeStorage.set(UID_KEY, uid);
      }
      return uid;
    },
    async addRequest(input) {
      const uid = await this.ensureStudent();
      const item = add({ ...cleanRequestInput(input), studentUid: uid });
      return { id: item.id, code: item.code };
    },
    watchMine(cb) {
      const uid = safeStorage.get(UID_KEY);
      return watch((r) => r.studentUid === uid, cb);
    },
    // 다른 학생이 이 기기를 쓸 때: 새 학생 id를 받아요 (전 학생의 요청은 더 이상 안 보여요)
    async newStudentIdentity() {
      safeStorage.remove(UID_KEY);
      await this.ensureStudent();
      notify();
    },

    // ── 선생님 ──
    // 로컬 모드에는 서버가 없어서, 처음 쓸 때 정한 비밀번호(PIN)로 화면만 잠가요.
    // PIN은 이 브라우저에 암호화(해시)해서만 저장하고, 파일(GitHub)에는 남지 않아요.
    localNeedsPinSetup() {
      return !safeStorage.get(PIN_KEY);
    },
    onAdminAuth(cb) {
      authListeners.add(cb);
      cb(authState());
      return () => authListeners.delete(cb);
    },
    async adminSignIn(_email, pin) {
      if (!pin || String(pin).length < 4) throw new Error("비밀번호를 4자 이상 입력해 주세요.");
      const hash = await sha256(`helpme:${pin}`);
      const saved = safeStorage.get(PIN_KEY);
      if (!saved) safeStorage.set(PIN_KEY, hash);
      else if (saved !== hash) throw new Error("비밀번호가 맞지 않아요.");
      setSession(true);
    },
    async adminSignOut() { setSession(false); },
    async resetPassword() {
      throw new Error("로컬 테스트 모드에서는 브라우저 저장소를 지우면 비밀번호도 지워져요.");
    },
    watchAll(cb) {
      return watch(() => true, cb);
    },
    async updateRequest(id, patch) {
      const now = Date.now();
      writeAll(readAll().map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch, updatedAt: now };
        if (patch.read && !r.readAt) next.readAt = now;
        if (patch.status === "done" && !r.doneAt) next.doneAt = now;
        return next;
      }));
    },
    async deleteRequest(id) {
      writeAll(readAll().filter((r) => r.id !== id));
    },
    async addSamples() {
      const now = Date.now();
      const items = SAMPLE_REQUESTS.map(({ minutesAgo, status, read, ...rest }, i) => {
        const at = now - minutesAgo * 60000;
        return {
          ...cleanRequestInput(rest),
          id: `sample-${now.toString(36)}-${i}`,
          studentUid: "sample",
          sample: true,  // 샘플은 새 요청 알림을 울리지 않아요
          status, read,
          createdAt: at, updatedAt: at,
          readAt: read ? at + 60000 : null,
          doneAt: status === "done" ? at + 120000 : null,
        };
      });
      writeAll([...items, ...readAll()]);
    },
    async addTestRequest() {
      add({ ...cleanRequestInput(randomTestRequest()), studentUid: "sample" });
    },
  };
}

async function sha256(text) {
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // https가 아닌 주소에서는 crypto.subtle이 없어요. 시험용이라 간단한 해시로 대신해요.
  let h = 0;
  for (const ch of text) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return `weak-${h}`;
}
