"""PHOIBLE '기호 × 11개 언어' 표(PRINCIPLES 8-7): 묶음을 짜기 전에 어느 언어가 그 기호를 음소·변이음으로 갖는지 본다.

쓰는 법:
  python3 pipeline/phoible_matrix.py <phoible.csv> [--out data/phoible-matrix.json]

- phoible.csv는 github.com/phoible/dev(CC BY-SA 3.0)에서 받는다. 결과 파일도 PHOIBLE 자료라 CC BY-SA 3.0이다.
- 언어마다 기본 변종(PRINCIPLES 8-6)에 맞는 목록 하나를 쓴다. 학회지 JIPA 'Illustrations of the IPA'를 옮긴 목록을 먼저 고른다.
  기본 변종과 어긋나는 목록은 note에 적는다(스페인어는 중남미 목록이 PHOIBLE에 없어 카스티야 목록을 쓴다).
- 표 칸(by_cell)은 부호를 뗀 바탕 기호로 묶는다. 예: t̪·tʰ·t͉ → t 칸. 파찰음(tɕ·ts)도 앞 글자 칸에 들어가니 seg를 보고 가른다. 정확한 분절음은 그대로 남긴다.
- 표는 도구일 뿐이다. 목록에 빠진 음소가 있다(KNOWN_GAPS).
"""
import csv, json, os, sys, unicodedata, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 언어별 목록: (InventoryID, 출처 키, 설명)
INVENTORIES = {
    'kor': (2197, 'kor_lee1993', 'Lee 1993 JIPA, 서울 표준어'),
    'jpn': (2196, 'jpn_okada1991', 'Okada 1991 JIPA, 도쿄'),
    'spa': (2210, 'spa_martinez-celdra2003', 'Martínez-Celdrán 외 2003 JIPA. 카스티야 스페인어라 기본 변종(중남미 공통)과 다르다: θ·ʎ 등은 중남미에 없다'),
    'por': (2207, 'por_barbosa2004', 'Barbosa·Albano 2004 JIPA, 브라질 상파울루'),
    'cmn': (1047, 'cmn_lee2003_phon', 'Lee·Zee 2003 JIPA, 베이징 표준 중국어'),
    'rus': (2261, 'yanushevskaya2015russian', 'Yanushevskaya·Bunčić 2015 JIPA, 표준 러시아어'),
    'eng': (2176, 'eng_hillenbrand2003', 'Hillenbrand 2003 JIPA, 미국 영어(미시간 남동부)'),
    'deu': (2184, 'deu_kohler1990', 'Kohler 1990 JIPA, 독일 표준어'),
    'fra': (2182, 'fra_fougeron1993', 'Fougeron·Smith 1993 JIPA, 파리 화자'),
    'ita': (1145, 'ita_rogers2004', "Rogers·d'Arcangeli 2004 JIPA, 표준 이탈리아어"),
    'arb': (2157, 'arb_thelwall1990', "Thelwall·Sa'Adeddin 1990 JIPA, 아랍어(사파드·베이루트·다마스쿠스·쿠웨이트 화자). 현대 표준 아랍어 목록은 확인 필요"),
}


# 목록에 빠진 것으로 보이는 음소(자료 빈틈). 표를 그대로 믿지 않도록 함께 적는다.
KNOWN_GAPS = {
    'spa': ['2210에 /k/가 없다. 스페인어에 /k/가 있음은 분명하므로(casa 등) 목록의 빠짐으로 본다. 확인 필요: 원문 Martínez-Celdrán 외 2003의 자음표'],
}


def base(seg):
    """부호(결합 문자·수정 문자)를 뗀 바탕 글자들. 이중 조음(t͡s)은 앞 글자."""
    out = ''
    for ch in unicodedata.normalize('NFD', seg):
        cat = unicodedata.category(ch)
        if cat in ('Mn', 'Lm', 'Sk'):
            continue
        out += ch
    return out[:1] if out else seg


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    out = os.path.join(ROOT, 'data', 'phoible-matrix.json')
    if '--out' in sys.argv:
        out = sys.argv[sys.argv.index('--out') + 1]
    want = {v[0]: k for k, v in INVENTORIES.items()}
    rows = collections.defaultdict(list)
    with open(sys.argv[1], encoding='utf-8') as f:
        for r in csv.DictReader(f):
            k = int(r['InventoryID'])
            if k in want:
                rows[want[k]].append(r)
    langs, by_cell = {}, collections.defaultdict(lambda: collections.defaultdict(list))
    for lang, (inv, key, note) in INVENTORIES.items():
        rs = rows.get(lang)
        assert rs, (lang, inv, '목록을 찾지 못함')
        segs = []
        for r in rs:
            allo = [] if r['Allophones'] in ('', 'NA') else r['Allophones'].split(' ')
            segs.append({'p': r['Phoneme'], 'allo': allo, 'class': r['SegmentClass'], 'marginal': r['Marginal'] == 'TRUE'})
            by_cell[base(r['Phoneme'])][lang].append({'seg': r['Phoneme'], 'role': 'phoneme'})
            for a in allo:
                if a != r['Phoneme']:
                    by_cell[base(a)][lang].append({'seg': a, 'role': 'allophone', 'of': r['Phoneme']})
        langs[lang] = {'inventory': inv, 'source': key, 'name': rs[0]['LanguageName'], 'dialect': rs[0]['SpecificDialect'],
                       'note': note, 'known_gaps': KNOWN_GAPS.get(lang, []), 'segments': segs}
    doc = {
        'about': 'PHOIBLE 2.0(Moran·McCloy 엮음, CC BY-SA 3.0)에서 언어마다 목록 하나를 골라 옮긴 것. 이 파일도 CC BY-SA 3.0. '
                 '만든 도구: pipeline/phoible_matrix.py. by_cell은 부호를 뗀 바탕 기호로 묶었다.',
        'langs': langs,
        'by_cell': {c: dict(v) for c, v in sorted(by_cell.items())},
    }
    json.dump(doc, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(out, 'a', encoding='utf-8').write('\n')
    print(out, '언어', len(langs), '칸', len(by_cell))


if __name__ == '__main__':
    main()
