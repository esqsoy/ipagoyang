# 기록 옮기기

처음 화면 맨 아래 '⇄ 다른 기기로 기록 옮기기'. 이 기기의 발음고양 기록(진도·모아둔 카드·익힌 기호·진행 속도·고른 언어·배색)을 파일 하나로 내보내고, 다른 기기에서 그 파일을 합친다. `index.html#records`로 열면 창이 바로 뜬다.

- 고양 시리즈 공통 기능이다. 본가는 보카고양 [pipeline/record-transfer](https://github.com/esqsoy/vocagoyang/tree/main/pipeline/record-transfer)(합치기 규칙·이유·결정은 그 README와 보카고양 PRINCIPLES '기록 옮기기'). 26.11.20 영신 "다른기기로 전송기능이 원래 고양시리즈엔 추가됐습니다"로 가져왔다.
- `merge.js`·`runtime.js`·`ui.html`·`style.css`·`test.cjs`는 보카고양 `a35dfbd`의 파일을 그대로 복사했다. 고치지 않는다(고칠 일이 생기면 본가에서 고쳐 다시 복사한다). 발음고양 값은 `config.json`에만 있다.
- 넣는 곳: 보카고양은 `build.cjs`로 교재 선택 화면에 넣지만, 발음고양은 화면이 한 장이라 `pipeline/build.py`가 처음 화면 맨 아래(STUDY1 줄 앞)에 넣는다. 표시(`RECORD_TRANSFER_START`, `id="rtSheet"`)는 같다.
- 발음고양만 덧붙인 것: 합친 뒤 화면을 다시 연다(`ipa_extra.js`). 처음 화면과 게임이 한 장이라, 다시 열지 않으면 메모리에 남은 옛 진도가 합친 기록을 덮어쓸 수 있어서다.
- 답 기록(`ipagoyang-trials-v1`, 26.11.27 PRINCIPLES 8-13 B)도 같이 간다. 공통 `merge.js`에는 이 종류가 없어 `keep`(이 기기에 없을 때만 가져옴)으로 가므로, 두 기기에 다 있으면 `ipa_extra.js`가 `rtMerge`를 감싸 줄을 합친다(같은 줄은 한 번, 시간순, 최근 1만 줄). 본가에 '답 기록' 종류가 생기면 그쪽으로 옮긴다.
- 키는 모두 `ipagoyang-`로 시작한다. 같은 주소(esqsoy.github.io)의 다른 고양 게임 키(`goyang-`·`tangogoyang-` 등)는 모으지도 쓰지도 않는다.

## 검사

- `node pipeline/record-transfer/test.cjs`: 공통 검사(합치기 규칙 + 이 config.json + index.html에 들어 있는지).
- `node pipeline/tests/record-transfer.test.cjs`: 발음고양의 실제 저장 키가 맞는 종류로 가는지.
