# 개념노트 · 개념 백지테스트 만들기

단원마다 **개념노트**(뜻·예시·설명·퀴즈·생각하기)와 **개념 백지테스트**(빈칸 + 새 퀴즈 + 정답지) PDF를 만들어 `worksheets/개념노트/`에 저장해요.

```
node tools/concept-notes/build.js          # 모든 단원
node tools/concept-notes/build.js 4-2_4    # 한 단원만 (units/4-2_4.js)
```

- `engine.js`: 그림 그리기 도구와 페이지 모양(표, 표지, 정답지)
- `units/학년-학기_단원.js`: 단원별 내용. 카드 하나가 한 쪽이에요.
  - `mean` 뜻, `fig` 예시 그림, `exp` 설명, `quiz` 개념노트 퀴즈, `think` 생각하기
  - `tPrompt`, `tQuiz` 백지테스트 안내 문장과 퀴즈, `keys` 그림 빈칸 정답
  - 그림에서 `label(..., { term: true })`는 백지테스트에서 점선 빈칸이 되고, `cap(...)`은 백지테스트에서 숨겨져요.
- 정답 식은 `${8 * 5}`처럼 계산식으로 써서 계산 실수가 없게 했어요.
