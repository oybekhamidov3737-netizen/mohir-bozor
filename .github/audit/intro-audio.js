// Kirish animatsiyasidagi ovozlar ritmga tushishini tekshirish.
// Har bir ovoz qachon chalinishi (rejalashtirilgani yoki play() chaqirilgani) animatsiya boshlanishiga nisbatan o'lchanadi
// va kerakli vaqt bilan solishtiriladi. Sekin telefon (CPU x4) va sahifa yuklanib qotgan holat ham sinaladi.
// YANGI = shu tarmoqdan yig'ilgan nusxa (Web Audio), ESKI = hozirgi jonli sayt (<audio> + setTimeout).
const { chromium } = require('playwright');
const NEW = process.env.BASE || 'http://localhost:8080';
const OLD = 'https://mohirbozor.uz';
const PLAN = [['hop1', 1000], ['hop2', 1470], ['hop3', 1770], ['chime', 2140]];
const KEY = (u) => (/chime/.test(u) ? 'chime' : (u.match(/hop\d/) || ['?'])[0]);

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [label, url] of [['YANGI', NEW], ['ESKI', OLD]]) {
    for (const [name, cpu, jank] of [['oddiy', 1, 0], ['sekin telefon (CPU x4)', 4, 0], ['CPU x4 + sahifa qotishi 2x400ms', 4, 400]]) {
      const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await p.addInitScript(({ jank }) => {
        // foydalanuvchi sahifaga tekkan deb hisoblanadi (eski kod faqat shunda ovoz chaladi)
        try { Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: true, isActive: true } }); } catch (e) {}
        window.__ev = []; window.__base = null;
        const S = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (when = 0, ...r) {
          try {
            const c = this.context;
            const ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
            let at = performance.now() + (when - c.currentTime) * 1000;
            if (ts && ts.performanceTime > 0 && ts.contextTime > 0) at = ts.performanceTime + (when - ts.contextTime) * 1000;
            window.__ev.push({ kind: 'webaudio', dur: this.buffer ? Math.round(this.buffer.duration * 1000) : 0, at, call: performance.now() });
          } catch (e) {}
          return S.call(this, when, ...r);
        };
        const P = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          window.__ev.push({ kind: 'audio', src: this.currentSrc || this.src, at: performance.now(), call: performance.now() });
          return P.call(this);
        };
        const poll = () => {
          try { for (const a of document.getAnimations()) if (a.animationName === 'mbX' && a.startTime != null) { window.__base = a.startTime; break; } } catch (e) {}
          if (window.__base == null) requestAnimationFrame(poll);
          else if (jank) {
            const block = () => { const t = performance.now(); while (performance.now() - t < jank) {} };
            const b0 = window.__base;
            setTimeout(block, Math.max(0, b0 + 850 - performance.now()));
            setTimeout(block, Math.max(0, b0 + 1450 - performance.now()));
          }
        };
        requestAnimationFrame(poll);
      }, { jank });
      await p.goto(url + '/?_=' + Date.now(), { waitUntil: 'domcontentloaded' }).catch(() => {});
      await p.waitForTimeout(7000);
      const r = await p.evaluate(() => ({ ev: window.__ev, base: window.__base }));
      const rows = [];
      if (r.base == null) rows.push('animatsiya topilmadi');
      else {
        // web audio: davomiylik bo'yicha (chime 900ms, hop 130ms) ketma-ketlikdan aniqlanadi
        const HOPS = [1000, 1470, 1770];
        const near = (t) => 'hop' + (HOPS.map((h, i) => [Math.abs(t - h), i]).sort((x, y) => x[0] - y[0])[0][1] + 1);
        const ev = r.ev.map((e) => {
          const k = e.kind === 'audio' ? KEY(e.src) : (e.dur > 500 ? 'chime' : near(e.at - r.base));
          return { ...e, k };
        });
        for (const [k, ms] of PLAN) {
          const e = ev.find((x) => x.k === k);
          if (!e) { rows.push(`${k}: chalinmadi`); continue; }
          const d = Math.round(e.at - (r.base + ms));
          rows.push(`${k}: ${d >= 0 ? '+' : ''}${d} ms`);
        }
      }
      console.log(`${label} | ${name} | ${rows.join(', ')}${errs.length ? ' | xato: ' + errs.join(' ; ') : ''}`);
      await ctx.close();
    }
  }
  await b.close();
})();
