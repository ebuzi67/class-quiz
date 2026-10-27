# 꼬마 발명가 마을 앱 아이콘을 village/icons/에 만들어요.
# 픽셀 그림(잔디 위 빨간 지붕 집 + 톱니바퀴 간판)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/village/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "village" / "icons"

PIXELS = [
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGRRRRGGGGGG",
    "GGGGGRRYYRRGGGGG",
    "GGGGRRYOOYRRGGGG",
    "GGGRRRRYYRRRRGGG",
    "GGRRRRRRRRRRRRGG",
    "GDDDDDDDDDDDDDDG",
    "GGWWWWWWWWWWWWGG",
    "GGWBBWWddWWBBWGG",
    "GGWBBWWddWWBBWGG",
    "GGWWWWWdkWWWWWGG",
    "GGWWWWWddWWWWWGG",
    "GgggggPPPPgggggG",
    "GGgGGGPPPPGGGgGG",
    "GGGGGGPPPPGGGGGG",
]
COLORS = {
    "G": (143, 209, 106), "g": (121, 191, 85), "R": (224, 122, 95), "D": (184, 92, 68),
    "Y": (255, 243, 214), "O": (122, 74, 42), "W": (243, 217, 168), "B": (159, 220, 242),
    "d": (176, 106, 58), "k": (255, 215, 106), "P": (236, 202, 140),
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
