import re
from scene import scene, ORANGE, BLUE, SHADE, GREEN, GRAY
css = re.search(r"<style>(.*?)</style>", open("worksheet.html").read(), re.S).group(1)
PINK = "#FFD8A8"
def H(a, b, c="#222", sw=1.5): return ("seg", a, b, {"dash": "6 4", "color": c, "sw": sw})
def T(p, s, dx=0, dy=0, **k): return ("text", p, s, {"dx": dx, "dy": dy, **k})
def blank(w=70): return f'<span class="blank" style="width:{w}px"></span>'

# ---------- concept ----------
k1 = scene([("poly", [(0, 0), (4, 0), (1.5, 4)]), ("poly", [(6, 0), (10, 0), (9, 4)], {"fill": SHADE}), ("poly", [(10, 0), (14, 0), (9, 4)], {"fill": PINK}),
            H((1.5, 4), (1.5, 0), BLUE), H((9, 4), (9, 0), BLUE), ("seg", (-1, 4), (15, 4), {"dash": "2 4", "color": GRAY, "sw": 1}),
            ("seg", (-1, 0), (15, 0), {"color": GRAY, "sw": 1}),
            ("lab", (0, 0), (4, 0), "밑변 4 cm", {"side": -1, "color": ORANGE}), ("lab", (6, 0), (14, 0), "밑변 8 cm (2배)", {"side": -1, "color": ORANGE}),
            T((2, 1.2), "가", weight=800), T((8.6, 1.2), "①", weight=800), T((11.2, 1.2), "②", weight=800)], w=380, h=150)
kg = scene([("grid", 0, 0, 22, 5),
            ("poly", [(1, 1), (4, 1), (2, 3)]), T((2.4, 1.6), "가", weight=800),
            ("poly", [(6, 1), (12, 1), (8, 3)]), T((8.6, 1.6), "나", weight=800),
            ("poly", [(14, 1), (20, 1), (16, 5)]), T((16.7, 2.2), "다", weight=800)], w=560, h=135, pad=6)
# situation figures
sa = scene([("poly", [(0, 0), (8, 0), (3, 6)], {"fill": SHADE}), ("poly", [(8, 0), (12, 0), (3, 6)], {"fill": PINK}), H((3, 6), (3, 0), BLUE),
            T((3, 6), "ㄱ", dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((8, 0), "ㄹ", dy=14), T((12, 0), "ㄷ", dx=10, dy=6),
            ("lab", (0, 0), (8, 0), "8 cm", {"side": -1, "t": 0.45}), ("lab", (8, 0), (12, 0), "4 cm", {"side": -1, "t": 0.6})], w=220, h=150)
sb = scene([("seg", (-1, 5), (17, 5), {"color": GRAY}), ("seg", (-1, 0), (17, 0), {"color": GRAY}),
            ("poly", [(1, 0), (5, 0), (0, 5)]), ("poly", [(6, 0), (10, 0), (8, 5)]), ("poly", [(11, 0), (15, 0), (16, 5)]),
            T((2, 1.4), "①", weight=800), T((8, 1.4), "②", weight=800), T((13.6, 1.4), "③", weight=800),
            T((17, 5), "평행", dx=-14, dy=-12, color=GRAY, size=12)], w=240, h=130)
sc = scene([("poly", [(2, 5), (7, 5), (12, 0), (0, 0)]), ("poly", [(2, 5), (7, 5), (12, 0)], {"fill": PINK}), ("seg", (2, 5), (12, 0), {"color": "#222", "sw": 1.8}),
            T((2, 5), "ㄱ", dx=-6, dy=-12), T((7, 5), "ㄹ", dx=6, dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((12, 0), "ㄷ", dx=10, dy=6),
            ("lab", (2, 5), (7, 5), "윗변", {"side": 1, "color": ORANGE}), ("lab", (0, 0), (12, 0), "아랫변", {"side": -1, "color": ORANGE})], w=220, h=140)

# ---------- practice 1 ----------
g13 = scene([("grid", 0, 0, 24, 7),
             ("poly", [(1, 1), (3, 1), (2, 4)]), T((2, 1.8), "가", weight=800),
             ("poly", [(5, 1), (9, 1), (5, 4)]), T((6.2, 1.8), "나", weight=800),
             ("poly", [(11, 1), (17, 1), (15, 4)]), T((14.3, 1.9), "다", weight=800),
             ("poly", [(19, 1), (23, 1), (20, 7)]), T((20.7, 2.5), "라", weight=800)], w=600, h=185, pad=6)
g14 = scene([("grid", 0, 0, 24, 6), ("poly", [(1, 1), (4, 1), (2, 3)]), T((2.4, 1.6), "마", weight=800)], w=600, h=160, pad=6)

# ---------- practice 2 ----------
p1 = scene([("poly", [(0, 0), (8, 0), (3, 7.5)]), ("poly", [(8, 0), (12, 0), (3, 7.5)], {"fill": SHADE}),
            T((3, 7.5), "ㄱ", dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((8, 0), "ㄹ", dy=16), T((12, 0), "ㄷ", dx=10, dy=6),
            ("lab", (0, 0), (8, 0), "8 cm", {"side": -1, "t": 0.45}), ("lab", (8, 0), (12, 0), "4 cm", {"side": -1, "t": 0.6}),
            T((8.7, 1.3), "15 cm²", size=12, weight=700)], w=300, h=210)
p2 = scene([("poly", [(0, 0), (12, 0), (4, 10)]), ("seg", (4, 10), (4, 0)), ("seg", (4, 10), (8, 0)),
            T((4, 10), "ㄱ", dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((4, 0), "ㄹ", dy=16), T((8, 0), "ㅁ", dy=16), T((12, 0), "ㄷ", dx=10, dy=6),
            ("lab", (0, 0), (4, 0), "4 cm", {"side": -1, "t": 0.5}), ("lab", (4, 0), (8, 0), "4 cm", {"side": -1, "t": 0.5}), ("lab", (8, 0), (12, 0), "4 cm", {"side": -1, "t": 0.5})], w=300, h=230)
p3 = scene([("poly", [(0, 0), (10, 0), (7, 6), (2, 6)]), ("poly", [(2, 6), (7, 6), (10, 0)], {"fill": SHADE}), ("seg", (2, 6), (10, 0), {"sw": 1.8}),
            T((2, 6), "ㄱ", dx=-6, dy=-12), T((7, 6), "ㄹ", dx=6, dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((10, 0), "ㄷ", dx=10, dy=6),
            ("lab", (2, 6), (7, 6), "5 cm", {"side": 1}), ("lab", (0, 0), (10, 0), "10 cm", {"side": -1}), T((6.4, 4.6), "15 cm²", size=12, weight=700)], w=250, h=160)
p4 = scene([("poly", [(0, 0), (10, 0), (13, 4.8), (3, 4.8)]), ("poly", [(0, 0), (10, 0), (7, 4.8)], {"fill": SHADE}),
            T((3, 4.8), "ㄱ", dx=-6, dy=-12), T((7, 4.8), "ㅁ", dy=-12), T((13, 4.8), "ㄹ", dx=6, dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((10, 0), "ㄷ", dx=10, dy=6)], w=250, h=150)
p5 = scene([("seg", (-1, 5), (24, 5), {"color": GRAY}), ("seg", (-1, 0), (24, 0), {"color": GRAY}),
            ("poly", [(0, 0), (4, 0), (5, 5)]), T((3, 1.5), "가", weight=800),
            ("poly", [(7, 0), (15, 0), (8, 5)]), T((10, 1.5), "나", weight=800),
            ("poly", [(17, 0), (21, 0), (23, 5), (19, 5)]), T((20, 2.5), "다", weight=800),
            ("lab", (0, 0), (4, 0), "4 cm", {"side": -1}), ("lab", (7, 0), (15, 0), "8 cm", {"side": -1}), ("lab", (17, 0), (21, 0), "4 cm", {"side": -1}),
            T((24, 5), "가 // 나", dx=-24, dy=-12, color=GRAY, size=11)], w=560, h=140)

# ---------- practice 3 ----------
q1 = scene([("poly", [(0, 0), (12, 0), (3, 12)]), ("seg", (3, 12), (4, 0)), ("seg", (4, 0), (7.5, 6)), ("poly", [(4, 0), (12, 0), (7.5, 6)], {"fill": SHADE}),
            T((3, 12), "ㄱ", dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((4, 0), "ㄹ", dx=5, dy=16), T((12, 0), "ㄷ", dx=10, dy=6), T((7.5, 6), "ㅁ", dx=12, dy=-4),
            ("lab", (0, 0), (4, 0), "4 cm", {"side": -1, "t": 0.4}), ("lab", (4, 0), (12, 0), "8 cm", {"side": -1, "t": 0.55}),
            ("seg", (4.85, 8.7), (5.65, 9.3), {"sw": 2}), ("seg", (9.35, 2.7), (10.15, 3.3), {"sw": 2})], w=280, h=230)
q4 = scene([("poly", [(0, 0), (12, 0), (7, 8), (3, 8)]), ("seg", (3, 8), (12, 0), {"sw": 1.8}),
            T((3, 8), "ㄱ", dx=-6, dy=-12), T((7, 8), "ㄹ", dx=6, dy=-12), T((0, 0), "ㄴ", dx=-10, dy=6), T((12, 0), "ㄷ", dx=10, dy=6),
            ("lab", (3, 8), (7, 8), "4 cm", {"side": 1}), ("lab", (0, 0), (12, 0), "12 cm", {"side": -1})], w=240, h=170)

html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>{css}
.tbl{{border-collapse:collapse;width:100%;margin:6px 0}} .tbl td,.tbl th{{border:1px solid #bcd3b4;padding:4px 8px;text-align:center}} .tbl th{{background:#2F6B3A;color:#fff}}
.mini{{font-size:12.5px}}
.sit{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}} .sit>div{{border:1.5px solid #bcd3b4;border-radius:8px;padding:6px;text-align:center;font-size:12.5px}}
</style></head><body>

<!-- PAGE 1 -->
<div class="page">
<div class="head"><span class="tag">개념 정리</span><h1>밑변이 2배면 넓이도 2배!</h1><span class="nm">5-1 6단원 · 이름: ____________</span></div>
<div class="box"><b>① 높이가 같을 때</b>, 밑변이 2배, 3배가 되면 넓이도 2배, 3배가 돼요.<br>
<small>왜냐하면 넓이 = 밑변 × 높이 ÷ 2 에서 <b>높이와 ÷ 2는 그대로</b>이고 밑변만 커지기 때문이에요.</small></div>
<div class="row" style="align-items:center"><div>{k1}</div>
<div style="max-width:300px" class="mini">밑변 8 cm인 삼각형을 가운데에서 나누면 <b>밑변 4 cm인 삼각형 ①, ②</b>가 생겨요.<br>①과 ②는 <b>가</b>와 밑변도 높이도 같으니 넓이가 같아요.<br>→ 밑변 8 cm인 삼각형 = 가 2개 = <b>가의 2배</b></div></div>
<table class="tbl">
<tr><th>높이 4 cm인 삼각형</th><th>밑변 3 cm</th><th>밑변 6 cm (2배)</th><th>밑변 9 cm (3배)</th><th>밑변 12 cm (4배)</th></tr>
<tr><td>넓이</td><td>6 cm²</td><td>12 cm² (2배)</td><td>18 cm² (3배)</td><td>24 cm² (4배)</td></tr>
</table>

<h2>② 높이가 2배일 때도, 둘 다 2배일 때도</h2>
<div>{kg}</div>
<div class="mini" style="margin-top:-2px">모눈 한 칸 = 1 cm² &nbsp;·&nbsp; <b>가</b>: 밑변 3 cm, 높이 2 cm → 3 cm² &nbsp;·&nbsp; <b>나</b>: 밑변만 2배 → 6 cm² (<b>2배</b>) &nbsp;·&nbsp; <b>다</b>: 밑변 2배, 높이 2배 → 12 cm² (<b>2 × 2 = 4배</b>)</div>
<div class="key">⭐ 평행사변형, 직사각형도 똑같아요. <b>높이가 같으면 넓이는 밑변에 따라, 밑변이 같으면 넓이는 높이에 따라</b> 몇 배가 되는지 정해져요.<br>
&nbsp;&nbsp;&nbsp;⚠ 밑변이 2배여도 높이가 다르면 넓이가 2배라고 할 수 없어요! <b>"높이가 같은가?"</b>를 먼저 확인해요.</div>

<h2>③ 문제 그림 안에서 "높이가 같은 도형" 찾기</h2>
<div class="sit">
<div>{sa}<br><b>꼭짓점 ㄱ을 함께 쓰고</b> 밑변이 한 직선 위에<br>→ 높이가 같아요(파란 점선 하나)<br>밑변 8 cm는 4 cm의 2배 → <b>초록 = 분홍의 2배</b></div>
<div>{sb}<br><b>평행한 두 직선 사이</b>에 있는 도형<br>→ 높이 = 두 직선 사이의 거리로 모두 같아요<br>밑변이 같으면 ①, ②, ③의 <b>넓이가 같아요</b></div>
<div>{sc}<br><b>사다리꼴을 대각선으로 나눈</b> 두 삼각형<br>→ 윗변·아랫변이 평행하니 높이가 같아요<br>아랫변이 윗변의 몇 배면 넓이도 몇 배</div>
</div>
<div class="box" style="margin-top:8px"><b>👉 찾는 순서</b> &nbsp; <b>1.</b> 높이가 같은 도형 짝을 찾는다 (같은 꼭짓점? 평행선 사이?) → <b>2.</b> 두 밑변을 비교한다 (몇 배?) → <b>3.</b> 넓이도 그만큼 배!<br>
<small>※ 높이를 몰라도 넓이를 구할 수 있다는 게 이 방법의 힘이에요.</small></div>
</div>

<!-- PAGE 2 -->
<div class="page">
<div class="head"><span class="tag">연습 1</span><h1>몇 배인지 알아보기</h1></div>
<div class="q"><span class="qn">1</span> 높이가 5 cm로 같은 삼각형들입니다. 빈칸을 채우세요.
<table class="tbl"><tr><th>밑변</th><td>2 cm</td><td>4 cm</td><td>6 cm</td><td>10 cm</td><td>{blank(40)} cm</td></tr>
<tr><th>넓이</th><td>5 cm²</td><td>{blank(40)} cm²</td><td>{blank(40)} cm²</td><td>{blank(40)} cm²</td><td>40 cm²</td></tr></table></div>
<div class="q"><span class="qn">2</span> 밑변이 6 cm, 높이가 4 cm인 평행사변형이 있어요. (넓이 24 cm²)
<div class="step">(1) 높이는 그대로, 밑변만 2배로 하면 넓이는? {blank(50)} cm² → 처음의 {blank(30)}배</div>
<div class="step">(2) 밑변은 그대로, 높이만 3배로 하면 넓이는? {blank(50)} cm² → 처음의 {blank(30)}배</div>
<div class="step">(3) 밑변도 2배, 높이도 2배로 하면 넓이는? {blank(50)} cm² → 처음의 {blank(30)}배</div>
<div class="step">(4) 밑변은 2배, 높이는 반으로 줄이면 넓이는? {blank(50)} cm² → 처음의 {blank(30)}배</div></div>
<div class="q"><span class="qn">3</span> 모눈 한 칸은 1 cm²입니다. 나, 다, 라의 넓이는 각각 <b>가</b>의 몇 배일까요?
<div>{g13}</div>
<div class="step">나: {blank(40)}배 &nbsp;&nbsp; 다: {blank(40)}배 &nbsp;&nbsp; 라: {blank(40)}배 &nbsp;&nbsp; <small>힌트: 가와 높이가 같은 것은? 밑변이 같은 것은?</small></div></div>
<div class="q"><span class="qn">4</span> 넓이가 삼각형 <b>마</b>의 2배인 삼각형을 2가지 방법으로 그려 보세요. <small>(① 밑변만 2배 ② 높이만 2배)</small>
<div>{g14}</div></div>
</div>

<!-- PAGE 3 -->
<div class="page">
<div class="head"><span class="tag">연습 2</span><h1>그림 안에서 "높이가 같은 짝" 찾아 풀기</h1><span class="nm">높이가 주어지지 않아도 풀 수 있어요!</span></div>
<div class="grid">
<div class="q"><span class="qn">1</span> 색칠한 삼각형 ㄱㄹㄷ의 넓이가 15 cm²입니다.
<div>{p1}</div>
<div class="step mini">· 삼각형 ㄱㄴㄹ과 ㄱㄹㄷ은 꼭짓점 {blank(30)}을 함께 써서 높이가 같아요.</div>
<div class="step mini">· 밑변 ㄴㄹ은 ㄹㄷ의 {blank(30)}배</div>
<div class="step">(1) 삼각형 ㄱㄴㄹ의 넓이: {blank(50)} cm²</div>
<div class="step">(2) 삼각형 ㄱㄴㄷ의 넓이: {blank(50)} cm²</div></div>
<div class="q"><span class="qn">2</span> 삼각형 ㄱㄴㄷ의 넓이가 60 cm²입니다.
<div>{p2}</div>
<div class="step">(1) 삼각형 ㄱㄴㄹ의 넓이: {blank(50)} cm²</div>
<div class="step">(2) 삼각형 ㄱㄴㅁ의 넓이: {blank(50)} cm²</div>
<div class="step">(3) 삼각형 ㄱㄹㄷ의 넓이: {blank(50)} cm²</div></div>
<div class="q"><span class="qn">3</span> 사다리꼴 ㄱㄴㄷㄹ에서 색칠한 삼각형 ㄱㄹㄷ의 넓이가 15 cm²입니다.
<div>{p3}</div>
<div class="step mini">힌트: 삼각형 ㄱㄴㄷ의 밑변은 ㄴㄷ, 삼각형 ㄱㄹㄷ의 밑변은 ㄱㄹ. 높이는?</div>
<div class="step">(1) 삼각형 ㄱㄴㄷ의 넓이: {blank(50)} cm²</div>
<div class="step">(2) 사다리꼴 ㄱㄴㄷㄹ의 넓이: {blank(50)} cm²</div></div>
<div class="q"><span class="qn">4</span> 평행사변형 ㄱㄴㄷㄹ의 넓이가 48 cm²입니다. 점 ㅁ은 변 ㄱㄹ 위의 한 점일 때, 색칠한 삼각형 ㅁㄴㄷ의 넓이는?
<div>{p4}</div>
<div class="step mini">힌트: 삼각형 ㅁㄴㄷ과 평행사변형은 밑변이 {blank(40)}으로 같고, 높이도 같아요.</div>
<div class="ans">답: {blank(60)} cm²</div></div>
</div>
<div class="q"><span class="qn">5</span> 두 직선 가와 나는 서로 평행합니다. 삼각형 <b>가</b>의 넓이가 10 cm²일 때, <b>나</b>(삼각형)와 <b>다</b>(평행사변형)의 넓이를 구하세요.
<div>{p5}</div>
<div class="step">나: {blank(50)} cm² &nbsp;&nbsp;&nbsp; 다: {blank(50)} cm² &nbsp;&nbsp; <small>힌트: 다는 가와 밑변·높이가 같은 평행사변형이에요.</small></div></div>
</div>

<!-- PAGE 4 -->
<div class="page">
<div class="head"><span class="tag">연습 3</span><h1>실력 다지기 · 도전</h1></div>
<div class="grid">
<div class="q"><span class="qn">1</span> <span class="or">도전!</span> 삼각형 ㄱㄴㄷ의 넓이는 72 cm²이고, 점 ㅁ은 변 ㄱㄷ의 한가운데 점입니다. 색칠한 삼각형 ㄹㅁㄷ의 넓이는?
<div>{q1}</div>
<div class="step mini">1단계: 삼각형 ㄱㄴㄹ과 ㄱㄹㄷ은 꼭짓점 ㄱ을 함께 써요. ㄹㄷ(8 cm)은 ㄴㄹ(4 cm)의 {blank(30)}배<br>
&nbsp;&nbsp;→ 삼각형 ㄱㄹㄷ은 ㄱㄴㄹ의 {blank(30)}배 → 72 cm²는 ㄱㄴㄹ만 한 넓이 {blank(30)}개만큼 → ㄱㄹㄷ = {blank(40)} cm²</div>
<div class="step mini">2단계: 삼각형 ㄹㄱㅁ과 ㄹㅁㄷ은 꼭짓점 {blank(30)}을 함께 쓰고, ㄱㅁ = ㅁㄷ (같은 표시)<br>
&nbsp;&nbsp;→ 삼각형 ㄹㅁㄷ은 ㄱㄹㄷ의 {blank(40)} <small>(밑변 ㄱㄷ이 바닥에 오도록 종이를 돌려 보세요!)</small></div>
<div class="ans">답: {blank(60)} cm²</div></div>
<div class="q"><span class="qn">2</span> 사다리꼴 ㄱㄴㄷㄹ의 넓이가 64 cm²입니다. 삼각형 ㄱㄴㄷ과 삼각형 ㄱㄹㄷ의 넓이를 각각 구하세요.
<div>{q4}</div>
<div class="step mini">힌트: 아랫변은 윗변의 몇 배? 사다리꼴은 작은 삼각형 몇 개만큼?</div>
<div class="step">삼각형 ㄱㄴㄷ: {blank(50)} cm² &nbsp; 삼각형 ㄱㄹㄷ: {blank(50)} cm²</div></div>
</div>
<div class="q"><span class="qn">3</span> 밑변이 8 cm, 높이가 5 cm인 삼각형이 있습니다. 높이는 그대로 두고 넓이를 3배로 만들려면 밑변을 몇 cm로 해야 할까요?
<div class="work" style="height:40px"></div><div class="ans">답: {blank(60)} cm</div></div>
<div class="q"><span class="qn">4</span> 직사각형 모양 꽃밭의 가로를 2배, 세로를 3배로 늘렸습니다. 늘린 꽃밭의 넓이는 처음 꽃밭 넓이의 몇 배일까요?
<div class="work" style="height:40px"></div><div class="ans">답: {blank(60)} 배</div></div>
<div class="q"><span class="qn">5</span> 넓이가 36 cm²인 평행사변형이 있습니다. 밑변을 2배로 늘리고 높이를 반으로 줄이면 넓이는 몇 cm²일까요?
<div class="work" style="height:40px"></div><div class="ans">답: {blank(60)} cm²</div></div>

<h2>개념 확인 O / X</h2>
<table class="ox">
<tr><td>(1) 높이가 같은 두 삼각형에서 밑변이 2배이면 넓이도 2배이다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(2) 밑변이 2배인 삼각형은 높이와 상관없이 항상 넓이가 2배이다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(3) 밑변과 높이가 모두 2배가 되면 넓이는 4배가 된다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(4) 평행한 두 직선 사이에 있고 밑변이 같은 삼각형들은 모양이 달라도 넓이가 같다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
<tr><td>(5) 꼭짓점을 함께 쓰고 밑변이 한 직선 위에 있는 두 삼각형은 높이가 같다.</td><td class="oxb">( &nbsp;&nbsp;&nbsp; )</td></tr>
</table>
</div>

<!-- PAGE 5 -->
<div class="page sol">
<div class="head"><span class="tag">정답과 풀이</span><h1>보호자용</h1></div>
<h2>연습 1</h2>
<p><b>1.</b> 넓이: 10, 15, 25 / 밑변: 16 cm (밑변 2 cm일 때 5 cm² → 40은 8배 → 밑변 16 cm)</p>
<p><b>2.</b> (1) 48 cm², 2배 (2) 72 cm², 3배 (3) 96 cm², 4배 (4) 24 cm², 1배(같아요)</p>
<p><b>3.</b> 가 = 2 × 3 ÷ 2 = 3 (cm²). 나: 밑변 4 cm(2배), 높이 같음 → <b>2배</b> / 다: 밑변 6 cm(3배), 높이 같음 → <b>3배</b> / 라: 밑변 4 cm(2배), 높이 6 cm(2배) → <b>4배</b></p>
<p><b>4.</b> ① 밑변 6칸, 높이 2칸인 삼각형 ② 밑변 3칸, 높이 4칸인 삼각형 (넓이 6 cm², 꼭짓점 위치는 자유)</p>
<h2>연습 2</h2>
<p><b>1.</b> 꼭짓점 ㄱ, 2배 → (1) 15 × 2 = <b>30 cm²</b> (2) 30 + 15 = <b>45 cm²</b></p>
<p><b>2.</b> 꼭짓점 ㄱ을 함께 쓰고 밑변이 4 cm씩 3등분 → 하나가 60 ÷ 3 = 20 → (1) <b>20 cm²</b> (2) <b>40 cm²</b> (3) <b>40 cm²</b></p>
<p><b>3.</b> 윗변과 아랫변이 평행 → 두 삼각형의 높이가 같음. ㄴㄷ(10 cm)은 ㄱㄹ(5 cm)의 2배 → (1) <b>30 cm²</b> (2) 30 + 15 = <b>45 cm²</b></p>
<p><b>4.</b> 밑변 ㄴㄷ이 같고 높이도 같음 → 삼각형은 평행사변형의 절반 → <b>24 cm²</b> (ㅁ이 어디에 있어도 같아요)</p>
<p><b>5.</b> 나: 밑변 2배 → <b>20 cm²</b> / 다: 밑변·높이가 가와 같은 평행사변형 → 가의 2배 → <b>20 cm²</b></p>
<h2>연습 3</h2>
<p><b>1.</b> ㄹㄷ(8 cm)은 ㄴㄹ(4 cm)의 2배 → ㄱㄹㄷ은 ㄱㄴㄹ의 2배 → 72 cm²는 ㄱㄴㄹ만 한 넓이 3개만큼 → 72 ÷ 3 = 24, ㄱㄹㄷ = 24 × 2 = 48 (cm²) → 꼭짓점 ㄹ을 함께 쓰고 ㅁㄷ은 ㄱㄷ의 절반 → 48 ÷ 2 = <b>24 cm²</b></p>
<div class="box" style="margin:4px 0 8px;padding:8px 12px;font-size:12.5px;line-height:1.55">
<b>📌 지도 포인트 — 왜 2로 나눠도 될까요?</b> (ㄱㄹㄷ의 넓이 48 cm² ÷ 2 = 24 cm²)<br>
<b>①</b> 선분 ㄹㅁ이 삼각형 ㄱㄹㄷ을 <b>삼각형 ㄹㄱㅁ</b>과 <b>삼각형 ㄹㅁㄷ</b>, 두 개로 나눠요.<br>
<b>②</b> 두 삼각형은 <b>꼭짓점 ㄹ을 함께 쓰고</b>, 밑변(ㄱㅁ, ㅁㄷ)이 <b>같은 직선 ㄱㄷ 위</b>에 있어요. → ㄹ에서 ㄱㄷ까지 내린 <b>높이가 같아요.</b><br>
<b>③</b> 점 ㅁ은 변 ㄱㄷ의 한가운데 점이라서 <b>ㄱㅁ = ㅁㄷ</b> → <b>밑변의 길이가 같아요.</b><br>
<b>④</b> 밑변도 같고 높이도 같으니 <b>넓이가 같아요.</b> → 삼각형 ㄹㅁㄷ은 ㄱㄹㄷ의 <b>절반</b>!<br>
<span style="color:#c92a2a">⚠ "가운데 점이니까 반"이라고만 외우면, 높이가 다른 도형에서도 반으로 나누는 실수를 할 수 있어요.</span><br>
👉 아이에게 <b>"같은 꼭짓점 → 높이가 같다 → 밑변이 반이니 넓이도 반"</b> 순서로 말해 보게 해 주세요.<br>
<small>※ 표현 팁: 점은 길이가 없으니 "점 ㅁ이 변의 절반"보다 "점 ㅁ은 변 ㄱㄷ의 <b>한가운데 점</b> → 선분 ㅁㄷ은 ㄱㄷ의 <b>절반</b>"이라고 말하면 정확해요.</small>
</div>
<p><b>2.</b> 아랫변 12 cm는 윗변 4 cm의 3배 → ㄱㄴㄷ은 ㄱㄹㄷ의 3배 → 사다리꼴은 ㄱㄹㄷ만 한 넓이 4개만큼 → 64 ÷ 4 = 16 → ㄱㄴㄷ <b>48 cm²</b>, ㄱㄹㄷ <b>16 cm²</b></p>
<p><b>3.</b> 높이 그대로 넓이 3배 → 밑변 3배 → <b>24 cm</b></p>
<p><b>4.</b> 2 × 3 = <b>6배</b></p>
<p><b>5.</b> 2배 했다가 반으로 → 그대로 <b>36 cm²</b></p>
<p><b>O/X</b> (1) O (2) X — 높이가 같아야 해요 (3) O (4) O (5) O</p>
<div class="key" style="margin-top:10px"><b>지도 팁</b><br>
· 그림에서 높이가 같은 짝을 찾을 때, <b>같이 쓰는 꼭짓점</b>에서 밑변으로 파란 점선(높이)을 하나만 그어 보게 하세요. "두 삼각형이 이 점선 하나를 같이 쓰네!"를 눈으로 보면 이해가 빨라요.<br>
· 평행선 문제는 두 직선 사이에 손가락 두 개를 대고 "이 폭이 높이야"라고 말해 보게 하면 좋아요.<br>
· 삼각형 학습지의 "밑변을 바꾸면 높이가 바뀐다"와 헷갈릴 수 있어요. 이번 학습지는 <b>서로 다른 두 도형의 높이가 같은 경우</b>를 찾는 것이라는 점을 짚어 주세요.</div>
</div>
</body></html>"""
open("ratio.html", "w").write(html)
