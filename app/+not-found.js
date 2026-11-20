// Mavjud bo'lmagan sahifa (eski yoki xato havola)
import React from 'react';
import { Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { Btn } from '../src/ui';
import { tr } from '../src/i18n';

export default function NotFound() {
  const t = useT();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Stack.Screen options={{ title: tr("Sahifa topilmadi") }} />
      <View style={{ maxWidth: 420, width: '100%', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="compass-outline" size={44} color={t.accent} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink, textAlign: 'center' }}>{tr("Sahifa topilmadi")}</Text>
        <Text style={{ color: t.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' }}>
          {tr("Havola eskirgan yoki xato yozilgan bo'lishi mumkin. Bosh sahifadan kerakli e'lonni toping.")}
        </Text>
        <Btn title={tr("Bosh sahifa")} icon="home-outline" onPress={() => router.replace('/')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </View>
    </View>
  );
}
