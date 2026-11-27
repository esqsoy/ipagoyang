// 시제품 검사(보카고양 틀): 처음 화면 → 마지막 강 → 연습 네 개를 끝까지 → 처음 화면 IPA 지도에 불이 켜지는지, 390px로 본다.
// 쓰는 법: node pipeline/tests/prototype.test.cjs   (SHOT_DIR=폴더 를 주면 화면을 찍어 둔다)
// Playwright·Chromium이 있어야 한다. 임시 서버와 새 브라우저 프로필을 쓴다.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const shots = process.env.SHOT_DIR;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const srv = http.createServer((q, r) => {
    const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async n => { if (shots) await page.screenshot({ path: path.join(shots, n + '.png'), fullPage: true }); };
  const noH = async n => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${n}: 가로 넘침 없음`);

  await page.goto(base); await page.waitForTimeout(800);
  ok((await page.locator('.appbar h1').innerText()).includes('발음고양'), '처음 화면 제목');
  ok(await page.locator('#ipaMap .ipa-grid').count() === 1, 'IPA 지도');
  ok(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('20px "Balum IPA"', 'pʰ'); }), 'IPA 글꼴 읽힘');
  await noH('처음'); await shot('t01-home');
  // 26.11.25(PRINCIPLES 8-12): 처음 화면 위쪽에 늘 시작 단추(진도가 없으면 '1강 시작')
  ok(await page.evaluate(() => { const b = document.getElementById('resumeBtn'); return !!b && !b.hidden && b.previousElementSibling && b.previousElementSibling.classList.contains('catrow') && b.textContent.includes('1강 시작'); }), '처음 화면 위쪽에 1강 시작 단추');

  const nB = fs.readdirSync(path.join(ROOT, 'data', 'bundles')).filter(f => /^b\d\d\.json$/.test(f)).length;
  ok(await page.locator('#lessonGrid .lessonbtn').count() === nB + 1, `강 타일 ${nB}개 + 모아둔 카드`);
  await page.locator('#lessonGrid .lessonbtn').last().click(); await page.waitForTimeout(400);
  const nEx = await page.locator('.exbtn').count();
  ok(nEx >= 3, `연습 ${nEx}개`);
  await page.locator('.exbtn').first().click(); await page.waitForTimeout(3000);
  // 처음 한 번만 뜨는 안내(8-12): 뜨고, 닫으면 저장되어 다시 안 뜬다
  ok(await page.locator('.ipa-guide').count() === 1, '처음 한 번 안내가 뜸');
  await shot('t01b-guide'); await page.locator('.ipa-guide-ok').click(); await page.waitForTimeout(200);
  ok(await page.locator('.ipa-guide').count() === 0 && await page.evaluate(() => localStorage.getItem('ipagoyang-guide-v1') === '1'), '안내를 닫으면 다시 안 뜸(저장)');
  ok(await page.locator('#hoeCtx .ipa-nameq .ipa-rep').count() >= 1, '이름 대기 카드: 기호와 대표 낱말');
  // 명칭 치기(26.11.20 영신): 질문 줄·'[기호] = ?'·설명 문구 없이 기호·작은 지도 밑에 글자 칸(글자마다 한 칸).
  // 한국어 단계에선 한국어 이름이 맞으면 칸 자리가 한자로 바뀌며 넘어간다(순서·띄어쓰기 자유)
  const cur = await page.evaluate(() => state.session.words[state.session.currentId]);
  ok(cur.mode === 'ko', '첫 연습은 한국어로 이름 대기');
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('meaning')).display === 'none'), '이름 대기: 질문 줄 없음');
  const ctxText = await page.locator('#hoeCtx').innerText();
  ok(!/이름을 친다|누르면|=\s*\?/.test(ctxText), '이름 대기: 설명 문구와 [기호] = ? 없음');
  ok(await page.locator('#hoeCtx .ipa-qtop .ipa-big').count() === 1 && await page.locator('#hoeCtx .ipa-qtop .ipa-mini').count() === 1, '기호와 작은 지도가 한 줄');
  await page.locator('#ainput').fill('무성'); await page.waitForTimeout(150);
  ok(await page.locator('#hoeCtx .ipa-nameans .blanks .slot').count() === cur.names[0].ko.replace(/\s/g, '').length, '이름 칸은 글자마다 한 칸(보카고양처럼)');
  await page.locator('#hoeCtx .ipa-tr[data-list]').first().click(); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !!ipaAudioNow), '전사를 누르면 소리(재생 단추 없음)');
  ok(await page.locator('#hoeCtx .ipa-play').count() === 0, '따로 된 재생 단추 없음');
  await page.locator('#hoeCtx .ipa-mini').click(); await page.waitForTimeout(200);
  // 마지막 강이 모음 강이면 큰 표는 IPA 모음표(PRINCIPLES 8-11)
  ok(await page.locator('.ipa-zoom .ipa-zs').count() > 40 || await page.locator('.ipa-zoom .ipa-vs').count() >= 20, '작은 지도를 누르면 큰 IPA 표');
  await shot('t02-zoom'); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.locator('.ipa-zoom').count() === 0, 'Esc로 큰 표 닫힘');
  await page.locator('#ainput').fill(cur.names[0].en); await page.waitForTimeout(600);
  ok(!(await page.evaluate(() => state.session.answered)), '한국어 단계에서 영어만 쳐서는 안 넘어감');
  await page.locator('#ainput').fill(cur.names[0].ko.split(' ').reverse().join('')); await page.waitForTimeout(700);
  ok(await page.evaluate(() => state.session.answered), '순서·띄어쓰기 달라도 한국어 이름이 맞으면 넘어감');
  const hz = await page.locator('#hoeCtx .blanks .ipa-hz-ans').innerText();
  ok(hz.includes(cur.names[0].hanja.split(' ')[0]), '한국어가 맞으면 칸 자리가 한자로 바뀜');
  ok(await page.locator('#hoeCtx .ipa-hz-ans .ipa-gl[data-g]').count() >= 2, '한자마다 뜻 풀이');
  ok(!(await page.locator('#reveal').innerText()).includes(cur.names[0].en), '정답 뒤 세 이름 줄 없음');
  await noH('이름 대기'); await shot('t02-name-ko');

  // 연습을 차례로 끝까지: 첫 카드 하나는 일부러 틀려 따라 치기를 본다
  let sawMine = false, wrongDone = false, finished = 0, guard = 0, sawCopy = false, sawAnim = false, enChecked = false, anyChecked = false;
  while (guard++ < 400) {
    const st = await page.evaluate(() => ({
      game: document.querySelector('#gameScreen')?.classList.contains('active'),
      sum: document.querySelector('#sumScreen')?.classList.contains('active'),
      answered: !!state.session?.answered, copy: !!state.session?.copyMode,
      term: state.session && state.session.currentId !== null ? state.session.words[state.session.currentId].term : null,
    }));
    if (st.sum) {
      finished++; await shot('t04-sum-' + finished); await noH('결과 ' + finished);
      const nextOk = await page.locator('#nextEx').isEnabled();
      if (!nextOk || finished >= nEx) break;
      await page.locator('#nextEx').click(); await page.waitForTimeout(3000); continue;
    }
    if (!st.game) { await page.waitForTimeout(200); continue; }
    if (st.copy) {
      sawCopy = sawCopy || ((await page.locator('#hoeCtx .ipa-lmini').count()) > 0 && (await page.locator('#hoeCtx .blanks .slot.gh').count()) > 0);
      if (!sawMine) { const m = await page.locator('#hoeCtx .ipa-myans').innerText().catch(() => ''); sawMine = m.includes('내 답') && m.includes('따라 치면') && (await page.locator('#hoeCtx .ipa-myans .bad').count()) >= 1; }
      await shot('t03-copy'); await page.locator('#ainput').fill(st.term); await page.waitForTimeout(1900); continue;
    }
    if (st.answered) { sawAnim = sawAnim || (await page.locator('#hoeCtx .ipa-anim').count()) > 0; await page.keyboard.press('Enter'); await page.waitForTimeout(250); continue; }
    if (!st.term) { await page.waitForTimeout(200); continue; }
    const wd = await page.evaluate(() => state.session.words[state.session.currentId]);
    if (wd.mode === 'en' && !enChecked) {
      enChecked = true;
      await page.locator('#ainput').fill(wd.names[0].en.split(' ').reverse().join('  ')); await page.waitForTimeout(700);
      ok(await page.evaluate(() => state.session.answered), '영어 단계: 순서가 달라도 영어 이름이 맞으면 넘어감');
      ok(await page.locator('#hoeCtx .ipa-hz-ans').count() === 0, '영어 단계: 친 영어 이름 그대로(한자로 안 바뀜)');
      await shot('t03-name-en'); continue;
    }
    if (wd.mode === 'any' && !anyChecked) {
      anyChecked = true;
      await page.locator('#ainput').fill(wd.names[0].en); await page.waitForTimeout(700);
      ok(await page.evaluate(() => state.session.answered), '듣고 이름 대기·전사 빈칸: 영어 이름만 쳐도 맞음');
      continue;
    }
    if (!wrongDone) { await page.locator('#ainput').fill('무성 양순 비음'); wrongDone = true; }
    else await page.locator('#ainput').fill(st.term);
    await page.locator('#ainput').press('Enter'); await page.waitForTimeout(300);
  }
  ok(sawCopy, '틀려서 따라 칠 때 희미한 정답 칸과 기호 풀이가 뜸');
  ok(sawMine, '오답 카드에 내 답(틀린 낱말 표시)과 따라 치기 안내');
  ok(await page.locator('.ipa-guide').count() === 0, '안내는 첫 카드 뒤로 다시 안 뜸');
  ok(enChecked && anyChecked, '영어 단계·아무 쪽 단계를 지나감');
  ok(sawAnim, '맞히면 소리 내는 차례 그림이 뜸');
  ok(finished === nEx, `연습 ${finished}/${nEx}개 끝`);
  await page.goto(base); await page.waitForTimeout(800);
  const lit = await page.locator('#ipaMap .ipa-cell-s.on').count() + await page.locator('#ipaMap .ipa-vs.on').count();
  ok(await page.locator('#ipaMap .ipa-vwrap').count() === 1 && await page.locator('#ipaMap .ipa-tab').count() === 2, '처음 화면에 모음 지도(자음·모음 단추로 바꿔 봄)');
  if (await page.locator('#ipaMap .ipa-vwrap').isHidden()) { await page.locator('#ipaMap .ipa-tab[data-tab="v"]').click(); await page.waitForTimeout(100); }
  ok(await page.locator('#ipaMap .ipa-map-wrap').isHidden() && await page.locator('#ipaMap .ipa-vwrap').isVisible(), '모음 단추를 누르면 자음 지도는 숨고 모음표만');
  ok(lit >= 3, `IPA 지도 켜진 칸 ${lit}`);
  await shot('t05-home-after');

  // 26.11.27(PRINCIPLES 8-13 B): 답할 때마다 기록 한 줄(판정이 난 줄 + 따라 치기를 마친 줄)
  const trials = await page.evaluate(() => JSON.parse(localStorage.getItem('ipagoyang-trials-v1') || '[]'));
  const fields = ['t', 'key', 'kind', 'lesson', 'lang', 'wid', 'sym', 'audio', 'typed', 'ok', 'timeout', 'copy', 'first'];
  ok(trials.length > 0 && trials.every(r => fields.every(f => f in r)), `답 기록 ${trials.length}줄, 칸 ${fields.length}개`);
  ok(trials.some(r => !r.ok && !r.copy) && trials.some(r => r.copy && r.ok), '틀린 줄과 따라 치기 줄이 남음');
  ok(trials.every(r => /^(name-ko|name-en|listen|blank):/.test(r.key) && r.kind === r.key.split(':')[0]), '기록 열쇠는 연습 종류:낱말 id(이름 대기는 기호)');
  ok(trials.filter(r => r.first).length === new Set(trials.map(r => r.key)).size, 'first는 열쇠마다 한 번');

  // 26.11.27(PRINCIPLES 8-13 H): 듣고 이름 대기는 답 전에 전사를 점과 빈칸으로만, 화자 이름은 답 뒤에
  ok(await page.evaluate(() => [['asilěu̯s', 6], ['aɪ̯n', 2], ['adʒul', 4], ['a˥˩', 1], ['ˈlo', 2], ['t͡sa', 2], ['kʰaː', 2], ['', 0]].every(([x, n]) => ipaSounds(x).length === n)), '소리 수 세기(부호·이중모음·파찰음·성조·강세)');
  await page.evaluate(() => { state.li = 0; openLesson(0); startExercise(visEx(state.lessons[0]).findIndex(e => e.title.startsWith('듣고 이름 대기'))); });
  await page.waitForTimeout(1500);
  const lc = await page.evaluate(() => { const w = state.session.words[state.session.currentId], c = w.context, t = c.surfaceParts[0], at = c.example.indexOf(t);
    return { w, ex: c.example, tail: c.example.slice(at + t.length), src: document.querySelector('#hoeCtx .mt-source').textContent, meaning: document.getElementById('meaning').textContent,
      spk: (document.querySelector('#hoeCtx .ipa-spk') || {}).textContent || '', who: (IPA.audio[ipaCardAud.id] || {}).speaker || '', played: ipaCardAud.w === w, nDots: ipaSounds(c.example.slice(1, at)).length + ipaSounds(c.example.slice(at + t.length, -1)).length }; });
  ok(lc.w.listen && /^\[[\s·]*\]$/.test(lc.src) && (lc.src.match(/·/g) || []).length === lc.nDots, `듣기 답 전: 전사는 점과 빈칸만 ${JSON.stringify(lc.src)} (원래 ${lc.ex})`);
  ok(!lc.meaning.includes('[') && !lc.meaning.includes(lc.w.wid) && !/[ˈ˥˩]/.test(lc.meaning), '듣기 답 전: 뜻 줄에 전사·낱말 없음 ' + lc.meaning);
  ok(lc.played && lc.who && !lc.spk.includes(lc.who), `듣기 답 전: 소리는 나도 화자 이름은 숨김(${lc.who})`);
  await shot('t07-listen-before');
  await page.locator('#ainput').fill('zzz'); await page.locator('#ainput').press('Enter'); await page.waitForTimeout(500);
  const lw = await page.evaluate(() => ({ copy: state.session.copyMode, src: document.querySelector('#hoeCtx .mt-source').textContent, spk: (document.querySelector('#hoeCtx .ipa-spk') || {}).textContent || '',
    row: JSON.parse(localStorage.getItem('ipagoyang-trials-v1')).pop(), aud: ipaCardAud.id }));
  ok(lw.copy && lw.src.endsWith(lc.tail) && lw.spk.includes(lc.who), '듣기 틀린 뒤: 전사·화자 이름이 보임');
  ok(lw.row.key === 'listen:' + lc.w.wid && lw.row.ok === false && lw.row.copy === false && lw.row.typed === 'zzz' && lw.row.audio === lw.aud && lw.row.lang === lc.w.lang && lw.row.first === true, '틀린 답 기록 한 줄 ' + JSON.stringify(lw.row));
  await page.locator('#ainput').fill(lc.w.term); await page.waitForTimeout(2200);
  const lw2 = await page.evaluate(() => JSON.parse(localStorage.getItem('ipagoyang-trials-v1')).pop());
  ok(lw2.copy && lw2.ok && lw2.key === 'listen:' + lc.w.wid && !lw2.first, '따라 치기를 마친 줄(copy)');
  await page.waitForFunction(id => state.session.currentId !== id && !state.session.answered && !state.session.copyMode, lc.w.id, { timeout: 15000 }); await page.waitForTimeout(500);
  const nw = await page.evaluate(() => state.session.words[state.session.currentId]);
  await page.locator('#ainput').fill(nw.names[0].ko); await page.waitForTimeout(2000);
  const la = await page.evaluate(() => ({ answered: state.session.answered, src: document.querySelector('#hoeCtx .mt-source').textContent.replace(/\s/g, ''), ex: state.session.words[state.session.currentId].context.example,
    spk: (document.querySelector('#hoeCtx .ipa-spk') || {}).textContent || '', who: (IPA.audio[ipaCardAud.id] || {}).speaker || '', masked: !!document.querySelector('#hoeCtx .ipa-masked') }));
  ok(la.answered && la.src === la.ex && !la.masked, `듣기 맞힌 뒤: 전사 다 보임 ${la.src}`);
  ok(!la.who || la.spk.includes(la.who), '듣기 맞힌 뒤: 화자 이름 보임 ' + la.spk);
  await noH('듣기'); await shot('t07-listen-after');
  // 전사 빈칸은 그대로(점으로 가리지 않음)
  await page.evaluate(() => { cancelPendingAdvance(); startExercise(visEx(state.lessons[0]).findIndex(e => e.title.startsWith('전사 빈칸'))); });
  await page.waitForTimeout(800);
  ok(await page.evaluate(() => { const c = state.session.words[state.session.currentId].context, t = c.surfaceParts[0]; return !document.querySelector('#hoeCtx .ipa-masked') && document.querySelector('#hoeCtx .mt-source').textContent.endsWith(c.example.slice(c.example.indexOf(t) + t.length)); }), '전사 빈칸은 전사를 그대로 보임');
  await page.goto(base); await page.waitForTimeout(800);

  // 26.11.27(PRINCIPLES 8-13 A): 모아둔 카드는 '연습 종류:낱말 id' 열쇠라 언어 고르기를 바꿔도 같은 카드를 가리킨다
  const ids = await page.evaluate(() => state.lessons.flatMap(L => L.exercises.flatMap(e => e.words.map(w => w.savedCardId))));
  ok(ids.length > 0 && new Set(ids).size === ids.length && ids.every(id => /^(name-ko|name-en|listen|blank):\S+$/.test(id)), `카드 열쇠 ${ids.length}개 모두 다르고 자리 번호가 아님`);
  const pickSaved = await page.evaluate(() => {
    // 강 안에서 뒤쪽 자리에 있는 스페인어 듣기·전사 카드(전체 → 스페인어만으로 바꾸면 자리 번호가 바뀌는 카드)
    for (const L of state.lessons) for (const e of L.exercises) { const i = e.words.findIndex(w => w.lang === 'spa'); if (i > 0) { const w = e.words[i]; savedSet(w.savedCardId, true); return { id: w.savedCardId, wid: w.wid, title: e.title, old: JSON.stringify([L.lesson, e.scope, e.ex, i]) }; } }
    return null; });
  ok(!!pickSaved, '스페인어 카드 하나 담기 ' + JSON.stringify(pickSaved));
  await page.locator('.ipa-langs button[data-lang="spa"]').click(); await page.waitForTimeout(1200);
  const afterSpa = await page.evaluate(id => ({ items: savedItems().map(x => ({ id: x.id, wid: x.word.wid })), idx: (() => { for (const L of state.lessons) for (const e of L.exercises) { const i = e.words.findIndex(w => w.savedCardId === id); if (i >= 0) return i; } return -1; })() }), pickSaved.id);
  ok(afterSpa.items.length === 1 && afterSpa.items[0].wid === pickSaved.wid, `스페인어만으로 바꿔도 같은 낱말(${pickSaved.wid}, 판 안 자리 ${afterSpa.idx})`);
  await page.locator('.ipa-langs button[data-lang="all"]').click(); await page.waitForTimeout(1200);
  ok(await page.evaluate(wid => savedItems().length === 1 && savedItems()[0].word.wid === wid, pickSaved.wid), '전체로 되돌려도 같은 낱말');
  // 옛 자리 번호 카드는 새 판을 처음 열 때 한 번만 비우고(새 열쇠 카드는 남김) 처음 화면에 한 줄 알린다
  await page.evaluate(old => { const k = 'ipagoyang-seoul-v1-saved-cards-v1'; const rows = JSON.parse(localStorage.getItem(k)); rows.push({ id: old, addedAt: 1 }); localStorage.setItem(k, JSON.stringify(rows)); localStorage.removeItem('ipagoyang-saved-reset-v1'); }, pickSaved.old);
  await page.reload(); await page.waitForTimeout(800);
  const rs = await page.evaluate(() => ({ rows: JSON.parse(localStorage.getItem('ipagoyang-seoul-v1-saved-cards-v1')), flag: localStorage.getItem('ipagoyang-saved-reset-v1'), bubble: document.getElementById('homeBubble').textContent }));
  ok(rs.flag === '1' && rs.rows.length === 1 && rs.rows[0].id === pickSaved.id && rs.bubble.includes('비웠다고양'), '옛 모아둔 카드 한 번 비움 + 한 줄 알림');
  await page.evaluate(old => { const k = 'ipagoyang-seoul-v1-saved-cards-v1'; localStorage.setItem(k, JSON.stringify([{ id: old, addedAt: 1 }])); }, pickSaved.old);
  await page.reload(); await page.waitForTimeout(800);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('ipagoyang-seoul-v1-saved-cards-v1')).length === 1 && !document.getElementById('homeBubble').textContent.includes('비웠다고양')), '비우기는 한 번만');
  await page.evaluate(() => { localStorage.removeItem('ipagoyang-seoul-v1-saved-cards-v1'); }); await page.reload(); await page.waitForTimeout(800);
  // 기록 옮기기: 두 기기의 답 기록을 합친다(같은 줄은 한 번, 시간순, first 다시 셈)
  ok(await page.evaluate(() => { const K = 'ipagoyang-trials-v1', r = (t, key) => ({ t, key, typed: '', copy: false, first: true });
    const m = rtMerge({ [K]: JSON.stringify([r(1, 'a'), r(3, 'b')]) }, { [K]: JSON.stringify([r(2, 'a'), r(3, 'b'), r(4, 'c')]) }), v = JSON.parse(m.writes[K] || '[]');
    const same = rtMerge({ [K]: JSON.stringify([r(1, 'a')]) }, { [K]: JSON.stringify([r(1, 'a')]) });
    return v.map(x => x.t).join() === '1,2,3,4' && v.map(x => x.first).join() === 'true,false,true,true' && !(K in same.writes); }), '기록 옮기기: 답 기록을 합침');

  // 26.11.27(PRINCIPLES 8-13 C): 복습 기한(하루 단위, 그날 첫 답, 1·3·7·21·60일, 틀리면 1일)
  ok(await page.evaluate(() => {
    const now = new Date(2026, 10, 27, 12).getTime(), D = (n, h = 10) => new Date(2026, 10, 27 - n, h).getTime();
    const r = (key, t, ok, o = {}) => ({ t, key, ok, timeout: false, copy: false, ...o });
    const info = ipaReviewInfo([r('a', D(1), true), r('b', D(0), true), r('c', D(4), true), r('c', D(3), true), r('d', D(3), true), r('d', D(2), true),
      r('e', D(1, 9), false), r('e', D(1, 11), true), ...[10, 9, 8, 7, 6, 5].map(n => r('f', D(n), true)), r('g', D(1), false), r('g', D(1, 11), true, { copy: true }),
      r('h', D(2), false, { timeout: true })], now);
    const g = k => info.get(k);
    return g('a').isDue && g('a').gap === 1 && !g('b').isDue && g('c').gap === 3 && g('c').isDue && !g('d').isDue && g('e').streak === 0 && g('e').gap === 1 && g('e').isDue
      && g('f').gap === 60 && g('g').streak === 0 && g('h').isDue && g('h').streak === 0;
  }), '복습 기한 계산(간격·틀리면 1일·같은 날 다시 맞힘은 안 늘림·따라 치기 줄 무시)');
  // 8-13 I: 귀 점수는 듣기·처음 답·따라 치기 아님·확인 카드·최소대립만, 시간 종료는 따로
  ok(await page.evaluate(() => {
    const pw = Object.keys(IPA.earPairs), np = Object.keys(IPA.wordTarget).find(w => !IPA.earPairs[w]), ck = (IPA.wordCheck || [])[0];
    const r = (wid, o) => ({ t: 1, key: 'listen:' + wid, kind: 'listen', lesson: 1, wid, first: true, copy: false, ok: true, timeout: false, ...o });
    IPA.earPairs[ck] = ['x'];
    const s = ipaEarScore([r(pw[0], {}), r(pw[1], { ok: false }), r(pw[2], { ok: false, timeout: true }), r(pw[0], { first: false }), r(pw[1], { copy: true }),
      r(np, {}), r(ck, {}), { ...r(pw[0], {}), kind: 'blank', key: 'blank:' + pw[0] }]);
    delete IPA.earPairs[ck];
    return pw.length === 27 && JSON.stringify(s.by[1]) === JSON.stringify({ ok: 1, n: 2, timeout: 1 }) && s.all.n === 2;
  }), '귀 점수 계산 사례(최소대립 27장 중 처음 답만, 시간 종료 따로, 확인 필요 뺌)');
  // 자질별 맞음(기록 화면용 함수)
  ok(await page.evaluate(() => {
    const r = (key, sym, typed) => ({ t: 1, key, kind: 'blank', sym, typed, ok: false, copy: false, timeout: false });
    const f = ipaFeatureScore([r('blank:ko-bul', 'p', '유성 양순 파열음'), r('blank:ko-bul', 'p', 'voiceless alveolar plosive'), r('blank:x', 'i', '전설 원순 고모음')]).groups;
    const e = (g, ok, n) => f[g].ok === ok && f[g].n === n;
    return e('voice', 1, 2) && e('place', 1, 2) && e('manner', 2, 2) && e('height', 1, 1) && e('backness', 1, 1) && e('rounding', 0, 1);
  }), '자질별 맞음(목청·자리·방법 / 높이·앞뒤·입술)');

  // 8-13 C 새 카드: 기록이 생기기 전에 끝낸 판은 처음 한 번 '본 카드'로 적되(기록 직전에 더한 카드는 빼고), 그 뒤 끝낸 판에 기록 없는 카드는 새 카드
  ok(await page.evaluate(() => ipaNewCards().length === 0), '처음에는 새 카드 0(끝낸 판 카드는 다 답 기록이 있음)');
  const nb = await page.evaluate(() => {
    const L = state.lessons[0], seen = new Set(ipaTrialsRead().map(r => r.key)), add = new Set(IPA.cardsAdded);
    const ex = L.exercises.filter(e => e.title.startsWith('전사 빈칸'));
    state.progress[L.id] = state.progress[L.id] || {};
    ex.forEach(e => { state.progress[L.id][e.title] = { completed: true, bestMs: 1, lastMs: 1, attempts: 1, errors: 0, first: 100 }; });
    saveProgress(); localStorage.removeItem('ipagoyang-newbase-v1');
    return ex.flatMap(e => e.words).filter(w => add.has(w.savedCardId) && !seen.has(w.savedCardId)).length;
  });
  await page.reload(); await page.waitForTimeout(900);
  const nb2 = await page.evaluate(() => ({ n: ipaNewCards().length, base: JSON.parse(localStorage.getItem('ipagoyang-newbase-v1')).keys, add: IPA.cardsAdded, btn: (document.querySelector('.ipa-playbtn[data-play="new"]') || {}).textContent || '' }));
  ok(nb > 0 && nb2.n === nb && nb2.base.length > 0 && !nb2.base.some(k => nb2.add.includes(k)) && nb2.btn.includes(String(nb)), `기록 전 끝낸 판: 기록 직전에 더한 카드(고전어 등)만 새 카드 ${nb2.n}/${nb}장`);
  const nAdd = await page.evaluate(() => {
    const L = state.lessons[0], e = L.exercises.find(x => x.title === '이름 대기 · 한국어'), rows = ipaTrialsRead();
    state.progress[L.id][e.title] = { completed: true, bestMs: 1, lastMs: 1, attempts: 1, errors: 0, first: 100 }; saveProgress();
    // 판을 끝낸 뒤 카드 둘이 더해졌다고 친다: 그 둘만 답 기록이 없다
    e.words.slice(0, -2).forEach((w, i) => rows.push({ t: Date.now() - 1000 + i, key: w.savedCardId, kind: 'name-ko', lesson: 1, lang: null, wid: null, sym: w.sym, audio: null, typed: w.term, ok: true, timeout: false, copy: false, first: !rows.some(r => r.key === w.savedCardId) }));
    ipaTrialsWrite(rows); return e.words.slice(-2).map(w => w.savedCardId);
  });
  await page.reload(); await page.waitForTimeout(900);
  const nc = await page.evaluate(() => ipaNewCards().map(w => w.savedCardId));
  ok(nc.length === nb + 2 && nAdd.every(k => nc.includes(k)), `끝낸 강에 더한 카드를 셈: ${nb} + 2 = ${nc.length}`);
  // 새 카드 판: 틀의 연습 화면으로 열고, 한 장 풀면 답 기록이 남고, 강 진도·이어 하기는 그대로
  const prog0 = await page.evaluate(() => JSON.stringify(state.progress) + '|' + localStorage.getItem('ipagoyang-seoul-last-v1'));
  await page.locator('.ipa-playbtn[data-play="new"]').click(); await page.waitForTimeout(1200);
  const nsess = await page.evaluate(() => ({ play: state.session.lesson.ipaPlay, n: state.session.words.length, game: document.getElementById('gameScreen').classList.contains('active'), w: state.session.words[state.session.currentId] }));
  ok(nsess.play === 'new' && nsess.game && nsess.n === Math.min(20, nb + 2), `새 카드 판이 틀의 연습 화면으로 열림(${nsess.n}장)`);
  await page.locator('#ainput').fill(nsess.w.names[0].ko); await page.waitForTimeout(800);
  const nrow = await page.evaluate(() => ({ row: ipaTrialsRead().pop(), answered: state.session.answered }));
  ok(nrow.answered && nrow.row.key === nsess.w.savedCardId && nrow.row.ok && nrow.row.first, '새 카드 판에서 한 장 풀면 답 기록 한 줄 ' + nrow.row.key);
  await page.evaluate(() => { cancelPendingAdvance(); setRec('새 카드', state.session.exercise.title, { timeMs: 1, attempts: 1, errors: 0, first: 100 }); saveLast('새 카드', 'x'); });
  await page.locator('#exitBtn').click(); await page.waitForTimeout(300);
  const lst = await page.evaluate(() => ({ title: document.getElementById('lessonTitle').textContent, n: document.querySelectorAll('#exList .exbtn').length, p: JSON.stringify(state.progress) + '|' + localStorage.getItem('ipagoyang-seoul-last-v1') }));
  ok(lst.title === '새 카드' && lst.n === 1 && lst.p === prog0, '새 카드 판은 강 진도(getRec)·이어 하기를 바꾸지 않음');
  await page.goto(base); await page.waitForTimeout(900);
  ok(await page.evaluate(n => ipaNewCards().length === n - 1, nb + 2), '푼 카드는 새 카드에서 빠짐');

  // 8-13 C 복습 판: 기한이 된 듣기 카드 하나 → 열면 듣기 가리기(H) 그대로, 맞히면 기록, 오늘은 더 안 나옴
  const due = await page.evaluate(() => {
    const seen = new Set(ipaTrialsRead().map(r => r.key));
    const w = state.lessons[1].exercises.flatMap(e => e.words).find(x => x.listen && !seen.has(x.savedCardId));
    const rows = ipaTrialsRead(); rows.push({ t: Date.now() - 2 * 86400000, key: w.savedCardId, kind: 'listen', lesson: w.b, lang: w.lang, wid: w.wid, sym: ipaSymOf(w), audio: null, typed: w.term, ok: true, timeout: false, copy: false, first: true });
    ipaTrialsWrite(rows); return w.savedCardId;
  });
  await page.reload(); await page.waitForTimeout(900);
  ok(await page.evaluate(() => ipaDueCards().length === 1 && document.querySelector('.ipa-playbtn[data-play="review"]').textContent.includes('1')), '복습 1장(이틀 전에 맞힌 카드, 간격 1일)');
  await shot('t08-home-plays');
  await page.locator('.ipa-playbtn[data-play="review"]').click(); await page.waitForTimeout(1500);
  const rv = await page.evaluate(() => ({ play: state.session.lesson.ipaPlay, w: state.session.words[state.session.currentId], masked: !!document.querySelector('#hoeCtx .mt-source.ipa-masked'), src: document.querySelector('#hoeCtx .mt-source').textContent }));
  ok(rv.play === 'review' && rv.w.savedCardId === due && rv.masked && /^\[[\s·]*\]$/.test(rv.src), '복습 판의 듣기 카드도 답 전에 전사를 가림 ' + rv.src);
  await page.locator('#ainput').fill(rv.w.names[0].ko); await page.waitForTimeout(800);
  const rrow = await page.evaluate(() => ipaTrialsRead().pop());
  ok(rrow.key === due && rrow.ok && !rrow.first, '복습 판에서 맞힌 답 기록');

  // 8-13 D 놀면서 검수: 답한 뒤에만 작은 표시, 누르면 넘어가지 않고 고르는 창, 저장
  ok(await page.locator('#hoeCtx .ipa-flagbtn').count() === 1, '맞힌 뒤 검수 표시 단추');
  await page.locator('#hoeCtx .ipa-flagbtn').click(); await page.waitForTimeout(200);
  ok(await page.locator('.ipa-flagdlg [data-k="audio"]').count() === 1 && await page.locator('.ipa-flagdlg [data-k="text"]').count() === 1, '듣기 카드: 녹음 이상·전사·이름 이상');
  await page.locator('.ipa-flagdlg [data-k="audio"]').click(); await page.locator('.ipa-flag-note').fill('끝이 잘림');
  await shot('t09-flag-dialog');
  await page.waitForTimeout(2600);
  ok(await page.evaluate(() => document.getElementById('gameScreen').classList.contains('active') && state.session.answered), '표시 창을 여는 동안 저절로 넘어가지 않음');
  await page.locator('.ipa-flag-ok').click(); await page.waitForTimeout(200);
  const fl = await page.evaluate(() => ({ f: JSON.parse(localStorage.getItem('ipagoyang-flags-v1') || '[]'), aud: ipaCardAud.id, btn: document.querySelector('#hoeCtx .ipa-flagbtn').textContent }));
  ok(fl.f.length === 1 && fl.f[0].kind === 'audio' && fl.f[0].key === due && fl.f[0].wid === rv.w.wid && fl.f[0].audio === fl.aud && fl.f[0].note === '끝이 잘림' && fl.btn.includes('표시함'), '검수 표시 저장 ' + JSON.stringify(fl.f[0]));
  await shot('t09-flag-saved');
  await page.goto(base); await page.waitForTimeout(900);
  ok(await page.evaluate(() => ipaDueCards().length === 0), '오늘 복습한 카드는 오늘 다시 안 나옴');
  const fb = page.locator('#ipaMap .ipa-flagscopy');
  ok((await fb.textContent()).includes('검수 표시 1개'), '처음 화면에 검수 표시 1개 · 복사');
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('no')); document.execCommand = () => false; });
  await fb.click(); await page.waitForTimeout(300);
  const ex = await page.evaluate(() => JSON.parse(document.querySelector('#ipaMap .ipa-flags-text').value));
  ok(ex.game === '발음고양' && ex.n === 1 && ex.flags[0].wid === rv.w.wid && ex.flags[0].audio === fl.aud && ex.flags[0].kind === 'audio' && ex.flags[0].note === '끝이 잘림' && /^\d{4}-\d\d-\d\dT/.test(ex.flags[0].at), '복사 실패하면 글 상자에 JSON(낱말 id·녹음 id·종류·메모·시각)');
  await shot('t10-flags-copy');
  ok(await page.evaluate(() => { const K = 'ipagoyang-flags-v1', f = (t, key) => ({ t, key, kind: 'text', audio: null });
    const m = rtMerge({ [K]: JSON.stringify([f(1, 'a')]) }, { [K]: JSON.stringify([f(1, 'a'), f(2, 'b')]) }), v = JSON.parse(m.writes[K] || '[]');
    const same = rtMerge({ [K]: JSON.stringify([f(1, 'a')]) }, { [K]: JSON.stringify([f(1, 'a')]) });
    return v.map(x => x.key).join() === 'a,b' && !(K in same.writes); }), '기록 옮기기: 검수 표시를 합침');
  // 귀 점수: 처음 화면 강 줄에 '귀 n/m'(셀 것이 있을 때만)
  await page.evaluate(() => {
    const seen = new Set(ipaTrialsRead().map(r => r.key)), rows = ipaTrialsRead();
    const wid = Object.keys(IPA.earPairs).find(w => !seen.has('listen:' + w) && state.lessons.some(L => L.exercises.some(e => e.words.some(x => x.savedCardId === 'listen:' + w))));
    const w = state.lessons.flatMap(L => L.exercises.flatMap(e => e.words)).find(x => x.savedCardId === 'listen:' + wid);
    rows.push({ t: Date.now(), key: w.savedCardId, kind: 'listen', lesson: w.b, lang: w.lang, wid, sym: ipaSymOf(w), audio: null, typed: w.term, ok: true, timeout: false, copy: false, first: true });
    ipaTrialsWrite(rows);
  });
  await page.reload(); await page.waitForTimeout(900);
  const ear = await page.evaluate(() => { const { by } = ipaEarScore(); const tiles = [...document.querySelectorAll('#lessonGrid .lessonbtn:not(.saved-home)')];
    return { good: tiles.every((b, i) => { const e = by[state.lessons[i].lesson], t = (b.querySelector('.ipa-ear') || {}).textContent || ''; return e && e.n + e.timeout ? t.includes(`귀 ${e.ok}/${e.n}`) : !t; }), shown: tiles.filter(b => b.querySelector('.ipa-ear')).length }; });
  ok(ear.good && ear.shown >= 1, `강 줄에 귀 점수(${ear.shown}강)`);
  await noH('처음(새 카드·복습·귀 점수)'); await shot('t11-home-ear');

  // 언어 고르기(26.11.08): 한국어만 고르면 한국어 낱말 카드만 남고, 한국어에 없는 기호(β·ð)는 이름 대기에서 빠진다
  const before = await page.evaluate(() => state.lessons.reduce((a, L) => a + L.exercises.reduce((b, e) => b + e.words.length, 0), 0));
  await page.locator('.ipa-langs button[data-lang="kor"]').click(); await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({ n: state.lessons.reduce((a, L) => a + L.exercises.reduce((b, e) => b + e.words.length, 0), 0),
    langs: [...new Set(state.lessons.flatMap(L => L.exercises.flatMap(e => e.words.map(w => w.lang || (w.reps || []).map(r => r.lid).join(',')))))],
    syms: state.lessons.flatMap(L => L.exercises.flatMap(e => e.words.filter(w => w.nameq).map(w => w.sym))) }));
  ok(after.n > 0 && after.n < before && after.langs.every(x => x === 'kor'), `한국어만: 카드 ${before} → ${after.n}, 언어 ${after.langs.join('|')}`);
  ok(!after.syms.includes('β') && !after.syms.includes('ð'), '한국어에 없는 기호는 이름 대기에서 빠짐');
  await page.locator('.ipa-langs button[data-lang="eng"]').click(); await page.waitForTimeout(1200);
  const both = await page.evaluate(() => JSON.parse(localStorage.getItem('ipagoyang-langs')));
  ok(JSON.stringify(both) === '["kor","eng"]', '한국어 + 영어 고르기 ' + JSON.stringify(both));
  await shot('t06-langs');
  await page.locator('.ipa-langs button[data-lang="all"]').click(); await page.waitForTimeout(1200);
  ok(await page.evaluate(() => localStorage.getItem('ipagoyang-langs') === null), '전체로 되돌리기');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  ok(keys.length > 0 && keys.every(k => k.startsWith('ipagoyang-')), '저장 키는 ipagoyang- 로만 ' + keys.join(','));
  ok(errors.length === 0, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  await browser.close(); srv.close();
  console.log(fails ? `실패 ${fails}` : '모두 통과');
  process.exit(fails ? 1 : 0);
})();
