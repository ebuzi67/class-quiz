// 율이 꿀벌 수학 문제 검산 테스트
// 실행: node tools/yulmath/test_problems.js  (단원·단계마다 기본 1500문제씩)
// 정답이 맞는지, 오답이 정말 틀린 값인지, 글자가 깨지지 않았는지 확인해요.
const path = require("path");
const APP = path.resolve(__dirname, "../../math/yulmath");
require(path.join(APP, "problems.js"));
require(path.join(APP, "problems-mid.js"));
const { UNITS, gen } = globalThis.YM;

const COUNT = Number(process.argv[2]) || 1500;
const SUPS = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };

// 화면용 글자 → 자바스크립트 식
function toJS(text) {
  let s = String(text).trim().replace(/\s*(cm²|cm³|cm|°|원|개|가지|점|%)$/, "").replace(/,/g, "");
  if (/[가-힣]/.test(s)) return null;
  s = s.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/̇/g, "");
  for (let k = 0; k < 5; k++) {
    s = s.replace(/\[(-?\d+) ([^\[\]\/ ]+)\/([^\[\]]+)\]/g, "($1+($2)/($3))");
    s = s.replace(/\[([^\[\]]*)\/([^\[\]\/]+)\]/g, "(($1)/($2))");
  }
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "**" + m.split("").map((c) => SUPS[c]).join(""));
  s = s.replace(/√(\d+)/g, "S($1)").replace(/π/g, "P");
  s = s.replace(/([0-9a-zP)])\s*(?=[a-zSP(])/g, "$1*");
  s = s.replace(/\*\*\*/g, "**");
  s = s.replace(/([a-z]|\d+(?:\.\d+)?)\*\*(\d+)/g, "(($1)**$2)");
  return s;
}
const S = Math.sqrt, Pi = Math.PI;
function ev(js, x = 0, y = 0) {
  // eslint-disable-next-line no-new-func
  js = String(js).replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
  return Function("x", "y", "S", "P", "return (" + js + ");")(x, y, S, Pi);
}
const close = (a, b) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const PTS = [[1.37, -0.61], [-2.11, 1.73], [0.53, 2.9]];

function valueEquals(js, text, expr) {
  const a = toJS(text);
  if (a === null) return null;
  try {
    for (const [x, y] of expr ? PTS : [[0, 0]]) if (!close(ev(js, x, y), ev(a, x, y))) return false;
    return true;
  } catch (e) { return "error: " + a + " / " + e.message; }
}
const rhs = (t, v) => { const m = t.match(new RegExp("^" + v + " = (.+)$")); return m ? m[1] : null; };

function check(p) {
  const errs = [];
  const all = [p.a, ...p.w.map((w) => w.t)];
  if (p.w.length !== 2) errs.push("오답 개수");
  if (new Set(all).size !== 3) errs.push("보기 중복");
  for (const s of [p.q, ...all, p.tip]) {
    if (/undefined|NaN|null|Infinity|\$\{/.test(s)) errs.push("깨진 글자: " + s);
    if ((s.match(/\[/g) || []).length !== (s.match(/\]/g) || []).length) errs.push("괄호 짝: " + s);
  }
  for (const w of p.w) if (!w.m) errs.push("실수 설명 없음: " + w.t);
  const c = p.chk;
  if (!c) return errs;
  if (c.js) {
    const r = valueEquals(c.js, p.a, c.mode === "expr");
    if (r !== true && r !== null) errs.push(`정답 틀림 (${r}): ${p.q} → ${p.a}`);
    if (r === null && !c.pi) errs.push("정답을 식으로 못 읽음: " + p.a);
    if (!c.answerOnly) for (const w of p.w) if (valueEquals(c.js, w.t, c.mode === "expr") === true) errs.push(`오답이 정답과 같은 값: ${p.q} → ${w.t}`);
  }
  if (c.eq) {
    const test = (t) => { const v = rhs(t, "x"); return v !== null && close(...c.eq.split("==").map((side) => ev(side, ev(toJS(v))))); };
    if (!test(p.a)) errs.push(`방정식 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (test(w.t)) errs.push(`방정식 오답이 맞음: ${p.q} → ${w.t}`);
  }
  if (c.ineq) {
    const solves = (t) => {
      const m = t.match(/^x ([<>≤≥]) (.+)$/); if (!m) return false;
      const b = ev(toJS(m[2])), op = { ">": ">", "<": "<", "≥": ">=", "≤": "<=" }[m[1]];
      for (const x of [b - 1.5, b - 0.5, b, b + 0.5, b + 1.5, b - 7, b + 7]) {
        const lhs = ev(c.ineq, x), ans = ev(`x ${op} ${b}`, x);
        if (lhs !== ans) return false;
      }
      return true;
    };
    if (!solves(p.a)) errs.push(`부등식 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (solves(w.t)) errs.push(`부등식 오답이 맞음: ${w.t}`);
  }
  if (c.sys) {
    const solves = (t) => { const m = t.match(/^x = (.+), y = (.+)$/); if (!m) return false; const x = ev(toJS(m[1])), y = ev(toJS(m[2])); return c.sys.every((e) => { const [l, r] = e.split("=="); return close(ev(l, x, y), ev(r, x, y)); }); };
    if (!solves(p.a)) errs.push(`연립방정식 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (solves(w.t)) errs.push(`연립방정식 오답이 맞음: ${w.t}`);
  }
  if (c.roots) {
    const rootsOf = (t) => {
      let m = t.match(/^x = (.+) 또는 x = (.+)$/); if (m) return [ev(toJS(m[1])), ev(toJS(m[2]))];
      m = t.match(/^x = (.*?)\s*±\s*(.+)$/); if (m) { const cen = m[1] ? ev(toJS(m[1])) : 0, r = ev(toJS(m[2])); return [cen - r, cen + r]; }
      return null;
    };
    const good = (t) => { const r = rootsOf(t); return r && r.every((x) => close(ev(c.roots, x), 0)); };
    if (!good(p.a)) errs.push(`이차방정식 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (good(w.t)) errs.push(`이차방정식 오답이 맞음: ${w.t}`);
  }
  if (c.vertex) {
    const good = (t) => { const m = t.match(/^\((.+), (.+)\)$/); if (!m) return false; const px = ev(toJS(m[1])), qy = ev(toJS(m[2])); return close(ev(c.vertex, px), qy) && close(ev(c.vertex, px + 1), ev(c.vertex, px - 1)); };
    if (!good(p.a)) errs.push(`꼭짓점 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (good(w.t)) errs.push(`꼭짓점 오답이 맞음: ${w.t}`);
  }
  if (c.line) {
    const good = (t) => { const v = rhs(t, "y"); if (v === null) return false; const js = toJS(v); return c.line.every(([x, y]) => close(ev(js, x), y)); };
    if (!good(p.a)) errs.push(`직선 정답 틀림: ${p.q} → ${p.a}`);
    for (const w of p.w) if (good(w.t)) errs.push(`직선 오답이 맞음: ${w.t}`);
  }
  return errs;
}

let total = 0, bad = 0;
const samples = [];
for (const u of UNITS) {
  for (const tier of [1, 2, 3]) {
    const seen = new Set();
    for (let i = 0; i < COUNT; i++) {
      let p;
      try { p = gen(u.id, tier); } catch (e) { console.log("❌ 만들기 실패", u.id, tier, e.message); bad++; break; }
      total++; seen.add(p.q);
      let errs;
      try { errs = check(p); } catch (e) { errs = ["검사 중 오류: " + e.message + " / " + p.q + " → " + [p.a, ...p.w.map((w) => w.t)].join(" | ")]; }
      if (errs.length) { bad++; if (bad < 400) console.log("❌", u.id, tier, errs.join(" | ")); }
      if (i === 0) samples.push(`${u.g} ${u.name} [${tier}] ${p.q}  ⇒ ${p.a}  ✗ ${p.w.map((w) => w.t).join(" / ")}`);
    }
    if (seen.size < Math.min(30, COUNT / 10)) console.log("⚠️ 문제 종류가 적어요:", u.id, tier, seen.size);
  }
}
if (process.argv.includes("--show")) console.log(samples.join("\n"));
console.log(`\n${UNITS.length}개 단원 × 3단계, 문제 ${total}개 검사 → 문제 있음 ${bad}개`);
process.exit(bad ? 1 : 0);
