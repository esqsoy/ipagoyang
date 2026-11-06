"""발음고양 조립: data/·sources/ + pipeline/template.html → index.html(생성물).

쓰는 법: python3 pipeline/build.py [--check]
- 원본은 data/(묶음·기호·언어)와 sources/(음원·서지·파형)다. index.html만 고치면 다음 조립 때 사라진다.
- 녹음 파일(assets/audio/<id>.mp3)이 없는 음원은 재생 단추를 끄고, 듣고 고르기에서 뺀다.
- --check: 지금 index.html이 원본과 맞는지만 본다(다르면 끝 상태 1).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rd(*p):
    return json.load(open(os.path.join(ROOT, *p), encoding='utf-8'))


def build():
    bundle = rd('data', 'bundles', 'b01.json')
    symbols = rd('data', 'symbols.json')
    langs = rd('data', 'languages.json')['langs']
    audio_src = rd('sources', 'audio.json')['files']
    pk_path = os.path.join(ROOT, 'sources', 'audio-peaks.json')
    peaks = json.load(open(pk_path, encoding='utf-8')) if os.path.exists(pk_path) else {}
    refs = rd('sources', 'references.json')['refs']
    audio = {}
    for f in audio_src:
        mp3 = os.path.join(ROOT, 'assets', 'audio', f['id'] + '.mp3')
        if os.path.exists(mp3) and f.get('mp3'):
            audio[f['id']] = {'src': f['mp3'], 'peaks': peaks.get(f['id']), 'duration': f.get('duration')}
    credits = [{k: f.get(k) for k in ('id', 'commons_file', 'page', 'author', 'license', 'mp3')} for f in audio_src]
    data = {'bundle': bundle, 'symbols': symbols, 'langs': langs, 'audio': audio, 'audioCredits': credits,
            'refs': [{'cite': r['cite'], 'doi': r.get('doi')} for r in refs]}
    js = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    tpl = open(os.path.join(ROOT, 'pipeline', 'template.html'), encoding='utf-8').read()
    assert tpl.count('/*__DATA__*/null') == 1
    return tpl.replace('/*__DATA__*/null', js), len(audio)


def main():
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
