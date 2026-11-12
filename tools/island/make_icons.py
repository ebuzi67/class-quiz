# 몽글몽글 섬 앱 아이콘을 island/icons/에 만들어요.
# 픽셀 그림(바다 위 작은 섬과 야자수)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/island/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "island" / "icons"

PIXELS = [
    "SSSSSSSSSSSSSSSS",
    "SSSSSSSSSSSYYSSS",
    "SSWWSSSSSSYYYYSS",
    "SWWWWSLLSSYYYYSS",
    "SSSSSLLLLLSYYSSS",
    "SSSSLLLTLLLLSSSS",
    "SSSLLSSTSSLLSSSS",
    "SSSLSSSTSSSLSSSS",
    "SSSSSSSTTSSSSSSS",
    "SSSSSSSSTSSSSSSS",
    "BBBBBGGGTGGPBBBB",
    "BBBGGGGGGGGGGBBB",
    "BBDDGGGGGGGGDDBB",
    "BwwDDDDDDDDDDwwB",
    "BBBwwwwwwwwwwBBB",
    "BBBBBBBBBBBBBBBB",
]
COLORS = {
    "S": (159, 220, 245), "W": (255, 255, 255), "Y": (255, 216, 77), "L": (76, 175, 96), "T": (154, 106, 64),
    "B": (73, 166, 224), "G": (139, 208, 107), "P": (255, 143, 177), "D": (247, 228, 172), "w": (190, 232, 250),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        assert len(row) == 16, (y, row)
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
