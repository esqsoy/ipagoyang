# 발음고양 인수인계

갱신: 2026-11-06. 다음 작업은 이 문서와 `git status`를 함께 확인하고 시작한다. 이 문서는 최신 상태로 교체하고, 경위는 [WORK_LOG.md](WORK_LOG.md)에 남긴다.

## 지금 상태

- **설계 1~6번 결정됨**(영신 26.11.06 "전부 추천대로 가자"). 결정과 이유는 [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06).
- **영신 결정 대기:**
  - [설계안 7번 언어 풀](proposals/design-20261106.md#7-언어-풀-영신-결정-대기)
  - [설계안 8번 눈으로 배우기와 발음고양만의 요소](proposals/design-20261106.md#8-눈으로-배우기와-발음고양만의-요소-영신-결정-대기). 추천: CC0 단면도로 바꾸기, 여러 화자 듣기, 언어로 보기 등
  - 한국어 녹음(불·풀·뿔·부부, 영신초이가 하기로 함)의 공개 조건(CC0 / CC BY-SA 4.0)과 화자 설명. 파일은 구글 드라이브나 저장소 `incoming/`으로 받는다
- **시제품(묶음 1, [p] [b] [pʰ] [p͈] × 한국어·영어·스페인어·일본어·프랑스어)을 만들었다. 커밋·푸시만 했고 공개 배포는 안 했다.**
  - 처음 화면: 입 옆모습 → IPA 자음표 지도.
  - 배우기 5장: [p] [pʰ] [p͈] [b] [β]. 입 옆모습·목청 창·소리 시작 띠·파형·체감 연습이 들어 있다.
  - 문제: 한국어와 견주기 3 → 듣고 고르기 → 전사 빈칸 15(묶음 자판). 틀리면 따라 한다.
  - 결과 화면에서 표에 불이 들어온다. 출처·라이선스 화면이 있다.
  - 생성물은 `index.html`이다. 원본과 조립 방법은 [pipeline/README](pipeline/README.md).
  - **녹음 17개 가운데 4개만 받았다**(영어 pin·spin·bin, IPA [p] 기호 소리). [p] 기호 소리는 배우기 카드의 '기호 소리' 단추로 들어갔다. Wikimedia 파일 서버가 계속 HTTP 429(요청 제한)를 돌려준다. 못 받은 낱말은 재생 단추가 꺼지고 듣고 고르기에서 빠진다. 그래서 지금 듣고 고르기는 영어 2문제뿐이다.
- **미리보기(비공개 Artifact):** https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo — `python3 pipeline/build.py --artifact <파일>`로 만든 한 파일 판(글꼴·녹음을 data: 주소로 넣음)이다. 공개 배포가 아니다.
- **한국어 낱말을 불·풀·뿔·부부로 바꿨다**(26.11.06 영신 "일단 빈칸은 비워두고 한번 제작해보자"). 소리 칸은 영신초이 녹음이 올 때까지 비워 두고 '녹음 준비 중'으로 보인다. 처음 받은 Commons 한국어 녹음 후보(바다·풀·빵: 호로조, 아버지: HappyMidnight)는 sources/audio.json에 확인 기록만 남아 있고 쓰지 않는다.
- **영신 직검수 페이지:** https://claude.ai/artifact/11cSUJ2Paoo2hgvctNgtH8 (줄 댓글, `python3 pipeline/review_page.py b01 --out <파일>`로 다시 만든다). 맨 위 '정할 것'에 위 결정 대기가 있다.

## 검사 (26.11.06 이 세션에서 돌림)

- `node pipeline/tests/prototype.test.cjs`: 처음 화면부터 출처 화면까지 390px로 지나가며 확인했다. 결과는 통과(콘솔 오류 없음, 가로 넘침 없음, IPA 글꼴 읽힘, 기록 저장). Chromium만 봤고 실제 iPhone·Android에서는 보지 않았다.
- `python3 pipeline/phoible_check.py <phoible.csv> <InventoryID-Bibtex.csv>`: 낱말 15개(한국어 불·풀·뿔·부부로 바꾼 뒤 다시 돌림), 없어야 할 소리 10개 모두 맞음.
- `python3 pipeline/wikt_compare.py <받은 전사.json>`: 대상 소리 15개 모두 Wiktionary와 맞음. 대상 밖 차이 둘은 기록해 두었다(끝 ㄹ [l]/[ɭ]: PHOIBLE 2197은 /l/의 변이음으로 l·ɾ·ɭ·ʎ를 다 적어 [l]로 둠, r/l 묶음에서 다시 본다. バス 모음 [ɯ]/[ɨ]: 고모음 묶음에서 다시 본다).
- `python3 pipeline/build.py --check`: index.html이 원본과 맞는지 본다.

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

1. 녹음 13개 마저 받기. 받으면 차례로 돌린다.
   - `python3 pipeline/audio_import.py <폴더> <목록.json>`
   - `python3 pipeline/build.py`
   - 시제품 검사
   - 받을 파일과 주소는 sources/audio.json에 있다.
2. IPA [b] 기호 소리(ipa-b)를 받으면 배우기 카드 [b]에 저절로 붙는다(data/symbols.json `sound`).
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
