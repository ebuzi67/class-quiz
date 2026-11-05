# 학습 플래너 앱 아이콘을 planner/icons/에 만들어요.
# 남색 바탕 위 하얀 노트에 과목 색(영어 파랑, 수학 초록, 국어 분홍) 체크 줄 세 개를 그려요.
# 실행: python3 tools/planner/make_icons.py
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "planner" / "icons"
BIG = 1024
NAVY = (30, 41, 59)
ROWS = [((159, 194, 211), (39, 90, 115), True),
        ((169, 199, 155), (63, 107, 63), True),
        ((221, 169, 178), (139, 74, 87), False)]


def draw():
    img = Image.new("RGB", (BIG, BIG), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((190, 150, 834, 874), radius=70, fill="white")
    for i, (light, dark, done) in enumerate(ROWS):
        y = 260 + i * 200
        box = (260, y, 380, y + 120)
        if done:
            d.rounded_rectangle(box, radius=28, fill=dark)
            d.line([(288, y + 62), (314, y + 90), (356, y + 34)], fill="white", width=22, joint="curve")
        else:
            d.rounded_rectangle(box, radius=28, outline=dark, width=14)
        d.rounded_rectangle((430, y + 30, 760, y + 90), radius=30, fill=light)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    big = draw()
    for size in (192, 512, 180):
        big.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
