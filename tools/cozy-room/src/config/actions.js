// ┌──────────────────────────────────────────────┐
// │  🎬 행동 목록 — 학생이 고쳐도 되는 파일이에요!      │
// └──────────────────────────────────────────────┘
// 여기에 행동을 하나 추가하면, 클릭 메뉴·코딩 블록·자동 행동에 저절로 나타나요!
//
// 행동 하나에 들어가는 것:
//   id       : 영어 이름 (겹치면 안 돼요)
//   name     : 화면에 보이는 이름 (예: '세수하기')
//   emoji    : 그림 글자
//   target   : 가서 할 가구의 id (furniture.js) — null 이면 지금 서 있는 자리에서 해요
//   seat     : true 면 그 가구의 seat(앉는/눕는 자리)에 올라가서 해요
//   face     : 바라볼 방향 — 'target'(가구 쪽, 기본값) / 'camera'(화면 쪽) / 숫자(각도)
//   product  : 손에 들 물건의 id (products.js) — 없으면 null
//   pickup   : true 면 물건이 있는 곳에 먼저 가서 집어 와요
//   motion   : 몸동작 이름 — 아래 '쓸 수 있는 몸동작' 참고
//   duration : 몇 초 동안 할지
//   expression : 표정 — 'happy'(웃음) 'joy'(활짝) 'closed'(눈 감음) 'sleepy'(졸림)
//              'surprised'(놀람) 'proud'(뿌듯)
//   say      : 시작할 때 말풍선
//   effects  : 상태가 얼마나 바뀌는지 { mood: 기분, sleepy: 졸림, clean: 깨끗함 }
//   finish   : 끝날 때 효과 — 'hearts' 'stars' 'sparkle' 'bubbles' 'crown' 'notes' 'drops' 'zzz'
//   weight   : 자동 행동에서 뽑힐 확률 (클수록 자주, 0이면 자동으로는 안 해요)
//   wants    : 이 상태일 때 더 하고 싶어해요. 예) { sleepy: '>65' } 졸림이 65보다 크면 자주 해요
//   code     : '코드 보기'에 나오는 이름
//   onStart / onFinish : (고급) 시작·끝에 실행할 함수. world 로 방을 바꿀 수 있어요.
//
// 쓸 수 있는 몸동작(motion):
//   'pat'(두드려 바르기) 'dropper'(세럼 떨어뜨리기) 'washFace'(세수) 'brushTeeth'(양치)
//   'lipBalm'(입술 바르기) 'blush'(볼 톡톡) 'comb'(머리 빗기) 'sunscreen'(선크림)
//   'maskPack'(마스크팩) 'drink'(마시기) 'read'(읽기) 'nap'(눕기) 'water'(물 주기)
//   'tidy'(줍기) 'press'(누르기) 'dance'(춤) 'stretch'(기지개) 'wave'(손 흔들기) 'jump'(뛰기)

export const actions = [
  {
    id: 'washFace', name: '세수하기', emoji: '🫧', code: '세수하기',
    target: 'sink', product: 'foam', motion: 'washFace', duration: 4.5,
    expression: 'closed', say: '뽀득뽀득~',
    effects: { clean: 35, mood: 5 }, finish: ['bubbles', 'sparkle'],
    weight: 3, wants: { clean: '<45' },
  },
  {
    id: 'brushTeeth', name: '양치하기', emoji: '🪥', code: '양치하기',
    target: 'sink', product: 'toothbrush', motion: 'brushTeeth', duration: 4,
    expression: 'happy', say: '치카치카!',
    effects: { clean: 20 }, finish: ['bubbles', 'stars'],
    weight: 2, wants: { clean: '<60' },
  },
  {
    id: 'toner', name: '토너 바르기', emoji: '💧', code: '토너바르기',
    target: 'vanity', seat: true, product: 'toner', motion: 'pat', duration: 3.5,
    expression: 'joy', say: '촉촉해져라~',
    effects: { clean: 8, mood: 8 }, glow: 0.25, finish: ['drops', 'sparkle'],
    weight: 2,
  },
  {
    id: 'serum', name: '세럼 바르기', emoji: '✨', code: '세럼바르기',
    target: 'vanity', seat: true, product: 'serum', motion: 'dropper', duration: 3.8,
    expression: 'happy', say: '톡, 톡!',
    effects: { mood: 8 }, glow: 0.3, finish: ['sparkle'],
    weight: 2,
  },
  {
    id: 'cream', name: '크림 바르기', emoji: '🧴', code: '크림바르기',
    target: 'vanity', seat: true, product: 'cream', motion: 'pat', duration: 3.5,
    expression: 'joy', say: '말랑말랑~',
    effects: { mood: 10 }, glow: 0.3, finish: ['hearts', 'sparkle'],
    weight: 2,
  },
  {
    id: 'sunscreen', name: '선크림 바르기', emoji: '☀️', code: '선크림바르기',
    target: 'window', face: 'camera', product: 'sunscreen', pickup: true, motion: 'sunscreen', duration: 4,
    expression: 'happy', say: '햇빛아 기다려!',
    effects: { clean: 5, mood: 6 }, glow: 0.15, finish: ['stars'],
    weight: 2,
  },
  {
    id: 'lipBalm', name: '립밤 바르기', emoji: '💋', code: '립밤바르기',
    target: 'vanity', seat: true, product: 'lipBalm', motion: 'lipBalm', duration: 2.8,
    expression: 'happy', say: '입술 촉촉!',
    effects: { mood: 6 }, finish: ['hearts'],
    weight: 2,
  },
  {
    id: 'blush', name: '볼터치 놀이', emoji: '🌸', code: '볼터치하기',
    target: 'vanity', seat: true, product: 'blush', motion: 'blush', duration: 3.2,
    expression: 'joy', say: '발그레~',
    effects: { mood: 12 }, finish: ['hearts', 'crown'],
    weight: 1.5,
  },
  {
    id: 'combHair', name: '머리 빗기', emoji: '🪮', code: '머리빗기',
    target: 'vanity', seat: true, product: 'comb', motion: 'comb', duration: 4,
    expression: 'happy', say: '사락사락~',
    effects: { mood: 8, clean: 5 }, finish: ['sparkle'],
    weight: 2,
  },
  {
    id: 'maskPack', name: '마스크팩 하기', emoji: '🧖', code: '마스크팩하기',
    target: 'vanity', seat: true, product: 'mask', pickup: true, motion: 'maskPack', duration: 6,
    expression: 'closed', say: '시원하다~',
    effects: { mood: 12, sleepy: 5 }, glow: 0.5, finish: ['sparkle', 'crown'],
    weight: 1,
  },
  {
    id: 'tidy', name: '방 정리하기', emoji: '🧺', code: '정리하기',
    target: 'toyBox', motion: 'tidy', duration: 4.5,
    expression: 'happy', say: '제자리에 쏙!',
    effects: { mood: 10 }, finish: ['stars'],
    weight: 1.5,
    onStart: (world) => world.collectMess(),
  },
  {
    id: 'tea', name: '차 마시기', emoji: '🍵', code: '차마시기',
    target: 'teaTable', seat: true, product: 'teacup', motion: 'drink', duration: 5,
    expression: 'joy', say: '따뜻해~',
    effects: { mood: 12, sleepy: -12 }, finish: ['hearts'],
    weight: 2,
  },
  {
    id: 'read', name: '책 읽기', emoji: '📖', code: '책읽기',
    target: 'teaTable', seat: true, product: 'book', pickup: true, motion: 'read', duration: 5,
    expression: 'happy', say: '두근두근 이야기!',
    effects: { mood: 8, sleepy: 6 }, finish: ['stars', 'notes'],
    weight: 1.5,
  },
  {
    id: 'nap', name: '낮잠 자기', emoji: '😴', code: '낮잠자기',
    target: 'bed', seat: true, motion: 'nap', duration: 7,
    expression: 'closed', say: '조금만 잘게…',
    effects: { sleepy: -70, mood: 10 }, finish: ['stars'],
    weight: 1, wants: { sleepy: '>65' },
  },
  {
    id: 'water', name: '화분 물 주기', emoji: '🪴', code: '물주기',
    target: 'plant', product: 'wateringCan', motion: 'water', duration: 3.5,
    expression: 'joy', say: '쑥쑥 자라라!',
    effects: { mood: 8 }, finish: ['hearts'],
    weight: 1.5,
    onFinish: (world) => world.growPlant(),
  },
  {
    id: 'lamp', name: '무드등 켜고 끄기', emoji: '💡', code: '무드등켜기',
    target: 'nightstand', motion: 'press', duration: 1.4,
    expression: 'surprised', say: '딸깍!',
    effects: { mood: 3 }, finish: ['sparkle'],
    weight: 0.5,
    onFinish: (world) => world.toggleLamp(),
  },
  {
    id: 'window', name: '창문 열고 닫기', emoji: '🪟', code: '창문열기',
    target: 'window', motion: 'press', duration: 1.6,
    expression: 'joy', say: '바람 솔솔~',
    effects: { mood: 6, sleepy: -6 }, finish: ['notes'],
    weight: 0.6,
    onFinish: (world) => world.toggleWindow(),
  },
  {
    id: 'dance', name: '춤추기', emoji: '💃', code: '춤추기',
    target: 'rug', face: 'camera', motion: 'dance', duration: 4,
    expression: 'joy', say: '랄랄라~',
    effects: { mood: 15, sleepy: 6, clean: -5 }, finish: ['notes', 'hearts'],
    weight: 1.2,
  },
  {
    id: 'stretch', name: '기지개 켜기', emoji: '🙆', code: '기지개켜기',
    target: null, face: 'camera', motion: 'stretch', duration: 2.5,
    expression: 'closed', say: '으쌰~',
    effects: { sleepy: -10 }, finish: ['sparkle'],
    weight: 0.8,
  },
  {
    id: 'wave', name: '손 흔들기', emoji: '👋', code: '손흔들기',
    target: null, face: 'camera', motion: 'wave', duration: 2,
    expression: 'joy', say: '안녕~!',
    effects: { mood: 4 }, finish: ['hearts'],
    weight: 0.5,
  },
  {
    id: 'jump', name: '깡충 뛰기', emoji: '🐰', code: '깡충뛰기',
    target: null, face: 'camera', motion: 'jump', duration: 2,
    expression: 'joy', say: '깡충깡충!',
    effects: { mood: 6, sleepy: -4, clean: -3 }, finish: ['stars'],
    weight: 0.5,
  },
];
