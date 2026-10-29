// 🔢 수학 방 3개(1-2학년, 3-4학년, 5-6학년). 1년 전체 단원에서 골고루 나와요.
// 미션마다 gen()이 문제를 하나씩 만들어요. 숫자는 매번 새로 뽑아요.
"use strict";

(() => {
  const { ieyo, rnd, pick, opts, near, gcd, lcm, fmt, frac, objects, clock, pie, angle, polygon, rectFig, big } = Quiz.tools;
  const FRUITS = ["🍎", "🍓", "🍊", "🍌", "⭐", "🌸", "🐟", "🎈"];
  const KOR_UNITS = ["일", "십", "백", "천", "만", "십만", "백만", "천만", "억"];

  // ───────────── 1-2학년: 숫자 놀이방 ─────────────
  Quiz.add({
    id: "math12", e: "🧸", title: "숫자 놀이방", grade: "수학 1-2학년",
    missions: [
      { id: "count", e: "🔢", name: "수 세기", desc: "100까지, 세 자리 수", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const n = rnd(5, 20), e = pick(FRUITS); return { text: "모두 몇 개일까요?", visual: objects(e, n), choices: opts(n, near(n, [1, 2])), answer: String(n), explain: "하나씩 세어 보면 " + n + "개예요." }; }
        if (t === 1) { const a = rnd(1, 9), b = rnd(0, 9), n = a * 10 + b; return { text: "10개씩 묶음 " + a + "개와 낱개 " + b + "개는 얼마일까요?", choices: opts(n, [b * 10 + a, n + 10, n - 1, a + b].filter((x) => x !== n && x > 0)), answer: String(n), explain: "10이 " + a + "개면 " + a * 10 + ", 낱개 " + b + "개를 더하면 " + n + "이에요." }; }
        if (t === 2) { const n = rnd(11, 89), k = pick([[1, "1 큰"], [-1, "1 작은"], [10, "10 큰"], [-10, "10 작은"]]); const ans = n + k[0]; return { text: n + "보다 " + k[1] + " 수는?", input: true, answer: ans, explain: n + "보다 " + k[1] + " 수는 " + ans + "이에요." }; }
        const a = rnd(1, 9), b = rnd(0, 9), c = rnd(0, 9), n = a * 100 + b * 10 + c;
        return { text: "100이 " + a + "개, 10이 " + b + "개, 1이 " + c + "개인 수는?", choices: opts(n, [a * 100 + c * 10 + b, a * 10 + b + c, n + 100, n - 10].filter((x) => x !== n)), answer: String(n), explain: a * 100 + " + " + b * 10 + " + " + c + " = " + n };
      } },
      { id: "addsub", e: "➕", name: "덧셈과 뺄셈", desc: "받아올림·받아내림", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const a = rnd(2, 9), b = rnd(2, 9); return { text: a + " + " + b + " = ?", visual: big(a + " + " + b), input: true, answer: a + b, explain: a + "에서 " + b + "만큼 이어 세면 " + (a + b) + "이에요." }; }
        if (t === 1) { const a = rnd(11, 18), b = rnd(a - 9, 9); return { text: a + " − " + b + " = ?", visual: big(a + " − " + b), input: true, answer: a - b, explain: a + "에서 " + b + "를 빼면 " + (a - b) + "이에요." }; }
        if (t === 2) { const a = rnd(15, 68), b = rnd(10, 98 - a); return { text: a + " + " + b + " = ?", visual: big(a + " + " + b), input: true, answer: a + b, explain: "일의 자리끼리, 십의 자리끼리 더해요. 답은 " + (a + b) + "이에요." }; }
        const a = rnd(31, 95), b = rnd(12, a - 10); return { text: a + " − " + b + " = ?", visual: big(a + " − " + b), input: true, answer: a - b, explain: "일의 자리부터 빼요. 모자라면 십의 자리에서 10을 빌려 와요. 답은 " + (a - b) + "이에요." };
      } },
      { id: "clock", e: "🕐", name: "시계 보기", desc: "몇 시, 몇 시 몇 분", gen() {
        const h = rnd(1, 12), m = pick([0, 0, 30, 30, 5, 10, 15, 20, 25, 35, 40, 45, 50, 55]);
        const say = (hh, mm) => hh + "시" + (mm ? " " + mm + "분" : "");
        const wrong = [say(h % 12 + 1, m), say(h, (m + 30) % 60), say(m ? m / 5 : 12, h * 5 % 60)];
        return { text: "시계가 가리키는 시각은?", visual: clock(h, m), choices: opts(say(h, m), wrong), answer: say(h, m), explain: "짧은바늘(빨강)은 시, 긴바늘(파랑)은 분을 가리켜요. 긴바늘이 숫자 1을 가리키면 5분이에요." };
      } },
      { id: "shape", e: "🔺", name: "여러 가지 도형", desc: "도형 이름, 꼭짓점, 변", gen() {
        const S = [[0, "원", 0], [3, "삼각형", 3], [4, "사각형", 4], [5, "오각형", 5], [6, "육각형", 6]];
        const [sides, name, n] = pick(S);
        if (rnd(0, 1) === 0) return { text: "이 도형의 이름은?", visual: polygon(sides), choices: opts(name, S.map((s) => s[1]).filter((x) => x !== name)), answer: name, explain: sides ? "변이 " + n + "개인 도형은 " + name + "이에요." : "둥근 모양은 원이에요. 원은 곧은 선(변)이 없어요." };
        const what = pick(["꼭짓점", "변"]);
        return { text: name + "의 " + what + "은 몇 개일까요?", visual: polygon(sides), choices: opts(n, [n + 1, n - 1, n + 2].filter((x) => x >= 0)), answer: String(n), explain: sides ? name + "은 변이 " + n + "개, 꼭짓점이 " + n + "개예요." : "원에는 꼭짓점도 변도 없어요." };
      } },
      { id: "times", e: "✖️", name: "곱셈구구", desc: "2단 ~ 9단", gen() {
        const a = rnd(2, 9), b = rnd(1, 9);
        if (a * b <= 20 && rnd(0, 1)) { const e = pick(FRUITS); return { text: e + "가 " + a + "개씩 " + b + "묶음 있어요. 모두 몇 개일까요?", visual: objects(e, a * b), input: true, answer: a * b, explain: a + " × " + b + " = " + a * b }; }
        return { text: a + " × " + b + " = ?", visual: big(a + " × " + b), input: true, answer: a * b, explain: a + "단: " + a + " × " + b + " = " + a * b };
      } }
    ]
  });

  // ───────────── 3-4학년: 측정 공방 ─────────────
  Quiz.add({
    id: "math34", e: "⚖️", title: "측정 공방", grade: "수학 3-4학년",
    missions: [
      { id: "muldiv", e: "✖️", name: "곱셈과 나눗셈", desc: "몫과 나머지까지", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const a = rnd(12, 98), b = rnd(3, 9); return { text: a + " × " + b + " = ?", visual: big(a + " × " + b), input: true, answer: a * b, explain: a + " × " + b + " = " + a * b }; }
        if (t === 1) { const b = rnd(2, 9), q = rnd(2, 12); return { text: b * q + " ÷ " + b + " = ?", visual: big(b * q + " ÷ " + b), input: true, answer: q, explain: b + " × " + q + " = " + b * q + " 이니까 몫은 " + q + "이에요." }; }
        if (t === 2) { const a = rnd(12, 48), b = rnd(11, 35); return { text: a + " × " + b + " = ?", visual: big(a + " × " + b), input: true, answer: a * b, explain: a + " × " + b + " = " + a * b }; }
        const b = rnd(3, 9), q = rnd(2, 9), r = rnd(1, b - 1), n = b * q + r;
        const ans = "몫 " + q + ", 나머지 " + r;
        return { text: n + " ÷ " + b + "의 몫과 나머지는?", visual: big(n + " ÷ " + b), choices: opts(ans, ["몫 " + (q + 1) + ", 나머지 " + r, "몫 " + q + ", 나머지 " + (r + 1), "몫 " + (q - 1) + ", 나머지 " + (r + b)]), answer: ans, explain: b + " × " + q + " = " + b * q + ", " + n + " − " + b * q + " = " + r + " (나머지는 " + b + "보다 작아야 해요)" };
      } },
      { id: "fraction", e: "🍕", name: "분수와 소수", desc: "분수 읽기, 크기, 덧셈", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const d = rnd(2, 8), n = rnd(1, d - 1); return { text: "색칠한 부분을 분수로 나타내면?", visual: pie(n, d), choices: opts(frac(n, d), [frac(d - n, d), frac(n, d + 1), frac(d, n, false)].filter((x) => x !== frac(n, d))), answer: frac(n, d), explain: "전체를 똑같이 " + d + "조각으로 나눈 것 중 " + n + "조각이에요." }; }
        if (t === 1) { const d = rnd(4, 12), a = rnd(1, d - 2), b = rnd(1, d - 1 - a); return { text: "계산해 보세요.", visual: big(frac(a, d) + " + " + frac(b, d)), choices: opts(frac(a + b, d), [frac(a + b, d + d), frac(a + b + 1, d), frac(Math.abs(a - b) || 1, d)]), answer: frac(a + b, d), explain: "분모가 같으면 분자끼리 더해요: " + a + " + " + b + " = " + (a + b) }; }
        if (t === 2) { const n = rnd(2, 39); return { text: "0.1이 " + n + "개인 수는?", choices: opts(fmt(n / 10), [fmt(n / 100), String(n), fmt(n / 10 + 1)]), answer: fmt(n / 10), explain: "0.1이 10개면 1이에요. 0.1이 " + n + "개면 " + fmt(n / 10) + "이에요." }; }
        const a = rnd(2, 5), b = rnd(a + 1, 9);
        return { text: "더 큰 분수는?", choices: [frac(1, a), frac(1, b)], answer: frac(1, a), explain: "분자가 1이면 분모가 작을수록 한 조각이 커요. 그래서 " + a + "분의 1이 더 커요." };
      } },
      { id: "units", e: "📏", name: "길이·들이·무게·시간", desc: "단위 바꾸기", gen() {
        const U = [
          () => { const a = rnd(1, 15), b = rnd(1, 9); return { text: a + " cm " + b + " mm는 몇 mm일까요?", ans: a * 10 + b, unit: "mm", ex: "1 cm = 10 mm" }; },
          () => { const a = rnd(1, 9), b = rnd(1, 9) * 100 + pick([0, 50]); return { text: a + " km " + b + " m는 몇 m일까요?", ans: a * 1000 + b, unit: "m", ex: "1 km = 1000 m" }; },
          () => { const a = rnd(1, 9), b = rnd(1, 9) * 100; return { text: a + " L " + b + " mL는 몇 mL일까요?", ans: a * 1000 + b, unit: "mL", ex: "1 L = 1000 mL" }; },
          () => { const a = rnd(1, 9), b = rnd(1, 19) * 50; return { text: a + " kg " + b + " g은 몇 g일까요?", ans: a * 1000 + b, unit: "g", ex: "1 kg = 1000 g" }; },
          () => { const a = rnd(1, 5), b = rnd(5, 55); return { text: a + "분 " + b + "초는 몇 초일까요?", ans: a * 60 + b, unit: "초", ex: "1분 = 60초" }; }
        ];
        const u = pick(U)();
        return { text: u.text, input: true, unit: u.unit, answer: u.ans, explain: u.ex + " 이니까 " + u.ans + " " + u.unit + "예요." };
      } },
      { id: "angle", e: "📐", name: "각도와 도형", desc: "예각·직각·둔각, 삼각형", gen() {
        const t = rnd(0, 2);
        if (t === 0) { const d = pick([30, 45, 60, 75, 90, 90, 110, 120, 135, 150]); const name = d < 90 ? "예각" : d === 90 ? "직각" : "둔각"; return { text: "이 각은 무엇일까요?", visual: angle(d), choices: ["예각", "직각", "둔각"], answer: name, explain: "직각(90°)보다 작으면 예각, 90°면 직각, 90°보다 크면 둔각이에요." }; }
        if (t === 1) { const a = rnd(3, 9) * 10, b = rnd(3, 12) * 5; return { text: "삼각형의 두 각이 " + a + "°, " + b + "°일 때 나머지 한 각은 몇 도일까요?", input: true, unit: "°", answer: 180 - a - b, explain: "삼각형 세 각의 합은 180°예요. 180 − " + a + " − " + b + " = " + (180 - a - b) }; }
        const B = [["세 변의 길이가 모두 같은 삼각형은?", "정삼각형"], ["두 변의 길이가 같은 삼각형은?", "이등변삼각형"], ["한 각이 직각인 삼각형은?", "직각삼각형"], ["세 각이 모두 예각인 삼각형은?", "예각삼각형"], ["한 각이 둔각인 삼각형은?", "둔각삼각형"],
          ["마주 보는 두 쌍의 변이 서로 평행한 사각형은?", "평행사변형"], ["네 변의 길이가 모두 같은 사각형은?", "마름모"], ["네 각이 모두 직각인 사각형은?", "직사각형"]];
        const [q, a] = pick(B);
        return { text: q, choices: opts(a, B.map((x) => x[1]).filter((x) => x !== a)), answer: a, explain: q.replace("은?", "은") + " " + a + ieyo(a) + "." };
      } },
      { id: "bignum", e: "🔢", name: "큰 수", desc: "만, 억, 자릿값", gen() {
        const t = rnd(0, 2);
        if (t === 0) { const a = rnd(1, 9), b = rnd(0, 9), n = a * 10000 + b * 1000; return { text: "10000이 " + a + "개, 1000이 " + b + "개인 수는?", choices: opts(String(n), [String(a * 1000 + b * 100), String(a * 100000 + b * 10000), String(n + 100)]), answer: String(n), explain: "10000이 " + a + "개면 " + a + "만, 1000이 " + b + "개면 " + b + "천. 합쳐서 " + n + "이에요." }; }
        if (t === 1) {
          // 묻는 숫자가 한 번만 나오게 해요(같은 숫자가 두 번 있으면 답이 둘이 돼요)
          let digits, pos, d;
          do { digits = String(rnd(1000000, 9999999)); pos = rnd(0, 6); d = digits[pos]; } while (digits.indexOf(d) !== digits.lastIndexOf(d));
          const place = KOR_UNITS[digits.length - 1 - pos];
          return { text: Number(digits).toLocaleString("ko-KR") + "에서 숫자 " + d + "는 어느 자리일까요?", visual: big(Number(digits).toLocaleString("ko-KR")), choices: opts(place + "의 자리", KOR_UNITS.slice(0, 7).filter((u) => u !== place).map((u) => u + "의 자리")), answer: place + "의 자리", explain: "오른쪽부터 일, 십, 백, 천, 만, 십만, 백만의 자리예요." };
        }
        const B = [["1억은 1000만이 몇 개인 수일까요?", 10], ["1만은 1000이 몇 개인 수일까요?", 10], ["1억은 1만이 몇 개인 수일까요?", 10000], ["1조는 1000억이 몇 개인 수일까요?", 10]];
        const [q, a] = pick(B);
        return { text: q, input: true, answer: a, unit: "개", explain: "답은 " + a + "개예요." };
      } }
    ]
  });

  // ───────────── 5-6학년: 수학 탐정 사무소 ─────────────
  Quiz.add({
    id: "math56", e: "🕵️", title: "수학 탐정 사무소", grade: "수학 5-6학년",
    missions: [
      { id: "factor", e: "🔍", name: "약수와 배수", desc: "최대공약수, 최소공배수", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const g = rnd(2, 6), a = g * rnd(2, 5); let b = g * rnd(2, 6); if (b === a) b += g; const G = gcd(a, b); return { text: a + "와 " + b + "의 최대공약수는?", input: true, answer: G, explain: "두 수를 모두 나누어떨어지게 하는 가장 큰 수는 " + G + "이에요." }; }
        if (t === 1) { const a = rnd(2, 9); let b = rnd(2, 12); if (b === a) b++; const L = lcm(a, b); return { text: a + "와 " + b + "의 최소공배수는?", input: true, answer: L, explain: "두 수의 공통인 배수 중 가장 작은 수는 " + L + "이에요." }; }
        if (t === 2) { const n = pick([12, 18, 20, 24, 30, 36]); const divs = []; for (let k = 1; k <= n; k++) if (n % k === 0) divs.push(k); const non = []; for (let k = 2; k < n; k++) if (n % k) non.push(k); const w = pick(non); return { text: n + "의 약수가 아닌 것은?", choices: opts(String(w), divs.filter((d) => d > 1 && d < n).map(String), 4), answer: String(w), explain: n + "의 약수: " + divs.join(", ") }; }
        const k = rnd(3, 9), m = k * rnd(3, 9); return { text: k + "의 배수는?", choices: opts(String(m), [m + 1, m - 1, m + 2].map(String), 4), answer: String(m), explain: k + " × " + m / k + " = " + m + " 이니까 " + m + "은 " + k + "의 배수예요." };
      } },
      { id: "fraccalc", e: "🍰", name: "분수의 계산", desc: "약분, 통분, 곱셈, 나눗셈", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 4); const g = gcd(n, d); return { text: frac(n * k, d * k, false) + "을 기약분수로 나타내면?", visual: big(frac(n * k, d * k, false)), choices: opts(frac(n / g, d / g), [frac(n * k / 2 | 0 || 1, d * k / 2 | 0 || 2, false), frac(n, d * k, false), frac(n * k, d, false)]), answer: frac(n / g, d / g), explain: "분모와 분자를 최대공약수로 나눠요." }; }
        if (t === 1) { const [a, b] = pick([[2, 3], [2, 5], [3, 4], [4, 6], [3, 5], [2, 7], [4, 5], [6, 8]]); const N = b + a, D = a * b, g = gcd(N, D); return { text: "계산해 보세요.", visual: big(frac(1, a) + " + " + frac(1, b)), choices: opts(frac(N / g, D / g), [frac(2, a + b), frac(1, a + b), frac(2, D)]), answer: frac(N / g, D / g), explain: "통분해서 더해요: " + frac(b, D, false) + " + " + frac(a, D, false) + " = " + frac(N, D, false) }; }
        if (t === 2) { const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 5); const N = n * k, g = gcd(N, d); return { text: "계산해 보세요.", visual: big(frac(n, d) + " × " + k), choices: opts(frac(N / g, d / g), [frac(n, d * k, false), frac(n + k, d), frac(N, d * k, false)]), answer: frac(N / g, d / g), explain: "분자에 자연수를 곱해요: " + n + " × " + k + " = " + N }; }
        const d = rnd(3, 9), k = rnd(2, 4), n = k * rnd(1, Math.floor((d - 1) / k) || 1); const N = n / k, g = gcd(N, d);
        return { text: "계산해 보세요.", visual: big(frac(n, d) + " ÷ " + k), choices: opts(frac(N / g, d / g), [frac(n * k, d), frac(n, d * k + 1, false), frac(n, k, false)]), answer: frac(N / g, d / g), explain: "분자를 자연수로 나눌 수 있으면 분자만 나눠요: " + n + " ÷ " + k + " = " + N };
      } },
      { id: "ratio", e: "⚖️", name: "비와 비율", desc: "백분율, 비례식, 비례배분", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [7, 10], [9, 20], [3, 20], [1, 10]]); const p = n * 100 / d; return { text: "비율 " + frac(n, d) + "을 백분율로 나타내면?", choices: opts(p + "%", [n + d + "%", (100 - p) + "%", p / 10 + "%"]), answer: p + "%", explain: frac(n, d) + " × 100 = " + p + "%" }; }
        if (t === 1) { const whole = pick([20, 40, 60, 80, 200, 300]), p = pick([10, 25, 50, 20, 75]); return { text: whole + "의 " + p + "%는 얼마일까요?", input: true, answer: whole * p / 100, explain: whole + " × " + p + "/100 = " + whole * p / 100 }; }
        if (t === 2) { const a = rnd(1, 5), b = rnd(a + 1, 9), k = rnd(2, 6); return { text: "비례식을 완성해요: " + a + " : " + b + " = " + a * k + " : □", visual: big(a + " : " + b + " = " + a * k + " : □"), input: true, answer: b * k, explain: "앞의 항에 " + k + "를 곱했으니 뒤의 항에도 " + k + "를 곱해요: " + b + " × " + k + " = " + b * k }; }
        const a = rnd(1, 4), b = rnd(a + 1, 6), total = (a + b) * rnd(2, 6);
        return { text: "사탕 " + total + "개를 " + a + " : " + b + "로 나누면 적은 쪽은 몇 개일까요?", input: true, unit: "개", answer: total * a / (a + b), explain: total + " × " + frac(a, a + b, false) + " = " + total * a / (a + b) };
      } },
      { id: "area", e: "📦", name: "넓이와 부피", desc: "도형 넓이, 직육면체, 원", gen() {
        const t = rnd(0, 4);
        if (t === 0) { const w = rnd(3, 15), h = rnd(2, 12); return { text: "직사각형의 넓이는 몇 cm²일까요?", visual: rectFig(w + " cm", h + " cm"), input: true, unit: "cm²", answer: w * h, explain: "가로 × 세로 = " + w + " × " + h + " = " + w * h }; }
        if (t === 1) { const b = rnd(2, 10) * 2, h = rnd(3, 12); return { text: "밑변이 " + b + " cm, 높이가 " + h + " cm인 삼각형의 넓이는?", input: true, unit: "cm²", answer: b * h / 2, explain: "밑변 × 높이 ÷ 2 = " + b + " × " + h + " ÷ 2 = " + b * h / 2 }; }
        if (t === 2) { const b = rnd(3, 14), h = rnd(3, 10); return { text: "밑변이 " + b + " cm, 높이가 " + h + " cm인 평행사변형의 넓이는?", input: true, unit: "cm²", answer: b * h, explain: "밑변 × 높이 = " + b + " × " + h + " = " + b * h }; }
        if (t === 3) { const a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 8); return { text: "가로 " + a + " cm, 세로 " + b + " cm, 높이 " + c + " cm인 직육면체의 부피는?", input: true, unit: "cm³", answer: a * b * c, explain: "가로 × 세로 × 높이 = " + a + " × " + b + " × " + c + " = " + a * b * c }; }
        const r = rnd(1, 10), A = fmt(r * r * 3.14);
        return { text: "반지름이 " + r + " cm인 원의 넓이는? (원주율 3.14)", visual: polygon(0), choices: opts(A + " cm²", [fmt(r * 2 * 3.14) + " cm²", fmt(r * 3.14) + " cm²", fmt(r * r * 3) + " cm²"]), answer: A + " cm²", explain: "반지름 × 반지름 × 3.14 = " + r + " × " + r + " × 3.14 = " + A };
      } },
      { id: "average", e: "📊", name: "평균·가능성·소수", desc: "평균, 가능성, 소수 계산", gen() {
        const t = rnd(0, 3);
        if (t === 0) { const n = rnd(3, 5), avg = rnd(15, 40); const xs = []; let sum = 0; for (let k = 0; k < n - 1; k++) { const x = avg + rnd(-4, 4); xs.push(x); sum += x; } xs.push(avg * n - sum); return { text: "평균을 구해요: " + xs.join(", "), visual: big(xs.join(", ")), input: true, answer: avg, explain: "모두 더하면 " + avg * n + ", 개수 " + n + "로 나누면 " + avg + "이에요." }; }
        if (t === 1) { const B = [["주사위를 던질 때 7이 나올 가능성은?", "불가능하다"], ["동전을 던질 때 그림 면이 나올 가능성은?", "반반이다"], ["내일 아침 해가 동쪽에서 뜰 가능성은?", "확실하다"], ["빨간 공만 든 주머니에서 빨간 공을 꺼낼 가능성은?", "확실하다"], ["주사위를 던질 때 짝수가 나올 가능성은?", "반반이다"], ["12월에 수박이 눈처럼 하늘에서 내릴 가능성은?", "불가능하다"]]; const [q, a] = pick(B); return { text: q, choices: ["불가능하다", "반반이다", "확실하다"], answer: a, explain: "일이 일어날 가능성은 불가능하다 ~ 반반이다 ~ 확실하다로 말할 수 있어요." }; }
        if (t === 2) { const a = rnd(2, 9), k = rnd(2, 9); const ans = fmt(a / 10 * k); return { text: "계산해 보세요.", visual: big("0." + a + " × " + k), choices: opts(ans, [fmt(a * k), fmt(a * k / 100), fmt(a / 10 + k)]), answer: ans, explain: a + " × " + k + " = " + a * k + " 이니까 0." + a + " × " + k + " = " + ans }; }
        const k = rnd(2, 5), q = rnd(11, 49) / 10, n = fmt(q * k);
        return { text: "계산해 보세요.", visual: big(n + " ÷ " + k), choices: opts(fmt(q), [fmt(q * 10), fmt(q / 10), fmt(q + 1)]), answer: fmt(q), explain: n + " ÷ " + k + " = " + fmt(q) };
      } }
    ]
  });
})();
