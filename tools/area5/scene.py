import math
INK = "#222"; GRAY = "#888"; ORANGE = "#E8590C"; BLUE = "#1971C2"; GREEN = "#EAF4E4"; SHADE = "#B7D9A8"

def unit(v):
    l = math.hypot(*v); return (v[0] / l, v[1] / l)

def scene(items, w=260, h=180, pad=30, scale=None):
    pts = []
    for it in items:
        k = it[0]
        if k == "poly": pts += it[1]
        elif k in ("seg", "lab"): pts += [it[1], it[2]]
        elif k == "grid": pts += [(it[1], it[2]), (it[3], it[4])]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    sx = max(xs) - min(xs) or 1; sy = max(ys) - min(ys) or 1
    s = scale or min((w - 2 * pad) / sx, (h - 2 * pad) / sy)
    ox = (w - s * sx) / 2; oy = (h - s * sy) / 2
    T = lambda p: (ox + (p[0] - min(xs)) * s, h - (oy + (p[1] - min(ys)) * s))
    o = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">']
    for it in items:
        k = it[0]; opt = it[-1] if isinstance(it[-1], dict) else {}
        if k == "grid":
            x0, y0, x1, y1 = it[1:5]
            for x in range(x0, x1 + 1):
                a, b = T((x, y0)), T((x, y1))
                o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#ccc" stroke-width="0.8"/>')
            for y in range(y0, y1 + 1):
                a, b = T((x0, y)), T((x1, y))
                o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#ccc" stroke-width="0.8"/>')
        elif k == "poly":
            P = " ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in it[1])
            o.append(f'<polygon points="{P}" fill="{opt.get("fill", GREEN)}" stroke="{opt.get("stroke", INK)}" stroke-width="{opt.get("sw", 1.8)}" stroke-linejoin="round"/>')
        elif k == "seg":
            a, b = T(it[1]), T(it[2])
            dash = opt.get("dash", "")
            da = f' stroke-dasharray="{dash}"' if dash else ""
            o.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{opt.get("color", INK)}" stroke-width="{opt.get("sw", 1.5)}" stroke-linecap="round"{da}/>')
        elif k == "right":  # corner, toward a, toward b
            c, a, b = T(it[1]), T(it[2]), T(it[3])
            u = unit((a[0] - c[0], a[1] - c[1])); v = unit((b[0] - c[0], b[1] - c[1])); q = 8
            p1 = (c[0] + q * u[0], c[1] + q * u[1]); p3 = (c[0] + q * v[0], c[1] + q * v[1]); p2 = (p1[0] + q * v[0], p1[1] + q * v[1])
            o.append(f'<polyline points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" fill="none" stroke="{opt.get("color", INK)}" stroke-width="1.3"/>')
        elif k == "text":
            p = T(it[1])
            o.append(f'<text x="{p[0] + opt.get("dx", 0):.1f}" y="{p[1] + opt.get("dy", 0) + 5:.1f}" font-size="{opt.get("size", 14)}" text-anchor="middle" fill="{opt.get("color", INK)}" font-weight="{opt.get("weight", 400)}">{it[2]}</text>')
        elif k == "lab":  # segment a,b ; text ; side(+1 left of a->b in screen) ; t
            a, b = T(it[1]), T(it[2]); txt = it[3]
            side = opt.get("side", 1); t = opt.get("t", 0.5); off = opt.get("off", 15)
            m = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            n = unit((b[1] - a[1], -(b[0] - a[0])))
            col = opt.get("color", BLUE if "□" in txt else INK)
            o.append(f'<text x="{m[0] + n[0] * off * side:.1f}" y="{m[1] + n[1] * off * side + 5:.1f}" font-size="13.5" text-anchor="middle" fill="{col}" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="4">{txt}</text>')
    o.append("</svg>")
    return "".join(o)
