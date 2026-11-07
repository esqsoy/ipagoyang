# 발음고양 (IPAGOYANG)

고양 시리즈(보카고양·탄고고양·빨라고양)의 하나다. 국제음성기호(IPA)를 익히면서 스페인어·포르투갈어·일본어·중국어·러시아어·영어·독일어·프랑스어·이탈리아어·한국어·아랍어 등의 발음을 **같은 기호로 정확히 견주며** 익힌다. 플레이어는 한국어 화자다.

- **시제품 단계다.** 묶음 1([p] [b] [pʰ] [p͈] × 한국어·영어·스페인어·일본어·프랑스어)을 `index.html`로 만들었다(공개 배포 전). 화면은 보카고양 틀을 그대로 가져왔다([PRINCIPLES 1-1](PRINCIPLES.md#1-1-화면은-보카고양-틀을-그대로-가져온다)). 설계 결정은 [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06), 아직 정하지 않은 것은 [설계안](proposals/design-20261106.md) 7·8·9번.
- 만드는 법·검사: [pipeline/README](pipeline/README.md)
- 원칙과 이유: [PRINCIPLES.md](PRINCIPLES.md) · 현재 상태: [HANDOFF.md](HANDOFF.md) · 작업 기록: [WORK_LOG.md](WORK_LOG.md) · 작업 지침: [AGENTS.md](AGENTS.md)

## 출처와 라이선스

파일마다 출처와 라이선스를 적는다([PRINCIPLES 3](PRINCIPLES.md#3-저작권과-라이선스)). 교재·사전 내용은 옮기지 않는다.

- 녹음: Wikimedia Commons, 파일마다 다름(CC0·CC BY·CC BY-SA·퍼블릭 도메인) → [sources/audio.json](sources/audio.json)
- 서지와 확인 방법 → [sources/references.json](sources/references.json)
- 발음 용어의 한자: 표준국어대사전 표제어로 대조(뜻풀이는 옮기지 않음), 한국어 이름: IPA 표 한국어판(Commons, CC BY-SA 3.0) → [data/terms.json](data/terms.json)
- PHOIBLE 대조 결과(`sources/phoible-*.json`)는 CC BY-SA 3.0, Wiktionary 대조 결과(`sources/wiktionary-*.json`)에 인용한 전사는 CC BY-SA 4.0
- 글꼴 Balum IPA: Charis SIL 7.000(SIL Global)을 줄이고 이름을 바꾼 것, SIL Open Font License 1.1 → [assets/fonts/OFL.txt](assets/fonts/OFL.txt)
- 게임 틀(`pipeline/frame.html`)과 고양고양이 픽셀 그림: 보카고양(esqsoy/vocagoyang)에서 가져옴([assets/cat/goyang-cat.json](assets/cat/goyang-cat.json), 만든 법은 `pipeline/derive_template.py`)
- 입 옆모습·목청·소리 시작 띠 그림은 이 게임이 그린 모식도

## 다른 고양

- 보카고양(영어) [esqsoy/vocagoyang](https://github.com/esqsoy/vocagoyang)
- 탄고고양(일본어) [esqsoy/tangogoyang](https://github.com/esqsoy/tangogoyang)
- 빨라고양(스페인어)·고양공유 [esqsoy/palagoyang](https://github.com/esqsoy/palagoyang)
