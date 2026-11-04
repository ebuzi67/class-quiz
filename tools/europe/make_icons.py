# 유럽 탐방 모음 페이지 앱 아이콘을 europe/icons/에 만들어요.
# 픽셀 그림(하늘색 바탕의 지구본과 노란 별 고리)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/europe/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "europe" / "icons"

PIXELS = [
    "SSSSSSSYSSSSSSSS",
    "SSSYSSSSSSSYSSSS",
    "SSSSSBBBBBSSSSSS",
    "SSSSBBGGBBBSSSSS",
    "SYSBBGGGGBBBSYSS",
    "SSSBBBGGGGBBSSSS",
    "SSBBBBBGGBBBBSSS",
    "SSBGGBBBBBBGBSSS",
    "SSBGGGBBBBGGBSSS",
    "SSSBGGBBBGGBSSSS",
    "SYSBBBBBGGBBSYSS",
    "SSSSBBBBBBBSSSSS",
    "SSSSSBBBBBSSSSSS",
    "SSSYSSSSSSSYSSSS",
    "SSSSSSSYSSSSSSSS",
    "SSSSSSSSSSSSSSSS",
]
COLORS = {"S": (31, 61, 122), "Y": (255, 214, 64), "B": (95, 170, 220), "G": (110, 180, 90)}


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
