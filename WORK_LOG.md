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
