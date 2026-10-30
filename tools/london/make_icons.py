# 런던 탐방 앱 아이콘을 london/icons/에 만들어요.
# 픽셀 그림(하늘 위 빅벤 시계탑 + 빨간 2층 버스)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/london/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "london" / "icons"

PIXELS = [
    "SSSSSSSGSSSSSSSS",
    "SSSSSSSGSSSSSSSS",
    "SSSSSSDDDSSSSSSS",
    "SSSSSDDDDDSSSSSS",
    "SSSSSTTTTTSSSSSS",
    "SSSSSTWWWTSSSSSS",
    "SSSSSTWkWTSSSSSS",
    "SSSSSTWWWTSSSSSS",
    "SSSSSTTTTTSSSSSS",
    "SSSSSTtTtTSSSSSS",
    "SRRRRRRRRRRRRRSS",
    "SRBBRBBRBBRBBRSS",
    "SRRRRRRRRRRRRRSS",
    "SRBBRBBRBBRBBRSS",
    "SRRRRRRRRRRRRRSS",
    "ggKKggggggKKgggg",
]
COLORS = {
    "S": (176, 214, 234), "G": (217, 165, 33), "D": (59, 74, 70), "T": (205, 178, 122), "t": (150, 125, 80),
    "W": (251, 246, 230), "k": (44, 58, 72), "R": (200, 16, 46), "B": (43, 52, 64), "K": (27, 27, 27),
    "g": (120, 120, 128),
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
