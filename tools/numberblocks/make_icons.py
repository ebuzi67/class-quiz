# 넘버블럭스 모음 아이콘과 첫 화면 그림을 만들어요.
# 원본: tools/numberblocks/numberblocks.jpg (넘버블럭스 로고와 원 그림 그대로)
# 아이콘: 세로로 긴 그림이 정사각형에 다 들어가게 가운데 놓고, 남는 양옆은 같은 그림을 흐리게 넓혀서 채워요.
# 실행: python3 tools/numberblocks/make_icons.py
from pathlib import Path
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "numberblocks"


def square(src, size):
    bg = src.resize((size, round(src.height * size / src.width)), Image.LANCZOS)
    top = (bg.height - size) // 2
    bg = bg.crop((0, top, size, top + size)).filter(ImageFilter.GaussianBlur(size / 24))
    fit = src.resize((round(src.width * size / src.height), size), Image.LANCZOS)
    bg.paste(fit, ((size - fit.width) // 2, 0))
    return bg


def main():
    src = Image.open(HERE / "numberblocks.jpg").convert("RGB")
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    for size in (192, 512, 180):
        square(src, size).save(OUT / "icons" / f"icon-{size}.png", optimize=True)
    hero = src.resize((640, round(src.height * 640 / src.width)), Image.LANCZOS)
    hero.save(OUT / "hero.jpg", quality=85, optimize=True)


if __name__ == "__main__":
    main()
