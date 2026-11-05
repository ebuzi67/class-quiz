# 유럽 탐방 앱(체코·이탈리아·독일·포르투갈·오스트리아·헝가리·스페인)을 만들어요.
# 공통 파일(tools/walk/shared/)과 나라별 파일(tools/walk/cities/<나라>/data.js, landmarks.js)을 합쳐서
# europe/ 아래에 나라 이름 폴더(예: europe/czech/)를 만들어요. 폴더마다 따로 설치되는 앱이에요.
# 실행: python3 tools/walk/build.py            (모든 나라)
#       python3 tools/walk/build.py czech      (한 나라만)
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SHARED = HERE / "shared"
LIB = ROOT / "europe" / "rome" / "lib"   # three.js, PeerJS (런던·파리·로마와 같은 파일)

# 화면 글자와 아이콘. icon: 하늘 위 건물 모양(아래 SHAPES), flag: 아래 띠 색(왼쪽부터 또는 위부터)
CITIES = {
    "czech": dict(name="체코", walk="CZECH WALK", flag="🇨🇿", theme="#11457e", lang="체코어", emoji="💃", first="댄싱 하우스", km="5.0",
                  icon="castle", bands=["#ffffff", "#d7141a"], tri="#11457e"),
    "italy": dict(name="이탈리아", walk="ITALIA WALK", flag="🇮🇹", theme="#2e6b3f", lang="이탈리아어", emoji="🍋", first="아말피 해안", km="900",
                  icon="tower", bands=["#009246", "#ffffff", "#ce2b37"], vertical=True),
    "germany": dict(name="독일", walk="DEUTSCHLAND WALK", flag="🇩🇪", theme="#3a3a3a", lang="독일어", emoji="🏛️", first="브란덴부르크 문", km="1300",
                    icon="castle", bands=["#000000", "#dd0000", "#ffce00"]),
    "portugal": dict(name="포르투갈", walk="PORTUGAL WALK", flag="🇵🇹", theme="#0b5d3b", lang="포르투갈어", emoji="⚓", first="코메르시우 광장", km="9.0",
                     icon="tower", bands=["#046a38", "#046a38", "#da291c", "#da291c", "#da291c"], vertical=True),
    "austria": dict(name="오스트리아", walk="ÖSTERREICH WALK", flag="🇦🇹", theme="#a3202a", lang="독일어(오스트리아)", emoji="⛪", first="슈테판 대성당", km="330",
                    icon="wheel", bands=["#c8102e", "#ffffff", "#c8102e"]),
    "hungary": dict(name="헝가리", walk="MAGYARORSZÁG WALK", flag="🇭🇺", theme="#3d6b4a", lang="헝가리어", emoji="👼", first="영웅 광장", km="6.0",
                    icon="dome", bands=["#ce2939", "#ffffff", "#477050"]),
    "spain": dict(name="스페인", walk="ESPAÑA WALK", flag="🇪🇸", theme="#aa151b", lang="스페인어", emoji="👑", first="마드리드 왕궁", km="1500",
                  icon="spires", bands=["#aa151b", "#f1bf00", "#f1bf00", "#aa151b"]),
}

SHAPES = {
    "castle": ["......X.....X...", ".....XXX...XXX..", ".....XXX...XXX..", "....XXXXXXXXXXX.", "....X.X.X.X.X.X.",
               "....XXXXXXXXXXX.", "....XX.XXX.XXXX.", "....XXXXXXXXXXX.", "....XXXX..XXXXX.", "....XXXX..XXXXX."],
    "tower": [".......X........", "......XXX.......", "......X.X.......", "......XXX.......", "......X.X.......",
              ".....XXXXX......", ".....X.X.X......", ".....XXXXX......", ".....X.X.X......", ".....XXXXX......"],
    "wheel": ["......XXXX......", "....XX....XX....", "...X...XX...X...", "..X....XX....X..", "..X.XXXXXXXX.X..",
              "..X....XX....X..", "...X...XX...X...", "....XX.XX.XX....", "......XXXX......", ".....X....X....."],
    "dome": [".......X........", "......XXX.......", ".....XXXXX......", "....XXXXXXX.....", "...XXXXXXXXX....",
             "...X.X.X.X.X....", "..XXXXXXXXXXX...", "..X.X.X.X.X.X...", "..XXXXXXXXXXX...", "..XXXXX.XXXXX..."],
    "spires": ["....X..X..X.....", "....X..X..X.....", "...XX.XXX.XX....", "...XX.XXX.XX....", "...XXXXXXXXX....",
               "...XXXXXXXXX....", "...X.XXXXX.X....", "...XXXXXXXXX....", "...XXXX.XXXX....", "...XXXX.XXXX...."],
}


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def make_icons(cid, c, out):
    img = Image.new("RGB", (16, 16), (190, 218, 236))
    for y, row in enumerate(SHAPES[c["icon"]]):
        for x, ch in enumerate(row):
            if ch == "X":
                img.putpixel((x, y + 1), (248, 244, 234))
    bands = [hexrgb(b) for b in c["bands"]]
    for y in range(11, 16):
        for x in range(16):
            if c.get("vertical"):
                col = bands[min(len(bands) - 1, x * len(bands) // 16)]
            else:
                col = bands[min(len(bands) - 1, (y - 11) * len(bands) // 5)]
            if c.get("tri") and x <= (2 - abs(y - 13)) * 2:
                col = hexrgb(c["tri"])
            img.putpixel((x, y), col)
    (out / "icons").mkdir(parents=True, exist_ok=True)
    for size in (192, 512, 180):
        img.resize((size, size), Image.NEAREST).save(out / "icons" / f"icon-{size}.png")


def josa_ro(word):
    # 받침이 있으면 "으로", 없거나 ㄹ 받침이면 "로"
    code = ord(word[-1]) - 0xAC00
    if 0 <= code < 11172:
        jong = code % 28
        return word + ("로" if jong in (0, 8) else "으로")
    return word + "로"


def build(cid):
    c = CITIES[cid]
    src = HERE / "cities" / cid
    out = ROOT / "europe" / cid
    (out / "js").mkdir(parents=True, exist_ok=True)
    (out / "lib").mkdir(parents=True, exist_ok=True)
    for f in ("three.min.js", "three.LICENSE", "peerjs.min.js", "peerjs.LICENSE"):
        shutil.copy(LIB / f, out / "lib" / f)
    for f in ("world.js", "main.js", "net.js"):
        shutil.copy(SHARED / f, out / "js" / f)
    for f in ("data.js", "landmarks.js"):
        shutil.copy(src / f, out / "js" / f)
    title = c["name"] + " 탐방"
    html = (SHARED / "index.html").read_text()
    for k, v in {"TITLE": title, "THEME": c["theme"], "TO": josa_ro(c["name"]), "EMOJI": c["emoji"], "FIRST": c["first"],
                 "NAME": c["name"], "KM": c["km"], "FLAG": c["flag"], "WALK": c["walk"], "LANGKO": c["lang"]}.items():
        html = html.replace("{{" + k + "}}", v)
    assert "{{" not in html
    (out / "index.html").write_text(html)
    (out / "manifest.json").write_text(f"""{{
  "name": "{title}",
  "short_name": "{title}",
  "description": "{c['name']} 곳곳을 걸으며 명소 9곳에서 이야기를 듣고 {c['lang']} 한마디와 퀴즈로 여권 도장을 모아요",
  "lang": "ko",
  "id": "/class-quiz/europe/{cid}/",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#cfe3ee",
  "theme_color": "{c['theme']}",
  "icons": [
    {{ "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" }},
    {{ "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }}
  ]
}}
""")
    sw = (ROOT / "europe" / "rome" / "sw.js").read_text()
    sw = sw.replace("// 로마 탐방 오프라인 지원", f"// {title} 오프라인 지원")
    sw = sw.replace('const CACHE = "rome-v1";', f'const CACHE = "{cid}-v1";')
    sw = sw.replace('key.startsWith("rome-")', f'key.startsWith("{cid}-")')
    sw = sw.replace('  "./js/world.js",\n', '  "./js/world.js",\n  "./js/landmarks.js",\n')
    assert f'"{cid}-v1"' in sw and "landmarks.js" in sw and "rome" not in sw
    (out / "sw.js").write_text(sw)
    make_icons(cid, c, out)
    print("만들었어요:", out.relative_to(ROOT))


if __name__ == "__main__":
    for cid in (sys.argv[1:] or CITIES):
        build(cid)
