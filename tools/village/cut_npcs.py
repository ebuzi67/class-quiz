# NPC 그림(회색 배경)에서 배경·그림자·✦ 표시를 지우고 캐릭터만 잘라 village/assets/npc/에 저장해요.
# 실행: python3 tools/village/cut_npcs.py 원본폴더
#   원본폴더 안에 chief.png, bolt.png, sprout.png, snap.png, luna.png, tinker.png, farmer.png 가 있어야 해요.
# 가장자리에서부터 바로 옆 칸과 색이 거의 같은 회색 칸만 따라가며 지워요(배경의 은은한 그러데이션도 따라가요).
# 흰 머리·흰 가운처럼 배경과 색이 꽤 다른 칸에서는 멈춰요.
# 그다음 발밑 그림자(푸르스름한 회색 타원)만 따로 지워요.
import sys
from collections import deque
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "village" / "assets" / "npc"
NAMES = ["chief", "bolt", "sprout", "snap", "luna", "tinker", "farmer"]
HEIGHT = 180  # 저장할 그림 높이(px)
STEP = 7      # 이웃 칸과 이만큼(채널마다) 넘게 다르면 배경이 아니에요


def gray(p):
    r, g, b = p[:3]
    return max(r, g, b) - min(r, g, b) < 30


def flood(px, w, h, starts, ok):
    q = deque(starts)
    while q:
        x, y, prev = q.popleft()
        p = px[x, y]
        if p[3] == 0 or not ok(p, prev):
            continue
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                q.append((nx, ny, p))


def cut(src):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    edge = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    near = lambda p, prev: gray(p) and all(abs(a - b) <= STEP for a, b in zip(p[:3], prev[:3]))
    flood(px, w, h, [(x, y, px[x, y]) for x, y in edge], near)
    # 그림자: 지운 곳과 붙어 있고, 아래쪽 1/4 안에 있는 푸르스름한 회색
    alpha = im.getchannel("A")
    x0, y0, x1, y1 = alpha.getbbox()
    top = y1 - (y1 - y0) // 4
    starts = [(x, y, None) for y in range(top, y1) for x in range(x0, x1)
              if px[x, y][3] and any(0 <= x + dx < w and px[x + dx, y][3] == 0 for dx in (-1, 1))]
    flood_rows(px, w, h, starts, top)
    alpha = im.getchannel("A").point(lambda a: 255 if a else 0)
    im = im.crop(biggest_blob(alpha))
    s = HEIGHT / im.height
    return im.resize((max(1, round(im.width * s)), HEIGHT), Image.LANCZOS)


def shadowy(p):
    return gray(p) and p[2] >= p[0] - 4 and min(p[:3]) > 110


def flood_rows(px, w, h, starts, top):
    q = deque(starts)
    while q:
        x, y, _ = q.popleft()
        p = px[x, y]
        if y < top or p[3] == 0 or not shadowy(p):
            continue
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                q.append((nx, ny, None))


def biggest_blob(alpha):
    w, h = alpha.size
    a = alpha.load()
    seen = bytearray(w * h)
    best = None
    for sy in range(0, h, 2):
        for sx in range(0, w, 2):
            if not a[sx, sy] or seen[sy * w + sx]:
                continue
            q = deque([(sx, sy)]); seen[sy * w + sx] = 1
            n, x0, y0, x1, y1 = 0, sx, sy, sx, sy
            while q:
                x, y = q.popleft(); n += 1
                x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and a[nx, ny] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1; q.append((nx, ny))
            if not best or n > best[0]:
                best = (n, (x0, y0, x1 + 1, y1 + 1))
    return best[1]


def main():
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        im = cut(src / f"{name}.png")
        im.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
        print(name, im.size)


if __name__ == "__main__":
    main()
