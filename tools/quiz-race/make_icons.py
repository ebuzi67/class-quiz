# 레이싱퀴즈 앱 아이콘을 quiz-race/icons/에 만들어요.
# 16x16 점 그림(빨간 카트 + 물음표 깃발)을 크게 키워요.
# 실행: python3 tools/quiz-race/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "quiz-race" / "icons"

PIXELS = [
    "................",
    "..kWkW..........",
    "..WkWk.YYYYY....",
    "..kWkW.YkkkY....",
    "..k....YYYkY....",
    "..k....YYkYY....",
    "..k......YY.....",
    "..k......kk.....",
    "....RRRRRR......",
    "...RRSSSSRR.....",
    "..RRRRRRRRRRR...",
    "..RRRRRRRRRRRR..",
    "..RRRRRRRRRRRR..",
    "...ddd....ddd...",
    "GGGdddGGGGdddGGG",
    "GGGGGGGGGGGGGGGG",
]
BG = (255, 248, 231)
COLORS = {
    ".": BG, "k": (45, 42, 38), "W": (255, 255, 255), "Y": (255, 213, 74),
    "R": (255, 107, 94), "S": (170, 220, 255), "d": (60, 56, 52), "G": (124, 207, 107),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        assert len(row) == 16, row
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
