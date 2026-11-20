// Jonli saytni avtomatik tekshirish: har bir sahifa uchun konsol xatolari, sahifa xatolari,
// muvaffaqiyatsiz so'rovlar, yuklanish vaqti va skrinshot.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'https://mohirbozor.uz';
const AD = '132b5e9e-706c-41a0-a78e-db4ce50a8a06';
const USER = '9f294fe1-60e1-4637-8a28-2e29dec9d7e9';
const routes = [
  '/', `/ad/${AD}`, '/ad/00000000-0000-0000-0000-000000000000', `/u/${USER}`, '/jobs', '/login', '/about', '/privacy', '/terms',
  '/offer', '/support', '/feedback', '/favorites', '/chats', '/new', '/cabinet', '/settings', '/prefs',
  '/my-ads', '/orders', '/offers', '/wallet', '/topup', '/profile', '/post', '/admin', `/promo/${AD}`, '/chat/x', '/nonexistent-page',
];
const runs = [
  { name: 'uz-light', lang: 'uz', scheme: 'light', routes },
  { name: 'ru-dark', lang: 'ru', scheme: 'dark', routes: ['/', `/ad/${AD}`, '/login', '/support', '/about', '/jobs', `/u/${USER}`] },
  { name: 'en-light', lang: 'en', scheme: 'light', routes: ['/', '/login', '/support'] },
];
const report = [];
(async () => {
  const b = await chromium.launch();
  for (const run of runs) {
    fs.mkdirSync(run.name, { recursive: true });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: run.scheme, locale: 'uz-UZ' });
    await ctx.addInitScript((l) => { try { localStorage.setItem('lang', l); } catch (e) {} }, run.lang);
    for (const r of run.routes) {
      const p = await ctx.newPage();
      const rec = { run: run.name, route: r, console: [], pageErrors: [], failed: [], bad: [] };
      p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') rec.console.push(m.type() + ': ' + m.text().slice(0, 300)); });
      p.on('pageerror', (e) => rec.pageErrors.push(String(e).slice(0, 400)));
      p.on('requestfailed', (q) => rec.failed.push(q.url().slice(0, 160) + ' ' + (q.failure() || {}).errorText));
      p.on('response', (s) => { if (s.status() >= 400 && s.url() !== BASE + r) rec.bad.push(s.status() + ' ' + s.url().slice(0, 180)); });
      const t0 = Date.now();
      const resp = await p.goto(BASE + r, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => { rec.pageErrors.push('GOTO ' + e.message.slice(0, 200)); return null; });
      rec.docStatus = resp ? resp.status() : 0;
      rec.loadMs = Date.now() - t0;
      await p.waitForTimeout(5000);
      rec.finalUrl = p.url().replace(BASE, '');
      rec.text = (await p.evaluate(() => document.body.innerText).catch(() => '')).replace(/\s+/g, ' ').slice(0, 500);
      // gorizontal siljish (sahifa ekrandan kengroq bo'lsa)
      rec.overflowX = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth).catch(() => null);
      // tarjima qilinmagan matnlar (ru/en rejimida o'zbekcha so'zlar qolganmi)
      await p.screenshot({ path: `${run.name}/${r.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`, fullPage: true }).catch(() => {});
      report.push(rec);
      await p.close();
    }
    await ctx.close();
  }

  // O'zaro ta'sir sinovlari (bosh sahifa)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(5000);
  const steps = [];
  const tryStep = async (name, fn) => { try { await fn(); await p.waitForTimeout(1500); steps.push(name + ': ok -> ' + p.url().replace(BASE, '')); } catch (e) { steps.push(name + ': FAIL ' + e.message.slice(0, 150)); } };
  await tryStep('qidiruv', async () => { const i = p.locator('input').first(); await i.fill('montaj'); await i.press('Enter'); });
  await p.screenshot({ path: 'i-search.png' });
  await tryStep('qidiruv tozalash', async () => { await p.locator('input').first().fill(''); });
  await tryStep('kategoriya SMM', async () => { await p.getByText('SMM', { exact: true }).first().click(); });
  await p.screenshot({ path: 'i-category.png' });
  await tryStep('saralangan tab', async () => { await p.getByText('Saralangan').first().click(); });
  await p.screenshot({ path: 'i-fav.png' });
  await tryStep('joylash tab', async () => { await p.getByText('Joylash').first().click(); });
  await p.screenshot({ path: 'i-new.png' });
  await tryStep('xabarlar tab', async () => { await p.getByText('Xabarlar').first().click(); });
  await tryStep('kabinet tab', async () => { await p.getByText('Kabinet').first().click(); });
  await p.screenshot({ path: 'i-cabinet.png' });
  await p.goto(BASE + '/login', { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(4000);
  await tryStep('login noto\'g\'ri pochta', async () => { await p.locator('input').first().fill('abc@mail.ru'); await p.getByText('Kod yuborish').click(); });
  await p.screenshot({ path: 'i-login-bad.png' });
  await p.goto(BASE + '/support', { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(4000);
  await tryStep('FAQ ochish', async () => { await p.getByText('Qanday e\'lon joylayman?').click(); });
  await p.screenshot({ path: 'i-faq.png' });
  report.push({ run: 'interactions', steps, pageErrors: errs });
  await b.close();

  fs.writeFileSync('report.json', JSON.stringify(report, null, 1));
  for (const r of report) {
    if (r.steps) { console.log('INTERACTIONS', r.steps.join(' | '), r.pageErrors.join(' ; ')); continue; }
    const issues = r.console.length + r.pageErrors.length + r.failed.length + r.bad.length + (r.overflowX > 0 ? 1 : 0);
    console.log(`${r.run} ${r.route} [${r.docStatus}] -> ${r.finalUrl} ${r.loadMs}ms issues=${issues}${r.overflowX > 0 ? ' OVERFLOW=' + r.overflowX : ''}`);
  }
  // SEO va havola ko'rinishi
  for (const u of ['/sitemap.xml', '/robots.txt', '/og.jpg', `/ad/${AD}`, `/u/${USER}`, '/privacy']) {
    const res = await fetch(BASE + u).catch(() => null);
    const txt = res ? await res.text() : '';
    const og = (txt.match(/<meta property="og:(title|image)" content="[^"]*"/g) || []).join(' | ');
    console.log('HTTP', u, res ? res.status : 'ERR', (txt.match(/<title>[^<]*<\/title>/) || [''])[0], og.slice(0, 300));
  }
})();
