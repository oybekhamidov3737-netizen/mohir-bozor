import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Unbounded_500Medium, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { AppProvider } from '../src/app-context';
import * as Linking from 'expo-linking';
import { captureRef } from '../src/referral';
import { useAutoUpdate } from '../src/updater';
import { ThemeProvider, useT } from '../src/theme';
import { isConfigured } from '../src/config';
import { Intro, shouldShowIntro } from '../src/intro';
import { ScreenEnter } from '../src/enter';
import { tr, loadLang, useLang } from '../src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Har bir sahifadagi "orqaga" tugmasi: tarix bo'lsa orqaga, bo'lmasa (havola orqali kirilgan bo'lsa) bosh sahifaga
function BackBtn() {
  const t = useT();
  const router = useRouter();
  const go = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return (
    <Pressable onPress={go} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr("Orqaga")}
      style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center',
        marginLeft: Platform.OS === 'web' ? 12 : 0, marginRight: 8, transform: [{ scale: pressed ? 0.9 : 1 }],
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }) })}>
      <Ionicons name="chevron-back" size={22} color={t.ink} style={{ marginLeft: -2 }} />
    </Pressable>
  );
}

export default function Root() {
  const lang = useLang();
  const [langReady, setLangReady] = useState(false);
  useEffect(() => { loadLang().finally(() => setLangReady(true)); }, []);
  if (!langReady) return null;
  // Til almashganda butun ilova yangi tilda qayta chiziladi
  return (
    <ThemeProvider>
      <RootInner key={lang} />
    </ThemeProvider>
  );
}

function RootInner() {
  const t = useT();
  const [intro, setIntro] = useState(shouldShowIntro);
  const [loaded, err] = useFonts({ Unbounded_500Medium, Unbounded_700Bold });
  useEffect(() => { if (loaded || err) SplashScreen.hideAsync().catch(() => {}); }, [loaded, err]);
  useAutoUpdate();
  const url = Linking.useURL();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location) captureRef(window.location.href);
    if (url) captureRef(url);
  }, [url]);
  if (!loaded && !err) return null;

  if (!isConfigured()) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: t.ink, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
          {tr("Ilova hali serverga ulanmagan.")}{'\n'}{tr("src/config.js fayliga Supabase manzili va kalitini yozing.")}
        </Text>
      </View>
    );
  }

  const header = {
    headerStyle: { backgroundColor: t.bg },
    headerTintColor: t.ink,
    headerShadowVisible: false,
    headerBackTitle: tr("Orqaga"),
    headerBackVisible: false,
    headerLeft: () => <BackBtn />,
    contentStyle: { backgroundColor: t.bg },
  };

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style={intro || t.dark ? 'light' : 'dark'} />
        <Stack screenOptions={header} screenLayout={({ children }) => <ScreenEnter>{children}</ScreenEnter>}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ad/[id]" options={{ title: '' }} />
          <Stack.Screen name="chat/[id]" options={{ title: tr("Suhbat") }} />
          <Stack.Screen name="post" options={{ title: tr("E'lon"), presentation: 'modal' }} />
          <Stack.Screen name="login" options={{ title: tr("Kirish"), presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ title: tr("Kabinet"), presentation: 'modal' }} />
          <Stack.Screen name="promo/[id]" options={{ title: tr("Reklama va xizmatlar"), presentation: 'modal' }} />
          <Stack.Screen name="admin" options={{ title: tr("Boshqaruv paneli") }} />
          <Stack.Screen name="privacy" options={{ title: tr("Maxfiylik siyosati") }} />
          <Stack.Screen name="terms" options={{ title: tr("Foydalanish shartlari") }} />
          <Stack.Screen name="offer" options={{ title: tr("Ommaviy oferta") }} />
          <Stack.Screen name="support" options={{ title: tr("Qo'llab-quvvatlash") }} />
          <Stack.Screen name="topup" options={{ title: tr("Hisobni to'ldirish"), presentation: 'modal' }} />
        </Stack>
        {intro ? <Intro onDone={() => setIntro(false)} /> : null}
      </AppProvider>
    </SafeAreaProvider>
  );
}
