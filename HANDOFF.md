# 발음고양 인수인계

갱신: 2026-11-06. 다음 작업은 이 문서와 `git status`를 함께 확인하고 시작한다. 이 문서는 최신 상태로 교체하고, 경위는 [WORK_LOG.md](WORK_LOG.md)에 남긴다.

## 지금 상태

- **저장소 뼈대와 설계안만 있다.** 게임 코드·데이터·음원은 없다. 공개 배포는 없다.
- **영신 결정 대기: [설계안](proposals/design-20261106.md).** 여섯 항목마다 선택지·Claude 추천·이유.
  - 추천 요약: ① 학습 단위는 한국어 귀가 헷갈리는 대립 묶음(기호마다 여러 언어 낱말로 확인), ② 문제는 배우기 → 한국어와 견주기 → 듣고 고르기 → 전사 빈칸 치기, ③ 입력은 고르기 + 묶음 자판(IPA 표 배치), ④ 듣기 문제에는 확인한 사람 녹음만(Commons 원어민·IPA 녹음, 한국어는 영신 녹음), ⑤ 순서는 한국어 화자 기준 난이도순([p b pʰ p͈]부터), ⑥ 검수는 출처 둘 이상 + 기계 검사 + 사람 검수.
  - 영신에게 물은 것: 한국어 낱말 녹음을 영신(·소연)이 해 줄 수 있는지.
- **결정되면:** 묶음 하나로 시제품([p b pʰ p͈] × 한국어·영어·스페인어·일본어·프랑스어). 그 전에 시제품 묶음에 쓸 1차 출처를 원문과 대조한다(설계안의 서지는 Claude 기억이라 확인 필요).

## 확인한 것과 막힌 것 (26.11.06)

- 원문으로 확인한 라이선스: PHOIBLE 2.0 CC BY-SA 3.0, IPA 표 CC BY-SA 4.0, Commons IPA 기호 녹음 4개 GFDL 1.2+ / CC BY-SA 3.0. 자세한 것은 [PRINCIPLES 3](PRINCIPLES.md#3-저작권과-라이선스).
- 막힌 것: Commons·위키백과 API의 파일 정보 조회는 HTTP 429(요청 제한). 파일 페이지 HTML은 열렸다. lingualibre.org는 시간 초과.
- 이 세션에서 다시 확인하지 않은 것(확인 필요): Wiktionary 라이선스 판, Lingua Libre 녹음 라이선스, Kokoro 지원 언어, Charis SIL 라이선스, 설계안의 서지 전부.

## 다른 저장소와의 관계 (읽기만)

- 고양공유: [palagoyang goyang-common](https://github.com/esqsoy/palagoyang/blob/main/goyang-common/README.md), [탄고고양 PRINCIPLES 0](https://github.com/esqsoy/tangogoyang/blob/main/PRINCIPLES.md#0-목적). 기본 변종 기준(포르투갈어 브라질, 스페인어 중남미, 영어 미국)은 palagoyang HANDOFF의 26.11.07 영신 결정.
- 탄고고양 五十音 [gojuon_sound.py](https://github.com/esqsoy/tangogoyang/blob/main/pipeline/jlpt/gojuon_sound.py): 기호 설명 형식의 씨앗([기호] + 조음 이름 + 내는 법 + 한국어와 같은 점·다른 점). 일본어 기호는 도쿄 표준 간략 표기(う=[ɯ], ら행=[ɾ], ふ=[ɸ], ん=[ɴ]…).
- 보카고양: 공통 기능의 본가([SHARED.md](https://github.com/esqsoy/vocagoyang/blob/main/SHARED.md)). 그 표에서 '발음·IPA 효과, 예외 음원'은 영어 전용이라 언어마다 따로 만든다. 예외 음원은 Kokoro-82M으로 음소를 지정해 합성했고([pronunciation-audio README](https://github.com/esqsoy/vocagoyang/blob/main/pipeline/pronunciation-audio/README.md)), 원칙은 "IPA를 맹목적으로 음원화하지 않는다"(보카고양 26.10.15).
- 읽은 판: palagoyang `957f413`, tangogoyang `f652afe`, vocagoyang `d7e077d`.

## 작업 환경

- 저장소 esqsoy/IPAGOYANG(git 주소는 소문자 `ipagoyang`), 기본 가지 `main`. 첫 커밋은 이 세션(클라우드 컨테이너)에서 올렸다.

## 열린 질문 (설계안 밖)

- 게임 안 제목, 저장 키 접두어: 시제품 때.
- 공개(GitHub Pages) 여부와 시기.
