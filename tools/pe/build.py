"""체육시간 앱 준비하기 (무궁화 꽃, 줄넘기, 벽 통과하기, 풍선 터뜨리기, 장애물 피하기: 각각 따로 설치되는 앱)

카메라로 몸 움직임을 알아보는 MediaPipe 포즈 인식 라이브러리와 모델을 pe/lib/에
받아 두고(인터넷이 없어도, 외부 사이트가 막혀도 동작하게), 앱마다 아이콘을 만들어요.
모든 게임이 같은 lib/을 함께 써요. 게임 화면은 pe/*/index.html을 바로 고치면 돼요.

  python3 tools/pe/build.py
"""
import math
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "pe"
LIB = OUT / "lib"
VISION = "@mediapipe/tasks-vision@0.10.14"
MODEL = ("https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
         "pose_landmarker_lite/float16/1/pose_landmarker_lite.task")


def fetch_lib():
    LIB.mkdir(parents=True, exist_ok=True)
    (LIB / "wasm").mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["npm", "pack", VISION, "--silent"], cwd=tmp, check=True, stdout=subprocess.DEVNULL)
        tgz = next(Path(tmp).glob("*.tgz"))
        with tarfile.open(tgz) as tar:
            tar.extractall(tmp, filter="data")
        pkg = Path(tmp) / "package"
        # 소스맵 줄은 빼요(파일을 같이 올리지 않아서 개발자 도구에 오류만 나와요).
        js = (pkg / "vision_bundle.mjs").read_text(encoding="utf-8")
        js = "\n".join(l for l in js.splitlines() if not l.startswith("//# sourceMappingURL"))
        (LIB / "vision_bundle.mjs").write_text(js + "\n", encoding="utf-8")
        for f in (pkg / "wasm").iterdir():
            shutil.copy(f, LIB / "wasm" / f.name)
    model = LIB / "pose_landmarker_lite.task"
    if not model.exists():
        urllib.request.urlretrieve(MODEL, model)


def rope_icon(size):
    # 민트 바탕에 줄넘기하는 사람 하나: 분홍 줄이 머리 위로 돌아가요
    s = size * 4
    img = Image.new("RGB", (s, s), "#BFEBD6")
    d = ImageDraw.Draw(img)
    d.rectangle([0, s * 0.84, s, s], fill="#8FD3B2")
    ink, w = "#24304A", int(s * 0.045)
    hx, hy, hr = s * 0.5, s * 0.3, s * 0.085
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=ink)
    neck, hip = (hx, hy + hr), (hx, s * 0.6)
    d.line([neck, hip], fill=ink, width=w)
    hand_l, hand_r = (s * 0.3, s * 0.55), (s * 0.7, s * 0.55)
    d.line([(hx, s * 0.45), hand_l], fill=ink, width=w)
    d.line([(hx, s * 0.45), hand_r], fill=ink, width=w)
    d.line([hip, (s * 0.4, s * 0.76)], fill=ink, width=w)
    d.line([hip, (s * 0.6, s * 0.76)], fill=ink, width=w)
    # 줄: 두 손에서 머리 위로 크게 넘어가는 호
    d.arc([s * 0.3 - s * 0.0, s * 0.08, s * 0.7, s * 1.02], 180, 360, fill="#E2457A", width=int(s * 0.03))
    for x, y in (hand_l, hand_r):
        r = s * 0.03
        d.ellipse([x - r, y - r, x + r, y + r], fill="#F7B733")
    return img


def flower_icon(size):
    # 분홍 바탕에 다섯 잎 무궁화 한 송이
    s = size * 4
    img = Image.new("RGB", (s, s), "#FFE3EC")
    d = ImageDraw.Draw(img)
    cx, cy = s * 0.5, s * 0.5
    for i in range(5):
        a = math.radians(-90 + i * 72)
        px, py = cx + math.cos(a) * s * 0.2, cy + math.sin(a) * s * 0.2
        r = s * 0.2
        d.ellipse([px - r, py - r, px + r, py + r], fill="#F7A1C0", outline="#E2709A", width=int(s * 0.012))
    r = s * 0.13
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#C2185B")
    for i in range(5):
        a = math.radians(-90 + i * 72)
        d.line([cx, cy, cx + math.cos(a) * s * 0.1, cy + math.sin(a) * s * 0.1], fill="#8E0E43", width=int(s * 0.018))
    r = s * 0.035
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#FFE082")
    return img


def wall_icon(size):
    # 주황 벽돌 벽에 만세 자세 사람 모양 구멍
    s = size * 4
    img = Image.new("RGB", (s, s), "#E8743B")
    d = ImageDraw.Draw(img)
    bh = s / 7
    for r in range(8):
        y = r * bh
        d.line([0, y, s, y], fill="#F59A6A", width=int(s * 0.012))
        off = (bh if r % 2 else 0)
        x = -off
        while x < s:
            d.line([x, y, x, y + bh], fill="#F59A6A", width=int(s * 0.012))
            x += bh * 2
    hole, w = "#FFF6EE", int(s * 0.075)
    cx = s * 0.5
    d.ellipse([cx - s * 0.075, s * 0.16, cx + s * 0.075, s * 0.31], fill=hole)
    d.rectangle([cx - s * 0.085, s * 0.32, cx + s * 0.085, s * 0.58], fill=hole)
    for side in (-1, 1):
        d.line([cx + side * s * 0.07, s * 0.36, cx + side * s * 0.2, s * 0.24, cx + side * s * 0.24, s * 0.1], fill=hole, width=w, joint="curve")
        d.line([cx + side * s * 0.05, s * 0.56, cx + side * s * 0.12, s * 0.88], fill=hole, width=w)
    return img


def balloon_icon(size):
    # 하늘색 바탕에 빨강·노랑 풍선 두 개
    s = size * 4
    img = Image.new("RGB", (s, s), "#BFE3FF")
    d = ImageDraw.Draw(img)
    for cx, cy, r, col in ((s * 0.4, s * 0.38, s * 0.2, "#FF5C7A"), (s * 0.64, s * 0.5, s * 0.15, "#FFC83D")):
        d.line([cx, cy + r * 1.1, cx - r * 0.2, cy + r * 1.6, cx + r * 0.1, cy + r * 2.4], fill="#ffffff", width=int(s * 0.012))
        d.ellipse([cx - r * 0.88, cy - r * 1.08, cx + r * 0.88, cy + r * 1.08], fill=col)
        d.polygon([(cx - r * 0.15, cy + r * 1.2), (cx + r * 0.15, cy + r * 1.2), (cx, cy + r * 1.02)], fill=col)
        d.ellipse([cx - r * 0.5, cy - r * 0.7, cx - r * 0.18, cy - r * 0.15], fill="#ffffff")
    return img


def dodge_icon(size):
    # 연두 바탕, 통나무를 뛰어넘는 사람
    s = size * 4
    img = Image.new("RGB", (s, s), "#C6EFD3")
    d = ImageDraw.Draw(img)
    d.rectangle([0, s * 0.84, s, s], fill="#8FD3A6")
    d.rounded_rectangle([s * 0.2, s * 0.7, s * 0.8, s * 0.84], radius=int(s * 0.07), fill="#9B6234")
    d.ellipse([s * 0.73, s * 0.7, s * 0.86, s * 0.84], fill="#D9A066")
    ink, w = "#1f3a2a", int(s * 0.045)
    hx, hy, hr = s * 0.5, s * 0.17, s * 0.075
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=ink)
    d.line([(hx, hy + hr), (hx, s * 0.43)], fill=ink, width=w)
    d.line([(s * 0.32, s * 0.2), (hx, s * 0.31), (s * 0.68, s * 0.2)], fill=ink, width=w, joint="curve")
    d.line([(hx, s * 0.43), (s * 0.38, s * 0.5), (s * 0.34, s * 0.62)], fill=ink, width=w, joint="curve")
    d.line([(hx, s * 0.43), (s * 0.62, s * 0.5), (s * 0.66, s * 0.62)], fill=ink, width=w, joint="curve")
    return img


def save_icon(app, draw, size):
    img = draw(size).resize((size, size), Image.LANCZOS)
    (OUT / app / "icons").mkdir(parents=True, exist_ok=True)
    img.save(OUT / app / "icons" / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    fetch_lib()
    for size in (180, 192, 512):
        save_icon("mugunghwa", flower_icon, size)
        save_icon("jumprope", rope_icon, size)
        save_icon("wall", wall_icon, size)
        save_icon("balloon", balloon_icon, size)
        save_icon("dodge", dodge_icon, size)
    print("done:", OUT)
