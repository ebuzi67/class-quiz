import { describe, expect, it } from 'vitest';
import { encodeGif } from './gif';

// 테스트용 GIF 풀기: 인코더가 만든 LZW 자료를 다시 픽셀로 돌려 봐요.
function decodeFrames(bytes: Uint8Array) {
  let p = 6;
  const w = bytes[p] | (bytes[p + 1] << 8);
  const h = bytes[p + 2] | (bytes[p + 3] << 8);
  const flags = bytes[p + 4];
  p += 7 + 3 * (1 << ((flags & 7) + 1));
  const frames: number[][] = [];
  while (bytes[p] !== 0x3b) {
    if (bytes[p] === 0x21) {
      p += 2;
      while (bytes[p] !== 0) p += bytes[p] + 1;
      p++;
      continue;
    }
    if (bytes[p] !== 0x2c) throw new Error('알 수 없는 블록 ' + bytes[p]);
    p += 10;
    const minCode = bytes[p++];
    const data: number[] = [];
    while (bytes[p] !== 0) { for (let i = 1; i <= bytes[p]; i++) data.push(bytes[p + i]); p += bytes[p] + 1; }
    p++;
    const clear = 1 << minCode, eoi = clear + 1;
    let size = minCode + 1, dict: number[][] = [], prev: number[] | null = null, cur = 0, bits = 0;
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict.push([i]); dict.push([], []); size = minCode + 1; prev = null; };
    reset();
    const out: number[] = [];
    for (const byte of data) {
      cur |= byte << bits; bits += 8;
      while (bits >= size) {
        const code = cur & ((1 << size) - 1); cur >>>= size; bits -= size;
        if (code === clear) { reset(); continue; }
        if (code === eoi) break;
        let entry: number[];
        if (code < dict.length) entry = dict[code];
        else if (prev) entry = [...prev, prev[0]];
        else throw new Error('잘못된 코드');
        out.push(...entry);
        if (prev && dict.length < 4096) dict.push([...(prev as number[]), entry[0]]);
        if (dict.length === 1 << size && size < 12) size++;
        prev = entry;
      }
    }
    frames.push(out);
  }
  return { w, h, frames };
}

describe('GIF 인코더', () => {
  it('만든 GIF를 다시 풀면 같은 그림이 나와요', () => {
    const w = 96, h = 96;
    const palette = Array.from({ length: 13 }, (_, i) => [i * 20, 255 - i * 20, i * 7] as [number, number, number]);
    const mk = (seed: number) => {
      const f = new Uint8Array(w * h);
      let s = seed;
      for (let i = 0; i < f.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; f[i] = Math.floor(i / 7) % 3 === 0 ? (s >> 8) % 13 : (Math.floor(i / 50) + seed) % 13; }
      return f;
    };
    const frames = [mk(1), mk(2), new Uint8Array(w * h).fill(5), mk(99)];
    const bytes = encodeGif({ width: w, height: h, palette, frames, delayCs: 25, loop: true });
    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a');
    const d = decodeFrames(bytes);
    expect([d.w, d.h, d.frames.length]).toEqual([w, h, 4]);
    d.frames.forEach((f, i) => expect(f).toEqual(Array.from(frames[i])));
  });
});
