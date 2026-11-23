// 율이 꿀벌 수학 - 문제 만들기
// 단원마다 문제를 그때그때 새로 만들어요. 단계는 1(기본) 2(응용) 3(심화)예요.
// 오답 보기는 아이들이 실제로 자주 하는 실수로 만들고, 고르면 어떤 실수인지 알려 줘요.
//
// 글자 표기 약속 (game.js가 예쁘게 그려 줘요)
//   [3/4]     분수          [2 1/3]   대분수
//   x²  y³    지수(위 첨자)  √3        제곱근
//   −         빼기·음수 (키보드 - 대신 수학 기호를 써요)
//
// tools/yulmath/test_problems.js 가 모든 단원을 수천 번씩 만들어 정답·오답을 검산해요.
(function (root) {
  "use strict";

  // ───────── 기본 도구 ─────────
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const M = "−";
  const N = (n) => (n < 0 ? M + Math.abs(n) : String(n));               // −3
  const C = (n) => (n < 0 ? M : "") + Math.abs(n).toLocaleString("en-US"); // 12,345
  const P = (n) => (n < 0 ? "(" + M + Math.abs(n) + ")" : String(n));    // 음수만 괄호
  const PS = (n) => (n < 0 ? "(" + M + Math.abs(n) + ")" : "(+" + n + ")"); // 부호 붙인 정수
  const RETRY = () => { throw new Error("retry"); };
  // 숫자 뒤에 붙는 조사: josa(30, "과", "와") → "30과"
  const batchim = (n) => { n = Math.abs(n); if (n === 0) return true; const d = n % 10; if (d === 0) return true; return [1, 3, 6, 7, 8].includes(d); };
  const josa = (n, withB, noB) => String(n) + (batchim(n) ? withB : noB);
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (n) => String(n).split("").map((d) => SUP[+d]).join("");

  // 분수 (항상 기약분수로 저장)
  class F {
    constructor(n, d = 1) {
      if (d === 0) throw new Error("zero");
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g; this.d = d / g;
    }
    static of(x) { return x instanceof F ? x : new F(x, 1); }
    add(o) { o = F.of(o); return new F(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = F.of(o); return new F(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = F.of(o); return new F(this.n * o.n, this.d * o.d); }
    div(o) { o = F.of(o); return new F(this.n * o.d, this.d * o.n); }
    eq(o) { o = F.of(o); return this.n === o.n && this.d === o.d; }
    lt(o) { o = F.of(o); return this.n * o.d < o.n * this.d; }
    isInt() { return this.d === 1; }
    val() { return this.n / this.d; }
  }

  // 분수 글자: style "mixed"(대분수로) | "improper"(가분수 그대로)
  function fr(f, style = "mixed") {
    f = F.of(f);
    const s = f.n < 0 ? M : "";
    const n = Math.abs(f.n), d = f.d;
    if (d === 1) return s + n;
    if (style === "mixed" && n > d) return s + "[" + Math.floor(n / d) + " " + (n % d) + "/" + d + "]";
    return s + "[" + n + "/" + d + "]";
  }
  const raw = (n, d) => "[" + n + "/" + d + "]";           // 약분하지 않은 분수 글자
  const mixed = (w, n, d) => "[" + w + " " + n + "/" + d + "]";

  // 소수: 정수 v 를 소수점 아래 p자리로 (끝의 0은 지워요)
  function dec(v, p) {
    const s = v < 0 ? M : "";
    let t = String(Math.abs(v)).padStart(p + 1, "0");
    if (p > 0) t = t.slice(0, t.length - p) + "." + t.slice(t.length - p);
    if (t.includes(".")) t = t.replace(/0+$/, "").replace(/\.$/, "");
    return s + t;
  }

  // 큰 수를 '3억 9000만' 처럼
  function kor(n) {
    const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
    const out = [];
    if (eok) out.push(eok + "억");
    if (man) out.push(man + "만");
    if (rest) out.push(String(rest));
    return out.join(" ") || "0";
  }

  // 항 여러 개를 '2x²−3xy+5' 처럼. 항 = { c: 계수(정수 또는 F), s: 문자 부분 }
  function terms(list) {
    let out = "";
    for (const t of list) {
      const c = F.of(t.c);
      if (c.n === 0) continue;
      const negative = c.n < 0;
      const a = new F(Math.abs(c.n), c.d);
      let body;
      if (t.s && a.n === 1 && a.d === 1) body = t.s;
      else body = (a.d === 1 ? String(a.n) : "[" + a.n + "/" + a.d + "]") + (t.s || "");
      if (!out) out = (negative ? M : "") + body;
      else out += (negative ? M : "+") + body;
    }
    return out || "0";
  }
  const vp = (v, e) => (e === 0 ? "" : e === 1 ? v : v + sup(e));
  const lin = (a, b, v = "x") => terms([{ c: a, s: v }, { c: b, s: "" }]);       // ax+b
  const mono = (c, ex, ey = 0) => terms([{ c, s: vp("x", ex) + vp("y", ey) }]);

  // 보기 하나: { t: 글자, v: 값(같은 값 겹침 확인용), m: 실수 설명 }
  const A = (t, v, m) => ({ t, v, m });
  const keyOf = (o) => (o.v === undefined ? "t:" + o.t : o.v instanceof F ? "f:" + o.v.n + "/" + o.v.d : "v:" + (typeof o.v === "number" ? Math.round(o.v * 1e9) / 1e9 : o.v));

  // 문제 완성: 오답 후보 중 정답과 다르고 서로 다른 것 2개를 골라요
  const state = { elem: false }; // 초등 단원이면 정답이 양수일 때 0 이하 오답을 빼요
  const isNum = (v) => v instanceof F || typeof v === "number";
  const sign = (v) => (v instanceof F ? Math.sign(v.n) : Math.sign(v));
  function mk(o) {
    const seenT = new Set([o.a.t]);
    const seenK = new Set([keyOf(o.a)]);
    const w = [];
    for (const c of o.w) {
      if (!c || c.t == null) continue;
      if (/NaN|undefined|Infinity/.test(c.t)) continue;
      if (state.elem && isNum(o.a.v) && isNum(c.v) && sign(o.a.v) > 0 && sign(c.v) <= 0) continue;
      const k = keyOf(c);
      if (seenT.has(c.t) || seenK.has(k)) continue;
      seenT.add(c.t); seenK.add(k);
      w.push(c);
      if (w.length === 2) break;
    }
    if (w.length < 2) RETRY();
    return { q: o.q, a: o.a.t, w: w.map((x) => ({ t: x.t, m: x.m || "" })), tip: o.tip || "", chk: o.chk || null };
  }

  // 정수 답의 '계산 실수' 오답 (일의 자리는 정답과 같게 해서 끝자리만 보고 못 고르게)
  function near(n, unitText = "", fmt = C) {
    const out = [];
    for (const d of [10, -10, 100, -100, 1000]) {
      const v = n + d;
      if (v > 0 && Math.abs(d) < Math.max(n, 20)) out.push(A(fmt(v) + unitText, v, "받아올림·받아내림 실수"));
    }
    return shuffle(out);
  }
  const ok = (cond) => { if (!cond) RETRY(); };

  // ───────── 초등 4학년 ─────────
  const U = {};

  U.e4_big = (t) => {
    if (t === 1) {
      const a = R(12, 98), b = R(1, 9), n = a * 10000 + b * 1000;
      return mk({
        q: `10000이 ${a}개, 1000이 ${b}개인 수는?`,
        a: A(C(n), n),
        w: [A(C(a * 1000 + b * 100), a * 1000 + b * 100, "자릿값을 한 칸씩 작게 셌어요"),
            A(C(a * 100000 + b * 10000), a * 100000 + b * 10000, "자릿값을 한 칸씩 크게 셌어요"),
            A(C(a * 10000 + b * 100), a * 10000 + b * 100, "1000이 몇 개인지를 잘못 셌어요")],
        tip: `10000이 ${a}개면 ${C(a * 10000)}, 1000이 ${b}개면 ${C(b * 1000)}`,
        chk: { js: String(n) },
      });
    }
    if (t === 2) {
      const k = R(4, 9), d = R(2, 9);
      const digits = [];
      for (let i = 0; i < 10; i++) {
        if (i === k) digits.push(d);
        else { let x; do x = R(0, 9); while (x === d || (i === 9 && x === 0)); digits.push(x); }
      }
      const num = digits.reduceRight((acc, x) => acc * 10 + x, 0);
      const val = d * 10 ** k;
      return mk({
        q: `${C(num)}에서 숫자 ${d}에 해당하는 값은?`,
        a: A(C(val), val),
        w: [A(C(val / 10), val / 10, "자리를 한 칸 오른쪽으로 봤어요"),
            A(C(val * 10), val * 10, "자리를 한 칸 왼쪽으로 봤어요"),
            A(C(val / 100), val / 100, "자리를 잘못 셌어요")],
        tip: "오른쪽부터 네 자리씩 끊으면 일·만·억 자리가 보여요",
        chk: { js: String(val) },
      });
    }
    const S = R(1, 9) * 1e8 + R(1, 9) * 1e7, step = pick([1e7, 1e6, 1e8]), c = R(3, 5);
    const ans = S + step * c;
    return mk({
      q: `${kor(S)}에서 ${kor(step)}씩 ${c}번 뛰어 센 수는?`,
      a: A(kor(ans), ans),
      w: [A(kor(S + step * (c - 1)), S + step * (c - 1), "한 번 덜 뛰어 셌어요"),
          A(kor(S + (step / 10) * c), S + (step / 10) * c, "뛰어 세는 자리를 한 칸 작게 봤어요"),
          A(kor(S + step * 10 * c), S + step * 10 * c, "뛰어 세는 자리를 한 칸 크게 봤어요")],
      tip: `${kor(step)}씩 ${c}번이면 ${kor(step * c)}가 커져요`,
    });
  };

  U.e4_mul = (t) => {
    if (t === 1) {
      const a = R(101, 989), b = R(2, 9) * 10, ans = a * b;
      return mk({
        q: `${a} × ${b} = ?`, a: A(C(ans), ans),
        w: [A(C(a * b / 10), a * b / 10, "끝의 0을 빠뜨렸어요"), A(C(ans * 10), ans * 10, "0을 하나 더 붙였어요"), ...near(ans)],
        tip: `${a} × ${b / 10}을 먼저 하고 0을 하나 붙여요`, chk: { js: `${a}*${b}` },
      });
    }
    const a = R(102, 987); let b; do b = R(12, 98); while (b % 10 === 0);
    const tt = Math.floor(b / 10), o = b % 10, ans = a * b;
    const q = t === 2 ? `${a} × ${b} = ?` : `한 상자에 ${a}개씩 ${b}상자에 담긴 구슬은 모두 몇 개?`;
    return mk({
      q, a: A(C(ans) + (t === 3 ? "개" : ""), ans),
      w: [A(C(a * tt + a * o) + (t === 3 ? "개" : ""), a * tt + a * o, "십의 자리 곱을 한 칸 왼쪽으로 옮기지 않았어요"),
          ...near(ans, t === 3 ? "개" : ""),
          A(C(a * tt * 100 + a * o) + (t === 3 ? "개" : ""), a * tt * 100 + a * o, "십의 자리 곱을 두 칸 옮겼어요")],
      tip: `${a}×${o} = ${C(a * o)}, ${a}×${tt * 10} = ${C(a * tt * 10)} → 더하면 ${C(ans)}`,
      chk: { js: `${a}*${b}` },
    });
  };

  U.e4_div = (t) => {
    if (t === 1) {
      const q = R(2, 9), d = R(2, 9) * 10, n = q * d;
      return mk({
        q: `${n} ÷ ${d} = ?`, a: A(String(q), q),
        w: [A(String(q * 10), q * 10, "0의 개수를 잘못 맞췄어요"), A(String(q + 1), q + 1, "몫을 하나 크게 어림했어요"), A(String(q - 1), q - 1, "몫을 하나 작게 어림했어요")],
        tip: `${d} × ${q} = ${n} 으로 검산해요`, chk: { js: `${n}/${d}` },
      });
    }
    if (t === 2) {
      const d = R(12, 48), q = R(12, 39), n = d * q; ok(n <= 999);
      const rev = Number(String(q).split("").reverse().join(""));
      return mk({
        q: `${n} ÷ ${d} = ?`, a: A(String(q), q),
        w: [A(String(q + 1), q + 1, "몫을 하나 크게 어림했어요"), A(String(q - 1), q - 1, "몫을 하나 작게 어림했어요"), A(String(rev), rev, "몫의 자리를 바꿔 썼어요"), A(String(q + 10), q + 10, "십의 자리 몫 실수")],
        tip: `${d} × ${q} = ${n}`, chk: { js: `${n}/${d}` },
      });
    }
    const d = R(13, 39), q = R(11, 29), r = R(1, d - 1), n = d * q + r; ok(n <= 999);
    return mk({
      q: `${n} ÷ ${d} 의 몫과 나머지는?`,
      a: A(`몫 ${q} 나머지 ${r}`),
      w: [A(`몫 ${q - 1} 나머지 ${r + d}`, undefined, "나머지가 나누는 수보다 크면 몫을 더 키워요"),
          A(`몫 ${q} 나머지 ${d - r}`, undefined, "나머지를 거꾸로 셌어요"),
          A(`몫 ${q + 1} 나머지 ${r}`, undefined, "몫을 하나 크게 어림했어요")],
      tip: `${d} × ${q} + ${r} = ${n} 으로 검산해요`,
    });
  };

  U.e4_angle = (t) => {
    if (t === 1) {
      const plus = Math.random() < 0.5;
      let a = R(35, 145), b = R(15, 85); if (!plus && a <= b) [a, b] = [b + 20, a];
      const ans = plus ? a + b : a - b;
      return mk({
        q: `${a}° ${plus ? "+" : M} ${b}° = ?`, a: A(ans + "°", ans),
        w: near(ans, "°", String).concat([A((ans + 1) + "°", ans + 1, "계산 실수")]),
        tip: "자연수 덧셈·뺄셈처럼 계산하고 ° 를 붙여요", chk: { js: `${a}${plus ? "+" : "-"}${b}` },
      });
    }
    if (t === 2) {
      const a = R(25, 95), b = R(20, 150 - a), c = 180 - a - b;
      return mk({
        q: `삼각형의 두 각이 ${a}°, ${b}°일 때 나머지 한 각은?`, a: A(c + "°", c),
        w: [A((360 - a - b) + "°", 360 - a - b, "삼각형 세 각의 합은 360°가 아니라 180°예요"),
            A((180 - a) + "°", 180 - a, "한 각만 뺐어요"), A((180 - b) + "°", 180 - b, "한 각만 뺐어요")],
        tip: `180° − ${a}° − ${b}° = ${c}°`, chk: { js: `180-${a}-${b}` },
      });
    }
    const a = R(60, 130), b = R(50, 130), c = R(50, 130), s = a + b + c; ok(s > 220 && s < 320);
    const d = 360 - s;
    return mk({
      q: `사각형의 세 각이 ${a}°, ${b}°, ${c}°일 때 나머지 한 각은?`, a: A(d + "°", d),
      w: [A((360 - a - b) + "°", 360 - a - b, "각 하나를 빠뜨리고 뺐어요"),
          A((d + 10) + "°", d + 10, "계산 실수"), A((d - 10) + "°", d - 10, "계산 실수"),
          A((540 - s) + "°", 540 - s, "사각형 네 각의 합은 360°예요")],
      tip: `360° − ${a}° − ${b}° − ${c}° = ${d}°`, chk: { js: `360-${a}-${b}-${c}` },
    });
  };

  U.e4_frac = (t) => {
    const d = R(5, 12);
    if (t === 1) {
      const plus = Math.random() < 0.6;
      let a = R(1, d - 1), b = R(1, d - 1);
      if (!plus) { ok(a !== b); if (a < b) [a, b] = [b, a]; }
      const ans = new F(plus ? a + b : a - b, d);
      const wrong1 = plus ? A(raw(a + b, d * 2), new F(a + b, d * 2), "분모끼리도 더했어요") : A(fr(new F(a + b, d)), new F(a + b, d), "빼야 하는데 더했어요");
      return mk({
        q: `${raw(a, d)} ${plus ? "+" : M} ${raw(b, d)} = ?`, a: A(fr(ans), ans),
        w: [wrong1, A(fr(ans.add(new F(1, d))), ans.add(new F(1, d)), "분자 계산 실수"), A(fr(ans.sub(new F(1, d))), ans.sub(new F(1, d)), "분자 계산 실수")],
        tip: "분모가 같으면 분모는 그대로, 분자끼리 계산해요", chk: { js: `${a}/${d}${plus ? "+" : "-"}${b}/${d}` },
      });
    }
    if (t === 2) {
      const w1 = R(3, 7), w2 = R(1, w1 - 1), n1 = R(1, d - 1), n2 = R(1, d - 1);
      const f1 = new F(w1 * d + n1, d), f2 = new F(w2 * d + n2, d);
      const plus = Math.random() < 0.4;
      const ans = plus ? f1.add(f2) : f1.sub(f2);
      ok(ans.n > 0);
      const w = [];
      if (plus && n1 + n2 >= d) w.push(A(fr(ans.sub(1)), ans.sub(1), "받아올림한 1을 자연수에 더하지 않았어요"));
      if (!plus && n1 < n2) {
        const nb = new F((w1 - w2) * d + (n2 - n1), d);
        w.push(A(fr(nb), nb, "큰 분자에서 작은 분자를 거꾸로 뺐어요"));
        w.push(A(fr(ans.add(1)), ans.add(1), "받아내림하고 자연수에서 1을 빼지 않았어요"));
      }
      w.push(A(fr(ans.add(new F(1, d))), ans.add(new F(1, d)), "분자 계산 실수"), A(fr(ans.sub(new F(1, d))), ans.sub(new F(1, d)), "분자 계산 실수"));
      return mk({
        q: `${mixed(w1, n1, d)} ${plus ? "+" : M} ${mixed(w2, n2, d)} = ?`, a: A(fr(ans), ans), w,
        tip: plus ? "자연수끼리, 분수끼리 더하고 가분수는 대분수로 바꿔요" : "분수끼리 뺄 수 없으면 자연수에서 1을 빌려 와요",
        chk: { js: `(${w1}+${n1}/${d})${plus ? "+" : "-"}(${w2}+${n2}/${d})` },
      });
    }
    const Nn = R(3, 9), w = R(1, Nn - 1), n = R(1, d - 1);
    const ans = new F(Nn * d - (w * d + n), d);
    return mk({
      q: `${Nn} ${M} ${mixed(w, n, d)} = ?`, a: A(fr(ans), ans),
      w: [A(fr(new F((Nn - w) * d + n, d)), new F((Nn - w) * d + n, d), "자연수에서 1을 빌려 오지 않았어요"),
          A(fr(new F((Nn - w - 1) * d + n, d)), new F((Nn - w - 1) * d + n, d), "분자를 빼지 않고 그대로 썼어요"),
          A(fr(ans.add(1)), ans.add(1), "1을 빌려 오고 자연수에서 빼지 않았어요")],
      tip: `${Nn} = ${mixed(Nn - 1, d, d)} 로 바꿔서 빼요`, chk: { js: `${Nn}-(${w}+${n}/${d})` },
    });
  };

  U.e4_dec = (t) => {
    const plus = Math.random() < 0.5;
    let a, b, pa, pb;
    if (t === 1) { a = R(11, 99); b = R(11, 99); pa = pb = 1; }
    else if (t === 2) { a = R(101, 999); b = R(101, 999); pa = pb = 2; }
    else { a = R(11, 99); b = R(101, 499); pa = 1; pb = 2; }
    const A2 = a * 10 ** (2 - pa), B2 = b * 10 ** (2 - pb);
    let x = A2, y = B2, sx = a, sy = b, px = pa, py = pb;
    if (!plus && x < y) { [x, y] = [y, x]; [sx, sy] = [sy, sx]; [px, py] = [py, px]; }
    ok(plus || x !== y);
    const ans = plus ? x + y : x - y;
    const q = `${dec(sx, px)} ${plus ? "+" : M} ${dec(sy, py)} = ?`;
    const w = [A(dec(ans * 10, 2), ans * 10, "소수점 위치를 잘못 찍었어요"), A(dec(ans, 3), ans / 10, "소수점 위치를 잘못 찍었어요")];
    if (px !== py) {
      const mis = plus ? sx + sy : sx - sy;
      if (mis > 0) w.unshift(A(dec(mis, 2), mis, "소수점이 아니라 끝자리를 맞춰서 계산했어요"));
    }
    const carry = plus ? ans - 10 : ans + 10;
    if (carry > 0) w.splice(1, 0, A(dec(carry, 2), carry, t === 1 ? "받아올림·받아내림 실수" : "받아올림·받아내림 실수"));
    return mk({ q, a: A(dec(ans, 2), ans), w, tip: "소수점끼리 줄을 맞춰 세로로 계산해요", chk: { js: q.replace(" = ?", "") } });
  };

  const POLY = ["", "", "", "삼각형", "사각형", "오각형", "육각형", "칠각형", "팔각형", "구각형", "십각형", "십일각형", "십이각형"];
  U.e4_poly = (t) => {
    if (t === 1) {
      const n = R(3, 10), s = R(3, 15);
      return mk({
        q: `한 변이 ${s}cm인 정${POLY[n]}의 둘레는?`, a: A(s * n + " cm", s * n),
        w: [A(s * (n - 1) + " cm", s * (n - 1), "변의 개수를 하나 적게 셌어요"), A(s * (n + 1) + " cm", s * (n + 1), "변의 개수를 하나 많게 셌어요"), A(s + n + " cm", s + n, "곱하지 않고 더했어요")],
        tip: `정${POLY[n]}은 변이 ${n}개, 길이가 모두 같아요`, chk: { js: `${s}*${n}` },
      });
    }
    if (t === 2) {
      const n = R(4, 10), ans = n * (n - 3) / 2;
      return mk({
        q: `${POLY[n]}의 대각선은 모두 몇 개?`, a: A(ans + "개", ans),
        w: [A(n * (n - 3) + "개", n * (n - 3), "같은 대각선을 두 번 셌어요 (2로 나눠요)"), A(n - 3 + "개", n - 3, "한 꼭짓점에서 그은 것만 셌어요"), A(n * (n - 2) / 2 + "개", n * (n - 2) / 2, "이웃한 꼭짓점도 셌어요")],
        tip: `한 꼭짓점에서 ${n - 3}개씩, ${n}개 꼭짓점 → ${n}×${n - 3}÷2`, chk: { js: String(ans) },
      });
    }
    const k = R(2, 9), n = k + 3, ans = n * k / 2;
    return mk({
      q: `한 꼭짓점에서 그을 수 있는 대각선이 ${k}개인 다각형의 대각선은 모두 몇 개?`, a: A(ans + "개", ans),
      w: [A(n * k + "개", n * k, "같은 대각선을 두 번 셌어요"), A(k * k + "개", k * k, "꼭짓점의 개수를 잘못 구했어요"), A(k * (k - 3 > 0 ? k - 3 : 1) / 2 + k + "개", k * (k - 3 > 0 ? k - 3 : 1) / 2 + k, "꼭짓점의 개수를 잘못 구했어요"), A(ans + n + "개", ans + n, "변도 함께 셌어요")],
      tip: `꼭짓점은 ${k}+3 = ${n}개 → ${n}×${k}÷2`, chk: { js: String(ans) },
    });
  };

  // ───────── 초등 5학년 ─────────

  // 혼합 계산 식 계산기: mode "normal" | "ltr"(곱셈·나눗셈 먼저 안 함) | "noparen"(괄호 무시)
  function evalExpr(src, mode = "normal") {
    let s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/[{]/g, "(").replace(/[}]/g, ")");
    if (mode === "noparen") s = s.replace(/[()]/g, "");
    const tok = s.match(/\d+|[-+*/()]/g);
    let i = 0, exact = true;
    const prim = () => {
      const x = tok[i++];
      if (x === "(") { const v = expr(); i++; return v; }
      return new F(Number(x));
    };
    const apply = (a, op, b) => {
      if (op === "+") return a.add(b);
      if (op === "-") { const r = a.sub(b); if (r.n < 0) exact = false; return r; }
      if (op === "*") return a.mul(b);
      if (b.n === 0) throw new Error("zero");
      const r = a.div(b); if (!r.isInt()) exact = false; return r;
    };
    function term() { let v = prim(); while (tok[i] === "*" || tok[i] === "/") { const op = tok[i++]; v = apply(v, op, prim()); } return v; }
    function expr() {
      if (mode === "ltr") { let v = prim(); while (i < tok.length && tok[i] !== ")") { const op = tok[i++]; v = apply(v, op, prim()); } return v; }
      let v = term(); while (tok[i] === "+" || tok[i] === "-") { const op = tok[i++]; v = apply(v, op, term()); } return v;
    }
    const v = expr();
    return { v, exact };
  }

  const MIX = {
    1: ["a + b × c", "a − b × c", "a × b − c", "a + b ÷ c", "a − b ÷ c", "a ÷ b + c"],
    2: ["(a + b) × c", "a × (b − c)", "(a − b) ÷ c + d", "a + (b − c) × d", "a × b ÷ c − d"],
    3: ["a × (b + c) ÷ d − e", "{a + (b − c) × d} ÷ e", "a − {b + c × (d − e)}", "(a + b) ÷ c × d − e"],
  };
  U.e5_mix = (t) => {
    const tpl = pick(MIX[t]);
    for (let k = 0; k < 300; k++) {
      const s = tpl.replace(/[a-e]/g, () => String(R(2, t === 1 ? 40 : 24)));
      const r = evalExpr(s);
      if (!r.exact || !r.v.isInt() || r.v.n <= 0 || r.v.n > 400) continue;
      const ans = r.v.n;
      const w = [];
      for (const [mode, msg] of [["ltr", "곱셈·나눗셈보다 앞에서부터 차례로 계산했어요"], ["noparen", "괄호 안을 먼저 계산하지 않았어요"]]) {
        try { const x = evalExpr(s, mode).v; if (x.isInt() && x.n >= 0) w.push(A(String(x.n), x.n, msg)); } catch (e) { /* 0으로 나눔 */ }
      }
      w.push(A(String(ans + 10), ans + 10, "계산 실수"), A(String(ans > 10 ? ans - 10 : ans + 20), ans > 10 ? ans - 10 : ans + 20, "계산 실수"));
      return mk({ q: s + " = ?", a: A(String(ans), ans), w, tip: "괄호 → 곱셈·나눗셈 → 덧셈·뺄셈 순서예요", chk: { js: s.replace(/[{]/g, "(").replace(/[}]/g, ")") } });
    }
    RETRY();
  };

  const coprimePair = (lo, hi) => { let x, y; do { x = R(lo, hi); y = R(lo, hi); } while (x === y || gcd(x, y) !== 1); return [x, y]; };
  const divisors = (n) => { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out; };

  U.e5_gcd = (t) => {
    if (t === 1) {
      const n = pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 72]);
      const c = divisors(n).length;
      return mk({
        q: `${n}의 약수는 모두 몇 개?`, a: A(c + "개", c),
        w: [A(c - 1 + "개", c - 1, "1이나 자기 자신을 빠뜨렸어요"), A(c - 2 + "개", c - 2, "1과 자기 자신을 빠뜨렸어요"), A(c + 1 + "개", c + 1, "약수가 아닌 수를 넣었어요")],
        tip: `${n} = ` + divisors(n).filter((x) => x * x <= n).map((x) => `${x}×${n / x}`).join(", "), chk: { js: String(c) },
      });
    }
    if (t === 2) {
      const g = R(2, 9), [x, y] = coprimePair(2, 9), a = g * x, b = g * y, L = g * x * y;
      if (Math.random() < 0.5) {
        const small = divisors(g).filter((d) => d > 1 && d < g);
        return mk({
          q: `${josa(a, "과", "와")} ${b}의 최대공약수는?`, a: A(String(g), g),
          w: [...small.map((d) => A(String(d), d, "공약수이지만 가장 큰 수는 아니에요")), A(String(L), L, "최소공배수를 구했어요"), A(String(g * 2), g * 2, "두 수를 모두 나누는지 확인해요"), A(String(a * b), a * b, "두 수를 곱했어요")],
          tip: `${a} = ${g}×${x}, ${b} = ${g}×${y}`, chk: { js: String(g) },
        });
      }
      return mk({
        q: `${josa(a, "과", "와")} ${b}의 최소공배수는?`, a: A(String(L), L),
        w: [A(String(a * b), a * b, "두 수를 곱하기만 했어요"), A(String(g), g, "최대공약수를 구했어요"), A(String(L * 2), L * 2, "공배수이지만 가장 작은 수는 아니에요")],
        tip: `${g} × ${x} × ${y} = ${L}`, chk: { js: String(L) },
      });
    }
    const g = R(2, 8), [x, y] = coprimePair(2, 9), a = g * x, b = g * y, L = g * x * y;
    return mk({
      q: `두 수의 최대공약수는 ${g}, 최소공배수는 ${josa(L, "이에요", "예요")}. 한 수가 ${a}일 때 다른 수는?`, a: A(String(b), b),
      w: [A(String(L / a), L / a, "최대공약수를 곱하는 걸 빠뜨렸어요"), A(String(L / g), L / g, "최대공약수로만 나눴어요"), A(String(L - a), L - a, "빼기로 구했어요")],
      tip: `(한 수) × (다른 수) = (최대공약수) × (최소공배수) → ${g}×${L}÷${a}`, chk: { js: `${g}*${L}/${a}` },
    });
  };

  U.e5_reduce = (t) => {
    if (t === 1) {
      let n, d; do { d = R(3, 12); n = R(1, d - 1); } while (gcd(n, d) !== 1);
      const k = pick([2, 3, 4, 5, 6, 8, 9]);
      const w = [];
      const part = divisors(k).filter((p) => p > 1 && p < k);
      if (part.length) { const p = pick(part); w.push(A(raw(n * k / p, d * k / p), undefined, "최대공약수로 나누지 않아서 아직 약분할 수 있어요")); }
      w.push(A(raw(n, d * k), undefined, "분자만 나눴어요"), A(raw(n * k, d), undefined, "분모만 나눴어요"), A(raw(d, n), undefined, "분자와 분모를 바꿨어요"));
      return mk({ q: `${raw(n * k, d * k)}을(를) 기약분수로 나타내면?`, a: A(raw(n, d)), w, tip: `분모와 분자를 최대공약수 ${k}(으)로 나눠요` });
    }
    const make = () => { let d = R(3, 12), n = R(1, d - 1); return new F(n, d); };
    if (t === 2) {
      const f1 = make(), f2 = make(); ok(!f1.eq(f2) && f1.d !== f2.d);
      const big = f1.lt(f2) ? f2 : f1, small = f1.lt(f2) ? f1 : f2;
      const msg = small.n > big.n ? "분자가 크다고 더 큰 분수는 아니에요. 통분해서 비교해요" : "통분해서 비교해 보세요";
      return mk({
        q: `${fr(f1)} 와 ${fr(f2)} 중 더 큰 수는?`, a: A(fr(big), big),
        w: [A(fr(small), small, msg), A("두 수가 같아요", "same", "통분해서 비교해 보세요")],
        tip: `통분하면 ${raw(f1.n * lcm(f1.d, f2.d) / f1.d, lcm(f1.d, f2.d))}, ${raw(f2.n * lcm(f1.d, f2.d) / f2.d, lcm(f1.d, f2.d))}`,
      });
    }
    const fs = [make(), make(), make()];
    ok(!fs[0].eq(fs[1]) && !fs[1].eq(fs[2]) && !fs[0].eq(fs[2]));
    const sorted = fs.slice().sort((p, q) => (p.lt(q) ? 1 : -1));
    return mk({
      q: `${fs.map((f) => fr(f)).join(" , ")} 중 가장 큰 수는?`, a: A(fr(sorted[0]), sorted[0]),
      w: [A(fr(sorted[1]), sorted[1], "두 번째로 큰 수예요. 통분해서 다시 비교해요"), A(fr(sorted[2]), sorted[2], "가장 작은 수예요. 통분해서 다시 비교해요")],
      tip: "분모를 같게 통분하거나 1/2 같은 기준과 비교해요",
    });
  };

  U.e5_fracadd = (t) => {
    const prop = () => { let n, d; do { d = R(2, 12); n = R(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
    if (t === 1) {
      const [a, b] = prop(), [c, d] = prop(); ok(b !== d);
      const plus = Math.random() < 0.6, f1 = new F(a, b), f2 = new F(c, d);
      ok(plus || !f1.eq(f2));
      const [x, y] = plus || f2.lt(f1) ? [[a, b], [c, d]] : [[c, d], [a, b]];
      const fx = new F(x[0], x[1]), fy = new F(y[0], y[1]);
      const ans = plus ? fx.add(fy) : fx.sub(fy);
      const L = lcm(x[1], y[1]);
      const w = [];
      if (plus) w.push(A(fr(new F(x[0] + y[0], x[1] + y[1])), new F(x[0] + y[0], x[1] + y[1]), "분모끼리, 분자끼리 더했어요"));
      else if (x[0] > y[0] && x[1] > y[1]) w.push(A(fr(new F(x[0] - y[0], x[1] - y[1])), new F(x[0] - y[0], x[1] - y[1]), "분모끼리, 분자끼리 뺐어요"));
      const noScale = plus ? x[0] + y[0] : x[0] - y[0];
      if (noScale > 0) w.push(A(fr(new F(noScale, L)), new F(noScale, L), "통분할 때 분자에 곱하는 걸 빠뜨렸어요"));
      w.push(A(fr(ans.add(new F(1, L))), ans.add(new F(1, L)), "분자 계산 실수"), A(fr(ans.sub(new F(1, L))), ans.sub(new F(1, L)), "분자 계산 실수"));
      return mk({ q: `${raw(x[0], x[1])} ${plus ? "+" : M} ${raw(y[0], y[1])} = ?`, a: A(fr(ans), ans), w, tip: `분모 ${L}(으)로 통분한 뒤 분자끼리 계산해요`, chk: { js: `${x[0]}/${x[1]}${plus ? "+" : "-"}${y[0]}/${y[1]}` } });
    }
    const [a, b] = prop(), [c, d] = prop(); ok(b !== d);
    const w1 = R(2, 6), w2 = R(1, w1 - 1);
    const f1 = new F(a, b), f2 = new F(c, d), L = lcm(b, d);
    if (t === 2) {
      const ans = f1.add(f2).add(w1 + w2), w = [];
      if (!f1.add(f2).lt(1)) w.push(A(fr(ans.sub(1)), ans.sub(1), "받아올림한 1을 자연수에 더하지 않았어요"));
      w.push(A(fr(new F(a + c, b + d).add(w1 + w2)), new F(a + c, b + d).add(w1 + w2), "분모끼리, 분자끼리 더했어요"));
      w.push(A(fr(ans.add(new F(1, L))), ans.add(new F(1, L)), "분자 계산 실수"), A(fr(ans.add(1)), ans.add(1), "자연수 부분 계산 실수"));
      return mk({ q: `${mixed(w1, a, b)} + ${mixed(w2, c, d)} = ?`, a: A(fr(ans), ans), w, tip: "자연수끼리, 분수끼리 통분해서 더해요", chk: { js: `(${w1}+${a}/${b})+(${w2}+${c}/${d})` } });
    }
    ok(f1.lt(f2));
    const ans = f1.sub(f2).add(w1 - w2); ok(ans.n > 0);
    const noBorrow = f2.sub(f1).add(w1 - w2);
    return mk({
      q: `${mixed(w1, a, b)} ${M} ${mixed(w2, c, d)} = ?`, a: A(fr(ans), ans),
      w: [A(fr(noBorrow), noBorrow, "작은 분수에서 큰 분수를 뺄 수 없어서 거꾸로 뺐어요"), A(fr(ans.add(1)), ans.add(1), "1을 빌려 오고 자연수에서 빼지 않았어요"), A(fr(ans.add(new F(1, L))), ans.add(new F(1, L)), "분자 계산 실수")],
      tip: "분수끼리 뺄 수 없으면 자연수에서 1을 빌려 와요", chk: { js: `(${w1}+${a}/${b})-(${w2}+${c}/${d})` },
    });
  };

  U.e5_area = (t) => {
    if (t === 1) {
      const w = R(3, 15), h = R(3, 15); ok(w !== h);
      if (Math.random() < 0.5) {
        return mk({
          q: `가로 ${w}cm, 세로 ${h}cm인 직사각형의 넓이는?`, a: A(w * h + " cm²", w * h),
          w: [A(2 * (w + h) + " cm²", 2 * (w + h), "둘레를 구했어요"), A(w + h + " cm²", w + h, "곱하지 않고 더했어요"), A(w * h * 2 + " cm²", w * h * 2, "2를 곱할 필요가 없어요")],
          tip: "직사각형의 넓이 = 가로 × 세로", chk: { js: `${w}*${h}` },
        });
      }
      return mk({
        q: `가로 ${w}cm, 세로 ${h}cm인 직사각형의 둘레는?`, a: A(2 * (w + h) + " cm", 2 * (w + h)),
        w: [A(w * h + " cm", w * h, "넓이를 구했어요"), A(w + h + " cm", w + h, "두 변만 더했어요 (2배 해요)"), A(2 * w + h + " cm", 2 * w + h, "변 하나를 빠뜨렸어요")],
        tip: "직사각형의 둘레 = (가로 + 세로) × 2", chk: { js: `2*(${w}+${h})` },
      });
    }
    if (t === 2) {
      const b = R(4, 20), h = R(3, 16);
      if (Math.random() < 0.5) {
        ok((b * h) % 2 === 0);
        return mk({
          q: `밑변 ${b}cm, 높이 ${h}cm인 삼각형의 넓이는?`, a: A(b * h / 2 + " cm²", b * h / 2),
          w: [A(b * h + " cm²", b * h, "2로 나누지 않았어요"), A(b + h + " cm²", b + h, "곱하지 않고 더했어요"), A(b * h / 2 + 2 + " cm²", b * h / 2 + 2, "계산 실수")],
          tip: "삼각형의 넓이 = 밑변 × 높이 ÷ 2", chk: { js: `${b}*${h}/2` },
        });
      }
      ok((b * h) % 2 === 0);
      return mk({
        q: `밑변 ${b}cm, 높이 ${h}cm인 평행사변형의 넓이는?`, a: A(b * h + " cm²", b * h),
        w: [A(b * h / 2 + " cm²", b * h / 2, "삼각형처럼 2로 나눴어요"), A(2 * (b + h) + " cm²", 2 * (b + h), "둘레처럼 계산했어요"), A(b * h + 10 + " cm²", b * h + 10, "계산 실수")],
        tip: "평행사변형의 넓이 = 밑변 × 높이", chk: { js: `${b}*${h}` },
      });
    }
    const kind = R(1, 3);
    if (kind === 1) {
      const a = R(3, 12), b = R(a + 1, 18), h = R(3, 12); ok(((a + b) * h) % 2 === 0);
      return mk({
        q: `윗변 ${a}cm, 아랫변 ${b}cm, 높이 ${h}cm인 사다리꼴의 넓이는?`, a: A((a + b) * h / 2 + " cm²", (a + b) * h / 2),
        w: [A((a + b) * h + " cm²", (a + b) * h, "2로 나누지 않았어요"), A(a * b * h / 2 + " cm²", a * b * h / 2, "윗변과 아랫변을 곱했어요"), A(b * h / 2 + " cm²", b * h / 2, "윗변을 빠뜨렸어요")],
        tip: "사다리꼴의 넓이 = (윗변 + 아랫변) × 높이 ÷ 2", chk: { js: `(${a}+${b})*${h}/2` },
      });
    }
    if (kind === 2) {
      const p = R(4, 16), q = R(4, 16); ok((p * q) % 2 === 0 && p !== q);
      return mk({
        q: `두 대각선이 ${p}cm, ${q}cm인 마름모의 넓이는?`, a: A(p * q / 2 + " cm²", p * q / 2),
        w: [A(p * q + " cm²", p * q, "2로 나누지 않았어요"), A(p + q + " cm²", p + q, "곱하지 않고 더했어요"), A(p * q / 4 + " cm²", p * q / 4, "4로 나눴어요")],
        tip: "마름모의 넓이 = 한 대각선 × 다른 대각선 ÷ 2", chk: { js: `${p}*${q}/2` },
      });
    }
    const b = R(4, 16), h = R(3, 15), S = b * h / 2; ok(Number.isInteger(S));
    return mk({
      q: `넓이가 ${S}cm²이고 밑변이 ${b}cm인 삼각형의 높이는?`, a: A(h + " cm", h),
      w: [A(S / b + " cm", S / b, "2를 곱하는 걸 빠뜨렸어요"), A(S * 2 + " cm", S * 2, "밑변으로 나누지 않았어요"), A(S - b + " cm", S - b, "빼기로 구했어요")],
      tip: `높이 = 넓이 × 2 ÷ 밑변 = ${S}×2÷${b}`, chk: { js: `${S}*2/${b}` },
    });
  };

  const PLACE = { 10: "십", 100: "백", 1000: "천" };
  const roundTo = (n, u, how) => (how === "up" ? Math.ceil(n / u) * u : how === "down" ? Math.floor(n / u) * u : Math.round(n / u) * u);
  U.e5_round = (t) => {
    if (t <= 2) {
      const n = R(1001, 9999), u = pick([10, 100, 1000]);
      const how = t === 1 ? "half" : pick(["up", "down"]);
      const name = { half: "반올림", up: "올림", down: "버림" };
      const ans = roundTo(n, u, how);
      const w = [];
      for (const h of ["half", "up", "down"]) if (h !== how) w.push(A(C(roundTo(n, u, h)), roundTo(n, u, h), `${name[h]}을 했어요`));
      for (const u2 of [10, 100, 1000]) if (u2 !== u) w.push(A(C(roundTo(n, u2, how)), roundTo(n, u2, how), "어림하는 자리를 잘못 봤어요"));
      return mk({ q: `${C(n)}${batchim(n) ? "을" : "를"} ${name[how]}하여 ${PLACE[u]}의 자리까지 나타내면?`, a: A(C(ans), ans), w, tip: how === "half" ? "바로 아래 자리가 5 이상이면 올리고, 4 이하면 버려요" : how === "up" ? "아래 자리에 0이 아닌 수가 있으면 올려요" : "아래 자리를 모두 0으로 만들어요" });
    }
    const a = R(10, 60), b = a + R(4, 15);
    const lo = pick(["이상", "초과"]), hi = pick(["이하", "미만"]);
    const cnt = (hi === "이하" ? b : b - 1) - (lo === "이상" ? a : a + 1) + 1;
    return mk({
      q: `${a} ${lo} ${b} ${hi}인 자연수는 모두 몇 개?`, a: A(cnt + "개", cnt),
      w: [A(cnt + 1 + "개", cnt + 1, "경계의 수를 넣을지 다시 봐요 (초과·미만은 빼요)"), A(cnt - 1 + "개", cnt - 1, "경계의 수를 넣을지 다시 봐요 (이상·이하는 넣어요)"), A(cnt + 2 + "개", cnt + 2, "경계의 수를 넣을지 다시 봐요"), A(cnt - 2 + "개", cnt - 2, "경계의 수를 넣을지 다시 봐요")],
      tip: "이상·이하는 그 수를 포함, 초과·미만은 포함하지 않아요", chk: { js: String(cnt) },
    });
  };

  U.e5_fracmul = (t) => {
    if (t === 1) {
      let a, b; do { b = R(3, 12); a = R(1, b - 1); } while (gcd(a, b) !== 1);
      const n = R(2, 9), ans = new F(a * n, b);
      return mk({
        q: `${raw(a, b)} × ${n} = ?`, a: A(fr(ans), ans),
        w: [A(fr(new F(a, b * n)), new F(a, b * n), "분자가 아니라 분모에 곱했어요"), A(raw(a * n, b * n), new F(a, b), "분모에도 곱했어요"), A(fr(ans.add(new F(1, b))), ans.add(new F(1, b)), "분자 계산 실수")],
        tip: "분수 × 자연수는 분자에만 곱해요", chk: { js: `${a}/${b}*${n}` },
      });
    }
    const p = () => { let n, d; do { d = R(2, 10); n = R(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
    if (t === 2) {
      const [a, b] = p(), [c, d] = p(), ans = new F(a * c, b * d);
      return mk({
        q: `${raw(a, b)} × ${raw(c, d)} = ?`, a: A(fr(ans), ans),
        w: [A(fr(new F(a * d, b * c)), new F(a * d, b * c), "나눗셈처럼 뒤의 분수를 뒤집었어요"), A(fr(new F(a + c, b + d)), new F(a + c, b + d), "분자끼리, 분모끼리 더했어요"), A(fr(new F(a * c, b + d)), new F(a * c, b + d), "분모끼리 더했어요")],
        tip: "분자끼리, 분모끼리 곱하고 약분해요", chk: { js: `${a}/${b}*${c}/${d}` },
      });
    }
    const [a, b] = p(), [c, d] = p(), w1 = R(1, 3), w2 = R(1, 3);
    const f1 = new F(w1 * b + a, b), f2 = new F(w2 * d + c, d), ans = f1.mul(f2);
    const sep = new F(a * c, b * d).add(w1 * w2);
    const badConv = new F(w1 + a, b).mul(f2);
    return mk({
      q: `${mixed(w1, a, b)} × ${mixed(w2, c, d)} = ?`, a: A(fr(ans), ans),
      w: [A(fr(sep), sep, "자연수끼리, 분수끼리 따로 곱했어요 (가분수로 바꿔서 곱해요)"), A(fr(badConv), badConv, "대분수를 가분수로 잘못 바꿨어요"), A(fr(ans.add(1)), ans.add(1), "계산 실수")],
      tip: "대분수를 가분수로 바꾼 뒤 곱해요", chk: { js: `(${w1}+${a}/${b})*(${w2}+${c}/${d})` },
    });
  };

  U.e5_decmul = (t) => {
    let a, pa, b, pb;
    if (t === 1) { pa = pick([1, 2]); a = pa === 1 ? R(11, 99) : R(101, 999); b = R(2, 9); pb = 0; }
    else if (t === 2) { pa = 1; a = R(11, 99); pb = 1; b = R(2, 49); }
    else { pa = 2; a = R(101, 499); pb = 1; b = R(2, 25); }
    ok(a % 10 !== 0 && (pb === 0 || b % 10 !== 0));
    const prod = a * b, pp = pa + pb;
    const q = `${dec(a, pa)} × ${dec(b, pb)} = ?`;
    return mk({
      q, a: A(dec(prod, pp), prod / 10 ** pp),
      w: [A(dec(prod, pp - 1), prod / 10 ** (pp - 1), "소수점 아래 자릿수를 잘못 셌어요"), A(dec(prod, pp + 1), prod / 10 ** (pp + 1), "소수점 아래 자릿수를 잘못 셌어요"), A(dec(prod + 10 ** (pp > 1 ? 1 : 0), pp), (prod + 10 ** (pp > 1 ? 1 : 0)) / 10 ** pp, "곱셈 계산 실수")],
      tip: `자연수처럼 ${a}×${b} = ${prod}, 소수점 아래 ${pp}자리`, chk: { js: q.replace(" = ?", "") },
    });
  };

  U.e5_avg = (t) => {
    if (t === 1) {
      const k = R(4, 5), m = R(10, 40);
      const vals = []; let s = 0;
      for (let i = 0; i < k - 1; i++) { const v = m + R(-8, 8); vals.push(v); s += v; }
      vals.push(m * k - s); ok(vals[k - 1] > 0);
      const w = [];
      if ((m * k) % (k - 1) === 0) w.push(A(String(m * k / (k - 1)), m * k / (k - 1), "자료의 개수를 하나 적게 셌어요"));
      w.push(A(String(m + 1), m + 1, "나눗셈 실수"), A(String(m - 1), m - 1, "나눗셈 실수"), A(String(m * k), m * k, "합만 구하고 나누지 않았어요"));
      return mk({ q: `${vals.join(", ")}의 평균은?`, a: A(String(m), m), w, tip: `합 ${m * k} ÷ ${k}개`, chk: { js: `(${vals.join("+")})/${k}` } });
    }
    if (t === 2) {
      const k = R(4, 5), m = R(60, 90);
      const vals = []; let s = 0;
      for (let i = 0; i < k - 1; i++) { const v = m + R(-10, 10); vals.push(v); s += v; }
      const x = m * k - s; ok(x > 0 && x <= 100);
      const w2 = m * (k - 1) - s;
      return mk({
        q: `${k}번 본 시험의 평균이 ${m}점이에요. ${k - 1}번의 점수가 ${vals.join("점, ")}점일 때 나머지 한 번의 점수는?`, a: A(x + "점", x),
        w: [w2 > 0 ? A(w2 + "점", w2, "전체 횟수를 하나 적게 셌어요") : null, A(m + "점", m, "평균을 그대로 썼어요"), A(x + 10 + "점", x + 10, "계산 실수"), A(x - 2 + "점", x - 2, "계산 실수")],
        tip: `전체 합 = ${m}×${k} = ${m * k}, 여기서 나머지 점수를 빼요`, chk: { js: `${m}*${k}-(${vals.join("+")})` },
      });
    }
    const n1 = R(2, 6), n2 = R(2, 6), m1 = R(125, 155), m2 = R(125, 155); ok(n1 !== n2 && m1 !== m2);
    const tot = n1 * m1 + n2 * m2, avg = new F(tot, n1 + n2); ok(avg.d === 1 || avg.d === 2 || avg.d === 5);
    const show = (f) => (f.isInt() ? String(f.n) : dec(f.n * (10 / f.d), 1));
    const half = new F(m1 + m2, 2);
    return mk({
      q: `${n1}명의 평균 키가 ${m1}cm, ${n2}명의 평균 키가 ${m2}cm일 때 전체 ${n1 + n2}명의 평균 키는?`, a: A(show(avg) + " cm", avg.val()),
      w: [A(show(half) + " cm", half.val(), "평균끼리 다시 평균을 냈어요 (사람 수가 달라요)"), A(show(avg.add(1)) + " cm", avg.val() + 1, "계산 실수"), A(show(avg.sub(1)) + " cm", avg.val() - 1, "계산 실수")],
      tip: `전체 합 = ${n1}×${m1} + ${n2}×${m2} = ${tot}, ÷ ${n1 + n2}`, chk: { js: `(${n1}*${m1}+${n2}*${m2})/${n1 + n2}` },
    });
  };

  // ───────── 초등 6학년 ─────────
  U.e6_fracdiv = (t) => {
    const p = () => { let n, d; do { d = R(2, 10); n = R(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
    if (t === 1) {
      const [a, b] = p(), n = R(2, 9), ans = new F(a, b * n);
      return mk({
        q: `${raw(a, b)} ÷ ${n} = ?`, a: A(fr(ans), ans),
        w: [A(fr(new F(a * n, b)), new F(a * n, b), "나누지 않고 곱했어요"), A(fr(new F(a, b + n)), new F(a, b + n), "분모에 더했어요"), A(fr(new F(a + 1, b * n)), new F(a + 1, b * n), "분자 계산 실수")],
        tip: `÷${n} 은 × ${raw(1, n)} 과 같아요`, chk: { js: `${a}/${b}/${n}` },
      });
    }
    if (t === 2) {
      const [a, b] = p(), [c, d] = p(), ans = new F(a * d, b * c);
      return mk({
        q: `${raw(a, b)} ÷ ${raw(c, d)} = ?`, a: A(fr(ans), ans),
        w: [A(fr(new F(a * c, b * d)), new F(a * c, b * d), "나누는 분수를 뒤집지 않고 곱했어요"), A(fr(new F(b * c, a * d)), new F(b * c, a * d), "앞의 분수를 뒤집었어요"), A(fr(ans.add(1)), ans.add(1), "계산 실수")],
        tip: "나누는 분수의 분모와 분자를 바꾸어 곱해요", chk: { js: `(${a}/${b})/(${c}/${d})` },
      });
    }
    const [a, b] = p(), [c, d] = p(), w = R(1, 4);
    const f1 = new F(w * b + a, b), f2 = new F(c, d), ans = f1.div(f2);
    const drop = new F(a, b).div(f2).add(w);
    return mk({
      q: `${mixed(w, a, b)} ÷ ${raw(c, d)} = ?`, a: A(fr(ans), ans),
      w: [A(fr(drop), drop, "분수 부분만 나누고 자연수는 그대로 뒀어요"), A(fr(f1.mul(f2)), f1.mul(f2), "뒤집지 않고 곱했어요"), A(fr(ans.add(new F(1, 2))), ans.add(new F(1, 2)), "계산 실수")],
      tip: "대분수를 가분수로 바꾸고, 나누는 분수를 뒤집어 곱해요", chk: { js: `(${w}+${a}/${b})/(${c}/${d})` },
    });
  };

  U.e6_decdiv = (t) => {
    if (t === 1) {
      const n = R(2, 9), pq = pick([1, 2]), q = pq === 1 ? R(11, 99) : R(101, 399); ok(q % 10 !== 0);
      const a = q * n, qs = `${dec(a, pq)} ÷ ${n} = ?`;
      return mk({ q: qs, a: A(dec(q, pq), q / 10 ** pq), w: [A(dec(q, pq - 1), q / 10 ** (pq - 1), "몫의 소수점을 잘못 찍었어요"), A(dec(q, pq + 1), q / 10 ** (pq + 1), "몫의 소수점을 잘못 찍었어요"), A(dec(q + 1, pq), (q + 1) / 10 ** pq, "나눗셈 실수")], tip: "나누어지는 수의 소수점 위치에 맞춰 몫에 소수점을 찍어요", chk: { js: qs.replace(" = ?", "") } });
    }
    if (t === 2) {
      const b = R(2, 9), pq = pick([0, 1]), q = pq === 0 ? R(2, 19) : R(11, 49); ok(pq === 0 || q % 10 !== 0);
      const a = q * b; // a/(10^(pq+1)) ÷ b/10 = q/10^pq
      const qs = `${dec(a, pq + 1)} ÷ ${dec(b, 1)} = ?`;
      return mk({ q: qs, a: A(dec(q, pq), q / 10 ** pq), w: [A(dec(q, pq + 1), q / 10 ** (pq + 1), "두 수의 소수점을 같은 자리만큼 옮기지 않았어요"), A(dec(q * 10, pq), (q * 10) / 10 ** pq, "두 수의 소수점을 같은 자리만큼 옮기지 않았어요"), A(dec(q + 1, pq), (q + 1) / 10 ** pq, "나눗셈 실수")], tip: "나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 옮겨요", chk: { js: qs.replace(" = ?", "") } });
    }
    const a = R(2, 30), b = pick([3, 6, 7, 9, 11, 12]); ok(a % b !== 0);
    const v = a / b, r1 = Math.round(v * 10), tr = Math.floor(v * 10); ok(r1 !== tr);
    const two = Math.round(v * 100);
    return mk({
      q: `${a} ÷ ${b}의 몫을 반올림하여 소수 첫째 자리까지 나타내면?`, a: A(dec(r1, 1), r1 / 10),
      w: [A(dec(tr, 1), tr / 10, "반올림이 아니라 버림을 했어요"), A(dec(two, 2), two / 100, "소수 둘째 자리까지 나타냈어요"), A(dec(r1 + 1, 1), (r1 + 1) / 10, "계산 실수")],
      tip: "소수 둘째 자리까지 구한 뒤 둘째 자리에서 반올림해요", chk: { js: String(r1 / 10) },
    });
  };

  U.e6_ratio = (t) => {
    if (t === 1) {
      const a = R(1, 12), b = R(2, 12); ok(a !== b);
      const ans = new F(a, b);
      return mk({
        q: `비 ${a} : ${b}의 비율을 분수로 나타내면?`, a: A(fr(ans, "improper"), ans),
        w: [A(fr(new F(b, a), "improper"), new F(b, a), "기준량과 비교하는 양을 바꿨어요 (기준량은 : 뒤의 수)"), A(fr(new F(a, a + b), "improper"), new F(a, a + b), "전체에 대한 비율을 구했어요")],
        tip: "비율 = (비교하는 양) ÷ (기준량)", chk: { js: `${a}/${b}` },
      });
    }
    if (t === 2) {
      const tot = pick([20, 25, 40, 50, 200, 400]), a = R(1, tot - 1), pct = new F(a * 100, tot); ok(pct.isInt());
      return mk({
        q: `전체 ${tot}명 중 ${a}명은 전체의 몇 %?`, a: A(pct.n + "%", pct.n),
        w: [A(100 - pct.n + "%", 100 - pct.n, "나머지 사람의 비율을 구했어요"), A(new F(a * 10, tot).isInt() ? new F(a * 10, tot).n + "%" : null, new F(a * 10, tot).val(), "100이 아니라 10을 곱했어요"), A(a + "%", a, "사람 수를 그대로 %로 썼어요"), A(pct.n + 5 + "%", pct.n + 5, "계산 실수")],
        tip: `${a} ÷ ${tot} × 100`, chk: { js: `${a}/${tot}*100` },
      });
    }
    const x = R(10, 90) * 100, y = pick([10, 15, 20, 25, 30, 40]), ans = x * (100 - y) / 100; ok(Number.isInteger(ans));
    return mk({
      q: `${C(x)}원짜리 물건을 ${y}% 할인하면 얼마?`, a: A(C(ans) + "원", ans),
      w: [A(C(x * y / 100) + "원", x * y / 100, "할인되는 금액을 구했어요 (원래 값에서 빼요)"), A(C(x - y) + "원", x - y, "%를 원으로 생각하고 뺐어요"), A(C(ans - 100) + "원", ans - 100, "계산 실수")],
      tip: `${C(x)} × ${100 - y}/100`, chk: { js: `${x}*(100-${y})/100` },
    });
  };

  U.e6_prop = (t) => {
    if (t === 1) {
      const a = R(2, 9), b = R(2, 9), k = R(2, 6); ok(a !== b);
      if (Math.random() < 0.5) {
        return mk({
          q: `${a} : ${b} = ${a * k} : □ 에서 □ 는?`, a: A(String(b * k), b * k),
          w: [A(String(b + a * k - a), b + a * k - a, "곱하지 않고 더해서 맞췄어요"), A(String(a * k * k), a * k * k, "비례식 계산 실수"), A(String(b * k + k), b * k + k, "계산 실수")],
          tip: `${a}×${k} = ${a * k} 이니까 ${b}×${k}`, chk: { js: String(b * k) },
        });
      }
      return mk({
        q: `${a} : ${b} = □ : ${b * k} 에서 □ 는?`, a: A(String(a * k), a * k),
        w: [A(String(a + b * k - b), a + b * k - b, "곱하지 않고 더해서 맞췄어요"), A(String(b * k * k), b * k * k, "비례식 계산 실수"), A(String(a * k + k), a * k + k, "계산 실수")],
        tip: "외항의 곱 = 내항의 곱", chk: { js: String(a * k) },
      });
    }
    if (t === 2) {
      let p, q; do { p = R(1, 9); q = R(1, 9); } while (p === q || gcd(p, q) !== 1);
      if (Math.random() < 0.5) {
        const k = R(1, 4);
        return mk({
          q: `${dec(p * k, 1)} : ${dec(q * k, 1)} 을(를) 가장 간단한 자연수의 비로 나타내면?`, a: A(`${p} : ${q}`),
          w: [A(`${q} : ${p}`, undefined, "앞과 뒤를 바꿨어요"), k > 1 ? A(`${p * k} : ${q * k}`, undefined, "아직 더 간단히 할 수 있어요") : null, A(`${p * 10} : ${q * 10}`, undefined, "10을 곱했지만 더 간단히 할 수 있어요"), A(`${p + 1} : ${q}`, undefined, "계산 실수")],
          tip: "10을 곱해 자연수로 만들고 최대공약수로 나눠요",
        });
      }
      // 분수의 비: [1/p] : [1/q] = q : p
      return mk({
        q: `${raw(1, p === 1 ? 2 : p)} : ${raw(1, q === 1 ? 3 : q)} 을(를) 가장 간단한 자연수의 비로 나타내면?`,
        a: A(`${q === 1 ? 3 : q} : ${p === 1 ? 2 : p}`),
        w: [A(`${p === 1 ? 2 : p} : ${q === 1 ? 3 : q}`, undefined, "분모끼리 비를 썼어요 (두 분수에 분모의 공배수를 곱해요)"), A("1 : 1", undefined, "분자끼리 비를 썼어요"), A(`${q === 1 ? 3 : q} : ${(p === 1 ? 2 : p) + 1}`, undefined, "계산 실수")],
        tip: "두 분모의 최소공배수를 곱해요",
      });
    }
    let a, b; do { a = R(1, 7); b = R(1, 7); } while (a === b || gcd(a, b) !== 1);
    const k = R(3, 15), Nt = (a + b) * k, front = Math.random() < 0.5;
    const ans = front ? a * k : b * k, other = front ? b * k : a * k;
    return mk({
      q: `${Nt}개를 ${a} : ${b}로 나누면 ${front ? "앞" : "뒤"}의 몫은?`, a: A(ans + "개", ans),
      w: [A(other + "개", other, "반대쪽 몫을 구했어요"), A(k + "개", k, "한 몫(전체 ÷ 합)만 구했어요"), A(Nt % (front ? a : b) === 0 && (front ? a : b) > 1 ? Nt / (front ? a : b) + "개" : null, Nt / (front ? a : b), "비의 합으로 나누지 않았어요"), A(ans + 1 + "개", ans + 1, "계산 실수")],
      tip: `${Nt} × ${raw(front ? a : b, a + b)}`, chk: { js: `${Nt}*${front ? a : b}/${a + b}` },
    });
  };

  U.e6_circle = (t) => {
    const pi = (n) => dec(n * 314, 2); // n × 3.14
    if (t === 1) {
      const d = R(2, 20), r = Math.random() < 0.5;
      const ans = r ? 2 * d : d; // 지름
      const q = r ? `반지름이 ${d}cm인 원의 원주는? (원주율 3.14)` : `지름이 ${d}cm인 원의 원주는? (원주율 3.14)`;
      return mk({
        q, a: A(pi(ans) + " cm", ans * 3.14),
        w: [A(pi(r ? d : d * 2) + " cm", (r ? d : d * 2) * 3.14, r ? "반지름에 원주율을 곱했어요 (지름을 써요)" : "지름을 반지름으로 생각했어요"), A(pi(d * d) + " cm", d * d * 3.14, "넓이 공식을 썼어요"), A(pi(ans) + "0 cm" === pi(ans) ? null : dec(ans * 314 + 100, 2) + " cm", ans * 3.14 + 1, "곱셈 실수")],
        tip: "원주 = 지름 × 원주율", chk: { js: `${ans}*3.14` },
      });
    }
    if (t === 2) {
      const r = R(2, 12);
      return mk({
        q: `반지름이 ${r}cm인 원의 넓이는? (원주율 3.14)`, a: A(pi(r * r) + " cm²", r * r * 3.14),
        w: [A(pi(2 * r) + " cm²", 2 * r * 3.14, "원주를 구했어요"), A(pi(4 * r * r) + " cm²", 4 * r * r * 3.14, "반지름 대신 지름으로 계산했어요"), A(pi(r) + " cm²", r * 3.14, "반지름을 한 번만 곱했어요")],
        tip: "원의 넓이 = 반지름 × 반지름 × 원주율", chk: { js: `${r}*${r}*3.14` },
      });
    }
    const d = R(2, 15) * 2;
    return mk({
      q: `원주가 ${pi(d)}cm인 원의 반지름은? (원주율 3.14)`, a: A(d / 2 + " cm", d / 2),
      w: [A(d + " cm", d, "지름을 구했어요 (2로 나눠요)"), A(d * 2 + " cm", d * 2, "2를 곱했어요"), A(d / 2 + 1 + " cm", d / 2 + 1, "계산 실수")],
      tip: `지름 = 원주 ÷ 3.14 = ${d}, 반지름은 그 절반`, chk: { js: String(d / 2) },
    });
  };

  U.e6_volume = (t) => {
    const a = R(2, 12), b = R(2, 12), c = R(2, 12);
    if (t === 1) {
      return mk({
        q: `가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 부피는?`, a: A(a * b * c + " cm³", a * b * c),
        w: [A(2 * (a * b + b * c + c * a) + " cm³", 2 * (a * b + b * c + c * a), "겉넓이를 구했어요"), A(a * b + b * c + c * a + " cm³", a * b + b * c + c * a, "세 면의 넓이를 더했어요"), A(a + b + c + " cm³", a + b + c, "곱하지 않고 더했어요")],
        tip: "직육면체의 부피 = 가로 × 세로 × 높이", chk: { js: `${a}*${b}*${c}` },
      });
    }
    if (t === 2) {
      return mk({
        q: `한 모서리가 ${a}cm인 정육면체의 겉넓이는?`, a: A(6 * a * a + " cm²", 6 * a * a),
        w: [A(4 * a * a + " cm²", 4 * a * a, "면을 4개만 셌어요 (정육면체 면은 6개)"), A(a * a * a + " cm²", a * a * a, "부피를 구했어요"), A(a * a + " cm²", a * a, "한 면의 넓이만 구했어요")],
        tip: "정육면체의 겉넓이 = 한 면의 넓이 × 6", chk: { js: `6*${a}*${a}` },
      });
    }
    ok(a !== b && b !== c);
    const S = 2 * (a * b + b * c + c * a);
    return mk({
      q: `가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 겉넓이는?`, a: A(S + " cm²", S),
      w: [A(S / 2 + " cm²", S / 2, "서로 다른 세 면만 더했어요 (2배 해요)"), A(a * b * c + " cm²", a * b * c, "부피를 구했어요"), A(6 * a * b + " cm²", 6 * a * b, "한 면만 6배 했어요")],
      tip: "(세 면의 넓이의 합) × 2", chk: { js: `2*(${a}*${b}+${b}*${c}+${c}*${a})` },
    });
  };

  root.YMcore = { state, josa, R, pick, shuffle, gcd, lcm, M, N, C, P, PS, RETRY, sup, F, fr, raw, mixed, dec, terms, vp, lin, mono, A, mk, near, ok, U, divisors, coprimePair };
})(typeof window !== "undefined" ? window : globalThis);
