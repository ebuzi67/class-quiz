"""숲에서 99일 살기 — 새 몹·무기 그림 다듬기

tools/forest99/art/ 의 원본 그림을 웹앱용으로 다듬어 forest99/img/ 에 저장해요.
- 투명한 테두리를 잘라내고
- 반쯤 투명한 지저분한 가장자리(흰 테두리)를 정리하고
- 크기를 키운 뒤(2~3배) 선명하게 만들어요.

쓰는 법:  python3 tools/forest99/make_mobs.py
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ART = Path(__file__).parent / "art"
OUT = ROOT / "forest99" / "img"

# 파일 이름: 가장 긴 변 크기
SIZES = {"polar": 320, "mammoth": 360, "cultist": 300, "crossbow": 300, "king": 420, "alien": 260, "laser": 256}


def clean_alpha(im):
    """알파가 아주 낮은 픽셀은 지우고, 가장자리를 1픽셀 안쪽으로 다듬어요."""
    r, g, b, a = im.split()
    a = a.point(lambda v: 0 if v < 40 else (255 if v > 200 else v))
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    return Image.merge("RGBA", (r, g, b, a))


def upscale(im, size):
    w, h = im.size
    k = size / max(w, h)
    # 한 번에 많이 키우면 흐려져서 두 번에 나눠 키워요
    while k > 1.6:
        im = im.resize((round(im.width * 1.6), round(im.height * 1.6)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        k /= 1.6
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in SIZES.items():
        im = Image.open(ART / f"{name}.webp").convert("RGBA")
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
        im = clean_alpha(upscale(clean_alpha(im), size))
        im.save(OUT / f"{name}.webp", quality=90, alpha_quality=95)
        print(name, im.size)


if __name__ == "__main__":
    main()
