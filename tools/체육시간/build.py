"""체육시간 앱 준비하기 (무궁화 꽃, 줄넘기)

카메라로 몸 움직임을 알아보는 MediaPipe 포즈 인식 라이브러리와 모델을 체육시간/lib/에
받아 두고(인터넷이 없어도, 외부 사이트가 막혀도 동작하게), 앱 아이콘을 만들어요.
두 게임이 같은 lib/을 함께 써요. 게임 화면은 체육시간/*/index.html을 바로 고치면 돼요.

  python3 tools/체육시간/build.py
"""
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "체육시간"
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
    img = img.resize((size, size), Image.LANCZOS)
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    img.save(OUT / "icons" / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    fetch_lib()
    for size in (180, 192, 512):
        build_icon(size)
    print("done:", OUT)
