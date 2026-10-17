from fig import fig, ORANGE, BLUE
import math
import os
FD = os.environ.get("FONT_DIR", os.path.abspath("fonts"))  # NanumGothic-Regular/Bold/ExtraBold.ttf가 있는 폴더
fs = frozenset

# ---------- concept figures ----------
A = {"ㄱ": (6, 10), "ㄴ": (0, 0), "ㄷ": (14, 0)}
c1 = fig(A, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ")], hi={fs(("ㄴ", "ㄷ")): ORANGE}, hcolor=BLUE, w=200, h=135)
c2 = fig(A, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄷ", "ㄴ", "ㄱ", "ㄹ")], hi={fs(("ㄴ", "ㄱ")): ORANGE}, hcolor=BLUE, w=200, h=135)
c3 = fig(A, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄴ", "ㄱ", "ㄷ", "ㄹ")], hi={fs(("ㄱ", "ㄷ")): ORANGE}, hcolor=BLUE, w=200, h=135)

O1 = {"ㄱ": (-4, 8), "ㄴ": (0, 0), "ㄷ": (7, 0)}
c4 = fig(O1, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ")], exts=[("ㄴ", "ㄹ")], hi={fs(("ㄴ", "ㄷ")): ORANGE}, hcolor=BLUE, w=230, h=145)

Q = {"ㄱ": (8, 6), "ㄴ": (0, 0), "ㄷ": (15, 0)}
c5 = fig(Q, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")], hi={fs(("ㄴ", "ㄱ")): ORANGE}, hcolor=BLUE, w=230, h=145)
c6 = fig(Q, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")], hi={fs(("ㄴ", "ㄱ")): ORANGE}, hcolor=BLUE, deg=180 - math.degrees(math.atan2(6, 8)), w=230, h=145)

# ---------- practice 1 : find the height ----------
p11 = fig(A, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ"), ("ㄷ", "ㄴ", "ㄱ", "ㅁ")])
p12 = fig(Q, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㅁ"), ("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")])
R = {"ㄱ": (0, 0), "ㄷ": (25, 0), "ㄴ": (16, 12)}
p13 = fig(R, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄴ", "ㄱ", "ㄷ", "ㄹ")], right=[("ㄴ", "ㄱ", "ㄷ")])
B = {"ㄱ": (12, 9), "ㄴ": (0, 0), "ㄷ": (20, 0)}
B = {"ㄱ": (14, 6), "ㄴ": (0, 0), "ㄷ": (10, 0)}
p14 = fig(B, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ"), ("ㄷ", "ㄴ", "ㄱ", "ㅁ")], exts=[("ㄷ", "ㄹ")], deg=115)
D1 = {"ㄱ": (13, 7), "ㄴ": (0, 0), "ㄷ": (8, 0)}
p15 = fig(D1, [("ㄱ", "ㄴ", "ㄷ")], hi={fs(("ㄴ", "ㄷ")): ORANGE}, w=260, h=170)
D2 = {"ㄱ": (6, 8), "ㄴ": (0, 0), "ㄷ": (15, 0)}
p16 = fig(D2, [("ㄱ", "ㄴ", "ㄷ")], hi={fs(("ㄱ", "ㄷ")): ORANGE}, deg=-25, w=260, h=170)

# ---------- example & practice 2 ----------
ex = fig(Q, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㅁ"), ("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")],
         lens={("ㄴ", "ㄱ"): ("10 cm", "auto"), ("ㄴ", "ㄷ"): ("15 cm", "auto"), ("ㄷ", "ㄹ"): ("9 cm", "auto"), ("ㄱ", "ㅁ"): ("□ cm", 1)}, w=300, h=210)
T4 = {"ㄱ": (12, 16), "ㄴ": (0, 0), "ㄷ": (25, 0)}
p21 = fig(T4, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ"), ("ㄷ", "ㄴ", "ㄱ", "ㅁ")],
          lens={("ㄴ", "ㄱ"): ("20 cm", "auto", 0.35), ("ㄴ", "ㄷ"): ("25 cm", "auto", 0.25), ("ㄱ", "ㄹ"): ("□ cm", -1, 0.4), ("ㄷ", "ㅁ"): ("20 cm", -1, 0.3)})
Q2 = {"ㄱ": (6, 8), "ㄴ": (0, 0), "ㄷ": (20, 0)}
p22 = fig(Q2, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㅁ"), ("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")],
          lens={("ㄴ", "ㄱ"): ("10 cm", "auto", 0.4), ("ㄴ", "ㄷ"): ("20 cm", "auto", 0.7), ("ㄷ", "ㄹ"): ("16 cm", "auto"), ("ㄱ", "ㅁ"): ("□ cm", -1.4, 0.5)}, nudge={"ㄹ": (-4, 0), "ㄱ": (6, 0)})
p23 = fig(R, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄴ", "ㄱ", "ㄷ", "ㄹ")], right=[("ㄴ", "ㄱ", "ㄷ")],
          lens={("ㄱ", "ㄴ"): ("20 cm", "auto"), ("ㄴ", "ㄷ"): ("15 cm", "auto"), ("ㄱ", "ㄷ"): ("25 cm", "auto", 0.3), ("ㄴ", "ㄹ"): ("□ cm", 1)})
O2 = {"ㄱ": (-5, 14), "ㄴ": (0, 0), "ㄷ": (9, 0)}
p24 = fig(O2, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ")], exts=[("ㄴ", "ㄹ")],
          lens={("ㄴ", "ㄷ"): ("9 cm", "auto"), ("ㄱ", "ㄹ"): ("□ cm", 1)}, w=240, h=200)

# ---------- practice 3 ----------
T1 = {"ㄱ": (9, 12), "ㄴ": (0, 0), "ㄷ": (20, 0)}
p31 = fig(T1, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ"), ("ㄷ", "ㄴ", "ㄱ", "ㅁ")], deg=-28, w=280, h=210,
          lens={("ㄴ", "ㄱ"): ("15 cm", "auto", 0.4), ("ㄴ", "ㄷ"): ("20 cm", "auto", 0.3), ("ㄱ", "ㄹ"): ("12 cm", 1, 0.6), ("ㄷ", "ㅁ"): ("□ cm", -1, 0.45)})
Q3 = {"ㄱ": (8, 6), "ㄴ": (0, 0), "ㄷ": (20, 0)}
p32 = fig(Q3, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㅁ"), ("ㄷ", "ㄴ", "ㄱ", "ㄹ")], exts=[("ㄱ", "ㄹ")], deg=-35, w=280, h=210,
          lens={("ㄴ", "ㄱ"): ("10 cm", "auto"), ("ㄴ", "ㄷ"): ("20 cm", "auto", 0.75), ("ㄱ", "ㅁ"): ("6 cm", 1), ("ㄷ", "ㄹ"): ("□ cm", "auto")})
T3 = {"ㄱ": (5, 12), "ㄴ": (0, 0), "ㄷ": (26, 0)}
p34 = fig(T3, [("ㄱ", "ㄴ", "ㄷ")], heights=[("ㄱ", "ㄴ", "ㄷ", "ㄹ"), ("ㄷ", "ㄴ", "ㄱ", "ㅁ")], w=280, h=180,
          lens={("ㄴ", "ㄱ"): ("13 cm", "auto", 0.35), ("ㄴ", "ㄷ"): ("□ cm", "auto", 0.6), ("ㄱ", "ㄹ"): ("12 cm", -1, 0.6), ("ㄷ", "ㅁ"): ("24 cm", 1, 0.45)})

def blank(w=70): return f'<span class="blank" style="width:{w}px"></span>'

html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
@font-face{{font-family:NG;src:url(file://{FD}/NanumGothic-Regular.ttf);font-weight:400}}
@font-face{{font-family:NG;src:url(file://{FD}/NanumGothic-Bold.ttf);font-weight:700}}
@font-face{{font-family:NG;src:url(file://{FD}/NanumGothic-ExtraBold.ttf);font-weight:800}}
@page{{size:A4;margin:14mm 14mm 14mm 14mm}}
*{{box-sizing:border-box}}
body{{font-family:NG,sans-serif;color:#222;font-size:13.5px;line-height:1.6;margin:0}}
svg text{{font-family:NG,sans-serif}}
.page{{page-break-after:always}}
.page:last-child{{page-break-after:auto}}
.head{{display:flex;align-items:center;gap:10px;border-bottom:3px solid #2F6B3A;padding-bottom:6px;margin-bottom:12px}}
.tag{{background:#2F6B3A;color:#fff;font-weight:800;padding:3px 10px;border-radius:6px;font-size:13px}}
.head h1{{font-size:20px;margin:0;font-weight:800}}
.head .nm{{margin-left:auto;font-size:12.5px;color:#555}}
h2{{font-size:16px;margin:10px 0 4px;font-weight:800;color:#2F6B3A}}
.box{{border:2px solid #2F6B3A;border-radius:10px;padding:10px 14px;margin:8px 0;background:#F6FBF3}}
.key{{border:2px dashed {ORANGE};background:#FFF4EC;border-radius:10px;padding:8px 14px;margin:8px 0}}
.or{{color:{ORANGE};font-weight:800}} .bl{{color:{BLUE};font-weight:800}}
.row{{display:flex;justify-content:space-around;align-items:flex-start;gap:6px}}
.cap{{text-align:center;font-size:13px;margin-top:-4px}}
.q{{border-top:1px solid #ddd;padding:8px 0 6px;break-inside:avoid}}
.qn{{display:inline-block;background:#2F6B3A;color:#fff;font-weight:800;border-radius:5px;padding:0 7px;margin-right:6px;font-size:13px}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}}
.qa{{display:flex;gap:10px;align-items:center}}
.blank{{display:inline-block;border-bottom:1.5px solid #333;height:18px;vertical-align:bottom}}
.step{{margin:3px 0 3px 8px}}
.work{{height:34px}}
.ans{{text-align:right;margin-top:2px}}
.ox td{{padding:5px 8px;border-bottom:1px solid #ddd}} .ox{{border-collapse:collapse;width:100%}}
.oxb{{width:70px;text-align:center;color:#999}}
.sol p{{margin:3px 0}} .sol .q{{padding:5px 0}}
small{{color:#666}}
</style></head><body>

<!-- PAGE 1 -->
<div class="page">
<div class="head"><span class="tag">개념 정리</span><h1>삼각형의 밑변과 높이 — 짝꿍 찾기</h1><span class="nm">5-1 6단원 · 이름: ____________</span></div>

<div class="box"><b>① 높이란?</b><br>
<span class="or">밑변</span>을 하나 정하면, 그 밑변과 <b>마주 보는 꼭짓점</b>에서 밑변에 <b>수직(직각)</b>으로 그은 선분이 <span class="bl">높이</span>예요.<br>
👉 높이를 찾는 3단계: <b>(1)</b> 밑변을 정한다 → <b>(2)</b> 밑변과 마주 보는 꼭짓점을 찾는다 → <b>(3)</b> 그 꼭짓점에서 밑변 쪽으로 <b>직각 표시(⌐)</b>가 있는 선분을 찾는다.
</div>

<h2>② 한 삼각형에는 (밑변, 높이) 짝꿍이 3쌍 있어요</h2>
<div class="row">
<div>{c1}<div class="cap"><span class="or">밑변 ㄴㄷ</span> ↔ <span class="bl">높이 ㄱㄹ</span></div></div>
<div>{c2}<div class="cap"><span class="or">밑변 ㄱㄴ</span> ↔ <span class="bl">높이 ㄷㄹ</span></div></div>
<div>{c3}<div class="cap"><span class="or">밑변 ㄱㄷ</span> ↔ <span class="bl">높이 ㄴㄹ</span></div></div>
</div>
<div class="key">⭐ <b>같은 삼각형</b>이니까 어느 짝꿍으로 계산해도 <b>넓이는 똑같아요!</b><br>
&nbsp;&nbsp;&nbsp;&nbsp;(밑변①) × (높이①) ÷ 2 = (밑변②) × (높이②) ÷ 2 = 삼각형의 넓이<br>
&nbsp;&nbsp;&nbsp;&nbsp;→ 그래서 <b>짝꿍 하나로 넓이를 구한 뒤</b>, 다른 짝꿍의 모르는 길이를 거꾸로 구할 수 있어요.</div>

<h2>③ 높이가 삼각형 <u>바깥</u>에 있을 수도 있어요</h2>
<div class="row" style="align-items:center">
<div>{c4}<div class="cap"><span class="or">밑변 ㄴㄷ</span>을 점선으로 늘린 뒤,<br>ㄱ에서 직각으로 내린 <span class="bl">ㄱㄹ</span>이 높이</div></div>
<div style="max-width:330px">한 각이 둔각인 삼각형에서는 꼭짓점에서 수직으로 내린 선이 밑변 <b>밖</b>에 떨어져요.<br>
이럴 땐 밑변을 <b>점선으로 쭉 늘려서(연장선)</b> 그 위에 직각으로 만나는 선분을 찾아요.<br>
<small>※ 높이가 바깥에 있어도 넓이는 똑같이 <b>밑변 × 높이 ÷ 2</b>예요. 밑변은 실제 변의 길이(ㄴㄷ)만 쓰고, 늘린 점선 부분은 넣지 않아요!</small></div>
</div>

<h2>④ 꿀팁: 종이를 돌려 보세요! 🔄</h2>
<div class="row" style="align-items:center">
<div>{c5}<div class="cap">밑변 ㄱㄴ이 비스듬해서<br>높이 ㄷㄹ이 잘 안 보여요</div></div>
<div style="font-size:30px;color:#2F6B3A">➜</div>
<div>{c6}<div class="cap">밑변 ㄱㄴ이 <b>바닥</b>에 오도록 돌리면<br>ㄷㄹ이 <b>똑바로 선 높이</b>로 보여요!</div></div>
</div>
<div class="box" style="margin-top:4px">✔ 높이는 꼭 <b>세로로 서 있는 선</b>이 아니에요. <b>밑변과 직각</b>이기만 하면 비스듬해도, 바깥에 있어도 높이예요.<br>
✔ 직각삼각형에서는 직각을 이루는 <b>변 자체가 높이</b>가 되기도 해요.</div>
</div>

<!-- PAGE 2 -->
<div class="page">
<div class="head"><span class="tag">연습 1</span><h1>밑변의 짝꿍(높이) 찾기</h1><span class="nm">길이 계산 없이, 그림만 보고 찾아요</span></div>
<p style="margin:0 0 4px">밑변과 <b>마주 보는 꼭짓점</b>을 먼저 찾고, 그 꼭짓점에서 시작해서 <b>직각 표시</b>가 있는 선분을 찾아보세요.</p>
<div class="grid">
<div class="q"><span class="qn">1</span>
<div class="qa">{p11}</div>
<div class="step">(1) 밑변이 ㄴㄷ일 때 높이: 선분 {blank()}</div>
<div class="step">(2) 밑변이 ㄱㄴ일 때 높이: 선분 {blank()}</div></div>
<div class="q"><span class="qn">2</span>
<div class="qa">{p12}</div>
<div class="step">(1) 밑변이 ㄴㄷ일 때 높이: 선분 {blank()}</div>
<div class="step">(2) 밑변이 ㄱㄴ일 때 높이: 선분 {blank()}</div></div>
<div class="q"><span class="qn">3</span> <small>직각삼각형</small>
<div class="qa">{p13}</div>
<div class="step">(1) 밑변이 ㄱㄷ일 때 높이: 선분 {blank()}</div>
<div class="step">(2) 밑변이 ㄴㄷ일 때 높이: 선분 {blank()}</div>
<div class="step">(3) 밑변이 ㄱㄴ일 때 높이: 선분 {blank()}</div></div>
<div class="q"><span class="qn">4</span> <small>삼각형이 돌아가 있어요</small>
<div class="qa">{p14}</div>
<div class="step">(1) 밑변이 ㄴㄷ일 때 높이: 선분 {blank()}</div>
<div class="step">(2) 밑변이 ㄱㄴ일 때 높이: 선분 {blank()}</div></div>
</div>
<div class="q" style="border-top:2px solid #2F6B3A;margin-top:6px"><b>직접 그려 보기 ✏️</b> 주황색 변을 밑변으로 할 때 높이를 자와 삼각자로 그려 보세요. (필요하면 밑변을 점선으로 늘려요.)
<div class="row"><div><span class="qn">5</span><br>{p15}</div><div><span class="qn">6</span><br>{p16}</div></div></div>
</div>

<!-- PAGE 3 -->
<div class="page">
<div class="head"><span class="tag">연습 2</span><h1>넓이가 같다는 것을 이용해 길이 구하기</h1></div>
<div class="box"><b>예제</b> 삼각형 ㄱㄴㄷ에서 선분 ㄱㅁ의 길이는 몇 cm일까요?
<div class="row" style="align-items:center"><div>{ex}</div>
<div style="max-width:360px">
<b>1단계 · 짝꿍 찾기</b><br>밑변 ㄱㄴ(10 cm) ↔ 높이 ㄷㄹ(9 cm) — <small>길이를 둘 다 아는 짝꿍!</small><br>
밑변 ㄴㄷ(15 cm) ↔ 높이 ㄱㅁ(□ cm) — <small>구해야 하는 짝꿍</small><br>
<b>2단계 · 아는 짝꿍으로 넓이 구하기</b><br>10 × 9 ÷ 2 = 45 (cm²)<br>
<b>3단계 · 다른 짝꿍으로 거꾸로 구하기</b><br>15 × □ ÷ 2 = 45 → 15 × □ = 90 → □ = 6<br>
<b>답: 6 cm</b></div></div></div>

<div class="grid">
<div class="q"><span class="qn">1</span> 선분 ㄱㄹ의 길이를 구하세요.
<div>{p21}</div>
<div class="step">· 아는 짝꿍: 밑변 {blank(45)} ↔ 높이 {blank(45)}</div>
<div class="step">· 넓이: {blank(40)} × {blank(40)} ÷ 2 = {blank(40)} cm²</div>
<div class="step">· 25 × □ ÷ 2 = {blank(40)} → □ = {blank(40)}</div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">2</span> 선분 ㄱㅁ의 길이를 구하세요.
<div>{p22}</div>
<div class="step">· 아는 짝꿍: 밑변 {blank(45)} ↔ 높이 {blank(45)}</div>
<div class="step">· 넓이: {blank(40)} × {blank(40)} ÷ 2 = {blank(40)} cm²</div>
<div class="step">· 20 × □ ÷ 2 = {blank(40)} → □ = {blank(40)}</div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">3</span> 직각삼각형에서 선분 ㄴㄹ의 길이를 구하세요.
<div>{p23}</div>
<div class="step"><small>힌트: 밑변을 ㄴㄷ으로 하면 높이는 어떤 <b>변</b>일까요?</small></div>
<div class="work"></div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">4</span> 삼각형 ㄱㄴㄷ의 넓이가 63 cm²일 때, □ 안에 알맞은 수를 써넣으세요.
<div>{p24}</div>
<div class="work"></div>
<div class="ans">답: {blank(60)} cm</div></div>
</div>
</div>

<!-- PAGE 4 -->
<div class="page">
<div class="head"><span class="tag">연습 3</span><h1>실력 다지기 · 도전</h1></div>
<div class="grid">
<div class="q"><span class="qn">1</span> 선분 ㄷㅁ의 길이를 구하세요.<br><small>삼각형이 기울어져 있어요. 종이를 돌려 봐도 좋아요!</small>
<div>{p31}</div><div class="work"></div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">2</span> 선분 ㄷㄹ의 길이를 구하세요.<br><small>높이가 삼각형 바깥에 있는 짝꿍을 찾아요.</small>
<div>{p32}</div><div class="work"></div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">3</span> 선분 ㄴㄷ의 길이를 구하세요. <span class="or">도전!</span>
<div>{p34}</div><div class="work"></div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">4</span> 그림 없이 풀어요. <span class="or">도전!</span><br>
어떤 삼각형에서 길이가 18 cm인 변을 밑변으로 하면 높이가 10 cm입니다. 이 삼각형의 다른 변 15 cm를 밑변으로 하면 높이는 몇 cm일까요?
<div class="work" style="height:60px"></div>
<div class="ans">답: {blank(60)} cm</div>
<span class="qn">5</span> 그림을 그려서 풀어 보세요.<br>
삼각형 ㄱㄴㄷ에서 변 ㄴㄷ은 12 cm, 꼭짓점 ㄱ에서 변 ㄴㄷ에 수직으로 그은 선분은 8 cm입니다. 변 ㄱㄷ이 16 cm일 때, 꼭짓점 ㄴ에서 변 ㄱㄷ(또는 그 연장선)에 수직으로 그은 선분은 몇 cm일까요?
<div class="work" style="height:60px"></div>
<div class="ans">답: {blank(60)} cm</div></div>
</div>

<h2>개념 확인 O / X</h2>
<table class="ox">
<tr><td>(1) 삼각형의 높이는 항상 삼각형 안쪽에 그려진다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(2) 한 삼각형에서 밑변을 다른 변으로 바꾸면 높이도 바뀐다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(3) 한 삼각형에서 밑변을 다른 변으로 바꾸면 넓이도 바뀐다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(4) 높이는 밑변과 마주 보는 꼭짓점에서 밑변(또는 그 연장선)에 수직으로 그은 선분이다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(5) 높이는 항상 세로(위아래)로 똑바로 서 있는 선이다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(6) 직각삼각형에서는 한 변이 그대로 높이가 될 수 있다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
</table>
</div>

<!-- PAGE 5 -->
<div class="page sol">
<div class="head"><span class="tag">정답과 풀이</span><h1>보호자용</h1></div>
<h2>연습 1</h2>
<p><b>1.</b> (1) ㄱㄹ (2) ㄷㅁ</p>
<p><b>2.</b> (1) ㄱㅁ (2) ㄷㄹ — 밑변 ㄱㄴ을 늘린 점선 위에 직각이 있어요. (교재 09번과 같은 모양)</p>
<p><b>3.</b> (1) ㄴㄹ (2) ㄱㄴ (3) ㄴㄷ — 직각을 끼고 있는 두 변은 서로의 높이예요.</p>
<p><b>4.</b> (1) ㄱㄹ (2) ㄷㅁ — 돌아가 있어도 '마주 보는 꼭짓점 + 직각'으로 찾아요.</p>
<p><b>5.</b> ㄴㄷ을 ㄷ 쪽으로 늘린 점선 위에, ㄱ에서 수직으로 내린 선분이 높이(삼각형 바깥).</p>
<p><b>6.</b> 꼭짓점 ㄴ에서 변 ㄱㄷ에 수직으로 내린 선분이 높이(삼각형 안쪽).</p>
<h2>연습 2</h2>
<p><b>1.</b> 밑변 ㄴㄱ(20) ↔ 높이 ㄷㅁ(20): 20 × 20 ÷ 2 = 200, &nbsp;25 × □ ÷ 2 = 200 → □ = <b>16 cm</b></p>
<p><b>2.</b> 밑변 ㄴㄱ(10) ↔ 높이 ㄷㄹ(16): 10 × 16 ÷ 2 = 80, &nbsp;20 × □ ÷ 2 = 80 → □ = <b>8 cm</b></p>
<p><b>3.</b> 밑변 ㄴㄷ(15) ↔ 높이 ㄱㄴ(20): 15 × 20 ÷ 2 = 150, &nbsp;25 × □ ÷ 2 = 150 → □ = <b>12 cm</b></p>
<p><b>4.</b> 9 × □ ÷ 2 = 63 → 9 × □ = 126 → □ = <b>14 cm</b> (높이가 바깥에 있어도 밑변은 9 cm 그대로)</p>
<h2>연습 3</h2>
<p><b>1.</b> 20 × 12 ÷ 2 = 120, &nbsp;15 × □ ÷ 2 = 120 → □ = <b>16 cm</b></p>
<p><b>2.</b> 밑변 ㄴㄷ(20) ↔ 높이 ㄱㅁ(6): 20 × 6 ÷ 2 = 60, &nbsp;밑변 ㄱㄴ(10) ↔ 높이 ㄷㄹ: 10 × □ ÷ 2 = 60 → □ = <b>12 cm</b></p>
<p><b>3.</b> 밑변 ㄴㄱ(13) ↔ 높이 ㄷㅁ(24): 13 × 24 ÷ 2 = 156, &nbsp;□ × 12 ÷ 2 = 156 → □ = <b>26 cm</b></p>
<p><b>4.</b> 18 × 10 ÷ 2 = 90, &nbsp;15 × □ ÷ 2 = 90 → □ = <b>12 cm</b></p>
<p><b>5.</b> 12 × 8 ÷ 2 = 48, &nbsp;16 × □ ÷ 2 = 48 → □ = <b>6 cm</b></p>
<h2>O / X</h2>
<p>(1) X — 둔각삼각형은 바깥에 있을 수 있어요. (2) O (3) X — 같은 삼각형이면 넓이는 하나! (4) O (5) X — 밑변과 직각이면 비스듬해도 높이. (6) O</p>
<div class="key" style="margin-top:12px"><b>지도 팁</b><br>
· 아이가 막히면 "<b>이 밑변과 마주 보는 꼭짓점은 어디야?</b>" → "<b>그 꼭짓점에서 직각 표시가 있는 선은?</b>" 두 질문만 반복해 주세요.<br>
· 교재 09번처럼 높이가 비스듬하거나 바깥에 있으면, 종이를 돌려 그 밑변을 바닥에 놓아 보게 하면 효과가 좋아요.<br>
· 문제 속 길이를 <b>(밑변, 높이) 짝꿍끼리 같은 색으로 동그라미</b> 치게 하면 짝을 잘못 맞추는 실수가 줄어요.</div>
</div>
</body></html>"""
open("worksheet.html", "w").write(html)
