# 발음고양 인수인계

갱신: 2026-11-25. 다음 작업은 이 문서와 `git status`를 함께 확인하고 시작한다. 이 문서는 최신 상태로 교체하고, 경위는 [WORK_LOG.md](WORK_LOG.md)에 남긴다.

## 지금 상태

- **팀(26.11.25 면접·이름 회의, [AGENTS](AGENTS.md)·[PRINCIPLES 7](PRINCIPLES.md#7-기록하는-법)):** 쓰기 이솝, 검토 외솔, 답을 가린 검산 이언, 합치기 파시(주 세션), 정신적 지주 이도. 흐름은 이솝 초안 → 외솔 검토 → 이솝 고침 → 이언 검산 → 파시 합치기 → 영신 직검수.
- **설계 1~9번과 녹음 출처 모두 결정됨.** 1~6번은 영신 26.11.06 "전부 추천대로 가자", 7·8·9번·녹음 출처·용어 한자는 영신 26.11.08 "일단 다 네 추천대로 가되, 내 녹음 없이 최대한 진행해보자". 결정과 이유는 [PRINCIPLES 8](PRINCIPLES.md#8-설계-결정-2026-11-06)(8-1~8-10).
- **화면은 보카고양 틀 그대로다**([PRINCIPLES 1-1](PRINCIPLES.md#1-1-화면은-보카고양-틀을-그대로-가져온다)). `pipeline/derive_template.py`가 보카고양 `vocagoyangksat2027.html`(vocagoyang `d7e077d`)에서 `pipeline/frame.html`을 뽑는다. 다시 돌리면 바이트까지 같다.
- **놀이 방식(26.11.08 영신):**
  - **명칭 치기**([8-3](PRINCIPLES.md#8-3-입력-고르기와-묶음-자판)): 기호 대신 이름을 친다. 강마다 연습 넷: 이름 대기·한국어 → 이름 대기·영어 → 듣고 고르기 → 전사 빈칸(뒤의 둘은 한국어나 영어 이름 하나). 그냥 넘어가기는 없다.
  - **카드 화면(26.11.20 영신, [8-3](PRINCIPLES.md#8-3-입력-고르기와-묶음-자판))**: 기호와 작은 지도를 한 줄에, 밑에 보카고양식 글자 칸(글자마다 한 칸). 질문 줄·'[기호] = ?'·조작 설명·정답 뒤 세 이름 줄은 없다. 한국어 이름이 맞으면 칸 자리가 한자로 바뀌고 한자에 커서를 올리면 뜻. 틀리면 희미한 정답 칸을 따라 친다.
  - **기호를 누르면 소리**, 대표 낱말(한국어 → 영어 → 스페인어 → 나머지), **작은 지도를 누르면 큰 IPA 표**([8-3-1](PRINCIPLES.md#8-3-1-기호를-누르면-소리-대표-낱말-큰-ipa-표-261108-영신)).
  - **언어 고르기**([8-3-2](PRINCIPLES.md#8-3-2-언어-고르기-261108-영신)): 전체 또는 여러 언어를 고르면 그 언어 낱말과 그 언어에 있는 기호만 남는다.
  - **한자·낱말 뜻 풀이**([2-5](PRINCIPLES.md#2-5-발음-용어는-한글한자영어를-함께-쓴다)): 한자와 예시 낱말 철자에 커서를 올리거나 누르면 '벌리다'처럼 뜻이 뜬다.
  - **배색 넷**: 먹물(기본, 영신 확정)·밤바다·칠판·보카고양.
  - **표 밖 줄**(26.11.09, [8-9](PRINCIPLES.md#8-9-ipa-지도-주기율표-게임에서-가져온-것)): IPA 자음표에 칸이 없는 ɕ와 파찰음은 지도 아래 '표 밖' 줄에 켠다.
- **시제품(공개 배포 안 함):** `index.html`, 강 여덟, 카드 537, 녹음 412. 묶음마다 그 소리가 있는 언어는 11개 가운데 다 넣는다([8-7](PRINCIPLES.md#8-7-언어-풀)).

| 강 | 묶음 | 기호 | 낱말 | 녹음 없는 낱말 |
|---|---|---|---|---|
| 1 | 양순 파열음 | [p] [b] [pʰ] [p͈] (+[β]) | 27 | 부부, 스페인어 vaca, 포르투갈어 bom |
| 2 | 치경 파열음 | [t] [d] [tʰ] [t͈] (+[ð]) | 29 | 달·탈·딸, 아랍어 ذهب, 포르투갈어 dois |
| 3 | 연구개 파열음 | [k] [ɡ] [kʰ] [k͈] (+[ɣ]) | 26 | 아랍어 غرب |
| 4 | 유음 | [l] [ɾ] [r] [ɹ] [ʁ] | 22 | 아랍어 ليل·رجل |
| 5 | 마찰음 | [f] [v] [ɸ] [h] [x] [ç] [θ] | 33 | 포르투갈어 faca·rato, 러시아어 флаг, 아랍어 ثلج·فم |
| 6 | 치찰음 | [s] [s͈] [z] [ʃ] [ʒ] [ɕ] [ʂ] [ʐ] | 38 | 없음 |
| 7 | 파찰음 | [ts] [tsʰ] [dz] [tʃ] [dʒ] [tɕ] [tɕʰ] [t͈ɕ] [dʑ] [tʂ] [tʂʰ] | 27 | 없음. 낱말이 없는 자리: 아랍어 [dʒ](ج를 [dʒ]로 내는 지역의 원어민 녹음을 못 찾음) |
| 8 | 고모음 | [i] [y] [ɨ] [ɯ] [u] | 35 | 굴, uva, 胃(간사이 녹음 귀로 확인 전), 梅, ум·ты·мы, بنت(모로코 녹음 귀로 확인 전), أم |

- **녹음**은 모두 Commons·Lingua Libre·Shtooka이고, WebFetch로 받아 SHA-1을 대조했다([8-10](PRINCIPLES.md#8-10-녹음-출처)). 원어민이고 지역을 알 수 있는 화자만 쓴다. Shtooka는 파일에 지역이 적혀 있으면 받는다(26.11.09). 사람이 들어 본 녹음은 아직 없다(`listened: null`).
- **한국어 한 목소리 최소대립**(불·풀·뿔, 달·탈·딸)은 영신초이 녹음이 오면 채울 빈칸이다. 달·탈·딸은 Amanda1970 계정 녹음뿐이라 뺐다.
- **독립 검수(26.11.12):** 검수 에이전트 셋이 묶음 3~7을 따로 봤다(묶음 6·7은 같은 지시로 두 번). 지적 60개를 출처로 하나씩 확인해 맞는 것을 고쳤다. 고친 것과 뺀 것, 고치지 않은 이유는 WORK_LOG 26.11.12.
- **검수 자료:**
  - PHOIBLE 기호 × 11개 언어 표: `data/phoible-matrix.json`(`pipeline/phoible_matrix.py`). 알려진 빈틈: 스페인어 2210에 /k/가 없다(2308로 대조), 독일어 2184에 파찰음이 없다(2398로 대조).
  - 묶음마다 `sources/phoible-bNN.json`(대조한 음소 줄)과 `sources/wiktionary-bNN.json`(Wiktionary 전사와 대조 결과).
- **미리보기(비공개 Artifact):** https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo (`python3 pipeline/build.py --artifact <파일>`).
- **영신 직검수 페이지(줄 댓글):** 묶음 1 https://claude.ai/artifact/11cSUJ2Paoo2hgvctNgtH8 · 묶음 2 https://claude.ai/artifact/GJznGeTaPsSKPeBkUg9tFf · 묶음 3 https://claude.ai/artifact/YMVYAAUEuVWj6x7F59BiCF · 묶음 4 https://claude.ai/artifact/AZ4uaCBKEZrZ19SQj5VhkV · 묶음 5 https://claude.ai/artifact/JJL5cMwS41cKaSfBFSemFy · 묶음 6 https://claude.ai/artifact/NrN3hy6oqRk8ot9TijSzpp · 묶음 7 https://claude.ai/artifact/Vik3LicZT9urTyEoScr9wa
  - 만드는 법: `python3 pipeline/review_page.py bNN --out <파일>`
  - 26.11.07에 실수로 만든 묶음 1 페이지 사본(https://claude.ai/artifact/MMoNoim7eeZGY2w3mXgMet)은 영신이 지우라고 하면 지운다.
- **영신에게 남은 것:** 녹음 듣기(청취 검수), 묶음 3~7 낱말과 인정하는 이름 검토, PRINCIPLES 8-10의 지역 기준(출신으로 본다, 26.11.12) 확인, 원하면 한국어 한 목소리 녹음과 그 공개 조건.

## 검사 (26.11.09 이 세션에서 돌림)

- `node pipeline/tests/prototype.test.cjs`: 처음 화면(강 타일 수) → 마지막 강 → 연습 넷을 끝까지 풀고(일부러 한 번 틀려 따라 치기, 맞힘 그림) → 처음 화면 IPA 지도에 칸이 켜지는지 → 언어 고르기(한국어만, 한국어+영어, 전체)를 390px로 본다. 통과. 콘솔 오류 0, 가로 넘침 0, 저장 키는 전부 `ipagoyang-`. Chromium만 봤고 실제 폰은 못 봤다.
- `python3 pipeline/phoible_check.py <phoible.csv> <InventoryID-Bibtex.csv>`: 일곱 묶음 어긋남 0(없어야 할 소리 포함).
- `python3 pipeline/wikt_compare.py <받은 전사.json> bNN`: 일곱 묶음 다름 0. 대상 밖 차이는 결과 파일에 남겼다. 중국어는 번체 문서의 Sinological IPA 첫 줄(표준 중국어)만 받아 대조한다. 둘째 줄부터는 다른 방언이다.
- `python3 pipeline/build.py --check`: index.html이 원본(frame.html + 덧붙임 + 데이터)과 맞는지 본다.
- `node pipeline/tests/record-transfer.test.cjs`: 기록 옮기기 공통 검사 + 발음고양 저장 키 12개가 맞는 종류로 가는지. 통과. 두 브라우저 사이 내보내기 → 합치기도 Chromium으로 해 봤다.

## 확인한 것과 못 한 것

- 서지: JIPA 'Illustrations of the IPA'는 Crossref로 확인했고 본문은 못 읽었다. 그 글을 옮긴 PHOIBLE 목록으로 대조했다.
- 라이선스: 녹음은 파일 페이지마다([sources/audio.json](sources/audio.json)), PHOIBLE CC BY-SA 3.0, IPA 표 CC BY-SA 4.0, Charis SIL OFL 1.1('Balum IPA'로 이름 바꿈), Wright·McCloy 단면도 CC0.
- 못 한 것:
  - 녹음 청취 검수: 사람이 들은 파일이 없다. 귀로 먼저 확인할 것:
    - 이탈리아 남부 화자의 zero [dz], 브라질 Jjunho의 tipo·dia [tʃ]·[dʒ]
    - 이탈리아어 rosa(모음 사이 s가 지역마다 다름)
    - 타이완 화자 雲角(来·口·发·怕·四·小), 홍콩 화자 Luilui6666(八·大·他·好·四)
    - 아랍어 تمر(남레반트 화자, 끝에 모음이 끼는지 [ˈta.m(ɪ)r]), 프랑스어 pain의 Sartus85(fr.wiktionary는 pɑ̃)
    - 독일어 Journalist 세 화자(첫소리가 [ʒ]인지, [dʒ]로 내는 사람도 있다), Jeans(Jeuwre, [dʒ]인지 [ʒ]인지)
    - 귀로 확인되면 되돌릴 녹음: 독일어 Sonne·rot의 뮌헨 화자, 중국어 书의 홍콩 화자, 중국어 人의 타이완 화자, 독일어 Jeans의 비엔나 화자(PRINCIPLES 8-10: 화자 변종 때문에 대상 소리가 달라질 수 있어 빼 둠. rot·人은 26.11.25 팀 면접에서 넷이 짚어 뺐다). 26.11.26 앞 울림 없는 첫 유성음 녹음 11개(es-vaca, es-dos·es-goma·it-bocca·it-due·it-gatto 둘·it-giorno·pt-bom·pt-dia·pt-dois의 한 화자씩, `pipeline/prevoicing_check.py` 0.05 아래)
  - 한국어 표기 관례의 1차 출처(͈ 표시의 extIPA 근거, ㅅ의 기식, ㅈ의 [tɕ]·[tʃ]·[ts]): 본문 미열람이라 '확인 필요'로 두었다.
  - 아랍어: 현대 표준 아랍어 목록·녹음이 없다. 녹음 대부분이 모로코 아랍어 화자다.

## 남은 일

1. 고모음·원순 전설·비모음, 길이, 강세, 성조(8-5 차례 다음). 모음은 지도(모음 사다리꼴)와 화면이 달라서 **설계안을 먼저 영신과 논의**한다.
2. 그 언어에만 있는 자음(아랍어 인두음·강세음 등).
3. 녹음 빈칸 채우기(위 표). 원어민 지인 녹음이나 Lingua Libre 새 녹음을 기다린다.
4. 강마다 시작 대사, 지도의 나머지 아이디어(8-9: 줄 색, 자질 상자 등).
5. 언어별 진도 기록(8-3-2 확인 필요).

## 다른 저장소와의 관계 (읽기만)

- 고양공유: [palagoyang goyang-common](https://github.com/esqsoy/palagoyang/blob/main/goyang-common/README.md), [탄고고양 PRINCIPLES 0](https://github.com/esqsoy/tangogoyang/blob/main/PRINCIPLES.md#0-목적). 기본 변종 기준(포르투갈어 브라질, 스페인어 중남미, 영어 미국)은 palagoyang HANDOFF의 26.11.07 영신 결정이다.
- 탄고고양 五十音 [gojuon_sound.py](https://github.com/esqsoy/tangogoyang/blob/main/pipeline/jlpt/gojuon_sound.py): 기호 설명 형식의 씨앗이다.
- 보카고양: 공통 기능의 본가다([SHARED.md](https://github.com/esqsoy/vocagoyang/blob/main/SHARED.md)). 직검수 페이지의 줄 댓글 방식을 보카고양 review-page.py에서 가져왔다. 기록 옮기기(다른 기기로)는 26.11.20 보카고양 `a35dfbd`의 `pipeline/record-transfer`를 그대로 복사해 넣었다(설정만 `config.json`, 넣는 곳은 build.py, [README](pipeline/record-transfer/README.md)). 본가가 바뀌면 다시 복사한다. **esqsoy/vocagoyang은 건드리지 않는다**(영신).
- 읽은 판: palagoyang `957f413`, tangogoyang `f652afe`, vocagoyang `d7e077d`(틀), `a35dfbd`(기록 옮기기).

## 작업 환경

- 저장소 esqsoy/IPAGOYANG(git 주소는 소문자 `ipagoyang`), 기본 가지 `main`.
- 저장소 밖에 둔 큰 자료(다시 받을 수 있음): PHOIBLE `phoible.csv`·`InventoryID-Bibtex.csv`(github.com/phoible/dev), Charis 7.000 zip(software.sil.org/charis), Commons 녹음 원본, Wright·McCloy 그림(github.com/drammock/phonetics-teaching-assets).
- 이 작업 환경에서 upload.wikimedia.org로 바로 받으면 429가 온다. 녹음은 WebFetch로 받고 Commons API의 SHA-1과 맞춘다.

## 열린 질문 (설계안 밖)

- **26.11.25 플레이테스트에서 나온 영신 결정거리**(WORK_LOG 같은 날): ① 처음 하는 사람을 위한 한 번뿐인 안내(설명 문구를 없앤 26.11.20 결정과 배우기를 뺀 26.11.08 결정은 그대로 두고) ② 듣고 고르기·전사 빈칸에서 이름 전체를 치는 양(1강만 80번 넘게) ③ 오답 카드에 내 답을 남기고 다른 곳 표시, '따라 치면 넘어간다' 한 줄 ④ 영어 이름을 배울 곳(큰 표·오답 카드) ⑤ 맞힌 뒤 한글이 한자로만 남는 것 ⑥ 첫 판부터 나오는 놀림 대사(영신초이·STUDY1·시벨리우스) ⑦ 휴대폰에서 보이는 입력칸·확인 단추, '소리' 단추(지금은 음소거) ⑧ '듣고 고르기'라는 이름(보기 없이 친다) ⑨ 처음 화면 위쪽 '시작' 단추.
- **모음 설계안 2판**([proposals/vowels-20261125.md](proposals/vowels-20261125.md)) 0절의 열네 가지(영신 결정 대기, 외솔 검토 반영). 결정 뒤 이솝이 카드 초안(스크래치 `team/b08/`)을 고치고 이언이 다시 검산한다.
- 게임 안 제목: 지금은 '발음고양'.
- **GitHub Pages 켜짐(26.11.26 영신 "저켜놨어").** main에 푸시하면 esqsoy.github.io/ipagoyang이 바로 바뀐다. 배포 기록은 [DEPLOYMENT.md](DEPLOYMENT.md). 확인 필요 카드는 '확인 필요' 표시로, 녹음 없는 낱말은 '발음 확보 중'으로 공개(PRINCIPLES 2-3).
