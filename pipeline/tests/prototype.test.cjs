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
  ok(await page.locator('#hoeCtx .ipa-learn').count() === 1, '배우기 카드 그림');
  await page.locator('#ainput').fill('ph'); await page.waitForTimeout(150);
  ok((await page.locator('#hoeCtx .blanks').innerText()).includes('pʰ'), 'ph → pʰ 바뀌어 보임');
  ok(await page.locator('#hoeCtx .blanks .slot').count() === 1, '부호 붙은 기호도 칸 하나');
  await page.locator('#ainput').fill(''); await noH('배우기'); await shot('t02-learn');

  // 연습을 차례로 끝까지: 첫 카드 하나는 일부러 틀려 따라 치기를 본다
  let wrongDone = false, finished = 0, guard = 0, sawCopy = false, sawAnim = false;
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
      sawCopy = sawCopy || (await page.locator('#hoeCtx .ipa-learn, #hoeCtx .ipa-cardplay').count()) > 0;
      await shot('t03-copy'); await page.locator('#ainput').fill(st.term); await page.waitForTimeout(1900); continue;
    }
    if (st.answered) { sawAnim = sawAnim || (await page.locator('#hoeCtx .ipa-anim').count()) > 0; await page.keyboard.press('Enter'); await page.waitForTimeout(250); continue; }
    if (!st.term) { await page.waitForTimeout(200); continue; }
    if (!wrongDone) { await page.locator('#ainput').fill(st.term === 'b' ? 'p' : 'b'); wrongDone = true; }
    else await page.locator('#ainput').fill(st.term);
    await page.locator('#ainput').press('Enter'); await page.waitForTimeout(300);
  }
  ok(sawCopy, '따라 치기에도 그림·재생 단추가 남음');
  ok(sawAnim, '맞히면 소리 내는 차례 그림이 뜸');
  ok(finished === nEx, `연습 ${finished}/${nEx}개 끝`);
  await page.goto(base); await page.waitForTimeout(800);
  const lit = await page.locator('#ipaMap .ipa-cell-s.on').count();
  ok(lit >= 3, `IPA 지도 켜진 칸 ${lit}`);
  await shot('t05-home-after');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  ok(keys.length > 0 && keys.every(k => k.startsWith('ipagoyang-')), '저장 키는 ipagoyang- 로만 ' + keys.join(','));
  ok(errors.length === 0, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  await browser.close(); srv.close();
  console.log(fails ? `실패 ${fails}` : '모두 통과');
  process.exit(fails ? 1 : 0);
})();
