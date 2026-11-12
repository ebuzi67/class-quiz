// 🔢 수학 방 6개(1학년 ~ 6학년). 학년마다 미션 5개, 미션마다 난이도 2가지(보통·어려움)가 있어요.
// gen(도구, hard)가 문제를 하나씩 만들어요. hard가 true면 어려운 문제예요. 숫자는 매번 새로 뽑아요.
"use strict";

(() => {
  const { ieyo, rnd, pick, shuffle, opts, near, gcd, lcm, fmt, frac, objects, clock, pie, angle, polygon, rectFig, big } = Quiz.tools;
  const FRUITS = ["🍎", "🍓", "🍊", "🍌", "⭐", "🌸", "🐟", "🎈"];
  const KOR_UNITS = ["일", "십", "백", "천", "만", "십만", "백만", "천만", "억"];
  const won = (n) => Number(n).toLocaleString("ko-KR");

  // 계산 문제(숫자 패드로 답해요)
  const calc = (expr, answer, explain, unit) => ({ text: expr + " = ?", visual: big(expr), input: true, answer, unit, explain: explain || expr + " = " + answer });
  // 숫자 보기 문제
  // 적어 준 오답을 먼저 쓰고, 모자랄 때만 정답 가까운 수로 채워요
  function numQ(text, n, wrongs, explain, visual) {
    const picked = [];
    shuffle(wrongs).concat(near(n, [1, 2])).forEach((x) => { if (x >= 0 && x !== n && !picked.includes(x) && picked.length < 2) picked.push(x); });
    return { text, visual, choices: [String(n)].concat(picked.map(String)), answer: String(n), explain };
  }
  // 기약분수(대분수)로 보여 주기
  const F = (n, d) => { const g = gcd(n, d); return frac(n / g, d / g); };
  // 분수 보기 문제: 정답과 값이 같은 오답은 빼요
  function fracQ(text, visual, n, d, wrongs, explain) {
    const ans = F(n, d);
    const extra = [[n + 1, d], [n, d + 1], [n + d, d], [Math.max(1, n - 1), d], [n, d * 2]];
    return { text, visual, choices: opts(ans, wrongs.concat(extra).filter(([a, b]) => a > 0 && b > 0 && a * d !== n * b).map(([a, b]) => F(a, b))), answer: ans, explain };
  }
  const clockSay = (h, m) => h + "시" + (m ? " " + m + "분" : "");

  // ───────────── 1학년: 숫자 놀이방 ─────────────
  Quiz.add({
    id: "math1", e: "🧸", title: "숫자 놀이방", grade: "수학 1학년", levels: true,
    missions: [
      { id: "count", e: "🔢", name: "수 세기", desc: "9까지의 수", hardDesc: "100까지의 수", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 2)) { const n = rnd(2, 9), e = pick(FRUITS); return numQ("모두 몇 개일까요?", n, [n - 1, n + 1, n + 2], "하나씩 세어 보면 " + n + "개예요.", objects(e, n)); }
          const n = rnd(1, 8), up = rnd(0, 1) === 1, ans = up ? n + 1 : n - 1;
          return numQ(n + "보다 1 " + (up ? "큰" : "작은") + " 수는?", ans, [n, n + 2, Math.max(0, n - 2)], n + "보다 1 " + (up ? "큰" : "작은") + " 수는 " + ans + "이에요.");
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(1, 9), b = rnd(0, 9), n = a * 10 + b; return numQ("10개씩 묶음 " + a + "개와 낱개 " + b + "개는 얼마일까요?", n, [b * 10 + a, n + 10, n - 1, a + b], "10이 " + a + "개면 " + a * 10 + ", 낱개 " + b + "개를 더하면 " + n + "이에요."); }
        if (t === 1) { const n = rnd(11, 98), up = rnd(0, 1) === 1, ans = up ? n + 1 : n - 1; return { text: n + "보다 1 " + (up ? "큰" : "작은") + " 수는?", input: true, answer: ans, explain: n + "보다 1 " + (up ? "큰" : "작은") + " 수는 " + ans + "이에요." }; }
        const a = rnd(11, 99); let b; do { b = rnd(11, 99); } while (b === a);
        const bigger = Math.max(a, b);
        return { text: "더 큰 수는?", choices: [String(a), String(b)], answer: String(bigger), explain: "10개씩 묶음의 수부터 비교해요. " + bigger + "이 더 커요." };
      } },
      { id: "add", e: "➕", name: "덧셈", desc: "합이 9까지", hardDesc: "받아올림이 있는 덧셈", gen(_, hard) {
        if (!hard) {
          const a = rnd(1, 7), b = rnd(1, 9 - a);
          if (rnd(0, 1)) { const e = pick(FRUITS); return { text: a + " + " + b + " = ?", visual: "<div>" + objects(e, a) + big("+") + objects(e, b) + "</div>", input: true, answer: a + b, explain: a + "개와 " + b + "개를 모으면 " + (a + b) + "개예요." }; }
          return calc(a + " + " + b, a + b, a + "에서 " + b + "만큼 이어 세면 " + (a + b) + "이에요.");
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(2, 9), b = rnd(11 - a, 9); return calc(a + " + " + b, a + b, "10을 먼저 만들어요. 답은 " + (a + b) + "이에요."); }
        if (t === 1) { const a = rnd(1, 9); return { text: a + " + □ = 10. □에 알맞은 수는?", visual: big(a + " + □ = 10"), input: true, answer: 10 - a, explain: a + "와 " + (10 - a) + "를 모으면 10이에요." }; }
        const a = rnd(1, 6), b = rnd(1, 6), c = rnd(1, 6); return calc(a + " + " + b + " + " + c, a + b + c, "앞에서부터 차례로 더해요. " + (a + b) + " + " + c + " = " + (a + b + c));
      } },
      { id: "sub", e: "➖", name: "뺄셈", desc: "9까지의 수에서 빼기", hardDesc: "십몇에서 빼기", gen(_, hard) {
        if (!hard) { const a = rnd(2, 9), b = rnd(1, a - 1); return calc(a + " − " + b, a - b, a + "에서 " + b + "를 빼면 " + (a - b) + "이에요."); }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(11, 18), b = rnd(a - 9, 9); return calc(a + " − " + b, a - b, a + "에서 " + b + "를 빼면 " + (a - b) + "이에요."); }
        if (t === 1) { const a = rnd(1, 9); return calc("10 − " + a, 10 - a, "10은 " + a + "와 " + (10 - a) + "로 가를 수 있어요."); }
        const a = rnd(6, 9), b = rnd(1, 3), c = rnd(1, a - b - 1); return calc(a + " − " + b + " − " + c, a - b - c, "앞에서부터 차례로 빼요. " + (a - b) + " − " + c + " = " + (a - b - c));
      } },
      { id: "clock", e: "🕐", name: "시계 보기", desc: "몇 시", hardDesc: "몇 시 30분", gen(_, hard) {
        const h = rnd(1, 12), m = hard && rnd(0, 3) ? 30 : 0, ans = clockSay(h, m);
        return { text: "시계가 가리키는 시각은?", visual: clock(h, m), choices: opts(ans, [clockSay(h % 12 + 1, m), clockSay(h, 30 - m), clockSay((h + 5) % 12 + 1, m), clockSay((h + 9) % 12 + 1, 30 - m)]), answer: ans,
          explain: m ? "긴바늘이 6을 가리키면 30분이에요. 짧은바늘은 " + h + "와 " + (h % 12 + 1) + " 사이에 있어요." : "긴바늘이 12를 가리키면 '몇 시'예요. 짧은바늘이 " + h + "를 가리켜요." };
      } },
      { id: "pattern", e: "🔁", name: "규칙 찾기", desc: "되풀이되는 무늬", hardDesc: "여러 가지 규칙, 뛰어 세기", gen(_, hard) {
        const [a, b, c] = shuffle(["🔴", "🔵", "🟡", "🟢", "⭐", "🌙", "🍎", "🍌"]);
        if (!hard) {
          const unit = [a, b], len = rnd(4, 5), seq = Array.from({ length: len }, (_, k) => unit[k % 2]), ans = unit[len % 2];
          return { text: "규칙을 찾아요. ❓에 올 것은?", visual: big(seq.join(" ") + " ❓"), choices: [a, b, c], answer: ans, explain: a + " " + b + " 가 되풀이돼요." };
        }
        if (rnd(0, 2) === 0) {
          const step = pick([2, 5, 10]), start = step * rnd(1, 4), seq = [0, 1, 2, 3].map((k) => start + k * step), ans = start + 4 * step;
          return { text: "규칙을 찾아요. □에 알맞은 수는?", visual: big(seq.join(", ") + ", □"), input: true, answer: ans, explain: step + "씩 커지는 규칙이에요." };
        }
        const unit = pick([[a, a, b], [a, b, b], [a, b, c]]), len = rnd(6, 8), seq = Array.from({ length: len }, (_, k) => unit[k % 3]), ans = unit[len % 3];
        return { text: "규칙을 찾아요. ❓에 올 것은?", visual: big(seq.join(" ") + " ❓"), choices: [a, b, c], answer: ans, explain: unit.join(" ") + " 가 되풀이돼요." };
      } }
    ]
  });

  // ───────────── 2학년: 구구단 놀이방 ─────────────
  Quiz.add({
    id: "math2", e: "🎲", title: "구구단 놀이방", grade: "수학 2학년", levels: true,
    missions: [
      { id: "place", e: "🔢", name: "세 자리 수·네 자리 수", desc: "세 자리 수", hardDesc: "네 자리 수", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(1, 9), b = rnd(0, 9), c = rnd(0, 9), n = a * 100 + b * 10 + c; return numQ("100이 " + a + "개, 10이 " + b + "개, 1이 " + c + "개인 수는?", n, [a * 100 + c * 10 + b, a * 10 + b + c, n + 100, n - 10], a * 100 + " + " + b * 10 + " + " + c + " = " + n); }
          const n = rnd(110, 880), k = pick([[10, "10 큰"], [100, "100 큰"], [-10, "10 작은"], [-100, "100 작은"]]);
          return { text: n + "보다 " + k[1] + " 수는?", input: true, answer: n + k[0], explain: (Math.abs(k[0]) === 10 ? "십" : "백") + "의 자리 숫자가 1 달라져요. 답은 " + (n + k[0]) + "이에요." };
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(1, 9), b = rnd(0, 9), c = rnd(0, 9), d = rnd(0, 9), n = a * 1000 + b * 100 + c * 10 + d; return numQ("1000이 " + a + "개, 100이 " + b + "개, 10이 " + c + "개, 1이 " + d + "개인 수는?", n, [a * 1000 + c * 100 + b * 10 + d, n + 1000, n - 100, a * 100 + b * 10 + c], "천, 백, 십, 일의 자리에 차례로 써요. " + n); }
        if (t === 1) { const step = pick([100, 1000]), start = rnd(1, 5) * 1000 + rnd(1, 8) * 100, seq = [0, 1, 2].map((k) => start + k * step); return { text: "뛰어 세기: □에 알맞은 수는?", visual: big(seq.join(", ") + ", □"), input: true, answer: start + 3 * step, explain: step + "씩 뛰어 세었어요." }; }
        const a = rnd(1000, 9999); let b; do { b = rnd(1000, 9999); } while (b === a);
        return { text: "더 큰 수는?", choices: [String(a), String(b)], answer: String(Math.max(a, b)), explain: "천의 자리부터 차례로 비교해요. " + Math.max(a, b) + "이 더 커요." };
      } },
      { id: "addsub", e: "➕", name: "덧셈과 뺄셈", desc: "두 자리 수", hardDesc: "세 수의 계산, □ 구하기", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(15, 68), b = rnd(10, 98 - a); return calc(a + " + " + b, a + b, "일의 자리끼리, 십의 자리끼리 더해요. 답은 " + (a + b) + "이에요."); }
          const a = rnd(31, 95), b = rnd(12, a - 10); return calc(a + " − " + b, a - b, "일의 자리부터 빼요. 모자라면 십의 자리에서 10을 빌려 와요. 답은 " + (a - b) + "이에요.");
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(20, 60), b = rnd(11, 35), c = rnd(11, a + b - 5); return calc(a + " + " + b + " − " + c, a + b - c, "앞에서부터 차례로 계산해요. " + (a + b) + " − " + c + " = " + (a + b - c)); }
        if (t === 1) { const a = rnd(12, 55), s = a + rnd(11, 40); return { text: a + " + □ = " + s + ". □에 알맞은 수는?", visual: big(a + " + □ = " + s), input: true, answer: s - a, explain: s + " − " + a + " = " + (s - a) }; }
        const a = rnd(45, 95), d = rnd(12, a - 12); return { text: a + " − □ = " + d + ". □에 알맞은 수는?", visual: big(a + " − □ = " + d), input: true, answer: a - d, explain: a + " − " + d + " = " + (a - d) };
      } },
      { id: "times", e: "✖️", name: "곱셈구구", desc: "2, 3, 4, 5단", hardDesc: "6, 7, 8, 9단", gen(_, hard) {
        const a = hard ? rnd(6, 9) : rnd(2, 5), b = rnd(hard ? 2 : 1, 9);
        if (!hard && a * b <= 20 && rnd(0, 1)) { const e = pick(FRUITS); return { text: e + "가 " + a + "개씩 " + b + "묶음 있어요. 모두 몇 개일까요?", visual: objects(e, a * b), input: true, answer: a * b, explain: a + " × " + b + " = " + a * b }; }
        if (hard && rnd(0, 2) === 0) return { text: a + " × □ = " + a * b + ". □에 알맞은 수는?", visual: big(a + " × □ = " + a * b), input: true, answer: b, explain: a + "단에서 " + a * b + "가 되는 수는 " + b + "예요." };
        return calc(a + " × " + b, a * b, a + "단: " + a + " × " + b + " = " + a * b);
      } },
      { id: "clock", e: "🕐", name: "시각과 시간", desc: "몇 시 몇 분(5분 단위)", hardDesc: "시간 계산", gen(_, hard) {
        if (!hard) {
          const h = rnd(1, 12), m = pick([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]), ans = clockSay(h, m);
          return { text: "시계가 가리키는 시각은?", visual: clock(h, m), choices: opts(ans, [clockSay(h % 12 + 1, m), clockSay(h, (m + 30) % 60), clockSay(m / 5, h * 5 % 60), clockSay(h, (m + 5) % 60 || 5)]), answer: ans, explain: "긴바늘이 숫자 1을 가리키면 5분, 2를 가리키면 10분이에요. " + ans + "이에요." };
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(1, 3), b = rnd(1, 11) * 5; return { text: a + "시간 " + b + "분은 몇 분일까요?", input: true, unit: "분", answer: a * 60 + b, explain: "1시간 = 60분이에요. " + a * 60 + " + " + b + " = " + (a * 60 + b) + "분" }; }
        if (t === 1) { const n = rnd(13, 35) * 5, ans = Math.floor(n / 60) + "시간 " + (n % 60) + "분"; const w = (x) => Math.floor(x / 60) + "시간 " + (x % 60) + "분"; return { text: n + "분은 몇 시간 몇 분일까요?", choices: opts(ans, [w(n + 60), w(n + 10), w(n - 20), Math.floor(n / 100) + "시간 " + (n % 100) + "분"]), answer: ans, explain: "60분 = 1시간이에요. " + n + "분 = " + ans }; }
        const h = rnd(1, 10), m = pick([10, 20, 30, 40, 50]), add = pick([30, 40, 50]), tot = h * 60 + m + add, ans = clockSay(Math.floor(tot / 60), tot % 60);
        return { text: clockSay(h, m) + "에서 " + add + "분 뒤는 몇 시 몇 분일까요?", choices: opts(ans, [clockSay(h, (m + add) % 60), clockSay(h + 1, m), clockSay(Math.floor(tot / 60) + 1, tot % 60), clockSay(h, m + 5)]), answer: ans, explain: "60분이 넘으면 1시간이 돼요. 답은 " + ans + "이에요." };
      } },
      { id: "length", e: "📏", name: "길이 재기", desc: "m와 cm", hardDesc: "길이의 합과 차", gen(_, hard) {
        const a = rnd(1, 8), b = rnd(5, 95);
        if (!hard) {
          if (rnd(0, 1)) return { text: a + " m " + b + " cm는 몇 cm일까요?", input: true, unit: "cm", answer: a * 100 + b, explain: "1 m = 100 cm예요. " + a * 100 + " + " + b + " = " + (a * 100 + b) + " cm" };
          const n = a * 100 + b, ans = a + " m " + b + " cm";
          return { text: n + " cm는 몇 m 몇 cm일까요?", choices: opts(ans, [b + " m " + a + " cm", (a + 1) + " m " + b + " cm", Math.floor(n / 10) + " m " + (n % 10) + " cm", a + " m " + (b + 10) % 100 + " cm"]), answer: ans, explain: "100 cm = 1 m예요. " + n + " cm = " + ans };
        }
        const c = rnd(1, 5), d = rnd(5, 95), plus = rnd(0, 1) === 1;
        const x = (a + c) * 100 + b, y = c * 100 + d, tot = plus ? x + y : x - y;
        const sh = (n) => Math.floor(n / 100) + " m " + (n % 100) + " cm";
        if (tot <= 0) return { text: a + " m " + b + " cm는 몇 cm일까요?", input: true, unit: "cm", answer: a * 100 + b, explain: "1 m = 100 cm예요." };
        return { text: sh(x) + (plus ? " + " : " − ") + sh(y) + " = ?", visual: big(sh(x) + (plus ? " + " : " − ") + sh(y)), choices: opts(sh(tot), [sh(tot + 100), sh(Math.abs(tot - 100)), sh(tot + 10), sh(plus ? x - y > 0 ? x - y : tot + 20 : x + y)]), answer: sh(tot), explain: "m는 m끼리, cm는 cm끼리 계산해요. 답은 " + sh(tot) + "예요." };
      } }
    ]
  });

  // ───────────── 3학년: 측정 공방 ─────────────
  Quiz.add({
    id: "math3", e: "⚖️", title: "측정 공방", grade: "수학 3학년", levels: true,
    missions: [
      { id: "addsub", e: "➕", name: "덧셈과 뺄셈", desc: "세 자리 수", hardDesc: "네 자리 수, □ 구하기", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(120, 560), b = rnd(110, 990 - a); return calc(a + " + " + b, a + b); }
          const a = rnd(400, 990), b = rnd(110, a - 100); return calc(a + " − " + b, a - b);
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(1200, 5600), b = rnd(350, 990); return calc(a + " + " + b, a + b); }
        if (t === 1) { const a = rnd(2000, 9000), b = rnd(350, 1900); return calc(a + " − " + b, a - b); }
        const a = rnd(150, 600), s = a + rnd(150, 380); return { text: "□ + " + a + " = " + s + ". □에 알맞은 수는?", visual: big("□ + " + a + " = " + s), input: true, answer: s - a, explain: s + " − " + a + " = " + (s - a) };
      } },
      { id: "mul", e: "✖️", name: "곱셈", desc: "(두 자리 수) × (한 자리 수)", hardDesc: "(세 자리)×(한 자리), (두 자리)×(두 자리)", gen(_, hard) {
        if (!hard) { const a = rnd(12, 98), b = rnd(2, 9); return calc(a + " × " + b, a * b); }
        if (rnd(0, 1)) { const a = rnd(112, 890), b = rnd(2, 9); return calc(a + " × " + b, a * b); }
        const a = rnd(12, 48), b = rnd(11, 35); return calc(a + " × " + b, a * b);
      } },
      { id: "div", e: "➗", name: "나눗셈", desc: "곱셈구구로 나누기", hardDesc: "나머지가 있는 나눗셈", gen(_, hard) {
        if (!hard) {
          const b = rnd(2, 9), q = rnd(2, 9);
          if (rnd(0, 2) === 0) { const e = pick(FRUITS); return { text: e + " " + b * q + "개를 " + b + "명이 똑같이 나누면 한 명이 몇 개씩 가질까요?", input: true, unit: "개", answer: q, explain: b * q + " ÷ " + b + " = " + q }; }
          return calc(b * q + " ÷ " + b, q, b + " × " + q + " = " + b * q + " 이니까 몫은 " + q + "이에요.");
        }
        if (rnd(0, 2) === 0) { const b = rnd(2, 6), q = rnd(11, Math.floor(98 / b)); return calc(b * q + " ÷ " + b, q, b + " × " + q + " = " + b * q); }
        const b = rnd(3, 9), q = rnd(2, 12), r = rnd(1, b - 1), n = b * q + r, ans = "몫 " + q + ", 나머지 " + r;
        return { text: n + " ÷ " + b + "의 몫과 나머지는?", visual: big(n + " ÷ " + b), choices: opts(ans, ["몫 " + (q + 1) + ", 나머지 " + r, "몫 " + q + ", 나머지 " + (r % (b - 1) + 1 === r ? r + 1 : r % (b - 1) + 1), "몫 " + (q - 1) + ", 나머지 " + (r + b)]), answer: ans, explain: b + " × " + q + " = " + b * q + ", " + n + " − " + b * q + " = " + r + " (나머지는 " + b + "보다 작아야 해요)" };
      } },
      { id: "fraction", e: "🍕", name: "분수와 소수", desc: "분수 읽기, 0.1", hardDesc: "크기 비교, 대분수", gen(_, hard) {
        if (!hard) {
          const t = rnd(0, 2);
          if (t === 0) { const d = rnd(2, 8), n = rnd(1, d - 1); return { text: "색칠한 부분을 분수로 나타내면?", visual: pie(n, d), choices: opts(frac(n, d), [frac(d - n, d), frac(n, d + 1), frac(n + 1, d + 2), frac(1, d)].filter((x) => x !== frac(n, d))), answer: frac(n, d), explain: "전체를 똑같이 " + d + "조각으로 나눈 것 중 " + n + "조각이에요." }; }
          if (t === 1) { const n = rnd(2, 9); return { text: "0.1이 " + n + "개인 수는?", choices: opts(fmt(n / 10), [fmt(n / 100), String(n), fmt(n / 10 + 1)]), answer: fmt(n / 10), explain: "0.1이 " + n + "개면 " + fmt(n / 10) + "이에요." }; }
          const a = rnd(2, 5), b = rnd(a + 1, 9); return { text: "더 큰 분수는?", choices: [frac(1, a), frac(1, b)], answer: frac(1, a), explain: "분자가 1이면 분모가 작을수록 한 조각이 커요." };
        }
        const t = rnd(0, 2);
        if (t === 0) { const d = rnd(5, 12), a = rnd(1, d - 2), b = rnd(a + 1, d - 1); return { text: "더 큰 분수는?", choices: [frac(a, d), frac(b, d)], answer: frac(b, d), explain: "분모가 같으면 분자가 클수록 커요." }; }
        if (t === 1) { const d = rnd(2, 7), w = rnd(1, 4), r = rnd(1, d - 1), n = w * d + r; return { text: "가분수 " + frac(n, d, false) + "를 대분수로 나타내면?", visual: big(frac(n, d, false)), choices: opts(frac(n, d), [frac((w + 1) * d + r, d), frac(w * d + r, d + 1), frac(r * d + w, d)].filter((x) => x !== frac(n, d))), answer: frac(n, d), explain: n + " ÷ " + d + " = " + w + " … " + r + " 이니까 " + w + "과 " + d + "분의 " + r + "이에요." }; }
        const a = rnd(11, 98) / 10; let b; do { b = rnd(11, 98) / 10; } while (b === a);
        return { text: "더 큰 소수는?", choices: [fmt(a), fmt(b)], answer: fmt(Math.max(a, b)), explain: "자연수 부분부터 비교하고, 같으면 소수 첫째 자리를 비교해요." };
      } },
      { id: "units", e: "📏", name: "길이·시간·들이·무게", desc: "mm와 cm, km와 m, 분과 초", hardDesc: "L와 mL, kg과 g, t", gen(_, hard) {
        const U = hard ? [
          () => { const a = rnd(1, 9), b = rnd(1, 9) * 100 + pick([0, 50]); return [a + " L " + b + " mL는 몇 mL일까요?", a * 1000 + b, "mL", "1 L = 1000 mL"]; },
          () => { const a = rnd(1, 9), b = rnd(1, 19) * 50; return [a + " kg " + b + " g은 몇 g일까요?", a * 1000 + b, "g", "1 kg = 1000 g"]; },
          () => { const a = rnd(2, 9); return [a + " t은 몇 kg일까요?", a * 1000, "kg", "1 t = 1000 kg"]; },
          () => { const a = rnd(1, 4), b = rnd(1, 9) * 100, c = rnd(1, 4), d = rnd(1, 9) * 100; return [a + " L " + b + " mL + " + c + " L " + d + " mL는 몇 mL일까요?", (a + c) * 1000 + b + d, "mL", "L는 L끼리, mL는 mL끼리 더해요"]; }
        ] : [
          () => { const a = rnd(1, 15), b = rnd(1, 9); return [a + " cm " + b + " mm는 몇 mm일까요?", a * 10 + b, "mm", "1 cm = 10 mm"]; },
          () => { const a = rnd(1, 9), b = rnd(1, 9) * 100 + pick([0, 50]); return [a + " km " + b + " m는 몇 m일까요?", a * 1000 + b, "m", "1 km = 1000 m"]; },
          () => { const a = rnd(1, 5), b = rnd(5, 55); return [a + "분 " + b + "초는 몇 초일까요?", a * 60 + b, "초", "1분 = 60초"]; }
        ];
        const [text, ans, unit, ex] = pick(U)();
        return { text, input: true, unit, answer: ans, explain: ex + " 이니까 " + won(ans) + " " + unit + "예요." };
      } }
    ]
  });

  // ───────────── 4학년: 도형 공방 ─────────────
  const TRI = [["세 변의 길이가 모두 같은 삼각형은?", "정삼각형"], ["두 변의 길이가 같은 삼각형은?", "이등변삼각형"], ["한 각이 직각인 삼각형은?", "직각삼각형"], ["세 각이 모두 예각인 삼각형은?", "예각삼각형"], ["한 각이 둔각인 삼각형은?", "둔각삼각형"],
    ["마주 보는 두 쌍의 변이 서로 평행한 사각형은?", "평행사변형"], ["네 변의 길이가 모두 같은 사각형은?", "마름모"], ["네 각이 모두 직각인 사각형은?", "직사각형"], ["평행한 변이 한 쌍이라도 있는 사각형은?", "사다리꼴"]];

  Quiz.add({
    id: "math4", e: "📐", title: "도형 공방", grade: "수학 4학년", levels: true,
    missions: [
      { id: "bignum", e: "🔢", name: "큰 수", desc: "만, 십만, 백만, 천만", hardDesc: "억과 조", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(1, 9), b = rnd(0, 9), n = a * 10000 + b * 1000; return numQ("10000이 " + a + "개, 1000이 " + b + "개인 수는?", n, [a * 1000 + b * 100, a * 100000 + b * 10000, n + 100], "10000이 " + a + "개면 " + a + "만, 1000이 " + b + "개면 " + b + "천이에요."); }
          let digits, pos, d;
          do { digits = String(rnd(1000000, 9999999)); pos = rnd(0, 6); d = digits[pos]; } while (digits.indexOf(d) !== digits.lastIndexOf(d));
          const place = KOR_UNITS[digits.length - 1 - pos];
          return { text: won(digits) + "에서 숫자 " + d + "는 어느 자리일까요?", visual: big(won(digits)), choices: opts(place + "의 자리", KOR_UNITS.slice(0, 7).filter((u) => u !== place).map((u) => u + "의 자리")), answer: place + "의 자리", explain: "오른쪽부터 일, 십, 백, 천, 만, 십만, 백만의 자리예요." };
        }
        const t = rnd(0, 2);
        if (t === 0) { const B = [["1억은 1000만이 몇 개인 수일까요?", 10], ["1억은 100만이 몇 개인 수일까요?", 100], ["1억은 1만이 몇 개인 수일까요?", 10000], ["1조는 1000억이 몇 개인 수일까요?", 10], ["1조는 1억이 몇 개인 수일까요?", 10000]]; const [q, a] = pick(B); return { text: q, input: true, answer: a, unit: "개", explain: "답은 " + won(a) + "개예요." }; }
        if (t === 1) { const a = rnd(2, 9), b = rnd(1, 9), unit = pick(["억", "조"]), step = pick([1, 10]), seq = [0, 1, 2].map((k) => (a * 10 + b + k * step) + unit); return { text: "뛰어 세기: 다음에 올 수는?", visual: big(seq.join(", ") + ", □"), choices: opts((a * 10 + b + 3 * step) + unit, [(a * 10 + b + 4 * step) + unit, (a * 10 + b + 2 * step + 1) + unit, (a * 10 + b + 3 * step + 10) + unit]), answer: (a * 10 + b + 3 * step) + unit, explain: step + unit + "씩 뛰어 세었어요." }; }
        const a = rnd(11, 98), b = rnd(1000, 9999); let c; do { c = rnd(11, 98); } while (c === a);
        const x = a + "억 " + b + "만", y = c + "억 " + rnd(1000, 9999) + "만";
        return { text: "더 큰 수는?", choices: [x, y], answer: a > c ? x : y, explain: "가장 높은 자리인 억부터 비교해요." };
      } },
      { id: "muldiv", e: "✖️", name: "곱셈과 나눗셈", desc: "몇십으로 곱하고 나누기", hardDesc: "(세 자리)×(두 자리), (세 자리)÷(두 자리)", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(12, 95) * 10, b = rnd(2, 9) * 10; return calc(a + " × " + b, a * b, "0을 빼고 곱한 다음 0을 두 개 붙여요. " + won(a * b)); }
          const b = rnd(2, 9) * 10, q = rnd(3, 9); return calc(b * q + " ÷ " + b, q, b + " × " + q + " = " + b * q);
        }
        if (rnd(0, 1)) { const a = rnd(112, 480), b = rnd(12, 39); return calc(a + " × " + b, a * b); }
        const b = rnd(12, 39), q = rnd(4, 24), r = rnd(1, b - 1), n = b * q + r, ans = "몫 " + q + ", 나머지 " + r;
        return { text: n + " ÷ " + b + "의 몫과 나머지는?", visual: big(n + " ÷ " + b), choices: opts(ans, ["몫 " + (q + 1) + ", 나머지 " + r, "몫 " + q + ", 나머지 " + (r > 1 ? r - 1 : r + 1), "몫 " + (q - 1) + ", 나머지 " + (r + b)]), answer: ans, explain: b + " × " + q + " = " + b * q + ", " + n + " − " + b * q + " = " + r };
      } },
      { id: "angle", e: "📐", name: "각도와 도형", desc: "예각·직각·둔각, 삼각형의 각", hardDesc: "사각형의 각, 도형 이름", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const d = pick([30, 45, 60, 75, 90, 90, 110, 120, 135, 150]), name = d < 90 ? "예각" : d === 90 ? "직각" : "둔각"; return { text: "이 각은 무엇일까요?", visual: angle(d), choices: ["예각", "직각", "둔각"], answer: name, explain: "직각(90°)보다 작으면 예각, 90°면 직각, 90°보다 크면 둔각이에요." }; }
          const a = rnd(3, 9) * 10, b = rnd(3, 12) * 5; return { text: "삼각형의 두 각이 " + a + "°, " + b + "°일 때 나머지 한 각은 몇 도일까요?", input: true, unit: "°", answer: 180 - a - b, explain: "삼각형 세 각의 합은 180°예요. 180 − " + a + " − " + b + " = " + (180 - a - b) };
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(6, 11) * 10, b = rnd(6, 11) * 10, c = rnd(5, 10) * 10; return { text: "사각형의 세 각이 " + a + "°, " + b + "°, " + c + "°일 때 나머지 한 각은 몇 도일까요?", input: true, unit: "°", answer: 360 - a - b - c, explain: "사각형 네 각의 합은 360°예요. 360 − " + (a + b + c) + " = " + (360 - a - b - c) }; }
        if (t === 1) { const a = rnd(4, 17) * 5, b = rnd(4, 17) * 5, plus = rnd(0, 1) === 1, x = Math.max(a, b), y = Math.min(a, b); return calc(plus ? a + "° + " + b + "°" : x + "° − " + y + "°", plus ? a + b : x - y, "각도도 자연수처럼 더하고 빼요.", "°"); }
        const [q, a] = pick(TRI); return { text: q, choices: opts(a, TRI.map((x) => x[1]).filter((x) => x !== a)), answer: a, explain: q.replace("은?", "은") + " " + a + ieyo(a) + "." };
      } },
      { id: "fraction", e: "🍰", name: "분수의 덧셈과 뺄셈", desc: "분모가 같은 진분수", hardDesc: "대분수, 자연수 − 분수", gen(_, hard) {
        const d = rnd(4, 12);
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(1, d - 2), b = rnd(1, d - 1 - a); return { text: "계산해 보세요.", visual: big(frac(a, d) + " + " + frac(b, d)), choices: opts(frac(a + b, d), [frac(a + b, d + d), frac(a + b + 1, d), frac(Math.abs(a - b) || d - 1, d), frac(a + b - 1 || d - 1, d)].filter((x) => x !== frac(a + b, d))), answer: frac(a + b, d), explain: "분모가 같으면 분자끼리 더해요: " + a + " + " + b + " = " + (a + b) }; }
          const a = rnd(3, d - 1), b = rnd(1, a - 1); return { text: "계산해 보세요.", visual: big(frac(a, d) + " − " + frac(b, d)), choices: opts(frac(a - b, d), [frac(a + b, d), frac(a - b + 1, d), frac(a - b, d + 1), frac(a - b + 2, d)].filter((x) => x !== frac(a - b, d))), answer: frac(a - b, d), explain: "분모가 같으면 분자끼리 빼요: " + a + " − " + b + " = " + (a - b) };
        }
        if (rnd(0, 1)) {
          const w1 = rnd(1, 4), w2 = rnd(1, 4), a = rnd(1, d - 1), b = rnd(1, d - 1), n = (w1 + w2) * d + a + b;
          return { text: "계산해 보세요.", visual: big(frac(w1 * d + a, d) + " + " + frac(w2 * d + b, d)), choices: opts(frac(n, d), [frac(n + d, d), frac(n - d, d), frac(n + 1, d), frac(n - 1, d)].filter((x) => x !== frac(n, d))), answer: frac(n, d), explain: "자연수끼리, 분수끼리 더해요. 분수가 1보다 크면 자연수로 올려요." };
        }
        const w = rnd(2, 6), a = rnd(1, d - 1), n = w * d - a;
        return { text: "계산해 보세요.", visual: big(w + " − " + frac(a, d)), choices: opts(frac(n, d), [frac(n + d, d), frac(w * d + a, d), frac(n - d > 0 ? n - d : n + 1, d), frac(w * d - (d - a), d)].filter((x) => x !== frac(n, d))), answer: frac(n, d), explain: "자연수에서 1만큼을 분수로 바꿔요: " + w + " = " + (w - 1) + "과 " + frac(d, d, false) + ". 여기서 " + frac(a, d) + "를 빼요." };
      } },
      { id: "decimal", e: "🔟", name: "소수의 덧셈과 뺄셈", desc: "소수 한 자리 수", hardDesc: "소수 두 자리 수, 10배", gen(_, hard) {
        const dq = (expr, ans, wrongs, explain) => ({ text: "계산해 보세요.", visual: big(expr), choices: opts(fmt(ans), wrongs.map(fmt).filter((x) => x !== fmt(ans) && Number(x) > 0)), answer: fmt(ans), explain: explain || expr + " = " + fmt(ans) });
        if (!hard) {
          const a = rnd(11, 68) / 10, b = rnd(11, 58) / 10;
          if (rnd(0, 1)) return dq(fmt(a) + " + " + fmt(b), a + b, [a + b + 1, a + b - 0.1, (a + b) * 10, a + b + 0.1], "소수점 자리를 맞추어 더해요.");
          const x = Math.max(a, b) + 1, y = Math.min(a, b); return dq(fmt(x) + " − " + fmt(y), x - y, [x - y + 1, x - y + 0.1, x + y, x - y - 0.1], "소수점 자리를 맞추어 빼요.");
        }
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(105, 680) / 100, b = rnd(11, 95) / 10; return dq(fmt(a) + " + " + fmt(b), a + b, [a + b / 10, a + b + 0.1, a + b - 0.01, a + b + 1], "소수점 자리를 맞추어 더해요. " + fmt(b) + "는 " + b.toFixed(2) + "로 생각해요."); }
        if (t === 1) { const a = rnd(305, 980) / 100, b = rnd(105, 290) / 100; return dq(fmt(a) + " − " + fmt(b), a - b, [a - b + 0.1, a - b + 1, a + b, a - b - 0.01], "소수점 자리를 맞추어 빼요."); }
        const a = rnd(105, 980) / 100, up = rnd(0, 1) === 1;
        return { text: fmt(a) + "의 " + (up ? "10배" : "1/10") + "는?", choices: opts(fmt(up ? a * 10 : a / 10), [fmt(up ? a * 100 : a / 100), fmt(up ? a / 10 : a * 10), fmt(a + (up ? 10 : 0.1))]), answer: fmt(up ? a * 10 : a / 10), explain: up ? "10배 하면 소수점이 오른쪽으로 한 칸 가요." : "1/10 하면 소수점이 왼쪽으로 한 칸 가요." };
      } }
    ]
  });

  // ───────────── 5학년: 수학 탐정 사무소 ─────────────
  Quiz.add({
    id: "math5", e: "🕵️", title: "수학 탐정 사무소", grade: "수학 5학년", levels: true,
    missions: [
      { id: "factor", e: "🔍", name: "약수와 배수", desc: "약수, 배수 찾기", hardDesc: "최대공약수, 최소공배수", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const n = pick([12, 18, 20, 24, 30, 36]); const divs = []; for (let k = 1; k <= n; k++) if (n % k === 0) divs.push(k); const non = []; for (let k = 2; k < n; k++) if (n % k) non.push(k); const w = pick(non); return { text: n + "의 약수가 아닌 것은?", choices: opts(String(w), divs.filter((d) => d > 1 && d < n).map(String), 4), answer: String(w), explain: n + "의 약수: " + divs.join(", ") }; }
          const k = rnd(3, 9), m = k * rnd(3, 9), wr = [m + 1, m - 1, m + 2, m - 2].filter((x) => x % k);
          return { text: k + "의 배수는?", choices: opts(String(m), wr.map(String), 4), answer: String(m), explain: k + " × " + m / k + " = " + m + " 이니까 " + m + "은 " + k + "의 배수예요." };
        }
        if (rnd(0, 1)) { const g = rnd(2, 8), a = g * rnd(2, 5); let b = g * rnd(2, 6); if (b === a) b += g; const G = gcd(a, b); return { text: a + "와 " + b + "의 최대공약수는?", input: true, answer: G, explain: "두 수를 모두 나누어떨어지게 하는 가장 큰 수는 " + G + "이에요." }; }
        const a = rnd(2, 12); let b = rnd(2, 15); if (b === a) b++; const L = lcm(a, b);
        return { text: a + "와 " + b + "의 최소공배수는?", input: true, answer: L, explain: "두 수의 공통인 배수 중 가장 작은 수는 " + L + "이에요." };
      } },
      { id: "fracadd", e: "🍰", name: "분수의 덧셈과 뺄셈", desc: "약분, 단위분수의 합", hardDesc: "분모가 다른 분수", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 4); return fracQ(frac(n * k, d * k, false) + "을 기약분수로 나타내면?", big(frac(n * k, d * k, false)), n, d, [[n, d * k], [n * k, d], [n + 1, d + 1]], "분모와 분자를 최대공약수로 나눠요."); }
          const [a, b] = pick([[2, 3], [2, 5], [3, 4], [4, 6], [3, 5], [2, 7], [4, 5], [6, 8], [3, 6], [2, 4]]);
          return fracQ("계산해 보세요.", big(frac(1, a) + " + " + frac(1, b)), a + b, a * b, [[2, a + b], [1, a + b], [2, a * b]], "통분해서 더해요: " + frac(b, a * b, false) + " + " + frac(a, a * b, false) + " = " + frac(a + b, a * b, false));
        }
        const [b, d] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [4, 6], [5, 6], [3, 8], [6, 8], [4, 9], [6, 9], [5, 10]]), a = rnd(1, b - 1), c = rnd(1, d - 1);
        const x = a * d, y = c * b, D = b * d;
        if (rnd(0, 1) || x === y) return fracQ("계산해 보세요.", big(frac(a, b) + " + " + frac(c, d)), x + y, D, [[a + c, b + d], [a + c, D], [x + y, b + d]], "통분하면 " + frac(x, D, false) + " + " + frac(y, D, false) + " = " + frac(x + y, D, false) + " 이에요.");
        const hi = Math.max(x, y), lo = Math.min(x, y), first = x > y ? frac(a, b) : frac(c, d), second = x > y ? frac(c, d) : frac(a, b);
        return fracQ("계산해 보세요.", big(first + " − " + second), hi - lo, D, [[Math.abs(a - c) || 1, Math.abs(b - d) || 1], [hi + lo, D], [Math.abs(a - c) || 1, D]], "통분하면 " + frac(hi, D, false) + " − " + frac(lo, D, false) + " = " + frac(hi - lo, D, false) + " 이에요.");
      } },
      { id: "fracmul", e: "✖️", name: "분수와 소수의 곱셈", desc: "(분수)×(자연수), (소수)×(자연수)", hardDesc: "(분수)×(분수), (소수)×(소수)", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 6); return fracQ("계산해 보세요.", big(frac(n, d) + " × " + k), n * k, d, [[n, d * k], [n + k, d], [n * k, d * k]], "분자에 자연수를 곱해요: " + n + " × " + k + " = " + n * k); }
          const a = rnd(2, 9), k = rnd(2, 9), ans = fmt(a / 10 * k);
          return { text: "계산해 보세요.", visual: big("0." + a + " × " + k), choices: opts(ans, [fmt(a * k), fmt(a * k / 100), fmt(a / 10 + k)]), answer: ans, explain: a + " × " + k + " = " + a * k + " 이니까 0." + a + " × " + k + " = " + ans };
        }
        if (rnd(0, 1)) { const b = rnd(2, 7), d = rnd(2, 7), a = rnd(1, b - 1), c = rnd(1, d - 1); return fracQ("계산해 보세요.", big(frac(a, b) + " × " + frac(c, d)), a * c, b * d, [[a + c, b + d], [a * d, b * c], [a * c, b + d]], "분자는 분자끼리, 분모는 분모끼리 곱해요: " + frac(a * c, b * d, false)); }
        const a = rnd(2, 9), b = rnd(2, 9), ans = fmt(a * b / 100);
        return { text: "계산해 보세요.", visual: big("0." + a + " × 0." + b), choices: opts(ans, [fmt(a * b / 10), fmt(a * b), fmt(a * b / 1000), fmt((a + b) / 10)]), answer: ans, explain: a + " × " + b + " = " + a * b + ". 소수 한 자리 수끼리 곱하면 소수 두 자리 수가 돼요: " + ans };
      } },
      { id: "area", e: "📐", name: "다각형의 둘레와 넓이", desc: "직사각형, 평행사변형", hardDesc: "삼각형, 사다리꼴, 마름모", gen(_, hard) {
        if (!hard) {
          const w = rnd(3, 15), h = rnd(2, 12), t = rnd(0, 2);
          if (t === 0) return { text: "직사각형의 넓이는 몇 cm²일까요?", visual: rectFig(w + " cm", h + " cm"), input: true, unit: "cm²", answer: w * h, explain: "가로 × 세로 = " + w + " × " + h + " = " + w * h };
          if (t === 1) return { text: "직사각형의 둘레는 몇 cm일까요?", visual: rectFig(w + " cm", h + " cm"), input: true, unit: "cm", answer: 2 * (w + h), explain: "(가로 + 세로) × 2 = (" + w + " + " + h + ") × 2 = " + 2 * (w + h) };
          return { text: "밑변이 " + w + " cm, 높이가 " + h + " cm인 평행사변형의 넓이는?", input: true, unit: "cm²", answer: w * h, explain: "밑변 × 높이 = " + w + " × " + h + " = " + w * h };
        }
        const t = rnd(0, 2);
        if (t === 0) { const b = rnd(2, 10) * 2, h = rnd(3, 12); return { text: "밑변이 " + b + " cm, 높이가 " + h + " cm인 삼각형의 넓이는?", input: true, unit: "cm²", answer: b * h / 2, explain: "밑변 × 높이 ÷ 2 = " + b + " × " + h + " ÷ 2 = " + b * h / 2 }; }
        if (t === 1) { const a = rnd(2, 8), b = a + rnd(1, 4) * 2, h = rnd(2, 6) * 2; return { text: "윗변 " + a + " cm, 아랫변 " + b + " cm, 높이 " + h + " cm인 사다리꼴의 넓이는?", input: true, unit: "cm²", answer: (a + b) * h / 2, explain: "(윗변 + 아랫변) × 높이 ÷ 2 = (" + a + " + " + b + ") × " + h + " ÷ 2 = " + (a + b) * h / 2 }; }
        const p = rnd(2, 9) * 2, q = rnd(3, 12); return { text: "두 대각선의 길이가 " + p + " cm, " + q + " cm인 마름모의 넓이는?", input: true, unit: "cm²", answer: p * q / 2, explain: "한 대각선 × 다른 대각선 ÷ 2 = " + p + " × " + q + " ÷ 2 = " + p * q / 2 };
      } },
      { id: "average", e: "📊", name: "평균과 가능성", desc: "평균 구하기, 가능성", hardDesc: "모르는 값 구하기", gen(_, hard) {
        const n = rnd(3, 5), avg = rnd(15, 40), xs = []; let sum = 0;
        for (let k = 0; k < n - 1; k++) { const x = avg + rnd(-4, 4); xs.push(x); sum += x; } xs.push(avg * n - sum);
        if (!hard) {
          if (rnd(0, 2)) return { text: "평균을 구해요: " + xs.join(", "), visual: big(xs.join(", ")), input: true, answer: avg, explain: "모두 더하면 " + avg * n + ", 개수 " + n + "로 나누면 " + avg + "이에요." };
          const B = [["주사위를 던질 때 7이 나올 가능성은?", "불가능하다"], ["동전을 던질 때 그림 면이 나올 가능성은?", "반반이다"], ["내일 아침 해가 동쪽에서 뜰 가능성은?", "확실하다"], ["빨간 공만 든 주머니에서 빨간 공을 꺼낼 가능성은?", "확실하다"], ["주사위를 던질 때 짝수가 나올 가능성은?", "반반이다"], ["빨간 공만 든 주머니에서 파란 공을 꺼낼 가능성은?", "불가능하다"]];
          const [q, a] = pick(B); return { text: q, choices: ["불가능하다", "반반이다", "확실하다"], answer: a, explain: "일이 일어날 가능성은 불가능하다 ~ 반반이다 ~ 확실하다로 말할 수 있어요." };
        }
        if (rnd(0, 1)) { const miss = xs[n - 1], shown = xs.slice(0, n - 1); return { text: "수 " + n + "개의 평균이 " + avg + "이에요. □에 알맞은 수는?", visual: big(shown.join(", ") + ", □"), input: true, answer: miss, explain: "전체 합은 " + avg + " × " + n + " = " + avg * n + ". 여기서 " + shown.join(" + ") + " = " + (avg * n - miss) + "을 빼면 " + miss + "이에요." }; }
        const k = rnd(4, 6), a = rnd(70, 90), tot = a * k;
        return { text: "시험 " + k + "번의 평균이 " + a + "점이에요. 점수의 합은 모두 몇 점일까요?", input: true, unit: "점", answer: tot, explain: "평균 × 횟수 = " + a + " × " + k + " = " + tot };
      } }
    ]
  });

  // ───────────── 6학년: 수학 연구소 ─────────────
  Quiz.add({
    id: "math6", e: "🔬", title: "수학 연구소", grade: "수학 6학년", levels: true,
    missions: [
      { id: "fracdiv", e: "🍰", name: "분수의 나눗셈", desc: "(분수)÷(자연수)", hardDesc: "(분수)÷(분수)", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const a = rnd(1, 9), b = rnd(2, 9); return fracQ(a + " ÷ " + b + "의 몫을 분수로 나타내면?", big(a + " ÷ " + b), a, b, [[b, a], [a, a + b], [1, b]], a + " ÷ " + b + " = " + frac(a, b, false)); }
          const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 5);
          return fracQ("계산해 보세요.", big(frac(n, d) + " ÷ " + k), n, d * k, [[n * k, d], [n, d + k], [n, k]], "÷ " + k + "는 × " + frac(1, k) + "과 같아요: " + frac(n, d * k, false));
        }
        const b = rnd(2, 8), d = rnd(2, 8), a = rnd(1, b - 1), c = rnd(1, d - 1);
        return fracQ("계산해 보세요.", big(frac(a, b) + " ÷ " + frac(c, d)), a * d, b * c, [[a * c, b * d], [b * c, a * d], [a + d, b + c]], "나누는 분수의 분모와 분자를 바꾸어 곱해요: " + frac(a, b) + " × " + frac(d, c, false) + " = " + frac(a * d, b * c, false));
      } },
      { id: "decdiv", e: "➗", name: "소수의 나눗셈", desc: "(소수)÷(자연수)", hardDesc: "(소수)÷(소수)", gen(_, hard) {
        if (!hard) { const k = rnd(2, 6), q = rnd(11, 49) / 10, n = fmt(q * k); return { text: "계산해 보세요.", visual: big(n + " ÷ " + k), choices: opts(fmt(q), [fmt(q * 10), fmt(q / 10), fmt(q + 1), fmt(q + 0.1)]), answer: fmt(q), explain: n + " ÷ " + k + " = " + fmt(q) }; }
        if (rnd(0, 1)) { const b = rnd(2, 9), q = rnd(2, 12); return calc(fmt(b * q / 10) + " ÷ " + fmt(b / 10), q, "둘 다 10배 하면 " + b * q + " ÷ " + b + " = " + q); }
        const b = pick([2, 4, 5, 8]), q = rnd(2, 9) * 5; return calc(fmt(b * q / 10) + " ÷ " + fmt(b / 10), q, "둘 다 10배 하면 " + b * q + " ÷ " + b + " = " + q);
      } },
      { id: "ratio", e: "⚖️", name: "비와 비율", desc: "비율, 백분율", hardDesc: "백분율 활용", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [7, 10], [9, 20], [3, 20], [1, 10]]), p = n * 100 / d; return { text: "비율 " + frac(n, d) + "을 백분율로 나타내면?", choices: opts(p + "%", [n + d + "%", (100 - p) + "%", p / 10 + "%", n * 10 + "%"]), answer: p + "%", explain: frac(n, d) + " × 100 = " + p + "%" }; }
          const a = rnd(1, 9); let b; do { b = rnd(2, 10); } while (b === a);
          return fracQ(a + " : " + b + "의 비율을 분수로 나타내면?", big(a + " : " + b), a, b, [[b, a], [a, a + b], [b, a + b]], "비율 = (비교하는 양) ÷ (기준량) = " + frac(a, b, false));
        }
        const t = rnd(0, 2);
        if (t === 0) { const whole = pick([20, 40, 60, 80, 200, 300, 500]), p = pick([10, 25, 50, 20, 75, 5]); return { text: whole + "의 " + p + "%는 얼마일까요?", input: true, answer: whole * p / 100, explain: whole + " × " + p + "/100 = " + whole * p / 100 }; }
        if (t === 1) { const price = rnd(2, 20) * 1000, p = pick([10, 20, 25, 30, 50]); return { text: won(price) + "원짜리 물건을 " + p + "% 할인하면 얼마일까요?", input: true, unit: "원", answer: price * (100 - p) / 100, explain: "할인 금액은 " + won(price * p / 100) + "원이에요. " + won(price) + " − " + won(price * p / 100) + " = " + won(price * (100 - p) / 100) + "원" }; }
        const tot = pick([20, 25, 50]), part = rnd(1, tot / 5 - 1) * 5; return { text: "전체 " + tot + "명 중 " + part + "명은 몇 %일까요?", input: true, unit: "%", answer: part * 100 / tot, explain: part + " ÷ " + tot + " × 100 = " + part * 100 / tot + "%" };
      } },
      { id: "proportion", e: "🟰", name: "비례식과 비례배분", desc: "비례식 완성하기", hardDesc: "비례배분, 간단한 자연수의 비", gen(_, hard) {
        if (!hard) { const a = rnd(1, 5), b = rnd(a + 1, 9), k = rnd(2, 6), front = rnd(0, 1) === 1; return { text: "비례식을 완성해요.", visual: big(front ? a + " : " + b + " = □ : " + b * k : a + " : " + b + " = " + a * k + " : □"), input: true, answer: front ? a * k : b * k, explain: "앞의 항과 뒤의 항에 같은 수 " + k + "를 곱해요." }; }
        if (rnd(0, 1)) { const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 5], [5, 6]]), total = (a + b) * rnd(2, 9), small = rnd(0, 1) === 1; return { text: "사탕 " + total + "개를 " + a + " : " + b + "로 나누면 " + (small ? "적은" : "많은") + " 쪽은 몇 개일까요?", input: true, unit: "개", answer: total * (small ? a : b) / (a + b), explain: total + " × " + frac(small ? a : b, a + b, false) + " = " + total * (small ? a : b) / (a + b) }; }
        const [a, b] = pick([[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [2, 5], [4, 5], [1, 4]]), k = rnd(2, 9), ans = a + " : " + b;
        return { text: a * k + " : " + b * k + "를 가장 간단한 자연수의 비로 나타내면?", visual: big(a * k + " : " + b * k), choices: opts(ans, [b + " : " + a, a + " : " + (b + 1), (a + 1) + " : " + (b + 1), a * 2 + " : " + (b * 2 + 1)]), answer: ans, explain: "두 수를 최대공약수 " + k + "로 나눠요." };
      } },
      { id: "circle", e: "⭕", name: "원과 직육면체", desc: "원주, 직육면체의 부피", hardDesc: "원의 넓이, 겉넓이", gen(_, hard) {
        if (!hard) {
          if (rnd(0, 1)) { const d = rnd(2, 15); return { text: "지름이 " + d + " cm인 원의 원주는? (원주율 3)", visual: polygon(0), input: true, unit: "cm", answer: d * 3, explain: "원주 = 지름 × 원주율 = " + d + " × 3 = " + d * 3 }; }
          const a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 8); return { text: "가로 " + a + " cm, 세로 " + b + " cm, 높이 " + c + " cm인 직육면체의 부피는?", input: true, unit: "cm³", answer: a * b * c, explain: "가로 × 세로 × 높이 = " + a + " × " + b + " × " + c + " = " + a * b * c };
        }
        const t = rnd(0, 2);
        if (t === 0) { const r = rnd(2, 10), A = fmt(r * r * 3.14); return { text: "반지름이 " + r + " cm인 원의 넓이는? (원주율 3.14)", visual: polygon(0), choices: opts(A + " cm²", [fmt(r * 2 * 3.14) + " cm²", fmt(r * 3.14) + " cm²", fmt(r * r * 3) + " cm²", fmt(r * r * 2 * 3.14) + " cm²"]), answer: A + " cm²", explain: "반지름 × 반지름 × 3.14 = " + r + " × " + r + " × 3.14 = " + A }; }
        if (t === 1) { const a = rnd(2, 7), b = rnd(2, 7), c = rnd(2, 7); return { text: "가로 " + a + " cm, 세로 " + b + " cm, 높이 " + c + " cm인 직육면체의 겉넓이는?", input: true, unit: "cm²", answer: 2 * (a * b + b * c + a * c), explain: "(" + a * b + " + " + b * c + " + " + a * c + ") × 2 = " + 2 * (a * b + b * c + a * c) }; }
        const s = rnd(2, 9); return { text: "한 모서리가 " + s + " cm인 정육면체의 겉넓이는?", input: true, unit: "cm²", answer: 6 * s * s, explain: "한 면의 넓이 " + s * s + " × 6 = " + 6 * s * s };
      } }
    ]
  });
})();
