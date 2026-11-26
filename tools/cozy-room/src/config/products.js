// ┌──────────────────────────────────────────────┐
// │  🧴 화장품·소품 목록 — 학생이 고쳐도 되는 파일이에요! │
// └──────────────────────────────────────────────┘
// 물건 하나는 { ... } 한 덩어리예요. 쉼표(,)로 구분해요.
//
//   id    : 영어 이름 (다른 물건과 겹치면 안 돼요. 행동에서 이 이름으로 불러요)
//   name  : 화면에 보이는 한글 이름
//   emoji : 메뉴에 나오는 그림 글자
//   shape : 모양 — 'bottle'(병) 'dropper'(스포이트병) 'jar'(크림통) 'tube'(튜브)
//           'stick'(립밤) 'compact'(팩트) 'comb'(빗) 'toothbrush'(칫솔)
//           'pouch'(마스크팩 봉투) 'book'(책) 'cup'(찻잔) 'can'(물뿌리개)
//   color : 몸통 색,  cap: 뚜껑(또는 무늬) 색
//   home  : 평소에 놓여 있는 가구의 id (furniture.js 참고)
//   slot  : 그 가구 위의 몇 번째 자리인지 (0부터 세요)
//   size  : 크기 배율 (빼먹으면 1)

export const products = [
  { id: 'toner', name: '토너', emoji: '💧', shape: 'bottle', color: '#bfe6ff', cap: '#ffffff', home: 'vanity', slot: 0 },
  { id: 'serum', name: '세럼', emoji: '✨', shape: 'dropper', color: '#ffd5a1', cap: '#c9946a', home: 'vanity', slot: 1 },
  { id: 'cream', name: '수분 크림', emoji: '🧴', shape: 'jar', color: '#fff5f9', cap: '#ffb7cf', home: 'vanity', slot: 2 },
  { id: 'lipBalm', name: '립밤', emoji: '💋', shape: 'stick', color: '#ff9fb6', cap: '#ffffff', home: 'vanity', slot: 3 },
  { id: 'blush', name: '볼터치', emoji: '🌸', shape: 'compact', color: '#ffc2cf', cap: '#f6dd9a', home: 'vanity', slot: 4 },
  { id: 'comb', name: '빗', emoji: '🪮', shape: 'comb', color: '#c9b6ff', home: 'vanity', slot: 5 },
  { id: 'foam', name: '폼클렌저', emoji: '🫧', shape: 'tube', color: '#d6f5ec', cap: '#7fd1bd', home: 'sink', slot: 0 },
  { id: 'toothbrush', name: '칫솔', emoji: '🪥', shape: 'toothbrush', color: '#8fd3ff', home: 'sink', slot: 1 },
  { id: 'sunscreen', name: '선크림', emoji: '☀️', shape: 'tube', color: '#fff0b3', cap: '#ffb14d', home: 'shelf', slot: 0 },
  { id: 'mask', name: '마스크팩', emoji: '🧖', shape: 'pouch', color: '#c9ecfb', cap: '#7cc4e8', home: 'shelf', slot: 1 },
  { id: 'book', name: '그림책', emoji: '📖', shape: 'book', color: '#a9d9a1', cap: '#fff6d8', home: 'shelf', slot: 2 },
  { id: 'teacup', name: '찻잔', emoji: '🍵', shape: 'cup', color: '#ffffff', cap: '#ffb3c4', home: 'teaTable', slot: 0 },
  { id: 'wateringCan', name: '물뿌리개', emoji: '🚿', shape: 'can', color: '#9fd8cf', cap: '#ffd36e', home: 'plant', slot: 0 },
];
