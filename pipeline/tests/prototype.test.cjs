// 시제품 검사: 처음 화면 → 배우기 → 문제(맞힘·틀림·따라 하기) → 결과 → 출처 화면까지 폰 크기(390px)로 지나간다.
// 쓰는 법: node pipeline/tests/prototype.test.cjs   (SHOT_DIR=폴더 를 주면 화면을 찍어 둔다)
// Playwright와 Chromium이 있어야 한다. 임시 서버와 새 브라우저 프로필을 쓴다.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
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
  const noHScroll = async n => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${n}: 가로 넘침 없음`);

  await page.goto(base);
  ok(await page.locator('h1').innerText() === '발음고양', '처음 화면 제목');
  ok(await page.locator('svg[aria-label^="입 옆모습"]').count() === 1, '입 옆모습 지도');
  const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('30px "Balum IPA"', 'pʰ'); });
  ok(fontOk, 'IPA 글꼴 읽힘');
  await noHScroll('처음'); await shot('01-home');

  await page.click('#go');
  const data = await page.evaluate(() => ({ learn: D.bundle.learn.length, q: D.bundle.compare.length }));
  for (let i = 0; i < data.learn; i++) {
    ok(await page.locator('.big').count() === 1, `배우기 ${i + 1}`);
    await noHScroll(`배우기 ${i + 1}`);
    if (i < 3) await shot(`02-learn-${i + 1}`);
    const enabled = page.locator('.play:not([disabled])').first();
    if (await enabled.count()) await enabled.click();
    await page.click('#next');
  }
  // 문제: 첫 문제는 일부러 틀리고 따라 하기를 거친다. 나머지는 맞힌다.
  let n = 0, wrongDone = false, types = new Set();
  while (await page.locator('#rv').count()) {
    const q = await page.evaluate(() => ({ type: Q[qi].type, right: (Q[qi].type === 'compare' ? Q[qi].c.answer : Q[qi].w.target) }));
    types.add(q.type);
    const sel = q.type === 'blank' ? '.key' : '.opt';
    const attr = q.type === 'blank' ? 'data-k' : 'data-o';
    if (!wrongDone) {
      const wrong = page.locator(`${sel}:not([${attr}="${q.right}"])`).first();
      await wrong.click();
      ok(await page.locator('.reveal.ng').count() === 1, '틀림 표시');
      ok(await page.locator(`${sel}.need`).count() === 1, '따라 하기 표시');
      await shot('03-wrong');
      await page.locator(`${sel}[${attr}="${q.right}"]`).click();
      wrongDone = true;
    } else {
      await page.locator(`${sel}[${attr}="${q.right}"]`).click();
      if (n === 4) await shot('04-' + q.type);
    }
    if (q.type === 'blank' && !types.has('blank-shot')) { types.add('blank-shot'); await noHScroll('전사 빈칸'); await shot('05-blank'); }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
    n++;
    if (n > 60) break;
  }
  ok(types.has('compare') && types.has('blank'), '견주기·빈칸 문제가 나옴');
  const listenExpected = await page.evaluate(() => D.bundle.words.filter(w => w.listen !== false && w.lang !== 'kor' && D.audio[w.audio]).length);
  ok(listenExpected === 0 || types.has('listen'), '녹음이 있으면 듣고 고르기가 나옴');
  const h2 = await page.locator('h2').innerText();
  ok(/묶음 1 끝: \d+\/\d+/.test(h2), '결과 화면 ' + h2);
  await noHScroll('결과'); await shot('06-result');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ipagoyang-v1')));
  ok(stored && stored.b01 && stored.b01.done, '기록 저장');
  await page.click('#hm'); await page.click('#cr');
  ok((await page.locator('table.cr tr').count()) > 10, '출처 화면');
  await noHScroll('출처'); await shot('07-credits');
  ok(errors.length === 0, '콘솔 오류 없음 ' + errors.join(' | '));
  await browser.close(); srv.close();
  console.log(fails ? `실패 ${fails}` : '모두 통과');
  process.exit(fails ? 1 : 0);
})();
