# 전체 메뉴(사이트 맨 앞 페이지) 앱 아이콘을 icons/에 만들어요.
# 픽셀 그림(남색 바탕에 알록달록한 앱 아홉 칸)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/home/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "icons"

PIXELS = [
    "NNNNNNNNNNNNNNNN",
    "NRRRRNYYYYNGGGGN",
    "NRRRRNYYYYNGGGGN",
    "NRRRRNYYYYNGGGGN",
    "NRRRRNYYYYNGGGGN",
    "NNNNNNNNNNNNNNNN",
    "NBBBBNPPPPNOOOON",
    "NBBBBNPPPPNOOOON",
    "NBBBBNPPPPNOOOON",
    "NBBBBNPPPPNOOOON",
    "NNNNNNNNNNNNNNNN",
    "NTTTTNKKKKNLLLLN",
    "NTTTTNKKKKNLLLLN",
    "NTTTTNKKKKNLLLLN",
    "NTTTTNKKKKNLLLLN",
    "NNNNNNNNNNNNNNNN",
]
COLORS = {
    "N": (43, 58, 103), "R": (232, 93, 80), "Y": (245, 166, 35), "G": (76, 175, 108),
    "B": (74, 124, 247), "P": (167, 112, 222), "O": (255, 140, 66), "T": (38, 186, 180),
    "K": (240, 98, 146), "L": (250, 214, 64),
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
