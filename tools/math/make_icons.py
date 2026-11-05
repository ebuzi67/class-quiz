# 수학 퀴즈 모음 페이지 앱 아이콘을 math/icons/에 만들어요.
# 픽셀 그림(+ − × ÷ 네 칸 타일)을 16x16 점으로 그린 뒤 크게 키워요.
# 실행: python3 tools/math/make_icons.py
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "math" / "icons"

PIXELS = [
    "RRRRRRRNNYYYYYYY",
    "RRRWRRRNNYYYYYYY",
    "RRRWRRRNNYYYYYYY",
    "RWWWWWRNNYWWWWWY",
    "RRRWRRRNNYYYYYYY",
    "RRRWRRRNNYYYYYYY",
    "RRRRRRRNNYYYYYYY",
    "NNNNNNNNNNNNNNNN",
    "NNNNNNNNNNNNNNNN",
    "GGGGGGGNNBBBBBBB",
    "GWGGGWGNNBBBWBBB",
    "GGWGWGGNNBBBBBBB",
    "GGGWGGGNNBWWWWWB",
    "GGWGWGGNNBBBBBBB",
    "GWGGGWGNNBBBWBBB",
    "GGGGGGGNNBBBBBBB",
]
COLORS = {
    "N": (43, 58, 103), "W": (255, 255, 255),
    "R": (232, 93, 80), "Y": (245, 166, 35), "G": (76, 175, 108), "B": (74, 124, 247),
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
