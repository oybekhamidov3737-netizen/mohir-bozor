import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from './theme';
import { useApp } from './app-context';
import { copyText } from './copy';
import { cardNumber, fmtCard } from './pay';
import { tr } from './i18n';

// To'lov rekviziti: karta raqami alohida, bir bosishda faqat raqam nusxalanadi
export function PayDetails({ text }) {
  const t = useT();
  const { toast } = useApp();
  const num = cardNumber(text);
  const rest = String(text || '')
    .split('\n')
    .filter((l) => !num || !l.replace(/\D/g, '').includes(num))
    .join('\n')
    .trim();
  const copy = () => {
    copyText(num || text).then((ok) => toast(ok ? (num ? tr("Karta raqami nusxalandi") : tr("Nusxalandi")) : tr("Nusxalab bo'lmadi, raqamni bosib turib nusxalang")));
  };
  return (
    <View style={{ gap: 8 }}>
      {num ? (
        <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={tr("Karta raqamini nusxalash")}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: pressed ? t.accentSoft : t.chip, borderRadius: 12, padding: 14 })}>
          <Ionicons name="card-outline" size={22} color={t.accent} />
          <Text selectable style={{ flex: 1, fontSize: 19, fontWeight: '800', letterSpacing: 1, color: t.ink }}>{fmtCard(num)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="copy-outline" size={14} color={t.accentInk} />
            <Text style={{ color: t.accentInk, fontWeight: '800', fontSize: 12 }}>{tr("Nusxa")}</Text>
          </View>
        </Pressable>
      ) : null}
      {rest ? <Text selectable style={{ color: t.ink, fontSize: 15, lineHeight: 22, paddingHorizontal: 4 }}>{rest}</Text> : null}
      {!num ? (
        <Pressable onPress={copy} style={{ alignSelf: 'flex-start' }}><Text style={{ color: t.accent, fontWeight: '700' }}>{tr("Nusxalash")}</Text></Pressable>
      ) : null}
    </View>
  );
}
