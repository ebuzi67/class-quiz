// 꼬마 발명가 마을: 화면, 움직이기, 대화, 소리, 선생님 패널
"use strict";

(() => {
  const T = Maps.T;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const SPEED = 125; // 걷는 빠르기(월드 픽셀/초)

  // ───────────────────────── 저장 ─────────────────────────
  const store = {
    get(k, d) { try { const v = localStorage.getItem("village-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("village-" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const settings = Object.assign({ music: true, voice: true }, store.get("settings", {}));
  let stamps = store.get("stamps", {});
  let progress = store.get("progress", {});
  let profile = store.get("profile", null);

  // ───────────────────────── 소리 ─────────────────────────
  const Sound = (() => {
    let ac = null, master = null, musicGain = null, timer = null, nextTime = 0, step = 0;
    const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const MELODY = [4, -1, 5, 4, 2, -1, 3, -1, 2, 1, 0, -1, 1, 2, -1, -1, 4, -1, 5, 6, 7, -1, 5, -1, 4, 3, 2, -1, 1, -1, 0, -1];
    const BASS = [130.81, 98.0, 110.0, 87.31];
    function ensure() {
      if (ac) { if (ac.state === "suspended") ac.resume(); return true; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.09; musicGain.connect(master);
      return true;
    }
    function tone(freq, t, dur, type = "sine", vol = 0.2, dest) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
    }
    function schedule() {
      const beat = 0.24;
      while (nextTime < ac.currentTime + 0.3) {
        const n = MELODY[step % MELODY.length];
        if (n >= 0) tone(NOTES[n] * 2, nextTime, 0.35, "triangle", 0.25, musicGain);
        if (step % 8 === 0) tone(BASS[(step / 8) % 4], nextTime, 1.6, "sine", 0.35, musicGain);
        if (step % 4 === 2) tone(BASS[Math.floor(step / 8) % 4] * 1.5, nextTime, 0.5, "sine", 0.12, musicGain);
        nextTime += beat; step++;
      }
    }
    function music(on) {
      if (!ensure()) return;
      clearInterval(timer); timer = null;
      if (on) { nextTime = ac.currentTime + 0.1; timer = setInterval(schedule, 100); }
    }
    function sfx(kind) {
      if (!ensure()) return;
      const t = ac.currentTime;
      if (kind === "tap") tone(660, t, 0.08, "sine", 0.15);
      else if (kind === "step") tone(420, t, 0.06, "triangle", 0.1);
      else if (kind === "bump") { tone(140, t, 0.2, "square", 0.08); tone(110, t + 0.08, 0.2, "square", 0.06); }
      else if (kind === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.3, "triangle", 0.2));
      else if (kind === "snap") { tone(1200, t, 0.05, "square", 0.1); tone(880, t + 0.04, 0.2, "triangle", 0.2); }
      else if (kind === "thud") tone(180, t, 0.25, "sine", 0.2);
      else if (kind === "door") { tone(392, t, 0.12, "triangle", 0.15); tone(523, t + 0.1, 0.15, "triangle", 0.15); }
      else if (kind === "pop") tone(880, t, 0.1, "sine", 0.15);
      else if (kind === "stamp") [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.08, 0.35, "triangle", 0.2));
    }
    return { ensure, music, sfx };
  })();

  let koVoice = null;
  function pickVoice() { try { koVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("ko")) || null; } catch (e) {} }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!settings.voice || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const clean = text.replace(/\p{Extended_Pictographic}|️|[▶▼⭕]/gu, "").trim();
      if (!clean) return;
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1.1;
      if (koVoice) u.voice = koVoice;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ───────────────────────── 화면 바꾸기 ─────────────────────────
  function show(id) { $$(".screen").forEach((s) => (s.hidden = s.id !== id)); }
  function toast(text, ms = 2200) {
    const t = $("#toast");
    t.textContent = text; t.hidden = false; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, ms);
  }
  const labelOf = (pf) => (pf.teacher ? "👑 선생님" : (pf.num ? pf.num + "번" : "") + (pf.name ? (pf.num ? " " : "") + pf.name : "") || "친구");

  // ───────────────────────── 들어가기 화면 ─────────────────────────
  let mode = "solo";
  let pendingCode = "";

  function startScreens() {
    const last = store.get("last", null);
    const quick = $("#btn-quick");
    if (last && profile && last.code && Date.now() - last.at < 12 * 3600e3) {
      quick.hidden = false;
      quick.querySelector("small").textContent = "코드 " + last.code + " · " + labelOf(profile);
    }
    show("screen-start");

    $("#btn-student").onclick = () => { Sound.ensure(); Sound.sfx("tap"); mode = "join"; openCode(); };
    $("#btn-teacher").onclick = () => { Sound.ensure(); Sound.sfx("tap"); startTeacher(); };
    $("#btn-solo").onclick = () => { Sound.ensure(); Sound.sfx("tap"); mode = "solo"; openNumber(); };
    quick.onclick = () => {
      Sound.ensure(); Sound.sfx("tap"); mode = "join";
      pendingCode = last.code; show("screen-code"); drawCode();
      tryConnect(() => enterGame());
    };
  }

  function openCode() {
    const last = store.get("last", null);
    pendingCode = "";
    show("screen-code");
    $("#code-msg").textContent = "선생님이 알려 준 숫자 4개를 눌러요";
    $("#code-msg").className = "msg";
    drawCode();
    if (last && last.code) $("#code-hint").textContent = "지난번 코드: " + last.code;
  }
  function drawCode() { $$("#code-boxes span").forEach((s, i) => { s.textContent = pendingCode[i] || ""; s.classList.toggle("on", i === pendingCode.length); }); }
  function buildPad() {
    const pad = $("#code-pad");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "↺"].forEach((k) => {
      const b = document.createElement("button");
      b.textContent = k; b.className = "pad-key" + (/\d/.test(k) ? "" : " soft");
      b.onclick = () => {
        Sound.sfx("tap");
        if (/\d/.test(k)) { if (pendingCode.length < 4) pendingCode += k; }
        else if (k === "⌫") pendingCode = pendingCode.slice(0, -1);
        else pendingCode = "";
        drawCode();
        if (pendingCode.length === 4) tryConnect(openNumber);
      };
      pad.append(b);
    });
    $("#code-back").onclick = () => { Net.leave(); show("screen-start"); };
  }

  function tryConnect(next) {
    const msg = $("#code-msg");
    msg.textContent = "🔌 선생님 방을 찾는 중…"; msg.className = "msg wait";
    Net.connect(pendingCode, (err) => {
      if (err) {
        msg.className = "msg bad";
        msg.textContent = err === "peer-unavailable" ? "😢 그런 방이 없어요. 숫자를 다시 확인해요." :
          err === "nolib" ? "😢 연결 도구를 불러오지 못했어요." : "😢 연결이 안 돼요. 선생님께 알려 주세요.";
        pendingCode = ""; drawCode();
        return;
      }
      store.set("last", { code: pendingCode, at: Date.now() });
      msg.className = "msg good"; msg.textContent = "✅ 연결됐어요!";
      setTimeout(next, 400);
    });
  }

  function openNumber() {
    show("screen-number");
    const grid = $("#num-grid");
    grid.innerHTML = "";
    let chosen = profile ? profile.num : 0;
    for (let i = 1; i <= 30; i++) {
      const b = document.createElement("button");
      b.textContent = i; b.className = "num" + (i === chosen ? " on" : "");
      b.onclick = () => { Sound.sfx("tap"); chosen = i; $$("#num-grid .num").forEach((n) => n.classList.toggle("on", +n.textContent === i)); $("#num-next").disabled = false; };
      grid.append(b);
    }
    $("#name-input").value = profile ? profile.name || "" : "";
    $("#num-next").disabled = !chosen;
    $("#num-next").onclick = () => {
      Sound.sfx("tap");
      profile = Object.assign({}, profile || { avatar: Avatar.randomConfig() }, { num: chosen, name: $("#name-input").value.trim().slice(0, 6), teacher: false });
      openAvatar();
    };
    $("#num-back").onclick = () => { Net.leave(); show("screen-start"); };
  }

  function openAvatar() {
    show("screen-avatar");
    const cfg = profile.avatar;
    const rows = [
      ["skin", "피부", Avatar.SKINS.map((c, i) => ({ v: i, swatch: c }))],
      ["hair", "머리 모양", Avatar.HAIRS.map((h) => ({ v: h, text: Avatar.HAIR_NAMES[h] }))],
      ["hairColor", "머리 색", Avatar.HAIR_COLORS.map((c, i) => ({ v: i, swatch: c }))],
      ["shirt", "옷 색", Avatar.SHIRTS.map((c, i) => ({ v: i, swatch: c }))],
      ["acc", "꾸미기", Avatar.ACCS.map((a) => ({ v: a, text: Avatar.ACC_NAMES[a] }))]
    ];
    const box = $("#avatar-options");
    box.innerHTML = "";
    rows.forEach(([key, title, opts]) => {
      const row = document.createElement("div"); row.className = "opt-row";
      const h = document.createElement("div"); h.className = "opt-title"; h.textContent = title; row.append(h);
      const list = document.createElement("div"); list.className = "opt-list";
      opts.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt" + (o.swatch ? " swatch" : "") + (cfg[key] === o.v ? " on" : "");
        if (o.swatch) b.style.background = o.swatch; else b.textContent = o.text;
        b.onclick = () => { Sound.sfx("tap"); cfg[key] = o.v; list.querySelectorAll(".opt").forEach((x) => x.classList.remove("on")); b.classList.add("on"); };
        list.append(b);
      });
      row.append(list); box.append(row);
    });
    $("#avatar-name").textContent = labelOf(profile);
    $("#avatar-random").onclick = () => { Sound.sfx("pop"); profile.avatar = Avatar.randomConfig(); openAvatar(); };
    $("#avatar-back").onclick = () => { Sound.sfx("tap"); openNumber(); };
    $("#avatar-go").onclick = () => { Sound.sfx("door"); store.set("profile", profile); enterGame(); };
    const pv = $("#avatar-preview");
    let t = 0;
    clearInterval(openAvatar.timer);
    openAvatar.timer = setInterval(() => {
      if ($("#screen-avatar").hidden) return clearInterval(openAvatar.timer);
      t++;
      const dirs = ["down", "right", "up", "left"];
      Avatar.drawPreview(pv, cfg, dirs[Math.floor(t / 8) % 4], [1, 0, 2, 0][t % 4]);
    }, 160);
  }

  function startTeacher() {
    mode = "host";
    const teacherLook = store.get("teacher-look", { skin: 1, hair: "short", hairColor: 0, shirt: "#4f7fe8", acc: "crown" });
    profile = { num: 0, name: "선생님", teacher: true, avatar: teacherLook };
    const last = store.get("host", null);
    const code = last && Date.now() - last.at < 12 * 3600e3 ? last.code : Net.newCode();
    enterGame();
    $("#teacher-code").textContent = "····";
    setStatus("🟡 방을 여는 중…");
    Net.host(code, profile, stamps, (err, realCode) => {
      if (err) {
        setStatus("🔴 방을 열지 못했어요");
        $("#teacher-code").textContent = "오류";
        $("#teacher-err").hidden = false;
        $("#teacher-err").textContent = err === "nolib" ? "연결 도구를 불러오지 못했어요." : "연결 서버(PeerJS)에 닿지 않아요. 학교 와이파이에서 막혀 있을 수 있어요. (" + err + ")";
        return;
      }
      store.set("host", { code: realCode, at: Date.now() });
      $("#teacher-code").textContent = realCode;
      $("#teacher-err").hidden = true;
      setStatus("🟢 방 열림 · 코드 " + realCode);
    });
  }

  // ───────────────────────── 게임 ─────────────────────────
  const scenes = Maps.buildAll();
  const bgs = {};
  const minis = {};
  let scene = null;
  const me = { x: 0, y: 0, dir: "down", moving: false, anim: 0, path: [], onArrive: null, emote: null, emoteUntil: 0 };
  const others = new Map();
  let zoom = 1;
  let frozen = false;
  let doorArmed = false;
  let talking = null;
  let running = false;

  const canvas = $("#game");
  const g = canvas.getContext("2d");
  const mini = $("#minimap");
  const mg = mini.getContext("2d");

  async function loadBackgrounds() {
    await Promise.all(Object.values(scenes).map(async (sc) => {
      bgs[sc.id] = await Maps.background(sc);
      const m = document.createElement("canvas");
      const s = 200 / (sc.w * T);
      m.width = 200; m.height = Math.round(sc.h * T * s);
      const mc = m.getContext("2d");
      mc.drawImage(bgs[sc.id], 0, 0, m.width, m.height);
      (sc.sprites || []).forEach((sp) => { if (sp.kind === "tree") { mc.fillStyle = "#3f8f3c"; mc.beginPath(); mc.arc(sp.x * s, (sp.y - 20) * s, 3.2, 0, 7); mc.fill(); } });
      minis[sc.id] = m;
    }));
  }

  function tileCenter(tx, ty) { return { x: (tx + 0.5) * T, y: (ty + 0.5) * T }; }
  function tileOf(x, y) { return { x: Math.floor(x / T), y: Math.floor(y / T) }; }
  function solidAt(tx, ty) { return !scene.solid[ty] || scene.solid[ty][tx] !== false; }

  function setScene(id, tx, ty, dir) {
    const fade = $("#fade");
    fade.classList.add("on");
    setTimeout(() => {
      scene = scenes[id];
      const c = tileCenter(tx, ty);
      me.x = c.x; me.y = c.y; me.dir = dir || "down"; me.path = []; me.onArrive = null; me.moving = false;
      doorArmed = false;
      $("#minimap-wrap").hidden = scene.indoor;
      toast((scene.id === "village" ? "🏡 " : "") + scene.name);
      fade.classList.remove("on");
      pushMe();
    }, 180);
  }

  // ── 길찾기(A*) ──
  function findPath(sx, sy, ex, ey) {
    if (solidAt(ex, ey)) return null;
    const W = scene.w, H = scene.h, key = (x, y) => y * W + x;
    const open = [[sx, sy]], came = new Map(), gs = new Map([[key(sx, sy), 0]]), fs = new Map([[key(sx, sy), 0]]);
    const h = (x, y) => Math.hypot(x - ex, y - ey);
    const closed = new Set();
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (fs.get(key(...open[i])) < fs.get(key(...open[bi]))) bi = i;
      const [cx, cy] = open.splice(bi, 1)[0];
      if (cx === ex && cy === ey) {
        const path = [[cx, cy]]; let k = key(cx, cy);
        while (came.has(k)) { const p = came.get(k); path.unshift(p); k = key(...p); }
        path.shift();
        return path;
      }
      closed.add(key(cx, cy));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || solidAt(nx, ny) || closed.has(key(nx, ny))) continue;
        if (dx && dy && (solidAt(cx + dx, cy) || solidAt(cx, cy + dy))) continue;
        const ng = gs.get(key(cx, cy)) + (dx && dy ? 1.414 : 1);
        if (ng < (gs.has(key(nx, ny)) ? gs.get(key(nx, ny)) : Infinity)) {
          came.set(key(nx, ny), [cx, cy]); gs.set(key(nx, ny), ng); fs.set(key(nx, ny), ng + h(nx, ny));
          if (!open.some(([a, b]) => a === nx && b === ny)) open.push([nx, ny]);
        }
      }
    }
    return null;
  }

  function nearestFree(tx, ty, from) {
    let best = null, bd = Infinity;
    for (let r = 0; r <= 4 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = tx + dx, y = ty + dy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || solidAt(x, y)) continue;
      const d = Math.hypot(x - from.x, y - from.y) + r * 3;
      if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }

  function walkTo(tx, ty, onArrive) {
    const s = tileOf(me.x, me.y);
    if (s.x === tx && s.y === ty) { me.path = []; me.onArrive = null; if (onArrive) onArrive(); return true; }
    const p = findPath(s.x, s.y, tx, ty);
    if (!p) return false;
    me.path = p; me.onArrive = onArrive || null;
    return true;
  }

  // 대상(NPC·활동 자리) 옆 빈칸으로 가요
  function walkNextTo(rect, onArrive) {
    const s = tileOf(me.x, me.y);
    const cands = [];
    for (let y = rect.y - 1; y <= rect.y + (rect.h || 1); y++) for (let x = rect.x - 1; x <= rect.x + (rect.w || 1); x++) {
      const inside = x >= rect.x && x < rect.x + (rect.w || 1) && y >= rect.y && y < rect.y + (rect.h || 1);
      if (inside || solidAt(x, y)) continue;
      const diag = (x < rect.x || x >= rect.x + (rect.w || 1)) && (y < rect.y || y >= rect.y + (rect.h || 1));
      if (diag) continue;
      cands.push({ x, y, d: Math.hypot(x - s.x, y - s.y) });
    }
    cands.sort((a, b) => a.d - b.d);
    for (const c of cands) if (walkTo(c.x, c.y, onArrive)) return true;
    return false;
  }

  function faceToward(tx, ty) {
    const dx = (tx + 0.5) * T - me.x, dy = (ty + 0.5) * T - me.y;
    me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  }

  // ── 누르기 ──
  function screenToWorld(cx, cy) {
    const v = view();
    return { x: v.x + cx / v.s, y: v.y + cy / v.s };
  }

  function handleTap(wx, wy) {
    if (frozen || talking || Activities.isOpen()) return;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    // NPC(그림이 위로 길어서 한 칸 위를 눌러도 돼요)
    const npc = scene.npcs.find((n) => n.x === tx && (n.y === ty || n.y - 1 === ty));
    if (npc) { Sound.sfx("tap"); walkNextTo({ x: npc.x, y: npc.y }, () => talk(npc)); return; }
    const st = scene.stations.find((s) => tx >= s.x && tx < s.x + s.w && ty >= s.y - 1 && ty < s.y + s.h);
    if (st) { Sound.sfx("tap"); walkNextTo(st, () => { faceToward(st.x, st.y); openActivity(st.activity); }); return; }
    const door = scene.doors.find((d) => ty === d.y && tx >= d.x && tx < d.x + (d.w || 1));
    if (door) { walkTo(tx, ty); return; }
    const b = (scene.buildings || []).find((b) => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
    if (b) { walkTo(b.door.x, b.door.y); return; }
    if (scene.garden && tx >= scene.garden.x && tx < scene.garden.x + scene.garden.w && ty >= scene.garden.y && ty < scene.garden.y + scene.garden.h) { walkTo(21, scene.garden.y); return; }
    let target = { x: tx, y: ty };
    if (solidAt(tx, ty)) target = nearestFree(tx, ty, tileOf(me.x, me.y));
    if (target && walkTo(target.x, target.y)) showTapMark(target);
  }

  let tapMark = null;
  function showTapMark(t) { tapMark = { x: (t.x + 0.5) * T, y: (t.y + 0.5) * T, at: performance.now() }; }

  // ── 문 ──
  function checkDoors() {
    const t = tileOf(me.x, me.y);
    const door = scene.doors.find((d) => t.y === d.y && t.x >= d.x && t.x < d.x + (d.w || 1));
    if (!door) { doorArmed = true; return; }
    if (!doorArmed) return;
    doorArmed = false;
    if (door.to === "village") {
      const b = scenes.village.buildings.find((x) => x.id === scene.id);
      Sound.sfx("door");
      setScene("village", b.door.x, b.door.y + 1, "down");
    } else if (door.to) {
      Sound.sfx("door");
      const target = scenes[door.to];
      setScene(door.to, target.spawn.x, target.spawn.y, target.spawn.dir);
    } else {
      Sound.sfx("bump");
      const text = door.emoji + " " + door.name + "은(는) 곧 열려요! 조금만 기다려 줘요.";
      toast(text, 2600); speak(door.name + "은 곧 열려요! 조금만 기다려 줘요.");
      me.path = []; me.onArrive = null;
      const back = scene.id === "village" && door.id === "garden" ? { x: t.x, y: t.y - 1 } : { x: t.x, y: t.y + 1 };
      if (!solidAt(back.x, back.y)) walkTo(back.x, back.y);
    }
  }

  // ── 대화 ──
  function talk(npc) {
    faceToward(npc.x, npc.y);
    const t = tileOf(me.x, me.y);
    const dx = t.x - npc.x, dy = t.y - npc.y;
    npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    talking = { npc, i: 0 };
    const box = $("#dialog");
    box.hidden = false;
    Avatar.drawFace($("#dlg-face"), npc.look);
    $("#dlg-name").textContent = npc.name;
    showLine();
  }
  function showLine() {
    const { npc, i } = talking;
    const text = npc.lines[i];
    const last = i === npc.lines.length - 1;
    const tEl = $("#dlg-text");
    tEl.textContent = "";
    let k = 0;
    clearInterval(showLine.timer);
    showLine.timer = setInterval(() => { k += 2; tEl.textContent = text.slice(0, k); if (k >= text.length) clearInterval(showLine.timer); }, 30);
    talking.full = () => { clearInterval(showLine.timer); tEl.textContent = text; };
    speak(text);
    const acts = $("#dlg-actions");
    acts.innerHTML = "";
    $("#dlg-next").hidden = last;
    if (last && npc.activity) {
      const go = document.createElement("button"); go.className = "btn btn-go"; go.textContent = npc.actionLabel || "해 보기 ▶";
      go.onclick = (e) => { e.stopPropagation(); Sound.sfx("tap"); endTalk(); openActivity(npc.activity); };
      const later = document.createElement("button"); later.className = "btn btn-soft"; later.textContent = "다음에 할래요";
      later.onclick = (e) => { e.stopPropagation(); Sound.sfx("tap"); endTalk(); };
      acts.append(go, later);
    }
  }
  function nextLine() {
    if (!talking) return;
    const tEl = $("#dlg-text"), text = talking.npc.lines[talking.i];
    if (tEl.textContent.length < text.length) { talking.full(); return; }
    if (talking.i < talking.npc.lines.length - 1) { talking.i++; Sound.sfx("tap"); showLine(); }
    else if (!talking.npc.activity) endTalk();
  }
  function endTalk() {
    if (!talking) return;
    clearInterval(showLine.timer);
    talking.npc.dir = "down";
    talking = null;
    $("#dialog").hidden = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  // ── 활동·도장 ──
  const STAMPS = [
    ["robot", "🤖", "로봇 공장", true], ["magnet", "🧲", "자석 실험실", true], ["greenhouse", "🌱", "관찰 온실", false],
    ["observatory", "🔭", "별 관측소", false], ["workshop", "🛠️", "발명 공방", false], ["garden", "🌻", "반복 정원", false]
  ];
  function openActivity(id) { me.path = []; me.moving = false; Activities.open(id); }
  function award(id) {
    if (stamps[id]) return;
    stamps[id] = true; store.set("stamps", stamps); Net.sendStamps(stamps);
    const s = STAMPS.find((x) => x[0] === id);
    setTimeout(() => {
      Sound.sfx("stamp");
      const pop = $("#stamp-pop");
      pop.querySelector(".big").textContent = s[1];
      pop.querySelector(".txt").textContent = s[2] + " 도장을 받았어요!";
      pop.hidden = false;
      speak(s[2] + " 도장을 받았어요!");
      setTimeout(() => { pop.hidden = true; }, 3000);
    }, 1200);
  }
  function openStampBook() {
    Sound.sfx("tap");
    const list = $("#stamp-list");
    list.innerHTML = "";
    STAMPS.forEach(([id, e, name, open]) => {
      const d = document.createElement("div");
      d.className = "stamp" + (stamps[id] ? " got" : "") + (open ? "" : " locked");
      let sub = stamps[id] ? "받았어요!" : open ? "아직 못 받았어요" : "곧 열려요";
      if (id === "robot" && !stamps[id] && progress.robot) sub = (progress.robot.cleared || 0) + " / " + Activities.LEVELS.length + "단계";
      d.innerHTML = "<div class='e'>" + e + "</div><b>" + name + "</b><small>" + sub + "</small>";
      list.append(d);
    });
    const n = STAMPS.filter(([id]) => stamps[id]).length;
    $("#stamp-count").textContent = "모은 도장 " + n + " / " + STAMPS.length;
    $("#stampbook").hidden = false;
  }

  // ── 인사(이모지) ──
  const EMOTES = [["👋", "안녕!"], ["🙋", "도와줘!"], ["🤝", "같이 하자!"], ["👍", "좋아!"], ["🎉", "성공했어!"], ["❤️", "고마워!"], ["😂", "하하!"], ["😮", "우와!"]];
  function buildEmotes() {
    const box = $("#emote-list");
    EMOTES.forEach(([e, text], i) => {
      const b = document.createElement("button");
      b.innerHTML = "<span>" + e + "</span>" + text;
      b.onclick = () => {
        Sound.sfx("pop");
        me.emote = i; me.emoteUntil = performance.now() + 4000;
        Net.emote(i);
        $("#emote-list").hidden = true;
      };
      box.append(b);
    });
    $("#btn-emote").onclick = () => { Sound.sfx("tap"); box.hidden = !box.hidden; };
  }

  // ── 다른 친구들 ──
  Net.on("roster", (list) => {
    const ids = new Set(list.map((p) => p.id));
    others.forEach((_, id) => { if (!ids.has(id)) others.delete(id); });
    list.forEach((p) => {
      if (p.id === Net.myId) return;
      const o = others.get(p.id) || { x: 0, y: 0, tx: 0, ty: 0, dir: "down", moving: false, anim: 0, scene: null, fresh: true };
      o.profile = p.profile;
      others.set(p.id, o);
    });
    updateCount();
  });
  Net.on("snap", (list) => {
    list.forEach(([id, sc, x, y, dir, moving]) => {
      const o = others.get(id);
      if (!o) return;
      if (o.fresh || o.scene !== sc || Math.hypot(x - o.x, y - o.y) > T * 4) { o.x = x; o.y = y; o.fresh = false; }
      o.scene = sc; o.tx = x; o.ty = y; o.dir = dir; o.moving = !!moving;
    });
  });
  Net.on("emote", (id, e) => { const o = others.get(id); if (o) { o.emote = +e; o.emoteUntil = performance.now() + 4000; } });
  Net.on("status", (s) => {
    if (s === "ok") setStatus("🟢 선생님과 연결됐어요");
    else if (s === "lost") setStatus("🟡 다시 연결하는 중…");
  });
  Net.on("cmd", (c) => {
    if (c === "gather") {
      Activities.close(); endTalk();
      frozenOff();
      const gp = scenes.village.gather;
      const spot = nearestFreeIn(scenes.village, gp.x + Math.round(Math.random() * 6 - 3), gp.y + Math.round(Math.random() * 3));
      setScene("village", spot.x, spot.y, "up");
      toast("📢 선생님이 광장으로 불렀어요!", 3000); speak("선생님이 광장으로 불렀어요!");
    } else if (c === "freeze") {
      frozen = true; me.path = []; me.moving = false; $("#freeze").hidden = false; speak("얼음! 선생님을 봐 주세요.");
    } else if (c === "unfreeze") frozenOff(true);
  });
  function frozenOff(say) { if (!frozen) return; frozen = false; $("#freeze").hidden = true; if (say) { toast("🌤️ 땡! 움직여도 돼요"); speak("땡! 움직여도 돼요"); } }
  function nearestFreeIn(sc, x, y) {
    for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = x + dx, b = y + dy; if (sc.solid[b] && sc.solid[b][a] === false) return { x: a, y: b }; }
    return sc.spawn;
  }
  Net.on("students", (list) => {
    const box = $("#student-list");
    box.innerHTML = "";
    $("#student-count").textContent = list.length;
    list.sort((a, b) => (a.profile.num || 99) - (b.profile.num || 99)).forEach((s) => {
      const row = document.createElement("div"); row.className = "stu";
      const face = document.createElement("canvas"); face.width = 32; face.height = 32;
      Avatar.drawFace(face, s.profile.avatar);
      const where = scenes[s.scene] ? scenes[s.scene].name : "";
      const got = STAMPS.filter(([id]) => s.stamps[id]).map((x) => x[1]).join("");
      const txt = document.createElement("div");
      txt.innerHTML = "<b>" + escapeHtml(labelOf(s.profile)) + "</b><small>" + where + (got ? " · " + got : "") + "</small>";
      row.append(face, txt); box.append(row);
    });
    if (!list.length) box.innerHTML = "<p class='empty'>아직 들어온 학생이 없어요.<br>학생들에게 위 숫자를 알려 주세요.</p>";
  });
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function setStatus(text) { $("#net-status").textContent = text; $("#net-status").hidden = false; }
  function updateCount() {
    if (Net.role === "join") { const n = others.size + 1; setStatus("🟢 선생님과 연결됨 · " + n + "명"); }
  }

  function pushMe() { if (scene) Net.updateMe({ scene: scene.id, x: me.x, y: me.y, dir: me.dir, moving: me.moving }); }

  // ───────────────────────── 시작 ─────────────────────────
  async function enterGame() {
    show("screen-game");
    if (mode === "join") Net.enter(profile, stamps, { scene: "village", x: 0, y: 0, dir: "down" });
    $("#teacher-panel").hidden = mode !== "host";
    $("#btn-teacher-panel").hidden = true;
    if (mode === "solo") setStatus("🙂 혼자 둘러보기");
    if (mode === "join") setStatus("🟡 연결하는 중…");
    resize();
    if (!Object.keys(bgs).length) await loadBackgrounds();
    const sp = scenes.village.spawn;
    const spot = nearestFreeIn(scenes.village, sp.x + Math.floor(Math.random() * 5) - 2, sp.y + Math.floor(Math.random() * 2));
    setScene("village", spot.x, spot.y, "down");
    if (settings.music) Sound.music(true);
    updateButtons();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }

  // ───────────────────────── 그리기 ─────────────────────────
  let cw = 0, ch = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }
  window.addEventListener("resize", resize);

  function baseScale() {
    if (!scene) return 2;
    if (scene.indoor) return Math.min(cw / (scene.w * T), ch / (scene.h * T)) * 0.97;
    return Math.max(1, Math.min(3, ch / (14 * T)));
  }
  function view() {
    const s = baseScale() * zoom;
    const vw = cw / s, vh = ch / s;
    const W = scene.w * T, H = scene.h * T;
    let x = me.x - vw / 2, y = me.y - T * 0.5 - vh / 2;
    x = W <= vw ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, x));
    y = H <= vh ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, y));
    return { x, y, s, vw, vh };
  }

  function drawChar(cfg, x, y, dir, frame) {
    const spr = Avatar.sprite(cfg, dir, frame);
    const s = 2;
    g.fillStyle = "rgba(0,0,0,.18)";
    g.beginPath(); g.ellipse(x, y + 10, 11, 4, 0, 0, 7); g.fill();
    g.drawImage(spr, Math.round(x - (Avatar.W * s) / 2), Math.round(y + 12 - 26 * s), Avatar.W * s, Avatar.H * s);
  }

  let last = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (scene) { update(dt, now); draw(now); }
    requestAnimationFrame(loop);
  }

  const keys = new Set();
  function update(dt, now) {
    // 키보드
    let kx = 0, ky = 0;
    if (!frozen && !talking && !Activities.isOpen()) {
      if (keys.has("ArrowLeft") || keys.has("a")) kx--;
      if (keys.has("ArrowRight") || keys.has("d")) kx++;
      if (keys.has("ArrowUp") || keys.has("w")) ky--;
      if (keys.has("ArrowDown") || keys.has("s")) ky++;
    }
    let moving = false;
    if (kx || ky) {
      me.path = []; me.onArrive = null;
      const len = Math.hypot(kx, ky), vx = (kx / len) * SPEED * dt, vy = (ky / len) * SPEED * dt;
      const free = (x, y) => [[-8, -4], [8, -4], [-8, 6], [8, 6]].every(([ox, oy]) => !solidAt(Math.floor((x + ox) / T), Math.floor((y + oy) / T)));
      if (free(me.x + vx, me.y)) me.x += vx;
      if (free(me.x, me.y + vy)) me.y += vy;
      me.dir = Math.abs(kx) >= Math.abs(ky) && kx ? (kx > 0 ? "right" : "left") : ky > 0 ? "down" : "up";
      moving = true;
    } else if (me.path.length && !frozen) {
      const [tx, ty] = me.path[0];
      const c = tileCenter(tx, ty);
      const dx = c.x - me.x, dy = c.y - me.y, d = Math.hypot(dx, dy), stepLen = SPEED * dt;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      if (d <= stepLen) { me.x = c.x; me.y = c.y; me.path.shift(); if (!me.path.length && me.onArrive) { const f = me.onArrive; me.onArrive = null; f(); } }
      else { me.x += (dx / d) * stepLen; me.y += (dy / d) * stepLen; }
      moving = true;
      if (me.path.length === 0) moving = false;
    }
    me.moving = moving;
    if (moving) me.anim += dt * 8;
    checkDoors();
    pushMe();
    // 다른 친구는 부드럽게 따라가요
    others.forEach((o) => {
      const k = Math.min(1, dt * 10);
      o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
      if (o.moving) o.anim += dt * 8;
    });
  }

  function walkFrame(anim, moving) { return moving ? [1, 0, 2, 0][Math.floor(anim) % 4] : 0; }

  function draw(now) {
    const v = view();
    const k = dpr * v.s;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = scene.indoor ? "#2a1712" : "#5e9e4a";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.imageSmoothingEnabled = false;
    g.setTransform(k, 0, 0, k, Math.round(-v.x * k), Math.round(-v.y * k));
    const bg = bgs[scene.id];
    g.drawImage(bg, 0, 0, scene.w * T, scene.h * T);

    // 누른 자리 표시
    if (tapMark && now - tapMark.at < 600 && me.path.length) {
      const a = 1 - (now - tapMark.at) / 600;
      g.strokeStyle = "rgba(255,255,255," + a + ")"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(tapMark.x, tapMark.y + 8, 12 + (1 - a) * 6, 5 + (1 - a) * 3, 0, 0, 7); g.stroke();
    }

    // 깊이 순서대로(아래쪽에 있을수록 나중에)
    const items = [];
    scene.sprites.forEach((sp) => items.push({ y: sp.y - 2, draw: () => { const img = Maps.tree(sp.v); g.drawImage(img, sp.x - 32, sp.y - 80); } }));
    scene.npcs.forEach((n) => items.push({ y: (n.y + 0.5) * T, draw: () => drawChar(n.look, (n.x + 0.5) * T, (n.y + 0.5) * T, n.dir, 0) }));
    others.forEach((o) => { if (o.scene === scene.id) items.push({ y: o.y, draw: () => drawChar(o.profile.avatar, o.x, o.y, o.dir, walkFrame(o.anim, o.moving)) }); });
    items.push({ y: me.y + 0.1, draw: () => drawChar(profile.avatar, me.x, me.y, me.dir, walkFrame(me.anim, me.moving)) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    // 글씨는 화면 크기 그대로 그려야 또렷해요
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = (wx) => (wx - v.x) * v.s, sy = (wy) => (wy - v.y) * v.s;
    const fs = Math.round(Math.max(12, Math.min(16, v.s * 6.5)));
    scene.labels.forEach((l) => tag(l.text, sx(l.x), sy(l.y), l.exit ? "exit" : l.locked ? "locked" : "place", fs));
    const myT = tileOf(me.x, me.y);
    scene.npcs.forEach((n) => {
      const cx = sx((n.x + 0.5) * T), top = sy((n.y + 0.5) * T - 46);
      tag(n.name, cx, top - 6, "npc", fs);
      if (Math.hypot(n.x - myT.x, n.y - myT.y) < 4 && !talking) bubble("💬", cx + 22, top - 18 + Math.sin(now / 250) * 3, fs + 4);
    });
    scene.stations.forEach((st) => {
      if (Math.hypot(st.x + st.w / 2 - myT.x, st.y - myT.y) < 4) bubble("👆", sx((st.x + st.w / 2) * T), sy(st.y * T) - 26 + Math.sin(now / 200) * 4, fs + 6);
    });
    others.forEach((o) => {
      if (o.scene !== scene.id) return;
      tag(labelOf(o.profile), sx(o.x), sy(o.y - 46) - 6, o.profile.teacher ? "teacher" : "friend", fs);
      if (o.emoteUntil > now) emoteBubble(o.emote, sx(o.x), sy(o.y - 46) - 30, fs);
    });
    tag(labelOf(profile), sx(me.x), sy(me.y - 46) - 6, profile.teacher ? "teacher" : "me", fs);
    if (me.emoteUntil > now) emoteBubble(me.emote, sx(me.x), sy(me.y - 46) - 30, fs);

    if (!scene.indoor) drawMini(v);
  }

  const TAGS = { place: ["#fff3d6", "#5e3820"], locked: ["rgba(255,243,214,.85)", "#8a7a6a"], exit: ["#fff3d6", "#c0392b"], npc: ["#ffe9a8", "#5e3820"], friend: ["rgba(255,255,255,.92)", "#333"], me: ["#5e3820", "#fff"], teacher: ["#ffcc33", "#5e3820"] };
  function tag(text, x, y, kind, fs) {
    const [bgc, fg] = TAGS[kind];
    g.font = "bold " + fs + "px Jua, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
    const w = g.measureText(text).width + 12, h = fs + 8;
    g.fillStyle = bgc; roundRect(x - w / 2, y - h, w, h, 6); g.fill();
    if (kind === "place" || kind === "exit" || kind === "npc") { g.strokeStyle = "#5e3820"; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, x, y - h / 2 + 1);
  }
  function bubble(text, x, y, fs) { g.font = fs + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y); }
  function emoteBubble(i, x, y, fs) {
    const e = EMOTES[i]; if (!e) return;
    const text = e[0] + " " + e[1];
    g.font = "bold " + (fs + 2) + "px Jua, 'Apple SD Gothic Neo', sans-serif";
    const w = g.measureText(text).width + 18, h = fs + 14;
    g.fillStyle = "#fff"; g.strokeStyle = "#5e3820"; g.lineWidth = 2;
    roundRect(x - w / 2, y - h, w, h, 10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 6, y - 1); g.lineTo(x, y + 7); g.lineTo(x + 6, y - 1); g.fill();
    g.fillStyle = "#333"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y - h / 2 + 1);
  }
  function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function drawMini(v) {
    const m = minis.village;
    if (mini.width !== m.width) { mini.width = m.width; mini.height = m.height; }
    mg.drawImage(m, 0, 0);
    const s = m.width / (scene.w * T);
    mg.strokeStyle = "rgba(255,255,255,.9)"; mg.lineWidth = 1.5;
    mg.strokeRect(v.x * s, v.y * s, v.vw * s, v.vh * s);
    scene.npcs.forEach((n) => { mg.fillStyle = "#ffcc33"; mg.fillRect((n.x + 0.5) * T * s - 2, (n.y + 0.5) * T * s - 2, 4, 4); });
    others.forEach((o) => { if (o.scene === "village") { mg.fillStyle = o.profile.teacher ? "#ff9f1a" : "#ffffff"; mg.beginPath(); mg.arc(o.x * s, o.y * s, 2.6, 0, 7); mg.fill(); } });
    mg.fillStyle = "#e8505b"; mg.strokeStyle = "#fff"; mg.beginPath(); mg.arc(me.x * s, me.y * s, 4, 0, 7); mg.fill(); mg.stroke();
  }

  // ───────────────────────── 입력 ─────────────────────────
  let down = null;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; $("#emote-list").hidden = true; });
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) { down = null; return; }
    down = null;
    if (talking) { nextLine(); return; }
    const r = canvas.getBoundingClientRect();
    const w = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    handleTap(w.x, w.y);
  });
  mini.addEventListener("click", (e) => {
    if (frozen || talking || Activities.isOpen()) return;
    const r = mini.getBoundingClientRect();
    const s = (scene.w * T) / r.width;
    const wx = (e.clientX - r.left) * s, wy = (e.clientY - r.top) * s;
    handleTap(wx, wy);
  });
  window.addEventListener("keydown", (e) => {
    if ($("#screen-game").hidden || e.target.tagName === "INPUT") return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) e.preventDefault();
    if (k === " " || k === "Enter") {
      if (talking) { nextLine(); e.preventDefault(); return; }
      if (Activities.isOpen()) return;
      const t = tileOf(me.x, me.y);
      const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[me.dir];
      const fx = t.x + d[0], fy = t.y + d[1];
      const npc = scene.npcs.find((n) => n.x === fx && n.y === fy);
      if (npc) { talk(npc); e.preventDefault(); return; }
      const st = scene.stations.find((s) => fx >= s.x && fx < s.x + s.w && fy >= s.y && fy < s.y + s.h);
      if (st) { openActivity(st.activity); e.preventDefault(); }
      return;
    }
    if (k === "Escape") { endTalk(); Activities.close(); $("#stampbook").hidden = true; }
    keys.add(k);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener("blur", () => keys.clear());

  $("#dialog").addEventListener("click", nextLine);
  $("#dlg-close").addEventListener("click", (e) => { e.stopPropagation(); Sound.sfx("tap"); endTalk(); });

  $("#btn-zoom-out").onclick = () => { Sound.sfx("tap"); zoom = Math.max(0.6, zoom / 1.2); };
  $("#btn-zoom-in").onclick = () => { Sound.sfx("tap"); zoom = Math.min(2.5, zoom * 1.2); };
  $("#btn-music").onclick = () => { settings.music = !settings.music; store.set("settings", settings); Sound.music(settings.music); updateButtons(); };
  $("#btn-voice").onclick = () => { settings.voice = !settings.voice; store.set("settings", settings); if (!settings.voice && "speechSynthesis" in window) speechSynthesis.cancel(); updateButtons(); Sound.sfx("tap"); };
  function updateButtons() {
    $("#btn-music").textContent = settings.music ? "♪ 음악 끄기" : "♪ 음악 켜기";
    $("#btn-voice").textContent = settings.voice ? "🔊" : "🔇";
    $("#btn-voice").title = settings.voice ? "읽어 주기 끄기" : "읽어 주기 켜기";
  }
  $("#btn-stamps").onclick = openStampBook;
  $("#stamp-close").onclick = () => { Sound.sfx("tap"); $("#stampbook").hidden = true; };

  // 선생님 패널
  $("#btn-teacher-panel").onclick = () => { Sound.sfx("tap"); $("#teacher-panel").hidden = false; $("#btn-teacher-panel").hidden = true; };
  $("#t-hide").onclick = () => { Sound.sfx("tap"); $("#teacher-panel").hidden = true; $("#btn-teacher-panel").hidden = false; };
  $("#t-gather").onclick = () => { Sound.sfx("tap"); Net.command("gather"); toast("📢 모두 광장으로 불렀어요"); };
  $("#t-freeze").onclick = () => {
    Sound.sfx("tap");
    const on = $("#t-freeze").dataset.on !== "1";
    Net.command(on ? "freeze" : "unfreeze");
    $("#t-freeze").dataset.on = on ? "1" : "0";
    $("#t-freeze").textContent = on ? "🌤️ 땡! (풀기)" : "❄️ 얼음!";
    toast(on ? "❄️ 모두 얼음!" : "🌤️ 땡!");
  };

  Activities.init($("#activity"), {
    speak, sfx: Sound.sfx, award,
    close: () => {},
    getProgress: (id) => progress[id],
    setProgress: (id, v) => { progress[id] = v; store.set("progress", progress); }
  });

  // 자동 시험용(화면에는 영향 없어요)
  window.__dbg = {
    scene: () => scene && scene.id,
    tap: (tx, ty) => handleTap((tx + 0.5) * T, (ty + 0.5) * T),
    toScreen: (tx, ty) => { const v = view(), r = canvas.getBoundingClientRect(); return { x: r.left + ((tx + 0.5) * T - v.x) * v.s, y: r.top + ((ty + 0.5) * T - v.y) * v.s }; }
  };

  buildPad();
  buildEmotes();
  if (Net.local) $("#local-note").hidden = false;
  startScreens();

  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
