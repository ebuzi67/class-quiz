"""1학년 수학 모험 앱 만들기

Claude 대화에서 만든 게임(adventure.original.html, 아티팩트로 올린 그대로)에
앱으로 쓰는 데 필요한 것만 끼워 넣어서 math1/ 아래에 저장해요.
문제와 화면 디자인은 바꾸지 않아요.

  python3 tools/math1/build.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "math1"
COLOR = "#D0703A"

HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#FAF6EC">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="수학 모험">
"""

STYLE = """.install-guide{position:fixed;inset:0;background:rgba(23,28,40,.5);display:grid;place-items:center;padding:16px;z-index:10}
.install-guide>div{background:var(--surface);color:var(--ink);border-radius:var(--r);padding:22px 24px;max-width:420px;width:100%}
.install-guide h2{font-size:1.5rem;margin-bottom:8px}
.install-guide ol{margin:0 0 16px;padding-left:1.3em}
</style>"""

HEADER = """    <div class="row">
      <button class="btn ghost small" id="installBtn" hidden>📲 홈 화면에 설치</button>
      <button class="btn ghost small" id="toParent">부모님 기록</button>
    </div>"""

INSTALL = """
// ---------- 홈 화면에 설치하기 ----------
// 안드로이드·PC 크롬: 브라우저가 설치 가능하다고 알려 줄 때만 버튼을 보여 주고, 누르면 설치 창을 띄워요.
// 아이폰·아이패드: 자동 설치 창이 없어서, 누르면 "공유 → 홈 화면에 추가" 순서를 안내해요.
(()=>{
  const btn=document.getElementById('installBtn');let ev=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const upd=()=>{btn.hidden=standalone()||!(ev||ios)};
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;upd()});
  addEventListener('appinstalled',()=>{ev=null;upd()});
  btn.addEventListener('click',async()=>{
    if(ev){const e=ev;ev=null;e.prompt();try{await e.userChoice}catch(_){}upd();return}
    const g=document.createElement('div');g.className='install-guide';
    g.innerHTML=`<div role="dialog" aria-label="설치 안내"><h2>아이패드·아이폰에 설치하기</h2>
      <ol><li><b>사파리</b>에서 이 페이지를 열어요.</li>
      <li>위쪽(아이폰은 아래쪽)의 <b>공유 버튼</b>(□↑)을 눌러요.</li>
      <li><b>홈 화면에 추가</b>를 누르고 <b>추가</b>를 눌러요.</li></ol>
      <button class="btn small">알겠어요</button></div>`;
    g.addEventListener('click',e=>{if(e.target===g||e.target.closest('button'))g.remove()});
    document.body.appendChild(g);
  });
  upd();
})();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body>
</html>
"""


def replace_once(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new)


def build_page():
    html = (HERE / "adventure.original.html").read_text(encoding="utf-8")
    html = replace_once(html, "</style>", STYLE)
    html = replace_once(html, '    <button class="btn ghost small" id="toParent">부모님 기록</button>', HEADER)
    html = replace_once(html, "</style>\n\n<div", "</style>\n</head>\n<body>\n<div")
    assert html.rstrip().endswith("</script>")
    html = HEAD + html.rstrip()[: -len("</script>")] + INSTALL
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(html, encoding="utf-8")


def font(px):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()


def build_icon(size):
    # 주황 바탕에 성문(아치) 하나, 문 안에 +와 − 연산 친구, 아래에 황금 열쇠 구멍
    s = size * 4
    img = Image.new("RGB", (s, s), COLOR)
    d = ImageDraw.Draw(img)
    x0, x1, top, bot = s * 0.2, s * 0.8, s * 0.16, s * 0.86
    r = (x1 - x0) / 2
    d.pieslice([x0, top, x1, top + 2 * r], 180, 360, fill="#FAF6EC")
    d.rectangle([x0, top + r, x1, bot], fill="#FAF6EC")
    for cx, col, sym in ((s * 0.38, "#BFE6D3", "+"), (s * 0.62, "#C3DEF3", "−")):
        cy, rr = s * 0.5, s * 0.11
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr * 1.05], fill=col)
        for ex in (-0.32, 0.32):
            d.ellipse([cx + ex * rr - s * 0.012, cy - rr * 0.5, cx + ex * rr + s * 0.012, cy - rr * 0.22], fill="#24304A")
        d.text((cx, cy + rr * 0.35), sym, font=font(int(rr * 1.0)), fill="#24304A", anchor="mm")
    kx, ky = s * 0.5, s * 0.74
    d.ellipse([kx - s * 0.045, ky - s * 0.045, kx + s * 0.045, ky + s * 0.045], fill="#D39516")
    d.polygon([(kx - s * 0.025, ky), (kx + s * 0.025, ky), (kx + s * 0.04, ky + s * 0.09), (kx - s * 0.04, ky + s * 0.09)], fill="#D39516")
    img = img.resize((size, size), Image.LANCZOS)
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    img.save(OUT / "icons" / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    build_page()
    for size in (180, 192, 512):
        build_icon(size)
    print("done:", OUT)
