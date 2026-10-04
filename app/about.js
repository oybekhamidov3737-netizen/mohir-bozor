// Ilova haqida
import React from 'react';
import { Image, Linking, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { BUILD_ID } from '../src/updater';
import { MenuGroup } from '../src/ui';
import { WEB_URL } from '../src/config';
import { tr } from '../src/i18n';

export default function About() {
  const t = useT();
  const router = useRouter();
  const { config } = useApp();
  const phone = config.support_phone || '+998 91 001 88 18';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
      <Stack.Screen options={{ title: tr('Ilova haqida') }} />
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 16 }}>
        <Image source={require('../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 26 }} />
        <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>mohir bozor</Text>
        <Text style={{ color: t.muted }}>{tr('Versiya')} 1.0 · {BUILD_ID || '—'}</Text>
      </View>
      <Text style={{ color: t.ink, lineHeight: 22, textAlign: 'center' }}>{tr("Mohir bozor — O'zbekistondagi SMM mutaxassislari, montajchilar, mobilograflar, dizaynerlar va marketologlar uchun e'lonlar platformasi. Ijodkor xizmatini joylaydi, mijoz uni topib, ilova ichida yozadi.")}</Text>
      <MenuGroup items={[
        { icon: 'call', title: tr("Qo'ng'iroq qilish"), sub: phone, color: '#0C9A6A', onPress: () => Linking.openURL('tel:' + phone.replace(/[^\d+]/g, '')).catch(() => {}) },
        { icon: 'globe', title: tr('Sayt'), sub: WEB_URL.replace('https://', ''), color: '#2747D6', onPress: () => Linking.openURL(WEB_URL).catch(() => {}) },
        { icon: 'reader', title: tr('Foydalanish shartlari'), color: '#6A3FE0', onPress: () => router.push('/terms') },
        { icon: 'lock-closed', title: tr('Maxfiylik siyosati'), color: '#F08A00', onPress: () => router.push('/privacy') },
      ]} />
      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center' }}>© 2026 Mohir bozor · Buxoro</Text>
    </ScrollView>
  );
}
