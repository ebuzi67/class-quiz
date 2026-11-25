"""숲에서 99일 살기 그림 만들기

엔트리 작품 파일(.ent)에서 그림을 꺼내 웹앱용으로 줄이고, 앱 아이콘을 만들어요.

쓰는 법:
    python3 tools/forest99/make_assets.py 내작품.ent
결과는 forest99/img/ 와 forest99/icons/ 에 저장돼요.
"""
import io, json, sys, tarfile, gzip
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT_IMG = ROOT / "forest99" / "img"
OUT_ICON = ROOT / "forest99" / "icons"

# 엔트리 모양 이름 → 웹앱 파일 이름, 가장 긴 변 크기
NAMES = {
    "플레이어": ("player", 192), "캠프파이어": ("campfire", 320), "곰": ("bear", 256),
    "알파늑대": ("alpha", 256), "늑대": ("wolf", 224), "고기": ("meat", 128), "베리": ("berry", 128),
    "익힌 고기": ("cooked", 128), "스튜": ("stew", 128), "케이크": ("cake", 128),
    "통나무": ("log", 144), "석탄": ("coal", 128), "숲 배경": ("forest", 1280), "아침 숲": ("morning", 1280),
}


def load_ent(path):
    raw = gzip.open(path).read()
    tar = tarfile.open(fileobj=io.BytesIO(raw))
    files = {Path(m.name).name: m for m in tar.getmembers() if m.isfile() and "/thumb/" not in m.name}
    project = json.load(tar.extractfile(files["project.json"]))
    pics = {}
    for obj in project["objects"]:
        for pic in obj["sprite"]["pictures"]:
            name = pic["name"]
            if name in NAMES and name not in pics:
                member = files[pic["filename"] + ".png"]
                pics[name] = Image.open(tar.extractfile(member)).convert("RGBA")
    return pics


def trim(im):
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(box) if box else im


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pics = load_ent(sys.argv[1])
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    OUT_ICON.mkdir(parents=True, exist_ok=True)
    for name, im in pics.items():
        file, size = NAMES[name]
        if file in ("forest", "morning"):
            im = im.convert("RGB").resize((size, size * 9 // 16), Image.LANCZOS)
            im.save(OUT_IMG / f"{file}.webp", quality=80)
        else:
            im = trim(im)
            im.thumbnail((size, size), Image.LANCZOS)
            im.save(OUT_IMG / f"{file}.webp", quality=88, alpha_quality=90)
        print("그림", file, im.size)

    # 아이콘: 밤하늘 + 달 + 모닥불 불빛
    S = 1024
    icon = Image.new("RGBA", (S, S))
    d = ImageDraw.Draw(icon)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=(int(22 + 20 * t), int(30 + 40 * t), int(52 + 10 * t), 255))
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([170, 330, 854, 1010], fill=(255, 170, 60, 150))
    icon.alpha_composite(glow.filter(ImageFilter.GaussianBlur(110)))
    d = ImageDraw.Draw(icon)
    d.ellipse([700, 110, 860, 270], fill=(255, 244, 200, 255))
    d.ellipse([745, 90, 905, 250], fill=(30, 42, 60, 255))
    for x, y in [(160, 160), (300, 90), (520, 200), (220, 330), (620, 110)]:
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(255, 255, 230, 230))
    fire = trim(pics["캠프파이어"])
    fire.thumbnail((700, 700), Image.LANCZOS)
    icon.alpha_composite(fire, ((S - fire.width) // 2, S - fire.height - 90))
    icon = icon.convert("RGB")
    for size in (512, 192, 180):
        icon.resize((size, size), Image.LANCZOS).save(OUT_ICON / f"icon-{size}.png", optimize=True)
    print("아이콘 완료")


if __name__ == "__main__":
    main()
