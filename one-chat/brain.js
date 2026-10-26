// 원이랑 대화하기: 원의 말과 놀이
// 원은 AI가 아니에요. 이 파일에 정해 둔 말과 놀이로만 대답하고, 아무 데도 연결하지 않아요.
// 화면(index.html)은 reply(글, 누른칸)으로 원의 대답 줄들을 받고, chipsNow()로 아래 버튼들을 받아요.
// 대답 줄은 글(string)이거나, 숨은 원 찾기 판({board})이에요.

// ---------- 도우미 ----------
const lastPick = {};
function pick(list, key) {
  let i = Math.floor(Math.random() * list.length);
  if (key && list.length > 1 && i === lastPick[key]) i = (i + 1) % list.length;
  if (key) lastPick[key] = i;
  return list[i];
}
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const blocks = (n) => "🟥".repeat(n);
const norm = (t) => t.toLowerCase().replace(/[\s.,!?~^'"…·]/g, "");
const has = (n, keys) => keys.some((k) => n.includes(k));

// 한글 한 글자를 초성·중성·종성 번호로 나누고 다시 붙여요
function parts(ch) {
  const c = ch.charCodeAt(0) - 0xac00;
  return { cho: Math.floor(c / 588), jung: Math.floor((c % 588) / 28), jong: c % 28 };
}
const compose = (cho, jung, jong) => String.fromCharCode(0xac00 + cho * 588 + jung * 28 + jong);
const isHangul = (ch) => ch >= "가" && ch <= "힣";

// 받침이 있으면 앞의 말, 없으면 뒤의 말: josa(5, "이야", "야") → "5야", josa("텐", "이", "가") → "텐이"
const NUM_BATCHIM = [true, true, false, true, false, false, true, true, true, false]; // 영 일 이 삼 사 오 육 칠 팔 구
function josa(w, withB, without) {
  let b;
  if (typeof w === "number") b = w % 10 === 0 ? true : NUM_BATCHIM[w % 10];
  else { const last = w[w.length - 1]; b = isHangul(last) && parts(last).jong !== 0; }
  return w + (b ? withB : without);
}
// '기'로, '산'으로, '달'로
const ro = (syl) => { const j = parts(syl).jong; return `'${syl}'` + (j === 0 || j === 8 ? "로" : "으로"); };

// ---------- 넘버블럭스 친구들 ----------
const FRIENDS = {
  1: { name: "원", facts: ["그건 바로 나야! 빨간 블록 하나, 눈도 하나! 하나인 게 제일 좋아!"],
    play: "나랑 놀려면 지금 바로 놀면 돼! 끝말잇기 할까?", now: "나는 지금 너랑 이야기하고 있지! 헤헤 ☝️" },
  2: { name: "투", facts: ["투는 주황색 블록 두 개야. 뭐든 짝꿍으로 있는 걸 좋아해! 양말 두 짝, 신발 두 짝!", "투는 노래랑 춤을 정말 잘해! 🎵 '둘, 둘, 짝꿍 둘~'", "원 둘이 꼭 붙으면 투가 돼! 그래서 투랑 나는 엄청 친해!"],
    play: "투랑은 노래 부르고 춤춰! 원 둘이 합쳐지는 마법 놀이도 해!", now: "투는 오늘 새 노래를 만들고 있대! 🎵" },
  3: { name: "쓰리", facts: ["쓰리는 노란색 블록 세 개야. 장난꾸러기 광대라서 다들 깔깔 웃어!", "쓰리는 저글링을 잘해! 공 세 개를 휙휙휙~", "쓰리는 무대에 서는 걸 좋아해. '짜잔! 쓰리 등장!' 하고 외쳐!"],
    play: "쓰리랑은 저글링 놀이! 쓰리는 공 세 개, 원은 공 하나!", now: "쓰리는 오늘 새 마술을 연습하고 있어! 🎩" },
  4: { name: "포", facts: ["포는 초록색 블록 네 개야. 네모 반듯한 걸 좋아해!", "포는 정리 정돈 대장이야. 줄 맞추는 걸 좋아해!", "포는 2줄씩 2번, 딱 네모가 될 수 있어! ⬛"],
    play: "포랑은 네모 모양 찾기를 해! 창문도 네모, 책도 네모!", now: "포는 오늘 방 정리를 하고 있대. 반듯반듯!" },
  5: { name: "파이브", facts: ["파이브는 블록 다섯 개야. 손가락이 다섯 개라서 하이파이브를 잘해! 🖐️", "파이브는 별 모양을 좋아해. 별도 뾰족한 데가 다섯 개거든! ⭐", "파이브는 친구들을 잘 웃게 해 주는 신나는 친구야!"],
    play: "파이브랑은 하이파이브 놀이! 짝! 짝! 짝!", now: "파이브는 오늘 별 그림을 그리고 있어! ⭐" },
  6: { name: "식스", facts: ["식스는 블록 여섯 개야. 주사위처럼 점 여섯 개가 될 수 있어! 🎲", "식스는 벌집 모양 육각형을 좋아해! 🐝", "식스는 3개씩 2줄로 서면 반듯한 네모가 돼!"],
    play: "식스랑은 주사위 놀이! 데굴데굴~ 몇 나올까?", now: "식스는 오늘 꿀벌 친구들을 만나러 갔대! 🐝" },
  7: { name: "세븐", facts: ["세븐은 무지개색 블록 일곱 개야. 무지개도 일곱 색깔이지! 🌈", "세븐은 행운의 숫자래! 세븐을 만나면 기분이 좋아져!", "일주일도 일곱 날이야! 월화수목금토일!"],
    play: "세븐이랑은 무지개 찾기 놀이! 빨주노초파남보!", now: "세븐은 오늘 비 온 뒤 무지개를 보러 갔어! 🌈" },
  8: { name: "에이트", facts: ["에이트는 블록 여덟 개야. 문어처럼 다리가 여덟 개인 슈퍼히어로! 🐙", "에이트는 '옥토블록'으로 변신해서 친구들을 도와줘!", "에이트는 4개씩 2줄로 서면 긴 네모가 돼!"],
    play: "에이트랑은 슈퍼히어로 놀이! 원은 꼬마 히어로!", now: "에이트는 오늘도 누가 도움이 필요한지 살펴보고 있어! 🦸" },
  9: { name: "나인", facts: ["나인은 블록 아홉 개야. 3줄씩 3번, 커다란 네모가 될 수 있어!", "나인은 조용하고 생각이 깊은 친구야.", "나인은 3이 세 번 모인 거야! 쓰리랑도 친해!"],
    play: "나인이랑은 큰 네모 만들기! 원은 한 칸 담당!", now: "나인은 오늘 책을 읽고 있대. 📚" },
  10: { name: "텐", facts: ["텐은 블록 열 개야. 손가락 열 개처럼 딱 맞는 대장이야! 🔟", "텐은 '10, 9, 8…' 하고 세면서 로켓을 쏘는 걸 좋아해! 🚀", "원이 열 명 모이면 텐이 돼! 엄청 크지?"],
    play: "텐이랑은 로켓 놀이! 10, 9, 8… 3, 2, 1, 발사! 🚀", now: "텐은 오늘 친구들이랑 로켓을 만들고 있어! 🚀" },
};
const FRIEND_NAMES = { "원": 1, "투": 2, "쓰리": 3, "포": 4, "파이브": 5, "식스": 6, "세븐": 7, "에이트": 8, "나인": 9, "텐": 10 };
// "포는 누구야"의 포는 친구 이름이지만 "포도"의 포는 아니에요: 이름 바로 뒤에 오는 말로 가려요
function friendIn(n, skipOne) {
  return Object.keys(FRIEND_NAMES).find((k) => !(skipOne && k === "원") &&
    new RegExp(k + "(은|는|이|가|야|랑|이랑|하고|한테|의|누구|소개|이야기|얘기|에대해|요즘|오늘|뭐|$)").test(n)) || null;
}

// ---------- 수 읽기 ----------
const NATIVE = [["열", 10], ["아홉", 9], ["여덟", 8], ["일곱", 7], ["여섯", 6], ["다섯", 5], ["넷", 4], ["네", 4], ["셋", 3], ["세", 3], ["둘", 2], ["두", 2], ["하나", 1], ["한", 1], ["영", 0]];
const SINO = { "영": 0, "공": 0, "일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9, "십": 10 };
// "5", "다섯", "다섯 개", "오" 같은 대답에서 수를 찾아요
function parseNum(t) {
  const n = norm(t);
  const d = n.match(/\d+/);
  if (d) return Number(d[0]);
  const f = friendIn(n);
  if (f) return FRIEND_NAMES[f];
  for (const [w, v] of NATIVE) if (n.startsWith(w)) return v;
  const s = n.replace(/(개|야|요|이야|입니다|이에요)$/, "");
  if (s.length === 1 && s in SINO) return SINO[s];
  return null;
}

// ---------- 정해 둔 대답 ----------
// keys 중 하나가 들어 있으면(띄어쓰기 무시) replies 중 하나를 골라요. 위에 있을수록 먼저 봐요.
// ask: 원이 되물었을 때 아이의 다음 말을 어떻게 받을지("day": 하루 이야기, "chat": 그 밖의 이야기)
const TOPICS = [
  { id: "real", keys: ["진짜야", "진짜원", "로봇", "컴퓨터", "인공지능", "사람이야"], replies: [
    "나는 원 흉내를 내는 앱 친구야! 정해진 말만 할 수 있지만 같이 놀면 재밌을 거야! ☝️",
  ] },
  { id: "bye", keys: ["잘가", "또봐", "바이바이", "안녕히", "갈게", "이제끝"], replies: [
    "잘 가! 또 놀러 와! 하나, 둘, 안녕! 👋", "오늘 정말 재밌었어! 다음에 또 만나자!",
  ], act: "wave" },
  { id: "how", keys: ["어떻게지내", "잘지내", "잘지냈", "요즘어때", "요즘뭐해", "뭐하고지내", "별일없"], replies: [
    "나는 잘 지내! 요즘 친구들이랑 숫자 놀이하느라 엄청 바빠! 너는 요즘 어떻게 지내?",
    "원은 씩씩하게 잘 지내지! 아침마다 해님한테 '하나!' 하고 인사해. 너는 요즘 어때?",
    "요즘 넘버랜드는 아주 신나! 매일 새 친구가 놀러 와. 너는 잘 지내?",
  ], ask: "day" },
  { id: "today", keys: ["오늘하루", "오늘어땠", "오늘뭐했", "오늘은어때", "뭐했어", "뭐했니", "하루어땠"], replies: [
    "오늘 아침에 해님한테 '하나!' 하고 인사했어. 그리고 투랑 노래를 불렀지! 🎵",
    "오늘은 넘버랜드 언덕에서 데굴데굴 굴러 내려왔어! 블록이 하나라서 엄청 빨라! 헤헤",
    "오늘 쓰리가 저글링을 보여 줬는데 공이 다 떨어졌어! 다 같이 깔깔 웃었어 😆",
    "오늘은 포랑 네모 모양 찾기를 했어. 창문도 네모, 책도 네모!",
    "오늘 파이브랑 하이파이브를 백 번 했어! 손바닥이 빨개졌… 아, 원래 빨갛구나! 헤헤",
    "오늘은 비가 와서 물웅덩이에서 첨벙첨벙 놀았어! ☔",
    "오늘 텐이 블록 쌓기 대회를 열었어. 원은 하나라서 금방 끝났지만 응원은 제일 크게 했어!",
    "오늘은 조금 졸려서 낮잠을 잤어. 꿈에서 숫자 별을 하나 땄어! ⭐",
  ], then: "너는 오늘 하루 어땠어?", ask: "day" },
  { id: "hi", keys: ["안녕", "하이", "반가", "hello"], replies: [
    "안녕! 나는 원이야! 하나, 하나, 나는 하나! ☝️", "반가워! 오늘은 뭐 하고 놀까?", "안녕안녕! 원이 손 흔들고 있어! 👋",
  ], act: "wave" },
  { id: "love", keys: ["사랑해", "좋아해", "최고야", "멋져", "귀여"], replies: [
    "헤헤, 나도 네가 좋아! 너는 하나뿐인 내 친구야! ❤️", "우와, 고마워! 원 얼굴이 더 빨개졌어! ☺️",
  ], act: "jump" },
  { id: "thanks", keys: ["고마워", "고맙", "감사"], replies: ["천만에! 원은 너랑 있는 게 좋아!", "언제든지! 원은 늘 네 편이야! ❤️"] },
  { id: "sorry", keys: ["미안"], replies: ["괜찮아! 우리는 친구잖아. 다시 신나게 놀자!"] },
  { id: "bestie", keys: ["제일친한", "단짝", "베프", "친한친구"], replies: ["다 좋지만 투랑 제일 자주 놀아! 원 둘이 모이면 투가 되거든!"], then: "너는 단짝 친구 있어?", ask: "chat" },
  { id: "name", keys: ["이름", "누구야", "누구니", "넌누구", "너누구"], replies: [
    "나는 원이야! 숫자 1이지. 빨간 블록 하나로 되어 있어!", "내 이름은 원! 하나, 하나, 나는 하나!",
  ] },
  { id: "age", keys: ["몇살", "나이"], replies: ["나는 숫자 1이니까… 한 살이라고 할까? 헤헤!"], then: "너는 몇 살이야?", ask: "chat" },
  { id: "feel", keys: ["기분"], replies: ["나는 너랑 이야기해서 기분 최고야!"], then: "너는 지금 기분이 어때?", ask: "day" },
  { id: "where", keys: ["어디살", "어디에살", "사는곳", "집이어디", "넘버랜드", "어디있어"], replies: [
    "나는 넘버랜드에 살아! 숫자 친구들이 다 모여 사는 마을이야. 길도 집도 블록으로 되어 있어!",
    "넘버랜드에는 숫자 언덕, 숫자 공원, 숫자 바다가 있어! 원의 집은 작은 네모 집이야. 하나라서 딱 맞아!",
  ] },
  { id: "morning", keys: ["아침"], replies: ["아침에 일어나면 해님한테 '하나!' 하고 인사해. 그리고 기지개를 쭉~ 펴!"], then: "너는 아침에 뭐 먹었어?", ask: "chat" },
  { id: "night", keys: ["밤에", "저녁"], replies: ["밤에는 별을 세다가 잠들어. 하나, 하나, 또 하나… 쿨쿨 💤"] },
  { id: "weekend", keys: ["주말", "쉬는날", "방학", "소풍"], replies: ["쉬는 날엔 친구들이랑 넘버랜드 공원으로 소풍 가! 숫자 모양 김밥도 먹어! 🍙"], then: "너는 쉬는 날에 뭐 하는 게 좋아?", ask: "chat" },
  { id: "school", keys: ["학교", "유치원", "선생님"], replies: ["넘버랜드에는 숫자 놀이 학교가 있어! 원은 거기서 '세기 반장'이야!"], then: "너는 학교에서 뭐가 제일 좋아?", ask: "chat" },
  { id: "family", keys: ["가족"], replies: ["넘버블럭스 친구들이 다 가족 같아! 모이면 더 큰 숫자가 되거든!"], then: "너는 가족이랑 뭐 하는 게 제일 좋아?", ask: "chat" },
  { id: "dream", keys: ["꿈이뭐", "커서", "되고싶", "장래희망"], replies: ["나는 밤하늘의 1등 별처럼 반짝이는 원이 되고 싶어! ⭐"], then: "너는 커서 뭐가 되고 싶어?", ask: "chat" },
  { id: "birthday", keys: ["생일"], replies: ["원의 생일엔 케이크에 초를 딱 하나만 꽂아! 후~ 하면 끝! 🎂"], then: "너는 생일에 뭐 하고 싶어?", ask: "chat" },
  { id: "weather", keys: ["날씨", "비와", "눈와", "더워", "추워"], replies: ["날씨가 어떻든 원은 씩씩해! 비 오면 첨벙, 눈 오면 데굴데굴!"], then: "오늘 날씨는 어때?", ask: "chat" },
  { id: "hobby", keys: ["취미", "뭐하고놀", "뭐하는거좋"], replies: ["나는 데굴데굴 구르기, 노래하기, 하나인 거 찾기가 좋아!"], then: "너는 뭐 하고 노는 게 좋아?", ask: "chat" },
  { id: "fav", keys: ["좋아하는", "뭐좋아", "제일좋"], replies: [
    "나는 하나인 걸 좋아해! 해 하나, 달 하나, 코 하나! ☀️", "나는 친구들이랑 합쳐지는 게 좋아! 원이랑 원이 만나면 투가 되거든!",
  ], then: "너는 뭐 좋아해?", ask: "chat" },
  { id: "color", keys: ["색깔", "무슨색", "빨간"], replies: ["나는 빨간색! 사과처럼, 소방차처럼 빨개! 🍎"], then: "너는 무슨 색이 좋아?", ask: "chat" },
  { id: "food", keys: ["배고", "먹", "간식", "밥"], replies: ["나는 사과 하나면 충분해! 🍎"], then: "너는 뭐 먹는 거 좋아해?", ask: "chat" },
  { id: "sleep", keys: ["졸려", "잘자", "잘게", "자야"], replies: ["잘 자! 별 하나, 달 하나, 그리고 원 하나! 좋은 꿈 꿔! 🌙"] },
  { id: "song", keys: ["노래"], replies: [
    "🎵 하나, 하나, 나는 하나~ 빨간 블록 하나~ 혼자여도 신나지~ 나는 원이야! 🎵",
    "🎵 원 더하기 원은 투~ 투 더하기 원은 쓰리~ 하나씩 더하면 계속 커지지~ 🎵",
  ], act: "jump" },
  { id: "joke", keys: ["웃긴", "농담", "재밌는얘기", "재미있는얘기", "재밌는이야기", "재미있는이야기"], replies: [
    "숫자 6이 왜 7을 무서워할까? 7이 뭐든 다 먹어 버리거든! 헤헤 😆",
    "원이 거울을 보면 몇 명일까? 그래도 원! 하나뿐이거든! 😄",
    "블록들이 제일 좋아하는 운동은? 쌓기 운동! 😆",
    "투가 신발 가게에 가면 몇 짝 살까? 당연히 두 짝! 짝꿍이니까! 👟👟",
  ], act: "jump" },
];

const FALLBACK = [
  "음~ 그건 원이 잘 모르겠어! 대신 같이 놀래? 끝말잇기, 가위바위보, 숨은 원 찾기가 있어! ☝️",
  "우와, 그렇구나! 원은 숫자 놀이를 제일 잘해. 같이 해 볼래?",
  "헤헤, 원은 아직 그 말은 몰라! 아래 버튼을 눌러서 같이 놀자!",
];

// ---------- 아이 마음 읽기 (위로) ----------
// 힘든 이야기는 다른 무엇보다 먼저 들어요. first: 처음 들었을 때, 그 뒤 두 번까지 더 들어 줘요.
const HARD = [
  { id: "danger", keys: ["때렸", "때려", "맞았", "괴롭", "따돌", "왕따", "죽고싶", "죽을래", "사라지고싶", "아무도날", "다날싫어", "만졌", "비밀로하래"], first: [
    "말해 줘서 정말 고마워. 그건 혼자 참으면 안 되는 일이야. 지금 바로 엄마 아빠나 선생님께 꼭 말하자. 어른들이 너를 지켜 줄 거야. 원도 늘 네 편이야. ❤️",
  ], follow: [
    "네 잘못이 아니야. 꼭 엄마 아빠나 선생님께 말하기, 원이랑 약속! ☝️",
    "원은 네가 정말 소중해. 믿을 수 있는 어른께 꼭 이야기해 줘. 그러면 도와주실 거야.",
  ] },
  { id: "friend", keys: ["싸웠", "싸워", "놀려", "놀렸", "놀림", "안놀아", "절교", "삐졌", "친구가미워", "친구가싫"], first: [
    "친구랑 그런 일이 있었구나. 많이 속상했겠다. 무슨 일이 있었는지 원한테 이야기해 줄래?",
    "아이고, 마음이 아팠겠다. 원이 꼭 안아 줄게. 어떻게 된 거야?",
  ], follow: [
    "그랬구나. 그럴 땐 '나 그거 속상했어' 하고 말해 보는 것도 좋아. 친구도 몰랐을 수 있거든.",
    "원도 투랑 다툰 적 있어. 그런데 '미안해', '괜찮아' 하고 나니까 다시 짝꿍이 됐어!",
  ] },
  { id: "scolded", keys: ["혼났", "혼나", "혼내", "꾸중", "야단"], first: [
    "혼나서 속상했구나. 혼나도 엄마 아빠는 너를 정말정말 사랑해! 무슨 일이 있었어?",
    "그랬구나… 원도 실수해서 혼난 적 있어. 무슨 일이었어?",
  ], follow: [
    "실수는 누구나 해! 다음에 조금씩 고치면 돼. 원은 네가 멋진 아이인 걸 알아.",
    "엄마 아빠한테 '속상했어요' 하고 말하고 꼭 안아 달라고 해 봐. 마음이 금방 풀릴 거야.",
  ] },
  { id: "study", keys: ["어려워", "어렵", "못하겠", "숙제", "공부", "시험", "받아쓰기", "틀렸", "못했"], first: [
    "어려운 걸 하느라 정말 애썼구나! 어려운 건 천천히, 하나씩 하면 돼. 원도 하나부터 시작하거든! 뭐가 제일 어려웠어?",
    "틀려도 괜찮아! 틀리면서 배우는 거야. 원은 네가 열심히 하는 게 제일 멋져! 어떤 게 어려웠어?",
  ], follow: [
    "그건 정말 어려울 수 있어. 모를 땐 엄마 아빠나 선생님께 '도와주세요' 하고 말해도 돼. 그것도 용감한 거야!",
    "한 번에 다 하지 않아도 돼. 하나 하고, 쉬고, 또 하나! 원처럼 하나씩!",
  ] },
  { id: "sick", keys: ["아파", "아프", "다쳤", "다쳐", "감기", "열나", "넘어졌"], first: [
    "아이고, 아프구나! 꼭 엄마 아빠한테 말하고 푹 쉬어야 해. 원이 '호~' 해 줄게!",
    "다쳤구나… 많이 아팠겠다. 어른한테 꼭 보여 드리자! 지금은 좀 괜찮아?",
  ], follow: [
    "따뜻한 물 마시고 푹 자면 금방 나을 거야. 원이 옆에서 응원할게! 💪",
    "아플 땐 쉬는 게 제일 중요해. 다 나으면 원이랑 신나게 놀자!",
  ] },
  { id: "lonely", keys: ["외로", "혼자야", "혼자있", "같이놀친구가없", "친구가없"], first: [
    "혼자라서 외로웠구나. 지금은 원이 같이 있어! 원이랑 이야기하자. ☝️",
  ], follow: [
    "원도 하나라서 외로울 때가 있어. 그럴 땐 먼저 '같이 놀자!' 하고 말해 봐. 친구도 기다리고 있을지 몰라!",
    "엄마 아빠한테 '나랑 놀아 줘!' 하고 말해 보는 것도 좋아. 같이 놀면 훨씬 신나!",
  ] },
  { id: "angry", keys: ["화나", "화났", "짜증", "열받"], first: [
    "화가 많이 났구나. 화날 땐 원이랑 같이 숨을 크게 쉬어 보자. 하나… 둘… 셋… 후~ 무슨 일 때문에 화가 났어?",
  ], follow: [
    "그럴 만했네! 화가 나는 건 이상한 게 아니야. 그냥 물건을 던지거나 친구를 때리지만 않으면 돼.",
    "화난 마음을 말로 잘 이야기했어! 엄마 아빠한테도 이렇게 말해 보면 좋겠다.",
  ] },
  { id: "scared", keys: ["무서", "무섭", "겁나"], first: [
    "무서웠구나. 무서울 땐 엄마 아빠 곁에 꼭 붙어 있자. 원도 같이 있어 줄게! 뭐가 무서웠어?",
  ], follow: [
    "무서운 마음은 엄마 아빠한테 말하면 반으로 줄어들어! 꼭 말해 봐.",
    "원이랑 같이 용감 주문 외워 보자! '하나, 둘, 셋, 나는 용감해!' ✨",
  ] },
  { id: "sad", keys: ["슬퍼", "슬프", "슬펐", "속상", "울었", "울고", "눈물", "우울", "서운"], first: [
    "슬펐구나… 원이 꼭 안아 줄게. 슬플 땐 울어도 괜찮아. 무슨 일이 있었는지 말해 줄래?",
    "속상했구나. 원한테 이야기해 줘서 고마워. 무슨 일이 있었어?",
  ], follow: [
    "그랬구나. 그런 일이 있으면 누구라도 슬플 거야. 엄마 아빠한테도 이야기하고 꼭 안아 달라고 해 봐.",
    "말해 줘서 정말 고마워. 네 마음은 하나도 이상하지 않아. 원은 늘 네 편이야. ❤️",
  ] },
  { id: "tired", keys: ["힘들", "지쳐", "피곤"], first: [
    "많이 힘들었구나. 오늘 정말 애썼어! 잠깐 쉬어도 괜찮아. 뭐가 힘들었어?",
  ], follow: [
    "그랬구나. 힘들 땐 쉬어도 돼. 따뜻한 물 한 잔 마시고 엄마 아빠한테 꼭 안아 달라고 해 봐.",
    "너는 정말 열심히 했어! 원은 네가 자랑스러워. ❤️",
  ] },
];
const NOT_HARD = /안(힘들|슬|무서|아파|아프|속상|외로|짜증|어려)|(힘들|슬프|무섭|아프|어렵)지않|괜찮|나아졌|다나았/;
const GOOD = /좋았|좋아|재밌|재미있|신났|신나|행복|최고|기뻐|기뻤|칭찬|잘했|맛있|웃겼|즐거/;
const UNKNOWN = /^(몰라|모르겠|없어|없는데|글쎄|음+$)/;

function hardOf(n) {
  n = n.replace(/아파트/g, "");
  if (NOT_HARD.test(n)) return null;
  const h = HARD.find((x) => has(n, x.keys)) || null;
  // "공부했는데 재밌었어"처럼 즐거운 이야기면 위로하지 않아요(위험한 이야기는 빼고)
  if (h && h.id !== "danger" && GOOD.test(n) && !/(안|못)(좋|재밌|재미있|신나)/.test(n)) return null;
  return h;
}

// ---------- 지금 하고 있는 것 ----------
let game = null;   // 놀이 중일 때: {type: "quiz" | "find" | "chain" | "rps" | "hide", ...}
let expect = null; // 원이 물어본 뒤: {type: "day" | "chat"} 또는 {type: "comfort", hard, n}

function resetBrain() { game = null; expect = null; }

// ---------- 놀이: 숫자 퀴즈 ----------
function newQuestion() {
  const kind = pick(["count", "add", "add", "sub"], "qkind");
  if (kind === "count") {
    const n = rand(1, 10);
    return { answer: n, text: `블록이 몇 개일까?\n${blocks(n)}` };
  }
  if (kind === "add") {
    const a = rand(1, 5), b = rand(1, 5);
    return { answer: a + b, text: `${a} 더하기 ${josa(b, "은", "는")} 뭘까?\n${blocks(a)} + ${blocks(b)}` };
  }
  const a = rand(3, 10), b = rand(1, a - 1);
  return { answer: a - b, text: `${a} 빼기 ${josa(b, "은", "는")} 뭘까?\n블록 ${a}개에서 ${b}개가 톡 떨어졌어!\n${blocks(a)}` };
}
function startQuiz() {
  game = { type: "quiz", round: 1, score: 0, tries: 0, q: newQuestion() };
  return ["좋아, 숫자 퀴즈 시작! 모두 5문제야. 아래 버튼을 눌러도 되고 말로 해도 돼!", `1번 문제! ${game.q.text}`];
}
function quizTurn(t) {
  const n = parseNum(t);
  const q = game.q;
  if (n === null) return [`숫자로 대답해 줘! ${q.text}`];
  const out = [];
  if (n === q.answer) {
    game.score++;
    out.push(pick([`딩동댕! ${q.answer}! 정말 잘했어! 🎉`, `맞았어! 정답은 ${q.answer}! 최고야! ⭐`, `우와, ${q.answer} 정답! 원이 신나서 점프했어!`], "right"));
    act("jump");
  } else if (game.tries === 0) {
    game.tries = 1;
    return [pick(["음~ 아까워! 블록을 하나씩 손가락으로 세어 볼까? 다시 한 번!", "거의 다 왔어! 천천히 다시 생각해 봐!"], "wrong")];
  } else {
    out.push(`괜찮아! 정답은 ${josa(q.answer, "이었어", "였어")}. ${blocks(q.answer)} 다음 문제는 꼭 맞힐 수 있어!`);
  }
  if (game.round >= 5) {
    out.push(`퀴즈 끝! 5문제 중에 ${game.score}개 맞혔어! ${game.score >= 4 ? "숫자 박사네! 🏆" : "잘했어! 또 하면 더 잘할 거야! 💪"}`);
    game = null;
    return out;
  }
  game.round++; game.tries = 0; game.q = newQuestion();
  out.push(`${game.round}번 문제! ${game.q.text}`);
  return out;
}

// ---------- 놀이: 하나인 것 찾기 ----------
const ONLY_ONE = {
  "해": "맞아, 해는 하나! 하늘에서 반짝반짝 ☀️", "태양": "맞아, 태양은 하나! ☀️", "달": "맞아, 달도 하나! 밤에 나를 비춰 줘 🌙",
  "코": "맞아, 코는 하나! 킁킁! 👃", "입": "맞아, 입도 하나! 냠냠! 👄", "배꼽": "배꼽도 하나! 헤헤 😆", "머리": "맞아, 머리도 하나!",
  "지구": "맞아, 우리 지구는 하나! 🌍", "나": "맞아! 너는 세상에 하나뿐이야! ❤️", "엄마": "맞아, 우리 엄마는 하나뿐이야! ❤️", "아빠": "맞아, 우리 아빠도 하나뿐이야! ❤️",
  "눈": "어? 너는 눈이 두 개잖아! 하나인 건 내 눈이야! 헤헤 👁️", "귀": "앗, 귀는 두 개야! 양쪽에 하나씩! 그건 투 친구 거야!", "손": "손은 두 개지! 대신 손 하나만 들어 볼까? ✋",
};
function startFind() {
  game = { type: "find", count: 0 };
  return ["하나인 것 찾기 놀이! 세상에 딱 하나만 있는 걸 말해 줘! 예를 들면… 해? 코? ☝️"];
}
function findTurn(t) {
  const n = norm(t);
  const hit = Object.keys(ONLY_ONE).find((k) => n.startsWith(k));
  const out = [hit ? ONLY_ONE[hit] : pick(["우와, 그것도 하나구나! 좋아! ☝️", "오~ 하나 찾았다! 잘했어!", "그렇구나! 하나, 하나, 하나! 👍"], "find")];
  game.count++;
  if (game.count >= 3) {
    out.push("세 개나 찾았어! 너는 하나 찾기 대장이야! 🏅");
    act("jump");
    game = null;
  } else {
    out.push(pick(["또 하나인 거 찾아볼까?", "하나 더 말해 줘!", "다른 것도 있을까?"], "findmore"));
  }
  return out;
}

// ---------- 놀이: 끝말잇기 ----------
// 원이 아는 낱말. 아이가 낸 낱말은 사전에 없어도 받아 줘요(두 글자 이상 한글이면 돼요).
const WORDS = (`가게 가방 가위 가지 가족 가을 가면 가수 간식 갈매기 감자 강물 강아지 개구리 개나리 개미 거미 거북이 거울 거인 겨울 계단 고구마 고래 고무줄 고양이 고추 곰인형 공룡 공원 공주 공책 과일 과자 구두 구름 구멍 구슬 국수 국자 군밤 굴뚝 귀마개 그네 그릇 그림 그림자 금메달 금붕어 기린 기차 기타 김밥 김치 까치 깃발 꼬리 꽃게 꽃밭 꽃병 꿀떡 꿀벌 꿈나라
나라 나무 나비 나팔 낙엽 낙타 날개 날씨 남극 내복 냄비 냇물 냉장고 너구리 네모 넥타이 노래 노을 녹차 놀이터 농구 누나 누룽지 눈사람 눈썹 느낌표 느티나무 늑대
다람쥐 다리 단추 달걀 달력 달팽이 당근 대문 대추 대나무 더하기 데이지 도깨비 도넛 도시락 도토리 독수리 돈가스 돌고래 동물 동생 동화책 돼지 두더지 두루미 두부 드럼 드레스 들판 등대 딸기 떡국 떡볶이 똑딱이
라면 라디오 레몬 로봇 리본
마늘 마당 마술 마을 막대기 만두 말풍선 망치 매미 머리띠 머핀 메달 메뚜기 모기 모래 모자 목걸이 목도리 무릎 무당벌레 무지개 문어 문방구 물감 물개 물고기 미끄럼틀 미소 미역 밀가루
바구니 바나나 바다 바람 바위 바이올린 바지 박물관 박수 박쥐 반딧불 반지 반창고 발가락 발자국 밤송이 밤하늘 방석 방울 방패 배꼽 배낭 배추 백조 버섯 버스 벌레 범고래 베개 벽돌 별님 별사탕 병아리 병원 보름달 보리 보물 보자기 볼펜 봄비 부엉이 부채 부츠 북극곰 북소리 분수 불고기 불꽃 브로콜리 비누 비둘기 비빔밥 비행기 빗자루 빨대 빵가루 빵집 뽀뽀
사과 사다리 사슴 사자 사탕 산딸기 산책 산타 상어 상자 상추 새싹 새우 색종이 생선 생일 서랍 서점 선물 선생님 선풍기 설탕 세수 세탁기 소금 소나기 소방차 소파 소풍 손가락 손수건 손잡이 솜사탕 송편 수건 수박 수영 숟가락 숲속 스케이트 스케치북 스티커 시계 시금치 시소 식빵 식탁 신발 신호등 실내화 실로폰 쌀밥 썰매
아기 아빠 아이스크림 악기 악어 안개 안경 알밤 알사탕 앞치마 애벌레 앵무새 야구 야채 야옹이 약국 양말 양파 어린이 어항 얼굴 얼룩말 얼음 엄마 에어컨 여름 여우 연못 연필 열매 열쇠 영화 예술 오리 오이 오징어 옥수수 올챙이 옷걸이 옷장 와플 요리 요정 요요 용수철 우산 우유 우주 운동장 원숭이 원피스 위성 유리 유자 유치원 의사 의자 이름 이불 이빨 이야기 인어 인형 일기장 일요일 입술 잉어 잎사귀
자동차 자두 자전거 잠옷 잠자리 장갑 장난감 장미 재채기 저금통 저녁 전화기 접시 젓가락 정원 제기 제비 조개 조끼 종이 주머니 주사위 주스 줄넘기 줄자 지구 지도 지렁이 지우개 지팡이 진주 집게
차표 참새 창문 채소 책가방 책상 처마 천둥 천사 철봉 청소 체리 초록 초콜릿 촛불 추석 축구 치마 치약 치즈 치킨 친구 침대
카메라 칼국수 캥거루 커튼 컵케이크 케이크 코끼리 코알라 콩나물 쿠션 쿠키 크레파스 크리스마스 키위
타조 탁구 탈춤 태극기 태양 택시 터널 털모자 테니스 텐트 토끼 토마토 토스트 통조림 튤립 트럭 트럼펫 티셔츠
파도 파랑새 파인애플 판다 팔찌 팝콘 팽이 퍼즐 페인트 펭귄 편지 포도 포크 표범 푸딩 풀밭 풀잎 풍선 풍차 프라이팬 피리 피아노 피자
하늘 하마 학교 할머니 할아버지 해님 해바라기 해적 햄버거 햇살 허수아비 헬리콥터 헬멧 형광펜 호떡 호랑이 호박 호수 화가 화분 회오리 후추 휘파람 휴지`).split(/\s+/).filter(Boolean);
const START_WORDS = ["기차", "사과", "나비", "토끼", "바나나", "우유", "고래", "피아노"];
const IY = [2, 6, 7, 12, 17, 20]; // ㅑ ㅕ ㅖ ㅛ ㅠ ㅣ
// 두음법칙: '리'로 끝나면 '이'로도, '라'로 끝나면 '나'로도 시작할 수 있어요
function startsFor(syl) {
  const p = parts(syl), out = [syl];
  if (p.cho === 5) out.push(compose(IY.includes(p.jung) ? 11 : 2, p.jung, p.jong));
  else if (p.cho === 2 && IY.includes(p.jung)) out.push(compose(11, p.jung, p.jong));
  return out;
}
function chainHint(word) {
  const s = startsFor(word[word.length - 1]);
  return s.length > 1 ? `'${s[0]}'(또는 ${ro(s[1])})` : ro(s[0]);
}
function startChain() {
  const w = pick(START_WORDS, "chainStart");
  game = { type: "chain", used: new Set([w]), last: w, turns: 0 };
  return [`끝말잇기 시작! 원이 먼저 할게. "${w}"! 이제 ${chainHint(w)} 시작하는 말을 해 줘! ☝️`];
}
function chainTurn(t) {
  const n = norm(t);
  if (/모르겠|몰라|졌어|항복|생각안나|못하겠/.test(n)) {
    game = null;
    return ["헤헤, 이번엔 원이 이겼다! 그래도 너 정말 잘했어! 다음엔 네가 이길 거야! 💪"];
  }
  let word = t.replace(/[^가-힣]/g, "");
  if (word.length > 2) word = word.replace(/(이야|이요|입니다|야|요)$/, "");
  if (word.length < 2) return [`두 글자 넘는 말로 해 줘! ${chainHint(game.last)} 시작하는 말!`];
  if (!startsFor(game.last[game.last.length - 1]).includes(word[0])) {
    return [`앗, "${game.last}" 다음이니까 ${chainHint(game.last)} 시작해야 해! 다시 해 볼까?`];
  }
  if (game.used.has(word)) return [`"${word}"는 벌써 나왔어! 다른 말로 해 줘!`];
  game.used.add(word);
  game.turns++;
  const starts = startsFor(word[word.length - 1]);
  const cands = WORDS.filter((w) => starts.includes(w[0]) && !game.used.has(w));
  if (!cands.length || (game.turns >= 5 && Math.random() < 0.25)) {
    game = null;
    act("jump");
    return [`"${word}"! 우와… ${ro(starts[0])} 시작하는 말… 음… 생각이 안 나! 네가 이겼어! 🏆`];
  }
  // 아이가 이어 가기 쉬운 낱말(그 끝 글자로 시작하는 말이 많은 것)을 먼저 골라요
  const easy = cands.filter((c) => { const st = startsFor(c[c.length - 1]); return WORDS.filter((x) => st.includes(x[0])).length >= 3; });
  const w = pick(easy.length ? easy : cands);
  game.used.add(w);
  game.last = w;
  return [`"${word}" 좋아! 👍 그럼 원은… "${w}"! 이번엔 ${chainHint(w)} 시작하는 말!`];
}

// ---------- 놀이: 가위바위보 ----------
const HANDS = ["✌️ 가위", "✊ 바위", "🖐️ 보"];
function startRps() {
  game = { type: "rps", me: 0, one: 0 };
  return ["가위바위보 시작! 먼저 3번 이기면 승리야! 아래에서 골라 줘! ✌️✊🖐️"];
}
function rpsTurn(t) {
  const n = norm(t);
  const picks = [/가위|✌/.test(n), /바위|✊/.test(n), /^보|보자기|🖐|보!?$/.test(n)];
  if (picks.filter(Boolean).length !== 1) return ["가위, 바위, 보 중에 하나만 골라 줘!"];
  const p = picks.indexOf(true), o = rand(0, 2), r = (p - o + 3) % 3;
  const out = [`가위바위보! 원은 ${HANDS[o]}! 너는 ${HANDS[p]}!`];
  if (r === 0) out[0] += "\n비겼다! 한 번 더!";
  else if (r === 1) { game.me++; out[0] += "\n" + pick(["으앙, 원이 졌다!", "우와, 네가 이겼어!", "앗, 원이 졌어! 너 잘한다!"], "rpsLose"); }
  else { game.one++; out[0] += "\n" + pick(["헤헤, 원이 이겼다!", "원 승리! 하나 이겼다! ☝️"], "rpsWin"); act("jump"); }
  out[0] += `  (너 ${game.me} : 원 ${game.one})`;
  if (game.me >= 3) { out.push("축하해! 네가 3번 먼저 이겼어! 가위바위보 대장! 🏆"); act("jump"); game = null; }
  else if (game.one >= 3) { out.push("원이 3번 먼저 이겼어! 하지만 너도 정말 잘했어! 한 판 더 할래?"); game = null; }
  return out;
}

// ---------- 놀이: 숨은 원 찾기 ----------
const HIDE_LEVELS = [{ cols: 2, n: 4 }, { cols: 3, n: 6 }, { cols: 3, n: 9 }];
const HIDE_SPOTS = ["🌳", "🏠", "📦", "🌷", "🪨", "🚗", "🎁", "🛝", "⛺", "🧺", "🌵", "🍄"];
function newBoard() {
  const lv = HIDE_LEVELS[game.level];
  const spots = [...HIDE_SPOTS].sort(() => Math.random() - .5).slice(0, lv.n);
  game.spot = rand(0, lv.n - 1);
  game.spots = spots;
  game.cols = lv.cols;
  game.tries = 0;
  return { board: { cols: lv.cols, spots } };
}
function startHide() {
  game = { type: "hide", level: 0, total: 0, cells: null };
  return ["숨은 원 찾기! 원이 숨을게. 하나, 둘, 셋… 꼭꼭 숨어라! 🙈", "원이 어디에 숨었을까? 그림을 눌러서 찾아 줘!", newBoard()];
}
function hideTurn(cell) {
  if (cell === null) return ["아래 그림에서 원이 숨은 곳을 눌러 봐! 🔍"];
  game.tries++; game.total++;
  const btn = game.cells?.[cell];
  const where = game.spots[cell];
  if (cell === game.spot) {
    if (btn) btn.textContent = "🟥";
    game.cells?.forEach((b) => (b.disabled = true));
    act("jump");
    const out = [pick([`찾았다! 원은 ${where} 뒤에 숨어 있었지롱! 🟥`, `들켰다! ${where} 뒤에 있었어! 헤헤`, `우와, 찾았어! 원은 ${where} 뒤에 있었어!`], "found")];
    game.level++;
    if (game.level >= HIDE_LEVELS.length) {
      out.push(`숨은 원 찾기 끝! 모두 ${game.total}번 만에 다 찾았어! 너는 숨바꼭질 대장! 🏆`);
      game = null;
      return out;
    }
    out.push("이번엔 더 꼭꼭 숨을게! 하나, 둘, 셋… 🙈", newBoard());
    return out;
  }
  if (btn) { btn.textContent = "💨"; btn.disabled = true; }
  const r = (i) => Math.floor(i / game.cols), c = (i) => i % game.cols;
  const hints = [];
  if (r(game.spot) < r(cell)) hints.push("더 위쪽"); if (r(game.spot) > r(cell)) hints.push("더 아래쪽");
  if (c(game.spot) < c(cell)) hints.push("더 왼쪽"); if (c(game.spot) > c(cell)) hints.push("더 오른쪽");
  return [`${where} 뒤에는 없어! 힌트: ${pick(hints)}에 숨었어~`];
}

// ---------- 계산과 친구 이야기 ----------
// "3 더하기 2", "하나 더하기 하나", "5-1" 같은 계산
function tryMath(t) {
  const m = t.replace(/\s+/g, " ").match(/(\S+?)\s*(더하기|\+|빼기|-|−)\s*(\S+)/);
  if (!m) return null;
  const a = parseNum(m[1]), b = parseNum(m[3].replace(/(은|는|이|가)?(뭐야|얼마|몇).*$/, "")), plus = /더하기|\+/.test(m[2]);
  if (a === null || b === null) return null;
  if (!plus && a < b) return [`앗, ${a}에서 ${josa(b, "은", "는")} 아직 뺄 수 없어! 큰 수에서 작은 수를 빼 볼까? 예: ${b} 빼기 ${a}`];
  const r = plus ? a + b : a - b;
  if (a > 20 || b > 20) return [`우와, 큰 수다! 답은 ${josa(r, "이야", "야")}! 원은 작은 수가 더 좋지만 계산은 잘해! 😄`];
  if (r === 0) return [`${a} 빼기 ${josa(b, "은", "는")} 0! 블록이 하나도 안 남았어! 텅~`];
  const pic = plus ? `${blocks(a)} + ${blocks(b)}` : `${blocks(a)} 에서 ${b}개 톡!`;
  const who = FRIENDS[r] ? ` 바로 ${josa(FRIENDS[r].name, "이", "가")} 되는 거야!` : "";
  return [`${pic}\n${plus ? "합치면" : "남은 건"} 블록 ${r}개! 그러니까 ${josa(r, "이야", "야")}!${who}`];
}

const factTurn = {};
function friendTalk(n) {
  const name = friendIn(n, true);
  if (/제일친한|단짝|베프|친한친구/.test(n) && !name) return null;
  if (/친구/.test(n) && !/[0-9]/.test(n) && !name) {
    return ["내 친구들은 넘버블럭스야! 투, 쓰리, 포, 파이브… 텐까지 있어! 누가 궁금해? 이름이나 숫자를 말해 줘!"];
  }
  const digit = n.match(/^(\d+)(이|은|는|가)?(누구|뭐|궁금)?/);
  const num = name ? FRIEND_NAMES[name] : digit ? Number(digit[1]) : null;
  if (num === null) return null;
  const f = FRIENDS[num];
  if (!f) return [`${num}! 그건 블록 ${num}개짜리 큰 친구야! 원이 ${num}번 모이면 될 수 있어!`];
  if (/놀|같이/.test(n)) return [f.play];
  if (/뭐해|뭐하|요즘|오늘|지내/.test(n)) return [f.now];
  const i = factTurn[num] = ((factTurn[num] ?? -1) + 1) % f.facts.length;
  const out = [f.facts[i]];
  if (num !== 1 && i === 0 && f.facts.length > 1) out.push(`${josa(f.name, "이", "가")} 더 궁금하면 또 물어봐! 😄`);
  return out;
}

// ---------- 원이 물어본 뒤 아이 대답 받기 ----------
function answerExpect(n) {
  const e = expect;
  expect = null;
  if (e.type === "comfort") {
    if (/고마|고맙/.test(n)) return ["천만에! 원은 늘 네 편이야. 언제든 이야기해 줘! ❤️ 이제 같이 놀까?"];
    if (NOT_HARD.test(n) || GOOD.test(n)) return ["다행이다! 네가 괜찮다니까 원도 기뻐! ❤️ 이제 같이 놀까?"];
    const line = e.hard.follow[Math.min(e.n, e.hard.follow.length - 1)];
    if (e.n + 1 < e.hard.follow.length) { expect = { type: "comfort", hard: e.hard, n: e.n + 1 }; return [line]; }
    return [line, "원이 기분 좋아지는 놀이 해 줄까? 가위바위보나 노래 어때? ☝️"];
  }
  if (UNKNOWN.test(n)) return ["괜찮아! 그럼 원이랑 재밌는 놀이 할래? 아래에서 골라 봐!"];
  if (/^그냥|보통|그저그래/.test(n)) return ["그렇구나! 그냥 그런 날도 있지. 원이랑 놀면 신나질 거야! 뭐 하고 놀까?"];
  if (GOOD.test(n) && !/안좋|별로|싫/.test(n)) {
    act("jump");
    if (e.type === "day") { expect = { type: "chat" }; return [pick(["우와, 정말 좋았겠다! 원도 신나! 🎉 제일 재밌었던 게 뭐야?", "듣기만 해도 기분이 좋아져! 뭐가 제일 좋았어?"], "dayGood")]; }
    return [pick(["우와 멋지다! 원도 같이 하고 싶어!", "듣기만 해도 기분이 좋아져! 헤헤", "최고다! 원한테 알려 줘서 고마워! ☝️"], "chatGood")];
  }
  if (/안좋|별로|싫|나빴/.test(n)) {
    expect = { type: "comfort", hard: HARD.find((h) => h.id === "sad"), n: 0 };
    return ["그랬구나… 별로였구나. 무슨 일이 있었는지 원한테 이야기해 줄래?"];
  }
  if (e.type === "day") { expect = { type: "chat" }; return [pick(["그랬구나! 그래서 어땠어? 재밌었어?", "오~ 그랬구나! 더 이야기해 줘!"], "dayMid")]; }
  return [pick(["그렇구나! 원한테 알려 줘서 고마워! ☝️", "오~ 정말? 원은 처음 알았어!", "멋지다! 원도 해 보고 싶어!", "우와, 그렇구나! 너는 정말 재밌는 친구야!"], "chatMid")];
}

// ---------- 원의 대답 고르기 ----------
function reply(t, cell = null) {
  const n = norm(t);
  // 1. 놀이 그만하기, 놀이 시작하기
  if (game && /그만|안할래|멈춰|다른거/.test(n)) { game = null; return ["알겠어! 놀이 끝! 다른 거 하고 싶으면 말해 줘! ☝️"]; }
  if (/끝말/.test(n) && game?.type !== "chain") { expect = null; return startChain(); }
  if (/가위바위보/.test(n) && game?.type !== "rps") { expect = null; return startRps(); }
  if (/숨은원|숨어있는원|숨바꼭질|원찾기|원을찾/.test(n) && game?.type !== "hide") { expect = null; return startHide(); }
  if (/퀴즈|문제내|세기놀이/.test(n) && game?.type !== "quiz") { expect = null; return startQuiz(); }
  if (/하나인것|하나찾기/.test(n) && game?.type !== "find") { expect = null; return startFind(); }
  // 2. 놀이 중
  if (game?.type === "hide") return hideTurn(cell);
  if (game?.type === "quiz") return quizTurn(t);
  if (game?.type === "find") return findTurn(t);
  if (game?.type === "chain") return chainTurn(t);
  if (game?.type === "rps") return rpsTurn(t);
  // 3. 힘든 이야기는 무엇보다 먼저 들어 줘요
  const hard = hardOf(n);
  // 위로하는 중에 이어서 하는 힘든 이야기는 처음부터 다시 묻지 않고 계속 들어 줘요(위험한 이야기는 바로 받아요)
  if (hard && expect?.type === "comfort" && (hard.id !== "danger" || expect.hard.id === "danger")) return answerExpect(n);
  if (hard) {
    expect = { type: "comfort", hard, n: 0 };
    return [pick(hard.first, "hard-" + hard.id)];
  }
  // 4. 원이 물어본 것에 대한 대답 (아이가 되묻는 말이면 그냥 넘어가요)
  if (expect) {
    if (/\?/.test(t) || /(니|냐|뭐야|누구야|해줘|불러줘|하자|할래|알려줘)$/.test(n)) expect = null;
    else return answerExpect(n);
  }
  // 5. 계산, 친구, 정해 둔 대답
  const math = tryMath(t);
  if (math) return math;
  const friend = friendTalk(n);
  if (friend) return friend;
  if (/놀자|놀이|게임|심심/.test(n)) return ["좋아! 끝말잇기, 가위바위보, 숨은 원 찾기, 숫자 퀴즈 중에 뭐 할래? 아래 버튼을 눌러 봐!"];
  for (const tp of TOPICS) {
    if (has(n, tp.keys)) {
      if (tp.act) act(tp.act);
      if (tp.ask) expect = { type: tp.ask };
      const out = [pick(tp.replies, tp.id)];
      if (tp.then) out.push(tp.then);
      return out;
    }
  }
  if (GOOD.test(n) && !/안좋|별로|싫/.test(n)) return [pick(["우와, 좋았겠다! 원도 기분이 좋아져! 😄", "최고다! 원한테 알려 줘서 고마워! ☝️"], "chatGood")];
  return [pick(FALLBACK, "fallback")];
}

// ---------- 아래 버튼 ----------
const CHIPS = ["어떻게 지내?", "오늘 뭐 했어?", "친구들 이야기 해 줘", "끝말잇기 하자", "가위바위보 하자", "숨은 원 찾기", "숫자 퀴즈 하자", "하나인 것 찾기", "노래 불러 줘", "웃긴 이야기 해 줘"];
// [{label, big}] big: 크게 보이는 답 버튼
function chipsNow() {
  const plain = (list) => list.map((label) => ({ label }));
  if (game?.type === "quiz") {
    const a = game.q.answer, opts = new Set([a]);
    while (opts.size < 3) { const o = a + rand(-3, 3); if (o >= 0 && o <= 12) opts.add(o); }
    return [...opts].sort((x, y) => x - y).map((o) => ({ label: String(o), big: true })).concat({ label: "그만할래" });
  }
  if (game?.type === "find") return plain(["해", "달", "코", "지구", "그만할래"]);
  if (game?.type === "rps") return HANDS.map((h) => ({ label: h, big: true })).concat({ label: "그만할래" });
  if (game?.type === "chain") return plain(["모르겠어", "그만할래"]);
  if (game?.type === "hide") return plain(["그만할래"]);
  if (expect?.type === "comfort") return plain(["고마워 원", "이제 괜찮아", "가위바위보 하자", "노래 불러 줘"]);
  if (expect) return plain(["좋았어!", "그냥 그랬어", "별로였어", "몰라"]).concat(plain(CHIPS));
  return plain(CHIPS);
}
