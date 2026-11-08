"""무브무브 놀이터 아이콘 만들기

파란 하늘 바탕에 노란 별을 향해 점프하는 사람과, 휘두른 손의 꼬리를 그려요.

  python3 tools/motion/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).parent.parent.parent / "motion" / "icons"


def star(d, cx, cy, r, fill):
    import math
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=fill)


def icon(size):
    s = size * 4
    img = Image.new("RGB", (s, s), "#3D9BFF")
    d = ImageDraw.Draw(img)
    for i in range(40):  # 위는 진하고 아래는 연한 하늘
        y = s * i / 40
        c = (61 + i * 3, 155 + i * 2, 255)
        d.rectangle([0, y, s, y + s / 40 + 1], fill=c)
    d.ellipse([-s * 0.3, s * 0.78, s * 0.75, s * 1.3], fill="#5CC46A")
    d.ellipse([s * 0.35, s * 0.82, s * 1.3, s * 1.35], fill="#46B35A")
    star(d, s * 0.76, s * 0.22, s * 0.13, "#FFD43B")
    # 휘두른 손의 꼬리
    for k, w in enumerate((0.05, 0.035, 0.02)):
        off = k * s * 0.035
        d.arc([s * 0.12 + off, s * 0.1 + off, s * 0.72 - off, s * 0.7 - off], 200, 300, fill="#FFFFFF", width=int(s * w))
    ink, w = "#1D2A44", int(s * 0.06)
    hx, hy, hr = s * 0.47, s * 0.3, s * 0.075
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill="#FF7A2F")
    neck, hip = (hx, hy + hr), (s * 0.5, s * 0.6)
    d.line([neck, hip], fill=ink, width=w)
    d.line([(hx, s * 0.44), (s * 0.3, s * 0.3), (s * 0.24, s * 0.16)], fill=ink, width=w, joint="curve")
    d.line([(hx, s * 0.44), (s * 0.64, s * 0.36), (s * 0.7, s * 0.24)], fill=ink, width=w, joint="curve")
    d.line([hip, (s * 0.38, s * 0.7), (s * 0.3, s * 0.82)], fill=ink, width=w, joint="curve")
    d.line([hip, (s * 0.62, s * 0.72), (s * 0.66, s * 0.86)], fill=ink, width=w, joint="curve")
    for x, y in ((s * 0.24, s * 0.16), (s * 0.7, s * 0.24)):
        r = s * 0.045
        d.ellipse([x - r, y - r, x + r, y + r], fill="#FFD43B", outline=ink, width=int(s * 0.012))
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (180, 192, 512):
        icon(size).save(OUT / f"icon-{size}.png", optimize=True)
    print("done:", OUT)
