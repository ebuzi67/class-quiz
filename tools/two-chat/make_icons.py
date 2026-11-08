# 투랑 대화하기 앱 아이콘(주황 블록 두 개, 눈 두 개)을 two-chat/icons/에 만들어요.
# 투 그림 파일이 생기면 tools/one-chat/make_icons.py 처럼 그 그림으로 바꿔도 돼요.
# 실행: python3 tools/two-chat/make_icons.py
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "two-chat" / "icons"
S = 1024  # 크게 그린 다음 줄여서 가장자리를 매끄럽게 해요


def draw():
    im = Image.new("RGB", (S, S), "white")
    d = ImageDraw.Draw(im)
    k = S / 100  # 100칸 좌표계

    def box(x0, y0, x1, y1):
        return [x0 * k, y0 * k, x1 * k, y1 * k]

    # 다리와 팔
    d.rounded_rectangle(box(37, 84, 44, 97), radius=3.5 * k, fill="#b85a08")
    d.rounded_rectangle(box(56, 84, 63, 97), radius=3.5 * k, fill="#b85a08")
    d.rounded_rectangle(box(22, 56, 30, 76), radius=4 * k, fill="#d06a0c")
    d.rounded_rectangle(box(70, 56, 78, 76), radius=4 * k, fill="#d06a0c")
    # 블록 두 개
    d.rounded_rectangle(box(29, 49, 71, 86), radius=4 * k, fill="#ec8417")
    d.rounded_rectangle(box(29, 11, 71, 49), radius=4 * k, fill="#f0901f")
    d.line(box(30, 49, 70, 49), fill="#c96a0d", width=int(0.8 * k))
    # 눈 두 개
    for cx in (40, 60):
        d.ellipse(box(cx - 7.5, 21, cx + 7.5, 36), fill="#c2620c")
        d.ellipse(box(cx - 5.7, 22.8, cx + 5.7, 34.2), fill="white")
        d.ellipse(box(cx - 3, 25.5, cx + 3.6, 32.1), fill="#111111")
        d.ellipse(box(cx + 0.6, 25.8, cx + 2.6, 27.8), fill="white")
    # 입
    d.chord(box(41, 37, 59, 46), 0, 180, fill="#8a3d05")
    d.chord(box(44, 37.5, 56, 41.5), 0, 180, fill="white")
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    big = draw()
    for size in (192, 512, 180):
        big.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
