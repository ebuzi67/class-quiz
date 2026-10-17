"""로블록스 퀴즈 앱 만들기

아이가 제미나이로 만든 두 퀴즈(*.original.html, 구글 Apps Script에서 받은 그대로)에
앱으로 쓰는 데 필요한 것만 끼워 넣어서 roblox/ 아래에 저장해요.
퀴즈 문제와 화면 디자인은 바꾸지 않아요.

  python3 tools/roblox/build.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "roblox"

GAMES = {
    "tower-defense": "#0070f3",
    "jump-map": "#ff5722",
}

HEAD = """    <link rel="manifest" href="../manifest.json">
    <meta name="theme-color" content="{color}">
    <link rel="icon" href="../icons/icon-192.png">
    <link rel="apple-touch-icon" href="../icons/icon-180.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="로블록스 퀴즈">
    <style>
        .back {{ display: inline-block; margin-bottom: 6px; color: #666; font-size: 14px; text-decoration: none; }}
        .back:hover {{ color: var(--primary-color); }}
    </style>
</head>"""

BACK = '<div class="container">\n    <a class="back" href="../">← 퀴즈 고르기</a>'

SW = """    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => navigator.serviceWorker.register("../sw.js").catch(() => {}));
    }
</script>"""


def replace_once(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new)


def build_game(name, color):
    html = (HERE / f"{name}.original.html").read_text(encoding="utf-8")
    html = replace_once(html, "</head>", HEAD.format(color=color))
    html = replace_once(html, '<div class="container">', BACK)
    html = replace_once(html, "</script>", SW)
    (OUT / name).mkdir(parents=True, exist_ok=True)
    (OUT / name / "index.html").write_text(html, encoding="utf-8")


def build_icon(size):
    # 파란 바탕에 기울어진 블록 두 개: 로블록스 느낌의 네모 블록 아이콘
    s = size * 4
    img = Image.new("RGB", (s, s), "#1f6feb")
    d = ImageDraw.Draw(img)
    d.rectangle([0, s * 0.62, s, s], fill="#ff5722")

    def block(cx, cy, half, angle, fill, hole):
        import math
        a = math.radians(angle)
        pts = []
        for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            x, y = dx * half, dy * half
            pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
        d.polygon(pts, fill=fill)
        if hole:
            hpts = [(cx + (x - cx) * 0.3, cy + (y - cy) * 0.3) for x, y in pts]
            d.polygon(hpts, fill=hole)

    block(s * 0.5, s * 0.42, s * 0.24, 15, "#ffffff", "#1f2937")
    block(s * 0.78, s * 0.76, s * 0.09, -12, "#ffd54f", None)
    block(s * 0.22, s * 0.8, s * 0.07, 20, "#ffd54f", None)
    img = img.resize((size, size), Image.LANCZOS)
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    img.save(OUT / "icons" / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    for name, color in GAMES.items():
        build_game(name, color)
    for size in (180, 192, 512):
        build_icon(size)
    print("done:", OUT)
