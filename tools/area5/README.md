# 5학년 넓이 학습지 · 앱 만들기 도구

학습지 PDF 3개(`worksheets/`)와 넓이 퀴즈 앱(`area5/index.html`)은 이 폴더의 스크립트로 만들어요.
그림은 모두 실제 길이 비율대로 계산해서 SVG로 그려요.

| 파일 | 하는 일 |
|---|---|
| `fig.py`, `scene.py` | 삼각형·사각형 그림(SVG)을 그리는 도구 |
| `build.py` | 삼각형의 밑변과 높이 학습지 → `worksheet.html` |
| `build2.py` | 사각형의 넓이 학습지 → `quad.html` |
| `build3.py` | 밑변 2배·넓이 2배 학습지 → `ratio.html` |
| `build_app.py`, `app_template.html` | 위 학습지의 그림과 문제로 앱 `area5/index.html`을 만들어요 |

## 다시 만들기

이 폴더에서 실행해요. `build2.py`, `build3.py`는 `build.py`가 만든 `worksheet.html`의 스타일을 가져다 써요.

```bash
cd tools/area5
mkdir -p fonts   # NanumGothic-Regular.ttf, NanumGothic-Bold.ttf, NanumGothic-ExtraBold.ttf 를 넣어요 (PDF용)
python3 build.py && python3 build2.py && python3 build3.py
python3 build_app.py ../../area5/index.html

# PDF로 저장 (크롬)
chrome --headless --no-pdf-header-footer --allow-file-access-from-files --print-to-pdf=quad.pdf quad.html
```

문제를 고칠 때는 학습지 스크립트와 `build_app.py`의 문제를 함께 고쳐야 PDF와 앱 내용이 같아져요.
