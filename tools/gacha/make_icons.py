# 가챠 뽑기 앱 아이콘을 gacha/icons/에 만들어요.
# 16x16 점 그림(빨간 뽑기 기계 + 알록달록 캡슐)을 크게 키워요.
# 실행: python3 tools/gacha/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "gacha" / "icons"

PIXELS = [
    "................",
    ".....WWWWWW.....",
    "...WWpWWWWyWW...",
    "..WWpppWWyyyWW..",
    "..WbbWWgggWWWW..",
    ".WbbbbWgggWrrrW.",
    ".WWbbWWWWWWrrrW.",
    "..WWWWWWWWWWWW..",
    "...RRRRRRRRRR...",
    "..RRRRRRRRRRRR..",
    "..RRYYYRRRDDRR..",
    "..RRYkYRRRDDRR..",
    "..RRYYYRRRRRRR..",
    "..RRRRRRRRRRRR..",
    "..DDDDDDDDDDDD..",
    "................",
]
BG = (255, 228, 236)
COLORS = {
    ".": BG, "W": (226, 244, 255), "p": (255, 120, 170), "y": (255, 210, 60),
    "b": (90, 170, 255), "g": (110, 210, 120), "r": (170, 120, 240),
    "R": (232, 72, 85), "D": (160, 40, 55), "Y": (255, 220, 90), "k": (120, 70, 20),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
