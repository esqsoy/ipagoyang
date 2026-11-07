# 낱말 녹음을 구하는 길 (2026-11-07, 영신 결정 대기)

영신 요청(26.11.07): "해당 발음들은 네이버사전에 있는데 네이버가 안되더라도 이런식의 발음을 받을 수 있는 더 다양한 방법을 모색하보자".

기준은 [PRINCIPLES 3](../PRINCIPLES.md#3-저작권과-라이선스)(파일마다 라이선스)과 [8-4](../PRINCIPLES.md#8-4-소리는-확인한-사람-녹음만)(듣기 문제에는 확인한 사람 녹음만)이다. 저장소가 공개될 수 있으므로 **다시 배포해도 되는 라이선스**가 붙은 녹음만 넣는다.

## 이번에 한 일

- 묶음 1에서 빠져 있던 외국어 녹음 8개(스페인어 pan·vaca·lobo, 일본어 パン·バス, 프랑스어 pain·bain·Paris)를 받았다.
  - 이 작업 환경에서 upload.wikimedia.org로 바로 연결하면 26.11.06부터 계속 429가 온다. Commons API도 같다.
  - Claude의 웹 가져오기 도구(WebFetch)는 다른 길로 나가서 받힌다. 8개 모두 Commons API가 알려 준 SHA-1과 받은 파일의 SHA-1이 같음을 확인했다(`sources/audio.json`의 `original_sha1_matches_commons`).
  - 그래서 녹음은 이제 13개다.

## 출처 후보

이 세션에서 실제로 확인한 것과 검색 결과로만 본 것을 나눠 적는다.

| 출처 | 라이선스 | 낱말 녹음 | 이 환경에서 | 판단 |
|---|---|---|---|---|
| **Wikimedia Commons·Lingua Libre** | 파일마다 CC0·CC BY·CC BY-SA(파일 페이지에서 확인) | 많음. 일본어·스페인어·프랑스어 낱말 녹음이 있고, 화자 이름이 붙는다 | 직접 연결은 429. **WebFetch로 받힌다(확인)** | **주 출처로 계속 쓴다** |
| 영신초이·지인 녹음 | 녹음한 사람이 정한다(예: CC BY 4.0) | 원하는 낱말을 원하는 대로(최소대립 불·풀·뿔을 한 목소리로) | 해당 없음 | **한국어는 이 길**(8-4 결정). 다른 언어도 원어민 지인이 있으면 가장 정확하다 |
| Shtooka(SWAC) 모음 | 모음마다 다르고 대개 CC BY. 모음의 README가 기준 | 프랑스어 fra-balm-voc 14,605개 등. 스페인어는 WimsEdu 모음 1,739개 | shtooka.net은 403. 검색 결과로만 봄 | 후보. Commons에 이미 올라간 것이 많아 Commons로 받는 편이 쉽다. 직접 받으려면 README의 라이선스부터 확인 |
| Mozilla Common Voice | CC0 | 낱말이 아니라 **문장**. 낱말을 쓰려면 잘라내야 한다 | 첫 화면은 열림. 자료는 로그인 뒤 받는다(검색 결과) | 지금은 아니다. 문장 듣기를 만들게 되면 후보 |
| Tatoeba | 녹음마다 기여자가 정한다(CC BY·CC BY-NC·공개 라이선스 없음 등) | 문장 | 내려받기 페이지 열림 | 문장 듣기 때 후보. 녹음마다 라이선스를 걸러야 한다 |
| Forvo | 2008~2019년에는 CC BY-NC-SA 3.0. 2019년 말 자체 약관으로 바꿔 복제·재배포를 제한(검색 결과, 원문 미확인) | 아주 많음 | forvo.com은 403 | **쓰지 않는다.** 지금 약관으로는 다시 배포할 수 없고, 옛 CC 녹음도 지금 어떻게 다루는지 확인하지 못했다 |
| **네이버 사전** | 공개 라이선스를 찾지 못했다. 사전 녹음 상당수는 제휴 출판사나 네이버가 만든 것으로 보인다(확인 필요) | 아주 많음 | 확인 안 함 | **게임에는 넣지 않는다.** 쓰려면 네이버나 원 제공처의 서면 허락이 필요하다. 영신이 우리 녹음이 맞는지 귀로 대조하는 참고용으로 듣는 것은 괜찮다(저장소에 넣지 않으니까) |
| Hugging Face 데이터셋 | 데이터셋마다 다름 | LinguaLibre-word-retrieval은 소수 언어만 있다. wiktionary_pronunciations는 영어뿐이고 라이선스가 적혀 있지 않다 | 열림 | 지금 묶음에는 쓸모없다 |
| 합성음(클라우드 TTS의 IPA 발음 태그) | 서비스 약관마다 다름 | 무엇이든 만들 수 있다 | 해당 없음 | **듣기 문제에는 쓰지 않는다**(8-4). 원어민 소리가 아니고, 그 대립을 제대로 냈는지 하나하나 들어 봐야 한다 |

## 추천

1. **Commons·Lingua Libre를 주 출처로 두고 WebFetch로 받는다.** 받은 파일은 늘 Commons API의 SHA-1과 맞춰 보고, 맞지 않으면 넣지 않는다.
2. **한국어는 영신초이 녹음**(결정됨). 녹음할 때 정할 것: 공개 라이선스(추천 CC BY 4.0), 화자 설명(예: "서울말, 30대"), 낱말마다 한 파일.
3. **Commons에 없는 낱말은 원어민 지인 녹음.** 원하면 Lingua Libre로 올려서 다른 사람도 쓸 수 있게 한다. 녹음 안내 페이지를 만들 수 있다.
4. 문장 듣기를 만들게 되면 Common Voice(CC0)와 Tatoeba(녹음마다 확인)를 다시 본다.
5. 네이버·Forvo는 게임에 넣지 않는다.

## 출처

- [Forvo(위키백과)](https://en.wikipedia.org/wiki/Forvo): 라이선스 변경 경위
- [Shtooka Project(Creative Commons 위키)](https://wiki.creativecommons.org/Shtooka_Project_-_free_audio_collections_of_words), [옛 Shtooka 모음 목록(yojik.eu)](https://fsi-languages.yojik.eu/audiocollections/audiocollections.html)
- [Tatoeba 내려받기](https://tatoeba.org/en/downloads)
- [Hugging Face vnahata/LinguaLibre-word-retrieval](https://huggingface.co/datasets/vnahata/LinguaLibre-word-retrieval), [MichaelR207/wiktionary_pronunciations-final](https://huggingface.co/datasets/MichaelR207/wiktionary_pronunciations-final)
