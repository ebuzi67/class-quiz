// 🌻 반복 정원 (코딩: 반복)
// 꽃 카드를 "반복 상자"에 넣고 몇 번 반복할지 정하면, 콩콩 농부가 밭에 차례대로 심어요.
// 목표 무늬와 똑같이 심으면 성공이에요. 카드는 3장까지만 넣을 수 있어서 반복을 써야 해요.
"use strict";

Activities.register("garden", ({ el, frame, wait, ctx }) => {
  const CARDS = { S: ["🌻", "해바라기"], T: ["🌷", "튤립"], _: ["⬜", "건너뛰기"] };
  const LEVELS = [
    { rows: 1, pattern: "SSSSSS", hint: "해바라기를 6개 심어요. 🌻 카드 1장을 6번 반복하면 끝!" },
    { rows: 1, pattern: "STSTST", hint: "🌻 🌷 🌻 🌷… 무엇을 반복하면 될까?" },
    { rows: 1, pattern: "S_S_S_", hint: "한 칸씩 건너뛰며 심어 볼까? ⬜는 건너뛰기 카드예요." },
    { rows: 1, pattern: "TTSTTS", hint: "🌷 🌷 🌻 이 두 번 나와요!" },
    { rows: 4, pattern: "ST".repeat(12), hint: "이번에는 밭 전체 24칸! 🌻 🌷 를 몇 번 반복해야 할까?" },
    { rows: 4, pattern: "SST".repeat(8), hint: "마지막! 🌻 🌻 🌷 무늬로 밭 전체를 채워요." }
  ];
  const MAX_BODY = 3, MAX_TIMES = 12;

  const prog = ctx.getProgress("garden") || { cleared: 0 };
  let level = Math.min(prog.cleared, LEVELS.length - 1);
  let body = [], times = 2, running = false;

  const root = frame("🌻 반복 정원: 꽃밭 무늬 만들기");
  const top = el("div", "rb-top");
  const levelTag = el("div", "rb-level"), hint = el("div", "rb-hint");
  top.append(levelTag, hint);
  const main = el("div", "gd-main");
  const board = el("div", "gd-board");
  const side = el("div", "gd-side");
  main.append(board, side);
  root.append(top, main);

  const palette = el("div", "rb-palette");
  Object.entries(CARDS).forEach(([k, [e, name]]) => {
    const b = el("button", "rb-arrow gd-card", e);
    b.setAttribute("aria-label", name);
    b.onclick = () => { if (running) return; if (body.length >= MAX_BODY) { ctx.sfx("bump"); flash(MAX_BODY + "장까지만 넣을 수 있어요. 반복 횟수를 바꿔 봐요!"); return; } body.push(k); ctx.sfx("tap"); drawLoop(); };
    palette.append(b);
  });

  const loop = el("div", "gd-loop");
  const loopHead = el("div", "gd-loop-head");
  const minus = el("button", "gd-step", "−"), plus = el("button", "gd-step", "+"), timesEl = el("b", "gd-times");
  loopHead.append(el("span", "", "🔁"), minus, timesEl, plus, el("span", "", "번 반복"));
  const slots = el("div", "gd-slots");
  loop.append(loopHead, slots);
  minus.onclick = () => { if (running) return; times = Math.max(1, times - 1); ctx.sfx("tap"); drawLoop(); };
  plus.onclick = () => { if (running) return; times = Math.min(MAX_TIMES, times + 1); ctx.sfx("tap"); drawLoop(); };

  const reading = el("div", "gd-reading");
  const controls = el("div", "rb-controls");
  const clear = el("button", "btn btn-soft", "🗑️ 비우기");
  const go = el("button", "btn btn-go", "▶ 심기 시작!");
  controls.append(clear, go);
  clear.onclick = () => { if (running) return; body = []; ctx.sfx("tap"); drawLoop(); resetBoard(); };
  go.onclick = run;
  const msg = el("div", "gd-msg");
  side.append(el("div", "rb-label", "① 꽃 카드를 눌러 반복 상자에 넣어요"), palette,
    el("div", "rb-label", "② 몇 번 반복할지 정해요"), loop, reading, controls, msg);

  let cells = [], farmer;

  function setup() {
    const L = LEVELS[level];
    board.innerHTML = "";
    board.style.gridTemplateRows = "repeat(" + L.rows + ", 1fr)";
    board.classList.toggle("one-row", L.rows === 1);
    cells = [];
    for (let i = 0; i < L.pattern.length; i++) {
      const c = el("div", "gd-cell");
      c.append(el("span", "ghost", L.pattern[i] === "_" ? "" : CARDS[L.pattern[i]][0]), el("span", "plant", ""));
      board.append(c); cells.push(c);
    }
    farmer = el("div", "gd-farmer", "🧑‍🌾");
    board.append(farmer);
    levelTag.textContent = (level + 1) + "단계 / " + LEVELS.length;
    hint.textContent = L.hint;
    body = []; times = 2;
    drawLoop(); resetBoard(); flash("");
    ctx.speak(L.hint);
  }

  function resetBoard() {
    cells.forEach((c) => { c.querySelector(".plant").textContent = ""; c.classList.remove("bad", "on"); });
    farmer.hidden = true;
  }

  function drawLoop() {
    timesEl.textContent = times;
    slots.innerHTML = "";
    for (let i = 0; i < MAX_BODY; i++) {
      const k = body[i];
      const s = el("button", "gd-slot" + (k ? " full" : ""), k ? CARDS[k][0] : "");
      if (k) s.onclick = () => { if (running) return; body.splice(i, 1); ctx.sfx("tap"); drawLoop(); };
      slots.append(s);
    }
    const total = body.length * times;
    reading.innerHTML = body.length
      ? "<b>" + body.map((k) => CARDS[k][0]).join(" ") + "</b> 을(를) <b>" + times + "번</b> 반복해요 → 모두 <b>" + total + "칸</b>"
      : "반복 상자가 비어 있어요";
    go.disabled = !body.length;
  }

  function flash(text, kind) { msg.textContent = text; msg.className = "gd-msg" + (kind ? " " + kind : ""); }

  function moveFarmer(i) {
    const c = cells[i];
    farmer.hidden = false;
    farmer.style.left = c.offsetLeft + "px"; farmer.style.top = c.offsetTop + "px";
    farmer.style.width = c.offsetWidth + "px"; farmer.style.height = c.offsetHeight + "px";
  }

  async function run() {
    if (running || !body.length) return;
    running = true; go.disabled = true; resetBoard(); flash("");
    const L = LEVELS[level];
    const steps = [];
    for (let t = 0; t < times; t++) steps.push(...body);
    const delay = L.pattern.length > 6 ? 150 : 320;
    for (let i = 0; i < steps.length; i++) {
      if (i >= cells.length) {
        ctx.sfx("bump");
        return done("앗! 밭 밖으로 나갔어요. 반복 횟수를 줄여 봐요.", "bad");
      }
      moveFarmer(i);
      cells[i].classList.add("on");
      if (steps[i] !== "_") { cells[i].querySelector(".plant").textContent = CARDS[steps[i]][0]; ctx.sfx("pop"); }
      await wait(delay);
    }
    farmer.hidden = true;
    const wrong = cells.filter((c, i) => (steps[i] || "") !== L.pattern[i]);
    wrong.forEach((c) => c.classList.add("bad"));
    if (steps.length < cells.length) return done("빈 칸이 남았어요. 반복을 더 늘려 봐요!", "bad");
    if (wrong.length) return done("빨간 칸이 무늬와 달라요. 반복 상자 안의 카드를 살펴봐요!", "bad");
    win();
  }

  function done(text, kind) {
    ctx.sfx("bump"); flash(text, kind); ctx.speak(text);
    running = false; go.disabled = false;
  }

  function win() {
    ctx.sfx("win");
    const p = ctx.getProgress("garden") || { cleared: 0 };
    if (level + 1 > p.cleared) { p.cleared = level + 1; ctx.setProgress("garden", p); }
    if (p.cleared >= LEVELS.length) ctx.award("garden");
    const last = level === LEVELS.length - 1;
    const said = "성공! " + (body.length * times) + "칸을 카드 " + body.length + "장으로 심었어요. 이게 반복의 힘이에요!";
    flash("🎉 " + said, "good"); ctx.speak(said);
    const next = el("button", "btn btn-go", last ? "🔁 처음부터 다시" : "다음 단계 ▶");
    next.onclick = () => { ctx.sfx("tap"); level = last ? 0 : level + 1; running = false; setup(); };
    msg.append(el("br"), next);
  }

  setup();
});
