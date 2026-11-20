// Ilova tillari: o'zbek (asosiy), rus, ingliz.
// tr("o'zbekcha matn", ...qiymatlar) — tanlangan tilga o'giradi; {0}, {1} o'rniga qiymatlar qo'yiladi.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DICT from './i18n-dict';

export const LANGS = [['uz', "O'zbekcha", '🇺🇿'], ['ru', 'Русский', '🇷🇺'], ['en', 'English', '🇬🇧']];
let LANG = 'uz';
const subs = new Set();
const IDX = { ru: 0, en: 1 };

export const getLang = () => LANG;

export function tr(s, ...args) {
  if (typeof s !== 'string') return s;
  let out = s;
  if (LANG !== 'uz') {
    const d = DICT[s];
    if (d && d[IDX[LANG]]) out = d[IDX[LANG]];
  }
  if (args.length) out = out.replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined || args[i] === null ? '' : String(args[i])));
  return out;
}

// Server yoki boshqa joydan kelgan matnni o'girish (aniq mos bo'lsa)
export const trMaybe = (s) => (typeof s === 'string' ? tr(s.trim()) : s);

export async function loadLang() {
  try {
    const v = await AsyncStorage.getItem('lang');
    if (v && IDX[v] !== undefined) LANG = v;
  } catch (e) {}
  if (typeof document !== 'undefined') document.documentElement.lang = LANG;
  subs.forEach((f) => f(LANG));
  return LANG;
}

export function setLang(l) {
  if (!['uz', 'ru', 'en'].includes(l) || l === LANG) return;
  LANG = l;
  AsyncStorage.setItem('lang', l).catch(() => {});
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  subs.forEach((f) => f(l));
}

export function useLang() {
  const [l, setL] = useState(LANG);
  useEffect(() => { subs.add(setL); return () => subs.delete(setL); }, []);
  return l;
}

// "N ta e'lon" — har bir tilning ko'plik shakli bilan
export function adsCount(n) {
  n = Number(n) || 0;
  if (LANG === 'ru') {
    const a = n % 10, b = n % 100;
    const w = a === 1 && b !== 11 ? 'объявление' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'объявления' : 'объявлений';
    return n + ' ' + w;
  }
  if (LANG === 'en') return n + (n === 1 ? ' ad' : ' ads');
  return n + " ta e'lon";
}

// Tajriba: "3 yil" / "3 года" / "3 years" (kasr ham bo'lishi mumkin: 1.5)
export function yearsText(v) {
  const raw = String(v ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n <= 0) return '';
  const num = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  if (LANG === 'ru') {
    if (!Number.isInteger(n)) return num + ' года';
    const a = n % 10, b = n % 100;
    return num + ' ' + (a === 1 && b !== 11 ? 'год' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'года' : 'лет');
  }
  if (LANG === 'en') return num + (n === 1 ? ' year' : ' years');
  return num + ' yil';
}
