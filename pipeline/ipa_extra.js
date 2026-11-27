/* 발음고양 덧붙임. 보카고양 마더텅 틀(pipeline/frame.html) 앞에 넣는다(build.py).
   틀은 그대로 두고 여기서만 발음고양에 필요한 것을 더한다(PRINCIPLES 1-1, 탄고고양 日本語能力試験과 같은 방식).
   - 입력: ph → pʰ 같은 줄임을 IPA로 바꿔 읽는다(ipaIn). 자동 제출은 끈다.
   - 칸: 부호가 붙은 기호도 칸 하나(blankParts).
   - 카드 위: 배우기 그림(입 옆모습·목청·소리 시작 띠), 녹음 재생 단추(ipaBeforeCard / ipaAfterCard).
   - 처음 화면: 주기율표 게임처럼 잠긴 칸이 다 보이는 IPA 지도와 기호 도감(ipaRenderMap). */
const IPA_NO_AUTOSUBMIT = true;
/* 배색: 보는 사람마다 고른 것을 기억한다(브라우저 저장, 없으면 기본). 고양고양이 색은 안 바뀐다 */
const IPA_PALS = [['ink', '먹물·호박'], ['sea', '밤바다'], ['chalk', '칠판'], ['voca', '보카고양']];
const IPA_PAL_DEFAULT = 'ink';
function ipaPalGet() { try { return localStorage.getItem('ipagoyang-palette') || IPA_PAL_DEFAULT; } catch (e) { return IPA_PAL_DEFAULT; } }
function ipaPalSet(p) { document.documentElement.dataset.pal = p; try { localStorage.setItem('ipagoyang-palette', p); } catch (e) {} document.querySelectorAll('.ipa-pal button').forEach(b => b.setAttribute('aria-pressed', b.dataset.pal === p)); }
document.documentElement.dataset.pal = ipaPalGet();
const IPA = /*__IPA_DATA__*/{};

/* ---------- 입력과 칸 ---------- */
function ipaCurWord() { try { const s = state.session; return s && s.currentId !== null ? s.words[s.currentId] : null; } catch (e) { return null; } }
function ipaIn(raw) {
  let s = String(raw || '');
  const w = ipaCurWord();
  // 명칭 카드: 그 단계가 묻는 이름이 맞으면(순서·띄어쓰기·동의어 무관) 대표 표기로 바꿔 틀의 판정에 넘긴다
  if (w && w.names) return ipaNameState(s, w).pass ? w.term : s;
  for (const [k, v] of IPA.short || []) s = s.split(k).join(v);
  return s;
}

/* ---------- 명칭 치기(PRINCIPLES 8-3, 26.11.08 영신) ----------
   "pp를 치는데 그대신 무성 경음 양순 파열음이라고 치는거지", "이름대기는 일단 두단계로 나누나 한국어로 이름대기먼저. 한국어로 치면
   한자도 영어도 뜨게. 그리고 영어로 이름대기. 영어로 치면 한국어와 한자도 뜨게", "어느 경우든 발음명을 치는걸로만".
   카드의 mode: ko(한국어 이름) · en(영어 이름) · any(어느 쪽이든, 듣고 이름 대기·전사 빈칸). 맞으면 나머지 둘(한자 포함)이 뜬다.
   낱말 순서·띄어쓰기는 묻지 않고, 사전 동의어는 인정한다. */
// 26.11.25(외솔 플레이테스트): 치조(표준국어대사전 '치조음 ≒ 치경음'), 치조구개 = 치경구개, palato-alveolar = postalveolar(ʃ·ʒ의 옛 IPA 이름)
const IPA_NAME_SYN = {'폐쇄음': '파열음', '된소리': '경음', '거센소리': '유기', '격음': '유기', '탄설음': '탄음', '치조구개': '치경구개', '치조': '치경', 'stop': 'plosive', 'fortis': 'tense', 'flap': 'tap', 'palatoalveolar': 'postalveolar',
  // 모음(PRINCIPLES 8-11): 사전 같은 말 폐모음=고모음, 국립국어연구원 해설(2003)의 비원순=평순, 영어 high=close(고모음이 high를 옮긴 말)
  '폐모음': '고모음', '비원순': '평순', 'high': 'close'};
// 영어 이름 낱말: 붙임표로 이은 말은 한 낱말로(post-alveolar = postalveolar, alveolo-palatal = alveolopalatal). 친 글과 정답에 똑같이 쓴다
function ipaEnTok(str) { return (String(str || '').toLowerCase().replace(/([a-z])-(?=[a-z])/g, '$1').match(/[a-z]+/g) || []).map(x => IPA_NAME_SYN[x] || x); }
// 붙은 용어는 낱말로 나눠 견준다(설측 접근음 = 설측 + 접근음): 순서를 바꿔 쳐도 같게
const IPA_NAME_SPLIT = {'설측접근': ['설측', '접근음'], '설측마찰': ['설측', '마찰음']};
let ipaKoVocab = null;
function ipaKoTokens(str) {
  if (!ipaKoVocab) {
    const v = new Set(Object.keys(IPA_NAME_SYN).filter(k => /[가-힣]/.test(k)));
    for (const t of Object.values(IPA.terms || {})) {
      const full = t.ko.replace(/\s/g, ''); v.add(full);
      if (t.short) { v.add(t.short); IPA_NAME_SYN[full] = IPA_NAME_SYN[full] || t.short; }
    }
    for (const sy of Object.values(IPA.symbols)) for (const a of sy.answers || []) a.ko.split(' ').forEach(x => v.add(x));
    ipaKoVocab = [...v].sort((a, b) => b.length - a.length);
  }
  const out = []; let rest = str.replace(/\s+/g, '');
  while (rest) { const t = ipaKoVocab.find(x => rest.startsWith(x)); if (!t) return null; const c = IPA_NAME_SYN[t] || t; out.push(...(IPA_NAME_SPLIT[c] || [c])); rest = rest.slice(t.length); }
  return out;
}
function ipaSplitName(raw) {
  const ko = (String(raw).match(/[가-힣ㄱ-ㅎㅏ-ㅣ]+/g) || []).join('');
  const en = ipaEnTok(raw);
  return {ko: ko ? ipaKoTokens(ko) : null, en};
}
function ipaSame(a, b) { return !!(a && b && a.length && a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ')); }
function ipaNameState(raw, w) {
  const {ko, en} = ipaSplitName(raw);
  let koHit = null, enHit = null, both = null;
  for (const pr of w.names || []) {
    // 정답 쪽도 친 글과 같은 방식으로 쪼갠다(설측 접근음 / 설측접근음이 같게 되도록)
    const k = ipaSame(ko, ipaKoTokens(pr.ko)), e = ipaSame(en, ipaEnTok(pr.en));
    if (k && !koHit) koHit = pr;
    if (e && !enHit) enHit = pr;
    if (k && e) { both = pr; koHit = pr; enHit = pr; break; }
  }
  const mode = w.mode || 'both';
  const hit = mode === 'ko' ? koHit : mode === 'en' ? enHit : mode === 'any' ? (koHit || enHit) : both;
  return {koHit, enHit, both, hit, pass: !!hit};
}
/* 26.11.20 영신: 친 이름은 글자 칸에만 보인다(따로 된 입력줄·'한국어 이름을 친다' 같은 설명·세 이름 줄을 없앰).
   한국어 이름이 맞으면 같은 자리의 칸이 한자로 바뀌고, 한자에 커서를 올리면(폰은 누르면) 뜻이 뜬다(ipaHanjaInPlace). */
function ipaNameLive() {
  const w = ipaCurWord(), s = state.session;
  if (!w || !w.names) return;
  const raw = (document.getElementById('ainput') || {}).value || '';
  const st = ipaNameState(raw, w);
  // 맞으면 Enter 없이 넘긴다(틀린 답은 Enter로만 낸다)
  if (st.pass && !s.answered && !s.copyMode && !state.composing) {
    clearTimeout(ipaNameLive.t);
    ipaNameLive.t = setTimeout(() => { const s2 = state.session; if (s2 === s && !s2.answered && !s2.copyMode && ipaIn(document.getElementById('ainput').value) === w.term) submit(); }, 450);
  }
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'ainput') ipaNameLive(); }, true);
// 새 카드가 뜬 직후의 빈 Enter는 무시한다(26.11.25 이언 플레이테스트: 맞혀서 저절로 넘어간 뒤 습관으로 Enter를 누르면
// 다음 문제가 빈 답 오답이 됐다. 틀의 막음은 0.4초뿐). 2초가 지난 뒤의 빈 Enter는 지금처럼 '모름'(정답 보고 따라 치기)이다.
document.addEventListener('keydown', e => {
  if (!e.target || e.target.id !== 'ainput' || e.isComposing || !(e.key === 'Enter' || e.keyCode === 13)) return;
  const s = state.session;
  if (s && !s.answered && !s.copyMode && !String(e.target.value || '').trim() && Date.now() - s.cardStart < 2000) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
document.addEventListener('compositionend', e => { if (e.target && e.target.id === 'ainput') setTimeout(ipaNameLive, 0); }, true);
/* 카드 시간: 이름이 길어서 틀의 낱말 기준(영문자 수)으로는 모자란다 */
function ipaCardLimit(w) {
  if (!w.names) return w.learn ? 60 : limitFor(w.term);
  const p = w.names[0], h = (p.ko.match(/[가-힣]/g) || []).length, l = (p.en.match(/[a-z]/gi) || []).length;
  const need = w.mode === 'en' ? l * 0.8 : w.mode === 'ko' ? h * 2.2 : Math.min(h * 2.2, l * 0.8);
  return Math.min(90, Math.round(22 + need));
}
function ipaIsMark(c) { return /[ʰ-ˇˉ-ˋˍ-ˏˑ-˿̀-ͯ᷀-᷿]/.test(c); }
function ipaIsBase(c) { return /[A-Za-zÀ-ɏɐ-ʯͰ-Ͽᴀ-ᵿ0-9=&ᄀ-ᇿ㄰-㆏가-힯]/.test(c); }
function blankParts(value) {
  // 명칭 카드(26.11.20 영신 "보카고양 참조해서 글자당 칸 하나씩"): 이름 글자마다 칸 하나.
  // 인정하는 이름이 여럿이면 지금까지 친 글자와 가장 길게 겹치는 이름에 칸 수를 맞춘다(한글을 치면 한국어 이름, 로마자를 치면 영어 이름)
  const w = ipaCurWord(), ss = (typeof state !== 'undefined') ? state.session : null;
  if (w && w.names && ss && !ss.copyMode && !ss.answered && value === w.term) {
    const typed = (document.getElementById('ainput') || {}).value || '';
    return ipaBlankPartsRaw(ipaNameTarget(w, typed));
  }
  return ipaBlankPartsRaw(value);
}
function ipaNameTarget(w, typed) {
  const latin = /[a-z]/i.test(typed), mode = w.mode || 'both';
  const lang = mode === 'en' || (mode !== 'ko' && latin) ? 'en' : 'ko';
  const cands = w.names.map(n => n[lang]), flat = x => String(x).toLowerCase().replace(/\s/g, '');
  const t = flat(typed);
  let best = cands[0], bestN = -1;
  for (const c of cands) { const f = flat(c); let n = 0; while (n < t.length && n < f.length && t[n] === f[n]) n++; if (n > bestN) { best = c; bestN = n; } }
  return best;
}
function ipaBlankPartsRaw(value) {
  const src = String(value || ''); const chars = []; const breaks = new Set(); let pending = false;
  for (const c of src) {
    if (/\s/.test(c)) { pending = chars.length > 0; continue; }
    if (ipaIsMark(c)) { if (chars.length && !pending) chars[chars.length - 1] += c; continue; }
    if (!ipaIsBase(c)) continue;
    if (pending) breaks.add(chars.length);
    chars.push(c); pending = false;
  }
  if (pending) breaks.add(chars.length);
  return {chars, breaks, spaced: /\s/.test(src.trimStart())};
}

/* ---------- 녹음 ---------- */
let ipaAudioNow = null;
function ipaHasAudio(id) { return !!(id && IPA.audio && IPA.audio[id]); }
function ipaPlay(id, canvas) {
  if (!ipaHasAudio(id)) return;
  try { if (typeof stopPronunciation === 'function') stopPronunciation(); } catch (e) {}
  if (ipaAudioNow) { ipaAudioNow.pause(); }
  const a = new Audio(IPA.audio[id].src); ipaAudioNow = a;
  let raf = 0;
  const draw = () => { if (canvas) ipaWave(canvas, id, a.duration ? a.currentTime / a.duration : 0); if (!a.paused && !a.ended) raf = requestAnimationFrame(draw); else if (canvas) ipaWave(canvas, id, a.ended ? 1 : 0); };
  a.addEventListener('playing', draw);
  a.play().catch(() => {});
}
function ipaWave(c, id, t) {
  const pk = (IPA.audio[id] || {}).peaks; if (!pk || !c) return;
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight; if (!w) return;
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement), bw = w / pk.length;
  pk.forEach((v, i) => {
    const on = (i / pk.length) <= t, bh = Math.max(1, v * (h - 4));
    g.fillStyle = on ? css.getPropertyValue('--cyan') : css.getPropertyValue('--muted');
    g.globalAlpha = on ? 1 : .4;
    g.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1), bh);
  });
}

/* ---------- 그림: 입 옆모습(CC0 단면도, PRINCIPLES 8-8) ---------- */
/* 원본은 drammock/phonetics-teaching-assets(CC0)의 경로 모양(assets/sagittal/sagittal.json). 얼굴이 오른쪽을 보므로
   좌우로 뒤집어 IPA 표 방향(왼쪽 = 입 앞)에 맞춘다. 자리 점·바람·틈은 원본 좌표 위에 덧그린다. */
const IPA_SAG_AT = {bilabial: [157, 137], alveolar: [147, 129], dental: [151, 136], velar: [106, 130], uvular: [93, 137], labiodental: [150, 138], palatal: [128, 124], postalveolar: [143, 127], alveolopalatal: [136, 125], retroflex: [140, 126], glottal: [101, 205], glottis: [101, 205]};
function ipaSagittal(o = {}) {
  const G = IPA.sagittal; if (!G) return '';
  const idx = G.shapes[o.shape] || G.shapes.neutral;
  const at = IPA_SAG_AT[o.place] || null, gl = IPA_SAG_AT.glottis;
  const cls = ['ipa-sag-larynx', 'ipa-sag-head', 'ipa-sag-glottis', 'ipa-sag-upper', 'ipa-sag-tongue'];
  let s = `<rect x="85" y="95" width="90" height="122" fill="var(--ipa-cav)"/>`;
  idx.forEach((k, i) => { s += `<path class="${cls[i]}${i === 2 && o.voiced ? ' on' : ''}" d="${G.paths[k]}"/>`; });
  if (o.near && at) s += `<ellipse class="ipa-sag-gap" cx="${at[0]}" cy="${at[1]}" rx="1.3" ry="2.6"/>`;
  if (at) s += `<circle class="ipa-sag-at a-close" cx="${at[0]}" cy="${at[1]}" r="4.2"/>`;
  s += `<circle class="ipa-sag-gl a-glot" cx="${gl[0]}" cy="${gl[1]}" r="4.6"/>`;
  if (o.puff && at) s += `<g class="ipa-sag-puff a-puff${o.anim ? '' : ' ipa-puff'}"><path d="M${at[0] + 9},${at[1] - 3} q3,3 0,6"/><path d="M${at[0] + 13},${at[1] - 5} q4,5 0,10"/><path d="M${at[0] + 17},${at[1] - 7} q5,7 0,14"/></g>`;
  const label = '입 옆모습(단면도 CC0, Wright·McCloy)' + (o.near ? ' · 틈은 덧그린 것' : '');
  return `<svg class="ipa-sag" viewBox="85 95 90 122" role="img" aria-label="${label}"><g transform="translate(260,0) scale(-1,1)">${s}</g></svg>`;
}
function ipaSagOpts(s) {
  return {shape: s.sagittal || 'neutral', place: s.place, near: s.lips === 'near', voiced: s.glottis === 'voiced', puff: s.glottis === 'wide'};
}
function ipaBase(sym) { return String(sym || '').normalize('NFD').replace(/[\u0300-\u036f\u02b0-\u02ff]/g, '').slice(0, 1); }
/* IPA 자음표에 칸이 없는 기호(26.11.09, 묶음 6·7): ɕ는 IPA 표 '기타 기호'에 있고, 파찰음은 두 기호를 이어 적어 표에 줄이 없다.
   지도 아래 '표 밖' 줄에 둔다. 이 게임이 가르치는 것만(8-7). 기식(ʰ)·경음(͈) 표시는 떼고 칸을 찾는다(tsʰ → ts 칸). */
const IPA_OFF = ['ɕ', 'ts', 'dz', 'tʃ', 'dʒ', 'tɕ', 'dʑ', 'tʂ'];
// 표 밖 줄도 실제 자리 열 밑에 둔다(26.11.25 외솔 플레이테스트: 1~8열에 차례로 붙어 ɕ가 양순 밑에 보였다).
// 4 치경 ts dz · 5 후치경 tʃ dʒ · 6 권설 tʂ · 7 경구개 쪽 ɕ tɕ dʑ(치경구개). 칸에 둘이면 왼쪽이 무성(표와 같음)
const IPA_OFF_COLS = [null, null, null, ['ts', 'dz'], ['tʃ', 'dʒ'], ['tʂ'], ['ɕ', 'tɕ', 'dʑ'], null, null, null, null];
function ipaOffRow(f) { return IPA_OFF_COLS.map(v => v ? `<span class="ipa-cell">${v.map(f).join('')}</span>` : '<span class="ipa-cell empty"></span>').join(''); }
const IPA_OFF_HEAD = '<span class="ipa-rowh ipa-offh" title="IPA 표에 칸이 없는 기호"><span>표 밖</span><small class="h">기타·파찰</small></span>';
function ipaKey(sym) { const k = String(sym || '').normalize('NFD').replace(/[\u0300-\u036f\u02b0-\u02ff]/g, ''); return IPA_OFF.includes(k) ? k : k.slice(0, 1); }
// 목청 설명: 기호마다 따로 적은 글(마찰음·파찰음)이 있으면 그것, 없으면 상태별 글(파열음 기준)
function ipaGlottisText(s) { return s.glottis_text || (IPA.glottis || {})[s.glottis] || ''; }
function ipaGlottis(st) {
  const g = {open: [24, 46], wide: [12, 58], voiced: [33, 37], tight: [34, 36]}[st] || [24, 46];
  const w = st === 'tight' ? 6 : 5;
  let s = `<svg viewBox="0 0 70 50" role="img" aria-label="목청(모식도)"><rect x="1" y="1" width="68" height="48" rx="8" fill="var(--ipa-cav)" stroke="var(--line)"/>
    <g${st === 'voiced' ? ' class="ipa-vib"' : ''}><path d="M35,7 L${g[0]},40" stroke="var(--ipa-tongue)" stroke-width="${w}" stroke-linecap="round"/><path d="M35,7 L${g[1]},40" stroke="var(--ipa-tongue)" stroke-width="${w}" stroke-linecap="round"/></g>`;
  if (st === 'tight') s += `<path d="M14,26 l7,0 m-3,-3 l3,3 l-3,3 M56,26 l-7,0 m3,-3 l-3,3 l3,3" stroke="var(--gold)" stroke-width="1.4" fill="none"/>`;
  return s + '</svg>';
}
function ipaVot(k) {
  const y = 30, rel = 120;
  let s = `<svg viewBox="0 0 300 66" role="img" aria-label="소리 시작 띠(모식도)"><line x1="10" y1="${y}" x2="290" y2="${y}" stroke="var(--line)" stroke-width="2"/>
    <line x1="${rel}" y1="10" x2="${rel}" y2="48" stroke="#fff" stroke-width="1.6"/><text x="${rel}" y="60" font-size="10" text-anchor="middle" fill="#fff">터뜨림</text>`;
  const wavy = (a, b) => { let d = `M${a},${y}`; for (let x = a; x < b; x += 6) d += ` q1.5,-7 3,0 q1.5,7 3,0`; return `<path d="${d}" fill="none" stroke="var(--cyan)" stroke-width="1.6"/>`; };
  const noise = (a, b) => { let d = ''; for (let x = a; x < b; x += 4) d += `M${x},${y - 6} L${x + 2},${y + 6} `; return `<path d="${d}" stroke="var(--gold)" stroke-width="1.2"/>`; };
  if (k === 'lead') s += wavy(30, 290) + `<text x="70" y="14" font-size="10" text-anchor="middle" fill="var(--cyan)">울림이 먼저</text>`;
  if (k === 'short') s += wavy(rel + 8, 290) + `<text x="205" y="14" font-size="10" text-anchor="middle" fill="var(--cyan)">바로 울림</text>`;
  if (k === 'long') s += noise(rel + 2, 196) + wavy(198, 290) + `<text x="158" y="14" font-size="10" text-anchor="middle" fill="var(--gold)">바람(흐)</text><text x="244" y="14" font-size="10" text-anchor="middle" fill="var(--cyan)">울림</text>`;
  return s + '</svg>';
}

/* ---------- 카드 위 ---------- */
function ipaEsc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
/* 뜻 풀이(26.11.08 영신): 한자 한 자 위에 커서를 올리면(폰은 누르면) 그 자의 뜻("벌리다"처럼 사전형, 훈음 아님),
   예시 낱말은 철자 위에 올리면 낱말 뜻. 발음(전사)은 누르면 소리라서 뜻은 철자 쪽에만 둔다. 뜻 자료는 data/hanja.json */
function ipaHanjaHtml(str) {
  return [...String(str || '')].map(ch => (IPA.hanja || {})[ch] ? `<span class="ipa-gl" tabindex="0" data-g="${ipaEsc(IPA.hanja[ch])}">${ch}</span>` : ipaEsc(ch)).join('');
}
// 26.11.26 영신: 녹음을 못 구한 낱말은 '발음 확보 중', 확인 필요 카드는 '확인 필요'라고 보이고 진행한다(차후 확보·확인되면 고친다)
let ipaChkSet = null;
function ipaChk(wid) { if (!ipaChkSet) ipaChkSet = new Set(IPA.wordCheck || []); return ipaChkSet.has(wid) ? '<span class="ipa-chk" title="문헌끼리 다르거나 1차 출처를 아직 못 본 자료">확인 필요</span>' : ''; }
function ipaWordHtml(text, gloss) {
  return gloss && gloss !== text ? `<span class="ipa-gl ipa-gl-w" tabindex="0" data-g="${ipaEsc(gloss)}">${ipaEsc(text)}</span>` : ipaEsc(text);
}
document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('.ipa-gl');
  document.querySelectorAll('.ipa-gl.show').forEach(x => { if (x !== g) x.classList.remove('show'); });
  if (g) g.classList.toggle('show');
  // 정답 자리의 한자를 누르면 뜻만 보이고 다음 카드로 넘어가지 않는다(카드 누르기 = 다음 카드인 틀과 겹치지 않게)
  if (g && g.closest('#hoeCtx .blanks')) { e.stopPropagation(); if (typeof cancelPendingAdvance === 'function') cancelPendingAdvance(); }
}, true);
// 한자에 커서를 올려 뜻을 보는 동안은 저절로 넘어가지 않는다(Enter나 카드 누르기로 넘어간다)
document.addEventListener('mouseover', e => {
  if (e.target.closest && e.target.closest('#hoeCtx .ipa-hz-ans') && typeof cancelPendingAdvance === 'function') cancelPendingAdvance();
});
/* 26.11.20 영신: "한글 다 치고나면 한자를 밑에 따로 띄우는게 아니라 아예 한자로 뜨게". 이름 대기에서 한국어 이름이 맞으면
   (처음 맞힐 때도, 틀려서 따라 친 뒤에도) 글자 칸 자리가 한자로 바뀐다. 영어로 친 경우는 친 이름 그대로 둔다 */
function ipaHanjaInPlace() {
  const w = ipaCurWord(); if (!w || !w.nameq || !w.names) return;
  const wrap = document.querySelector('#hoeCtx .blanks'); if (!wrap) return;
  const raw = (document.getElementById('ainput') || {}).value || '';
  if (w.mode === 'en' || (w.mode !== 'ko' && /[a-z]/i.test(raw))) return;
  const st = ipaNameState(raw, w), pr = st.koHit || st.hit || w.names[0];
  if (!pr || !pr.hanja) return;
  wrap.innerHTML = `<span class="ipa-hz-ans">${ipaHanjaHtml(pr.hanja)}</span>`;
  wrap.setAttribute('aria-label', `${pr.ko} ${pr.hanja}`);
}
document.addEventListener('DOMContentLoaded', () => {
  if (typeof revealInPlace !== 'function') return;
  const orig = revealInPlace;
  revealInPlace = function (term) { orig(term); try { ipaHanjaInPlace(); } catch (e) {} };
});
/* 발음 용어는 한글·한자·영어를 함께 보인다(영신 26.11.07, PRINCIPLES 2-5). 용어 자료는 data/terms.json */
function ipaT(k) { return (IPA.terms || {})[k] || {ko: k}; }
function ipaTermInline(k, label) {
  const t = ipaT(k);
  return `${ipaEsc(label || t.ko)}<span class="ipa-hz">(${ipaHanjaHtml(t.hanja || '')}${t.en ? ' · ' + ipaEsc(t.en) : ''})</span>`;
}
function ipaNameHtml(s) {
  return `<div class="ipa-name"><b>${ipaEsc(s.name)}</b>${s.name_hanja ? `<span class="ipa-hanja">${ipaHanjaHtml(s.name_hanja)}</span>` : ''}${s.name_en ? `<span class="ipa-en">${ipaEsc(s.name_en)}</span>` : ''}</div>`;
}
/* 여러 화자로 듣기(HVPT, PRINCIPLES 8-8): 낱말마다 녹음 목록을 두고, 누를 때마다 다음 화자로 넘어간다. 첫 화자는 무작위 */
function ipaAudioList(wid, fallback) {
  const l = ((IPA.wordAudio || {})[wid] || [fallback]).filter(ipaHasAudio);
  return l;
}
/* 소리는 따로 재생 단추를 두지 않고 기호(전사)를 누르면 난다(26.11.08 영신: "발음 재생버튼을 따로 놓지 말고 해당 발음기호를 누르면 되는것으로").
   누를 수 있는 기호에는 data-list(녹음 목록)를 단다. 여러 화자면 누를 때마다 다음 화자. */
function ipaTapAttrs(ids, label, start) {
  const l = (Array.isArray(ids) ? ids : [ids]).filter(ipaHasAudio);
  if (!l.length) return '';
  const i = start === 'random' ? Math.floor(Math.random() * l.length) : 0;
  return ` data-list="${ipaEsc(l.join('|'))}" data-i="${i}" role="button" tabindex="0" aria-label="${ipaEsc(label || '듣기')}"`;
}
function ipaSpkHtml(ids) {
  const l = (Array.isArray(ids) ? ids : [ids]).filter(ipaHasAudio);
  // 조작 설명은 두지 않는다(26.11.20 영신). 소리를 낸 뒤에만 몇 번째 목소리·화자를 적는다
  return l.length ? '<span class="ipa-spk" aria-live="polite"></span>' : '<span class="ipa-soon">발음 확보 중</span>';
}
function ipaBtnNext(b) {
  const l = b.dataset.list.split('|'); let i = +b.dataset.i || 0; const id = l[i % l.length];
  b.dataset.i = (i + 1) % l.length;
  const card = b.closest('#hoeCtx, .ipa-dex') || document;
  const sp = b.closest('.ipa-ex') ? null : card.querySelector('.ipa-cardplay .ipa-spk');
  if (sp) sp.textContent = (l.length > 1 ? `목소리 ${(i % l.length) + 1}/${l.length}` : '') + ((IPA.audio[id] || {}).speaker ? `${l.length > 1 ? ' · ' : ''}${IPA.audio[id].speaker}` : '');
  return id;
}
function ipaTapBind(root, canvasFor) {
  root.querySelectorAll('[data-list]').forEach(b => {
    if (b._ipaTap) return; b._ipaTap = true;
    b.classList.add('ipa-tap');
    const go = e => {
      e.preventDefault(); e.stopPropagation();
      const cv = canvasFor ? canvasFor(b) : null;
      b.classList.remove('ipa-sounding'); void b.offsetWidth; b.classList.add('ipa-sounding');
      ipaPlay(ipaBtnNext(b), cv);
      if (typeof focusAnswerInput === 'function') focusAnswerInput();
    };
    b.addEventListener('click', go);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  });
}
/* 배우기를 뺐으므로(26.11.08 영신 "배우기 빼자") 틀렸을 때 따라 치는 동안 그 기호의 풀이를 짧게 보인다 */
function ipaLearnMini(sym) {
  const s = IPA.symbols[sym]; if (!s) return '';
  return `<div class="ipa-lmini"><div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>입 옆모습</i></div><div>${ipaGlottis(s.glottis)}<i>목청: ${ipaEsc(ipaGlottisText(s))}</i></div></div><p>${ipaEsc(s.how)}</p></div>`;
}
/* 고양이 대사는 시리즈 공통 + 지금 강의 대사만(26.11.20 검수: 모든 강 대사를 한 통에 섞어서 1강에서 'ㅅ'·'[ɡ]' 대사가 나왔다).
   모아둔 카드처럼 여러 강이 섞인 판은 공통 대사만 */
function ipaLinesFor() {
  if (typeof LINES === 'undefined' || !IPA.seriesLines) return;
  let L = null; try { const l = state.session && state.session.lesson; L = l && l.kind !== 'saved' ? l.lesson : null; } catch (e) {}
  for (const [k, base] of Object.entries(IPA.seriesLines)) {
    const own = (L !== null && (IPA.lessonLines || {})[L] || {})[k] || [];
    if (!Array.isArray(LINES[k])) continue;
    LINES[k].length = 0; LINES[k].push(...own, ...base);
  }
}
function ipaBeforeCard(w) {
  if (!w) return '';
  ipaLinesFor();
  const copying = (() => { try { return !!state.session.copyMode; } catch (e) { return false; } })();
  const lm = copying ? ipaLearnMini(ipaSymOf(w)) : '';
  if (w.learn) {
    const s = IPA.symbols[w.sym] || {};
    const ex = (IPA.examples[w.sym] || []).map(e => { const l = ipaAudioList(e.wid, e.audio); return `<div class="ipa-ex"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaWordHtml(e.text, e.ko)}${ipaChk(e.wid)}</span><span class="ipa-tr"${ipaTapAttrs(l, e.text + ' 듣기')}>[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span><span class="ipa-exn">${l.length > 1 ? '×' + l.length : l.length ? '' : '발음 확보 중'}</span></div>`; }).join('');
    const symTap = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, w.sym + ' 기호 소리 듣기') : '';
    return `<div class="ipa-learn">
      <div class="ipa-big"><span${symTap}>${ipaEsc(w.sym === 'β' ? 'β β̞' : w.sym === 'ð' ? 'ð ð̞' : w.sym)}</span></div>
      ${symTap ? '<div class="ipa-symhint">기호를 누르면 소리(시범 녹음)</div>' : '<div class="ipa-symhint">이 기호 하나의 녹음은 아직 없다. 아래 낱말 전사를 누르면 낱말 소리</div>'}
      ${ipaNameHtml(s)}
      ${ipaMiniMap(w)}
      <div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>입 옆모습${s.lips === 'near' ? ' · 틈은 덧그림' : ''}</i></div><div>${ipaGlottis(s.glottis)}<i>목청 = ${ipaTermInline('성대')}: ${ipaEsc(ipaGlottisText(s))}</i></div></div>
      ${s.vot ? `<div class="ipa-vot">${ipaVot(s.vot)}<i>소리 시작 띠 = ${ipaTermInline('성대 진동 개시 시간')}: ${ipaEsc((IPA.vot || {})[s.vot] || '')}</i></div>` : ''}
      <p>${ipaEsc(s.how)}</p><p><b>한국어와</b> ${ipaEsc(s.ko)}</p>${s.other ? `<p class="ipa-other">다른 표기: ${ipaEsc(s.other)}</p>` : ''}
      ${ex ? `<div class="ipa-exs">${ex}</div>` : ''}
    </div>`;
  }
  if (w.nameq) {
    // 이름 대기: 보카고양의 예문처럼 기호를 대표 낱말 속에 보인다(한국어·영어·스페인어·그 밖 차례, 26.11.08 영신)
    const rows = (w.reps || []).map(e => { const l = ipaAudioList(e.wid); return `<div class="ipa-rep"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaWordHtml(e.text, e.ko)}${ipaChk(e.wid)}</span><span class="ipa-tr"${ipaTapAttrs(l, e.text + ' 듣기')}>[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span></div>`; }).join('');
    const s = IPA.symbols[w.sym] || {};
    const symTap = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, w.sym + ' 기호 소리 듣기') : '';
    return `${lm}<div class="ipa-nameq ipa-qtop"><div class="ipa-big"><span${symTap}>${ipaEsc(w.sym)}</span></div>${ipaMiniMap(w)}</div><div class="ipa-nameq ipa-repsbox"><div class="ipa-reps">${rows || '<div class="ipa-soon">대표 낱말 없음</div>'}</div></div>`;
  }
  if (w.audio !== undefined) {
    const l = ipaAudioList(w.wid, w.audio);
    return `${lm}<div class="ipa-cardplay" data-start="${Math.floor(Math.random() * Math.max(1, l.length))}">${ipaMiniMap(w)}${l.length ? '<canvas class="ipa-wave"></canvas>' : ''}${ipaSpkHtml(l)}</div>`;
  }
  return ipaMiniMap(w);
}
function ipaAfterCard(w, noAuto) {
  const root = document.getElementById('hoeCtx'); if (!root || !w) return;
  // 문제 카드: 원문 줄의 전사(틀의 .mt-source)와 파형을 누르면 그 낱말 소리
  const cp = root.querySelector('.ipa-cardplay');
  if (cp && w.audio !== undefined) {
    const l = ipaAudioList(w.wid, w.audio);
    if (l.length) {
      const start = +cp.dataset.start || 0;
      for (const el of [root.querySelector('.mt-source'), root.querySelector('.ipa-cardplay canvas')]) {
        if (!el) continue;
        el.dataset.list = l.join('|'); el.dataset.i = start; el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', '낱말 소리 듣기');
      }
    }
  }
  const cv = root.querySelector('.ipa-cardplay canvas');
  ipaTapBind(root, b => (b.closest('.ipa-ex, .ipa-learn') ? null : cv));
  // 두 전사·파형이 같은 차례를 쓰게 맞춘다
  const taps = [...root.querySelectorAll('.mt-source[data-list], .ipa-cardplay canvas[data-list]')];
  taps.forEach(t => t.addEventListener('click', () => taps.forEach(o => { if (o !== t) o.dataset.i = t.dataset.i; })));
  if (cv && cv.dataset.list) { const l = cv.dataset.list.split('|'); requestAnimationFrame(() => ipaWave(cv, l[(+cv.dataset.i || 0) % l.length], 0)); }
  const main = taps[0];
  if (!noAuto && w.listen && main) setTimeout(() => { ipaPlay(ipaBtnNext(main), cv); taps.forEach(o => { if (o !== main) o.dataset.i = main.dataset.i; }); }, 350);
  // 26.11.20 영신: 이름 대기는 '[기호] 한국어 이름은?' 줄과 '[기호] = ?'를 없애고, 글자 칸을 기호·작은 지도 바로 밑에 둔다.
  // 듣고 고르기는 '듣고 빈칸 소리의 이름을 친다' 같은 설명을 빼고 언어만 보인다(카드 자료의 뜻 줄은 발음 찾기 열쇠라 그대로 둔다)
  const mEl = document.getElementById('meaning');
  if (mEl) {
    mEl.style.display = w.nameq ? 'none' : '';
    if (w.listen) mEl.textContent = String(w.meaning || '').split(' · ')[0];
  }
  const src = root.querySelector('.mt-source'), reps = root.querySelector('.ipa-repsbox');
  if (src) src.removeAttribute('title');
  if (w.nameq && src && reps) { src.classList.add('ipa-nameans'); root.insertBefore(src, reps); }
  ipaNameLive();
  setTimeout(ipaNameLive, 0);  // 따라 치기로 들어갈 때 틀이 입력칸을 비운 뒤 다시 그린다
}

/* ---------- 언어 고르기(26.11.08 영신: "언어별로 따로 배울수 있게 하는것도 좋겠어. 그러니까 선택한 언어의 수만큼으로 가는거지.
   전체부터 한국어만 영어만 한국어 영어 일본어 이런식으로 고를수있게") ----------
   고른 언어의 낱말 카드만 남긴다. 이름 대기는 고른 언어의 대표 낱말만 보이고, 고른 언어에 없는 기호는 뺀다.
   고른 것은 브라우저에 기억하고, 바꾸면 다시 연다(틀이 처음 열 때 카드를 짜기 때문). */
function ipaLangSel() { try { const v = JSON.parse(localStorage.getItem('ipagoyang-langs') || 'null'); return Array.isArray(v) && v.length ? v : null; } catch (e) { return null; } }
function ipaLangSave(v) { try { if (v && v.length) localStorage.setItem('ipagoyang-langs', JSON.stringify(v)); else localStorage.removeItem('ipagoyang-langs'); } catch (e) {} location.reload(); }
function ipaFilterLessons(lessons) {
  const sel = ipaLangSel(); if (!sel) return;
  const keep = new Set(sel), litBy = {};
  for (const L of lessons) {
    const syms = new Set();
    for (const e of L.exercises) {
      e.words = e.words.filter(w => {
        if (w.reps) { w.reps = w.reps.filter(r => keep.has(r.lid)); if (!w.reps.length) return false; syms.add(ipaKey(w.sym)); return true; }
        if (w.lang) { if (!keep.has(w.lang)) return false; const t = (IPA.wordTarget || {})[w.wid]; if (t) syms.add(ipaKey(t)); return true; }
        return true;
      });
    }
    L.exercises = L.exercises.filter(e => e.words.length);
    litBy[L.lesson] = syms;
  }
  for (const b of IPA.bundles || []) b.lit = b.lit.filter(x => (litBy[b.lesson] || new Set()).has(ipaKey(x)));
  for (const k of Object.keys(IPA.examples || {})) IPA.examples[k] = IPA.examples[k].filter(e => !e.lid || keep.has(e.lid));
}
function ipaLangPanel() {
  const sel = ipaLangSel(), on = id => (sel ? sel.includes(id) : false);
  const n = (state.lessons || []).reduce((a, L) => a + L.exercises.reduce((b, e) => b + e.words.length, 0), 0);
  return `<div class="ipa-langs"><b>배울 언어</b><div class="ipa-lang-chips"><button type="button" data-lang="all" aria-pressed="${!sel}">전체</button>${(IPA.langs || []).map(l => `<button type="button" data-lang="${l.id}" aria-pressed="${on(l.id)}">${ipaEsc(l.ko)}</button>`).join('')}</div><small>${sel ? '고른 언어: ' + sel.map(id => ((IPA.langs || []).find(l => l.id === id) || {}).ko || id).join('·') : '모든 언어'} · 카드 ${n}장</small></div>`;
}
function ipaLangClick(id) {
  if (id === 'all') return ipaLangSave(null);
  const sel = ipaLangSel() || [];
  const next = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
  const order = (IPA.langs || []).map(l => l.id);
  ipaLangSave(next.sort((a, b) => order.indexOf(a) - order.indexOf(b)));
}

/* ---------- 카드 위 작은 지도(PRINCIPLES 8-9 ②) ----------
   문제를 푸는 동안에는 그 묶음의 칸들을 깜박인다(답 칸만 깜박이면 β/b처럼 줄이 다른 답이 새므로). 맞히면 답 칸이 금빛이 된다. */
function ipaCellOf(sym) {
  const b = ipaKey(sym), off = IPA_OFF_COLS.findIndex(v => v && v.includes(b));
  if (off >= 0) return {r: IPA_ROWS.length, c: off, span: 1};
  for (let r = 0; r < IPA_ROWS.length; r++) {
    let c = 0;
    for (const cell of IPA_ROWS[r].cells) {
      const span = (cell && cell.span) || 1;
      if (cell && (cell.v || cell).includes(b)) return {r, c, span};
      c += span;
    }
  }
  return null;
}
function ipaSymOf(w) {
  if (!w) return null;
  if (w.learn || w.sym) return w.sym;
  if (IPA.symbols[w.term]) return w.term;
  return (IPA.wordTarget || {})[w.wid] || null;
}
function ipaMiniMap(w, hit) {
  const bd = (IPA.bundles || []).find(b => b.lesson === w.b); if (!bd) return '';
  const cur = new Set(bd.lit.map(ipaCellOf).filter(Boolean).map(x => x.r + ':' + x.c));
  const h = hit ? ipaCellOf(hit) : null;
  let g = '';
  IPA_ROWS.forEach((row, r) => {
    let c = 0;
    for (const cell of row.cells) {
      const span = (cell && cell.span) || 1, k = r + ':' + c;
      const cls = !cell ? 'e' : (h && h.r === r && h.c === c) ? 'hit' : cur.has(k) ? 'cur' : '';
      g += `<i class="${cls}" style="grid-column:${c + 1}/span ${span};grid-row:${r + 1}"></i>`;
      c += span;
    }
  });
  const R = IPA_ROWS.length;
  IPA_OFF_COLS.forEach((v, c) => { if (v) g += `<i class="off ${h && h.r === R && h.c === c ? 'hit' : cur.has(R + ':' + c) ? 'cur' : ''}" style="grid-column:${c + 1};grid-row:${R + 2}"></i>`; });
  return `<div class="ipa-mini" role="button" tabindex="0" data-zoom="${w.b}" data-hit="${ipaEsc(hit || '')}" aria-label="IPA 표 크게 보기">${g}</div>`;
}
/* 작은 지도를 누르면 실제 IPA 자음표를 크게(26.11.08 영신: "해당 부분을 누르면 실제 ipa표를 확대해서 볼 수 있게").
   기호는 다 보인다(답을 가리지 않음: 묶음 칸 전체를 함께 표시). 배운 칸 금빛, 이번 강 칸 청록, 맞힌 답 칸 테두리. 기호를 누르면 기호 소리. */
function ipaZoomOpen(lesson, hit) {
  const bd = (IPA.bundles || []).find(b => b.lesson === +lesson);
  const cur = new Set(bd ? bd.lit : []), {set} = ipaLearned(), h = hit ? ipaKey(hit) : '';
  // 큰 표 머리 칸에 영어 낱말(26.11.25 PRINCIPLES 8-12: 이름 대기·영어를 배울 곳이 없었다)
  const colh = (k, i) => { const t = ipaT(k); return `<span class="ipa-col">${i + 1}<small>${ipaHeadText(t, ipaColLabel(t))}</small><small class="h">${ipaHanjaHtml(t.short_hanja || t.hanja || '')}</small><small class="en">${ipaEsc(t.en || '')}</small></span>`; };
  const zs = x => { const sy = IPA.symbols[x], snd = sy && sy.sound && ipaHasAudio(sy.sound) ? ipaTapAttrs(sy.sound, x + ' 소리') : ''; return `<span class="ipa-zs${set.has(x) ? ' on' : ''}${cur.has(x) ? ' cur' : ''}${x === h ? ' hit' : ''}"${snd}>${ipaEsc(x)}</span>`; };
  let g = `<div class="ipa-grid ipa-zoom-grid"><span></span>${IPA_COLS.map(colh).join('')}`;
  for (const r of IPA_ROWS) {
    const t = ipaT(r.ko);
    g += `<span class="ipa-rowh"><span>${ipaHeadText(t, ipaRowLabel(t))}</span><small class="h">${ipaHanjaHtml(t.hanja || '')}</small><small class="en">${ipaEsc(t.en || '')}</small></span>`;
    for (const c of r.cells) {
      if (c === null) { g += `<span class="ipa-cell empty"></span>`; continue; }
      const span = c.span || 1, v = c.v || c;
      g += `<span class="ipa-cell" style="grid-column:span ${span}">${v.map(zs).join('')}</span>`;
    }
  }
  g += `${IPA_OFF_HEAD}${ipaOffRow(zs)}</div>`;
  const ov = document.createElement('div');
  ov.className = 'ipa-zoom'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'IPA 자음표');
  ov.innerHTML = `<div class="ipa-zoom-in"><div class="ipa-zoom-h"><b>IPA 자음표(폐 기류)</b><button type="button" class="ipa-zoom-x" aria-label="닫기">✕</button></div>
    <div class="ipa-map-wrap">${g}</div>
    <p class="ipa-zoom-k"><span class="on">배운 칸</span><span class="cur">이번 강</span>${h ? '<span class="hit">맞힌 답</span>' : ''} · 가로는 입 앞(1 입술)에서 목 안(11 성문), 세로는 소리 내는 방법. 칸에 둘이면 앞(왼쪽·위)이 무성, 뒤(오른쪽·아래)가 유성. 표 밖 줄은 IPA 표에 칸이 없는 기호(자리는 위 열과 같다): ɕ는 '기타 기호'에 있고, 파찰음은 두 기호를 이어 적는다. 국제음성학회 IPA 표(2020, CC BY-SA 4.0)</p><p class="ipa-zoom-k ipa-zoom-gl">목청 말: 무성 voiceless · 유성 voiced · 유기 aspirated · 경음 tense. 영어 이름은 [목청] [자리] [방법] 차례(예: voiceless bilabial plosive)</p><p class="ipa-zoom-k ipa-zoom-cols">${IPA_COLS.map((k, i) => `${i + 1} ${ipaEsc(ipaT(k).en || '')}`).join(' · ')}</p></div>`;
  // 큰 표를 보는 동안은 카드 시간이 가지 않는다(표를 보는 것이 공부라서, 26.11.20 검토)
  const ss = (typeof state !== 'undefined') ? state.session : null;
  const hold = ss && !ss.answered ? setInterval(() => { if (state.session === ss && !ss.answered) ss.cardStart += 250; }, 250) : 0;
  const close = () => { clearInterval(hold); ov.remove(); document.removeEventListener('keydown', esc, true); if (typeof focusAnswerInput === 'function') focusAnswerInput(); };
  const esc = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.ipa-zoom-x')) close(); });
  document.addEventListener('keydown', esc, true);
  document.body.appendChild(ov);
  ipaTapBind(ov);
}
document.addEventListener('click', e => { const m = e.target.closest && e.target.closest('.ipa-mini[data-zoom]'); if (m) { e.preventDefault(); e.stopPropagation(); ipaZoomOpen(m.dataset.zoom, m.dataset.hit); } }, true);
document.addEventListener('keydown', e => { const m = e.target.closest && e.target.closest('.ipa-mini[data-zoom]'); if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ipaZoomOpen(m.dataset.zoom, m.dataset.hit); } }, true);

/* 맞히면 소리를 내는 차례대로 그림이 움직인다(PRINCIPLES 8-9 ①): 닫기 → 목청 → 터뜨림 → 울림.
   울림이 언제 시작하는지는 기호의 소리 시작 띠(vot) 값을 따른다: lead 처음부터, short 터뜨리자 바로, long 바람 뒤 */
const IPA_NEXT_MS = 2400;
function ipaOnCorrect(w) {
  const root = document.getElementById('hoeCtx'); const sym = ipaSymOf(w); const s = sym && IPA.symbols[sym];
  if (!root || !s) return;
  const mini = root.querySelector('.ipa-mini'); if (mini) mini.outerHTML = ipaMiniMap(w, sym);
  const bw = (IPA.byWord || {})[w.wid], sp = document.getElementById('catSpeech');
  if (bw && sp && !w.learn) { sp.textContent = bw; sp.hidden = false; }
  const where = {bilabial: '입술', alveolar: '혀끝·잇몸', dental: '혀끝·이', velar: '혀뒤·여린입천장', uvular: '혀뒤·목젖', labiodental: '아랫입술·윗니', palatal: '혀 몸통·입천장', postalveolar: '혀·잇몸 뒤', alveolopalatal: '혀 앞면·입천장 앞', retroflex: '혀끝·잇몸 뒤', glottal: '목청'}[s.place] || '입';
  const gl = ipaGlottisText(s);
  const steps = s.steps ? s.steps : s.vot
    ? [`${where} 닫기`, `목청: ${gl}`, /파찰음/.test(s.name) ? '천천히 떼며 갈이(마찰)' : '터뜨림', {lead: '울림(닫을 때부터)', short: '울림(바로)', long: '바람 뒤 울림'}[s.vot]]
    : [`${where} 좁히기`, '목청 울림', '틈으로 바람'];
  const el = document.createElement('div');
  el.className = `ipa-anim vot-${s.vot || 'cont'}`;
  el.innerHTML = `<div class="ipa-anim-fig">${ipaSagittal({...ipaSagOpts(s), anim: true})}</div><ol class="ipa-steps">${steps.map(t => `<li>${ipaEsc(t)}</li>`).join('')}</ol>`;
  // 기호와 답 칸은 제자리에 두고 그 아래에 띄운다(26.11.20 검토: 위에 끼우면 152px 밀렸다)
  const ans = root.querySelector('.ipa-nameans') || root.querySelector('.mt-source');
  if (ans) ans.after(el); else root.prepend(el);
}

/* ---------- 처음 화면: IPA 지도(주기율표 게임처럼 잠긴 칸이 다 보이고, 익힌 칸에 불이 들어온다) ---------- */
/* 열·줄 이름은 IPA 표 한국어판(Commons, CC BY-SA 3.0)을 따르고, 한자·영어는 data/terms.json */
const IPA_COLS = ['양순음', '순치음', '치음', '치경음', '후치경음', '권설음', '경구개음', '연구개음', '구개수음', '인두음', '성문음'];
/* 국제음성학회 IPA 표(2020, CC BY-SA 4.0)의 폐 기류 자음. 치·치경·후치경이 한 칸인 줄은 span 3 */
const IPA_ROWS = [
  {ko:'파열음', cells:[['p','b'],null,{span:3,v:['t','d']},['ʈ','ɖ'],['c','ɟ'],['k','ɡ'],['q','ɢ'],null,['ʔ']]},
  {ko:'비음', cells:[['m'],['ɱ'],{span:3,v:['n']},['ɳ'],['ɲ'],['ŋ'],['ɴ'],null,null]},
  {ko:'전동음', cells:[['ʙ'],null,{span:3,v:['r']},null,null,null,['ʀ'],null,null]},
  {ko:'탄음', cells:[null,['ⱱ'],{span:3,v:['ɾ']},['ɽ'],null,null,null,null,null]},
  {ko:'마찰음', cells:[['ɸ','β'],['f','v'],['θ','ð'],['s','z'],['ʃ','ʒ'],['ʂ','ʐ'],['ç','ʝ'],['x','ɣ'],['χ','ʁ'],['ħ','ʕ'],['h','ɦ']]},
  {ko:'설측 마찰음', cells:[null,null,{span:3,v:['ɬ','ɮ']},null,null,null,null,null,null]},
  {ko:'접근음', cells:[null,['ʋ'],{span:3,v:['ɹ']},['ɻ'],['j'],['ɰ'],null,null,null]},
  {ko:'설측 접근음', cells:[null,null,{span:3,v:['l']},['ɭ'],['ʎ'],['ʟ'],null,null,null]},
];
function ipaLearned() {
  const set = new Set(), current = new Set();
  for (const b of IPA.bundles || []) {
    let done = false;
    try {
      const L = state.lessons.find(l => l.lesson === b.lesson);
      done = !!(L && visEx(L).length && visEx(L).every(e => getRec(L.id, e.title)?.completed));
    } catch (e) {}
    for (const s of b.lit) (done ? set : current).add(s);
  }
  return {set, current};
}
let ipaPick = null;
/* IPA 지도 머리 칸: 한자어 이름, 그 밑에 한자. 순우리말 이름이 사전에 있으면 한자어 이름에 커서를 올리거나 누르면 뜬다
   (26.11.20 영신: 순우리말을 머리 칸에 바로 쓴 것을 되돌리고 "커서 놓으면 순우리말 표기가 있는경우 순우리말표기가 뜨는식으로").
   순우리말 이름과 출처는 data/terms.json native·native_source */
function ipaLessonOf(v) {
  const b = (IPA.bundles || []).find(x => (x.lit || []).includes(v) || (x.lit || []).includes(ipaKey(v)));
  return b ? `${b.lesson}강에서 배우는 기호(아직 다 익히지 않음)` : '아직 다 익히지 않은 기호';
}
function ipaColLabel(t) { return t.short || t.ko.replace(/음$/, ''); }
function ipaRowLabel(t) { return t.ko; }
function ipaHeadAria(t) { return [t.ko, t.hanja, t.en, t.native].filter(Boolean).join(' '); }
function ipaHeadText(t, label) { return t.native ? `<span class="ipa-gl ipa-gl-w" tabindex="0" data-g="${ipaEsc(t.native)}">${ipaEsc(label)}</span>` : ipaEsc(label); }
function ipaRenderMap() {
  const el = document.getElementById('ipaMap'); if (!el) return;
  const {set, current} = ipaLearned();
  const sym = v => {
    const on = set.has(v), cur = current.has(v);
    return `<button type="button" class="ipa-cell-s${on ? ' on' : ''}${cur ? ' cur' : ''}" data-s="${ipaEsc(v)}" aria-label="${ipaEsc(v)}">${ipaEsc(v)}</button>`;  // 26.11.27 영신: 처음부터 다 열어 둔다(잠긴 칸 없음)
  };
  const colh = (k, i) => { const t = ipaT(k); return `<button type="button" class="ipa-col" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(ipaHeadAria(t))}">${i + 1}<small>${ipaHeadText(t, ipaColLabel(t))}</small><small class="h">${ipaHanjaHtml(t.short_hanja || t.hanja || '')}</small></button>`; };
  const rowh = k => { const t = ipaT(k); return `<button type="button" class="ipa-rowh" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(ipaHeadAria(t))}"><span>${ipaHeadText(t, ipaRowLabel(t))}</span><small class="h">${ipaHanjaHtml(t.hanja || '')}</small></button>`; };
  let grid = `<div class="ipa-grid"><span></span>${IPA_COLS.map(colh).join('')}`;
  for (const r of IPA_ROWS) {
    grid += rowh(r.ko);
    for (const c of r.cells) {
      if (c === null) { grid += `<span class="ipa-cell empty"></span>`; continue; }
      const span = c.span || 1, v = c.v || c;
      grid += `<span class="ipa-cell" style="grid-column:span ${span}">${v.map(sym).join('')}</span>`;
    }
  }
  grid += `${IPA_OFF_HEAD}${ipaOffRow(sym)}</div>`;
  const lit = [...set].length, all = IPA_ROWS.reduce((a, r) => a + r.cells.filter(Boolean).reduce((b, c) => b + (c.v || c).length, 0), 0) + IPA_OFF.length;
  el.innerHTML = `<div class="phead"><div style="flex:1;min-width:0"><h2>IPA 입 지도</h2><small>입술(1)에서 목청(11)까지 · 켠 칸 ${lit}/${all} · 흐린 기호는 아직 강에서 다루지 않는 것 · 머리 칸을 누르면 용어 풀이</small></div></div>
    <div class="ipa-map-wrap">${grid}</div>
    <div class="ipa-dex" id="ipaDex"></div>
    ${ipaLangPanel()}
    <div class="ipa-pal">배색 ${IPA_PALS.map(([k, n]) => `<button type="button" data-pal="${k}" aria-label="${n}" title="${n}" aria-pressed="${ipaPalGet() === k}"></button>`).join('')}</div>
    <button type="button" class="ipa-credits-btn" id="ipaCreditsBtn">자료·녹음 출처</button>`;
  el.querySelectorAll('.ipa-pal button').forEach(b => b.onclick = () => ipaPalSet(b.dataset.pal));
  el.querySelectorAll('.ipa-langs button').forEach(b => b.onclick = () => ipaLangClick(b.dataset.lang));
  el.querySelectorAll('.ipa-cell-s').forEach(b => b.onclick = () => { ipaPick = b.dataset.s; ipaShowDex(); const sy = IPA.symbols[ipaPick]; if (sy && sy.sound && ipaHasAudio(sy.sound) && b.classList.contains('on')) ipaPlay(sy.sound); });
  el.querySelectorAll('[data-term]').forEach(b => b.onclick = () => ipaShowTerm(b.dataset.term));
  ipaShowDex();
}
function ipaShowDex() {
  const box = document.getElementById('ipaDex'); if (!box) return;
  const {set, current} = ipaLearned();
  const v = ipaPick || [...current][0] || [...set][0];
  if (!v) { box.innerHTML = ''; return; }
  const s = IPA.symbols[v];
  if (!s) {
    box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym">${ipaEsc(v)}</b><span><span class="nm">고양고양이</span> 이 기호는 아직 강에서 다루지 않는다고양. 표에서 자리만 보라고양.</span></div>`;
    return;
  }
  const words = (IPA.examples[v] || []).map(e => `<span class="ipa-chip">${ipaEsc(e.lang)} ${ipaWordHtml(e.text, e.ko)}${ipaChk(e.wid)}</span>`).join('');
  const snd = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, v + ' 기호 소리 듣기') : '';
  // '한국어와'·'다른 표기'는 배우기 카드를 뺀(26.11.08) 뒤로 화면 어디에도 안 나왔다(26.11.25 외솔 검토). PRINCIPLES 2-4의
  // '다른 관례는 다른 표기에 적는다'를 지키려고 지도 칸 설명(도감)에 되살린다. 카드 화면은 그대로(26.11.20 '레이아웃을 아껴씁시다')
  const more = (s.ko ? `<p class="ipa-dex-ko"><b>한국어와</b> ${ipaEsc(s.ko)}</p>` : '') + (s.other ? `<p class="ipa-other">다른 표기: ${ipaEsc(s.other)}</p>` : '');
  box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym"${snd}>${ipaEsc(v)}</b><span>${ipaNameHtml(s)}${set.has(v) ? '' : `<em>${ipaEsc(ipaLessonOf(v))}</em><br>`}${ipaEsc(s.how)}${more}</span></div>${words ? `<div class="ipa-chips">${words}</div>` : ''}`;
  ipaTapBind(box);
}
function ipaShowTerm(k) {
  const box = document.getElementById('ipaDex'); if (!box) return;
  const t = ipaT(k);
  const extra = [t.native ? `순우리말 ${ipaEsc(t.native)}` : '', t.note ? ipaEsc(t.note) : ''].filter(Boolean).join(' · ');
  box.innerHTML = `<div class="ipa-dex-in ipa-term"><b class="ipa-dex-sym ipa-term-h">${ipaHanjaHtml(t.hanja || '')}</b><span><b>${ipaEsc(t.ko)}</b><span class="ipa-en">${ipaEsc(t.en || '')}</span>${extra ? `<br><small>${extra}</small>` : ''}</span></div>`;
}

/* 기록 옮기기(고양 시리즈 공통, pipeline/record-transfer): 발음고양은 처음 화면과 게임이 한 장이라, 합친 뒤 다시 열어
   메모리에 남은 옛 진도가 합친 기록을 덮어쓰지 않게 한다(공통 코드는 고치지 않고 여기서 덧붙임) */
document.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('rtMerge'), st = document.getElementById('rtStatus');
  if (!b || !st) return;
  b.addEventListener('click', () => setTimeout(() => { if (st.classList.contains('ok')) location.replace(location.pathname + location.search); }, 1600));
});

/* 자료·녹음 출처(공개 배포 전 필수, PRINCIPLES 3): 처음 화면 맨 아래 단추로 연다. 녹음은 파일마다 만든 사람·라이선스·Commons 파일 페이지 */
const IPA_CREDITS_FIXED = [
  ['녹음', 'Wikimedia Commons·Lingua Libre·Shtooka. 아래 파일마다 만든 사람과 라이선스. mp3로 형식만 바꿨고 자르거나 다듬지 않았다.'],
  ['IPA 표', '국제음성학회(International Phonetic Association) IPA 표(IPA Kiel), CC BY-SA 4.0. 표의 한국어 이름은 IPA 표 한국어판(Benzenekim 번역, Wikimedia Commons), CC BY-SA 3.0.'],
  ['음소 목록', 'Steven Moran·Daniel McCloy 엮음, PHOIBLE 2.0(phoible.org), CC BY-SA 3.0. 언어마다 소리가 있는지 견줄 때 썼다.'],
  ['한자 뜻', '한국어 위키낱말사전(ko.wiktionary), CC BY-SA 4.0. 일부는 Unicode Unihan.'],
  ['발음 용어', '한자와 순우리말 이름은 표준국어대사전 표제어로 대조했다(뜻풀이는 옮기지 않음). 목안소리는 우리말샘.'],
  ['입 옆모습', 'Daniel McCloy, phonetics-teaching-assets, CC0 1.0. 좌우로 뒤집고 자리 점·바람·틈을 덧그렸다.'],
  ['글꼴', 'Balum IPA: Charis SIL 7.000(SIL Global)을 줄이고 이름을 바꾼 것, SIL Open Font License 1.1.'],
  ['게임 틀·고양고양이', '보카고양(STUDY1)에서 가져왔다.'],
];
function ipaCreditsOpen() {
  const groups = {};
  for (const c of IPA.credits || []) (groups[c.g] = groups[c.g] || []).push(c);
  const fixed = IPA_CREDITS_FIXED.map(([k, v]) => `<p><b>${ipaEsc(k)}</b> ${ipaEsc(v)}</p>`).join('');
  const recs = Object.entries(groups).map(([g, l]) => `<h4>${ipaEsc(g)} <small>${l.length}</small></h4><ul>${l.map(c => `<li><a href="${ipaEsc(c.p)}" target="_blank" rel="noopener">${ipaEsc(c.f)}</a> · ${ipaEsc(c.a)} · ${ipaEsc(c.l)}</li>`).join('')}</ul>`).join('');
  const ov = document.createElement('div');
  ov.className = 'ipa-zoom ipa-credits'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '자료·녹음 출처');
  ov.innerHTML = `<div class="ipa-zoom-in"><div class="ipa-zoom-top"><b>자료·녹음 출처</b><button type="button" class="ipa-zoom-x" aria-label="닫기">✕</button></div>${fixed}<p class="ipa-cr-n">녹음 ${(IPA.credits || []).length}개</p>${recs}</div>`;
  const esc = e => { if (e.key === 'Escape') close(); };
  const close = () => { ov.remove(); document.removeEventListener('keydown', esc, true); };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.ipa-zoom-x')) close(); });
  document.addEventListener('keydown', esc, true);
  document.body.append(ov);
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#ipaCreditsBtn')) ipaCreditsOpen(); });

/* ---------- 26.11.25 플레이테스트 뒤 고침(PRINCIPLES 8-12, 영신 "고칠것은 전부 추천대로!") ---------- */
// 맞힌 뒤: 하트는 더 빨리·연하게(가리지 않게), 설명을 읽을 시간은 늘린다(틀 손잡이 FX와 mtRevealDelay)
// 덧붙임 스크립트는 틀 스크립트보다 먼저 실린다: 틀 함수는 DOMContentLoaded 때 감싼다(revealInPlace와 같게)
document.addEventListener('DOMContentLoaded', () => {
try { FX.heartT = .55; FX.heartA = .7; } catch (e) {}
if (typeof mtRevealDelay === 'function') {
  mtRevealDelay = function (w) {
    const c = w && w.context; if (!c) return 3000;
    const chars = (c.translation || '').length + (c.note || '').length;
    return Math.min(state.session && state.session.round >= 2 ? 5000 : 9000, Math.max(3000, 1500 + chars * 60));
  };
}
});
// 오답 카드: 내가 친 답을 정답 밑에 흐리게 남기고 틀린 낱말만 빨갛게, 따라 칠 때 한 줄 안내. 판정은 그대로 엄하다
let ipaTyped = '';
document.addEventListener('DOMContentLoaded', () => { if (typeof submit === 'function') {
  const ipaOrigSubmit = submit;
  submit = function (opt = {}) {
    try { const s = state.session; if (s && !s.answered && !s.copyMode) ipaTyped = opt.timeout ? '' : String((document.getElementById('ainput') || {}).value || ''); } catch (e) {}
    return ipaOrigSubmit(opt);
  };
} });
function ipaMyAnswerHtml(w) {
  const raw = ipaTyped.trim();
  let mine = '';
  if (raw && w && w.names) {
    const ko = /[가-힣]/.test(raw), tok = x => ko ? (ipaKoTokens(x.replace(/[^가-힣]/g, '')) || []) : ipaEnTok(x);
    // 친 글과 가장 많이 겹치는 정답 이름에 견준다
    let best = null, bestN = -1;
    for (const pr of w.names) { const ref = tok(ko ? pr.ko : pr.en), n = tok(raw).filter(t => ref.includes(t)).length; if (n > bestN) { best = ref; bestN = n; } }
    mine = raw.split(/\s+/).map(word => { const t = tok(word), bad = !t.length || t.some(x => !(best || []).includes(x)); return `<span${bad ? ' class="bad"' : ''}>${ipaEsc(word)}</span>`; }).join(' ');
  }
  return `<div class="ipa-myans">${mine ? `<span class="k">내 답</span> ${mine}` : ''}<span class="ipa-copyhint">정답을 따라 치면 넘어간다</span></div>`;
}
document.addEventListener('ipa:aftercard', e => {
  const s = state.session; if (!s || !s.copyMode) return;
  const root = document.getElementById('hoeCtx'), bl = root && root.querySelector('.blanks');
  if (bl && !root.querySelector('.ipa-myans')) bl.insertAdjacentHTML('afterend', ipaMyAnswerHtml(e.detail));
});
// 처음 한 번만 뜨는 안내 세 줄(카드 화면에 설명 문구를 다시 넣지 않고, 26.11.20 결정은 그대로)
const IPA_GUIDE_KEY = 'ipagoyang-guide-v1';
function ipaGuideOnce() {
  try { if (localStorage.getItem(IPA_GUIDE_KEY)) return; } catch (e) { return; }
  const s = state.session; if (!s || s.answered || s.copyMode || document.querySelector('.ipa-guide')) return;
  const ov = document.createElement('div');
  ov.className = 'ipa-zoom ipa-guide'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '처음 하는 법');
  ov.innerHTML = `<div class="ipa-zoom-in ipa-guide-in"><b>처음이라면 세 가지만</b>
    <ol><li>위 기호의 <b>이름</b>을 친다(예: 무성 양순 파열음). 다 맞으면 저절로 넘어간다.</li>
    <li>모르면 기호 옆 <b>작은 지도</b>를 눌러 큰 표에서 찾는다.</li>
    <li>틀리면 정답이 뜬다. <b>그대로 따라 치면</b> 넘어간다.</li></ol>
    <button type="button" class="btn ipa-guide-ok">알겠다고양</button></div>`;
  const hold = setInterval(() => { if (state.session === s && !s.answered) s.cardStart += 250; }, 250);
  const close = () => { clearInterval(hold); ov.remove(); document.removeEventListener('keydown', key, true); try { localStorage.setItem(IPA_GUIDE_KEY, '1'); } catch (e) {} if (typeof focusAnswerInput === 'function') focusAnswerInput(); };
  const key = e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); close(); } };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.ipa-guide-ok')) close(); });
  document.addEventListener('keydown', key, true);
  document.body.appendChild(ov);
}
document.addEventListener('ipa:aftercard', e => { const w = e.detail; if (w && w.names && !w.learn) setTimeout(ipaGuideOnce, 0); });
// 처음 화면 위쪽에 늘 시작 단추: 진도가 없으면 '1강 시작', 있으면 틀의 '이어 하기'를 위로 올린다
function ipaHomeTop() {
    try {
      const rb = document.getElementById('resumeBtn'), row = document.querySelector('#homeScreen .catrow');
      if (rb && row && rb.previousElementSibling !== row) row.after(rb);
      if (rb && rb.hidden && state.lessons && state.lessons.length) {
        rb.hidden = false; rb.classList.add('ipa-start');
        rb.querySelector('.resume-heading > span').textContent = '▶ 1강 시작';
        const sub = document.getElementById('resumeSub'); if (sub) sub.textContent = `${state.lessons[0].id} · ${(state.lessons[0].exercises[0] || {}).title || ''}`;
        rb.onclick = () => { state.li = 0; openLesson(0); startExercise(0); };
      } else if (rb) { rb.classList.remove('ipa-start'); rb.querySelector('.resume-heading > span').textContent = '▶ 이어 하기'; }
    } catch (e) {}
}
document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderHome !== 'function') return;
  const ipaOrigRenderHome = renderHome;
  renderHome = function () { const r = ipaOrigRenderHome.apply(this, arguments); ipaHomeTop(); return r; };
  setTimeout(ipaHomeTop, 0);
});
// 카드를 그린 뒤 알림(오답 카드의 내 답 줄·처음 안내가 이것을 듣는다)
if (typeof ipaAfterCard === 'function') {
  const ipaOrigAfterCard = ipaAfterCard;
  ipaAfterCard = function (w, noAuto) { const r = ipaOrigAfterCard(w, noAuto); try { document.dispatchEvent(new CustomEvent('ipa:aftercard', {detail: w})); } catch (e) {} return r; };
}
// 연습 기록은 제목으로 저장된다(틀 getRec(강, 제목)). 26.11.25에 '듣고 고르기' → '듣고 이름 대기', 긴 판을 '… 1/2'처럼 나눴으므로
// 옛 제목으로 끝낸 기록을 새 판들에 옮긴다(옛 판 하나를 끝냈다 = 지금 그 판들을 다 끝냈다). 이미 하던 진도는 빼앗지 않는다.
// 다른 기기에서 옛 기록을 옮겨 와도 열 때마다 다시 맞춘다
function ipaMigrateTitles() {
  if (typeof state === 'undefined' || !state.progress || !state.lessons) return false;
  let changed = false;
  for (const L of state.lessons) {
    const rec = state.progress[L.id]; if (!rec) continue;
    const titles = (L.exercises || []).map(e => e.title);
    for (const [old, now] of [['듣고 고르기', '듣고 이름 대기'], ['전사 빈칸', '전사 빈칸']]) {
      if (!rec[old] || !rec[old].completed) continue;
      for (const t of titles) if (t !== old && t.startsWith(now) && !rec[t]) { rec[t] = {...rec[old]}; changed = true; }
    }
  }
  if (changed) { try { saveProgress(); } catch (e) {} }
  return changed;
}
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  if (ipaMigrateTitles() && document.getElementById('homeScreen')?.classList.contains('active') && typeof renderHome === 'function') renderHome();
}, 0));

/* ---------- 모음(PRINCIPLES 8-11, 26.11.25) ----------
   IPA 모음 사다리꼴. 높이 줄: 0 고 · 1 근고 · 2 중고 · 3 중 · 4 중저 · 5 근저 · 6 저. 앞뒤: f 전설 · nf 근전설 · c 중설 · nb 근후설 · b 후설.
   점 왼쪽이 평순, 오른쪽이 원순(IPA 표·한국어판 그대로). 자음 화면은 건드리지 않고 모음 기호일 때만 다르게 그린다 */
const IPA_VOWELS = [
  ['i', 0, 'f', 0], ['y', 0, 'f', 1], ['ɨ', 0, 'c', 0], ['ʉ', 0, 'c', 1], ['ɯ', 0, 'b', 0], ['u', 0, 'b', 1],
  ['ɪ', 1, 'nf', 0], ['ʏ', 1, 'nf', 1], ['ʊ', 1, 'nb', 1],
  ['e', 2, 'f', 0], ['ø', 2, 'f', 1], ['ɘ', 2, 'c', 0], ['ɵ', 2, 'c', 1], ['ɤ', 2, 'b', 0], ['o', 2, 'b', 1],
  ['ə', 3, 'c', -1],
  ['ɛ', 4, 'f', 0], ['œ', 4, 'f', 1], ['ɜ', 4, 'c', 0], ['ɞ', 4, 'c', 1], ['ʌ', 4, 'b', 0], ['ɔ', 4, 'b', 1],
  ['æ', 5, 'f', 0], ['ɐ', 5, 'c', -1],
  ['a', 6, 'f', 0], ['ɶ', 6, 'f', 1], ['ɑ', 6, 'b', 0], ['ɒ', 6, 'b', 1]];
const IPA_VSET = new Set(IPA_VOWELS.map(v => v[0]));
// 한국어 기준점: '이 게임이 그 모음을 적는 기호의 자리'(실제 소리의 자리라고 하지 않는다, 8-11)
const IPA_VKO = {i: 'ㅣ', 'ɯ': 'ㅡ', u: 'ㅜ'};
function ipaIsVowel(sym) { return IPA_VSET.has(ipaBase(sym)) && !!(IPA.symbols[sym] || {}).height || IPA_VSET.has(sym); }
function ipaVx(r, b) {
  const f = r * .25, c = 1.5 + r * .125, back = 3;
  return {f, c, b: back, nf: f + (c - f) * .35, nb: back - (back - c) * .35}[b];
}
const IPA_VG = {W: 100, H: 22, P: 26};
function ipaVowelSvg(o = {}) {
  const {W, H} = IPA_VG, P = o.small ? 6 : IPA_VG.P, X = x => P + x * W, Y = r => P + r * H;
  const lit = o.lit || new Set(), cur = o.cur || new Set(), hit = o.hit || '', small = !!o.small;
  let s = '';
  const ln = (x1, y1, x2, y2) => `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" class="ipa-vl"/>`;
  s += ln(0, 0, 3, 0) + ln(ipaVx(2, 'f'), 2, 3, 2) + ln(ipaVx(4, 'f'), 4, 3, 4) + ln(ipaVx(6, 'f'), 6, 3, 6);
  s += ln(0, 0, ipaVx(6, 'f'), 6) + ln(1.5, 0, ipaVx(6, 'c'), 6) + ln(3, 0, 3, 6);
  const off = small ? 9 : 14;
  for (const [v, r, b, rd] of IPA_VOWELS) {
    const cx = X(ipaVx(r, b)), cy = Y(r), on = lit.has(v), cu = cur.has(v), h = v === hit;
    if (rd !== -1 && !(rd === 1 && IPA_VOWELS.some(z => z[1] === r && z[2] === b && z[3] === 0)) && !(b === 'nf' || b === 'nb')) s += '';
    const tx = rd === -1 ? cx : rd === 0 ? cx - off : cx + off;
    if (rd !== -1 && (b !== 'nf' && b !== 'nb')) s += `<circle cx="${cx}" cy="${cy}" r="${small ? 1.6 : 2.4}" class="ipa-vdot"/>`;
    if (small) { if (on || cu || h) s += `<circle cx="${tx}" cy="${cy}" r="${h ? 6 : 4.5}" class="ipa-vm${h ? ' hit' : cu ? ' cur' : ' on'}"/>`; continue; }
    const cls = `ipa-vs${on ? ' on' : ''}${cu ? ' cur' : ''}${h ? ' hit' : ''}`;
    const show = true;  // 26.11.27 영신: 처음부터 다 열어 둔다
    s += `<g class="${cls}" data-s="${ipaEsc(v)}" role="button" tabindex="0" aria-label="${ipaEsc(v)}"><circle cx="${tx}" cy="${cy}" r="11" class="ipa-vhit"/><text x="${tx}" y="${cy + 5}" text-anchor="middle">${ipaEsc(show ? v : '·')}</text></g>`;
    if (!small && IPA_VKO[v] && o.ko !== false) s += `<text x="${tx}" y="${cy - 12}" text-anchor="middle" class="ipa-vko">${IPA_VKO[v]}</text>`;
  }
  const w = P * 2 + 3 * W, hgt = P * 2 + 6 * H;
  return `<svg class="ipa-vmap${small ? ' sm' : ''}" viewBox="0 0 ${w} ${hgt}" role="img" aria-label="IPA 모음 사다리꼴">${s}</svg>`;
}
function ipaVowelHeads() {
  // 머리 칸을 사다리꼴 선의 실제 자리에 맞춘다(그림 크기에 따라 %로)
  const {W, H, P} = IPA_VG, tw = 2 * P + 3 * W, th6 = 2 * P + 6 * H;
  const colPos = [P, P + 1.5 * W, P + 3 * W].map(x => x / tw * 100), rowPos = [0, 2, 4, 6].map(r => (P + r * H) / th6 * 100);
  const th = (k, style) => { const t = ipaT(k); return `<span class="ipa-vh" style="${style}" data-term="${ipaEsc(k)}">${ipaHeadText(t, t.short || t.ko.replace(/ ?모음$/, ''))}<small class="h">${ipaHanjaHtml(t.short_hanja || t.hanja || '')}</small><small class="en">${ipaEsc(t.en || '')}</small></span>`; };
  return {cols: ['전설 모음', '중설 모음', '후설 모음'].map((k, i) => th(k, `left:${colPos[i].toFixed(1)}%`)).join(''), rows: ['고모음', '중고모음', '중저모음', '저모음'].map((k, i) => th(k, `top:${rowPos[i].toFixed(1)}%`)).join('')};
}
function ipaVowelPanel(set, current, all) {
  const h = ipaVowelHeads();
  return `<div class="ipa-vwrap"><h3>모음 지도</h3><div class="ipa-vcols">${h.cols}</div><div class="ipa-vbody"><div class="ipa-vrows">${h.rows}</div>${ipaVowelSvg({lit: set, cur: current, all})}</div>
    <small class="ipa-vnote">점 왼쪽 평순, 오른쪽 원순. 옅은 한글은 이 게임이 한국어 ㅣ·ㅡ·ㅜ를 적는 기호의 자리(실제 소리의 자리를 잰 것은 아니다).</small></div>`;
}
// 그림: 혀 옆모습(모음은 자리 점·바람 없이), 입술 앞모습(Claude 모식도: 편·둥글게 내민·위아래로 좁힌)
function ipaLips(kind) {
  const k = kind || 'spread';
  const shape = {spread: 'M8,25 Q35,13 62,25 Q35,37 8,25 Z', rounded: 'M22,25 Q35,8 48,25 Q35,42 22,25 Z', compressed: 'M14,25 Q35,19 56,25 Q35,31 14,25 Z'}[k] || '';
  const hole = {spread: 'M16,25 Q35,21 54,25 Q35,29 16,25 Z', rounded: 'M29,25 Q35,17 41,25 Q35,33 29,25 Z', compressed: 'M22,25 Q35,24 48,25 Q35,26 22,25 Z'}[k] || '';
  const label = {spread: '편 입술', rounded: '둥글게 내민 입술', compressed: '위아래로 좁힌 입술'}[k];
  return `<svg class="ipa-lips" viewBox="0 0 70 50" role="img" aria-label="입술 앞모습(모식도): ${label}"><rect x="1" y="1" width="68" height="48" rx="8" fill="var(--ipa-cav)" stroke="var(--line)"/><path d="${shape}" fill="var(--ipa-tongue)"/><path d="${hole}" fill="#0b0b16"/></svg>`;
}
function ipaLipsKind(s) { return s.lips_front || (s.rounded ? 'rounded' : 'spread'); }
const IPA_LIPS_KO = {spread: '편 입술', rounded: '둥글게 내민 입술', compressed: '위아래로 좁힌 입술'};
{
  const origSag = ipaSagOpts;
  ipaSagOpts = function (s) { return s && s.height ? {shape: s.sagittal || 'neutral', place: null, near: false, voiced: true, puff: false} : origSag(s); };
  const origMini = ipaLearnMini;
  ipaLearnMini = function (sym) {
    const s = IPA.symbols[sym]; if (!s || !s.height) return origMini(sym);
    const note = s.sagittal === 'v_barred_i' ? ' · 혀는 [i]와 [u] 사이로 그린 것' : '';
    return `<div class="ipa-lmini"><div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>혀 옆모습${note}</i></div><div>${ipaLips(ipaLipsKind(s))}<i>입술 앞모습(모식도): ${ipaEsc(IPA_LIPS_KO[ipaLipsKind(s)] || '')}</i></div></div><p>${ipaEsc(s.how)}</p></div>`;
  };
  const origMiniMap = ipaMiniMap;
  ipaMiniMap = function (w, hit) {
    const bd = (IPA.bundles || []).find(b => b.lesson === w.b);
    if (!bd || !bd.vowel) return origMiniMap(w, hit);
    return `<div class="ipa-mini ipa-vmini" role="button" tabindex="0" data-zoom="${w.b}" data-hit="${ipaEsc(hit || '')}" aria-label="IPA 모음표 크게 보기">${ipaVowelSvg({small: true, cur: new Set(bd.lit), hit: hit || ''})}</div>`;
  };
  const origZoom = ipaZoomOpen;
  ipaZoomOpen = function (lesson, hit) {
    const bd = (IPA.bundles || []).find(b => b.lesson === +lesson);
    if (!bd || !bd.vowel) return origZoom(lesson, hit);
    const {set} = ipaLearned();
    const ov = document.createElement('div');
    ov.className = 'ipa-zoom'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'IPA 모음표');
    const h = ipaVowelHeads();
    ov.innerHTML = `<div class="ipa-zoom-in"><div class="ipa-zoom-h"><b>IPA 모음표</b><button type="button" class="ipa-zoom-x" aria-label="닫기">✕</button></div>
      <div class="ipa-vwrap"><div class="ipa-vcols">${h.cols}</div><div class="ipa-vbody"><div class="ipa-vrows">${h.rows}</div>${ipaVowelSvg({lit: set, cur: new Set(bd.lit), hit: hit || '', all: true})}</div></div>
      <p class="ipa-zoom-k"><span class="on">배운 칸</span><span class="cur">이번 강</span>${hit ? '<span class="hit">맞힌 답</span>' : ''} · 가로는 혀의 높은 곳이 앞(전설)에서 뒤(후설)로, 세로는 혀 높이(고모음에서 저모음). 점 왼쪽이 평순, 오른쪽이 원순. 옅은 한글은 이 게임이 한국어 모음을 적는 기호의 자리. 국제음성학회 IPA 표(2020, CC BY-SA 4.0), 한국어 이름은 IPA 표 한국어판</p>
      <p class="ipa-zoom-k ipa-zoom-gl">영어 이름은 [높이] [앞뒤] [입술] 차례: close · close-mid · open-mid · open / front · central · back / unrounded · rounded + vowel(예: close front unrounded vowel)</p></div>`;
    const ss = (typeof state !== 'undefined') ? state.session : null;
    const hold = ss && !ss.answered ? setInterval(() => { if (state.session === ss && !ss.answered) ss.cardStart += 250; }, 250) : 0;
    const close = () => { clearInterval(hold); ov.remove(); document.removeEventListener('keydown', esc, true); if (typeof focusAnswerInput === 'function') focusAnswerInput(); };
    const esc = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.ipa-zoom-x')) close(); });
    document.addEventListener('keydown', esc, true);
    document.body.appendChild(ov);
    ov.querySelectorAll('.ipa-vs').forEach(g => { const sy = IPA.symbols[g.dataset.s]; if (sy && sy.sound && ipaHasAudio(sy.sound)) g.onclick = () => ipaPlay(sy.sound); });
  };
  const origRender = ipaRenderMap;
  ipaRenderMap = function () {
    origRender();
    const el = document.getElementById('ipaMap'); if (!el || !(IPA.bundles || []).some(b => b.vowel)) return;
    const {set, current} = ipaLearned();
    const wrap = el.querySelector('.ipa-map-wrap'); if (!wrap) return;
    wrap.insertAdjacentHTML('afterend', ipaVowelPanel(set, current));
    el.querySelectorAll('.ipa-vs').forEach(g => { const pick = () => { ipaPick = g.dataset.s; ipaShowDex(); const sy = IPA.symbols[ipaPick]; if (sy && sy.sound && ipaHasAudio(sy.sound) && g.classList.contains('on')) ipaPlay(sy.sound); }; g.onclick = pick; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }; });
    el.querySelectorAll('.ipa-vwrap [data-term]').forEach(b => b.onclick = () => ipaShowTerm(b.dataset.term));
  };
}

document.addEventListener('ipa:aftercard', e => {
  const w = e.detail, root = document.getElementById('hoeCtx');
  if (!w || !w.wid || !root || root.querySelector('.ipa-chkline') || !ipaChk(w.wid)) return;
  root.insertAdjacentHTML('beforeend', '<p class="ipa-chkline">이 낱말 자료는 <b>확인 필요</b>: 문헌끼리 다르거나 1차 출처를 아직 못 봤다. 확인되면 고친다.</p>');
});
