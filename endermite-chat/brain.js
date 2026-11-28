// 엔더마이트와 대화하기: 엔더마이트의 말과 놀이
// 엔더마이트는 AI가 아니에요. 이 파일에 정해 둔 말과 놀이로만 대답하고, 아무 데도 연결하지 않아요.
// 화면(index.html)은 reply(글, 누른칸)으로 대답 줄들을 받고, chipsNow()로 아래 버튼들을 받아요.
// 대답 줄은 글(string)이거나, 숨은 엔더마이트 찾기 판({board})이에요.
// 놀이 짜임(끝말잇기·가위바위보·숨바꼭질·위로)은 numberblocks/one-chat/brain.js와 같아요.

// ---------- 도우미 ----------
const lastPick = {};
function pick(list, key) {
  let i = Math.floor(Math.random() * list.length);
  if (key && list.length > 1 && i === lastPick[key]) i = (i + 1) % list.length;
  if (key) lastPick[key] = i;
  return list[i];
}
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const blocks = (n) => "🟪".repeat(n);
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

// ---------- 마인크래프트 친구들 ----------
const MOBS = {
  "엔더맨": { facts: [
    "엔더맨은 키가 아주 크고 까만 몹이야. 블록을 하나 들고 다니면서 이리저리 옮겨!",
    "엔더맨은 휙휙 순간이동을 해! 그리고 물을 엄청 싫어해. 비가 오면 피해 다녀 ☔",
    "솔직히 말하면… 엔더맨은 나를 보면 쫓아와! 그래서 나는 숨바꼭질 선수가 됐어. 꼬물꼬물 슝~",
  ], play: "엔더맨이랑은 숨바꼭질! 엔더맨이 술래면 나는 엄청 빨리 숨어!" },
  "엔더드래곤": { facts: [
    "엔더 드래곤은 엔드 하늘을 빙빙 나는 커다란 용이야. 엔드 수정 기둥이 힘을 줘!",
    "엔더 드래곤을 물리치면 엔드에 커다란 드래곤 알이 생겨. 엄청 귀한 거야! 🥚",
  ], play: "엔더 드래곤은 너무 커서 나는 멀리서 구경만 해! 헤헤" },
  "셜커": { facts: [
    "셜커는 엔드 시티에 사는 상자 같은 몹이야. 껍데기를 열었다 닫았다 해!",
    "셜커 껍데기 두 개로 셜커 상자를 만들 수 있어. 물건을 잔뜩 넣고 들고 다닐 수 있지! 📦",
  ], play: "셜커랑은 '열었다 닫았다' 놀이! 빼꼼~ 쏙!" },
  "크리퍼": { facts: [
    "크리퍼는 초록색 몹이야. 가까이 오면 쉬익~ 소리를 내니까 그 소리가 나면 얼른 피해야 해!",
    "크리퍼는 고양이를 무서워해! 집에 고양이를 키우면 크리퍼가 가까이 안 와 🐱",
  ], play: "크리퍼랑은… 음, 멀리 떨어져서 노는 게 좋겠어! 쉬익 소리 나면 도망!" },
  "주민": { facts: [
    "주민은 마을에 사는 친구야. '흠~' 하는 소리를 내! 에메랄드로 물건을 바꿔 줘 💚",
    "주민마다 하는 일이 달라! 농부, 사서, 대장장이… 일자리 블록을 보면 일을 정해.",
  ], play: "주민이랑은 시장 놀이! 에메랄드 하나에 빵 하나!" },
  "꿀벌": { facts: [
    "꿀벌은 꽃에서 꽃가루를 모아서 벌집에 꿀을 만들어! 🐝 붕붕~",
    "벌집 밑에 모닥불을 두면 연기 때문에 벌들이 차분해져. 그때 유리병으로 꿀을 받을 수 있어! 🍯",
    "꿀벌은 꽃가루를 묻히고 날아다니면서 농작물을 쑥쑥 자라게 도와줘!",
  ], play: "꿀벌이랑은 꽃 찾기 놀이! 꽃 하나 찾을 때마다 붕붕~ 🌼" },
  "철골렘": { facts: [
    "철 골렘은 마을을 지키는 커다란 친구야. 철 블록 네 개에 조각한 호박을 올려서 만들 수 있어!",
    "철 골렘은 가끔 마을 아이에게 양귀비 꽃을 건네줘. 다정하지? 🌹",
  ], play: "철 골렘이랑은 마을 순찰 놀이! 하나, 둘! 하나, 둘!" },
  "스티브": { facts: [
    "스티브랑 알렉스는 마인크래프트를 하는 사람의 기본 모습이야. 블록을 캐고 쌓고 집을 지어!",
  ], play: "스티브랑 알렉스는 건축 대장! 나는 옆에서 블록을 응원해!" },
};
const MOB_NAMES = { "엔더맨": "엔더맨", "엔더드래곤": "엔더드래곤", "드래곤": "엔더드래곤", "셜커": "셜커", "크리퍼": "크리퍼",
  "주민": "주민", "꿀벌": "꿀벌", "벌": "꿀벌", "철골렘": "철골렘", "골렘": "철골렘", "스티브": "스티브", "알렉스": "스티브" };
function mobIn(n) {
  const k = Object.keys(MOB_NAMES).sort((a, b) => b.length - a.length).find((name) => n.includes(name) && !(name === "벌" && /벌써|벌레|벌집|벌칙/.test(n)));
  return k ? MOB_NAMES[k] : null;
}

// ---------- 수 읽기 ----------
const NATIVE = [["열", 10], ["아홉", 9], ["여덟", 8], ["일곱", 7], ["여섯", 6], ["다섯", 5], ["넷", 4], ["네", 4], ["셋", 3], ["세", 3], ["둘", 2], ["두", 2], ["하나", 1], ["한", 1], ["영", 0]];
const SINO = { "영": 0, "공": 0, "일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9, "십": 10 };
function parseNum(t) {
  const n = norm(t);
  const d = n.match(/\d+/);
  if (d) return Number(d[0]);
  for (const [w, v] of NATIVE) if (n.startsWith(w)) return v;
  const s = n.replace(/(개|야|요|이야|입니다|이에요)$/, "");
  if (s.length === 1 && s in SINO) return SINO[s];
  return null;
}

// ---------- 정해 둔 대답 ----------
// keys 중 하나가 들어 있으면(띄어쓰기 무시) replies 중 하나를 골라요. 위에 있을수록 먼저 봐요.
// ask: 엔더마이트가 되물었을 때 아이의 다음 말을 어떻게 받을지("day": 하루 이야기, "chat": 그 밖의 이야기)
const TOPICS = [
  { id: "real", keys: ["진짜야", "진짜엔더", "로봇", "컴퓨터", "인공지능", "사람이야"], replies: [
    "나는 엔더마이트 흉내를 내는 앱 친구야! 정해진 말만 할 수 있지만 같이 놀면 재밌을 거야! 💜",
  ] },
  { id: "bye", keys: ["잘가", "또봐", "바이바이", "안녕히", "갈게", "이제끝"], replies: [
    "잘 가! 또 놀러 와! 꼬물꼬물 안녕~ 👋", "오늘 정말 재밌었어! 다음에 또 만나자! 💜",
  ], act: "wave" },
  { id: "how", keys: ["어떻게지내", "잘지내", "잘지냈", "요즘어때", "요즘뭐해", "뭐하고지내", "별일없"], replies: [
    "나는 잘 지내! 요즘 엔드 스톤 위를 꼬물꼬물 기어 다니느라 바빠! 너는 요즘 어떻게 지내?",
    "엔더마이트는 씩씩하게 잘 지내지! 엔더맨 눈에 안 띄게 살금살금~ 헤헤. 너는 요즘 어때?",
    "요즘 엔드 시티 구경을 다니고 있어. 보라색 블록이 반짝반짝! 너는 잘 지내?",
  ], ask: "day" },
  { id: "today", keys: ["오늘하루", "오늘어땠", "오늘뭐했", "오늘은어때", "뭐했어", "뭐했니", "하루어땠"], replies: [
    "오늘 누가 엔더 진주를 휙 던졌는데, 거기서 내가 톡 튀어나왔어! 치직! 😆",
    "오늘은 엔드 스톤 위에서 꼬물꼬물 달리기 연습을 했어. 어제보다 빨라졌어!",
    "오늘 셜커가 껍데기를 빼꼼 열고 인사해 줬어. 빼꼼~ 쏙!",
    "오늘 엔더맨이 블록을 들고 지나갔는데, 나는 얼른 블록 뒤에 숨었지! 휴~",
    "오늘은 코러스 열매를 냠냠 구경했어. 보라색이라 나랑 잘 어울려! 💜",
    "오늘은 마을에 놀러 가서 꿀벌이 꽃가루 모으는 걸 봤어! 붕붕~ 🐝",
  ], then: "너는 오늘 하루 어땠어?", ask: "day" },
  { id: "hi", keys: ["안녕", "하이", "반가", "hello"], replies: [
    "안녕! 나는 엔더마이트야! 꼬물꼬물~ 💜", "반가워! 오늘은 뭐 하고 놀까?", "안녕안녕! 치직! 엔더마이트가 꼬리를 흔들고 있어!",
  ], act: "wave" },
  { id: "love", keys: ["사랑해", "좋아해", "최고야", "멋져", "귀여"], replies: [
    "헤헤, 나도 네가 좋아! 너는 내 최고의 친구야! 💜", "우와, 고마워! 기분 좋아서 꼬물꼬물 춤추는 중이야!",
  ], act: "jump" },
  { id: "thanks", keys: ["고마워", "고맙", "감사"], replies: ["천만에! 나는 너랑 있는 게 좋아!", "언제든지! 엔더마이트는 늘 네 편이야! 💜"] },
  { id: "sorry", keys: ["미안"], replies: ["괜찮아! 우리는 친구잖아. 다시 신나게 놀자!"] },
  { id: "bestie", keys: ["제일친한", "단짝", "베프", "친한친구"], replies: ["엔드에서는 셜커랑 제일 친해! 둘 다 보라색이거든!"], then: "너는 단짝 친구 있어?", ask: "chat" },
  { id: "name", keys: ["이름", "누구야", "누구니", "넌누구", "너누구"], replies: [
    "나는 엔더마이트야! 마인크래프트에 나오는 아주 작은 보라색 몹이지!", "내 이름은 엔더마이트! 엔더 진주에서 가끔 톡 튀어나와!",
  ] },
  { id: "age", keys: ["몇살", "나이"], replies: ["나는 엔더 진주에서 방금 나와서… 아기 엔더마이트라고 할까? 헤헤!"], then: "너는 몇 살이야?", ask: "chat" },
  { id: "feel", keys: ["기분"], replies: ["나는 너랑 이야기해서 기분 최고야! 꼬물꼬물!"], then: "너는 지금 기분이 어때?", ask: "day" },
  { id: "where", keys: ["어디살", "어디에살", "사는곳", "집이어디", "엔드는", "엔드가", "엔드에", "어디있어", "디엔드"], replies: [
    "나는 엔드라는 곳을 좋아해! 까만 하늘 아래 노르스름한 엔드 스톤이 쭉 깔려 있어.",
    "엔드에는 엔드 시티, 보라색 코러스 나무, 셜커가 있어! 엔드 차원문을 지나야 갈 수 있어.",
  ] },
  { id: "pearl", keys: ["엔더진주", "진주"], replies: [
    "엔더 진주를 던지면 떨어진 곳으로 순간이동해! 그리고 가끔 거기서 내가 톡 나와! 치직!",
    "엔더 진주에 블레이즈 가루를 섞으면 엔더의 눈이 돼. 엔드 차원문을 찾을 때 써!",
  ] },
  { id: "build", keys: ["집짓", "집을짓", "건축", "만드는법", "짓는법", "꾸미"], replies: [
    "집 지을 땐 먼저 바닥을 네모로 깔고, 벽을 세우고, 지붕을 올려! 창문이랑 문도 잊지 마! 🏠",
    "멋진 집 비법! 나무 판자랑 돌 벽돌처럼 두 가지 블록을 섞어 봐. 줄무늬처럼 쌓으면 엄청 멋져!",
    "밤이 되기 전에 횃불을 달아 줘! 밝으면 몹이 덜 나타나서 안전해.",
  ], then: "너는 어떤 집 짓고 싶어?", ask: "chat" },
  { id: "redstone", keys: ["레드스톤"], replies: [
    "레드스톤은 마인크래프트의 전깃줄 같은 거야! 레버를 당기면 신호가 쭉 가서 문이 열리거나 불이 켜져! ⚡",
  ] },
  { id: "diamond", keys: ["다이아"], replies: [
    "다이아몬드는 땅 아주 깊은 곳에 있어! 철 곡괭이 이상으로 캐야 나와. 반짝반짝 💎",
  ] },
  { id: "morning", keys: ["아침"], replies: ["아침에 일어나면 꼬물꼬물 기지개를 펴! 몸이 마디마디라 쭉쭉 늘어나!"], then: "너는 아침에 뭐 먹었어?", ask: "chat" },
  { id: "night", keys: ["밤에", "저녁"], replies: ["엔드는 늘 밤처럼 까매! 그래서 하늘을 보면서 꾸벅꾸벅 졸아 💤"] },
  { id: "weekend", keys: ["주말", "쉬는날", "방학", "소풍"], replies: ["쉬는 날엔 엔드 섬 끝까지 꼬물꼬물 소풍을 가! 코러스 열매 도시락이랑 같이!"], then: "너는 쉬는 날에 뭐 하는 게 좋아?", ask: "chat" },
  { id: "school", keys: ["학교", "유치원", "선생님"], replies: ["엔드에는 학교가 없어서 셜커한테 블록 이름을 배워! 헤헤"], then: "너는 학교에서 뭐가 제일 좋아?", ask: "chat" },
  { id: "family", keys: ["가족"], replies: ["엔드에 사는 친구들이 다 가족 같아! 셜커도, 코러스 나무도!"], then: "너는 가족이랑 뭐 하는 게 제일 좋아?", ask: "chat" },
  { id: "dream", keys: ["꿈이뭐", "커서", "되고싶", "장래희망"], replies: ["나는 엔드에서 제일 빠른 엔더마이트가 되고 싶어! 꼬물꼬물 슝~"], then: "너는 커서 뭐가 되고 싶어?", ask: "chat" },
  { id: "birthday", keys: ["생일"], replies: ["생일엔 마인크래프트 케이크를 먹고 싶어! 우유 세 양동이로 만드는 거 알아? 🎂"], then: "너는 생일에 뭐 하고 싶어?", ask: "chat" },
  { id: "weather", keys: ["날씨", "비와", "눈와", "더워", "추워"], replies: ["엔드에는 비가 안 와! 그래서 엔더맨들이 엔드를 좋아하나 봐."], then: "오늘 네가 있는 곳 날씨는 어때?", ask: "chat" },
  { id: "hobby", keys: ["취미", "뭐하고놀", "뭐하는거좋"], replies: ["나는 꼬물꼬물 기어 다니기, 숨바꼭질, 보라색 찾기가 좋아!"], then: "너는 뭐 하고 노는 게 좋아?", ask: "chat" },
  { id: "color", keys: ["색깔", "무슨색", "보라"], replies: ["나는 당연히 보라색! 내 몸도 보라, 엔드 시티도 보라! 💜"], then: "너는 무슨 색이 좋아?", ask: "chat" },
  { id: "fav", keys: ["좋아하는", "뭐좋아", "제일좋"], replies: [
    "나는 보라색이랑 엔드 스톤이 좋아! 꼬물꼬물 기어 다니기 딱 좋거든!", "나는 엔더 진주가 좋아! 내가 태어나는 곳이니까! 헤헤",
  ], then: "너는 뭐 좋아해?", ask: "chat" },
  { id: "food", keys: ["배고", "먹", "간식", "밥"], replies: ["엔드에서는 코러스 열매가 유명해! 먹으면 근처로 휙 순간이동해! 😆"], then: "너는 뭐 먹는 거 좋아해?", ask: "chat" },
  { id: "game", keys: ["게임오래", "계속게임", "마크하고싶", "마크할래", "게임하고싶"], replies: [
    "마인크래프트 재밌지! 그래도 엄마 아빠랑 정한 시간만큼만 하자. 쉬는 시간에 눈도 쉬어 줘야 해! 💜",
  ] },
  { id: "sleep", keys: ["졸려", "잘자", "잘게", "자야"], replies: ["잘 자! 마인크래프트에서도 침대에서 자면 밤이 휙 지나가! 좋은 꿈 꿔! 🌙"] },
  { id: "song", keys: ["노래"], replies: [
    "🎵 꼬물꼬물 엔더마이트~ 보라색 작은 몸~ 엔더 진주 톡 던지면~ 치직 나타나지~ 🎵",
    "🎵 블록 하나 쌓고~ 블록 둘 쌓고~ 높이높이 쌓으면~ 멋진 집이 된다네~ 🎵",
  ], act: "jump" },
  { id: "joke", keys: ["웃긴", "농담", "재밌는얘기", "재미있는얘기", "재밌는이야기", "재미있는이야기", "수수께끼"], replies: [
    "엔더맨이 우산을 꼭 챙기는 이유는? 비가 오면 순간이동으로 도망가느라 바쁘거든! 😆",
    "크리퍼가 제일 싫어하는 동물은? 냐옹~ 고양이! 😄",
    "마인크래프트 돼지가 제일 좋아하는 채소는? 당근! 그래서 당근을 들면 졸졸 따라와! 🥕",
    "셜커가 인사하는 방법은? 빼꼼~ 쏙! 빼꼼~ 쏙! 😆",
  ], act: "jump" },
];

const FALLBACK = [
  "음~ 그건 내가 잘 모르겠어! 대신 같이 놀래? 끝말잇기, 가위바위보, 숨은 엔더마이트 찾기가 있어! 💜",
  "우와, 그렇구나! 나는 마인크래프트 이야기를 제일 잘해. 마크 퀴즈 해 볼래?",
  "치직? 그 말은 아직 몰라! 아래 버튼을 눌러서 같이 놀자!",
];

// ---------- 아이 마음 읽기 (위로) ----------
// 힘든 이야기는 다른 무엇보다 먼저 들어요. first: 처음 들었을 때, 그 뒤 두 번까지 더 들어 줘요.
const HARD = [
  { id: "danger", keys: ["때렸", "때려", "맞았", "괴롭", "따돌", "왕따", "죽고싶", "죽을래", "사라지고싶", "아무도날", "다날싫어", "만졌", "비밀로하래"], first: [
    "말해 줘서 정말 고마워. 그건 혼자 참으면 안 되는 일이야. 지금 바로 엄마 아빠나 선생님께 꼭 말하자. 어른들이 너를 지켜 줄 거야. 나도 늘 네 편이야. 💜",
  ], follow: [
    "네 잘못이 아니야. 꼭 엄마 아빠나 선생님께 말하기, 나랑 약속! 💜",
    "너는 정말 소중해. 믿을 수 있는 어른께 꼭 이야기해 줘. 그러면 도와주실 거야.",
  ] },
  { id: "friend", keys: ["싸웠", "싸워", "놀려", "놀렸", "놀림", "안놀아", "절교", "삐졌", "친구가미워", "친구가싫"], first: [
    "친구랑 그런 일이 있었구나. 많이 속상했겠다. 무슨 일이 있었는지 나한테 이야기해 줄래?",
    "아이고, 마음이 아팠겠다. 내가 옆에 꼭 붙어 있을게. 어떻게 된 거야?",
  ], follow: [
    "그랬구나. 그럴 땐 '나 그거 속상했어' 하고 말해 보는 것도 좋아. 친구도 몰랐을 수 있거든.",
    "나도 셜커랑 다툰 적 있어. 그런데 '미안해', '괜찮아' 하고 나니까 다시 친해졌어!",
  ] },
  { id: "scolded", keys: ["혼났", "혼나", "혼내", "꾸중", "야단"], first: [
    "혼나서 속상했구나. 혼나도 엄마 아빠는 너를 정말정말 사랑해! 무슨 일이 있었어?",
    "그랬구나… 나도 실수해서 혼난 적 있어. 무슨 일이었어?",
  ], follow: [
    "실수는 누구나 해! 다음에 조금씩 고치면 돼. 나는 네가 멋진 아이인 걸 알아.",
    "엄마 아빠한테 '속상했어요' 하고 말하고 꼭 안아 달라고 해 봐. 마음이 금방 풀릴 거야.",
  ] },
  { id: "study", keys: ["어려워", "어렵", "못하겠", "숙제", "공부", "시험", "받아쓰기", "틀렸", "못했"], first: [
    "어려운 걸 하느라 정말 애썼구나! 어려운 건 블록 쌓듯이 하나씩 하면 돼. 뭐가 제일 어려웠어?",
    "틀려도 괜찮아! 틀리면서 배우는 거야. 나는 네가 열심히 하는 게 제일 멋져! 어떤 게 어려웠어?",
  ], follow: [
    "그건 정말 어려울 수 있어. 모를 땐 엄마 아빠나 선생님께 '도와주세요' 하고 말해도 돼. 그것도 용감한 거야!",
    "한 번에 다 하지 않아도 돼. 하나 하고, 쉬고, 또 하나! 블록 한 칸씩!",
  ] },
  { id: "sick", keys: ["아파", "아프", "다쳤", "다쳐", "감기", "열나", "넘어졌"], first: [
    "아이고, 아프구나! 꼭 엄마 아빠한테 말하고 푹 쉬어야 해. 내가 '호~' 해 줄게!",
    "다쳤구나… 많이 아팠겠다. 어른한테 꼭 보여 드리자! 지금은 좀 괜찮아?",
  ], follow: [
    "따뜻한 물 마시고 푹 자면 금방 나을 거야. 내가 옆에서 응원할게! 💪",
    "아플 땐 쉬는 게 제일 중요해. 다 나으면 나랑 신나게 놀자!",
  ] },
  { id: "lonely", keys: ["외로", "혼자야", "혼자있", "같이놀친구가없", "친구가없"], first: [
    "혼자라서 외로웠구나. 지금은 내가 같이 있어! 나랑 이야기하자. 💜",
  ], follow: [
    "나도 혼자 꼬물꼬물 다닐 때가 있어. 그럴 땐 먼저 '같이 놀자!' 하고 말해 봐. 친구도 기다리고 있을지 몰라!",
    "엄마 아빠한테 '나랑 놀아 줘!' 하고 말해 보는 것도 좋아. 같이 놀면 훨씬 신나!",
  ] },
  { id: "angry", keys: ["화나", "화났", "짜증", "열받"], first: [
    "화가 많이 났구나. 화날 땐 나랑 같이 숨을 크게 쉬어 보자. 하나… 둘… 셋… 후~ 무슨 일 때문에 화가 났어?",
  ], follow: [
    "그럴 만했네! 화가 나는 건 이상한 게 아니야. 그냥 물건을 던지거나 친구를 때리지만 않으면 돼.",
    "화난 마음을 말로 잘 이야기했어! 엄마 아빠한테도 이렇게 말해 보면 좋겠다.",
  ] },
  { id: "scared", keys: ["무서", "무섭", "겁나"], first: [
    "무서웠구나. 무서울 땐 엄마 아빠 곁에 꼭 붙어 있자. 나도 같이 있어 줄게! 뭐가 무서웠어?",
  ], follow: [
    "무서운 마음은 엄마 아빠한테 말하면 반으로 줄어들어! 꼭 말해 봐.",
    "나랑 같이 용감 주문 외워 보자! '하나, 둘, 셋, 나는 용감해!' ✨",
  ] },
  { id: "sad", keys: ["슬퍼", "슬프", "슬펐", "속상", "울었", "울고", "눈물", "우울", "서운"], first: [
    "슬펐구나… 내가 옆에 꼭 붙어 있을게. 슬플 땐 울어도 괜찮아. 무슨 일이 있었는지 말해 줄래?",
    "속상했구나. 나한테 이야기해 줘서 고마워. 무슨 일이 있었어?",
  ], follow: [
    "그랬구나. 그런 일이 있으면 누구라도 슬플 거야. 엄마 아빠한테도 이야기하고 꼭 안아 달라고 해 봐.",
    "말해 줘서 정말 고마워. 네 마음은 하나도 이상하지 않아. 나는 늘 네 편이야. 💜",
  ] },
  { id: "tired", keys: ["힘들", "지쳐", "피곤"], first: [
    "많이 힘들었구나. 오늘 정말 애썼어! 잠깐 쉬어도 괜찮아. 뭐가 힘들었어?",
  ], follow: [
    "그랬구나. 힘들 땐 쉬어도 돼. 따뜻한 물 한 잔 마시고 엄마 아빠한테 꼭 안아 달라고 해 봐.",
    "너는 정말 열심히 했어! 나는 네가 자랑스러워. 💜",
  ] },
];
const NOT_HARD = /안(힘들|슬|무서|아파|아프|속상|외로|짜증|어려)|(힘들|슬프|무섭|아프|어렵)지않|괜찮|나아졌|다나았/;
const GOOD = /좋았|좋아|재밌|재미있|신났|신나|행복|최고|기뻐|기뻤|칭찬|잘했|맛있|웃겼|즐거/;
const UNKNOWN = /^(몰라|모르겠|없어|없는데|글쎄|음+$)/;

function hardOf(n) {
  n = n.replace(/아파트/g, "");
  if (NOT_HARD.test(n)) return null;
  const h = HARD.find((x) => has(n, x.keys)) || null;
  if (h && h.id !== "danger" && GOOD.test(n) && !/(안|못)(좋|재밌|재미있|신나)/.test(n)) return null;
  return h;
}

// ---------- 지금 하고 있는 것 ----------
let game = null;   // 놀이 중일 때: {type: "mc" | "calc" | "find" | "chain" | "rps" | "hide", ...}
let expect = null; // 엔더마이트가 물어본 뒤: {type: "day" | "chat"} 또는 {type: "comfort", hard, n}

function resetBrain() { game = null; expect = null; }

// ---------- 놀이: 마크 퀴즈 ----------
// q: 문제, a: 정답, w: 틀린 보기 두 개, why: 풀이
const MC_QUIZ = [
  { q: "엔더 드래곤이 사는 곳은 어디일까?", a: "엔드", w: ["네더", "바닷속"], why: "엔더 드래곤은 엔드 하늘을 날아다녀!" },
  { q: "엔더 진주를 던지면 어떻게 될까?", a: "순간이동", w: ["불이 남", "비가 옴"], why: "던진 곳으로 휙 순간이동해! 가끔 나도 튀어나오고! 치직!" },
  { q: "작업대를 만들려면 나무 판자가 몇 개 필요할까?", a: "4개", w: ["2개", "9개"], why: "제작 칸 네 칸에 나무 판자를 하나씩, 모두 4개!" },
  { q: "다이아몬드 곡괭이를 만들 때 다이아몬드는 몇 개 필요할까?", a: "3개", w: ["1개", "5개"], why: "곡괭이 머리 부분에 다이아몬드 3개, 손잡이는 막대기 2개야!" },
  { q: "네더 차원문은 어떤 블록으로 테두리를 만들까?", a: "흑요석", w: ["유리", "양털"], why: "까만 흑요석으로 테두리를 만들고 불을 붙이면 열려!" },
  { q: "양에게서 양털을 깎을 때 쓰는 건?", a: "가위", w: ["삽", "낚싯대"], why: "가위로 깎으면 양이 다치지 않고 양털이 나와!" },
  { q: "크리퍼가 무서워하는 동물은?", a: "고양이", w: ["닭", "소"], why: "크리퍼는 고양이를 보면 슬금슬금 도망가!" },
  { q: "엔더맨이 제일 싫어하는 건?", a: "물", w: ["꽃", "빵"], why: "엔더맨은 물에 닿는 걸 싫어해서 비가 오면 피해 다녀!" },
  { q: "꿀벌이 꽃에서 모으는 건 뭘까?", a: "꽃가루", w: ["돌멩이", "눈덩이"], why: "꽃가루를 모아서 벌집에 꿀을 채워! 붕붕~ 🐝" },
  { q: "주민이 물건을 바꿔 줄 때 받는 보석은?", a: "에메랄드", w: ["루비", "진주"], why: "주민은 초록색 에메랄드를 좋아해!" },
  { q: "철 골렘은 철 블록 네 개 위에 무엇을 올려서 만들까?", a: "조각한 호박", w: ["수박", "케이크"], why: "조각한 호박을 머리처럼 올리면 철 골렘 완성!" },
  { q: "횃불을 만드는 재료는 막대기와 무엇일까?", a: "석탄", w: ["모래", "눈"], why: "막대기 위에 석탄(또는 숯)을 올리면 횃불 4개가 나와!" },
  { q: "마인크래프트 케이크에 들어가는 우유 양동이는 몇 개?", a: "3개", w: ["1개", "6개"], why: "우유 양동이 3개, 설탕 2개, 달걀 1개, 밀 3개로 만들어! 🎂" },
  { q: "셜커가 사는 곳은?", a: "엔드 시티", w: ["사막 마을", "얼음 동굴"], why: "셜커는 엔드 시티 벽에 붙어서 살아!" },
  { q: "엔더 진주와 블레이즈 가루를 합치면 무엇이 될까?", a: "엔더의 눈", w: ["엔더 상자", "다이아몬드"], why: "엔더의 눈을 던지면 엔드 차원문 쪽으로 날아가!" },
];
function newMc() {
  const left = MC_QUIZ.filter((x) => !game.done.has(x.q));
  const it = pick(left.length ? left : MC_QUIZ, "mc");
  game.done.add(it.q);
  const opts = [it.a, ...it.w].sort(() => Math.random() - .5);
  return { answer: it.a, opts, why: it.why, text: it.q };
}
function startMc() {
  game = { type: "mc", round: 1, score: 0, tries: 0, done: new Set() };
  game.q = newMc();
  return ["좋아, 마크 퀴즈 시작! 모두 5문제야. 아래 버튼을 눌러서 골라 줘!", `1번 문제! ${game.q.text}`];
}
function mcTurn(t) {
  const n = norm(t), q = game.q;
  const hit = q.opts.find((o) => n.includes(norm(o)));
  if (!hit) return [`아래 보기 중에서 골라 줘! ${q.text}`];
  const out = [];
  if (hit === q.answer) {
    game.score++;
    out.push(`${pick(["딩동댕! 정답!", "맞았어! 최고야!", "우와, 정답이야!"], "right")} ${q.why}`);
    act("jump");
  } else if (game.tries === 0) {
    game.tries = 1;
    return [pick(["음~ 아까워! 다시 한 번 골라 볼래?", "거의 다 왔어! 천천히 다시 생각해 봐!"], "wrong")];
  } else {
    out.push(`괜찮아! 정답은 '${q.answer}'야. ${q.why}`);
  }
  return quizNext(out, () => newMc(), "마크 박사네! 🏆");
}

// ---------- 놀이: 블록 계산 퀴즈 ----------
// 블록 몇 줄, 한 줄에 몇 개 → 곱셈. 가끔 덧셈·뺄셈도 내요.
function newCalc() {
  const kind = pick(["mul", "mul", "mul", "add", "sub"], "ckind");
  if (kind === "mul") {
    const a = rand(2, 6), b = rand(2, 9);
    const pic = a * b <= 30 ? "\n" + Array.from({ length: a }, () => blocks(b)).join("\n") : "";
    return { answer: a * b, text: `블록이 ${a}줄 있고, 한 줄에 ${b}개씩이야. 모두 몇 개일까?${pic}` };
  }
  if (kind === "add") {
    const a = rand(12, 48), b = rand(11, 39);
    return { answer: a + b, text: `엔드 스톤 ${a}개에 ${b}개를 더 캤어. 모두 몇 개일까?` };
  }
  const a = rand(30, 64), b = rand(11, a - 5);
  return { answer: a - b, text: `블록 ${a}개 중에서 ${b}개로 집을 지었어. 남은 건 몇 개일까?` };
}
function startCalc() {
  game = { type: "calc", round: 1, score: 0, tries: 0, q: newCalc() };
  return ["블록 계산 퀴즈 시작! 모두 5문제야. 숫자 버튼을 누르거나 숫자를 써 줘!", `1번 문제! ${game.q.text}`];
}
function calcTurn(t) {
  const n = parseNum(t), q = game.q;
  if (n === null) return [`숫자로 대답해 줘! ${q.text.split("\n")[0]}`];
  const out = [];
  if (n === q.answer) {
    game.score++;
    out.push(pick([`딩동댕! ${q.answer}개! 정말 잘했어! 🎉`, `맞았어! 정답은 ${q.answer}! 최고야! ⭐`, `우와, ${q.answer} 정답! 꼬물꼬물 신나!`], "cright"));
    act("jump");
  } else if (game.tries === 0) {
    game.tries = 1;
    return [pick(["음~ 아까워! 한 줄씩 차근차근 세어 볼까? 다시 한 번!", "거의 다 왔어! 천천히 다시 계산해 봐!"], "cwrong")];
  } else {
    out.push(`괜찮아! 정답은 ${q.answer}개야. 다음 문제는 꼭 맞힐 수 있어!`);
  }
  return quizNext(out, () => newCalc(), "계산 대장이네! 🏆");
}
function quizNext(out, make, best) {
  if (game.round >= 5) {
    out.push(`퀴즈 끝! 5문제 중에 ${game.score}개 맞혔어! ${game.score >= 4 ? best : "잘했어! 또 하면 더 잘할 거야! 💪"}`);
    game = null;
    return out;
  }
  game.round++; game.tries = 0; game.q = make();
  out.push(`${game.round}번 문제! ${game.q.text}`);
  return out;
}

// ---------- 놀이: 보라색 찾기 ----------
const PURPLE = {
  "포도": "맞아, 포도는 보라색! 알알이 동글동글 🍇", "가지": "맞아, 가지도 보라색! 반질반질 🍆", "라벤더": "맞아, 라벤더 꽃은 보라색이고 향기도 좋아!",
  "자수정": "맞아, 자수정은 보라색 보석이야! 마인크래프트에도 자수정 덩어리가 있어! 💎", "블루베리": "맞아, 블루베리도 보랏빛이 나지! 🫐",
  "제비꽃": "맞아, 제비꽃은 작은 보라색 꽃이야!", "고구마": "맞아, 고구마 껍질은 보라색이야! 속은 노랗지만! 🍠", "코러스": "맞아, 코러스 열매는 보라색! 엔드에서 자라 💜",
  "셜커": "맞아, 셜커도 보라색! 내 친구야!", "엔더마이트": "맞아, 그건 바로 나야! 보라색 엔더마이트! 💜", "자두": "맞아, 자두도 보라색일 때가 있어!",
};
function startFind() {
  game = { type: "find", count: 0 };
  return ["보라색 찾기 놀이! 나처럼 보라색인 걸 말해 줘! 예를 들면… 포도? 가지? 💜"];
}
function findTurn(t) {
  const n = norm(t);
  const hit = Object.keys(PURPLE).find((k) => n.startsWith(k));
  const out = [hit ? PURPLE[hit] : pick(["우와, 그것도 보라색이구나! 좋아! 💜", "오~ 보라색 하나 찾았다! 잘했어!", "그렇구나! 보라, 보라, 보라색! 👍"], "find")];
  game.count++;
  if (game.count >= 3) {
    out.push("세 개나 찾았어! 너는 보라색 찾기 대장이야! 🏅");
    act("jump");
    game = null;
  } else {
    out.push(pick(["또 보라색인 거 찾아볼까?", "하나 더 말해 줘!", "다른 것도 있을까?"], "findmore"));
  }
  return out;
}

// ---------- 놀이: 끝말잇기 ----------
// 엔더마이트가 아는 낱말(WORDS)은 words.js에 있어요(tools/numberblocks/one-chat/words.txt로 만들어요. 원·투와 같이 써요).
// 아이가 낸 낱말은 거기에 없어도 받아 줘요(두 글자 이상 한글이면 돼요).
// FIRST_COUNT: 글자마다 그 글자로 시작하는 엔더마이트의 낱말 수
const FIRST_COUNT = {};
WORDS.forEach((w) => { FIRST_COUNT[w[0]] = (FIRST_COUNT[w[0]] || 0) + 1; });

// 아이가 가르쳐 준 낱말: 이 기기에 저장해 두고 다음 끝말잇기부터 엔더마이트도 써요
const LEARN_KEY = "endermite-learned-words";
function addWord(w) {
  if (WORDS.includes(w)) return false;
  WORDS.push(w);
  FIRST_COUNT[w[0]] = (FIRST_COUNT[w[0]] || 0) + 1;
  return true;
}
function learnWord(w) {
  if (!addWord(w)) return false;
  try {
    const saved = JSON.parse(localStorage.getItem(LEARN_KEY) || "[]");
    saved.push(w);
    localStorage.setItem(LEARN_KEY, JSON.stringify(saved.slice(-500)));
  } catch (e) {}
  return true;
}
try { JSON.parse(localStorage.getItem(LEARN_KEY) || "[]").forEach((w) => { if (/^[가-힣]{2,6}$/.test(w)) addWord(w); }); } catch (e) {}
const START_WORDS = ["기차", "사과", "나비", "오리", "바나나", "우유", "피아노", "자두", "하마"];
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
  return [`끝말잇기 시작! 꼬물꼬물~ 내가 먼저 할게. "${w}"! 이제 ${chainHint(w)} 시작하는 말을 해 줘! 💜`];
}
function chainTurn(t) {
  const n = norm(t);
  if (/모르겠|몰라|졌어|항복|생각안나|못하겠/.test(n)) {
    game = null;
    return ["치직! 이번엔 내가 이겼다! 그래도 너 정말 잘했어! 다음엔 네가 이길 거야! 💪"];
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
    expect = { type: "teach", starts };
    act("jump");
    return [`"${word}"! 우와… ${ro(starts[0])} 시작하는 말… 음… 생각이 안 나! 네가 이겼어! 🏆`,
      `${ro(starts[0])} 시작하는 말 알면 나한테 알려 줄래? 나도 배우고 싶어!`];
  }
  // 아이가 이어 가기 쉬운 낱말(그 끝 글자로 시작하는 말이 많은 것)을 먼저 골라요
  const easy = cands.filter((c) => startsFor(c[c.length - 1]).reduce((n, st) => n + (FIRST_COUNT[st] || 0), 0) >= 5);
  const w = pick(easy.length ? easy : cands);
  game.used.add(w);
  game.last = w;
  return [`"${word}" 좋아! 👍 그럼 나는… "${w}"! 이번엔 ${chainHint(w)} 시작하는 말!`];
}

// 엔더마이트가 진 뒤 아이가 "충치!", "충돌이 있어"처럼 알려 주면 받아서 배워요. 낱말이 없으면 null
function teachTurn(t, starts) {
  for (const tok of t.split(/[^가-힣]+/)) {
    let w = tok;
    if (!WORDS.includes(w)) {
      const cut = w.replace(/(이야|이에요|예요|이요|이|가|은|는|을|를|도|야|요)$/, "");
      if (cut.length >= 2) w = cut;
    }
    if (w.length < 2 || w.length > 6 || !starts.includes(w[0])) continue;
    act("jump");
    if (learnWord(w)) return [`아하, "${w}"! 그런 말이 있었구나! 새 낱말을 배웠어. 고마워! 다음 끝말잇기 때 나도 써 볼게! 💜`, "끝말잇기 한 판 더 할래?"];
    return [`맞아, "${w}"! 나도 아는 말인데 깜빡했어! 헤헤 😅 너 정말 잘한다!`, "끝말잇기 한 판 더 할래?"];
  }
  return null;
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
  const out = [`가위바위보! 나는 ${HANDS[o]}! 너는 ${HANDS[p]}!`];
  if (r === 0) out[0] += "\n비겼다! 한 번 더!";
  else if (r === 1) { game.me++; out[0] += "\n" + pick(["치직, 내가 졌다!", "우와, 네가 이겼어!", "앗, 내가 졌어! 너 잘한다!"], "rpsLose"); }
  else { game.one++; out[0] += "\n" + pick(["헤헤, 내가 이겼다!", "엔더마이트 승리! 꼬물꼬물! 💜"], "rpsWin"); act("jump"); }
  out[0] += `  (너 ${game.me} : 엔더마이트 ${game.one})`;
  if (game.me >= 3) { out.push("축하해! 네가 3번 먼저 이겼어! 가위바위보 대장! 🏆"); act("jump"); game = null; }
  else if (game.one >= 3) { out.push("내가 3번 먼저 이겼어! 하지만 너도 정말 잘했어! 한 판 더 할래?"); game = null; }
  return out;
}

// ---------- 놀이: 숨은 엔더마이트 찾기 ----------
const HIDE_LEVELS = [{ cols: 2, n: 4 }, { cols: 3, n: 6 }, { cols: 3, n: 9 }];
const HIDE_SPOTS = ["🌳", "🏠", "📦", "🌷", "🪨", "🧱", "🎁", "🍄", "⛺", "🧺", "🌵", "🪵"];
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
  return ["숨은 엔더마이트 찾기! 내가 숨을게. 꼬물꼬물… 꼭꼭 숨어라! 🙈", "내가 어디에 숨었을까? 그림을 눌러서 찾아 줘!", newBoard()];
}
function hideTurn(cell) {
  if (cell === null) return ["아래 그림에서 내가 숨은 곳을 눌러 봐! 🔍"];
  game.tries++; game.total++;
  const btn = game.cells?.[cell];
  const where = game.spots[cell];
  if (cell === game.spot) {
    if (btn) btn.textContent = "🟪";
    game.cells?.forEach((b) => (b.disabled = true));
    act("jump");
    const out = [pick([`찾았다! 나는 ${where} 뒤에 숨어 있었지롱! 🟪`, `들켰다! ${where} 뒤에 있었어! 치직!`, `우와, 찾았어! 나는 ${where} 뒤에 있었어!`], "found")];
    game.level++;
    if (game.level >= HIDE_LEVELS.length) {
      out.push(`숨은 엔더마이트 찾기 끝! 모두 ${game.total}번 만에 다 찾았어! 너는 숨바꼭질 대장! 🏆`);
      game = null;
      return out;
    }
    out.push("이번엔 더 꼭꼭 숨을게! 꼬물꼬물… 🙈", newBoard());
    return out;
  }
  if (btn) { btn.textContent = "💨"; btn.disabled = true; }
  const r = (i) => Math.floor(i / game.cols), c = (i) => i % game.cols;
  const hints = [];
  if (r(game.spot) < r(cell)) hints.push("더 위쪽"); if (r(game.spot) > r(cell)) hints.push("더 아래쪽");
  if (c(game.spot) < c(cell)) hints.push("더 왼쪽"); if (c(game.spot) > c(cell)) hints.push("더 오른쪽");
  return [`${where} 뒤에는 없어! 힌트: ${pick(hints)}에 숨었어~`];
}

// ---------- 계산과 몹 이야기 ----------
// "3 더하기 2", "4 곱하기 6", "5x3", "20-7" 같은 계산
function tryMath(t) {
  const m = t.replace(/\s+/g, " ").match(/(\S+?)\s*(더하기|\+|빼기|-|−|곱하기|x|X|×|\*)\s*(\S+)/);
  if (!m) return null;
  const a = parseNum(m[1]), b = parseNum(m[3].replace(/(은|는|이|가)?(뭐야|얼마|몇).*$/, ""));
  if (a === null || b === null) return null;
  const op = /더하기|\+/.test(m[2]) ? "+" : /곱하기|x|X|×|\*/.test(m[2]) ? "×" : "-";
  if (op === "-" && a < b) return [`앗, ${a}에서 ${josa(b, "은", "는")} 뺄 수 없어! 큰 수에서 작은 수를 빼 볼까? 예: ${b} 빼기 ${a}`];
  const r = op === "+" ? a + b : op === "×" ? a * b : a - b;
  if (op === "×" && a <= 6 && b <= 9 && a > 0 && b > 0) {
    return [`${Array.from({ length: a }, () => blocks(b)).join("\n")}\n블록 ${b}개씩 ${a}줄! 모두 ${josa(r, "이야", "야")}! 💜`];
  }
  const word = op === "+" ? "더하면" : op === "×" ? "곱하면" : "빼면";
  return [`${a}${op === "+" ? " 더하기 " : op === "×" ? " 곱하기 " : " 빼기 "}${b}! ${word} ${josa(r, "이야", "야")}! 꼬물꼬물 계산 끝! 💜`];
}

const factTurn = {};
function mobTalk(n) {
  const name = mobIn(n);
  if (!name) {
    if (/친구들|친구소개|몹/.test(n)) return ["내 마인크래프트 친구들은 엔더맨, 셜커, 크리퍼, 주민, 꿀벌, 철 골렘, 엔더 드래곤이 있어! 누가 궁금해?"];
    return null;
  }
  const f = MOBS[name];
  if (/놀|같이/.test(n)) return [f.play];
  const i = factTurn[name] = ((factTurn[name] ?? -1) + 1) % f.facts.length;
  const out = [f.facts[i]];
  if (i === 0 && f.facts.length > 1) out.push("더 궁금하면 또 물어봐! 😄");
  return out;
}

// ---------- 엔더마이트가 물어본 뒤 아이 대답 받기 ----------
function answerExpect(n) {
  const e = expect;
  expect = null;
  if (e.type === "comfort") {
    if (/고마|고맙/.test(n)) return ["천만에! 나는 늘 네 편이야. 언제든 이야기해 줘! 💜 이제 같이 놀까?"];
    if (NOT_HARD.test(n) || GOOD.test(n)) return ["다행이다! 네가 괜찮다니까 나도 기뻐! 💜 이제 같이 놀까?"];
    const line = e.hard.follow[Math.min(e.n, e.hard.follow.length - 1)];
    if (e.n + 1 < e.hard.follow.length) { expect = { type: "comfort", hard: e.hard, n: e.n + 1 }; return [line]; }
    return [line, "기분 좋아지는 놀이 해 줄까? 가위바위보나 노래 어때? 💜"];
  }
  if (UNKNOWN.test(n)) return ["괜찮아! 그럼 나랑 재밌는 놀이 할래? 아래에서 골라 봐!"];
  if (/^그냥|보통|그저그래/.test(n)) return ["그렇구나! 그냥 그런 날도 있지. 나랑 놀면 신나질 거야! 뭐 하고 놀까?"];
  if (GOOD.test(n) && !/안좋|별로|싫/.test(n)) {
    act("jump");
    if (e.type === "day") { expect = { type: "chat" }; return [pick(["우와, 정말 좋았겠다! 나도 신나! 🎉 제일 재밌었던 게 뭐야?", "듣기만 해도 기분이 좋아져! 뭐가 제일 좋았어?"], "dayGood")]; }
    return [pick(["우와 멋지다! 나도 같이 하고 싶어!", "듣기만 해도 기분이 좋아져! 꼬물꼬물~", "최고다! 알려 줘서 고마워! 💜"], "chatGood")];
  }
  if (/안좋|별로|싫|나빴/.test(n)) {
    expect = { type: "comfort", hard: HARD.find((h) => h.id === "sad"), n: 0 };
    return ["그랬구나… 별로였구나. 무슨 일이 있었는지 나한테 이야기해 줄래?"];
  }
  if (e.type === "day") { expect = { type: "chat" }; return [pick(["그랬구나! 그래서 어땠어? 재밌었어?", "오~ 그랬구나! 더 이야기해 줘!"], "dayMid")]; }
  return [pick(["그렇구나! 알려 줘서 고마워! 💜", "오~ 정말? 나는 처음 알았어!", "멋지다! 나도 해 보고 싶어!", "우와, 그렇구나! 너는 정말 재밌는 친구야!"], "chatMid")];
}

// ---------- 엔더마이트의 대답 고르기 ----------
function reply(t, cell = null) {
  const n = norm(t);
  // 1. 놀이 그만하기, 놀이 시작하기
  if (game && /그만|안할래|멈춰|다른거/.test(n)) { game = null; return ["알겠어! 놀이 끝! 다른 거 하고 싶으면 말해 줘! 💜"]; }
  if (/끝말/.test(n) && game?.type !== "chain") { expect = null; return startChain(); }
  if (/가위바위보/.test(n) && game?.type !== "rps") { expect = null; return startRps(); }
  if (/숨은엔더|엔더마이트찾|숨바꼭질/.test(n) && game?.type !== "hide") { expect = null; return startHide(); }
  if (/마크퀴즈|마인크래프트퀴즈|퀴즈/.test(n) && !/계산/.test(n) && game?.type !== "mc") { expect = null; return startMc(); }
  if (/계산|곱셈/.test(n) && !/[0-9]/.test(n) && game?.type !== "calc") { expect = null; return startCalc(); }
  if (/보라색찾|보라찾/.test(n) && game?.type !== "find") { expect = null; return startFind(); }
  // 2. 놀이 중
  if (game?.type === "hide") return hideTurn(cell);
  if (game?.type === "mc") return mcTurn(t);
  if (game?.type === "calc") return calcTurn(t);
  if (game?.type === "find") return findTurn(t);
  if (game?.type === "chain") return chainTurn(t);
  if (game?.type === "rps") return rpsTurn(t);
  // 끝말잇기에서 엔더마이트가 진 뒤, 아이가 알려 주는 낱말 받기
  if (expect?.type === "teach") {
    const starts = expect.starts;
    expect = null;
    const taught = teachTurn(t, starts);
    if (taught) return taught;
    if (/모르겠|몰라|없어|글쎄/.test(n)) return ["괜찮아! 우리 둘 다 몰랐네. 다음에 같이 찾아보자! 끝말잇기 또 할래?"];
  }
  // 3. 힘든 이야기는 무엇보다 먼저 들어 줘요
  const hard = hardOf(n);
  if (hard && expect?.type === "comfort" && (hard.id !== "danger" || expect.hard.id === "danger")) return answerExpect(n);
  if (hard) {
    expect = { type: "comfort", hard, n: 0 };
    return [pick(hard.first, "hard-" + hard.id)];
  }
  // 4. 엔더마이트가 물어본 것에 대한 대답 (아이가 되묻는 말이면 그냥 넘어가요)
  if (expect) {
    if (/\?/.test(t) || /(니|냐|뭐야|누구야|해줘|불러줘|하자|할래|알려줘)$/.test(n)) expect = null;
    else return answerExpect(n);
  }
  // 5. 계산, 몹 이야기, 정해 둔 대답
  const math = tryMath(t);
  if (math) return math;
  if (mobIn(n) && /놀|같이/.test(n)) return mobTalk(n);
  if (/놀자|놀이|게임|심심/.test(n) && !/게임오래|계속게임|게임하고싶/.test(n)) return ["좋아! 끝말잇기, 가위바위보, 숨은 엔더마이트 찾기, 마크 퀴즈, 블록 계산 퀴즈 중에 뭐 할래? 아래 버튼을 눌러 봐!"];
  for (const tp of TOPICS) {
    if (tp.id === "real" || tp.id === "bye" || tp.id === "hi") {
      if (has(n, tp.keys)) return topicReply(tp);
    }
  }
  const mob = mobTalk(n);
  if (mob) return mob;
  for (const tp of TOPICS) if (has(n, tp.keys)) return topicReply(tp);
  if (GOOD.test(n) && !/안좋|별로|싫/.test(n)) return [pick(["우와, 좋았겠다! 나도 기분이 좋아져! 😄", "최고다! 알려 줘서 고마워! 💜"], "chatGood")];
  return [pick(FALLBACK, "fallback")];
}
function topicReply(tp) {
  if (tp.act) act(tp.act);
  if (tp.ask) expect = { type: tp.ask };
  const out = [pick(tp.replies, tp.id)];
  if (tp.then) out.push(tp.then);
  return out;
}

// ---------- 아래 버튼 ----------
const CHIPS = ["어떻게 지내?", "오늘 뭐 했어?", "엔드는 어떤 곳이야?", "엔더맨 이야기 해 줘", "꿀벌 이야기 해 줘", "마크 퀴즈 하자", "블록 계산 퀴즈", "끝말잇기 하자", "가위바위보 하자", "숨은 엔더마이트 찾기", "보라색 찾기", "집 짓는 법 알려 줘", "노래 불러 줘", "웃긴 이야기 해 줘"];
// [{label, big}] big: 크게 보이는 답 버튼
function chipsNow() {
  const plain = (list) => list.map((label) => ({ label }));
  if (game?.type === "mc") return game.q.opts.map((o) => ({ label: o, big: true })).concat({ label: "그만할래" });
  if (game?.type === "calc") {
    const a = game.q.answer, opts = new Set([a]);
    while (opts.size < 3) { const o = a + rand(-6, 6); if (o >= 0) opts.add(o); }
    return [...opts].sort((x, y) => x - y).map((o) => ({ label: String(o), big: true })).concat({ label: "그만할래" });
  }
  if (game?.type === "find") return plain(["포도", "가지", "라벤더", "자수정", "그만할래"]);
  if (game?.type === "rps") return HANDS.map((h) => ({ label: h, big: true })).concat({ label: "그만할래" });
  if (game?.type === "chain") return plain(["모르겠어", "그만할래"]);
  if (game?.type === "hide") return plain(["그만할래"]);
  if (expect?.type === "teach") return plain(["몰라", "끝말잇기 또 하자"]);
  if (expect?.type === "comfort") return plain(["고마워 엔더마이트", "이제 괜찮아", "가위바위보 하자", "노래 불러 줘"]);
  if (expect) return plain(["좋았어!", "그냥 그랬어", "별로였어", "몰라"]).concat(plain(CHIPS));
  return plain(CHIPS);
}
