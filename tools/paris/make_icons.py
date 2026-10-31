# 파리 탐방 앱 아이콘을 paris/icons/에 만들어요.
# 픽셀 그림(하늘 위 에펠탑 + 프랑스 국기 색 띠)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/paris/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "paris" / "icons"

PIXELS = [
    "SSSSSSSrSSSSSSSS",
    "SSSSSSSESSSSSSSS",
    "SSSSSSSESSSSSSSS",
    "SSSSSSEEESSSSSSS",
    "SSSSSSEEESSSSSSS",
    "SSSSSSEEESSSSSSS",
    "SSSSSEEEEESSSSSS",
    "SSSSEEEEEEESSSSS",
    "SSSSSEESEESSSSSS",
    "SSSSEESSSEESSSSS",
    "SSSEEEEEEEEESSSS",
    "SSSEESSSSSEESSSS",
    "SSEESSSSSSSEESSS",
    "SEESSSSSSSSSEESS",
    "BBBBBWWWWWRRRRRR",
    "BBBBBWWWWWRRRRRR",
]
COLORS = {
    "S": (190, 218, 236), "E": (123, 98, 72), "r": (255, 59, 48),
    "B": (0, 85, 164), "W": (255, 255, 255), "R": (239, 65, 53),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png")


if __name__ == "__main__":
    main()
