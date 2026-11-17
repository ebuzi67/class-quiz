// 아주 작은 GIF89a 인코더. 팔레트 색만 쓰는 픽셀 그림 전용이에요.

function lzw(minCode: number, data: Uint8Array): number[] {
  const out: number[] = [];
  let cur = 0;
  let bits = 0;
  const clear = 1 << minCode;
  const eoi = clear + 1;
  let next = eoi + 1;
  let size = minCode + 1;
  let table = new Map<number, number>();
  const emit = (code: number) => {
    cur |= code << bits;
    bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  emit(clear);
  let prefix = data[0];
  for (let i = 1; i < data.length; i++) {
    const k = data[i];
    const key = (prefix << 8) | k;
    const found = table.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    if (next === 4096) {
      emit(clear);
      next = eoi + 1;
      size = minCode + 1;
      table = new Map();
    } else {
      if (next >= 1 << size) size++;
      table.set(key, next++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

export interface GifOptions {
  width: number;
  height: number;
  /** [r,g,b] 색 목록 (최대 256개) */
  palette: [number, number, number][];
  /** 프레임마다 팔레트 번호가 width*height개 */
  frames: Uint8Array[];
  /** 프레임 하나를 보여 주는 시간 (1/100초) */
  delayCs: number;
  loop: boolean;
}

export function encodeGif(o: GifOptions): Uint8Array {
  let bitsPerColor = 1;
  while (1 << bitsPerColor < o.palette.length) bitsPerColor++;
  const tableSize = 1 << bitsPerColor;
  const minCode = Math.max(2, bitsPerColor);
  const b: number[] = [];
  const u16 = (n: number) => b.push(n & 255, (n >> 8) & 255);
  const str = (s: string) => { for (const ch of s) b.push(ch.charCodeAt(0)); };

  str('GIF89a');
  u16(o.width); u16(o.height);
  b.push(0x80 | 0x70 | (bitsPerColor - 1), 0, 0);
  for (let i = 0; i < tableSize; i++) b.push(...(o.palette[i] ?? [0, 0, 0]));
  if (o.loop) {
    b.push(0x21, 0xff, 11); str('NETSCAPE2.0'); b.push(3, 1); u16(0); b.push(0);
  }
  for (const frame of o.frames) {
    b.push(0x21, 0xf9, 4, 0x04); u16(o.delayCs); b.push(0, 0);
    b.push(0x2c); u16(0); u16(0); u16(o.width); u16(o.height); b.push(0);
    b.push(minCode);
    const bytes = lzw(minCode, frame);
    for (let i = 0; i < bytes.length; i += 255) {
      const chunk = bytes.slice(i, i + 255);
      b.push(chunk.length, ...chunk);
    }
    b.push(0);
  }
  b.push(0x3b);
  return new Uint8Array(b);
}
