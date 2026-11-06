// 🎵 음악 방 3개(1-2학년, 3-4학년, 5-6학년)
// 소리 문제는 play로 음을 직접 들려줘요(질문을 다 읽은 뒤에 울리고, 🔊 다시 듣기로 또 들을 수 있어요).
// 음 높이는 가온 도(C4)에서 몇 반음 떨어졌는지로 적어요. 도 0, 레 2, 미 4, 파 5, 솔 7, 라 9, 시 11, 높은 도 12
"use strict";

(() => {
  const { rnd, pick, shuffle, opts, ieyo, big } = Quiz.tools;
  const hz = (semi) => 261.63 * Math.pow(2, semi / 12);
  const SOLFA = [["도", 0], ["레", 2], ["미", 4], ["파", 5], ["솔", 7], ["라", 9], ["시", 11], ["높은 도", 12]];
  const listen = (t) => "<div class='qz-big' style='font-size:40px'>🔊 " + (t || "잘 들어 봐요") + "</div>";
  // 음 하나: n = 반음, at = 시작(초)
  const note = (n, at, d = 0.45, vol = 0.3, type = "triangle") => ({ f: hz(n), at, d, vol, type });
  const drum = (at, strong, vol) => ({ f: strong ? 220 : 160, at, d: 0.18, vol: vol == null ? (strong ? 0.55 : 0.22) : vol, type: "sine" });
  const melody = (semis, gap, vol) => semis.map((n, i) => note(n, i * gap, gap * 0.9, vol));

  // ───────────── 1-2학년: 노래 놀이방 ─────────────
  const INST12 = [
    ["🥁", "북", "두드려서"], ["🎹", "피아노", "건반을 눌러서"], ["🎸", "기타", "줄을 튕겨서"], ["🎻", "바이올린", "활로 줄을 켜서"],
    ["🎺", "트럼펫", "입으로 불어서"], ["🎷", "색소폰", "입으로 불어서"]
  ];
  const WAYS = ["두드려서", "건반을 눌러서", "줄을 튕겨서", "활로 줄을 켜서", "입으로 불어서"];

  Quiz.add({
    id: "mus12", e: "🥁", title: "노래 놀이방", grade: "음악 1-2학년",
    missions: [
      { id: "high", e: "🎚️", name: "높은 소리 낮은 소리", desc: "두 소리 비교하기", gen() {
        const a = rnd(0, 12); let b; do { b = rnd(-3, 15); } while (Math.abs(a - b) < 3);
        const ans = b > a ? "높아요 ⬆️" : "낮아요 ⬇️";
        return { text: "두 번째 소리는 첫 번째 소리보다 높을까요, 낮을까요?", visual: listen("소리 두 개"), choices: ["높아요 ⬆️", "낮아요 ⬇️"], answer: ans,
          play: [note(a, 0, 0.6), note(b, 0.9, 0.6)], key: a + "," + b, explain: b > a ? "두 번째 소리가 더 높아요. 새처럼 가늘고 높은 소리예요." : "두 번째 소리가 더 낮아요. 곰처럼 굵고 낮은 소리예요." };
      } },
      { id: "speed", e: "🐇", name: "빠르게 느리게", desc: "빠르기 비교하기", gen() {
        const tune = pick([[0, 4, 7, 4], [7, 5, 4, 2], [0, 2, 4, 5, 7], [4, 4, 7, 7, 9]]), slow = rnd(45, 60) / 100, fast = rnd(18, 26) / 100;
        const firstFast = rnd(0, 1) === 1, g1 = firstFast ? fast : slow, g2 = firstFast ? slow : fast;
        const one = melody(tune, g1), start = tune.length * g1 + 0.7;
        const two = melody(tune, g2).map((n) => Object.assign(n, { at: n.at + start }));
        const ans = firstFast ? "느려졌어요 🐢" : "빨라졌어요 🐇";
        return { text: "같은 노래를 두 번 들려줄게요. 두 번째는 빨라졌을까요, 느려졌을까요?", visual: listen("노래 두 번"), choices: ["빨라졌어요 🐇", "느려졌어요 🐢"], answer: ans,
          play: one.concat(two), key: tune + g1 + g2, explain: firstFast ? "두 번째가 거북이처럼 느렸어요." : "두 번째가 토끼처럼 빨랐어요." };
      } },
      { id: "loud", e: "🔊", name: "크게 작게", desc: "셈여림 비교하기", gen() {
        const n = pick([0, 4, 7, 9, 12]), soft = 0.06, loud = 0.45, firstLoud = rnd(0, 1) === 1, times = rnd(2, 3);
        const one = Array.from({ length: times }, (_, i) => note(n, i * 0.35, 0.3, firstLoud ? loud : soft));
        const two = Array.from({ length: times }, (_, i) => note(n, 1.4 + i * 0.35, 0.3, firstLoud ? soft : loud));
        const ans = firstLoud ? "작아졌어요 🤫" : "커졌어요 📢";
        return { text: "두 번째 소리는 커졌을까요, 작아졌을까요?", visual: listen("소리 두 번"), choices: ["커졌어요 📢", "작아졌어요 🤫"], answer: ans,
          play: one.concat(two), key: n + "," + firstLoud + times, explain: firstLoud ? "두 번째는 속삭이듯 작은 소리였어요." : "두 번째는 크고 힘찬 소리였어요." };
      } },
      { id: "inst", e: "🎺", name: "악기 이름", desc: "악기 알아보기", gen() {
        const [e, name, way] = pick(INST12), t = rnd(0, 2);
        if (t === 0) return { text: "이 악기의 이름은?", visual: big("<span style='font-size:1.8em'>" + e + "</span>"), choices: opts(name, INST12.map((x) => x[1])), answer: name, explain: "이 악기는 " + name + ieyo(name) + "." };
        if (t === 1) return { text: "'" + name + "'는 어느 것일까요?", choices: opts(e, INST12.map((x) => x[0])), answer: e, explain: name + " " + e };
        return { text: e + " " + name + "는 어떻게 소리를 낼까요?", choices: opts(way, WAYS), answer: way, explain: name + "는 " + way + " 소리를 내요." };
      } },
      { id: "count", e: "👏", name: "소리 세기", desc: "몇 번 났을까요?", gen() {
        const n = rnd(2, 7), gap = pick([0.35, 0.45, 0.55]), pitch = pick([0, 4, 7, 12]);
        return { text: "소리가 몇 번 났을까요? 손가락으로 세어 봐요.", visual: listen("몇 번일까요?"), choices: opts(String(n), [n - 1, n + 1, n + 2].filter((x) => x > 0).map(String)), answer: String(n),
          play: Array.from({ length: n }, (_, i) => note(pitch, i * gap, 0.2, 0.35)), key: n + "," + gap + "," + pitch, explain: "소리가 " + n + "번 났어요." };
      } }
    ]
  });

  // ───────────── 3-4학년: 악기 연습실 ─────────────
  // 음표 그림: 머리(빈/찬), 기둥, 꼬리, 점
  function noteSvg(kind) {
    const hollow = kind === "whole" || kind === "half" || kind === "dhalf", stem = kind !== "whole";
    return "<svg class='qz-svg' viewBox='0 0 100 100' style='width:min(130px,26vh)'>" +
      "<ellipse cx='42' cy='72' rx='16' ry='11' transform='rotate(-20 42 72)' fill='" + (hollow ? "#fffaf0" : "#3a2a22") + "' stroke='#3a2a22' stroke-width='5'/>" +
      (stem ? "<line x1='56' y1='68' x2='56' y2='12' stroke='#3a2a22' stroke-width='5'/>" : "") +
      (kind === "eighth" ? "<path d='M56 12 C 70 22, 82 30, 74 50' fill='none' stroke='#3a2a22' stroke-width='5'/>" : "") +
      (kind === "dhalf" ? "<circle cx='72' cy='72' r='5' fill='#3a2a22'/>" : "") + "</svg>";
  }
  const NOTES = [["whole", "온음표", 4], ["dhalf", "점2분음표", 3], ["half", "2분음표", 2], ["quarter", "4분음표", 1], ["eighth", "8분음표", 0.5]];
  const beatText = (b) => (b === 0.5 ? "반 박" : b + "박");
  const FAMILY = [
    ["북", "타악기"], ["탬버린", "타악기"], ["트라이앵글", "타악기"], ["실로폰", "타악기"], ["캐스터네츠", "타악기"], ["심벌즈", "타악기"], ["작은북", "타악기"],
    ["바이올린", "현악기"], ["첼로", "현악기"], ["기타", "현악기"], ["하프", "현악기"], ["우쿨렐레", "현악기"], ["콘트라베이스", "현악기"],
    ["리코더", "관악기"], ["플루트", "관악기"], ["트럼펫", "관악기"], ["클라리넷", "관악기"], ["단소", "관악기"], ["하모니카", "관악기"], ["트롬본", "관악기"]
  ];
  const FAMILY_MEAN = [["두드리거나 흔들어서 소리 내는 악기를 무엇이라고 할까요?", "타악기"], ["줄을 켜거나 튕겨서 소리 내는 악기를 무엇이라고 할까요?", "현악기"], ["입으로 불어서 소리 내는 악기를 무엇이라고 할까요?", "관악기"]];
  const METERS = [[2, [1, 0]], [3, [1, 0, 0]], [4, [1, 0, 2, 0]]]; // 1 강, 2 중강, 0 약
  const SIGN = [["2/4박자", "4분음표가 한 마디에 2개"], ["3/4박자", "4분음표가 한 마디에 3개"], ["4/4박자", "4분음표가 한 마디에 4개"], ["6/8박자", "8분음표가 한 마디에 6개"]];

  Quiz.add({
    id: "mus34", e: "🎼", title: "악기 연습실", grade: "음악 3-4학년",
    missions: [
      { id: "solfa", e: "🎶", name: "계이름 듣기", desc: "도레미파솔라시도", gen() {
        if (rnd(0, 1)) {
          const [name, n] = pick(SOLFA.slice(1));
          return { text: "처음 소리는 '도'예요. 다음 소리의 계이름은?", visual: listen("도 → ?"), choices: opts(name, SOLFA.slice(1).map((x) => x[0])), answer: name,
            play: [note(0, 0, 0.6), note(n, 0.9, 0.7)], key: "s" + n, explain: "도 다음에 들린 소리는 '" + name + "'" + ieyo(name) + ". 도레미파솔라시도로 불러 봐요." };
        }
        const dir = pick(["up", "down", "same"]), step = rnd(1, 3), semis = SOLFA.map((x) => x[1]);
        const idx = dir === "same" ? (() => { const k = rnd(0, 7); return [k, k, k]; })()
          : dir === "up" ? (() => { const k = rnd(0, 7 - 2 * step); return [k, k + step, k + 2 * step]; })()
          : (() => { const k = rnd(2 * step, 7); return [k, k - step, k - 2 * step]; })();
        const ans = { up: "올라가요 ⬆️", down: "내려가요 ⬇️", same: "같은 음이에요 ➡️" }[dir];
        return { text: "세 소리가 어떻게 움직일까요?", visual: listen("소리 세 개"), choices: ["올라가요 ⬆️", "내려가요 ⬇️", "같은 음이에요 ➡️"], answer: ans,
          play: idx.map((k, i) => note(semis[k], i * 0.6, 0.5)), key: "m" + idx, explain: "들린 계이름: " + idx.map((k) => SOLFA[k][0]).join(" → ") };
      } },
      { id: "notes", e: "🎵", name: "음표 길이", desc: "음표 이름과 박", gen() {
        const t = rnd(0, 2), [kind, name, b] = pick(NOTES);
        if (t === 0) return { text: "이 음표의 이름은?", visual: noteSvg(kind), choices: opts(name, NOTES.map((x) => x[1])), answer: name, explain: "이 음표는 " + name + ieyo(name) + "." };
        if (t === 1) return { text: "4분음표가 1박일 때, 이 음표는 몇 박일까요?", visual: noteSvg(kind), choices: opts(beatText(b), ["반 박", "1박", "2박", "3박", "4박"]), answer: beatText(b), explain: name + "는 " + beatText(b) + "이에요." };
        const [, n1, b1] = pick(NOTES.slice(1)), [, n2, b2] = pick(NOTES.slice(1)), sum = b1 + b2;
        return { text: n1 + " 하나와 " + n2 + " 하나를 더하면 모두 몇 박일까요? (4분음표 = 1박)", choices: opts(beatText(sum), [sum + 1, sum - 1, sum + 0.5, sum * 2].filter((x) => x > 0).map(beatText)), answer: beatText(sum),
          explain: n1 + " " + beatText(b1) + " + " + n2 + " " + beatText(b2) + " = " + beatText(sum) };
      } },
      { id: "beat", e: "🥁", name: "박자 느끼기", desc: "2박자, 3박자, 4박자", gen() {
        const t = rnd(0, 2), [m, pat] = pick(METERS), bars = rnd(2, 3), ans = m + "박자";
        const word = pat.map((x) => (x === 1 ? "강" : x === 2 ? "중강" : "약")).join("-");
        if (t === 0) {
          const gap = 0.42, play = [];
          for (let k = 0; k < bars * m; k++) play.push(drum(k * gap, pat[k % m] === 1, pat[k % m] === 2 ? 0.35 : null));
          return { text: "센 소리가 몇 개마다 돌아올까요? 몇 박자로 들릴까요? (" + bars + "마디)", visual: listen("둥 둥 둥…"), choices: ["2박자", "3박자", "4박자"], answer: ans, play, key: m + "," + bars, explain: m + "박자는 '" + word + "'이 되풀이돼요." };
        }
        if (t === 1) {
          const dots = Array.from({ length: bars }, () => pat.map((x) => (x === 1 ? "⬤" : x === 2 ? "◉" : "○")).join(" ")).join(" │ ");
          return { text: "큰 동그라미는 센박이에요. 몇 박자일까요?", visual: big(dots), choices: ["2박자", "3박자", "4박자"], answer: ans, explain: "'" + word + "'이 되풀이되니까 " + ans + "예요." };
        }
        const [sig, mean] = pick(SIGN);
        return { text: sig + "는 무슨 뜻일까요?", visual: big(sig), choices: opts(mean, SIGN.map((x) => x[1])), answer: mean, explain: sig + ": " + mean };
      } },
      { id: "family", e: "🎻", name: "악기 분류", desc: "타악기, 현악기, 관악기", gen() {
        if (rnd(0, 6) === 0) { const [q, a] = pick(FAMILY_MEAN); return { text: q, choices: ["타악기", "현악기", "관악기"], answer: a, explain: "답은 " + a + "예요." }; }
        const [name, fam] = pick(FAMILY);
        return { text: "'" + name + "'는 어떤 악기일까요?", choices: ["타악기", "현악기", "관악기"], answer: fam,
          explain: name + "는 " + fam + "예요. " + { 타악기: "두드리거나 흔들어서 소리 내요.", 현악기: "줄을 켜거나 튕겨서 소리 내요.", 관악기: "입으로 불어서 소리 내요." }[fam] };
      } },
      { id: "rhythm", e: "🪇", name: "리듬 찾기", desc: "들은 리듬 고르기", gen() {
        const make = () => Array.from({ length: 4 }, () => (rnd(0, 1) ? "♩" : "♫"));
        const pat = make(), show = (p) => p.join(" ");
        const wrongs = []; for (let k = 0; k < 20 && wrongs.length < 4; k++) { const w = show(make()); if (w !== show(pat) && !wrongs.includes(w)) wrongs.push(w); }
        const gap = 0.5, play = [];
        pat.forEach((x, i) => { if (x === "♩") play.push(note(7, i * gap, 0.3, 0.35)); else { play.push(note(7, i * gap, 0.16, 0.35)); play.push(note(7, i * gap + gap / 2, 0.16, 0.35)); } });
        return { text: "잘 듣고 들은 리듬을 골라요. (♩ 한 번, ♫ 두 번 빠르게)", visual: listen("리듬"), choices: opts(show(pat), wrongs), answer: show(pat), play, explain: "들은 리듬은 " + show(pat) + " 이에요." };
      } }
    ]
  });

  // ───────────── 5-6학년: 작은 공연장 ─────────────
  const DYN = [["pp", "매우 여리게"], ["p", "여리게"], ["mp", "조금 여리게"], ["mf", "조금 세게"], ["f", "세게"], ["ff", "매우 세게"], ["cresc.", "점점 세게"], ["decresc.", "점점 여리게"]];
  const TEMPO = [["Largo(라르고)", "매우 느리게", 1], ["Adagio(아다지오)", "느리게", 2], ["Andante(안단테)", "조금 느리게(걷는 빠르기)", 3], ["Moderato(모데라토)", "보통 빠르게", 4],
    ["Allegretto(알레그레토)", "조금 빠르게", 5], ["Allegro(알레그로)", "빠르게", 6], ["Presto(프레스토)", "매우 빠르게", 7]];
  const GUGAK = [
    ["가야금", "현악기", "열두 줄을 손가락으로 뜯어서 소리 내요."], ["거문고", "현악기", "술대라는 막대로 줄을 내리치거나 뜯어서 소리 내요."],
    ["해금", "현악기", "두 줄 사이에 낀 활로 문질러서 소리 내요."], ["아쟁", "현악기", "활대로 줄을 문질러 낮고 굵은 소리를 내요."],
    ["대금", "관악기", "옆으로 들고 부는 큰 가로 피리예요."], ["단소", "관악기", "세로로 잡고 부는 짧은 피리예요."], ["피리", "관악기", "겹서를 꽂아 세로로 부는 작은 관악기예요."],
    ["태평소", "관악기", "나팔처럼 끝이 벌어진, 크고 힘찬 소리의 관악기예요."], ["장구", "타악기", "허리가 잘록하고 채와 손으로 양쪽을 쳐요."],
    ["북", "타악기", "둥근 통에 가죽을 대고 북채로 쳐요."], ["꽹과리", "타악기", "놋쇠로 만든 작은 징으로 '깽깽' 높은 소리가 나요."], ["징", "타악기", "놋쇠로 만든 큰 악기로 '징~' 길게 울려요."]
  ];
  const SAMUL = ["꽹과리", "징", "장구", "북"];
  const CHORDS = [["도-미-솔", "으뜸화음(I)"], ["파-라-도", "버금딸림화음(IV)"], ["솔-시-레", "딸림화음(V)"]];

  Quiz.add({
    id: "mus56", e: "🎹", title: "작은 공연장", grade: "음악 5-6학년",
    missions: [
      { id: "mode", e: "🌗", name: "장조와 단조", desc: "밝은 느낌, 어두운 느낌", gen() {
        if (rnd(0, 4) === 0) {
          const B = [["장조 노래는 대체로 어떤 느낌일까요?", "밝고 즐거운 느낌"], ["단조 노래는 대체로 어떤 느낌일까요?", "어둡고 슬픈 느낌"]];
          const [q, a] = pick(B); return { text: q, choices: ["밝고 즐거운 느낌", "어둡고 슬픈 느낌"], answer: a, explain: "장조는 밝게, 단조는 어둡게 들려요." };
        }
        const major = rnd(0, 1) === 1, root = rnd(-2, 5), third = major ? 4 : 3, down = rnd(0, 1) === 1;
        let semis = [0, third, 7, 12, 7, third, 0].map((x) => x + root);
        if (down) semis = semis.slice().reverse();
        const ans = major ? "장조 😊 밝아요" : "단조 😢 어두워요";
        return { text: "잘 듣고, 밝은 느낌(장조)일까요, 어두운 느낌(단조)일까요?", visual: listen("화음 노래"), choices: ["장조 😊 밝아요", "단조 😢 어두워요"], answer: ans,
          play: melody(semis, 0.32).concat([note(root, 2.4, 1.2, 0.18), note(root + third, 2.4, 1.2, 0.18), note(root + 7, 2.4, 1.2, 0.18)]), key: major + "," + root + down,
          explain: major ? "밝고 환하게 들리는 장조예요." : "어둡고 쓸쓸하게 들리는 단조예요." };
      } },
      { id: "dyn", e: "📢", name: "셈여림", desc: "p, f, cresc.", gen() {
        const t = rnd(0, 2);
        if (t === 2) {
          const up = rnd(0, 1) === 1, n = pick([0, 4, 7]), steps = 6;
          const play = Array.from({ length: steps }, (_, i) => note(n, i * 0.32, 0.26, up ? 0.04 + i * 0.08 : 0.44 - i * 0.08));
          const ans = up ? "점점 세게 (cresc.)" : "점점 여리게 (decresc.)";
          return { text: "소리가 점점 세질까요, 점점 여려질까요?", visual: listen("소리 여섯 번"), choices: ["점점 세게 (cresc.)", "점점 여리게 (decresc.)"], answer: ans, play, key: up + "," + n, explain: up ? "작은 소리에서 큰 소리로 커졌어요." : "큰 소리에서 작은 소리로 작아졌어요." };
        }
        const [sym, mean] = pick(DYN);
        if (t === 0) return { text: "'" + sym + "'의 뜻은?", visual: big("<i>" + sym + "</i>"), choices: opts(mean, DYN.map((x) => x[1])), answer: mean, explain: sym + " = " + mean };
        return { text: "'" + mean + "'를 나타내는 셈여림표는?", choices: opts(sym, DYN.map((x) => x[0])), answer: sym, explain: mean + " = " + sym };
      } },
      { id: "tempo", e: "⏱️", name: "빠르기말", desc: "Largo부터 Presto까지", gen() {
        const t = rnd(0, 2);
        if (t === 2) {
          const [a, b] = shuffle(TEMPO).slice(0, 2), fast = a[2] > b[2] ? a : b;
          return { text: "둘 중 더 빠른 빠르기말은?", choices: [a[0], b[0]], answer: fast[0], explain: fast[0] + "는 '" + fast[1] + "'예요." };
        }
        const [word, mean] = pick(TEMPO);
        if (t === 0) return { text: word + "의 뜻은?", choices: opts(mean, TEMPO.map((x) => x[1])), answer: mean, explain: word + " = " + mean };
        return { text: "'" + mean + "'를 나타내는 빠르기말은?", choices: opts(word, TEMPO.map((x) => x[0])), answer: word, explain: mean + " = " + word };
      } },
      { id: "gugak", e: "🪕", name: "국악기", desc: "가야금, 장구, 대금…", gen() {
        const t = rnd(0, 3), [name, fam, how] = pick(GUGAK);
        if (t === 0) return { text: "설명에 알맞은 국악기는?", visual: big(how), choices: opts(name, GUGAK.filter((g) => g[1] === fam).map((g) => g[0]).concat(GUGAK.map((g) => g[0]))), answer: name, explain: name + ": " + how };
        if (t === 1) return { text: "'" + name + "'는 어떤 악기일까요?", choices: ["현악기", "관악기", "타악기"], answer: fam, explain: name + "는 " + fam + "예요. " + how };
        if (t === 2) {
          const out = pick(GUGAK.filter((g) => !SAMUL.includes(g[0])))[0];
          return { text: "사물놀이에 쓰이지 않는 악기는?", choices: opts(out, shuffle(SAMUL)), answer: out, explain: "사물놀이 악기는 꽹과리, 징, 장구, 북이에요." };
        }
        const s = pick(SAMUL), sky = { 꽹과리: "천둥", 징: "바람", 장구: "비", 북: "구름" }[s];
        return { text: "사물놀이에서 '" + s + "'는 무엇의 소리를 나타낼까요?", choices: opts(sky, ["천둥", "바람", "비", "구름"]), answer: sky, explain: "꽹과리는 천둥, 징은 바람, 장구는 비, 북은 구름을 나타낸다고 해요." };
      } },
      { id: "chord", e: "🎹", name: "화음 듣기", desc: "한 음일까 화음일까", gen() {
        const t = rnd(0, 2);
        if (t === 2) { const [notes, name] = pick(CHORDS); return { text: "'" + notes + "'로 이루어진 화음의 이름은?", visual: big(notes), choices: CHORDS.map((c) => c[1]), answer: name, explain: notes + " = " + name }; }
        const root = rnd(-2, 7);
        if (t === 0) {
          const chord = rnd(0, 1) === 1;
          const play = chord ? [note(root, 0, 1.2, 0.2), note(root + 4, 0, 1.2, 0.2), note(root + 7, 0, 1.2, 0.2)] : [note(root, 0, 1.2, 0.35)];
          const ans = chord ? "여러 음이 함께 (화음)" : "한 음";
          return { text: "들린 소리는 한 음일까요, 여러 음이 함께 울린 화음일까요?", visual: listen("한 번 울려요"), choices: ["한 음", "여러 음이 함께 (화음)"], answer: ans, play, key: "c" + chord + root, explain: chord ? "도-미-솔처럼 세 음이 함께 울렸어요." : "음이 하나만 울렸어요." };
        }
        const n = rnd(1, 3), parts = [0, 4, 7].slice(0, n);
        return { text: "음이 몇 개 함께 울렸을까요?", visual: listen("한 번 울려요"), choices: ["1개", "2개", "3개"], answer: n + "개",
          play: parts.map((p) => note(root + p, 0, 1.3, 0.3 / Math.sqrt(n))), key: "n" + n + root, explain: n + "개의 음이 함께 울렸어요." };
      } }
    ]
  });

  // 🎵 음악당 입구: 학년을 골라 음악 방으로 가요.
  // (음악당 건물 그림이 오기 전까지는 교과 언덕 오른쪽 빈 땅 앞에서 이 창이 열려요)
  Activities.register("mushub", ({ el, frame, ctx }) => {
    const root = frame("🎵 음악당: 몇 학년 방으로 갈까요?");
    root.append(Quiz.npcBanner(el, Quiz.NPCS.mus, "안녕! 나는 라라 선생님이야. 귀를 쫑긋! 소리를 잘 듣고 맞혀 보자!"));
    const row = el("div", "qz-missions");
    Quiz.rooms.filter((r) => r.id.startsWith("mus")).forEach((r) => {
      const p = ctx.getProgress(r.id) || { done: [] };
      const all = p.done.length === r.missions.length;
      const b = el("button", "qz-mission" + (all ? " done" : ""), "<span>" + r.e + "</span><b>" + r.grade.replace(/^\S+ /, "") + "</b><small>" + r.title + " · " + (all ? "✅ 도장" : "미션 " + p.done.length + "/" + r.missions.length) + "</small>");
      b.onclick = () => { ctx.sfx("door"); Activities.open(r.id); };
      row.append(b);
    });
    root.append(row);
    ctx.speak("음악당이에요. 몇 학년 방으로 갈까요?");
  });
})();
