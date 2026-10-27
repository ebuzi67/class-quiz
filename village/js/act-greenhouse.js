// 🌱 관찰 온실 (창의과학: 식물이 자라는 데 필요한 것, 자라는 순서)
// ① 새싹 키우기: 화분에 무엇을 줄지 골라요. 물과 햇빛을 둘 다 받을 때마다 한 단계씩 자라요.
// ② 자라는 순서: 그림 카드를 자라는 순서대로 눌러요. 틀린 카드는 제자리로 돌아가요.
"use strict";

Activities.register("greenhouse", ({ el, frame, wait, shuffle, ctx }) => {
  const STAGES = ["🌰", "🌱", "🌿", "🌷", "🌻"];
  const GIVE = [
    { e: "💧", n: "물", ok: true },
    { e: "☀️", n: "햇빛", ok: true },
    { e: "🍭", n: "사탕", ok: false, why: "식물은 사탕을 먹지 않아요." },
    { e: "🧸", n: "장난감", ok: false, why: "식물은 장난감으로 자라지 않아요." },
    { e: "🥤", n: "주스", ok: false, why: "주스는 식물에게 필요 없어요. 깨끗한 물이 좋아요." },
    { e: "📱", n: "스마트폰", ok: false, why: "식물은 스마트폰이 필요 없어요." }
  ];
  const ORDERS = [
    { title: "해바라기", cards: [["🌰", "씨앗"], ["🌱", "싹"], ["🌿", "줄기와 잎"], ["🌻", "꽃"]] },
    { title: "토마토", cards: [["🌰", "씨앗"], ["🌱", "싹"], ["🌿", "잎"], ["🌼", "꽃"], ["🍅", "열매"]] }
  ];

  const root = frame("🌱 관찰 온실: 식물은 어떻게 자랄까?");
  const steps = el("div", "mg-steps", "<span>① 새싹 키우기</span><span>② 자라는 순서</span>");
  const area = el("div", "gh-area");
  root.append(steps, area);
  const setStep = (n) => steps.querySelectorAll("span").forEach((s, i) => s.classList.toggle("on", i === n));

  // ── ① 새싹 키우기 ──
  function grow() {
    setStep(0);
    area.innerHTML = "";
    let stage = 0, water = false, sun = false, busy = false;
    const q = el("div", "mg-q", "씨앗을 심었어요. 무엇을 주면 쑥쑥 자랄까?");
    const pot = el("div", "gh-pot");
    const plant = el("div", "gh-plant", STAGES[0]);
    const needs = el("div", "gh-needs");
    pot.append(plant, el("div", "gh-soil"));
    const btns = el("div", "gh-give");
    const say = el("div", "mg-why", "물과 햇빛을 둘 다 받으면 한 단계 자라요.");
    area.append(q, pot, needs, btns, say);
    const drawNeeds = () => { needs.innerHTML = "<span class='" + (water ? "got" : "") + "'>💧</span><span class='" + (sun ? "got" : "") + "'>☀️</span><small>" + (stage + 1) + " / " + STAGES.length + "</small>"; };
    drawNeeds();
    ctx.speak("씨앗을 심었어요. 무엇을 주면 쑥쑥 자랄까?");
    shuffle(GIVE).forEach((g) => {
      const b = el("button", "gh-item", "<span>" + g.e + "</span>" + g.n);
      b.onclick = async () => {
        if (busy) return;
        if (!g.ok) {
          ctx.sfx("bump"); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no");
          say.textContent = "🙅 " + g.why + " 식물은 물과 햇빛이 필요해요!"; ctx.speak(say.textContent);
          return;
        }
        ctx.sfx("pop");
        if (g.e === "💧") water = true; else sun = true;
        drawNeeds();
        if (!(water && sun)) { say.textContent = (water ? "물을" : "햇빛을") + " 주었어요! 이제 " + (water ? "햇빛 ☀️" : "물 💧") + "도 필요해요."; return; }
        busy = true;
        await wait(350);
        stage++; water = false; sun = false;
        plant.textContent = STAGES[stage]; plant.classList.remove("up"); void plant.offsetWidth; plant.classList.add("up");
        ctx.sfx("snap"); drawNeeds();
        if (stage === STAGES.length - 1) {
          ctx.sfx("win");
          q.textContent = "🌻 꽃이 피었어요!";
          say.innerHTML = "알아낸 것: 식물은 <b>물</b>과 <b>햇빛</b>(그리고 공기)이 있어야 자라요.";
          ctx.speak("꽃이 피었어요! 식물은 물과 햇빛이 있어야 자라요.");
          btns.innerHTML = "";
          const next = el("button", "btn btn-go", "② 자라는 순서 맞추기 ▶");
          next.onclick = () => { ctx.sfx("tap"); order(0); };
          btns.append(next);
        } else {
          say.textContent = "쑥! 자랐어요. 다시 물과 햇빛을 주세요.";
        }
        busy = false;
      };
      btns.append(b);
    });
  }

  // ── ② 자라는 순서 ──
  function order(round) {
    setStep(1);
    area.innerHTML = "";
    const R = ORDERS[round];
    let next = 0;
    const q = el("div", "mg-q", R.title + "는 어떤 순서로 자랄까? 처음부터 차례대로 눌러요.");
    const slots = el("div", "gh-slots");
    const deck = el("div", "gh-deck");
    const say = el("div", "mg-why", "");
    area.append(q, slots, deck, say);
    const slotEls = R.cards.map((_, i) => { const s = el("div", "gh-slot", "<small>" + (i + 1) + "</small>"); slots.append(s); return s; });
    ctx.speak(R.title + "는 어떤 순서로 자랄까? 처음부터 차례대로 눌러요.");
    shuffle(R.cards.map((c, i) => [c, i])).forEach(([[e, n], i]) => {
      const b = el("button", "gh-card", "<span>" + e + "</span>" + n);
      b.onclick = () => {
        if (i !== next) {
          ctx.sfx("bump"); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no");
          say.textContent = "음… " + next + "번째 다음에 오는 모습을 다시 생각해 봐요."; if (!next) say.textContent = "가장 처음 모습은 무엇일까요?";
          return;
        }
        ctx.sfx("pop");
        slotEls[i].innerHTML = "<span>" + e + "</span>" + n; slotEls[i].classList.add("full");
        b.remove(); next++; say.textContent = "";
        if (next === R.cards.length) {
          ctx.sfx("win");
          const text = R.title + " 완성! " + R.cards.map((c) => c[1]).join(" → ");
          say.textContent = "🎉 " + text; ctx.speak(text);
          const btn = el("button", "btn btn-go", round + 1 < ORDERS.length ? "다음 식물 ▶" : "🎉 끝!");
          btn.onclick = () => { ctx.sfx("tap"); if (round + 1 < ORDERS.length) order(round + 1); else finish(); };
          deck.append(btn);
        }
      };
      deck.append(b);
    });
  }

  function finish() {
    ctx.award("greenhouse");
    area.innerHTML = "";
    setStep(-1);
    area.append(el("div", "mg-q", "🎉 관찰 온실 탐구 끝!"),
      el("div", "mg-why", "식물은 <b>물과 햇빛</b>을 받아 자라요.<br>씨앗 → 싹 → 잎 → 꽃 → 열매(씨앗) 순서로 자라요."));
    ctx.speak("관찰 온실 탐구 끝! 식물은 물과 햇빛을 받아, 씨앗, 싹, 잎, 꽃, 열매 순서로 자라요.");
    const again = el("button", "btn btn-go", "🔁 다시 하기");
    again.onclick = () => { ctx.sfx("tap"); grow(); };
    area.append(again);
  }

  grow();
});
