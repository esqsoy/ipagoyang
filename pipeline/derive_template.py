#!/usr/bin/env python3
"""보카고양 마더텅 게임(vocagoyangksat2027.html)에서 발음고양 화면 틀(pipeline/frame.html)을 한 번 뽑는다.

26.11.06 영신: "그냥 보카고양에서 틀을 가져오면 돼". 탄고고양이 日本語能力試験 틀을 뽑은 방법
(tangogoyang pipeline/jlpt/derive-template.py)을 그대로 따른다. 보카고양 화면·고양이·효과·회독·따라쓰기·
모아둔 카드·진행 속도 예측을 그대로 쓰고, 데이터 자리만 비운 뒤 발음고양에 꼭 필요한 데만 고친다.

사용: python3 pipeline/derive_template.py <vocagoyang 저장소의 vocagoyangksat2027.html> [--force]
- 뽑은 뒤에는 frame.html이 원본이다(손으로 고칠 수 있다). 다시 돌리면 손 수정이 사라지므로 --force가 있어야 덮는다.
- 보카고양 고양이 대사 가운데 단어·일산·수능 이야기가 없는 줄만 data/series-lines.json으로 뽑아 둔다.
- 발음고양 쪽 덧붙임(IPA 입력 변환, 기호 칸, 녹음 재생, 배우기 그림, IPA 지도)은 pipeline/ipa_extra.js와
  pipeline/ipa_extra.css에 있고 build.py가 frame.html의 표시 자리에 넣는다.
뽑은 판: esqsoy/vocagoyang main d7e077d (26.11.06).
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'pipeline' / 'frame.html'
if len(sys.argv) < 2:
    sys.exit(__doc__)
SRC = Path(sys.argv[1])
if OUT.exists() and '--force' not in sys.argv:
    sys.exit('frame.html이 이미 있다. 손 수정을 지우려면 --force')

lines = SRC.read_text(encoding='utf-8').split('\n')


def setline(prefix, new):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, (prefix, hits)
    lines[hits[0]] = new


def cut_block(prefix, new):
    """여러 줄에 걸친 const 객체(배열)를 표시 자리 한 줄로 바꾼다. 원래 내용을 돌려준다."""
    i = [k for k, l in enumerate(lines) if l.startswith(prefix)]
    assert len(i) == 1, prefix
    i = i[0]
    j = i
    while not re.match(r'^[}\]];', lines[j]):
        j += 1
    old = '\n'.join(lines[i:j + 1])
    lines[i:j + 1] = [new]
    return old


setline('const IPA_EFFECT_MAPS = ', 'const IPA_EFFECT_MAPS = {};')
setline('const PRONUNCIATION_AUDIO_MAP = ', 'const PRONUNCIATION_AUDIO_MAP = /*__AUDIO__*/{};')
setline('const DATA = ', 'const DATA = /*__DATA__*/[];')
setline('const MT_PRONUNCIATIONS = ', 'const MT_PRONUNCIATIONS = /*__PRON__*/{};')
setline('const MT_CONTEXTS=', 'const MT_CONTEXTS=/*__CONTEXTS__*/{};')
setline('const CAT = ', 'const CAT = /*__CAT__*/{};')
old_lines = cut_block('const LINES', 'const LINES = /*__LINES__*/{};')
cut_block('const LESSONCLEAR', 'const LESSONCLEAR = /*__LESSONCLEAR__*/{};')
cut_block('const HINTS', 'const HINTS = {};')
s = '\n'.join(lines)


def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (old[:70], n)
    s = s.replace(old, new)


# 저장 키: 같은 esqsoy.github.io의 보카고양(goyang-)·탄고고양(tangogoyang-)과 겹치지 않게
s = re.sub(r'(["\'`])goyang-', r'\1ipagoyang-', s)
assert not re.search(r'(["\'`])goyang-', s)

# 이름과 문구
rep('<title>마더텅 · 벗어나고양!</title>', '<title>발음고양</title>')
rep('<h1>꽃과 단어의 도시를 <b>벗어나고양!</b></h1>', '<h1><b>발음고양</b> · IPA</h1>')
rep('<h2>2027 마더텅 영어 독해</h2>', '<h2>발음고양 · 입술부터 목청까지</h2>')
rep('aria-label="영어 정답"', 'aria-label="IPA 정답"')
rep('const SAVED_COURSE="마더텅";', 'const SAVED_COURSE="발음고양";')
rep("PACE_COURSE==='ksat'?'마더텅 완주'", "PACE_COURSE==='ksat'?'발음고양 완주'")
rep('탈출률 <b>0%</b>', '진도 <b>0%</b>')
rep('$("#routePct").innerHTML=`탈출률 <b>${pct}%</b> · ${done}/${total} 구간 · ${state.prevOn?"전체":"2026"}`;',
    '$("#routePct").innerHTML=`진도 <b>${pct}%</b> · ${done}/${total} 연습`;')
rep('${state.prevOn?"전체(이전 포함)":"2026만"}`;', '발음고양 시제품`;')
rep('$("#sumTitle").textContent="BIG MOUNTAIN 입성! 🎓";', '$("#sumTitle").textContent="묶음 완주! 지도에 칸이 켜졌다 ✦";')
# 교재 선택 화면이 없다(index.html이 게임이다): 홈 단추를 지운다
s, n = re.subn(r'\n\s*<a class="iconbtn course-home" href="index.html"[\s\S]*?</a>', '', s)
assert n == 1, n
# 길(route) 이름: 일산 → BIG MOUNTAIN 대신 입술 → 목청(입 앞에서 목 안쪽으로 IPA 표를 건너간다)
m = re.search(r'<div class="maproute">[\s\S]*?<div class="track">', s)
assert m
seg = m.group(0)
seg2 = re.sub(r'🌹\s*일산', '👄 입술', seg)
seg2 = re.sub(r'(전설의\s*)?BIG MOUNTAIN\s*🌳', '목청 🫁', seg2)
assert seg2 != seg
s = s.replace(seg, seg2)

# 보카고양 엔딩(가고 싶은 대학 적기)은 발음고양에 맞지 않아 부르지 않는다
rep('if(allCleared)setTimeout(()=>{if(state.session===s&&screens.sum.classList.contains("active"))showEnding();},750);', '')

# 카드에 정답·뜻 말고도 발음고양 칸(배우기·녹음·언어)을 실어 나른다. 연습 이름도 데이터에서
rep('words:ex.words.map(w=>({term:w.en,meaning:w.ko}))', 'words:ex.words.map(w=>({...w,term:w.en,meaning:w.ko}))')
rep('title:(ex.scope===\'prev\'?"이전기출 ":"Exercise ")+ex.ex,', 'title:ex.title||((ex.scope===\'prev\'?"이전기출 ":"Exercise ")+ex.ex),')

# 입력: ph → pʰ 같은 줄임을 IPA로 바꿔 읽는다(탄고고양 로마자 → 가나와 같은 자리). ipaIn은 ipa_extra.js
rep('const wrap=$("#hoeCtx .blanks");if(!wrap)return;const w=s.words[s.currentId],raw=$("#ainput").value;',
    'const wrap=$("#hoeCtx .blanks");if(!wrap)return;const w=s.words[s.currentId],raw=ipaIn($("#ainput").value);')
# 자동 제출을 끈다: p를 치는 순간 내 버리면 pʰ·p͈를 칠 수 없고, 칸이 차는 시점이 답을 흘린다
rep('if(ready&&!options.fromHint)submit();', 'if(ready&&!options.fromHint&&!IPA_NO_AUTOSUBMIT)submit();')
# 언어 고르기(26.11.08 영신 "언어별로 따로 배울수 있게"): 문맥을 붙인 뒤 고른 언어의 카드만 남긴다
rep('mtAttachContexts(state.lessons);', "mtAttachContexts(state.lessons);if(typeof ipaFilterLessons==='function')ipaFilterLessons(state.lessons);")
# 맞히면 소리 내는 차례 그림(PRINCIPLES 8-9 ①). 그림이 끝날 시간만큼 다음 카드를 늦춘다(Enter로 바로 넘어갈 수 있다)
rep('''    showReveal("good",w.term,w.meaning,line);
    s.streak=(s.streak||0)+1;
    scheduleNext(1500);''', '''    showReveal("good",w.term,w.meaning,line);if(typeof ipaOnCorrect==='function')ipaOnCorrect(w);
    s.streak=(s.streak||0)+1;
    scheduleNext(typeof IPA_NEXT_MS==='number'?IPA_NEXT_MS:1500);''')
rep('const typed=$("#ainput").value;\n  if(!typed.trim()', 'const typed=ipaIn($("#ainput").value);\n  if(!typed.trim()')
rep('function handleCopyInput(){const s=state.session;if(!s||!s.copyMode)return;const v=$("#ainput").value;',
    'function handleCopyInput(){const s=state.session;if(!s||!s.copyMode)return;const v=ipaIn($("#ainput").value);')
rep('if(!isCorrect($("#ainput").value,s.copyAns)){', 'if(!isCorrect(ipaIn($("#ainput").value),s.copyAns)){')
# 기호 칸: 부호가 붙은 기호(pʰ·p͈·β̞)도 칸 하나. 칸 수가 답을 흘리지 않게(blankParts를 ipa_extra.js의 것으로)
rep('function blankParts(value){', 'function blankPartsOriginal(value){')
rep("if(/[A-Za-z\\u00c0-\\u024f0-9=&\\u1100-\\u11ff\\u3130-\\u318f\\uac00-\\ud7af]/.test(c))letters++;",
    "if(ipaIsBase(c))letters++;else if(ipaIsMark(c)){}")
# 원문 속 빈칸: 정답 기호가 다른 자리에 또 있어도 가리지 않는다(전사 안의 같은 글자)
rep("if(term&&/^[A-Za-z -]+$/.test(term))addAll(term);", "if(term&&!context.noTermMask&&/^[A-Za-z -]+$/.test(term))addAll(term);")
# 발음: 브라우저 음성은 IPA를 못 읽고 언어도 영어로 고정돼 있다. 확인한 녹음(예외 음원 자리)만 튼다
rep('function pronunciationSupported(){return !!(window.speechSynthesis&&window.SpeechSynthesisUtterance);}',
    'function pronunciationSupported(){return false;}')
rep('.map(p=>(p.label?esc(p.label)+" ":"")+"/"+fmtIpa(p.ipa)+"/").join(" · ");',
    '.map(p=>(p.label?esc(p.label)+" ":"")+"["+fmtIpa(p.ipa)+"]").join(" · ");')
# 카드가 뜰 때: 배우기 그림·재생 단추(ipaBeforeCard / ipaAfterCard). 배우기 카드는 읽을 게 많아 시간을 넉넉히
rep('$("#hoeCtx").innerHTML=mtQuestionHtml(w);', '$("#hoeCtx").innerHTML=ipaBeforeCard(w)+mtQuestionHtml(w);ipaAfterCard(w);')
rep('s.cardLimit=limitFor(w.term);', "s.cardLimit=typeof ipaCardLimit==='function'?ipaCardLimit(w):(w.learn?60:limitFor(w.term));")
# 틀렸을 때 따라 치기 화면도 그림·재생 단추를 그대로 둔다(틀은 이 자리를 다시 그린다)
rep('$("#hoeCtx").innerHTML=mtQuestionHtml(mtCurrentWord(),true);', '$("#hoeCtx").innerHTML=ipaBeforeCard(mtCurrentWord())+mtQuestionHtml(mtCurrentWord(),true);ipaAfterCard(mtCurrentWord(),true);')
# 처음 화면: IPA 지도
rep('function renderHome(){', 'function renderHome(){\n  if(typeof ipaRenderMap==="function")setTimeout(ipaRenderMap,0);')
m = re.search(r'(<section class="screen active" id="homeScreen">\s*<div class="catrow">[\s\S]*?</div>\s*</div>)', s)
assert m
s = s.replace(m.group(1), m.group(1) + '\n      <div class="panel ipamap" id="ipaMap"></div>', 1)
# 덧붙임 자리
m = re.search(r'<script>\s*\n?const IPA_EFFECT_MAPS', s)
if not m:
    i = s.index('const IPA_EFFECT_MAPS')
    j = s.rfind('<script', 0, i)
    s = s[:j] + '<script>/*__IPA_EXTRA_JS__*/</script>\n' + s[j:]
else:
    s = s[:m.start()] + '<script>/*__IPA_EXTRA_JS__*/</script>\n' + s[m.start():]
rep('</style>\n</head>', '</style>\n<style>/*__IPA_EXTRA_CSS__*/</style>\n</head>')

# 배색을 갈아 끼울 수 있게(26.11.08 영신 "색상은 원래 보카고양이랑 달리가도 좋습니다 좀 더 보기좋은 배색을 찾아봅시다"):
# 틀 CSS(<style> 안, :root 정의는 빼고)의 고정 색 가운데 배색을 이루는 것만 변수로 바꾼다. 값은 그대로라 보카고양 배색에서는 화면이 같다.
PAL_HEX = {'#ff4fa3': 'var(--pink)', '#ff8ac6': 'var(--pink2)', '#ffd34d': 'var(--gold)', '#5ce6ff': 'var(--cyan)', '#7cffb2': 'var(--mint)',
           '#6f3c95': 'var(--line)', '#26103a': 'var(--panel2)', '#c6bcdd': 'var(--muted)', '#160826': 'var(--bg1)', '#f5b301': 'var(--gold2)',
           '#c4b8cf': 'var(--muted)', '#b8a2d4': 'var(--muted)', '#6a4c86': 'var(--line)', '#8a6aa8': 'var(--muted)', '#4a0a72': 'var(--bg3)',
           '#170824': 'var(--bg1)', '#2a1340': 'var(--panel2)', '#1d0c2e': 'var(--panel)', '#2a0c40': 'var(--bg2)', '#3a1054': 'var(--bg3)'}
PAL_RGB = {'255,79,163': 'var(--pink-rgb)', '255,211,77': 'var(--gold-rgb)', '92,230,255': 'var(--cyan-rgb)', '34,16,58': 'var(--panel-rgb)', '22,8,38': 'var(--bg1-rgb)', '184,168,255': 'var(--cyan-rgb)'}


def palettize(css):
    parts = re.split(r'(:root\s*\{[^}]*\})', css)
    for i in range(0, len(parts), 2):
        seg = parts[i]
        for h, v in PAL_HEX.items():
            seg = re.sub(re.escape(h) + r'(?![0-9a-fA-F])', v, seg, flags=re.I)
        for rgb, v in PAL_RGB.items():
            seg = re.sub(r'rgba\(\s*' + rgb.replace(',', r'\s*,\s*') + r'\s*,', f'rgba({v},', seg)
        parts[i] = seg
    return ''.join(parts)


s = re.sub(r'(<style[^>]*>)(.*?)(</style>)', lambda m: m.group(1) + palettize(m.group(2)) + m.group(3), s, flags=re.S)
rep(':root{', ':root{--pink-rgb:255,79,163;--gold-rgb:255,211,77;--cyan-rgb:92,230,255;--panel-rgb:34,16,58;--bg1-rgb:22,8,38;')

OUT.write_text(s, encoding='utf-8')
print(OUT, len(s))

# 고양이 대사: 단어·일산·수능처럼 영어 단어장 이야기가 든 줄을 뺀 나머지를 시리즈 공통 대사로 남긴다
tmp = ROOT / 'pipeline' / '.lines_tmp.js'
tmp.write_text(old_lines.replace('const LINES', 'module.exports'), encoding='utf-8')
out = subprocess.run(['node', '-e', f'process.stdout.write(JSON.stringify(require({json.dumps(str(tmp))})))'],
                     capture_output=True, text=True, check=True).stdout
tmp.unlink()
lines_all = json.loads(out)
skip = re.compile(r'단어|외우|외운|일산|BIG|철자|영어|대학|서울|마더텅|수능|지문|독해|강|책|따라쓰|쓰라|써라|스펠')
kept = {k: [t for t in v if not skip.search(t)] for k, v in lines_all.items()}
dst = ROOT / 'data' / 'series-lines.json'
json.dump({'about': '보카고양 마더텅(vocagoyangksat2027.html, vocagoyang d7e077d) 고양이 대사 가운데 단어·일산·수능 이야기가 없는 줄. pipeline/derive_template.py가 뽑았다. 발음고양 대사(data/bundles)와 합쳐 쓴다.',
           'lines': kept}, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dst, {k: len(v) for k, v in kept.items()})
