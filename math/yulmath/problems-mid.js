// 나율이의 달콤 수학 - 중학교 문제 + 단원 목록
// problems.js 의 도구(YMcore)를 그대로 써요.
(function (root) {
  "use strict";
  const { josa, R, pick, shuffle, gcd, lcm, M, N, C, P, PS, RETRY, sup, F, fr, raw, dec, terms, vp, lin, mono, A, mk, ok, U, divisors } = root.YMcore;

  // ───────── 중학교 1학년 ─────────
  const PRIMES = [2, 3, 5, 7];
  const factStr = (ex) => PRIMES.map((p, i) => (ex[i] ? (ex[i] === 1 ? String(p) : p + sup(ex[i])) : "")).filter(Boolean).join(" × ");
  const factVal = (ex) => ex.reduce((acc, e, i) => acc * PRIMES[i] ** e, 1);

  U.m1_prime = (t) => {
    if (t === 1) {
      const ex = [R(1, 4), R(0, 2), R(0, 1), R(0, 1)]; const n = factVal(ex); ok(n <= 400 && ex.filter(Boolean).length >= 2);
      const w = [];
      if (ex[0] >= 2) { const rest = ex.slice(); rest[0] -= 2; w.push(A(["4", factStr(rest)].filter(Boolean).join(" × "), undefined, "4는 소수가 아니에요. 소수만의 곱으로 나타내요")); }
      if (ex[1] >= 2) { const rest = ex.slice(); rest[1] -= 2; w.push(A([factStr(rest), "9"].filter(Boolean).join(" × "), undefined, "9는 소수가 아니에요")); }
      for (let i = 0; i < 2; i++) { const e2 = ex.slice(); e2[i] = Math.max(1, e2[i] + (Math.random() < 0.5 ? 1 : -1)); if (factVal(e2) !== n) w.push(A(factStr(e2), undefined, "지수(같은 수를 곱한 개수)를 잘못 셌어요")); }
      if (ex[0] >= 1 && ex[1] >= 1) { const prod = 6; const rest = ex.slice(); rest[0]--; rest[1]--; w.push(A([factStr(rest), String(prod)].filter(Boolean).join(" × "), undefined, "6은 소수가 아니에요")); }
      return mk({ q: `${josa(n, "을", "를")} 소인수분해하면?`, a: A(factStr(ex)), w: shuffle(w), tip: "가장 작은 소수부터 계속 나눠 봐요" });
    }
    if (t === 2) {
      const ex = [R(1, 4), R(1, 3), R(0, 2), 0]; const n = factVal(ex);
      const nz = ex.filter(Boolean);
      const ans = nz.reduce((a, e) => a * (e + 1), 1);
      return mk({
        q: `${factStr(ex)}의 약수는 모두 몇 개?`, a: A(ans + "개", ans),
        w: [A(nz.reduce((a, e) => a * e, 1) + "개", nz.reduce((a, e) => a * e, 1), "지수에 1을 더하지 않고 곱했어요"), A(nz.reduce((a, e) => a + e + 1, 0) + "개", nz.reduce((a, e) => a + e + 1, 0), "곱하지 않고 더했어요"), A(ans - 1 + "개", ans - 1, "계산 실수"), A(ans + 2 + "개", ans + 2, "계산 실수")],
        tip: "(지수+1)끼리 곱해요 (" + nz.map((e) => e + 1).join("×") + ")", chk: { js: String(divisors(n).length) },
      });
    }
    const a = [R(1, 4), R(0, 3), R(0, 1), R(0, 1)], b = [R(1, 4), R(0, 3), R(0, 1), R(0, 1)];
    ok(a.join() !== b.join() && a.filter(Boolean).length >= 2 && b.filter(Boolean).length >= 2);
    const g = a.map((e, i) => Math.min(e, b[i])), l = a.map((e, i) => Math.max(e, b[i]));
    ok(g.some(Boolean) && factStr(g) !== factStr(l));
    const askG = Math.random() < 0.5;
    const mixA = a.map((e, i) => (b[i] ? Math.min(e, b[i]) || b[i] : 0)); // 공통이 아닌 소인수를 넣은 실수
    return mk({
      q: `A = ${factStr(a)}, B = ${factStr(b)} 의 ${askG ? "최대공약수" : "최소공배수"}는?`,
      a: A(askG ? factStr(g) : factStr(l)),
      w: [A(askG ? factStr(l) : factStr(g), undefined, askG ? "최소공배수를 구했어요" : "최대공약수를 구했어요"),
          A(askG ? factStr(mixA) : factStr(a.map((e, i) => e + b[i])), undefined, askG ? "공통이 아닌 소인수까지 넣었어요" : "지수끼리 더했어요 (큰 지수를 골라요)"),
          A(askG ? factStr(g.map((e, i) => (e ? e + 1 : 0))) : factStr(l.map((e, i) => (e && a[i] && b[i] ? Math.min(a[i], b[i]) : e))), undefined, askG ? "공통인 소인수 중 작은 지수를 골라요" : "공통인 소인수는 큰 지수를 골라요")],
      tip: askG ? "공통인 소인수만, 지수는 작은 쪽" : "모든 소인수를, 지수는 큰 쪽",
    });
  };

  U.m1_int = (t) => {
    if (t === 1) {
      const a = R(-15, 15) || 3, b = R(-15, 15) || -4, plus = Math.random() < 0.5;
      const ans = plus ? a + b : a - b;
      const signErr = plus ? a - b : a + b;
      return mk({
        q: `${PS(a)} ${plus ? "+" : M} ${PS(b)} = ?`, a: A(N(ans), ans),
        w: [A(N(-ans), -ans, "부호를 반대로 붙였어요"), A(N(signErr), signErr, plus ? "더하기를 빼기로 계산했어요" : "빼는 수의 부호를 바꾸지 않았어요"), A(N(Math.abs(a) + Math.abs(b)), Math.abs(a) + Math.abs(b), "절댓값끼리 더하기만 했어요"), A(N(ans + 2), ans + 2, "계산 실수")],
        tip: plus ? "부호가 같으면 더하고, 다르면 큰 절댓값에서 작은 절댓값을 빼요" : "빼기는 빼는 수의 부호를 바꿔서 더하기로!",
        chk: { js: `(${a})${plus ? "+" : "-"}(${b})` },
      });
    }
    if (t === 2) {
      const a = R(1, 9) * pick([1, -1]), b = R(1, 9) * pick([1, -1]), c = R(1, 6) * pick([1, -1]);
      ok((a * b) % c === 0);
      const ans = (a * b) / c;
      return mk({
        q: `${PS(a)} × ${PS(b)} ÷ ${PS(c)} = ?`, a: A(N(ans), ans),
        w: [A(N(-ans), -ans, "음수의 개수로 부호를 정해요 (짝수 개면 +, 홀수 개면 −)"), A(N(a * b * c), a * b * c, "나누기를 곱하기로 했어요"), A(N(ans + (ans > 0 ? 1 : -1)), ans + (ans > 0 ? 1 : -1), "계산 실수")],
        tip: "부호를 먼저 정하고, 절댓값끼리 계산해요", chk: { js: `(${a})*(${b})/(${c})` },
      });
    }
    const kind = R(1, 3);
    if (kind === 1) {
      const a = R(2, 5), b = R(2, 6), c = R(2, 6);
      const ans = a * a + b * c, w1 = -a * a + b * c, w2 = a * a - b * c;
      return mk({
        q: `(${M}${a})² ${M} ${b} × (${M}${c}) = ?`, a: A(N(ans), ans),
        w: [A(N(w1), w1, "(−a)²은 양수예요"), A(N(w2), w2, "음수를 빼면 더하기가 돼요"), A(N((a * a - b) * -c), (a * a - b) * -c, "곱셈보다 뺄셈을 먼저 했어요")],
        tip: `(−${a})² = ${a * a}, ${b} × (−${c}) = −${b * c}`, chk: { js: `(-${a})**2-${b}*(-${c})` },
      });
    }
    if (kind === 2) {
      const a = R(2, 5), b = R(2, 3), c = pick([2, 4]); ok((b ** 3) % c === 0);
      const ans = -(a * a) - (b ** 3) / c, w1 = a * a - (b ** 3) / c, w2 = -(a * a) + (b ** 3) / c;
      return mk({
        q: `${M}${a}² + (${M}${b})³ ÷ ${c} = ?`, a: A(N(ans), ans),
        w: [A(N(w1), w1, "−a²은 −(a²)이에요. 괄호가 없으면 음수가 아니에요"), A(N(w2), w2, "(−b)³은 음수예요 (홀수 번 곱)"), A(N(ans + 2), ans + 2, "계산 실수")],
        tip: `−${a}² = −${a * a}, (−${b})³ = −${b ** 3}`, chk: { js: `-(${a}**2)+(-${b})**3/${c}` },
      });
    }
    const a = R(2, 9), b = R(1, 9), c = R(2, 20);
    const inner = -a + b, ans = inner * inner - c;
    return mk({
      q: `{(${M}${a}) + ${b}}² ${M} ${c} = ?`, a: A(N(ans), ans),
      w: [A(N(-(inner * inner) - c), -(inner * inner) - c, "음수를 제곱하면 양수예요"), A(N(a * a + b * b - c), a * a + b * b - c, "각각 제곱해서 더했어요 (괄호 안을 먼저)"), A(N(ans + 2), ans + 2, "계산 실수")],
      tip: `괄호 안 먼저: −${a} + ${b} = ${N(inner)}`, chk: { js: `((-${a})+${b})**2-${c}` },
    });
  };

  U.m1_expr = (t) => {
    if (t === 1) {
      const a = R(2, 9) * pick([1, -1]), b = R(-9, 9), v = R(-6, -1) * (Math.random() < 0.7 ? 1 : -1);
      const ans = a * v + b;
      return mk({
        q: `x = ${N(v)}일 때, ${lin(a, b)}의 값은?`, a: A(N(ans), ans),
        w: [A(N(a * -v + b), a * -v + b, "음수를 넣을 때 괄호를 써서 부호를 지켜요"), A(N(a + v + b), a + v + b, "곱하지 않고 더했어요"), A(N(a * v - b), a * v - b, "상수항의 부호를 바꿨어요")],
        tip: `${N(a)} × ${P(v)} ${b >= 0 ? "+" : M} ${Math.abs(b)}`, chk: { js: `${a}*(${v})+(${b})` },
      });
    }
    if (t === 2) {
      const k = R(2, 5), a = R(1, 5), b = R(-6, 6) || 1, m = R(2, 5), c = R(1, 5), d = R(-6, 6) || 2;
      const X = k * a - m * c, K = k * b - m * d; ok(X !== 0);
      return mk({
        q: `${k}(${lin(a, b)}) ${M} ${m}(${lin(c, d)}) 을(를) 간단히 하면?`, a: A(lin(X, K)),
        w: [A(lin(X, k * b + m * d), undefined, "괄호 앞 −는 뒤의 항에도 곱해요"), A(lin(X, b - d), undefined, "상수항에도 곱해야 해요"), A(lin(k * a + m * c, K), undefined, "x항 부호 실수")],
        tip: "분배법칙으로 괄호를 풀고 동류항끼리 모아요", chk: { js: `${k}*(${a}*x+(${b}))-${m}*(${c}*x+(${d}))`, mode: "expr" },
      });
    }
    let p, q; do { p = R(2, 5); q = R(2, 6); } while (p === q);
    const a = R(1, 6), b = R(1, 6);
    const num = (X, K, D) => { const g = gcd(gcd(X, K), D); X /= g; K /= g; D /= g; return D === 1 ? lin(X, K) : "[" + lin(X, K) + "/" + D + "]"; };
    const X = q - p, K = q * a + p * b, D = p * q;
    return mk({
      q: `${"[x+" + a + "/" + p + "]"} ${M} ${"[x" + M + b + "/" + q + "]"} 을(를) 간단히 하면?`, a: A(num(X, K, D)),
      w: [A(num(X, q * a - p * b, D), undefined, "−(−b)는 +b예요. 뒤 분자의 부호를 모두 바꿔요"), A(num(X, a + b, D), undefined, "통분할 때 상수항에도 곱해야 해요"), A(num(q + p, K, D), undefined, "x항 부호 실수")],
      tip: `분모를 ${D}(으)로 통분해요`, chk: { js: `(x+${a})/${p}-(x-${b})/${q}`, mode: "expr" },
    });
  };

  const eqStr = (a, b, c, d) => `${lin(a, b)} = ${lin(c, d)}`;
  U.m1_eq = (t) => {
    const s = R(-9, 9);
    if (t === 1) {
      const a = R(2, 9) * pick([1, -1]), b = R(-12, 12) || 5, c = a * s + b;
      const w = [A(`x = ${N(-s)}`, -s, "부호 실수"), A(`x = ${N(s + 1)}`, s + 1, "계산 실수")];
      if ((c + b) % a === 0) w.unshift(A(`x = ${N((c + b) / a)}`, (c + b) / a, "이항할 때 부호를 바꿔요"));
      w.push(A(`x = ${N((c - b) * a)}`, (c - b) * a, "양변을 나누어야 하는데 곱했어요"));
      return mk({ q: `${lin(a, b)} = ${N(c)} 의 해는?`, a: A(`x = ${N(s)}`, s), w, tip: "상수항을 이항하고 x의 계수로 나눠요", chk: { eq: `${a}*x+(${b})==${c}` } });
    }
    if (t === 2) {
      const a = R(-9, 9), c = R(-9, 9); ok(a !== c && a !== 0 && c !== 0);
      const b = R(-12, 12), d = (a - c) * s + b;
      const w = [A(`x = ${N(-s)}`, -s, "부호 실수"), A(`x = ${N(s + 1)}`, s + 1, "계산 실수"), A(`x = ${N(s - 2)}`, s - 2, "계산 실수")];
      if ((d + b) % (a - c) === 0) w.unshift(A(`x = ${N((d + b) / (a - c))}`, (d + b) / (a - c), "이항할 때 상수항의 부호를 바꿔요"));
      if (a + c !== 0 && (d - b) % (a + c) === 0) w.unshift(A(`x = ${N((d - b) / (a + c))}`, (d - b) / (a + c), "x항을 이항할 때 부호를 바꿔요"));
      return mk({ q: `${eqStr(a, b, c, d)} 의 해는?`, a: A(`x = ${N(s)}`, s), w, tip: "x항은 왼쪽, 상수항은 오른쪽으로 이항해요", chk: { eq: `${a}*x+(${b})==${c}*x+(${d})` } });
    }
    if (Math.random() < 0.5) {
      // 소수 계수: 0.ax + 0.b = 0.cx + 0.d
      const a = R(1, 9), c = R(1, 9); ok(a !== c);
      const b = R(-20, 20), d = (a - c) * s + b; ok(Math.abs(d) < 100);
      const w = [A(`x = ${N(-s)}`, -s, "부호 실수"), A(`x = ${N(s * 10)}`, s * 10, "한쪽에만 10을 곱했어요"), A(`x = ${N(s + 1)}`, s + 1, "계산 실수")];
      const D = (v) => (v < 0 ? M : "") + dec(Math.abs(v), 1);
      const L = `${D(a)}x ${b < 0 ? M : "+"} ${D(Math.abs(b))}`, Rr = `${D(c)}x ${d < 0 ? M : "+"} ${D(Math.abs(d))}`;
      return mk({ q: `${L} = ${Rr} 의 해는?`.replace(/1x/g, (m, i, s0) => (/\d/.test(s0[i - 1] || "") ? m : "x")), a: A(`x = ${N(s)}`, s), w, tip: "양변에 10을 곱해 계수를 정수로 만들어요", chk: { eq: `${a / 10}*x+(${b / 10})==${c / 10}*x+(${d / 10})` } });
    }
    // 분수 계수: (x+p)/m = (x−q)/n
    let m, n; do { m = R(2, 5); n = R(2, 5); } while (m === n);
    for (let k = 0; k < 50; k++) {
      const p = R(1, 9);
      const num = n * (s + p); if (num % m !== 0) continue;
      const q = s - num / m; if (q <= 0 || q > 15) continue;
      const w = [A(`x = ${N(-s)}`, -s, "부호 실수"), A(`x = ${N(s + 1)}`, s + 1, "계산 실수")];
      if ((m * q + n * p) % (n - m) === 0 && n !== m) w.unshift(A(`x = ${N(-(m * q + n * p) / (n - m))}`, -(m * q + n * p) / (n - m), "분모를 없앨 때 반대쪽에 곱했어요"));
      if ((q + p) % 1 === 0) w.push(A(`x = ${N(-(p + q) / 2)}`, -(p + q) / 2, "분모를 그냥 지웠어요"));
      return mk({ q: `[x+${p}/${m}] = [x${M}${q}/${n}] 의 해는?`, a: A(`x = ${N(s)}`, s), w: w.filter((x) => Number.isInteger(x.v)), tip: `양변에 ${m * n}을(를) 곱해 분모를 없애요`, chk: { eq: `(x+${p})/${m}==(x-${q})/${n}` } });
    }
    RETRY();
  };

  const QUAD = ["제1사분면", "제2사분면", "제3사분면", "제4사분면"];
  const quadOf = (sx, sy) => (sx > 0 ? (sy > 0 ? 0 : 3) : sy > 0 ? 1 : 2);
  U.m1_func = (t) => {
    if (t === 1) {
      const a = R(2, 6) * pick([1, -1]), p = R(1, 5) * pick([1, -1]), q = a * p;
      return mk({
        q: `y가 x에 정비례하고, 그래프가 점 (${N(p)}, ${N(q)})을 지날 때 식은?`, a: A(`y = ${lin(a, 0)}`),
        w: [A(`y = ${lin(new F(1, a), 0)}`, undefined, "y ÷ x 가 아니라 x ÷ y 를 했어요"), A(`y = ${lin(-a, 0)}`, undefined, "부호 실수"), A(`y = ${p * q < 0 ? M : ""}[${Math.abs(p * q)}/x]`, undefined, "반비례 식을 썼어요")],
        tip: `y = ax 에 넣으면 ${N(q)} = a × ${P(p)}`, chk: { line: [[p, q]] },
      });
    }
    if (t === 2) {
      const p = R(1, 6) * pick([1, -1]), q = R(1, 6) * pick([1, -1]), a = p * q;
      const inv = (k) => `y = ${k < 0 ? M : ""}[${Math.abs(k)}/x]`;
      return mk({
        q: `y가 x에 반비례하고, 그래프가 점 (${N(p)}, ${N(q)})을 지날 때 식은?`, a: A(inv(a)),
        w: [A(inv(-a), undefined, "부호 실수 (a = xy)"), A(`y = ${lin(new F(q, p), 0)}`, undefined, "정비례 식을 썼어요"), Math.abs(q) !== Math.abs(p) ? A(inv(a < 0 ? -Math.abs(q / p) : Math.abs(q / p)).replace(/\[([\d.]+)\/x\]/, (m0, v) => (Number.isInteger(+v) ? m0 : null)) , undefined, "x ÷ y 로 구했어요") : null, A(inv(a + (a > 0 ? 1 : -1)), undefined, "계산 실수")].filter((x) => x && x.t && !x.t.includes("null")),
        tip: `y = a/x 에서 a = xy = ${N(p)} × ${P(q)} = ${N(a)}`,
      });
    }
    const sx = pick([1, -1]), sy = pick([1, -1]), Q = quadOf(sx, sy);
    const tr = [["(−a, −b)", -sx, -sy], ["(b, a)", sy, sx], ["(−b, a)", -sy, sx], ["(ab, a)", sx * sy, sx], ["(a, −b)", sx, -sy], ["(−a, b)", -sx, sy]];
    if (sx !== sy) tr.push(["(a − b, b)", sx, sy]);
    const [expr, tx, ty] = pick(tr), ans = quadOf(tx, ty);
    const w = QUAD.filter((_, i) => i !== ans).map((name, i0) => A(name, undefined, name === QUAD[Q] ? "원래 점의 사분면이에요. 바뀐 좌표의 부호를 봐요" : "a, b의 부호를 먼저 정하고 계산해요"));
    return mk({ q: `점 (a, b)가 ${QUAD[Q]} 위에 있을 때, 점 ${expr.replace(/−/g, M)}는 어느 사분면?`, a: A(QUAD[ans]), w: shuffle(w), tip: `a ${sx > 0 ? "> 0" : "< 0"}, b ${sy > 0 ? "> 0" : "< 0"}` });
  };

  const piStr = (f) => { f = F.of(f); if (f.isInt()) return (f.n === 1 ? "" : String(f.n)) + "π"; return "[" + f.n + "/" + f.d + "]π"; };
  U.m1_geo = (t) => {
    if (t === 1) {
      const n = R(5, 12), ans = 180 * (n - 2);
      return mk({
        q: `${["", "", "", "삼", "사", "오", "육", "칠", "팔", "구", "십", "십일", "십이"][n]}각형의 내각의 크기의 합은?`, a: A(C(ans) + "°", ans),
        w: [A(C(180 * (n - 3)) + "°", 180 * (n - 3), "나누어지는 삼각형은 (n−2)개예요"), A(C(180 * n) + "°", 180 * n, "삼각형 개수를 n개로 셌어요"), A("360°", 360, "외각의 크기의 합을 구했어요")],
        tip: `180° × (${n} − 2)`, chk: { js: `180*(${n}-2)` },
      });
    }
    if (t === 2) {
      const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]), ext = 360 / n, int = 180 - ext, askInt = Math.random() < 0.6;
      return mk({
        q: `정${n === 5 ? "오" : n === 6 ? "육" : n === 8 ? "팔" : n === 9 ? "구" : n === 10 ? "십" : n === 12 ? "십이" : n === 15 ? "십오" : n === 18 ? "십팔" : "이십"}각형의 한 ${askInt ? "내각" : "외각"}의 크기는?`, a: A((askInt ? int : ext) + "°", askInt ? int : ext),
        w: [A((askInt ? ext : int) + "°", askInt ? ext : int, askInt ? "외각을 구했어요" : "내각을 구했어요"), A(C(180 * (n - 2)) + "°", 180 * (n - 2), "내각의 합 전체를 구했어요"), A((askInt ? int + 10 : ext + 10) + "°", (askInt ? int : ext) + 10, "계산 실수")],
        tip: `한 외각 = 360° ÷ ${n} = ${ext}°, 한 내각 = 180° − ${ext}°`, chk: { js: String(askInt ? int : ext) },
      });
    }
    const r = R(2, 12), th = pick([30, 45, 60, 90, 120, 135, 150, 210, 240, 270]), arc = new F(2 * r * th, 360), area = new F(r * r * th, 360), askArc = Math.random() < 0.5;
    const ans = askArc ? arc : area, other = askArc ? area : arc;
    const dia = askArc ? arc.mul(2) : area.mul(4);
    return mk({
      q: `반지름 ${r}cm, 중심각 ${th}°인 부채꼴의 ${askArc ? "호의 길이" : "넓이"}는?`, a: A(piStr(ans) + (askArc ? " cm" : " cm²"), ans.val()),
      w: [A(piStr(other) + (askArc ? " cm" : " cm²"), other.val(), askArc ? "넓이 공식을 썼어요" : "호의 길이 공식을 썼어요"), A(piStr(dia) + (askArc ? " cm" : " cm²"), dia.val(), "반지름 대신 지름을 넣었어요"), A(piStr(ans.add(1)) + (askArc ? " cm" : " cm²"), ans.val() + 1, "계산 실수")],
      tip: askArc ? `2π × ${r} × ${th}/360` : `π × ${r}² × ${th}/360`, chk: { js: `${ans.val()}*Math.PI`, pi: true },
    });
  };

  const median = (arr) => { const s = arr.slice().sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const numStr = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10));
  U.m1_stat = (t) => {
    if (t === 1) {
      const n = pick([5, 7]); const arr = []; for (let i = 0; i < n; i++) arr.push(R(1, 30));
      const md = median(arr), unsorted = arr[(n - 1) / 2], mean = arr.reduce((a, b) => a + b, 0) / n;
      return mk({
        q: `자료 ${arr.join(", ")}의 중앙값은?`, a: A(String(md), md),
        w: [A(String(unsorted), unsorted, "크기 순으로 늘어놓지 않고 가운데 값을 골랐어요"), Number.isInteger(mean) ? A(String(mean), mean, "평균을 구했어요") : null, A(String(md + 1), md + 1, "가운데 값을 잘못 찾았어요"), A(String(Math.max(...arr)), Math.max(...arr), "가장 큰 값이에요")],
        tip: "작은 수부터 늘어놓고 한가운데 값을 찾아요", chk: { js: String(md) },
      });
    }
    if (t === 2) {
      if (Math.random() < 0.5) {
        const arr = []; for (let i = 0; i < 6; i++) arr.push(R(1, 30));
        const s = arr.slice().sort((a, b) => a - b), md = (s[2] + s[3]) / 2; ok(s[2] !== s[3]);
        return mk({
          q: `자료 ${arr.join(", ")}의 중앙값은?`, a: A(numStr(md), md),
          w: [A(String(s[2]), s[2], "자료가 짝수 개면 가운데 두 값의 평균이에요"), A(String(s[3]), s[3], "자료가 짝수 개면 가운데 두 값의 평균이에요"), A(numStr((arr[2] + arr[3]) / 2), (arr[2] + arr[3]) / 2, "크기 순으로 늘어놓지 않았어요")],
          tip: `늘어놓으면 ${s.join(", ")}`, chk: { js: String(md) },
        });
      }
      const mode = R(2, 9), others = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => x !== mode)).slice(0, 4);
      const arr = shuffle([mode, mode, mode, others[0], others[0], others[1], others[2], others[3]]);
      const md = median(arr);
      return mk({
        q: `자료 ${arr.join(", ")}의 최빈값은?`, a: A(String(mode), mode),
        w: [A(String(others[0]), others[0], "두 번째로 많이 나온 값이에요"), A(numStr(md), md, "중앙값을 구했어요"), A(String(3), 3, "가장 많이 나온 횟수를 썼어요 (값을 써요)")],
        tip: "가장 많이 나온 값이 최빈값이에요", chk: { js: String(mode) },
      });
    }
    const m = R(10, 20), known = [R(5, 25), R(5, 25), R(5, 25), R(5, 25)], x = 5 * m - known.reduce((a, b) => a + b, 0); ok(x > 0 && x <= 40);
    const all = known.concat([x]), md = median(all), mk4 = median(known);
    return mk({
      q: `자료 ${known.join(", ")}, x 의 평균이 ${m}일 때 중앙값은?`, a: A(numStr(md), md),
      w: [A(numStr(mk4), mk4, "x를 먼저 구해서 넣어야 해요"), A(String(x), x, "x의 값이에요. 중앙값을 구해요"), A(String(m), m, "평균을 썼어요"), A(numStr(md + 1), md + 1, "가운데 값을 잘못 찾았어요")],
      tip: `x = ${m}×5 − (${known.join("+")}) = ${x}`, chk: { js: String(md) },
    });
  };

  // ───────── 중학교 2학년 ─────────
  const dot = (s) => s.split("").map((ch) => ch + "̇").join("");
  const repStr = (intPart, nonRep, rep) => {
    if (rep.length === 1) return `${intPart}.${nonRep}${dot(rep)}`;
    return `${intPart}.${nonRep}${rep[0]}̇${rep.slice(1, -1)}${rep[rep.length - 1]}̇`;
  };
  const expand = (intPart, nonRep, rep) => `${intPart}.${nonRep}${rep.repeat(Math.ceil(6 / rep.length)).slice(0, 6)}…`;
  U.m2_repeat = (t) => {
    if (t === 1) {
      const two = Math.random() < 0.5;
      const rep = two ? String(R(10, 98)) : String(R(1, 8)); ok(!two || rep[0] !== rep[1]);
      const den = two ? 99 : 9, ans = new F(+rep, den);
      return mk({
        q: `순환소수 ${repStr(0, "", rep)} (= ${expand(0, "", rep)}) 를 기약분수로 나타내면?`, a: A(fr(ans), ans),
        w: [A(fr(new F(+rep, two ? 100 : 10)), new F(+rep, two ? 100 : 10), "끝나는 소수(유한소수)로 생각했어요"), A(fr(new F(+rep, two ? 9 : 99)), new F(+rep, two ? 9 : 99), "분모의 9의 개수 = 순환마디 숫자의 개수예요"), A(fr(new F(+rep, two ? 90 : 90)), new F(+rep, 90), "분모를 잘못 정했어요")],
        tip: `순환마디가 ${rep.length}자리 → 분모는 ${den}`, chk: { js: `${+rep}/${den}` },
      });
    }
    if (t === 2) {
      const a = R(1, 9), b = R(1, 8); ok(a !== b);
      const ans = new F(10 * a + b - a, 90);
      return mk({
        q: `순환소수 ${repStr(0, String(a), String(b))} (= ${expand(0, String(a), String(b))}) 를 기약분수로 나타내면?`, a: A(fr(ans), ans),
        w: [A(fr(new F(10 * a + b, 90)), new F(10 * a + b, 90), "순환하지 않는 부분을 빼지 않았어요"), A(fr(new F(10 * a + b - a, 99)), new F(10 * a + b - a, 99), "분모는 99가 아니라 90이에요"), A(fr(new F(10 * a + b, 99)), new F(10 * a + b, 99), "분모와 분자를 모두 잘못 정했어요")],
        tip: `(${a}${b} − ${a}) / 90`, chk: { js: `(${10 * a + b}-${a})/90` },
      });
    }
    const i = R(1, 3), r = String(R(10, 98)); ok(r[0] !== r[1]);
    const whole = +(String(i) + r), ans = new F(whole - i, 99);
    return mk({
      q: `순환소수 ${repStr(i, "", r)} (= ${expand(i, "", r)}) 를 분수로 나타내면?`, a: A(fr(ans, "improper"), ans),
      w: [A(fr(new F(whole, 99), "improper"), new F(whole, 99), "정수 부분을 빼지 않았어요"), A(fr(new F(whole - i, 90), "improper"), new F(whole - i, 90), "분모를 90으로 썼어요"), A(fr(new F(+r, 99).add(i * 10), "improper"), new F(+r, 99).add(i * 10), "정수 부분을 잘못 더했어요")],
      tip: `(${whole} − ${i}) / 99`, chk: { js: `(${whole}-${i})/99` },
    });
  };

  U.m2_exp = (t) => {
    if (t === 1) {
      const m = R(2, 6), n = R(2, 5), kind = R(1, 3);
      if (kind === 1) return mk({ q: `a${sup(m)} × a${sup(n)} = ?`, a: A("a" + sup(m + n)), w: [A("a" + sup(m * n), undefined, "곱셈에서는 지수끼리 더해요"), A("a" + sup(m + n + 1), undefined, "지수 계산 실수"), A("2a" + sup(m + n), undefined, "계수는 그대로 1이에요")].filter((x) => m * n !== m + n || x.m !== "곱셈에서는 지수끼리 더해요"), tip: "aᵐ × aⁿ = aᵐ⁺ⁿ" });
      if (kind === 2) return mk({ q: `(a${sup(m)})${sup(n)} = ?`, a: A("a" + sup(m * n)), w: [A("a" + sup(m + n), undefined, "거듭제곱의 거듭제곱은 지수끼리 곱해요"), A("a" + sup(m ** n), undefined, "지수를 거듭제곱했어요"), A("a" + sup(m * n + 1), undefined, "지수 계산 실수")], tip: "(aᵐ)ⁿ = aᵐⁿ" });
      const big = m + n;
      return mk({ q: `a${sup(big)} ÷ a${sup(n)} = ?`, a: A("a" + sup(m)), w: [big % n === 0 ? A("a" + sup(big / n), undefined, "나눗셈에서는 지수끼리 빼요") : null, A("a" + sup(big + n), undefined, "나눗셈에서는 지수끼리 빼요"), A("a" + sup(m + 1), undefined, "지수 계산 실수"), A("a" + sup(m - 1 > 0 ? m - 1 : m + 2), undefined, "지수 계산 실수")], tip: "aᵐ ÷ aⁿ = aᵐ⁻ⁿ (m > n)" });
    }
    if (t === 2) {
      const c = pick([2, 3, -2, -3]), a = R(1, 3), b = R(1, 3), n = pick([2, 3]);
      const ans = mono(c ** n, a * n, b * n);
      return mk({
        q: `(${mono(c, a, b)})${sup(n)} 을(를) 간단히 하면?`, a: A(ans),
        w: [A(mono(c * n, a * n, b * n), undefined, "계수도 거듭제곱해요"), A(mono(c ** n, a + n, b + n), undefined, "지수끼리 곱해요"), n % 2 === 0 ? A(mono(-(c ** n), a * n, b * n), undefined, "음수를 짝수 번 곱하면 양수예요") : A(mono(Math.abs(c) ** n, a * n, b * n), undefined, "음수를 홀수 번 곱하면 음수예요"), A(mono(c ** n, a * n, b), undefined, "모든 문자에 거듭제곱해요")],
        tip: "괄호 안의 계수와 모든 문자에 각각 거듭제곱해요", chk: { js: `(${c}*x**${a}*y**${b})**${n}`, mode: "expr" },
      });
    }
    const cb = R(2, 4), cc = R(2, 4), k = R(1, 3), ca = cb * cc * k;
    const bx = R(1, 2), by = R(1, 2), cy = R(1, 2), ax = bx + R(1, 3), ay = R(by + 1, by + 3);
    const ansC = (ca / cb) * cc, ax2 = ax - bx, ay2 = ay - by + cy;
    const wrongC = ca / (cb * cc), wy = ay - by - cy;
    return mk({
      q: `${mono(ca, ax, ay)} ÷ ${mono(cb, bx, by)} × ${mono(cc, 0, cy)} 을(를) 간단히 하면?`, a: A(mono(ansC, ax2, ay2)),
      w: [wy >= 0 ? A(mono(wrongC, ax2, wy), undefined, "곱셈을 먼저 했어요. 앞에서부터 차례로 계산해요") : null, A(mono(ansC, ax + bx, ay2), undefined, "나눗셈은 지수끼리 빼요"), A(mono(ca * cb * cc, ax2, ay2), undefined, "나누는 계수를 곱했어요"), A(mono(ansC, ax2, ay - by), undefined, "마지막에 곱하는 y를 빠뜨렸어요")],
      tip: "÷는 역수의 곱으로 바꿔서 앞에서부터 계산해요",
      chk: { js: `(${ca}*x**${ax}*y**${ay})/(${cb}*x**${bx}*y**${by})*(${cc}*y**${cy})`, mode: "expr" },
    });
  };

  U.m2_poly = (t) => {
    if (t === 1) {
      const a = R(1, 6), b = R(-6, 6) || 2, c = R(1, 6), d = R(-6, 6) || -3; ok(a !== c);
      const X = a - c, Y = b - d;
      const P2 = (x, y) => terms([{ c: x, s: "x" }, { c: y, s: "y" }]);
      return mk({
        q: `(${P2(a, b)}) ${M} (${P2(c, d)}) 을(를) 간단히 하면?`, a: A(P2(X, Y)),
        w: [A(P2(X, b + d), undefined, "괄호 앞 −는 괄호 안 모든 항에 곱해요"), A(P2(a + c, Y), undefined, "x항 부호 실수"), A(P2(X, -Y), undefined, "y항 부호 실수")],
        tip: "괄호를 풀 때 앞이 −면 부호를 모두 바꿔요", chk: { js: `(${a}*x+(${b})*y)-(${c}*x+(${d})*y)`, mode: "expr" },
      });
    }
    if (t === 2) {
      const a = R(1, 4), b = R(1, 5), c = R(-6, 6) || 1, d = R(1, 4), e = R(1, 5), f = R(-6, 6) || 2;
      const X2 = a * b - d * e, X1 = a * c - d * f; ok(X2 !== 0);
      const Pq = (p, q) => terms([{ c: p, s: "x²" }, { c: q, s: "x" }]);
      return mk({
        q: `${a === 1 ? "" : a}x(${lin(b, c)}) ${M} ${d === 1 ? "" : d}x(${lin(e, f)}) 을(를) 간단히 하면?`, a: A(Pq(X2, X1)),
        w: [A(Pq(X2, a * c + d * f), undefined, "괄호 앞 −는 뒤의 항에도 곱해요"), A(Pq(a * b + d * e, X1), undefined, "x²항 부호 실수"), A(Pq(X2, c - f), undefined, "상수항에도 x를 곱해야 해요")],
        tip: "분배법칙: 괄호 안 모든 항에 곱해요", chk: { js: `${a}*x*(${b}*x+(${c}))-${d}*x*(${e}*x+(${f}))`, mode: "expr" },
      });
    }
    const c = R(2, 5), p = R(1, 5) * pick([1, -1]), q = R(1, 5) * pick([1, -1]);
    const Pq = (u, v) => terms([{ c: u, s: "x" }, { c: v, s: "y" }]);
    return mk({
      q: `(${terms([{ c: c * p, s: "x²y" }, { c: c * q, s: "xy²" }])}) ÷ ${c}xy 을(를) 간단히 하면?`, a: A(Pq(p, q)),
      w: [A(terms([{ c: p, s: "x" }, { c: c * q, s: "xy²" }]), undefined, "두 번째 항도 나눠요"), A(terms([{ c: p, s: "x²" }, { c: q, s: "y²" }]), undefined, "나눗셈은 지수끼리 빼요"), A(Pq(p * c * c, q * c * c), undefined, "계수를 곱했어요")],
      tip: "각 항을 따로따로 나눠요", chk: { js: `(${c * p}*x**2*y+(${c * q})*x*y**2)/(${c}*x*y)`, mode: "expr" },
    });
  };

  const OPS = [">", "<", "≥", "≤"];
  const flip = (op) => ({ ">": "<", "<": ">", "≥": "≤", "≤": "≥" })[op];
  const jsOp = (op) => ({ ">": ">", "<": "<", "≥": ">=", "≤": "<=" })[op];
  U.m2_ineq = (t) => {
    const s = R(-8, 8), op = pick(OPS);
    if (t <= 2) {
      const a = (t === 1 ? 1 : -1) * R(2, 7), b = R(-10, 10), c = a * s + b;
      const ansOp = a > 0 ? op : flip(op);
      const w = [A(`x ${a > 0 ? flip(op) : op} ${N(s)}`, undefined, a > 0 ? "부등호 방향은 그대로예요" : "음수로 나누면 부등호 방향이 바뀌어요"), A(`x ${ansOp} ${N(-s)}`, undefined, "부호 실수")];
      if ((c + b) % a === 0 && (c + b) / a !== s) w.unshift(A(`x ${ansOp} ${N((c + b) / a)}`, undefined, "이항할 때 부호를 바꿔요"));
      return mk({ q: `${lin(a, b)} ${op} ${N(c)} 을(를) 풀면?`, a: A(`x ${ansOp} ${N(s)}`), w, tip: a > 0 ? "이항하고 양수로 나누면 방향 그대로" : "음수로 나누면 부등호 방향을 바꿔요!", chk: { ineq: `${a}*x+(${b}) ${jsOp(op)} ${c}` } });
    }
    const k = R(2, 4), p = R(-5, 5), m = R(-6, 6); ok(k - m !== 0);
    const q = (k - m) * s + k * p; // k(x+p) op mx+q ⇔ (k−m)x op q−kp, 해가 x op' s 가 되게
    const a = k - m, ansOp = a > 0 ? op : flip(op);
    return mk({
      q: `${k}(${lin(1, p)}) ${op} ${lin(m, q)} 을(를) 풀면?`, a: A(`x ${ansOp} ${N(s)}`),
      w: [A(`x ${flip(ansOp)} ${N(s)}`, undefined, a < 0 ? "x의 계수가 음수면 나눌 때 방향이 바뀌어요" : "부등호 방향은 그대로예요"), A(`x ${ansOp} ${N(-s)}`, undefined, "부호 실수"), A(`x ${ansOp} ${N(s + 1)}`, undefined, "괄호를 풀 때 상수에도 곱해요")],
      tip: "괄호를 풀고, x항은 왼쪽, 상수항은 오른쪽", chk: { ineq: `${k}*(x+(${p})) ${jsOp(op)} ${m}*x+(${q})` },
    });
  };

  const xy = (a, b) => terms([{ c: a, s: "x" }, { c: b, s: "y" }]);
  U.m2_sys = (t) => {
    const x = R(-6, 6), y = R(-6, 6); ok(x !== y);
    const sol = (p, q) => `x = ${N(p)}, y = ${N(q)}`;
    let e1, e2, js, fit;
    if (t === 1) {
      e1 = `x + y = ${N(x + y)}`; e2 = `x ${M} y = ${N(x - y)}`; js = [`x+y==${x + y}`, `x-y==${x - y}`]; fit = (p, q) => p + q === x + y && p - q === x - y;
    } else if (t === 2) {
      const a = R(1, 5), b = R(-5, 5), c = R(1, 5), d = R(-5, 5); ok(b !== 0 && d !== 0 && a * d - b * c !== 0);
      e1 = `${xy(a, b)} = ${N(a * x + b * y)}`; e2 = `${xy(c, d)} = ${N(c * x + d * y)}`; js = [`${a}*x+(${b})*y==${a * x + b * y}`, `${c}*x+(${d})*y==${c * x + d * y}`]; fit = (p, q) => a * p + b * q === a * x + b * y && c * p + d * q === c * x + d * y;
    } else {
      const m = R(-4, 4) || 2, k = y - m * x, a = R(1, 5), b = R(1, 5);
      e1 = `y = ${lin(m, k)}`; e2 = `${xy(a, b)} = ${N(a * x + b * y)}`; js = [`y==${m}*x+(${k})`, `${a}*x+(${b})*y==${a * x + b * y}`]; fit = (p, q) => q === m * p + k && a * p + b * q === a * x + b * y;
    }
    return mk({
      q: `연립방정식 ${e1} , ${e2} 의 해는?`, a: A(sol(x, y)),
      w: [[y, x, "x와 y의 값을 바꿔 썼어요"], [x, -y, "y를 구할 때 부호 실수"], [-x, y, "x를 구할 때 부호 실수"], [x, y + 1, "대입 계산 실수"], [x + 1, y, "대입 계산 실수"]].filter(([p, q]) => !fit(p, q)).map(([p, q, msg]) => A(sol(p, q), undefined, msg)),
      tip: t === 3 ? "y = … 를 다른 식에 대입해요" : "한 문자의 계수를 맞춰서 더하거나 빼요", chk: { sys: js },
    });
  };

  U.m2_linfn = (t) => {
    if (t === 1) {
      const a = pick([R(1, 6), -R(1, 6), new F(R(1, 4) * pick([1, -1]), pick([2, 3]))]), b = R(-9, 9) || 4, askSlope = Math.random() < 0.5;
      const A1 = fr(a, "improper"), B1 = N(b);
      return mk({
        q: `일차함수 y = ${lin(a, b)} 의 그래프의 ${askSlope ? "기울기" : "y절편"}는?`, a: A(askSlope ? A1 : B1),
        w: [A(askSlope ? B1 : A1, undefined, "기울기와 y절편을 바꿨어요 (y = ax + b 에서 기울기 a, y절편 b)"), A(askSlope ? fr(F.of(a).mul(-1), "improper") : N(-b), undefined, "부호까지 그대로 써요"), A(askSlope ? fr(new F(1).div(F.of(a)), "improper") : N(b + 1), undefined, askSlope ? "기울기를 뒤집었어요" : "계산 실수")],
        tip: "y = ax + b → 기울기 a, y절편 b",
      });
    }
    if (t === 2) {
      if (Math.random() < 0.5) {
        const a = R(1, 6) * pick([1, -1]), b = R(-12, 12); ok(b !== 0);
        const xi = new F(-b, a);
        return mk({
          q: `일차함수 y = ${lin(a, b)} 의 그래프의 x절편은?`, a: A(fr(xi, "improper"), xi),
          w: [A(N(b), b, "y절편을 구했어요 (x절편은 y = 0일 때)"), A(fr(xi.mul(-1), "improper"), xi.mul(-1), "이항할 때 부호를 바꿔요"), A(fr(new F(a, -b), "improper"), new F(a, -b), "나눗셈을 거꾸로 했어요")],
          tip: `y = 0 을 넣으면 ${lin(a, b)} = 0`, chk: { js: `${-b}/${a}` },
        });
      }
      const x1 = R(-5, 5), y1 = R(-5, 5), x2 = R(-5, 5), y2 = R(-5, 5); ok(x1 !== x2 && y1 !== y2);
      const s = new F(y2 - y1, x2 - x1);
      return mk({
        q: `두 점 (${N(x1)}, ${N(y1)}), (${N(x2)}, ${N(y2)})를 지나는 직선의 기울기는?`, a: A(fr(s, "improper"), s),
        w: [A(fr(new F(x2 - x1, y2 - y1), "improper"), new F(x2 - x1, y2 - y1), "x의 증가량을 y의 증가량으로 나눴어요 (거꾸로)"), A(fr(s.mul(-1), "improper"), s.mul(-1), "빼는 순서를 섞었어요"), A(fr(new F(y2 + y1, x2 + x1 || 1), "improper"), new F(y2 + y1, x2 + x1 || 1), "빼지 않고 더했어요")],
        tip: "기울기 = (y의 증가량) ÷ (x의 증가량)", chk: { js: `(${y2}-(${y1}))/(${x2}-(${x1}))` },
      });
    }
    const m = R(-4, 4), x1 = R(-4, 4), x2 = x1 + R(1, 3); ok(m !== 0);
    const k = R(-6, 6), y1 = m * x1 + k, y2 = m * x2 + k;
    return mk({
      q: `두 점 (${N(x1)}, ${N(y1)}), (${N(x2)}, ${N(y2)})를 지나는 직선의 식은?`, a: A(`y = ${lin(m, k)}`),
      w: [A(`y = ${lin(m, y1 + m * x1)}`, undefined, "y절편을 구할 때 부호 실수"), A(`y = ${lin(new F(1, m), k)}`, undefined, "기울기를 거꾸로 구했어요"), A(`y = ${lin(-m, k)}`, undefined, "기울기 부호 실수"), A(`y = ${lin(m, k + 1)}`, undefined, "계산 실수")],
      tip: `기울기 ${N(m)} 를 구하고, 한 점을 대입해 y절편을 구해요`, chk: { line: [[x1, y1], [x2, y2]] },
    });
  };

  const DICE = (k) => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === k) c++; return c; };
  const DICE_U = (k) => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) if (a + b === k) c++; return c; };
  U.m2_prob = (t) => {
    if (t === 1) {
      const k = R(3, 11), c = DICE(k), u = DICE_U(k); ok(c !== u);
      return mk({
        q: `서로 다른 주사위 2개를 던질 때, 나온 눈의 합이 ${k}인 경우의 수는?`, a: A(c + "가지", c),
        w: [A(u + "가지", u, "(1, 2)와 (2, 1)은 다른 경우예요"), A(c + 1 + "가지", c + 1, "같은 경우를 두 번 셌어요"), A(c - 1 + "가지", c - 1, "빠뜨린 경우가 있어요"), A("36가지", 36, "모든 경우의 수예요")],
        tip: "(첫째 눈, 둘째 눈) 순서쌍으로 모두 써 봐요", chk: { js: String(c) },
      });
    }
    if (t === 2) {
      if (Math.random() < 0.5) {
        const k = R(3, 11), c = DICE(k), u = DICE_U(k), p = new F(c, 36);
        return mk({
          q: `서로 다른 주사위 2개를 던질 때, 눈의 합이 ${k}일 확률은?`, a: A(fr(p), p),
          w: [c !== u ? A(fr(new F(u, 36)), new F(u, 36), "순서가 다른 경우도 따로 세요") : null, A(fr(new F(1, 11)), new F(1, 11), "합이 될 수 있는 수(2~12)로 나눴어요"), A(fr(new F(c, 12)), new F(c, 12), "모든 경우의 수는 6 × 6 = 36이에요"), A(fr(new F(c + 1, 36)), new F(c + 1, 36), "경우를 잘못 셌어요")],
          tip: `합이 ${k}인 경우 ${c}가지 ÷ 36`, chk: { js: `${c}/36` },
        });
      }
      const n = pick([10, 12, 15, 20, 30]), m = pick([2, 3, 4, 5]); ok(m < n);
      const c = Math.floor(n / m), p = new F(c, n);
      return mk({
        q: `1부터 ${n}까지 쓰인 카드 중 한 장을 뽑을 때, ${m}의 배수가 나올 확률은?`, a: A(fr(p), p),
        w: [A(fr(new F(1, m)), new F(1, m), c * m !== n ? "배수의 개수를 직접 세어 봐요" : null), A(fr(new F(n - c, n)), new F(n - c, n), `${m}의 배수가 아닐 확률이에요`), A(fr(new F(c - 1, n)), new F(c - 1, n), "배수를 하나 빠뜨렸어요"), A(fr(new F(c + 1, n)), new F(c + 1, n), "배수를 하나 더 셌어요")].filter((x) => x.m !== null),
        tip: `${m}의 배수는 ${c}개`, chk: { js: `${c}/${n}` },
      });
    }
    const kind = R(1, 3);
    if (kind <= 2) {
      const n = R(4, 9), ordered = kind === 1;
      const ans = ordered ? n * (n - 1) : n * (n - 1) / 2;
      return mk({
        q: ordered ? `${n}명 중에서 회장 1명, 부회장 1명을 뽑는 경우의 수는?` : `${n}명 중에서 대표 2명을 뽑는 경우의 수는?`, a: A(ans + "가지", ans),
        w: [A((ordered ? n * (n - 1) / 2 : n * (n - 1)) + "가지", ordered ? n * (n - 1) / 2 : n * (n - 1), ordered ? "회장·부회장은 순서(역할)가 있어요" : "대표 2명은 순서가 없어요 (2로 나눠요)"), A(n * n + "가지", n * n, "같은 사람을 두 번 뽑을 수 없어요"), A(n * 2 + "가지", n * 2, "곱셈 대신 덧셈을 했어요")],
        tip: ordered ? `${n} × ${n - 1}` : `${n} × ${n - 1} ÷ 2`, chk: { js: String(ans) },
      });
    }
    const k = pick([2, 3, 4]), p = new F(2 ** k - 1, 2 ** k);
    return mk({
      q: `동전 ${k}개를 동시에 던질 때, 적어도 한 개는 앞면이 나올 확률은?`, a: A(fr(p), p),
      w: [A(fr(new F(1, 2 ** k)), new F(1, 2 ** k), "모두 뒷면일 확률이에요 (1에서 빼요)"), A(fr(new F(1, 2)), new F(1, 2), "동전 하나일 때의 확률이에요"), A(fr(new F(k, 2 ** k)), new F(k, 2 ** k), "앞면이 정확히 한 개일 때만 셌어요")],
      tip: "(적어도 한 개 앞면) = 1 − (모두 뒷면)", chk: { js: `1-1/${2 ** k}` },
    });
  };

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const sqrtStr = (n) => { // n의 제곱근을 a√b 꼴로
    let a = 1, b = n;
    for (let k = Math.floor(Math.sqrt(n)); k >= 2; k--) if (n % (k * k) === 0) { a = k; b = n / (k * k); break; }
    if (b === 1) return String(a);
    return (a === 1 ? "" : String(a)) + "√" + b;
  };
  U.m2_sim = (t) => {
    if (t <= 2) {
      const [p, q, r] = pick(TRIPLES), k = R(1, 3), a = p * k, b = q * k, c = r * k;
      if (t === 1) {
        return mk({
          q: `직각을 낀 두 변의 길이가 ${a}, ${b}인 직각삼각형의 빗변의 길이는?`, a: A(String(c), c),
          w: [A(String(a + b), a + b, "그냥 더했어요 (제곱해서 더한 뒤 제곱근)"), A(String(c * c), c * c, "제곱근을 구하지 않았어요"), A(sqrtStr(b * b - a * a), Math.sqrt(b * b - a * a), "빗변을 구할 땐 제곱을 더해요")],
          tip: `${a}² + ${b}² = ${c * c} = ${c}²`, chk: { js: String(c) },
        });
      }
      const leg = Math.random() < 0.5 ? a : b, other = leg === a ? b : a;
      return mk({
        q: `빗변의 길이가 ${c}, 다른 한 변의 길이가 ${leg}인 직각삼각형의 나머지 한 변의 길이는?`, a: A(String(other), other),
        w: [A(sqrtStr(c * c + leg * leg), Math.sqrt(c * c + leg * leg), "빗변을 구할 때처럼 더했어요 (빗변에서 빼요)"), A(String(c - leg), c - leg, "제곱하지 않고 뺐어요"), A(String(other * other), other * other, "제곱근을 구하지 않았어요")],
        tip: `${c}² − ${leg}² = ${other * other}`, chk: { js: String(other) },
      });
    }
    let m, n; do { m = R(1, 4); n = R(2, 5); } while (m >= n || gcd(m, n) !== 1);
    if (Math.random() < 0.5) {
      const vol = Math.random() < 0.5, e = vol ? 3 : 2;
      return mk({
        q: `닮음비가 ${m} : ${n}인 두 ${vol ? "입체도형의 부피" : "평면도형의 넓이"}의 비는?`, a: A(`${m ** e} : ${n ** e}`),
        w: [A(`${m} : ${n}`, undefined, vol ? "부피의 비는 닮음비의 세제곱이에요" : "넓이의 비는 닮음비의 제곱이에요"), A(`${m ** (5 - e)} : ${n ** (5 - e)}`, undefined, vol ? "세제곱이에요 (제곱은 넓이)" : "제곱이에요 (세제곱은 부피)"), A(`${m * e} : ${n * e}`, undefined, "곱하지 않고 거듭제곱해요")],
        tip: vol ? "부피비 = 닮음비³" : "넓이비 = 닮음비²",
      });
    }
    const k = R(1, 6), S = m * m * k, L = n * n * k;
    return mk({
      q: `닮음비가 ${m} : ${n}인 두 도형에서 작은 도형의 넓이가 ${S}cm²일 때 큰 도형의 넓이는?`, a: A(L + " cm²", L),
      w: [A(S * n / m + " cm²", S * n / m, "넓이는 닮음비가 아니라 닮음비의 제곱으로 커져요"), A(m === 1 ? null : S * n ** 3 / m ** 3 + " cm²", S * n ** 3 / m ** 3, "세제곱은 부피일 때예요"), A(n * n * S + " cm²", n * n * S, "비를 맞추지 않고 곱했어요"), A(L + n + " cm²", L + n, "계산 실수")].filter((x) => x.t && Number.isInteger(x.v)),
      tip: `넓이비 ${m * m} : ${n * n}`, chk: { js: String(L) },
    });
  };

  // ───────── 중학교 3학년 ─────────
  const SQF = [2, 3, 5, 6, 7];
  U.m3_sqrt = (t) => {
    if (t === 1) {
      const a = R(2, 6), b = pick(SQF), Nn = a * a * b;
      const w = [A(`${a * a}√${b}`, undefined, "근호 밖으로 꺼낼 때는 제곱근으로 꺼내요"), A(`${b}√${a}`, undefined, "근호 안과 밖을 바꿨어요"), A(`√${a * b}`, undefined, "근호 안에서 나누기만 했어요")];
      if (a === 4 || a === 6) { const s = a === 4 ? 2 : (Math.random() < 0.5 ? 2 : 3); w.unshift(A(`${s}√${Nn / (s * s)}`, undefined, "아직 근호 안에 제곱수가 남아 있어요")); }
      return mk({ q: `√${Nn} 을(를) a√b 꼴로 나타내면? (b는 가장 작은 자연수)`, a: A(`${a}√${b}`), w, tip: `${Nn} = ${a}² × ${b}`, chk: { js: `Math.sqrt(${Nn})`, mode: "expr", answerOnly: true } });
    }
    if (t === 2) {
      if (Math.random() < 0.5) {
        const b = pick(SQF), p = R(2, 7), q = R(1, 5), r = R(1, 4), ans = p + q - r; ok(ans !== 0 && ans !== 1);
        return mk({
          q: `${p}√${b} + ${q === 1 ? "" : q}√${b} ${M} ${r === 1 ? "" : r}√${b} = ?`, a: A(`${N(ans)}√${b}`),
          w: [A(`${p + q + r}√${b}`, undefined, "빼기를 더하기로 했어요"), A(`${N(ans)}√${3 * b}`, undefined, "근호 안의 수는 더하지 않아요"), A(`${N(ans + 1)}√${b}`, undefined, "계산 실수")],
          tip: "√ 부분이 같으면 앞의 수끼리 계산해요", chk: { js: `${p}*Math.sqrt(${b})+${q}*Math.sqrt(${b})-${r}*Math.sqrt(${b})`, mode: "expr" },
        });
      }
      const m = pick([2, 3, 5, 6]), n = pick([2, 3, 6, 8, 12, 15, 10, 18]); ok(m !== n);
      const ans = sqrtStr(m * n);
      return mk({
        q: `√${m} × √${n} = ?`, a: A(ans),
        w: [A(sqrtStr(m + n), undefined, "근호 안을 더했어요 (곱해요)"), sqrtStr(m * n) !== "√" + m * n && !Number.isInteger(Math.sqrt(m * n)) ? A("√" + m * n, undefined, "a√b 꼴로 간단히 해요") : null, A(String(m * n), undefined, "근호를 없애면 안 돼요"), A(sqrtStr(m * n * 4), undefined, "계산 실수")],
        tip: "√a × √b = √(ab)", chk: { js: `Math.sqrt(${m})*Math.sqrt(${n})`, mode: "expr", answerOnly: true },
      });
    }
    const b = pick([2, 3, 5, 6, 7]), k = b * R(1, 4) * (Math.random() < 0.6 ? 1 : 1);
    const coef = new F(k, b);
    const ans = coef.isInt() ? `${coef.n === 1 ? "" : coef.n}√${b}` : `[${coef.n === 1 ? "" : coef.n}√${b}/${coef.d}]`;
    return mk({
      q: `[${k}/√${b}] 의 분모를 유리화하면?`, a: A(ans),
      w: [A(`${k}√${b}`, undefined, "분자에만 √를 곱했어요 (분모도 √로 곱하면 나누기가 생겨요)"), A(`[${k}/${b}]`, undefined, "√를 빠뜨렸어요"), A(`[√${b}/${k}]`, undefined, "분모와 분자를 바꿨어요")],
      tip: `분모와 분자에 √${b}를 곱해요`, chk: { js: `${k}/Math.sqrt(${b})`, mode: "expr" },
    });
  };

  const fac = (a, b) => (a === 1 ? "" : a === -1 ? M : String(a)) + "x" + (b === 0 ? "" : (b > 0 ? "+" : M) + Math.abs(b));
  const quad = (a, b, c) => terms([{ c: a, s: "x²" }, { c: b, s: "x" }, { c: c, s: "" }]);
  U.m3_expand = (t) => {
    if (t === 1) {
      const a = R(1, 9) * pick([1, -1]);
      if (Math.random() < 0.5) {
        return mk({
          q: `(${fac(1, a)})² 을(를) 전개하면?`, a: A(quad(1, 2 * a, a * a)),
          w: [A(quad(1, 0, a * a), undefined, "가운데 2ab 항을 빠뜨렸어요"), A(quad(1, -2 * a, a * a), undefined, "가운데 항의 부호 실수"), A(quad(1, 2 * a, -a * a), undefined, "마지막 항은 제곱이라 항상 +예요"), A(quad(1, a, a * a), undefined, "가운데 항은 2배예요")],
          tip: "(a+b)² = a²+2ab+b²", chk: { js: `(x+(${a}))**2`, mode: "expr" },
        });
      }
      const b = Math.abs(a);
      return mk({
        q: `(${fac(1, b)})(${fac(1, -b)}) 을(를) 전개하면?`, a: A(quad(1, 0, -b * b)),
        w: [A(quad(1, 0, b * b), undefined, "(a+b)(a−b) = a² − b² 예요"), A(quad(1, -2 * b, b * b), undefined, "합차 공식이에요. 가운데 항이 없어져요"), A(quad(1, 0, -2 * b), undefined, "b를 제곱해요")],
        tip: "(a+b)(a−b) = a²−b²", chk: { js: `(x+${b})*(x-${b})`, mode: "expr" },
      });
    }
    if (t === 2) {
      if (Math.random() < 0.5) {
        const a = R(-9, 9) || 2, b = R(-9, 9) || -3; ok(a !== -b);
        return mk({
          q: `(${fac(1, a)})(${fac(1, b)}) 을(를) 전개하면?`, a: A(quad(1, a + b, a * b)),
          w: [A(quad(1, a * b, a + b), undefined, "x의 계수는 합, 상수항은 곱이에요"), A(quad(1, a + b, a + b), undefined, "상수항은 곱이에요"), A(quad(1, -(a + b), a * b), undefined, "가운데 항 부호 실수")],
          tip: "(x+a)(x+b) = x²+(a+b)x+ab", chk: { js: `(x+(${a}))*(x+(${b}))`, mode: "expr" },
        });
      }
      const p = R(2, 4), a = R(-6, 6) || 1, q = R(1, 4), b = R(-6, 6) || -1;
      return mk({
        q: `(${fac(p, a)})(${fac(q, b)}) 을(를) 전개하면?`, a: A(quad(p * q, p * b + q * a, a * b)),
        w: [A(quad(p * q, p * a + q * b, a * b), undefined, "가운데 항은 바깥끼리, 안쪽끼리 곱해서 더해요"), A(quad(p * q, 0, a * b), undefined, "가운데 항을 빠뜨렸어요"), A(quad(p + q, p * b + q * a, a * b), undefined, "x² 계수는 곱이에요")],
        tip: "(ax+b)(cx+d) = acx²+(ad+bc)x+bd", chk: { js: `(${p}*x+(${a}))*(${q}*x+(${b}))`, mode: "expr" },
      });
    }
    const a = R(1, 4), b = R(1, 5) * pick([1, -1]);
    const T = (p, q, r) => terms([{ c: p, s: "x²" }, { c: q, s: "xy" }, { c: r, s: "y²" }]);
    const L = terms([{ c: a, s: "x" }, { c: b, s: "y" }]);
    return mk({
      q: `(${L})² 을(를) 전개하면?`, a: A(T(a * a, 2 * a * b, b * b)),
      w: [A(T(a * a, 0, b * b), undefined, "가운데 2ab 항을 빠뜨렸어요"), A(T(a * a, a * b, b * b), undefined, "가운데 항은 2배예요"), A(T(a, 2 * a * b, b), undefined, "계수도 제곱해요"), A(T(a * a, -2 * a * b, b * b), undefined, "가운데 항 부호 실수")],
      tip: "(a+b)² = a²+2ab+b²", chk: { js: `(${a}*x+(${b})*y)**2`, mode: "expr" },
    });
  };

  U.m3_factor = (t) => {
    if (t === 1) {
      const a = R(1, 9);
      if (Math.random() < 0.5) {
        return mk({
          q: `x² ${M} ${a * a} 을(를) 인수분해하면?`, a: A(`(${fac(1, a)})(${fac(1, -a)})`),
          w: [A(`(${fac(1, -a)})²`, undefined, "a²−b² = (a+b)(a−b) 예요"), A(`(${fac(1, a)})²`, undefined, "제곱의 차예요"), A(`(${fac(1, a * a)})(${fac(1, -1)})`, undefined, "제곱근을 찾아요")],
          tip: "a² − b² = (a+b)(a−b)", chk: { js: `x**2-${a * a}`, mode: "expr" },
        });
      }
      const s = pick([1, -1]) * a;
      return mk({
        q: `${quad(1, 2 * s, a * a)} 을(를) 인수분해하면?`, a: A(`(${fac(1, s)})²`),
        w: [A(`(${fac(1, -s)})²`, undefined, "가운데 항의 부호를 보고 정해요"), A(`(${fac(1, a)})(${fac(1, -a)})`, undefined, "완전제곱식이에요"), A(`(${fac(1, 2 * s)})²`, undefined, "가운데 항의 절반이에요")],
        tip: "a² ± 2ab + b² = (a ± b)²", chk: { js: `x**2+(${2 * s})*x+${a * a}`, mode: "expr" },
      });
    }
    if (t === 2) {
      const r1 = R(-9, 9) || 2, r2 = R(-9, 9) || -5; ok(r1 !== r2 && r1 !== -r2);
      const w = [A(`(${fac(1, -r1)})(${fac(1, -r2)})`, undefined, "합과 곱의 부호를 확인해요")];
      const P0 = r1 * r2;
      for (const d of divisors(Math.abs(P0))) { const e = P0 / d; if (d !== r1 && d !== r2 && d + e !== r1 + r2) { w.push(A(`(${fac(1, d)})(${fac(1, e)})`, undefined, "곱은 맞지만 합이 x의 계수와 달라요")); break; } }
      w.push(A(`(${fac(1, r1)})(${fac(1, -r2)})`, undefined, "부호 실수"));
      return mk({ q: `${quad(1, r1 + r2, r1 * r2)} 을(를) 인수분해하면?`, a: A(`(${fac(1, r1)})(${fac(1, r2)})`), w, tip: `곱이 ${N(r1 * r2)}, 합이 ${N(r1 + r2)}인 두 수`, chk: { js: `x**2+(${r1 + r2})*x+(${r1 * r2})`, mode: "expr" } });
    }
    if (Math.random() < 0.5) {
      const k = R(2, 5), a = R(1, 6);
      return mk({
        q: `${k}x² ${M} ${k * a * a} 을(를) 인수분해하면?`, a: A(`${k}(${fac(1, a)})(${fac(1, -a)})`),
        w: [A(`${k}(${fac(1, -a)})²`, undefined, "공통인수로 묶고 제곱의 차로 인수분해해요"), A(`(${fac(k, a)})(${fac(1, -a)})`, undefined, "공통인수를 한쪽에만 곱했어요"), A(`${k}(x²${M}${a * a})`, undefined, "끝까지 인수분해해요")],
        tip: `${k}로 묶으면 ${k}(x² − ${a * a})`, chk: { js: `${k}*x**2-${k * a * a}`, mode: "expr", answerOnly: true },
      });
    }
    const p = pick([2, 3]), m = R(-6, 6) || 1, n = R(-6, 6) || -1; ok(gcd(p, Math.abs(m)) === 1);
    return mk({
      q: `${quad(p, p * n + m, m * n)} 을(를) 인수분해하면?`, a: A(`(${fac(p, m)})(${fac(1, n)})`),
      w: [A(`(${fac(p, n)})(${fac(1, m)})`, undefined, "대각선으로 곱해 더한 값이 x의 계수인지 확인해요"), A(`(${fac(p, -m)})(${fac(1, -n)})`, undefined, "부호 실수"), A(`(${fac(p, m)})(${fac(1, -n)})`, undefined, "부호 실수")],
      tip: "x² 계수와 상수항을 나눠서 엇갈려 곱해 봐요", chk: { js: `${p}*x**2+(${p * n + m})*x+(${m * n})`, mode: "expr" },
    });
  };

  const rootsStr = (a, b) => { const [p, q] = a <= b ? [a, b] : [b, a]; return p === q ? `x = ${N(p)} (중근)` : `x = ${N(p)} 또는 x = ${N(q)}`; };
  U.m3_quad = (t) => {
    if (t <= 2) {
      const r1 = R(-9, 9), r2 = R(-9, 9); ok(r1 !== r2 && r1 !== -r2);
      const q = t === 1 ? `(${fac(1, -r1)})(${fac(1, -r2)}) = 0 의 해는?` : `${quad(1, -(r1 + r2), r1 * r2)} = 0 의 해는?`;
      const w = [A(rootsStr(-r1, -r2), undefined, "x − a = 0 이면 x = a 예요 (부호를 바꿔요)"), A(rootsStr(r1, -r2), undefined, "한 근의 부호 실수"), A(rootsStr(-r1, r2), undefined, "한 근의 부호 실수")];
      return mk({ q, a: A(rootsStr(r1, r2)), w, tip: t === 1 ? "AB = 0 이면 A = 0 또는 B = 0" : "인수분해 후 각 인수가 0이 되는 x", chk: { roots: `x**2+(${-(r1 + r2)})*x+(${r1 * r2})` } });
    }
    const h = R(-5, 5), c = R(-9, 9), D4 = h * h - c; ok(D4 > 0 && !Number.isInteger(Math.sqrt(D4)) && D4 < 60);
    const b = 2 * h; // x² + 2hx + c = 0 → x = −h ± √(h²−c)
    const rs = (cen, rad) => `x = ${cen === 0 ? "" : N(cen) + " "}± ${sqrtStr(rad)}`.replace("= ± ", "= ±").replace(/x = (−?\d+) ± /, "x = $1 ± ");
    return mk({
      q: `${quad(1, b, c)} = 0 의 해는?`, a: A(rs(-h, D4)),
      w: [h !== 0 ? A(rs(h, D4), undefined, "−b/2a 의 부호 실수") : null, A(rs(-h, 4 * D4), undefined, "근의 공식에서 2a로 나누는 걸 잊었어요"), h * h + c > 0 ? A(rs(-h, h * h + c), undefined, "근호 안은 b² − 4ac 예요") : null, A(rs(-h, D4 + 1), undefined, "근호 안 계산 실수")].filter(Boolean),
      tip: "짝수 공식: x = −b' ± √(b'² − ac)", chk: { roots: `x**2+(${b})*x+(${c})` },
    });
  };

  const pt = (x, y) => `(${N(x)}, ${N(y)})`;
  U.m3_qfn = (t) => {
    if (t === 1) {
      const a = pick([1, 2, -1, -2, 3]), p = R(-6, 6), q = R(-9, 9); ok(p !== 0 && q !== 0 && p !== q);
      const sq = `(x${p > 0 ? M : "+"}${Math.abs(p)})²`;
      return mk({
        q: `y = ${a === 1 ? "" : a === -1 ? M : a}${sq} ${q > 0 ? "+" : M} ${Math.abs(q)} 의 꼭짓점의 좌표는?`, a: A(pt(p, q)),
        w: [A(pt(-p, q), undefined, "괄호 안 부호를 바꿔서 x좌표를 정해요"), A(pt(p, -q), undefined, "y좌표는 부호 그대로예요"), A(pt(q, p), undefined, "x, y 좌표를 바꿨어요")],
        tip: "y = a(x − p)² + q → 꼭짓점 (p, q)", chk: { vertex: `${a}*(x-(${p}))**2+(${q})`, p, q },
      });
    }
    const a = t === 2 ? 1 : pick([2, -2, 3, -1]), p = R(-5, 5), c = R(-9, 9); ok(p !== 0);
    const b = -2 * a * p, q = c - a * p * p;
    return mk({
      q: `y = ${quad(a, b, c)} 의 꼭짓점의 좌표는?`, a: A(pt(p, q)),
      w: [A(pt(-p, q), undefined, "x좌표 부호 실수 (x = −b/2a)"), A(pt(p, c), undefined, "상수항을 그대로 y좌표로 썼어요"), A(pt(p, c - p * p), undefined, a === 1 ? "완전제곱식으로 바꿀 때 계산 실수" : "a를 묶고 완전제곱식을 만들어요"), A(pt(p, q + 1), undefined, "계산 실수")],
      tip: "y = a(x − p)² + q 꼴로 바꿔요", chk: { vertex: `${a}*x**2+(${b})*x+(${c})`, p, q },
    });
  };

  const TRIG = [["sin 30°", "[1/2]", 0.5], ["sin 45°", "[√2/2]", Math.SQRT2 / 2], ["sin 60°", "[√3/2]", Math.sqrt(3) / 2], ["cos 30°", "[√3/2]", Math.sqrt(3) / 2], ["cos 45°", "[√2/2]", Math.SQRT2 / 2], ["cos 60°", "[1/2]", 0.5], ["tan 30°", "[√3/3]", Math.sqrt(3) / 3], ["tan 45°", "1", 1], ["tan 60°", "√3", Math.sqrt(3)]];
  U.m3_trig = (t) => {
    if (t === 1) {
      const [name, val, v] = pick(TRIG);
      const others = shuffle(TRIG.filter((x) => Math.abs(x[2] - v) > 1e-9));
      return mk({ q: `${name} 의 값은?`, a: A(val, v), w: others.map((x) => A(x[1], x[2], `${x[1]} 은(는) ${x[0]} 의 값이에요`)), tip: "30°·60°·90° 삼각형은 1 : √3 : 2, 45° 삼각형은 1 : 1 : √2", chk: { js: String(v), mode: "expr" } });
    }
    if (t === 2) {
      const [p, q, r] = pick(TRIPLES.slice(0, 4)), k = R(1, 2), BC = p * k, AC = q * k, AB = r * k;
      const which = pick(["sin", "cos", "tan"]);
      const val = { sin: new F(BC, AB), cos: new F(AC, AB), tan: new F(BC, AC) };
      const givens = which === "tan" ? `BC = ${BC}, AC = ${AC}` : `AB = ${AB}, BC = ${BC}`;
      const extra = which === "cos" ? `(AC = ${AC})` : "";
      return mk({
        q: `∠C = 90°인 직각삼각형 ABC에서 ${givens}${extra ? " " + extra : ""}일 때 ${which} A 의 값은?`, a: A(fr(val[which], "improper"), val[which]),
        w: ["sin", "cos", "tan"].filter((x) => x !== which).map((x) => A(fr(val[x], "improper"), val[x], `${x} A 를 구했어요 (sin=대변/빗변, cos=이웃변/빗변, tan=대변/이웃변)`)).concat([A(fr(new F(val[which].d, val[which].n), "improper"), new F(val[which].d, val[which].n), "분모와 분자를 바꿨어요")]),
        tip: "∠A의 대변은 BC, 이웃변은 AC, 빗변은 AB", chk: { js: `${val[which].n}/${val[which].d}` },
      });
    }
    const RT = [["sin 30°", new F(1, 2)], ["cos 60°", new F(1, 2)], ["tan 45°", new F(1)], ["sin 60° × cos 30°", new F(3, 4)], ["tan 60° × tan 30°", new F(1)], ["sin 45° × cos 45°", new F(1, 2)], ["cos 30° × tan 30°", new F(1, 2)], ["sin 60° × tan 60°", new F(3, 2)]];
    const x = pick(RT.slice(0, 3)), y = pick(RT.slice(3)), op = pick(["+", M]);
    const ans = op === "+" ? x[1].add(y[1]) : x[1].sub(y[1]);
    return mk({
      q: `${x[0]} ${op} ${y[0]} 의 값은?`, a: A(fr(ans, "improper"), ans),
      w: [A(fr(op === "+" ? x[1].sub(y[1]) : x[1].add(y[1]), "improper"), op === "+" ? x[1].sub(y[1]) : x[1].add(y[1]), "계산 기호를 다시 봐요"), A(fr(ans.add(new F(1, 2)), "improper"), ans.add(new F(1, 2)), "삼각비 값을 하나 잘못 넣었어요"), A(fr(ans.sub(new F(1, 4)), "improper"), ans.sub(new F(1, 4)), "√3 × √3 = 3 이에요")],
      tip: "각 삼각비 값을 먼저 넣고 계산해요", chk: { js: `${ans.n}/${ans.d}` },
    });
  };

  U.m3_circle = (t) => {
    if (t === 1) {
      const c = R(4, 80) * 2;
      return mk({ q: `한 호에 대한 중심각이 ${c}°일 때, 같은 호에 대한 원주각은?`, a: A(c / 2 + "°", c / 2), w: [A(c * 2 + "°", c * 2, "원주각은 중심각의 절반이에요"), A(c + "°", c, "원주각은 중심각의 절반이에요"), A(180 - c / 2 + "°", 180 - c / 2, "180°에서 뺄 필요 없어요")], tip: "원주각 = 중심각 × 1/2", chk: { js: String(c / 2) } });
    }
    if (t === 2) {
      const a = R(20, 80);
      if (Math.random() < 0.5) return mk({ q: `한 호에 대한 원주각이 ${a}°일 때, 같은 호에 대한 중심각은?`, a: A(2 * a + "°", 2 * a), w: [A(a / 2 + "°", a / 2, "중심각은 원주각의 2배예요"), A(a + "°", a, "같은 호의 원주각끼리만 크기가 같아요"), A(180 - a + "°", 180 - a, "내접사각형의 대각이 아니에요")].filter((x) => Number.isInteger(x.v)).concat([A(2 * a + 10 + "°", 2 * a + 10, "계산 실수")]), tip: "중심각 = 원주각 × 2", chk: { js: String(2 * a) } });
      return mk({ q: `반원에 대한 원주각에서 한 각이 ${a}°인 삼각형의 나머지 예각은? (지름이 한 변)`, a: A(90 - a + "°", 90 - a), w: [A(180 - a + "°", 180 - a, "반원의 원주각은 90°예요"), A(a + "°", a, "두 예각은 서로 같지 않아요"), A(180 - 2 * a + "°", 180 - 2 * a, "이등변삼각형이 아니에요")], tip: "지름에 대한 원주각은 90° → 180° − 90° − ${a}°".replace("${a}", a), chk: { js: String(90 - a) } });
    }
    const a = R(55, 125);
    return mk({ q: `원에 내접하는 사각형 ABCD에서 ∠A = ${a}°일 때 ∠C의 크기는?`, a: A(180 - a + "°", 180 - a), w: [A(a + "°", a, "마주 보는 두 각의 합이 180°예요"), A(360 - a + "°", 360 - a, "마주 보는 두 각의 합은 360°가 아니라 180°예요"), A(90 - a > 0 ? 90 - a + "°" : 270 - a + "°", 90 - a > 0 ? 90 - a : 270 - a, "계산 실수")], tip: "원에 내접하는 사각형: 대각의 합 = 180°", chk: { js: String(180 - a) } });
  };

  U.m3_stat = (t) => {
    const n = 5, m = R(5, 15);
    const devs = []; let s = 0; for (let i = 0; i < n - 1; i++) { const d = R(-4, 4); devs.push(d); s += d; }
    devs.push(-s); ok(Math.abs(s) <= 6);
    const data = devs.map((d) => m + d);
    if (t === 1) {
      const i = R(0, n - 1), d = devs[i]; ok(d !== 0);
      return mk({ q: `자료 ${data.join(", ")}의 평균이 ${m}일 때, ${data[i]}의 편차는?`, a: A(N(d), d), w: [A(N(-d), -d, "편차 = 변량 − 평균 이에요 (순서 주의)"), A(String(data[i]), data[i], "변량을 그대로 썼어요"), A(N(d + (d > 0 ? 1 : -1)), d + (d > 0 ? 1 : -1), "계산 실수")], tip: `${data[i]} − ${m}`, chk: { js: String(d) } });
    }
    if (t === 2) {
      const shown = devs.slice(0, 4), last = devs[4];
      return mk({ q: `어떤 자료의 편차가 ${shown.map(N).join(", ")}, x 일 때 x의 값은?`, a: A(N(last), last), w: [A(N(-last), -last, "편차의 합이 0이 되도록 해요"), last !== 0 ? A("0", 0, "편차의 합이 0이지, x가 0인 건 아니에요") : A("1", 1, "편차의 합은 0이에요"), A(N(last + 1), last + 1, "계산 실수")], tip: "편차의 합은 항상 0", chk: { js: String(last) } });
    }
    const sq = devs.reduce((a, d) => a + d * d, 0), varF = new F(sq, n), ab = devs.reduce((a, d) => a + Math.abs(d), 0);
    ok(sq > 0);
    const show = (f) => (f.isInt() ? String(f.n) : dec(f.n * (10 / f.d), 1));
    const askSd = varF.isInt() && Number.isInteger(Math.sqrt(varF.n)) && Math.random() < 0.6;
    if (askSd) {
      const sd = Math.sqrt(varF.n);
      return mk({ q: `자료 ${data.join(", ")}의 표준편차는? (평균 ${m})`, a: A(String(sd), sd), w: [A(String(varF.n), varF.n, "분산을 구했어요 (표준편차는 분산의 제곱근)"), A(show(new F(ab, n)), ab / n, "편차를 제곱하지 않았어요"), A(String(sq), sq, "자료의 개수로 나누지 않았어요")], tip: `분산 = (${devs.map((d) => P(d) + "²").join("+")}) ÷ ${n}`, chk: { js: String(sd) } });
    }
    return mk({ q: `자료 ${data.join(", ")}의 분산은? (평균 ${m})`, a: A(show(varF), varF.val()), w: [A(String(sq), sq, "자료의 개수로 나누지 않았어요"), A(show(new F(ab, n)), ab / n, "편차를 제곱해서 평균을 내요"), A("0", 0, "편차의 합이 0이에요. 분산은 편차의 제곱의 평균")], tip: `(${devs.map((d) => P(d) + "²").join("+")}) ÷ ${n}`, chk: { js: String(varF.val()) } });
  };

  // ───────── 단원 목록 ─────────
  // g: 학기 / name: 단원 이름 / calc: 연산 위주 단원(실수 잡기 연습에 들어가요)
  const UNITS = [
    { id: "e4_big", g: "4-1", name: "큰 수" },
    { id: "e4_angle", g: "4-1", name: "각도" },
    { id: "e4_mul", g: "4-1", name: "곱셈", calc: true },
    { id: "e4_div", g: "4-1", name: "나눗셈", calc: true },
    { id: "e4_frac", g: "4-2", name: "분수의 덧셈과 뺄셈", calc: true },
    { id: "e4_dec", g: "4-2", name: "소수의 덧셈과 뺄셈", calc: true },
    { id: "e4_poly", g: "4-2", name: "다각형" },
    { id: "e5_mix", g: "5-1", name: "자연수의 혼합 계산", calc: true },
    { id: "e5_gcd", g: "5-1", name: "약수와 배수" },
    { id: "e5_reduce", g: "5-1", name: "약분과 통분" },
    { id: "e5_fracadd", g: "5-1", name: "분수의 덧셈과 뺄셈", calc: true },
    { id: "e5_area", g: "5-1", name: "다각형의 둘레와 넓이" },
    { id: "e5_round", g: "5-2", name: "수의 범위와 어림하기" },
    { id: "e5_fracmul", g: "5-2", name: "분수의 곱셈", calc: true },
    { id: "e5_decmul", g: "5-2", name: "소수의 곱셈", calc: true },
    { id: "e5_avg", g: "5-2", name: "평균" },
    { id: "e6_fracdiv", g: "6-1", name: "분수의 나눗셈", calc: true },
    { id: "e6_decdiv", g: "6-1", name: "소수의 나눗셈", calc: true },
    { id: "e6_ratio", g: "6-1", name: "비와 비율" },
    { id: "e6_volume", g: "6-1", name: "직육면체의 부피와 겉넓이" },
    { id: "e6_prop", g: "6-2", name: "비례식과 비례배분" },
    { id: "e6_circle", g: "6-2", name: "원의 둘레와 넓이" },
    { id: "m1_prime", g: "중1", name: "소인수분해" },
    { id: "m1_int", g: "중1", name: "정수와 유리수", calc: true },
    { id: "m1_expr", g: "중1", name: "문자의 사용과 식", calc: true },
    { id: "m1_eq", g: "중1", name: "일차방정식", calc: true },
    { id: "m1_func", g: "중1", name: "좌표평면과 그래프" },
    { id: "m1_geo", g: "중1", name: "다각형과 부채꼴" },
    { id: "m1_stat", g: "중1", name: "대푯값" },
    { id: "m2_repeat", g: "중2", name: "유리수와 순환소수" },
    { id: "m2_exp", g: "중2", name: "지수법칙과 단항식", calc: true },
    { id: "m2_poly", g: "중2", name: "다항식의 계산", calc: true },
    { id: "m2_ineq", g: "중2", name: "일차부등식", calc: true },
    { id: "m2_sys", g: "중2", name: "연립방정식", calc: true },
    { id: "m2_linfn", g: "중2", name: "일차함수" },
    { id: "m2_prob", g: "중2", name: "경우의 수와 확률" },
    { id: "m2_sim", g: "중2", name: "피타고라스 정리와 닮음" },
    { id: "m3_sqrt", g: "중3", name: "제곱근과 실수", calc: true },
    { id: "m3_expand", g: "중3", name: "곱셈 공식", calc: true },
    { id: "m3_factor", g: "중3", name: "인수분해", calc: true },
    { id: "m3_quad", g: "중3", name: "이차방정식", calc: true },
    { id: "m3_qfn", g: "중3", name: "이차함수" },
    { id: "m3_trig", g: "중3", name: "삼각비" },
    { id: "m3_circle", g: "중3", name: "원주각" },
    { id: "m3_stat", g: "중3", name: "대푯값과 산포도" },
  ];

  // 문제 하나 만들기 (조건이 안 맞으면 다시 만들어요)
  function gen(unitId, tier) {
    const f = U[unitId];
    root.YMcore.state.elem = unitId.startsWith("e");
    for (let i = 0; i < 400; i++) {
      try {
        const p = f(tier);
        p.unit = unitId; p.tier = tier;
        return p;
      } catch (e) {
        if (e.message !== "retry" && e.message !== "zero") throw e;
      }
    }
    throw new Error("문제를 만들지 못했어요: " + unitId + " " + tier);
  }

  root.YM = { UNITS, gen, F };
})(typeof window !== "undefined" ? window : globalThis);
