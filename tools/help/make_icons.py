# '저요! 저요! 도와주세요' 앱 아이콘을 help/icons/에 만들어요.
# 파란 둥근 네모 위에 손 든 이모지(🙋)를 그려요. (Noto Color Emoji 글꼴이 있어야 해요)
# 실행: python3 tools/help/make_icons.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / "help" / "icons"
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
BLUE = (91, 145, 214)
YELLOW = (255, 215, 122)
CREAM = (255, 249, 237)


def make(size):
    s = 512
    img = Image.new("RGBA", (s, s), BLUE + (255,))
    d = ImageDraw.Draw(img)
    d.ellipse((56, 56, 456, 456), fill=CREAM)
    d.ellipse((360, 40, 470, 150), fill=YELLOW)  # 알림 점
    font = ImageFont.truetype(EMOJI_FONT, 109)  # 컬러 이모지 글꼴은 109 크기만 돼요
    em = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(em).text((8, 8), "🙋", font=font, embedded_color=True)
    em = em.crop(em.getbbox()).resize((300, 300), Image.LANCZOS)
    img.alpha_composite(em, (106, 112))
    return img.convert("RGB").resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (192, 512, 180):
        make(size).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
