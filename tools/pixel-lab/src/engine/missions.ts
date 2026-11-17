// 따라 그리기 미션. 목표 그림, 쓸 수 있는 블록, 힌트, 정답 예시가 들어 있어요.
// 정답 예시는 테스트(missions.test.ts)에서 실제로 실행해서 확인해요.
import { BlockKind, Grid, Program, gridFromRows, mv, paint, rep, setColor } from './types';

export type Level = '쉬움' | '보통' | '도전';

export interface Mission {
  id: string;
  no: number;
  title: string;
  level: Level;
  /** 핵심 학습 */
  skill: string;
  /** 새로 배우는 개념 소개 (짧게) */
  concept: string;
  /** 학생에게 보여 주는 미션 설명 */
  goal: string;
  hints: string[];
  blocks: BlockKind[];
  w: number;
  h: number;
  target: Grid;
  /** 이 개수 이하의 블록으로 풀면 효율 별을 받아요 */
  par: number;
  solution: () => Program;
}

const R = () => mv('right');
const L = () => mv('left');
const U = () => mv('up');
const D = () => mv('down');
const P = paint;
const C = setColor;

const MOVE4: BlockKind[] = ['up', 'down', 'left', 'right'];

function mission(m: Omit<Mission, 'w' | 'h' | 'target' | 'no'> & { rows: string[] }): Omit<Mission, 'no'> {
  const { rows, ...rest } = m;
  return { ...rest, ...gridFromRows(rows), target: gridFromRows(rows).grid };
}

const list: Omit<Mission, 'no'>[] = [
  mission({
    id: 'dot', title: '첫 번째 마법 점', level: '쉬움', skill: '색칠 명령',
    concept: '블록은 마법 펜에게 내리는 명령이에요. 「색칠하기」 블록은 펜이 서 있는 칸을 칠해요.',
    goal: '마법 펜이 서 있는 맨 처음 칸을 보라색으로 칠해 보세요.',
    hints: [
      '왼쪽 블록 서랍에서 「색칠하기」 블록을 눌러 보세요.',
      '블록이 주문서에 들어갔나요? 이제 「실행」 버튼을 눌러요.',
      '「색칠하기」 블록 딱 1개면 돼요!',
    ],
    blocks: ['paint'],
    rows: ['P..', '...', '...'],
    par: 1,
    solution: () => [P()],
  }),
  mission({
    id: 'line', title: '반짝이는 가로줄', level: '쉬움', skill: '이동과 순서',
    concept: '명령은 위에서 아래로, 차례대로 실행돼요. 「이동」 블록은 펜만 옮기고 색은 칠하지 않아요.',
    goal: '맨 윗줄 네 칸을 모두 칠해서 반짝이는 가로줄을 만들어요.',
    hints: [
      '한 칸을 칠한 다음, 오른쪽으로 한 칸 가야 다음 칸을 칠할 수 있어요.',
      '「색칠하기 → 오른쪽」을 차례대로 놓아 보세요.',
      '색칠하기, 오른쪽, 색칠하기, 오른쪽, 색칠하기, 오른쪽, 색칠하기 순서예요.',
    ],
    blocks: ['right', 'paint'],
    rows: ['PPPP', '....', '....', '....'],
    par: 7,
    solution: () => [P(), R(), P(), R(), P(), R(), P()],
  }),
  mission({
    id: 'stairs', title: '차곡차곡 마법 계단', level: '쉬움', skill: '방향 명령',
    concept: '펜은 오른쪽으로도, 아래로도 갈 수 있어요. 방향을 바꿔 가며 움직여 봐요.',
    goal: '왼쪽 위에서 오른쪽 아래로 내려가는 계단을 칠해요.',
    hints: [
      '다음 계단 칸은 지금 칸에서 오른쪽으로 한 칸, 아래로 한 칸에 있어요.',
      '「색칠하기 → 오른쪽 → 아래」를 한 묶음으로 생각해 보세요.',
      '색칠, 오른쪽, 아래를 세 번 놓고 마지막에 색칠을 한 번 더 해요.',
    ],
    blocks: ['right', 'down', 'paint'],
    rows: ['P...', '.P..', '..P.', '...P'],
    par: 10,
    solution: () => [P(), R(), D(), P(), R(), D(), P(), R(), D(), P()],
  }),
  mission({
    id: 'window', title: '네모난 마법 창문', level: '쉬움', skill: '네 방향과 패턴',
    concept: '위, 아래, 왼쪽, 오른쪽 네 방향을 모두 쓰면 한 바퀴 빙 돌아올 수 있어요.',
    goal: '가운데가 뚫린 네모 창문을 그려요. 한 바퀴 돌면서 칠하면 돼요.',
    hints: [
      '오른쪽으로 가며 윗줄을 칠하고, 그다음에는 아래로 내려가요.',
      '오른쪽 → 아래 → 왼쪽 → 위 순서로 한 바퀴 돌아요. 가운데 칸은 지나가지 않아요.',
      '한 변마다 「색칠, 이동, 색칠, 이동」을 해요. 처음 칸으로 돌아오면 끝!',
    ],
    blocks: [...MOVE4, 'paint'],
    rows: ['PPP.', 'P.P.', 'PPP.', '....'],
    par: 15,
    solution: () => [P(), R(), P(), R(), P(), D(), P(), D(), P(), L(), P(), L(), P(), U(), P()],
  }),
  mission({
    id: 'heart', title: '하트 만들기', level: '보통', skill: '좌표와 색 고르기',
    concept: '「색 고르기」 블록을 쓰면 그다음부터 그 색으로 칠해요. 칸의 자리는 (가로, 세로) 숫자로 말할 수 있어요.',
    goal: '분홍색 작은 하트를 그려요. 첫 칸은 (1, 1)이에요.',
    hints: [
      '맨 먼저 「색 고르기」 블록을 놓고 분홍으로 바꿔요. 블록의 색 동그라미를 누르면 색을 고를 수 있어요.',
      '도화지 위쪽과 왼쪽의 숫자를 보세요. 칠할 칸은 (1,1) (3,1) (1,2) (2,2) (3,2) (2,3)이에요.',
      '오른쪽, 아래로 가서 (1,1)을 칠하고 아래 → 오른쪽 → 아래로 내려가며 칠해요. 그다음 위, 오른쪽으로 올라가요.',
    ],
    blocks: [...MOVE4, 'paint', 'color'],
    rows: ['.....', '.K.K.', '.KKK.', '..K..', '.....'],
    par: 15,
    solution: () => [C('K'), R(), D(), P(), D(), P(), R(), P(), D(), P(), U(), R(), P(), U(), P()],
  }),
  mission({
    id: 'rainbow', title: '반복되는 무지개', level: '보통', skill: '반복문',
    concept: '같은 명령이 되풀이될 때는 「반복하기」 블록 안에 넣어요. 안에 든 명령을 정한 횟수만큼 다시 실행해요.',
    goal: '빨강·노랑·하늘 무늬가 두 번 되풀이돼요. 반복 블록으로 짧게 만들어 보세요.',
    hints: [
      '먼저 아래로 한 칸 내려가요. 그다음 「빨강, 노랑, 하늘」 한 묶음을 어떻게 만들지 생각해요.',
      '한 묶음은 「색 고르기, 색칠, 오른쪽」이 세 번이에요. 이 묶음을 「반복하기」 안에 넣어요.',
      '반복 블록의 「여기에 넣기」를 누른 뒤 블록을 넣으면 안으로 들어가요. 반복 횟수는 2번!',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['.......', 'RYBRYB.', '.......'],
    par: 11,
    solution: () => [D(), rep(2, [C('R'), P(), R(), C('Y'), P(), R(), C('B'), P(), R()])],
  }),
  mission({
    id: 'flowers', title: '마법사의 꽃밭', level: '보통', skill: '반복과 패턴',
    concept: '그림에서 되풀이되는 모양(패턴)을 찾으면 반복 블록으로 한 번에 만들 수 있어요.',
    goal: '분홍 꽃과 초록 줄기가 세 송이! 꽃 한 송이 그리는 방법을 찾아 반복해요.',
    hints: [
      '꽃 한 송이는 「분홍 칠하기 → 아래 → 초록 칠하기」예요.',
      '한 송이를 그린 뒤 다음 꽃 자리로 가려면 위로 한 칸, 오른쪽으로 두 칸 가야 해요.',
      '반복 3번 안에: 오른쪽, 분홍, 색칠, 아래, 초록, 색칠, 위, 오른쪽.',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['.K.K.K.', '.G.G.G.', '.......'],
    par: 9,
    solution: () => [rep(3, [R(), C('K'), P(), D(), C('G'), P(), U(), R()])],
  }),
  mission({
    id: 'stars', title: '별빛 장식', level: '보통', skill: '효율적인 명령',
    concept: '같은 그림도 더 적은 블록으로 그릴 수 있어요. 짧고 알아보기 쉬운 주문이 좋은 주문이에요.',
    goal: '노란 별빛이 비스듬히 여섯 개! 블록 6개 이하로 만들면 효율 별을 받아요.',
    hints: [
      '앞에서 만든 계단과 닮았어요. 계단은 「색칠, 오른쪽, 아래」가 되풀이됐지요?',
      '마지막 칸에서는 더 갈 곳이 없어요. 반복은 5번만 하고, 마지막 칸은 따로 칠해요.',
      '노랑 고르기 → 반복 5번(색칠, 오른쪽, 아래) → 색칠.',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['Y.....', '.Y....', '..Y...', '...Y..', '....Y.', '.....Y'],
    par: 6,
    solution: () => [C('Y'), rep(5, [P(), R(), D()]), P()],
  }),
  mission({
    id: 'mushroom', title: '귀여운 버섯', level: '보통', skill: '색 변경과 반복',
    concept: '색을 여러 번 바꾸고 반복도 여러 번 쓸 수 있어요. 큰 그림은 부분으로 나누어 생각해요.',
    goal: '빨간 갓에 하얀 점, 노란 기둥이 있는 버섯을 그려요.',
    hints: [
      '갓 윗줄 → 갓 아랫줄 → 하얀 점 → 기둥 순서로 나누어 생각해 보세요.',
      '갓 아랫줄은 다섯 칸이에요. 「색칠, 왼쪽」을 4번 반복하고 마지막 칸을 칠하면 밖으로 나가지 않아요.',
      '하얀 점은 빨간 칸 위에 덧칠하면 돼요. 그 자리에서 아래로 내려가 노란 기둥을 칠해요.',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['.RRR.', 'RRHRR', '..Y..', '..Y..'],
    par: 19,
    solution: () => [
      R(), C('R'), rep(3, [P(), R()]), D(), rep(4, [P(), L()]), P(),
      R(), R(), C('H'), P(), D(), C('Y'), P(), D(), P(),
    ],
  }),
  mission({
    id: 'exam', title: '마법사의 시험', level: '도전', skill: '종합 미션',
    concept: '지금까지 배운 이동, 색칠, 색 고르기, 반복을 모두 써요. 한 줄씩 차근차근!',
    goal: '노란 띠를 두른 마법사 모자를 그려요. 한 단계씩 실행하며 확인하면 쉬워요.',
    hints: [
      '모자를 다섯 줄로 나누어요. 줄마다 어디서 시작해서 어느 쪽으로 칠할지 정해요.',
      '윗줄은 오른쪽으로, 다음 줄은 왼쪽으로 지그재그로 칠하면 이동이 줄어요.',
      '넷째 줄에서 노랑으로 바꾸고, 맨 아랫줄에서 다시 보라로 바꿔요. 긴 줄은 반복 블록으로!',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['..PP..', '..PP..', '.PPPP.', '.YYYY.', 'PPPPPP'],
    par: 28,
    solution: () => [
      R(), R(), P(), R(), P(), D(), P(), L(), P(), D(), L(),
      rep(3, [P(), R()]), P(), D(), C('Y'), rep(3, [P(), L()]), P(),
      D(), L(), C('P'), rep(5, [P(), R()]), P(),
    ],
  }),
  mission({
    id: 'carpet', title: '줄무늬 마법 양탄자', level: '도전', skill: '중첩 반복',
    concept: '반복 블록 안에 반복 블록을 또 넣을 수 있어요. 이것을 「중첩 반복」이라고 해요.',
    goal: '분홍 줄과 민트 줄이 번갈아 나와요. 「두 줄 그리기」를 반복해 보세요.',
    hints: [
      '한 줄은 「색칠, 이동」 4번 반복 + 색칠이에요. 분홍 줄은 오른쪽으로, 민트 줄은 왼쪽으로 가요.',
      '「분홍 줄, 아래, 민트 줄, 아래」를 큰 반복 블록에 넣고 2번 반복해요.',
      '큰 반복이 끝나면 맨 아랫줄에 와 있어요. 마지막 분홍 줄을 한 번 더 그려요.',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['KKKKK', 'MMMMM', 'KKKKK', 'MMMMM', 'KKKKK'],
    par: 18,
    solution: () => [
      rep(2, [C('K'), rep(4, [P(), R()]), P(), D(), C('M'), rep(4, [P(), L()]), P(), D()]),
      C('K'), rep(4, [P(), R()]), P(),
    ],
  }),
  mission({
    id: 'checker', title: '별빛 바둑판', level: '도전', skill: '효율적인 알고리즘과 디버깅',
    concept: '반복의 마지막에서 펜이 밖으로 나가는 일이 많아요. 한 단계씩 실행하며 틀린 곳을 찾는 것이 디버깅이에요.',
    goal: '노란 칸이 한 칸씩 건너뛰는 바둑판 무늬예요. 중첩 반복으로 도전!',
    hints: [
      '첫 줄은 「색칠, 오른쪽, 오른쪽」 2번 + 색칠이에요. 둘째 줄은 한 칸 밀려서 반대로 돌아와요.',
      '「두 줄 묶음」을 반복해요. 그런데 3번 반복하면 마지막에 펜이 아래로 나가 버려요!',
      '묶음을 2번만 반복하고, 마지막 두 줄은 끝의 「아래, 왼쪽」을 빼고 따로 그려요.',
    ],
    blocks: [...MOVE4, 'paint', 'color', 'repeat'],
    rows: ['Y.Y.Y.', '.Y.Y.Y', 'Y.Y.Y.', '.Y.Y.Y', 'Y.Y.Y.', '.Y.Y.Y'],
    par: 28,
    solution: () => {
      const pair = (last: boolean) => [
        rep(2, [P(), R(), R()]), P(), D(), R(), rep(2, [P(), L(), L()]), P(), ...(last ? [] : [D(), L()]),
      ];
      return [C('Y'), rep(2, pair(false)), ...pair(true)];
    },
  }),
];

export const MISSIONS: Mission[] = list.map((m, i) => ({ ...m, no: i + 1 }));

export const TITLES = [
  { stars: 0, name: '새내기 견습생' },
  { stars: 3, name: '꼬마 마법사' },
  { stars: 8, name: '픽셀 마법사' },
  { stars: 14, name: '반복의 마법사' },
  { stars: 20, name: '대마법사' },
];
export const titleFor = (stars: number) => [...TITLES].reverse().find((t) => stars >= t.stars)!.name;
