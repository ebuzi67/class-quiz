// 율이 꿀벌 수학 - 게임 화면
(function () {
  "use strict";
  const { UNITS, gen } = window.YM;

  // ───────── 처음 진도 설정 (앱 안 ⚙️ 진도·설정에서 바꿀 수 있어요) ─────────
  // now: 학원 진도, review: 복습, next: 다음 진도
  const DEFAULT_PROGRESS = { "5-1": "now", "5-2": "now", "4-2": "review", "6-1": "next" };
  const SEMESTERS = ["4-1", "4-2", "5-1", "5-2", "6-1", "6-2", "중1", "중2", "중3"];
  const TABS = [["4", "4학년", ["4-1", "4-2"]], ["5", "5학년", ["5-1", "5-2"]], ["6", "6학년", ["6-1", "6-2"]], ["m1", "중1", ["중1"]], ["m2", "중2", ["중2"]], ["m3", "중3", ["중3"]]];
  const BADGE = { now: "학원 진도", review: "복습", next: "다음 진도" };
  const TIER_NAME = { 1: "기본", 2: "응용", 3: "심화" };

  // ───────── 벌 표본 ─────────
  const SPECIES = [
    { id: "honeybee", name: "꿀벌", need: 0, c: { body: "#f2b134", stripe: "#3b2a1a", head: "#3b2a1a", tail: "#3b2a1a" }, fact: "꽃꿀과 꽃가루를 모아 벌집에 꿀을 저장해요. 여왕벌 한 마리와 아주 많은 일벌이 함께 살아요." },
    { id: "bumble", name: "호박벌", need: 3, c: { body: "#2a2a2a", stripe: "#f6c945", head: "#1e1e1e", tail: "#e8742c" }, fuzzy: true, fat: true, fact: "몸이 통통하고 털이 많아요. 날개 근육을 부르르 떨어서 몸을 데우기 때문에 쌀쌀한 날에도 날 수 있어요." },
    { id: "carpenter", name: "어리호박벌", need: 7, c: { body: "#1b1b1b", stripe: "#1b1b1b", head: "#1b1b1b", tail: "#1b1b1b", thorax: "#f2d14b" }, fat: true, fact: "죽은 나무에 구멍을 뚫어 집을 지어요. 그래서 영어로는 '목수벌(carpenter bee)'이라고 불러요." },
    { id: "paper", name: "쌍살벌", need: 12, c: { body: "#e9b51f", stripe: "#2b2b2b", head: "#2b2b2b", tail: "#2b2b2b" }, slim: true, legs: true, fact: "날 때 긴 뒷다리를 늘어뜨려요. 종이처럼 만든 육각형 방이 그대로 드러난 집을 지어요." },
    { id: "yellowjacket", name: "땅벌", need: 18, c: { body: "#1f1f1f", stripe: "#f4e04d", head: "#1f1f1f", tail: "#f4e04d" }, fact: "이름처럼 땅속에 집을 짓는 말벌이에요. 몸집은 작지만 한 집에 사는 벌이 아주 많아요." },
    { id: "analis", name: "좀말벌", need: 25, c: { body: "#e3a127", stripe: "#4a2a14", head: "#c77d2a", tail: "#4a2a14" }, fact: "말벌 무리 가운데 몸집이 작은 편이에요. 나뭇가지나 덤불 속에 집을 지어요." },
    { id: "simillima", name: "털보말벌", need: 33, c: { body: "#d99a2b", stripe: "#3a2512", head: "#c98a25", tail: "#3a2512" }, fuzzy: true, fact: "몸에 털이 많은 말벌이에요. 나무나 처마 밑에 공 모양의 집을 지어요." },
    { id: "velutina", name: "등검은말벌", need: 42, c: { body: "#2a211b", stripe: "#2a211b", head: "#2a211b", tail: "#e6892b" }, fact: "가슴의 등 쪽이 검은 말벌이에요. 외국에서 들어온 종으로, 꿀벌을 사냥해서 양봉 농가에 피해를 줘요." },
    { id: "crabro", name: "말벌", need: 52, c: { body: "#f0b429", stripe: "#3d2412", head: "#e0a030", tail: "#3d2412" }, fact: "몸집이 큰 말벌로, 나무 구멍이나 처마 밑에 집을 지어요. 다른 곤충을 사냥해서 애벌레에게 먹여요." },
    { id: "mandarinia", name: "장수말벌", need: 64, c: { body: "#f2b01e", stripe: "#2a1a0e", head: "#f08c1c", tail: "#2a1a0e" }, big: true, fact: "세계에서 가장 큰 말벌이에요. 여왕벌은 몸길이가 4cm를 넘기도 해요. 힘이 세서 꿀벌 집을 공격하기도 해요." },
  ];

  let svgSeq = 0;
  function beeSVG(sp) {
    const uid = "b" + (++svgSeq);
    const c = sp.c, rx = sp.fat ? 26 : sp.slim ? 22 : 24, ry = sp.fat ? 17 : sp.slim ? 11 : 14;
    const fuzz = sp.fuzzy ? `<ellipse cx="54" cy="52" rx="${rx + 3}" ry="${ry + 3}" fill="${c.body}" opacity=".35"/>` : "";
    const legs = sp.legs ? `<path d="M48 64 L42 86 M58 64 L56 88" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>` : `<path d="M46 63 L42 72 M56 64 L54 73" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round"/>`;
    const thorax = c.thorax || c.head;
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="44" cy="30" rx="16" ry="11" fill="#dff4ff" stroke="#9bc7dd" stroke-width="2" opacity=".85" transform="rotate(-20 44 30)"/>
      <ellipse cx="60" cy="28" rx="14" ry="9" fill="#dff4ff" stroke="#9bc7dd" stroke-width="2" opacity=".85" transform="rotate(15 60 28)"/>
      ${legs}${fuzz}
      <clipPath id="${uid}"><ellipse cx="58" cy="52" rx="${rx}" ry="${ry}"/></clipPath>
      <ellipse cx="58" cy="52" rx="${rx}" ry="${ry}" fill="${c.body}"/>
      <g clip-path="url(#${uid})">
        <rect x="56" y="30" width="7" height="50" fill="${c.stripe}"/>
        <rect x="68" y="30" width="7" height="50" fill="${c.stripe}"/>
        <rect x="${58 + rx - 9}" y="30" width="12" height="50" fill="${c.tail}"/>
      </g>
      <polygon points="${58 + rx - 1},50 ${58 + rx + 9},53 ${58 + rx - 1},56" fill="#3b2a1a"/>
      <circle cx="38" cy="50" r="${sp.fat ? 12 : 10}" fill="${thorax}"/>
      <circle cx="${sp.big ? 21 : 23}" cy="48" r="${sp.big ? 12 : 10}" fill="${c.head}"/>
      <circle cx="${sp.big ? 17 : 19}" cy="45" r="3.2" fill="#fff"/><circle cx="${sp.big ? 16.5 : 18.5}" cy="45.5" r="1.8" fill="#111"/>
      <path d="M22 40 Q16 26 10 24 M26 39 Q24 26 20 21" stroke="#2b2b2b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M16 54 Q20 57 24 54" stroke="#111" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  // ───────── 저장 ─────────
  const KEY = "yulmath-v1";
  let D = load();
  function load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { d = {}; }
    return Object.assign({ stars: {}, stats: {}, mistakes: {}, note: [], daily: {}, progress: Object.assign({}, DEFAULT_PROGRESS), player: "honeybee", mode: "fall", sound: "on", solved: 0, tab: null }, d);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { /* 저장 안 돼도 게임은 돼요 */ } }
  const today = () => new Date().toISOString().slice(0, 10);
  const totalStars = () => Object.values(D.stars).reduce((a, b) => a + b, 0);
  const unlocked = () => SPECIES.filter((s) => totalStars() >= s.need);
  const player = () => SPECIES.find((s) => s.id === D.player && totalStars() >= s.need) || SPECIES[0];

  // ───────── 글자 그리기 ─────────
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function rich(text) {
    let s = esc(text);
    s = s.replace(/\[([^\[\]\s]+) ([^\[\]\/\s]+)\/([^\[\]]+)\]/g, '<span class="mixed">$1<span class="fr"><span>$2</span><span>$3</span></span></span>');
    s = s.replace(/\[([^\[\]]*)\/([^\[\]\/]+)\]/g, '<span class="fr"><span>$1</span><span>$2</span></span>');
    return s;
  }
  const $ = (id) => document.getElementById(id);
  const plain = (t) => t.replace(/\[[^\]]*\]/g, "##").length;

  // ───────── 화면 전환 ─────────
  const SCREENS = ["home", "pick", "play", "result", "box", "stats", "set"];
  function show(id) {
    for (const s of SCREENS) $(s).hidden = s !== id;
    $("oops").hidden = true;
    window.scrollTo(0, 0);
    if (id === "home") renderHome();
    if (id === "box") renderBox();
    if (id === "stats") renderStats();
    if (id === "set") renderSet();
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) { stopGame(); show(b.dataset.go); } });

  // ───────── 첫 화면 ─────────
  const semStatus = (g) => D.progress[g] || "";
  function tabOf(g) { return TABS.find((t) => t[2].includes(g))[0]; }
  function renderHome() {
    $("home-bee").innerHTML = beeSVG(player());
    $("star-total").textContent = totalStars();
    $("today-count").textContent = D.daily[today()] || 0;
    $("note-count").textContent = D.note.length + "문제";
    const nowSems = SEMESTERS.filter((g) => semStatus(g) === "now" || semStatus(g) === "review");
    $("today-desc").textContent = nowSems.length ? nowSems.join(", ") + " 단원에서 골라요" : "⚙️ 진도·설정에서 학기를 골라 주세요";
    if (!D.tab) { const g = SEMESTERS.find((x) => semStatus(x) === "now") || "4-1"; D.tab = tabOf(g); }
    $("tabs").innerHTML = TABS.map(([id, label, sems]) => {
      const mark = sems.some((g) => semStatus(g) === "now") ? " ●" : "";
      return `<button data-tab="${id}" class="${D.tab === id ? "on" : ""}">${label}${mark}</button>`;
    }).join("");
    const sems = TABS.find((t) => t[0] === D.tab)[2];
    $("units").innerHTML = UNITS.filter((u) => sems.includes(u.g)).map((u) => {
      const st = D.stars[u.id] || 0, s = D.stats[u.id], b = semStatus(u.g);
      const acc = s && s.n ? Math.round((s.r / s.n) * 100) + "%" : "";
      return `<button class="btn unit" data-unit="${u.id}"><span class="g">${u.g}${b ? ` <span class="badge ${b}">${BADGE[b]}</span>` : ""}</span><span class="nm">${u.name}</span><span class="meta"><span class="stars">${"★".repeat(st)}${"☆".repeat(3 - st)}</span><span class="muted">${acc}</span></span></button>`;
    }).join("");
  }
  $("go-box").addEventListener("click", () => show("box"));
  $("go-stats").addEventListener("click", () => show("stats"));
  $("go-set").addEventListener("click", () => show("set"));
  $("tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { D.tab = b.dataset.tab; save(); renderHome(); } });
  $("units").addEventListener("click", (e) => { const b = e.target.closest("[data-unit]"); if (b) openPick(b.dataset.unit); });

  // ───────── 단계 고르기 ─────────
  let pickUnit = null;
  function openPick(id) {
    pickUnit = UNITS.find((u) => u.id === id);
    $("pick-g").textContent = pickUnit.g + (semStatus(pickUnit.g) ? " · " + BADGE[semStatus(pickUnit.g)] : "");
    $("pick-name").textContent = pickUnit.name;
    const s = D.stats[id], st = D.stars[id] || 0;
    $("pick-info").textContent = `별 ${"★".repeat(st)}${"☆".repeat(3 - st)}` + (s && s.n ? ` · 지금까지 ${s.n}문제 중 ${s.r}문제 정답` : " · 아직 안 풀었어요");
    renderModeToggle();
    show("pick");
  }
  function renderModeToggle() { for (const b of $("mode-toggle").children) b.classList.toggle("on", b.dataset.mode === D.mode); }
  $("mode-toggle").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) { D.mode = b.dataset.mode; save(); renderModeToggle(); } });
  $("pick").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tiers]"); if (!b) return;
    const tiers = b.dataset.tiers.split(",").map(Number);
    startGame({ kind: tiers.length === 12 ? "unit" : "practice", unit: pickUnit.id, list: tiers.map((t) => gen(pickUnit.id, t)) });
  });

  // ───────── 문제 묶음 만들기 ─────────
  function weight(u) {
    const s = D.stats[u.id], acc = s && s.n ? s.r / s.n : 0.5;
    const inNote = D.note.filter((x) => x.p.unit === u.id).length;
    return 1 + (1 - acc) * 3 + inNote * 0.5 + (semStatus(u.g) === "now" ? 1 : 0);
  }
  function weightedPick(arr, n) {
    const pool = arr.slice(), out = [];
    while (out.length < n && pool.length) {
      const tot = pool.reduce((a, u) => a + weight(u), 0); let r = Math.random() * tot, i = 0;
      while (i < pool.length - 1 && (r -= weight(pool[i])) > 0) i++;
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  function mixedList(units, tiers) {
    if (!units.length) return [];
    const chosen = weightedPick(units, Math.min(units.length, 4));
    return tiers.map((t, i) => gen(chosen[i % chosen.length].id, t)).sort((a, b) => a.tier - b.tier);
  }
  function activeUnits(onlyCalc) {
    return UNITS.filter((u) => ["now", "review"].includes(semStatus(u.g)) && (!onlyCalc || u.calc));
  }
  $("go-today").addEventListener("click", () => {
    const list = mixedList(activeUnits(false), [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
    if (!list.length) return show("set");
    startGame({ kind: "today", list });
  });
  $("go-calc").addEventListener("click", () => {
    let units = activeUnits(true); if (!units.length) units = UNITS.filter((u) => u.calc && u.g.startsWith("5"));
    startGame({ kind: "calc", list: mixedList(units, [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3]) });
  });
  $("go-note").addEventListener("click", () => {
    if (!D.note.length) { $("note-count").textContent = "틀린 문제가 없어요 👍"; return; }
    const list = D.note.slice().sort(() => Math.random() - 0.5).slice(0, 12).map((x) => x.p);
    startGame({ kind: "note", list });
  });

  // ───────── 게임 ─────────
  let G = null;
  const FALL_SEC = { 1: 11, 2: 14, 3: 18 };

  function startGame(opt) {
    G = Object.assign({ i: 0, right: 0, honey: 0, combo: 0, wrongs: [], results: [] }, opt);
    $("player-bee").innerHTML = beeSVG(player());
    $("controls").hidden = D.mode === "slow";
    show("play");
    nextQuestion();
  }
  function stopGame() { if (G && G.raf) cancelAnimationFrame(G.raf); if (G) G.phase = "stop"; }

  function nextQuestion() {
    const p = G.list[G.i];
    G.p = p;
    G.opts = [{ t: p.a, ok: true }, ...p.w.map((w) => ({ t: w.t, m: w.m }))].sort(() => Math.random() - 0.5);
    $("question").innerHTML = rich(p.q);
    $("tier-tag").textContent = TIER_NAME[p.tier];
    $("tier-tag").className = "tier-tag t" + p.tier;
    $("bar").style.width = (G.i / G.list.length) * 100 + "%";
    $("honey").textContent = "🍯 " + G.honey;
    const field = $("field");
    field.querySelectorAll(".drop,.float").forEach((d) => d.remove());
    G.drops = G.opts.map((o, lane) => {
      const d = document.createElement("div");
      d.className = "drop" + (plain(o.t) > 12 ? " xlong" : plain(o.t) > 7 ? " long" : "");
      d.innerHTML = rich(o.t);
      d.style.left = (lane * 33.33 + 16.67) + "%";
      d.dataset.lane = lane;
      field.appendChild(d);
      return d;
    });
    G.lane = 1; placePlayer();
    G.y = 0; G.fast = false; G.phase = "fall"; G.t0 = performance.now(); G.last = G.t0;
    G.dur = FALL_SEC[p.tier] * 1000;
    if (D.mode === "slow") { G.y = 0.3; positionDrops(); }
    else { G.raf = requestAnimationFrame(loop); }
  }

  function placePlayer() { $("player").style.left = (G.lane * 33.33 + 16.67) + "%"; }
  function catchY() { const f = $("field"); return f.clientHeight - 150; }
  function positionDrops() { const y = Math.max(0, catchY()) * G.y; for (const d of G.drops) d.style.transform = `translate(-50%, ${y}px)`; }

  function loop(ts) {
    if (!G || G.phase !== "fall") return;
    const dt = ts - G.last; G.last = ts;
    G.y += (dt / G.dur) * (G.fast ? 7 : 1);
    if (G.y >= 1) { G.y = 1; positionDrops(); return choose(G.lane); }
    positionDrops();
    G.raf = requestAnimationFrame(loop);
  }

  function move(lane) { if (!G || G.phase !== "fall") return; G.lane = Math.max(0, Math.min(2, lane)); placePlayer(); }
  $("field").addEventListener("pointerdown", (e) => {
    if (!G || G.phase !== "fall") return;
    const r = $("field").getBoundingClientRect();
    const lane = Math.min(2, Math.floor(((e.clientX - r.left) / r.width) * 3));
    if (D.mode === "slow") { G.lane = lane; placePlayer(); setTimeout(() => choose(lane), 180); G.phase = "wait"; }
    else move(lane);
  });
  $("left").addEventListener("click", () => move(G.lane - 1));
  $("right").addEventListener("click", () => move(G.lane + 1));
  $("fast").addEventListener("click", () => { if (G && G.phase === "fall") G.fast = true; });
  document.addEventListener("keydown", (e) => {
    if ($("play").hidden || !G) return;
    if (!$("oops").hidden && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); return $("oops-next").click(); }
    if (e.key === "ArrowLeft" || e.key === "a") move(G.lane - 1);
    else if (e.key === "ArrowRight" || e.key === "d") move(G.lane + 1);
    else if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); if (D.mode === "slow" && G.phase === "fall") { G.phase = "wait"; choose(G.lane); } else if (G.phase === "fall") G.fast = true; }
  });

  function choose(lane) {
    if (!G || G.phase === "done" || G.phase === "stop") return;
    G.phase = "done";
    if (G.raf) cancelAnimationFrame(G.raf);
    const o = G.opts[lane], p = G.p;
    const okIdx = G.opts.findIndex((x) => x.ok);
    G.drops[okIdx].classList.add("ok");
    recordStat(p.unit, o.ok);
    D.daily[today()] = (D.daily[today()] || 0) + 1; D.solved++;
    if (o.ok) {
      G.right++; G.combo++;
      const bonus = D.mode === "fall" ? Math.round((1 - G.y) * 5) : 0;
      const gain = 10 + bonus + Math.min(G.combo - 1, 5) * 2;
      G.honey += gain;
      floatText(`+${gain}${G.combo >= 3 ? ` 콤보 ${G.combo}!` : ""}`, lane);
      beep(true);
      noteResult(p, true);
      G.results.push({ p, ok: true });
      save();
      setTimeout(advance, 750);
    } else {
      G.combo = 0;
      G.drops[lane].classList.add("bad");
      beep(false);
      if (o.m) D.mistakes[o.m] = (D.mistakes[o.m] || 0) + 1;
      noteResult(p, false);
      G.wrongs.push({ p, mine: o.t, m: o.m });
      G.results.push({ p, ok: false });
      save();
      $("oops-title").textContent = o.m ? "앗! " + o.m : "앗, 아쉬워요!";
      $("oops-mine").innerHTML = "내가 고른 답: " + rich(o.t);
      $("oops-ans").innerHTML = "정답: " + rich(p.a);
      $("oops-tip").innerHTML = "💡 " + rich(p.tip);
      setTimeout(() => { $("oops").hidden = false; $("oops-next").focus(); }, 450);
    }
  }
  $("oops-next").addEventListener("click", () => { $("oops").hidden = true; advance(); });

  function advance() {
    if (!G || G.phase === "stop") return;
    G.i++;
    if (G.i >= G.list.length) return finish();
    nextQuestion();
  }
  $("quit").addEventListener("click", () => { stopGame(); show("home"); });

  function floatText(txt, lane) {
    const f = document.createElement("div");
    f.className = "float"; f.textContent = txt;
    f.style.left = (lane * 33.33 + 8) + "%"; f.style.bottom = "110px";
    $("field").appendChild(f);
    setTimeout(() => f.remove(), 950);
  }

  function recordStat(unit, ok) {
    const s = D.stats[unit] || (D.stats[unit] = { r: 0, n: 0 });
    s.n++; if (ok) s.r++;
  }
  // 오답노트: 틀리면 넣고, 오답노트에서 두 번 맞히면 빼요
  function noteResult(p, ok) {
    const i = D.note.findIndex((x) => x.p.q === p.q);
    if (!ok) {
      if (i >= 0) D.note[i].ok = 0;
      else { D.note.unshift({ p: { q: p.q, a: p.a, w: p.w, tip: p.tip, unit: p.unit, tier: p.tier }, ok: 0 }); D.note = D.note.slice(0, 80); }
    } else if (i >= 0 && G.kind === "note") {
      D.note[i].ok++;
      if (D.note[i].ok >= 2) D.note.splice(i, 1);
    }
  }

  // ───────── 결과 ─────────
  function finish() {
    G.phase = "stop";
    const n = G.list.length, r = G.right;
    let stars = r >= n - 1 ? 3 : r >= Math.ceil(n * 0.75) ? 2 : r >= Math.ceil(n / 2) ? 1 : 0;
    const before = unlocked().length;
    let newBest = false;
    if (G.kind === "unit" && stars > (D.stars[G.unit] || 0)) { D.stars[G.unit] = stars; newBest = true; }
    save();
    const after = unlocked();
    show("result");
    $("res-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    const kindName = { unit: UNITS.find((u) => u.id === G.unit)?.name, practice: UNITS.find((u) => u.id === G.unit)?.name + " 연습", today: "오늘의 추천", calc: "연산 실수 잡기", note: "오답 다시 풀기" }[G.kind];
    $("res-line").innerHTML = `${esc(kindName)}<br>${n}문제 중 <b>${r}</b>문제 정답 · 꿀 🍯 ${G.honey}` + (newBest ? "<br>🎉 이 단원 최고 기록!" : G.kind !== "unit" ? '<br><span class="muted" style="font-size:.8em">단원별 별은 단원 화면의 「기본 → 응용 → 심화」에서 받아요</span>' : "");
    $("res-unlock").innerHTML = after.length > before ? after.slice(before).map((s) => `<div class="unlock">${beeSVG(s)}<div><b>새 표본: ${s.name}!</b><br><span class="muted" style="font-size:.9em">${s.fact}</span></div></div>`).join("") : "";
    // 실수 모아 보기
    const by = {};
    for (const w of G.wrongs) if (w.m) by[w.m] = (by[w.m] || 0) + 1;
    const keys = Object.keys(by).sort((a, b) => by[b] - by[a]);
    $("res-mistakes").innerHTML = G.wrongs.length
      ? "<b>이번에 한 실수</b><br>" + keys.map((k) => `· ${esc(k)}${by[k] > 1 ? ` <b>×${by[k]}</b>` : ""}`).join("<br>")
      : "<b>실수 없이 모두 맞혔어요! 🐝✨</b>";
    $("res-list").innerHTML = G.wrongs.length
      ? "<b>틀린 문제</b>" + G.wrongs.map((w) => `<div class="item"><div class="q">${rich(w.p.q)}</div><div class="a">정답: ${rich(w.p.a)}</div><div class="m">내 답: ${rich(w.mine)}${w.m ? " — " + esc(w.m) : ""}</div><div class="muted" style="font-size:.88em">💡 ${rich(w.p.tip)}</div></div>`).join("")
      : "";
    $("res-list").hidden = !G.wrongs.length;
    $("res-retry-wrong").hidden = !G.wrongs.length;
    G.lastOpt = { kind: G.kind, unit: G.unit, tiers: G.list.map((p) => p.tier), list: G.list };
  }
  $("res-retry-wrong").addEventListener("click", () => startGame({ kind: "note", list: G.wrongs.map((w) => w.p) }));
  $("res-again").addEventListener("click", () => {
    const L = G.lastOpt;
    if (L.kind === "unit" || L.kind === "practice") startGame({ kind: L.kind, unit: L.unit, list: L.tiers.map((t) => gen(L.unit, t)) });
    else if (L.kind === "note") startGame({ kind: "note", list: L.list });
    else startGame({ kind: L.kind, list: L.list.map((p) => gen(p.unit, p.tier)) });
  });

  // ───────── 표본 상자 ─────────
  function renderBox() {
    const ts = totalStars();
    $("box-grid").innerHTML = SPECIES.map((s) => {
      const lock = ts < s.need;
      return `<button class="btn spec ${lock ? "locked" : ""} ${player().id === s.id ? "sel" : ""}" data-sp="${s.id}"><span class="pin"></span>${beeSVG(s)}<div class="nm">${lock ? "???" : s.name}</div><small>${lock ? `별 ${s.need}개 필요` : player().id === s.id ? "지금 내 벌" : "누르면 골라요"}</small></button>`;
    }).join("");
  }
  $("box-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sp]"); if (!b) return;
    const s = SPECIES.find((x) => x.id === b.dataset.sp);
    const info = $("box-info"); info.hidden = false;
    if (totalStars() < s.need) { info.innerHTML = `아직 잠겨 있어요. 별을 <b>${s.need - totalStars()}개</b> 더 모으면 열려요!`; return; }
    D.player = s.id; save(); renderBox();
    info.innerHTML = `<b>${s.name}</b><br>${s.fact}`;
  });

  // ───────── 기록 ─────────
  function renderStats() {
    const all = Object.values(D.stats).reduce((a, s) => ({ r: a.r + s.r, n: a.n + s.n }), { r: 0, n: 0 });
    const days = Object.keys(D.daily).sort().slice(-7);
    $("stats-summary").innerHTML = `지금까지 <b>${all.n}</b>문제 · 정답률 <b>${all.n ? Math.round((all.r / all.n) * 100) : 0}%</b> · 별 <b>${totalStars()}</b>개 · 오답노트 <b>${D.note.length}</b>문제` +
      (days.length ? `<br><span class="muted" style="font-size:.88em">최근: ${days.map((d) => `${d.slice(5)} ${D.daily[d]}문제`).join(" · ")}</span>` : "");
    const ms = Object.entries(D.mistakes).filter(([k]) => k !== "계산 실수").sort((a, b) => b[1] - a[1]).slice(0, 6);
    $("stats-mistakes").innerHTML = ms.length ? ms.map(([k, v]) => `· ${esc(k)} <b>${v}번</b>`).join("<br>") : '<span class="muted">아직 기록이 없어요</span>';
    const rows = UNITS.filter((u) => D.stats[u.id]).map((u) => { const s = D.stats[u.id]; return `<tr><td>${u.g}</td><td>${u.name}</td><td class="num">${"★".repeat(D.stars[u.id] || 0)}</td><td class="num">${Math.round((s.r / s.n) * 100)}% (${s.r}/${s.n})</td></tr>`; });
    $("stats-table").innerHTML = rows.length ? rows.join("") : '<tr><td class="muted">아직 푼 단원이 없어요</td></tr>';
  }

  // ───────── 설정 ─────────
  const CYCLE = ["", "now", "review", "next"];
  function renderSet() {
    $("sem-chips").innerHTML = SEMESTERS.map((g) => { const s = semStatus(g); return `<button data-sem="${g}" class="${s}">${g}<br><small>${s ? BADGE[s] : "－"}</small></button>`; }).join("");
    for (const b of $("sound-toggle").children) b.classList.toggle("on", b.dataset.sound === D.sound);
    $("reset-msg").textContent = "";
  }
  $("sem-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sem]"); if (!b) return;
    const g = b.dataset.sem, next = CYCLE[(CYCLE.indexOf(semStatus(g)) + 1) % CYCLE.length];
    if (next) D.progress[g] = next; else delete D.progress[g];
    save(); renderSet();
  });
  $("sound-toggle").addEventListener("click", (e) => { const b = e.target.closest("[data-sound]"); if (b) { D.sound = b.dataset.sound; save(); renderSet(); } });
  let resetArmed = false;
  $("reset-btn").addEventListener("click", () => {
    if (!resetArmed) { resetArmed = true; $("reset-msg").textContent = " 정말 지울까요? 한 번 더 누르면 지워져요."; setTimeout(() => { resetArmed = false; $("reset-msg").textContent = ""; }, 4000); return; }
    const keep = { progress: D.progress, sound: D.sound, mode: D.mode };
    localStorage.removeItem(KEY); D = load(); Object.assign(D, keep); save();
    resetArmed = false; $("reset-msg").textContent = " 기록을 지웠어요.";
  });

  // ───────── 소리 ─────────
  let ac = null;
  function beep(good) {
    if (D.sound !== "on") return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const notes = good ? [660, 880] : [220, 180];
      notes.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = good ? "sine" : "square"; o.frequency.value = f;
        g.gain.setValueAtTime(0.08, ac.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.15);
        o.connect(g); g.connect(ac.destination); o.start(ac.currentTime + i * 0.1); o.stop(ac.currentTime + i * 0.1 + 0.16);
      });
    } catch (e) { /* 소리가 안 나도 괜찮아요 */ }
  }

  // ───────── 설치·오프라인 ─────────
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  let installPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });
  $("install-btn").addEventListener("click", async () => {
    const help = $("install-help");
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; return; }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    help.hidden = false;
    help.innerHTML = isIOS ? "사파리의 <b>공유 버튼(□↑)</b>을 누르고 <b>\"홈 화면에 추가\"</b>를 눌러 주세요."
      : "크롬 오른쪽 위 <b>⋮</b> 메뉴에서 <b>\"앱 설치\"</b> 또는 <b>\"홈 화면에 추가\"</b>를 눌러 주세요. 메뉴에 없으면 이미 설치되어 있을 수 있어요.";
  });

  show("home");
})();
