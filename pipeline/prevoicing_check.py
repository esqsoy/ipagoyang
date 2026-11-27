"""낱말 첫 유성음의 앞 울림(prevoicing) 재기(PRINCIPLES 2-4·8-10, 26.11.26).

쓰는 법: python3 pipeline/prevoicing_check.py   (data/bundles의 낱말 첫 b·d·ɡ·dz·dʒ·dʑ·ɗ 카드 녹음을 모두 잰다)

- 모음이 시작되기 140~20ms 앞 구간의 300Hz 아래 에너지를 모음의 같은 에너지로 나눈 값. 입술·혀를 막은 채 목청을 먼저
  울리면(스페인어·이탈리아어·프랑스어·러시아어 등의 [b d ɡ]) 0.1을 넘고, 울림 없이 바로 터뜨리면(영어·독일어 첫 b d g처럼)
  0에 가깝다. 같은 방법으로 프랑스어 bain(Sartus85) 0.18·pain 0.02.
- 왜: 영신이 스페인어 vaca 녹음이 '빠가'로 들린다고 했다(26.11.26). 재 보니 0.017로 무성 pain과 같았다.
- 판정은 사람이 한다. 이 도구는 값만 낸다. 0.05 아래를 '앞 울림 없음'으로 본다(그 사이 값은 귀로 확인).
"""
import json, glob, os, sys, math, struct, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# ɗ(베트남어 đ, 26.11.27): 내파음도 닫는 동안 울리므로 앞 울림이 있어야 한다. 아직 녹음이 없어(vi-doi 발음 확보 중) 잴 것이 없다
TARGETS = {'b', 'd', 'ɡ', 'dz', 'dʒ', 'dʑ', 'ɗ', 'ɓ'}


def load(p, lp=None, sr=16000):
    af = ['-af', f'lowpass=f={lp}'] if lp else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, *af, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return list(struct.unpack('<%dh' % (len(raw) // 2), raw)), sr


def rms(f):
    return math.sqrt(sum(v * v for v in f) / max(1, len(f)))


def ratio(p):
    full, sr = load(p)
    low, _ = load(p, 300)
    n = int(sr * 0.01)
    R = [rms(full[i:i + n]) for i in range(0, len(full) - n, n)]
    top = max(R)
    on = next(i for i, r in enumerate(R) if r > top * 0.3)
    pre, vow = low[max(0, (on - 14) * n):(on - 2) * n], low[(on + 2) * n:(on + 8) * n]
    return rms(pre) / max(1, rms(vow))


def main():
    for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'bundles', 'b*.json'))):
        for w in json.load(open(f, encoding='utf-8'))['words']:
            a = w['ipa'][0].replace('ˈ', '')
            if w['target'] in TARGETS and a == '':
                for aid in [w['audio']] + w.get('audio_more', []):
                    p = os.path.join(ROOT, 'assets', 'audio', aid + '.mp3')
                    if os.path.exists(p):
                        r = ratio(p)
                        print(f"{os.path.basename(f)[:3]} {w['id']:16s} {aid:36s} listen={w.get('listen', True)!s:5s} {r:.3f}{'  앞 울림 없음' if r < 0.05 else ''}")


if __name__ == '__main__':
    main()
