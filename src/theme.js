import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const base = {
  light: {
    dark: false,
    bg: '#F2F3EE', surface: '#FFFFFF', ink: '#141D19', muted: '#5C6862', line: '#DADED4', chip: '#E6E9E0',
    price: '#0C7148', danger: '#B42318', dangerSoft: '#FDECEA',
    gold: '#C99500', goldSoft: '#FFF4CF', goldInk: '#2A1F00',
    cover: ['#DCE6FF', '#FFE7C7', '#D6F2E3', '#F7DCEB', '#E9E1FF', '#FFF1B8'], coverInk: '#141D19',
  },
  dark: {
    dark: true,
    bg: '#0E1311', surface: '#171E1B', ink: '#E9EFEA', muted: '#9AA69F', line: '#28322D', chip: '#212A26',
    price: '#5BD49A', danger: '#FF8A7A', dangerSoft: '#3A1D1A',
    gold: '#F2C440', goldSoft: '#3A2F0E', goldInk: '#1A1405',
    cover: ['#24305A', '#4A3518', '#173D2B', '#45213A', '#2F2557', '#433A10'], coverInk: '#F1F4F1',
  },
};

// Ilova rangi: har biri kunduzgi va tungi rejim uchun alohida moslangan
export const ACCENTS = {
  blue:   { name: "Ko'k",       light: ['#1E48D6', '#FFFFFF', '#E3E9FF'], dark: ['#7E9BFF', '#0E1311', '#1F2950'] },
  green:  { name: 'Yashil',     light: ['#0B7A4B', '#FFFFFF', '#DDF3E8'], dark: ['#4FD49A', '#0E1311', '#143A2A'] },
  violet: { name: 'Binafsha',   light: ['#6D3FD6', '#FFFFFF', '#ECE4FF'], dark: ['#B39BFF', '#0E1311', '#2D2350'] },
  orange: { name: "To'q sariq", light: ['#D45A0A', '#FFFFFF', '#FFEADB'], dark: ['#FF9D57', '#0E1311', '#43260F'] },
  pink:   { name: 'Pushti',     light: ['#C2185B', '#FFFFFF', '#FCE1EC'], dark: ['#FF7EB2', '#0E1311', '#4A1A2E'] },
  teal:   { name: 'Feruza',     light: ['#00838F', '#FFFFFF', '#D8F3F5'], dark: ['#4DD6E0', '#0E1311', '#0F3A3E'] },
};
export const MODES = [['system', 'Tizim'], ['light', 'Kunduzgi'], ['dark', 'Tungi']];

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

export const FONT = {
  display: 'Unbounded_700Bold',
  displayM: 'Unbounded_500Medium',
};
