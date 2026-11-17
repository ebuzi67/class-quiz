// 앱 전체에서 쓰는 그림 기호. 모두 같은 굵기의 둥근 선으로 그려서 한 벌처럼 보여요.
import { ReactNode } from 'react';
import { colorHex, gridFromRows } from '../engine/types';

const P: Record<string, ReactNode> = {
  up: <path d="M12 19V6M6 11l6-6 6 6" />,
  down: <path d="M12 5v13M6 13l6 6 6-6" />,
  left: <path d="M19 12H6M11 6l-6 6 6 6" />,
  right: <path d="M5 12h13M13 6l6 6-6 6" />,
  paint: <><path d="M14.5 4.5l5 5L11 18l-5.5.5L6 13z" fill="currentColor" fillOpacity=".25" /><path d="M4 21h6" /></>,
  erase: <><path d="M8 19l-4-4L14 5l6 6-8 8z" fill="currentColor" fillOpacity=".2" /><path d="M9 10l6 6M8 19h12" /></>,
  color: <><path d="M12 3.5c-5 0-8.5 3.6-8.5 8s3.4 8 7.5 8c1.6 0 1.9-1.3 1.2-2.3-.8-1.2 0-2.7 1.6-2.7H16c2.6 0 4.5-1.8 4.5-4.4 0-3.7-3.7-6.6-8.5-6.6z" fill="currentColor" fillOpacity=".2" /><circle cx="8" cy="11" r="1" fill="currentColor" /><circle cx="11.5" cy="7.5" r="1" fill="currentColor" /><circle cx="15.8" cy="8.8" r="1" fill="currentColor" /></>,
  repeat: <><path d="M17 3.5l3 3-3 3" /><path d="M20 6.5H8a4 4 0 0 0-4 4v1" /><path d="M7 20.5l-3-3 3-3" /><path d="M4 17.5h12a4 4 0 0 0 4-4v-1" /></>,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" fillOpacity=".9" />,
  pause: <><rect x="6.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor" /><rect x="13.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />,
  step: <><path d="M6 5.5v13l9-6.5z" fill="currentColor" fillOpacity=".9" /><path d="M18.5 5.5v13" /></>,
  restart: <><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" /><path d="M4.5 4.5v4.5H9" /></>,
  trash: <><path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7" /><path d="M10.5 11v5M13.5 11v5" /></>,
  broom: <><path d="M19.5 4.5l-8 8" /><path d="M12.5 10.5l1.5 1.5c.8.8.8 2 0 2.8L9 19.5l-4.5-4.5 4.7-5c.8-.8 2-.8 2.8 0z" fill="currentColor" fillOpacity=".2" /><path d="M7 17l-2 2.5M10 14.5l-1 1" /></>,
  undo: <><path d="M9 7L4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-2" /></>,
  redo: <><path d="M15 7l4.5 4.5L15 16" /><path d="M19 11.5h-9a5 5 0 0 0 0 10h2" /></>,
  save: <><path d="M5 4.5h11.5L19.5 7.5v12h-15z" fill="currentColor" fillOpacity=".18" /><path d="M8 4.5v5h7v-5M8 19.5v-6h8v6" /></>,
  folder: <><path d="M3.5 7.5v11h17v-9h-8l-2-2z" fill="currentColor" fillOpacity=".18" /></>,
  download: <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M4.5 19.5h15" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="currentColor" fillOpacity=".18" /><path d="M5.5 15.5h-1v-11h11v1" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="currentColor" fillOpacity=".9" />,
  sparkle: <path d="M12 3c.6 4.8 2.7 7.4 9 9-6.3 1.6-8.4 4.2-9 9-.6-4.8-2.7-7.4-9-9 6.3-1.6 8.4-4.2 9-9z" fill="currentColor" fillOpacity=".9" />,
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" fill="currentColor" fillOpacity=".18" /><path d="M8.5 10.5v-3a3.5 3.5 0 0 1 7 0v3" /></>,
  hint: <><path d="M9 17.5h6M10 20.5h4" /><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3.5z" fill="currentColor" fillOpacity=".2" /></>,
  sound: <><path d="M4.5 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor" fillOpacity=".2" /><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4.5 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor" fillOpacity=".2" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  full: <path d="M4.5 9.5v-5h5M19.5 9.5v-5h-5M4.5 14.5v5h5M19.5 14.5v5h-5" />,
  hat: <><path d="M12 3.5l5 11H7z" fill="currentColor" fillOpacity=".2" /><path d="M3.5 17.5c0-1.7 3.8-3 8.5-3s8.5 1.3 8.5 3-3.8 3-8.5 3-8.5-1.3-8.5-3z" fill="currentColor" fillOpacity=".2" /></>,
  map: <><path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2z" fill="currentColor" fillOpacity=".18" /><path d="M9 4.5v13M15 6.5v13" /></>,
  hand: <><path d="M8.5 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-1c-2 0-3.3-1-4.3-2.5L4.5 14a1.4 1.4 0 0 1 2.3-1.5l1.7 2" fill="currentColor" fillOpacity=".15" /></>,
  wand: <><path d="M5 19l9.5-9.5" /><path d="M17 3.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor" /></>,
  eye: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" fill="currentColor" fillOpacity=".15" /><circle cx="12" cy="12" r="2.5" fill="currentColor" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2.5" fill="currentColor" fillOpacity=".18" /><path d="M8 5v14M16 5v14M4 9.5h4M4 14.5h4M16 9.5h4M16 14.5h4" /></>,
  grip: <><circle cx="9" cy="7" r="1.3" fill="currentColor" /><circle cx="15" cy="7" r="1.3" fill="currentColor" /><circle cx="9" cy="12" r="1.3" fill="currentColor" /><circle cx="15" cy="12" r="1.3" fill="currentColor" /><circle cx="9" cy="17" r="1.3" fill="currentColor" /><circle cx="15" cy="17" r="1.3" fill="currentColor" /></>,
  prev: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  next: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  help: <><circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity=".15" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" /><circle cx="12" cy="16.8" r=".8" fill="currentColor" /></>,
  layers: <><path d="M12 4l8.5 4.5L12 13 3.5 8.5z" fill="currentColor" fillOpacity=".2" /><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16L12 20.5 20.5 16" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2.5" fill="currentColor" fillOpacity=".15" /><path d="M4.5 16l4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" /><circle cx="15.5" cy="9.5" r="1.2" fill="currentColor" /></>,
  loop: <><path d="M7.5 8.5h9a3.5 3.5 0 0 1 0 7h-9a3.5 3.5 0 0 1 0-7z" /><path d="M11 6l-2.5 2.5L11 11" /></>,
  book: <><path d="M4.5 5.5c2.5-1 5-1 7.5.5v13c-2.5-1.5-5-1.5-7.5-.5zM19.5 5.5c-2.5-1-5-1-7.5.5v13c2.5-1.5 5-1.5 7.5-.5z" fill="currentColor" fillOpacity=".15" /></>,
  flag: <><path d="M6 20.5v-16" /><path d="M6 5.5c4-2 6 2 11 0v8c-5 2-7-2-11 0z" fill="currentColor" fillOpacity=".25" /></>,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? null}
    </svg>
  );
}

/** 작은 픽셀 그림 (로고, 도장 등에 써요) */
export function PixelArt({ rows, size, className }: { rows: string[]; size: number; className?: string }) {
  const { w, h, grid } = gridFromRows(rows);
  return (
    <svg className={className} width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      {grid.map((c, i) => (c === '.' ? null : <rect key={i} x={i % w} y={Math.floor(i / w)} width="1.02" height="1.02" fill={colorHex(c)} />))}
    </svg>
  );
}

export const LOGO_ROWS = [
  '.....Y....',
  '....PP....',
  '....PPP...',
  '...PPPP...',
  '...PPPPP..',
  '..YYYYYY..',
  '..PPPPPP..',
  'PPPPPPPPPP',
  '.PPPPPPPP.',
];

export const WIZARD_ROWS = [
  '....PP....',
  '...PPPP...',
  '..YYYYYY..',
  '.PPPPPPPP.',
  '..OOOOOO..',
  '..ODOODO..',
  '..OOOOOO..',
  '..BBBBBB..',
  '...BBBB...',
  '....BB....',
];
