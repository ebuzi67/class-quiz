# tools/one-chat/words.txt 의 낱말로 one-chat/words.js 를 만들어요.
# 한글 두 글자 이상만 남기고, 겹치는 낱말과 BLOCK에 있는 낱말은 빼요.
# 실행: python3 tools/one-chat/build_words.py
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "words.txt"
OUT = HERE.parents[1] / "one-chat" / "words.js"

# 원이 아이에게 말하지 않았으면 하는 낱말(words.txt에 실수로 들어가도 빼요)
BLOCK = {"장난감총", "칼싸움", "사격", "식칼", "니모", "금눈돔", "열기", "돈부리"}


def main():
    words, seen = [], set()
    for line in SRC.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0]
        for w in line.split():
            if not re.fullmatch(r"[가-힣]{2,}", w) or w in seen or w in BLOCK:
                continue
            seen.add(w)
            words.append(w)
    body = json.dumps(words, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "// 원이랑 대화하기: 끝말잇기에서 원이 쓰는 낱말\n"
        "// tools/one-chat/build_words.py 가 tools/one-chat/words.txt 로 만든 파일이에요. 여기를 고치지 말고 words.txt 를 고쳐요.\n"
        f"const WORDS = {body};\n",
        encoding="utf-8",
    )
    firsts = {w[0] for w in words}
    print(f"{len(words)} words, {len(firsts)} first syllables -> {OUT.relative_to(HERE.parents[1])}")


if __name__ == "__main__":
    main()
