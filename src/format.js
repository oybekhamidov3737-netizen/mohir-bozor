import { UNITS, ONLINE } from './data';

export const fmtNum = (n) => Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function priceText(a) {
  if (!+a.price) return 'Kelishiladi';
  const v = a.cur === 'usd' ? '$' + fmtNum(a.price) : fmtNum(a.price) + " so'm";
  const u = a.unit && UNITS[a.unit] ? ' ' + UNITS[a.unit] : '';
  return v + (a.price_from ? ' dan' : '') + u;
}

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

export function ago(iso) {
  const t = Date.parse(iso);
  if (!t) return '';
  const d = new Date(t), now = new Date();
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= d0) return 'Bugun ' + hm(d);
  if (t >= d0 - 864e5) return 'Kecha ' + hm(d);
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '');
}
export const timeOnly = (iso) => hm(new Date(iso));
export const dayLabel = (iso) => ago(iso).replace(/ \d\d:\d\d$/, '');
export const shortDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0'); };
export const since = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : `Mohir'da ${d.getFullYear()}-yil ${d.getDate()}-${MONTHS[d.getMonth()]}dan beri`; };

export const shortReg = (r) => (r === ONLINE ? 'Onlayn' : String(r || '').replace(' viloyati', '').replace(' Respublikasi', ''));
export function locLabel(a) {
  if (!a) return '';
  if (a.region === ONLINE) return "Onlayn · butun O'zbekiston";
  return a.district ? a.district + ', ' + shortReg(a.region) : shortReg(a.region);
}

export function adState(a) {
  const now = Date.now();
  if (a.status === 'deleted') return 'deleted';
  if (Date.parse(a.expires_at) <= now) return 'expired';
  return 'live';
}
export const isVip = (a) => a.vip_until && Date.parse(a.vip_until) > Date.now();
export const isTop = (a) => isVip(a) || (a.top_until && Date.parse(a.top_until) > Date.now());
export const initials = (s) => String(s || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Onlayn holati: 2 daqiqa ichida faol bo'lsa "onlayn"
export function seenText(iso) {
  const t = Date.parse(iso);
  if (!t) return '';
  if (Date.now() - t < 150000) return 'onlayn';
  const a = ago(iso);
  return 'oxirgi marta ' + (a.startsWith('Bugun') || a.startsWith('Kecha') ? a.charAt(0).toLowerCase() + a.slice(1) : a);
}
export const isOnline = (iso) => !!iso && Date.now() - Date.parse(iso) < 150000;
