# 로마 탐방 앱 아이콘을 rome/icons/에 만들어요.
# 픽셀 그림(하늘 아래 콜로세움 + 이탈리아 국기 색 띠)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/rome/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "europe" / "rome" / "icons"

PIXELS = [
    "SSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSSSS",
    "SSSCCCCCCCSSSSSS",
    "SSCCCCCCCCCCSSSS",
    "SCCdCdCdCdCCCSSS",
    "SCCCCCCCCCCCCCSS",
    "CCdCdCdCdCdCdCCS",
    "CCdCdCdCdCdCdCCC",
    "CCCCCCCCCCCCCCCC",
    "CdCdCdCdCdCdCdCC",
    "CdCdCdCdCdCdCdCC",
    "CCCCCCCCCCCCCCCC",
    "gggggggggggggggg",
    "GGGGGWWWWWRRRRRR",
    "GGGGGWWWWWRRRRRR",
]
COLORS = {
    "S": (190, 218, 236), "C": (216, 199, 164), "d": (90, 76, 60), "g": (196, 187, 144),
    "G": (0, 146, 70), "W": (255, 255, 255), "R": (206, 43, 55),
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
