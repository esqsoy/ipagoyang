# 발음고양 파이프라인

원본은 `data/`(묶음·기호·언어)와 `sources/`(음원·서지·대조 결과)다. `index.html`은 생성물이라 손으로 고치지 않는다.

| 파일 | 하는 일 |
|---|---|
| `build.py` | `template.html` + 원본 → `index.html`. `--check`는 맞는지만 본다 |
| `template.html` | 게임 화면(입 지도·목청 창·소리 시작 띠·파형·묶음 자판·문제) |
| `phoible_check.py` | 낱말의 대상 소리가 PHOIBLE 목록에 있는지 대조 → `sources/phoible-<묶음>.json` |
| `wikt_compare.py` | 우리 전사의 대상 소리가 Wiktionary 전사에도 있는지 대조 → `sources/wiktionary-<묶음>.json` |
| `audio_import.py` | Commons에서 받은 원본을 mp3로(형식만), 파형 값 → `assets/audio/`, `sources/audio-peaks.json` |
| `font_subset.py` | Charis SIL에서 IPA·라틴 글자만 남기고 'Balum IPA'로 이름을 바꿈(OFL 예약 이름) |
| `review_page.py` | 영신 직검수 페이지(줄 댓글, Artifact `capabilities: {comments: {}}`) |
| `tests/prototype.test.cjs` | 390px로 처음 화면부터 출처 화면까지 지나가는 검사(Playwright·Chromium) |

## 고친 뒤 돌릴 것

```bash
python3 pipeline/build.py
```

```bash
node pipeline/tests/prototype.test.cjs
```

낱말·전사를 고쳤으면 PHOIBLE 대조와 Wiktionary 대조도 다시 돌린다(자료는 저장소 밖에서 받는다. HANDOFF '작업 환경').

## 녹음 받기

`sources/audio.json`의 `original` 주소에서 받는다. 파일 페이지(`page`)에서 라이선스를 다시 확인하고, 받은 목록(Commons 파일 이름 → 로컬 파일·SHA256)을 만들어 `audio_import.py`에 준다. Wikimedia 파일 서버는 짧게 많이 받으면 HTTP 429를 돌려준다. 파일 사이를 길게 띄운다.
