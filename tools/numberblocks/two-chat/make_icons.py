# 투랑 대화하기 앱 아이콘을 numberblocks/two-chat/icons/에 만들어요.
# 원본: tools/numberblocks/two-chat/two.jpg (투 캐릭터 그림 그대로). 그림에 박혀 있는 회색·흰색 바둑판 배경을 흰색으로 바꾸고,
# 하얀 정사각형 가운데에 그림 전체가 들어가게 놓아요.
# 실행: python3 tools/numberblocks/two-chat/make_icons.py
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[2] / "numberblocks" / "two-chat" / "icons"
MARGIN = 0.06  # 가장자리 여백(한 변의 비율)


def clean(im):
    # 거의 흰색이고 색이 없는(회색 계열) 점은 모두 흰색으로: 바둑판 배경이 사라져요
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            if min(r, g, b) > 210 and max(r, g, b) - min(r, g, b) < 18:
                px[x, y] = (255, 255, 255)
    # 흰 바탕을 뺀 그림 부분만 남겨요
    bbox = ImageChops.difference(im, Image.new("RGB", im.size, "white")).getbbox()
    return im.crop(bbox) if bbox else im


def main():
    src = Image.open(HERE / "two.jpg").convert("RGB")
    src = src.resize((src.width // 4, src.height // 4), Image.LANCZOS)  # 아이콘에는 이 정도면 충분해요
    src = clean(src)
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (192, 512, 180):
        inner = round(size * (1 - 2 * MARGIN))
        scale = inner / max(src.size)
        fit = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
        icon = Image.new("RGB", (size, size), "white")
        icon.paste(fit, ((size - fit.width) // 2, (size - fit.height) // 2))
        icon.save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
