# 발음고양 파이프라인

화면은 보카고양 틀이다. `derive_template.py`가 보카고양 마더텅 게임(`vocagoyangksat2027.html`)에서 `frame.html`을 한 번 뽑았다(PRINCIPLES 1-1). 원본은 `frame.html`, 덧붙임(`ipa_extra.js`·`ipa_extra.css`), `data/`(묶음·기호·언어·발음 용어·시리즈 대사), `sources/`(음원·서지·대조 결과), `assets/cat/`다. `index.html`은 생성물이라 손으로 고치지 않는다.

| 파일 | 하는 일 |
|---|---|
| `derive_template.py` | 보카고양 마더텅 HTML → `frame.html`(한 번만. 다시 돌리면 frame.html 손 수정이 사라져 `--force`가 있어야 덮는다)과 `data/series-lines.json` |
| `frame.html` | 보카고양 틀(데이터 자리를 비운 것) |
| `ipa_extra.js`·`ipa_extra.css` | 발음고양 덧붙임: IPA 입력 변환, 기호 칸, 녹음 재생, 배우기 그림, IPA 지도·도감 |
| `build.py` | `frame.html` + 덧붙임 + 원본 → `index.html`. `--check`는 맞는지만 본다. `--artifact <파일>`은 미리보기용 한 파일(글꼴·녹음을 data: 주소로) |
| `phoible_check.py` | 낱말의 대상 소리가 PHOIBLE 목록에 있는지 대조 → `sources/phoible-<묶음>.json` |
| `wikt_compare.py` | 우리 전사의 대상 소리가 Wiktionary 전사에도 있는지 대조 → `sources/wiktionary-<묶음>.json` |
| `audio_import.py` | Commons에서 받은 원본을 mp3로(형식만), 파형 값 → `assets/audio/`, `sources/audio-peaks.json` |
| `font_subset.py` | Charis SIL에서 IPA·라틴 글자만 남기고 'Balum IPA'로 이름을 바꿈(OFL 예약 이름) |
| `review_page.py` | 영신 직검수 페이지(줄 댓글, Artifact `capabilities: {comments: {}}`) |
| `tests/prototype.test.cjs` | 390px로 처음 화면 → 01강 → 연습 넷 끝 → IPA 지도 켜짐까지 보는 검사(Playwright·Chromium) |

## 고친 뒤 돌릴 것

```bash
python3 pipeline/build.py
```

```bash
node pipeline/tests/prototype.test.cjs
```

낱말·전사를 고쳤으면 PHOIBLE 대조와 Wiktionary 대조도 다시 돌린다(자료는 저장소 밖에서 받는다. HANDOFF '작업 환경').

## 녹음 받기

`sources/audio.json`의 `original` 주소에서 받는다. 파일 페이지(`page`)에서 라이선스를 다시 확인하고, 받은 목록(Commons 파일 이름 → 로컬 파일·SHA256)을 만들어 `audio_import.py`에 준다. Wikimedia 파일 서버는 짧게 많이 받으면 HTTP 429를 돌려준다. 이 작업 환경(Claude 클라우드)에서는 26.11.06부터 직접 연결이 계속 429라서, 26.11.07부터 Claude의 WebFetch로 받고 Commons API(`prop=imageinfo&iiprop=sha1`)의 SHA-1과 맞춰 본 뒤 넣는다. 맞지 않으면 넣지 않는다.
