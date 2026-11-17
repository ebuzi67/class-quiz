// 그림을 파일로 내보내요 (PNG, 스프라이트 시트, GIF)
import { EMPTY, Grid, PALETTE, PAPER_HEX, colorHex } from '../engine/types';
import { encodeGif } from './gif';

const cellSize = (size: number) => Math.max(8, Math.floor(384 / size));

function drawGrid(ctx: CanvasRenderingContext2D, grid: Grid, w: number, h: number, cell: number, ox = 0) {
  ctx.fillStyle = PAPER_HEX;
  ctx.fillRect(ox, 0, w * cell, h * cell);
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === EMPTY) continue;
    ctx.fillStyle = colorHex(grid[i]);
    ctx.fillRect(ox + (i % w) * cell, Math.floor(i / w) * cell, cell, cell);
  }
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('그림을 만들지 못했어요'))), 'image/png'));

export async function gridToPng(grid: Grid, w: number, h: number): Promise<Blob> {
  const cell = cellSize(Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = w * cell; c.height = h * cell;
  drawGrid(c.getContext('2d')!, grid, w, h, cell);
  return toBlob(c);
}

/** 프레임을 옆으로 나란히 붙인 그림 한 장 */
export async function framesToSpriteSheet(frames: Grid[], size: number): Promise<Blob> {
  const cell = Math.max(4, Math.floor(160 / size));
  const c = document.createElement('canvas');
  c.width = frames.length * size * cell; c.height = size * cell;
  const ctx = c.getContext('2d')!;
  frames.forEach((g, i) => drawGrid(ctx, g, size, size, cell, i * size * cell));
  return toBlob(c);
}

const hexToRgb = (hex: string): [number, number, number] =>
  [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export function framesToGif(frames: Grid[], size: number, fps: number, loop: boolean): Blob {
  const cell = Math.max(4, Math.floor(320 / size));
  const side = size * cell;
  const palette = [hexToRgb(PAPER_HEX), ...PALETTE.map((p) => hexToRgb(p.hex))];
  const indexOf = new Map(PALETTE.map((p, i) => [p.key, i + 1]));
  const data = frames.map((g) => {
    const px = new Uint8Array(side * side);
    for (let y = 0; y < side; y++) {
      const gy = Math.floor(y / cell) * size;
      for (let x = 0; x < side; x++) px[y * side + x] = indexOf.get(g[gy + Math.floor(x / cell)]) ?? 0;
    }
    return px;
  });
  const bytes = encodeGif({ width: side, height: side, palette, frames: data, delayCs: Math.round(100 / fps), loop });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 파일 이름에 쓸 수 없는 글자를 빼요 */
export const safeName = (name: string, fallback: string) =>
  (name.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || fallback).slice(0, 40);
