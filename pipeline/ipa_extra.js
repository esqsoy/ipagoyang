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

/* ---------- 그림(모식도) ---------- */
const IPA_PLACES = [
  {n:1, ko:'양순', x:29, y:97}, {n:2, ko:'순치', x:45, y:98}, {n:3, ko:'치', x:47, y:89}, {n:4, ko:'치경', x:55, y:80},
  {n:5, ko:'후치경', x:64, y:76}, {n:6, ko:'권설', x:76, y:72}, {n:7, ko:'경구개', x:96, y:67}, {n:8, ko:'연구개', x:126, y:72},
  {n:9, ko:'구개수', x:149, y:99}, {n:10, ko:'인두', x:171, y:140}, {n:11, ko:'성문', x:161, y:206}];
function ipaSagittal(o = {}) {
  const low = o.lips === 'near' ? 4 : o.lips === 'open' ? 12 : -1;
  const hot = o.place === 'bilabial' ? 1 : 0;
  const lip = hot ? 'stroke="var(--gold)" stroke-width="2.2"' : 'stroke="var(--muted)" stroke-width=".8"';
  let s = `<path d="M122,2 C94,4 74,14 67,28 C63,37 55,46 45,54 C38,59 31,61 32,66 C33,70 39,71 42,71" fill="none" stroke="var(--muted)" stroke-width="1" opacity=".6"/>
  <path d="M29,${120 + low} C24,129 27,140 36,146 C54,158 82,167 106,177 C124,185 138,194 145,206 L147,236" fill="none" stroke="var(--muted)" stroke-width="1" opacity=".6"/>
  <path d="M58,56 C70,36 112,28 158,34 L164,58 C150,56 120,56 58,56 Z" fill="var(--ipa-cav)" stroke="var(--line)"/>
  <path d="M172,40 L184,40 L184,236 L172,236 Z" fill="var(--ipa-tis)"/>
  <path d="M44,118 C34,121 26,124 28,134 C32,152 52,166 82,174 C104,180 122,184 136,186 L140,176 L60,124 L50,113 Z" fill="var(--ipa-tis)"/>
  <path d="M50,113 C52,104 58,99 68,95 C88,86 116,82 134,92 C146,100 150,116 150,136 C150,154 148,166 142,176 L136,186 C118,170 88,150 60,124 Z" fill="var(--ipa-tongue)"/>
  <path d="M58,56 L164,58 C166,66 160,76 156,84 C152,92 154,99 150,101 C146,98 146,90 142,84 C134,74 122,70 108,68 C88,66 72,70 62,78 C58,81 54,83 50,82 L44,80 L40,72 C42,64 48,58 58,56 Z" fill="var(--ipa-tis)"/>
  <path d="M146,172 C150,162 156,160 160,166" fill="none" stroke="var(--muted)" stroke-width="1.4"/>
  <path d="M150,186 L150,236 M170,186 L170,236" stroke="var(--muted)" stroke-width="1"/>
  <path d="M151,206 L159,206 M169,206 L163,206" stroke="var(--muted)" stroke-width="2.4"/>
  <path d="M44,80 L40,72 C30,72 20,78 19,86 C18,93 26,97 40,96 L44,95 Z" fill="var(--ipa-tongue)" ${lip}/>
  <path d="M44,82 L50,82 L49,96 L45,97 Z" fill="var(--ipa-tooth)" stroke="var(--muted)" stroke-width=".7"/>
  <g transform="translate(0,${low})"><path d="M45,100 L49,100 L50,112 L45,113 Z" fill="var(--ipa-tooth)" stroke="var(--muted)" stroke-width=".7"/>
  <path d="M44,99 L40,98 C26,98 19,103 20,110 C21,118 32,121 44,118 Z" fill="var(--ipa-tongue)" ${lip}/></g>`;
  if (o.puff) s += `<g class="ipa-puff" stroke="var(--gold)" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M14,92 q-4,3 0,6"/><path d="M9,90 q-5,5 0,10"/><path d="M4,88 q-6,7 0,14"/></g>`;
  if (hot) s += `<circle cx="29" cy="97" r="5" fill="none" stroke="var(--gold)" stroke-width="1.6"/>`;
  return `<svg viewBox="0 0 196 240" role="img" aria-label="입 옆모습(모식도)">${s}</svg>`;
}
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
function ipaPlayBtn(id, label) {
  return ipaHasAudio(id)
    ? `<button type="button" class="ipa-play" data-audio="${ipaEsc(id)}" aria-label="${ipaEsc(label || '듣기')}">▶</button>`
    : `<span class="ipa-soon">녹음 준비 중</span>`;
}
function ipaBeforeCard(w) {
  if (!w) return '';
  if (w.learn) {
    const s = IPA.symbols[w.sym] || {};
    const ex = (IPA.examples[w.sym] || []).map(e => `<div class="ipa-ex"><span class="ipa-lang">${ipaEsc(e.lang)}</span><span class="ipa-word">${ipaEsc(e.text)}</span><span class="ipa-tr">[${ipaEsc(e.a)}<b>${ipaEsc(e.t)}</b>${ipaEsc(e.b)}]</span>${ipaPlayBtn(e.audio, e.text + ' 듣기')}</div>`).join('');
    return `<div class="ipa-learn">
      <div class="ipa-big">${ipaEsc(w.sym === 'β' ? 'β β̞' : w.sym)}</div>
      ${s.sound && ipaHasAudio(s.sound) ? `<div class="ipa-symplay">${ipaPlayBtn(s.sound, '기호 소리 듣기')}<span>기호 소리(시범 녹음)</span></div>` : ''}
      <div class="ipa-pair"><div>${ipaSagittal({lips: s.lips, place: s.place, puff: s.glottis === 'wide'})}<i>입 옆모습</i></div><div>${ipaGlottis(s.glottis)}<i>목청: ${ipaEsc((IPA.glottis || {})[s.glottis] || '')}</i></div></div>
      ${s.vot ? `<div class="ipa-vot">${ipaVot(s.vot)}<i>소리 시작 띠: ${ipaEsc((IPA.vot || {})[s.vot] || '')}</i></div>` : ''}
      <p>${ipaEsc(s.how)}</p><p><b>한국어와</b> ${ipaEsc(s.ko)}</p>${s.other ? `<p class="ipa-other">다른 표기: ${ipaEsc(s.other)}</p>` : ''}
      ${ex ? `<div class="ipa-exs">${ex}</div>` : ''}
      <p class="ipa-code">치는 법: <b>${ipaEsc(w.code)}</b> → <span>${ipaEsc(w.en)}</span></p>
    </div>`;
  }
  if (w.audio !== undefined) {
    return `<div class="ipa-cardplay">${ipaPlayBtn(w.audio, '듣기')}${ipaHasAudio(w.audio) ? '<canvas class="ipa-wave"></canvas>' : ''}</div>`;
  }
  return '';
}
function ipaAfterCard(w, noAuto) {
  const root = document.getElementById('hoeCtx'); if (!root || !w) return;
  root.querySelectorAll('.ipa-play').forEach(b => {
    const wrap = b.closest('.ipa-cardplay, .ipa-ex, .ipa-symplay');
    const cv = wrap ? wrap.querySelector('canvas') : null;
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ipaPlay(b.dataset.audio, cv); });
    if (cv) requestAnimationFrame(() => ipaWave(cv, b.dataset.audio, 0));
  });
  if (!noAuto && w.listen && ipaHasAudio(w.audio)) setTimeout(() => { const cv = root.querySelector('.ipa-cardplay canvas'); ipaPlay(w.audio, cv); }, 350);
}

/* ---------- 처음 화면: IPA 지도(주기율표 게임처럼 잠긴 칸이 다 보이고, 익힌 칸에 불이 들어온다) ---------- */
const IPA_COLS = ['양순', '순치', '치', '치경', '후치경', '권설', '경구개', '연구개', '구개수', '인두', '성문'];
/* 국제음성학회 IPA 표(2020, CC BY-SA 4.0)의 폐 기류 자음. 치·치경·후치경이 한 칸인 줄은 span 3 */
const IPA_ROWS = [
  {ko:'파열음', cells:[['p','b'],null,{span:3,v:['t','d']},['ʈ','ɖ'],['c','ɟ'],['k','ɡ'],['q','ɢ'],null,['ʔ']]},
  {ko:'비음', cells:[['m'],['ɱ'],{span:3,v:['n']},['ɳ'],['ɲ'],['ŋ'],['ɴ'],null,null]},
  {ko:'떨음', cells:[['ʙ'],null,{span:3,v:['r']},null,null,null,['ʀ'],null,null]},
  {ko:'탄음', cells:[null,['ⱱ'],{span:3,v:['ɾ']},['ɽ'],null,null,null,null,null]},
  {ko:'마찰음', cells:[['ɸ','β'],['f','v'],['θ','ð'],['s','z'],['ʃ','ʒ'],['ʂ','ʐ'],['ç','ʝ'],['x','ɣ'],['χ','ʁ'],['ħ','ʕ'],['h','ɦ']]},
  {ko:'설측마찰', cells:[null,null,{span:3,v:['ɬ','ɮ']},null,null,null,null,null,null]},
  {ko:'접근음', cells:[null,['ʋ'],{span:3,v:['ɹ']},['ɻ'],['j'],['ɰ'],null,null,null]},
  {ko:'설측접근', cells:[null,null,{span:3,v:['l']},['ɭ'],['ʎ'],['ʟ'],null,null,null]},
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
  let grid = `<div class="ipa-grid"><span></span>${IPA_COLS.map((c, i) => `<span class="ipa-col">${i + 1}<small>${c}</small></span>`).join('')}`;
  for (const r of IPA_ROWS) {
    grid += `<span class="ipa-rowh">${r.ko}</span>`;
    for (const c of r.cells) {
      if (c === null) { grid += `<span class="ipa-cell empty"></span>`; continue; }
      const span = c.span || 1, v = c.v || c;
      grid += `<span class="ipa-cell" style="grid-column:span ${span}">${v.map(sym).join('')}</span>`;
    }
  }
  grid += '</div>';
  const lit = [...set].length, all = IPA_ROWS.reduce((a, r) => a + r.cells.filter(Boolean).reduce((b, c) => b + (c.v || c).length, 0), 0);
  el.innerHTML = `<div class="phead"><div style="flex:1;min-width:0"><h2>IPA 입 지도</h2><small>입술(1)에서 목청(11)까지 · 켠 칸 ${lit}/${all} · 점은 잠긴 칸</small></div></div>
    <div class="ipa-map-wrap">${grid}</div>
    <div class="ipa-dex" id="ipaDex"></div>`;
  el.querySelectorAll('.ipa-cell-s').forEach(b => b.onclick = () => { ipaPick = b.dataset.s; ipaShowDex(); });
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
  box.innerHTML = `<div class="ipa-dex-in"><b class="ipa-dex-sym">${ipaEsc(v)}</b><span><b>${ipaEsc(s.name)}</b>${set.has(v) ? '' : ' <em>· 지금 묶음</em>'}<br>${ipaEsc(s.how)}</span></div>${words ? `<div class="ipa-chips">${words}</div>` : ''}`;
}
