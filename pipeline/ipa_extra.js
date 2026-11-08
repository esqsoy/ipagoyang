/* 발음고양 덧붙임. 보카고양 마더텅 틀(pipeline/frame.html) 앞에 넣는다(build.py).
   틀은 그대로 두고 여기서만 발음고양에 필요한 것을 더한다(PRINCIPLES 1-1, 탄고고양 日本語能力試験과 같은 방식).
   - 입력: ph → pʰ 같은 줄임을 IPA로 바꿔 읽는다(ipaIn). 자동 제출은 끈다.
   - 칸: 부호가 붙은 기호도 칸 하나(blankParts).
   - 카드 위: 배우기 그림(입 옆모습·목청·소리 시작 띠), 녹음 재생 단추(ipaBeforeCard / ipaAfterCard).
   - 처음 화면: 주기율표 게임처럼 잠긴 칸이 다 보이는 IPA 지도와 기호 도감(ipaRenderMap). */
const IPA_NO_AUTOSUBMIT = true;
const IPA = /*__IPA_DATA__*/{};

/* ---------- 입력과 칸 ---------- */
function ipaIn(raw) {
  let s = String(raw || '');
  for (const [k, v] of IPA.short || []) s = s.split(k).join(v);
  return s;
}
function ipaIsMark(c) { return /[ʰ-ˇˉ-ˋˍ-ˏˑ-˿̀-ͯ᷀-᷿]/.test(c); }
function ipaIsBase(c) { return /[A-Za-zÀ-ɏɐ-ʯͰ-Ͽᴀ-ᵿ0-9=&ᄀ-ᇿ㄰-㆏가-힯]/.test(c); }
function blankParts(value) {
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
const IPA_SAG_AT = {bilabial: [157, 137], alveolar: [147, 129], dental: [151, 136], glottis: [101, 205]};
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
  const label = '입 옆모습(단면도 CC0, Wright·McCloy)' + (o.near ? ' · 입 틈은 덧그린 것' : '');
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
/* 발음 용어는 한글·한자·영어를 함께 보인다(영신 26.11.07, PRINCIPLES 2-5). 용어 자료는 data/terms.json */
function ipaT(k) { return (IPA.terms || {})[k] || {ko: k}; }
function ipaTermInline(k, label) {
  const t = ipaT(k);
  return `${ipaEsc(label || t.ko)}<span class="ipa-hz">(${ipaEsc(t.hanja || '')}${t.en ? ' · ' + ipaEsc(t.en) : ''})</span>`;
}
function ipaNameHtml(s) {
  return `<div class="ipa-name"><b>${ipaEsc(s.name)}</b>${s.name_hanja ? `<span class="ipa-hanja">${ipaEsc(s.name_hanja)}</span>` : ''}${s.name_en ? `<span class="ipa-en">${ipaEsc(s.name_en)}</span>` : ''}</div>`;
}
/* 여러 화자로 듣기(HVPT, PRINCIPLES 8-8): 낱말마다 녹음 목록을 두고, 누를 때마다 다음 화자로 넘어간다. 첫 화자는 무작위 */
function ipaAudioList(wid, fallback) {
  const l = ((IPA.wordAudio || {})[wid] || [fallback]).filter(ipaHasAudio);
  return l;
}
function ipaPlayBtn(ids, label, start) {
  const l = (Array.isArray(ids) ? ids : [ids]).filter(ipaHasAudio);
  if (!l.length) return `<span class="ipa-soon">녹음 준비 중</span>`;
  const i = start === 'random' ? Math.floor(Math.random() * l.length) : 0;
  return `<button type="button" class="ipa-play" data-list="${ipaEsc(l.join('|'))}" data-i="${i}" aria-label="${ipaEsc(label || '듣기')}">▶</button>` +
    (l.length > 1 ? `<span class="ipa-spk" aria-live="polite">목소리 ${i + 1}/${l.length}</span>` : '');
}
function ipaBtnNext(b) {
  const l = b.dataset.list.split('|'); let i = +b.dataset.i || 0; const id = l[i % l.length];
  b.dataset.i = (i + 1) % l.length;
  const sp = b.parentElement && b.parentElement.querySelector('.ipa-spk');
  if (sp) sp.textContent = `목소리 ${(i % l.length) + 1}/${l.length}` + ((IPA.audio[id] || {}).speaker ? ` · ${IPA.audio[id].speaker}` : '');
  return id;
}
function ipaBeforeCard(w) {
  if (!w) return '';
  if (w.learn) {
    const s = IPA.symbols[w.sym] || {};
    const ex = (IPA.examples[w.sym] || []).map(e => `<div class="ipa-ex"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaEsc(e.text)}</span><span class="ipa-tr">[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span><span class="ipa-explay">${ipaPlayBtn(ipaAudioList(e.wid, e.audio), e.text + ' 듣기')}</span></div>`).join('');
    return `<div class="ipa-learn">
      <div class="ipa-big">${ipaEsc(w.sym === 'β' ? 'β β̞' : w.sym)}</div>
      ${ipaNameHtml(s)}
      ${ipaMiniMap(w)}
      ${s.sound && ipaHasAudio(s.sound) ? `<div class="ipa-symplay">${ipaPlayBtn(s.sound, '기호 소리 듣기')}<span>기호 소리(시범 녹음)</span></div>` : ''}
      <div class="ipa-pair"><div>${ipaSagittal(ipaSagOpts(s))}<i>입 옆모습${s.lips === 'near' ? ' · 틈은 덧그림' : ''}</i></div><div>${ipaGlottis(s.glottis)}<i>목청 = ${ipaTermInline('성대')}: ${ipaEsc((IPA.glottis || {})[s.glottis] || '')}</i></div></div>
      ${s.vot ? `<div class="ipa-vot">${ipaVot(s.vot)}<i>소리 시작 띠 = ${ipaTermInline('성대 진동 개시 시간')}: ${ipaEsc((IPA.vot || {})[s.vot] || '')}</i></div>` : ''}
      <p>${ipaEsc(s.how)}</p><p><b>한국어와</b> ${ipaEsc(s.ko)}</p>${s.other ? `<p class="ipa-other">다른 표기: ${ipaEsc(s.other)}</p>` : ''}
      ${ex ? `<div class="ipa-exs">${ex}</div>` : ''}
      <p class="ipa-code">치는 법: <b>${ipaEsc(w.code)}</b> → <span>${ipaEsc(w.en)}</span></p>
    </div>`;
  }
  if (w.audio !== undefined) {
    const l = ipaAudioList(w.wid, w.audio);
    return `<div class="ipa-cardplay">${ipaMiniMap(w)}${ipaPlayBtn(l, '듣기', 'random')}${l.length ? '<canvas class="ipa-wave"></canvas>' : ''}</div>`;
  }
  return ipaMiniMap(w);
}
function ipaAfterCard(w, noAuto) {
  const root = document.getElementById('hoeCtx'); if (!root || !w) return;
  root.querySelectorAll('.ipa-play').forEach(b => {
    const wrap = b.closest('.ipa-cardplay, .ipa-ex, .ipa-symplay');
    const cv = wrap ? wrap.querySelector('canvas') : null;
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ipaPlay(ipaBtnNext(b), cv); });
    if (cv) { const l = b.dataset.list.split('|'); requestAnimationFrame(() => ipaWave(cv, l[(+b.dataset.i || 0) % l.length], 0)); }
  });
  const main = root.querySelector('.ipa-cardplay .ipa-play');
  if (!noAuto && w.listen && main) setTimeout(() => { const cv = root.querySelector('.ipa-cardplay canvas'); ipaPlay(ipaBtnNext(main), cv); }, 350);
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
  if (w.learn) return w.sym;
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
  return `<div class="ipa-mini" aria-label="IPA 지도에서 이 묶음의 칸">${g}</div>`;
}
/* 맞히면 소리를 내는 차례대로 그림이 움직인다(PRINCIPLES 8-9 ①): 닫기 → 목청 → 터뜨림 → 울림.
   울림이 언제 시작하는지는 기호의 소리 시작 띠(vot) 값을 따른다: lead 처음부터, short 터뜨리자 바로, long 바람 뒤 */
const IPA_NEXT_MS = 2400;
function ipaOnCorrect(w) {
  const root = document.getElementById('hoeCtx'); const sym = ipaSymOf(w); const s = sym && IPA.symbols[sym];
  if (!root || !s) return;
  const mini = root.querySelector('.ipa-mini'); if (mini) mini.outerHTML = ipaMiniMap(w, sym);
  const bw = (IPA.byWord || {})[w.wid], sp = document.getElementById('catSpeech');
  if (bw && sp && !w.learn) { sp.textContent = bw; sp.hidden = false; }
  const where = {bilabial: '입술', alveolar: '혀끝·잇몸', dental: '혀끝·이'}[s.place] || '입';
  const gl = (IPA.glottis || {})[s.glottis] || '';
  const steps = s.vot
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
  const colh = (k, i) => { const t = ipaT(k); return `<button type="button" class="ipa-col" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(t.ko + ' ' + (t.hanja || '') + ' ' + (t.en || ''))}">${i + 1}<small>${ipaEsc(t.short || t.ko.replace(/음$/, ''))}</small><small class="h">${ipaEsc(t.short_hanja || t.hanja || '')}</small></button>`; };
  const rowh = k => { const t = ipaT(k); return `<button type="button" class="ipa-rowh" data-term="${ipaEsc(k)}" aria-label="${ipaEsc(t.ko + ' ' + (t.hanja || '') + ' ' + (t.en || ''))}"><span>${ipaEsc(t.ko)}</span><small class="h">${ipaEsc(t.hanja || '')}</small></button>`; };
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
    <div class="ipa-dex" id="ipaDex"></div>`;
  el.querySelectorAll('.ipa-cell-s').forEach(b => b.onclick = () => { ipaPick = b.dataset.s; ipaShowDex(); });
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
  const words = (IPA.examples[v] || []).map(e => `<span class="ipa-chip">${ipaEsc(e.lang)} ${ipaEsc(e.text)}</span>`).join('');
  box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym">${ipaEsc(v)}</b><span>${ipaNameHtml(s)}${set.has(v) ? '' : '<em>지금 묶음</em><br>'}${ipaEsc(s.how)}</span></div>${words ? `<div class="ipa-chips">${words}</div>` : ''}`;
}
function ipaShowTerm(k) {
  const box = document.getElementById('ipaDex'); if (!box) return;
  const t = ipaT(k);
  const extra = [t.native ? `고유어 ${ipaEsc(t.native)}` : '', t.note ? ipaEsc(t.note) : ''].filter(Boolean).join(' · ');
  box.innerHTML = `<div class="ipa-dex-in ipa-term"><b class="ipa-dex-sym ipa-term-h">${ipaEsc(t.hanja || '')}</b><span><b>${ipaEsc(t.ko)}</b><span class="ipa-en">${ipaEsc(t.en || '')}</span>${extra ? `<br><small>${extra}</small>` : ''}</span></div>`;
}
