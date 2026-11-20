// Sayt uchun har bir sahifaning alohida HTML fayli.
//
// Nega kerak: sayt bitta sahifali ilova (SPA). GitHub Pages /privacy, /ad/<id> kabi manzillarni
// 404.html orqali ochadi va HTTP 404 holatini qaytaradi. Natijada:
//   • Google e'lon sahifalarini indekslamaydi;
//   • Telegram/Instagram'da havola ulashilganda e'lon nomi va rasmi chiqmaydi;
//   • App Store / Google Play maxfiylik siyosati havolasini "ishlamayapti" deb hisoblashi mumkin.
// Bu skript dist/_shell.html (yig'ilgan index.html) asosida har bir sahifa uchun to'g'ri
// sarlavha, tavsif va og: teglari bor fayl yaratadi, hamda sitemap.xml va robots.txt yozadi.
//
// Ishlatish: node scripts/static-pages.mjs dist
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const SITE = 'https://mohirbozor.uz';
const cfgSrc = fs.readFileSync(new URL('../src/config.js', import.meta.url), 'utf8');
const SB_URL = (cfgSrc.match(/SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
const SB_KEY = (cfgSrc.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];

const shellPath = path.join(DIST, '_shell.html');
if (!fs.existsSync(shellPath)) fs.copyFileSync(path.join(DIST, 'index.html'), shellPath);
// Qidiruv tizimlari sahifa tilini to'g'ri bilishi uchun (ilova keyin tanlangan tilga o'zi almashtiradi)
const SHELL = fs.readFileSync(shellPath, 'utf8').replace(/<html lang="[^"]*"/, '<html lang="uz"');
fs.writeFileSync(shellPath, SHELL);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { const x = String(s || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1).trimEnd() + '…' : x; };
const fmtNum = (n) => Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const UNITS = { oy: '/ oy', video: '/ video', post: '/ post', loyiha: '/ loyiha', kun: '/ kun', soat: '/ soat' };
const priceText = (a) => {
  if (!+a.price) return 'Kelishiladi';
  const v = a.cur === 'usd' ? '$' + fmtNum(a.price) : fmtNum(a.price) + " so'm";
  return v + (a.price_from ? ' dan' : '') + (a.unit && UNITS[a.unit] ? ' ' + UNITS[a.unit] : '');
};
const storageUrl = (bucket, p) => (!p ? '' : /^https?:/.test(p) ? p : `${SB_URL}/storage/v1/object/public/${bucket}/${String(p).split('/').map(encodeURIComponent).join('/')}`);

const DEF_DESC = "O'zbekistondagi ijodkorlar bozori: SMM mutaxassislari, montajchilar, mobilograflar, dizaynerlar va marketologlar. Narxlarni solishtiring va ilova ichida yozing.";
const DEF_IMG = `${SITE}/og.jpg`;

function page({ url, title, desc, image, type = 'website', noindex = false, body = '' }) {
  const full = title ? `${title} | Mohir bozor` : "Mohir bozor — ijodkorlar bozori";
  const meta = [
    `<meta name="description" content="${esc(desc || DEF_DESC)}">`,
    `<link rel="canonical" href="${esc(SITE + url)}">`,
    `<meta property="og:site_name" content="Mohir bozor">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title || 'Mohir bozor — ijodkorlar bozori')}">`,
    `<meta property="og:description" content="${esc(desc || DEF_DESC)}">`,
    `<meta property="og:url" content="${esc(SITE + url)}">`,
    `<meta property="og:image" content="${esc(image || DEF_IMG)}">`,
    `<meta property="og:locale" content="uz_UZ">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    noindex ? '<meta name="robots" content="noindex">' : '',
  ].filter(Boolean).join('');
  let html = SHELL;
  html = /<title>[\s\S]*?<\/title>/.test(html) ? html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`) : html.replace('</head>', `<title>${esc(full)}</title></head>`);
  html = html.replace(/<meta name="description"[^>]*>/g, '');
  html = html.replace('</head>', meta + '</head>');
  // JavaScript yoqilmagan qidiruv botlari uchun qisqa matn
  if (body) html = html.replace(/<body([^>]*)>/, `<body$1><noscript>${body}</noscript>`);
  return html;
}

function write(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

// Doimiy sahifalar (ochiq / yopiq)
const STATIC = [
  ['/about', 'Ilova haqida', "Mohir bozor — O'zbekistondagi SMM mutaxassislari, montajchilar, dizaynerlar va marketologlar uchun e'lonlar platformasi."],
  ['/privacy', 'Maxfiylik siyosati', "Mohir bozor qanday ma'lumot yig'adi, qanday saqlaydi va hisobni qanday o'chirish mumkin."],
  ['/terms', 'Foydalanish shartlari', "Mohir bozordan foydalanish qoidalari."],
  ['/offer', 'Ommaviy oferta', "Mohir bozor pullik xizmatlari bo'yicha ommaviy oferta."],
  ['/support', "Qo'llab-quvvatlash", "Savollar bo'yicha yordam: Telegram bot @Mohirbozor_bot va ilova ichidagi chat."],
  ['/jobs', 'Siz uchun buyurtmalar', "Ijodkorlar uchun yangi buyurtmalar: SMM, montaj, dizayn va boshqalar."],
  ['/login', 'Kirish', null, true], ['/favorites', 'Saralangan', null, true], ['/chats', 'Xabarlar', null, true],
  ['/new', "E'lon joylash", null, true], ['/post', "E'lon joylash", null, true], ['/cabinet', 'Kabinet', null, true],
  ['/settings', 'Sozlamalar', null, true], ['/prefs', 'Istagan ishim', null, true], ['/my-ads', "Mening e'lonlarim", null, true],
  ['/orders', "To'lovlar tarixi", null, true], ['/offers', 'Takliflar', null, true], ['/wallet', 'Hisob', null, true],
  ['/topup', "Hisobni to'ldirish", null, true], ['/profile', 'Profil', null, true], ['/feedback', 'Teskari aloqa', null, true],
  ['/admin', 'Boshqaruv paneli', null, true],
];

async function rest(q) {
  if (!SB_URL || !SB_KEY) return [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${q}`, { headers: { apikey: SB_KEY, Accept: 'application/json' } });
    if (!r.ok) { console.log('::warning::REST ' + r.status + ' ' + q.slice(0, 60)); return []; }
    return await r.json();
  } catch (e) { console.log('::warning::REST ' + e.message); return []; }
}

const nowIso = new Date().toISOString();
const ads = await rest(`ads?select=id,title,description,photos,price,cur,unit,price_from,negotiable,region,district,kind,user_id,updated_at,created_at&status=eq.active&expires_at=gt.${encodeURIComponent(nowIso)}&order=created_at.desc&limit=2000`);
const uids = [...new Set(ads.map((a) => a.user_id))];
const profs = [];
for (let i = 0; i < uids.length; i += 80) profs.push(...await rest(`profiles?select=id,name,bio,avatar_url,region,cat&id=in.(${uids.slice(i, i + 80).join(',')})`));

// Eski e'lon/profil sahifalarini tozalash (muddati tugaganlari qolib ketmasin)
for (const d of ['ad', 'u']) fs.rmSync(path.join(DIST, d), { recursive: true, force: true });

// Bosh sahifa
write('index.html', page({ url: '/', title: '', desc: DEF_DESC }));
for (const [url, title, desc, noindex] of STATIC) write(url.slice(1) + '.html', page({ url, title, desc, noindex: !!noindex }));

for (const a of ads) {
  const loc = [a.region, a.district].filter(Boolean).join(', ');
  const desc = clip(`${priceText(a)}${loc ? ' · ' + loc : ''}. ${a.description || ''}`, 180);
  const img = a.photos && a.photos[0] ? storageUrl('ads', a.photos[0]) : '';
  write(`ad/${a.id}.html`, page({
    url: `/ad/${a.id}`, title: clip(a.title, 70), desc, image: img, type: 'article',
    body: `<h1>${esc(a.title)}</h1><p>${esc(priceText(a))}${loc ? ' · ' + esc(loc) : ''}</p><p>${esc(clip(a.description, 1000))}</p>`,
  }));
}
for (const p of profs) {
  const n = ads.filter((a) => a.user_id === p.id).length;
  const desc = clip(`${p.region ? p.region + ' · ' : ''}${n} ta e'lon. ${p.bio || ''}`, 180);
  write(`u/${p.id}.html`, page({
    url: `/u/${p.id}`, title: clip(p.name || 'Ijodkor', 60), desc, image: p.avatar_url ? storageUrl('avatars', p.avatar_url) : '', type: 'profile',
    body: `<h1>${esc(p.name || '')}</h1><p>${esc(p.bio || '')}</p>`,
  }));
}

// sitemap.xml va robots.txt
const day = (s) => String(s || nowIso).slice(0, 10);
const urls = [
  [`${SITE}/`, day(nowIso), 'daily', '1.0'],
  ...STATIC.filter((x) => !x[3]).map(([u]) => [SITE + u, day(nowIso), 'monthly', '0.4']),
  ...ads.map((a) => [`${SITE}/ad/${a.id}`, day(a.updated_at || a.created_at), 'weekly', '0.8']),
  ...profs.map((p) => [`${SITE}/u/${p.id}`, day(nowIso), 'weekly', '0.5']),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([l, m, c, p]) => `<url><loc>${esc(l)}</loc><lastmod>${m}</lastmod><changefreq>${c}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`);
const closed = STATIC.filter((x) => x[3]).map(([u]) => u).concat(['/chat/', '/promo/']);
write('robots.txt', `User-agent: *\nAllow: /\n${closed.map((u) => `Disallow: ${u}`).join('\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Sahifalar: ${STATIC.length + 1} doimiy, ${ads.length} e'lon, ${profs.length} profil`);
