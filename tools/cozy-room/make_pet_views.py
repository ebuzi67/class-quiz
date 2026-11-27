# 반려동물 방향별 그림 만들기: art/ref-dogs.png, ref-cats.png, ref-bugs.png
# (한 줄에 동물 한 마리, 칸은 앞 · 옆(왼쪽을 봄) · 뒤 · 비스듬히 앞)을 잘라 배경을 지우고
# public/pet/views/<동물>-<front|side|back|q>.webp 로 저장해요.
# 3D 화면에서는 카메라가 보는 방향에 맞는 그림을 골라 보여 줘요 (src/pet/models.js 의 buildSpritePet).
# 한 동물의 네 그림은 같은 크기·같은 바닥선으로 맞춰서, 그림이 바뀌어도 크기가 튀지 않아요.
# 실행: python3 tools/cozy-room/make_pet_views.py  (그다음 npm run publish-site)
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE / "public" / "pet" / "views"
SIZE = 384
TOL, EDGE = 9, 28
SHEETS = {
    "ref-dogs.png": ["poodle", "corgi", "shiba", "golden", "pomeranian", "bichon"],
    "ref-cats.png": ["cheese", "calico", "mackerel", "blackcat", "russianblue", "tuxedo"],
    "ref-bugs.png": ["stag", "rhino", "wide", "saw", "king", "chafer"],
}
VIEWS = ["front", "side", "back", "q"]


def runs(a, th, min_len, merge_gap):
    out, start = [], None
    for i, v in enumerate(list(a) + [0]):
        if v > th and start is None:
            start = i
        if v <= th and start is not None:
            out.append([start, i]); start = None
    merged = []
    for r in out:
        if merged and r[0] - merged[-1][1] < merge_gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [r for r in merged if r[1] - r[0] >= min_len]


def cutout(im, diff, box):
    crop = im.crop(box)
    d = diff[box[1]:box[3], box[0]:box[2]]
    cand = Image.fromarray(np.where(d < TOL, 255, 0).astype("uint8")).copy()
    w, h = cand.size
    for x, y in [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]:
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
    bg = np.asarray(cand) == 128
    near = np.asarray(Image.fromarray(np.where(bg, 255, 0).astype("uint8")).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(bg, 0, np.where(near, np.clip(d / EDGE, 0, 1) * 255, 255)).astype("uint8")
    rgba = crop.convert("RGBA")
    rgba.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    return rgba.crop(rgba.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for sheet, ids in SHEETS.items():
        im = Image.open(HERE / "art" / sheet).convert("RGB")
        a = np.asarray(im).astype(int)
        bgc = np.median(np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
        diff = np.abs(a - bgc).max(axis=2)
        fg = diff > 25
        rows = runs(fg.sum(axis=1), 2, 60, 12)
        assert len(rows) == len(ids), f"{sheet}: 줄을 {len(ids)}개 찾지 못했어요 {rows}"
        for pid, (y0, y1) in zip(ids, rows):
            cols = runs(fg[y0:y1].sum(axis=0), 1, 30, 25)
            assert len(cols) == 4, f"{sheet} {pid}: 4칸을 찾지 못했어요 {cols}"
            cuts = [cutout(im, diff, (max(0, x0 - 8), max(0, y0 - 8), x1 + 8, min(a.shape[0], y1 + 8))) for x0, x1 in cols]
            side = int(max(max(c.size) for c in cuts) * 1.08)
            for view, c in zip(VIEWS, cuts):
                canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
                canvas.paste(c, ((side - c.width) // 2, side - c.height - int(side * 0.03)), c)
                canvas.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"{pid}-{view}.webp", quality=88, method=6)
            print("저장:", pid)


if __name__ == "__main__":
    main()
