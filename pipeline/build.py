"""발음고양 조립: 보카고양 틀(pipeline/frame.html) + 발음고양 데이터 → index.html(생성물).

쓰는 법: python3 pipeline/build.py [--check] [--artifact <파일.html>]
- 틀은 보카고양 마더텅 게임에서 뽑은 것이다(pipeline/derive_template.py, 26.11.06 영신 "그냥 보카고양에서 틀을 가져오면 돼").
  발음고양 덧붙임은 pipeline/ipa_extra.js·ipa_extra.css.
- 원본: data/(묶음·기호·언어·시리즈 대사), sources/(음원·서지·파형), assets/cat/goyang-cat.json(고양고양이, 보카고양과 같은 자료).
  index.html만 고치면 다음 조립 때 사라진다.
- 묶음 하나 = 틀의 '강' 하나. 연습은 배우기 → 한국어와 견주기 → 듣고 고르기 → 전사 빈칸(PRINCIPLES 8-2).
  전사 빈칸은 틀의 '원문 속 빈칸'(MT_CONTEXTS)을 쓴다: 원문 자리에 전사, 빈칸에 대상 기호.
- 녹음 파일(assets/audio/<id>.mp3)이 없는 음원은 재생 단추 대신 '녹음 준비 중'이 뜨고, 듣고 고르기에서 빠진다.
- --check: index.html이 원본과 맞는지만 본다. --artifact: claude.ai 미리보기용 한 파일(문서 껍데기를 빼고 글꼴·녹음을 data: 주소로).
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rd(*p):
    return json.load(open(os.path.join(ROOT, *p), encoding='utf-8'))


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def build(inline=False):
    b = rd('data', 'bundles', 'b01.json')
    sy = rd('data', 'symbols.json')
    langs = {l['id']: l for l in rd('data', 'languages.json')['langs']}
    series = rd('data', 'series-lines.json')['lines']
    audio_src = {f['id']: f for f in rd('sources', 'audio.json')['files']}
    pk_path = os.path.join(ROOT, 'sources', 'audio-peaks.json')
    peaks = json.load(open(pk_path, encoding='utf-8')) if os.path.exists(pk_path) else {}

    def audio_ok(aid):
        f = audio_src.get(aid)
        return bool(f and f.get('mp3') and os.path.exists(os.path.join(ROOT, 'assets', 'audio', aid + '.mp3')))

    def src_of(aid):
        p = os.path.join(ROOT, 'assets', 'audio', aid + '.mp3')
        return 'data:audio/mpeg;base64,' + base64.b64encode(open(p, 'rb').read()).decode() if inline else f'assets/audio/{aid}.mp3'

    short = sorted(b['shortcuts'].items(), key=lambda kv: -len(kv[0]))
    code_of = {v: k for k, v in b['shortcuts'].items()}
    L = 1  # 묶음 1 = 강 1
    exercises, contexts, pron, amap = [], {}, {}, {}

    def add_ex(title, words):
        if not words:
            return
        n = len(exercises) + 1
        ex = {'ex': n, 'scope': '2026', 'title': title, 'words': []}
        for i, (w, ctx, ipa_show, aid) in enumerate(words):
            ex['words'].append(w)
            contexts[f'{L}/2026/{n}/{i}'] = ctx
            if ipa_show is not None:
                pron.setdefault(w['en'], {'ipa': '', 'meanings': {}})['meanings'][w['ko']] = {'ipa': ipa_show}
                if aid and audio_ok(aid):
                    amap[w['en'] + '\t' + ipa_show] = {'src': src_of(aid), 'duration': audio_src[aid].get('duration')}
        exercises.append(ex)

    ctx0 = {'sourceKind': 'body', 'page': 0, 'noTermMask': True}
    # 1. 배우기: 기호를 보고(그림·설명·낱말 듣기) 따라 친다
    learn = []
    for k in b['learn']:
        s = sy['symbols'][k]
        code = code_of.get(k, k)
        w = {'en': k, 'ko': f'[{k}] {s["name"]}', 'learn': True, 'sym': k, 'code': code}
        ctx = {**ctx0, 'example': f'따라 치기 → {k}', 'surfaceParts': [k], 'translation': f'{s["name"]} · 치는 법 {code}'}
        learn.append((w, ctx, k, s.get('sound')))
    add_ex('배우기', learn)

    # 2. 한국어와 견주기
    words_by_id = {w['id']: w for w in b['words']}
    cmp = []
    for c in b['compare']:
        wd = words_by_id[c['word']]
        lg = langs[wd['lang']]['ko']
        w = {'en': c['answer'], 'ko': f'{lg} {wd["text"]} · {c["q"]} ({"·".join(c["options"])})', 'audio': wd['audio'], 'lang': wd['lang']}
        ctx = {**ctx0, 'example': f'{wd["text"]} → {c["answer"]}', 'surfaceParts': [c['answer']], 'translation': c['why']}
        cmp.append((w, ctx, ''.join(wd['ipa']), wd['audio']))
    add_ex('한국어와 견주기', cmp)

    # 3. 듣고 고르기(녹음이 있는 낱말만, 한국어는 빼고, 좁게 들으면 답이 둘인 낱말도 뺀다: PRINCIPLES 2-4)
    lis = []
    for wd in b['words']:
        if wd['lang'] == 'kor' or wd.get('listen') is False or not audio_ok(wd['audio']):
            continue
        lg = langs[wd['lang']]['ko']
        ans = wd['target']
        w = {'en': ans, 'ko': f'{lg} 낱말 · 듣고 첫소리 기호를 친다', 'audio': wd['audio'], 'listen': True, 'lang': wd['lang'], 'wid': wd['id']}
        ctx = {**ctx0, 'example': f'첫소리 → {ans}', 'surfaceParts': [ans], 'translation': f'{wd["text"]} [{"".join(wd["ipa"])}] · {wd["ko"]}'}
        lis.append((w, ctx, ''.join(wd['ipa']), wd['audio']))
    # 같은 '뜻' 줄이 여럿이면 틀의 발음 찾기가 섞이므로 번호를 붙여 가른다
    for i, item in enumerate(lis):
        item[0]['ko'] = f'{item[0]["ko"]} ({i + 1})'
    add_ex('듣고 고르기', lis)

    # 4. 전사 빈칸: 원문 자리에 전사, 빈칸에 대상 기호
    bl = []
    for wd in b['words']:
        a, t, z = wd['ipa']
        example = f'[{a}{t}{z}]'
        assert example.find(t) == 1 + len(a), (wd['id'], '대상 기호가 앞에 또 나온다')
        lg = langs[wd['lang']]['ko']
        roman = f' ({wd["roman"]})' if wd['roman'] != wd['text'] else ''
        w = {'en': wd['target'], 'ko': f'{lg} {wd["text"]}{roman} · {wd["ko"]}', 'audio': wd['audio'], 'lang': wd['lang'], 'wid': wd['id']}
        name = sy['symbols'][wd['target']]['name']
        ctx = {**ctx0, 'example': example, 'surfaceParts': [t],
               'translation': f'[{t}] {name}' + (f' · {wd["note"]}' if wd.get('note') else '')}
        bl.append((w, ctx, a + t + z, wd['audio']))
    add_ex('전사 빈칸', bl)

    data = [{'lesson': L, 'name': f'{b["title"]} {b["symbols_title"]}', 'exercises': exercises}]
    own_lines = b['lines']
    lines = {}
    for k in ['welcome', 'start', 'correct', 'correctStreak', 'wrong', 'timeout', 'exerciseDone', 'lessonDone', 'allDone']:
        own = own_lines.get(k) or []
        own = [own] if isinstance(own, str) else own
        lines[k] = own + series.get(k, [])
    lessonclear = {str(L): own_lines['end']}

    examples = {}
    for wd in b['words']:
        a, t, z = wd['ipa']
        examples.setdefault(wd['target'], []).append({'lang': langs[wd['lang']]['ko'], 'text': wd['text'], 'a': a, 't': t, 'b': z, 'audio': wd['audio']})
    used_audio = {wd['audio'] for wd in b['words']} | {s.get('sound') for s in sy['symbols'].values()}
    ipa_data = {
        'short': short, 'symbols': sy['symbols'], 'glottis': sy['glottis'], 'vot': sy['vot'], 'examples': examples,
        'audio': {aid: {'src': src_of(aid), 'peaks': peaks.get(aid), 'duration': audio_src[aid].get('duration')}
                  for aid in sorted(a for a in used_audio if a) if audio_ok(aid)},
        # IPA 지도에서 켜는 칸: 표에 칸이 있는 기호만(pʰ·p͈는 p 칸의 부호라 따로 켜지 않는다)
        'bundles': [{'lesson': L, 'lit': ['b', 'p', 'β']}],
    }
    extra_js = open(os.path.join(ROOT, 'pipeline', 'ipa_extra.js'), encoding='utf-8').read().replace('/*__IPA_DATA__*/{}', js(ipa_data))
    extra_css = open(os.path.join(ROOT, 'pipeline', 'ipa_extra.css'), encoding='utf-8').read()
    html = open(os.path.join(ROOT, 'pipeline', 'frame.html'), encoding='utf-8').read()
    fills = {
        'const DATA = /*__DATA__*/[];': 'const DATA = ' + js(data) + ';',
        'const MT_CONTEXTS=/*__CONTEXTS__*/{};': 'const MT_CONTEXTS=' + js(contexts) + ';',
        'const MT_PRONUNCIATIONS = /*__PRON__*/{};': 'const MT_PRONUNCIATIONS = ' + js(pron) + ';',
        'const PRONUNCIATION_AUDIO_MAP = /*__AUDIO__*/{};': 'const PRONUNCIATION_AUDIO_MAP = ' + js(amap) + ';',
        'const CAT = /*__CAT__*/{};': 'const CAT = ' + js(rd('assets', 'cat', 'goyang-cat.json')) + ';',
        'const LINES = /*__LINES__*/{};': 'const LINES = ' + js(lines) + ';',
        'const LESSONCLEAR = /*__LESSONCLEAR__*/{};': 'const LESSONCLEAR = ' + js(lessonclear) + ';',
        '<script>/*__IPA_EXTRA_JS__*/</script>': '<script>\n' + extra_js.replace('</script', '<\\/script') + '\n</script>',
        '<style>/*__IPA_EXTRA_CSS__*/</style>': '<style>\n' + extra_css + '\n</style>',
    }
    for k, v in fills.items():
        assert html.count(k) == 1, k
        html = html.replace(k, v)
    if inline:
        for name in ('BalumIPA-Regular', 'BalumIPA-Bold'):
            b64 = base64.b64encode(open(os.path.join(ROOT, 'assets', 'fonts', name + '.woff2'), 'rb').read()).decode()
            html = html.replace(f'url("assets/fonts/{name}.woff2")', f'url("data:font/woff2;base64,{b64}")')
        for pat in (r'<!doctype html>\s*', r'<html[^>]*>\s*', r'<head>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*',
                    r'</head>\s*', r'<body[^>]*>\s*', r'</body>\s*', r'</html>\s*'):
            html, n = re.subn(pat, '', html, count=1, flags=re.I)
            assert n == 1, pat
    return html, sum(len(e['words']) for e in exercises), len(ipa_data['audio'])


def main():
    if '--artifact' in sys.argv:
        dst = sys.argv[sys.argv.index('--artifact') + 1]
        html, n, a = build(inline=True)
        open(dst, 'w', encoding='utf-8').write(html)
        print(dst, len(html), '바이트, 카드', n, '녹음', a)
        return
    html, n, a = build()
    out = os.path.join(ROOT, 'index.html')
    if '--check' in sys.argv:
        same = os.path.exists(out) and open(out, encoding='utf-8').read() == html
        print('맞음' if same else '다름: python3 pipeline/build.py 를 다시 돌린다')
        sys.exit(0 if same else 1)
    open(out, 'w', encoding='utf-8').write(html)
    print('index.html', len(html), '바이트, 카드', n, '녹음', a)


if __name__ == '__main__':
    main()
