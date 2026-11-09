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
   카드의 mode: ko(한국어 이름) · en(영어 이름) · any(어느 쪽이든, 듣고 고르기·전사 빈칸). 맞으면 나머지 둘(한자 포함)이 뜬다.
   낱말 순서·띄어쓰기는 묻지 않고, 사전 동의어는 인정한다. */
const IPA_NAME_SYN = {'폐쇄음': '파열음', '된소리': '경음', '거센소리': '유기', '격음': '유기', '탄설음': '탄음', 'stop': 'plosive', 'fortis': 'tense', 'flap': 'tap'};
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
  while (rest) { const t = ipaKoVocab.find(x => rest.startsWith(x)); if (!t) return null; out.push(IPA_NAME_SYN[t] || t); rest = rest.slice(t.length); }
  return out;
}
function ipaSplitName(raw) {
  const ko = (String(raw).match(/[가-힣ㄱ-ㅎㅏ-ㅣ]+/g) || []).join('');
  const en = (String(raw).toLowerCase().match(/[a-z]+/g) || []).map(x => IPA_NAME_SYN[x] || x);
  return {ko: ko ? ipaKoTokens(ko) : null, en};
}
function ipaSame(a, b) { return !!(a && b && a.length && a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ')); }
function ipaNameState(raw, w) {
  const {ko, en} = ipaSplitName(raw);
  let koHit = null, enHit = null, both = null;
  for (const pr of w.names || []) {
    // 정답 쪽도 친 글과 같은 방식으로 쪼갠다(설측 접근음 / 설측접근음이 같게 되도록)
    const k = ipaSame(ko, ipaKoTokens(pr.ko)), e = ipaSame(en, pr.en.toLowerCase().match(/[a-z]+/g).map(x => IPA_NAME_SYN[x] || x));
    if (k && !koHit) koHit = pr;
    if (e && !enHit) enHit = pr;
    if (k && e) { both = pr; koHit = pr; enHit = pr; break; }
  }
  const mode = w.mode || 'both';
  const hit = mode === 'ko' ? koHit : mode === 'en' ? enHit : mode === 'any' ? (koHit || enHit) : both;
  return {koHit, enHit, both, hit, pass: !!hit};
}
const IPA_MODE_ASK = {ko: '한국어 이름을 친다', en: '영어 이름을 친다', any: '한국어나 영어 이름을 친다', both: '한국어 + 영어 이름을 친다'};
function ipaNameLive() {
  const el = document.getElementById('ipaNameCheck'), w = ipaCurWord(), s = state.session;
  if (!el || !w || !w.names) return;
  const raw = (document.getElementById('ainput') || {}).value || '';
  const st = ipaNameState(raw, w);
  const ty = document.getElementById('ipaTyped');
  if (ty) ty.innerHTML = raw ? ipaEsc(raw) + (s.answered && !s.copyMode ? '' : '<span class="caret"></span>') : '';
  // 맞으면 세 이름(한국어·한자·영어)을 다 보인다
  el.innerHTML = st.hit
    ? `<span class="ok trio"><b>${ipaEsc(st.hit.ko)}</b><em>${ipaHanjaHtml(st.hit.hanja)}</em><i>${ipaEsc(st.hit.en)}</i></span>`
    : '';
  if (ty) ty.dataset.ask = IPA_MODE_ASK[w.mode || 'both'];
  // 맞으면 Enter 없이 넘긴다(틀린 답은 Enter로만 낸다)
  if (st.pass && !s.answered && !s.copyMode && !state.composing) {
    clearTimeout(ipaNameLive.t);
    ipaNameLive.t = setTimeout(() => { const s2 = state.session; if (s2 === s && !s2.answered && !s2.copyMode && ipaIn(document.getElementById('ainput').value) === w.term) submit(); }, 450);
  }
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'ainput') ipaNameLive(); }, true);
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
  // 명칭 카드는 칸 수로 답이 새지 않게(유기·경음이 붙으면 낱말이 하나 는다) 친 글자 + 빈칸 하나만 보인다
  const w = ipaCurWord(), ss = (typeof state !== 'undefined') ? state.session : null;
  if (w && w.names && ss && !ss.copyMode && !ss.answered && value === w.term) {
    const typed = (document.getElementById('ainput') || {}).value || '';
    return ipaBlankPartsRaw(typed + 'x');
  }
  return ipaBlankPartsRaw(value);
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
const IPA_SAG_AT = {bilabial: [157, 137], alveolar: [147, 129], dental: [151, 136], velar: [106, 130], uvular: [93, 137], glottis: [101, 205]};
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
function ipaWordHtml(text, gloss) {
  return gloss && gloss !== text ? `<span class="ipa-gl ipa-gl-w" tabindex="0" data-g="${ipaEsc(gloss)}">${ipaEsc(text)}</span>` : ipaEsc(text);
}
document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('.ipa-gl');
  document.querySelectorAll('.ipa-gl.show').forEach(x => { if (x !== g) x.classList.remove('show'); });
  if (g) g.classList.toggle('show');
}, true);
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
  return l.length > 1 ? `<span class="ipa-spk" aria-live="polite">목소리 ${l.length}명 · 기호를 누를 때마다 바뀐다</span>` : (l.length ? '<span class="ipa-spk">기호를 누르면 소리</span>' : '<span class="ipa-soon">녹음 준비 중</span>');
}
function ipaBtnNext(b) {
  const l = b.dataset.list.split('|'); let i = +b.dataset.i || 0; const id = l[i % l.length];
  b.dataset.i = (i + 1) % l.length;
  const card = b.closest('#hoeCtx, .ipa-dex') || document;
  const sp = b.closest('.ipa-ex') ? null : card.querySelector('.ipa-cardplay .ipa-spk');
  if (sp && l.length > 1) sp.textContent = `목소리 ${(i % l.length) + 1}/${l.length}` + ((IPA.audio[id] || {}).speaker ? ` · ${IPA.audio[id].speaker}` : '');
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
  return `<div class="ipa-lmini">${ipaNameHtml(s)}<div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>입 옆모습</i></div><div>${ipaGlottis(s.glottis)}<i>목청: ${ipaEsc((IPA.glottis || {})[s.glottis] || '')}</i></div></div><p>${ipaEsc(s.how)}</p></div>`;
}
function ipaBeforeCard(w) {
  if (!w) return '';
  const copying = (() => { try { return !!state.session.copyMode; } catch (e) { return false; } })();
  const lm = copying ? ipaLearnMini(ipaSymOf(w)) : '';
  if (w.learn) {
    const s = IPA.symbols[w.sym] || {};
    const ex = (IPA.examples[w.sym] || []).map(e => { const l = ipaAudioList(e.wid, e.audio); return `<div class="ipa-ex"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaWordHtml(e.text, e.ko)}</span><span class="ipa-tr"${ipaTapAttrs(l, e.text + ' 듣기')}>[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span><span class="ipa-exn">${l.length > 1 ? '×' + l.length : l.length ? '' : '녹음 없음'}</span></div>`; }).join('');
    const symTap = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, w.sym + ' 기호 소리 듣기') : '';
    return `<div class="ipa-learn">
      <div class="ipa-big"><span${symTap}>${ipaEsc(w.sym === 'β' ? 'β β̞' : w.sym === 'ð' ? 'ð ð̞' : w.sym)}</span></div>
      ${symTap ? '<div class="ipa-symhint">기호를 누르면 소리(시범 녹음)</div>' : '<div class="ipa-symhint">이 기호 하나의 녹음은 아직 없다. 아래 낱말 전사를 누르면 낱말 소리</div>'}
      ${ipaNameHtml(s)}
      ${ipaMiniMap(w)}
      <div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>입 옆모습${s.lips === 'near' ? ' · 틈은 덧그림' : ''}</i></div><div>${ipaGlottis(s.glottis)}<i>목청 = ${ipaTermInline('성대')}: ${ipaEsc((IPA.glottis || {})[s.glottis] || '')}</i></div></div>
      ${s.vot ? `<div class="ipa-vot">${ipaVot(s.vot)}<i>소리 시작 띠 = ${ipaTermInline('성대 진동 개시 시간')}: ${ipaEsc((IPA.vot || {})[s.vot] || '')}</i></div>` : ''}
      <p>${ipaEsc(s.how)}</p><p><b>한국어와</b> ${ipaEsc(s.ko)}</p>${s.other ? `<p class="ipa-other">다른 표기: ${ipaEsc(s.other)}</p>` : ''}
      ${ex ? `<div class="ipa-exs">${ex}</div>` : ''}
      <p class="ipa-code">치는 것: 한글 이름과 영어 이름 둘 다(순서·띄어쓰기 자유). 한글이 맞으면 한자가 뜬다.</p>
      <div class="ipa-typed" id="ipaTyped" aria-live="polite"></div><div class="ipa-namecheck" id="ipaNameCheck"></div>
    </div>`;
  }
  if (w.nameq) {
    // 이름 대기: 보카고양의 예문처럼 기호를 대표 낱말 속에 보인다(한국어·영어·스페인어·그 밖 차례, 26.11.08 영신)
    const rows = (w.reps || []).map(e => { const l = ipaAudioList(e.wid); return `<div class="ipa-rep"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaWordHtml(e.text, e.ko)}</span><span class="ipa-tr"${ipaTapAttrs(l, e.text + ' 듣기')}>[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span></div>`; }).join('');
    const s = IPA.symbols[w.sym] || {};
    const symTap = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, w.sym + ' 기호 소리 듣기') : '';
    return `${lm}<div class="ipa-nameq"><div class="ipa-big"><span${symTap}>${ipaEsc(w.sym)}</span></div>${ipaMiniMap(w)}<div class="ipa-reps">${rows || '<div class="ipa-soon">대표 낱말 없음</div>'}</div><div class="ipa-symhint">전사를 누르면 낱말 소리${symTap ? ', 기호를 누르면 기호 소리' : ''}</div></div><div class="ipa-typed" id="ipaTyped" aria-live="polite"></div><div class="ipa-namecheck" id="ipaNameCheck"></div>`;
  }
  if (w.audio !== undefined) {
    const l = ipaAudioList(w.wid, w.audio);
    return `${lm}<div class="ipa-cardplay" data-start="${Math.floor(Math.random() * Math.max(1, l.length))}">${ipaMiniMap(w)}${l.length ? '<canvas class="ipa-wave"></canvas>' : ''}${ipaSpkHtml(l)}</div>${w.names ? '<div class="ipa-typed" id="ipaTyped" aria-live="polite"></div><div class="ipa-namecheck" id="ipaNameCheck"></div>' : ''}`;
  }
  return ipaMiniMap(w) + (w.names ? '<div class="ipa-typed" id="ipaTyped" aria-live="polite"></div><div class="ipa-namecheck" id="ipaNameCheck"></div>' : '');
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
  // 친 이름 줄과 맞음 표시는 원문 줄(전사) 아래로
  const ty = root.querySelector('#ipaTyped'), nc = root.querySelector('#ipaNameCheck');
  if (ty && nc && !root.querySelector('.ipa-learn')) root.append(ty, nc);
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
        if (w.reps) { w.reps = w.reps.filter(r => keep.has(r.lid)); if (!w.reps.length) return false; syms.add(ipaBase(w.sym)); return true; }
        if (w.lang) { if (!keep.has(w.lang)) return false; const t = (IPA.wordTarget || {})[w.wid]; if (t) syms.add(ipaBase(t)); return true; }
        return true;
      });
    }
    L.exercises = L.exercises.filter(e => e.words.length);
    litBy[L.lesson] = syms;
  }
  for (const b of IPA.bundles || []) b.lit = b.lit.filter(x => (litBy[b.lesson] || new Set()).has(ipaBase(x)));
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
  const b = ipaBase(sym);
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
  return `<div class="ipa-mini" role="button" tabindex="0" data-zoom="${w.b}" data-hit="${ipaEsc(hit || '')}" aria-label="IPA 표 크게 보기">${g}</div>`;
}
/* 작은 지도를 누르면 실제 IPA 자음표를 크게(26.11.08 영신: "해당 부분을 누르면 실제 ipa표를 확대해서 볼 수 있게").
   기호는 다 보인다(답을 가리지 않음: 묶음 칸 전체를 함께 표시). 배운 칸 금빛, 지금 묶음 칸 청록, 맞힌 답 칸 테두리. 기호를 누르면 기호 소리. */
function ipaZoomOpen(lesson, hit) {
  const bd = (IPA.bundles || []).find(b => b.lesson === +lesson);
  const cur = new Set(bd ? bd.lit : []), {set} = ipaLearned(), h = hit ? ipaBase(hit) : '';
  const colh = (k, i) => { const t = ipaT(k); return `<span class="ipa-col">${i + 1}<small>${ipaEsc(t.short || t.ko.replace(/음$/, ''))}</small><small class="h">${ipaHanjaHtml(t.short_hanja || t.hanja || '')}</small></span>`; };
  let g = `<div class="ipa-grid ipa-zoom-grid"><span></span>${IPA_COLS.map(colh).join('')}`;
  for (const r of IPA_ROWS) {
    const t = ipaT(r.ko);
    g += `<span class="ipa-rowh"><span>${ipaEsc(t.ko)}</span><small class="h">${ipaHanjaHtml(t.hanja || '')}</small></span>`;
    for (const c of r.cells) {
      if (c === null) { g += `<span class="ipa-cell empty"></span>`; continue; }
      const span = c.span || 1, v = c.v || c;
      g += `<span class="ipa-cell" style="grid-column:span ${span}">${v.map(x => { const sy = IPA.symbols[x], snd = sy && sy.sound && ipaHasAudio(sy.sound) ? ipaTapAttrs(sy.sound, x + ' 소리') : ''; return `<span class="ipa-zs${set.has(x) ? ' on' : ''}${cur.has(x) ? ' cur' : ''}${x === h ? ' hit' : ''}"${snd}>${ipaEsc(x)}</span>`; }).join('')}</span>`;
    }
  }
  g += '</div>';
  const ov = document.createElement('div');
  ov.className = 'ipa-zoom'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'IPA 자음표');
  ov.innerHTML = `<div class="ipa-zoom-in"><div class="ipa-zoom-h"><b>IPA 자음표(폐 기류)</b><button type="button" class="ipa-zoom-x" aria-label="닫기">✕</button></div>
    <div class="ipa-map-wrap">${g}</div>
    <p class="ipa-zoom-k"><span class="on">배운 칸</span><span class="cur">지금 묶음</span>${h ? '<span class="hit">맞힌 답</span>' : ''} · 가로는 입 앞(1 입술)에서 목 안(11 성문), 세로는 소리 내는 방법. 칸에 둘이면 앞(왼쪽·위)이 무성, 뒤(오른쪽·아래)가 유성. 국제음성학회 IPA 표(2020, CC BY-SA 4.0)</p></div>`;
  const close = () => { ov.remove(); document.removeEventListener('keydown', esc, true); if (typeof focusAnswerInput === 'function') focusAnswerInput(); };
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
  const where = {bilabial: '입술', alveolar: '혀끝·잇몸', dental: '혀끝·이', velar: '혀뒤·여린입천장', uvular: '혀뒤·목젖'}[s.place] || '입';
  const gl = (IPA.glottis || {})[s.glottis] || '';
  const steps = s.steps ? s.steps : s.vot
    ? [`${where} 닫기`, `목청: ${gl}`, '터뜨림', {lead: '울림(닫을 때부터)', short: '울림(바로)', long: '바람 뒤 울림'}[s.vot]]
    : [`${where} 좁히기`, '목청 울림', '틈으로 바람'];
  const el = document.createElement('div');
  el.className = `ipa-anim vot-${s.vot || 'cont'}`;
  el.innerHTML = `<div class="ipa-anim-fig">${ipaSagittal({...ipaSagOpts(s), anim: true})}</div><ol class="ipa-steps">${steps.map(t => `<li>${ipaEsc(t)}</li>`).join('')}</ol>`;
  root.prepend(el);
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
function ipaRenderMap() {
  const el = document.getElementById('ipaMap'); if (!el) return;
  const {set, current} = ipaLearned();
  const sym = v => {
    const on = set.has(v), cur = current.has(v);
    return `<button type="button" class="ipa-cell-s${on ? ' on' : ''}${cur ? ' cur' : ''}" data-s="${ipaEsc(v)}" aria-label="${ipaEsc(on ? v : '잠긴 칸')}">${on || cur ? ipaEsc(v) : '·'}</button>`;
  };
  const colh = (k, i) => { const t = ipaT(k); return `<button type="button" class="ipa-col" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(t.ko + ' ' + (t.hanja || '') + ' ' + (t.en || ''))}">${i + 1}<small>${ipaEsc(t.short || t.ko.replace(/음$/, ''))}</small><small class="h">${ipaHanjaHtml(t.short_hanja || t.hanja || '')}</small></button>`; };
  const rowh = k => { const t = ipaT(k); return `<button type="button" class="ipa-rowh" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(t.ko + ' ' + (t.hanja || '') + ' ' + (t.en || ''))}"><span>${ipaEsc(t.ko)}</span><small class="h">${ipaHanjaHtml(t.hanja || '')}</small></button>`; };
  let grid = `<div class="ipa-grid"><span></span>${IPA_COLS.map(colh).join('')}`;
  for (const r of IPA_ROWS) {
    grid += rowh(r.ko);
    for (const c of r.cells) {
      if (c === null) { grid += `<span class="ipa-cell empty"></span>`; continue; }
      const span = c.span || 1, v = c.v || c;
      grid += `<span class="ipa-cell" style="grid-column:span ${span}">${v.map(sym).join('')}</span>`;
    }
  }
  grid += '</div>';
  const lit = [...set].length, all = IPA_ROWS.reduce((a, r) => a + r.cells.filter(Boolean).reduce((b, c) => b + (c.v || c).length, 0), 0);
  el.innerHTML = `<div class="phead"><div style="flex:1;min-width:0"><h2>IPA 입 지도</h2><small>입술(1)에서 목청(11)까지 · 켠 칸 ${lit}/${all} · 점은 잠긴 칸 · 머리 칸을 누르면 용어 풀이</small></div></div>
    <div class="ipa-map-wrap">${grid}</div>
    <div class="ipa-dex" id="ipaDex"></div>
    ${ipaLangPanel()}
    <div class="ipa-pal">배색 ${IPA_PALS.map(([k, n]) => `<button type="button" data-pal="${k}" aria-label="${n}" title="${n}" aria-pressed="${ipaPalGet() === k}"></button>`).join('')}</div>`;
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
  if (!(set.has(v) || current.has(v)) || !s) {
    box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym">??</b><span><span class="nm">고양고양이</span> 아직 잠긴 칸이라고양. 묶음에서 만나면 열린다고양.</span></div>`;
    return;
  }
  const words = (IPA.examples[v] || []).map(e => `<span class="ipa-chip">${ipaEsc(e.lang)} ${ipaWordHtml(e.text, e.ko)}</span>`).join('');
  const snd = s.sound && ipaHasAudio(s.sound) ? ipaTapAttrs(s.sound, v + ' 기호 소리 듣기') : '';
  box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym"${snd}>${ipaEsc(v)}</b><span>${ipaNameHtml(s)}${set.has(v) ? '' : '<em>지금 묶음</em><br>'}${ipaEsc(s.how)}</span></div>${words ? `<div class="ipa-chips">${words}</div>` : ''}`;
  ipaTapBind(box);
}
function ipaShowTerm(k) {
  const box = document.getElementById('ipaDex'); if (!box) return;
  const t = ipaT(k);
  const extra = [t.native ? `고유어 ${ipaEsc(t.native)}` : '', t.note ? ipaEsc(t.note) : ''].filter(Boolean).join(' · ');
  box.innerHTML = `<div class="ipa-dex-in ipa-term"><b class="ipa-dex-sym ipa-term-h">${ipaHanjaHtml(t.hanja || '')}</b><span><b>${ipaEsc(t.ko)}</b><span class="ipa-en">${ipaEsc(t.en || '')}</span>${extra ? `<br><small>${extra}</small>` : ''}</span></div>`;
}
