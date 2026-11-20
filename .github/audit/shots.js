// Dizayn skrinshotlari: shisha pastki menyu (kunduzgi/tungi), e'lon sahifasi, sirpanish lahzasi
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'https://mohirbozor.uz';
const AD = '132b5e9e-706c-41a0-a78e-db4ce50a8a06';
(async () => {
  fs.mkdirSync('design', { recursive: true });
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    for (const [n, u] of [['home', '/'], ['cabinet', '/cabinet'], ['ad', `/ad/${AD}`]]) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
      await p.waitForTimeout(n === 'home' ? 5500 : 3000);
      if (n === 'home') { await p.screenshot({ path: `design/${scheme}-home-top.png` }); await p.mouse.wheel(0, 420).catch(() => {}); }
      await p.waitForTimeout(600);
      await p.screenshot({ path: `design/${scheme}-${n}.png` });
    }
    // shisha xususiyati haqiqatan qo'llanganmi
    const css = await p.evaluate(() => { const el = document.querySelector('[data-glass]'); if (!el) return 'no [data-glass]'; const c = getComputedStyle(el); return (c.backdropFilter || c.webkitBackdropFilter || 'none') + ' | bg=' + c.backgroundColor; });
    console.log(scheme, 'glass css:', css, 'errors:', errs.join(' ; '));
    // bo'lim almashtirish lahzasi (linza sirpanishi)
    await p.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(5500);
    const tab = p.getByRole('tab', { name: /Xabarlar|Сообщения|Messages/ }).first();
    await tab.click().catch((e) => console.log('tab click', e.message));
    await p.waitForTimeout(90);
    await p.screenshot({ path: `design/${scheme}-moving.png`, clip: { x: 0, y: 700, width: 393, height: 152 } });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `design/${scheme}-chats.png` });
    console.log(scheme, 'after tab click url:', p.url());
    await ctx.close();
  }
  await b.close();
})();
