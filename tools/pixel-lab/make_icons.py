# 픽셀 마법사 연구소 앱 아이콘을 public/icons/에 만들어요.
# 16x16 점으로 마법사 모자를 그린 뒤 크게 키워요.
# 실행: python3 tools/pixel-lab/make_icons.py  (그다음 npm run publish-site)
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent / "public" / "icons"

PIXELS = [
    "CCCCCCCCCCCCCCCC",
    "CCCCCCCCCYCCCCCC",
    "CCCsCCCCPPCCCCCC",
    "CCCCCCCPPPCCCsCC",
    "CCCCCCCPPPPCCCCC",
    "CCCCCCPPPPPCCCCC",
    "CCCCCCPPLPPPCCCC",
    "CCCCCPPPPPPPCCCC",
    "CCCCCYYYYYYYCCCC",
    "CCCCPPPPPPPPPCCC",
    "CCPPPPPPPPPPPPPC",
    "CCCPPPPPPPPPPPCC",
    "CCCCCCCCCCCCCCCC",
    "CCKKCMMCYYCBBCCC",
    "CCKKCMMCYYCBBCCC",
    "CCCCCCCCCCCCCCCC",
]
COLORS = {
    "C": (251, 243, 226), "P": (155, 126, 222), "L": (201, 185, 243), "Y": (248, 212, 88), "s": (236, 220, 192),
    "K": (244, 143, 177), "M": (111, 211, 195), "B": (127, 184, 242),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    small = Image.new("RGB", (16, 16))
    for y, row in enumerate(PIXELS):
        assert len(row) == 16, (y, row)
        for x, ch in enumerate(row):
            small.putpixel((x, y), COLORS[ch])
    for size in (192, 512, 180):
        small.resize((size, size), Image.NEAREST).save(OUT / f"icon-{size}.png")
        print("만듦:", OUT / f"icon-{size}.png")


if __name__ == "__main__":
    main()
