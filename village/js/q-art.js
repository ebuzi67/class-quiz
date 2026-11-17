// 🎨 미술 방 3개(1-2학년, 3-4학년, 5-6학년). 방마다 퀴즈 미션 10개와 만들기 미션 1개가 있어요.
// 색은 동그라미(sw)로 보여 주고, 그림자·점선면·대칭·원근은 그림으로 보여 줘요. 교실이 시끄러워도 눈으로 풀 수 있어요.
"use strict";

(() => {
  const { rnd, pick, shuffle, opts, big } = Quiz.tools;
  const sw = (hex, name) => "<span class='sw' style='background:" + hex + "'></span>" + (name ? " " + name : "");
  const row = (items) => "<div class='qz-big ar-row'>" + items.join(" ") + "</div>";
  const C = {
    빨강: "#e8423f", 주황: "#f5922b", 노랑: "#f7d93a", 연두: "#9ad94a", 초록: "#3aa35b", 청록: "#1fa59a", 하늘색: "#7cc8f0", 파랑: "#2f6fdf",
    남색: "#2b3a8f", 보라: "#8e4fc4", 자주: "#c23b8a", 분홍: "#f59ac2", 갈색: "#8b5a2b", 검정: "#222222", 하양: "#ffffff", 회색: "#9a9a9a", 다홍: "#f26b3a"
  };
  const named = (n) => sw(C[n], n);
  // [문제, 정답, 오답들, 풀이] 은행에서 하나 골라요. both면 거꾸로(정답 → 문제)도 물어요.
  const bank = (list, ask, back) => () => {
    const [q, a, ...rest] = pick(list);
    if (back && rnd(0, 1)) return { text: back(a), choices: opts(q, list.filter((x) => x[1] !== a).map((x) => x[0])), answer: q, explain: q + " → " + a };
    return { text: ask(q), choices: opts(a, list.filter((x) => x[1] !== a).map((x) => x[1])), answer: a, explain: rest[0] || q + " → " + a };
  };

  // ───────────── 1-2학년: 크레파스 놀이방 ─────────────
  const NAMES12 = ["빨강", "주황", "노랑", "연두", "초록", "하늘색", "파랑", "남색", "보라", "분홍", "갈색", "검정", "하양", "회색"];
  const MIX12 = [["빨강", "노랑", "주황"], ["파랑", "노랑", "초록"], ["빨강", "파랑", "보라"], ["빨강", "하양", "분홍"], ["검정", "하양", "회색"], ["파랑", "하양", "하늘색"], ["초록", "노랑", "연두"]];
  const SHAPES = { 동그라미: "●", 세모: "▲", 네모: "■" };
  const SHAPE_ITEMS = [["⚽", "동그라미"], ["🍩", "동그라미"], ["🕐", "동그라미"], ["🍪", "동그라미"], ["🌕", "동그라미"], ["🎯", "동그라미"], ["🍕", "세모"], ["⛺", "세모"], ["🍙", "세모"], ["📐", "세모"], ["🔺", "세모"],
    ["📺", "네모"], ["🎁", "네모"], ["📦", "네모"], ["🖼️", "네모"], ["🧇", "네모"], ["🚪", "네모"]];
  const ODD = [["🍎", "🍏"], ["🐶", "🐱"], ["⭐", "🌙"], ["🐟", "🐠"], ["🚗", "🚕"], ["🌸", "🌼"], ["🍓", "🍒"], ["⚽", "🏀"], ["🐤", "🐧"], ["🍦", "🍧"], ["🌳", "🌲"], ["🦋", "🐝"]];
  const TOOLS12 = [["종이를 자를 때", "✂️ 가위"], ["물감을 칠할 때", "🖌️ 붓"], ["물감을 섞을 때", "🎨 팔레트"], ["곧은 선을 그을 때", "📏 자"], ["밑그림을 그릴 때", "✏️ 연필"], ["크게 색칠할 때", "🖍️ 크레파스"], ["색종이를 붙일 때", "🧴 풀"], ["붓을 씻을 때", "🪣 물통"]];
  const RAINBOW = ["빨강", "주황", "노랑", "초록", "파랑", "남색", "보라"];
  const DOTS = [["🔴", "빨간"], ["🟠", "주황"], ["🟡", "노란"], ["🟢", "초록"], ["🔵", "파란"], ["🟣", "보라"]];
  const SHADOW = ["🐘", "🦒", "🐰", "🐱", "🐶", "🦋", "🐢", "🐟", "🐦", "🦆", "🐌", "🍎", "🍌", "🍐", "🎸", "🚲", "✈️", "🚗", "☂️", "🎈", "🐳", "🦀"];
  const COLOR_OBJ = { 빨강: ["🍎", "🍓", "🍅", "🌹"], 노랑: ["🍌", "🌻", "🐥", "🍋"], 초록: ["🥒", "🐸", "🥦", "🍀"], 파랑: ["🐳", "💧", "🌊"], 주황: ["🍊", "🥕", "🎃"], 보라: ["🍇", "🍆"], 하양: ["⛄", "🥛", "🍚"], 갈색: ["🐻", "🌰", "🍫"], 분홍: ["🌸", "🐷", "🎀"] };

  Quiz.add({
    id: "art12", e: "🖍️", title: "크레파스 놀이방", grade: "미술 1-2학년",
    missions: [
      { id: "name", e: "🌈", name: "색깔 이름", desc: "색을 보고 이름 말하기", gen() {
        const n = pick(NAMES12);
        if (rnd(0, 1)) return { text: "이 색깔의 이름은?", visual: big(sw(C[n]).replace("class='sw'", "class='sw big'")), choices: opts(n, NAMES12), answer: n, explain: "이 색은 " + n + "이에요." };
        return { text: "'" + n + "'은 어느 색일까요?", choices: opts(sw(C[n]), shuffle(NAMES12.filter((x) => x !== n)).map((x) => sw(C[x]))), answer: sw(C[n]), say: n + "은 어느 색일까요?", explain: n + " " + sw(C[n]) };
      } },
      { id: "mix", e: "🎨", name: "색 섞기", desc: "두 색을 섞으면?", gen() {
        const [a, b, r] = pick(MIX12), [x, y] = rnd(0, 1) ? [a, b] : [b, a];
        if (rnd(0, 2)) return { text: "두 색을 섞으면 어떤 색이 될까요?", visual: row([named(x), "➕", named(y)]), choices: opts(named(r), MIX12.map((m) => named(m[2]))), answer: named(r), say: x + "과 " + y + "을 섞으면 어떤 색이 될까요?", explain: x + " + " + y + " = " + r };
        return { text: r + "을 만들려면 " + x + "과 무슨 색을 섞을까요?", visual: row([named(x), "➕", "❓", "=", named(r)]), choices: opts(named(y), ["빨강", "노랑", "파랑", "하양", "검정"].filter((c) => c !== x).map(named)), answer: named(y), explain: x + " + " + y + " = " + r };
      } },
      { id: "shape", e: "🔺", name: "모양 찾기", desc: "닮은 모양 고르기", gen() {
        const [e, s] = pick(SHAPE_ITEMS);
        return { text: "이 물건과 닮은 모양은?", visual: big("<span style='font-size:1.8em'>" + e + "</span>"), choices: Object.keys(SHAPES).map((k) => SHAPES[k] + " " + k), answer: SHAPES[s] + " " + s, explain: e + "는 " + s + " 모양을 닮았어요." };
      } },
      { id: "odd", e: "🔍", name: "다른 하나 찾기", desc: "하나만 다른 그림", gen() {
        const [a, b] = shuffle(pick(ODD)), k = rnd(0, 3);
        const items = [0, 1, 2, 3].map((i) => (i === k ? b : a));
        return { text: "하나만 다른 그림은 몇 번일까요?", visual: row(items.map((e, i) => "<span class='ar-num'><small>" + (i + 1) + "</small>" + e + "</span>")), choices: ["1번", "2번", "3번", "4번"], answer: (k + 1) + "번", key: items.join(""), explain: (k + 1) + "번만 " + b + "예요." };
      } },
      { id: "tools", e: "✂️", name: "미술 도구", desc: "언제 쓰는 도구일까요?", gen: bank(TOOLS12, (q) => q + " 쓰는 도구는?", (a) => a + "는 언제 쓸까요?") },
      { id: "rainbow", e: "🌈", name: "무지개 색 순서", desc: "빨주노초파남보", gen() {
        const s = rnd(0, 3), hole = rnd(0, 3), seq = RAINBOW.slice(s, s + 4), ans = seq[hole];
        return { text: "무지개 색 순서예요. ❓에 들어갈 색은?", visual: row(seq.map((c, i) => (i === hole ? "❓" : sw(C[c])))), choices: opts(named(ans), RAINBOW.filter((c) => c !== ans).map(named)), answer: named(ans), explain: "무지개는 빨강, 주황, 노랑, 초록, 파랑, 남색, 보라 순서예요." };
      } },
      { id: "count", e: "🎈", name: "색깔 세기", desc: "같은 색이 몇 개?", gen() {
        const cols = shuffle(DOTS).slice(0, 3), n = rnd(2, 6), items = [];
        for (let i = 0; i < n; i++) items.push(cols[0][0]);
        for (let i = 0, m = rnd(3, 6); i < m; i++) items.push(pick(cols.slice(1))[0]);
        const list = shuffle(items);
        return { text: cols[0][1] + " 동그라미는 몇 개일까요?", visual: row(list), choices: opts(String(n), [n - 1, n + 1, n + 2].filter((x) => x > 0).map(String)), answer: String(n), key: list.join(""), explain: cols[0][1] + " 동그라미는 " + n + "개예요." };
      } },
      { id: "shapecount", e: "🔷", name: "모양 세기", desc: "같은 모양이 몇 개?", gen() {
        const kinds = [["●", "동그라미"], ["▲", "세모"], ["■", "네모"], ["★", "별"]], [want, ...others] = shuffle(kinds), n = rnd(2, 6), items = [];
        for (let i = 0; i < n; i++) items.push(want[0]);
        for (let i = 0, m = rnd(3, 6); i < m; i++) items.push(pick(others.slice(0, 2))[0]);
        const list = shuffle(items).map((s) => "<span style='color:" + pick(["#e8423f", "#2f6fdf", "#3aa35b", "#f5922b", "#8e4fc4"]) + "'>" + s + "</span>");
        return { text: want[1] + "는 몇 개일까요?", visual: row(list), choices: opts(String(n), [n - 1, n + 1, n + 2].filter((x) => x > 0).map(String)), answer: String(n), key: list.join(""), explain: want[1] + "는 " + n + "개예요." };
      } },
      { id: "shadow", e: "🌑", name: "그림자 찾기", desc: "그림자의 주인은?", gen() {
        const e = pick(SHADOW);
        return { text: "이 그림자는 무엇의 그림자일까요?", visual: big("<span class='ar-shadow'>" + e + "</span>"), choices: opts(e, SHADOW), answer: e, explain: "모양을 잘 보면 " + e + "의 그림자예요." };
      } },
      { id: "colorobj", e: "🍎", name: "같은 색 찾기", desc: "이 색인 물건은?", gen() {
        const names = Object.keys(COLOR_OBJ), n = pick(names), ans = pick(COLOR_OBJ[n]);
        const wrong = shuffle(names.filter((x) => x !== n)).slice(0, 3).map((x) => pick(COLOR_OBJ[x]));
        return { text: "이 색깔인 것은 무엇일까요?", visual: big(named(n)), choices: opts(ans, wrong), answer: ans, explain: ans + "는 " + n + "이에요." };
      } },
      { id: "decal", e: "🦋", name: "데칼코마니 그림", desc: "✏️ 만들기 · 전시실에 걸 수 있어요", make({ el, box, ctx, pass }) {
        box.append(el("div", "mg-q", "🦋 한쪽에 그리면 반대쪽에도 똑같이 생겨요! 나비나 꽃을 그려 봐요."));
        const pad = ArtTools.drawPad(el, { mirror: true });
        const t = el("input", "ar-title"); t.maxLength = 12; t.placeholder = "그림 제목 (안 써도 돼요)";
        const ctrl = el("div", "rb-controls");
        const done = el("button", "btn btn-soft", "✅ 다 그렸어요");
        const finish = () => { pass(); done.textContent = "🎉 미션 통과!"; done.disabled = true; };
        done.onclick = () => { if (pad.strokes < 3) { ctx.speak("조금 더 그려 볼까요?"); return; } finish(); };
        ctrl.append(done, ArtTools.exhibitButton(el, ctx, () => (pad.strokes ? pad.image() : null), () => t.value.trim(), finish));
        box.append(pad.node, t, ctrl);
        ctx.speak("한쪽에 그리면 반대쪽에도 똑같이 생겨요. 나비나 꽃을 그려 봐요.");
      } }
    ]
  });

  // ───────────── 3-4학년: 물감 공방 ─────────────
  const WARM = ["빨강", "주황", "노랑", "다홍", "분홍"], COOL = ["파랑", "남색", "하늘색", "청록"];
  const TECH = [
    ["물감을 바른 종이를 반으로 접었다 펴서 똑같은 무늬를 만드는 방법", "데칼코마니"], ["판에 그림을 새기고 잉크를 발라 종이에 찍어 내는 방법", "판화"],
    ["여러 가지 종이·사진을 오려 붙여 작품을 만드는 방법", "콜라주"], ["작은 조각들을 촘촘히 붙여 그림을 만드는 방법", "모자이크"],
    ["물 위에 물감을 떨어뜨려 생긴 무늬를 종이로 떠내는 방법", "마블링"], ["크레파스를 칠하고 검게 덮은 뒤 긁어서 그리는 방법", "스크래치"],
    ["구멍 뚫린 판을 대고 물감을 칠해 모양을 찍는 방법", "스텐실"], ["울퉁불퉁한 물건 위에 종이를 대고 문질러 무늬를 본뜨는 방법", "프로타주"],
    ["작은 점을 많이 찍어서 그림을 그리는 방법", "점묘법"], ["물을 많이 묻힌 종이에 물감이 퍼지게 하는 방법", "번지기"]
  ];
  const TOOLS34 = [["고무판을 파서 판을 만들 때", "조각칼"], ["판에 잉크를 고르게 바를 때", "롤러"], ["넓은 면을 칠할 때", "납작붓"], ["가는 선을 그릴 때", "가는 둥근붓"],
    ["물감을 짜서 섞을 때", "팔레트"], ["붓을 헹굴 때", "물통"], ["모양을 만들어 붙여 가며 입체를 만들 때", "찰흙"], ["물감을 톡톡 두드려 번지게 할 때", "스펀지"]];
  const NATURE = ["🍂 나뭇잎", "🪨 돌멩이", "🌰 도토리", "🐚 조개껍데기", "🪵 나뭇가지", "🌼 꽃잎", "🪶 깃털", "🌲 솔방울"];
  const MADE = ["🥤 종이컵", "🔘 단추", "📎 클립", "🧶 털실", "📦 상자", "🥫 깡통", "🧻 휴지심", "🧷 옷핀"];
  // 그림: 점·선·면
  function elementSvg(kind) {
    let s = "";
    const col = () => pick(["#e8423f", "#2f6fdf", "#3aa35b", "#f5922b", "#8e4fc4"]);
    if (kind === "점") for (let i = 0; i < 26; i++) s += "<circle cx='" + rnd(8, 152) + "' cy='" + rnd(8, 92) + "' r='" + rnd(3, 5) + "' fill='" + col() + "'/>";
    if (kind === "선") for (let i = 0; i < 6; i++) s += "<path d='M" + rnd(5, 40) + " " + rnd(10, 90) + " Q " + rnd(50, 110) + " " + rnd(0, 100) + " " + rnd(120, 155) + " " + rnd(10, 90) + "' fill='none' stroke='" + col() + "' stroke-width='4' stroke-linecap='round'/>";
    if (kind === "면") for (let i = 0; i < 4; i++) { const x = rnd(5, 105), y = rnd(5, 50); s += pick(["<rect x='" + x + "' y='" + y + "' width='" + rnd(30, 50) + "' height='" + rnd(25, 40) + "' fill='" + col() + "'/>", "<circle cx='" + (x + 20) + "' cy='" + (y + 20) + "' r='" + rnd(14, 22) + "' fill='" + col() + "'/>"]); }
    return "<svg class='qz-svg wide' viewBox='0 0 160 100'><rect width='160' height='100' fill='#fffaf0'/>" + s + "</svg>";
  }
  const LINES = {
    직선: "M10 50 L150 50", 곡선: "M10 50 Q 45 10 80 50 T 150 50", 지그재그: "M10 70 L35 30 L60 70 L85 30 L110 70 L135 30 L150 50", 점선: "M10 50 L150 50", 나선: "M80 50 m0 0 a5 5 0 1 1 10 0 a10 10 0 1 1 -20 0 a15 15 0 1 1 30 0 a20 20 0 1 1 -40 0 a25 25 0 1 1 50 0"
  };
  const LINE_FEEL = [["직선", "곧고 단단한 느낌"], ["곡선", "부드럽고 출렁이는 느낌"], ["지그재그", "뾰족하고 신나는 느낌"]];
  const lineSvg = (k, w = 5) => "<svg class='qz-svg wide' viewBox='0 0 160 100'><path d='" + LINES[k] + "' fill='none' stroke='#2b3a8f' stroke-width='" + w + "' stroke-linecap='round' stroke-linejoin='round'" + (k === "점선" ? " stroke-dasharray='2 12'" : "") + "/></svg>";
  // 그림: 대칭인 모양과 아닌 모양
  function blobSvg(sym) {
    const pts = []; const n = rnd(4, 6);
    for (let i = 0; i <= n; i++) pts.push([rnd(8, 34), 10 + i * (80 / n)]);
    let left = pts.map(([x, y]) => [40 - x, y]), right;
    if (sym) right = pts.slice().reverse().map(([x, y]) => [40 + x, y]);
    else right = pts.slice().reverse().map(([x, y], i) => [40 + Math.max(4, x + (i % 2 ? 12 : -10) + rnd(-4, 4)), y + (i === 1 ? 6 : 0)]);
    const d = left.concat(right).map(([x, y]) => x.toFixed(0) + "," + y.toFixed(0)).join(" ");
    return "<svg class='qz-mini' viewBox='0 0 80 100'><polygon points='" + d + "' fill='" + pick(["#f59ac2", "#7cc8f0", "#9ad94a", "#f7d93a"]) + "' stroke='#5e3820' stroke-width='3' stroke-linejoin='round'/></svg>";
  }
  const hsl = (h, s, l) => "hsl(" + h + "," + s + "%," + l + "%)";

  Quiz.add({
    id: "art34", e: "🖌️", title: "물감 공방", grade: "미술 3-4학년",
    missions: [
      { id: "primary", e: "🔴", name: "색의 삼원색", desc: "빨강·노랑·파랑과 혼합", gen() {
        const t = rnd(0, 4);
        if (t === 3) { const [r, a, b] = pick([["주황", "빨강", "노랑"], ["초록", "노랑", "파랑"], ["보라", "빨강", "파랑"]]), pair = (x, y) => named(x) + " + " + named(y); return { text: r + "은 삼원색 중 어떤 두 색을 섞어 만들까요?", visual: big(named(r)), choices: shuffle([pair(a, b), pair("빨강", "노랑"), pair("노랑", "파랑"), pair("빨강", "파랑")].filter((x, i, l) => l.indexOf(x) === i)), answer: pair(a, b), explain: a + " + " + b + " = " + r }; }
        if (t === 4) { const trio = (l) => l.map((c) => sw(C[c])).join(" "), right = trio(["빨강", "노랑", "파랑"]); return { text: "색의 삼원색을 바르게 모은 것은?", choices: shuffle([right].concat(shuffle([trio(["빨강", "초록", "파랑"]), trio(["주황", "초록", "보라"]), trio(["빨강", "노랑", "초록"]), trio(["노랑", "파랑", "보라"])]).slice(0, 2))), answer: right, explain: "색의 삼원색은 빨강, 노랑, 파랑이에요." }; }
        if (t === 0) { const w = pick(["초록", "주황", "보라", "검정", "분홍", "하늘색"]); return { text: "색의 삼원색이 아닌 것은?", choices: shuffle(["빨강", "노랑", "파랑", w]).map(named), answer: named(w), explain: "색의 삼원색은 빨강, 노랑, 파랑이에요. 이 세 가지로 여러 색을 만들 수 있어요." }; }
        if (t === 1) { const [a, b, r] = pick([["빨강", "노랑", "주황"], ["노랑", "파랑", "초록"], ["빨강", "파랑", "보라"]]); return { text: "삼원색 두 가지를 섞으면?", visual: row([named(a), "➕", named(b)]), choices: opts(named(r), ["주황", "초록", "보라", "갈색"].map(named)), answer: named(r), say: a + "과 " + b + "을 섞으면?", explain: a + " + " + b + " = " + r }; }
        const B = [["삼원색 물감을 모두 섞으면 어떤 색에 가까워질까요?", "검정"], ["흰색 물감을 섞으면 색이 어떻게 될까요?", "밝아져요"], ["검정 물감을 섞으면 색이 어떻게 될까요?", "어두워져요"]];
        const [q, a] = pick(B); return { text: q, choices: a === "검정" ? ["검정", "하양", "노랑"].map(named) : ["밝아져요", "어두워져요", "그대로예요"], answer: a === "검정" ? named("검정") : a, explain: q.replace("?", "") + " → " + a };
      } },
      { id: "warmcool", e: "🔥", name: "따뜻한 색·차가운 색", desc: "색의 느낌", gen() {
        if (rnd(0, 1)) { const warm = rnd(0, 1) === 1, n = pick(warm ? WARM : COOL); return { text: "이 색은 따뜻한 색일까요, 차가운 색일까요?", visual: big(named(n)), choices: ["🔥 따뜻한 색", "❄️ 차가운 색"], answer: warm ? "🔥 따뜻한 색" : "❄️ 차가운 색", explain: warm ? "불, 해처럼 따뜻한 느낌이에요." : "물, 얼음처럼 시원한 느낌이에요." }; }
        const wantWarm = rnd(0, 1) === 1, a = pick(wantWarm ? WARM : COOL), wr = shuffle(wantWarm ? COOL : WARM).slice(0, 2);
        return { text: (wantWarm ? "따뜻한" : "차가운") + " 색은 어느 것일까요?", choices: shuffle([a, ...wr]).map(named), answer: named(a), explain: a + "은 " + (wantWarm ? "따뜻한" : "차가운") + " 색이에요." };
      } },
      { id: "element", e: "✨", name: "점·선·면", desc: "조형 요소", gen() {
        if (rnd(0, 3)) { const k = pick(["점", "선", "면"]); return { text: "이 그림은 무엇으로 표현했을까요?", visual: elementSvg(k), choices: ["점", "선", "면"], answer: k, key: String(Math.random()).slice(2, 6), explain: k + "으로 표현한 그림이에요." }; }
        const B = [["점이 이어지면 무엇이 될까요?", "선"], ["선으로 둘러싸면 무엇이 될까요?", "면"], ["크기가 아주 작고 위치만 있는 것은?", "점"]];
        const [q, a] = pick(B); return { text: q, choices: ["점", "선", "면"], answer: a, explain: "점이 이어지면 선, 선이 둘러싸면 면이 돼요." };
      } },
      { id: "lines", e: "〰️", name: "선의 종류와 느낌", desc: "직선, 곡선, 지그재그", gen() {
        if (rnd(0, 2)) { const k = pick(Object.keys(LINES)); return { text: "이 선의 이름은?", visual: lineSvg(k, rnd(4, 7)), choices: opts(k, Object.keys(LINES)), answer: k, key: k + Math.random(), explain: "이 선은 " + k + "이에요." }; }
        const [k, feel] = pick(LINE_FEEL);
        return { text: "이 선은 어떤 느낌을 줄까요?", visual: lineSvg(k), choices: LINE_FEEL.map((x) => x[1]), answer: feel, explain: k + "은 " + feel + "을 줘요." };
      } },
      { id: "pattern", e: "🧩", name: "무늬 규칙", desc: "다음에 올 색은?", gen() {
        const cols = shuffle(["빨강", "노랑", "파랑", "초록", "보라", "분홍"]).slice(0, 3), unit = pick([[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 1, 2, 1]]).map((i) => cols[i]);
        const len = rnd(5, 8), seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]), ans = unit[len % unit.length];
        return { text: "무늬의 규칙을 찾아요. ❓에 올 색은?", visual: row(seq.map((c) => sw(C[c])).concat(["❓"])), choices: cols.map(named), answer: named(ans), key: seq.join(), explain: unit.join(", ") + "가 되풀이되는 무늬예요." };
      } },
      { id: "tech", e: "🖨️", name: "미술 기법", desc: "데칼코마니, 판화, 콜라주…", gen: bank(TECH, (q) => "'" + q + "'을 무엇이라고 할까요?", (a) => "'" + a + "'는 어떤 방법일까요?") },
      { id: "bright", e: "🌗", name: "밝은 색·어두운 색", desc: "명도 비교", gen() {
        const h = rnd(0, 330), l1 = rnd(22, 40), l2 = rnd(62, 82), lighter = rnd(0, 1) === 1;
        const a = sw(hsl(h, 70, l1)), b = sw(hsl(h, 70, l2));
        return { text: "더 " + (lighter ? "밝은" : "어두운") + " 색은?", choices: shuffle([a, b]), answer: lighter ? b : a, key: h + "," + l1 + "," + l2, explain: lighter ? "흰색이 많이 섞일수록 밝아져요." : "검은색이 많이 섞일수록 어두워져요." };
      } },
      { id: "tools", e: "🧰", name: "도구의 쓰임", desc: "조각칼, 롤러, 납작붓…", gen: bank(TOOLS34, (q) => q + " 쓰는 것은?", (a) => "'" + a + "'은 언제 쓸까요?") },
      { id: "nature", e: "🍂", name: "자연물과 인공물", desc: "만들기 재료 나누기", gen() {
        const nat = rnd(0, 1) === 1, item = pick(nat ? NATURE : MADE);
        if (rnd(0, 1)) return { text: "'" + item.slice(item.indexOf(" ") + 1) + "'은 자연물일까요, 사람이 만든 물건(인공물)일까요?", visual: big(item), choices: ["🌿 자연물", "🏭 인공물"], answer: nat ? "🌿 자연물" : "🏭 인공물", explain: nat ? "자연에서 얻은 재료예요." : "사람이 만든 물건이에요." };
        const a = pick(nat ? NATURE : MADE), wr = shuffle(nat ? MADE : NATURE).slice(0, 2);
        return { text: (nat ? "자연물" : "인공물") + "은 어느 것일까요?", choices: shuffle([a, ...wr]), answer: a, explain: a + "은 " + (nat ? "자연물" : "인공물") + "이에요." };
      } },
      { id: "symmetry", e: "🦋", name: "대칭 찾기", desc: "좌우가 똑같은 모양", gen() {
        const a = blobSvg(true), wr = [blobSvg(false), blobSvg(false)];
        return { text: "가운데를 접으면 양쪽이 똑같이 겹치는(대칭인) 모양은?", choices: shuffle([a, ...wr]), answer: a, say: "가운데를 접으면 양쪽이 똑같이 겹치는 모양은?", explain: "왼쪽과 오른쪽이 거울처럼 똑같으면 대칭이에요. 데칼코마니도 대칭이에요." };
      } },
      { id: "pixel", e: "🟪", name: "픽셀 아트", desc: "✏️ 만들기 · 전시실에 걸 수 있어요", make({ el, box, ctx, pass }) {
        box.append(el("div", "mg-q", "🟪 칸에 색을 칠해서 그림을 만들어요. 우리 마을처럼 네모 점 그림이에요!"));
        const pad = ArtTools.pixelPad(el, { n: 16 });
        const t = el("input", "ar-title"); t.maxLength = 12; t.placeholder = "그림 제목 (안 써도 돼요)";
        const ctrl = el("div", "rb-controls");
        const done = el("button", "btn btn-soft", "✅ 다 그렸어요");
        const finish = () => { pass(); done.textContent = "🎉 미션 통과!"; done.disabled = true; };
        done.onclick = () => { if (pad.filled < 12) { ctx.speak("칸을 조금 더 칠해 볼까요?"); return; } finish(); };
        ctrl.append(done, ArtTools.exhibitButton(el, ctx, () => (pad.filled ? pad.image() : null), () => t.value.trim(), finish));
        box.append(pad.node, t, ctrl);
        ctx.speak("칸에 색을 칠해서 그림을 만들어요.");
      } }
    ]
  });

  // ───────────── 5-6학년: 작은 미술관 ─────────────
  const WHEEL = ["빨강", "주황", "노랑", "연두", "초록", "청록", "파랑", "남색", "보라", "자주"];
  const TERMS = [
    ["찰흙처럼 붙여 가며 입체를 만드는 것", "소조"], ["나무나 돌을 깎아 내어 입체를 만드는 것", "조각"], ["물에 녹는 물감으로 맑고 투명하게 그린 그림", "수채화"],
    ["먹의 진하고 옅음으로 그린 그림", "수묵화"], ["매달려서 바람에 움직이는 작품", "모빌"], ["사방 어디에서나 볼 수 있게 만든 입체 작품", "환조"],
    ["판에서 한쪽 면만 도드라지게 만든 작품", "부조"], ["글씨를 아름답게 쓰는 미술", "캘리그래피"], ["흙으로 빚어 불에 구운 그릇이나 작품", "도자기"],
    ["광고·만화처럼 흔한 이미지를 쓴 미술", "팝아트"], ["공간 전체를 꾸며 작품으로 만드는 미술", "설치 미술"], ["생활에 쓰는 물건을 쓰기 좋고 아름답게 계획하는 것", "디자인"],
    ["사람의 얼굴을 그린 그림", "초상화"], ["자연의 경치를 그린 그림", "풍경화"]
  ];
  const KOREAN = [
    ["까치와 호랑이처럼 소망을 담아 그린 우리 옛 그림", "민화"], ["경북 안동에 전하는, 웃는 얼굴의 나무 탈", "하회탈"], ["궁궐과 절의 기둥·처마에 칠한 화려한 무늬", "단청"],
    ["닥나무로 만든 우리나라 전통 종이", "한지"], ["푸른 빛이 도는 고려 시대의 자기", "고려청자"], ["희고 깨끗한 조선 시대의 자기", "조선백자"],
    ["남은 천 조각을 이어 붙여 만든 보자기", "조각보"], ["서민들의 생활 모습을 그린 그림", "풍속화"], ["붓과 먹으로 한자나 한글을 쓰는 예술", "서예"],
    ["끈을 엮어 여러 모양을 만드는 전통 공예", "매듭"], ["실제 우리 산천을 보고 그린 그림(정선)", "진경산수화"]
  ];
  const OBANG = [["청", "동쪽", "#2f6fdf"], ["적", "남쪽", "#e8423f"], ["황", "가운데", "#f7d93a"], ["백", "서쪽", "#ffffff"], ["흑", "북쪽", "#222222"]];
  const DESIGN = [
    ["한 부분을 눈에 띄게 두드러지게 하는 것", "강조"], ["같은 모양이나 색을 되풀이하는 것", "반복"], ["양쪽의 무게가 서로 어울려 안정된 느낌", "균형"],
    ["전체가 하나로 잘 어울리는 느낌", "통일"], ["모양·색을 다르게 하여 지루하지 않게 하는 것", "변화"], ["서로 반대되는 것을 함께 놓아 차이를 크게 하는 것", "대비"],
    ["크기나 길이의 알맞은 관계", "비례"], ["반복과 변화로 움직임이 느껴지는 것", "율동"]
  ];
  const DESIGN_PIC = [[row(["⚪", "⚪", "🔴", "⚪", "⚪"]), "강조"], [row(["⭐", "⭐", "⭐", "⭐", "⭐"]), "반복"], [row(["⬛", "⬜", "⬛", "⬜"]), "대비"], [row(["🌲", "🏠", "🌲"]), "균형"]];
  const WORKS = [
    ["별이 빛나는 밤", "고흐"], ["해바라기", "고흐"], ["수련", "모네"], ["모나리자", "레오나르도 다빈치"], ["절규", "뭉크"], ["이삭 줍기", "밀레"], ["씨름", "김홍도"],
    ["서당", "김홍도"], ["단오풍정", "신윤복"], ["인왕제색도", "정선"], ["황소", "이중섭"], ["진주 귀고리를 한 소녀", "페르메이르"], ["세한도", "김정희"], ["게르니카", "피카소"]
  ];
  const MATERIAL = [["찰흙", "붙여 가며 빚기"], ["지점토", "붙여 가며 빚기"], ["대리석", "깎아 내기"], ["비누", "깎아 내기"], ["철사", "구부려 모양 만들기"], ["모루", "구부려 모양 만들기"],
    ["색 도화지", "접고 오려 세우기"], ["골판지", "접고 오려 세우기"], ["빈 상자", "이어 붙여 꾸미기"], ["병뚜껑", "이어 붙여 꾸미기"], ["석고", "틀에 부어 굳히기"], ["양초", "틀에 부어 굳히기"]];
  const SOJO = [["찰흙으로 강아지 빚기", "소조"], ["지점토로 컵 만들기", "소조"], ["찰흙 덩어리를 붙여 얼굴 만들기", "소조"], ["밀랍을 덧붙여 인형 만들기", "소조"],
    ["비누를 조각칼로 깎아 물고기 만들기", "조각"], ["나무를 깎아 장승 만들기", "조각"], ["돌을 깎아 석탑 만들기", "조각"], ["무를 깎아 도장 만들기", "조각"]];
  // 그림: 원근(가까운 것은 크고 아래에, 먼 것은 작고 위에, 흐리게)
  function perspSvg(farLeft) {
    const tree = (x, y, s, o) => "<g opacity='" + o + "'><rect x='" + (x - 3 * s) + "' y='" + (y - 10 * s) + "' width='" + 6 * s + "' height='" + 12 * s + "' fill='#8b5a2b'/><circle cx='" + x + "' cy='" + (y - 18 * s) + "' r='" + 12 * s + "' fill='#3aa35b'/></g>";
    const far = farLeft ? [45, 52] : [115, 52], near = farLeft ? [112, 92] : [48, 92];
    return "<svg class='qz-svg wide' viewBox='0 0 160 100'><rect width='160' height='100' fill='#d9f2fb'/><rect y='45' width='160' height='55' fill='#bfe3a2'/>" +
      tree(far[0], far[1], 0.6, 0.55) + tree(near[0], near[1], 1.6, 1) +
      "<text x='" + (far[0] - 4) + "' y='" + (far[1] + 10) + "' font-size='10'>가</text><text x='" + (near[0] - 4) + "' y='" + (near[1] + 7) + "' font-size='10'>나</text></svg>";
  }

  Quiz.add({
    id: "art56", e: "🖼️", title: "작은 미술관", grade: "미술 5-6학년",
    missions: [
      { id: "complement", e: "☯️", name: "보색", desc: "색상환에서 마주 보는 색", gen() {
        const i = rnd(0, 9), a = WHEEL[i], b = WHEEL[(i + 5) % 10];
        if (rnd(0, 1)) {
          const pair = (x, y) => named(x) + " · " + named(y);
          const wr = shuffle([1, 2, 3, 4, 6, 7, 8, 9]).slice(0, 2).map((d) => pair(a, WHEEL[(i + d) % 10]));
          return { text: "보색끼리 짝지은 것은?", choices: shuffle([pair(a, b), ...wr]), answer: pair(a, b), explain: "색상환에서 서로 마주 보는 " + a + "과 " + b + "이 보색이에요." };
        }
        return { text: a + "의 보색은?", visual: big(named(a)), choices: opts(named(b), WHEEL.filter((c) => c !== a && c !== b).map(named)), answer: named(b), explain: "색상환(10색)에서 " + a + "과 마주 보는 색은 " + b + "이에요. 보색끼리 놓으면 서로 더 또렷해 보여요." };
      } },
      { id: "wheel", e: "🎡", name: "색상환 순서", desc: "10색 색상환", gen() {
        const s = rnd(0, 9), hole = rnd(0, 3), seq = [0, 1, 2, 3].map((k) => WHEEL[(s + k) % 10]), ans = seq[hole];
        return { text: "색상환의 순서예요. ❓에 들어갈 색은?", visual: row(seq.map((c, k) => (k === hole ? "❓" : sw(C[c])))), choices: opts(named(ans), WHEEL.filter((c) => c !== ans).map(named)), answer: named(ans), key: s + "," + hole, explain: "10색 색상환: 빨강 → 주황 → 노랑 → 연두 → 초록 → 청록 → 파랑 → 남색 → 보라 → 자주" };
      } },
      { id: "three", e: "🔆", name: "색의 3요소", desc: "색상, 명도, 채도", gen() {
        const t = rnd(0, 2), h = rnd(0, 330);
        if (t === 0) { const lo = rnd(15, 40), hi = rnd(75, 100), a = sw(hsl(h, lo, 55)), b = sw(hsl(h, hi, 55)); return { text: "채도가 더 높은(더 선명한) 색은?", choices: shuffle([a, b]), answer: b, key: h + "s" + lo + hi, explain: "채도는 색의 맑고 선명한 정도예요. 회색이 섞일수록 채도가 낮아져요." }; }
        if (t === 1) { const lo = rnd(20, 38), hi = rnd(65, 85), a = sw(hsl(h, 70, lo)), b = sw(hsl(h, 70, hi)); return { text: "명도가 더 높은 색은?", choices: shuffle([a, b]), answer: b, key: h + "l" + lo + hi, explain: "명도는 색의 밝고 어두운 정도예요. 밝을수록 명도가 높아요." }; }
        const B = [["빨강, 파랑처럼 색을 구별하는 이름", "색상"], ["색의 밝고 어두운 정도", "명도"], ["색의 맑고 선명한 정도", "채도"]];
        if (rnd(0, 1)) { const [q, a] = pick(B); return { text: "'" + q + "'을 무엇이라고 할까요?", choices: ["색상", "명도", "채도"], answer: a, explain: "색의 3요소: 색상, 명도, 채도" }; }
        const mu = pick(["하양", "검정", "회색"]); return { text: "색상과 채도가 없고 밝기(명도)만 있는 색은?", choices: shuffle([mu, pick(["빨강", "파랑", "노랑"]), pick(["초록", "보라", "주황"])]).map(named), answer: named(mu), explain: "하양, 검정, 회색은 무채색이에요." };
      } },
      { id: "persp", e: "🏞️", name: "원근법", desc: "가까운 것과 먼 것", gen() {
        if (rnd(0, 1)) { const farLeft = rnd(0, 1) === 1, near = rnd(0, 1) === 1; return { text: "더 " + (near ? "가까이" : "멀리") + " 있어 보이는 나무는 가와 나 중 어느 것일까요?", visual: perspSvg(farLeft), choices: ["가", "나"], answer: near ? "나" : "가", key: farLeft + "," + near, explain: "가까운 것은 크고 진하게 아래쪽에, 먼 것은 작고 흐리게 위쪽에 그려요." }; }
        const B = [["멀리 있는 산은 어떻게 칠하면 멀어 보일까요?", "흐리고 푸르스름하게"], ["원근법으로 그리면 그림이 어떻게 보일까요?", "깊이가 느껴져요"], ["가까운 것과 먼 것이 겹치면 앞에 그리는 것은?", "가까운 것"],["멀리 있는 것은 어떻게 그릴까요?", "작고 흐리게"], ["가까이 있는 것은 어떻게 그릴까요?", "크고 진하게"], ["길이나 기찻길이 멀어지며 모이는 한 점을 무엇이라고 할까요?", "소실점"], ["앞의 물건이 뒤의 물건을 가리게 그리는 방법은?", "겹치기"]];
        const [q, a] = pick(B); return { text: q, choices: opts(a, ["작고 흐리게", "크고 진하게", "소실점", "겹치기", "흐리고 푸르스름하게", "깊이가 느껴져요", "가까운 것", "먼 것", "똑같이 크게"]), answer: a, explain: q.replace("?", "") + " → " + a };
      } },
      { id: "terms", e: "📘", name: "미술 용어", desc: "소조, 조각, 모빌…", gen: bank(TERMS, (q) => "'" + q + "'을 무엇이라고 할까요?", (a) => "'" + a + "'는 무엇일까요?") },
      { id: "korean", e: "🏯", name: "우리 전통 미술", desc: "민화, 탈, 단청…", gen: bank(KOREAN, (q) => "'" + q + "'은 무엇일까요?", (a) => "'" + a + "'에 대한 설명은?") },
      { id: "obang", e: "🎎", name: "오방색", desc: "청·적·황·백·흑", gen() {
        const t = rnd(0, 3), [n, dir, hex] = pick(OBANG);
        if (t === 3) return { text: "오방색에서 '" + n + "'은 어느 방향을 나타낼까요?", visual: big(sw(hex, n)), choices: opts(dir, OBANG.map((o) => o[1])), answer: dir, explain: "동쪽 청, 서쪽 백, 남쪽 적, 북쪽 흑, 가운데 황이에요." };
        if (t === 0) return { text: "이 오방색의 이름은?", visual: big(sw(hex)), choices: opts(n, OBANG.map((o) => o[0])), answer: n, explain: n + "은 " + dir + "을 나타내는 색이에요." };
        if (t === 1) return { text: "오방색에서 '" + dir + "'을 나타내는 색은?", choices: opts(sw(hex, n), OBANG.filter((o) => o[0] !== n).map((o) => sw(o[2], o[0]))), answer: sw(hex, n), explain: "동쪽 청, 서쪽 백, 남쪽 적, 북쪽 흑, 가운데 황이에요." };
        const w = pick(["분홍", "보라", "연두", "하늘색"]); return { text: "오방색이 아닌 것은?", choices: shuffle(OBANG.slice(0, 3).map((o) => sw(o[2], o[0])).concat([named(w)])), answer: named(w), explain: "오방색은 청, 적, 황, 백, 흑 다섯 가지예요. 색동저고리와 단청에 많이 써요." };
      } },
      { id: "design", e: "📐", name: "디자인 원리", desc: "강조, 반복, 균형…", gen() {
        if (rnd(0, 2) === 0) { const [pic, a] = pick(DESIGN_PIC); return { text: "이 그림에서 볼 수 있는 디자인 원리는?", visual: pic, choices: opts(a, DESIGN.map((d) => d[1])), answer: a, explain: "이 그림은 '" + a + "'을 보여 줘요." }; }
        return bank(DESIGN, (q) => "'" + q + "'을 무엇이라고 할까요?", (a) => "'" + a + "'는 무엇일까요?")();
      } },
      { id: "works", e: "🖼️", name: "화가와 작품", desc: "명화와 화가 짝짓기", gen() {
        const [w, a] = pick(WORKS);
        if (rnd(0, 1)) return { text: "'" + w + "'를 그린 화가는?", choices: opts(a, WORKS.map((x) => x[1])), answer: a, explain: "'" + w + "'는 " + a + "의 작품이에요." };
        return { text: a + "의 작품은?", choices: opts(w, WORKS.filter((x) => x[1] !== a).map((x) => x[0])), answer: w, explain: "'" + w + "'는 " + a + "의 작품이에요." };
      } },
      { id: "material", e: "🗿", name: "입체 재료와 방법", desc: "소조와 조각, 재료", gen() {
        if (rnd(0, 1)) {
          const [m, a] = pick(MATERIAL);
          return { text: "'" + m + "'로 입체를 만들 때 알맞은 방법은?", choices: opts(a, MATERIAL.map((x) => x[1])), answer: a, explain: m + " → " + a };
        }
        const [act, a] = pick(SOJO);
        return { text: "'" + act + "'는 소조일까요, 조각일까요?", choices: ["소조 (붙여 가며)", "조각 (깎아 내며)"], answer: a === "소조" ? "소조 (붙여 가며)" : "조각 (깎아 내며)", explain: "재료를 붙여 가며 만들면 소조, 깎아 내며 만들면 조각이에요." };
      } },
      { id: "mixlab", e: "🧪", name: "색 섞기 실험실", desc: "✏️ 만들기 · 목표 색 3개 만들기", make({ el, box, ctx, pass }) {
        box.append(ArtTools.mixer(el, ctx, () => { pass(); box.append(el("div", "mg-verdict good", "🎉 미션 통과! 전시실에서 그림도 그려 걸어 봐요.")); }).node);
      } }
    ]
  });

  // 🎨 미술관 입구: 학년 방과 우리 반 전시실로 가요.
  // (미술관 그림이 오기 전까지는 교과 언덕 아래쪽 빈 땅 앞에서 이 창이 열려요)
  Activities.register("arthub", ({ el, frame, ctx }) => {
    const root = frame("🎨 미술관: 어디로 갈까요?");
    root.append(Quiz.npcBanner(el, Quiz.NPCS.art, "안녕! 나는 알록 선생님이야. 색과 모양으로 신나게 놀아 보자!"));
    const grid = el("div", "qz-missions");
    Quiz.rooms.filter((r) => r.id.startsWith("art")).forEach((r) => {
      const p = ctx.getProgress(r.id) || { done: [] };
      const all = p.done.length === r.missions.length;
      const b = el("button", "qz-mission" + (all ? " done" : ""), "<span>" + r.e + "</span><b>" + r.grade.replace(/^\S+ /, "") + "</b><small>" + r.title + " · " + (all ? "✅ 도장" : "미션 " + p.done.length + "/" + r.missions.length) + "</small>");
      b.onclick = () => { ctx.sfx("door"); Activities.open(r.id); };
      grid.append(b);
    });
    const g = el("button", "qz-mission ar-gallery-card", "<span>🏛️</span><b>우리 반 전시실</b><small>친구들 그림 구경 · " + ctx.gallery().length + "점</small>");
    g.onclick = () => { ctx.sfx("door"); Activities.open("artgallery"); };
    grid.append(g);
    root.append(grid);
    ctx.speak("미술관이에요. 내 학년 방이나 전시실을 골라요.");
  });
  Activities.register("artgallery", (kit) => ArtTools.gallery(kit));
})();
