// Faqat hisobga kirgan foydalanuvchilar uchun sahifalar.
// Kirmagan foydalanuvchi bunday sahifani ochsa (masalan, havola orqali) — cheksiz yuklanish o'rniga
// "Hisobingizga kiring" kartochkasi chiqadi va kirgandan keyin shu sahifaga qaytadi.
import React from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useT } from './theme';
import { useApp } from './app-context';
import { Empty, Loading } from './ui';
import { tr } from './i18n';

export function SignInCard({ text }) {
  const t = useT();
  const router = useRouter();
  const path = usePathname();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <Empty icon="person-circle" title={tr("Hisobingizga kiring")} text={text || tr("Bu bo'limdan foydalanish uchun hisobingizga kiring.")}
          action={tr("Kirish")} onAction={() => router.push({ pathname: '/login', params: { next: path } })} />
      </View>
    </View>
  );
}

// opts.title — sarlavha (matn yoki funksiya), opts.text — tushuntirish
export function withAuth(Screen, opts = {}) {
  function Guarded(props) {
    const t = useT();
    const { uid, ready } = useApp();
    const title = typeof opts.title === 'function' ? opts.title() : opts.title;
    if (uid) return <Screen {...props} />;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {title ? <Stack.Screen options={{ title }} /> : null}
        {!ready ? <Loading /> : <SignInCard text={typeof opts.text === 'function' ? opts.text() : opts.text} />}
      </View>
    );
  }
  Guarded.displayName = `withAuth(${Screen.displayName || Screen.name || 'Screen'})`;
  return Guarded;
}
