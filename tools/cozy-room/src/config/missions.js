// ┌──────────────────────────────────────────────┐
// │  🏅 미션 목록 — 선생님이 고치는 파일이에요            │
// └──────────────────────────────────────────────┘
// 미션 하나:
//   id      : 영어 이름 (겹치면 안 돼요. 바꾸면 그 미션 도장이 사라져요)
//   lesson  : 몇 차시 미션인지
//   concept : 배우는 코딩 개념
//   title   : 미션 이름,  goal : 할 일 설명,  hint : 막혔을 때 도움말
//   badge   : 통과하면 받는 도장 그림
//   check   : 통과했는지 알려 주는 함수. c 안에 아래 정보가 들어 있어요.
//     c.scripts      : 지금 만든 코드(스크립트 목록)
//     c.blocks       : 모든 블록을 한 줄로 펼친 목록 (block.type, block.action, block.times ...)
//     c.run          : 마지막으로 끝까지 실행한 기록 (없으면 null)
//                      c.run.done(행동id) → 실행 중에 그 행동을 몇 번 했는지
//                      c.run.doneBy(행동id, 'click' 또는 'start') → 어떤 스크립트로 했는지
//     c.state        : 지금 상태 { mood, sleepy, clean }
//     c.clicks       : 클릭 메뉴로 부탁한 행동 id 목록

const startScript = (c) => c.scripts.find((s) => s.event.type === 'start');
const contains = (list, pred) => (list || []).some((b) => pred(b) || contains(b.body, pred) || contains(b.then, pred) || contains(b.else, pred));

export const missions = [
  {
    id: 'm1-click', lesson: 1, concept: '이벤트 맛보기', badge: '👆',
    title: '모모에게 부탁하기',
    goal: '방 안의 가구나 물건을 눌러서 모모에게 행동 2가지를 부탁해 보세요.',
    hint: '침대, 세면대, 화분처럼 방 안에 있는 것을 눌러 보세요. 메뉴가 나오면 하나 골라요.',
    check: (c) => new Set(c.clicks).size >= 2,
  },
  {
    id: 'm2-sequence', lesson: 2, concept: '순서(순차)', badge: '🔢',
    title: '순서대로 3가지',
    goal: '"시작하면" 아래에 행동 블록 3개를 넣고 ▶ 실행해 보세요.',
    hint: '블록 꾸러미에서 "행동하기" 블록을 눌러 3번 넣고, 블록마다 다른 행동을 골라요.',
    check: (c) => {
      const s = startScript(c);
      return !!c.run && c.run.completed && !!s && s.body.filter((b) => b.type === 'action').length >= 3;
    },
  },
  {
    id: 'm3-repeat', lesson: 3, concept: '반복', badge: '🔁',
    title: '머리 3번 빗기',
    goal: '"반복하기" 블록 안에 "머리 빗기"를 넣어서, 3번 이상 반복해 보세요.',
    hint: '반복 블록의 숫자를 3으로 바꾸고, 그 안(들여쓴 칸)에 행동 블록을 끌어다 놓아요.',
    check: (c) => {
      const ok = c.blocks.some((b) => b.type === 'repeat' && b.times >= 3 && contains(b.body, (x) => x.type === 'action' && x.action === 'combHair'));
      return ok && !!c.run && c.run.completed && c.run.done('combHair') >= 3;
    },
  },
  {
    id: 'm4-if', lesson: 4, concept: '조건', badge: '🔀',
    title: '졸리면 낮잠, 아니면 책',
    goal: '"만약" 블록으로 졸림이 70보다 크면 낮잠, 아니면 책 읽기를 하게 만들어 보세요.',
    hint: '만약 블록에서 [졸림] [>] [70]을 고르고, "이면" 칸에 낮잠, "아니면" 칸에 책 읽기를 넣어요.',
    check: (c) => {
      const ok = c.blocks.some((b) => b.type === 'if' && b.cond.gauge === 'sleepy'
        && contains(b.then, (x) => x.type === 'action' && x.action === 'nap')
        && contains(b.else, (x) => x.type === 'action' && x.action === 'read'));
      return ok && !!c.run && c.run.completed;
    },
  },
  {
    id: 'm5-event', lesson: 5, concept: '이벤트', badge: '⚡',
    title: '화분을 누르면 물 주기',
    goal: '새 스크립트를 만들어 "[화분]을 누르면" 아래에 "화분 물 주기"를 넣고, 실행한 뒤 화분을 눌러 보세요.',
    hint: '"+ 스크립트 추가"를 누르고 맨 위 칸에서 "물건을 누르면 → 화분"을 골라요. ▶ 실행 중에 화분을 눌러요.',
    check: (c) => !!c.run && c.run.doneBy('water', 'clickThing') >= 1,
  },
  {
    id: 'm6-variable', lesson: 6, concept: '변수(상태)', badge: '🫧',
    title: '깨끗함 100 만들기',
    goal: '깨끗함 게이지를 100까지 채워 보세요. 어떤 행동이 깨끗함을 올려 줄까요?',
    hint: '화면 위 물방울 게이지가 "깨끗함"이에요. 세수, 양치를 반복해 보세요.',
    check: (c) => c.state.clean >= 100,
  },
  {
    id: 'm7-routine', lesson: 7, concept: '모두 합치기', badge: '👑',
    title: '나만의 아침 루틴',
    goal: '블록 6개 이상으로 나만의 루틴을 만드세요. 반복이나 만약 블록, 말하기 블록을 꼭 써요. 다 만들면 친구에게 발표해요!',
    hint: '공유 탭에서 "공유 코드"를 복사하면 친구 기기에서 내 코드를 불러올 수 있어요.',
    check: (c) => c.blocks.length >= 6
      && c.blocks.some((b) => b.type === 'repeat' || b.type === 'if')
      && c.blocks.some((b) => b.type === 'say')
      && !!c.run && c.run.completed,
  },
];
