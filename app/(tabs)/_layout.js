import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useT } from '../../src/theme';
import { useApp, useRequire } from '../../src/app-context';
import { GlassTabBar } from '../../src/glass-tabbar';
import { tr } from '../../src/i18n';

// Pastki menyu: Apple "Liquid Glass" uslubidagi shaffof panel (src/glass-tabbar.js)
export default function TabsLayout() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { unread, fav } = useApp();
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{
      headerShown: false,
      animation: 'shift',
      sceneStyle: { backgroundColor: t.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: tr("Asosiy") }} />
      <Tabs.Screen name="favorites" options={{ title: tr("Saralangan"), tabBarBadge: fav.length || undefined }} />
      <Tabs.Screen name="new" options={{ title: tr("Joylash") }}
        listeners={{ tabPress: (e) => { e.preventDefault(); if (need('/post')) router.push('/post'); } }} />
      <Tabs.Screen name="chats" options={{ title: tr("Xabarlar"), tabBarBadge: unread || undefined }} />
      <Tabs.Screen name="cabinet" options={{ title: tr("Kabinet") }} />
    </Tabs>
  );
}
