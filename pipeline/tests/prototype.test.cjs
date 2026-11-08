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

  const nB = fs.readdirSync(path.join(ROOT, 'data', 'bundles')).filter(f => /^b\d\d\.json$/.test(f)).length;
  ok(await page.locator('#lessonGrid .lessonbtn').count() === nB + 1, `강 타일 ${nB}개 + 모아둔 카드`);
  await page.locator('#lessonGrid .lessonbtn').last().click(); await page.waitForTimeout(400);
  const nEx = await page.locator('.exbtn').count();
  ok(nEx >= 3, `연습 ${nEx}개`);
  await page.locator('.exbtn').first().click(); await page.waitForTimeout(3000);
  ok(await page.locator('#hoeCtx .ipa-nameq .ipa-rep').count() >= 1, '이름 대기 카드: 기호와 대표 낱말');
  // 명칭 치기(26.11.08): 칸 수로 답이 새지 않고, 한국어 단계에선 한국어 이름이 맞으면 한자·영어가 뜨며 넘어간다(순서·띄어쓰기 자유)
  const cur = await page.evaluate(() => state.session.words[state.session.currentId]);
  ok(cur.mode === 'ko', '첫 연습은 한국어로 이름 대기');
  await page.locator('#ainput').fill('무성'); await page.waitForTimeout(150);
  ok(await page.locator('#hoeCtx .blanks .slot').count() === 3, '이름 칸은 친 글자 + 빈칸 하나(답 길이 숨김)');
  await page.locator('#hoeCtx .ipa-tr[data-list]').first().click(); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !!ipaAudioNow), '전사를 누르면 소리(재생 단추 없음)');
  ok(await page.locator('#hoeCtx .ipa-play').count() === 0, '따로 된 재생 단추 없음');
  await page.locator('#hoeCtx .ipa-mini').click(); await page.waitForTimeout(200);
  ok(await page.locator('.ipa-zoom .ipa-zs').count() > 40, '작은 지도를 누르면 큰 IPA 표');
  await shot('t02-zoom'); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.locator('.ipa-zoom').count() === 0, 'Esc로 큰 표 닫힘');
  await page.locator('#ainput').fill(cur.names[0].en); await page.waitForTimeout(600);
  ok(!(await page.evaluate(() => state.session.answered)), '한국어 단계에서 영어만 쳐서는 안 넘어감');
  await page.locator('#ainput').fill(cur.names[0].ko.split(' ').reverse().join('')); await page.waitForTimeout(200);
  const trio = await page.locator('#ipaNameCheck').innerText();
  ok(trio.includes(cur.names[0].hanja.split(' ')[0]) && trio.includes(cur.names[0].en), '한국어가 맞으면 한자·영어가 뜸');
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => state.session.answered), '순서·띄어쓰기 달라도 한국어 이름이 맞으면 넘어감');
  await noH('이름 대기'); await shot('t02-name-ko');

  // 연습을 차례로 끝까지: 첫 카드 하나는 일부러 틀려 따라 치기를 본다
  let wrongDone = false, finished = 0, guard = 0, sawCopy = false, sawAnim = false, enChecked = false, anyChecked = false;
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
      sawCopy = sawCopy || (await page.locator('#hoeCtx .ipa-lmini').count()) > 0;
      await shot('t03-copy'); await page.locator('#ainput').fill(st.term); await page.waitForTimeout(1900); continue;
    }
    if (st.answered) { sawAnim = sawAnim || (await page.locator('#hoeCtx .ipa-anim').count()) > 0; await page.keyboard.press('Enter'); await page.waitForTimeout(250); continue; }
    if (!st.term) { await page.waitForTimeout(200); continue; }
    const wd = await page.evaluate(() => state.session.words[state.session.currentId]);
    if (wd.mode === 'en' && !enChecked) {
      enChecked = true;
      await page.locator('#ainput').fill(wd.names[0].en.split(' ').reverse().join('  ')); await page.waitForTimeout(200);
      const t3 = await page.locator('#ipaNameCheck').innerText();
      ok(t3.includes(wd.names[0].ko) && t3.includes(wd.names[0].hanja.split(' ')[0]), '영어 단계: 영어가 맞으면 한국어·한자가 뜸');
      await shot('t03-name-en'); await page.waitForTimeout(600); continue;
    }
    if (wd.mode === 'any' && !anyChecked) {
      anyChecked = true;
      await page.locator('#ainput').fill(wd.names[0].en); await page.waitForTimeout(700);
      ok(await page.evaluate(() => state.session.answered), '듣고 고르기·전사 빈칸: 영어 이름만 쳐도 맞음');
      continue;
    }
    if (!wrongDone) { await page.locator('#ainput').fill('무성 양순 비음'); wrongDone = true; }
    else await page.locator('#ainput').fill(st.term);
    await page.locator('#ainput').press('Enter'); await page.waitForTimeout(300);
  }
  ok(sawCopy, '틀려서 따라 칠 때 기호 풀이가 뜸');
  ok(enChecked && anyChecked, '영어 단계·아무 쪽 단계를 지나감');
  ok(sawAnim, '맞히면 소리 내는 차례 그림이 뜸');
  ok(finished === nEx, `연습 ${finished}/${nEx}개 끝`);
  await page.goto(base); await page.waitForTimeout(800);
  const lit = await page.locator('#ipaMap .ipa-cell-s.on').count();
  ok(lit >= 3, `IPA 지도 켜진 칸 ${lit}`);
  await shot('t05-home-after');
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
