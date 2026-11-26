// ┌──────────────────────────────────────────────┐
// │  🛏️ 가구 목록 — 학생이 고쳐도 되는 파일이에요!     │
// └──────────────────────────────────────────────┘
// 방 바닥은 가로(x) -4 ~ 4, 세로(z) -3 ~ 3 이에요.
//   x : 왼쪽(-4)  ←→  오른쪽(4)
//   z : 안쪽 벽(-3) ←→ 화면 앞쪽(3)
// 안쪽 벽은 z = -3, 왼쪽 벽은 x = -4 에 있어요.
//
//   id     : 영어 이름 (겹치면 안 돼요. 행동의 target 에 이 이름을 적어요)
//   type   : 가구 모양 — 'bed' 'nightstand' 'vanity' 'sink' 'shelf' 'window'
//            'plant' 'teaTable' 'rug' 'toyBox'
//   name   : 화면에 보이는 한글 이름,  emoji : 그림 글자
//   pos    : [x, z] 놓을 자리
//   rot    : 돌리는 각도 (0 = 앞을 봄, 90 = 오른쪽을 봄, -90 = 왼쪽을 봄)
//   color  : 주 색,  accent : 꾸밈 색
//   spot   : 캐릭터가 서는 자리 (가구 자리에서 [x, z] 만큼 떨어진 곳)
//   seat   : (있으면) 앉거나 눕는 자리 { at: [x, z] 떨어진 곳, y: 높이, face: 보는 방향 각도 }
//   solid  : false 로 적으면 캐릭터가 그 위를 지나갈 수 있어요 (러그처럼)

export const furniture = [
  {
    id: 'bed', type: 'bed', name: '침대', emoji: '🛏️',
    pos: [-0.9, -2.0], rot: 0, color: '#f6d7b8', accent: '#ffc7d6',
    spot: [0.95, 0.55],
    seat: { at: [0, 0.27], y: 0.47, face: 0 },
  },
  {
    id: 'nightstand', type: 'nightstand', name: '무드등 협탁', emoji: '💡',
    pos: [-2.2, -2.7], rot: 0, color: '#f3dcc2', accent: '#ffe7a3',
    spot: [0.25, 0.8],
  },
  {
    id: 'sink', type: 'sink', name: '세면대', emoji: '🚰',
    pos: [-3.62, -1.35], rot: 90, color: '#bfeadf', accent: '#ffffff',
    spot: [0.8, 0],
  },
  {
    id: 'vanity', type: 'vanity', name: '화장대', emoji: '🪞',
    pos: [-3.68, 0.95], rot: 90, color: '#fbe3ea', accent: '#ffd36e',
    spot: [1.05, 0.55],
    seat: { at: [0.62, 0], y: 0.34, face: 60 },
  },
  {
    id: 'shelf', type: 'shelf', name: '화장품 선반', emoji: '🗄️',
    pos: [1.15, -2.8], rot: 0, color: '#f7e6cf', accent: '#cbb7f5',
    spot: [0, 0.8],
  },
  {
    id: 'window', type: 'window', name: '창문', emoji: '🪟',
    pos: [2.85, -2.98], rot: 0, color: '#ffffff', accent: '#b9e3c6',
    spot: [-0.2, 1.05], solid: false,
  },
  {
    id: 'plant', type: 'plant', name: '화분', emoji: '🪴',
    pos: [3.45, -2.4], rot: 0, color: '#f7b9a0', accent: '#8fcf8a',
    spot: [-0.75, 0.45],
  },
  {
    id: 'teaTable', type: 'teaTable', name: '티 테이블', emoji: '🫖',
    pos: [2.25, 0.85], rot: 0, color: '#fff2e2', accent: '#ffb8c6',
    spot: [-0.95, -0.15],
    seat: { at: [-0.62, -0.42], y: 0.13, face: 55 },
  },
  {
    id: 'rug', type: 'rug', name: '러그', emoji: '🟣',
    pos: [0.15, 0.7], rot: 0, color: '#fff3e6', accent: '#cdb8f2',
    spot: [0, 0], solid: false,
  },
  {
    id: 'toyBox', type: 'toyBox', name: '정리함', emoji: '🧺',
    pos: [3.5, -0.75], rot: -90, color: '#ffe59a', accent: '#ff9db1',
    spot: [-0.8, 0],
  },
];
