// 학생이 설정 파일을 고치다 실수해도 앱이 멈추지 않게, 잘못된 부분을 찾아 빼고 한국어로 알려 줘요.
import { MOTION_NAMES, SHAPES, FURNITURE_TYPES, EFFECTS, EXPRESSIONS } from './names.js';

const isColor = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);

export function validateConfig({ furniture = [], products = [], actions = [] }) {
  const warnings = [];
  const ids = new Set();
  const goodFurniture = [];
  for (const f of furniture) {
    const label = `가구 "${f?.name || f?.id || '?'}"`;
    if (!f || typeof f.id !== 'string') { warnings.push(`${label}: id가 없어요.`); continue; }
    if (ids.has(f.id)) { warnings.push(`${label}: id "${f.id}"가 겹쳐요.`); continue; }
    if (!FURNITURE_TYPES.includes(f.type)) { warnings.push(`${label}: type "${f.type}"은(는) 없는 모양이에요.`); continue; }
    if (!Array.isArray(f.pos) || f.pos.length !== 2 || f.pos.some((n) => typeof n !== 'number' || !isFinite(n))) {
      warnings.push(`${label}: pos는 [x, z] 숫자 두 개로 적어요.`); continue;
    }
    const fixed = { rot: 0, spot: [0, 0.8], name: f.id, emoji: '📦', ...f };
    fixed.pos = [Math.max(-3.9, Math.min(3.9, f.pos[0])), Math.max(-2.98, Math.min(2.9, f.pos[1]))];
    if (fixed.pos[0] !== f.pos[0] || fixed.pos[1] !== f.pos[1]) warnings.push(`${label}: 방 밖에 있어서 안쪽으로 옮겼어요.`);
    if (f.color && !isColor(f.color)) { warnings.push(`${label}: color "${f.color}"는 #과 6글자로 적어요.`); delete fixed.color; }
    if (f.accent && !isColor(f.accent)) { warnings.push(`${label}: accent "${f.accent}"는 #과 6글자로 적어요.`); delete fixed.accent; }
    ids.add(f.id);
    goodFurniture.push(fixed);
  }
  const fIds = new Set(goodFurniture.map((f) => f.id));

  const pIds = new Set();
  const goodProducts = [];
  for (const p of products) {
    const label = `물건 "${p?.name || p?.id || '?'}"`;
    if (!p || typeof p.id !== 'string') { warnings.push(`${label}: id가 없어요.`); continue; }
    if (pIds.has(p.id) || fIds.has(p.id)) { warnings.push(`${label}: id "${p.id}"가 겹쳐요.`); continue; }
    if (!SHAPES.includes(p.shape)) { warnings.push(`${label}: shape "${p.shape}"은(는) 없는 모양이에요.`); continue; }
    const fixed = { name: p.id, emoji: '🎁', color: '#ffffff', cap: '#ffb3c4', slot: 0, size: 1, ...p };
    if (!isColor(fixed.color)) { warnings.push(`${label}: color는 #과 6글자로 적어요.`); fixed.color = '#ffffff'; }
    if (!isColor(fixed.cap)) fixed.cap = '#ffb3c4';
    if (!fIds.has(fixed.home)) { warnings.push(`${label}: home "${p.home}" 가구가 없어서 손에만 나타나요.`); fixed.home = null; }
    pIds.add(p.id);
    goodProducts.push(fixed);
  }

  const aIds = new Set();
  const goodActions = [];
  for (const a of actions) {
    const label = `행동 "${a?.name || a?.id || '?'}"`;
    if (!a || typeof a.id !== 'string') { warnings.push(`${label}: id가 없어요.`); continue; }
    if (aIds.has(a.id)) { warnings.push(`${label}: id "${a.id}"가 겹쳐요.`); continue; }
    if (a.target != null && !fIds.has(a.target)) { warnings.push(`${label}: target "${a.target}" 가구가 없어요.`); continue; }
    if (!MOTION_NAMES.includes(a.motion)) { warnings.push(`${label}: motion "${a.motion}"은(는) 없는 몸동작이에요.`); continue; }
    const fixed = {
      emoji: '⭐', name: a.id, code: a.name || a.id, duration: 3, expression: 'happy', effects: {}, finish: [],
      weight: 1, face: 'target', product: null, ...a,
    };
    fixed.code = String(fixed.code).replace(/[^\p{L}\p{N}_]/gu, '') || a.id;
    if (fixed.product != null && !pIds.has(fixed.product)) { warnings.push(`${label}: product "${a.product}" 물건이 없어서 빈손으로 해요.`); fixed.product = null; }
    if (typeof fixed.duration !== 'number' || !(fixed.duration > 0)) { warnings.push(`${label}: duration은 0보다 큰 숫자로 적어요.`); fixed.duration = 3; }
    fixed.duration = Math.min(fixed.duration, 30);
    if (!EXPRESSIONS.includes(fixed.expression)) { warnings.push(`${label}: expression "${a.expression}"은(는) 없는 표정이에요.`); fixed.expression = 'happy'; }
    fixed.finish = (Array.isArray(fixed.finish) ? fixed.finish : [fixed.finish]).filter((e) => {
      if (EFFECTS.includes(e)) return true;
      warnings.push(`${label}: finish "${e}"은(는) 없는 효과예요.`);
      return false;
    });
    if (fixed.seat && !(fixed.target && goodFurniture.find((f) => f.id === fixed.target)?.seat)) {
      warnings.push(`${label}: target 가구에 seat가 없어서 서서 해요.`);
      fixed.seat = false;
    }
    if (fixed.pickup && !fixed.product) fixed.pickup = false;
    aIds.add(a.id);
    goodActions.push(fixed);
  }
  return { furniture: goodFurniture, products: goodProducts, actions: goodActions, warnings };
}
