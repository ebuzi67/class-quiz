// 반려동물 & 동물 도감 정보
// ─────────────────────────────────────────────────────────────
//  · SPECIES: 동물 18가지 (강아지 6, 고양이 6, 곤충 6). id는 저장 데이터에 쓰여서 바꾸지 않아요.
//  · 그림은 png.js의 PNG_ART(사진에서 잘라 만든 그림)와 models.js(3D 모델)를 써요.
//  · 게임 속 성장 단계(아기→어린이→성장→성숙)는 실제 동물의 성장과 다른 "게임 규칙"이에요.
//    곤충의 실제 한살이(알→애벌레→번데기→어른벌레)는 도감의 lifecycle에서 따로 보여 줘요.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "dog", icon: "🐶", name: "강아지", space: "indoor" },
  { id: "cat", icon: "🐱", name: "고양이", space: "indoor" },
  { id: "bug", icon: "🪲", name: "곤충", space: "nature" },
];

export const SPECIES = [
  // ───────────── 강아지 ─────────────
  {
    id: "poodle", cat: "dog", name: "푸들", trait: "곱슬곱슬한 털, 아주 영리해요",
    dex: {
      origin: "독일 (프랑스에서 큰 인기를 얻어 '프랑스의 국견'이라고도 불려요)",
      looks: "촘촘하게 꼬불꼬불한 털이 온몸을 덮고 있어요. 털이 잘 빠지지 않는 편이에요. 크기에 따라 토이·미니어처·스탠더드 푸들로 나눠요.",
      personality: "똑똑하고 눈치가 빨라서 새로운 재주를 빨리 배워요. 사람과 함께 노는 것을 좋아해요.",
      facts: [
        "'푸들'이라는 이름은 '물에서 첨벙거리다'라는 뜻의 독일어에서 왔어요. 원래 물에 떨어진 새를 물어 오던 개예요.",
        "개의 지능을 비교한 연구에서 늘 상위권에 드는 똑똑한 견종이에요.",
      ],
    },
  },
  {
    id: "corgi", cat: "dog", name: "웰시코기", trait: "짧은 다리, 쫑긋한 큰 귀",
    dex: {
      origin: "영국 웨일스",
      looks: "다리가 짧고 몸이 길어요. 크고 쫑긋 선 귀, 여우를 닮은 얼굴, 황갈색과 흰색이 섞인 털이 특징이에요.",
      personality: "활발하고 용감해요. 원래 소를 모는 일을 하던 개라서 부지런히 움직이는 것을 좋아해요.",
      facts: [
        "소의 발뒤꿈치 근처를 툭툭 건드려 소를 몰았어요. 다리가 짧아서 소의 발길질을 잘 피할 수 있었대요.",
        "영국의 엘리자베스 2세 여왕이 평생 아끼며 키운 견종으로 유명해요.",
      ],
    },
  },
  {
    id: "shiba", cat: "dog", name: "시바견", trait: "돌돌 말린 꼬리, 여우 같은 얼굴",
    dex: {
      origin: "일본",
      looks: "작은 세모 귀와 돌돌 말린 꼬리가 있어요. 볼과 가슴, 배는 크림색이에요(이런 무늬를 '우라지로'라고 해요).",
      personality: "독립심이 강하고 깔끔해요. 낯선 사람에게는 조심스럽지만 가족에게는 충직해요.",
      facts: [
        "일본 토종개 가운데 가장 작은 견종이에요.",
        "싫은 일이 있으면 아주 크게 소리를 질러서 '시바 비명'이라는 말까지 생겼어요.",
      ],
    },
  },
  {
    id: "golden", cat: "dog", name: "골든리트리버", trait: "황금빛 털, 다정한 성격",
    dex: {
      origin: "영국 스코틀랜드",
      looks: "황금색의 길고 부드러운 털과 늘어진 귀를 가진 큰 개예요. 물이 잘 스며들지 않는 두 겹의 털이 있어요.",
      personality: "다정하고 참을성이 많아요. 사람을 잘 따르고 배우는 것을 좋아해서 안내견·도우미견으로 많이 일해요.",
      facts: [
        "'리트리버'는 '물어 오는 개'라는 뜻이에요. 사냥한 새를 상처 없이 물어 오도록 입을 부드럽게 쓰는 법을 알아요.",
        "물을 아주 좋아해서 수영을 즐기는 경우가 많아요.",
      ],
    },
  },
  {
    id: "pomeranian", cat: "dog", name: "포메라니안", trait: "솜뭉치처럼 풍성한 털",
    dex: {
      origin: "포메라니아 지방 (지금의 독일과 폴란드 사이 바닷가 지역)",
      looks: "몸집은 아주 작지만 털이 두 겹으로 풍성해서 솜뭉치처럼 보여요. 목 둘레 털이 사자 갈기 같아요.",
      personality: "호기심이 많고 활발해요. 작은 몸에 비해 겁이 없고 경계심이 있어서 잘 짖기도 해요.",
      facts: [
        "조상은 썰매를 끌던 큰 스피츠 종류의 개였어요. 사람들이 오랫동안 작게 길러서 지금의 크기가 되었어요.",
        "영국의 빅토리아 여왕이 작은 포메라니안을 무척 아껴서 인기가 크게 높아졌어요.",
      ],
    },
  },
  {
    id: "bichon", cat: "dog", name: "비숑프리제", trait: "하얀 구름 같은 동그란 털",
    dex: {
      origin: "지중해 연안 (프랑스·벨기에에서 지금 모습으로 자리 잡았어요)",
      looks: "하얗고 곱슬곱슬한 털이 동그랗게 부풀어 있어요. 까만 눈과 코가 또렷하게 보여요. 털이 잘 빠지지 않는 편이에요.",
      personality: "명랑하고 사람을 아주 좋아해요. 혼자 있는 것보다 가족과 함께 있는 것을 좋아해요.",
      facts: [
        "'비숑 프리제'는 프랑스어로 '곱슬곱슬한 털을 가진 작은 개'라는 뜻이에요.",
        "재주를 잘 배워서 옛날에는 서커스와 거리 공연에서 인기가 많았어요.",
      ],
    },
  },

  // ───────────── 고양이 ─────────────
  {
    id: "cheese", cat: "cat", name: "치즈냥이", trait: "노란 치즈색 줄무늬",
    dex: {
      pattern: "주황색(노란색) 바탕에 진한 줄무늬가 있어요. 치즈처럼 노랗다고 '치즈냥이'라고 불러요. 품종 이름이 아니라 털색 이름이에요.",
      personality: "털색만으로 성격이 정해지지는 않아요. 고양이마다 성격이 다르니 천천히 친해져요.",
      facts: [
        "치즈냥이는 수컷이 훨씬 많아요(대략 10마리 중 8마리). 주황 털색을 만드는 유전자가 성별을 정하는 염색체(X)에 있기 때문이에요.",
        "주황색 고양이는 거의 언제나 줄무늬가 함께 보여요.",
      ],
    },
  },
  {
    id: "calico", cat: "cat", name: "삼색냥이", trait: "흰색·검은색·주황색 세 가지 털",
    dex: {
      pattern: "흰색, 검은색, 주황색 세 가지 털이 얼룩덜룩 섞여 있어요. 무늬가 고양이마다 모두 달라서 똑같은 삼색냥이는 없어요.",
      personality: "털색만으로 성격이 정해지지는 않아요. 저마다 개성이 있어요.",
      facts: [
        "삼색냥이는 거의 모두 암컷이에요. 검은색과 주황색이 함께 나타나려면 X염색체가 두 개 있어야 하기 때문이에요.",
        "수컷 삼색냥이는 수천 마리 중 한 마리 정도로 아주 드물어요.",
      ],
    },
  },
  {
    id: "mackerel", cat: "cat", name: "고등어냥이", trait: "고등어 같은 회색 줄무늬",
    dex: {
      pattern: "회색이나 갈색빛 바탕에 검은 줄무늬가 생선뼈처럼 가늘게 나 있어요. 고등어 등 무늬를 닮아 '고등어냥이'라고 불러요.",
      personality: "털색만으로 성격이 정해지지는 않아요. 가장 흔한 무늬라서 길에서도 자주 만날 수 있어요.",
      facts: [
        "이마에 알파벳 'M' 모양 무늬가 있는 경우가 많아요.",
        "이런 줄무늬는 야생 고양이 조상에게서 물려받은 무늬예요. 풀숲에 숨을 때 눈에 잘 띄지 않게 도와줘요.",
      ],
    },
  },
  {
    id: "blackcat", cat: "cat", name: "검은고양이", trait: "윤기 나는 까만 털, 노란 눈",
    dex: {
      pattern: "온몸이 까만 털로 덮여 있어요. 눈은 노란색이나 초록색이 많아요.",
      personality: "털색만으로 성격이 정해지지는 않아요. 차분한 아이도, 장난꾸러기도 있어요.",
      facts: [
        "햇볕을 오래 쬐면 까만 털이 붉은 갈색빛으로 보이기도 해요.",
        "영국과 일본 등에서는 검은고양이를 행운을 가져다주는 동물로 여기기도 해요.",
      ],
    },
  },
  {
    id: "russianblue", cat: "cat", name: "러시안블루", trait: "은빛 푸른 털, 초록 눈",
    dex: {
      pattern: "은빛이 도는 푸른 회색 털이 두 겹으로 촘촘하게 나 있어요. 털끝이 은색이라 빛을 받으면 반짝여요. 눈은 초록색이에요. (이 고양이는 '품종' 이름이에요. 원산지는 러시아예요.)",
      personality: "조용하고 얌전한 편이에요. 낯선 사람에게는 수줍어하지만 가족에게는 다정해요.",
      facts: [
        "러시아 북쪽 항구 도시 아르한겔스크에서 배를 타고 유럽으로 건너갔다고 알려져 있어요.",
        "아기 고양이일 때는 눈이 노란빛이다가 자라면서 초록색으로 바뀌어요.",
      ],
    },
  },
  {
    id: "tuxedo", cat: "cat", name: "턱시도 고양이", trait: "턱시도를 입은 듯한 흑백 무늬",
    dex: {
      pattern: "검은 털에 가슴과 입 주변, 발이 하얘요. 멋진 턱시도 옷을 입은 것 같다고 '턱시도 고양이'라고 불러요. 품종이 아니라 무늬 이름이에요.",
      personality: "털색만으로 성격이 정해지지는 않아요. 하얀 발이 양말을 신은 것처럼 보여서 인기가 많아요.",
      facts: [
        "검은색과 흰색 두 가지 털색을 가진 고양이를 '바이컬러'라고 해요. 턱시도는 바이컬러의 한 종류예요.",
        "무늬의 위치와 크기는 고양이마다 달라서, 하얀 발의 모양도 저마다 달라요.",
      ],
    },
  },

  // ───────────── 곤충 ─────────────
  {
    id: "stag", cat: "bug", name: "사슴벌레", trait: "사슴뿔처럼 생긴 큰턱",
    dex: {
      group: "곤충강 › 딱정벌레목 › 사슴벌레과",
      habitat: "참나무가 많은 숲. 낮에는 나무 틈이나 낙엽 밑에 숨고 주로 밤에 활동해요.",
      food: "어른벌레: 참나무 수액, 잘 익은 과일 (사육할 때는 곤충 젤리)\n애벌레: 썩은 나무 속을 갉아 먹어요",
      features: [
        "수컷은 사슴뿔처럼 생긴 큰턱이 있어요. 이 턱은 먹이를 먹을 때가 아니라 다른 수컷과 겨룰 때 써요.",
        "먹이는 입에 있는 붓처럼 생긴 털로 수액을 핥아 먹어요.",
        "암컷은 큰턱이 작아서 수컷과 생김새가 많이 달라요.",
      ],
      facts: [
        "이름 그대로 큰턱이 사슴의 뿔을 닮아서 '사슴벌레'예요.",
        "같은 종류라도 애벌레 때 먹이를 얼마나 잘 먹었는지에 따라 어른벌레 크기와 턱 길이가 달라져요.",
      ],
      lifecycle: "stag",
    },
  },
  {
    id: "rhino", cat: "bug", name: "장수풍뎅이", trait: "멋진 뿔을 가진 힘센 곤충",
    dex: {
      group: "곤충강 › 딱정벌레목 › 장수풍뎅이과",
      habitat: "참나무가 많은 숲. 애벌레는 낙엽이 썩은 부엽토나 썩은 나무 부스러기 속에서 살아요.",
      food: "어른벌레: 참나무 수액, 잘 익은 과일 (사육할 때는 곤충 젤리)\n애벌레: 썩은 낙엽과 나무 부스러기(부엽토, 발효 톱밥)",
      features: [
        "수컷 머리에는 끝이 갈라진 긴 뿔, 가슴에는 작은 뿔이 있어요. 암컷은 뿔이 없어요.",
        "주로 밤에 활동하고 불빛에 날아오기도 해요.",
        "몸이 단단하고 힘이 아주 세요.",
      ],
      facts: [
        "자기 몸무게보다 훨씬 무거운 물건을 끌 수 있을 만큼 힘이 세요.",
        "이름이 비슷한 '장수하늘소'는 완전히 다른 곤충이에요. 장수하늘소는 천연기념물로 보호받는 귀한 곤충이에요.",
        "한살이가 약 1년이에요. 어른벌레는 여름 한철(두세 달쯤) 살아요.",
      ],
      lifecycle: "rhino",
    },
  },
  {
    id: "wide", cat: "bug", name: "넓적사슴벌레", trait: "납작하고 넓은 몸, 우리나라 최대",
    dex: {
      group: "곤충강 › 딱정벌레목 › 사슴벌레과",
      habitat: "참나무, 버드나무가 있는 숲과 냇가 근처. 나무 구멍이나 틈에 잘 숨어요.",
      food: "어른벌레: 나무 수액, 과일 (사육할 때는 곤충 젤리)\n애벌레: 썩은 나무",
      features: [
        "몸이 납작하고 넓어서 좁은 나무 틈에 쏙 들어가 숨을 수 있어요.",
        "우리나라 사슴벌레 가운데 몸집이 가장 큰 편이에요.",
        "성질이 사나운 편이라 큰턱으로 세게 집어요.",
      ],
      facts: [
        "어른벌레로 겨울을 나서 2~3년까지 살기도 해요.",
        "큰턱 안쪽에 작은 톱니가 줄지어 나 있어요.",
      ],
      lifecycle: "stag",
    },
  },
  {
    id: "saw", cat: "bug", name: "톱사슴벌레", trait: "톱니 모양 큰턱, 붉은 갈색 몸",
    dex: {
      group: "곤충강 › 딱정벌레목 › 사슴벌레과",
      habitat: "참나무 숲. 여름밤 참나무 수액이 흐르는 곳에 잘 모여요.",
      food: "어른벌레: 참나무 수액, 과일 (사육할 때는 곤충 젤리)\n애벌레: 썩은 나무",
      features: [
        "큰턱 안쪽에 톱날 같은 이빨이 여러 개 있어서 '톱사슴벌레'예요.",
        "몸 색이 붉은 갈색이에요.",
        "큰 수컷은 큰턱이 활처럼 크게 휘어 있어요.",
      ],
      facts: [
        "놀라면 다리를 오므리고 죽은 척을 하기도 해요.",
        "어른벌레는 대개 여름 한 철을 살고 겨울을 넘기지 못해요.",
      ],
      lifecycle: "stag",
    },
  },
  {
    id: "king", cat: "bug", name: "왕사슴벌레", trait: "굵고 둥근 큰턱, 반짝이는 검은 몸",
    dex: {
      group: "곤충강 › 딱정벌레목 › 사슴벌레과",
      habitat: "오래된 참나무가 많은 깊은 숲. 나무 구멍 속에 숨어 지내는 것을 좋아해요.",
      food: "어른벌레: 참나무 수액 (사육할 때는 곤충 젤리)\n애벌레: 썩은 참나무",
      features: [
        "굵고 둥글게 휜 큰턱 안쪽에 큰 이빨이 하나씩 있어요.",
        "몸이 두툼하고 검은색으로 반짝여요.",
        "겁이 많고 조심성이 있어서 주로 숨어 지내요.",
      ],
      facts: [
        "어른벌레로 겨울을 나며 2~3년, 길게는 그보다 오래 살기도 해요.",
        "오래된 숲이 줄어들면서 자연에서 만나기가 점점 어려워지고 있어요.",
      ],
      lifecycle: "stag",
    },
  },
  {
    id: "chafer", cat: "bug", name: "꽃무지", trait: "꽃을 좋아하는 반짝이는 곤충",
    dex: {
      group: "곤충강 › 딱정벌레목 › 꽃무지과",
      habitat: "들판과 숲 가장자리의 꽃밭, 과수원. 애벌레는 썩은 낙엽이 쌓인 흙 속에 살아요.",
      food: "어른벌레: 꽃가루, 꽃꿀, 잘 익은 과일, 나무 수액\n애벌레: 썩은 낙엽과 부엽토",
      features: [
        "몸이 금속처럼 반짝이고, 흰점박이꽃무지처럼 하얀 점무늬가 있는 종류가 많아요.",
        "뿔이나 큰턱이 없고 몸이 둥글넓적해요.",
        "낮에 활발하게 꽃 사이를 날아다녀요.",
      ],
      facts: [
        "딱지날개를 닫은 채로 옆 틈으로 속날개만 꺼내서 날 수 있어요.",
        "꽃무지 애벌레는 등을 바닥에 대고 발을 위로 한 채 뒤집혀서 기어가요.",
      ],
      lifecycle: "chafer",
    },
  },
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// ─────────────────────────────────────────────────────────────
//  곤충의 실제 한살이 (교육용, 게임 성장 단계와 별개)
// ─────────────────────────────────────────────────────────────
export const LIFECYCLES = {
  rhino: {
    title: "장수풍뎅이의 한살이 (약 1년)",
    stages: [
      { stage: "egg", name: "알", time: "약 1~2주", text: "어미가 부엽토 속에 동그랗고 하얀 알을 낳아요. 알은 흙 속 물기를 머금고 점점 커져요." },
      { stage: "larva", name: "애벌레", time: "약 8~10개월", text: "알에서 나온 애벌레(굼벵이)는 부엽토를 먹으며 허물을 두 번 벗고 3령까지 자라요. 애벌레 상태로 겨울을 나요." },
      { stage: "pupa", name: "번데기", time: "약 3~4주", text: "초여름에 흙 속에 단단한 방(번데기방)을 만들고 번데기가 돼요. 수컷 번데기에서는 뿔 모양이 벌써 보여요." },
      { stage: "adult", name: "어른벌레", time: "여름 두세 달", text: "번데기 껍질을 벗고 어른벌레가 나와요. 몸이 단단해지면 흙 위로 올라와 수액을 먹고 짝을 찾아요." },
    ],
  },
  stag: {
    title: "사슴벌레의 한살이 (약 1~3년, 종류마다 달라요)",
    stages: [
      { stage: "egg", name: "알", time: "약 2~4주", text: "어미가 썩은 나무에 구멍을 파고 알을 하나씩 낳아요." },
      { stage: "larva", name: "애벌레", time: "약 1~2년", text: "애벌레는 썩은 나무 속을 갉아 먹으며 터널을 만들고 3령까지 자라요. 먹이를 잘 먹을수록 크게 자라요." },
      { stage: "pupa", name: "번데기", time: "약 3~4주", text: "나무 속에 번데기방을 만들고 번데기가 돼요. 수컷 번데기에서는 큰턱 모양이 보여요." },
      { stage: "adult", name: "어른벌레", time: "몇 달 ~ 2~3년", text: "어른벌레가 된 뒤에도 한동안 번데기방에서 몸을 단단하게 만든 다음 밖으로 나와요. 넓적·왕사슴벌레는 겨울을 넘겨 몇 년을 살기도 해요." },
    ],
  },
  chafer: {
    title: "꽃무지의 한살이 (약 1년)",
    stages: [
      { stage: "egg", name: "알", time: "약 1~2주", text: "어미가 썩은 낙엽이 쌓인 흙 속에 알을 낳아요." },
      { stage: "larva", name: "애벌레", time: "약 8~10개월", text: "애벌레는 부엽토를 먹고 자라요. 등을 바닥에 대고 뒤집힌 채로 기어가는 재미있는 습성이 있어요." },
      { stage: "pupa", name: "번데기", time: "약 3~4주", text: "흙을 뭉쳐 동그란 흙고치를 만들고 그 안에서 번데기가 돼요." },
      { stage: "adult", name: "어른벌레", time: "몇 달", text: "흙고치를 뚫고 나온 어른벌레는 꽃가루와 꽃꿀, 과일을 먹으며 꽃 사이를 날아다녀요." },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
//  게임 속 성장 단계 (실제 동물의 성장과 다른 게임 규칙이에요)
// ─────────────────────────────────────────────────────────────
export const GROWTH = [
  { stage: 1, name: "아기", exp: 0, scale: 0.72 },
  { stage: 2, name: "어린이", exp: 60, scale: 0.84 },
  { stage: 3, name: "성장", exp: 180, scale: 0.94 },
  { stage: 4, name: "성숙", exp: 400, scale: 1.04 },
];
export function growthOf(exp) {
  let g = GROWTH[0];
  for (const s of GROWTH) if (exp >= s.exp) g = s;
  return g;
}

// ─────────────────────────────────────────────────────────────
//  돌보기 행동 (동물마다 다르게)
//  exp: 경험치, love: 친밀도, anim: 움직임, mood: 표정, daily: 하루에 경험치를 받는 횟수
//  하루 횟수를 넘겨도 계속 놀 수 있어요(경험치만 안 올라요). 돌보지 않아도 벌은 없어요.
// ─────────────────────────────────────────────────────────────
const COMMON = {
  water: { id: "water", icon: "💧", label: "물 주기", exp: 4, love: 1, anim: "drink", mood: "eat", daily: 3, fx: "💧" },
  pet: { id: "pet", icon: "🤲", label: "쓰다듬기", exp: 3, love: 3, anim: "pet", mood: "happy", daily: 5, fx: "💕" },
};
export const ACTIONS = {
  dog: [
    { id: "feed", icon: "🦴", label: "사료 주기", exp: 6, love: 2, anim: "eat", mood: "eat", daily: 3, fx: "🦴", bowl: "kibble" },
    COMMON.water,
    { id: "walk", icon: "🦮", label: "산책 놀이", exp: 8, love: 3, anim: "walk", mood: "happy", daily: 2, fx: "🌼", play: true },
    { id: "ball", icon: "🎾", label: "공놀이", exp: 7, love: 3, anim: "ball", mood: "wow", daily: 3, fx: "🎾", play: true },
    COMMON.pet,
  ],
  cat: [
    { id: "snack", icon: "🐟", label: "간식 주기", exp: 6, love: 2, anim: "eat", mood: "eat", daily: 3, fx: "🐟", bowl: "fish" },
    COMMON.water,
    { id: "toy", icon: "🧶", label: "장난감 놀이", exp: 7, love: 3, anim: "pounce", mood: "wow", daily: 3, fx: "🧶", play: true },
    { id: "rod", icon: "🎣", label: "낚싯대 놀이", exp: 8, love: 3, anim: "jump", mood: "wow", daily: 2, fx: "🪶", play: true },
    COMMON.pet,
  ],
  bug: [
    { id: "jelly", icon: "🍯", label: "먹이 주기", exp: 6, love: 2, anim: "eat", mood: "eat", daily: 3, fx: "🍯", bowl: "jelly" },
    { id: "mist", icon: "💦", label: "물 뿌리기", exp: 4, love: 1, anim: "drink", mood: "happy", daily: 3, fx: "💦" },
    { id: "observe", icon: "🔍", label: "곤충 관찰하기", exp: 6, love: 2, anim: "observe", mood: "idle", daily: 3, fx: "🔍", observe: true },
    { id: "climb", icon: "🪵", label: "놀이터 산책", exp: 7, love: 3, anim: "walk", mood: "happy", daily: 2, fx: "🍃", play: true },
    { id: "lifecycle", icon: "🥚", label: "성장 과정 보기", exp: 5, love: 1, anim: "observe", mood: "idle", daily: 1, fx: "📖", lifecycle: true },
  ],
};
// 공통: 관찰하기(강아지·고양이)와 꾸미기는 하단 메뉴에 따로 있어요
export const OBSERVE = { id: "observe", icon: "🔍", label: "관찰하기", exp: 5, love: 1, anim: "observe", mood: "idle", daily: 3, fx: "🔍", observe: true };

// 관찰하면 들려주는 이야기 (도감 정보와 함께 써요)
export const OBSERVE_TIPS = {
  dog: [
    "강아지는 꼬리를 흔드는 방향과 속도로 기분을 표현해요.",
    "강아지의 코는 사람보다 냄새를 수만 배 더 잘 맡을 수 있어요.",
    "코의 주름 무늬는 사람의 지문처럼 강아지마다 달라요.",
    "강아지는 땀을 혀로 헐떡이며 몸의 열을 식혀요.",
  ],
  cat: [
    "고양이는 기분이 좋으면 '골골' 소리를 내요.",
    "고양이 수염은 좁은 곳을 지나갈 수 있는지 재는 자 역할을 해요.",
    "고양이는 하루의 절반 넘게 잠을 자요.",
    "꼬리를 바짝 세우고 다가오는 건 반갑다는 뜻이에요.",
  ],
  bug: [
    "곤충은 머리·가슴·배 세 부분으로 나뉘고, 다리는 6개예요.",
    "더듬이로 냄새를 맡아 먹이와 친구를 찾아요.",
    "딱정벌레의 단단한 앞날개(딱지날개)는 속날개를 보호하는 덮개예요.",
    "곤충은 뼈가 몸 바깥에 있어요. 이것을 '겉뼈대(외골격)'라고 해요.",
  ],
};

// ─────────────────────────────────────────────────────────────
//  꾸미기 아이템
//  slot: 같은 slot은 하나만 놓을 수 있어요(배경은 하나). space: indoor/nature/any
//  unlock: 처음부터 있음(start) / 성장 단계(stage) / 경험치(exp) / 도감 발견 수(dex) / 놀이 종류 수(plays)
// ─────────────────────────────────────────────────────────────
export const ITEMS = [
  // 배경
  { id: "bg-cozy", kind: "bg", name: "포근한 방", space: "indoor", unlock: { start: true } },
  { id: "bg-mint", kind: "bg", name: "민트 방", space: "indoor", unlock: { stage: 2 } },
  { id: "bg-sky", kind: "bg", name: "하늘 다락방", space: "indoor", unlock: { dex: 9 } },
  { id: "bg-forest", kind: "bg", name: "참나무 숲 사육장", space: "nature", unlock: { start: true } },
  { id: "bg-night", kind: "bg", name: "여름밤 사육장", space: "nature", unlock: { stage: 2 } },
  { id: "bg-flower", kind: "bg", name: "꽃밭 사육장", space: "nature", unlock: { dex: 9 } },
  // 방석
  { id: "cushion-blue", kind: "cushion", name: "하늘 방석", space: "indoor", unlock: { start: true } },
  { id: "cushion-yellow", kind: "cushion", name: "별 방석", space: "indoor", unlock: { exp: 100 } },
  // 장난감
  { id: "toy-ball", kind: "toy", name: "테니스공", space: "indoor", unlock: { start: true } },
  { id: "toy-yarn", kind: "toy", name: "털실 뭉치", space: "indoor", unlock: { plays: 2 } },
  { id: "toy-bone", kind: "toy", name: "뼈다귀 인형", space: "indoor", unlock: { stage: 3 } },
  // 그릇
  { id: "bowl-white", kind: "bowl", name: "하얀 밥그릇", space: "indoor", unlock: { start: true } },
  { id: "bowl-jelly", kind: "bowl", name: "곤충 젤리 받침", space: "nature", unlock: { start: true } },
  // 작은 집
  { id: "house-wood", kind: "house", name: "나무 집", space: "indoor", unlock: { stage: 2 } },
  { id: "house-tent", kind: "house", name: "캠핑 텐트", space: "indoor", unlock: { dex: 15 } },
  // 나무와 풀
  { id: "plant-pot", kind: "plant", name: "화분", space: "any", unlock: { start: true } },
  { id: "plant-grass", kind: "plant", name: "풀숲", space: "nature", unlock: { start: true } },
  { id: "plant-oak", kind: "plant", name: "참나무 가지", space: "nature", unlock: { stage: 2 } },
  // 곤충 사육장·놀이터
  { id: "log", kind: "terrarium", name: "썩은 참나무 통나무", space: "nature", unlock: { start: true } },
  { id: "leaf", kind: "terrarium", name: "낙엽 더미", space: "nature", unlock: { exp: 100 } },
  { id: "playground", kind: "playground", name: "곤충 놀이터(나무 사다리)", space: "nature", unlock: { plays: 2 } },
  { id: "bridge", kind: "playground", name: "나뭇가지 다리", space: "nature", unlock: { stage: 3 } },
  // 반려동물 장식 (몸에 달아요)
  { id: "acc-ribbon", kind: "acc", name: "리본", space: "any", unlock: { stage: 2 } },
  { id: "acc-scarf", kind: "acc", name: "목도리", space: "indoor", unlock: { stage: 3 } },
  { id: "acc-crown", kind: "acc", name: "꽃 왕관", space: "any", unlock: { stage: 4 } },
  { id: "acc-leaf", kind: "acc", name: "나뭇잎 모자", space: "nature", unlock: { dex: 6 } },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const ITEM_KINDS = [
  { id: "bg", name: "방 배경", icon: "🖼️" },
  { id: "cushion", name: "방석", icon: "🟦" },
  { id: "toy", name: "장난감", icon: "🎾" },
  { id: "bowl", name: "먹이 그릇", icon: "🥣" },
  { id: "house", name: "작은 집", icon: "🏠" },
  { id: "plant", name: "나무와 풀", icon: "🌿" },
  { id: "terrarium", name: "곤충 사육장", icon: "🪵" },
  { id: "playground", name: "곤충 놀이터", icon: "🪜" },
  { id: "acc", name: "반려동물 장식", icon: "🎀" },
];
export function unlockText(u) {
  if (u.start) return "처음부터 있어요";
  if (u.stage) return `'${GROWTH[u.stage - 1].name}' 단계가 되면`;
  if (u.exp) return `경험치 ${u.exp} 모으면`;
  if (u.dex) return `도감에서 ${u.dex}마리 발견하면`;
  if (u.plays) return `서로 다른 놀이 ${u.plays}가지 해 보면`;
  return "";
}

// ─────────────────────────────────────────────────────────────
//  배지 (도감 수집, 돌보기) — 도움 요청과는 전혀 관계없어요
// ─────────────────────────────────────────────────────────────
export const BADGES = [
  { id: "first-friend", icon: "🐾", name: "첫 친구", desc: "반려동물을 처음 만났어요" },
  { id: "dex-first", icon: "🔎", name: "첫 발견", desc: "도감에서 동물을 처음 발견했어요" },
  { id: "dex-dog", icon: "🐶", name: "강아지 박사", desc: "강아지 도감 6/6 완성" },
  { id: "dex-cat", icon: "🐱", name: "고양이 박사", desc: "고양이 도감 6/6 완성" },
  { id: "dex-bug", icon: "🪲", name: "곤충 박사", desc: "곤충 도감 6/6 완성" },
  { id: "dex-all", icon: "🏆", name: "도감 마스터", desc: "모든 동물 18/18 발견" },
  { id: "lifecycle", icon: "🥚", name: "한살이 탐험가", desc: "곤충의 한살이를 모두 살펴봤어요" },
  { id: "stage-4", icon: "🌟", name: "든든한 단짝", desc: "반려동물이 '성숙' 단계가 되었어요" },
  { id: "love-100", icon: "💖", name: "마음이 통해요", desc: "친밀도 100 달성" },
  { id: "all-plays", icon: "🎈", name: "놀이 대장", desc: "모든 놀이를 해 봤어요" },
];
export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));
