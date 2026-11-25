"""발음고양 조립: 보카고양 틀(pipeline/frame.html) + 발음고양 데이터 → index.html(생성물).

쓰는 법: python3 pipeline/build.py [--check] [--artifact <파일.html>]
- 틀은 보카고양 마더텅 게임에서 뽑은 것이다(pipeline/derive_template.py, 26.11.06 영신 "그냥 보카고양에서 틀을 가져오면 돼").
  발음고양 덧붙임은 pipeline/ipa_extra.js·ipa_extra.css.
- 원본: data/(묶음·기호·언어·발음 용어·시리즈 대사), sources/(음원·서지·파형), assets/cat/goyang-cat.json(고양고양이, 보카고양과 같은 자료).
  index.html만 고치면 다음 조립 때 사라진다.
- 묶음 하나 = 틀의 '강' 하나(data/bundles/b01.json → 01강, b02 → 02강). 연습은 이름 대기·한국어 → 이름 대기·영어 → 듣고 고르기 → 전사 빈칸(PRINCIPLES 8-3, 26.11.08에 배우기·한국어와 견주기를 뺐다).
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


def bundle_files():
    d = os.path.join(ROOT, 'data', 'bundles')
    return sorted(f[:-5] for f in os.listdir(d) if re.fullmatch(r'b\d\d\.json', f))


def build(inline=False):
    sy = rd('data', 'symbols.json')
    terms = rd('data', 'terms.json')['terms']
    hanja = {k: v['gloss'] for k, v in rd('data', 'hanja.json')['chars'].items()}
    for t in terms.values():
        for ch in t['hanja'] + (t.get('short_hanja') or ''):
            assert not ('\u4e00' <= ch <= '\u9fff') or ch in hanja, (ch, 'data/hanja.json에 뜻이 없는 한자')
    # 기호 이름의 한자는 용어 자료(표준국어대사전 대조)에 있는 것만 쓴다: 지어낸 한자가 들어가지 않게
    known = {t['hanja'] for t in terms.values()} | {t.get('short_hanja') for t in terms.values()}
    for k, s in sy['symbols'].items():
        for tok in re.split(r'[ ·]+', s.get('name_hanja', '')):
            assert not tok or tok in known, (k, tok, 'data/terms.json에 없는 한자')
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

    def word_audio(wd):
        """낱말의 녹음 목록(여러 화자, PRINCIPLES 8-8): 첫째가 대표, 나머지는 audio_more"""
        return [a for a in [wd['audio']] + wd.get('audio_more', []) if audio_ok(a)]

    # 명칭 치기(PRINCIPLES 8-3 바뀜 26.11.08): 한글 이름 + 영어 이름. 한자는 용어 자료에서 맞춰 한글을 맞게 치면 같이 뜬다
    tok_hanja = {}
    for t in terms.values():
        tok_hanja[t['ko']] = t['hanja']
        if t.get('short'):
            tok_hanja[t['short']] = t['short_hanja']

    def pair_full(pr):
        toks = pr['ko'].split()
        for tk in toks:
            assert tk in tok_hanja, (pr['ko'], tk, 'data/terms.json에 없는 이름 낱말')
        return {'ko': pr['ko'], 'en': pr['en'], 'hanja': ' '.join(tok_hanja[tk] for tk in toks)}

    def names_for(sym, shown=None, accept=None, accept_names=None):
        """카드의 정답 이름들. shown이 β̞·ð̞(접근음 표시)이면 접근음 짝이 대표.
        accept_names: 게임이 가르치지 않는 기호의 이름도 맞다고 할 때(人의 [ɻ], 26.11.25 외솔: 출처가 갈리는 표기로 틀렸다 하지 않는다, 2-4)"""
        pairs = []
        for k in [x for x in (accept or [sym]) if x in sy['symbols']] or [sym]:
            for pr in sy['symbols'][k]['answers']:
                if pr not in pairs:
                    pairs.append(pr)
        for pr in accept_names or []:
            if pr not in pairs:
                pairs.append(pr)
        if shown and '\u031e' in shown:
            pairs.sort(key=lambda pr: '접근음' not in pr['ko'])
        full = [pair_full(pr) for pr in pairs]
        return f"{full[0]['ko']} {full[0]['en']}", full

    lang_order = ['kor', 'eng', 'spa'] + [l for l in langs if l not in ('kor', 'eng', 'spa')]

    def rep_words(b, sym):
        """기호의 대표 낱말: 언어마다 하나(묶음 차례로 첫 낱말), 한국어·영어·스페인어·그 밖 차례(26.11.08 영신)"""
        got = {}
        for wd in b['words']:
            if wd['target'] == sym and wd['lang'] not in got:
                got[wd['lang']] = wd
        return [got[l] for l in lang_order if l in got]

    bundles = [rd('data', 'bundles', f + '.json') for f in bundle_files()]
    shortcuts = {}
    for b in bundles:
        for k, v in b['shortcuts'].items():
            assert shortcuts.get(k, v) == v, ('줄임이 묶음끼리 겹친다', k)
            shortcuts[k] = v
    short = sorted(shortcuts.items(), key=lambda kv: -len(kv[0]))
    data, contexts, pron, amap = [], {}, {}, {}
    lessonclear, examples, word_audio_map, word_target, by_word, bundles_lit = {}, {}, {}, {}, {}, []
    used_audio = set()
    bundle_lines = {k: [] for k in ['welcome', 'correct', 'correctStreak', 'wrong', 'timeout', 'exerciseDone', 'allDone']}
    lesson_lines = {}

    for L, b in enumerate(bundles, start=1):  # 묶음 n = 강 n
        exercises = []

        def add_ex(title, words):
            if not words:
                return
            n = len(exercises) + 1
            ex = {'ex': n, 'scope': '2026', 'title': title, 'words': []}
            for i, (w, ctx, ipa_show, aid) in enumerate(words):
                w['b'] = L
                ex['words'].append(w)
                contexts[f'{L}/2026/{n}/{i}'] = ctx
                if ipa_show is not None:
                    pron.setdefault(w['en'], {'ipa': '', 'meanings': {}})['meanings'][w['ko']] = {'ipa': ipa_show}
                    if aid and audio_ok(aid):
                        amap[w['en'] + '\t' + ipa_show] = {'src': src_of(aid), 'duration': audio_src[aid].get('duration')}
            exercises.append(ex)

        ctx0 = {'sourceKind': 'body', 'page': 0, 'noTermMask': True}
        # 26.11.08 영신: "배우기 빼자", "한국어와 견주기 빼자", "이름대기는 일단 두단계로 나누나 한국어로 이름대기먼저 …
        # 그리고 영어로 이름대기", "듣고 고르기는 마음에 드는데 어느 경우든 발음명을 치는걸로만 하자".
        # 연습: 이름 대기·한국어 → 이름 대기·영어 → 듣고 고르기 → 전사 빈칸(PRINCIPLES 8-2 바뀜)
        def rep_list(k):
            return [{'wid': wd['id'], 'lid': wd['lang'], 'lang': langs[wd['lang']]['ko'], 'text': wd['text'], 'ko': wd['ko'], 'a': wd['ipa'][0], 't': wd['ipa'][1], 'b': wd['ipa'][2]} for wd in rep_words(b, k)]

        for mode, title in (('ko', '이름 대기 · 한국어'), ('en', '이름 대기 · 영어')):
            cards = []
            for k in b['learn']:
                _, names = names_for(k)
                term = names[0][mode]
                # 뜻 줄은 게임 중에는 숨기고(26.11.20), 결과 목록·검색·모아둔 카드에만 보인다: 기호만
                w = {'en': term, 'ko': f'[{k}]', 'nameq': True, 'mode': mode, 'sym': k, 'names': names, 'reps': rep_list(k)}
                # 26.11.20 영신: '[기호] = ?' 줄과 정답 뒤 세 이름 줄을 없앤다(기호는 위에 있고, 한자는 칸 자리에 뜬다)
                ctx = {**ctx0, 'example': term, 'surfaceParts': [term], 'translation': ''}
                cards.append((w, ctx, k, sy['symbols'][k].get('sound')))
            add_ex(title, cards)

        # 3. 듣고 이름 대기(26.11.25 영신 '듣고 고르기'에서 이름 바꿈, PRINCIPLES 8-12). 녹음이 있는 낱말만, 좁게 들으면 답이 둘인 낱말은 뺀다(2-4)
        #    한국어 낱말도 Commons 녹음이 있으면 낸다(26.11.08 영신 "내 녹음 없이 최대한 진행해보자")
        lis = []
        for wd in b['words']:
            if wd.get('listen') is False or not word_audio(wd):
                continue
            lg = langs[wd['lang']]['ko']
            ans = wd['target']
            a, t, z = wd['ipa']
            # 대상 기호가 첫소리가 아닌 낱말(spin·lobo)이 있어 '첫소리'라 하지 않고 전사의 빈칸으로 묻는다. 낱말 글자는 답한 뒤에 보인다
            example = f'[{a}{t}{z}]'
            assert example.find(t) == 1 + len(a), (wd['id'], '대상 기호가 앞에 또 나온다')
            _, names = names_for(ans, t, wd.get('accept'), wd.get('accept_names'))
            term = names[0]['ko']
            # 게임 중에는 앞부분('영어 낱말')만 보이고(ipa_extra.js), 결과 목록·검색에서는 어느 낱말이었는지 보인다
            w = {'en': term, 'ko': f'{lg} 낱말 · {wd["text"]} [{a}{t}{z}]', 'audio': wd['audio'], 'listen': True, 'lang': wd['lang'], 'wid': wd['id'], 'names': names, 'mode': 'any'}
            ctx = {**ctx0, 'example': example, 'surfaceParts': [t], 'translation': wd['text'] + (f' · {wd["ko"]}' if wd['ko'] != wd['text'] else '')}
            lis.append((w, ctx, ''.join(wd['ipa']), wd['audio']))
        # 같은 '뜻' 줄이 여럿이면 틀의 발음 찾기가 섞인다: 낱말이 들어가 있어 겹치지 않는다
        assert len({item[0]['ko'] for item in lis}) == len(lis), '듣고 이름 대기 뜻 줄이 겹친다'

        # 4. 전사 빈칸: 원문 자리에 전사, 빈칸에 대상 기호
        bl = []
        for wd in b['words']:
            a, t, z = wd['ipa']
            example = f'[{a}{t}{z}]'
            assert example.find(t) == 1 + len(a), (wd['id'], '대상 기호가 앞에 또 나온다')
            lg = langs[wd['lang']]['ko']
            roman = f' ({wd["roman"]})' if wd['roman'] != wd['text'] else ''
            _, names = names_for(wd['target'], t, wd.get('accept'), wd.get('accept_names'))
            term = names[0]['ko']
            gloss = f' · {wd["ko"]}' if wd['ko'] != wd['text'] else ''
            w = {'en': term, 'ko': f'{lg} {wd["text"]}{roman}{gloss}', 'audio': wd['audio'], 'lang': wd['lang'], 'wid': wd['id'], 'names': names, 'mode': 'any'}
            # 정답 뒤에는 이름 줄을 따로 두지 않는다(26.11.20 영신). 낱말 풀이(note)만
            ctx = {**ctx0, 'example': example, 'surfaceParts': [t], 'translation': wd.get('note') or ''}
            bl.append((w, ctx, a + t + z, wd['audio']))
        # 26.11.25 플레이테스트(PRINCIPLES 8-12): 한 판이 24~38장이라 중간에 지쳤다. 이름은 끝까지 치되 한 판을 12장 안팎으로 나누고
        # 듣기 1 → 전사 1 → 듣기 2 → 전사 2처럼 번갈아 둔다(3·4번 연습 자리가 그대로라 이미 끝낸 기록의 뜻이 크게 안 바뀐다).
        # 나눌 때는 하나 건너 하나씩 담아(언어·기호가 판마다 고루) 섞는다
        def parts(items, size=12):
            k = max(1, round(len(items) / size)) if len(items) > size + 3 else 1
            return [items[i::k] for i in range(k)]
        lp, bp = parts(lis), parts(bl)
        for i in range(max(len(lp), len(bp))):
            if i < len(lp):
                add_ex('듣고 이름 대기' + (f' {i + 1}/{len(lp)}' if len(lp) > 1 else ''), lp[i])
            if i < len(bp):
                add_ex('전사 빈칸' + (f' {i + 1}/{len(bp)}' if len(bp) > 1 else ''), bp[i])

        data.append({'lesson': L, 'name': f'{b["title"]} {b["symbols_title"]}', 'exercises': exercises})
        own = b['lines']
        for k in bundle_lines:
            v = own.get(k) or []
            bundle_lines[k] += [v] if isinstance(v, str) else v
            # 강마다의 대사(26.11.20 검수: 1강에서 틀렸는데 'ㅅ'·'[ɡ]' 대사가 나왔다). 처음 화면 인사만 강을 섞는다
            if k != 'welcome':
                lesson_lines.setdefault(L, {})[k] = [v] if isinstance(v, str) else list(v)
        lessonclear[str(L)] = own['end']
        by_word.update(own.get('by_word', {}))
        for wd in b['words']:
            a, t, z = wd['ipa']
            word_audio_map[wd['id']] = word_audio(wd)
            word_target[wd['id']] = wd['target']
            used_audio |= {wd['audio'], *wd.get('audio_more', [])}
            examples.setdefault(wd['target'], []).append({'lang': langs[wd['lang']]['ko'], 'text': wd['text'], 'a': a, 't': t, 'b': z, 'audio': wd['audio'], 'wid': wd['id'], 'lid': wd['lang'], 'ko': wd['ko'], 'o': lang_order.index(wd['lang'])})
        # IPA 지도에서 켜는 칸: 표에 칸이 있는 기호만(pʰ·p͈는 p 칸의 부호라 따로 켜지 않는다)
        # 모음 묶음(PRINCIPLES 8-11)은 작은 지도·큰 표·처음 화면에서 모음 사다리꼴을 쓴다
        bundles_lit.append({'lesson': L, 'id': b['id'], 'lit': b['lit'], 'vowel': any(sy['symbols'][k].get('height') for k in b['learn'])})

    for k in examples:
        examples[k].sort(key=lambda e: e['o'])
    # 고양이 대사: 시리즈 공통 + 묶음들의 대사(묶음마다 다른 시작 대사는 넣지 않는다: 다른 강에서도 나오므로)
    lines = {k: list(series.get(k, [])) for k in ['welcome', 'start', 'correct', 'correctStreak', 'wrong', 'timeout', 'exerciseDone', 'lessonDone', 'allDone']}
    # 처음 화면 인사는 모든 강의 대사를 섞고, 카드·결과 대사는 시리즈 공통 + 그 강 것만(ipa_extra.js ipaLinesFor)
    lines['welcome'] = bundle_lines['welcome'] + lines['welcome']
    series_lines = {k: list(lines[k]) for k in bundle_lines if k != 'welcome'}
    used_audio |= {s.get('sound') for s in sy['symbols'].values()}
    ipa_data = {
        'short': short, 'terms': terms, 'hanja': hanja, 'symbols': sy['symbols'], 'glottis': sy['glottis'], 'vot': sy['vot'], 'examples': examples,
        'audio': {aid: {'src': src_of(aid), 'peaks': peaks.get(aid), 'duration': audio_src[aid].get('duration'), 'speaker': audio_src[aid].get('speaker_short')}
                  for aid in sorted(a for a in used_audio if a) if audio_ok(aid)},
        'wordAudio': word_audio_map, 'wordTarget': word_target, 'byWord': by_word,
        # 언어 고르기에 보일 언어: 묶음에 낱말이 있는 언어만, 한국어·영어·스페인어·그 밖 차례
        'langs': [{'id': l, 'ko': langs[l]['ko']} for l in lang_order if any(wd['lang'] == l for b in bundles for wd in b['words'])],
        'bundles': bundles_lit,
        'seriesLines': series_lines, 'lessonLines': lesson_lines,
        'sagittal': rd('assets', 'sagittal', 'sagittal.json'),
        # 녹음 출처(공개 배포 전 필수: CC BY·CC BY-SA는 만든 사람·라이선스·출처를 보여야 한다). 처음 화면 '자료·녹음 출처'
        'credits': [{'g': langs[audio_src[aid]['lang']]['ko'] if audio_src[aid]['lang'] in langs else '기호 시범 녹음',
                     'f': audio_src[aid]['commons_file'], 'a': audio_src[aid].get('author', ''), 'l': audio_src[aid].get('license', ''),
                     'p': audio_src[aid].get('page', '')}
                    for aid in sorted((a for a in used_audio if a and audio_ok(a)),
                                      key=lambda x: ((lang_order.index(audio_src[x]['lang']) if audio_src[x]['lang'] in lang_order else 99), x))],
    }
    del ipa_data['sagittal']['about']
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
    # 기록 옮기기(고양 시리즈 공통, 보카고양 pipeline/record-transfer를 복사): 처음 화면 맨 아래에 단추, 창, 코드
    rt = os.path.join(ROOT, 'pipeline', 'record-transfer')
    rt_src = lambda n: open(os.path.join(rt, n), encoding='utf-8').read().replace('\r\n', '\n').strip()
    rt_cfg = {k: v for k, v in json.load(open(os.path.join(rt, 'config.json'), encoding='utf-8')).items() if k != 'about'}
    rt_js = ('<script id="record-transfer">\n/* RECORD_TRANSFER_START */\nvar RT_CONFIG=' + json.dumps(rt_cfg, ensure_ascii=False, separators=(',', ':')) + ';\n'
             + re.sub(r'\nif\(typeof module[^\n]*$', '', rt_src('merge.js')) + '\n' + rt_src('runtime.js') + '\n/* RECORD_TRANSFER_END */\n</script>')
    for at, piece in (('</head>', '<style id="record-transfer-style">\n' + rt_src('style.css') + '\n</style>\n</head>'),
                      ('<div class="grid" id="lessonGrid" style="padding:0 13px 13px;"></div>\n      </div>\n', '<div class="grid" id="lessonGrid" style="padding:0 13px 13px;"></div>\n      </div>\n      <!-- RECORD_TRANSFER_UI_START -->\n' + rt_src('ui.html') + '\n      <!-- RECORD_TRANSFER_UI_END -->\n'),
                      ('</body>', rt_js.replace('</script', '<\\/script', rt_js.count('</script') - 1) + '\n</body>')):
        assert html.count(at) == 1, at
        html = html.replace(at, piece)
    if inline:
        for name in ('BalumIPA-Regular', 'BalumIPA-Bold'):
            b64 = base64.b64encode(open(os.path.join(ROOT, 'assets', 'fonts', name + '.woff2'), 'rb').read()).decode()
            html = html.replace(f'url("assets/fonts/{name}.woff2")', f'url("data:font/woff2;base64,{b64}")')
        for pat in (r'<!doctype html>\s*', r'<html[^>]*>\s*', r'<head>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*',
                    r'</head>\s*', r'<body[^>]*>\s*', r'</body>\s*', r'</html>\s*'):
            html, n = re.subn(pat, '', html, count=1, flags=re.I)
            assert n == 1, pat
    return html, sum(len(e['words']) for d in data for e in d['exercises']), len(ipa_data['audio'])


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
