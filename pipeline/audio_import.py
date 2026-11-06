"""음원 들여오기(PRINCIPLES 8-4): Commons에서 받은 원본을 mp3로 바꾸고 파형 자료를 만든다.

쓰는 법:
  python3 pipeline/audio_import.py <받은 파일 폴더> <받은 목록.json>

- 받은 목록.json: {"<Commons 파일 이름>": {"local": "<폴더 안 파일 이름>", "sha256": "..."}}
- sources/audio.json의 commons_file과 짝을 맞춘다. 원본은 저장소에 넣지 않고, 바꾼 mp3만 assets/audio/<id>.mp3로 둔다.
- mp3로 바꾸는 까닭: iPhone Safari가 Ogg를 재생하지 못한다. 소리는 자르거나 다듬지 않고 형식만 바꾼다(모노 44.1kHz 96kbps).
- sources/audio.json에 원본·mp3 SHA256과 길이를 적고, sources/audio-peaks.json(파형 막대 값)을 만든다.
"""
import json, os, sys, subprocess, hashlib, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKETS = 120


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def peaks(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'],
                         check=True, capture_output=True).stdout
    n = len(raw) // 2
    vals = struct.unpack('<%dh' % n, raw[:n * 2])
    step = max(1, n // BUCKETS)
    out = [max(abs(v) for v in vals[i:i + step]) for i in range(0, step * BUCKETS, step)]
    top = max(out) or 1
    return [round(v / top, 3) for v in out], round(n / 8000, 3)


def main():
    src_dir, man_path = sys.argv[1], sys.argv[2]
    man = json.load(open(man_path, encoding='utf-8'))
    ap = os.path.join(ROOT, 'sources', 'audio.json')
    audio = json.load(open(ap, encoding='utf-8'))
    pk_path = os.path.join(ROOT, 'sources', 'audio-peaks.json')
    pk = json.load(open(pk_path, encoding='utf-8')) if os.path.exists(pk_path) else {}
    for f in audio['files']:
        m = man.get(f['commons_file'])
        if not m:
            print('없음', f['id'])
            continue
        src = os.path.join(src_dir, m['local'])
        if sha(src) != m['sha256']:
            print('해시 다름', f['id'])
            continue
        dst = os.path.join(ROOT, 'assets', 'audio', f['id'] + '.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map_metadata', '-1', '-ac', '1', '-ar', '44100',
                        '-b:a', '96k', dst], check=True)
        p, dur = peaks(dst)
        f['original_sha256'] = m['sha256']
        f['mp3'] = 'assets/audio/' + f['id'] + '.mp3'
        f['mp3_sha256'] = sha(dst)
        f['duration'] = dur
        pk[f['id']] = p
        print('ok', f['id'], dur)
    json.dump(audio, open(ap, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    pk = {'about': 'pipeline/audio_import.py가 만든 파형 막대 값(0~1). 손으로 고치지 않는다.',
          **{k: v for k, v in pk.items() if k != 'about'}}
    json.dump(pk, open(pk_path, 'w', encoding='utf-8'), ensure_ascii=False)


if __name__ == '__main__':
    main()
