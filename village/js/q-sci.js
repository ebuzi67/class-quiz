// 🔬 과학 방 3개(1-2학년 슬기로운 생활, 3-4학년, 5-6학년). 방마다 퀴즈 미션 10개와 실험 미션 1개가 있어요.
// 실험 미션: 1-2 계절 옷 입히기, 3-4 물의 상태 변화, 5-6 전기 회로 연결하기
"use strict";

(() => {
  const { rnd, pick, shuffle, opts, big } = Quiz.tools;
  const emo = (e) => "<span style='font-size:1.8em'>" + e + "</span>";
  const row = (items) => "<div class='qz-big ar-row'>" + items.join(" ") + "</div>";
  // [문제, 정답, (풀이)] 은행. back이 있으면 거꾸로도 물어요.
  const bank = (list, ask, back) => () => {
    const [q, a, ex] = pick(list);
    if (back && rnd(0, 1)) return { text: back(a), choices: opts(q, list.filter((x) => x[1] !== a).map((x) => x[0])), answer: q, explain: ex || q + " → " + a };
    return { text: ask(q), choices: opts(a, list.filter((x) => x[1] !== a).map((x) => x[1])), answer: a, explain: ex || q + " → " + a };
  };
  // 그림을 보고 무리(정답 이름)를 고르는 문제
  const sortQ = (items, groups, ask, why) => () => {
    const [e, name, g] = pick(items);
    const ans = groups.find((x) => x === g || x.endsWith(" " + g));
    return { text: ask(name), visual: big(emo(e)), choices: groups, answer: ans, explain: why ? why(name, g) : name + " → " + ans };
  };
  // 순서 잇기: 차례 중 하나를 ❓로 가리고 맞혀요
  const orderQ = (seqs) => () => {
    const [title, seq] = pick(seqs), hole = rnd(0, seq.length - 1);
    const all = [...new Set(seqs.flatMap((s) => s[1]))];
    return { text: title + " ❓에 들어갈 것은?", visual: row([seq.map((x, i) => (i === hole ? "❓" : x)).join(" → ")]), choices: opts(seq[hole], all.filter((x) => !seq.includes(x)).concat(seq.filter((x) => x !== seq[hole]))), answer: seq[hole], explain: seq.join(" → ") };
  };

  // ───────────── 1-2학년: 탐구 놀이방 (슬기로운 생활) ─────────────
  const SEASON_ITEMS = [["🌸", "벚꽃", "봄"], ["🌷", "튤립", "봄"], ["🐝", "꿀벌", "봄"], ["🍓", "딸기", "봄"], ["🍉", "수박", "여름"], ["🏖️", "해수욕", "여름"], ["🍦", "아이스크림", "여름"], ["🦟", "모기", "여름"],
    ["🌻", "해바라기", "여름"], ["🍁", "단풍잎", "가을"], ["🌰", "밤", "가을"], ["🍂", "낙엽", "가을"], ["🎃", "호박", "가을"], ["⛄", "눈사람", "겨울"], ["🧣", "목도리", "겨울"], ["🧤", "장갑", "겨울"], ["🎄", "크리스마스", "겨울"], ["🛷", "썰매", "겨울"]];
  const SEASONS = ["🌸 봄", "☀️ 여름", "🍁 가을", "⛄ 겨울"];
  const seasonOf = (s) => SEASONS.find((x) => x.endsWith(s));
  const LIVING = [["🐶", "강아지", "동물"], ["🐱", "고양이", "동물"], ["🐟", "물고기", "동물"], ["🐦", "새", "동물"], ["🐛", "애벌레", "동물"], ["🐸", "개구리", "동물"], ["🦋", "나비", "동물"], ["🐢", "거북", "동물"], ["🐌", "달팽이", "동물"],
    ["🌻", "해바라기", "식물"], ["🌳", "나무", "식물"], ["🌵", "선인장", "식물"], ["🍀", "토끼풀", "식물"], ["🌹", "장미", "식물"], ["🌾", "벼", "식물"], ["🍄", "버섯", "둘 다 아니에요"], ["🪨", "돌멩이", "둘 다 아니에요"], ["🧸", "곰 인형", "둘 다 아니에요"]];
  const HOMES = [["🐟", "물고기", "🌊 물속"], ["🐙", "문어", "🌊 물속"], ["🐳", "고래", "🌊 물속"], ["🦀", "게", "🌊 물속"], ["🐶", "강아지", "🌳 땅 위"], ["🐰", "토끼", "🌳 땅 위"], ["🐘", "코끼리", "🌳 땅 위"], ["🐄", "소", "🌳 땅 위"],
    ["🐦", "참새", "☁️ 하늘"], ["🦅", "독수리", "☁️ 하늘"], ["🦋", "나비", "☁️ 하늘"], ["🐝", "꿀벌", "☁️ 하늘"], ["🦈", "상어", "🌊 물속"], ["🐿️", "다람쥐", "🌳 땅 위"], ["🦉", "부엉이", "☁️ 하늘"]];
  const SENSES = [["꽃 냄새를 맡을 때", "👃 코"], ["노랫소리를 들을 때", "👂 귀"], ["그림책을 볼 때", "👀 눈"], ["사탕 맛을 볼 때", "👅 혀"], ["털이 보드라운지 만져 볼 때", "✋ 손(피부)"],
    ["빵 굽는 냄새를 맡을 때", "👃 코"], ["새소리를 들을 때", "👂 귀"], ["무지개 색을 볼 때", "👀 눈"], ["레몬이 신지 맛볼 때", "👅 혀"], ["물이 차가운지 느낄 때", "✋ 손(피부)"], ["뜨거운 국인지 느낄 때", "✋ 손(피부)"], ["친구가 부르는 소리를 들을 때", "👂 귀"], ["신호등 색을 볼 때", "👀 눈"], ["김치가 매운지 맛볼 때", "👅 혀"]];
  const WEATHER = [["☀️", "맑은 날", "🕶️ 모자와 선글라스"], ["🌧️", "비 오는 날", "☂️ 우산과 장화"], ["❄️", "눈 오는 날", "🧤 장갑과 목도리"], ["🌬️", "바람 부는 날", "🪁 연날리기"], ["⛈️", "천둥 번개 치는 날", "🏠 집 안에 있기"], ["🌫️", "안개 낀 날", "🚶 천천히 조심해서 걷기"]];
  const BABY = [["닭", "병아리"], ["개", "강아지"], ["소", "송아지"], ["말", "망아지"], ["개구리", "올챙이"], ["나비", "애벌레"], ["고양이", "새끼 고양이"], ["곰", "새끼 곰"]];
  const FOOD = [["🥛", "우유", "🐄 소"], ["🥚", "달걀", "🐔 닭"], ["🍯", "꿀", "🐝 꿀벌"], ["🍚", "밥", "🌾 벼"], ["🍞", "빵", "🌾 밀"], ["🧀", "치즈", "🐄 소"], ["🍟", "감자튀김", "🥔 감자"], ["🧃", "사과 주스", "🍎 사과"], ["🍳", "달걀부침", "🐔 닭"], ["🧈", "버터", "🐄 소"], ["🍝", "국수", "🌾 밀"], ["🥗", "샐러드", "🥬 채소"], ["🍿", "팝콘", "🌽 옥수수"]];
  const FLOAT = [["🪵", "나무 막대", "둥둥 떠요"], ["🍂", "나뭇잎", "둥둥 떠요"], ["🦆", "고무 오리", "둥둥 떠요"], ["⚽", "공", "둥둥 떠요"], ["🧊", "얼음", "둥둥 떠요"], ["🍎", "사과", "둥둥 떠요"], ["🪶", "깃털", "둥둥 떠요"],
    ["🪨", "돌멩이", "가라앉아요"], ["🔑", "열쇠", "가라앉아요"], ["🥄", "숟가락", "가라앉아요"], ["📎", "클립", "가라앉아요"], ["🔩", "나사", "가라앉아요"], ["💍", "반지", "가라앉아요"]];
  const GROW12 = [["사람이 자라는 순서예요.", ["👶", "🧒", "🧑", "👴"]], ["개구리가 자라는 순서예요.", ["⚪알", "🐟올챙이", "🐸개구리"]], ["나비가 자라는 순서예요.", ["⚪알", "🐛애벌레", "🫘번데기", "🦋나비"]],
    ["식물이 자라는 순서예요.", ["🌰씨앗", "🌱싹", "🌿잎", "🌼꽃"]], ["닭이 자라는 순서예요.", ["🥚달걀", "🐣병아리", "🐔닭"]]];
  // 실험: 계절 옷 입히기
  const OUTFIT = [
    ["⛄ 추운 겨울", ["🧥 두꺼운 외투", "🧣 목도리", "🧤 장갑"]], ["☀️ 더운 여름", ["👕 반팔 옷", "🩳 반바지", "👒 밀짚모자"]],
    ["🌧️ 비 오는 날", ["☂️ 우산", "👢 장화"]], ["🌸 따뜻한 봄 소풍", ["👕 반팔 옷", "🧢 모자", "👟 운동화"]]
  ];
  const CLOTHES = ["🧥 두꺼운 외투", "🧣 목도리", "🧤 장갑", "👕 반팔 옷", "🩳 반바지", "👒 밀짚모자", "☂️ 우산", "👢 장화", "🧢 모자", "👟 운동화", "🩴 샌들", "🕶️ 선글라스"];

  Quiz.add({
    id: "sci12", e: "🌱", title: "탐구 놀이방", grade: "과학 1-2학년",
    missions: [
      { id: "season", e: "🍂", name: "봄 여름 가을 겨울", desc: "어느 계절일까요?", gen() {
        const [e, name, s] = pick(SEASON_ITEMS);
        if (rnd(0, 1)) return { text: "'" + name + "'은(는) 어느 계절과 어울릴까요?", visual: big(emo(e)), choices: SEASONS, answer: seasonOf(s), explain: name + "은(는) " + s + "에 볼 수 있어요." };
        const pickS = pick(["봄", "여름", "가을", "겨울"]), a = pick(SEASON_ITEMS.filter((x) => x[2] === pickS)), wr = shuffle(SEASON_ITEMS.filter((x) => x[2] !== pickS)).slice(0, 2);
        return { text: pickS + "에 볼 수 있는 것은?", choices: shuffle([a, ...wr]).map((x) => x[0] + " " + x[1]), answer: a[0] + " " + a[1], explain: a[1] + "은(는) " + pickS + "에 볼 수 있어요." };
      } },
      { id: "living", e: "🐾", name: "동물과 식물", desc: "살아 있는 것 나누기", gen: sortQ(LIVING, ["🐾 동물", "🌿 식물", "둘 다 아니에요"], (n) => "'" + n + "'은(는) 동물일까요, 식물일까요?",
        (n, g) => g === "둘 다 아니에요" ? n + "은(는) 동물도 식물도 아니에요." : n + "은(는) " + g + "이에요.") },
      { id: "home", e: "🏡", name: "동물이 사는 곳", desc: "물속, 땅 위, 하늘", gen: sortQ(HOMES, ["🌊 물속", "🌳 땅 위", "☁️ 하늘"], (n) => "'" + n + "'은(는) 주로 어디에서 지낼까요?") },
      { id: "senses", e: "👀", name: "우리 몸과 감각", desc: "눈, 귀, 코, 혀, 피부", gen: bank(SENSES, (q) => q + " 쓰는 곳은?") },
      { id: "weather", e: "🌦️", name: "날씨", desc: "날씨와 준비물", gen() {
        const [e, name, need] = pick(WEATHER);
        if (rnd(0, 1)) return { text: "이 날씨는 무엇일까요?", visual: big(emo(e)), choices: opts(name, WEATHER.map((w) => w[1])), answer: name, explain: e + " 은 " + name + "이에요." };
        return { text: name + "에 알맞은 것은?", visual: big(emo(e)), choices: opts(need, WEATHER.map((w) => w[2])), answer: need, explain: name + "에는 " + need + "!" };
      } },
      { id: "baby", e: "🐣", name: "동물 엄마와 아기", desc: "아기 이름 맞히기", gen: bank(BABY, (q) => q + "의 아기는?", (a) => "'" + a + "'은(는) 누구의 아기일까요?") },
      { id: "food", e: "🥛", name: "음식은 어디서 왔을까", desc: "음식의 고향", gen() {
        const [e, name, from] = pick(FOOD);
        return { text: name + "은(는) 어디에서 얻을까요?", visual: big(emo(e)), choices: opts(from, FOOD.map((f) => f[2])), answer: from, explain: name + "은(는) " + from.slice(from.indexOf(" ") + 1) + "에서 얻어요." };
      } },
      { id: "float", e: "🛁", name: "뜰까 가라앉을까", desc: "물에 넣어 보면?", gen: sortQ(FLOAT, ["🫧 둥둥 떠요", "⬇️ 가라앉아요"], (n) => "'" + n + "'을(를) 물에 넣으면 어떻게 될까요?") },
      { id: "grow", e: "🌱", name: "자라는 순서", desc: "어떻게 자랄까요?", gen: orderQ(GROW12) },
      { id: "nature", e: "🔍", name: "자연 관찰", desc: "관찰 도구와 방법", gen: bank([
        ["작은 개미를 크게 보고 싶을 때", "🔍 돋보기"], ["나비를 다치지 않게 잡을 때", "🥅 곤충 채집망"], ["오늘 기온을 알고 싶을 때", "🌡️ 온도계"], ["식물이 자라는 모습을 남길 때", "📓 관찰 일기"],
        ["밤하늘 별을 자세히 볼 때", "🔭 망원경"], ["씨앗을 심을 때", "🪴 화분과 흙"], ["물고기를 기를 때", "🐠 어항"], ["나뭇잎 길이를 잴 때", "📏 자"],
        ["바람이 어느 쪽으로 부는지 알 때", "🎏 바람개비"], ["곤충을 잠깐 넣어 관찰할 때", "🫙 관찰 통"], ["시간이 얼마나 지났는지 잴 때", "⏱️ 초시계"]
      ], (q) => q + " 필요한 것은?") },
      { id: "dress", e: "👕", name: "계절 옷 입히기", desc: "🧪 실험 · 날씨에 맞게 옷 고르기", make({ el, box, ctx, pass }) {
        const order = shuffle(OUTFIT).slice(0, 3);
        let k = 0;
        const head = el("div", "mg-q"), doll = el("div", "sc-doll"), grid = el("div", "sc-clothes"), msg = el("div", "mg-why");
        const ctrl = el("div", "rb-controls"), check = el("button", "btn btn-go", "✅ 다 입었어요");
        ctrl.append(check);
        box.append(head, doll, grid, msg, ctrl);
        let chosen = new Set();
        function show() {
          const [when] = order[k];
          chosen = new Set();
          head.textContent = when + "에 맞게 옷을 입혀 줘요! (" + (k + 1) + " / " + order.length + ")";
          ctx.speak(when.slice(when.indexOf(" ") + 1) + "에 맞게 옷을 입혀 줘요!");
          msg.textContent = "알맞은 것을 모두 눌러요.";
          draw();
        }
        function draw() {
          doll.innerHTML = "<span class='sc-kid'>🧒</span><span class='sc-wear'>" + [...chosen].map((c) => c.split(" ")[0]).join(" ") + "</span>";
          grid.innerHTML = "";
          CLOTHES.forEach((c) => {
            const b = el("button", "sc-cloth" + (chosen.has(c) ? " on" : ""), "<span>" + c.split(" ")[0] + "</span>" + c.slice(c.indexOf(" ") + 1));
            b.onclick = () => { ctx.sfx("pop"); chosen.has(c) ? chosen.delete(c) : chosen.add(c); draw(); };
            grid.append(b);
          });
        }
        check.onclick = () => {
          const need = order[k][1], miss = need.filter((c) => !chosen.has(c)), extra = [...chosen].filter((c) => !need.includes(c));
          if (miss.length || extra.length) {
            ctx.sfx("bump");
            msg.textContent = extra.length ? "🤔 " + extra.map((c) => c.slice(c.indexOf(" ") + 1)).join(", ") + "은(는) 어울리지 않아요." : "🤔 아직 필요한 것이 " + miss.length + "개 더 있어요.";
            ctx.speak(msg.textContent);
            return;
          }
          ctx.sfx("win"); msg.textContent = "🎉 딱 맞아요!"; ctx.speak("딱 맞아요!");
          k++;
          if (k >= order.length) { check.disabled = true; head.textContent = "🎉 실험 성공! 날씨에 맞게 옷을 잘 입었어요."; pass(); return; }
          setTimeout(show, 1200);
        };
        show();
      } }
    ]
  });

  // ───────────── 3-4학년: 실험실 ─────────────
  const MATERIAL = [["🥄", "숟가락", "금속"], ["🔑", "열쇠", "금속"], ["📎", "클립", "금속"], ["✏️", "연필", "나무"], ["🪑", "의자", "나무"], ["🥢", "젓가락(나무)", "나무"], ["🧸", "곰 인형", "섬유(천)"], ["🧦", "양말", "섬유(천)"],
    ["🥤", "빨대 컵", "플라스틱"], ["🪣", "양동이", "플라스틱"], ["🥛", "유리컵", "유리"], ["🪟", "창문", "유리"], ["🎈", "풍선", "고무"], ["🩴", "슬리퍼", "고무"]];
  const MAGNET = [
    ["자석에서 철을 끌어당기는 힘이 가장 센 곳은?", "양쪽 끝(극)"], ["자석의 같은 극끼리 가까이 하면?", "서로 밀어내요"], ["자석의 다른 극끼리 가까이 하면?", "서로 끌어당겨요"],
    ["자석을 물에 띄우면 N극은 어느 쪽을 가리킬까요?", "북쪽"], ["나침반 바늘은 무엇일까요?", "작은 자석"], ["자석에 붙는 물체는 무엇으로 만들었을까요?", "철"],
    ["자석을 반으로 자르면?", "조각마다 N극과 S극이 생겨요"], ["자석과 철 클립 사이에 종이를 끼우면?", "그래도 끌어당겨요"],
    ["막대자석 주위에 철가루를 뿌리면 많이 모이는 곳은?", "양쪽 끝(극)"], ["나침반 바늘의 N극이 가리키는 쪽은?", "북쪽"], ["자석 두 개의 N극과 S극을 마주 대면?", "서로 끌어당겨요"], ["냉장고 문에 붙는 메모 자석은 무엇에 붙을까요?", "철로 된 문"], ["자석을 이용한 물건", "나침반"]
  ];
  const LIFE34 = [["배추흰나비의 한살이예요.", ["알", "애벌레", "번데기", "어른벌레"]], ["개구리의 한살이예요.", ["알", "올챙이", "뒷다리 나온 올챙이", "개구리"]], ["닭의 한살이예요.", ["알", "병아리", "큰 닭"]],
    ["사슴벌레의 한살이예요.", ["알", "애벌레", "번데기", "어른벌레"]], ["잠자리의 한살이(번데기가 없어요)예요.", ["알", "애벌레", "어른벌레"]], ["사마귀의 한살이(번데기가 없어요)예요.", ["알", "애벌레", "어른벌레"]]];
  const ANIMAL34 = [
    ["다리가 6개이고 몸이 머리·가슴·배로 나뉘는 동물", "곤충"], ["거미는 다리가 몇 개일까요?", "8개"], ["배추흰나비 애벌레가 먹는 것은?", "배추 잎"], ["번데기 시기가 있는 곤충의 한살이를 무엇이라고 할까요?", "완전 탈바꿈"],
    ["번데기 시기가 없는 곤충의 한살이를 무엇이라고 할까요?", "불완전 탈바꿈"], ["새끼를 낳아 젖을 먹여 기르는 동물", "포유류"], ["물속에서 아가미로 숨 쉬는 동물", "물고기"], ["깃털이 있고 알을 낳는 동물", "새"],
    ["잠자리는 다리가 몇 개일까요?", "6개"], ["알을 낳는 동물", "닭"], ["새끼를 낳는 동물", "강아지"], ["땅속에서 사는 동물", "두더지"], ["물과 땅을 오가며 사는 동물", "개구리"]
  ];
  const PLANT34 = [
    ["사막에 사는 선인장의 가시는 원래 무엇이 변한 것일까요?", "잎"], ["물에 떠서 사는 부레옥잠의 잎자루에 있는 것은?", "공기주머니"], ["식물의 뿌리가 하는 일은?", "물을 흡수하고 식물을 지탱해요"],
    ["줄기가 하는 일은?", "물이 이동하는 통로예요"], ["잎이 햇빛을 받아 양분을 만드는 일", "광합성"], ["강가나 연못에 사는 식물", "부들"], ["높은 산이나 추운 곳에 사는 식물", "눈잣나무"],
    ["잎이 넓적하고 뿌리가 물속 땅에 있는 식물", "연꽃"], ["물에 떠서 사는 식물", "개구리밥"], ["추운 겨울에도 잎이 푸른 나무", "소나무"], ["잎이 바늘처럼 뾰족한 나무", "잣나무"], ["씨가 바람에 잘 날리도록 날개가 있는 나무", "단풍나무"]
  ];
  const ROCK34 = [
    ["지층에서 가장 먼저 쌓인 층은?", "맨 아래층"], ["옛날 생물의 몸이나 흔적이 돌에 남은 것", "화석"], ["알갱이가 진흙처럼 아주 고운 퇴적암", "이암"], ["모래가 굳어서 된 퇴적암", "사암"],
    ["자갈이 섞여 굳어서 된 퇴적암", "역암"], ["물고기 화석이 나온 곳은 옛날에 어떤 곳이었을까요?", "물속(바다나 호수)"], ["흐르는 물이 흙을 깎는 일", "침식"], ["흐르는 물이 흙을 쌓는 일", "퇴적"],
    ["지층은 어떤 모양으로 쌓여 있을까요?", "층층이 줄무늬"], ["조개 화석이 산에서 발견됐다면 그곳은 옛날에?", "바다였어요"], ["공룡 발자국이 남은 것도 화석일까요?", "화석이에요"], ["알갱이 크기가 가장 큰 퇴적암", "역암"]
  ];
  const WATER34 = [
    ["🧊", "얼음은 어떤 상태일까요?", "고체"], ["💧", "물은 어떤 상태일까요?", "액체"], ["♨️", "수증기는 어떤 상태일까요?", "기체"], ["👕", "젖은 빨래가 마르는 것처럼 물이 천천히 수증기로 변하는 것은?", "증발"],
    ["🫖", "물이 끓으면서 거품이 생기고 수증기로 빠르게 변하는 것은?", "끓음"], ["🥤", "차가운 컵 바깥에 물방울이 맺히는 것은?", "응결"], ["🧊", "물이 얼면 부피는?", "늘어나요"], ["🧊", "얼음이 녹으면 무게는?", "그대로예요"],
    ["🌧️", "구름 속 물방울이 커져 떨어지는 것은?", "비"], ["💨", "물이 끓을 때 보이는 하얀 김은 무엇이 식은 것일까요?", "작은 물방울"], ["🍦", "아이스크림이 녹는 것은 무엇이 무엇으로 바뀐 것일까요?", "고체 → 액체"], ["🥶", "물이 어는 온도는?", "0℃"], ["🫖", "물이 끓는 온도는?", "100℃"]
  ];
  const LIGHT34 = [
    ["빛이 물체에 막혀 생기는 어두운 부분", "그림자"], ["손전등을 물체에 가까이 하면 그림자 크기는?", "커져요"], ["손전등을 물체에서 멀리 하면 그림자 크기는?", "작아져요"],
    ["유리처럼 투명한 물체의 그림자는?", "연하게 생겨요"], ["거울에 비친 모습은 실제와 어떻게 달라요?", "좌우가 바뀌어요"], ["빛이 거울에 부딪혀 방향이 바뀌는 것", "빛의 반사"],
    ["빛이 나아가는 모양", "곧게 나아가요"], ["그림자 모양은 무엇을 닮을까요?", "물체 모양"], ["불투명한 물체의 그림자는?", "진하게 생겨요"], ["잠망경은 무엇을 써서 만들까요?", "거울"], ["햇빛을 받으면 그림자는 어느 쪽에 생길까요?", "해의 반대쪽"]
  ];
  const SOUND34 = [
    ["소리가 나는 물체를 만져 보면 느껴지는 것은?", "떨림"], ["작은북을 세게 치면 소리는?", "커져요"], ["실로폰의 짧은 음판을 치면 소리는?", "높아요"], ["실로폰의 긴 음판을 치면 소리는?", "낮아요"],
    ["소리가 벽에 부딪혀 되돌아오는 것", "소리의 반사"], ["실 전화기는 무엇을 통해 소리가 전해질까요?", "실(고체)"], ["물속에서도 소리가 들릴까요?", "들려요"],
    ["큰북을 약하게 치면 소리는?", "작아져요"], ["기타 줄을 짧게 잡고 튕기면 소리는?", "높아져요"], ["소리를 줄이려고 벽에 붙이는 것", "방음벽"], ["달처럼 공기가 없는 곳에서는 소리가?", "전해지지 않아요"], ["떨림이 크면 소리는?", "커져요"]
  ];
  const STATE_EMO = { ice: "🧊", water: "💧", steam: "♨️" };

  Quiz.add({
    id: "sci34", e: "🧪", title: "실험실", grade: "과학 3-4학년",
    missions: [
      { id: "material", e: "🥄", name: "물체와 물질", desc: "무엇으로 만들었을까?", gen() {
        const [e, name, m] = pick(MATERIAL), mats = [...new Set(MATERIAL.map((x) => x[2]))];
        if (rnd(0, 1)) return { text: "'" + name + "'은(는) 주로 어떤 물질로 만들었을까요?", visual: big(emo(e)), choices: opts(m, mats), answer: m, explain: name + "은(는) " + m + "(으)로 만들어요." };
        const a = pick(MATERIAL.filter((x) => x[2] === m)), wr = shuffle(MATERIAL.filter((x) => x[2] !== m)).slice(0, 2);
        return { text: m + "(으)로 만든 물체는?", choices: shuffle([a, ...wr]).map((x) => x[0] + " " + x[1]), answer: a[0] + " " + a[1], explain: a[1] + "은(는) " + m + "(으)로 만들어요." };
      } },
      { id: "magnet", e: "🧲", name: "자석의 성질", desc: "극, 나침반", gen: bank(MAGNET, (q) => q) },
      { id: "life", e: "🐛", name: "동물의 한살이", desc: "알부터 어른까지", gen: orderQ(LIFE34) },
      { id: "animal", e: "🐞", name: "동물의 생활", desc: "곤충, 동물 분류", gen: bank(ANIMAL34, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "plant", e: "🌵", name: "식물의 생활", desc: "사는 곳과 생김새", gen: bank(PLANT34, (q) => q.endsWith("?") ? q : "'" + q + "'은(는) 무엇일까요?") },
      { id: "rock", e: "🪨", name: "지층과 화석", desc: "퇴적암, 화석", gen: bank(ROCK34, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "water", e: "💧", name: "물의 상태 변화", desc: "고체, 액체, 기체", gen() {
        const [e, q, a] = pick(WATER34);
        return { text: q, visual: big(emo(e)), choices: opts(a, WATER34.map((w) => w[2])), answer: a, explain: "얼음(고체) ⇄ 물(액체) ⇄ 수증기(기체)" };
      } },
      { id: "light", e: "🔦", name: "그림자와 거울", desc: "빛의 성질", gen: bank(LIGHT34, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "sound", e: "🔔", name: "소리의 성질", desc: "떨림, 높낮이", gen: bank(SOUND34, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "heavy", e: "⚖️", name: "무게 비교", desc: "저울과 무게", gen() {
        if (rnd(0, 2)) {
          const a = rnd(1, 9) * 10, b = rnd(1, 9) * 10;
          if (a === b) return { text: "양팔저울 양쪽에 같은 무게를 올리면?", choices: ["수평이 돼요", "왼쪽이 내려가요", "오른쪽이 내려가요"], answer: "수평이 돼요", explain: "무게가 같으면 수평을 이뤄요." };
          return { text: "양팔저울 왼쪽에 " + a + "g, 오른쪽에 " + b + "g을 올리면?", visual: row(["⚖️", a + "g", "|", b + "g"]), choices: ["왼쪽이 내려가요", "오른쪽이 내려가요", "수평이 돼요"], answer: a > b ? "왼쪽이 내려가요" : "오른쪽이 내려가요", key: a + "," + b, explain: "무거운 쪽이 아래로 내려가요." };
        }
        const B = [["용수철저울에 무거운 물체를 걸면 용수철은?", "더 많이 늘어나요"], ["무게를 정확하게 재려면 쓰는 도구는?", "저울"], ["시소에서 무거운 사람은 받침점에서 어떻게 앉으면 수평이 될까요?", "더 가까이"]];
        const [q, a] = pick(B); return { text: q, choices: opts(a, ["더 많이 늘어나요", "저울", "더 가까이", "더 멀리", "줄어들어요"]), answer: a, explain: q + " → " + a };
      } },
      { id: "waterlab", e: "🌡️", name: "물의 상태 변화 실험", desc: "🧪 실험 · 데우고 식혀 보기", make({ el, box, ctx, pass }) {
        const TASKS = [["ice", "🧊 얼음을 만들어요"], ["steam", "♨️ 수증기를 만들어요"], ["water", "💧 다시 물로 만들어요"]];
        let temp = 20, k = 0;
        const head = el("div", "mg-q"), lab = el("div", "sc-lab"), msg = el("div", "mg-why");
        const ctrl = el("div", "rb-controls"), cool = el("button", "btn btn-soft", "❄️ 식히기 (−10℃)"), heat = el("button", "btn btn-go", "🔥 데우기 (+10℃)");
        ctrl.append(cool, heat);
        box.append(head, lab, ctrl, msg);
        const state = () => (temp <= 0 ? "ice" : temp >= 100 ? "steam" : "water");
        const NAME = { ice: "얼음(고체)", water: "물(액체)", steam: "수증기(기체)" };
        function draw() {
          const s = state(), fill = Math.max(0, Math.min(100, (temp + 20) / 1.4));
          lab.innerHTML = "<div class='sc-beaker " + s + "'><span>" + STATE_EMO[s] + "</span></div><div class='sc-thermo'><i style='height:" + fill + "%'></i></div><div class='sc-temp'>" + temp + "℃<br><small>" + NAME[s] + "</small></div>";
        }
        function task() { head.textContent = TASKS[k][1] + " (" + (k + 1) + " / 3)"; ctx.speak(TASKS[k][1].slice(3)); }
        const step = (d) => {
          temp = Math.max(-20, Math.min(120, temp + d)); ctx.sfx("tap"); draw();
          const s = state();
          if (s === TASKS[k][0]) {
            ctx.sfx("win");
            msg.textContent = "🎉 " + temp + "℃에서 " + NAME[s] + "이(가) 됐어요! " + (s === "ice" ? "물은 0℃에서 얼어요." : s === "steam" ? "물은 100℃에서 끓어 수증기가 돼요." : "0℃와 100℃ 사이에서는 물이에요.");
            ctx.speak(msg.textContent);
            k++;
            if (k >= TASKS.length) { cool.disabled = heat.disabled = true; head.textContent = "🎉 실험 성공! 물은 온도에 따라 모습이 바뀌어요."; pass(); return; }
            setTimeout(task, 1500);
          }
        };
        cool.onclick = () => step(-10);
        heat.onclick = () => step(10);
        draw(); task();
        msg.textContent = "식히기와 데우기 버튼으로 온도를 바꿔 봐요.";
      } }
    ]
  });

  // ───────────── 5-6학년: 연구소 ─────────────
  const CIRCUIT = [
    ["전구에 불이 켜지려면 전기가 끊기지 않고 한 바퀴 흘러야 해요. 이런 회로를?", "닫힌 회로"], ["전구 2개를 한 줄로 이어 연결하는 방법", "직렬연결"], ["전구 2개를 여러 갈래로 나누어 연결하는 방법", "병렬연결"],
    ["전구 하나를 빼도 다른 전구가 계속 켜지는 연결", "병렬연결"], ["전기가 잘 통하는 물질", "금속"], ["전기가 통하지 않는 물질", "고무"], ["전선을 감은 코일에 전기를 흘려 만든 자석", "전자석"],
    ["전자석의 세기를 세게 하려면?", "코일을 더 많이 감아요"], ["전자석의 극을 바꾸려면?", "전지의 방향을 바꿔요"],
    ["전지의 +극과 −극을 바꾸면 전구는?", "그래도 켜져요"], ["전구 2개 직렬연결과 병렬연결 중 더 밝은 것은?", "병렬연결"], ["전기를 아끼는 방법", "안 쓰는 전등 끄기"], ["전기가 흐르는 길을 끊었다 이었다 하는 장치", "스위치"]
  ];
  const SOLUTION = [
    ["소금물에서 소금처럼 녹는 물질", "용질"], ["소금물에서 물처럼 녹이는 물질", "용매"], ["소금이 물에 녹아 골고루 섞인 것", "용액"], ["물의 온도가 높으면 설탕이 녹는 양은?", "많아져요"],
    ["용액은 시간이 지나면 가라앉는 것이 있을까요?", "없어요"], ["더 진한 설탕물에 방울토마토를 넣으면?", "더 높이 떠요"], ["물질이 물에 녹아도 전체 무게는?", "그대로예요"],
    ["설탕을 물에 녹이면 설탕은 어디로 갈까요?", "작게 나뉘어 물속에 있어요"], ["물에 녹지 않는 물질", "모래"], ["같은 양의 물에 가장 많이 녹는 것(소금·설탕·베이킹 소다 중)", "설탕"], ["용액의 진하기를 비교하는 도구로 쓸 수 있는 것", "방울토마토"], ["물을 저으면 설탕이 녹는 빠르기는?", "빨라져요"], ["설탕물과 물을 구별하는 방법(맛보지 않고)", "증발시켜 남는 것 보기"]
  ];
  const WEATHER56 = [
    ["공기 중에 수증기가 포함된 정도", "습도"], ["밤에 차가워진 풀잎에 수증기가 맺힌 물방울", "이슬"], ["지표면 가까이에 작은 물방울이 떠 있는 것", "안개"], ["하늘 높이 작은 물방울이나 얼음 알갱이가 떠 있는 것", "구름"],
    ["바람은 어디에서 어디로 불까요?", "고기압에서 저기압으로"], ["맑은 날 낮에 바닷가에서 부는 바람", "바다에서 육지로"], ["습도가 높으면 빨래는?", "잘 안 말라요"],
    ["밤에 바닷가에서 부는 바람", "육지에서 바다로"], ["날씨를 미리 알려 주는 것", "일기 예보"], ["구름 속 얼음 알갱이가 녹지 않고 떨어진 것", "눈"], ["습도를 재는 도구", "습도계"]
  ];
  const PLANETS = ["수성", "금성", "지구", "화성", "목성", "토성", "천왕성", "해왕성"];
  const SPACE = [["태양계에서 가장 큰 행성", "목성"], ["커다란 고리가 있는 행성", "토성"], ["붉게 보이는 행성", "화성"], ["태양에서 가장 가까운 행성", "수성"], ["우리가 사는 행성", "지구"],
    ["태양계의 중심에서 빛을 내는 별", "태양"], ["북두칠성과 카시오페이아로 찾는 별", "북극성"]];
  const PLANT56 = [
    ["물을 흡수하고 식물을 지탱하는 부분", "뿌리"], ["물과 양분이 이동하는 통로", "줄기"], ["햇빛을 받아 양분을 만드는 곳", "잎"], ["꽃가루받이를 하여 씨를 만드는 부분", "꽃"], ["잎의 기공으로 물이 수증기가 되어 나가는 것", "증산 작용"],
    ["바람에 날려 씨가 퍼지는 식물", "민들레"], ["동물 털에 붙어 씨가 퍼지는 식물", "도꼬마리"], ["열매가 터지면서 씨가 퍼지는 식물", "봉선화"],
    ["씨가 싹 트는 데 필요한 것", "물과 알맞은 온도"], ["양분을 만들 때 잎이 쓰는 것", "햇빛과 물, 이산화 탄소"], ["잎에서 녹말을 확인하는 용액", "아이오딘 용액"], ["씨를 감싸고 있는 부분", "열매"]
  ];
  const ACID = [["🍋", "레몬즙", "산성"], ["🧴", "식초", "산성"], ["🥤", "탄산수", "산성"], ["🍊", "귤즙", "산성"], ["🧼", "비눗물", "염기성"], ["🧽", "유리 세정제", "염기성"], ["🥚", "석회수", "염기성"], ["🦷", "치약 물", "염기성"]];
  const ACID_INFO = [["산성 용액에 넣은 푸른색 리트머스 종이는?", "붉게 변해요"], ["염기성 용액에 넣은 붉은색 리트머스 종이는?", "푸르게 변해요"], ["페놀프탈레인 용액은 염기성에서 무슨 색?", "붉은색"], ["산성 용액에 염기성 용액을 계속 넣으면?", "산성이 약해져요"]];
  const BODY = [["음식이 지나가는 순서(소화)예요.", ["입", "식도", "위", "작은창자", "큰창자"]], ["숨 쉴 때 공기가 지나가는 순서예요.", ["코", "기관", "기관지", "폐"]], ["오줌이 만들어져 나가는 순서예요.", ["콩팥", "방광", "요도"]]];
  const BODY_INFO = [["혈액을 온몸으로 보내는 펌프", "심장"], ["몸의 형태를 만들고 몸을 지탱하는 것", "뼈"], ["뼈에 붙어 몸을 움직이게 하는 것", "근육"], ["혈액 속 노폐물을 걸러 내는 기관", "콩팥"], ["자극을 느끼고 반응을 결정하는 기관", "뇌"]];
  const EARTH56 = [["지구가 하루에 한 바퀴씩 스스로 도는 것", "자전"], ["지구가 1년에 한 바퀴 태양 둘레를 도는 것", "공전"], ["낮과 밤이 생기는 까닭", "지구의 자전"], ["계절에 따라 보이는 별자리가 달라지는 까닭", "지구의 공전"],
    ["여름에 태양의 남중 고도는?", "높아요"], ["달의 모양이 같은 모양으로 돌아오는 데 걸리는 시간", "약 30일"], ["태양이 동쪽에서 떠서 서쪽으로 지는 것처럼 보이는 까닭", "지구의 자전"], ["보름달은 몇 시쯤 동쪽 하늘에 떠오를까요?", "해 질 무렵"], ["계절이 생기는 까닭", "지구가 기울어진 채 공전해서"], ["달이 지구 둘레를 도는 것", "달의 공전"], ["겨울에 그림자 길이는?", "길어요"]];
  const ENERGY = [["💡", "전등", "전기 → 빛"], ["🔊", "스피커", "전기 → 소리"], ["🌀", "선풍기", "전기 → 운동"], ["🍳", "전기 프라이팬", "전기 → 열"], ["🚗", "자동차(휘발유)", "화학 → 운동"], ["🎢", "롤러코스터(내려갈 때)", "위치 → 운동"], ["☀️", "태양 전지", "빛 → 전기"], ["🔥", "모닥불", "화학 → 열과 빛"], ["💨", "풍력 발전기", "운동 → 전기"], ["💧", "수력 발전소", "위치 → 전기"], ["🍎", "사람이 음식을 먹고 달리기", "화학 → 운동"]];
  const FIRE = [["물질이 탈 때 꼭 필요한 기체", "산소"], ["물질이 불에 타기 시작하는 가장 낮은 온도", "발화점"], ["초를 유리병으로 덮으면 불이 꺼지는 까닭", "산소가 없어서"], ["모래로 불을 덮어 끄는 방법", "산소 막기"],
    ["가스레인지의 밸브를 잠가 불을 끄는 방법", "탈 물질 없애기"], ["물을 뿌려 불을 끄는 방법", "온도 낮추기"], ["초가 탄 뒤 생기는 물질", "물과 이산화 탄소"], ["불이 나면 몸을 낮추고 무엇으로 입과 코를 막을까요?", "젖은 수건"], ["소화기를 쓸 때 먼저 하는 일", "안전핀 뽑기"], ["불이 나면 피해야 할 곳", "엘리베이터"], ["불이 났을 때 연락하는 번호", "119"], ["알코올램프 불을 끄는 방법", "뚜껑 덮기"]];
  // 실험: 전기 회로(빈칸에 재료를 넣어 회로를 이어요)
  const PARTS = [["🔩", "철 못", true], ["📎", "철 클립", true], ["🪙", "동전", true], ["🔗", "전선", true], ["🥄", "쇠숟가락", true], ["🪵", "나무 막대", false], ["🎈", "고무풍선", false], ["📄", "종이", false], ["🥤", "플라스틱 빨대", false], ["🧶", "털실", false]];

  Quiz.add({
    id: "sci56", e: "⚡", title: "연구소", grade: "과학 5-6학년",
    missions: [
      { id: "circuit", e: "🔌", name: "전기 회로와 전자석", desc: "직렬, 병렬, 전자석", gen: bank(CIRCUIT, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "solution", e: "🧂", name: "용해와 용액", desc: "용질, 용매, 용액", gen: bank(SOLUTION, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "weather", e: "☁️", name: "날씨와 우리 생활", desc: "습도, 이슬, 바람", gen: bank(WEATHER56, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "space", e: "🪐", name: "태양계와 별", desc: "행성 순서, 북극성", gen() {
        if (rnd(0, 1)) {
          const s = rnd(0, 4), hole = rnd(0, 3), seq = PLANETS.slice(s, s + 4), ans = seq[hole];
          return { text: "태양에서 가까운 순서예요. ❓에 들어갈 행성은?", visual: row(seq.map((p, i) => (i === hole ? "❓" : p))), choices: opts(ans, PLANETS.filter((p) => p !== ans)), answer: ans, key: s + "," + hole, explain: "수성 → 금성 → 지구 → 화성 → 목성 → 토성 → 천왕성 → 해왕성" };
        }
        return bank(SPACE, (q) => "'" + q + "'은(는) 무엇일까요?")();
      } },
      { id: "plant", e: "🌿", name: "식물의 구조와 기능", desc: "뿌리, 줄기, 잎, 꽃", gen: bank(PLANT56, (q) => "'" + q + "'은(는) 무엇일까요?") },
      { id: "acid", e: "🧫", name: "산과 염기", desc: "리트머스, 지시약", gen() {
        if (rnd(0, 1)) { const [e, n, k] = pick(ACID); return { text: "'" + n + "'은(는) 산성일까요, 염기성일까요?", visual: big(emo(e)), choices: ["🍋 산성", "🧼 염기성"], answer: k === "산성" ? "🍋 산성" : "🧼 염기성", explain: n + "은(는) " + k + "이에요." }; }
        return bank(ACID_INFO, (q) => q)();
      } },
      { id: "body", e: "🫀", name: "우리 몸의 구조", desc: "소화, 호흡, 순환", gen() { return rnd(0, 1) ? orderQ(BODY)() : bank(BODY_INFO, (q) => "'" + q + "'은(는) 무엇일까요?")(); } },
      { id: "earth", e: "🌍", name: "지구와 달의 운동", desc: "자전, 공전", gen: bank(EARTH56, (q) => q.endsWith("?") ? q : "'" + q + "'을(를) 무엇이라고 할까요?") },
      { id: "energy", e: "🔋", name: "에너지 전환", desc: "에너지가 바뀌는 모습", gen() {
        const [e, n, a] = pick(ENERGY);
        return { text: "'" + n + "'에서 에너지는 어떻게 바뀔까요?", visual: big(emo(e)), choices: opts(a, ENERGY.map((x) => x[2])), answer: a, explain: n + ": " + a + " 에너지" };
      } },
      { id: "fire", e: "🔥", name: "연소와 소화", desc: "불이 타는 조건과 끄는 방법", gen: bank(FIRE, (q) => q.endsWith("?") ? q : "'" + q + "'은(는) 무엇일까요?") },
      { id: "circuitlab", e: "💡", name: "전기 회로 실험", desc: "🧪 실험 · 전구에 불 켜기", make({ el, box, ctx, pass }) {
        const ROUNDS = [1, 2, 3];
        let k = 0, slots = [];
        const head = el("div", "mg-q"), board = el("div", "sc-circuit"), shelf = el("div", "sc-parts"), msg = el("div", "mg-why");
        const ctrl = el("div", "rb-controls"), sw = el("button", "btn btn-go", "🔘 스위치 켜기"), reset = el("button", "btn btn-soft", "🔄 빈칸 비우기");
        ctrl.append(reset, sw);
        box.append(head, board, shelf, ctrl, msg);
        let sel = 0;
        function show() {
          slots = Array(ROUNDS[k]).fill(null); sel = 0;
          head.textContent = "💡 빈칸 " + ROUNDS[k] + "곳에 재료를 넣어 전구에 불을 켜요 (" + (k + 1) + " / " + ROUNDS.length + ")";
          ctx.speak("빈칸에 재료를 넣어 전구에 불을 켜 봐요.");
          msg.textContent = "아래 재료를 누르면 빈칸에 들어가요.";
          draw(false);
        }
        function draw(lit) {
          board.innerHTML = "";
          board.className = "sc-circuit" + (lit ? " lit" : "");
          board.append(el("div", "sc-bulb", lit ? "💡" : "🔅"), el("div", "sc-battery", "🔋"));
          const wire = el("div", "sc-wire");
          slots.forEach((p, i) => {
            const s = el("button", "sc-slot" + (i === sel ? " sel" : "") + (p ? " full" : ""), p ? p[0] + "<small>" + p[1] + "</small>" : "빈칸");
            s.onclick = () => { sel = i; ctx.sfx("tap"); draw(false); };
            wire.append(s);
          });
          board.append(wire);
          shelf.innerHTML = "";
          shuffleOnce.forEach((p) => {
            const b = el("button", "sc-part", "<span>" + p[0] + "</span>" + p[1]);
            b.onclick = () => { slots[sel] = p; ctx.sfx("pop"); sel = Math.min(slots.length - 1, sel + 1); draw(false); };
            shelf.append(b);
          });
        }
        const shuffleOnce = shuffle(PARTS);
        reset.onclick = () => { slots = slots.map(() => null); sel = 0; ctx.sfx("tap"); draw(false); };
        sw.onclick = () => {
          if (slots.some((p) => !p)) { msg.textContent = "아직 빈칸이 있어요. 회로가 끊겨 있으면 불이 켜지지 않아요."; ctx.speak(msg.textContent); ctx.sfx("bump"); return; }
          const bad = slots.filter((p) => !p[2]);
          if (bad.length) { draw(false); ctx.sfx("bump"); msg.textContent = "🔅 불이 안 켜져요. " + bad.map((p) => p[1]).join(", ") + "은(는) 전기가 통하지 않아요."; ctx.speak(msg.textContent); return; }
          draw(true); ctx.sfx("win");
          msg.textContent = "💡 불이 켜졌어요! " + slots.map((p) => p[1]).join(", ") + "은(는) 전기가 통하는 금속이라 닫힌 회로가 됐어요.";
          ctx.speak("불이 켜졌어요! 금속은 전기가 잘 통해요.");
          k++;
          if (k >= ROUNDS.length) { sw.disabled = true; head.textContent = "🎉 실험 성공! 전기가 통하는 물질로 회로를 이었어요."; pass(); return; }
          setTimeout(show, 1800);
        };
        show();
      } }
    ]
  });
  // 🔬 과학 연구소 입구(건물 그림이 오기 전까지 쓰는 임시 창)
  Activities.register("scihub", ({ el, frame, ctx }) => {
    const root = frame("🔬 과학 연구소: 몇 학년 방으로 갈까요?");
    root.append(Quiz.npcBanner(el, Quiz.NPCS.sci, "안녕! 나는 궁금 박사야. 궁금한 건 실험으로 알아보자!"));
    const grid = el("div", "qz-missions");
    Quiz.rooms.filter((r) => r.id.startsWith("sci")).forEach((r) => {
      const p = ctx.getProgress(r.id) || { done: [] };
      const all = p.done.length === r.missions.length;
      const b = el("button", "qz-mission" + (all ? " done" : ""), "<span>" + r.e + "</span><b>" + r.grade.replace(/^\S+ /, "") + "</b><small>" + r.title + " · " + (all ? "✅ 도장" : "미션 " + p.done.length + "/" + r.missions.length) + "</small>");
      b.onclick = () => { ctx.sfx("door"); Activities.open(r.id); };
      grid.append(b);
    });
    root.append(grid);
    ctx.speak("과학 연구소예요. 몇 학년 방으로 갈까요?");
  });
})();
