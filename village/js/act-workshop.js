// 🛠️ 발명 공방 (창의: 부품을 골라 발명품 만들기)
// 미션마다 필요한 부품을 생각해서 작업대에 올리고(5개까지) "만들기!"를 눌러요.
// 작동하면 발명품이 움직이고, 안 되면 왜 안 되는지 알려 줘요(전구에는 건전지, 벽돌은 가라앉아요 등).
"use strict";

Activities.register("workshop", ({ el, frame, wait, ctx }) => {
  const PARTS = {
    box: ["📦", "상자 몸통"], wheel: ["⚫", "바퀴"], wing: ["🪶", "날개"], prop: ["🌀", "프로펠러"], balloon: ["🎈", "풍선"],
    bulb: ["💡", "전구"], battery: ["🔋", "건전지"], wood: ["🪵", "나무판"], bottle: ["🧴", "빈 병"], stone: ["🧱", "벽돌"],
    bell: ["🔔", "종"], magnet: ["🧲", "자석"]
  };
  const has = (set, ...ks) => ks.some((k) => set.includes(k));
  const MISSIONS = [
    { id: "car", e: "🚗", title: "앞으로 달리는 자동차", obj: "자동차를", move: "drive",
      check: (p) => !has(p, "wheel") ? "바퀴가 없으면 굴러가지 않아요! 바퀴 ⚫를 달아 볼까?" : null },
    { id: "fly", e: "✈️", title: "하늘을 나는 발명품", obj: "발명품을", move: "fly",
      check: (p) => has(p, "stone") ? "벽돌 🧱이 너무 무거워서 날 수 없어요!" : !has(p, "wing", "prop", "balloon") ? "하늘을 날려면 날개, 프로펠러, 풍선 중 하나가 필요해요." : null },
    { id: "lamp", e: "🏮", title: "밤에 빛나는 등불", obj: "등불을", move: "glow",
      check: (p) => !has(p, "bulb") ? "빛을 내는 전구 💡가 필요해요." : !has(p, "battery") ? "전구에 불이 켜지려면 전기를 주는 건전지 🔋가 필요해요!" : null },
    { id: "boat", e: "⛵", title: "물에 뜨는 배", obj: "배를", move: "float",
      check: (p) => has(p, "stone") ? "벽돌 🧱은 물에 가라앉아요! 빼 볼까?" : !has(p, "wood", "bottle") ? "물에 뜨는 나무판 🪵이나 빈 병 🧴이 필요해요." : null }
  ];
  const MAX = 5;

  const prog = ctx.getProgress("workshop") || { done: [] };
  let mission = Math.max(0, MISSIONS.findIndex((m) => !prog.done.includes(m.id)));
  let bench = [], busy = false;

  const root = frame("🛠️ 발명 공방: 나만의 발명품 만들기");
  const tabs = el("div", "ws-tabs");
  const q = el("div", "mg-q");
  const main = el("div", "ws-main");
  const shelf = el("div", "ws-shelf");
  const right = el("div", "ws-right");
  const table = el("div", "ws-table");
  const stage = el("div", "ws-stage");
  const thing = el("div", "ws-thing");
  stage.append(thing);
  const controls = el("div", "rb-controls");
  const clear = el("button", "btn btn-soft", "🗑️ 비우기");
  const make = el("button", "btn btn-go", "🔧 만들기!");
  controls.append(clear, make);
  const say = el("div", "mg-result");
  right.append(el("div", "rb-label", "작업대 (" + MAX + "개까지)"), table, controls, stage, say);
  main.append(shelf, right);
  root.append(tabs, q, main);

  Object.entries(PARTS).forEach(([k, [e, n]]) => {
    const b = el("button", "ws-part", "<span>" + e + "</span>" + n);
    b.onclick = () => {
      if (busy) return;
      if (bench.length >= MAX) { ctx.sfx("bump"); say.innerHTML = "<div class='mg-why'>작업대가 꽉 찼어요. 필요 없는 부품을 눌러 빼요.</div>"; return; }
      bench.push(k); ctx.sfx("pop"); draw();
    };
    shelf.append(b);
  });
  clear.onclick = () => { if (busy) return; bench = []; ctx.sfx("tap"); draw(); };
  make.onclick = build;

  function drawTabs() {
    const done = (ctx.getProgress("workshop") || { done: [] }).done;
    tabs.innerHTML = "";
    MISSIONS.forEach((m, i) => {
      const t = el("button", "ws-tab" + (i === mission ? " on" : "") + (done.includes(m.id) ? " done" : ""), m.e + (done.includes(m.id) ? " ✅" : ""));
      t.onclick = () => { if (busy) return; ctx.sfx("tap"); mission = i; start(); };
      tabs.append(t);
    });
  }

  function start() {
    const m = MISSIONS[mission];
    bench = []; say.innerHTML = ""; thing.className = "ws-thing"; stage.className = "ws-stage";
    const what = m.title.slice(0, m.title.lastIndexOf(" ") + 1) + m.obj;
    q.textContent = "미션 " + (mission + 1) + ": " + m.e + " " + what + " 만들어요!";
    ctx.speak(what + " 만들어요! 필요한 부품을 골라 보세요.");
    drawTabs(); draw();
  }

  function draw() {
    table.innerHTML = "";
    for (let i = 0; i < MAX; i++) {
      const k = bench[i];
      const s = el("button", "gd-slot" + (k ? " full" : ""), k ? PARTS[k][0] : "");
      if (k) s.onclick = () => { if (busy) return; bench.splice(i, 1); ctx.sfx("tap"); draw(); };
      table.append(s);
    }
    thing.textContent = bench.map((k) => PARTS[k][0]).join("");
    make.disabled = !bench.length;
  }

  async function build() {
    if (busy || !bench.length) return;
    busy = true; make.disabled = true;
    const m = MISSIONS[mission];
    say.innerHTML = "";
    stage.className = "ws-stage " + (m.move === "float" ? "water" : m.move === "glow" ? "night" : m.move === "fly" ? "sky" : "road");
    thing.className = "ws-thing shake"; ctx.sfx("thud");
    await wait(700);
    const problem = m.check(bench);
    if (problem) {
      thing.className = "ws-thing" + (m.move === "float" && has(bench, "stone") ? " sink" : " flop");
      ctx.sfx("bump");
      say.append(el("div", "mg-verdict soso", "🤔 앗, 잘 안 돼요!"), el("div", "mg-why", problem));
      ctx.speak("앗, 잘 안 돼요! " + problem);
      busy = false; make.disabled = false;
      return;
    }
    thing.className = "ws-thing " + m.move; ctx.sfx("win");
    const p = ctx.getProgress("workshop") || { done: [] };
    if (!p.done.includes(m.id)) { p.done.push(m.id); ctx.setProgress("workshop", p); }
    const text = "발명 성공! 부품 " + bench.length + "개로 " + m.title.slice(0, m.title.lastIndexOf(" ") + 1) + m.obj + " 만들었어요!";
    say.append(el("div", "mg-verdict good", "🎉 " + text));
    ctx.speak(text);
    if (p.done.length >= MISSIONS.length) {
      ctx.award("workshop");
      say.append(el("div", "mg-why", "미션을 모두 해냈어요! 이제 마음대로 다른 발명품도 만들어 봐요."));
    }
    const nextI = MISSIONS.findIndex((x) => !p.done.includes(x.id));
    if (nextI >= 0) {
      const next = el("button", "btn btn-go", "다음 미션 ▶");
      next.onclick = () => { ctx.sfx("tap"); mission = nextI; start(); };
      say.append(next);
    }
    drawTabs();
    busy = false; make.disabled = false;
  }

  start();
});
