# 가챠 기계 그림 시트(art/sheet.png)에서 캡슐 뽑기에 쓰는 조각만 잘라 gacha/assets/에 저장해요.
# 시트의 배경은 투명해요. 붙어 있는 픽셀 덩어리마다 하나의 조각으로 보고, 덩어리 번호 대신
# 덩어리 안의 한 점(SEED)으로 어떤 조각인지 골라요. 주변의 흐린 얼룩은 지워요.
# 실행: python3 tools/gacha/cut_art.py
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "gacha" / "assets"

# 이름: [조각 안의 점(x, y), ...]  여러 점이면 그 조각들을 한 장에 합쳐요.
PARTS = {
    "body": [(270, 750)],        # 기계 몸통 (위쪽 별 장식까지)
    "dome": [(700, 500)],        # 유리 돔 + 받침
    "crown": [(1020, 140)],      # 별 장식 (돔 위에 다시 덮어요)
    "crank": [(980, 500)],       # 손잡이
    "cap-red": [(118, 1010)],
    "cap-blue": [(274, 1010)],
    "cap-yellow": [(429, 1010)],
    "cap-green": [(583, 1010)],
    "cap-purple": [(737, 1010)],
    "cap-clear": [(896, 1010)],
    "bowl-red": [(118, 1200)],
    "bowl-blue": [(275, 1200)],
    "bowl-yellow": [(431, 1200)],
    "bowl-green": [(586, 1200)],
    "bowl-purple": [(740, 1200)],
    "bowl-clear": [(897, 1200)],
    "star": [(1074, 932)],
    "burst": [(1041, 1150), (1096, 1140), (1132, 1165)],
    "puff": [(1053, 1242)],
}
THRESH = 60      # 이보다 진한 픽셀만 조각으로 봐요
GROW = 3         # 가장자리 부드러운 부분을 살리려고 조각 둘레를 이만큼 넓혀요


def label(mask):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    for y in range(h):
        for x in np.nonzero(mask[y] & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            n += 1
            lab[y, x] = n
            q = deque([(y, x)])
            while q:
                cy, cx = q.popleft()
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        q.append((ny, nx))
    return lab


def grow(mask, r):
    out = mask.copy()
    for _ in range(r):
        m = out.copy()
        m[1:] |= out[:-1]; m[:-1] |= out[1:]; m[:, 1:] |= out[:, :-1]; m[:, :-1] |= out[:, 1:]
        out = m
    return out


def nearest_label(lab, x, y):
    for r in range(0, 30):
        win = lab[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1]
        vals = win[win > 0]
        if vals.size:
            return int(np.bincount(vals).argmax())
    raise SystemExit(f"({x}, {y}) 근처에 조각이 없어요")


def main():
    img = np.array(Image.open(HERE / "art" / "sheet.png").convert("RGBA"))
    lab = label(img[:, :, 3] > THRESH)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, seeds in PARTS.items():
        mask = np.zeros(lab.shape, bool)
        for x, y in seeds:
            mask |= lab == nearest_label(lab, x, y)
        mask = grow(mask, GROW)
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        part = img[y0:y1, x0:x1].copy()
        part[:, :, 3] = np.where(mask[y0:y1, x0:x1], part[:, :, 3], 0)
        Image.fromarray(part).save(OUT / f"{name}.webp", lossless=False, quality=90, method=6)
        print(f"{name:12s} {x1 - x0}x{y1 - y0}  (시트 {x0},{y0})")


if __name__ == "__main__":
    main()
