# 엔더마이트와 대화하기(endermite-chat/)의 그림을 만들어요.
# 원본: tools/endermite-chat/endermite.jpg (엔더마이트 그림, 흰 배경)
#  - 앱 아이콘: 흰 정사각형 가운데에 그림 전체를 놓아요 → endermite-chat/icons/
#  - 화면 캐릭터: 흰 배경을 투명하게 지운 그림 → endermite-chat/endermite.png
# 실행: python3 tools/endermite-chat/make_icons.py
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1] / "endermite-chat"
MARGIN = 0.08  # 아이콘 가장자리 여백(한 변의 비율)


def cutout(src):
    im = src.convert("RGBA")
    w, h = im.size
    edge = [(x, 0) for x in range(0, w, 8)] + [(x, h - 1) for x in range(0, w, 8)]
    edge += [(0, y) for y in range(0, h, 8)] + [(w - 1, y) for y in range(0, h, 8)]
    for p in edge:  # 가장자리에 닿은 흰 바탕만 지워요
        px = im.getpixel(p)
        if px[3] and sum(px[:3]) > 700:
            ImageDraw.floodfill(im, p, (255, 255, 255, 0), thresh=40)
    return im


def main():
    src = Image.open(HERE / "endermite.jpg").convert("RGB")
    for size in (192, 512, 180):
        inner = round(size * (1 - 2 * MARGIN))
        scale = inner / max(src.size)
        fit = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
        icon = Image.new("RGB", (size, size), "white")
        icon.paste(fit, ((size - fit.width) // 2, (size - fit.height) // 2))
        icon.save(APP / "icons" / f"icon-{size}.png", optimize=True)
    fig = cutout(src)
    fig.thumbnail((360, 360), Image.LANCZOS)
    fig.save(APP / "endermite.png", optimize=True)


if __name__ == "__main__":
    main()
