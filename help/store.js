// 요청 데이터를 저장하고 읽는 곳이에요. 학생 화면과 선생님 화면은 이 파일만 써요.
//
// 세 가지 방식이 같은 모양(같은 함수 이름)으로 움직여요.
//  · 방 번호 모드 (기본): 선생님 화면이 방을 열고, 학생 기기가 숫자 4개로 들어와요. (net.js)
//      요청은 선생님 기기(localStorage)에만 저장돼요. 선생님 화면이 켜져 있을 때 쓸 수 있어요.
//  · Firebase 모드: firebase-config.js를 채우면 켜져요. Firestore에 저장해요. (firebase.js)
//  · 한 브라우저 시험 모드: 주소 뒤에 ?local=1. 같은 브라우저의 다른 탭끼리만 전달돼요.
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
import * as Net from "./net.js";

const forceLocal = new URLSearchParams(location.search).has("local");
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export async function openStore(role) {
  if (isFirebaseConfigured && !forceLocal) {
    const { openFirebaseStore } = await import("./firebase.js");
    return openFirebaseStore(firebaseConfig, role);
  }
  if (forceLocal) return openLocalStore(role);
  return role === "admin" ? openRoomHostStore() : openRoomStudentStore();
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
  const authState = () => (session ? { state: "admin", email: "이 기기 선생님" } : { state: "signedOut" });
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
      throw new Error("이 기기 비밀번호를 잊었으면 브라우저의 사이트 데이터를 지운 뒤 새로 정해 주세요. (요청 기록도 함께 지워져요)");
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
    // 방 번호 모드가 함께 써요
    _readAll: readAll,
    _add: add,
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

// ─────────────────────────────────────────────────────────────
//  방 번호 모드 — 선생님 쪽
//  요청 목록은 선생님 기기에 저장하고(로컬 모드와 같아요), 학생 기기와는 방으로 주고받아요.
//  학생에게는 그 학생(기기)의 요청만 보내 줘요.
// ─────────────────────────────────────────────────────────────
const ROOM_KEY = "helpme.room";

function openRoomHostStore() {
  const base = openLocalStore("admin");
  const conns = new Map();   // 연결 → 학생 기기 id
  const roomListeners = new Set();
  let room = { code: safeStorage.get(ROOM_KEY) || Net.newCode(), state: "off", error: "", students: 0 };
  let handle = null;

  const setRoom = (patch) => {
    room = { ...room, ...patch };
    roomListeners.forEach((fn) => fn(room));
  };
  const countStudents = () => new Set([...conns.values()].filter(Boolean)).size;
  const mineOf = (uid) => base._readAll().filter((r) => r.studentUid === uid);
  const sendMine = (conn, uid) => conn.send({ t: "mine", list: mineOf(uid) });

  // 요청이 바뀔 때마다(선생님이 상태를 바꾸는 등) 연결된 학생에게 자기 요청을 다시 보내요
  base.watchAll(() => conns.forEach((uid, conn) => uid && sendMine(conn, uid)));

  const onConn = (conn) => {
    conns.set(conn, null);
    conn.onmessage = (m) => {
      if (!m || typeof m !== "object") return;
      if (m.t === "hello" && typeof m.uid === "string" && m.uid.length >= 8) {
        conns.set(conn, m.uid.slice(0, 60));
        setRoom({ students: countStudents() });
        sendMine(conn, conns.get(conn));
      } else if (m.t === "add") {
        const uid = conns.get(conn);
        if (!uid) return;
        try {
          const item = base._add({ ...cleanRequestInput(m.req || {}), studentUid: uid });
          conn.send({ t: "added", rid: m.rid, id: item.id, code: item.code });
        } catch (err) {
          conn.send({ t: "added", rid: m.rid, error: err.message });
        }
      }
    };
    conn.onclose = () => {
      conns.delete(conn);
      setRoom({ students: countStudents() });
    };
  };

  const errorText = (type) => (type === "nolib"
    ? "연결 도구를 불러오지 못했어요. 인터넷을 확인하고 새로 고쳐 주세요."
    : `연결 서버(PeerJS)에 닿지 않아요. 인터넷을 확인해 주세요. 학교 와이파이에서 막혀 있을 수 있어요. (${type})`);

  function open(code = room.code) {
    handle?.close();
    conns.forEach((_, c) => c.close());
    conns.clear();
    setRoom({ code, state: "opening", error: "", students: 0 });
    handle = Net.host(code, {
      onReady: (realCode) => {
        safeStorage.set(ROOM_KEY, realCode);
        setRoom({ code: realCode, state: "open", error: "" });
      },
      onConn,
      onError: (type) => setRoom({ state: "error", error: errorText(type) }),
    });
  }

  return {
    ...base,
    mode: "room",
    // 방 열기·닫기 (선생님이 로그인하면 열고, 로그아웃하면 닫아요)
    openRoom: () => open(),
    closeRoom: () => { handle?.close(); handle = null; conns.clear(); setRoom({ state: "off", students: 0 }); },
    newRoomCode: () => open(Net.newCode()),
    onRoom(cb) { roomListeners.add(cb); cb(room); return () => roomListeners.delete(cb); },
    studentLink(code = room.code) {
      const url = new URL("./", location.href);
      url.searchParams.set("room", code);
      if (Net.isLocalNet) url.searchParams.set("net", "local");
      return url.href;
    },
  };
}

// ─────────────────────────────────────────────────────────────
//  방 번호 모드 — 학생 쪽
// ─────────────────────────────────────────────────────────────
const JOIN_KEY = "helpme.joinRoom";
const MINE_KEY = "helpme.mine";

function openRoomStudentStore() {
  const params = new URLSearchParams(location.search);
  let roomCode = /^\d{4}$/.test(params.get("room") || "") ? params.get("room") : safeStorage.get(JOIN_KEY, "");
  if (roomCode) safeStorage.set(JOIN_KEY, roomCode);
  let mine = (() => { try { return JSON.parse(safeStorage.get(MINE_KEY, "[]")) || []; } catch { return []; } })();
  let conn = null;
  let handle = null;
  let status = { state: roomCode ? "connecting" : "noroom", room: roomCode, error: "" };
  const mineListeners = new Set();
  const statusListeners = new Set();
  const waiting = new Map();   // 보낸 요청의 답을 기다려요

  const uid = () => {
    let id = safeStorage.get(UID_KEY);
    if (!id) { id = `device-${makeCode()}${makeCode()}`; safeStorage.set(UID_KEY, id); }
    return id;
  };
  const setStatus = (patch) => {
    status = { ...status, ...patch };
    statusListeners.forEach((fn) => fn(status));
  };
  const setMine = (list) => {
    mine = Array.isArray(list) ? list.slice().sort((a, b) => b.createdAt - a.createdAt) : [];
    safeStorage.set(MINE_KEY, JSON.stringify(mine));
    mineListeners.forEach((fn) => fn(mine));
  };

  function connect() {
    handle?.close();
    conn = null;
    if (!roomCode) { setStatus({ state: "noroom", room: "" }); return; }
    setStatus({ state: "connecting", room: roomCode, error: "" });
    handle = Net.join(roomCode, {
      onOpen: (c) => {
        conn = c;
        c.onmessage = (m) => {
          if (!m || typeof m !== "object") return;
          if (m.t === "mine") setMine(m.list);
          else if (m.t === "added" && waiting.has(m.rid)) {
            const { resolve, reject, timer } = waiting.get(m.rid);
            clearTimeout(timer);
            waiting.delete(m.rid);
            m.error ? reject(new Error(m.error)) : resolve({ id: m.id, code: m.code });
          }
        };
        c.send({ t: "hello", uid: uid() });
        setStatus({ state: "online", error: "" });
      },
      onClose: () => { conn = null; setStatus({ state: "offline" }); },
      onError: (type) => {
        conn = null;
        setStatus({
          state: type === "peer-unavailable" ? "notfound" : "offline",
          error: type === "nolib" ? "연결 도구를 불러오지 못했어요." : "",
        });
      },
    });
  }

  return {
    mode: "room",
    role: "student",
    async ensureStudent() { connect(); return uid(); },
    async addRequest(input) {
      if (!conn) throw new Error("선생님 화면과 연결되어 있지 않아요. 선생님께 화면을 켜 달라고 해 주세요.");
      const req = cleanRequestInput(input);
      const rid = makeCode();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          waiting.delete(rid);
          reject(new Error("선생님 화면에서 답이 없어요. 잠시 뒤에 다시 보내 주세요."));
        }, 8000);
        waiting.set(rid, { resolve, reject, timer });
        conn.send({ t: "add", rid, req });
      });
    },
    watchMine(cb) {
      mineListeners.add(cb);
      cb(mine);
      return () => mineListeners.delete(cb);
    },
    async newStudentIdentity() {
      safeStorage.remove(UID_KEY);
      setMine([]);
      if (conn) conn.send({ t: "hello", uid: uid() });
    },
    // 방 번호
    onStatus(cb) { statusListeners.add(cb); cb(status); return () => statusListeners.delete(cb); },
    setRoom(code) {
      roomCode = code;
      safeStorage.set(JOIN_KEY, code);
      setMine([]);   // 다른 반(방)의 요청 기록은 보이지 않게
      connect();
    },
    get room() { return roomCode; },
  };
}
