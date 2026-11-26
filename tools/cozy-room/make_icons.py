# 모모의 코딩 하루 앱 아이콘을 public/icons/에 만들어요.
# 실행: python3 tools/cozy-room/make_icons.py  (그다음 npm run publish-site)
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / "public" / "icons"
S = 1024  # 크게 그린 뒤 줄여서 매끈하게 만들어요


def draw():
    im = Image.new("RGB", (S, S), (253, 233, 223))
    d = ImageDraw.Draw(im)
    # 배경 무늬 (파스텔 물방울)
    for x, y, r, c in [(150, 170, 60, (255, 211, 110)), (880, 220, 46, (185, 165, 236)), (860, 860, 70, (127, 209, 189)), (170, 860, 50, (255, 157, 184))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    cx, cy = 512, 470
    hair = (43, 36, 49)
    skin = (255, 227, 211)
    # 긴 머리 (뒤)
    d.rounded_rectangle([cx - 300, cy - 40, cx + 300, cy + 430], radius=200, fill=hair)
    # 파자마 몸
    d.rounded_rectangle([cx - 190, cy + 250, cx + 190, cy + 600], radius=150, fill=(255, 143, 134))
    for x, y in [(cx - 90, cy + 360), (cx + 70, cy + 420), (cx - 20, cy + 500)]:
        d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=(255, 244, 239))
    # 얼굴
    d.ellipse([cx - 270, cy - 250, cx + 270, cy + 260], fill=skin)
    # 앞머리
    d.pieslice([cx - 290, cy - 290, cx + 290, cy + 250], 180, 360, fill=hair)
    for i in range(5):
        x = cx - 220 + i * 110
        d.ellipse([x - 70, cy - 120, x + 70, cy + 20], fill=hair)
    d.rectangle([cx - 290, cy - 40, cx - 230, cy + 260], fill=hair)
    d.rectangle([cx + 230, cy - 40, cx + 290, cy + 260], fill=hair)
    # 리본 머리띠
    d.arc([cx - 285, cy - 300, cx + 285, cy + 240], 200, 340, fill=(255, 111, 147), width=34)
    bx, by = cx + 170, cy - 230
    d.polygon([(bx, by), (bx - 120, by - 70), (bx - 110, by + 70)], fill=(255, 111, 147))
    d.polygon([(bx, by), (bx + 120, by - 70), (bx + 110, by + 70)], fill=(255, 111, 147))
    d.ellipse([bx - 34, by - 34, bx + 34, by + 34], fill=(255, 255, 255))
    # 눈 (웃는 눈)
    for s in (-1, 1):
        ex = cx + s * 105
        d.arc([ex - 52, cy + 30, ex + 52, cy + 130], 200, 340, fill=(46, 31, 44), width=22)
        d.ellipse([ex + s * 30 - 46, cy + 120, ex + s * 30 + 46, cy + 170], fill=(255, 159, 178))
    # 입
    d.chord([cx - 50, cy + 130, cx + 50, cy + 220], 0, 180, fill=(184, 68, 94))
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    big = draw()
    for size in (192, 512, 180):
        big.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
    print("아이콘 저장:", OUT)


if __name__ == "__main__":
    main()
