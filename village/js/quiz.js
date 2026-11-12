// 배움 동산 문제 방(수학·국어) 공통 틀
// 방마다 미션이 5개 있어요. 미션 하나는 10문제이고, 8문제 이상 맞히면 통과예요.
// 방에 round·pass를 적으면 그 방만 문제 수와 통과 기준이 달라져요.
// 방에 levels: true를 적으면 미션마다 난이도(보통·어려움)를 골라요. gen(도구, hard)의 hard가 true면 어려운 문제를 만들어요.
// 어려움을 통과하면 보통도 통과한 것으로 쳐요. 도장은 미션을 모두 통과하면(어느 난이도든) 받아요.
// 미션을 모두 통과하면 그 방 도장을 받아요.
// 문제는 미션의 gen()이 만들어요. 돌려주는 모양:
//   { text: "질문", visual?: "그림 HTML", choices?: ["보기 HTML", ...], answer: 정답(보기 HTML 또는 숫자),
//     input?: true(숫자 패드로 답하기), unit?: "단위", explain?: "풀이", say?: "읽어 줄 말", sayEn?: "영어로 읽어 줄 말",
//     play?: [{ f, at, d, vol, type }] 들려줄 소리,
//     parts?: [{ label, notes: [...] }] 소리를 부분(첫 번째, 두 번째…)으로 나눠 그림으로도 보여 줘요(play 대신), key?: "같은 글이라도 다른 문제인지 가르는 값(소리 문제)" }
"use strict";

const Quiz = (() => {
  const ROUND = 10, PASS = 8;
  const sizeOf = (def) => ({ round: def.round || ROUND, pass: def.pass || PASS });
  // 방 안내 NPC: 수학 방은 셈셈 박사, 국어 방은 말랑 작가(그림: assets/npc/아이디.webp)
  const NPCS = { math: { id: "semsem", name: "셈셈 박사" }, kor: { id: "mallang", name: "말랑 작가" }, eng: { id: "jenny", name: "제니 선생님" }, mus: { id: "lala", name: "라라 선생님" } };
  const npcOf = (roomId) => NPCS[roomId.replace(/\d+$/, "")];
  function npcBanner(el, npc, line) {
    const b = el("div", "qz-npc");
    const img = el("img"); img.alt = "";
    img.onerror = () => img.remove(); // 그림이 아직 없으면 글만 보여요
    img.src = "assets/npc/" + npc.id + ".webp";
    b.append(img, el("div", "", "<b>" + npc.name + "</b><p>" + line + "</p>"));
    return b;
  }
  const rooms = [];
  let shown = null; // 지금 화면에 있는 문제(자동 시험용)

  // ── 문제 만들 때 쓰는 도구 ──
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 정답과 겹치지 않는 오답을 골라 보기를 만들어요
  function opts(correct, wrongs, n = 3) {
    const out = [String(correct)];
    shuffle(wrongs.map(String)).forEach((w) => { if (out.length < n && !out.includes(w)) out.push(w); });
    return out;
  }
  // 숫자 정답 주변의 그럴듯한 오답
  function near(n, spread = [1, 2, 10]) { return spread.flatMap((d) => [n + d, n - d]).filter((x) => x >= 0 && x !== n); }
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const fmt = (n) => Number(n.toFixed(4)).toString();

  // 분수: 진분수/가분수는 세로 분수로, 대분수는 앞에 자연수를 붙여 보여 줘요
  function frac(n, d, mixed = true) {
    if (d === 1) return String(n);
    const w = mixed ? Math.floor(n / d) : 0, r = mixed ? n % d : n;
    if (mixed && r === 0) return String(w);
    return (w ? w : "") + "<span class='fr'><b>" + r + "</b><i>" + d + "</i></span>";
  }
  function fracSay(n, d) { const w = Math.floor(n / d), r = n % d; return (w ? w + "과 " : "") + d + "분의 " + r; }

  // ── 그림 ──
  function objects(emoji, n) { return "<div class='qz-objs'>" + Array.from({ length: n }, () => "<span>" + emoji + "</span>").join("") + "</div>"; }
  function clock(h, m) {
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return "<line x1='" + (50 + Math.sin(a) * 40) + "' y1='" + (50 - Math.cos(a) * 40) + "' x2='" + (50 + Math.sin(a) * 45) + "' y2='" + (50 - Math.cos(a) * 45) + "' stroke='#5e3820' stroke-width='" + (i % 3 ? 1.5 : 3) + "'/>"; }).join("");
    const nums = Array.from({ length: 12 }, (_, i) => { const a = (((i + 1) * 30) * Math.PI) / 180; return "<text x='" + (50 + Math.sin(a) * 33) + "' y='" + (54 - Math.cos(a) * 33) + "' font-size='10' text-anchor='middle' fill='#3a2a22'>" + (i + 1) + "</text>"; }).join("");
    return "<svg class='qz-svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='47' fill='#fffaf0' stroke='#5e3820' stroke-width='3'/>" + ticks + nums +
      "<line x1='50' y1='50' x2='" + (50 + Math.sin((ha * Math.PI) / 180) * 22) + "' y2='" + (50 - Math.cos((ha * Math.PI) / 180) * 22) + "' stroke='#e8505b' stroke-width='5' stroke-linecap='round'/>" +
      "<line x1='50' y1='50' x2='" + (50 + Math.sin((ma * Math.PI) / 180) * 36) + "' y2='" + (50 - Math.cos((ma * Math.PI) / 180) * 36) + "' stroke='#2d5fa8' stroke-width='3' stroke-linecap='round'/>" +
      "<circle cx='50' cy='50' r='3' fill='#3a2a22'/></svg>";
  }
  function pie(n, d) {
    if (d === 1) return "<svg class='qz-svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='44' fill='#f5a623' stroke='#5e3820' stroke-width='2'/></svg>";
    let s = "";
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const p = (a) => (50 + Math.cos(a) * 44) + " " + (50 + Math.sin(a) * 44);
      s += "<path d='M50 50 L" + p(a0) + " A44 44 0 " + (a1 - a0 > Math.PI ? 1 : 0) + " 1 " + p(a1) + " Z' fill='" + (i < n ? "#f5a623" : "#fff3d6") + "' stroke='#5e3820' stroke-width='2'/>";
    }
    return "<svg class='qz-svg' viewBox='0 0 100 100'>" + s + "</svg>";
  }
  function angle(deg) {
    const a = (deg * Math.PI) / 180;
    return "<svg class='qz-svg wide' viewBox='0 0 140 90'><line x1='20' y1='75' x2='125' y2='75' stroke='#3a2a22' stroke-width='3'/>" +
      "<line x1='20' y1='75' x2='" + (20 + Math.cos(a) * 95) + "' y2='" + (75 - Math.sin(a) * 95) + "' stroke='#3a2a22' stroke-width='3'/>" +
      "<path d='M45 75 A25 25 0 0 0 " + (20 + Math.cos(a) * 25) + " " + (75 - Math.sin(a) * 25) + "' fill='none' stroke='#e8505b' stroke-width='2.5'/></svg>";
  }
  function polygon(sides) {
    if (!sides) return "<svg class='qz-svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#bfe6f8' stroke='#2d5fa8' stroke-width='3'/></svg>";
    const pts = Array.from({ length: sides }, (_, i) => { const a = (i / sides) * 2 * Math.PI - Math.PI / 2 + (sides === 4 ? Math.PI / 4 : 0); return (50 + Math.cos(a) * 42) + "," + (54 + Math.sin(a) * 42); }).join(" ");
    return "<svg class='qz-svg' viewBox='0 0 100 100'><polygon points='" + pts + "' fill='#bfe6f8' stroke='#2d5fa8' stroke-width='3' stroke-linejoin='round'/></svg>";
  }
  function rectFig(w, h, label) {
    return "<svg class='qz-svg wide' viewBox='0 0 160 100'><rect x='30' y='15' width='100' height='60' fill='#d9f7c8' stroke='#3a7d2a' stroke-width='3'/>" +
      "<text x='80' y='92' text-anchor='middle' font-size='12'>" + w + "</text><text x='22' y='50' text-anchor='end' font-size='12'>" + h + "</text>" + (label || "") + "</svg>";
  }
  function big(text) { return "<div class='qz-big'>" + text + "</div>"; }

  // ── 한글 조합 ──
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  function hangul(c, v, j = "") { return String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(j)); }
  const JAMO_NAME = { "ㄱ": "기역", "ㄴ": "니은", "ㄷ": "디귿", "ㄹ": "리을", "ㅁ": "미음", "ㅂ": "비읍", "ㅅ": "시옷", "ㅇ": "이응", "ㅈ": "지읒", "ㅊ": "치읓", "ㅋ": "키읔", "ㅌ": "티읕", "ㅍ": "피읖", "ㅎ": "히읗" };
  const jamoSay = (x) => JAMO_NAME[x] || hangul("ㅇ", x);

  // 받침이 있으면 "이에요", 없으면 "예요"
  function ieyo(w) { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? "예요" : "이에요"; }

  const tools = { ieyo, rnd, pick, shuffle, opts, near, gcd, lcm, fmt, frac, fracSay, objects, clock, pie, angle, polygon, rectFig, big, hangul, jamoSay };

  // ── 방 화면 ──
  function add(def) {
    rooms.push(def);
    Activities.register(def.id, (kit) => run(kit, def));
  }


  function run({ el, frame, wait, ctx }, def) {
    const root = frame(def.e + " " + def.title + " · " + def.grade);
    const getP = () => Object.assign({ done: [], hard: [], best: {} }, ctx.getProgress(def.id) || {});
    let hard = false; // 지금 고른 난이도(levels가 있는 방)
    const bestKey = (m) => m.id + (hard ? ":h" : "");

    const { round: ROUND, pass: PASS } = sizeOf(def);

    function home() {
      root.innerHTML = "";
      const p = getP();
      const npc = npcOf(def.id);
      const line = "안녕! 나는 " + npc.name + (ieyo(npc.name) === "예요" ? "야. " : "이야. ") + def.title + "에 온 걸 환영해! 미션을 골라 봐. " + ROUND + "문제 중 " + PASS + "문제를 맞히면 통과야.";
      root.append(npcBanner(el, npc, line));
      if (def.levels) {
        const row = el("div", "qz-levels");
        [[false, "🙂 보통"], [true, "🔥 어려움"]].forEach(([h, label]) => {
          const b = el("button", "qz-level" + (h === hard ? " on" : "") + (h ? " hard" : ""), label);
          b.onclick = () => { ctx.sfx("tap"); hard = h; home(); };
          row.append(b);
        });
        root.append(row);
      }
      const grid = el("div", "qz-missions");
      def.missions.forEach((m) => {
        const done = (hard ? p.hard : p.done).includes(m.id), best = p.best[bestKey(m)];
        const desc = hard && m.hardDesc ? m.hardDesc : m.desc;
        const b = el("button", "qz-mission" + (done ? " done" : ""), "<span>" + m.e + "</span><b>" + m.name + "</b><small>" + (done ? (hard ? "⭐ 통과" : "✅ 통과") : best != null ? "최고 " + best + "/" + ROUND : desc) + "</small>");
        b.onclick = () => { ctx.sfx("tap"); play(m); };
        grid.append(b);
      });
      root.append(grid);
      root.append(el("div", "ob-note", "통과한 미션 " + p.done.length + " / " + def.missions.length + (def.levels ? " · 🔥 어려움 " + p.hard.length + " / " + def.missions.length : "") + (p.done.length === def.missions.length ? " · 🎉 도장을 받았어요!" : " · 모두 통과하면 도장을 받아요")));
      ctx.speak(line);
    }

    function play(m) {
      let i = 0, right = 0;
      const seen = new Set();
      root.innerHTML = "";
      const top = el("div", "qz-top");
      const title = el("div", "rb-level", m.e + " " + m.name + (def.levels ? (hard ? " · 🔥 어려움" : " · 🙂 보통") : ""));
      const dots = el("div", "qz-dots");
      const listen = el("button", "btn btn-soft qz-listen", "🔊 다시 듣기");
      top.append(title, dots, listen);
      const box = el("div", "qz-box");
      root.append(top, box);
      let current = null;
      // sayEn: 영어 낱말·문장은 한국어 질문 뒤에 영어 목소리로 이어서 읽어요
      // play: 음악 문제의 소리. 질문을 다 읽은 뒤에 들려주고, 🔊 다시 듣기는 소리만 다시 들려줘요.
      let board = null; // 소리 그림판(parts가 있는 문제)
      const play = (q) => (board ? board.playAll() : ctx.playNotes && ctx.playNotes(q.play));
      const read = (q) => {
        if (q.play && ctx.speakThen) return ctx.speakThen(q.say || strip(q.text), () => { if (current === q) play(q); });
        ctx.speak(q.say || strip(q.text)); if (q.sayEn && ctx.speakEn) ctx.speakEn(q.sayEn);
      };
      listen.onclick = () => current && (current.play ? play(current) : read(current));

      function newQuestion() {
        for (let k = 0; k < 20; k++) { const q = m.gen(tools, hard); const key = q.text + "|" + (q.visual || "") + "|" + q.answer + "|" + (q.key || ""); if (!seen.has(key) || k === 19) { seen.add(key); return q; } }
      }

      function drawDots(results) { dots.innerHTML = Array.from({ length: ROUND }, (_, k) => "<span class='" + (results[k] === true ? "ok" : results[k] === false ? "no" : k === i ? "now" : "") + "'></span>").join(""); }
      const results = [];

      function show() {
        const q = current = shown = newQuestion();
        drawDots(results);
        if (board) board.stop();
        board = null;
        box.innerHTML = "";
        box.append(el("div", "qz-text", q.text));
        if (q.parts) { board = soundBoard(el, ctx, q.parts); q.play = board.all; box.append(board.node); }
        else if (q.visual) box.append(el("div", "qz-visual", q.visual));
        const fb = el("div", "mg-result");
        const answer = (given, btn) => {
          const ok = String(given) === String(q.answer);
          results[i] = ok; if (ok) right++;
          drawDots(results);
          ctx.sfx(ok ? "snap" : "bump");
          box.querySelectorAll("button.qz-choice, .qz-pad button").forEach((b) => (b.disabled = true));
          if (btn) btn.classList.add(ok ? "right" : "wrong");
          if (!ok) box.querySelectorAll("button.qz-choice").forEach((b) => { if (b.dataset.v === String(q.answer)) b.classList.add("right"); });
          const ans = q.input ? q.answer + (q.unit || "") : q.answer;
          fb.append(el("div", "mg-verdict " + (ok ? "good" : "soso"), ok ? "⭕ 정답이에요!" : "🤔 정답은 " + ans + " 이에요"));
          if (q.explain) fb.append(el("div", "mg-why", q.explain));
          // 영어 문제는 풀이를 한국어 목소리로 읽지 않고, 영어 정답만 영어 목소리로 읽어요
          if (q.sayEn) {
            const latin = /^[\x00-\x7F]+$/.test(strip(String(ans)));
            ctx.speak(ok ? "정답이에요!" : "정답은 " + (latin ? "" : strip(String(ans)) + " 이에요."));
            if (latin && ctx.speakEn) ctx.speakEn(strip(String(ans)));
          } else ctx.speak((ok ? "정답이에요! " : "정답은 " + strip(String(ans)) + " 이에요. ") + strip(q.explain || ""));
          const next = el("button", "btn btn-go", i + 1 < ROUND ? "다음 문제 ▶" : "결과 보기 ▶");
          next.onclick = () => { ctx.sfx("tap"); i++; if (i < ROUND) show(); else finish(); };
          fb.append(next);
        };
        if (q.input) box.append(pad(answer, q.unit));
        else {
          const list = el("div", "qz-choices" + (q.choices.some((c) => String(c).replace(/<[^>]+>/g, "").length > 12) ? " long" : ""));
          shuffle(q.choices).forEach((c) => { const b = el("button", "qz-choice", c); b.dataset.v = String(c); b.onclick = () => answer(c, b); list.append(b); });
          box.append(list);
        }
        box.append(fb);
        read(q);
      }

      function pad(answer, unit) {
        let v = "";
        const wrap = el("div", "qz-pad");
        const disp = el("div", "qz-display", "&nbsp;");
        wrap.append(disp);
        const keys = el("div", "qz-keys");
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "확인"].forEach((k) => {
          const b = el("button", k === "확인" ? "ok" : "", k);
          b.onclick = () => {
            if (k === "확인") { if (v) answer(Number(v), null); return; }
            ctx.sfx("tap");
            v = k === "⌫" ? v.slice(0, -1) : (v + k).replace(/^0+(?=\d)/, "").slice(0, 7);
            disp.innerHTML = (v || "&nbsp;") + (v && unit ? " <small>" + unit + "</small>" : "");
          };
          keys.append(b);
        });
        wrap.append(keys);
        return wrap;
      }

      function finish() {
        const p = getP();
        p.best[bestKey(m)] = Math.max(p.best[bestKey(m)] || 0, right);
        const pass = right >= PASS;
        if (pass && !p.done.includes(m.id)) p.done.push(m.id);
        if (pass && hard && !p.hard.includes(m.id)) p.hard.push(m.id);
        ctx.setProgress(def.id, p);
        if (p.done.length === def.missions.length) ctx.award(def.id);
        ctx.sfx(pass ? "win" : "thud");
        box.innerHTML = "";
        drawDots(results);
        box.append(el("div", "mg-q", pass ? "🎉 미션 통과! " + right + " / " + ROUND : "😊 " + right + " / " + ROUND + " · 조금만 더! " + PASS + "문제를 맞히면 통과예요."));
        ctx.speak(pass ? "미션 통과! " + ROUND + "문제 중 " + right + "문제를 맞혔어요." : ROUND + "문제 중 " + right + "문제를 맞혔어요. 다시 도전해 봐요!");
        const row = el("div", "rb-controls");
        const again = el("button", "btn btn-go", "🔁 다시 하기"), list = el("button", "btn btn-soft", "📋 미션 고르기");
        again.onclick = () => { ctx.sfx("tap"); play(m); };
        list.onclick = () => { ctx.sfx("tap"); home(); };
        row.append(again, list);
        box.append(row);
      }
      show();
    }

    home();
  }

  // 소리 그림판: 소리가 날 때마다 동그라미가 하나씩 나타나요.
  // 높은 소리는 위에, 큰 소리는 크게, 빨리 나는 소리는 촘촘하게 찍혀요. 칸을 누르면 그 소리만 다시 들려줘요.
  // 교실이 시끄러워도 눈으로 보며 풀 수 있게 하려고 만들었어요.
  const GAP = 0.8; // 부분 사이 쉬는 시간(초)
  const PART_COLORS = ["#4f7fe8", "#e8743b", "#3a9d5d"];
  function soundBoard(el, ctx, parts) {
    const node = el("div", "qz-board");
    const all = [];
    let offset = 0;
    const dur = (ns) => Math.max(...ns.map((n) => n.at + (n.d || 0.4)));
    const maxDur = Math.max(...parts.map((p) => dur(p.notes)));
    const fs = parts.flatMap((p) => p.notes.map((n) => Math.log2(n.f)));
    const lo = Math.min(...fs), hi = Math.max(...fs);
    const vols = parts.flatMap((p) => p.notes.map((n) => (n.vol == null ? 0.3 : n.vol)));
    const vmax = Math.max(...vols);
    const timers = [];
    const panels = parts.map((p, k) => {
      const panel = el("button", "qz-part");
      panel.style.setProperty("--c", PART_COLORS[k % PART_COLORS.length]);
      panel.append(el("div", "qz-part-label", "▶ " + p.label));
      const area = el("div", "qz-part-area");
      const dots = p.notes.map((n) => {
        const d = el("span", "qz-note");
        // 소리가 하나면 가운데, 여러 개면 시간 순서대로 왼쪽에서 오른쪽으로 놓아요
        const x = p.notes.length === 1 ? 50 : 14 + (n.at / maxDur) * 72, y = hi - lo < 0.05 ? 50 : 80 - ((Math.log2(n.f) - lo) / (hi - lo)) * 60;
        // 크기 차이가 있으면 크게·작게 보여 주고, 없으면 촘촘해도 겹치지 않게 작게 그려요
        const sized = vmax - Math.min(...vols) > 0.05;
        const size = sized ? 14 + 40 * ((n.vol == null ? 0.3 : n.vol) / vmax) : Math.min(34, 220 / Math.max(...parts.map((q) => q.notes.length)));
        Object.assign(d.style, { left: x + "%", top: y + "%", width: size + "px", height: size + "px" });
        area.append(d);
        return d;
      });
      panel.append(area);
      node.append(panel);
      const start = offset;
      p.notes.forEach((n) => all.push(Object.assign({}, n, { at: n.at + start })));
      offset += dur(p.notes) + GAP;
      const run = (shift) => p.notes.forEach((n, i) => timers.push(setTimeout(() => {
        dots[i].classList.remove("on"); void dots[i].offsetWidth; dots[i].classList.add("on");
      }, (shift + n.at) * 1000 + 80)));
      panel.onclick = () => { stop(); dots.forEach((d) => d.classList.remove("on")); ctx.playNotes && ctx.playNotes(p.notes); run(0); };
      return { dots, run, start };
    });
    function stop() { timers.splice(0).forEach(clearTimeout); }
    function playAll() {
      stop();
      panels.forEach((pn) => pn.dots.forEach((d) => d.classList.remove("on")));
      if (ctx.playNotes) ctx.playNotes(all);
      panels.forEach((pn) => pn.run(pn.start));
    }
    return { node, all, playAll, stop };
  }

  const strip = (h) => String(h).replace(/<span class='fr'><b>(\d+)<\/b><i>(\d+)<\/i><\/span>/g, " $2분의 $1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return { add, rooms, tools, sizeOf, peek: () => shown, npcBanner, NPCS };
})();

