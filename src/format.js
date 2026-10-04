import { UNITS, ONLINE } from './data';
import { tr, getLang } from './i18n';

export const fmtNum = (n) => Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function priceText(a) {
  if (!+a.price) return tr('Kelishiladi');
  const v = a.cur === 'usd' ? '$' + fmtNum(a.price) : fmtNum(a.price) + ' ' + tr("so'm");
  const u = a.unit && UNITS[a.unit] ? ' ' + UNITS[a.unit] : '';
  return (a.price_from && getLang() !== 'uz' ? tr(' dan').trim() + ' ' : '') + v + (a.price_from && getLang() === 'uz' ? ' dan' : '') + u;
}

const MONTHS_ALL = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const M = () => MONTHS_ALL[getLang()] || MONTHS_ALL.uz;
const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

export function ago(iso) {
  const t = Date.parse(iso);
  if (!t) return '';
  const d = new Date(t), now = new Date();
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= d0) return tr('Bugun') + ' ' + hm(d);
  if (t >= d0 - 864e5) return tr('Kecha') + ' ' + hm(d);
  const y = d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '';
  if (getLang() === 'en') return M()[d.getMonth()] + ' ' + d.getDate() + y;
  return d.getDate() + ' ' + M()[d.getMonth()] + y;
}
export const timeOnly = (iso) => hm(new Date(iso));
export const dayLabel = (iso) => ago(iso).replace(/ \d\d:\d\d$/, '');
export const shortDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0'); };
export const since = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  if (getLang() === 'uz') return `Mohir'da ${d.getFullYear()}-yil ${d.getDate()}-${M()[d.getMonth()]}dan beri`;
  const ds = getLang() === 'en' ? `${M()[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${d.getDate()} ${M()[d.getMonth()]} ${d.getFullYear()}`;
  return tr("Mohir'da {0}dan beri", ds);
};

export const shortReg = (r) => {
  if (r === ONLINE) return tr('Onlayn');
  const sh = String(r || '').replace(' viloyati', '').replace(' Respublikasi', '');
  if (getLang() === 'uz') return sh;
  const v = tr('short:' + sh);
  return v.startsWith('short:') ? sh : v;
};
export function locLabel(a) {
  if (!a) return '';
  if (a.region === ONLINE) return tr("Onlayn · butun O'zbekiston");
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
  if (Date.now() - t < 150000) return tr('onlayn');
  const a = ago(iso);
  return tr('oxirgi marta {0}', a.startsWith(tr('Bugun')) || a.startsWith(tr('Kecha')) ? a.charAt(0).toLowerCase() + a.slice(1) : a);
}
export const isOnline = (iso) => !!iso && Date.now() - Date.parse(iso) < 150000;
