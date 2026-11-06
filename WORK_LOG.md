# 발음고양 작업 기록

의미 있는 작업과 영신 결정을 날짜별로 더한다. 현재 상태는 [HANDOFF.md](HANDOFF.md), 원칙과 이유는 [PRINCIPLES.md](PRINCIPLES.md)에 둔다. 과거 보고서 전문을 이 문서에 복사하지 않는다.

## 2026-11-06 · 발음고양 시작: 저장소 뼈대와 설계안

- **요청(영신):** 발음고양(esqsoy/IPAGOYANG)을 새로 시작한다. IPA를 익히며 여러 언어 발음을 같은 기호로 비교하는 도구, 플레이어는 한국어 화자. 먼저 읽을 것은 palagoyang `goyang-common/`, 탄고고양 AGENTS·PRINCIPLES·`pipeline/jlpt/gojuon_sound.py`(읽기만). 작업 중에 "보카고양도 읽어줘"를 더함. 첫 작업은 ① 저장소 뼈대 ② 설계안(선택지마다 추천과 이유) ③ 영신이 고르면 작은 묶음 시제품.
- **지킬 것(영신, 이날 정함):** 정확성(기호마다 출처, 표준과 변이, 확실하지 않으면 '확인 필요'), 저작권(교재·사전 그대로 옮기지 않음, 데이터·음성 라이선스와 출처), TTS는 IPA를 읽지 못함, 고양이 대사는 한국어 고양체, 새 게임 방식은 먼저 논의, 저장소 파일에 모델 이름을 쓰지 않음, 영신에게 반말·소연에게 상냥한 존댓말. 모두 [PRINCIPLES](PRINCIPLES.md)에 날짜와 함께 적음.
- **읽은 것(고치지 않음):**
  - palagoyang `957f413`: AGENTS, HANDOFF, README, WORK_LOG, `goyang-common/` README·pragmatics-20261107·sources-survey-20261107.
  - tangogoyang `f652afe`: AGENTS, PRINCIPLES(0·0-1·1·2·2-9·2-10·4~10), HANDOFF·WORK_LOG 머리, `pipeline/jlpt/gojuon_sound.py`.
  - vocagoyang `d7e077d`: AGENTS, PRINCIPLES(2-2·3), UI_STANDARD(입력·발음과 효과), SHARED, HANDOFF 머리, `pipeline/pronunciation-audio/README.md`, `pipeline/ipa-effects/README.md`.
- **한 일:**
  - 빈 저장소에 README·AGENTS·PRINCIPLES·HANDOFF·WORK_LOG를 탄고고양 형식으로, 발음고양에 맞게 새로 씀.
  - 설계안 [proposals/design-20261106.md](proposals/design-20261106.md): 학습 단위·문제 방식·입력·소리 출처와 라이선스·순서·검수 방법. 시제품 묶음 초안([p b pʰ p͈] × 5개 언어, 모든 칸 확인 필요)과 고양이 대사 예.
  - 라이선스 원문 확인: phoible.org(PHOIBLE 2.0 CC BY-SA 3.0), internationalphoneticassociation.org/content/ipa-chart(IPA 표 CC BY-SA 4.0), Commons 파일 페이지 4개(GFDL 1.2+ / CC BY-SA 3.0, 올린 이 Karmosin·Peter Isotalo·Denelson83).
- **실패·막힘:** Claude는 IPA 표 라이선스를 CC BY-SA 3.0으로 기억했으나 원문은 4.0이었다([PRINCIPLES 2-1](PRINCIPLES.md#2-1-출처) 사례로 남김). Commons·위키백과 API의 파일 정보 조회는 HTTP 429, lingualibre.org는 시간 초과라 거기서 멈춤(되풀이해 두드리지 않음).
- **변경 파일:** README.md, AGENTS.md, PRINCIPLES.md, HANDOFF.md, WORK_LOG.md, proposals/design-20261106.md(모두 새로).
- **검증:** 문서만이다. 문서 안 상대 링크가 가리키는 파일·제목이 있는지 스크립트로 확인함. 앱 코드·데이터 없음.
- **남은 일:** 영신 설계안 결정 → PRINCIPLES로 옮기기 → 시제품 묶음의 1차 출처 원문 대조 → 시제품. 배포 없음.

## 2026-11-06 · 설계 결정, 묶음 1 시제품, 눈으로 배우기 구상

- **결정(영신):** 설계안 1~6번 "전부 추천대로 가자" → [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06)로 옮김(결정·이유).
- **영신 질문·요청(이날):**
  - "언어 풀은 어떻게 갈거야?" → 설계안 7번(추천: 11개 언어, 한국어는 늘 기준, 묶음마다 한국어 + 3~4개, PHOIBLE 표로 근거). 결정 대기.
  - "발음기호는 입을 옆에서 본 모양의 표로 정렬이 되잖아? 시각적으로도 학습이 될 수 있는 방식을 구상해줘", "기존의 보카고양과 틀이 좀 달라져도 되니까 이것 나름의 필요한 요소들을 집어넣자", "기존 IPA학습 도구나 방식같은게 있다면 조사해서 참조해줘" → 설계안 8번. 입 지도는 시제품에 넣어 보였고, 나머지 추천은 결정 대기.
- **한 일:**
  - 시제품: 묶음 1 [p] [b] [pʰ] [p͈] × 한·영·스·일·프. `data/`(묶음·기호·언어) → `pipeline/build.py` → `index.html`. 화면은 입 옆모습→IPA 표 지도, 배우기 5장(목청 창·소리 시작 띠·파형·체감 연습·기호 소리), 한국어와 견주기 3, 듣고 고르기, 전사 빈칸 15(IPA 표 배치 묶음 자판, 컴퓨터 줄임), 틀리면 따라 하기, 결과 지도, 출처 화면. 저장 키 `ipagoyang-v1`.
  - 근거:
    - PHOIBLE: 한·일·프·스·미국 영어 목록이 바로 JIPA 'Illustrations of the IPA'(Lee 1993·Okada 1991·Fougeron·Smith 1993·Martínez-Celdrán 외 2003·Hillenbrand 2003)를 옮긴 것임을 매핑 파일로 확인했다. 낱말 15개와 없어야 할 소리 10개를 기계로 대조했다.
    - 서지: Crossref로 확인했다.
    - Wiktionary: 전사 대조. 빵 어원(パン ← pão)과 핀 어원(← pin)을 확인했다.
    - 외래어 표기법 제1장 제4항: 위키백과 인용으로 확인했다.
  - 녹음:
    - 쓰는 녹음 17개의 Commons 파일 페이지에서 라이선스·만든 사람·화자 설명을 확인했다. CC0·CC BY·CC BY-SA·퍼블릭 도메인이다.
    - 원본을 mp3로만 바꿔 넣었다. iPhone Safari가 Ogg를 못 틀기 때문이다.
  - 글꼴: Charis SIL 7.000을 줄이고 'Balum IPA'로 이름을 바꿨다(OFL 예약 이름).
  - 기존 도구·연구 조사(조사 에이전트): Seeing Speech·eNunciate·UCLA·ipachart·Pink Trombone·English Accent Coach·IPA 표·Commons 단면도의 보여 주는 법과 라이선스를 보고, HVPT 메타분석·성조 곡선·VOT 자료를 확인했다. CC0 단면도 저장소(Wright·McCloy)를 받아 그림을 봤다.
  - 영신 직검수 페이지 https://claude.ai/artifact/11cSUJ2Paoo2hgvctNgtH8 (줄 댓글, `pipeline/review_page.py`).
  - PRINCIPLES 2-4에 두 가지를 더했다(Claude, 영신 직검수 대기). ① 한국어 파열음 표기 관례 ㅂ[p]·ㅍ[pʰ]·ㅃ[p͈]·모음 사이 [b]. ② 좁게 들으면 답이 둘인 낱말(영어 bin)은 듣고 고르기에 내지 않는다.
- **실패·막힘:**
  - Wikimedia 파일 서버가 HTTP 429를 계속 돌려줬다. 45초 간격으로 재시도했지만 17개 가운데 4개만 받았다.
  - Lingua Libre 누리집은 시간 초과, 국립국어원 규범 누리집은 접속 거부였다.
  - 첫 화면 검사에서 '한국어와 견주기'가 뜻풀이(빵·핀)로 답을 알려 주는 결함을 찾아, 답하기 전에는 뜻을 숨기게 고쳤다.
  - 입 지도가 작아 앞쪽 점이 몰려 있던 것을 키웠고, 얼굴 윤곽을 넣었다.
  - 자판에서 [p͈]의 부호가 작은 글자와 겹치던 것을 고쳤다.
- **변경 파일:**
  - 문서: PRINCIPLES.md, HANDOFF.md, WORK_LOG.md, README.md, proposals/design-20261106.md
  - data/: languages.json, symbols.json, bundles/b01.json
  - sources/: references.json, audio.json, audio-peaks.json, phoible-b01.json, wiktionary-b01.json
  - assets/: audio/*.mp3 4개, fonts/BalumIPA-*.woff2, fonts/OFL.txt
  - pipeline/: build.py, template.html, phoible_check.py, wikt_compare.py, audio_import.py, font_subset.py, review_page.py, README.md, tests/prototype.test.cjs
  - 생성물: index.html
- **검증(이 세션):**
  - prototype.test.cjs 통과(390px Chromium, 콘솔 오류 0, 가로 넘침 0)
  - phoible_check 어긋남 0, wikt_compare 다름 0
  - build.py --check 맞음
  - 화면 캡처 7장을 직접 봤다
  - 실제 폰은 보지 않았다
- **남은 일·배포:** 녹음 13개, 영신 직검수, 설계안 7·8 결정, 묶음 2. 공개 배포 없음.
