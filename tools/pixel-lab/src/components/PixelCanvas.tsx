// 픽셀 도화지. 실행 엔진이 알려 준 결과(그림, 펜 위치)를 그대로 보여 줘요.
import { PointerEvent, useRef } from 'react';
import { EMPTY, Grid, PAPER_HEX, colorHex, colorName } from '../engine/types';


interface Props {
  w: number;
  h: number;
  grid: Grid;
  pen?: { x: number; y: number; color: string; error?: boolean } | null;
  /** 겹쳐 보여 줄 그림 (목표 그림 또는 앞 프레임) */
  ghost?: Grid | null;
  ghostStyle?: 'dots' | 'onion';
  /** 목표와 다른 칸 번호 */
  wrong?: number[];
  /** 손으로 찍을 수 있을 때 불려요 */
  onPaint?: (index: number, first: boolean) => void;
  onPaintEnd?: () => void;
  label?: string;
}

export function PixelCanvas({ w, h, grid, pen, ghost, ghostStyle = 'dots', wrong, onPaint, onPaintEnd, label }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const last = useRef(-1);
  // 도화지의 긴 쪽이 늘 80이 되게 해서, 칸 수가 달라도 액자와 펜 굵기가 같아 보여요
  const C = 80 / Math.max(w, h);
  const G = 7; // 숫자 자리
  const F = 4; // 액자 두께
  const R = Math.min(1.7, C * 0.17);
  const S = Math.max(0.62, Math.min(1.15, C / 10)); // 마법 펜 크기
  const W = w * C;
  const H = h * C;
  const fs = Math.min(4.6, C * 0.62);

  const cellAt = (e: PointerEvent) => {
    const svg = ref.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return -1;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const x = Math.floor(pt.x / C);
    const y = Math.floor(pt.y / C);
    return x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x;
  };
  const down = (e: PointerEvent) => {
    if (!onPaint) return;
    const i = cellAt(e);
    if (i < 0) return;
    drawing.current = true;
    last.current = i;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onPaint(i, true);
  };
  const move = (e: PointerEvent) => {
    if (!onPaint || !drawing.current) return;
    const i = cellAt(e);
    if (i < 0 || i === last.current) return;
    last.current = i;
    onPaint(i, false);
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onPaintEnd?.();
  };

  const wrongSet = new Set(wrong ?? []);
  return (
    <svg
      ref={ref}
      className={'pcanvas' + (onPaint ? ' editable' : '')}
      viewBox={`${-G - F} ${-G - F} ${W + G + F * 2} ${H + G + F * 2}`}
      role="img"
      aria-label={label ?? '픽셀 도화지'}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <defs>
        <pattern id="hatch" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1" height="2.5" fill="#b4513f" opacity=".4" />
        </pattern>
      </defs>
      {/* 액자 */}
      <rect x={-G - F + 0.6} y={-G - F + 0.6} width={W + G + F * 2 - 1.2} height={H + G + F * 2 - 1.2} rx="7" className="pc-frame" />
      <rect x={-G - F + 2.6} y={-G - F + 2.6} width={W + G + F * 2 - 5.2} height={H + G + F * 2 - 5.2} rx="5.4" className="pc-frame-in" />
      <rect x={-1.2} y={-1.2} width={W + 2.4} height={H + 2.4} rx="2.4" fill={PAPER_HEX} className="pc-paper" />
      {/* 좌표 숫자 */}
      <g className="pc-coords" fontSize={fs} textAnchor="middle">
        {Array.from({ length: w }, (_, x) => (
          <text key={'x' + x} x={x * C + C / 2} y={-2.6} className={pen && pen.x === x ? 'on' : ''}>{x}</text>
        ))}
        {Array.from({ length: h }, (_, y) => (
          <text key={'y' + y} x={-4} y={y * C + C / 2 + fs * 0.36} className={pen && pen.y === y ? 'on' : ''}>{y}</text>
        ))}
      </g>
      {/* 눈금 */}
      <g className="pc-lines">
        {Array.from({ length: w - 1 }, (_, i) => <line key={'v' + i} x1={(i + 1) * C} y1="0" x2={(i + 1) * C} y2={H} />)}
        {Array.from({ length: h - 1 }, (_, i) => <line key={'h' + i} x1="0" y1={(i + 1) * C} x2={W} y2={(i + 1) * C} />)}
      </g>
      {/* 앞 프레임 비춰 보기 */}
      {ghost && ghostStyle === 'onion' && ghost.map((c, i) => (c === EMPTY || grid[i] !== EMPTY ? null : (
        <rect key={'o' + i} x={(i % w) * C + 0.5} y={Math.floor(i / w) * C + 0.5} width={C - 1} height={C - 1} rx={R} fill={colorHex(c)} opacity=".3" />
      )))}
      {/* 칠한 칸 */}
      {grid.map((c, i) => (c === EMPTY ? null : (
        <rect key={i} className="pc-cell" x={(i % w) * C + 0.45} y={Math.floor(i / w) * C + 0.45} width={C - 0.9} height={C - 0.9} rx={R} fill={colorHex(c)}>
          <title>{`(${i % w}, ${Math.floor(i / w)}) ${colorName(c)}`}</title>
        </rect>
      )))}
      {/* 목표 그림 비춰 보기: 아직 다른 칸에 작은 점 */}
      {ghost && ghostStyle === 'dots' && ghost.map((c, i) => (c === grid[i] || c === EMPTY ? null : (
        <circle key={'g' + i} className="pc-ghost" cx={(i % w) * C + C / 2} cy={Math.floor(i / w) * C + C / 2} r={Math.min(1.9, C * 0.2)} fill={colorHex(c)} />
      )))}
      {/* 목표와 다른 칸: 빗금 + 점선 */}
      {[...wrongSet].map((i) => (
        <g key={'w' + i} className="pc-wrong">
          <rect x={(i % w) * C + 0.8} y={Math.floor(i / w) * C + 0.8} width={C - 1.6} height={C - 1.6} rx={R} fill="url(#hatch)" />
          <rect x={(i % w) * C + 0.8} y={Math.floor(i / w) * C + 0.8} width={C - 1.6} height={C - 1.6} rx={R} className="pc-wrong-line" />
        </g>
      ))}
      {/* 마법 펜 */}
      {pen && (
        <g className={'pc-pen' + (pen.error ? ' error' : '')} style={{ transform: `translate(${pen.x * C}px, ${pen.y * C}px)` }}>
          <rect x="-0.4" y="-0.4" width={C + 0.8} height={C + 0.8} rx={R + 0.5} className="pc-pen-halo" />
          <rect x="-0.4" y="-0.4" width={C + 0.8} height={C + 0.8} rx={R + 0.5} className="pc-pen-ring" />
          <g transform={`translate(${C / 2} ${C / 2}) scale(${S})`}>
            <g className="pc-wand">
              <line x1="0" y1="0" x2="5.6" y2="-5.6" className="pc-wand-stick-bg" />
              <line x1="0" y1="0" x2="5.6" y2="-5.6" className="pc-wand-stick" />
              <circle cx="0" cy="0" r="1.7" fill={colorHex(pen.color)} className="pc-wand-tip" />
              <path d="M6.3 -8.8l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" className="pc-wand-star" />
            </g>
          </g>
        </g>
      )}
    </svg>
  );
}

/** 작은 미리보기 그림 */
export function PixelThumb({ w, h, grid, className, lines }: { w: number; h: number; grid: Grid; className?: string; lines?: boolean }) {
  return (
    <svg className={'pthumb ' + (className ?? '')} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={w} height={h} fill={PAPER_HEX} />
      {grid.map((c, i) => (c === EMPTY ? null : <rect key={i} x={i % w} y={Math.floor(i / w)} width="1.03" height="1.03" fill={colorHex(c)} />))}
      {lines && (
        <g stroke="#5a4636" strokeOpacity=".22" strokeWidth=".04" shapeRendering="geometricPrecision">
          {Array.from({ length: w - 1 }, (_, i) => <line key={'v' + i} x1={i + 1} y1="0" x2={i + 1} y2={h} />)}
          {Array.from({ length: h - 1 }, (_, i) => <line key={'h' + i} x1="0" y1={i + 1} x2={w} y2={i + 1} />)}
        </g>
      )}
    </svg>
  );
}
