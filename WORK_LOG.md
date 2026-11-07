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

## 2026-11-06 · 녹음 빈칸을 비워 둔 채 시제품 미리보기

- **영신:** 불·풀·뿔·부부를 음성으로 말해 보냈으나 받아쓴 글자만 왔다(소리 파일 아님). Claude가 드라이브·저장소로 파일을 보내는 법과 공개 조건을 물었고, 영신이 "오케이 천천히 하자구 일단 빈칸은 비워두고 한번 제작해보자"라고 답했다.
- **한 일:**
  - 한국어 낱말을 설계안대로 불·풀·뿔·부부로 바꿈. 소리 칸은 영신초이 녹음을 기다리며 비우고 '녹음 준비 중'을 보인다(PRINCIPLES 8-4).
  - 체감 연습을 불·풀·뿔로, 고양이 대사를 부부로 바꿈.
  - PHOIBLE·Wiktionary 대조를 다시 돌림(불 [puɭ]·뿔 [p͈uɭ]·부부 [pubu]를 새로 받음). 끝 ㄹ은 PHOIBLE 2197의 변이음 근거로 [l] 유지.
  - 화면을 Artifact 규약에 맞춤: 테마 [data-theme] 대응, 옆 여백 safe-area. 출처 화면에는 쓰는 녹음만 보인다.
  - build.py에 `--artifact`(글꼴·녹음을 data: 주소로 넣은 한 파일)를 더함.
  - 미리보기를 올림: https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo
  - 직검수 페이지는 같은 주소로 다시 올림(v2).
- **검증(이 세션):** prototype.test.cjs 통과, phoible_check 어긋남 0, wikt_compare 다름 0, 배우기 화면 캡처 확인.
- **남은 일·배포:** 영신초이 녹음(공개 조건·화자 설명), Commons 녹음 13개(요청 제한), 설계안 7·8 결정. 공개 배포 없음(미리보기는 비공개 Artifact).
- 덧붙임(같은 날): 재시도 1시간 만에 IPA [b] 기호 소리를 받아 넣었다(녹음 5개). 남은 외국어 8개는 더 길게 띄워 다시 받는 중. 미리보기 v2로 갱신.

## 2026-11-06 · 보카고양 분석, 화면을 고양 시리즈 틀로

- **영신:** "아니 디자인왜이래 보카고양분석해옵시다", "색상은 바뀌어도 돼 다만 고양이만큼은 이런놈이 아니라구", "그 고양이는 사악한 고양이야", "보카고양 깃헙을 들어가서 개발일지등을 정독하고 옵시다".
- **읽은 것(고치지 않음):**
  - 개발일지 '보카고양 이야기'(Claude Docs, rev 198): 전체를 텍스트로 바꿔 처음부터 끝까지 읽음(약 4만 5천 자).
  - vocagoyang: UI_STANDARD 70~160행, WORK_LOG 목차, `pipeline/fable/cat/CAT_BRIEF.md`·`style_guide.md`, `history/README.md`·`2026-09-desk-ledger-design.md`.
  - 보카고양 FABLE·탄고고양 五十音 실제 화면(390px)과 CSS.
- **한 일:**
  - 분석 문서 [proposals/vocagoyang-design-analysis-20261106.md](proposals/vocagoyang-design-analysis-20261106.md).
  - 고양고양이 그림 자료를 `assets/cat/goyang-cat.json`으로 가져옴. 보카고양·탄고고양 표정 7종의 해시가 같음을 확인함.
  - template.html을 다시 짬.
    - 시리즈 :root 색·밤하늘·별, 고양이 줄과 분홍 말풍선, 2열 묶음 타일(끝내면 금빛, 다음 묶음은 점선 잠금), 금빛 단추.
    - 문제 카드 머리줄에 진행 막대와 고양이 표정. 정답이면 win과 하트·콤보, 오답이면 rage.
    - 처음 화면에 STUDY1 줄.
    - 소리는 청록, 대상 기호는 금빛.
  - PRINCIPLES 1(고양이는 새로 그리지 않는다, 첫 시제품의 실패 사례)·1-1(화면은 시리즈 틀), AGENTS 5번.
- **검증(이 세션):** prototype.test.cjs 통과(390px Chromium, 콘솔 오류 0, 가로 넘침 0). 처음·배우기·견주기(오답)·전사 빈칸 화면 캡처를 직접 봄. 미리보기 v3 올림. 실제 폰은 못 봄.
- **남은 일:** 시간 막대·시리즈 연출 범위(영신 결정), 외국어 녹음 8개(받는 중), 영신초이 한국어 녹음.

## 2026-11-06 · 보카고양 틀을 그대로 가져옴, IPA 지도를 주기율표 게임처럼

- **영신:** "지금도 그린거같은데? 그냥 보카고양에서 틀을 가져오면 돼", "ipa입지도도 periodic table 게임 참고해서 아이디어를 얻어봐".
- **판단:** 앞 회차 template.html은 시리즈 색과 고양이를 썼지만 화면은 새로 짠 것이라 보카고양처럼 보이지 않았다. 탄고고양이 보카고양 HTML에서 데이터만 바꿔 끼운 방식을 따른다.
- **한 일:**
  - `pipeline/derive_template.py`: 보카고양 마더텅 게임 `vocagoyangksat2027.html`(vocagoyang `d7e077d`, 읽기만 함)에서 데이터를 빼고 자리 표시를 넣어 `pipeline/frame.html`을 만든다. 영어 단어 전용인 곳(자동 제출, 영문자 빈칸 셈, TTS, `/…/` 발음 표기, 끝 화면, 다른 게임 링크, 저장 키 `goyang-`)만 고치고, 고친 곳마다 이유를 적었다. 시리즈 공통 대사는 `data/series-lines.json`로 뽑았다.
  - `pipeline/ipa_extra.js`·`ipa_extra.css`(틀 위 덧붙임):
    - IPA 입력 변환(`ph` → pʰ 등). 부호 붙은 기호를 칸 하나로 세어 칸 수로 답이 새지 않게 했다.
    - 녹음 재생 단추와 파형. 틀의 예외 녹음 자리(PRONUNCIATION_AUDIO_MAP)로 Commons 녹음만 튼다.
    - 배우기 카드의 입 옆모습·목청·소리 시작 띠 그림. 틀린 뒤 따라 치기에서도 남는다.
    - 처음 화면 IPA 지도.
  - IPA 지도(주기율표 게임에서 가져옴): 공식 IPA 자음표 자리(11 위치 × 8 방법)를 처음부터 다 보이게 깐다. 잠긴 칸은 점, 배운 칸은 금빛, 지금 묶음 칸은 청록으로 깜박인다. 칸을 누르면 도감 카드가 열린다.
  - `pipeline/build.py`를 틀용으로 다시 씀. 묶음 1 = 01강, 연습 넷(배우기·한국어와 견주기·듣고 고르기·전사 빈칸), 카드 25. `pipeline/template.html`은 지움.
  - 설계안 9번(주기율표 게임에서 가져올 것, 영신 결정 대기). PRINCIPLES 1-1을 "화면은 보카고양 틀을 그대로 가져온다"로 고치고 실패 사례 둘을 적음. 8-3에 입력이 틀의 치기로 바뀐 것을 적음. AGENTS 5번, HANDOFF, pipeline/README.
- **검증(이 세션):**
  - `node pipeline/tests/prototype.test.cjs`(새로 씀) 통과: 390px Chromium, 연습 넷 끝, 일부러 틀린 뒤 따라 치기, IPA 지도 켜진 칸 3, 저장 키 `ipagoyang-`만, 콘솔 오류 0.
  - `python3 pipeline/build.py --check` 맞음.
  - 처음 화면·배우기·결과 화면 캡처를 직접 봄. 실제 폰은 못 봄.
- **남은 일:**
  - 설계안 7·8·9번 결정.
  - 시간 막대: 틀에 있던 대로 켜져 있다. 배우기만 60초.
  - 외국어 녹음 8개: Wikimedia 429로 아직 못 받음.
  - 영신초이 한국어 녹음.
- **배포:** 공개 배포 안 함. 미리보기 Artifact만 갱신.

## 2026-11-07 · 외국어 녹음 8개 들여옴, 녹음 출처 조사, 발음 용어 한자·영어 병기

- **영신:** "해당 발음들은 네이버사전에 있는데 네이버가 안되더라도 이런식의 발음을 받을 수 있는 더 다양한 방법을 모색하보자. 그리고 발음 용어는 한자와 영어를 병기해줘".
- **녹음:**
  - 26.11.06의 천천히 다시 받기(47번 모두 429)는 시간 한도로 멈췄다. 26.11.07에도 직접 연결은 429였다.
  - Claude의 WebFetch로 8개(스페인어 pan·vaca·lobo, 일본어 パン·バス, 프랑스어 pain·bain·Paris)와 Commons API의 SHA-1을 받았다. 8개 모두 SHA-1이 같았다. `audio_import.py`로 mp3·파형을 만들어 녹음이 13개가 됐다.
  - 녹음이 들어오면서 듣고 고르기 버그가 드러났다. spin·lobo는 대상 기호가 첫소리가 아닌데 "첫소리 기호를 친다"고 물었다. 전사에 빈칸을 두고 묻도록 고쳤다(낱말 글자는 답한 뒤에 보임).
  - 출처 조사는 [proposals/audio-sources-20261107.md](proposals/audio-sources-20261107.md)(영신 결정 대기). Commons·Lingua Libre를 주 출처로 두고, 네이버·Forvo는 공개 라이선스가 없어 게임에 넣지 않는다. 한국어는 영신초이, Commons에 없는 낱말은 원어민 지인 녹음을 추천했다. Shtooka·Common Voice·Tatoeba·Hugging Face도 봤다.
- **용어:**
  - `data/terms.json` 새로 만듦(용어 30개). 한국어 이름은 IPA 표 한국어판(Commons, Benzenekim 번역, CC BY-SA 3.0)에서 PDF 본문을 읽어 맞췄다.
  - 한자는 표준국어대사전 검색 결과의 표제어 원어로 대조했다(word_no). 사전에 없는 4개와 '성대 진동 개시 시간'은 구성 요소 한자로 맞추고 표시했다. 고유어 짝(경음=된소리, 격음·유기음=거센소리, 평음=예사소리, 목청=성대, 성문=성대문)도 같은 결과로 확인했다.
  - 기호 이름에 `name_hanja`·`name_en`을 붙였다. 한글 이름은 사전 용어로 맞춤: pʰ '기식 있는 무성 양순 파열음' → '무성 유기 양순 파열음', p͈ '된소리 무성 양순 파열음' → '무성 경음 양순 파열음', m '양순 비음' → '유성 양순 비음'.
  - 화면: 배우기 카드·도감은 이름 아래 한자·영어. 목청 = 성대(聲帶 · vocal folds), 소리 시작 띠 = 성대 진동 개시 시간(VOT). IPA 지도 머리 칸에 한자, 누르면 영어·고유어 짝. 지도의 '떨음'은 한국어판 표를 따라 '전동음'으로 바꿈.
  - `build.py`는 기호 이름의 한자가 terms.json에 없으면 멈춘다.
  - PRINCIPLES 2-5(새로)와 8-4(받는 길, 네이버·Forvo).
- **검증(이 세션):**
  - prototype.test.cjs 통과(390px Chromium, 콘솔 오류 0).
  - 배우기 카드·IPA 지도·용어 카드·lobo 듣기 카드 캡처를 직접 봄. 가로 넘침 없음.
  - `build.py --check` 맞음. 녹음 소리는 사람이 아직 듣지 않았다.
- **배포:** 공개 배포 안 함. 미리보기 Artifact와 직검수 페이지만 갱신.

