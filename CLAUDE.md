# class-quiz 작업 규칙

GitHub Pages로 `https://ebuzi67.github.io/class-quiz/`에 올라가는 학습 앱 모음이에요. 앱마다 휴대폰·태블릿에 따로 설치(PWA)돼요. 사용자는 코딩 초보인 선생님이라 설명은 쉬운 한국어로 해요.

## 주소 구조: 상위(모음) › 하위(앱)

```
/class-quiz/            학습 앱 모음 (전체 메뉴, index.html)
├─ math/                수학 퀴즈 모음 → math/math5/, math/math1/, math/area5/, math/fraction4/
├─ europe/              유럽 탐방 모음 → europe/london/ 등 나라 10개
├─ pe/                  체육시간 모음 → pe/mugunghwa/ 등 게임 5개
├─ numberblocks/        넘버블럭스 모음 → numberblocks/one-chat/(원), numberblocks/two-chat/(투)
├─ roblox/  village/  motion/   (모음 없이 따로 있는 앱)
```

- **새 앱은 주제에 맞는 모음 폴더 안에** 만들어요. 수학 앱은 `math/새앱/`, 유럽 나라는 `europe/나라/`, 몸놀이는 `pe/게임/`.
- 맞는 모음이 없으면 맨 위에 새 모음 폴더를 만들어요. 새 앱이나 새 모음을 만들면 **모음 페이지와 전체 메뉴(`index.html`)에 카드를 추가**해요. 루트 `sw.js`의 `FILES`에 카드 아이콘도 넣어요.
- 폴더 이름은 영어 소문자, 숫자, `-`만 써요. 주소에 한글이 들어가면 링크가 깨질 수 있어요.
- 이미 있는 앱의 주소는 옮기지 않아요. 옮기면 설치된 앱을 모두 다시 설치해야 해요. 꼭 옮겨야 하면 예전 폴더에 새 주소로 넘어가는 `index.html`과 정리용 `sw.js`를 남겨요. `math5/`나 `london/` 같은 예전 폴더를 참고하면 돼요.

## 앱 설정 규칙 (설치가 서로 꼬이지 않게)

- `manifest.json`의 `"id"`는 **전체 주소**로 앱마다 다르게 적어요. 예: `"/class-quiz/math/fraction4/"`
- **모음 페이지**(전체 메뉴, `math/`, `europe/`, `pe/`, `numberblocks/`)는 `"start_url"`과 `"scope"`를 `"./index.html"`로 적어요. `"./"`로 적으면 모음이 그 안의 모든 앱을 자기 구역으로 잡아요. 그러면 안드로이드 크롬이 하위 앱을 "이미 설치됨"으로 보고 설치를 막아요.
- 하위 앱은 `"start_url"`과 `"scope"`를 `"./"`로 적어요.
- **모음 페이지의 `sw.js`**는 자기 파일만 처리해요. `FILES`로 만든 `MINE` 목록에 있는 주소만 맡고, 하위 앱의 요청은 그대로 보내요. 예: 루트 `sw.js`, `math/sw.js`
- 서비스 워커 저장소 이름(`CACHE`)은 앱마다 다른 접두어를 써요. 옛 버전을 지울 때는 자기 접두어만 지워요. 같은 사이트의 모든 앱이 저장소를 함께 쓰기 때문이에요.
- 아이콘은 `icons/icon-192.png`, `icon-512.png`, `icon-180.png`를 둬요. 만드는 스크립트는 `tools/<앱>/`에 둬요.

## 고칠 때

- `tools/` 아래에 원본과 만드는 스크립트가 있는 앱이 있어요. `math/math5`, `math/math1`, `math/area5`, 유럽 나라 7개(`tools/walk/`), `roblox`, `pe` 등이에요. 이런 앱은 만들어진 폴더를 직접 고치지 말고 원본을 고친 뒤 스크립트를 다시 돌려요.
- 바꾼 뒤에는 브라우저(Playwright, Chromium은 `/opt/pw-browsers/chromium`)로 `/class-quiz/` 경로 아래에서 열어서 확인해요. 설치 가능 여부, 서비스 워커 범위, 오프라인 동작을 봐요.
