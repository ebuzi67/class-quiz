// 런던 탐방: 화면, 걷기, 카메라, 명소 카드·퀴즈·여권, 소리, 사진 엽서
(() => {
  const T = THREE;
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "london-walk-v1";

  const HATS = [
    { id: "straw", ko: "🎩 모험 모자" }, { id: "bearskin", ko: "💂 근위병 모자" },
    { id: "crown", ko: "👑 왕관" }, { id: "beanie", ko: "🧶 털모자" }, { id: "cap", ko: "🧢 야구 모자" }
  ];
  const SHIRTS = ["#4a7fc1", "#c8102e", "#2f8f5b", "#f2a541", "#8e5bb5", "#e86a92"];
  const SPEEDS = { slow: 4, fast: 11 };
  // 같이 걷기: 화면에 보이는 이름과, 서로 주고받는 영어 한마디
  const NAMES = ["아이", "엄마", "아빠", "언니", "누나", "오빠", "형", "동생", "할머니", "할아버지"];
  const EMOTES = [
    { e: "👋", en: "Hello!", ko: "안녕!" }, { e: "🚶", en: "Let's go!", ko: "가자!" },
    { e: "✋", en: "Wait for me!", ko: "기다려 줘!" }, { e: "👀", en: "Look!", ko: "저기 봐!" },
    { e: "👍", en: "Good job!", ko: "잘했어!" }, { e: "❤️", en: "I love you!", ko: "사랑해!" }
  ];

  // ---------- 저장 ----------
  const fresh = () => ({ s: 6, stamps: {}, look: { hat: "straw", shirt: "#4a7fc1" }, wish: { who: 0, what: 0 }, done: false, name: 0, hostCode: "", lastCode: "",
    opt: { sound: true, nature: true, bells: true, autoView: true } });
  let save = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = Object.assign(fresh(), JSON.parse(raw));
    save.opt = Object.assign(fresh().opt, save.opt);
  } catch (e) {}
  function store() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  // ---------- 3D 기본 ----------
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  $("scene").appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color("#cfe3ee");
  scene.fog = new T.Fog("#cfe3ee", 150, 430);
  const camera = new T.PerspectiveCamera(55, 1, 0.5, 900);
  scene.add(new T.HemisphereLight("#f4f8ff", "#9a9078", 1.6));
  const sun = new T.DirectionalLight("#fff4e0", 1.5);
  sun.position.set(-120, 200, 140);
  scene.add(sun);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 62 : 50;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- 상태 ----------
  let player = null;
  let walking = false;
  let speedMode = "slow";
  let mode = "start"; // start, follow, look, bridge, finale
  let lookTarget = null;
  let busy = false; // 카드나 다리 장면 중에는 걷지 않아요
  let userYaw = 0, userPitch = 0, lastDrag = -10;
  let elapsed = 0;
  let playerBubble = null, playerBubbleT = 0;
  let nextGreet = 30;

  function makePlayer() {
    if (player) scene.remove(player.group);
    player = World.makeChibi({ shirt: save.look.shirt, pants: "#3a4a6b", hat: save.look.hat, hatColor: "#e8c77a", hair: "#3a2416", bag: "#d0603e", bagMark: "#ffe08a",
      belt: save.look.hat === "bearskin" ? "#ffffff" : null });
    player.group.scale.setScalar(1.15);
    scene.add(player.group);
    placePlayer();
  }

  function placePlayer() {
    const p = World.posAt(save.s), t = World.tanAt(save.s);
    const y = World.onBridge(p.x, p.z) ? 0.3 : 0;
    player.group.position.set(p.x, y + (player.bob || 0), p.z);
    if (mode === "start") player.group.rotation.y = 0;
    else player.group.rotation.y = Math.atan2(t.x, t.z);
  }

  // ---------- 소리 (모두 직접 만든 소리라서 따로 파일이 없어요) ----------
  const Snd = (() => {
    let ctx = null, master = null, hum = null;
    function ensure() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = save.opt.sound ? 0.9 : 0;
        master.connect(ctx.destination);
        startHum();
        return true;
      } catch (e) { return false; }
    }
    function setOn(on) { if (master) master.gain.value = on ? 0.9 : 0; }
    function tone(freq, start, dur, vol = 0.2, type = "sine", attack = 0.01) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(master);
      o.start(start); o.stop(start + dur + 0.05);
    }
    function bell(freq, start, dur = 2.6, vol = 0.18) {
      [[1, 1], [2.0, 0.45], [2.76, 0.25], [5.4, 0.1]].forEach(([k, v]) => tone(freq * k, start, dur / k * 1.5, vol * v));
    }
    // 빅벤의 15분 종소리(웨스트민스터 차임)와 정각 종
    function westminster() {
      if (!ensure() || !save.opt.bells) return;
      const n = { B3: 246.94, E4: 329.63, F4: 369.99, G4: 415.3 };
      const seq = ["G4", "F4", "E4", "B3", "E4", "G4", "F4", "B3", "E4", "F4", "G4", "E4", "G4", "E4", "F4", "B3"];
      const t0 = ctx.currentTime + 0.1;
      seq.forEach((k, i) => bell(n[k], t0 + i * 0.62 + Math.floor(i / 4) * 0.5, 2.2, 0.16));
      for (let i = 0; i < 3; i++) bell(164.81, t0 + 12.4 + i * 2.2, 4, 0.22);
    }
    function chime() { if (!ensure()) return; const t = ctx.currentTime; tone(880, t, 0.5, 0.12); tone(1318.5, t + 0.12, 0.7, 0.12); }
    function good() { if (!ensure()) return; const t = ctx.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.5, 0.14, "triangle")); }
    function bad() { if (!ensure()) return; const t = ctx.currentTime; tone(220, t, 0.3, 0.12, "square"); tone(196, t + 0.15, 0.35, 0.1, "square"); }
    function stamp() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(90, t, 0.25, 0.4, "sine", 0.002);
      noise(t, 0.08, 0.25, 1800);
    }
    function step() { if (!ensure() || !walking) return; noise(ctx.currentTime, 0.05, 0.035, 900); }
    function noise(start, dur, vol, cutoff) {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff;
      const g = ctx.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(master);
      src.start(start);
    }
    function bird() {
      if (!ctx || !save.opt.nature) return;
      const t = ctx.currentTime;
      const base = 2200 + Math.random() * 1600;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const s = t + i * 0.14;
        o.frequency.setValueAtTime(base, s);
        o.frequency.exponentialRampToValueAtTime(base * 1.4, s + 0.08);
        g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.035, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.11);
        o.connect(g); g.connect(master); o.start(s); o.stop(s + 0.13);
      }
    }
    // 멀리서 들리는 도시 소리
    function startHum() {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 400;
      hum = ctx.createGain(); hum.gain.value = save.opt.nature ? 0.05 : 0;
      src.connect(f); f.connect(hum); hum.connect(master);
      src.start();
    }
    function setNature(on) { if (hum) hum.gain.value = on ? 0.05 : 0; }
    function horn() { if (!ensure()) return; const t = ctx.currentTime; tone(196, t, 1.6, 0.12, "sawtooth", 0.05); tone(247, t, 1.6, 0.08, "sawtooth", 0.05); }
    function fanfare() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [[523.25, 0], [523.25, 0.18], [523.25, 0.36], [698.46, 0.6], [880, 1.0], [783.99, 1.3], [1046.5, 1.6]].forEach(([f, d]) => tone(f, t + d, 0.6, 0.13, "triangle"));
    }
    return { ensure, setOn, setNature, westminster, chime, good, bad, stamp, step, bird, horn, fanfare };
  })();

  // 읽어 주기
  function speak(text, lang = "ko-KR", rate = 0.95) {
    if (!("speechSynthesis" in window) || !save.opt.sound) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      const v = speechSynthesis.getVoices().find((x) => x.lang.replace("_", "-").startsWith(lang)) ||
        speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang.slice(0, 2)));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- 화면 글자 ----------
  let toastTimer = null;
  function toast(msg, ms = 2800) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.remove("off");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("off"), ms);
  }

  function nextStop() {
    return STOPS.find((st) => st.s > save.s + 0.5 && !save.stamps[st.id]) || STOPS.find((st) => st.s > save.s + 0.5) || null;
  }
  function realM(ds) { return (ds / World.L) * REAL_KM * 1000; }
  function fmtDist(m) { return m >= 1000 ? (m / 1000).toFixed(1) + "km" : Math.round(m / 10) * 10 + "m"; }
  function londonClock() {
    const { h, m } = World.londonTime();
    const ap = h < 12 ? "오전" : "오후";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `런던 ${ap} ${hh}:${String(m).padStart(2, "0")}`;
  }

  let hudTimer = 0;
  function updateHud() {
    const ns = nextStop();
    if (ns) {
      $("next").querySelector(".em").textContent = ns.emoji;
      $("next-name").textContent = "→ " + ns.ko;
      $("next-sub").textContent = `${fmtDist(realM(ns.s - save.s))} 남음 · ${londonClock()}`;
    } else {
      $("next").querySelector(".em").textContent = "🏁";
      $("next-name").textContent = save.done ? "런던 탐방 완주!" : "→ 타워 브리지 건너기";
      $("next-sub").textContent = londonClock();
    }
    const walked = (save.s / World.L) * REAL_KM;
    $("dist").textContent = `${walked.toFixed(1)} / ${REAL_KM.toFixed(1)}km`;
    $("bar-in").style.width = Math.min(100, (save.s / World.L) * 100) + "%";
    $("stamp-count").textContent = Object.keys(save.stamps).length;
    const st = $("status");
    if (mode === "look" || mode === "bridge") { st.textContent = "구경 중"; st.className = "look"; }
    else if (walking) { st.textContent = "걷는 중"; st.className = ""; }
    else { st.textContent = "멈춤"; st.className = "stop"; }
    $("info-title").textContent = ns ? `다음: ${ns.ko}` : "런던 탐방";
    $("info-line").textContent = Net.role === "host" ? `👨‍👩‍👧 방 코드 ${roomCode}` : Net.role === "join" ? "👨‍👩‍👧 같이 걷는 중" : "화면을 끌면 둘러볼 수 있어요";
    updateFriendChips();
  }

  function setWalking(on) {
    if (on && (busy || save.done)) return;
    walking = on;
    const b = $("walk");
    b.classList.toggle("on", on);
    b.innerHTML = on ? '<span class="i">⏸</span>멈추기' : '<span class="i">▶</span>걷기';
    if (on && mode === "look") mode = "follow";
    updateHud();
  }

  // ---------- 걷기와 명소 도착 ----------
  function stepWalk(dt) {
    if (!walking || busy) return;
    const v = SPEEDS[speedMode];
    const before = save.s;
    let after = Math.min(World.L - 5, before + v * dt);
    // 지나가는 명소가 있으면 거기서 멈춰요
    const st = STOPS.find((x) => x.s > before && x.s <= after);
    if (st) after = st.s;
    save.s = after;
    if (st) arrive(st);
    if (save.s >= World.L - 5.01 && !save.done) finish();
  }

  function landmarkOf(st) { return World.landmarks.find((l) => l.id === st.id); }

  function arrive(st) {
    const had = !!save.stamps[st.id];
    if (had && st.id !== "bridge") {
      toast(`${st.emoji} ${st.ko} (도장 받았어요)`);
      return;
    }
    setWalking(false);
    busy = true;
    mode = "look";
    lookTarget = landmarkOf(st);
    store();
    Net.event("arrive", st.id);
    Snd.chime();
    toast(`${st.emoji} ${st.ko}에 도착했어요!`, 2600);
    if (st.id === "bigben") setTimeout(() => Snd.westminster(), 600);
    setTimeout(() => {
      if (had) bridgeScene(st);
      else showCard(st, true);
    }, 1700);
  }

  // ---------- 창(모달) ----------
  let onModalClose = null;
  function openModal(html, onClose) {
    $("sheet").innerHTML = `<button class="x" aria-label="닫기">✕</button>` + html;
    $("modal").hidden = false;
    onModalClose = onClose || null;
    $("sheet").querySelector(".x").onclick = closeModal;
    $("sheet").scrollTop = 0;
  }
  function closeModal() {
    $("modal").hidden = true;
    const cb = onModalClose; onModalClose = null;
    try { speechSynthesis.cancel(); } catch (e) {}
    cb && cb();
  }
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  // 명소 카드: 이야기 → 영어 한마디 → 퀴즈 → 도장
  function showCard(st, fromArrival) {
    const got = !!save.stamps[st.id];
    openModal(`
      <div class="lm-head"><span class="em">${st.emoji}</span><div><h2>${esc(st.ko)}</h2><small>${esc(st.en)}</small></div></div>
      <button class="say" id="read-facts">🔊 읽어 주기</button>
      <ul class="facts">${st.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <div class="eng"><div class="t"><small>오늘의 영어 한마디</small><b>${esc(st.phrase.en)}</b><span class="k">${esc(st.phrase.ko)}</span></div><button id="say-en" aria-label="영어 듣기">🔊</button></div>
      ${got ? `<div class="stamp"><span class="em">${st.emoji}</span>${esc(st.en)}<br>${esc(save.stamps[st.id])}</div>
        <button class="big" id="card-next">${fromArrival ? "계속 걷기 ▶" : "닫기"}</button>`
        : `<button class="big red" id="card-quiz">✏️ 퀴즈 풀고 도장 받기</button><button class="big soft" id="card-later">나중에 할게요</button>`}
    `, () => afterCard(st, fromArrival));
    $("read-facts").onclick = () => speak(`${st.ko}. ${st.facts.join(" ")}`);
    $("say-en").onclick = () => speak(st.phrase.en, "en-GB", 0.85);
    if ($("card-quiz")) $("card-quiz").onclick = () => showQuiz(st, fromArrival);
    if ($("card-later")) $("card-later").onclick = closeModal;
    if ($("card-next")) $("card-next").onclick = closeModal;
    if (fromArrival) setTimeout(() => speak(st.phrase.en, "en-GB", 0.85), 500);
  }

  function showQuiz(st, fromArrival) {
    const q = st.quiz;
    openModal(`
      <div class="lm-head"><span class="em">✏️</span><div><h2>${esc(st.ko)} 퀴즈</h2><small>맞히면 여권에 도장을 찍어요</small></div></div>
      <div class="q">${esc(q.q)}</div>
      <div class="choices">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${["①", "②", "③"][i]} ${esc(c)}</button>`).join("")}</div>
      <div id="quiz-after"></div>
    `, () => afterCard(st, fromArrival));
    speak(q.q);
    $("sheet").querySelectorAll(".choice").forEach((b) => {
      b.onclick = () => {
        if (save.stamps[st.id]) return;
        const i = +b.dataset.i;
        if (i === q.answer) {
          b.classList.add("good");
          Snd.good();
          const d = new Date();
          save.stamps[st.id] = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
          store();
          Net.event("stamp", st.id);
          updateHud();
          $("quiz-after").innerHTML = `
            <div class="why">⭕ 정답! ${esc(q.why)}</div>
            <div class="stamp pop"><span class="em">${st.emoji}</span>${esc(st.en)}<br>${esc(save.stamps[st.id])}</div>
            <button class="big" id="quiz-next">${fromArrival ? (st.id === "bridge" ? "다리가 열리는 걸 보러 가요 🌉" : "계속 걷기 ▶") : "닫기"}</button>`;
          setTimeout(() => Snd.stamp(), 120);
          speak("정답! " + q.why);
          $("quiz-next").onclick = closeModal;
          setTimeout(() => $("quiz-next") && $("quiz-next").scrollIntoView({ behavior: "smooth", block: "end" }), 200);
        } else {
          b.classList.remove("bad"); void b.offsetWidth; b.classList.add("bad");
          b.disabled = true;
          Snd.bad();
          $("quiz-after").innerHTML = `<div class="why">앗, 아니에요. 다른 답을 골라 볼까요? 🤔</div>`;
        }
      };
    });
  }

  function afterCard(st, fromArrival) {
    if (!fromArrival) return;
    if (st.id === "bridge") { bridgeScene(st); return; }
    busy = false;
    mode = "follow";
    lookTarget = null;
    setWalking(true);
  }

  // 타워 브리지: 다리가 열리고 배가 지나간 다음, 다리를 건너 끝나요
  function bridgeScene() {
    busy = true;
    mode = "bridge";
    setWalking(false);
    toast("🚢 큰 배가 와요! 다리가 열려요!", 4000);
    speak("The bridge is opening!", "en-GB", 0.85);
    Snd.horn();
    setTimeout(() => Snd.chime(), 3000);
    World.openBridge(() => {
      toast("다리가 닫혔어요. 이제 건너가요! 🌉");
      busy = false;
      mode = "follow";
      lookTarget = null;
      setWalking(true);
    });
  }

  function finish() {
    save.done = true;
    store();
    Net.event("finish");
    setWalking(false);
    mode = "finale";
    Snd.fanfare();
    confetti();
    const n = Object.keys(save.stamps).length;
    setTimeout(() => {
      openModal(`
        <div style="text-align:center">
          <div style="font-size:64px">🎉</div>
          <h2 style="margin:0 0 6px">런던 탐방 완주!</h2>
          <p>버킹엄 궁전에서 타워 브리지까지<br><b>${REAL_KM.toFixed(1)}km</b>를 걸었어요. 도장 <b>${n}</b>개를 모았어요!</p>
          <p style="color:#8a4a12">✨ ${esc(wishText())}</p>
        </div>
        <button class="big red" id="fin-card">📷 기념 엽서 만들기</button>
        <button class="big soft" id="fin-pass">🛂 여권 보기</button>
        <button class="big soft" id="fin-again">처음부터 다시 걷기</button>
      `);
      $("fin-card").onclick = () => postcard();
      $("fin-pass").onclick = () => passport();
      $("fin-again").onclick = () => restart();
      speak("런던 탐방 완주! 정말 잘했어요!");
    }, 1200);
  }

  function confetti() {
    const colors = ["#c8102e", "#012169", "#ffffff", "#f2c230", "#e2853a"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 2.2 + Math.random() * 2 + "s";
      c.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5200);
    }
  }

  function restart() {
    const look = save.look, wish = save.wish, opt = save.opt;
    save = fresh();
    save.look = look; save.wish = wish; save.opt = opt;
    store();
    closeModal();
    busy = false; walking = false; lookTarget = null;
    mode = "follow";
    placePlayer();
    setWalking(false);
    toast("버킹엄 궁전에서 다시 출발해요!");
  }

  // ---------- 여권 ----------
  function passport() {
    const words = STOPS.filter((st) => save.stamps[st.id]);
    openModal(`
      <div class="passport-head">🇬🇧<b>PASSPORT</b>런던 탐방 여권 · 도장 ${words.length}/9</div>
      <div class="stamps">${STOPS.map((st) => save.stamps[st.id]
        ? `<button class="got" data-id="${st.id}"><span class="em">${st.emoji}</span>${esc(st.ko)}<br>${esc(save.stamps[st.id])}</button>`
        : `<button data-id="${st.id}"><span class="em">?</span>${esc(st.ko)}</button>`).join("")}</div>
      <h2 style="margin-top:16px">배운 영어 ${words.length ? "" : "(아직 없어요)"}</h2>
      <div class="words">${words.map((st) => `<div data-en="${esc(st.phrase.en)}"><b>${esc(st.phrase.en)}</b><span>${esc(st.phrase.ko)} 🔊</span></div>`).join("")}</div>
      <p style="color:#8a4a12;text-align:center">✨ ${esc(wishText())}</p>
    `);
    $("sheet").querySelectorAll(".stamps button").forEach((b) => {
      b.onclick = () => {
        const st = STOPS.find((x) => x.id === b.dataset.id);
        if (save.stamps[st.id]) showCard(st, false);
        else toast(`${st.ko}에 걸어가면 도장을 받을 수 있어요`);
      };
    });
    $("sheet").querySelectorAll(".words div").forEach((d) => { d.onclick = () => speak(d.dataset.en, "en-GB", 0.85); });
  }

  // ---------- 지도 ----------
  function mapView() {
    const pts = World.samples;
    const minX = -60, maxX = 1120, minZ = -260, maxZ = 170;
    const W = 340, H = Math.round(W * (maxZ - minZ) / (maxX - minX));
    const sx = (x) => ((x - minX) / (maxX - minX)) * W, sz = (z) => ((z - minZ) / (maxZ - minZ)) * H;
    const line = pts.map((p) => `${sx(p.x).toFixed(1)},${sz(p.z).toFixed(1)}`).join(" ");
    const done = pts.filter((p) => p.s <= save.s).map((p) => `${sx(p.x).toFixed(1)},${sz(p.z).toFixed(1)}`).join(" ");
    const me = World.posAt(save.s);
    const stops = STOPS.map((st) => {
      const got = save.stamps[st.id];
      // 런던 아이는 강 건너편에 있어서 건물 자리에 점을 찍어요. 이름표는 겹치지 않게 위아래로 나눠요.
      const [mx, mz] = st.id === "eye" ? st.at : st.stop;
      const x = sx(mx), y = sz(mz);
      const place = { palace: "below", abbey: "above", bigben: "below", eye: "right", trafalgar: "left", museum: "below", stpauls: "right", tower: "above", bridge: "belowEnd" }[st.id];
      const lx = place === "right" ? x + 12 : place === "left" ? x - 12 : place === "belowEnd" ? x + 8 : x;
      const ly = place === "above" ? y - 13 : place.startsWith("below") ? y + 21 : y + 4;
      const anchor = place === "right" ? "start" : place === "left" || place === "belowEnd" ? "end" : "middle";
      return `<g><circle cx="${x}" cy="${y}" r="9" fill="${got ? "#c8102e" : "#fff"}" stroke="#c8102e" stroke-width="2"/>
        <text x="${x}" y="${y + 4}" font-size="10" text-anchor="middle" fill="#fff">${got ? "✓" : ""}</text>
        <text x="${lx}" y="${ly}" font-size="10.5" text-anchor="${anchor}" fill="#2d2a32">${st.emoji}${esc(st.ko)}</text></g>`;
    }).join("");
    openModal(`
      <h2>🗺️ 런던 탐방 지도</h2>
      <svg id="mapsvg" viewBox="0 0 ${W} ${H}" font-family="Jua, sans-serif">
        <rect x="0" y="${sz(RIVER.zNorth)}" width="${W}" height="${sz(RIVER.zSouth) - sz(RIVER.zNorth)}" fill="#a9cfe0"/>
        <text x="${sx(560)}" y="${(sz(RIVER.zNorth) + sz(RIVER.zSouth)) / 2 + 4}" font-size="11" fill="#2f6f8e">템스강 Thames</text>
        <polyline points="${line}" fill="none" stroke="#c9c0ad" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 8"/>
        <polyline points="${done}" fill="none" stroke="#e2a33a" stroke-width="5" stroke-linecap="round"/>
        ${stops}
        <circle cx="${sx(me.x)}" cy="${sz(me.z)}" r="7" fill="#1f2d4a" stroke="#fff" stroke-width="3"><animate attributeName="r" values="6;9;6" dur="1.4s" repeatCount="indefinite"/></circle>
      </svg>
      <p style="color:#6f6878;font-size:14px">노란 선은 걸어온 길, 파란 점이 지금 있는 곳이에요. 실제 런던 지도를 아주 단순하게 줄인 그림이에요.</p>
    `);
  }

  // ---------- 사진 엽서 ----------
  function wishText() {
    return `${WISH_WHO[save.wish.who]} ${WISH_WHAT[save.wish.what]}`;
  }
  function postcard() {
    renderer.render(scene, camera);
    const shot = renderer.domElement;
    const W = 900, H = 640;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, W, H);
    // 사진을 가운데 맞춰 잘라 붙여요
    const pw = 860, ph = 470;
    const r = Math.max(pw / shot.width, ph / shot.height);
    const cw = pw / r, ch = ph / r;
    g.drawImage(shot, (shot.width - cw) / 2, (shot.height - ch) / 2, cw, ch, 20, 20, pw, ph);
    g.fillStyle = "rgba(200,16,46,.92)"; g.fillRect(20, 20, 330, 70);
    g.fillStyle = "#fff"; g.font = "38px Jua, sans-serif"; g.textBaseline = "middle";
    g.fillText("Greetings from LONDON", 34, 57);
    g.fillStyle = "#2d2a32"; g.font = "30px Jua, sans-serif";
    g.fillText("✨ " + wishText(), 28, 530);
    const st = Object.keys(save.stamps).length;
    g.fillStyle = "#6f6878"; g.font = "22px Jua, sans-serif";
    const d = new Date();
    g.fillText(`런던 탐방 · 도장 ${st}/9 · ${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, 28, 580);
    let x = W - 40;
    STOPS.filter((s) => save.stamps[s.id]).slice(-5).forEach((s) => {
      g.save(); g.translate(x - 32, 560); g.rotate(-0.2);
      g.strokeStyle = "#c8102e"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.stroke();
      g.font = "30px sans-serif"; g.textAlign = "center"; g.fillText(s.emoji, 0, 2);
      g.restore();
      x -= 72;
    });
    const url = c.toDataURL("image/png");
    openModal(`
      <h2>📷 런던 엽서</h2>
      <img id="postcard-img" src="${url}" alt="런던 엽서">
      <button class="big" id="pc-save">💾 사진으로 저장하기</button>
      ${navigator.share ? `<button class="big soft" id="pc-share">📤 보내기</button>` : ""}
    `);
    $("pc-save").onclick = () => {
      const a = document.createElement("a");
      a.href = url; a.download = `london-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    };
    if ($("pc-share")) $("pc-share").onclick = async () => {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], "london.png", { type: "image/png" });
        await navigator.share({ files: [file], title: "런던 탐방 엽서" });
      } catch (e) {}
    };
    Snd.chime();
  }

  // ---------- 더 보기(설정) ----------
  function more() {
    const sw = (k, title, sub) => `<div class="toggle" data-k="${k}"><div>${title}<small>${sub}</small></div><div class="sw ${save.opt[k] ? "on" : ""}"></div></div>`;
    openModal(`
      <h2>⋯ 더 보기</h2>
      ${sw("sound", "소리", "모든 소리와 읽어 주기")}
      ${sw("nature", "거리 소리", "새소리, 멀리서 들리는 도시 소리")}
      ${sw("bells", "종소리", "빅벤에 도착하면 종이 울려요")}
      ${sw("autoView", "자동 시점", "둘러본 뒤 카메라가 다시 캐릭터 뒤로 돌아와요")}
      ${Net.role === "solo" ? `<button class="big soft" id="mo-together">👨‍👩‍👧 같이 걷기</button>`
        : `<div class="toggle"><div>👨‍👩‍👧 같이 걷는 중<small>${Net.role === "host" ? "방 코드 " + roomCode : "방에 들어와 있어요"} · ${friends.size}명과 함께</small></div></div>
           <button class="big soft" id="mo-leave">같이 걷기 끝내기</button>`}
      <button class="big soft" id="mo-look">🎩 캐릭터·소원 바꾸기</button>
      <button class="big soft" id="mo-map">🗺️ 지도 보기</button>
      <button class="big soft" id="mo-restart">처음부터 다시 걷기</button>
      <p style="color:#6f6878;font-size:13px;text-align:center">실제 길과 건물을 단순하게 만든 그림이에요.<br>진짜 여행 정보(입장료, 시간)는 꼭 다시 확인해요.</p>
    `);
    $("sheet").querySelectorAll(".toggle").forEach((row) => {
      row.onclick = () => {
        const k = row.dataset.k;
        save.opt[k] = !save.opt[k];
        row.querySelector(".sw").classList.toggle("on", save.opt[k]);
        store();
        if (k === "sound") { Snd.setOn(save.opt.sound); $("btn-sound").textContent = save.opt.sound ? "🔊" : "🔇"; }
        if (k === "nature") Snd.setNature(save.opt.nature);
      };
    });
    $("mo-look").onclick = () => { closeModal(); showStart(true); };
    if ($("mo-together")) $("mo-together").onclick = () => togetherMenu(true);
    if ($("mo-leave")) $("mo-leave").onclick = () => { leaveTogether(); closeModal(); toast("혼자 걷기로 바뀌었어요"); };
    $("mo-map").onclick = mapView;
    $("mo-restart").onclick = () => { if (confirm("처음부터 다시 걸을까요? 모은 도장도 지워져요.")) restart(); };
  }

  // ---------- 시작 화면 ----------
  function chips(el, items, cur, onPick, isColor) {
    el.innerHTML = items.map((it, i) => isColor
      ? `<button class="opt color ${it === cur ? "on" : ""}" style="background:${it}" data-i="${i}" aria-label="색"></button>`
      : `<button class="opt ${i === cur || it.id === cur ? "on" : ""}" data-i="${i}">${esc(it.ko || it)}</button>`).join("");
    el.querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        el.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        onPick(+b.dataset.i);
      };
    });
  }
  function showStart(editing) {
    mode = "start";
    $("start").hidden = false;
    $("top").hidden = true;
    $("bottom").hidden = true;
    setWalking(false);
    chips($("opt-name"), NAMES, save.name, (i) => { save.name = i; store(); Net.setProfile(profile()); });
    chips($("opt-hat"), HATS, save.look.hat, (i) => { save.look.hat = HATS[i].id; makePlayer(); store(); Net.setProfile(profile()); });
    chips($("opt-shirt"), SHIRTS, save.look.shirt, (i) => { save.look.shirt = SHIRTS[i]; makePlayer(); store(); Net.setProfile(profile()); }, true);
    const wl = () => { $("wish-line").textContent = "“" + wishText() + "”"; };
    chips($("opt-who"), WISH_WHO, save.wish.who, (i) => { save.wish.who = i; wl(); store(); });
    chips($("opt-what"), WISH_WHAT, save.wish.what, (i) => { save.wish.what = i; wl(); store(); });
    wl();
    const started = save.s > 10 || Object.keys(save.stamps).length > 0;
    $("btn-go").textContent = editing ? "다시 걷기 🚶" : started ? "혼자 이어서 걷기 🚶" : "혼자 걷기 🚶";
    $("btn-together").hidden = editing;
    $("btn-restart").hidden = !started || editing;
    placePlayer();
  }
  $("btn-go").onclick = () => startGame();
  $("btn-together").onclick = () => { Snd.ensure(); togetherMenu(false); };
  function startGame() {
    Snd.ensure();
    $("start").hidden = true;
    $("top").hidden = false;
    $("bottom").hidden = false;
    mode = "follow";
    placePlayer();
    updateHud();
    if (save.done) { toast("완주했어요! ⋯ 더 보기에서 처음부터 다시 걸을 수 있어요"); return; }
    const first = !save.stamps.palace && save.s < 20;
    toast(first ? "▶ 걷기를 누르면 출발해요. 화면을 끌면 둘러볼 수 있어요" : "다시 런던 거리로! ▶ 걷기를 눌러요", 4000);
    if (first) speak("런던 탐방을 시작해요! 걷기를 눌러 보세요.");
  }
  $("btn-restart").onclick = () => { if (confirm("처음부터 다시 걸을까요? 모은 도장도 지워져요.")) { restart(); showStart(false); } };

  // ---------- 같이 걷기 ----------
  // 한 기기가 방을 만들고(방장), 다른 기기가 입장 코드로 들어와요. 길 위에서 서로의 캐릭터가 보여요.
  // 걷기는 각자 해요. 걸은 거리와 도장도 기기마다 따로 저장돼요.
  const friends = new Map(); // id → { p, s, shownS, w, n, off, fig, label, bubble, bubbleT }
  let roomCode = "";
  const OFFSETS = [-1.8, 1.8, -3.4, 3.4, -5];

  function profile() { return { name: NAMES[save.name] || "아이", hat: save.look.hat, shirt: save.look.shirt }; }
  function nameOf(id) { const f = friends.get(id); return f ? f.p.name : "친구"; }

  function buildFriendFig(f) {
    if (f.fig) scene.remove(f.fig.group);
    if (f.label) scene.remove(f.label);
    f.fig = World.makeChibi({ shirt: f.p.shirt, pants: "#3a4a6b", hat: f.p.hat, hatColor: "#e8c77a", hair: "#3a2416", bag: "#5a8fd0", bagMark: "#ffffff",
      belt: f.p.hat === "bearskin" ? "#ffffff" : null });
    f.fig.group.scale.setScalar(1.15);
    scene.add(f.fig.group);
    f.label = World.makeLabel(f.p.name, null, { scale: 4.2, bg: "rgba(31,45,74,.88)", color: "#ffffff" });
    scene.add(f.label);
  }
  function removeFriend(f) {
    scene.remove(f.fig.group); scene.remove(f.label);
    if (f.bubble) scene.remove(f.bubble);
  }

  Net.on("roster", (list) => {
    const ids = new Set(list.map((e) => e.id));
    for (const [id, f] of friends) {
      if (ids.has(id)) continue;
      removeFriend(f);
      friends.delete(id);
      toast(`${f.p.name} 나갔어요`);
    }
    list.forEach((e, i) => {
      const p = Object.assign({ name: "친구", hat: "straw", shirt: "#c8102e" }, e.p || {});
      let f = friends.get(e.id);
      if (!f) {
        f = { p, s: save.s, shownS: null, w: 0, n: 0 };
        friends.set(e.id, f);
        buildFriendFig(f);
        if (mode !== "start") toast(`👋 ${p.name} 들어왔어요!`);
      } else if (JSON.stringify(f.p) !== JSON.stringify(p)) {
        f.p = p;
        buildFriendFig(f);
      }
      f.off = OFFSETS[i % OFFSETS.length];
    });
    refreshRoomList();
    updateHud();
  });
  Net.on("snap", (list) => {
    for (const [id, s, w, n] of list) {
      const f = friends.get(id);
      if (!f) continue;
      f.s = s; f.w = w; f.n = n;
      if (f.shownS === null) f.shownS = s;
    }
  });
  Net.on("emote", (id, i) => {
    const em = EMOTES[i], f = friends.get(id);
    if (!em || !f) return;
    f.fig.waving = 1.6;
    if (f.bubble) scene.remove(f.bubble);
    f.bubble = World.makeLabel(`${em.e} ${em.en}`, null, { fixed: 0.3, depthTest: false, bg: "rgba(255,255,255,.96)" });
    scene.add(f.bubble);
    f.bubbleT = 3.5;
    toast(`${f.p.name}: “${em.en}” (${em.ko})`, 3600);
    Snd.chime();
    speak(em.en, "en-GB", 0.9);
  });
  Net.on("event", (id, k, a) => {
    const name = nameOf(id);
    const st = STOPS.find((x) => x.id === a);
    if (k === "arrive" && st) toast(`${name} · ${st.emoji} ${st.ko} 도착!`);
    else if (k === "stamp" && st) toast(`🛂 ${name} 도장 받았어요! ${st.emoji}`);
    else if (k === "finish") { toast(`🎉 ${name} 완주!`, 4000); confetti(); }
  });
  let wasLost = false;
  Net.on("status", (st) => {
    if (st === "lost") { wasLost = true; toast("연결이 끊겼어요. 다시 연결하는 중…", 4000); }
    else if (st === "ok" && wasLost) { wasLost = false; toast("다시 연결됐어요! 👨‍👩‍👧"); }
    else if (st === "full") { toast("방이 꽉 찼어요 (6명까지)"); leaveTogether(); }
  });

  function leaveTogether() {
    Net.leave();
    for (const f of friends.values()) removeFriend(f);
    friends.clear();
    roomCode = "";
    $("emotes").hidden = true;
    updateHud();
  }

  function updateFriends(dt) {
    for (const f of friends.values()) {
      if (f.shownS === null) { f.fig.group.visible = f.label.visible = false; continue; }
      const gap = f.s - f.shownS;
      // 멀리 옮겨 가면(옆으로 가기) 바로 따라가고, 아니면 부드럽게 따라가요
      f.shownS = Math.abs(gap) > 40 ? f.s : f.shownS + gap * Math.min(1, dt * 5);
      const near = Math.abs(f.shownS - save.s) < 260;
      f.fig.group.visible = f.label.visible = near;
      if (!near) continue;
      const q = World.sideAt(f.shownS, f.off || -1.8);
      const y = World.onBridge(q.x, q.z) ? 0.3 : 0;
      World.animateChibi(f.fig, dt, f.w || Math.abs(gap) > 0.3, 1);
      f.fig.group.position.set(q.x, y + (f.fig.bob || 0) * 1.15, q.z);
      f.fig.group.rotation.y = Math.atan2(q.hx, q.hz);
      f.label.position.set(q.x, y + 3.9, q.z);
      if (f.bubble) {
        f.bubbleT -= dt;
        f.bubble.position.set(q.x, y + 5.4, q.z);
        if (f.bubbleT <= 0) { scene.remove(f.bubble); f.bubble = null; }
      }
    }
  }

  // 함께 걷는 사람 칩: 버튼은 사람이 바뀔 때만 새로 만들고 글자만 바꿔요(누르는 중에 사라지지 않게)
  function updateFriendChips() {
    const box = $("friends");
    box.hidden = !friends.size;
    const ids = [...friends.keys()].join();
    if (box.dataset.ids !== ids) {
      box.dataset.ids = ids;
      box.innerHTML = [...friends.keys()].map((id) => `<button class="glass" data-id="${esc(id)}"></button>`).join("");
      box.querySelectorAll("button").forEach((b) => { b.onclick = () => goToFriend(b.dataset.id); });
    }
    box.querySelectorAll("button").forEach((b) => {
      const f = friends.get(b.dataset.id);
      if (!f) return;
      const d = realM(f.s - save.s);
      const where = Math.abs(d) < 30 ? "바로 옆" : d > 0 ? `${fmtDist(d)} 앞` : `${fmtDist(-d)} 뒤`;
      b.textContent = `🧑 ${f.p.name} · ${where} · 🛂${f.n}`;
    });
  }

  // 앞서간 사람 옆으로 가요. 아직 도장을 안 받은 명소가 사이에 있으면 거기서 먼저 멈춰요.
  function goToFriend(id) {
    const f = friends.get(id);
    if (!f) return;
    const name = f.p.name;
    const d = f.s - save.s;
    if (Math.abs(d) < 6) { toast(`${name} 바로 옆에 있어요!`); return; }
    if (d < 0) { toast(`${name} ${fmtDist(realM(-d))} 뒤에 있어요. 멈춰서 기다려 줘요 ✋`); return; }
    if (busy || save.done) return;
    if (!confirm(`${name} 옆으로 갈까요?`)) return;
    setWalking(false);
    const st = STOPS.find((x) => x.s > save.s + 0.5 && x.s < f.s && !save.stamps[x.id]);
    if (st) { save.s = st.s; arrive(st); }
    else { save.s = Math.min(f.s, World.L - 5.5); toast(`🧲 ${name} 옆으로 왔어요!`); }
    store();
    updateHud();
  }

  function sendEmote(i) {
    const em = EMOTES[i];
    $("emotes").hidden = true;
    player.waving = 1.6;
    showPlayerBubble(`${em.e} ${em.en}`);
    speak(em.en, "en-GB", 0.9);
    Net.emote(i);
    toast(`“${em.en}” = ${em.ko}`);
  }
  $("emotes").innerHTML = EMOTES.map((em, i) => `<button data-i="${i}">${em.e} ${esc(em.en)}</button>`).join("") +
    `<button data-i="w">🙋 지나가는 사람에게 인사</button>`;
  $("emotes").querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.i === "w") { $("emotes").hidden = true; greetWalker(); }
      else sendEmote(+b.dataset.i);
    };
  });

  function togetherMenu(inGame) {
    if (Net.role !== "solo") { roomView(inGame); return; }
    openModal(`
      <h2>👨‍👩‍👧 같이 걷기</h2>
      <p style="margin-top:0">엄마와 아이처럼 각자 기기로 같은 런던 거리를 함께 걸어요. 서로의 캐릭터가 보이고, 영어로 인사를 주고받을 수 있어요.</p>
      <div class="label">내 이름 (서로에게 보여요)</div>
      <div class="opts" id="tg-name"></div>
      <button class="big" id="tg-host">🏠 방 만들기<small class="sub2">먼저 시작하는 사람</small></button>
      <button class="big soft" id="tg-join">🔢 코드 넣고 들어가기<small class="sub2">방을 만든 사람이 알려 준 숫자 4개</small></button>
      <p style="color:#6f6878;font-size:13px">두 기기 모두 인터넷이 되어야 해요. 걸은 거리와 도장은 기기마다 따로 저장돼요.</p>
    `);
    chips($("tg-name"), NAMES, save.name, (i) => {
      save.name = i; store();
      if (!$("start").hidden) chips($("opt-name"), NAMES, save.name, (k) => { save.name = k; store(); Net.setProfile(profile()); });
    });
    $("tg-host").onclick = () => hostRoom(inGame);
    $("tg-join").onclick = () => joinView(inGame);
  }

  function hostRoom(inGame) {
    openModal(`<h2>🏠 방 만들기</h2><div class="msg wait" id="rm-msg">방을 만드는 중… ⏳</div>`);
    const code = /^\d{4}$/.test(save.hostCode) ? save.hostCode : Net.newCode();
    let opened = false;
    Net.updateMe(save.s, false, Object.keys(save.stamps).length);
    Net.host(code, profile(), (err, real) => {
      if (err && opened) { toast("연결 서버와 잠깐 끊겼어요. 인터넷을 확인해요."); return; }
      if (err) {
        Net.leave();
        const msg = err === "nolib" ? "연결 도구를 불러오지 못했어요." : "연결 서버(PeerJS)에 닿지 않아요. 인터넷이 되는지 확인해요.";
        if ($("rm-msg")) $("rm-msg").outerHTML = `<div class="msg bad">😢 ${msg} (${esc(err)})</div><button class="big soft" id="rm-back">돌아가기</button>`;
        if ($("rm-back")) $("rm-back").onclick = () => togetherMenu(inGame);
        return;
      }
      opened = true;
      roomCode = real; save.hostCode = real; store();
      roomView(inGame);
    });
  }

  function roomView(inGame) {
    const host = Net.role === "host";
    openModal(`
      <h2>👨‍👩‍👧 같이 걷기</h2>
      ${host ? `<p style="margin:0">다른 기기에서 <b>런던 탐방 → 👨‍👩‍👧 같이 걷기 → 코드 넣고 들어가기</b>를 누르고 이 숫자를 넣어요.</p>
        <div class="code-big">${roomCode.split("").map((c) => `<span>${c}</span>`).join("")}</div>` : `<p style="margin:0 0 8px">방에 들어왔어요! 🎉</p>`}
      <div class="label">함께 걷는 사람</div>
      <div id="room-list" class="room-list"></div>
      <button class="big" id="rm-go">${inGame ? "닫기" : "출발! 🚶"}</button>
    `);
    refreshRoomList();
    $("rm-go").onclick = () => { closeModal(); if (!inGame) startGame(); };
  }
  function refreshRoomList() {
    const el = $("room-list");
    if (!el) return;
    const others = [...friends.values()].map((f) => `<div>🧑 ${esc(f.p.name)} <span>들어왔어요 ✓</span></div>`).join("");
    el.innerHTML = `<div>🧑 ${esc(profile().name)} <span>나</span></div>` + (others || `<div class="wait">다른 사람을 기다리는 중… ⏳</div>`);
  }

  function joinView(inGame) {
    let code = (save.lastCode || "").slice(0, 4);
    openModal(`
      <h2>🔢 코드 넣기</h2>
      <p style="margin:0 0 6px">방을 만든 사람 화면에 나온 숫자 4개를 넣어요.</p>
      <div class="code-big" id="jn-boxes"></div>
      <div class="pad" id="jn-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join("")}<button data-k="c" class="soft">지우기</button><button data-k="0">0</button><button data-k="b" class="soft">⌫</button></div>
      <div class="msg" id="jn-msg"></div>
      <button class="big" id="jn-go">들어가기</button>
    `);
    const draw = () => {
      $("jn-boxes").innerHTML = [0, 1, 2, 3].map((i) => `<span class="${i === code.length ? "on" : ""}">${code[i] || ""}</span>`).join("");
      $("jn-go").disabled = code.length !== 4;
    };
    draw();
    $("jn-pad").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k;
        if (k === "c") code = "";
        else if (k === "b") code = code.slice(0, -1);
        else if (code.length < 4) code += k;
        draw();
      };
    });
    $("jn-go").onclick = () => {
      if (code.length !== 4) return;
      $("jn-go").disabled = true;
      $("jn-msg").className = "msg wait"; $("jn-msg").textContent = "연결하는 중… ⏳";
      Net.updateMe(save.s, false, Object.keys(save.stamps).length);
      Net.join(code, profile(), (err) => {
        if (err) {
          if ($("jn-go")) $("jn-go").disabled = false;
          if ($("jn-msg")) {
            $("jn-msg").className = "msg bad";
            $("jn-msg").textContent = err === "peer-unavailable" ? "😢 그런 방이 없어요. 숫자를 다시 확인해요." :
              err === "nolib" ? "😢 연결 도구를 불러오지 못했어요." : "😢 연결이 안 돼요. 인터넷을 확인하고 다시 해 봐요.";
          }
          return;
        }
        save.lastCode = code; roomCode = code; store();
        roomView(inGame);
      });
    };
  }

  // ---------- 버튼 ----------
  $("walk").onclick = () => { Snd.ensure(); setWalking(!walking); };
  $("btn-speed").onclick = () => {
    speedMode = speedMode === "slow" ? "fast" : "slow";
    $("btn-speed").innerHTML = speedMode === "slow" ? '<span class="i">🐢</span>천천히' : '<span class="i">🐇</span>빨리';
    toast(speedMode === "slow" ? "🐢 천천히 걸어요" : "🐇 빨리 걸어요");
  };
  $("btn-passport").onclick = passport;
  $("btn-more").onclick = more;
  $("btn-map").onclick = mapView;
  $("btn-photo").onclick = postcard;
  $("next").onclick = () => {
    const ns = nextStop();
    if (ns) toast(`${ns.emoji} ${ns.ko}까지 ${fmtDist(realM(ns.s - save.s))} 남았어요`);
  };
  $("btn-sound").textContent = save.opt.sound ? "🔊" : "🔇";
  $("btn-sound").onclick = () => {
    save.opt.sound = !save.opt.sound;
    Snd.ensure(); Snd.setOn(save.opt.sound);
    $("btn-sound").textContent = save.opt.sound ? "🔊" : "🔇";
    store();
    toast(save.opt.sound ? "🔊 소리 켜짐" : "🔇 소리 꺼짐");
  };

  function showPlayerBubble(text) {
    if (playerBubble) scene.remove(playerBubble);
    playerBubble = World.makeLabel(text, null, { fixed: 0.3, depthTest: false, bg: "rgba(255,240,200,.96)" });
    scene.add(playerBubble);
    playerBubbleT = 2.8;
  }

  $("btn-hello").onclick = () => {
    Snd.ensure();
    if (friends.size) { $("emotes").hidden = !$("emotes").hidden; return; }
    greetWalker();
  };
  function greetWalker() {
    player.waving = 1.6;
    showPlayerBubble("Hello! 👋");
    speak("Hello!", "en-GB", 0.9);
    const p = player.group.position;
    const w = World.nearestWalker(p.x, p.z, 24);
    if (!w) { setTimeout(() => toast("근처에 사람이 없어요. 조금 더 걸어 봐요"), 600); return; }
    setTimeout(() => {
      const gr = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      World.sayBubble(scene, w, gr.en);
      speak(gr.en, "en-GB", 0.9);
      toast(`“${gr.en}” = ${gr.ko}`, 3200);
    }, 1100);
  }

  // ---------- 화면 끌어서 둘러보기 ----------
  let drag = null;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    userYaw -= (e.clientX - drag.x) * 0.008;
    userPitch = Math.max(-0.35, Math.min(0.9, userPitch + (e.clientY - drag.y) * 0.005));
    drag.x = e.clientX; drag.y = e.clientY;
    lastDrag = elapsed;
  });
  const endDrag = () => { drag = null; };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);

  // ---------- 카메라 ----------
  const camPos = new T.Vector3(), camLook = new T.Vector3();
  const wantPos = new T.Vector3(), wantLook = new T.Vector3();
  let camInit = false;
  function updateCamera(dt) {
    const p = player.group.position;
    const heading = player.group.rotation.y;
    if (save.opt.autoView && elapsed - lastDrag > 3 && !drag) {
      userYaw *= Math.pow(0.25, dt);
      userPitch *= Math.pow(0.25, dt);
    }
    if (mode === "start") {
      // 캐릭터가 화면 위쪽(시작 카드 위)에 보이도록 아래를 내려다봐요
      wantPos.set(p.x + 2.4, p.y + 3.4, p.z + 12);
      wantLook.set(p.x + 0.6, p.y - 2.2, p.z + 3);
    } else if (mode === "bridge") {
      wantPos.set(988, 15, 52);
      wantLook.set(1060, 14, 86);
    } else if (mode === "finale") {
      // 건너온 타워 브리지를 뒤돌아봐요
      wantPos.set(p.x + 22, p.y + 12, p.z + 26);
      wantLook.set(1060, 18, 88);
    } else if (mode === "look" && lookTarget) {
      // 카메라는 길 위(조금 뒤쪽)에 두어야 길가 집에 가리지 않아요
      const dx = lookTarget.x - p.x, dz = lookTarget.z - p.z;
      const d = Math.hypot(dx, dz) || 1;
      const ux = dx / d, uz = dz / d;
      const q = World.posAt(Math.max(0, save.s - 13));
      wantPos.set(q.x - ux * 3, p.y + 5 + lookTarget.h * 0.1, q.z - uz * 3);
      const reach = Math.min(d * 0.6, 40);
      wantLook.set(p.x + ux * reach, lookTarget.h * 0.38, p.z + uz * reach);
    } else {
      const a = heading + Math.PI;
      wantPos.set(p.x + Math.sin(a) * 9.5, p.y + 4.8, p.z + Math.cos(a) * 9.5);
      wantLook.set(p.x + Math.sin(heading) * 4, p.y + 2.4, p.z + Math.cos(heading) * 4);
    }
    // 끌어서 돌린 만큼 캐릭터를 중심으로 돌려요
    if (mode !== "start" && mode !== "bridge" && (Math.abs(userYaw) > 0.001 || Math.abs(userPitch) > 0.001)) {
      const ox = wantPos.x - p.x, oz = wantPos.z - p.z;
      const c = Math.cos(userYaw), s = Math.sin(userYaw);
      wantPos.x = p.x + ox * c + oz * s;
      wantPos.z = p.z - ox * s + oz * c;
      wantPos.y += userPitch * 10;
      const lx = wantLook.x - p.x, lz = wantLook.z - p.z;
      wantLook.x = p.x + lx * c + lz * s;
      wantLook.z = p.z - lx * s + lz * c;
    }
    const k = camInit ? 1 - Math.pow(0.03, dt) : 1;
    camInit = true;
    camPos.lerp(wantPos, k);
    camLook.lerp(wantLook, k);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  // ---------- 매 장면 ----------
  let last = performance.now();
  let chunkTimer = 0, birdTimer = 4, stepPhase = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    stepWalk(dt);
    const p = World.posAt(save.s), t = World.tanAt(save.s);
    const y = World.onBridge(p.x, p.z) ? 0.3 : 0;
    const moving = walking && !busy;
    World.animateChibi(player, dt, moving, speedMode === "fast" ? 1.7 : 1);
    player.group.position.set(p.x, y + (player.bob || 0) * 1.15, p.z);
    if (mode !== "start") {
      const want = Math.atan2(t.x, t.z);
      let d = want - player.group.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      player.group.rotation.y += d * Math.min(1, dt * 8);
    }
    if (moving) {
      const prev = stepPhase;
      stepPhase = player.phase % Math.PI;
      if (stepPhase < prev) Snd.step();
    }
    World.update(elapsed, dt, save.s, p.x, p.z);
    chunkTimer -= dt;
    if (chunkTimer <= 0) { chunkTimer = 0.4; World.updateChunks(p.x, p.z); }
    if (playerBubble) {
      playerBubbleT -= dt;
      playerBubble.position.set(p.x, y + 4.4, p.z);
      if (playerBubbleT <= 0) { scene.remove(playerBubble); playerBubble = null; }
    }
    // 가끔 지나가는 사람이 먼저 인사해요
    if (moving) {
      nextGreet -= dt;
      if (nextGreet <= 0) {
        nextGreet = 35 + Math.random() * 30;
        const w = World.nearestWalker(p.x, p.z, 18);
        if (w) {
          const gr = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
          World.sayBubble(scene, w, gr.en);
          toast(`누군가 “${gr.en}” 하고 인사했어요 (${gr.ko}) · 👋로 인사해 봐요`, 3600);
        }
      }
      birdTimer -= dt;
      if (birdTimer <= 0) { birdTimer = 3 + Math.random() * 6; Snd.bird(); }
    }
    updateFriends(dt);
    if (Net.role !== "solo") Net.updateMe(save.s, walking && !busy, Object.keys(save.stamps).length);
    hudTimer -= dt;
    if (hudTimer <= 0 && mode !== "start") { hudTimer = 0.5; updateHud(); }
    updateCamera(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // 30초마다, 그리고 화면을 떠날 때 저장해요
  setInterval(store, 30000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { store(); setWalking(false); } });

  // ---------- 시작 ----------
  function boot() {
    World.init(scene);
    makePlayer();
    $("loading").hidden = true;
    showStart(false);
    requestAnimationFrame((t) => { last = t; frame(t); });
  }
  const fontWait = document.fonts && document.fonts.load ? Promise.race([document.fonts.load("44px Jua"), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  fontWait.then(boot, boot);
})();
