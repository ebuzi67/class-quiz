// 길 찾기 (A* 알고리즘) — 바닥을 작은 칸으로 나누고, 가구가 있는 칸을 피해서 가요.
export class NavGrid {
  constructor({ minX = -3.9, maxX = 3.9, minZ = -2.9, maxZ = 2.9, cell = 0.2 } = {}) {
    Object.assign(this, { minX, maxX, minZ, maxZ, cell });
    this.cols = Math.round((maxX - minX) / cell) + 1;
    this.rows = Math.round((maxZ - minZ) / cell) + 1;
    this.blocked = new Uint8Array(this.cols * this.rows);
  }

  toCell(x, z) {
    return [
      Math.max(0, Math.min(this.cols - 1, Math.round((x - this.minX) / this.cell))),
      Math.max(0, Math.min(this.rows - 1, Math.round((z - this.minZ) / this.cell))),
    ];
  }

  toWorld(c, r) { return [this.minX + c * this.cell, this.minZ + r * this.cell]; }

  // 가운데 (x, z), 크기 w×d, 각도 rot(도) 인 네모를 막아요. inflate 만큼 넓게 막아요.
  block(x, z, w, d, rot = 0, inflate = 0.22) {
    const a = (rot * Math.PI) / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    const hw = w / 2 + inflate, hd = d / 2 + inflate;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const [wx, wz] = this.toWorld(c, r);
        const dx = wx - x, dz = wz - z;
        // 가구의 방향으로 돌려서 비교해요
        const lx = dx * cos - dz * sin;
        const lz = dx * sin + dz * cos;
        if (Math.abs(lx) <= hw && Math.abs(lz) <= hd) this.blocked[r * this.cols + c] = 1;
      }
    }
  }

  free(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows && !this.blocked[r * this.cols + c]; }

  isFree(x, z) { const [c, r] = this.toCell(x, z); return this.free(c, r); }

  nearestFree(x, z) {
    const [c0, r0] = this.toCell(x, z);
    if (this.free(c0, r0)) return [c0, r0];
    for (let rad = 1; rad < Math.max(this.cols, this.rows); rad++) {
      let best = null, bestD = Infinity;
      for (let r = r0 - rad; r <= r0 + rad; r++) {
        for (let c = c0 - rad; c <= c0 + rad; c++) {
          if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== rad || !this.free(c, r)) continue;
          const [wx, wz] = this.toWorld(c, r);
          const d = (wx - x) ** 2 + (wz - z) ** 2;
          if (d < bestD) { bestD = d; best = [c, r]; }
        }
      }
      if (best) return best;
    }
    return [c0, r0];
  }

  // 두 점 사이가 막힘 없이 이어지는지
  clearLine(ax, az, bx, bz) {
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(len / (this.cell * 0.4)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (!this.isFree(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }

  // from, to: [x, z]. 걸어갈 점 목록을 돌려줘요 (마지막 점은 정확히 to).
  findPath(from, to) {
    const [sc, sr] = this.nearestFree(from[0], from[1]);
    const [ec, er] = this.nearestFree(to[0], to[1]);
    const key = (c, r) => r * this.cols + c;
    const h = (c, r) => Math.hypot(c - ec, r - er);
    const g = new Float32Array(this.cols * this.rows).fill(Infinity);
    const came = new Int32Array(this.cols * this.rows).fill(-1);
    const closed = new Uint8Array(this.cols * this.rows);
    const open = [[h(sc, sr), sc, sr]];
    g[key(sc, sr)] = 0;
    let found = false;
    while (open.length) {
      // 가장 가까워 보이는 칸부터 (칸 수가 적어서 정렬로 충분해요)
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [, c, r] = open.splice(bi, 1)[0];
      const k = key(c, r);
      if (closed[k]) continue;
      closed[k] = 1;
      if (c === ec && r === er) { found = true; break; }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = c + dc, nr = r + dr;
          if (!this.free(nc, nr)) continue;
          if (dc && dr && (!this.free(c + dc, r) || !this.free(c, r + dr))) continue; // 모서리 가로지르기 금지
          const nk = key(nc, nr);
          const ng = g[k] + (dc && dr ? Math.SQRT2 : 1);
          if (ng < g[nk]) { g[nk] = ng; came[nk] = k; open.push([ng + h(nc, nr), nc, nr]); }
        }
      }
    }
    let cells = [];
    if (found) {
      for (let k = key(ec, er); k !== -1; k = came[k]) cells.push([k % this.cols, Math.floor(k / this.cols)]);
      cells.reverse();
    }
    const pts = [from, ...cells.map(([c, r]) => this.toWorld(c, r)), to];
    // 필요 없는 꺾임을 줄여요
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.clearLine(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--;
      out.push(pts[j]);
      i = j;
    }
    return out.slice(1).filter((p, idx, arr) => idx === arr.length - 1 || Math.hypot(p[0] - arr[arr.length - 1][0], p[1] - arr[arr.length - 1][1]) > 0.05);
  }
}
