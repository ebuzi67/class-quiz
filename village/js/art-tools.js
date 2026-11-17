// 🎨 미술관 도구: 그림판(데칼코마니), 픽셀 아트, 색 섞기, 우리 반 전시실
// 미술 방의 만들기 미션(q-art.js)과 전시실이 함께 써요. 그린 그림은 ctx.exhibit로 전시실에 걸어요.
"use strict";

const ArtTools = (() => {
  const PALETTE = ["#222222", "#e8423f", "#f5922b", "#f7d93a", "#9ad94a", "#3aa35b", "#7cc8f0", "#2f6fdf", "#8e4fc4", "#f59ac2", "#8b5a2b", "#ffffff"];
  const label = (p) => (!p ? "친구" : p.teacher ? "👑 선생님" : ((p.num ? p.num + "번 " : "") + (p.name || "")).trim() || "친구");

  // 색 고르기 줄: 색 동그라미들과 지우개
  function paletteRow(el, onPick, withEraser = true) {
    const row = el("div", "ar-palette");
    const btns = [];
    const choose = (b, c) => { btns.forEach((x) => x.classList.remove("on")); b.classList.add("on"); onPick(c); };
    PALETTE.forEach((c, i) => {
      const b = el("button", "ar-color" + (i === 1 ? " on" : ""));
      b.style.background = c; b.setAttribute("aria-label", "색");
      b.onclick = () => choose(b, c);
      row.append(b); btns.push(b);
    });
    if (withEraser) { const e = el("button", "ar-color ar-eraser", "🧽"); e.setAttribute("aria-label", "지우개"); e.onclick = () => choose(e, null); row.append(e); btns.push(e); }
    return row;
  }

  // 그림을 전시용 작은 그림 파일(데이터 주소)로 바꿔요. 너무 크면 더 작게 다시 만들어요.
  function toImage(canvas, size = 240) {
    for (const [s, type, q] of [[size, "image/webp", 0.82], [size, "image/jpeg", 0.75], [180, "image/jpeg", 0.65]]) {
      const c = document.createElement("canvas"); c.width = s; c.height = s;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, s, s); g.imageSmoothingEnabled = false;
      g.drawImage(canvas, 0, 0, s, s);
      const url = c.toDataURL(type, q);
      if (url.startsWith("data:" + type) && url.length < (Net.ART_MAX || 120000)) return url;
    }
    return null;
  }

  // ── 그림판: mirror가 true면 데칼코마니처럼 반대쪽에도 똑같이 그려져요 ──
  function drawPad(el, { mirror = false } = {}) {
    const W = 300;
    const node = el("div", "ar-pad");
    const wrap = el("div", "ar-canvas-wrap" + (mirror ? " mirror" : ""));
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = W; canvas.className = "ar-canvas";
    const g = canvas.getContext("2d");
    const clear = () => { g.fillStyle = "#fff"; g.fillRect(0, 0, W, W); strokes = 0; };
    let strokes = 0, color = PALETTE[1], width = 10, last = null;
    clear();
    wrap.append(canvas);
    const tools = el("div", "ar-tools");
    tools.append(paletteRow(el, (c) => { color = c; }));
    const sizes = el("div", "ar-sizes");
    [[5, "가늘게"], [10, "보통"], [20, "굵게"]].forEach(([w, t]) => {
      const b = el("button", "ar-size" + (w === 10 ? " on" : ""), "<i style='width:" + (w / 2 + 4) + "px;height:" + (w / 2 + 4) + "px'></i>" + t);
      b.onclick = () => { width = w; sizes.querySelectorAll(".ar-size").forEach((x) => x.classList.remove("on")); b.classList.add("on"); };
      sizes.append(b);
    });
    const wipe = el("button", "btn btn-soft", "🗑️ 다 지우기");
    wipe.onclick = clear;
    sizes.append(wipe);
    tools.append(sizes);
    node.append(wrap, tools);

    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * W / r.height }; };
    const line = (a, b) => {
      g.strokeStyle = color || "#fff"; g.lineWidth = color ? width : width * 2; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      if (mirror) { g.beginPath(); g.moveTo(W - a.x, a.y); g.lineTo(W - b.x, b.y); g.stroke(); }
    };
    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); last = pos(e); line(last, last); strokes++; });
    canvas.addEventListener("pointermove", (e) => { if (!last) return; const p = pos(e); line(last, p); last = p; });
    const up = () => { last = null; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    return { node, canvas, image: () => toImage(canvas), get strokes() { return strokes; } };
  }

  // ── 픽셀 아트: n×n 칸에 색을 칠해요(끌면서 칠하기도 돼요) ──
  function pixelPad(el, { n = 16 } = {}) {
    const C = 20, W = n * C;
    const cells = Array.from({ length: n * n }, () => null);
    const node = el("div", "ar-pad");
    const wrap = el("div", "ar-canvas-wrap");
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = W; canvas.className = "ar-canvas";
    const g = canvas.getContext("2d");
    let color = PALETTE[1], painting = false;
    const draw = () => {
      g.fillStyle = "#fff"; g.fillRect(0, 0, W, W);
      cells.forEach((c, i) => { if (c) { g.fillStyle = c; g.fillRect((i % n) * C, Math.floor(i / n) * C, C, C); } });
      g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 1;
      for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * C + 0.5, 0); g.lineTo(k * C + 0.5, W); g.stroke(); g.beginPath(); g.moveTo(0, k * C + 0.5); g.lineTo(W, k * C + 0.5); g.stroke(); }
    };
    draw();
    wrap.append(canvas);
    const tools = el("div", "ar-tools");
    tools.append(paletteRow(el, (c) => { color = c; }));
    const row = el("div", "ar-sizes");
    const wipe = el("button", "btn btn-soft", "🗑️ 다 지우기");
    wipe.onclick = () => { cells.fill(null); draw(); };
    row.append(wipe);
    tools.append(row);
    node.append(wrap, tools);
    const paint = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / r.width * n), y = Math.floor((e.clientY - r.top) / r.height * n);
      if (x < 0 || y < 0 || x >= n || y >= n) return;
      if (cells[y * n + x] !== color) { cells[y * n + x] = color; draw(); }
    };
    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); painting = true; paint(e); });
    canvas.addEventListener("pointermove", (e) => { if (painting) paint(e); });
    const up = () => { painting = false; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    // 전시용 그림은 칸 선 없이 만들어요
    const image = () => {
      const c = document.createElement("canvas"); c.width = n; c.height = n;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, n, n);
      cells.forEach((col, i) => { if (col) { x.fillStyle = col; x.fillRect(i % n, Math.floor(i / n), 1, 1); } });
      return toImage(c, 192);
    };
    return { node, canvas, image, get filled() { return cells.filter(Boolean).length; } };
  }

  // ── 색 섞기: 물감을 몇 방울씩 섞어 목표 색을 만들어요 ──
  // 물감 섞기는 빛과 달라서, 섞을수록 어두워지는 계산(색마다 곱해서 평균)을 써요.
  const POTS = [["빨강", [230, 40, 40]], ["노랑", [250, 222, 40]], ["파랑", [40, 80, 205]], ["하양", [255, 255, 255]], ["검정", [30, 30, 30]]];
  const TARGETS = [
    ["주황", [1, 1, 0, 0, 0]], ["초록", [0, 1, 1, 0, 0]], ["보라", [1, 0, 1, 0, 0]], ["분홍", [1, 0, 0, 2, 0]], ["하늘색", [0, 0, 1, 2, 0]],
    ["연두", [0, 2, 1, 1, 0]], ["다홍", [2, 1, 0, 0, 0]], ["갈색", [2, 1, 1, 0, 0]], ["회색", [0, 0, 0, 3, 1]], ["살구색", [1, 1, 0, 3, 0]], ["남색", [0, 0, 2, 0, 1]], ["연보라", [1, 0, 1, 3, 0]]
  ];
  function mixColor(counts) {
    const tot = counts.reduce((a, b) => a + b, 0);
    if (!tot) return null;
    return [0, 1, 2].map((ch) => Math.round(Math.exp(counts.reduce((s, c, i) => s + c * Math.log(POTS[i][1][ch]), 0) / tot)));
  }
  const css = (rgb) => (rgb ? "rgb(" + rgb.join(",") + ")" : "transparent");
  const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  // 실험 3번을 성공하면 onSolved를 불러요
  function mixer(el, ctx, onSolved) {
    const GOAL = 3;
    const order = TARGETS.slice().sort(() => Math.random() - 0.5);
    let k = 0, counts = [0, 0, 0, 0, 0], solved = 0;
    const node = el("div", "ar-mixer");
    const head = el("div", "mg-q");
    const row = el("div", "ar-mix-row");
    const target = el("div", "ar-blob"), mine = el("div", "ar-blob ar-mine");
    const meter = el("div", "ar-meter", "<i></i>");
    row.append(el("div", "ar-blob-box", "<b>만들 색</b>"), el("div", "ar-blob-box", "<b>내 물감</b>"));
    row.children[0].append(target); row.children[1].append(mine);
    const pots = el("div", "ar-pots");
    const drops = el("div", "ar-drops");
    const msg = el("div", "mg-why");
    const ctrl = el("div", "rb-controls");
    const reset = el("button", "btn btn-soft", "🔄 처음부터 섞기");
    const skip = el("button", "btn btn-soft", "⏭️ 다른 색");
    ctrl.append(reset, skip);
    node.append(head, row, meter, pots, drops, msg, ctrl);
    POTS.forEach(([name, rgb], i) => {
      const b = el("button", "ar-pot", "<span style='background:" + css(rgb) + "'></span>" + name);
      b.onclick = () => { if (counts.reduce((a, c) => a + c, 0) >= 12) { msg.textContent = "물감이 너무 많아요. 처음부터 섞어 볼까요?"; return; } counts[i]++; ctx.sfx("pop"); update(); };
      pots.append(b);
    });
    function show() {
      const [name, recipe] = order[k % order.length];
      counts = [0, 0, 0, 0, 0];
      target.style.background = css(mixColor(recipe));
      head.textContent = "🎯 " + name + " 만들기 (" + (solved + 1) + " / " + GOAL + ")";
      msg.textContent = "물감 통을 눌러 한 방울씩 넣어 봐요.";
      ctx.speak(name + "을 만들어 볼까요? 물감을 한 방울씩 넣어 봐요.");
      update();
    }
    function update() {
      const mix = mixColor(counts), goal = mixColor(order[k % order.length][1]);
      mine.style.background = css(mix);
      mine.classList.toggle("empty", !mix);
      drops.innerHTML = counts.map((c, i) => (c ? "<span><i style='background:" + css(POTS[i][1]) + "'></i>×" + c + "</span>" : "")).join("");
      const score = mix ? Math.max(0, Math.round(100 - dist(mix, goal) / 2.2)) : 0;
      meter.firstChild.style.width = score + "%";
      meter.dataset.score = mix ? "비슷한 정도 " + score + "%" : "";
      if (mix && dist(mix, goal) < 20) {
        solved++; ctx.sfx("win");
        const [name, recipe] = order[k % order.length];
        const how = recipe.map((c, i) => (c ? POTS[i][0] + " " + c : "")).filter(Boolean).join(" + ");
        msg.textContent = "🎉 " + name + " 완성! (" + how + ")";
        ctx.speak(name + " 완성!");
        k++;
        if (solved >= GOAL) { head.textContent = "🎉 색 섞기 실험 성공!"; pots.querySelectorAll("button").forEach((b) => (b.disabled = true)); onSolved(); return; }
        setTimeout(show, 1600);
      }
    }
    reset.onclick = () => { counts = [0, 0, 0, 0, 0]; ctx.sfx("tap"); update(); msg.textContent = "다시 섞어 봐요."; };
    skip.onclick = () => { k++; ctx.sfx("tap"); show(); };
    show();
    return { node };
  }

  // ── 전시하기 버튼: 누르면 그림을 전시실에 걸어요. title은 제목 글자나 제목을 돌려주는 함수예요 ──
  function exhibitButton(el, ctx, getImage, title, after) {
    const b = el("button", "btn btn-go", "🖼️ 전시실에 걸기");
    b.onclick = () => {
      const img = getImage();
      if (!img) { ctx.speak("그림을 먼저 그려 봐요."); return; }
      const ok = ctx.exhibit(img, typeof title === "function" ? title() : title);
      if (ok) { b.disabled = true; b.textContent = "✅ 전시실에 걸었어요"; ctx.sfx("stamp"); ctx.speak("전시실에 걸었어요! 미술관 전시실에서 볼 수 있어요."); if (after) after(); }
      else ctx.speak("선생님과 연결이 끊겨서 걸지 못했어요. 잠시 뒤에 다시 해 봐요.");
    };
    return b;
  }

  // ── 🏛️ 우리 반 전시실 ──
  function gallery({ el, frame, ctx }) {
    const root = frame("🏛️ 우리 반 전시실");
    const top = el("div", "rb-controls ar-gallery-top");
    const drawBtn = el("button", "btn btn-go", "✏️ 그림 그려서 걸기");
    top.append(drawBtn);
    let clearBtn = null;
    if (ctx.isTeacher()) { clearBtn = el("button", "btn btn-soft", "🧹 모두 내리기"); top.append(clearBtn); }
    const note = el("div", "ob-note");
    const wall = el("div", "ar-wall");
    root.append(top, note, wall);
    function render(list) {
      wall.innerHTML = "";
      note.textContent = list.length ? "걸린 그림 " + list.length + "개 · " + (ctx.isTeacher() ? "그림의 ✕를 누르면 내려요" : "친구들 그림을 구경해요") : "";
      if (!list.length) wall.append(el("p", "empty", "아직 걸린 그림이 없어요.<br>미술 방의 만들기 미션이나 위 ✏️ 버튼으로 그림을 걸어 봐요."));
      list.slice().reverse().forEach((item) => {
        const f = el("figure", "ar-frame");
        const img = el("img"); img.src = item.img; img.alt = item.title || "그림";
        f.append(img, el("figcaption", "", "<b></b><small></small>"));
        f.querySelector("b").textContent = item.title || "제목 없음";
        f.querySelector("small").textContent = label(item.by);
        if (ctx.isTeacher()) { const x = el("button", "ar-down", "✕"); x.setAttribute("aria-label", "내리기"); x.onclick = () => { ctx.sfx("tap"); ctx.unexhibit(item.id); }; f.append(x); }
        wall.append(f);
      });
      return true;
    }
    render(ctx.gallery());
    ctx.onGallery((list) => (root.isConnected ? render(list) : false));
    if (clearBtn) clearBtn.onclick = () => { ctx.sfx("tap"); ctx.clearGallery(); };
    drawBtn.onclick = () => {
      ctx.sfx("tap");
      root.innerHTML = "";
      const pad = drawPad(el);
      const t = el("input", "ar-title"); t.maxLength = 12; t.placeholder = "그림 제목 (안 써도 돼요)";
      const row = el("div", "rb-controls");
      const back = el("button", "btn btn-soft", "◀ 전시실로");
      back.onclick = () => { ctx.sfx("tap"); gallery({ el, frame, ctx }); };
      row.append(back, exhibitButton(el, ctx, () => (pad.strokes ? pad.image() : null), () => t.value.trim(), () => setTimeout(() => gallery({ el, frame, ctx }), 900)));
      root.append(el("div", "mg-q", "✏️ 자유롭게 그려서 전시실에 걸어요"), pad.node, t, row);
    };
    ctx.speak("우리 반 전시실이에요. 친구들 그림을 구경해 봐요.");
  }
  return { PALETTE, drawPad, pixelPad, mixer, exhibitButton, gallery, label };
})();
