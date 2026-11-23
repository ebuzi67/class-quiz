# 나율이의 달콤 수학 앱 아이콘을 math/yulmath/icons/에 만들어요.
# 꿀 색 바탕에 꿀벌 한 마리를 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/yulmath/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "math" / "yulmath" / "icons"

PIXELS = [
    "HHHHHHHHHHHHHHHH",
    "HHHHWWHHHWWHHHHH",
    "HHHWWWWHWWWWHHHH",
    "HHHWWWWHWWWWHHHH",
    "HHHHWWKKWWHHHHHH",
    "HHHHKKYYKYYKHHHH",
    "HHHKKKYYKYYKYHHH",
    "HHKKEKYYKYYKYKHH",
    "HHKKKKYYKYYKYYKH",
    "HHHKKKYYKYYKYHHH",
    "HHHHKKYYKYYKHHHH",
    "HHHHHHKHHKHHHHHH",
    "HHHHHHHHHHHHHHHH",
    "HHDDDDDDDDDDDDHH",
    "HHHDDDDDDDDDDHHH",
    "HHHHHHHHHHHHHHHH",
]
COLORS = {
    "H": (255, 214, 102), "W": (232, 246, 255), "K": (59, 42, 26),
    "Y": (242, 165, 22), "E": (255, 255, 255), "D": (201, 127, 0),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        assert len(row) == 16, y
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png")


if __name__ == "__main__":
    main()
