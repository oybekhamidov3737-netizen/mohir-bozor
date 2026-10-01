import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../../src/theme';
import { useApp, useRequire } from '../../src/app-context';

export default function TabsLayout() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { unread, fav } = useApp();
  const icon = (n) => ({ color, focused }) => <Ionicons name={focused ? n : n + '-outline'} size={23} color={color} />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.muted,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line, height: Platform.OS === 'web' ? 62 : undefined },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      sceneStyle: { backgroundColor: t.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Asosiy', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Saralangan', tabBarIcon: icon('heart'), tabBarBadge: fav.length || undefined }} />
      <Tabs.Screen name="new" options={{
        title: 'Joylash',
        tabBarIcon: () => (
          <View style={{ width: 46, height: 30, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={22} color={t.accentInk} />
          </View>
        ),
        tabBarActiveTintColor: t.ink, tabBarInactiveTintColor: t.ink,
      }} listeners={{ tabPress: (e) => { e.preventDefault(); if (need('/post')) router.push('/post'); } }} />
      <Tabs.Screen name="chats" options={{ title: 'Xabarlar', tabBarIcon: icon('chatbubble'), tabBarBadge: unread || undefined }} />
      <Tabs.Screen name="cabinet" options={{ title: 'Kabinet', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
