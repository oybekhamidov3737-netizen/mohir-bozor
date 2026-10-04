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
