"""PHOIBLE 대조(PRINCIPLES 8-6): 묶음 낱말의 대상 소리가 지정한 PHOIBLE 목록에 있는지 기계로 본다.

쓰는 법:
  python3 pipeline/phoible_check.py <phoible.csv> <InventoryID-Bibtex.csv> [묶음 id ...]

- phoible.csv·InventoryID-Bibtex.csv는 github.com/phoible/dev(CC BY-SA 3.0)에서 받는다. 26MB라 저장소에 넣지 않는다.
- 결과 sources/phoible-<묶음>.json에는 그 묶음이 쓰는 목록의 해당 줄(음소·변이음)만 남긴다. PHOIBLE 자료라 CC BY-SA 3.0을 따른다.
- 낱말마다 phoible.seg(음소)가 그 목록에 있는지, phoible.allo(변이음)를 적었으면 그 음소의 변이음 칸에 있는지 본다.
- 묶음 파일의 absent(이 목록들에 없어야 하는 소리)도 본다. 예: 한국어 목록들에 β가 없는지.
하나라도 어긋나면 끝 상태 1로 끝낸다. 판정은 사람이 하고, 이 도구는 경고만 낸다(보카고양 PRINCIPLES 9).
"""
import csv, json, sys, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_phoible(path):
    inv = collections.defaultdict(list)
    meta = {}
    with open(path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            k = int(row['InventoryID'])
            inv[k].append(row)
            meta[k] = {'iso': row['ISO6393'], 'name': row['LanguageName'], 'dialect': row['SpecificDialect'], 'source': row['Source']}
    return inv, meta


def allophones(row):
    a = row.get('Allophones') or ''
    return [] if a in ('', 'NA') else a.split(' ')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    inv, meta = load_phoible(sys.argv[1])
    bib = collections.defaultdict(list)
    with open(sys.argv[2], encoding='utf-8') as f:
        for row in csv.DictReader(f):
            k = int(row['InventoryID'])
            if row['BibtexKey'] not in bib[k]:
                bib[k].append(row['BibtexKey'])
    ids = sys.argv[3:] or [os.path.splitext(n)[0] for n in sorted(os.listdir(os.path.join(ROOT, 'data', 'bundles')))]
    bad = 0
    for bid in ids:
        b = json.load(open(os.path.join(ROOT, 'data', 'bundles', bid + '.json'), encoding='utf-8'))
        used = sorted({w['phoible']['inv'] for w in b['words'] if w.get('phoible')} | {int(k) for k in b.get('absent', {})})
        results = []
        for w in b['words']:
            p = w.get('phoible')
            if not p:
                results.append({'word': w['id'], 'ok': False, 'why': 'phoible 칸 없음'})
                bad += 1
                continue
            rows = [r for r in inv.get(p['inv'], []) if r['Phoneme'] == p['seg']]
            ok, why = True, ''
            if not rows:
                ok, why = False, f"목록 {p['inv']}에 음소 {p['seg']} 없음"
            elif p.get('allo') and p['allo'] not in allophones(rows[0]):
                ok, why = False, f"목록 {p['inv']} 음소 {p['seg']}의 변이음에 {p['allo']} 없음(변이음: {rows[0].get('Allophones')})"
            if not ok:
                bad += 1
            results.append({'word': w['id'], 'inv': p['inv'], 'seg': p['seg'], 'allo': p.get('allo'), 'ok': ok, 'why': why})
        absent = []
        for k, segs in b.get('absent', {}).items():
            k = int(k)
            for s in segs:
                hit = [r['Phoneme'] for r in inv.get(k, []) if r['Phoneme'] == s or s in allophones(r)]
                ok = not hit
                if not ok:
                    bad += 1
                absent.append({'inv': k, 'seg': s, 'ok': ok, 'found_in': hit})
        # 결과 파일에는 이 묶음 낱말이 대조한 음소 줄과 absent 줄만 남긴다(26.11.09: 전에는 입술소리 줄만 남겼다)
        segs = collections.defaultdict(set)
        for w in b['words']:
            if w.get('phoible'):
                segs[w['phoible']['inv']].add(w['phoible']['seg'])
        for k, ss in b.get('absent', {}).items():
            segs[int(k)].update(ss)
        keep = {}
        for k in used:
            keep[str(k)] = {
                'meta': meta.get(k), 'bibtex': bib.get(k, []),
                'rows': [{'phoneme': r['Phoneme'], 'allophones': r['Allophones'], 'marginal': r['Marginal']}
                         for r in inv.get(k, []) if r['Phoneme'] in segs.get(k, set())]
            }
        out = {'about': 'PHOIBLE 2.0(Moran·McCloy 엮음, CC BY-SA 3.0)에서 이 묶음이 대조한 음소 줄과 대조 결과. pipeline/phoible_check.py가 만든다. 손으로 고치지 않는다.',
               'bundle': bid, 'results': results, 'absent': absent, 'inventories': keep}
        dst = os.path.join(ROOT, 'sources', f'phoible-{bid}.json')
        json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        for r in results + absent:
            print(('OK  ' if r['ok'] else 'NG  ') + json.dumps(r, ensure_ascii=False))
    print('어긋남', bad)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
