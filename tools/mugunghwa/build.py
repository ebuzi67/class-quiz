"""무궁화 꽃이 피었습니다 앱 준비하기

카메라로 몸 움직임을 알아보는 MediaPipe 포즈 인식 라이브러리와 모델을 mugunghwa/lib/에
받아 두고(인터넷이 없어도, 외부 사이트가 막혀도 동작하게), 앱 아이콘을 만들어요.
게임 화면은 mugunghwa/index.html을 바로 고치면 돼요.

  python3 tools/mugunghwa/build.py
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
OUT = HERE.parent.parent / "mugunghwa"
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


def build_icon(size):
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
    img = img.resize((size, size), Image.LANCZOS)
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    img.save(OUT / "icons" / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    fetch_lib()
    for size in (180, 192, 512):
        build_icon(size)
    print("done:", OUT)
