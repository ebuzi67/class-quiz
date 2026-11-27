# 반려동물 그림 만들기: art/pets-sheet.webp (동물 18마리가 6칸 × 3줄로 그려진 사진)을
# 한 마리씩 잘라 배경을 투명하게 만들고 public/pet/img/ 에 저장해요.
#   <id>.webp     : 동물 그림 (고르기 카드, 도감 카드, 도감 상세 그림) — 학생 기기에서 가볍게 받도록 WebP로 저장해요
#   <id>-sil.png  : 아직 발견하지 않은 동물의 그림자 모양
# 실행: python3 tools/cozy-room/make_pet_art.py  (그다음 npm run publish-site)
# 사진을 바꾸고 싶으면 같은 배치(6칸 × 3줄, 글자는 그림 아래)로 그린 사진을 art/pets-sheet.webp 로 바꾸고 다시 돌려요.
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

HERE = Path(__file__).resolve().parent
SRC = HERE / "art" / "pets-sheet.webp"
OUT = HERE / "public" / "pet" / "img"
SIZE = 384          # 저장할 그림 크기 (정사각형)
TOL = 9             # 배경색과 이만큼 비슷하면 배경으로 봐요 (하얀 비숑 털이 지워지지 않게 작게)
EDGE = 28           # 가장자리에서 이 정도까지는 반쯤 투명하게 (크림색 테두리가 남지 않게)
SIL = (205, 186, 194)  # 그림자 색

# 사진 속 순서 그대로 (src/pet/data.js 의 id)
IDS = [
    ["poodle", "corgi", "shiba", "golden", "pomeranian", "bichon"],
    ["cheese", "calico", "mackerel", "blackcat", "russianblue", "tuxedo"],
    ["stag", "rhino", "wide", "saw", "king", "chafer"],
]


def runs(a, th):
    out, start = [], None
    for i, v in enumerate(a):
        if v > th and start is None:
            start = i
        if v <= th and start is not None:
            out.append((start, i)); start = None
    if start is not None:
        out.append((start, len(a)))
    return out


def main():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    bg = np.median(np.concatenate([a[:5].reshape(-1, 3), a[-5:].reshape(-1, 3)]), axis=0)
    diff = np.abs(a - bg).max(axis=2)
    fg = diff > 25
    # 그림 줄과 글자 줄이 번갈아 나와요 → 짝수 번째가 그림 줄
    row_runs = [r for r in runs(fg.sum(axis=1), 2) if r[1] - r[0] > 60]
    assert len(row_runs) == 3, f"그림 줄을 3개 찾지 못했어요: {row_runs}"
    OUT.mkdir(parents=True, exist_ok=True)
    W = a.shape[1]
    for r, (y0, y1) in enumerate(row_runs):
        col_runs = [c for c in runs(fg[y0:y1].sum(axis=0), 1) if c[1] - c[0] > 30]
        # 가까운 조각은 합쳐서 6칸으로 만들어요 (더듬이처럼 떨어진 부분)
        merged = []
        for c in col_runs:
            if merged and c[0] - merged[-1][1] < 25:
                merged[-1] = (merged[-1][0], c[1])
            else:
                merged.append(c)
        assert len(merged) == 6, f"{r + 1}번째 줄에서 6칸을 찾지 못했어요: {merged}"
        for c, (x0, x1) in enumerate(merged):
            pad = 8
            box = (max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), y1 + pad)
            crop = im.crop(box)
            d = diff[box[1]:box[3], box[0]:box[2]]
            # 테두리에서 이어진 배경만 지워요 (동물 몸 안의 밝은 색은 남겨요)
            cand = Image.fromarray(np.where(d < TOL, 255, 0).astype("uint8")).copy()  # copy: 그래야 칠할 수 있어요
            w, h = cand.size
            for x, y in [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]:
                if cand.getpixel((x, y)) == 255:
                    ImageDraw.floodfill(cand, (x, y), 128)
            bgmask = np.asarray(cand) == 128
            # 배경 바로 옆 두 칸은 배경색과 다른 정도만큼만 보이게 해요
            near = np.asarray(Image.fromarray(np.where(bgmask, 255, 0).astype("uint8")).filter(ImageFilter.MaxFilter(5))) > 0
            edge = np.clip(d / EDGE, 0, 1) * 255
            alpha = np.where(bgmask, 0, np.where(near, edge, 255)).astype("uint8")
            alpha = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
            rgba = crop.convert("RGBA")
            rgba.putalpha(alpha)
            bbox = rgba.getbbox()
            rgba = rgba.crop(bbox)
            # 정사각형 가운데에, 아래쪽을 맞춰 놓아요
            side = int(max(rgba.size) * 1.08)
            canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            canvas.paste(rgba, ((side - rgba.width) // 2, side - rgba.height - int(side * 0.04)), rgba)
            canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
            pid = IDS[r][c]
            canvas.save(OUT / f"{pid}.webp", quality=90, method=6)
            sil = Image.new("RGBA", canvas.size, SIL + (0,))
            sil.putalpha(canvas.getchannel("A"))
            sil.save(OUT / f"{pid}-sil.png", optimize=True)
            print("저장:", pid)


if __name__ == "__main__":
    main()
