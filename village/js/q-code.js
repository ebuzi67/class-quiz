// 💻 코딩 숲: 건물 4곳(방 4개). 방마다 미션 5개(퀴즈와 만들기를 섞었어요), 10문제 중 8문제를 맞히면 통과.
// 🧩 블록 코딩 집(반복·돌기), 🎨 픽셀 공방(좌표·0과 1), 🕵️ 버그 탐정 사무소(디버깅·조건), 🏁 로봇 경주장(이벤트·알고리즘)
// 마을의 로봇 공장(화살표 순서)과 반복 정원(반복)보다 한 걸음 더 나아간 활동이에요.
"use strict";

(() => {
  const { rnd, pick, shuffle, opts, big } = Quiz.tools;
  const DIRS = { up: [0, -1, "⬆️", "위"], right: [1, 0, "➡️", "오른쪽"], down: [0, 1, "⬇️", "아래"], left: [-1, 0, "⬅️", "왼쪽"] };
  const CLOCK = ["up", "right", "down", "left"];  // 시계 방향
  const TURNS = { fwd: ["⏫", "앞으로"], tl: ["↩️", "왼쪽 돌기"], tr: ["↪️", "오른쪽 돌기"] };
  const NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  const emo = (e) => "<span style='font-size:1.6em'>" + e + "</span>";
  const card = (k) => (DIRS[k] || TURNS[k])[DIRS[k] ? 2 : 0];

  // 작은 칸 그림(문제용). cells: { "x,y": "내용" }, cls: { "x,y": "칸 꾸밈" }, label: 위·왼쪽에 A B C / 1 2 3
  function mini(n, cells, cls = {}, label = false) {
    let h = "<div class='cd-mini" + (label ? " lab" : "") + "' style='--n:" + (n + (label ? 1 : 0)) + "'>";
    if (label) { h += "<i></i>"; for (let x = 0; x < n; x++) h += "<i>" + "ABCDEFG"[x] + "</i>"; }
    for (let y = 0; y < n; y++) {
      if (label) h += "<i>" + (y + 1) + "</i>";
      for (let x = 0; x < n; x++) h += "<b class='" + (cls[x + "," + y] || "") + "'>" + (cells[x + "," + y] || "") + "</b>";
    }
    return h + "</div>";
  }
  const coord = (x, y) => "ABCDEFG"[x] + (y + 1);
  // 코드 블록 그림(문제용): 스크래치처럼 색깔 블록을 위에서 아래로 쌓아요. 반복은 주황색 상자 안에 넣어요.
  const WORD = { up: "위로", right: "오른쪽으로", down: "아래로", left: "왼쪽으로" };
  const BLK = { fwd: "⏫ 앞으로 1칸", tl: "↩️ 왼쪽으로 돌기", tr: "↪️ 오른쪽으로 돌기" };
  const blkText = (k) => BLK[k] || DIRS[k][2] + " " + WORD[k] + " 1칸";
  const blk = (k, num) => "<span class='cd-blk " + k + "'>" + (num ? "<i>" + num + "</i>" : "") + blkText(k) + "</span>";
  const loopBlk = (n, inner) => "<span class='cd-loop'><b>🔁 " + n + "번 반복하기</b><span class='cd-in'>" + inner + "</span></span>";
  const prog = (inner) => "<div class='cd-prog'><span class='cd-start'>▶ 시작</span>" + inner + "</div>";
  const side = (a, b) => "<div class='cd-qrow'>" + a + b + "</div>";
  // 풀이용 한 줄: 같은 방향끼리 묶어서 "⬆️ 위로 2칸 → ➡️ 오른쪽으로 1칸"
  const runs = (moves) => { const r = []; moves.forEach((m) => { const l = r[r.length - 1]; if (l && l.k === m) l.n++; else r.push({ k: m, n: 1 }); }); return r; };
  const runText = (moves) => runs(moves).map((p) => DIRS[p.k][2] + " " + WORD[p.k] + " " + p.n + "칸").join(" → ");
  // 0과 1 그림(보기용)
  const pix = (rows) => "<span class='cd-pix' style='--n:" + rows[0].length + "'>" + rows.join("").split("").map((c) => "<i class='" + (c === "1" ? "on" : "") + "'></i>").join("") + "</span>";
  const codeText = (rows) => "<div class='cd-code'>" + rows.join("<br>") + "</div>";

  // ───────────── 블록 코딩 판 ─────────────
  // 퍼즐 P: { n, start:[x,y], face?(돌기 모드에서 처음 보는 쪽), goal?, stars?, walls?, max(블록 수), turn?(돌기 블록), rep?(반복 블록), hint, fix?(고칠 프로그램) }
  function expand(tokens) {
    const stack = [{ n: 1, body: [] }];
    const close = () => { const f = stack.pop(); for (let i = 0; i < f.n; i++) stack[stack.length - 1].body.push(...f.body); };
    tokens.forEach((t, i) => {
      if (t.k === "rep") stack.push({ n: t.n, body: [] });
      else if (t.k === "end") { if (stack.length > 1) close(); }
      else stack[stack.length - 1].body.push({ k: t.k, i });
    });
    while (stack.length > 1) close();
    return stack[0].body;
  }
  const blocks = (tokens) => tokens.filter((t) => t.k !== "end").length;

  function codeBoard({ el, box, ctx, pass }, puzzles, doneText) {
    let k = 0, P, prog = [], running = false, sel = 0, bot, face;
    const head = el("div", "mg-q"), main = el("div", "rb-main"), board = el("div", "cd-board"), side = el("div", "rb-side");
    const palette = el("div", "rb-palette"), strip = el("div", "rb-strip cd-strip"), ctrl = el("div", "rb-controls"), msg = el("div", "mg-why");
    const run = el("button", "btn btn-go", "▶️ 실행"), undo = el("button", "btn btn-soft", "↩️ 하나 지우기"), clear = el("button", "btn btn-soft", "🗑️ 모두 지우기");
    const label1 = el("div", "rb-label"), label2 = el("div", "rb-label");
    side.append(label1, palette, label2, strip, ctrl);
    main.append(board, side);
    box.append(head, main, msg);
    const say = (t, sfx) => { msg.textContent = t; ctx.speak(t.replace(/[^\p{L}\p{N}\s.,!?]/gu, "")); if (sfx) ctx.sfx(sfx); };

    function show() {
      P = puzzles[k]; sel = 0;
      prog = P.fix ? P.fix.map((x) => ({ k: x })) : [];
      head.textContent = (P.fix ? "🔧 " : "🧩 ") + (k + 1) + " / " + puzzles.length + " · " + P.hint;
      label1.textContent = P.fix ? "② 바꿀 블록을 골라요" : "① 블록을 눌러 코드를 만들어요";
      label2.textContent = P.fix ? "① 틀린 블록을 눌러요 (블록 " + P.fix.length + "개)" : "② 내 코드 (블록 " + P.max + "개까지)";
      palette.innerHTML = "";
      const keys = P.turn ? Object.keys(TURNS) : CLOCK;
      keys.forEach((key) => {
        const b = el("button", "cd-blk cd-pal " + key, blkText(key)); b.setAttribute("aria-label", (DIRS[key] || TURNS[key])[DIRS[key] ? 3 : 1]);
        b.onclick = () => add({ k: key }); palette.append(b);
      });
      if (P.rep) {
        const row = el("div", "cd-palrow");
        [2, 3, 4, 5].forEach((n) => { const b = el("button", "cd-loopbtn", "🔁 " + n + "번 반복"); b.setAttribute("aria-label", n + "번 반복"); b.onclick = () => add({ k: "rep", n }); row.append(b); });
        const e = el("button", "cd-loopbtn end", "🔚 반복 닫기"); e.setAttribute("aria-label", "반복 끝"); e.onclick = () => add({ k: "end" }); row.append(e);
        palette.append(row);
      }
      ctrl.innerHTML = "";
      if (P.fix) { const again = el("button", "btn btn-soft", "🔄 처음 코드로"); again.onclick = () => { if (running) return; prog = P.fix.map((x) => ({ k: x })); ctx.sfx("tap"); drawStrip(); }; ctrl.append(again, run); }
      else ctrl.append(undo, clear, run);
      drawBoard(); place(P.start, P.turn ? P.face : null); drawStrip();
      say(P.fix ? "로봇이 길을 잃었어요. 틀린 블록 하나를 찾아 고쳐 봐요." : P.hint);
    }
    function add(t) {
      if (running) return;
      if (P.fix) { if (t.k === "rep" || t.k === "end") return; prog[sel] = t; ctx.sfx("pop"); drawStrip(); return; }
      if (t.k !== "end" && blocks(prog) >= P.max) { say("블록은 " + P.max + "개까지만 쓸 수 있어요." + (P.rep ? " 🔁 반복 블록을 써 봐요!" : ""), "bump"); return; }
      prog.push(t); ctx.sfx("tap"); drawStrip();
    }
    undo.onclick = () => { if (running) return; prog.pop(); ctx.sfx("tap"); drawStrip(); };
    clear.onclick = () => { if (running) return; prog = []; ctx.sfx("tap"); drawStrip(); };

    let cells = {};
    function drawBoard() {
      board.innerHTML = ""; cells = {};
      board.style.setProperty("--n", P.n);
      for (let y = 0; y < P.n; y++) for (let x = 0; x < P.n; x++) {
        const key = x + "," + y, c = el("div", "cd-cell");
        if ((P.walls || []).some(([a, b]) => a === x && b === y)) { c.textContent = "🪨"; c.classList.add("wall"); }
        if ((P.stars || []).some(([a, b]) => a === x && b === y)) { c.textContent = "⭐"; c.classList.add("star"); }
        if (P.goal && P.goal[0] === x && P.goal[1] === y) { c.textContent = "🏁"; c.classList.add("goal"); }
        board.append(c); cells[key] = c;
      }
      bot = el("div", "cd-bot" + (P.turn ? " turn" : ""), P.turn ? "<i>➤</i>" : "🤖");
      board.append(bot);
    }
    function place([x, y], f) {
      bot.style.left = (x * 100 / P.n) + "%"; bot.style.top = (y * 100 / P.n) + "%";
      if (f) { face = f; bot.firstChild.style.transform = "rotate(" + (CLOCK.indexOf(f) * 90 - 90) + "deg)"; }
    }
    // 내 코드: ▶ 시작 아래로 블록을 쌓아요. 반복은 주황 상자이고, 닫기 전에는 상자 아래가 열려 있어요.
    function drawStrip(active = -1) {
      strip.innerHTML = "";
      strip.append(el("span", "cd-start", "▶ 시작"));
      const stack = [strip];
      prog.forEach((t, i) => {
        const here = stack[stack.length - 1];
        if (t.k === "end") { if (stack.length > 1) { stack.pop().parentNode.classList.remove("open"); } return; }
        if (t.k === "rep") {
          const lp = el("div", "cd-loop open" + (i === active ? " active" : "") + (P.fix && i === sel ? " cd-sel" : ""), "<b>🔁 " + t.n + "번 반복하기</b>");
          const inner = el("div", "cd-in"); lp.append(inner); here.append(lp); stack.push(inner); return;
        }
        const c = el("button", "cd-blk " + t.k + (i === active ? " active" : "") + (P.fix && i === sel ? " cd-sel" : ""), blkText(t.k));
        c.dataset.i = i;
        if (P.fix) c.onclick = () => { if (running) return; sel = i; ctx.sfx("tap"); drawStrip(); };
        here.append(c);
      });
      // 아직 닫지 않은 반복 상자: 다음 블록이 들어갈 자리를 보여 줘요
      strip.querySelectorAll(".cd-loop.open > .cd-in").forEach((inner) => { if (!running) inner.append(el("span", "cd-slot", "여기에 블록을 넣어요")); });
      if (!prog.length) strip.append(el("span", "rb-empty", "위의 블록을 눌러 쌓아요"));
      if (!P.fix) strip.append(el("span", "cd-count", "블록 " + blocks(prog) + " / " + P.max));
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    run.onclick = async () => {
      if (running) return;
      if (!prog.length) { say("먼저 블록을 넣어요!", "bump"); return; }
      running = true; run.disabled = true;
      const steps = expand(prog);
      let [x, y] = P.start, f = P.face, got = new Set(), fail = "";
      drawBoard(); place([x, y], P.turn ? f : null);
      const starAt = (a, b) => (P.stars || []).some(([p, q]) => p === a && q === b);
      if (starAt(x, y)) got.add(x + "," + y);
      for (const s of steps.slice(0, 200)) {
        drawStrip(s.i);
        if (s.k === "tl" || s.k === "tr") { f = CLOCK[(CLOCK.indexOf(f) + (s.k === "tr" ? 1 : 3)) % 4]; place([x, y], f); ctx.sfx("tap"); await wait(320); continue; }
        const d = DIRS[s.k === "fwd" ? f : s.k];
        const nx = x + d[0], ny = y + d[1];
        if (nx < 0 || ny < 0 || nx >= P.n || ny >= P.n) { fail = "판 밖으로 나가려고 했어요!"; break; }
        if ((P.walls || []).some(([a, b]) => a === nx && b === ny)) { fail = "🪨 바위에 부딪혔어요!"; break; }
        x = nx; y = ny; place([x, y]); ctx.sfx("step");
        if (starAt(x, y) && !got.has(x + "," + y)) { got.add(x + "," + y); cells[x + "," + y].textContent = "✨"; ctx.sfx("pop"); }
        await wait(380);
      }
      drawStrip();
      const goalOk = !P.goal || (x === P.goal[0] && y === P.goal[1]);
      const starsOk = got.size === (P.stars || []).length;
      if (!fail && !goalOk) fail = "🏁 깃발까지 가지 못했어요.";
      if (!fail && !starsOk) fail = "⭐ 별을 " + ((P.stars || []).length - got.size) + "개 못 모았어요.";
      if (fail) {
        bot.classList.add("shake"); say(fail + " 코드를 다시 살펴봐요.", "bump");
        await wait(1300); drawBoard(); place(P.start, P.turn ? P.face : null);
        running = false; run.disabled = false; drawStrip(); return;
      }
      bot.classList.add("happy");
      say("🎉 성공! 블록 " + blocks(prog) + "개로 해냈어요.", "win");
      k++;
      if (k >= puzzles.length) { head.textContent = "🎉 " + doneText; pass(); return; }
      await wait(1700); running = false; run.disabled = false; show();
    };
    show();
  }

  // ───────────── 칸 칠하기 판 ─────────────
  // 판 R: { n, art:["..X..", ...](정답 그림), lock?(미리 칠해 둔 칸 "x,y" 목록), clue(왼쪽에 보여 줄 HTML), hint, name }
  function paintBoard({ el, box, ctx, pass }, rounds, doneText) {
    let k = 0, R, on, want, lock;
    const head = el("div", "mg-q"), main = el("div", "cd-paintmain"), board = el("div", "cd-paint"), clue = el("div", "cd-clue");
    const ctrl = el("div", "rb-controls"), msg = el("div", "mg-why");
    const check = el("button", "btn btn-go", "✅ 다 칠했어요"), wipe = el("button", "btn btn-soft", "🧽 지우기");
    ctrl.append(wipe, check);
    main.append(clue, board);
    box.append(head, main, ctrl, msg);
    const say = (t, sfx) => { msg.textContent = t; ctx.speak(t.replace(/[^\p{L}\p{N}\s.,!?]/gu, "")); if (sfx) ctx.sfx(sfx); };
    function show() {
      R = rounds[k];
      want = new Set(); R.art.forEach((row, y) => row.split("").forEach((c, x) => { if (c === "X") want.add(x + "," + y); }));
      lock = new Set(R.lock || []); on = new Set(lock);
      head.textContent = "🖍️ " + (k + 1) + " / " + rounds.length + " · " + R.hint;
      clue.innerHTML = R.clue;
      check.disabled = false;
      draw(); say(R.hint);
    }
    function draw(done) {
      board.innerHTML = ""; board.style.setProperty("--n", R.n + 1);
      board.append(el("i"));
      for (let x = 0; x < R.n; x++) board.append(el("i", "", "ABCDEFG"[x]));
      for (let y = 0; y < R.n; y++) {
        board.append(el("i", "", String(y + 1)));
        for (let x = 0; x < R.n; x++) {
          const key = x + "," + y, c = el("button", "cd-pc" + (on.has(key) ? " on" : "") + (lock.has(key) ? " lock" : "") + (done ? " done" : ""));
          c.setAttribute("aria-label", coord(x, y));
          c.onclick = () => { if (done || lock.has(key)) return; on.has(key) ? on.delete(key) : on.add(key); ctx.sfx("tap"); draw(); };
          board.append(c);
        }
      }
    }
    wipe.onclick = () => { on = new Set(lock); ctx.sfx("tap"); draw(); };
    check.onclick = () => {
      const miss = [...want].filter((x) => !on.has(x)).length, extra = [...on].filter((x) => !want.has(x)).length;
      if (miss || extra) { say((miss ? "아직 칠하지 않은 칸이 " + miss + "개 " : "") + (extra ? (miss ? "있고, " : "") + "칠하면 안 되는 칸이 " + extra + "개 " : "") + "있어요.", "bump"); return; }
      check.disabled = true; draw(true);
      say("🎉 " + R.name + " 그림이 나타났어요!", "win");
      k++;
      if (k >= rounds.length) { head.textContent = "🎉 " + doneText; pass(); return; }
      setTimeout(show, 1800);
    };
    show();
  }
  const cellsOf = (art) => art.flatMap((row, y) => row.split("").map((c, x) => (c === "X" ? x + "," + y : null)).filter(Boolean));

  // ───────────── 1. 블록 코딩 집 ─────────────
  const READ_ICONS = ["🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "🥕", "🌽", "🍄", "🌻", "🌵", "🐟", "🐸", "🐝", "🦋", "🐢", "⭐", "🎈", "🎁", "🔔"];
  function readQ() {
    const n = 4, icons = shuffle(READ_ICONS).slice(0, n * n), at = (x, y) => icons[y * n + x];
    let x = rnd(0, n - 1), y = rnd(0, n - 1);
    const sx = x, sy = y, moves = [];
    const len = rnd(3, 5);
    while (moves.length < len) {
      const k = pick(CLOCK), d = DIRS[k], times = rnd(1, 3);
      if (x + d[0] * times < 0 || x + d[0] * times >= n || y + d[1] * times < 0 || y + d[1] * times >= n) continue;
      for (let i = 0; i < times && moves.length < len + 2; i++) { moves.push(k); x += d[0]; y += d[1]; }
    }
    if (x === sx && y === sy) return readQ();
    // 같은 블록이 이어지면 🔁 반복 블록으로 보여 줘요
    const parts = [];
    moves.forEach((m) => { const last = parts[parts.length - 1]; if (last && last.k === m) last.n++; else parts.push({ k: m, n: 1 }); });
    const code = prog(parts.map((p) => (p.n > 1 && rnd(0, 1) ? loopBlk(p.n, blk(p.k)) : blk(p.k).repeat(p.n))).join(""));
    const cells = {}; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) cells[a + "," + b] = at(a, b);
    cells[sx + "," + sy] = "🤖";
    // 헷갈리기 쉬운 오답: 마지막 블록을 빼먹거나, 한 칸 덜/더 간 곳
    const wrong = [];
    const end = (list) => { let a = sx, b = sy; list.forEach((m) => { a += DIRS[m][0]; b += DIRS[m][1]; }); return a >= 0 && b >= 0 && a < n && b < n && !(a === sx && b === sy) ? at(a, b) : null; };
    wrong.push(end(moves.slice(0, -1)), end(moves.concat(moves[moves.length - 1])), end(moves.map((m) => (m === "left" ? "right" : m === "right" ? "left" : m))));
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (!(a === sx && b === sy)) wrong.push(at(a, b));
    return { text: "🤖가 코드를 위에서부터 차례로 따라가면 어디에 도착할까요?", visual: side(mini(n, cells, { [sx + "," + sy]: "me" }), code),
      choices: opts(at(x, y), wrong.filter((w) => w && w !== at(x, y))), answer: at(x, y), explain: "🤖 " + runText(moves) + " → " + at(x, y) };
  }

  Quiz.add({
    id: "code1", e: "🧩", title: "블록 코딩 집", grade: "코딩 · 순서와 반복",
    missions: [
      { id: "read", e: "👀", name: "코드 읽기", desc: "코드대로 가면 어디일까?", gen: readQ },
      { id: "rep1", e: "🔁", name: "반복 블록", desc: "🧩 만들기 · 같은 블록은 반복으로", done: "반복 블록 박사! 같은 일은 반복으로 짧게 써요.", puzzles: [
        { n: 6, start: [0, 5], goal: [5, 5], max: 2, rep: true, hint: "블록 2개로 🏁까지! 🔁 반복 블록에 ➡️를 넣어 봐요.", sol: [{ k: "rep", n: 5 }, { k: "right" }] },
        { n: 6, start: [0, 5], goal: [5, 0], max: 4, rep: true, hint: "오른쪽으로 쭉, 위로 쭉! 반복 블록 2개를 써요. 🔚로 반복을 닫아요.", sol: [{ k: "rep", n: 5 }, { k: "right" }, { k: "end" }, { k: "rep", n: 5 }, { k: "up" }] },
        { n: 6, start: [0, 5], goal: [5, 1], walls: [[4, 5], [4, 4], [0, 1], [1, 1], [2, 1]], max: 6, rep: true, hint: "바위를 피해서! 블록 6개로 갈 수 있어요.", sol: [{ k: "rep", n: 3 }, { k: "right" }, { k: "end" }, { k: "rep", n: 4 }, { k: "up" }, { k: "end" }, { k: "rep", n: 2 }, { k: "right" }] }
      ], make(api) { codeBoard(api, this.puzzles, this.done); } },
      { id: "rep2", e: "🪜", name: "반복 계단", desc: "🧩 만들기 · 블록 묶음을 반복", done: "반복 계단 정복! 블록 묶음도 반복할 수 있어요.", puzzles: [
        { n: 6, start: [0, 5], goal: [5, 0], max: 3, rep: true, hint: "계단 오르기! 블록 3개만 쓸 수 있어요. 반복 안에 블록 2개를 넣어 봐요.", sol: [{ k: "rep", n: 5 }, { k: "right" }, { k: "up" }] },
        { n: 6, start: [0, 0], goal: [4, 4], walls: [[0, 2], [2, 0], [3, 1], [1, 3]], max: 3, rep: true, hint: "이번에는 계단 내려가기! 블록 3개로 🏁까지.", sol: [{ k: "rep", n: 4 }, { k: "right" }, { k: "down" }] },
        { n: 6, start: [0, 4], goal: [4, 4], walls: [[1, 4], [3, 4]], max: 5, rep: true, hint: "바위를 폴짝 넘어요! 넘는 방법을 한 번 만들고 반복해요.", sol: [{ k: "rep", n: 2 }, { k: "up" }, { k: "right" }, { k: "right" }, { k: "down" }] }
      ], make(api) { codeBoard(api, this.puzzles, this.done); } },
      { id: "turn", e: "↪️", name: "돌기 블록", desc: "🧩 만들기 · 앞으로, 왼쪽·오른쪽 돌기", done: "돌기 블록 성공! 로봇이 보는 쪽에 따라 왼쪽·오른쪽이 달라져요.", puzzles: [
        { n: 6, turn: true, start: [0, 5], face: "up", goal: [3, 2], max: 8, hint: "로봇은 ➤ 쪽으로 가요. ⏫ 앞으로, ↪️ 오른쪽 돌기를 써 봐요.", sol: ["fwd", "fwd", "fwd", "tr", "fwd", "fwd", "fwd"].map((k) => ({ k })) },
        { n: 6, turn: true, start: [0, 0], face: "right", goal: [0, 3], walls: [[0, 1], [1, 1]], max: 10, hint: "돌고, 또 돌고! 로봇이 보는 쪽에서 왼쪽·오른쪽을 생각해요.", sol: ["fwd", "fwd", "tr", "fwd", "fwd", "tr", "fwd", "fwd", "tl", "fwd"].map((k) => ({ k })) },
        { n: 6, turn: true, start: [2, 5], face: "up", goal: [2, 1], walls: [[2, 3], [2, 2], [1, 3]], max: 10, hint: "바로 앞이 막혔어요. 옆으로 돌아서 가요.", sol: ["fwd", "tr", "fwd", "tl", "fwd", "fwd", "fwd", "tl", "fwd"].map((k) => ({ k })) }
      ], make(api) { codeBoard(api, this.puzzles, this.done); } },
      { id: "star", e: "⭐", name: "반복 + 돌기", desc: "🧩 만들기 · 별을 모두 모아요", done: "별 수집 완료! 반복과 돌기를 함께 쓰는 진짜 코더예요.", puzzles: [
        { n: 6, turn: true, rep: true, start: [1, 4], face: "up", stars: [[1, 1], [4, 1], [4, 4]], max: 5, hint: "네모 길을 한 바퀴! 똑같은 움직임을 4번 반복해요.", sol: [{ k: "rep", n: 4 }, { k: "fwd" }, { k: "fwd" }, { k: "fwd" }, { k: "tr" }] },
        { n: 6, turn: true, rep: true, start: [0, 5], face: "right", goal: [5, 0], max: 5, hint: "돌기 블록으로 계단 오르기! 블록 5개까지.", sol: [{ k: "rep", n: 5 }, { k: "fwd" }, { k: "tl" }, { k: "fwd" }, { k: "tr" }] },
        { n: 6, turn: true, rep: true, start: [0, 0], face: "right", stars: [[5, 0], [5, 5], [0, 5]], max: 5, hint: "판 가장자리를 따라 ⭐ 3개를 모아요. 반복 안에 반복을 넣어도 돼요.", sol: [{ k: "rep", n: 3 }, { k: "rep", n: 5 }, { k: "fwd" }, { k: "end" }, { k: "tr" }] }
      ], make(api) { codeBoard(api, this.puzzles, this.done); } }
    ]
  });

  // ───────────── 2. 픽셀 공방 ─────────────
  const COORD_ICONS = ["🍎", "🐱", "⭐", "🚗", "🎈", "🐟", "🌷", "⚽", "🍩", "🐰"];
  const CODE_PICS = [
    { name: "미소", n: 5, art: [".....", ".X.X.", ".....", "X...X", ".XXX."] },
    { name: "화살표", n: 5, art: ["..X..", ".XXX.", "X.X.X", "..X..", "..X.."] },
    { name: "하트", n: 5, art: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."] }
  ];
  const BIN_PICS = [
    { name: "나무", rows: ["00100", "01110", "11111", "00100", "00100"] },
    { name: "로봇", rows: ["11111", "10101", "11111", "01110", "01010"] },
    { name: "고양이", rows: ["100001", "110011", "111111", "101101", "111111", "011110"] }
  ];
  const MIRROR_PICS = [
    { name: "나비", art: ["X....X", "XX..XX", "XXXXXX", "XXXXXX", "XX..XX", "X....X"] },
    { name: "왕관", art: ["......", "X.XX.X", "XXXXXX", "XXXXXX", ".XXXX.", "......"] },
    { name: "로켓", art: ["..XX..", ".XXXX.", ".X..X.", ".XXXX.", "XXXXXX", "X.XX.X"] }
  ];
  const randRows = (n) => { let r; do { r = Array.from({ length: n }, () => Array.from({ length: n }, () => (Math.random() < 0.45 ? "1" : "0")).join("")); } while (r.join("").split("1").length - 1 < 4); return r; };
  const flip = (rows, i) => rows.map((r, y) => r.split("").map((c, x) => (y * r.length + x === i ? (c === "1" ? "0" : "1") : c)).join(""));

  Quiz.add({
    id: "code2", e: "🎨", title: "픽셀 공방", grade: "코딩 · 좌표와 데이터",
    missions: [
      { id: "coord", e: "📍", name: "좌표 읽기", desc: "A1, B3… 칸 이름 알기", gen() {
        const n = 5, items = shuffle(COORD_ICONS).slice(0, 4), spots = shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, 4);
        const cells = {}; items.forEach((e, i) => { cells[(spots[i] % n) + "," + Math.floor(spots[i] / n)] = e; });
        const i = rnd(0, 3), x = spots[i] % n, y = Math.floor(spots[i] / n), c = coord(x, y);
        const vis = mini(n, cells, {}, true);
        if (rnd(0, 1)) {
          const wrong = [coord(y, x), ...spots.filter((_, j) => j !== i).map((s) => coord(s % n, Math.floor(s / n))), coord((x + 1) % n, y), coord(x, (y + 1) % n)];
          return { text: items[i] + "은(는) 어느 칸에 있을까요?", visual: vis, choices: opts(c, wrong.filter((w) => w !== c)), answer: c, explain: "가로 " + "ABCDE"[x] + ", 세로 " + (y + 1) + " → " + c };
        }
        return { text: "<b>" + c + "</b> 칸에 있는 것은 무엇일까요?", visual: vis, choices: opts(items[i], items.filter((e) => e !== items[i])), answer: items[i], explain: c + "는 가로 " + "ABCDE"[x] + ", 세로 " + (y + 1) + "이에요." };
      } },
      { id: "paint", e: "🖍️", name: "좌표대로 칠하기", desc: "🧩 만들기 · 칸 이름을 보고 칠해요", make: (api) => paintBoard(api, CODE_PICS.map((p) => ({
        n: p.n, art: p.art, name: p.name, hint: "왼쪽 목록의 칸을 모두 칠해요.",
        clue: "<b>칠할 칸</b><div class='cd-chips'>" + cellsOf(p.art).map((k) => { const [x, y] = k.split(",").map(Number); return "<span>" + coord(x, y) + "</span>"; }).join("") + "</div>"
      })), "좌표 화가! 컴퓨터도 칸 이름(좌표)으로 그림을 그려요.") },
      { id: "binary", e: "🔢", name: "0과 1 그림", desc: "🧩 만들기 · 1은 칠하고 0은 비워요", make: (api) => paintBoard(api, BIN_PICS.map((p) => ({
        n: p.rows.length, art: p.rows.map((r) => r.replace(/1/g, "X")), name: p.name, hint: "줄마다 1인 칸만 칠해요. 0은 비워 둬요.",
        clue: "<b>그림 코드</b>" + codeText(p.rows.map((r, i) => (i + 1) + "줄: " + r))
      })), "0과 1 마법사! 컴퓨터는 그림을 0과 1로 기억해요.") },
      { id: "mirror", e: "🪞", name: "대칭 완성", desc: "🧩 만들기 · 반쪽 그림을 거울처럼", make: (api) => paintBoard(api, MIRROR_PICS.map((p) => {
        const half = p.art.length / 2;
        return { n: p.art.length, art: p.art, name: p.name, hint: "왼쪽 반쪽을 보고, 거울에 비친 것처럼 오른쪽을 칠해요.",
          lock: cellsOf(p.art).filter((k) => Number(k.split(",")[0]) < half), clue: "<b>🪞 거울 규칙</b><p>A ↔ F, B ↔ E, C ↔ D<br>왼쪽에서 몇 번째 칸이면<br>오른쪽에서도 몇 번째 칸!</p>" };
      }), "대칭 완성! 반쪽만 알면 나머지도 만들 수 있어요.") },
      { id: "match", e: "🔎", name: "그림 코드 맞히기", desc: "0과 1 코드와 그림 짝 찾기", gen() {
        const rows = randRows(4), cells = 16;
        const wrongs = new Set();
        while (wrongs.size < 2) { const w = flip(rows, rnd(0, cells - 1)); if (rnd(0, 1)) wrongs.add(w.join("/")); else { const m = rows.map((r) => r.split("").reverse().join("")); wrongs.add((m.join("/") !== rows.join("/") ? m : flip(w, rnd(0, cells - 1))).join("/")); } wrongs.delete(rows.join("/")); }
        const ws = [...wrongs].map((w) => w.split("/"));
        if (rnd(0, 1)) return { text: "이 코드로 그린 그림은 어느 것일까요? (1은 칠한 칸)", visual: codeText(rows), choices: [pix(rows), ...ws.map(pix)], answer: pix(rows), explain: "줄마다 1인 칸만 칠하면 돼요." };
        const ct = (r) => "<span class='cd-codech'>" + r.join("<br>") + "</span>";
        return { text: "이 그림을 0과 1 코드로 바꾸면? (칠한 칸은 1)", visual: big(pix(rows)), choices: [ct(rows), ...ws.map(ct)], answer: ct(rows), explain: rows.join(" / ") };
      } }
    ]
  });

  // ───────────── 3. 버그 탐정 사무소 ─────────────
  const ALGOS = [
    ["손 씻기", ["💧 손에 물 묻히기", "🧼 비누칠하기", "👐 30초 문지르기", "🚿 물로 헹구기", "🧻 수건으로 닦기"]],
    ["양치하기", ["🪥 칫솔 꺼내기", "🧴 치약 짜기", "😁 이 닦기", "🥛 물로 입 헹구기"]],
    ["컵라면 끓이기", ["📦 뚜껑 반쯤 열기", "🫖 뜨거운 물 붓기", "⏳ 3분 기다리기", "🥢 먹기"]],
    ["씨앗 심기", ["⛏️ 흙 파기", "🌰 씨앗 넣기", "🟫 흙 덮기", "💧 물 주기"]],
    ["편지 보내기", ["✍️ 편지 쓰기", "✉️ 봉투에 넣기", "🏷️ 우표 붙이기", "📮 우체통에 넣기"]],
    ["신발 신기", ["🧦 양말 신기", "👟 신발 신기", "🎀 끈 묶기"]],
    ["사진 찍기", ["📱 카메라 켜기", "🎯 찍을 것 맞추기", "📸 버튼 누르기", "🖼️ 사진 확인하기"]],
    ["횡단보도 건너기", ["🛑 멈추기", "🚦 초록불 확인하기", "👀 좌우 살피기", "✋ 손 들고 건너기"]],
    ["그림 그리기", ["📄 종이 꺼내기", "✏️ 연필로 밑그림", "🖍️ 색칠하기", "🖼️ 이름 쓰고 걸기"]],
    ["샌드위치 만들기", ["🍞 빵 놓기", "🧈 버터 바르기", "🥬 채소와 햄 올리기", "🍞 빵 덮기"]]
  ];
  // 발자국 길(같은 칸을 다시 밟지 않는 길)을 만들어요
  function walk(n, len) {
    for (let t = 0; t < 50; t++) {
      let x = rnd(0, n - 1), y = rnd(0, n - 1); const path = [[x, y]], moves = [];
      while (moves.length < len) {
        const ok = CLOCK.filter((k) => { const a = x + DIRS[k][0], b = y + DIRS[k][1]; return a >= 0 && b >= 0 && a < n && b < n && !path.some(([p, q]) => p === a && q === b); });
        if (!ok.length) break;
        const k = pick(ok); x += DIRS[k][0]; y += DIRS[k][1]; path.push([x, y]); moves.push(k);
      }
      if (moves.length === len) return { path, moves };
    }
    return walk(n, len - 1);
  }
  const IF_RULES = [
    () => { const w = pick([["☀️", "맑아요"], ["🌧️", "비가 와요"], ["☁️", "흐려요"], ["❄️", "눈이 와요"]]); const wet = w[0] === "🌧️" || w[0] === "❄️";
      return { text: "규칙: 만약 🌧️ 비나 ❄️ 눈이 오면 ☂️ 우산을 챙기고, 아니면 🧢 모자를 써요.<br>오늘 날씨는 " + w[0] + " " + w[1] + ". 무엇을 할까요?", choices: ["☂️ 우산 챙기기", "🧢 모자 쓰기"], answer: wet ? "☂️ 우산 챙기기" : "🧢 모자 쓰기" }; },
    () => { const t = rnd(3, 7), v = rnd(1, 10); return { text: "규칙: 만약 수가 " + t + "보다 크면 🍎, 아니면 🍌가 나와요.<br>수 <b>" + v + "</b>을(를) 넣으면?", choices: ["🍎", "🍌"], answer: v > t ? "🍎" : "🍌", key: t + "/" + v }; },
    () => { const v = rnd(1, 20); return { text: "규칙: 만약 수가 짝수(2, 4, 6…)이면 🔵, 아니면 🔴 버튼이 켜져요.<br>수 <b>" + v + "</b>이면?", choices: ["🔵", "🔴"], answer: v % 2 === 0 ? "🔵" : "🔴" }; },
    () => { const a = pick([["🐶", "강아지", 4], ["🐔", "닭", 2], ["🐱", "고양이", 4], ["🦆", "오리", 2], ["🐘", "코끼리", 4], ["🐧", "펭귄", 2], ["🐴", "말", 4], ["🦅", "독수리", 2]]);
      return { text: "규칙: 만약 다리가 4개이면 🏠 왼쪽 집, 아니면 🏡 오른쪽 집으로 가요.<br>" + a[0] + " " + a[1] + "는 어디로 갈까요?", choices: ["🏠 왼쪽 집", "🏡 오른쪽 집"], answer: a[2] === 4 ? "🏠 왼쪽 집" : "🏡 오른쪽 집" }; },
    () => { const t = rnd(10, 40); return { text: "규칙: 만약 온도가 30℃보다 높으면 🌀 선풍기를 켜고, 아니면 선풍기를 꺼요.<br>지금 온도는 " + t + "℃예요.", choices: ["🌀 선풍기 켜기", "📴 선풍기 끄기"], answer: t > 30 ? "🌀 선풍기 켜기" : "📴 선풍기 끄기", key: String(t) }; },
    () => { const t = rnd(4, 8), list = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).slice(0, 3), big2 = list.filter((v) => v >= t), small = list.filter((v) => v < t);
      if (!big2.length || !small.length) return IF_RULES[1]();
      const a = pick(big2); return { text: "규칙: 만약 수가 " + t + " 이상이면 🎁 선물이 나와요.<br>🎁 선물이 나온 수는?", choices: [a, ...small].map(String), answer: String(a), key: list.join() }; }
  ];

  Quiz.add({
    id: "code3", e: "🕵️", title: "버그 탐정 사무소", grade: "코딩 · 디버깅과 조건",
    missions: [
      { id: "order", e: "📝", name: "순서 바로잡기", desc: "생활 속 알고리즘", gen() {
        const [title, seq] = pick(ALGOS), type = rnd(0, 2);
        const all = ALGOS.flatMap((a) => a[1]);
        if (type === 0) { const hole = rnd(0, seq.length - 1);
          return { text: "'" + title + "' 순서예요. ❓에 들어갈 것은?", visual: "<div class='cd-steps'>" + seq.map((s, i) => "<span>" + (i === hole ? "❓" : s) + "</span>").join("") + "</div>", choices: opts(seq[hole], seq.filter((s) => s !== seq[hole]).concat(shuffle(all).slice(0, 4))), answer: seq[hole], explain: seq.join(" → ") }; }
        if (type === 1) return { text: "'" + title + "'에서 <b>가장 먼저</b> 할 일은?", choices: opts(seq[0], seq.slice(1)), answer: seq[0], explain: seq.join(" → ") };
        const i = rnd(0, seq.length - 2);
        return { text: "'" + title + "'에서 '" + seq[i] + "' <b>다음에</b> 할 일은?", choices: opts(seq[i + 1], seq.filter((_, j) => j !== i + 1 && j !== i)), answer: seq[i + 1], explain: seq.join(" → ") };
      } },
      { id: "bug", e: "🐞", name: "버그 찾기", desc: "틀린 블록은 몇 번?", gen() {
        const n = 4, len = rnd(4, 6), { path, moves } = walk(n, len), b = rnd(0, moves.length - 1);
        const bad = moves.slice(); bad[b] = pick(CLOCK.filter((k) => k !== moves[b]));
        const cells = {}, cls = {};
        path.forEach(([x, y], i) => { cells[x + "," + y] = i === 0 ? "🤖" : i === path.length - 1 ? "🏁" : "👣"; cls[x + "," + y] = i === 0 ? "me" : "foot"; });
        return { text: "🤖가 👣 발자국 길로 🏁까지 가야 해요. 틀린 블록은 몇 번일까요?", visual: side(mini(n, cells, cls), prog(bad.map((k, i) => blk(k, NUMS[i])).join(""))),
          choices: opts(NUMS[b], NUMS.slice(0, moves.length).filter((_, i) => i !== b), 4), answer: NUMS[b], explain: NUMS[b] + "은(는) " + DIRS[moves[b]][2] + " " + WORD[moves[b]] + " 가야 해요." };
      } },
      { id: "loop", e: "🔁", name: "반복 찾기", desc: "반복 블록으로 줄이기", gen() {
        const type = rnd(0, 2);
        if (type === 0) { const k = pick(CLOCK), t = rnd(3, 6);
          return { text: "왼쪽 코드를 오른쪽처럼 반복 블록으로 줄이면 ❓는 몇 번일까요?", visual: side(prog(blk(k).repeat(t)), prog(loopBlk("❓", blk(k)))), choices: opts(t, [t - 1, t + 1, t - 2, t + 2].filter((v) => v > 1)), answer: t, explain: DIRS[k][2] + " " + WORD[k] + " 블록이 " + t + "개 → 🔁 " + t + "번 반복" }; }
        const len = 2, body = [pick(CLOCK)]; body.push(pick(CLOCK.filter((k) => k !== body[0])));
        const t = rnd(2, 3), flat = (b) => b.map((k) => blk(k)).join("");
        if (type === 1) {
          const cands = [body.slice().reverse(), [body[0]], [body[0], pick(CLOCK.filter((k) => k !== body[0] && k !== body[1]))], [body[1]]];
          const key = (b) => b.join(","), seen = new Set([key(body)]), wrong = cands.filter((c) => !seen.has(key(c)) && seen.add(key(c)));
          const show = (b) => loopBlk(t, flat(b));
          return { text: "이 코드는 어떤 블록 묶음을 반복한 걸까요?", visual: prog(flat(body).repeat(t)), choices: [show(body), ...shuffle(wrong).slice(0, 2).map(show)], answer: show(body), explain: runText(body) + " 묶음이 " + t + "번 나와요." };
        }
        const all = len * t;
        return { text: "이 반복 블록을 하나씩 풀어 쓰면 블록이 모두 몇 개일까요?", visual: prog(loopBlk(t, flat(body))), choices: opts(all, [all - 1, all + 1, len + t, t, all + len]), answer: all, explain: "블록 " + len + "개를 " + t + "번 → " + len + " × " + t + " = " + all + "개" };
      } },
      { id: "if", e: "❓", name: "만약에 (조건)", desc: "만약 ~라면, 아니면", gen() { return Object.assign({ explain: "조건이 맞으면 첫 번째 일을, 아니면 다른 일을 해요." }, pick(IF_RULES)()); } },
      { id: "fix", e: "🔧", name: "버그 고치기", desc: "🧩 만들기 · 틀린 블록 하나 고치기", done: "버그 탐정 합격! 코드를 한 줄씩 따라가며 틀린 곳을 찾았어요.", puzzles: [
        { n: 5, start: [0, 4], goal: [3, 2], max: 5, fix: ["right", "right", "down", "up", "up"], hint: "로봇이 판 밖으로 나가요! 틀린 블록을 눌러서 바꿔요.", sol: ["right", "right", "right", "up", "up"].map((k) => ({ k })) },
        { n: 5, start: [0, 0], goal: [4, 0], walls: [[2, 0], [2, 1]], max: 8, fix: ["down", "down", "right", "right", "right", "right", "up", "down"], hint: "거의 다 왔는데 🏁에 닿지 못해요. 어느 블록일까?", sol: ["down", "down", "right", "right", "right", "right", "up", "up"].map((k) => ({ k })) },
        { n: 5, start: [0, 4], goal: [4, 4], walls: [[1, 4], [2, 4], [3, 4], [2, 3]], max: 8, fix: ["up", "up", "right", "down", "right", "right", "down", "down"], hint: "바위에 부딪혀요! 한 블록만 고치면 돼요.", sol: ["up", "up", "right", "right", "right", "right", "down", "down"].map((k) => ({ k })) }
      ], make(api) { codeBoard(api, this.puzzles, this.done); } }
    ]
  });

  // ───────────── 4. 로봇 경주장 ─────────────
  const EVENTS = ["🚩 깃발을 누르면", "⬆️ 위쪽 키를 누르면", "🖱️ 캐릭터를 클릭하면", "🔔 종이 울리면", "⭐ 별에 닿으면", "🧱 벽에 닿으면", "📣 '출발' 신호를 받으면", "⏰ 3초가 지나면"];
  const ACTIONS = ["🎵 음악이 나와요", "🐱 고양이가 위로 움직여요", "💬 '안녕!'이라고 말해요", "🦘 점프해요", "➕ 점수가 1 올라가요", "↩️ 반대로 튕겨요", "🏃 달리기 시작해요", "🌈 색이 바뀌어요"];
  const EVENT_INFO = [
    ["'무엇을 하면 → 무슨 일이 일어난다'처럼 어떤 일이 생겼을 때 코드가 시작되게 하는 것은?", "🎬 이벤트"], ["같은 일을 여러 번 되풀이하는 것은?", "🔁 반복"], ["'만약 ~라면'처럼 상황에 따라 다르게 하는 것은?", "❓ 조건"],
    ["점수나 생명처럼 바뀌는 값을 담아 두는 상자는?", "📦 변수"], ["코드에서 잘못된 부분을 무엇이라고 할까요?", "🐞 버그"], ["일을 하는 순서를 차례대로 정리한 것은?", "📝 알고리즘"]
  ];
  const SIGNALS = { "🔴": "🛑 멈춰요", "🟡": "🐢 천천히 가요", "🟢": "🏎️ 달려요" };
  const MAZES = [
    ["S..X..", ".X.X.X", ".X....", ".XXXX.", "......", "XXX.XG"],
    ["S.X...", "..X.X.", "X...X.", "..XX..", ".X...X", "...X.G"],
    ["S.....", "XXXX..", "...X.X", ".X...X", ".XXXX.", "..G..."]
  ];
  function shortest(m) {
    const n = m.length, find = (ch) => { for (let y = 0; y < n; y++) { const x = m[y].indexOf(ch); if (x >= 0) return [x, y]; } };
    const [sx, sy] = find("S"), [gx, gy] = find("G"), dist = { [sx + "," + sy]: 0 }, q = [[sx, sy]], from = {};
    while (q.length) {
      const [x, y] = q.shift();
      CLOCK.forEach((k) => { const a = x + DIRS[k][0], b = y + DIRS[k][1], key = a + "," + b;
        if (a >= 0 && b >= 0 && a < n && b < n && m[b][a] !== "X" && dist[key] === undefined) { dist[key] = dist[x + "," + y] + 1; from[key] = x + "," + y; q.push([a, b]); } });
    }
    const path = []; let c = gx + "," + gy; while (c) { path.unshift(c); c = from[c]; }
    return { len: dist[gx + "," + gy], path, s: [sx, sy], g: [gx, gy] };
  }

  Quiz.add({
    id: "code4", e: "🏁", title: "로봇 경주장", grade: "코딩 · 이벤트와 알고리즘",
    missions: [
      { id: "event", e: "🎮", name: "이벤트", desc: "~하면 → 일이 일어나요", gen() {
        if (rnd(0, 3) === 0) { const [q, a] = pick(EVENT_INFO); return { text: q, choices: opts(a, EVENT_INFO.map((x) => x[1])), answer: a, explain: a }; }
        const ev = shuffle(EVENTS).slice(0, 3), ac = shuffle(ACTIONS).slice(0, 3), i = rnd(0, 2);
        const script = "<div class='cd-script'>" + ev.map((e, j) => "<span>" + e + " → " + ac[j] + "</span>").join("") + "</div>";
        if (rnd(0, 1)) return { text: "게임 코드를 보고 답해요. <b>" + ev[i] + "</b> 무슨 일이 일어날까요?", visual: script, choices: ac, answer: ac[i], explain: ev[i] + " → " + ac[i] };
        return { text: "게임 코드를 보고 답해요. <b>" + ac[i] + "</b> 하려면 어떻게 해야 할까요?", visual: script, choices: ev, answer: ev[i], explain: ev[i] + " → " + ac[i] };
      } },
      { id: "signal", e: "🚦", name: "신호 따라 달리기", desc: "조건대로 움직이는 자동차", gen() {
        const rule = "<div class='cd-script'>" + Object.entries(SIGNALS).map(([s, a]) => "<span>만약 " + s + " 이면 → " + a + "</span>").join("") + "</div>";
        const seq = Array.from({ length: rnd(4, 6) }, () => pick(Object.keys(SIGNALS)));
        const vis = rule + "<div class='cd-codeline'>🚗 " + seq.map((s, i) => NUMS[i] + s).join(" ") + "</div>";
        if (rnd(0, 1)) { const i = rnd(0, seq.length - 1); return { text: "자동차가 신호를 차례로 만나요. <b>" + NUMS[i] + "</b> 신호에서 자동차는?", visual: vis, choices: Object.values(SIGNALS), answer: SIGNALS[seq[i]], explain: NUMS[i] + " " + seq[i] + " → " + SIGNALS[seq[i]] }; }
        const s = pick(Object.keys(SIGNALS)), cnt = seq.filter((x) => x === s).length;
        return { text: "자동차가 <b>" + SIGNALS[s] + "</b> 횟수는 모두 몇 번일까요?", visual: vis, choices: opts(cnt, [cnt + 1, cnt - 1, cnt + 2].filter((v) => v >= 0)), answer: cnt, explain: s + " 신호가 " + cnt + "번 있어요." };
      } },
      { id: "path", e: "🏎️", name: "가장 짧은 길", desc: "🧩 만들기 · 지름길 찾기", make({ el, box, ctx, pass }) {
        let k = 0, M, best, path;
        const head = el("div", "mg-q"), board = el("div", "cd-board cd-maze"), info = el("div", "cd-count big"), ctrl = el("div", "rb-controls"), msg = el("div", "mg-why");
        const reset = el("button", "btn btn-soft", "🔄 다시 그리기"); ctrl.append(reset);
        box.append(head, board, info, ctrl, msg);
        const say = (t, sfx) => { msg.textContent = t; ctx.speak(t.replace(/[^\p{L}\p{N}\s.,!?]/gu, "")); if (sfx) ctx.sfx(sfx); };
        function show() { M = MAZES[k]; best = shortest(M); path = [best.s.join(",")]; head.textContent = "🏎️ " + (k + 1) + " / " + MAZES.length + " · 🚗에서 🏁까지 가장 짧은 길을 칸을 눌러 그려요"; say("자동차 옆 칸부터 하나씩 눌러 길을 그려요. 가장 짧은 길을 찾아봐요."); draw(); }
        function draw() {
          board.innerHTML = ""; board.style.setProperty("--n", M.length);
          M.forEach((row, y) => row.split("").forEach((c, x) => {
            const key = x + "," + y, i = path.indexOf(key);
            const b = el("button", "cd-cell" + (c === "X" ? " wall" : "") + (i >= 0 ? " road" : "") + (c === "G" ? " goal" : ""), c === "X" ? "🪨" : c === "S" ? "🚗" : c === "G" ? "🏁" : i > 0 ? String(i) : "");
            b.onclick = () => tap(x, y); board.append(b);
          }));
          info.textContent = "지금 " + (path.length - 1) + "칸";
        }
        function tap(x, y) {
          const key = x + "," + y, i = path.indexOf(key);
          if (path[path.length - 1] === best.g.join(",")) return;
          if (i >= 0) { path = path.slice(0, Math.max(1, i + 1)); ctx.sfx("tap"); draw(); return; }
          const [lx, ly] = path[path.length - 1].split(",").map(Number);
          if (M[y][x] === "X") { say("🪨 바위는 지나갈 수 없어요.", "bump"); return; }
          if (Math.abs(lx - x) + Math.abs(ly - y) !== 1) { say("마지막 칸 바로 옆(위·아래·왼쪽·오른쪽) 칸만 이을 수 있어요.", "bump"); return; }
          path.push(key); ctx.sfx("step"); draw();
          if (key === best.g.join(",")) {
            const len = path.length - 1;
            if (len > best.len) { say("🏁 도착! 그런데 " + len + "칸보다 더 짧은 " + best.len + "칸 길이 있어요. 칸을 눌러 길을 고쳐 봐요.", "bump"); path.pop(); draw(); return; }
            say("🎉 " + len + "칸! 가장 짧은 길을 찾았어요.", "win");
            k++;
            if (k >= MAZES.length) { head.textContent = "🎉 지름길 박사! 내비게이션도 이렇게 가장 짧은 길을 찾아요."; pass(); return; }
            setTimeout(show, 1800);
          }
        }
        reset.onclick = () => { path = [best.s.join(",")]; ctx.sfx("tap"); draw(); };
        show();
      } },
      { id: "sort", e: "🔢", name: "줄 세우기", desc: "🧩 만들기 · 옆끼리 바꿔 정렬해요", make({ el, box, ctx, pass }) {
        const ROUNDS = [4, 5, 6];
        let k = 0, list, swaps;
        const head = el("div", "mg-q"), row = el("div", "cd-sort"), info = el("div", "cd-count big"), msg = el("div", "mg-why");
        box.append(head, row, info, msg);
        const say = (t, sfx) => { msg.textContent = t; ctx.speak(t.replace(/[^\p{L}\p{N}\s.,!?]/gu, "")); if (sfx) ctx.sfx(sfx); };
        function show() {
          do { list = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, ROUNDS[k]); } while (list.every((v, i) => !i || list[i - 1] < v));
          swaps = 0; head.textContent = "🔢 " + (k + 1) + " / " + ROUNDS.length + " · 작은 수부터 큰 수로 줄을 세워요";
          say("두 수 사이의 ⇄ 버튼을 누르면 자리가 바뀌어요. 옆 친구와 비교해서 큰 수를 오른쪽으로 보내요."); draw();
        }
        function draw(done) {
          row.innerHTML = "";
          list.forEach((v, i) => {
            row.append(el("div", "cd-num" + (done ? " done" : ""), "<b>" + v + "</b><i style='height:" + (v * 6 + 6) + "px'></i>"));
            if (i < list.length - 1) { const b = el("button", "cd-swap" + (!done && list[i] > list[i + 1] ? " hot" : ""), "⇄"); b.disabled = !!done; b.setAttribute("aria-label", (i + 1) + "번째와 " + (i + 2) + "번째 바꾸기"); b.onclick = () => swap(i); row.append(b); }
          });
          info.textContent = "바꾼 횟수 " + swaps + "번";
        }
        function swap(i) {
          [list[i], list[i + 1]] = [list[i + 1], list[i]]; swaps++; ctx.sfx("pop");
          if (list.every((v, j) => !j || list[j - 1] < v)) {
            draw(true); say("🎉 " + swaps + "번 바꿔서 줄을 세웠어요!", "win"); k++;
            if (k >= ROUNDS.length) { head.textContent = "🎉 정렬 성공! 컴퓨터도 옆끼리 비교하며 줄을 세워요(버블 정렬)."; pass(); return; }
            setTimeout(show, 1800); return;
          }
          draw();
        }
        show();
      } },
      { id: "var", e: "📦", name: "변수 상자", desc: "점수와 생명 계산하기", gen() {
        const type = rnd(0, 2);
        if (type === 0) {
          const start = rnd(0, 3), items = Array.from({ length: rnd(4, 6) }, () => pick(["⭐", "⭐", "💎", "💣"])), val = { "⭐": 1, "💎": 2, "💣": -1 };
          let s = start; items.forEach((e) => { s = Math.max(0, s + val[e]); });
          return { text: "📦 점수 = " + start + "에서 시작해요. ⭐ +1, 💎 +2, 💣 -1 이에요.<br>🤖가 차례로 지나가면 점수는?", visual: "<div class='cd-codeline'>" + items.join(" ") + "</div>", input: true, answer: s, unit: "점", explain: "점수: " + start + " → " + s, key: start + items.join("") };
        }
        if (type === 1) {
          const items = Array.from({ length: rnd(3, 5) }, () => pick(["💔", "💔", "💖"])); let s = 3; items.forEach((e) => { s = Math.min(5, Math.max(0, s + (e === "💖" ? 1 : -1))); });
          return { text: "📦 생명 = 3에서 시작해요. 💔 -1, 💖 +1 이에요.<br>차례로 만나면 생명은 몇 개 남을까요?", visual: "<div class='cd-codeline'>" + items.join(" ") + "</div>", input: true, answer: s, unit: "개", explain: "생명: 3 → " + s, key: items.join("") };
        }
        const t = rnd(2, 5), m = rnd(2, 5), s0 = rnd(0, 5);
        return { text: "📦 사탕은 처음에 " + s0 + "개예요. 코드가 끝나면 사탕은 몇 개일까요?", visual: prog(loopBlk(t, "<span class='cd-blk var'>🍬 사탕에 " + m + " 더하기</span>")), input: true, answer: s0 + t * m, unit: "개", explain: s0 + " + " + m + " × " + t + " = " + (s0 + t * m) };
      } }
    ]
  });

})();
