import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT, useThemeSettings, ACCENTS, MODES } from './theme';
import { tr, LANGS, setLang, useLang } from './i18n';

// Kunduzgi / tungi rejim va ilova rangini tanlash
export function LanguageCard() {
  const t = useT();
  const lang = useLang();
  return (
    <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 8, marginBottom: 10 }}>
      <Text style={{ fontWeight: '800', color: t.ink }}>Til · Язык · Language</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {LANGS.map(([k, name, flag]) => {
          const on = lang === k;
          return (
            <Pressable key={k} onPress={() => setLang(k)} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accentSoft : t.bg }}>
              <Text style={{ fontSize: 22 }}>{flag}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.accent : t.ink }}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppearanceCard() {
  const t = useT();
  const { mode, accent, setMode, setAccent, t: cur } = useThemeSettings();
  const icon = { system: 'phone-portrait-outline', light: 'sunny-outline', dark: 'moon-outline' };
  return (
    <>
    <LanguageCard />
    <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Rejim")}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MODES.map(([k, l]) => {
            const on = mode === k;
            return (
              <Pressable key={k} onPress={() => setMode(k)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accentSoft : t.bg }}>
                <Ionicons name={icon[k]} size={22} color={on ? t.accent : t.muted} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.accent : t.ink }}>{tr(l)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, color: t.muted }}>{tr("\"Tizim\" telefoningiz sozlamasiga qarab o'zi almashadi.")}</Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Ilova rangi")}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(ACCENTS).map(([k, a]) => {
            const on = accent === k;
            const c = a[cur.dark ? 'dark' : 'light'][0];
            return (
              <Pressable key={k} onPress={() => setAccent(k)} accessibilityRole="button" accessibilityLabel={tr(a.name)} accessibilityState={{ selected: on }}
                style={{ alignItems: 'center', gap: 4, width: 64 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 3 : 0, borderColor: t.ink }}>
                  {on ? <Ionicons name="checkmark" size={22} color={a[cur.dark ? 'dark' : 'light'][1]} /> : null}
                </View>
                <Text style={{ fontSize: 11, color: on ? t.ink : t.muted, fontWeight: on ? '800' : '500' }}>{tr(a.name)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
    </>
  );
}
