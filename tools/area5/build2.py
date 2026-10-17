import re
from scene import scene, ORANGE, BLUE, SHADE, GREEN, GRAY
css = re.search(r"<style>(.*?)</style>", open("worksheet.html").read(), re.S).group(1)
D = {"dash": "6 4"}
def H(a, b, c="#222", sw=1.5): return ("seg", a, b, {"dash": "6 4", "color": c, "sw": sw})
def blank(w=70): return f'<span class="blank" style="width:{w}px"></span>'

# ================= concept figures =================
# rectangle/square with unit squares
k_rect = scene([("grid", 0, 0, 5, 3), ("poly", [(0, 0), (5, 0), (5, 3), (0, 3)], {"fill": "none"}),
                ("lab", (0, 0), (5, 0), "가로 5 cm", {"side": -1}), ("lab", (0, 0), (0, 3), "세로 3 cm", {"side": 1, "off": 34})], w=260, h=140)
# parallelogram -> rectangle
pg = [(0, 0), (8, 0), (11, 5), (3, 5)]
k_pg1 = scene([("poly", pg), ("poly", [(0, 0), (3, 0), (3, 5)], {"fill": SHADE}), H((3, 5), (3, 0), BLUE, 2.4), ("right", (3, 0), (3, 5), (8, 0), {"color": BLUE}),
               ("seg", (0, 0), (8, 0), {"color": ORANGE, "sw": 4}), ("lab", (0, 0), (8, 0), "밑변", {"side": -1, "color": ORANGE}),
               ("lab", (3, 0), (3, 5), "높이", {"side": -1, "color": BLUE, "off": 20})], w=200, h=135)
k_pg2 = scene([("poly", [(3, 0), (11, 0), (11, 5), (3, 5)]), ("poly", [(8, 0), (11, 0), (11, 5)], {"fill": SHADE}),
               ("seg", (3, 0), (11, 0), {"color": ORANGE, "sw": 4}), ("lab", (3, 0), (11, 0), "밑변", {"side": -1, "color": ORANGE}),
               ("seg", (3, 0), (3, 5), {"color": BLUE, "sw": 2.4}), ("lab", (3, 0), (3, 5), "높이", {"side": -1, "color": BLUE, "off": 20})], w=200, h=135)
# many heights same
k_pg3 = scene([("poly", [(0, 0), (10, 0), (14, 5), (4, 5)]), H((4, 5), (4, 0), BLUE), H((7, 5), (7, 0), BLUE), H((10, 5), (10, 0), BLUE),
               ("right", (4, 0), (4, 5), (10, 0)), ("right", (7, 0), (7, 5), (10, 0)), ("right", (10, 0), (10, 5), (0, 0)),
               ("seg", (10, 0), (14, 5), {"color": "#c92a2a", "sw": 3})], w=210, h=125)
# two pairs parallelogram
pp = [(0, 0), (30, 0), (45, 20), (15, 20)]
def foot(a, p, d):
    t = ((a[0] - p[0]) * d[0] + (a[1] - p[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2); return (p[0] + t * d[0], p[1] + t * d[1])
F2 = foot((15, 20), (30, 0), (15, 20))  # foot from vertex (15,20) onto side (30,0)-(45,20): (34.2, 5.6), inside the side
k_pair1 = scene([("poly", pp), ("seg", (0, 0), (30, 0), {"color": ORANGE, "sw": 4}), H((15, 20), (15, 0), BLUE, 2.4), ("right", (15, 0), (15, 20), (0, 0), {"color": BLUE})], w=200, h=130)
k_pair2 = scene([("poly", pp), ("seg", (30, 0), (45, 20), {"color": ORANGE, "sw": 4}), H((15, 20), F2, BLUE, 2.4), ("right", F2, (15, 20), (30, 0), {"color": BLUE})], w=200, h=130)
# rhombus in rectangle
k_rh = scene([("poly", [(0, 0), (8, 0), (8, 6), (0, 6)], {"fill": "none", "stroke": GRAY, "sw": 1.2}),
              ("poly", [(4, 0), (8, 3), (4, 6), (0, 3)]), H((0, 3), (8, 3), ORANGE, 2.4), H((4, 0), (4, 6), BLUE, 2.4),
              ("text", (1.5, 3), "대각선 ①", {"dy": -12, "color": ORANGE, "weight": 800, "size": 12.5}),
              ("text", (4, 5.4), "대각선 ②", {"dx": 34, "color": BLUE, "weight": 800, "size": 12.5})], w=230, h=150)
# trapezoid doubled
k_tr1 = scene([("poly", [(0, 0), (8, 0), (6, 4), (2, 4)]), ("seg", (2, 4), (6, 4), {"color": ORANGE, "sw": 4}), ("seg", (0, 0), (8, 0), {"color": "#7048E8", "sw": 4}),
               H((2, 4), (2, 0), BLUE, 2.2), ("right", (2, 0), (2, 4), (8, 0), {"color": BLUE}),
               ("lab", (2, 4), (6, 4), "윗변", {"side": 1, "color": ORANGE}), ("lab", (0, 0), (8, 0), "아랫변", {"side": -1, "color": "#7048E8"}),
               ("lab", (2, 0), (2, 4), "높이", {"side": -1, "color": BLUE, "off": 18})], w=200, h=135)
k_tr2 = scene([("poly", [(0, 0), (8, 0), (6, 4), (2, 4)]), ("poly", [(8, 0), (12, 0), (14, 4), (6, 4)], {"fill": SHADE}),
               ("lab", (0, 0), (12, 0), "아랫변 + 윗변", {"side": -1}), ("lab", (2, 0), (2, 4), "높이", {"side": -1, "color": BLUE, "off": 18}), H((2, 4), (2, 0), BLUE, 2)], w=240, h=135)

# ================= practice 1 =================
q1 = scene([("poly", [(0, 0), (9, 0), (9, 6), (0, 6)]), ("lab", (0, 0), (9, 0), "9 cm", {"side": -1}), ("lab", (9, 0), (9, 6), "6 cm", {"side": -1, "off": 22})], w=210, h=140)
q2 = scene([("poly", [(0, 0), (7, 0), (7, 7), (0, 7)]), ("lab", (0, 0), (7, 0), "7 cm", {"side": -1}),
            ("right", (0, 0), (7, 0), (0, 7)), ("right", (7, 0), (0, 0), (7, 7))], w=210, h=140)
q3 = scene([("poly", [(0, 0), (12, 0), (17.66, 7), (5.66, 7)]), H((5.66, 7), (5.66, 0)), ("right", (5.66, 0), (5.66, 7), (12, 0)),
            ("lab", (0, 0), (12, 0), "12 cm", {"side": -1}), ("lab", (5.66, 0), (5.66, 7), "7 cm", {"side": -1, "off": 20, "t": 0.45}),
            ("lab", (12, 0), (17.66, 7), "9 cm", {"side": -1})], w=230, h=140)
q4 = scene([("poly", [(0, 0), (5, 0), (13, 8), (8, 8)]), ("seg", (5, 0), (8, 0), {"dash": "2 3", "color": GRAY}), H((8, 8), (8, 0)), ("right", (8, 0), (8, 8), (0, 0)),
            ("lab", (0, 0), (5, 0), "5 cm", {"side": -1}), ("lab", (8, 0), (8, 8), "8 cm", {"side": 1, "off": 20})], w=230, h=150)
q5 = scene([("poly", [(0, 7), (5, 0), (10, 7), (5, 14)]), H((0, 7), (10, 7)), H((5, 0), (5, 14)), ("right", (5, 7), (10, 7), (5, 14)),
            ("lab", (0, 7), (10, 7), "10 cm", {"side": -1, "t": 0.33, "off": 11}), ("lab", (5, 7), (5, 14), "14 cm", {"side": -1, "t": 0.55, "off": 24})], w=220, h=190)
q6 = scene([("poly", [(0, 0), (12, 0), (9, 4), (3, 4)]), H((3, 4), (3, 0)), ("right", (3, 0), (3, 4), (12, 0)),
            ("lab", (3, 4), (9, 4), "6 cm", {"side": 1}), ("lab", (0, 0), (12, 0), "12 cm", {"side": -1}), ("lab", (3, 0), (3, 4), "4 cm", {"side": -1, "off": 20}),
            ("lab", (12, 0), (9, 4), "5 cm", {"side": -1, "off": 20})], w=240, h=150)
q7 = scene([("poly", [(0, 0), (0, 9), (6, 7), (6, 2)]), H((0, 4.5), (6, 4.5)), ("right", (0, 4.5), (6, 4.5), (0, 9)), ("right", (6, 4.5), (0, 4.5), (6, 7)),
            ("lab", (0, 0), (0, 9), "9 cm", {"side": 1, "off": 22}), ("lab", (6, 2), (6, 7), "5 cm", {"side": -1, "off": 22}),
            ("lab", (0, 4.5), (6, 4.5), "6 cm", {"side": 1, "t": 0.5, "off": 10})], w=200, h=160)

# ================= practice 2 =================
r1 = scene([("poly", [(0, 0), (9, 0), (13, 8), (4, 8)]), H((4, 8), (4, 0)), ("right", (4, 0), (4, 8), (9, 0)),
            ("lab", (0, 0), (9, 0), "9 cm", {"side": -1}), ("lab", (4, 0), (4, 8), "□ cm", {"side": -1, "off": 20})], w=210, h=150)
r2 = scene([("poly", pp), H((15, 20), (15, 0)), ("right", (15, 0), (15, 20), (0, 0)), H((15, 20), F2), ("right", F2, (15, 20), (30, 0)),
            ("lab", (0, 0), (30, 0), "30 cm", {"side": -1, "t": 0.3}), ("lab", (15, 0), (15, 20), "20 cm", {"side": 1, "off": 24, "t": 0.5}),
            ("lab", (30, 0), (45, 20), "25 cm", {"side": -1, "t": 0.6, "off": 26}), ("lab", (15, 20), F2, "□ cm", {"side": 1, "t": 0.5, "off": 18})], w=300, h=180)
r3 = scene([("poly", [(0, 5), (6, 0), (12, 5), (6, 10)]), H((0, 5), (12, 5)), H((6, 0), (6, 10)), ("right", (6, 5), (12, 5), (6, 10)),
            ("lab", (0, 5), (12, 5), "12 cm", {"side": -1, "t": 0.33, "off": 11}), ("lab", (6, 5), (6, 10), "□ cm", {"side": -1, "t": 0.55, "off": 24})], w=220, h=180)
r4 = scene([("poly", [(0, 0), (13, 0), (9, 6), (4, 6)]), H((4, 6), (4, 0)), ("right", (4, 0), (4, 6), (13, 0)),
            ("lab", (4, 6), (9, 6), "5 cm", {"side": 1}), ("lab", (0, 0), (13, 0), "13 cm", {"side": -1}), ("lab", (4, 0), (4, 6), "□ cm", {"side": -1, "off": 20})], w=220, h=140)
r5 = scene([("poly", [(0, 0), (11, 0), (4, 6), (0, 6)]), ("right", (0, 0), (11, 0), (0, 6)), ("right", (0, 6), (0, 0), (4, 6)),
            ("lab", (0, 6), (4, 6), "□ cm", {"side": 1}), ("lab", (0, 0), (11, 0), "11 cm", {"side": -1}), ("lab", (0, 0), (0, 6), "6 cm", {"side": 1, "off": 20})], w=220, h=140)

# ================= practice 3 =================
s1 = scene([("poly", [(0, 0), (14, 0), (14, 8), (0, 8)], {"fill": "#fff"}), ("poly", [(0, 0), (9, 0), (14, 8), (5, 8)], {"fill": SHADE}),
            ("lab", (0, 0), (9, 0), "9 cm", {"side": -1}), ("lab", (0, 8), (14, 8), "14 cm", {"side": 1}), ("lab", (0, 0), (0, 8), "8 cm", {"side": 1, "off": 22})], w=240, h=150)
s3 = scene([("poly", [(0, 0), (12, 0), (12, 8), (0, 8)], {"fill": "#fff"}), ("poly", [(6, 0), (12, 4), (6, 8), (0, 4)], {"fill": SHADE}),
            ("lab", (0, 0), (12, 0), "12 cm", {"side": -1}), ("lab", (0, 0), (0, 8), "8 cm", {"side": 1, "off": 22})], w=230, h=150)
s4 = scene([("poly", [(0, 0), (14, 0), (10, 8), (4, 8)], {"fill": "#fff"}), ("poly", [(0, 0), (14, 0), (7, 8)], {"fill": SHADE}),
            H((4, 8), (4, 0)), ("right", (4, 0), (4, 8), (14, 0)),
            ("lab", (4, 8), (10, 8), "6 cm", {"side": 1}), ("lab", (0, 0), (14, 0), "14 cm", {"side": -1}), ("lab", (4, 0), (4, 8), "8 cm", {"side": -1, "off": 20, "t": 0.3})], w=230, h=150)
s5 = scene([("poly", [(0, 0), (10, 0), (10, 5), (6, 5), (6, 8), (0, 8)]),
            ("lab", (0, 0), (10, 0), "10 cm", {"side": -1}), ("lab", (0, 0), (0, 8), "8 cm", {"side": 1, "off": 22}),
            ("lab", (10, 0), (10, 5), "5 cm", {"side": -1, "off": 22}), ("lab", (0, 8), (6, 8), "6 cm", {"side": 1})], w=220, h=150)
# grid same-area
g = [("grid", 0, 0, 23, 5),
     ("poly", [(1, 1), (5, 1), (6, 4), (2, 4)]), ("text", (3.5, 2.5), "가", {"weight": 800}),
     ("poly", [(7, 1), (11, 1), (11, 4), (7, 4)]), ("text", (9, 2.5), "나", {"weight": 800}),
     ("poly", [(12, 1), (15, 1), (17, 5), (14, 5)]), ("text", (14.5, 3), "다", {"weight": 800}),
     ("poly", [(17, 1), (21, 1), (22, 5), (18, 5)]), ("text", (19.5, 3), "라", {"weight": 800})]
gfig = scene(g, w=600, h=140, pad=6)
g2 = [("grid", 0, 0, 23, 5),
      ("poly", [(1, 1), (5, 1), (4, 5), (2, 5)]), ("text", (3, 2.7), "마", {"weight": 800}),
      ("poly", [(7, 1), (13, 1), (10, 5)]), ("text", (10, 2.3), "바", {"weight": 800}),
      ("poly", [(15, 3), (17, 1), (19, 3), (17, 5)]), ("text", (17, 3), "사", {"weight": 800})]
gfig2 = scene(g2, w=600, h=140, pad=6)

html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>{css}
.tbl{{border-collapse:collapse;width:100%;margin:6px 0}} .tbl td,.tbl th{{border:1px solid #bcd3b4;padding:5px 8px;text-align:center}} .tbl th{{background:#2F6B3A;color:#fff}}
.mini{{font-size:12.5px}}
</style></head><body>

<!-- PAGE 1 -->
<div class="page">
<div class="head"><span class="tag">개념 정리 ①</span><h1>사각형의 넓이 — 직사각형 · 평행사변형</h1><span class="nm">5-1 6단원 · 이름: ____________</span></div>
<div class="box"><b>① 넓이의 단위</b> — 한 변이 1 cm인 정사각형의 넓이가 <b>1 cm²</b>(1 제곱센티미터)예요.<br>
· 1 m² = 100 cm × 100 cm = <b>10000 cm²</b> &nbsp;&nbsp; · 1 km² = 1000 m × 1000 m = <b>1000000 m²</b><br>
<small>※ 길이를 먼저 같은 단위로 맞춘 다음 곱해요. (예: 가로 300 cm, 세로 2 m → 3 m × 2 m = 6 m²)</small></div>

<h2>② 직사각형과 정사각형</h2>
<div class="row" style="align-items:center"><div>{k_rect}</div>
<div style="max-width:380px">1 cm²가 가로로 5개씩 3줄 → 5 × 3 = 15 (cm²)<br>
<b>(직사각형의 넓이) = (가로) × (세로)</b><br>
<b>(정사각형의 넓이) = (한 변) × (한 변)</b></div></div>

<h2>③ 평행사변형 — 잘라서 옮기면 직사각형!</h2>
<div class="row" style="align-items:center">
<div>{k_pg1}<div class="cap">초록 삼각형을 잘라서</div></div><div style="font-size:28px;color:#2F6B3A">➜</div>
<div>{k_pg2}<div class="cap">반대쪽에 붙이면 직사각형</div></div></div>
<div class="key"><b>(평행사변형의 넓이) = (<span class="or">밑변</span>) × (<span class="bl">높이</span>)</b><br>
· <span class="or">밑변</span>: 평행한 두 변 중 하나 &nbsp;&nbsp; · <span class="bl">높이</span>: 두 밑변 사이의 거리(밑변과 <b>수직</b>인 선분)<br>
· ⚠ <b>기울어진 옆변의 길이는 높이가 아니에요!</b> 옆변을 곱하면 틀려요.</div>

<div class="row" style="align-items:center">
<div>{k_pg3}</div>
<div style="max-width:400px">점선은 모두 길이가 같은 <span class="bl">높이</span>예요. 높이는 어디에 그려도 같아요.<br>빨간 옆변은 높이보다 <b>길어요</b>. 그래서 옆변은 높이 대신 쓸 수 없어요.<br>
<small>👉 밑변과 높이가 같으면 모양이 달라도 평행사변형의 넓이는 같아요.</small></div></div>

<h2>④ 평행사변형에도 (밑변, 높이) 짝꿍이 2쌍 있어요</h2>
<div class="row" style="align-items:center">
<div>{k_pair1}<div class="cap"><span class="or">아래 변</span>이 밑변 ↔ <span class="bl">높이</span></div></div>
<div>{k_pair2}<div class="cap"><span class="or">옆 변</span>을 밑변으로 ↔ <span class="bl">높이</span></div></div>
<div style="max-width:200px" class="mini">삼각형에서 배운 것과 똑같아요!<br>같은 평행사변형이니 어느 짝꿍으로 계산해도 <b>넓이는 같아요.</b><br>(밑변①)×(높이①) = (밑변②)×(높이②)</div></div>
</div>

<!-- PAGE 2 -->
<div class="page">
<div class="head"><span class="tag">개념 정리 ②</span><h1>사각형의 넓이 — 마름모 · 사다리꼴</h1></div>
<h2>⑤ 마름모 — 둘러싼 직사각형의 절반!</h2>
<div class="row" style="align-items:center"><div>{k_rh}</div>
<div style="max-width:380px">마름모를 둘러싼 직사각형의 가로는 <span class="or">대각선 ①</span>, 세로는 <span class="bl">대각선 ②</span>와 같아요.<br>
마름모는 이 직사각형의 <b>절반</b>이에요.<br>
<div class="key"><b>(마름모의 넓이) = (<span class="or">한 대각선</span>) × (<span class="bl">다른 대각선</span>) ÷ 2</b></div>
<small>※ 마름모의 두 대각선은 서로 수직으로 만나고, 서로를 반으로 나눠요.</small></div></div>

<h2>⑥ 사다리꼴 — 두 개 붙이면 평행사변형!</h2>
<div class="row" style="align-items:center">
<div>{k_tr1}</div><div style="font-size:28px;color:#2F6B3A">➜</div><div>{k_tr2}</div></div>
<div class="row" style="align-items:flex-start"><div style="max-width:620px">
똑같은 사다리꼴을 거꾸로 돌려 붙이면 밑변이 <b>(아랫변 + 윗변)</b>인 평행사변형이 돼요. 사다리꼴은 그 절반이에요.
<div class="key"><b>(사다리꼴의 넓이) = {{(<span class="or">윗변</span>) + (<span style="color:#7048E8;font-weight:800">아랫변</span>)}} × (<span class="bl">높이</span>) ÷ 2</b><br>
· 윗변·아랫변: <b>평행한 두 변</b> (위·아래에 있지 않아도 돼요. 돌아가 있으면 평행한 두 변을 먼저 찾아요!)<br>
· 높이: 평행한 두 변 사이의 거리 &nbsp; · ⚠ 기울어진 옆변은 계산에 쓰지 않아요.</div></div></div>

<h2>⑦ 한눈에 정리</h2>
<table class="tbl">
<tr><th>도형</th><th>넓이 구하는 방법</th><th>꼭 기억할 점</th></tr>
<tr><td>직사각형</td><td>가로 × 세로</td><td>1 cm²가 몇 개인지 세는 것</td></tr>
<tr><td>정사각형</td><td>한 변 × 한 변</td><td>네 변의 길이가 모두 같아요</td></tr>
<tr><td>평행사변형</td><td>밑변 × 높이</td><td>옆변 ✕, 밑변과 수직인 높이 ○</td></tr>
<tr><td>삼각형</td><td>밑변 × 높이 ÷ 2</td><td>평행사변형의 절반</td></tr>
<tr><td>마름모</td><td>대각선 × 대각선 ÷ 2</td><td>둘러싼 직사각형의 절반</td></tr>
<tr><td>사다리꼴</td><td>(윗변 + 아랫변) × 높이 ÷ 2</td><td>두 개 붙인 평행사변형의 절반</td></tr>
</table>
<div class="box">💡 <b>거꾸로 구하기</b>: 넓이를 알면 모르는 길이를 구할 수 있어요.<br>
예) 평행사변형의 넓이가 48 cm², 밑변이 8 cm → 8 × □ = 48 → □ = 6 (cm)<br>
예) 마름모의 넓이가 30 cm², 한 대각선이 10 cm → 10 × □ ÷ 2 = 30 → 10 × □ = 60 → □ = 6 (cm)</div>
</div>

<!-- PAGE 3 -->
<div class="page">
<div class="head"><span class="tag">연습 1</span><h1>사각형의 넓이 구하기</h1><span class="nm">필요 없는 길이도 섞여 있어요!</span></div>
<div class="grid">
<div class="q"><span class="qn">1</span> 직사각형<div>{q1}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">2</span> 정사각형<div>{q2}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">3</span> 평행사변형<div>{q3}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">4</span> 평행사변형 <small>(높이가 바깥에 있어요)</small><div>{q4}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">5</span> 마름모<div>{q5}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">6</span> 사다리꼴<div>{q6}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">7</span> 사다리꼴 <small>(평행한 두 변이 어디일까요?)</small><div>{q7}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">8</span> □ 안에 알맞은 수를 써넣으세요.
<div class="step">(1) 3 m² = {blank(80)} cm²</div>
<div class="step">(2) 50000 cm² = {blank(60)} m²</div>
<div class="step">(3) 2 km² = {blank(90)} m²</div>
<div class="step">(4) 가로 300 cm, 세로 2 m인 직사각형의 넓이: {blank(50)} m²</div>
<div class="step">(5) 가로 4 km, 세로 3000 m인 직사각형의 넓이: {blank(50)} km²</div></div>
</div>
</div>

<!-- PAGE 4 -->
<div class="page">
<div class="head"><span class="tag">연습 2</span><h1>넓이로 길이 거꾸로 구하기</h1></div>
<div class="grid">
<div class="q"><span class="qn">1</span> 평행사변형의 넓이가 72 cm²입니다. 높이는?<div>{r1}</div><div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">2</span> 평행사변형에서 □ 안에 알맞은 수는? <span class="or">짝꿍 찾기!</span><div>{r2}</div>
<div class="step mini">· 아는 짝꿍: 밑변 {blank(40)} ↔ 높이 {blank(40)} → 넓이 {blank(40)} cm²</div>
<div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">3</span> 마름모의 넓이가 60 cm²입니다. □는?<div>{r3}</div><div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">4</span> 사다리꼴의 넓이가 54 cm²입니다. 높이는?<div>{r4}</div><div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">5</span> 사다리꼴의 넓이가 45 cm²입니다. 윗변은?<div>{r5}</div><div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">6</span> 그림 없이 풀어요.
<div class="step">(1) 넓이가 96 cm²이고 가로가 12 cm인 직사각형의 세로는? {blank(50)} cm</div>
<div class="step">(2) 넓이가 64 cm²인 정사각형의 한 변은? {blank(50)} cm</div>
<div class="step">(3) 둘레가 36 cm인 정사각형의 넓이는? {blank(50)} cm²</div>
<div class="step">(4) 두 대각선이 각각 8 cm, 9 cm인 마름모와 넓이가 같은 평행사변형의 밑변이 6 cm일 때, 높이는? {blank(50)} cm</div></div>
</div>
</div>

<!-- PAGE 5 -->
<div class="page">
<div class="head"><span class="tag">연습 3</span><h1>실력 다지기 · 도전</h1></div>
<div class="q"><span class="qn">1</span> 모눈 한 칸은 1 cm²입니다. 평행사변형 <b>가</b>와 넓이가 같은 도형을 모두 고르세요.
<div>{gfig}</div><div>{gfig2}</div>
<div class="ans">답: {blank(160)}</div></div>
<div class="grid">
<div class="q"><span class="qn">2</span> 직사각형 안에 평행사변형을 그렸어요. 색칠하지 않은 부분의 넓이는?<div>{s1}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">3</span> 직사각형의 각 변의 가운데를 이어 마름모를 그렸어요. 색칠한 마름모의 넓이는?<div>{s3}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">4</span> 사다리꼴에서 색칠한 삼각형을 뺀 나머지 부분의 넓이는?<div>{s4}</div><div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">5</span> 도형의 넓이는? <small>(모든 각은 직각이에요)</small><div>{s5}</div><div class="ans">답: {blank(60)} cm²</div></div>
</div>
<div class="q"><span class="qn">6</span> <span class="or">도전!</span> 둘레가 30 cm인 직사각형이 있습니다. 가로가 세로보다 3 cm 더 길 때, 이 직사각형의 넓이는 몇 cm²일까요?
<div class="work" style="height:50px"></div><div class="ans">답: {blank(60)} cm²</div></div>
</div>

<!-- PAGE 6 -->
<div class="page sol">
<div class="head"><span class="tag">정답과 풀이</span><h1>보호자용</h1></div>
<h2>연습 1</h2>
<p><b>1.</b> 9 × 6 = <b>54 cm²</b> &nbsp; <b>2.</b> 7 × 7 = <b>49 cm²</b></p>
<p><b>3.</b> 12 × 7 = <b>84 cm²</b> — 옆변 9 cm는 쓰지 않아요.</p>
<p><b>4.</b> 5 × 8 = <b>40 cm²</b> — 높이가 바깥에 있어도 밑변 × 높이. 늘린 점선은 밑변에 넣지 않아요.</p>
<p><b>5.</b> 10 × 14 ÷ 2 = <b>70 cm²</b></p>
<p><b>6.</b> (6 + 12) × 4 ÷ 2 = <b>36 cm²</b> — 옆변 5 cm는 쓰지 않아요.</p>
<p><b>7.</b> 평행한 두 변이 세로(9 cm, 5 cm), 높이는 가로 6 cm: (9 + 5) × 6 ÷ 2 = <b>42 cm²</b></p>
<p><b>8.</b> (1) 30000 (2) 5 (3) 2000000 (4) 3 m × 2 m = 6 (m²) (5) 4 km × 3 km = 12 (km²)</p>
<h2>연습 2</h2>
<p><b>1.</b> 9 × □ = 72 → <b>8 cm</b></p>
<p><b>2.</b> 밑변 30 cm ↔ 높이 20 cm → 넓이 600 cm², &nbsp;옆변 25 cm를 밑변으로 ↔ 높이 □: 25 × □ = 600 → <b>24 cm</b></p>
<p><b>3.</b> 12 × □ ÷ 2 = 60 → 12 × □ = 120 → <b>10 cm</b></p>
<p><b>4.</b> (5 + 13) × □ ÷ 2 = 54 → 18 × □ = 108 → <b>6 cm</b></p>
<p><b>5.</b> (□ + 11) × 6 ÷ 2 = 45 → (□ + 11) × 6 = 90 → □ + 11 = 15 → <b>4 cm</b></p>
<p><b>6.</b> (1) 8 cm (2) 8 cm (8 × 8 = 64) (3) 한 변 9 cm → 81 cm² (4) 마름모 8 × 9 ÷ 2 = 36 → 6 × □ = 36 → 6 cm</p>
<h2>연습 3</h2>
<p><b>1.</b> 가 = 4 × 3 = 12. 나 = 4 × 3 = 12 ○, 다 = 3 × 4 = 12 ○, 라 = 4 × 4 = 16 ✕, 마 = (2 + 4) × 4 ÷ 2 = 12 ○, 바 = 6 × 4 ÷ 2 = 12 ○, 사 = 4 × 4 ÷ 2 = 8 ✕ → <b>나, 다, 마, 바</b></p>
<p><b>2.</b> 직사각형 14 × 8 = 112, 평행사변형 9 × 8 = 72 → 112 − 72 = <b>40 cm²</b></p>
<p><b>3.</b> 대각선이 12 cm, 8 cm → 12 × 8 ÷ 2 = <b>48 cm²</b> (직사각형 96 cm²의 절반)</p>
<p><b>4.</b> 사다리꼴 (6 + 14) × 8 ÷ 2 = 80, 삼각형 14 × 8 ÷ 2 = 56 → 80 − 56 = <b>24 cm²</b></p>
<p><b>5.</b> 큰 직사각형 10 × 8 = 80 에서 빈 부분 4 × 3 = 12를 빼면 <b>68 cm²</b> (또는 6 × 8 + 4 × 5 = 68)</p>
<p><b>6.</b> 가로 + 세로 = 15, 가로가 3 더 길므로 가로 9, 세로 6 → 9 × 6 = <b>54 cm²</b></p>
<div class="key" style="margin-top:10px"><b>지도 팁</b><br>
· 평행사변형·사다리꼴에서 가장 흔한 실수는 <b>기울어진 옆변을 높이처럼 곱하는 것</b>이에요. "이 선이 밑변과 직각이야?"를 꼭 확인하게 해 주세요.<br>
· 연습 2의 2번은 삼각형 학습지의 "짝꿍 찾기"와 같은 원리예요. 평행사변형도 넓이는 하나라는 점을 연결해 주세요.<br>
· 사다리꼴은 돌아가 있으면 윗변·아랫변을 못 찾는 경우가 많아요. "서로 평행한 두 변"을 먼저 색칠하게 하면 좋아요.</div>
</div>
</body></html>"""
open("quad.html", "w").write(html)
