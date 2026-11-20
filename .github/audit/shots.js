// v4: oldingi dizayn + lupali menyu
// Dizayn skrinshotlari: bosh sahifa, kabinet, e'lon, pastki menyu (bosilgan / surilgan holat)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://mohirbozor.uz';
const AD = '132b5e9e-706c-41a0-a78e-db4ce50a8a06';
const scrollMain = (p, y) => p.evaluate((y) => {
  const els = [...document.querySelectorAll('div')].filter((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 50; });
  els.sort((a, b) => b.clientHeight - a.clientHeight);
  if (els[0]) els[0].scrollTop = y;
  return els.length;
}, y);
(async () => {
  fs.mkdirSync('design', { recursive: true });
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: false, colorScheme: scheme });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    const t0 = Date.now();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {});
    console.log(scheme, 'home networkidle ms', Date.now() - t0);
    await p.waitForTimeout(5200);
    await p.screenshot({ path: `design/${scheme}-home.png` });
    await scrollMain(p, 650); await p.waitForTimeout(700);
    await p.screenshot({ path: `design/${scheme}-home2.png` });
    // Pastki menyu: "Xabarlar" ustida barmoq ushlab turilgan (lupa) va chapga surilgan holat
    const tab = p.getByRole('tab', { name: /Xabarlar|Сообщения|Messages/ }).first();
    const bb = await tab.boundingBox().catch(() => null);
    if (bb) {
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await p.mouse.down(); await p.waitForTimeout(380);
      await p.screenshot({ path: `design/${scheme}-press.png`, clip: { x: 0, y: 700, width: 393, height: 152 } });
      await p.mouse.move(bb.x + bb.width / 2 - 70, bb.y + bb.height / 2, { steps: 6 }); await p.waitForTimeout(250);
      await p.screenshot({ path: `design/${scheme}-drag.png`, clip: { x: 0, y: 700, width: 393, height: 152 } });
      await p.mouse.move(bb.x + bb.width / 2 + 90, bb.y + bb.height / 2, { steps: 8 }); await p.waitForTimeout(150);
      await p.mouse.up(); await p.waitForTimeout(900);
      console.log(scheme, 'after drag url:', p.url());
    } else console.log('tab not found');
    await p.screenshot({ path: `design/${scheme}-after.png` });
    for (const [n, u] of [['cabinet', '/cabinet'], ['ad', `/ad/${AD}`], ['login', '/login']]) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
      await p.waitForTimeout(2500);
      await p.screenshot({ path: `design/${scheme}-${n}.png` });
    }
    console.log(scheme, 'errors:', errs.join(' ; ') || 'yo\'q');
    await ctx.close();
  }
  await b.close();
})();
