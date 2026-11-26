# 🙋 저요! 저요! 도와주세요

> 아이들은 쉽고 편하게, 선생님은 빠르고 효율적으로!

초등학교 1~6학년 학생이 도움이 필요할 때 선생님께 바로 알리는 학급 도움 요청 웹앱이에요.

- 학생 화면: `https://ebuzi67.github.io/class-quiz/help/`
- 선생님 화면: `https://ebuzi67.github.io/class-quiz/help/admin.html`

휴대폰·태블릿에서 열고 "홈 화면에 추가"(앱 설치)를 하면 앱처럼 쓸 수 있어요.

---

## 1. 두 가지 모드

| | 로컬 테스트 모드 | Firebase 모드 |
|---|---|---|
| 언제 | `firebase-config.js`가 **비어 있을 때** (지금 상태) | `firebase-config.js`를 **채웠을 때** |
| 데이터 저장 | 이 브라우저(localStorage) | Firebase Firestore (인터넷) |
| 기기 연결 | 같은 브라우저의 **다른 탭끼리만** | **여러 기기**가 실시간으로 연결 |
| 선생님 로그인 | 처음 정한 비밀번호(이 브라우저에만 저장) | Firebase 이메일·비밀번호 로그인 |
| 쓰임 | 화면과 기능 미리 시험해 보기 | 실제 교실 수업 |

> localStorage는 같은 브라우저 안에서만 공유돼요. 학생 태블릿과 선생님 PC를 연결하려면 꼭 Firebase 모드로 바꿔야 해요.

### 로컬 테스트 모드로 시험해 보기

1. 한 컴퓨터에서 탭 두 개를 열어요. 한쪽은 학생 화면, 다른 쪽은 선생님 화면(`admin.html`).
2. 선생님 화면에서 처음 쓸 비밀번호(4자 이상)를 정해요.
3. ⚙️ 메뉴 → **📦 샘플 데이터 넣기**로 예시 요청 6개를 넣어 봐요.
4. 학생 탭에서 카드를 눌러 요청을 보내면 선생님 탭에 알림(토스트·배지·알림음)이 바로 와요.
5. ⚙️ → **🧪 테스트 요청 받아 보기**를 누르고 3초 안에 다른 창을 보면 브라우저 알림도 시험할 수 있어요.

주소 끝에 `?local=1`을 붙이면 Firebase 설정이 있어도 로컬 테스트 모드로 열려요.

---

## 2. Firebase 연결하기 (처음 한 번만)

Firebase 무료 요금제(Spark)로 충분해요. 아래 값들은 **제가 대신 만들 수 없어요.** 선생님 계정으로 직접 만들고 복사해 주세요.

### 1단계. Firebase 프로젝트 만들기
1. <https://console.firebase.google.com> 에 구글 계정으로 들어가요.
2. **프로젝트 추가** → 이름(예: `jeoyo-help`) → Google 애널리틱스는 꺼도 돼요 → **프로젝트 만들기**.

### 2단계. 로그인 방법 켜기 (Authentication)
1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**.
2. **로그인 방법** 탭에서 두 가지를 켜요.
   - **익명** → 사용 설정 → 저장 (학생용. 이름·이메일 없이 기기마다 보이지 않는 번호를 받아요)
   - **이메일/비밀번호** → 사용 설정 → 저장 (선생님용)
3. **사용자** 탭 → **사용자 추가** → 선생님 이메일과 비밀번호를 적어요.
   - 이 비밀번호는 Firebase에만 저장돼요. **어떤 파일에도 적지 마세요.**
4. **설정** 탭 → **승인된 도메인** → **도메인 추가** → `ebuzi67.github.io` 를 넣어요.

### 3단계. Firestore 데이터베이스 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 위치는 **asia-northeast3 (서울)** 을 골라요. (나중에 못 바꿔요)
3. **프로덕션 모드**로 시작해요.
4. **규칙** 탭을 열고, 이 폴더의 [`firestore.rules`](firestore.rules) 내용을 **통째로 복사해 붙여 넣은 뒤 게시**를 눌러요.

### 4단계. 웹 앱 등록하고 설정값 붙여 넣기
1. 프로젝트 개요 옆 ⚙️ → **프로젝트 설정** → 아래쪽 **내 앱** → 웹 아이콘(`</>`)을 눌러요.
2. 앱 이름(예: `저요저요`)을 적고 **앱 등록**. (Firebase 호스팅은 체크하지 않아요. GitHub Pages를 써요)
3. 화면에 나온 `firebaseConfig = { ... }` 안의 값 6개를 [`firebase-config.js`](firebase-config.js)의 빈칸 `""` 안에 그대로 붙여 넣어요.

```js
export const firebaseConfig = {
  apiKey: "여기에 apiKey",
  authDomain: "프로젝트ID.firebaseapp.com",
  projectId: "프로젝트ID",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…",
};
```

4. 저장하고 GitHub에 올려요(커밋·푸시). 1~2분 뒤 GitHub Pages에 반영돼요.

### 5단계. 선생님을 관리자로 등록하기
1. 선생님 화면(`admin.html`)에서 3단계에서 만든 이메일·비밀번호로 로그인해요.
2. "아직 관리자로 등록되지 않았어요"라는 노란 상자와 함께 **긴 글자(UID)** 가 나와요. 복사해요.
3. Firebase 콘솔 → **Firestore Database → 데이터** → **컬렉션 시작**
   - 컬렉션 ID: `admins`
   - 문서 ID: 방금 복사한 **UID**
   - 필드: `role` (string) = `teacher` → 저장
4. 선생님 화면을 새로 고치면 대시보드가 열려요. 🎉

### 6단계. 확인하기
- 휴대폰(학생 화면)에서 요청을 보내면 → PC(선생님 화면)에 바로 알림이 오는지
- 선생님이 상태를 "처리 중", "해결 완료"로 바꾸면 → 학생 화면에도 바로 바뀌는지
- 다른 휴대폰에서는 앞 학생의 요청이 **보이지 않는지**

### (선택) 7단계. API 키 사용처 묶어 두기
Google Cloud 콘솔(<https://console.cloud.google.com/apis/credentials>) → 같은 프로젝트 → **Browser key** → **애플리케이션 제한사항: 웹사이트** → `https://ebuzi67.github.io/*` 와 `http://localhost:*/*` 를 추가하면 다른 사이트에서 이 키를 쓸 수 없어요.

---

## 3. 비밀번호와 비밀키 관리

| 값 | GitHub에 올려도 되나요? | 이유 |
|---|---|---|
| `firebase-config.js`의 `apiKey`, `projectId` 등 | ✅ 괜찮아요 | 웹 앱에서는 원래 누구나 볼 수 있는 "주소" 같은 값이에요. 데이터는 보안 규칙과 로그인이 지켜요. |
| 선생님 비밀번호 | ❌ 절대 안 돼요 | Firebase Authentication에만 있어요. |
| 서비스 계정 키(`…-firebase-adminsdk-….json`) | ❌ 절대 안 돼요 | 모든 데이터를 마음대로 바꿀 수 있는 열쇠예요. 이 앱에는 필요 없어요. 저장소 맨 위 `.gitignore`가 실수로 올라가지 않게 막아요. |

---

## 4. 보안과 개인정보 보호

- **학생은 자기 요청만** 봐요. 기기마다 익명 로그인 번호(uid)를 받고, 요청에 그 번호를 같이 저장해요. 보안 규칙이 "자기 번호의 요청만 읽기"를 지켜요. 다른 학생이 주소를 알아도 남의 요청을 읽을 수 없어요.
- **선생님만 전체 요청**을 봐요. 이메일 로그인 + `admins` 명단에 있는 계정만 읽기·상태 바꾸기·지우기를 할 수 있어요.
- 학생은 요청을 **만들기만** 할 수 있어요. 상태를 바꾸거나 지울 수 없고, 글자 수·종류도 규칙이 검사해요.
- **친구 문제·몸 상태**는 🔒 표시가 붙고, 학생 화면에 "선생님만 볼 수 있어요"라고 알려 줘요.
- 학생 정보는 **이름 또는 번호 한 칸**만 받아요. (출석번호만 적어도 돼요)
- 브라우저 알림과 토스트에는 **학생 이름과 내용을 적지 않아요.** 요청 종류만 보여 줘요.
- 선생님 화면을 전자칠판에 띄울 때는 ⚙️ → **🙈 화면 가리기**를 켜면 이름과 내용이 흐려져요.
- 여러 학생이 한 기기를 같이 쓰면 학생 화면 위쪽의 **"바꾸기"** 를 눌러요. 새 익명 번호를 받아서 앞 학생의 요청이 보이지 않아요.

---

## 5. 실시간 알림

| 기능 | 설명 |
|---|---|
| 알림 배지 | 오른쪽 위 📥에 미확인 요청 수. 창 제목에도 `(3)`처럼 보여요 |
| 토스트 | "새로운 도움 요청이 도착했어요! 학생의 도움 요청을 확인해 주세요." 누르면 그 요청이 열려요 |
| 목록 | 새 요청은 맨 위 "🔵 새로운 요청"에 도착 시간과 함께 나와요. 급한 요청은 빨간 띠 |
| 알림음 | 작고 부드러운 "띵-동". 🔔 버튼으로 켜고 끄기. 브라우저가 소리를 막으면 "알림음 켜기" 띠가 나와요 (자동 재생 제한 때문에 화면을 한 번 눌러야 해요) |
| 브라우저 알림 | ⚙️ → 브라우저 알림 켜기 → 허용. 다른 창을 보고 있을 때 알려 주고, 누르면 그 요청이 열려요. 허용하지 않아도 화면 안 알림은 그대로 돼요 |
| 읽음 표시 | 요청을 열면 자동으로 "확인 완료(선생님 확인 중)". 미확인 = 파란 배지, 확인 완료 = 회색, 해결 완료 = 초록 |

> 브라우저 알림은 **선생님 화면이 열려 있을 때**(다른 탭이나 최소화여도) 와요. 창을 완전히 닫아도 오게 하려면 아래 "더 나아가기"를 보세요.

---

## 6. 데이터 구조 (Firestore)

```
requests/{자동 id}          도움 요청 한 개
  code        "K7Q2M"        화면에 보여 주는 요청 번호
  type        "study"        teacher | study | supplies | friend | health | etc
  detail      "다시 설명해 주세요"   고른 세부 항목
  message     "분수 나눗셈이 헷갈려요"  학생이 적은 내용 (300자까지)
  urgent      false          급해요
  studentName "12번"         이름 또는 번호 (선생님만 봐요)
  studentUid  "abc…"         보낸 기기의 익명 로그인 번호
  status      "sent"         sent 요청 완료 → checking 선생님 확인 중 → progress 처리 중 → done 해결 완료
  read        false          선생님이 열어 봤는지
  createdAt / updatedAt / readAt / doneAt   시간 (서버 시간)

admins/{선생님 uid}          관리자 명단 (콘솔에서만 만들어요)
  role        "teacher"
```

여러 반에서 함께 쓰려면 `classes/{반}/requests/…`처럼 반을 한 단계 더 두고, `admins` 문서에 담당 반을 적어 규칙에서 검사하면 돼요.

---

## 7. 파일 구성

```
help/
├─ index.html          학생 화면 (메인 카드 → 상세 요청 → 완료 → 내 요청 확인)
├─ admin.html          선생님 관리자 화면
├─ style.css           디자인 시스템 (색·카드·버튼·반응형)
├─ script.js           학생 화면 동작
├─ admin.js            선생님 화면 동작 (필터, 상태 변경, 알림음, 브라우저 알림)
├─ common.js           요청 종류·상태 목록, 시간 표시 등 공통 도구
├─ store.js            데이터 저장소: 로컬 테스트 모드 + Firebase 모드 고르기
├─ firebase.js         Firebase(Firestore·Authentication) 연동 모듈
├─ firebase-config.js  ← Firebase 설정값을 넣는 곳
├─ firestore.rules     Firestore 보안 규칙 (콘솔에 붙여 넣어요)
├─ firebase.json       Firebase CLI로 규칙을 올릴 때 쓰는 설정 (선택)
├─ sw.js               오프라인 지원, 브라우저 알림 클릭, 나중의 푸시 알림 자리
├─ manifest.json       앱 설치 정보
└─ icons/              앱 아이콘 (tools/help/make_icons.py로 만들어요)
```

요청 종류나 세부 항목을 바꾸려면 `common.js`의 `TYPES`를 고쳐요. 종류 `id`를 새로 더하면 `firestore.rules`의 `d.type in [...]` 목록에도 더해요.

내 컴퓨터에서 열어 볼 때는 파일을 더블클릭하지 말고 간단한 서버로 열어요 (모듈 방식이라 `file://`에서는 안 돼요).

```bash
# class-quiz 폴더의 한 단계 위에서
python3 -m http.server 8000
# → http://localhost:8000/class-quiz/help/
```

---

## 8. 더 나아가기: 백그라운드 푸시 알림 (FCM)

지금은 선생님 화면이 열려 있어야 알림이 와요. 창을 닫아도 휴대폰·PC로 알림을 받으려면 Firebase Cloud Messaging(FCM)을 붙여요. **Blaze(종량제) 요금제**가 필요해요(교실 규모면 보통 무료 범위 안이에요).

1. 프로젝트 설정 → **클라우드 메시징** → 웹 푸시 인증서 → **키 쌍 생성** (VAPID 키, 공개용이라 코드에 넣어도 돼요)
2. 선생님 화면에서 `firebase-messaging.js`의 `getToken(messaging, { vapidKey, serviceWorkerRegistration })`으로 토큰을 받아 `admins/{uid}`의 `fcmTokens` 배열에 저장 (규칙에서 본인 문서의 이 필드만 쓰게 열어 줘요)
3. Cloud Functions로 새 요청이 생길 때 푸시를 보내요:

```js
// functions/index.js (firebase init functions 로 만든 폴더)
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
initializeApp();

exports.notifyTeacher = onDocumentCreated(
  { document: "requests/{id}", region: "asia-northeast3" },
  async (event) => {
    const r = event.data.data();
    if (r.sample) return;
    const admins = await getFirestore().collection("admins").get();
    const tokens = admins.docs.flatMap((d) => d.get("fcmTokens") || []);
    if (!tokens.length) return;
    await getMessaging().sendEachForMulticast({
      tokens,
      // 개인정보 보호: 이름과 내용은 보내지 않아요
      notification: { title: "새로운 도움 요청이 도착했어요!", body: "학생의 도움 요청을 확인해 주세요." },
      data: { id: event.params.id },
    });
  });
```

4. 푸시는 이미 `sw.js`의 `push` 이벤트가 받아서 알림으로 보여 주고, 누르면 그 요청을 열도록 준비돼 있어요.

---

## 9. 알아 두면 좋은 점

- 학생 기기의 브라우저 데이터를 지우면 새 익명 번호를 받아서, 전에 보낸 요청이 학생 화면에서 안 보여요. (선생님 화면에는 그대로 있어요)
- 요청은 쌓이기만 하니 가끔 ⚙️ → **🧹 해결된 요청 모두 지우기**로 정리해요.
- 선생님 화면은 최근 요청 300개까지 보여 줘요.
- Firebase 프로그램은 인터넷(`www.gstatic.com`)에서 받아요. 인터넷이 끊기면 화면은 열리지만 요청은 보낼 수 없어요.
