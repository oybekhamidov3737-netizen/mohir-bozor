import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useT } from '../../src/theme';
import { useApp, useRequire } from '../../src/app-context';
import { tr } from '../../src/i18n';

// Tanlangan tab belgisi sakrab kattalashadi
function TabIcon({ name, color, focused }) {
  const a = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: focused ? 1 : 0, friction: 4, tension: 160, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [focused]);
  return (
    <Animated.View style={{ transform: [
      { scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
      { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
    ] }}>
      <Ionicons name={focused ? name : name + '-outline'} size={23} color={color} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { unread, fav } = useApp();
  const icon = (n) => ({ color, focused }) => <TabIcon name={n} color={color} focused={focused} />;
  return (
    <Tabs screenListeners={{ tabPress: () => { if (Platform.OS !== 'web') { try { Haptics.selectionAsync(); } catch (e) {} } } }} screenOptions={{
      headerShown: false,
      animation: 'shift',
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.muted,
      tabBarStyle: {
        backgroundColor: t.surface, borderTopWidth: 0, height: Platform.OS === 'web' ? 66 : undefined,
        borderTopLeftRadius: 22, borderTopRightRadius: 22, position: Platform.OS === 'web' ? 'relative' : undefined,
        ...(Platform.OS === 'web' ? { boxShadow: '0 -6px 24px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12 }),
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      sceneStyle: { backgroundColor: t.bg },
    }}>
      <Tabs.Screen name="index" options={{ title: tr("E'lonlar"), tabBarIcon: icon('storefront') }} />
      <Tabs.Screen name="favorites" options={{ title: tr("Saralangan"), tabBarIcon: icon('heart'), tabBarBadge: fav.length || undefined }} />
      <Tabs.Screen name="new" options={{
        title: tr("E'lon bering"),
        tabBarIcon: () => (
          <LinearGradient colors={['#5A7BFF', '#2747D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{
            width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: -22,
            borderWidth: 4, borderColor: t.surface,
            ...(Platform.OS === 'web' ? { boxShadow: '0 6px 16px rgba(39,71,214,0.45)' } : { shadowColor: '#2747D6', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
          }}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        ),
        tabBarActiveTintColor: t.ink, tabBarInactiveTintColor: t.ink,
      }} listeners={{ tabPress: (e) => { e.preventDefault(); if (need('/post')) router.push('/post'); } }} />
      <Tabs.Screen name="chats" options={{ title: tr("Chat"), tabBarIcon: icon('chatbubble'), tabBarBadge: unread || undefined }} />
      <Tabs.Screen name="cabinet" options={{ title: tr("Profilim"), tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
