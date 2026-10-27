// 건물 안 활동: 로봇 조종(코딩: 순서), 자석 실험(창의과학: 예상 → 실험 → 확인)
// 활동 화면은 캔버스 위에 띄우는 큰 창이에요. 태블릿에서 누르기 쉽게 버튼을 크게 했어요.
"use strict";

const Activities = (() => {
  let root, ctx; // ctx: { speak, sfx, award, close, getProgress, setProgress }

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function frame(title, onClose) {
    root.innerHTML = "";
    root.hidden = false;
    const box = el("div", "act-box");
    const head = el("div", "act-head");
    head.append(el("div", "act-title", title));
    const x = el("button", "act-close", "✕");
    x.setAttribute("aria-label", "닫기");
    x.onclick = () => { ctx.sfx("tap"); onClose && onClose(); close(); };
    head.append(x);
    box.append(head);
    const body = el("div", "act-body");
    box.append(body);
    root.append(box);
    return body;
  }

  function close() { root.hidden = true; root.innerHTML = ""; if (window.speechSynthesis) window.speechSynthesis.cancel(); ctx.close(); }

  // ───────────────────────── 🤖 로봇 조종 ─────────────────────────
  // 칸 좌표는 [열, 행], 0행이 맨 위예요.
  const LEVELS = [
    { start: [0, 4], goal: [3, 4], boxes: [], hint: "삐삐를 오른쪽으로 3칸 보내 볼까?" },
    { start: [0, 4], goal: [0, 1], boxes: [], hint: "이번에는 위로 가야 해!" },
    { start: [0, 4], goal: [3, 1], boxes: [], hint: "오른쪽으로 갔다가 위로! 두 방향을 섞어 보자." },
    { start: [0, 4], goal: [4, 1], boxes: [[1, 4], [2, 4], [3, 3]], hint: "상자 📦에 부딪히면 안 돼! 돌아가는 길을 찾아봐." },
    { start: [0, 4], goal: [4, 0], boxes: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]], hint: "상자 사이로 지그재그! 천천히 한 칸씩 생각해 보자." },
    { start: [2, 4], goal: [2, 0], boxes: [[1, 2], [2, 2], [3, 2]], hint: "가운데가 막혔어. 옆으로 돌아서 가 볼까?" }
  ];
  const ARROWS = { up: ["⬆️", 0, -1, "위"], down: ["⬇️", 0, 1, "아래"], left: ["⬅️", -1, 0, "왼쪽"], right: ["➡️", 1, 0, "오른쪽"] };
  const MAX_CARDS = 14;

  function robot() {
    const prog = ctx.getProgress("robot") || { cleared: 0 };
    let level = Math.min(prog.cleared, LEVELS.length - 1);
    let program = [];
    let running = false;

    const body = frame("🤖 로봇 삐삐에게 길 알려주기");
    const top = el("div", "rb-top");
    const levelTag = el("div", "rb-level");
    const hint = el("div", "rb-hint");
    top.append(levelTag, hint);
    const main = el("div", "rb-main");
    const board = el("div", "rb-board");
    const side = el("div", "rb-side");
    main.append(board, side);
    const palette = el("div", "rb-palette");
    const strip = el("div", "rb-strip");
    const controls = el("div", "rb-controls");
    side.append(el("div", "rb-label", "① 화살표를 눌러 길을 만들어요"), palette, el("div", "rb-label", "② 내가 만든 명령"), strip, controls);
    body.append(top, main);

    Object.entries(ARROWS).forEach(([k, a]) => {
      const b = el("button", "rb-arrow", a[0]);
      b.setAttribute("aria-label", a[3]);
      b.onclick = () => { if (running) return; if (program.length >= MAX_CARDS) { ctx.sfx("bump"); return; } program.push(k); ctx.sfx("tap"); drawStrip(); };
      palette.append(b);
    });
    const undo = el("button", "btn btn-soft", "↩️ 하나 지우기");
    const clear = el("button", "btn btn-soft", "🗑️ 모두 지우기");
    const go = el("button", "btn btn-go", "▶ 출발!");
    controls.append(undo, clear, go);
    undo.onclick = () => { if (running) return; program.pop(); ctx.sfx("tap"); drawStrip(); };
    clear.onclick = () => { if (running) return; program = []; ctx.sfx("tap"); drawStrip(); resetRobot(); };
    go.onclick = run;

    const cells = [];
    let robotEl, goalEl;
    const msg = el("div", "rb-msg");
    board.append(msg);

    function setup() {
      const L = LEVELS[level];
      board.querySelectorAll(".rb-cell,.rb-robot").forEach((n) => n.remove());
      cells.length = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const cell = el("div", "rb-cell");
        cell.style.gridColumn = c + 1; cell.style.gridRow = r + 1;
        if (L.boxes.some(([x, y]) => x === c && y === r)) cell.textContent = "📦", cell.classList.add("box");
        if (L.goal[0] === c && L.goal[1] === r) { cell.textContent = "🔋"; cell.classList.add("goal"); goalEl = cell; }
        board.append(cell); cells.push(cell);
      }
      robotEl = el("div", "rb-robot", "🤖");
      board.append(robotEl);
      levelTag.textContent = (level + 1) + "단계 / " + LEVELS.length;
      hint.textContent = L.hint;
      program = [];
      drawStrip(); resetRobot(); showMsg("");
      ctx.speak(L.hint);
    }

    function place(c, r) { robotEl.style.left = (c * 20) + "%"; robotEl.style.top = (r * 20) + "%"; }
    function resetRobot() { const L = LEVELS[level]; place(L.start[0], L.start[1]); robotEl.classList.remove("shake", "happy"); }

    function drawStrip(active = -1) {
      strip.innerHTML = "";
      if (!program.length) strip.append(el("div", "rb-empty", "아직 비어 있어요"));
      program.forEach((k, i) => {
        const card = el("button", "rb-card" + (i === active ? " active" : ""), ARROWS[k][0]);
        card.title = "눌러서 지우기";
        card.onclick = () => { if (running) return; program.splice(i, 1); ctx.sfx("tap"); drawStrip(); };
        strip.append(card);
      });
      go.disabled = !program.length;
    }

    function showMsg(text, kind) { msg.textContent = text; msg.className = "rb-msg" + (kind ? " " + kind : ""); msg.hidden = !text; }

    async function run() {
      if (running || !program.length) return;
      running = true; go.disabled = true;
      const L = LEVELS[level];
      let [c, r] = L.start;
      resetRobot(); showMsg("");
      await wait(250);
      for (let i = 0; i < program.length; i++) {
        drawStrip(i);
        const [, dx, dy] = ARROWS[program[i]];
        const nc = c + dx, nr = r + dy;
        if (nc < 0 || nc > 4 || nr < 0 || nr > 4) return fail("앗! 길 밖으로는 갈 수 없어요.", i);
        if (L.boxes.some(([x, y]) => x === nc && y === nr)) { place(c + dx * 0.3, r + dy * 0.3); await wait(180); place(c, r); return fail("쿵! 상자에 부딪혔어요.", i); }
        c = nc; r = nr; place(c, r); ctx.sfx("step");
        await wait(480);
        if (c === L.goal[0] && r === L.goal[1]) {
          if (i < program.length - 1) { /* 배터리에 먼저 닿으면 성공으로 쳐요 */ }
          return win();
        }
      }
      fail("배터리까지 조금 더 가야 해요. 명령을 더 넣어 볼까?", -1);
    }

    async function fail(text, at) {
      robotEl.classList.add("shake"); ctx.sfx("bump");
      showMsg(text + " 다시 해 봐요!", "bad"); ctx.speak(text + " 다시 해 봐요!");
      drawStrip(at);
      await wait(900);
      robotEl.classList.remove("shake");
      running = false; go.disabled = false;
      setTimeout(() => { if (!running && msg.classList.contains("bad")) showMsg(""); }, 1600);
    }

    function win() {
      robotEl.classList.add("happy"); goalEl.textContent = "⚡"; ctx.sfx("win");
      const p = ctx.getProgress("robot") || { cleared: 0 };
      if (level + 1 > p.cleared) { p.cleared = level + 1; ctx.setProgress("robot", p); }
      const last = level === LEVELS.length - 1;
      if (p.cleared >= LEVELS.length) ctx.award("robot");
      showMsg(last ? "🎉 모든 단계 성공! 너는 진짜 코딩 박사야!" : "🎉 성공! 삐삐가 배터리를 먹었어요!", "good");
      ctx.speak(last ? "모든 단계 성공! 너는 진짜 코딩 박사야!" : "성공! 삐삐가 배터리를 먹었어요!");
      const next = el("button", "btn btn-go rb-next", last ? "🔁 처음부터 다시" : "다음 단계 ▶");
      next.onclick = () => { ctx.sfx("tap"); level = last ? 0 : level + 1; running = false; next.remove(); setup(); };
      msg.append(el("br"), next);
    }

    setup();
  }

  // ───────────────────────── 🧲 자석 실험 ─────────────────────────
  const ITEMS = [
    { e: "📎", n: "클립", yes: true, why: "클립은 철로 만들어서 자석에 붙어요." },
    { e: "🧷", n: "옷핀", yes: true, why: "옷핀은 철로 만들어서 자석에 붙어요." },
    { e: "🔩", n: "나사", yes: true, why: "나사는 철로 만들어서 자석에 붙어요." },
    { e: "✂️", n: "가위", yes: true, why: "가위의 날은 철로 만들어서 자석에 붙어요." },
    { e: "🔧", n: "스패너", yes: true, why: "스패너는 철로 만들어서 자석에 붙어요." },
    { e: "⚙️", n: "철 톱니바퀴", yes: true, why: "철로 만든 톱니바퀴는 자석에 붙어요." },
    { e: "✏️", n: "연필", yes: false, why: "연필은 나무와 흑연이라 자석에 붙지 않아요." },
    { e: "📄", n: "종이", yes: false, why: "종이는 자석에 붙지 않아요." },
    { e: "🧸", n: "곰 인형", yes: false, why: "곰 인형은 천과 솜이라 자석에 붙지 않아요." },
    { e: "🪵", n: "나무 토막", yes: false, why: "나무는 자석에 붙지 않아요." },
    { e: "🥛", n: "유리컵", yes: false, why: "유리는 자석에 붙지 않아요." },
    { e: "🏀", n: "고무공", yes: false, why: "고무는 자석에 붙지 않아요." },
    { e: "🧦", n: "양말", yes: false, why: "천으로 만든 양말은 자석에 붙지 않아요." },
    { e: "🍎", n: "사과", yes: false, why: "사과는 자석에 붙지 않아요." }
  ];
  const ROUND = 8;

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function magnet() {
    const yes = shuffle(ITEMS.filter((i) => i.yes)).slice(0, ROUND / 2);
    const no = shuffle(ITEMS.filter((i) => !i.yes)).slice(0, ROUND / 2);
    const items = shuffle(yes.concat(no));
    let idx = 0, right = 0, busy = false;

    const body = frame("🧲 자석에 붙을까? 예상하고 실험해요");
    const steps = el("div", "mg-steps", "<span class='on'>① 예상하기</span><span>② 실험하기</span><span>③ 알아내기</span>");
    const count = el("div", "mg-count");
    const stage = el("div", "mg-stage");
    const mag = el("div", "mg-magnet", "🧲");
    const item = el("div", "mg-item");
    const spark = el("div", "mg-spark", "✨");
    stage.append(mag, item, spark);
    const q = el("div", "mg-q");
    const btns = el("div", "mg-btns");
    const bYes = el("button", "btn btn-big mg-yes", "🧲 붙어요!");
    const bNo = el("button", "btn btn-big mg-no", "✋ 안 붙어요!");
    btns.append(bYes, bNo);
    const result = el("div", "mg-result");
    const baskets = el("div", "mg-baskets");
    const bkYes = el("div", "mg-basket", "<b>붙는 것</b><div></div>");
    const bkNo = el("div", "mg-basket", "<b>안 붙는 것</b><div></div>");
    baskets.append(bkYes, bkNo);
    body.append(steps, count, stage, q, btns, result, baskets);

    function setStep(n) { steps.querySelectorAll("span").forEach((s, i) => s.classList.toggle("on", i === n)); }

    function show() {
      const it = items[idx];
      busy = false;
      item.textContent = it.e; item.className = "mg-item";
      spark.className = "mg-spark";
      count.textContent = (idx + 1) + " / " + items.length;
      q.textContent = it.n + "은(는) 자석에 붙을까?";
      result.innerHTML = ""; btns.hidden = false; setStep(0);
      ctx.speak(it.n + "은 자석에 붙을까?");
    }

    async function guess(say) {
      if (busy) return;
      busy = true; btns.hidden = true; ctx.sfx("tap");
      const it = items[idx];
      setStep(1);
      q.textContent = "실험해 보자! 자석을 가까이…";
      item.classList.add("near");
      await wait(900);
      if (it.yes) { item.classList.add("stick"); spark.classList.add("on"); ctx.sfx("snap"); }
      else { item.classList.add("wobble"); ctx.sfx("thud"); }
      await wait(700);
      setStep(2);
      const ok = say === it.yes;
      if (ok) right++;
      q.textContent = it.yes ? "딱! 붙었어요!" : "그대로예요. 안 붙어요!";
      result.innerHTML = "";
      result.append(el("div", "mg-verdict " + (ok ? "good" : "soso"), ok ? "⭕ 예상이 맞았어요!" : "🤔 예상과 달랐어요. 그래도 실험으로 알아냈어요!"));
      result.append(el("div", "mg-why", it.why));
      ctx.speak((ok ? "예상이 맞았어요! " : "예상과 달랐어요. ") + it.why);
      (it.yes ? bkYes : bkNo).querySelector("div").append(el("span", "", it.e));
      const next = el("button", "btn btn-go", idx === items.length - 1 ? "결과 보기 ▶" : "다음 물건 ▶");
      next.onclick = () => { ctx.sfx("tap"); idx++; if (idx < items.length) show(); else finish(); };
      result.append(next);
    }

    function finish() {
      ctx.sfx("win");
      ctx.award("magnet");
      stage.hidden = true; btns.hidden = true; count.textContent = "";
      setStep(-1);
      q.textContent = "🎉 실험 끝!";
      result.innerHTML = "";
      result.append(el("div", "mg-verdict good", items.length + "개 중 " + right + "개 예상이 맞았어요!"));
      result.append(el("div", "mg-why", "알아낸 것: <b>철</b>로 만든 물건은 자석에 붙어요. 나무, 종이, 유리, 고무, 천은 붙지 않아요."));
      ctx.speak(items.length + "개 중 " + right + "개 예상이 맞았어요! 철로 만든 물건은 자석에 붙어요.");
      const again = el("button", "btn btn-go", "🔁 다른 물건으로 다시");
      again.onclick = () => { ctx.sfx("tap"); magnet(); };
      result.append(again);
    }

    bYes.onclick = () => guess(true);
    bNo.onclick = () => guess(false);
    show();
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function init(rootEl, context) { root = rootEl; ctx = context; }
  function open(id) { if (id === "robot") robot(); else if (id === "magnet") magnet(); }
  function isOpen() { return root && !root.hidden; }

  return { init, open, close: () => isOpen() && close(), isOpen, LEVELS };
})();
