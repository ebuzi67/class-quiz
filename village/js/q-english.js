// 🔤 영어 방 3개(1-2학년, 3-4학년, 5-6학년)
// 영어 낱말과 문장은 sayEn으로 영어 목소리가 읽어 줘요(답이 들리면 안 되는 문제는 읽지 않아요).
// 1-2학년은 교과 전 놀이(알파벳, 그림 낱말), 3-4학년과 5-6학년은 초등 영어 교과 표현이에요.
"use strict";

(() => {
  const { rnd, pick, shuffle, opts, ieyo, clock, big } = Quiz.tools;
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOOKALIKE = { b: "dpq", d: "bpq", p: "bdq", q: "bdp", m: "nw", n: "mu", u: "nv", v: "uw", w: "vm", i: "jl", j: "il", l: "it" };
  const big1 = (t) => "<div class='qz-big' style='font-size:56px'>" + t + "</div>";

  // [그림, 영어, 뜻]
  const WORDS = [
    ["🍎", "apple", "사과"], ["🍌", "banana", "바나나"], ["🐱", "cat", "고양이"], ["🐶", "dog", "개"], ["🥚", "egg", "달걀"], ["🐟", "fish", "물고기"],
    ["🍇", "grape", "포도"], ["🎩", "hat", "모자"], ["🦁", "lion", "사자"], ["🌙", "moon", "달"], ["🍊", "orange", "오렌지"], ["🐷", "pig", "돼지"],
    ["🌹", "rose", "장미"], ["🐯", "tiger", "호랑이"], ["☂️", "umbrella", "우산"], ["🐻", "bear", "곰"], ["🐰", "rabbit", "토끼"], ["🚗", "car", "자동차"],
    ["🚌", "bus", "버스"], ["📚", "book", "책"], ["✏️", "pencil", "연필"], ["🍰", "cake", "케이크"], ["🥛", "milk", "우유"], ["🌳", "tree", "나무"],
    ["⭐", "star", "별"], ["🐵", "monkey", "원숭이"], ["🐘", "elephant", "코끼리"], ["🦆", "duck", "오리"], ["🐸", "frog", "개구리"], ["🏠", "house", "집"],
    ["⚽", "ball", "공"], ["🍕", "pizza", "피자"], ["🐔", "chicken", "닭"], ["🌸", "flower", "꽃"], ["🐝", "bee", "벌"], ["🦊", "fox", "여우"]
  ];
  const COLORS = [["🔴", "red", "빨간색"], ["🔵", "blue", "파란색"], ["🟡", "yellow", "노란색"], ["🟢", "green", "초록색"], ["🟠", "orange", "주황색"],
    ["🟣", "purple", "보라색"], ["⚫", "black", "검은색"], ["⚪", "white", "흰색"], ["🟤", "brown", "갈색"]];
  const NUMS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const TENS = [[30, "thirty"], [40, "forty"], [50, "fifty"], [60, "sixty"], [100, "one hundred"]];

  // ───────────── 1-2학년: 알파벳 놀이방 ─────────────
  Quiz.add({
    id: "eng12", e: "🎈", title: "알파벳 놀이방", grade: "영어 1-2학년",
    missions: [
      { id: "abc", e: "🔠", name: "알파벳 순서", desc: "빈칸에 올 글자", gen() {
        const lower = rnd(0, 1) === 1, start = rnd(0, 22), hole = rnd(0, 3);
        const seq = ABC.slice(start, start + 4).split("").map((c) => (lower ? c.toLowerCase() : c));
        const ans = seq[hole];
        const near = [-2, -1, 1, 2, 4].map((d) => ABC[start + hole + d]).filter(Boolean).map((c) => (lower ? c.toLowerCase() : c));
        return { text: "❓에 들어갈 알파벳은?", visual: big1(seq.map((c, k) => (k === hole ? "❓" : c)).join(" ")), choices: opts(ans, near),
          answer: ans, say: "물음표에 들어갈 알파벳은?", explain: "순서대로 읽으면 " + seq.join(" ") + " 이에요." };
      } },
      { id: "case", e: "🅰️", name: "대문자와 소문자", desc: "짝 찾기", gen() {
        const C = pick(ABC), c = C.toLowerCase();
        if (rnd(0, 1)) {
          const w = (LOOKALIKE[c] || "").split("").concat(shuffle(ABC.toLowerCase().split("")).slice(0, 3));
          return { text: "대문자 " + C + "의 소문자는?", visual: big1(C), choices: opts(c, w), answer: c, say: "이 대문자의 소문자는?", sayEn: C, explain: C + " 의 소문자는 " + c + " 예요." };
        }
        const w = (LOOKALIKE[c] || "").toUpperCase().split("").concat(shuffle(ABC.split("")).slice(0, 3));
        return { text: "소문자 " + c + "의 대문자는?", visual: big1(c), choices: opts(C, w), answer: C, say: "이 소문자의 대문자는?", sayEn: C, explain: c + " 의 대문자는 " + C + " 예요." };
      } },
      { id: "picture", e: "🖼️", name: "그림 보고 낱말", desc: "그림에 맞는 영어", gen() {
        const [e, en, ko] = pick(WORDS);
        return { text: "그림에 알맞은 영어 낱말은?", visual: big1(e), choices: opts(en, shuffle(WORDS.map((w) => w[1]))), answer: en,
          explain: ko + "는 영어로 " + en + " 예요." };
      } },
      { id: "first", e: "🔤", name: "첫 글자", desc: "낱말이 시작하는 글자", gen() {
        const [e, en, ko] = pick(WORDS), f = en[0];
        return { text: e + " " + ko + "(" + en.replace(/^./, "_") + ")는 어떤 글자로 시작할까요?", visual: big1(e), choices: opts(f, shuffle("abcdefghlmprst".split(""))),
          answer: f, say: ko + "는 어떤 글자로 시작할까요?", sayEn: en, explain: en + " 는 " + f + " 로 시작해요." };
      } },
      { id: "color", e: "🎨", name: "색깔", desc: "색깔 영어 이름", gen() {
        const [e, en, ko] = pick(COLORS);
        if (rnd(0, 1)) return { text: "이 색깔은 영어로?", visual: big1(e), choices: opts(en, COLORS.map((c) => c[1])), answer: en, explain: ko + "은 영어로 " + en + " 예요." };
        return { text: "잘 듣고 알맞은 색깔을 골라요.", visual: big("🔊 " + en), choices: opts(e, COLORS.map((c) => c[0])), answer: e, say: "잘 듣고 알맞은 색깔을 골라요.", sayEn: en, explain: en + " 은 " + ko + "이에요." };
      } }
    ]
  });

  // ───────────── 3-4학년: 알파벳 교실 ─────────────
  const GREET = [
    ["처음 만났을 때", "Nice to meet you.", ["Good night.", "See you later."]], ["아침에 만났을 때", "Good morning.", ["Good night.", "Thank you."]],
    ["헤어질 때", "Goodbye.", ["Hello.", "Nice to meet you."]], ["고마울 때", "Thank you.", ["I'm sorry.", "Good morning."]],
    ["미안할 때", "I'm sorry.", ["Thank you.", "Good job!"]], ["잠자기 전에", "Good night.", ["Good morning.", "Nice to meet you."]],
    ["'Thank you.'에 대답할 때", "You're welcome.", ["I'm sorry.", "Good night."]], ["'I'm sorry.'에 대답할 때", "That's okay.", ["You're welcome.", "Goodbye."]],
    ["이름을 물을 때", "What's your name?", ["How old are you?", "How are you?"]], ["나이를 물을 때", "How old are you?", ["What's your name?", "What's this?"]],
    ["안부를 물을 때", "How are you?", ["How old are you?", "What's this?"]], ["'How are you?'에 대답할 때", "I'm fine, thank you.", ["I'm ten years old.", "My name is Mina."]],
    ["친구를 칭찬할 때", "Good job!", ["I'm sorry.", "Watch out!"]], ["위험하다고 알려 줄 때", "Watch out!", ["Good job!", "Sit down, please."]],
    ["앉으라고 할 때", "Sit down, please.", ["Stand up, please.", "Open the door, please."]], ["일어나라고 할 때", "Stand up, please.", ["Sit down, please.", "Be quiet, please."]],
    ["조용히 하라고 할 때", "Be quiet, please.", ["Stand up, please.", "Good job!"]], ["무엇인지 물을 때", "What's this?", ["Who is she?", "How old are you?"]],
    ["좋아하는지 물을 때", "Do you like apples?", ["What's this?", "Can you swim?"]], ["할 수 있는지 물을 때", "Can you swim?", ["Do you like apples?", "How are you?"]],
    ["생일을 축하할 때", "Happy birthday!", ["Good night.", "I'm sorry."]]
  ];
  const MEAN = [["happy", "행복한"], ["sad", "슬픈"], ["big", "큰"], ["small", "작은"], ["hot", "더운"], ["cold", "추운"], ["fast", "빠른"], ["slow", "느린"],
    ["hungry", "배고픈"], ["tired", "피곤한"], ["angry", "화난"], ["long", "긴"], ["run", "달리다"], ["jump", "뛰어오르다"], ["swim", "수영하다"], ["eat", "먹다"],
    ["sleep", "자다"], ["sing", "노래하다"], ["dance", "춤추다"], ["read", "읽다"], ["write", "쓰다"], ["open", "열다"], ["close", "닫다"], ["cook", "요리하다"]];

  Quiz.add({
    id: "eng34", e: "🔤", title: "알파벳 교실", grade: "영어 3-4학년",
    missions: [
      { id: "listen", e: "🎧", name: "듣고 고르기", desc: "들은 낱말의 그림", gen() {
        const [e, en, ko] = pick(WORDS);
        return { text: "잘 듣고 알맞은 그림을 골라요.", visual: big("🔊 " + en), choices: opts(e, shuffle(WORDS.map((w) => w[0]))), answer: e,
          say: "잘 듣고 알맞은 그림을 골라요.", sayEn: en, explain: en + " 는 " + ko + "예요." };
      } },
      { id: "greet", e: "👋", name: "인사와 표현", desc: "상황에 맞는 말", gen() {
        const [when, a, w] = pick(GREET);
        return { text: when + " 하는 말은?", choices: opts(a, w), answer: a, explain: when + " '" + a + "'라고 말해요." };
      } },
      { id: "number", e: "🔢", name: "숫자 영어", desc: "1~20, 몇십", gen() {
        const [n, en] = rnd(0, 4) ? (() => { const k = rnd(1, 20); return [k, NUMS[k]]; })() : pick(TENS);
        const others = NUMS.slice(1).concat(TENS.map((t) => t[1]));
        if (rnd(0, 1)) return { text: n + "을(를) 영어로 하면?", visual: big1(String(n)), choices: opts(en, shuffle(others)), answer: en, explain: n + " 은 영어로 " + en + " 예요." };
        const nums = [n + 1, n - 1, n + 10, n * 2].filter((x) => x > 0 && x <= 100);
        return { text: "잘 듣고 알맞은 숫자를 골라요.", visual: big("🔊 " + en), choices: opts(String(n), nums.map(String)), answer: String(n),
          say: "잘 듣고 알맞은 숫자를 골라요.", sayEn: en, explain: en + " 은 " + n + " 이에요." };
      } },
      { id: "spell", e: "✍️", name: "빈칸 철자", desc: "빠진 알파벳 찾기", gen() {
        const [e, en, ko] = pick(WORDS), k = rnd(0, en.length - 1), c = en[k];
        const shown = en.slice(0, k) + "_" + en.slice(k + 1);
        return { text: e + " " + ko + ": 빈칸에 들어갈 알파벳은?", visual: big1(e + " " + shown), choices: opts(c, shuffle("aeioubcdglmnprst".split(""))),
          answer: c, say: ko + ". 빈칸에 들어갈 알파벳은?", sayEn: en, explain: "바른 철자는 " + en + " 예요." };
      } },
      { id: "meaning", e: "📖", name: "낱말 뜻", desc: "영어 ↔ 우리말", gen() {
        const [en, ko] = pick(MEAN);
        if (rnd(0, 1)) return { text: "'" + en + "'의 뜻은?", visual: big1(en), choices: opts(ko, MEAN.map((m) => m[1])), answer: ko, sayEn: en, explain: en + " 은 '" + ko + "'라는 뜻이에요." };
        return { text: "'" + ko + "'를 영어로 하면?", choices: opts(en, MEAN.map((m) => m[0])), answer: en, explain: "'" + ko + "'는 영어로 " + en + " 예요." };
      } }
    ]
  });

  // ───────────── 5-6학년: 영어 카페 ─────────────
  const SUBJ = [["I", "am", "have"], ["You", "are", "have"], ["He", "is", "has"], ["She", "is", "has"], ["We", "are", "have"], ["They", "are", "have"],
    ["My mom", "is", "has"], ["Tom", "is", "has"], ["My friends", "are", "have"]];
  const BE_TAIL = ["happy", "a student", "tall", "from Korea", "hungry", "at school", "busy", "kind"];
  const HAVE_TAIL = ["a dog", "a red bag", "two brothers", "a cold", "a new bike"];
  const QA = [
    ["What's your name?", "My name is Jiho.", ["I'm fine.", "It's Monday."]], ["How old are you?", "I'm twelve years old.", ["I'm happy.", "It's sunny."]],
    ["How are you?", "I'm great, thanks.", ["It's 3 o'clock.", "I'm from Korea."]], ["Where are you from?", "I'm from Korea.", ["I'm eleven.", "It's rainy."]],
    ["What day is it today?", "It's Friday.", ["It's sunny.", "It's 5 o'clock."]], ["How's the weather?", "It's sunny.", ["It's Monday.", "I'm fine."]],
    ["What time is it?", "It's 7 o'clock.", ["It's cloudy.", "It's Tuesday."]], ["What do you want?", "I want some juice.", ["I'm sorry.", "Yes, I can."]],
    ["Can you swim?", "Yes, I can.", ["Yes, I am.", "It's cold."]], ["Do you like pizza?", "Yes, I do.", ["Yes, I can.", "No, it isn't."]],
    ["Is this your bag?", "Yes, it is.", ["Yes, I do.", "I'm fine."]], ["What are you doing?", "I'm reading a book.", ["I'm from Korea.", "It's Sunday."]],
    ["Where is the cat?", "It's under the table.", ["It's sunny.", "It's 2 o'clock."]], ["How much is it?", "It's two thousand won.", ["It's Monday.", "I'm ten."]],
    ["What's your favorite color?", "I like blue.", ["I'm tall.", "It's rainy."]], ["When is your birthday?", "It's May 5th.", ["It's sunny.", "I'm happy."]],
    ["What did you do yesterday?", "I played soccer.", ["I play soccer.", "I'm playing soccer."]], ["Who is she?", "She is my sister.", ["She is happy.", "It's Monday."]],
    ["What's wrong?", "I have a cold.", ["I'm from Korea.", "It's 3 o'clock."]], ["Can I help you?", "Yes, please.", ["Yes, I am.", "It's cold."]],
    ["How do you go to school?", "I go by bus.", ["I'm a student.", "It's Friday."]]
  ];
  const DAYS = [["월요일", "Monday"], ["화요일", "Tuesday"], ["수요일", "Wednesday"], ["목요일", "Thursday"], ["금요일", "Friday"], ["토요일", "Saturday"], ["일요일", "Sunday"]];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => [(i + 1) + "월", m]);
  const NAMES = ["Mina", "Jiho", "Tom", "Emma", "Sora", "Alex"];
  const FOODS = [["pizza", "피자"], ["apples", "사과"], ["chicken", "치킨"], ["ice cream", "아이스크림"], ["noodles", "국수"], ["bananas", "바나나"]];
  const SKILLS = [["swim", "수영하기"], ["dance", "춤추기"], ["play the piano", "피아노 치기"], ["ride a bike", "자전거 타기"], ["cook", "요리하기"], ["play soccer", "축구하기"]];

  Quiz.add({
    id: "eng56", e: "☕", title: "영어 카페", grade: "영어 5-6학년",
    missions: [
      { id: "sentence", e: "🧩", name: "문장 완성", desc: "am, is, are / have, has", gen() {
        const [s, be, have] = pick(SUBJ);
        if (rnd(0, 2)) {
          const tail = pick(BE_TAIL);
          return { text: "빈칸에 알맞은 말은?", visual: big(s + " ___ " + tail + "."), choices: ["am", "is", "are"], answer: be,
            explain: s + " 에는 " + be + " 를 써요: " + s + " " + be + " " + tail + "." };
        }
        const tail = pick(HAVE_TAIL);
        return { text: "빈칸에 알맞은 말은?", visual: big(s + " ___ " + tail + "."), choices: ["have", "has"], answer: have,
          explain: s + " 에는 " + have + " 를 써요: " + s + " " + have + " " + tail + "." };
      } },
      { id: "qa", e: "💬", name: "묻고 답하기", desc: "질문에 알맞은 대답", gen() {
        const [q, a, w] = pick(QA);
        return { text: "질문에 알맞은 대답은?", visual: big(q), choices: opts(a, w), answer: a, say: "질문을 잘 듣고, 알맞은 대답을 골라요.", sayEn: q, explain: q + " → " + a };
      } },
      { id: "days", e: "📅", name: "요일과 달", desc: "요일, 열두 달", gen() {
        const list = rnd(0, 1) ? DAYS : MONTHS, [ko, en] = pick(list);
        if (rnd(0, 1)) return { text: ko + "은(는) 영어로?", visual: big1(ko), choices: opts(en, list.map((x) => x[1])), answer: en, explain: ko + "은 영어로 " + en + " 예요." };
        return { text: "잘 듣고 알맞은 것을 골라요.", visual: big("🔊 " + en), choices: opts(ko, list.map((x) => x[0])), answer: ko, say: "잘 듣고 알맞은 것을 골라요.", sayEn: en, explain: en + " 은 " + ko + ieyo(ko) + "." };
      } },
      { id: "time", e: "🕒", name: "시각 말하기", desc: "What time is it?", gen() {
        const h = rnd(1, 12), m = pick([0, 0, 30, 15, 45]);
        const say = (hh, mm) => "It's " + hh + (mm ? ":" + String(mm).padStart(2, "0") : " o'clock") + ".";
        const ans = say(h, m);
        return { text: "What time is it? 알맞은 대답은?", visual: clock(h, m), choices: opts(ans, [say(h % 12 + 1, m), say(h, (m + 30) % 60), say(m ? m / 5 : 12, h * 5 % 60)]),
          answer: ans, say: "몇 시인지 영어로 알맞게 말한 것은?", sayEn: "What time is it?", explain: "짧은바늘은 " + h + ", 긴바늘은 " + m + "분이에요. " + ans };
      } },
      { id: "read", e: "📰", name: "짧은 글 읽기", desc: "글 읽고 답하기", gen() {
        const name = pick(NAMES), age = rnd(9, 13), [food, foodKo] = pick(FOODS), [skill, skillKo] = pick(SKILLS);
        const text = "Hi! My name is " + name + ". I am " + age + " years old. I like " + food + ". I can " + skill + ".";
        const qs = [
          ["이 친구의 이름은?", name, NAMES.filter((x) => x !== name)],
          ["이 친구는 몇 살일까요?", age + "살", [age + 1 + "살", age - 1 + "살"]],
          ["이 친구가 좋아하는 음식은?", foodKo, FOODS.map((f) => f[1])],
          ["이 친구가 할 수 있는 것은?", skillKo, SKILLS.map((x) => x[1])]
        ];
        const [q, a, w] = pick(qs);
        return { text: q, visual: "<div class='qz-big' style='font-size:22px;text-align:left;max-width:560px'>" + text + "</div>", choices: opts(a, w), answer: a,
          say: "글을 잘 듣고 읽어 봐요. " + q, sayEn: text, explain: text };
      } }
    ]
  });

})();
