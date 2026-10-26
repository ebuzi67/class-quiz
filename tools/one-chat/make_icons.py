# 원이랑 대화하기 앱 아이콘을 one-chat/icons/에 만들어요.
# 원본: tools/one-chat/one.jpg (원 캐릭터 그림 그대로). 위아래 어두운 테두리만 잘라 내고,
# 하얀 정사각형 가운데에 그림 전체가 들어가게 놓아요.
# 실행: python3 tools/one-chat/make_icons.py
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "one-chat" / "icons"
MARGIN = 0.06  # 가장자리 여백(한 변의 비율)


def main():
    src = Image.open(HERE / "one.jpg").convert("RGB")
    w, h = src.size
    src = src.crop((0, 3, w, h - 5))  # 스크린샷 위아래의 어두운 줄
    for size in (192, 512, 180):
        inner = round(size * (1 - 2 * MARGIN))
        scale = inner / max(src.size)
        fit = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
        icon = Image.new("RGB", (size, size), "white")
        icon.paste(fit, ((size - fit.width) // 2, (size - fit.height) // 2))
        icon.save(OUT / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
