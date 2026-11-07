# 발음고양 인수인계

갱신: 2026-11-07. 다음 작업은 이 문서와 `git status`를 함께 확인하고 시작한다. 이 문서는 최신 상태로 교체하고, 경위는 [WORK_LOG.md](WORK_LOG.md)에 남긴다.

## 지금 상태

- **설계 1~6번 결정됨**(영신 26.11.06 "전부 추천대로 가자"). 결정과 이유는 [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06). 입력은 보카고양 틀을 가져오며 바뀌었다(8-3 '바뀜').
- **화면은 보카고양 틀 그대로다**(26.11.06 영신 "그냥 보카고양에서 틀을 가져오면 돼", [PRINCIPLES 1-1](PRINCIPLES.md#1-1-화면은-보카고양-틀을-그대로-가져온다)).
  - `pipeline/derive_template.py`가 보카고양 `vocagoyangksat2027.html`(vocagoyang `d7e077d`)에서 `pipeline/frame.html`을 뽑았다. 고친 곳은 그 스크립트에 이유와 함께 적혀 있다.
  - 발음고양 덧붙임은 `pipeline/ipa_extra.js`·`ipa_extra.css`에 있다: IPA 입력 변환, 기호 칸, 녹음 재생 단추, 배우기 그림, 처음 화면 IPA 지도·도감.
  - 앞서 흉내 내어 짰던 `pipeline/template.html`은 지웠다.
- **시제품(묶음 1, [p] [b] [pʰ] [p͈] × 한국어·영어·스페인어·일본어·프랑스어):** 01강 하나에 연습 넷(배우기 5 · 한국어와 견주기 3 · 듣고 고르기 10 · 전사 빈칸 15, 카드 33). 생성물은 `index.html`. 공개 배포는 안 했다.
  - 녹음 13개: 영어 pin·spin·bin, 스페인어 pan·vaca·lobo, 일본어 パン·バス, 프랑스어 pain·bain·Paris, 기호 소리 [p]·[b]. 사람이 아직 다 듣지는 않았다(`listened: null`).
  - 외국어 8개는 26.11.07 WebFetch로 받았다. 이 환경에서 upload.wikimedia.org로 바로 연결하면 429가 온다. 받은 파일의 SHA-1이 Commons API 값과 같은지 확인했다([PRINCIPLES 8-4](PRINCIPLES.md#8-4-소리는-확인한-사람-녹음만) '받는 길').
  - 한국어 불·풀·뿔·부부는 영신초이 녹음을 기다린다(공개 조건·화자 설명 확인 대기). 없는 소리는 '녹음 준비 중'으로 보인다.
- **발음 용어는 한글·한자·영어를 함께 보인다**(26.11.07 영신, [PRINCIPLES 2-5](PRINCIPLES.md#2-5-발음-용어는-한글한자영어를-함께-쓴다)). 용어 자료는 `data/terms.json`(표준국어대사전 표제어로 한자 대조). 배우기 카드·도감·IPA 지도 머리 칸에 나온다.
- **미리보기(비공개 Artifact):** https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo (`python3 pipeline/build.py --artifact <파일>`).
- **영신 직검수 페이지:** https://claude.ai/artifact/11cSUJ2Paoo2hgvctNgtH8 (줄 댓글, `python3 pipeline/review_page.py b01 --out <파일>`).
- **영신 결정 대기:**
  - [설계안 7번 언어 풀](proposals/design-20261106.md#7-언어-풀-영신-결정-대기)
  - [8번 눈으로 배우기](proposals/design-20261106.md#8-눈으로-배우기와-발음고양만의-요소-영신-결정-대기)
  - [9번 주기율표 게임에서 가져올 것](proposals/design-20261106.md#9-ipa-입-지도-주기율표-게임에서-가져올-것-영신-결정-대기)
  - 영신초이 녹음의 공개 조건과 화자 설명
  - [녹음 출처 조사](proposals/audio-sources-20261107.md): Commons를 주 출처로, 네이버·Forvo는 넣지 않기, 없는 낱말은 원어민 지인 녹음

## 검사 (26.11.06~07 이 세션에서 돌림)

- `node pipeline/tests/prototype.test.cjs`(보카고양 틀용으로 다시 씀): 처음 화면 → 01강 → 연습 넷을 끝까지 풀고(일부러 한 번 틀려 따라 치기) → 처음 화면 IPA 지도에 칸이 켜지는지 390px로 본다. 통과(26.11.07 녹음 13개·용어 병기 뒤 다시 돌림. 콘솔 오류 0, 가로 넘침 0, 저장 키는 전부 `ipagoyang-`). Chromium만 봤고 실제 폰은 못 봤다.
- `python3 pipeline/phoible_check.py <phoible.csv> <InventoryID-Bibtex.csv>`: 낱말 15개(한국어 불·풀·뿔·부부로 바꾼 뒤 다시 돌림), 없어야 할 소리 10개 모두 맞음.
- `python3 pipeline/wikt_compare.py <받은 전사.json>`: 대상 소리 15개 모두 Wiktionary와 맞음. 대상 밖 차이 둘은 기록해 두었다(끝 ㄹ [l]/[ɭ]: PHOIBLE 2197은 /l/의 변이음으로 l·ɾ·ɭ·ʎ를 다 적어 [l]로 둠, r/l 묶음에서 다시 본다. バス 모음 [ɯ]/[ɨ]: 고모음 묶음에서 다시 본다).
- `python3 pipeline/build.py --check`: index.html이 원본(frame.html + 덧붙임 + 데이터)과 맞는지 본다.

## 확인한 것과 못 한 것

- 서지: JIPA 'Illustrations of the IPA' 다섯 편(한·일·프·스·미국 영어)과 Coloma 2018은 Crossref로 확인했다. 본문은 못 읽었다. 그 다섯 편을 옮긴 PHOIBLE 목록으로 대조했다.
- 라이선스 확인 목록:
  - 녹음 17개: 파일 페이지로 확인([sources/audio.json](sources/audio.json))
  - PHOIBLE: CC BY-SA 3.0
  - IPA 표: CC BY-SA 4.0
  - Charis SIL: OFL 1.1. 예약 이름 때문에 글자를 줄이면서 'Balum IPA'로 이름을 바꿨다.
  - Wright·McCloy 단면도: CC0
- 못 한 것:
  - Lingua Libre 화자 정보(지역·원어민 여부): lingualibre.org가 시간 초과였다.
  - 국립국어원 원문: 접속 거부. 외래어 표기법 조문은 위키백과 인용으로 확인했다.
  - 녹음 청취 검수: 아직 사람이 들은 파일이 없다.
  - extIPA 표(͈ 표시의 출처).
- 기존 IPA 학습 도구·연구 조사(26.11.06)는 [설계안 8-1](proposals/design-20261106.md#8-1-기존-도구에서-본-것-261106-조사)에 있다.

## 남은 일

1. 외국어 녹음 8개 마저 받기. 받으면 차례로 돌린다.
   - `python3 pipeline/audio_import.py <폴더> <목록.json>`
   - `python3 pipeline/build.py`
   - 시제품 검사
   - 받을 파일과 주소는 sources/audio.json에 있다.
3. 영신 직검수 반영, 설계안 7·8 결정 반영.
4. 묶음 2([t d tʰ t͈]·[k ɡ kʰ k͈]).

## 다른 저장소와의 관계 (읽기만)

- 고양공유: [palagoyang goyang-common](https://github.com/esqsoy/palagoyang/blob/main/goyang-common/README.md), [탄고고양 PRINCIPLES 0](https://github.com/esqsoy/tangogoyang/blob/main/PRINCIPLES.md#0-목적). 기본 변종 기준(포르투갈어 브라질, 스페인어 중남미, 영어 미국)은 palagoyang HANDOFF의 26.11.07 영신 결정이다.
- 탄고고양 五十音 [gojuon_sound.py](https://github.com/esqsoy/tangogoyang/blob/main/pipeline/jlpt/gojuon_sound.py): 기호 설명 형식의 씨앗이다.
- 보카고양: 공통 기능의 본가다([SHARED.md](https://github.com/esqsoy/vocagoyang/blob/main/SHARED.md)). 직검수 페이지의 줄 댓글 방식을 보카고양 review-page.py에서 가져왔다. 기록 옮기기는 아직 가져오지 않았다. 저장 키는 `ipagoyang-v1`이고, 기록 옮기기를 가져올 때 그 설정에 맞춘다.
- 읽은 판: palagoyang `957f413`, tangogoyang `f652afe`, vocagoyang `d7e077d`.

## 작업 환경

- 저장소 esqsoy/IPAGOYANG(git 주소는 소문자 `ipagoyang`), 기본 가지 `main`.
- 저장소 밖에 둔 큰 자료(다시 받을 수 있음): PHOIBLE `phoible.csv`·`InventoryID-Bibtex.csv`(github.com/phoible/dev), Charis 7.000 zip(software.sil.org/charis), Commons 녹음 원본, Wright·McCloy 그림(github.com/drammock/phonetics-teaching-assets).

## 열린 질문 (설계안 밖)

- 게임 안 제목: 지금은 '발음고양'.
- 공개(GitHub Pages) 여부와 시기.
