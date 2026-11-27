// 모모의 코딩 하루 — 앱 시작점. 3D 방, 캐릭터, 뇌, 화면(UI), 코딩 모드를 연결해요.
import './style.css';
import * as THREE from 'three';
import { character as characterCfg } from './config/character.js';
import { furniture as furnitureCfg } from './config/furniture.js';
import { products as productsCfg } from './config/products.js';
import { actions as actionsCfg } from './config/actions.js';
import { missions as missionsCfg } from './config/missions.js';
import { validateConfig } from './engine/validate.js';
import { World } from './engine/world.js';
import { Character } from './engine/character.js';
import { Particles } from './engine/particles.js';
import { Brain, Canceled } from './engine/brain.js';
import { CameraRig } from './engine/cameraRig.js';
import { Sound } from './engine/sound.js';
import { PetBuddy } from './engine/petBuddy.js';
import { createState, GAUGES } from './engine/state.js';
import { EXPRESSION_NAMES } from './engine/names.js';
import { BlockEditor } from './blocks/editor.js';
import { RunController } from './blocks/runController.js';
import { StopRun } from './blocks/interpreter.js';
import { emptyProgram, sanitizeProgram, encodeProgram, decodeProgram, toCode } from './blocks/program.js';
import { MissionBoard } from './ui/missionsUI.js';
import { $, toast, openModal, closeModal, modalOpen, store, el } from './ui/dom.js';

const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedMQ.matches;

function fail(message, detail) {
  console.error(message, detail || '');
  const box = $('#loading');
  box.classList.remove('gone');
  box.setAttribute('aria-busy', 'false');
  box.replaceChildren(el('div', { class: 'err-box' },
    el('h2', { text: '😢 방을 열 수 없어요' }),
    el('p', { text: message }),
    el('p', { class: 'muted', text: '다른 브라우저(크롬, 엣지, 사파리 최신 버전)로 열어 보거나, 기기를 다시 켜 보세요.' }),
    el('button', { class: 'btn', type: 'button', text: '🔄 다시 시도', onclick: () => location.reload() })));
}

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

// 오류가 나도 앱이 멈추지 않게, 친절하게 알려 줘요
let lastErrToast = 0;
const isQuiet = (e) => e instanceof Canceled || e instanceof StopRun || e?.name === 'AbortError';
window.addEventListener('error', (e) => {
  if (Date.now() - lastErrToast > 10000) { lastErrToast = Date.now(); toast('앗! 작은 문제가 생겼어요. 이상하면 새로고침해 주세요.', 'err'); }
  console.error(e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  if (isQuiet(e.reason)) { e.preventDefault(); return; }
  console.error(e.reason);
});

function boot() {
  if (!webglOK()) return fail('이 기기나 브라우저는 3D 그래픽(WebGL)을 쓸 수 없어요.');
  const cfg = validateConfig({ furniture: furnitureCfg, products: productsCfg, actions: actionsCfg });
  if (cfg.warnings.length) console.warn('설정 파일에서 고칠 곳:\n' + cfg.warnings.join('\n'));
  const actions = cfg.actions;
  const actionById = new Map(actions.map((a) => [a.id, a]));
  const furnById = new Map(cfg.furniture.map((f) => [f.id, f]));
  const prodById = new Map(cfg.products.map((p) => [p.id, p]));
  const charName = characterCfg.name || '모모';
  document.title = `${charName}의 코딩 하루`;
  $('#title-text').textContent = document.title;

  // ── 3D 준비 ──
  const canvas = $('#scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return fail('3D 화면을 만들지 못했어요.', err);
  }
  let pixelCap = 1.75;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('3D 화면이 잠깐 멈췄어요. 새로고침해 주세요.', 'err', 8000); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 80);
  const rig = new CameraRig(camera, canvas, { reducedMotion: reduced });
  const world = new World(scene, { furniture: cfg.furniture, products: cfg.products });
  const char = new Character(characterCfg, { reducedMotion: reduced });
  scene.add(char.root);
  const startSpot = world.spot('rug') || [0, 1];
  char.root.position.set(startSpot[0], 0, startSpot[1] + 0.4);
  char.heading = 0.6;
  char.prevPos.copy(char.root.position);
  // 반려동물 화면에서 고른 친구가 방에 놀러 와요 (없으면 보이지 않아요)
  let buddy = null;
  try { buddy = new PetBuddy(scene, world); } catch (err) { console.warn('반려동물을 불러오지 못했어요', err); }
  world.buddy = buddy;
  const particles = new Particles(scene, { reducedMotion: reduced });
  char.onEmit = (type, pos, n) => particles.burst(type, pos, n);
  const sound = new Sound();
  const state = createState();

  // ── 화면 위쪽 게이지 ──
  const gaugeEls = {};
  for (const g of GAUGES) {
    const fill = el('div', { class: 'fill' });
    const num = el('span', { class: 'num', text: '0' });
    const box = el('div', { class: 'gauge', 'data-id': g.id, role: 'meter', 'aria-label': g.name, 'aria-valuemin': 0, 'aria-valuemax': 100, title: g.name },
      el('span', { 'aria-hidden': 'true', text: g.emoji }), el('span', { class: 'name', text: g.name }), el('div', { class: 'bar' }, fill), num);
    $('#gauges').append(box);
    gaugeEls[g.id] = { box, fill, num, last: null };
  }
  const drawGauges = () => {
    for (const g of GAUGES) {
      const v = Math.round(state.values[g.id]);
      const e = gaugeEls[g.id];
      if (e.last === v) continue;
      if (e.last != null && Math.abs(v - e.last) >= 5 && !reduced) { e.box.classList.remove('bump'); void e.box.offsetWidth; e.box.classList.add('bump'); }
      e.last = v;
      e.fill.style.width = v + '%';
      e.num.textContent = v;
      e.box.setAttribute('aria-valuenow', v);
    }
  };
  drawGauges();

  // ── 말풍선, 상태 문구, 할 일 줄 ──
  const bubble = $('#bubble');
  let bubbleUntil = 0;
  let simTime = 0;
  const say = (text, sec = 2) => {
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    bubbleUntil = simTime + sec;
  };
  const statusEl = $('#status');
  let lastStatus = '';
  const setStatus = (text, kind) => {
    if (text === lastStatus) return;
    lastStatus = text;
    statusEl.textContent = text;
    statusEl.className = `status ${kind || ''}`;
  };
  const drawQueue = (queue) => {
    const q = $('#queue');
    q.replaceChildren(...queue.slice(0, 4).map((r) => el('li', { class: r.source === 'program' ? 'program' : '', text: `다음: ${r.action.emoji} ${r.action.name}` })));
  };

  const clicks = [];
  let missions;
  const brain = new Brain({
    world, char, actions, state, particles, sound,
    getCameraPos: () => camera.position,
    hooks: {
      onStatus: setStatus,
      onSay: say,
      onQueue: drawQueue,
      onWarn: (t) => toast(t, 'warn'),
      onPetReward: (r) => {
        if (r.gained) toast(`🐾 ${buddy.info.name}의 친밀도 +1, 경험치 +3`, 'ok', 2200);
        if (r.grew) toast(`🎉 ${buddy.info.name}가 한 단계 자랐어요!`, 'ok', 3500);
      },
      onAction: (a, source, phase) => {
        if (phase === 'done' && source === 'click') { clicks.push(a.id); missions?.check(); }
      },
    },
  });

  // ── 고르기(클릭)와 행동 메뉴 ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickTargets = [char.root, ...world.pickables, ...(buddy ? [buddy.group] : [])];
  const pickAt = (x, y) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickTargets, true).filter((h) => h.object.visible);
    // 진짜 모양을 먼저 써요. 단, 진짜 모양이 앞 가구의 누르기 영역보다 한참 뒤에 있으면(빈틈으로 뒤가 보일 때) 앞 가구를 골라요
    const real = hits.find((h) => !h.object.userData.proxy);
    const proxy = hits.find((h) => h.object.userData.proxy);
    const ordered = [];
    if (real && proxy && real.distance - proxy.distance > 0.5) ordered.push(proxy);
    ordered.push(...hits.filter((h) => !h.object.userData.proxy), ...hits.filter((h) => h.object.userData.proxy));
    for (const h of ordered) {
      let o = h.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) return { ...o.userData.pick, obj: o };
    }
    return null;
  };
  const objOf = (kind, id) => (kind === 'character' ? char.root : kind === 'buddy' ? buddy?.group : kind === 'product' ? world.products.get(id)?.mesh : world.furniture.get(id)?.group);
  const nameOf = (kind, id) => (kind === 'character' ? { name: charName, emoji: '🙋' } : kind === 'buddy' ? { name: `${buddy.info.name} (${buddy.info.species})`, emoji: buddy.info.emoji } : kind === 'product' ? prodById.get(id) : furnById.get(id));

  const menu = $('#menu');
  let selected = null;
  let hovered = null;
  const actionsFor = (kind, id) => {
    if (kind === 'character') return actions.filter((a) => !a.target);
    if (kind === 'buddy') return actions.filter((a) => a.target === 'pet');
    if (kind === 'product') return actions.filter((a) => a.product === id);
    return actions.filter((a) => a.target === id || (a.pickup && prodById.get(a.product)?.home === id));
  };
  const placeMenu = (kind, id) => {
    const mobile = innerWidth <= 760;
    menu.style.visibility = 'hidden';
    menu.hidden = false;
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    let x, y;
    if (mobile) {
      x = (innerWidth - mw) / 2;
      y = innerHeight - mh - 150;
    } else {
      const p = kind === 'character' ? char.headTop() : kind === 'buddy' ? buddy.top() : world.anchor(kind, id) || new THREE.Vector3();
      p.project(camera);
      const r = canvas.getBoundingClientRect();
      const sx = r.left + ((p.x + 1) / 2) * r.width, sy = r.top + ((1 - p.y) / 2) * r.height;
      x = sx + 24; y = sy - mh / 2;
      const rightLimit = (document.body.classList.contains('panel-open') ? innerWidth - $('#panel').offsetWidth : innerWidth) - 96;
      if (x + mw > rightLimit) x = sx - mw - 24;
    }
    menu.style.left = Math.max(12, Math.min(innerWidth - mw - 12, x)) + 'px';
    menu.style.top = Math.max(70, Math.min(innerHeight - mh - 12, y)) + 'px';
    menu.style.visibility = '';
  };
  const closeMenu = (restoreFocus = false) => {
    if (selected) { world.highlight(objOf(selected.kind, selected.id), 0); world.showRing(null); }
    const had = !menu.hidden;
    selected = null;
    menu.hidden = true;
    if (had && restoreFocus) canvas.focus();
  };
  const openMenu = (kind, id) => {
    closeMenu();
    selected = { kind, id };
    const info = nameOf(kind, id);
    const obj = objOf(kind, id);
    world.highlight(obj, 2);
    if (kind === 'furniture') {
      const f = furnById.get(id);
      world.showRing(new THREE.Vector3(f.pos[0], 0, f.pos[1]), f.type === 'rug' ? 1.3 : 0.75);
    } else if (kind === 'character') world.showRing(char.position, 0.4);
    else if (kind === 'buddy') world.showRing(buddy.position, 0.35);
    const list = actionsFor(kind, id);
    const busy = brain.current && brain.current.phase === 'do';
    // replaceChildren 은 null 을 "null" 글자로 넣어서, 빈 칸은 걸러 내요
    menu.replaceChildren(...[
      el('div', { class: 'menu-head' },
        el('h2', { id: 'menu-title', text: `${info?.emoji || ''} ${info?.name || id}` }),
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': '메뉴 닫기', text: '✕', onclick: () => closeMenu(true) })),
      list.length
        ? el('ul', {}, list.map((a) => el('li', {}, el('button', { type: 'button', 'data-action': a.id, onclick: () => choose(a) },
          el('span', { class: 'em', 'aria-hidden': 'true', text: a.emoji }), a.name, el('small', { text: `${a.duration}초` })))))
        : el('p', { class: 'note', text: '여기서 할 수 있는 행동이 아직 없어요. actions.js에 추가해 보세요!' }),
      busy ? el('p', { class: 'note', text: `⏳ ${charName}가 지금 하는 행동을 마치고 갈게요.` }) : null,
      kind === 'buddy' ? el('a', { class: 'item pet-link', href: 'pet.html#pet' }, el('span', { class: 'em', 'aria-hidden': 'true', text: '🏠' }), '반려동물 화면에서 돌보기·꾸미기') : null,
    ].filter(Boolean));
    placeMenu(kind, id);
    menu.querySelector('[data-action]')?.focus({ preventScroll: true });
    sound.play('pop');
  };
  const choose = (a) => {
    closeMenu();
    sound.play('click');
    brain.request(a.id, 'click').then((r) => {
      if (r === 'duplicate') toast(`이미 "${a.name}"을(를) 부탁했어요.`, 'warn');
      if (r === 'full') toast('부탁이 너무 많아요. 조금 기다려 주세요.', 'warn');
    }).catch(() => {});
    toast(`${a.emoji} ${a.name} — 부탁했어요!`, 'ok', 1800);
    canvas.focus({ preventScroll: true });
  };
  const thingsMenu = () => {
    closeMenu();
    menu.replaceChildren(
      el('div', { class: 'menu-head' }, el('h2', { id: 'menu-title', text: '📋 물건 목록' }),
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': '메뉴 닫기', text: '✕', onclick: () => closeMenu(true) })),
      el('ul', {}, [
        el('li', {}, el('button', { type: 'button', onclick: () => openMenu('character', 'character') }, el('span', { class: 'em', text: '🙋' }), charName)),
        buddy?.active ? el('li', {}, el('button', { type: 'button', onclick: () => openMenu('buddy', 'pet') }, el('span', { class: 'em', text: buddy.info.emoji }), `${buddy.info.name} (반려동물)`)) : null,
        ...cfg.furniture.map((f) => el('li', {}, el('button', { type: 'button', onclick: () => openMenu('furniture', f.id) }, el('span', { class: 'em', text: f.emoji }), f.name))),
      ]),
    );
    menu.hidden = false;
    menu.style.left = Math.max(12, innerWidth - menu.offsetWidth - (innerWidth <= 760 ? (innerWidth - menu.offsetWidth) / 2 : 100)) + 'px';
    menu.style.top = Math.max(70, (innerHeight - menu.offsetHeight) / 2) + 'px';
    menu.querySelector('button[onclick], li button')?.focus();
  };
  const onPick = (hit) => {
    if (!hit) { closeMenu(); return; }
    const kind = hit.kind === 'product' ? 'product' : hit.kind;
    // 코드가 실행 중이고 이 물건을 누르면 실행되는 스크립트가 있으면 그걸 먼저 해요
    const eventKind = kind === 'product' || kind === 'buddy' ? 'furniture' : kind;
    const eventId = kind === 'product' ? prodById.get(hit.id)?.home : kind === 'buddy' ? 'pet' : hit.id;
    if (runCtl.trigger(eventKind, eventId)) {
      const obj = objOf(kind, hit.id);
      world.highlight(obj, 2);
      setTimeout(() => { if (!selected || objOf(selected.kind, selected.id) !== obj) world.highlight(obj, 0); }, 500);
      particles.burst('sparkle', kind === 'buddy' ? buddy.top() : world.anchor(kind === 'character' ? 'furniture' : kind, hit.id) || char.headTop(), 4);
      return;
    }
    if (selected && selected.kind === kind && selected.id === hit.id) { closeMenu(); return; }
    openMenu(kind, hit.id);
  };

  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 700;
    down = null;
    if (moved < 8 && quick) onPick(pickAt(e.clientX, e.clientY));
  });
  let hoverXY = null;
  canvas.addEventListener('pointermove', (e) => { hoverXY = e.pointerType === 'mouse' && !e.buttons ? [e.clientX, e.clientY] : null; });
  canvas.addEventListener('pointerleave', () => { hoverXY = null; });
  const hoverTip = $('#hover-tip');
  const updateHover = () => {
    let hit = hoverXY ? pickAt(hoverXY[0], hoverXY[1]) : null;
    const obj = hit ? objOf(hit.kind, hit.id) : null;
    if (hovered && hovered !== obj && (!selected || objOf(selected.kind, selected.id) !== hovered)) world.highlight(hovered, 0);
    if (obj && (!selected || objOf(selected.kind, selected.id) !== obj)) world.highlight(obj, 1);
    hovered = obj;
    canvas.style.cursor = obj ? 'pointer' : 'grab';
    if (hit && hoverXY) {
      const info = nameOf(hit.kind, hit.id);
      hoverTip.textContent = `${info?.emoji || ''} ${info?.name || ''}`;
      hoverTip.style.left = hoverXY[0] + 'px';
      hoverTip.style.top = hoverXY[1] + 'px';
      hoverTip.hidden = false;
    } else hoverTip.hidden = true;
  };
  canvas.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft') rig.nudge(-0.08, 0);
    else if (k === 'ArrowRight') rig.nudge(0.08, 0);
    else if (k === 'ArrowUp') rig.nudge(0, -0.06);
    else if (k === 'ArrowDown') rig.nudge(0, 0.06);
    else if (k === '+' || k === '=') rig.nudge(0, 0, 0.9);
    else if (k === '-' || k === '_') rig.nudge(0, 0, 1.1);
    else if (k === 'Enter' || k === ' ') thingsMenu();
    else return;
    e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOpen() && !menu.hidden) { e.preventDefault(); closeMenu(true); }
  });

  // ── 코딩 모드 ──
  const things = [...cfg.furniture.map((f) => ({ id: f.id, name: f.name, emoji: f.emoji })), { id: 'pet', name: '내 반려동물', emoji: '🐾' }];
  const sanitizeOpts = { actionIds: actions.map((a) => a.id), thingIds: things.map((t) => t.id) };
  let saveTimer = 0;
  const editor = new BlockEditor({
    palette: $('#palette'), workspace: $('#workspace'), trash: $('#trash'), actions, things,
    onToast: (t, k) => toast(t, k),
    onChange: (p) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.set('program', p), 300);
      if (!$('#pane-share').hidden) $('#share-out').value = encodeProgram(p);
      missions?.check();
    },
  });
  const saved = store.get('program');
  editor.setProgram(saved ? sanitizeProgram(saved, sanitizeOpts) : emptyProgram());

  const runState = $('#run-state');
  const runCtl = new RunController({
    brain, char, state, editor,
    hooks: {
      onSay: say,
      thingName: (id) => (id === 'pet' ? '반려동물' : furnById.get(id)?.name),
      onState: (text, kind) => { runState.textContent = text; runState.className = `run-state ${kind || ''}`; },
      onRunChange: (on) => {
        $('#run').disabled = on;
        $('#stop').disabled = !on;
        if (on) { closeMenu(); setStatus('🧩 코드 실행 중', 'do'); }
      },
      onRunEnd: () => missions?.check(),
      onStepWait: (waiting) => { $('#step-next').hidden = !waiting; if (waiting) $('#step-next').focus({ preventScroll: true }); },
    },
  });
  $('#run').addEventListener('click', () => { sound.play('click'); runCtl.start(editor.program); });
  $('#stop').addEventListener('click', () => runCtl.stop());
  $('#step-mode').addEventListener('change', (e) => runCtl.setStepMode(e.target.checked));
  $('#step-next').addEventListener('click', () => runCtl.next());

  missions = new MissionBoard({
    root: $('#pane-missions'), countEl: $('#mission-count'), missions: missionsCfg,
    getContext: () => ({ program: editor.program, run: runCtl.lastRun, state: { ...state.values }, clicks: [...clicks] }),
    onPass: () => {
      sound.play('mission');
      particles.burst('crown', char.headTop());
      particles.burst('stars', char.headTop(), 10);
      say('미션 성공! 고마워~', 2.5);
    },
  });

  // 코드 보기
  const highlightCode = (src) => src
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.*)$/gm, '<span class="cm">$1</span>')
    .replace(/("[^"]*")/g, '<span class="str">$1</span>')
    .replace(/\b(function|for|let|if|else)\b/g, '<span class="kw">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>')
    .replace(/([\p{L}_][\p{L}\p{N}_]*)(?=\()/gu, '<span class="fn">$1</span>');
  $('#show-code').addEventListener('click', () => {
    const src = toCode(editor.program, {
      actionCode: (id) => actionById.get(id)?.code || id,
      thingName: (id) => (id === 'pet' ? '반려동물' : furnById.get(id)?.name || id).replace(/\s+/g, ''),
      gaugeName: (id) => GAUGES.find((g) => g.id === id)?.name || id,
      exprName: (e) => EXPRESSION_NAMES[e] || e,
    });
    openModal((box, close) => {
      box.append(
        el('h2', { id: 'modal-title', text: '📜 글자 코드로 보면?' }),
        el('p', { class: 'muted', text: '블록은 이런 글자 코드와 같아요. 진짜 프로그래머도 이렇게 순서·반복(for)·조건(if)을 써요!' }),
        el('pre', { class: 'code-view', tabindex: 0, 'aria-label': '글자 코드', html: highlightCode(src) }),
        el('div', { class: 'actions' }, el('button', { class: 'btn', type: 'button', 'data-autofocus': true, text: '닫기', onclick: close })));
    });
  });

  // 공유
  const shareOut = $('#share-out');
  const copyText = async (text, ok) => {
    try { await navigator.clipboard.writeText(text); toast(ok, 'ok'); }
    catch {
      shareOut.value = text; shareOut.select();
      try { document.execCommand('copy'); toast(ok, 'ok'); } catch { toast('복사가 안 돼요. 글자를 직접 길게 눌러 복사해 주세요.', 'warn'); }
    }
  };
  $('#copy-code').addEventListener('click', () => copyText(encodeProgram(editor.program), '공유 코드를 복사했어요!'));
  $('#copy-link').addEventListener('click', () => copyText(`${location.href.split('#')[0]}#code=${encodeProgram(editor.program)}`, '링크를 복사했어요! 친구가 열면 내 코드가 들어가요.'));
  const loadProgram = (p, message) => {
    if (runCtl.running) runCtl.stop();
    store.set('program-backup', editor.program);
    editor.setProgram(p);
    store.set('program', p);
    $('#undo-load').hidden = false;
    shareOut.value = encodeProgram(p);
    toast(message, 'ok');
  };
  $('#load-code').addEventListener('click', () => {
    const p = decodeProgram($('#share-in').value, sanitizeOpts);
    if (!p) { toast('코드를 읽을 수 없어요. MOMO1- 로 시작하는지 확인해 주세요.', 'err'); return; }
    loadProgram(p, '친구 코드를 불러왔어요! 블록 탭에서 확인해 보세요.');
    $('#share-in').value = '';
  });
  $('#undo-load').addEventListener('click', () => {
    const b = store.get('program-backup');
    if (!b) return;
    editor.setProgram(sanitizeProgram(b, sanitizeOpts));
    store.set('program', editor.program);
    $('#undo-load').hidden = true;
    toast('예전 코드로 되돌렸어요.', 'ok');
  });
  $('#clear-code').addEventListener('click', () => {
    if (!confirm('내 코드를 모두 지울까요?')) return;
    loadProgram(emptyProgram(), '새 코드로 시작해요!');
  });
  const hashCode = /#code=([^&]+)/.exec(location.hash)?.[1];
  if (hashCode) {
    const p = decodeProgram(decodeURIComponent(hashCode), sanitizeOpts);
    if (p) setTimeout(() => loadProgram(p, '링크로 받은 코드를 불러왔어요! 코딩 모드를 열어 보세요.'), 600);
    else toast('링크의 코드를 읽을 수 없었어요.', 'err');
    history.replaceState(null, '', location.pathname + location.search);
  }

  // 패널과 탭
  const panel = $('#panel');
  const codeBtn = document.querySelector('[data-act="code"]');
  const setPanel = (open) => {
    panel.hidden = !open;
    document.body.classList.toggle('panel-open', open);
    codeBtn.setAttribute('aria-expanded', String(open));
    closeMenu();
    onResize();
    if (open) $('.tabs [aria-selected="true"]').focus({ preventScroll: true });
    else codeBtn.focus({ preventScroll: true });
    store.set('panel', open);
  };
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  const selectTab = (tab) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    }
    if (tab.id === 'tab-share') shareOut.value = encodeProgram(editor.program);
    if (tab.id === 'tab-missions') missions.check();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(n); n.focus();
    });
  });
  document.querySelector('[data-act="close-panel"]').addEventListener('click', () => setPanel(false));

  // ── 도구 버튼 ──
  let timeScale = 1;
  const setBtn = (act, pressed, icon, label) => {
    const b = document.querySelector(`.tools [data-act="${act}"]`);
    b.setAttribute('aria-pressed', String(pressed));
    b.children[0].textContent = icon;
    b.children[1].textContent = label;
  };
  const toggleBig = (on) => {
    document.documentElement.classList.toggle('big', on);
    setBtn('big', on, '🔍', on ? '큰 화면 켬' : '큰 화면');
    store.set('big', on);
    onResize();
  };
  $('#tools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    sound.play('click');
    switch (b.dataset.act) {
      case 'auto': {
        const on = !brain.auto;
        brain.setAuto(on);
        setBtn('auto', on, on ? '⏸️' : '▶️', on ? '자동 멈춤' : '자동 다시');
        toast(on ? `${charName}가 다시 스스로 생활해요.` : '자동 행동을 멈췄어요. 지금 하는 행동만 마칠게요.', 'ok');
        break;
      }
      case 'things': thingsMenu(); break;
      case 'camera': rig.reset(); break;
      case 'sound': {
        sound.setOn(!sound.on);
        setBtn('sound', sound.on, sound.on ? '🔊' : '🔇', sound.on ? '소리 켜짐' : '소리 꺼짐');
        sound.play('click');
        break;
      }
      case 'speed':
        timeScale = timeScale === 1 ? 2 : 1;
        setBtn('speed', timeScale === 2, timeScale === 2 ? '🐇' : '🐢', timeScale === 2 ? '2배 빠르게' : '보통 빠르기');
        break;
      case 'big': toggleBig(!document.documentElement.classList.contains('big')); break;
      case 'help': showHelp(); break;
      case 'code': setPanel(panel.hidden); break;
    }
  });

  // ── 도움말 (처음 화면 조작 안내) ──
  const showHelp = () => openModal((box, close) => {
    box.append(...[
      el('h2', { id: 'modal-title', text: `🏠 ${charName}의 방에 온 걸 환영해요!` }),
      el('p', { text: `${charName}는 벌써 하루를 시작했어요. 지켜보거나, 직접 부탁하거나, 코딩으로 하루를 정해 보세요.` }),
      el('ul', { class: 'guide' },
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '👆' }), el('span', { text: '가구나 화장품을 누르면 메뉴가 나와요. 행동을 고르면 지금 하던 일을 마치고 가서 해요.' })),
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '🔄' }), el('span', { text: '화면을 끌면 방이 돌아가요. 휠이나 두 손가락으로 확대·축소해요. (키보드: 화살표, +, -)' })),
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '🧩' }), el('span', { text: '"코딩 모드"에서 블록으로 순서·반복·조건·이벤트를 만들어 ▶ 실행해요.' })),
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '🏅' }), el('span', { text: '미션 탭에서 차시별 미션을 해결하고 도장을 모아요.' })),
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '💖' }), el('span', { text: '위쪽 게이지는 기분·졸림·깨끗함 변수예요. 행동을 하면 숫자가 바뀌어요.' })),
        el('li', {}, el('span', { class: 'em', 'aria-hidden': 'true', text: '🐾' }), el('span', { text: '"반려동물"에서 3D 친구를 골라 키우고, "도감"에서 동물 18종을 모아요. 내 반려동물은 이 방에도 놀러 와요!' })),
      ),
      cfg.warnings.length ? el('div', { class: 'run-state err' },
        el('b', { text: `설정 파일에서 고칠 곳이 ${cfg.warnings.length}개 있어요 (그 부분만 빼고 실행했어요)` }),
        el('ul', { class: 'warn-list' }, cfg.warnings.slice(0, 8).map((w) => el('li', { text: w })))) : null,
      el('div', { class: 'actions' }, el('button', { class: 'btn run', type: 'button', 'data-autofocus': true, text: '시작하기 ▶', onclick: close }))].filter(Boolean));
  }, { onClosed: () => store.set('seenHelp', true) });

  // ── 크기 맞추기 ──
  function onResize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 패널이 열리면 방이 패널에 가리지 않게 화면 가운데를 옮겨요
    const panelW = !panel.hidden && w > 760 ? panel.offsetWidth : 0;
    const panelH = !panel.hidden && w <= 760 ? panel.offsetHeight : 0;
    if (panelW || panelH) camera.setViewOffset(w, h, panelW / 2, panelH / 2.4, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const before = rig.homeDist;
    rig.fitAspect((w - panelW) / h);
    if (before !== rig.homeDist) rig.reset(true);
  }
  addEventListener('resize', onResize);
  onResize();
  rig.reset(true);

  reducedMQ.addEventListener?.('change', (e) => {
    reduced = e.matches;
    char.reducedMotion = particles.reduced = rig.reduced = reduced;
  });

  // ── 그리기 반복 ──
  const clock = new THREE.Clock();
  const v3 = new THREE.Vector3();
  let fpsSamples = [], perfStage = 0, perfTimer = 0, gaugeTimer = 0, missionTimer = 0, glowTimer = 0;
  const frame = () => {
    const raw = Math.min(clock.getDelta(), 0.1);
    const dt = raw * timeScale;
    simTime += dt;
    try {
      brain.tick(dt);
      state.tick(dt);
      char.wind = world.wind;
      char.update(dt, simTime);
      world.update(dt, reduced);
      buddy?.update(dt, char, reduced);
      if (!menu.hidden && selected?.kind === 'buddy') world.showRing(buddy.position, 0.35);
      particles.update(dt);
      rig.update(raw);
      if (!menu.hidden && selected?.kind === 'character') world.showRing(char.position, 0.4);
      // 반짝이는 피부
      glowTimer -= dt;
      if (char.fx.glow > 0.55 && glowTimer < 0) { glowTimer = 2.2; particles.burst('sparkle', char.faceWorld(v3, (Math.random() - 0.5) * 0.4, -0.05, 0.3), 1); }
      // 말풍선 위치
      if (!bubble.hidden) {
        if (simTime > bubbleUntil) bubble.hidden = true;
        else {
          char.headTop(v3).project(camera);
          const r = canvas.getBoundingClientRect();
          bubble.style.left = r.left + ((v3.x + 1) / 2) * r.width + 'px';
          bubble.style.top = r.top + ((1 - v3.y) / 2) * r.height - 8 + 'px';
          bubble.style.visibility = v3.z > 1 ? 'hidden' : '';
        }
      }
      gaugeTimer -= raw;
      if (gaugeTimer < 0) { gaugeTimer = 0.25; drawGauges(); updateHover(); }
      missionTimer -= raw;
      if (missionTimer < 0) { missionTimer = 1.5; missions.check(); }
      renderer.render(scene, camera);
    } catch (err) {
      console.error(err);
      if (Date.now() - lastErrToast > 10000) { lastErrToast = Date.now(); toast('그리기 중 문제가 생겼어요.', 'err'); }
    }
    // 느린 기기면 화질을 조금 낮춰요
    if (perfStage < 2) {
      perfTimer += raw;
      if (perfTimer > 1.5) fpsSamples.push(raw);
      if (fpsSamples.length >= 120) {
        const fps = fpsSamples.length / fpsSamples.reduce((a, b) => a + b, 0);
        fpsSamples = [];
        if (fps < 45) {
          perfStage++;
          pixelCap = perfStage === 1 ? 1.25 : 1;
          renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelCap));
          world.setShadowQuality(perfStage === 1 ? 'mid' : 'low');
          onResize();
          console.info(`화질 낮춤 ${perfStage}단계 (fps ${fps.toFixed(0)})`);
        } else perfStage = 2;
      }
    }
  };
  renderer.setAnimationLoop(frame);
  // 반려동물 화면에서 돌아오면 바뀐 친구를 다시 불러와요
  addEventListener('pageshow', () => buddy?.reload());
  addEventListener('storage', (e) => { if (e.key === 'cozy-room.pet.v1') buddy?.reload(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) buddy?.reload();
    if (document.hidden) renderer.setAnimationLoop(null);
    else { clock.getDelta(); renderer.setAnimationLoop(frame); }
  });

  // ── 시작! ──
  if (store.get('big')) toggleBig(true);
  if (store.get('panel') && innerWidth > 760) setPanel(true);
  brain.start();
  setTimeout(() => say(characterCfg.greeting || '안녕!', 3), 500);
  const loading = $('#loading');
  loading.classList.add('gone');
  loading.setAttribute('aria-busy', 'false');
  setTimeout(() => loading.remove(), 600);
  if (!store.get('seenHelp')) setTimeout(showHelp, 400);
  if (cfg.warnings.length) toast(`설정 파일에서 고칠 곳이 ${cfg.warnings.length}개 있어요. ❓ 도움말에서 볼 수 있어요.`, 'warn', 6000);

  // 테스트와 디버깅용 (콘솔에서 app 으로 볼 수 있어요)
  const screenOf = (kind, id) => {
    const p = kind === 'character' ? char.headTop().setY(char.headTop().y - 0.3) : kind === 'buddy' ? buddy.position.clone().setY(0.2) : world.anchor(kind, id);
    if (!p) return null;
    if (kind === 'furniture') p.y = Math.min(p.y, 0.6);
    p.project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  };
  window.app = { buddy, brain, char, world, state, editor, runCtl, missions, rig, renderer, camera, scene, openMenu, closeMenu, setPanel, screenOf };
  if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

try {
  boot();
} catch (err) {
  fail('앱을 시작하다가 문제가 생겼어요: ' + (err?.message || err), err);
}
