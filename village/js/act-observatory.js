// 🔭 별 관측소 (창의과학: 낮과 밤, 달 모양)
// ① 낮일까 밤일까?: 지구 위 친구가 해를 보는 쪽에 있으면 낮, 반대쪽이면 밤이에요. 4문제.
// ② 달 모양 순서: 달이 차오르고 줄어드는 순서에서 빈칸에 들어갈 달을 골라요. 4문제.
"use strict";

Activities.register("observatory", ({ el, frame, wait, shuffle, ctx }) => {
  // 우리나라(북반구)에서 보이는 순서예요
  const MOONS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const MOON_NAMES = { "🌑": "안 보이는 달", "🌒": "초승달", "🌓": "반달", "🌔": "볼록한 달", "🌕": "보름달", "🌖": "볼록한 달", "🌗": "반달", "🌘": "그믐달" };

  const root = frame("🔭 별 관측소: 낮과 밤, 달 모양");
  const steps = el("div", "mg-steps", "<span>① 낮일까 밤일까?</span><span>② 달 모양 순서</span>");
  const area = el("div", "gh-area");
  root.append(steps, area);
  const setStep = (n) => steps.querySelectorAll("span").forEach((s, i) => s.classList.toggle("on", i === n));

  // ── ① 낮과 밤 ──
  function dayNight() {
    setStep(0);
    area.innerHTML = "";
    // 각도: 180° = 해 쪽(왼쪽, 낮), 0° = 반대쪽(오른쪽, 밤). 해가 뜨고 지는 경계(90°, 270°)는 내지 않아요.
    const angles = shuffle([180, 150, 215, 0, 35, 325]).slice(0, 4);
    let i = 0, right = 0;
    const q = el("div", "mg-q");
    const space = el("div", "ob-space");
    const sun = el("div", "ob-sun", "☀️");
    const rays = el("div", "ob-rays");
    const earth = el("div", "ob-earth");
    const kid = el("div", "ob-kid", "🧒");
    earth.append(el("div", "ob-shade"), kid);
    space.append(sun, rays, earth);
    const btns = el("div", "mg-btns");
    const bDay = el("button", "btn btn-big ob-day", "☀️ 낮");
    const bNight = el("button", "btn btn-big ob-night", "🌙 밤");
    btns.append(bDay, bNight);
    const say = el("div", "mg-result");
    area.append(q, space, btns, say);

    function show() {
      const a = angles[i];
      // 친구를 지구 둘레에 세워요(0°는 오른쪽, 위쪽이 90°)
      const rad = (a * Math.PI) / 180;
      kid.style.left = 50 + Math.cos(rad) * 50 + "%"; kid.style.top = 50 - Math.sin(rad) * 50 + "%";
      kid.style.transform = "translate(-50%, -50%) rotate(" + (90 - a) + "deg)";
      q.textContent = (i + 1) + " / " + angles.length + " · 지구에 사는 친구 🧒는 지금 낮일까요, 밤일까요?";
      ctx.speak("지구에 사는 친구는 지금 낮일까요, 밤일까요?");
      btns.hidden = false; say.innerHTML = "";
    }

    function answer(sayDay) {
      const isDay = Math.cos((angles[i] * Math.PI) / 180) < 0;
      const ok = sayDay === isDay;
      if (ok) right++;
      ctx.sfx(ok ? "snap" : "thud");
      btns.hidden = true;
      const why = isDay ? "친구가 해를 보는 쪽에 있어서 낮이에요." : "친구가 해의 반대쪽에 있어서 밤이에요.";
      say.append(el("div", "mg-verdict " + (ok ? "good" : "soso"), ok ? "⭕ 맞았어요!" : "🤔 다시 볼까요?"), el("div", "mg-why", why));
      ctx.speak((ok ? "맞았어요! " : "") + why);
      const next = el("button", "btn btn-go", i + 1 < angles.length ? "지구 돌리기 🔄" : "② 달 모양으로 ▶");
      next.onclick = () => {
        ctx.sfx("tap");
        i++;
        if (i < angles.length) { earth.classList.remove("spin"); void earth.offsetWidth; earth.classList.add("spin"); show(); }
        else moon();
      };
      say.append(next);
    }

    bDay.onclick = () => answer(true);
    bNight.onclick = () => answer(false);
    area.append(el("div", "ob-note", "지구는 하루에 한 바퀴 돌아요. 그래서 낮과 밤이 바뀌어요."));
    show();
  }

  // ── ② 달 모양 순서 ──
  function moon() {
    setStep(1);
    area.innerHTML = "";
    const starts = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
    let i = 0;
    const q = el("div", "mg-q");
    const row = el("div", "ob-moons");
    const btns = el("div", "ob-choices");
    const say = el("div", "mg-result");
    area.append(q, row, btns, say, el("div", "ob-note", "달은 약 한 달 동안 🌑 → 🌓 → 🌕 → 🌗 → 🌑 처럼 모양이 바뀌어요."));

    function show() {
      const s = starts[i];
      const seq = [0, 1, 2, 3].map((k) => MOONS[(s + k) % 8]);
      const hole = 1 + Math.floor(Math.random() * 3);
      const answerMoon = seq[hole];
      row.innerHTML = "";
      seq.forEach((m, k) => row.append(el("div", "ob-moon" + (k === hole ? " hole" : ""), k === hole ? "❓" : m)));
      q.textContent = (i + 1) + " / " + starts.length + " · 달이 날마다 바뀌어요. ❓에 들어갈 달은?";
      ctx.speak("달이 날마다 바뀌어요. 물음표에 들어갈 달은 무엇일까요?");
      const wrong = shuffle(MOONS.filter((m) => m !== answerMoon && !seq.includes(m))).slice(0, 2);
      btns.innerHTML = ""; say.innerHTML = "";
      shuffle([answerMoon, ...wrong]).forEach((m) => {
        const b = el("button", "ob-pick", m);
        b.onclick = () => {
          if (m !== answerMoon) { ctx.sfx("bump"); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); say.innerHTML = "<div class='mg-why'>앞뒤 달과 비교해 봐요. 밝은 부분이 점점 커지는지, 작아지는지!</div>"; return; }
          ctx.sfx("snap");
          row.children[hole].textContent = m; row.children[hole].classList.remove("hole");
          btns.innerHTML = "";
          say.innerHTML = "";
          say.append(el("div", "mg-verdict good", "⭕ 맞았어요! " + m + " " + MOON_NAMES[m]));
          ctx.speak("맞았어요! " + MOON_NAMES[m]);
          const next = el("button", "btn btn-go", i + 1 < starts.length ? "다음 ▶" : "🎉 끝!");
          next.onclick = () => { ctx.sfx("tap"); i++; if (i < starts.length) show(); else finish(); };
          say.append(next);
        };
        btns.append(b);
      });
    }
    show();
  }

  function finish() {
    ctx.sfx("win");
    ctx.award("observatory");
    setStep(-1);
    area.innerHTML = "";
    area.append(el("div", "mg-q", "🎉 별 관측소 탐구 끝!"),
      el("div", "mg-why", "지구가 돌아서 해를 보는 쪽은 <b>낮</b>, 반대쪽은 <b>밤</b>이에요.<br>달은 날마다 모양이 바뀌어요: 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘"));
    ctx.speak("별 관측소 탐구 끝! 지구가 돌아서 해를 보는 쪽은 낮, 반대쪽은 밤이에요. 달은 날마다 모양이 바뀌어요.");
    const again = el("button", "btn btn-go", "🔁 다시 하기");
    again.onclick = () => { ctx.sfx("tap"); dayNight(); };
    area.append(again);
  }

  dayNight();
});
