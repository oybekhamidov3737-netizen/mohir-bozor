import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Unbounded_500Medium, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { AppProvider } from '../src/app-context';
import { useT } from '../src/theme';
import { isConfigured } from '../src/config';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Root() {
  const t = useT();
  const [loaded, err] = useFonts({ Unbounded_500Medium, Unbounded_700Bold });
  useEffect(() => { if (loaded || err) SplashScreen.hideAsync().catch(() => {}); }, [loaded, err]);
  if (!loaded && !err) return null;

  if (!isConfigured()) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: t.ink, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
          Ilova hali serverga ulanmagan.{'\n'}src/config.js fayliga Supabase manzili va kalitini yozing.
        </Text>
      </View>
    );
  }

  const header = {
    headerStyle: { backgroundColor: t.bg },
    headerTintColor: t.ink,
    headerShadowVisible: false,
    headerBackTitle: 'Orqaga',
    contentStyle: { backgroundColor: t.bg },
  };

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Stack screenOptions={header}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ad/[id]" options={{ title: '' }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Suhbat' }} />
          <Stack.Screen name="post" options={{ title: "E'lon", presentation: 'modal' }} />
          <Stack.Screen name="login" options={{ title: 'Kirish', presentation: 'modal' }} />
          <Stack.Screen name="profile" options={{ title: 'Kabinet', presentation: 'modal' }} />
          <Stack.Screen name="promo/[id]" options={{ title: 'Reklama va xizmatlar', presentation: 'modal' }} />
          <Stack.Screen name="admin" options={{ title: 'Boshqaruv paneli' }} />
          <Stack.Screen name="privacy" options={{ title: 'Maxfiylik siyosati' }} />
          <Stack.Screen name="terms" options={{ title: 'Foydalanish shartlari' }} />
          <Stack.Screen name="support" options={{ title: "Qo'llab-quvvatlash" }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
