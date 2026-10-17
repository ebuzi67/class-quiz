import math

ORANGE = "#E8590C"
BLUE = "#1971C2"
INK = "#222"
GRAY = "#888"

def foot(a, p, q):
    ax, ay = a; px, py = p; qx, qy = q
    dx, dy = qx - px, qy - py
    t = ((ax - px) * dx + (ay - py) * dy) / (dx * dx + dy * dy)
    return (px + t * dx, py + t * dy)

def rot(pt, deg):
    r = math.radians(deg); x, y = pt
    return (x * math.cos(r) - y * math.sin(r), x * math.sin(r) + y * math.cos(r))

def unit(v):
    l = math.hypot(*v); return (v[0] / l, v[1] / l)

def fig(pts, sides, heights=(), exts=(), lens=None, hi=None, hcolor=None,
        right=(), deg=0, w=260, h=190, fill="#EAF4E4", footlabels=True, extra_right=(), nudge=None):
    nudge = nudge or {}
    """pts: name->(x,y) math coords.  heights: (apex, base_p, base_q, footname).
    exts: (from_name, to_name) dotted extension lines.  lens: {(a,b): (text, side)}"""
    lens = lens or {}
    hi = hi or {}
    P = {k: rot(v, deg) for k, v in pts.items()}
    tri = [P[k] for k in sides[0]]  # first item = the triangle vertex order
    H = []
    for apex, bp, bq, fname in heights:
        f = foot(P[apex], P[bp], P[bq])
        P[fname] = f
        H.append((apex, fname, bp, bq))
    xs = [p[0] for p in P.values()]; ys = [p[1] for p in P.values()]
    pad = 34
    s = min((w - 2 * pad) / (max(xs) - min(xs) or 1), (h - 2 * pad) / (max(ys) - min(ys) or 1))
    ox = (w - s * (max(xs) - min(xs))) / 2; oy = (h - s * (max(ys) - min(ys))) / 2
    def T(p):
        return (ox + (p[0] - min(xs)) * s, h - (oy + (p[1] - min(ys)) * s))
    S = {k: T(v) for k, v in P.items()}
    cx = sum(S[k][0] for k in sides[0]) / 3; cy = sum(S[k][1] for k in sides[0]) / 3
    out = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">']
    poly = " ".join(f"{S[k][0]:.1f},{S[k][1]:.1f}" for k in sides[0])
    out.append(f'<polygon points="{poly}" fill="{fill}" stroke="none"/>')
    for a, b in exts:
        out.append(f'<line x1="{S[a][0]:.1f}" y1="{S[a][1]:.1f}" x2="{S[b][0]:.1f}" y2="{S[b][1]:.1f}" stroke="{GRAY}" stroke-width="1.4" stroke-dasharray="2 3"/>')
    vs = sides[0]
    for i in range(3):
        a, b = vs[i], vs[(i + 1) % 3]
        col = hi.get(frozenset((a, b)))
        sw = 4 if col else 1.8
        out.append(f'<line x1="{S[a][0]:.1f}" y1="{S[a][1]:.1f}" x2="{S[b][0]:.1f}" y2="{S[b][1]:.1f}" stroke="{col or INK}" stroke-width="{sw}" stroke-linecap="round"/>')
    def rmark(f, toward_apex, toward_base, col):
        u = unit((toward_apex[0] - f[0], toward_apex[1] - f[1]))
        v = unit((toward_base[0] - f[0], toward_base[1] - f[1]))
        k = 9
        p1 = (f[0] + k * v[0], f[1] + k * v[1]); p3 = (f[0] + k * u[0], f[1] + k * u[1])
        p2 = (p1[0] + k * u[0], p1[1] + k * u[1])
        out.append(f'<polyline points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" fill="none" stroke="{col}" stroke-width="1.3"/>')
    for apex, fn, bp, bq in H:
        col = hcolor or INK
        out.append(f'<line x1="{S[apex][0]:.1f}" y1="{S[apex][1]:.1f}" x2="{S[fn][0]:.1f}" y2="{S[fn][1]:.1f}" stroke="{col}" stroke-width="{2.6 if hcolor else 1.5}" stroke-dasharray="6 4"/>')
        # base direction: toward whichever base endpoint is farther from foot
        da = math.dist(S[fn], S[bp]); db = math.dist(S[fn], S[bq])
        tb = S[bp] if da > db else S[bq]
        rmark(S[fn], S[apex], tb, col)
    for v0, a, b in right:  # right angle at existing vertex v0 between a and b
        rmark(S[v0], S[a], S[b], INK)
    # vertex labels
    for k in vs:
        d = unit((S[k][0] - cx, S[k][1] - cy))
        nx, ny = nudge.get(k, (0, 0))
        out.append(f'<text x="{S[k][0] + d[0] * 15 + nx:.1f}" y="{S[k][1] + d[1] * 15 + 5 + ny:.1f}" font-size="15" text-anchor="middle" fill="{INK}">{k}</text>')
    if footlabels:
        for apex, fn, bp, bq in H:
            d = unit((S[fn][0] - S[apex][0], S[fn][1] - S[apex][1]))
            # also push away from base direction a bit
            nx, ny = nudge.get(fn, (0, 0))
            out.append(f'<text x="{S[fn][0] + d[0] * 15 + nx:.1f}" y="{S[fn][1] + d[1] * 15 + 5 + ny:.1f}" font-size="15" text-anchor="middle" fill="{INK}">{fn}</text>')
    for (a, b), spec in lens.items():
        txt, side = spec[0], spec[1]
        t = spec[2] if len(spec) > 2 else 0.5
        m = (S[a][0] + (S[b][0] - S[a][0]) * t, S[a][1] + (S[b][1] - S[a][1]) * t)
        n = unit((-(S[b][1] - S[a][1]), S[b][0] - S[a][0]))
        if side == "auto":
            if (m[0] + n[0] - cx) ** 2 + (m[1] + n[1] - cy) ** 2 < (m[0] - cx) ** 2 + (m[1] - cy) ** 2:
                n = (-n[0], -n[1])
            side = 1
        off = 16 * side
        x, y = m[0] + n[0] * off, m[1] + n[1] * off + 5
        col = BLUE if txt.startswith("□") else INK
        out.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="13.5" text-anchor="middle" fill="{col}" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="4">{txt}</text>')
    out.append("</svg>")
    return "".join(out)
