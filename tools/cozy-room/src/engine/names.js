// 엔진이 알고 있는 이름 목록이에요. 설정 파일에 잘못된 이름을 적으면 알려 주는 데 써요.
export const MOTION_NAMES = ['idle', 'pat', 'dropper', 'washFace', 'brushTeeth', 'lipBalm', 'blush', 'comb', 'sunscreen',
  'maskPack', 'drink', 'read', 'nap', 'water', 'tidy', 'press', 'dance', 'stretch', 'wave', 'jump'];
export const SHAPES = ['bottle', 'dropper', 'jar', 'tube', 'stick', 'compact', 'comb', 'toothbrush', 'pouch', 'book', 'cup', 'can'];
export const FURNITURE_TYPES = ['bed', 'nightstand', 'vanity', 'sink', 'shelf', 'window', 'plant', 'teaTable', 'rug', 'toyBox'];
export const EFFECTS = ['hearts', 'stars', 'sparkle', 'bubbles', 'crown', 'notes', 'drops', 'zzz', 'steam'];
export const EXPRESSIONS = ['happy', 'joy', 'closed', 'sleepy', 'surprised', 'proud'];
export const EXPRESSION_NAMES = { happy: '웃음', joy: '활짝', closed: '눈 감기', sleepy: '졸림', surprised: '놀람', proud: '뿌듯' };

// 가구가 바닥에서 차지하는 크기 [가로, 세로, 앞쪽으로 밀린 정도] — 길 찾기에 써요.
export const FOOTPRINTS = {
  bed: [1.45, 2.05, 0], nightstand: [0.55, 0.45, 0], sink: [0.85, 0.55, 0], vanity: [1.15, 1.05, 0.3],
  shelf: [1.35, 0.4, 0], window: null, plant: [0.6, 0.6, 0], teaTable: [1.0, 1.0, 0], rug: null, toyBox: [0.8, 0.5, 0],
};

// 가구 하나를 길 찾기 칸에 막아요
export function blockFurniture(grid, f) {
  const fp = FOOTPRINTS[f.type];
  if (!fp || f.solid === false) return;
  const a = ((f.rot || 0) * Math.PI) / 180;
  grid.block(f.pos[0] + Math.sin(a) * fp[2], f.pos[1] + Math.cos(a) * fp[2], fp[0], fp[1], f.rot || 0);
}
