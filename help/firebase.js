// Firebase 모드: Firestore(데이터베이스) + Authentication(로그인)으로 여러 기기를 연결해요.
// store.js가 firebase-config.js에 설정값이 있을 때만 이 파일을 불러와요.
//
//  · 학생: "익명 로그인"으로 기기마다 보이지 않는 학생 id(uid)를 받아요. 이름·이메일은 필요 없어요.
//          요청에 이 uid를 같이 저장하고, 보안 규칙이 "자기 uid의 요청만 읽기"를 지켜 줘요.
//  · 선생님: 이메일·비밀번호로 로그인해요. Firestore의 admins/{선생님 uid} 문서가 있어야 관리자예요.
//
// Firebase 프로그램은 인터넷(gstatic.com)에서 받아요. 버전을 바꿀 때는 아래 세 줄을 함께 바꿔요.
const V = "10.14.1";
const SDK = `https://www.gstatic.com/firebasejs/${V}`;

import { cleanRequestInput, SAMPLE_REQUESTS, randomTestRequest } from "./store.js";

export async function openFirebaseStore(config, role) {
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const { initializeApp } = appMod;
  const {
    getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword,
    signOut, sendPasswordResetEmail,
  } = authMod;
  const {
    getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
    query, where, orderBy, limit, serverTimestamp, writeBatch, Timestamp,
  } = fsMod;

  // 학생 화면과 선생님 화면의 로그인이 섞이지 않게 앱 이름을 따로 써요.
  // (같은 브라우저에서 두 화면을 열어도 학생은 익명, 선생님은 이메일 로그인으로 따로 있어요)
  const app = initializeApp(config, role === "admin" ? "helpme-admin" : "helpme-student");
  const auth = getAuth(app);
  const db = getFirestore(app);
  const requestsCol = collection(db, "requests");

  // 첫 로그인 상태를 알 때까지 기다려요
  const firstUser = new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => { stop(); resolve(user); });
  });

  const toMillis = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : v ?? null);
  const fromDoc = (snap) => {
    // 방금 보낸 요청은 서버 시간이 아직 없어서 "예상 시간"으로 보여 줘요
    const d = snap.data({ serverTimestamps: "estimate" });
    return {
      id: snap.id, ...d,
      createdAt: toMillis(d.createdAt) || Date.now(),
      updatedAt: toMillis(d.updatedAt),
      readAt: toMillis(d.readAt),
      doneAt: toMillis(d.doneAt),
    };
  };
  const listen = (q, cb, onError) => onSnapshot(
    q,
    (snap) => cb(snap.docs.map(fromDoc).sort((a, b) => b.createdAt - a.createdAt)),
    (err) => onError?.(friendlyError(err)),
  );

  return {
    mode: "firebase",
    role,

    // ── 학생 ──
    async ensureStudent() {
      const user = auth.currentUser || (await firstUser);
      if (user) return user.uid;
      try {
        return (await signInAnonymously(auth)).user.uid;
      } catch (err) {
        throw friendlyError(err);
      }
    },
    async addRequest(input) {
      const uid = await this.ensureStudent();
      const fields = cleanRequestInput(input);
      try {
        const ref = await addDoc(requestsCol, {
          ...fields,
          studentUid: uid,
          status: "sent",
          read: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { id: ref.id, code: fields.code };
      } catch (err) {
        throw friendlyError(err);
      }
    },
    watchMine(cb, onError) {
      const uid = auth.currentUser?.uid;
      if (!uid) { cb([]); return () => {}; }
      // where 조건이 있어야 보안 규칙("자기 요청만")을 통과해요
      return listen(query(requestsCol, where("studentUid", "==", uid)), cb, onError);
    },
    async newStudentIdentity() {
      await signOut(auth);
      await signInAnonymously(auth);
    },

    // ── 선생님 ──
    localNeedsPinSetup() { return false; },
    onAdminAuth(cb) {
      return onAuthStateChanged(auth, async (user) => {
        if (!user || user.isAnonymous) return cb({ state: "signedOut" });
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          cb(adminDoc.exists()
            ? { state: "admin", uid: user.uid, email: user.email }
            : { state: "notAdmin", uid: user.uid, email: user.email });
        } catch {
          cb({ state: "notAdmin", uid: user.uid, email: user.email });
        }
      });
    },
    async adminSignIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        throw friendlyError(err);
      }
    },
    async adminSignOut() { await signOut(auth); },
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        throw friendlyError(err);
      }
    },
    watchAll(cb, onError) {
      return listen(query(requestsCol, orderBy("createdAt", "desc"), limit(300)), cb, onError);
    },
    // current: 지금 화면에 있는 요청 (처음 읽은 시간·해결 시간을 한 번만 적으려고 받아요)
    async updateRequest(id, patch, current = {}) {
      const data = { ...patch, updatedAt: serverTimestamp() };
      if (patch.read && !current.readAt) data.readAt = serverTimestamp();
      if (patch.status === "done" && !current.doneAt) data.doneAt = serverTimestamp();
      try {
        await updateDoc(doc(db, "requests", id), data);
      } catch (err) {
        throw friendlyError(err);
      }
    },
    async deleteRequest(id) {
      try {
        await deleteDoc(doc(db, "requests", id));
      } catch (err) {
        throw friendlyError(err);
      }
    },
    async addSamples() {
      const batch = writeBatch(db);
      const now = Date.now();
      for (const { minutesAgo, status, read, ...rest } of SAMPLE_REQUESTS) {
        const at = now - minutesAgo * 60000;
        batch.set(doc(requestsCol), {
          ...cleanRequestInput(rest),
          studentUid: "sample",
          sample: true,  // 샘플은 새 요청 알림을 울리지 않아요
          status, read,
          createdAt: Timestamp.fromMillis(at),
          updatedAt: Timestamp.fromMillis(at),
          ...(read ? { readAt: Timestamp.fromMillis(at + 60000) } : {}),
          ...(status === "done" ? { doneAt: Timestamp.fromMillis(at + 120000) } : {}),
        });
      }
      try {
        await batch.commit();
      } catch (err) {
        throw friendlyError(err);
      }
    },
    async addTestRequest() {
      try {
        await addDoc(requestsCol, {
          ...cleanRequestInput(randomTestRequest()),
          studentUid: "sample",
          status: "sent",
          read: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        throw friendlyError(err);
      }
    },
  };
}

// Firebase 오류를 알아듣기 쉬운 말로 바꿔요
function friendlyError(err) {
  const code = err?.code || "";
  const messages = {
    "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/wrong-password": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/user-not-found": "이메일 또는 비밀번호가 맞지 않아요.",
    "auth/invalid-email": "이메일 주소 형식이 맞지 않아요.",
    "auth/too-many-requests": "여러 번 틀려서 잠시 막혔어요. 조금 뒤에 다시 해 주세요.",
    "auth/network-request-failed": "인터넷 연결을 확인해 주세요.",
    "auth/operation-not-allowed": "Firebase에서 로그인 방법(익명 또는 이메일/비밀번호)이 켜져 있지 않아요. README의 2단계를 확인해 주세요.",
    "auth/admin-restricted-operation": "Firebase에서 익명 로그인이 꺼져 있어요. README의 2단계를 확인해 주세요.",
    "auth/unauthorized-domain": "이 주소가 Firebase 승인된 도메인에 없어요. README의 2단계를 확인해 주세요.",
    "permission-denied": "권한이 없어요. 보안 규칙(firestore.rules)과 관리자 등록을 확인해 주세요.",
    "unavailable": "인터넷 연결을 확인해 주세요.",
  };
  const e = new Error(messages[code] || `문제가 생겼어요. (${code || err?.message || "알 수 없음"})`);
  e.code = code;
  return e;
}
