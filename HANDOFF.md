# 발음고양 인수인계

갱신: 2026-11-08. 다음 작업은 이 문서와 `git status`를 함께 확인하고 시작한다. 이 문서는 최신 상태로 교체하고, 경위는 [WORK_LOG.md](WORK_LOG.md)에 남긴다.

## 지금 상태

- **설계 1~9번과 녹음 출처 모두 결정됨.** 1~6번은 영신 26.11.06 "전부 추천대로 가자", 7·8·9번·녹음 출처·용어 한자는 영신 26.11.08 "일단 다 네 추천대로 가되, 내 녹음 없이 최대한 진행해보자". 결정과 이유는 [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06)(8-1~8-10).
- **화면은 보카고양 틀 그대로다**([PRINCIPLES 1-1](PRINCIPLES.md#1-1-화면은-보카고양-틀을-그대로-가져온다)).
  - `pipeline/derive_template.py`가 보카고양 `vocagoyangksat2027.html`(vocagoyang `d7e077d`)에서 `pipeline/frame.html`을 뽑는다. 26.11.08 다시 돌려 frame.html과 같음을 확인했다.
  - **명칭 치기**(26.11.08 영신, [PRINCIPLES 8-3](PRINCIPLES.md#8-3-입력-고르기와-묶음-자판)): 기호 대신 이름을 친다. 연습 넷: 이름 대기·한국어(한국어 이름) → 이름 대기·영어(영어 이름) → 듣고 고르기 → 전사 빈칸(둘 다 한국어나 영어 이름 하나). 맞으면 세 이름(한국어·한자·영어)이 뜬다. 배우기·한국어와 견주기는 뺐고, 틀려서 따라 칠 때 기호 풀이가 뜬다.
  - **기호를 누르면 소리**(재생 단추 없음), **이름 대기** 연습(대표 낱말 속 기호 → 이름), **작은 지도를 누르면 큰 IPA 표**([8-3-1](PRINCIPLES.md#8-3-1-기호를-누르면-소리-대표-낱말-큰-ipa-표-261108-영신)).
  - **배색 넷**(먹물·호박 기본, 26.11.08 영신 확정 / 밤바다, 칠판, 보카고양): 처음 화면 IPA 지도 아래에서 고른다([1-1](PRINCIPLES.md#1-1-화면은-보카고양-틀을-그대로-가져온다)).
  - 덧붙임 `pipeline/ipa_extra.js`·`ipa_extra.css`:
    - IPA 입력 변환과 기호 칸.
    - 여러 화자 재생(누를 때마다 다음 화자, 첫 화자는 무작위).
    - 배우기 그림(입 옆모습은 CC0 단면도).
    - 맞힘 그림(닫기 → 목청 → 터뜨림 → 울림).
    - 카드 위 작은 지도(문제 중 묶음 칸 깜박임, 맞히면 답 칸 금빛).
    - 처음 화면 IPA 지도와 도감.
- **시제품(공개 배포 안 함):** `index.html`, 강 둘, 강마다 연습 넷(이름 대기·한국어 → 이름 대기·영어 → 듣고 고르기 → 전사 빈칸), 카드 72, 녹음 57(기호 소리 8 포함).
  - 01강 묶음 1 [p] [b] [pʰ] [p͈] (+[β]).
  - 02강 묶음 2 [t] [d] [tʰ] [t͈] (+[ð]): 한국어 달·탈·딸·바다, 영어 top·stop·day, 스페인어 tú·dos·nada, 일본어 天気·電気, 프랑스어 thé·dé. PHOIBLE 어긋남 0, Wiktionary 다름 0.
  - 녹음은 모두 Commons·Lingua Libre이고, WebFetch로 받아 SHA-1을 대조했다([PRINCIPLES 8-10](PRINCIPLES.md#8-10-녹음-출처)). 영어·스페인어·프랑스어 낱말은 대개 화자 2~3명이다.
  - 한국어 녹음:
    - 있는 것: 불(HappyMidnight), 풀·뿔·바다(호로조).
    - 없는 것: 부부·달·탈·딸. 달·탈·딸은 Amanda1970 계정 녹음뿐이라 출처가 의심스러워 뺐다.
    - 한 목소리 최소대립(불·풀·뿔, 달·탈·딸)은 영신초이 녹음이 오면 채울 빈칸이다.
  - 사람이 들어 본 녹음은 아직 없다(`listened: null`).
- **발음 용어는 한글·한자·영어**([PRINCIPLES 2-5](PRINCIPLES.md#2-5-발음-용어는-한글한자영어를-함께-쓴다), `data/terms.json`).
- **PHOIBLE 기호 × 11개 언어 표:** `data/phoible-matrix.json`(`pipeline/phoible_matrix.py`). 언어마다 JIPA 목록 하나를 썼다. 스페인어 2210에 /k/가 빠진 것을 '알려진 빈틈'으로 적었다.
- **미리보기(비공개 Artifact):** https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo (`python3 pipeline/build.py --artifact <파일>`).
- **영신 직검수 페이지(줄 댓글):**
  - 묶음 1: https://claude.ai/artifact/11cSUJ2Paoo2hgvctNgtH8
  - 묶음 2: https://claude.ai/artifact/GJznGeTaPsSKPeBkUg9tFf
  - 만드는 법: `python3 pipeline/review_page.py b01|b02 --out <파일>`
  - 26.11.07에 실수로 만든 묶음 1 페이지 사본(https://claude.ai/artifact/MMoNoim7eeZGY2w3mXgMet)은 영신이 지우라고 하면 지운다.
- **영신에게 남은 것:**
  - 녹음 듣기(청취 검수).
  - 묶음 2 낱말과 인정하는 이름(동의어·순서 자유) 검토.
  - 원하면 한국어 한 목소리 녹음(불·풀·뿔·부부, 달·탈·딸·바다)과 그 공개 조건.
- **다음 할 일:**
  - 묶음 3 [k ɡ kʰ k͈] (8-5 차례).
  - 강마다 시작 대사를 넣을 자리.
  - 지도의 나머지 아이디어(8-9: 줄 색, 자질 상자 등).

## 검사 (26.11.06~08 이 세션에서 돌림)

- `node pipeline/tests/prototype.test.cjs`: 처음 화면(강 타일 수) → 마지막 강 → 연습 넷을 끝까지 풀고(일부러 한 번 틀려 따라 치기, 맞힘 그림이 뜨는지) → 처음 화면 IPA 지도에 칸이 켜지는지 390px로 본다. 통과(26.11.08 묶음 2·녹음 51개 뒤 다시 돌림. 콘솔 오류 0, 가로 넘침 0, 저장 키는 전부 `ipagoyang-`). Chromium만 봤고 실제 폰은 못 봤다.
- `python3 pipeline/phoible_check.py <phoible.csv> <InventoryID-Bibtex.csv> b01 b02`: 26.11.08 두 묶음 어긋남 0. 묶음 1은 낱말 15개(한국어 불·풀·뿔·부부로 바꾼 뒤 다시 돌림), 없어야 할 소리 10개 모두 맞음.
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
