"""입 옆모습 단면도 들여오기(PRINCIPLES 8-8): CC0 단면도의 경로 자료만 뽑아 assets/sagittal/sagittal.json으로 둔다.

쓰는 법:
  python3 -I pipeline/sagittal_import.py <phonetics-teaching-assets 저장소 폴더> <커밋>

- 원본: github.com/drammock/phonetics-teaching-assets(Daniel McCloy, 워싱턴 대학 언어학과에서 2010년쯤 그림), CC0 1.0(저장소 LICENSE).
  Commons의 'IPA … Sagittal Section.svg'(Wright·McCloy)와 같은 계열이다.
- 그림마다 경로 다섯 개: 0 후두 아래쪽, 1 머리, 2 목청(곧은 선 = 무성, 톱니 = 유성), 3 위턱·입천장, 4 혀·아래턱(조음 자리마다 다름).
- 얼굴이 오른쪽을 본다. 게임은 IPA 표 방향(왼쪽 = 입 앞)에 맞춰 좌우로 뒤집어 그린다(ipa_extra.js ipaSagittal).
- 색·선 굵기는 버리고 모양(d)만 남긴다. 화면 색은 틀의 색을 쓴다.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 게임 이름 → 원본 파일 이름
FILES = {'neutral': 'neutral', 'p': 'p', 'b': 'b', 'm': 'm', 't': 't', 'd': 'd', 'n': 'n', 'eth': 'eth', 'theta': 'θ',
         'k': 'k', 'g': 'g', 'f': 'f', 'v': 'v', 'uvular_fric': 'ʁ', 'r_retroflex': 'r_retroflex', 's': 's_apical', 'z': 'z_apical',
         'sh': 'ʃ_apical', 'zh': 'ʒ_apical', 'x_uvular': 'χ', 'c_pal': 'ç', 'jj': 'ʝ', 'ng': 'ŋ'}
ROLES = ['larynx', 'head', 'glottis', 'upper', 'tongue']


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    repo, commit = sys.argv[1], sys.argv[2]
    lic = open(os.path.join(repo, 'LICENSE'), encoding='utf-8').read()
    assert 'CC0 1.0 Universal' in lic, 'LICENSE가 CC0가 아니다'
    src = os.path.join(repo, 'midsaggital_articulations', 'consonants', 'svg')
    out = {'about': 'drammock/phonetics-teaching-assets(CC0 1.0)의 단면도에서 경로 모양만 뽑은 것. 만든 도구: pipeline/sagittal_import.py',
           'source': 'https://github.com/drammock/phonetics-teaching-assets', 'commit': commit, 'license': 'CC0 1.0',
           'viewBox': None, 'roles': ROLES, 'shapes': {}}
    for name, fn in FILES.items():
        s = open(os.path.join(src, fn + '.svg'), encoding='utf-8').read()
        vb = re.search(r'viewBox="([^"]+)"', s).group(1)
        out['viewBox'] = out['viewBox'] or vb
        assert vb == out['viewBox'], (name, vb)
        ds = [re.sub(r'\s+', ' ', m).strip() for m in re.findall(r'<path\b[^>]*?\sd="([^"]+)"', s, re.S)]
        assert len(ds) == 5, (name, len(ds))
        out['shapes'][name] = ds
    # 같은 경로는 한 번만 둔다(머리·위턱 등은 그림마다 같다)
    pool, shapes = [], {}
    for name, ds in out['shapes'].items():
        idx = []
        for d in ds:
            if d not in pool:
                pool.append(d)
            idx.append(pool.index(d))
        shapes[name] = idx
    out['paths'], out['shapes'] = pool, shapes
    dst = os.path.join(ROOT, 'assets', 'sagittal', 'sagittal.json')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(dst, '그림', len(shapes), '경로', len(pool), os.path.getsize(dst), '바이트')


if __name__ == '__main__':
    main()
