"""발음고양 조립: data/·sources/ + pipeline/template.html → index.html(생성물).

쓰는 법: python3 pipeline/build.py [--check] [--artifact <파일.html>]
- 원본은 data/(묶음·기호·언어)와 sources/(음원·서지·파형)다. index.html만 고치면 다음 조립 때 사라진다.
- 녹음 파일(assets/audio/<id>.mp3)이 없는 음원은 재생 단추를 끄고, 듣고 고르기에서 뺀다.
- --check: 지금 index.html이 원본과 맞는지만 본다(다르면 끝 상태 1).
- --artifact: claude.ai 미리보기 페이지용 한 파일을 따로 만든다. 문서 껍데기(doctype·head·body)를 빼고,
  글꼴과 녹음을 data: 주소로 넣는다(미리보기 페이지는 다른 파일을 불러오지 못할 수 있어서). 저장소에는 넣지 않는다.
"""
import base64
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rd(*p):
    return json.load(open(os.path.join(ROOT, *p), encoding='utf-8'))


def build(inline=False):
    bundle = rd('data', 'bundles', 'b01.json')
    symbols = rd('data', 'symbols.json')
    langs = rd('data', 'languages.json')['langs']
    audio_src = rd('sources', 'audio.json')['files']
    pk_path = os.path.join(ROOT, 'sources', 'audio-peaks.json')
    peaks = json.load(open(pk_path, encoding='utf-8')) if os.path.exists(pk_path) else {}
    refs = rd('sources', 'references.json')['refs']
    used = {w.get('audio') for w in bundle['words']} | {v.get('sound') for v in symbols['symbols'].values()}
    audio = {}
    for f in audio_src:
        mp3 = os.path.join(ROOT, 'assets', 'audio', f['id'] + '.mp3')
        if f['id'] in used and os.path.exists(mp3) and f.get('mp3'):
            src = f['mp3']
            if inline:
                src = 'data:audio/mpeg;base64,' + base64.b64encode(open(mp3, 'rb').read()).decode()
            audio[f['id']] = {'src': src, 'peaks': peaks.get(f['id']), 'duration': f.get('duration')}
    credits = [{k: f.get(k) for k in ('id', 'commons_file', 'page', 'author', 'license', 'mp3')} for f in audio_src if f['id'] in used]
    data = {'bundle': bundle, 'symbols': symbols, 'langs': langs, 'audio': audio, 'audioCredits': credits,
            'refs': [{'cite': r['cite'], 'doi': r.get('doi')} for r in refs], 'audioPlan': bundle.get('audio_plan')}
    js = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    tpl = open(os.path.join(ROOT, 'pipeline', 'template.html'), encoding='utf-8').read()
    assert tpl.count('/*__DATA__*/null') == 1
    html = tpl.replace('/*__DATA__*/null', js)
    if inline:
        for name in ('BalumIPA-Regular', 'BalumIPA-Bold'):
            b64 = base64.b64encode(open(os.path.join(ROOT, 'assets', 'fonts', name + '.woff2'), 'rb').read()).decode()
            html = html.replace(f'url("assets/fonts/{name}.woff2")', f'url("data:font/woff2;base64,{b64}")')
        for tag in ('<!doctype html>\n', '<html lang="ko">\n', '<head>\n', '<meta charset="utf-8">\n',
                    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n',
                    '</head>\n', '<body>\n', '</body>\n', '</html>\n'):
            assert html.count(tag) == 1, tag
            html = html.replace(tag, '')
        html = html.replace('<!--ARTIFACT_META-->', '<meta name="claude:viewport-fit-sides" content="cover">')
    else:
        html = html.replace('<!--ARTIFACT_META-->\n', '')
    return html, len(audio)


def main():
    if '--artifact' in sys.argv:
        dst = sys.argv[sys.argv.index('--artifact') + 1]
        html, n = build(inline=True)
        open(dst, 'w', encoding='utf-8').write(html)
        print(dst, len(html), '바이트, 녹음', n, '개')
        return
    html, n = build()
    out = os.path.join(ROOT, 'index.html')
    if '--check' in sys.argv:
        same = os.path.exists(out) and open(out, encoding='utf-8').read() == html
        print('맞음' if same else '다름: python3 pipeline/build.py 를 다시 돌린다')
        sys.exit(0 if same else 1)
    open(out, 'w', encoding='utf-8').write(html)
    print('index.html', len(html), '바이트, 녹음', n, '개')


if __name__ == '__main__':
    main()
