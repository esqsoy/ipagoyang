"""Wiktionary 전사 대조(PRINCIPLES 8-6): 우리가 적은 전사의 대상 소리가 Wiktionary 전사에도 있는지 본다.

쓰는 법: python3 pipeline/wikt_compare.py <받은 전사.json> [묶음 id]
- 받은 전사.json: {"<언어>:<낱말>": {"ipa": ["/.../", "[...]", ...]}} (en.wiktionary.org 낱말 문서의 그 언어 절에서 뽑은 IPA)
- Wiktionary 전사는 가져다 쓰지 않는다. 대조 결과만 sources/wiktionary-<묶음>.json에 남긴다(인용한 짧은 전사는 CC BY-SA 4.0, en.wiktionary.org).
- 대상 소리가 없으면 '다름'으로 적고 끝 상태 1. 대상 밖 차이(다른 자리의 기호)는 사람이 보라고 따로 적는다.
- 파찰음 잇는 줄(͡)은 떼고 견준다(Wiktionary t͡s = 우리 ts).
"""
import json, os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    got = json.load(open(sys.argv[1], encoding='utf-8'))
    bid = sys.argv[2] if len(sys.argv) > 2 else 'b01'
    b = json.load(open(os.path.join(ROOT, 'data', 'bundles', bid + '.json'), encoding='utf-8'))
    rows, bad = [], 0
    for w in b['words']:
        key = f"{w['lang']}:{w['text']}"
        # 파찰음 잇는 줄(t͡s의 ͡)은 떼고 견준다. 우리 전사는 ts로 적는다.
        theirs = [x.replace('\u0361', '') for x in got.get(key, {}).get('ipa', []) if x.startswith(('/', '[')) and len(x) > 3]
        ours = ''.join(w['ipa'])
        accept = w.get('accept') or [w['target']]
        tgt = w['ipa'][1]
        found = [t for t in theirs if any(a in t for a in accept + [tgt])]
        ok = bool(found)
        via = ''
        # Wiktionary에 음소 표기(/…/)만 있고 우리 대상이 기식 변이음([pʰ]·[tʰ])이면 바탕 음소가 있는지만 보고, 기식은 PHOIBLE 대조로 넘긴다
        if not ok and tgt.endswith('ʰ'):
            base = tgt[:-1]
            ph = [t for t in theirs if t.startswith('/') and base in t]
            if ph:
                ok, found, via = True, ph, '음소 표기만 있음: 기식은 PHOIBLE로 대조'
        bad += 0 if ok else 1
        plain = lambda s: re.sub(r'[\[\]/ˈ.̠̞̹̃͡]', '', s)
        rest = [t for t in theirs if plain(t) != plain(ours)]
        rows.append({'word': w['id'], 'ours': f'[{ours}]', 'wiktionary': theirs, 'target_ok': ok, 'via': via,
                     'other_diff': rest if ok else []})
        print(('OK  ' if ok else 'NG  ') + key, f'[{ours}]', theirs)
    out = {'about': 'pipeline/wikt_compare.py 결과. Wiktionary(en.wiktionary.org, CC BY-SA 4.0) 낱말 문서의 전사와 대조만 했다. 우리 전사는 data/bundles에 있고 Wiktionary에서 가져오지 않았다.',
           'fetched': '2026-11-06', 'bundle': bid, 'rows': rows}
    json.dump(out, open(os.path.join(ROOT, 'sources', f'wiktionary-{bid}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('다름', bad)
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
