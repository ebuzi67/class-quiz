# 배경 그림 손질: tools/village/art/의 원본으로 village/assets/ 그림을 만들어요.
# - 교과 언덕: subjects-base.png(빈 땅 그림) 위에 건물 그림(회색 배경을 지운 것)을 올려 subjects.webp를 만들어요.
#   새 교과 건물을 넣을 때는 BUILDINGS에 한 줄 추가하고 다시 실행해요. 지도(maps.js)의 막힌 칸·문도 함께 고쳐요.
# - 회색 바탕으로 온 방 그림(음악 방 등): 가장자리 회색을 지워 투명하게 만들어요. 게임에서는 방 바깥이 어두운색으로 보여요.
# 실행: python3 tools/village/make_art.py
from pathlib import Path
from PIL import Image
import cut_npcs  # 같은 폴더의 배경 지우기 도구

HERE = Path(__file__).resolve().parent
ART = HERE / "art"
OUT = HERE.parents[1] / "village" / "assets"

# (그림 파일, 건물 아래 가운데 x, 건물 아래 y, 건물 너비) — 교과 언덕 그림(1536x1024) 픽셀 기준
BUILDINGS = [
    ("musichall.png", 1222, 560, 400),
]
GRAY_ROOMS = ["mus12", "mus34", "mus56"]


def cutout(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    edge = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    near = lambda p, prev: cut_npcs.gray(p) and all(abs(a - b) <= cut_npcs.STEP for a, b in zip(p[:3], prev[:3]))
    cut_npcs.flood(px, w, h, [(x, y, px[x, y]) for x, y in edge], near)
    return im


def main():
    base = Image.open(ART / "subjects-base.png").convert("RGBA")
    for name, cx, bottom, width in BUILDINGS:
        b = cutout(ART / name)
        b = b.crop(b.getchannel("A").getbbox())
        b = b.resize((width, round(b.height * width / b.width)), Image.LANCZOS)
        base.alpha_composite(b, (cx - width // 2, bottom - b.height))
    base.convert("RGB").save(OUT / "subjects.webp", "WEBP", quality=86, method=6)
    for room in GRAY_ROOMS:
        cutout(ART / f"{room}.png").save(OUT / f"{room}.webp", "WEBP", quality=86, method=6)
    print("ok")


if __name__ == "__main__":
    main()
