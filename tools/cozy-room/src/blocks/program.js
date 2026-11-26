// 블록 코드(프로그램)를 다루는 함수 모음 — 화면과 상관없이 동작해서 테스트하기 쉬워요.
//
// 프로그램 모양:
//   { scripts: [ { id, event: { type: 'start' | 'clickChar' | 'clickThing', thing }, body: [블록...] } ] }
// 블록 모양:
//   { id, type: 'action', action: '세수하기의 id' }
//   { id, type: 'repeat', times: 3, body: [...] }
//   { id, type: 'if', cond: { gauge: 'sleepy', op: '>', value: 70 }, then: [...], else: [...] }
//   { id, type: 'wait', sec: 1 }
//   { id, type: 'say', text: '안녕!' }
//   { id, type: 'face', expr: 'joy' }

export const BLOCK_TYPES = ['action', 'repeat', 'if', 'wait', 'say', 'face'];
export const CONTAINER_KEYS = ['body', 'then', 'else'];
export const LIMITS = { scripts: 6, blocks: 60, repeat: 10, wait: 10, text: 30, depth: 4 };
export const OPS = ['>', '<'];

let seq = 0;
export const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export function newBlock(type, defaults = {}) {
  const id = newId();
  switch (type) {
    case 'action': return { id, type, action: defaults.action || 'washFace' };
    case 'repeat': return { id, type, times: 3, body: [] };
    case 'if': return { id, type, cond: { gauge: 'sleepy', op: '>', value: 70 }, then: [], else: [] };
    case 'wait': return { id, type, sec: 1 };
    case 'say': return { id, type, text: '안녕!' };
    case 'face': return { id, type, expr: 'joy' };
    default: throw new Error('모르는 블록: ' + type);
  }
}

export function newScript(event = { type: 'start' }) { return { id: newId(), event, body: [] }; }
export function emptyProgram() { return { scripts: [newScript()] }; }

// 모든 블록을 한 줄로 펼쳐요
export function flatten(program) {
  const out = [];
  const walk = (list) => (list || []).forEach((b) => { out.push(b); CONTAINER_KEYS.forEach((k) => walk(b[k])); });
  program.scripts.forEach((s) => walk(s.body));
  return out;
}

export const countBlocks = (program) => flatten(program).length;

// id로 블록이 들어 있는 목록과 위치를 찾아요
export function locate(program, id) {
  const search = (list) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, index: i, block: list[i] };
      for (const k of CONTAINER_KEYS) if (list[i][k]) { const r = search(list[i][k]); if (r) return r; }
    }
    return null;
  };
  for (const s of program.scripts) { const r = search(s.body); if (r) return { ...r, script: s }; }
  return null;
}

// 칸(컨테이너) 찾기: 'scriptId' 또는 'blockId:body' / 'blockId:then' / 'blockId:else'
export function containerList(program, ref) {
  const [id, key] = ref.split(':');
  if (!key) return program.scripts.find((s) => s.id === id)?.body || null;
  const found = locate(program, id);
  return found?.block[key] || null;
}

function depthOf(program, ref) {
  let depth = 0;
  let [id, key] = ref.split(':');
  while (key) {
    depth++;
    const found = locate(program, id);
    if (!found) break;
    // 이 블록을 담은 칸을 찾아 올라가요
    const parent = findParentRef(program, found.list);
    if (!parent) break;
    [id, key] = parent.split(':');
  }
  return depth;
}

function findParentRef(program, list) {
  for (const s of program.scripts) if (s.body === list) return s.id;
  for (const b of flatten(program)) for (const k of CONTAINER_KEYS) if (b[k] === list) return `${b.id}:${k}`;
  return null;
}

const nestDepth = (b) => Math.max(0, ...CONTAINER_KEYS.filter((k) => b[k]).map((k) => 1 + Math.max(0, ...b[k].map(nestDepth))));

// 블록 하나를 칸에 넣어요. 성공하면 true
export function insertBlock(program, ref, index, block) {
  const list = containerList(program, ref);
  if (!list) return false;
  if (countBlocks(program) + 1 + flattenOne(block).length - 1 > LIMITS.blocks) return false;
  if (depthOf(program, ref) + nestDepth(block) > LIMITS.depth) return false;
  list.splice(Math.max(0, Math.min(index, list.length)), 0, block);
  return true;
}

function flattenOne(block) { return flatten({ scripts: [{ body: [block] }] }); }

export function removeBlock(program, id) {
  const found = locate(program, id);
  if (!found) return null;
  return found.list.splice(found.index, 1)[0];
}

// 블록을 다른 칸으로 옮겨요. 자기 안으로는 못 옮겨요.
export function moveBlock(program, id, ref, index) {
  const found = locate(program, id);
  if (!found) return false;
  const [targetId] = ref.split(':');
  if (targetId === id || flattenOne(found.block).some((b) => b.id === targetId && ref.includes(':'))) return false;
  const targetList = containerList(program, ref);
  if (!targetList) return false;
  let i = index;
  if (targetList === found.list && found.index < index) i--;
  found.list.splice(found.index, 1);
  if (depthOf(program, ref) + nestDepth(found.block) > LIMITS.depth) { found.list.splice(found.index, 0, found.block); return false; }
  targetList.splice(Math.max(0, Math.min(i, targetList.length)), 0, found.block);
  return true;
}

// 받아온 코드를 안전하게 고쳐요 (모르는 블록은 빼고, 숫자는 범위 안으로)
export function sanitizeProgram(raw, { actionIds = [], thingIds = [] } = {}) {
  const clampN = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.max(lo, Math.min(hi, Math.round(+n * 10) / 10)) : d);
  let count = 0;
  const fixList = (list, depth) => {
    if (!Array.isArray(list) || depth > LIMITS.depth) return [];
    const out = [];
    for (const b of list) {
      if (!b || !BLOCK_TYPES.includes(b.type) || count >= LIMITS.blocks) continue;
      count++;
      const id = newId();
      switch (b.type) {
        case 'action':
          if (actionIds.length && !actionIds.includes(b.action)) { count--; continue; }
          out.push({ id, type: 'action', action: String(b.action) });
          break;
        case 'repeat':
          out.push({ id, type: 'repeat', times: Math.round(clampN(b.times, 1, LIMITS.repeat, 3)), body: fixList(b.body, depth + 1) });
          break;
        case 'if': {
          const c = b.cond || {};
          out.push({
            id, type: 'if',
            cond: { gauge: ['mood', 'sleepy', 'clean'].includes(c.gauge) ? c.gauge : 'sleepy', op: OPS.includes(c.op) ? c.op : '>', value: Math.round(clampN(c.value, 0, 100, 50)) },
            then: fixList(b.then, depth + 1), else: fixList(b.else, depth + 1),
          });
          break;
        }
        case 'wait': out.push({ id, type: 'wait', sec: clampN(b.sec, 0.1, LIMITS.wait, 1) }); break;
        case 'say': out.push({ id, type: 'say', text: String(b.text ?? '').slice(0, LIMITS.text) }); break;
        case 'face': out.push({ id, type: 'face', expr: ['happy', 'joy', 'closed', 'sleepy', 'surprised', 'proud'].includes(b.expr) ? b.expr : 'joy' }); break;
      }
    }
    return out;
  };
  const scripts = (Array.isArray(raw?.scripts) ? raw.scripts : []).slice(0, LIMITS.scripts).map((s) => {
    const e = s?.event || {};
    let event = { type: 'start' };
    if (e.type === 'clickChar') event = { type: 'clickChar' };
    else if (e.type === 'clickThing' && (!thingIds.length || thingIds.includes(e.thing))) event = { type: 'clickThing', thing: String(e.thing) };
    return { id: newId(), event, body: fixList(s?.body, 1) };
  });
  return { scripts: scripts.length ? scripts : [newScript()] };
}

// ── 공유 코드 ─────────────────────────────────────
// 짧게 만들기 위해 이름을 줄여서 JSON → base64 로 바꿔요.
const PREFIX = 'MOMO1-';
const pack = (list) => list.map((b) => {
  switch (b.type) {
    case 'action': return ['a', b.action];
    case 'repeat': return ['r', b.times, pack(b.body)];
    case 'if': return ['i', b.cond.gauge, b.cond.op, b.cond.value, pack(b.then), pack(b.else)];
    case 'wait': return ['w', b.sec];
    case 'say': return ['s', b.text];
    case 'face': return ['f', b.expr];
    default: return null;
  }
}).filter(Boolean);
const unpack = (list) => (Array.isArray(list) ? list : []).map((x) => {
  if (!Array.isArray(x)) return null;
  switch (x[0]) {
    case 'a': return { type: 'action', action: x[1] };
    case 'r': return { type: 'repeat', times: x[1], body: unpack(x[2]) };
    case 'i': return { type: 'if', cond: { gauge: x[1], op: x[2], value: x[3] }, then: unpack(x[4]), else: unpack(x[5]) };
    case 'w': return { type: 'wait', sec: x[1] };
    case 's': return { type: 'say', text: x[1] };
    case 'f': return { type: 'face', expr: x[1] };
    default: return null;
  }
}).filter(Boolean);

const toB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (b64) => {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function encodeProgram(program) {
  const data = program.scripts.map((s) => [s.event.type === 'clickThing' ? ['t', s.event.thing] : s.event.type === 'clickChar' ? ['c'] : ['s'], pack(s.body)]);
  return PREFIX + toB64(JSON.stringify(data));
}

// 잘못된 코드면 null
export function decodeProgram(code, opts) {
  try {
    const text = String(code).trim().replace(/\s+/g, '');
    if (!text.startsWith(PREFIX) || text.length > 6000) return null;
    const data = JSON.parse(fromB64(text.slice(PREFIX.length)));
    if (!Array.isArray(data)) return null;
    const raw = {
      scripts: data.map(([ev, body]) => ({
        event: ev?.[0] === 't' ? { type: 'clickThing', thing: ev[1] } : ev?.[0] === 'c' ? { type: 'clickChar' } : { type: 'start' },
        body: unpack(body),
      })),
    };
    return sanitizeProgram(raw, opts);
  } catch {
    return null;
  }
}

// ── 글자 코드 보기 ─────────────────────────────────
// 블록을 자바스크립트 비슷한 글자 코드로 바꿔요. (읽기 전용)
export function toCode(program, { actionCode = (id) => id, thingName = (id) => id, gaugeName = (id) => id, exprName = (id) => id } = {}) {
  const lines = [];
  const pad = (n) => '  '.repeat(n);
  const walk = (list, depth) => {
    if (!list.length) lines.push(pad(depth) + '// (비어 있어요)');
    for (const b of list) {
      switch (b.type) {
        case 'action': lines.push(`${pad(depth)}${actionCode(b.action)}();`); break;
        case 'repeat':
          lines.push(`${pad(depth)}for (let i = 0; i < ${b.times}; i++) {`);
          walk(b.body, depth + 1);
          lines.push(pad(depth) + '}');
          break;
        case 'if':
          lines.push(`${pad(depth)}if (${gaugeName(b.cond.gauge)} ${b.cond.op} ${b.cond.value}) {`);
          walk(b.then, depth + 1);
          lines.push(pad(depth) + '} else {');
          walk(b.else, depth + 1);
          lines.push(pad(depth) + '}');
          break;
        case 'wait': lines.push(`${pad(depth)}기다리기(${b.sec});`); break;
        case 'say': lines.push(`${pad(depth)}말하기("${String(b.text).replace(/["\\]/g, '')}");`); break;
        case 'face': lines.push(`${pad(depth)}표정("${exprName(b.expr)}");`); break;
      }
    }
  };
  program.scripts.forEach((s, i) => {
    if (i) lines.push('');
    const name = s.event.type === 'start' ? '시작하면' : s.event.type === 'clickChar' ? '캐릭터를_누르면' : `${thingName(s.event.thing)}을_누르면`;
    lines.push(`function ${name.replace(/\s+/g, '_')}() {`);
    walk(s.body, 1);
    lines.push('}');
  });
  return lines.join('\n');
}
