import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Apple uslubidagi neytral palitra: oq/kulrang sirtlar, bitta aksent rang, toza tipografiya
const base = {
  light: {
    dark: false,
    bg: '#F2F2F7', surface: '#FFFFFF', ink: '#0B0B0F', muted: '#6E6E73', line: '#E5E5EA', chip: '#EFEFF4',
    price: '#1A8F3C', danger: '#D70015', dangerSoft: '#FFECEC',
    gold: '#B8860B', goldSoft: '#FFF6DD', goldInk: '#2A1F00',
    cover: ['#E8EEFF', '#FFEFE2', '#E3F6EC', '#FCE8F1', '#EFE9FF', '#FFF5D6'], coverInk: '#0B0B0F',
    card: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06)',
  },
  dark: {
    dark: true,
    bg: '#000000', surface: '#1C1C1E', ink: '#F5F5F7', muted: '#8E8E93', line: '#2C2C2E', chip: '#2C2C2E',
    price: '#30D158', danger: '#FF453A', dangerSoft: '#3A1414',
    gold: '#FFC94A', goldSoft: '#33290F', goldInk: '#1A1405',
    cover: ['#1C2547', '#3A2614', '#123323', '#3A1A2B', '#261F45', '#3A3210'], coverInk: '#F5F5F7',
    card: 'none',
  },
};

// Ilova rangi: har biri kunduzgi va tungi rejim uchun alohida moslangan
export const ACCENTS = {
  blue:   { name: "Ko'k",       light: ['#2453E6', '#FFFFFF', '#EAF0FF'], dark: ['#6F92FF', '#000000', '#1A2547'] },
  green:  { name: 'Yashil',     light: ['#1A8F3C', '#FFFFFF', '#E3F6EA'], dark: ['#30D158', '#000000', '#12321D'] },
  violet: { name: 'Binafsha',   light: ['#6E44D8', '#FFFFFF', '#F0EAFF'], dark: ['#B69CFF', '#000000', '#2A2050'] },
  orange: { name: "To'q sariq", light: ['#E0620B', '#FFFFFF', '#FFEFE2'], dark: ['#FF9F0A', '#000000', '#3D2508'] },
  pink:   { name: 'Pushti',     light: ['#D1205F', '#FFFFFF', '#FDE6EF'], dark: ['#FF6FA5', '#000000', '#45172C'] },
  teal:   { name: 'Feruza',     light: ['#0A8A96', '#FFFFFF', '#DDF4F6'], dark: ['#40C8E0', '#000000', '#0E3540'] },
};
export const MODES = [['system', 'Tizim'], ['light', 'Kunduzgi'], ['dark', 'Tungi']]; // nomlari tr() orqali ko'rsatiladi

function build(isDark, accent) {
  const b = isDark ? base.dark : base.light;
  const a = (ACCENTS[accent] || ACCENTS.blue)[isDark ? 'dark' : 'light'];
  return { ...b, accent: a[0], accentInk: a[1], accentSoft: a[2] };
}

const Ctx = createContext({ t: build(false, 'blue'), mode: 'system', accent: 'blue', setMode: () => {}, setAccent: () => {} });

export function ThemeProvider({ children }) {
  const sys = useColorScheme();
  const [mode, setModeS] = useState('system');
  const [accent, setAccentS] = useState('blue');
  useEffect(() => {
    AsyncStorage.multiGet(['theme_mode', 'theme_accent']).then((r) => {
      const m = r[0][1], a = r[1][1];
      if (m && ['system', 'light', 'dark'].includes(m)) setModeS(m);
      if (a && ACCENTS[a]) setAccentS(a);
    }).catch(() => {});
  }, []);
  const isDark = mode === 'dark' || (mode === 'system' && sys === 'dark');
  const t = useMemo(() => build(isDark, accent), [isDark, accent]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = t.bg;
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', t.bg);
    }
  }, [t, isDark]);
  const value = useMemo(() => ({
    t, mode, accent,
    setMode: (m) => { setModeS(m); AsyncStorage.setItem('theme_mode', m); },
    setAccent: (a) => { setAccentS(a); AsyncStorage.setItem('theme_accent', a); },
  }), [t, mode, accent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx).t;
export const useThemeSettings = () => useContext(Ctx);

// Tizim shrifti (iPhone'da SF Pro, Android'da Roboto) — yuklab olish shart emas, tez ochiladi
const SYS = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', default: undefined });
export const FONT = {
  sys: SYS,
  display: { fontFamily: SYS, fontWeight: '800', letterSpacing: -0.5 },
  displayM: { fontFamily: SYS, fontWeight: '700', letterSpacing: -0.3 },
};

// Kartochka soyasi (sayt va telefon uchun)
export const cardShadow = (t) => (Platform.OS === 'web'
  ? (t.dark ? {} : { boxShadow: t.card })
  : (t.dark ? {} : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 }));
