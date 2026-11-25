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
# 모음(PRINCIPLES 8-11, 26.11.25): 원본 vowels/svg 일곱 장. 일곱 장이 다른 것은 혀·아래턱 경로뿐이고 입술 둥글기는 그리지 않는다
VOWELS = {'v_i': 'i', 'v_u': 'u', 'v_a': 'a', 'v_ae': 'æ', 'v_eh': 'ɛ', 'v_ih': 'ɪ', 'v_uh': 'ʊ'}


def _pts(d):
    """원본 혀 경로(상대 꺾은선 'm x,y dx,dy … z')를 절대 좌표 점들로"""
    nums = [float(x) for x in re.findall(r'-?\d+\.?\d*(?:e-?\d+)?', d)]
    assert re.fullmatch(r'\s*m[^a-zA-Z]*z\s*', d), '혀 경로가 m … z 꺾은선이 아니다'
    x, y, out = nums[0], nums[1], []
    out.append((x, y))
    for i in range(2, len(nums) - 1, 2):
        x, y = x + nums[i], y + nums[i + 1]
        out.append((x, y))
    return out


def _resample(pts, n):
    """닫힌 꺾은선을 둘레 길이로 n개 점에 고르게 다시 나눈다"""
    ring = pts + [pts[0]]
    seg = [((ring[i + 1][0] - ring[i][0]) ** 2 + (ring[i + 1][1] - ring[i][1]) ** 2) ** .5 for i in range(len(ring) - 1)]
    total, out, i, acc = sum(seg), [], 0, 0.0
    for k in range(n):
        want = total * k / n
        while i < len(seg) - 1 and acc + seg[i] < want:
            acc += seg[i]; i += 1
        f = 0 if seg[i] == 0 else (want - acc) / seg[i]
        out.append((ring[i][0] + f * (ring[i + 1][0] - ring[i][0]), ring[i][1] + f * (ring[i + 1][1] - ring[i][1])))
    return out


def mid_tongue(d1, d2, n=400):
    """[ɨ]의 혀: [i]와 [u]의 혀 경로를 같은 점 수로 나눠 가운데(원본에 없는 그림, 화면에 '사이로 그린 것'이라 밝힌다)"""
    a, b = _resample(_pts(d1), n), _resample(_pts(d2), n)
    return 'M' + ' L'.join(f'{(p[0] + q[0]) / 2:.3f},{(p[1] + q[1]) / 2:.3f}' for p, q in zip(a, b)) + ' Z'


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
    vsrc = os.path.join(repo, 'midsaggital_articulations', 'vowels', 'svg')
    for name, fn in VOWELS.items():
        s = open(os.path.join(vsrc, fn + '.svg'), encoding='utf-8').read()
        assert re.search(r'viewBox="([^"]+)"', s).group(1) == out['viewBox'], name
        ds = [re.sub(r'\s+', ' ', m).strip() for m in re.findall(r'<path\b[^>]*?\sd="([^"]+)"', s, re.S)]
        assert len(ds) == 5, (name, len(ds))
        out['shapes'][name] = ds
    out['shapes']['v_barred_i'] = out['shapes']['v_i'][:4] + [mid_tongue(out['shapes']['v_i'][4], out['shapes']['v_u'][4])]
    out['derived'] = {'v_barred_i': '[ɨ]의 혀는 원본에 없어 [i]·[u] 혀 경로의 가운데로 그렸다(Claude, PRINCIPLES 8-11)'}
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
