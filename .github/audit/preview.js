// Dizayn variantlarini saytga chiqarmasdan sinash: mahalliy yig'ilgan nusxadan iPhone o'lchamidagi skrinshotlar
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8080';
const AD = '132b5e9e-706c-41a0-a78e-db4ce50a8a06';
const scrollMain = (p, y) => p.evaluate((y) => {
  const els = [...document.querySelectorAll('div')].filter((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 50; });
  els.sort((a, b) => b.clientHeight - a.clientHeight);
  if (els[0]) els[0].scrollTop = y;
  return els.length;
}, y);
(async () => {
  fs.mkdirSync('preview', { recursive: true });
  const b = await chromium.launch();
  for (const v of ['a']) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
      p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
      await p.goto(`${BASE}/?v=${v}`, { waitUntil: 'networkidle' }).catch(() => {});
      await p.waitForTimeout(6000);
      // Bannerni birinchi slaydga qaytarish (variantlar bir xil holatda solishtirilsin)
      const slide = (k) => p.evaluate((k) => {
        const el = [...document.querySelectorAll('div')].find((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowX) && e.scrollWidth > e.clientWidth * 3 && e.clientWidth > 250; });
        if (el) { el.style.scrollBehavior = 'auto'; el.scrollLeft = k * el.clientWidth; }
        return !!el;
      }, k);
      await slide(0); await p.waitForTimeout(700);
      await p.screenshot({ path: `preview/${v}-${scheme}-home.png` });
      await scrollMain(p, 640); await p.waitForTimeout(900);
      await p.screenshot({ path: `preview/${v}-${scheme}-home2.png` });
      await scrollMain(p, 1280); await p.waitForTimeout(900);
      await p.screenshot({ path: `preview/${v}-${scheme}-home3.png` });
      if (scheme === 'light') {
        for (const [n, u] of [['cabinet', '/cabinet'], ['ad', `/ad/${AD}`], ['fav', '/favorites']]) {
          await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
          await p.waitForTimeout(3000);
          await p.screenshot({ path: `preview/${v}-${scheme}-${n}.png` });
        }
      }
      console.log(v, scheme, 'xatolar:', errs.join(' ; ') || "yo'q");
      await ctx.close();
    }
  }
  await b.close();
})();
