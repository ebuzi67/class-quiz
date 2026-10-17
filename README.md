# class-quiz

첫 화면(`index.html`)에서 두 퀴즈 중 하나를 골라요. 두 앱은 폴더가 달라서 휴대폰에 따로 설치돼요.

| 앱 | 폴더 | 내용 |
|---|---|---|
| 분수 퀴즈 (4학년) | `fraction4/` | 분수의 뜻, 크기 비교, 덧셈과 뺄셈 |
| 넓이 퀴즈 (5학년) | `area5/` | 5-1 6단원 다각형의 넓이: 삼각형의 밑변과 높이, 사각형의 넓이, 밑변 2배·넓이 2배 |

- `worksheets/`: 넓이 퀴즈와 같은 내용의 인쇄용 학습지 PDF
- `tools/area5/`: 학습지와 넓이 퀴즈 앱을 만드는 스크립트

## 로블록스 퀴즈 (따로 분리된 앱)

수학 퀴즈와 섞이지 않게 `roblox/` 폴더에 따로 있어요. 첫 화면(`index.html`)에는 나오지 않고, `…/class-quiz/roblox/` 주소로 열어요. 휴대폰에는 "로블록스 퀴즈" 앱 하나로 설치되고, 앱 안에서 두 퀴즈 중 하나를 골라요.

| 퀴즈 | 폴더 |
|---|---|
| 타워 디펜스 | `roblox/tower-defense/` |
| 점프맵 (Obby) | `roblox/jump-map/` |

- `tools/roblox/*.original.html`: 제미나이로 만든 원본 (구글 Apps Script 프로젝트에서 받은 그대로)
- `tools/roblox/build.py`: 원본에 앱 설정(아이콘, 오프라인, 돌아가기 링크)만 붙여서 `roblox/`에 저장하고 아이콘을 만들어요. 원본을 고친 뒤 `python3 tools/roblox/build.py`를 다시 실행하면 돼요.
