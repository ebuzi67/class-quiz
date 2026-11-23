# 레이싱퀴즈 엑셀 문제 양식(quiz-race/question-template.xlsx)을 만들어요.
# 선생님 화면의 "📥 양식 받기" 버튼이 이 파일을 내려받아요.
# 실행: python3 tools/quiz-race/make_template.py   (openpyxl 필요)
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
OUT=Path(__file__).resolve().parents[2] / "quiz-race" / "question-template.xlsx"
F='맑은 고딕'
thin=Side(style='thin',color='E6D9BC'); B=Border(left=thin,right=thin,top=thin,bottom=thin)
wb=Workbook()
ws=wb.active; ws.title='문제 입력'
heads=['문제','정답','오답1','오답2','오답3']
fills=['FFD54A','7CCF6B','FF9C94','FF9C94','FFC2BD']
tips=['문제를 써요. 한 줄이 한 문제예요.\n이 첫 줄(제목 줄)은 지우지 마세요.',
      '정답을 써요. 화면에 정답 길로 나와요.',
      '틀린 보기를 써요. 꼭 1개 이상 있어야 해요.',
      '틀린 보기(선택). 비워 둬도 돼요.',
      '틀린 보기(선택). 오답이 3개면 그중 2개를 골라 매번 섞어서 보여 줘요.']
widths=[46,18,18,18,18]
for i,(h,f,t,w) in enumerate(zip(heads,fills,tips,widths),1):
    c=ws.cell(1,i,h); c.font=Font(name=F,bold=True,size=13,color='2D2A26'); c.fill=PatternFill('solid',fgColor=f)
    c.alignment=Alignment(horizontal='center',vertical='center'); c.border=B
    cm=Comment(t,'레이싱퀴즈'); cm.width=260; cm.height=90; c.comment=cm
    ws.column_dimensions[chr(64+i)].width=w
ws.row_dimensions[1].height=28
bg=['FFFDF5','F3FBEF','FFF6F5','FFF6F5','FFF9F8']
for r in range(2,202):
    ws.row_dimensions[r].height=22
    for i in range(1,6):
        c=ws.cell(r,i); c.number_format='@'  # 1/2 같은 분수가 날짜로 바뀌지 않게 글자 칸으로
        c.font=Font(name=F,size=12); c.fill=PatternFill('solid',fgColor=bg[i-1]); c.border=B
        c.alignment=Alignment(vertical='center',horizontal='left' if i==1 else 'center',wrap_text=True)
ws.freeze_panes='A2'

# 사용법
u=wb.create_sheet('사용법')
u.column_dimensions['A'].width=4; u.column_dimensions['B'].width=92
lines=[('🏎️ 레이싱퀴즈 문제 양식 사용법','t'),('',''),
('① [문제 입력] 시트에 한 줄에 한 문제씩 써요.','h'),
('     문제 · 정답 · 오답1 · 오답2 · 오답3 순서예요. 오답은 1개 이상 있으면 돼요.',''),
('② 경주 화면에는 길이 3개 나와요 (정답 1개 + 오답 2개).','h'),
('     오답을 3개 쓰면 그중 2개를 골라 매번 섞어서 보여 줘서, 다시 해도 덜 외워져요.',''),
('③ 다 쓰면 저장하고, 선생님 화면에서 [📤 엑셀 올리기]를 눌러 이 파일을 골라요.','h'),
('     엑셀에서 칸을 복사해 문제 상자에 바로 붙여넣어도 돼요.',''),
('',''),('⚠️ 꼭 지켜 주세요','h'),
('  • 문제는 맨 앞 시트 [문제 입력]에만 써요. 레이싱퀴즈는 맨 앞 시트만 읽어요.',''),
('  • 맨 위 제목 줄(문제 · 정답 · 오답…)은 지우지 마세요. 이 줄은 문제로 읽지 않아요.',''),
('  • 보기는 짧을수록 좋아요. 길 위에 크게 써지니 한두 낱말이나 숫자를 추천해요.',''),
('  • 칸을 "="로 시작하지 마세요. 엑셀이 계산식으로 바꿔 버려요. (예: =3+4 ✗, 3+4=? ✓)',''),
('  • 1/2 같은 분수도 그대로 써도 돼요. 칸이 글자 칸이라 날짜로 바뀌지 않아요.',''),
('',''),('💡 [작성 예시] 시트에 써 둔 문제를 복사해서 [문제 입력] 시트에 붙여넣어 써도 돼요.','h')]
for r,(t,k) in enumerate(lines,2):
    c=u.cell(r,2,t); c.alignment=Alignment(vertical='center')
    c.font=Font(name=F,size=18 if k=='t' else 13,bold=k in('t','h'),color='F08A24' if k=='t' else '2D2A26')
    u.row_dimensions[r].height=30 if k=='t' else 22

# 작성 예시
e=wb.create_sheet('작성 예시')
ex=[heads,
['3 + 4 = ?','7','6','8','5'],['12 - 4 = ?','8','7','9','6'],['5씩 4묶음은?','20','15','25','9'],
['1/2과 크기가 같은 분수는?','2/4','1/4','2/3','3/4'],['삼각형의 꼭짓점은 몇 개?','3개','4개','2개','5개'],
['\'크다\'의 반대말은?','작다','많다','높다','길다'],['바르게 쓴 낱말은?','깨끗하다','깨끄타다','깨끗아다','개끗하다'],
['우리나라 꽃은?','무궁화','장미','해바라기','튤립'],['꿀을 모으는 곤충은?','꿀벌','나비','개미','잠자리'],
['사과를 영어로?','apple','banana','grape','']]
for r,row in enumerate(ex,1):
    for i,v in enumerate(row,1):
        c=e.cell(r,i,v); c.number_format='@'; c.border=B
        c.alignment=Alignment(vertical='center',horizontal='left' if i==1 else 'center')
        if r==1: c.font=Font(name=F,bold=True,size=13); c.fill=PatternFill('solid',fgColor=fills[i-1])
        else: c.font=Font(name=F,size=12)
    e.row_dimensions[r].height=24
for i,w in enumerate(widths,1): e.column_dimensions[chr(64+i)].width=w
e.cell(len(ex)+2,1,'↑ 마지막 줄처럼 오답을 2개만 써도 돼요.').font=Font(name=F,size=11,color='7A7166')
wb.active=0
wb.save(OUT)
