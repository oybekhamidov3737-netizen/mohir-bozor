// Pastki menyu — Apple "Liquid Glass" uslubida.
//  • Panel ekran chetidan ajralib turadi, shaffof shisha: orqadagi kontent xira ko'rinadi.
//  • Tanlangan bo'lim ustida shisha "linza" turadi; bo'lim almashganda u suyuqlikdek cho'zilib sirpanadi.
//  • Linza ostidagi belgi kattalashadi (lupa effekti). Barmoq bilan panel bo'ylab surib bo'lim tanlash mumkin.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useT } from './theme';
import { Glass } from './glass';

const ND = Platform.OS !== 'web';
const BAR_H = 66;
const PAD = 6;
const ICONS = { index: 'home', favorites: 'heart', chats: 'chatbubble', cabinet: 'person' };

const bottomGap = (ins) => Math.max(10, ins.bottom - 4);

// Panel ostida qolib ketmasligi uchun sahifalarning pastki bo'sh joyi
export function useTabBarSpace() {
  const ins = useSafeAreaInsets();
  return BAR_H + bottomGap(ins) + 20;
}

const haptic = () => { if (ND) { try { Haptics.selectionAsync(); } catch (e) {} } };

export function GlassTabBar({ state, descriptors, navigation }) {
  const t = useT();
  const ins = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const routes = state.routes;
  const n = routes.length;
  const barW = Math.min(width - 24, 540);
  const itemW = (barW - PAD * 2) / n;
  const center = routes.findIndex((r) => r.name === 'new');

  const pos = useRef(new Animated.Value(state.index)).current;   // linza joyi (bo'lim raqami, kasr ham)
  const stretch = useRef(new Animated.Value(0)).current;          // sirpanishda cho'zilish
  const hold = useRef(new Animated.Value(0)).current;             // barmoq tekkanda kattalashish
  const live = useRef({ state, navigation });
  live.current = { state, navigation };
  const start = useRef(state.index);

  const settle = (i) => {
    Animated.parallel([
      Animated.spring(pos, { toValue: i, useNativeDriver: ND, stiffness: 260, damping: 22, mass: 0.9 }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1, duration: 120, useNativeDriver: ND }),
        Animated.spring(stretch, { toValue: 0, useNativeDriver: ND, stiffness: 240, damping: 11 }),
      ]),
    ]).start();
  };
  const last = useRef(state.index);
  useEffect(() => {
    if (last.current !== state.index) { last.current = state.index; settle(state.index); }
  }, [state.index]);

  const go = (i) => {
    const { state: st, navigation: nav } = live.current;
    const route = st.routes[i];
    if (!route) return;
    const ev = nav.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!ev.defaultPrevented && st.index !== i) nav.navigate(route.name, route.params);
    haptic();
  };

  // Barmoq bilan surish: linza barmoqqa ergashadi, qo'yib yuborilganda eng yaqin bo'limga o'tadi
  const clamp = (v) => Math.max(0, Math.min(n - 1, v));
  const nearest = (p) => {
    let i = Math.round(p);
    if (i === center) i = p < center ? center - 1 : center + 1;
    return Math.max(0, Math.min(n - 1, i));
  };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      pos.stopAnimation((v) => { start.current = v; });
      Animated.spring(hold, { toValue: 1, useNativeDriver: ND, stiffness: 300, damping: 18 }).start();
    },
    onPanResponderMove: (_, g) => { pos.setValue(clamp(start.current + g.dx / itemW)); },
    onPanResponderRelease: (_, g) => {
      Animated.spring(hold, { toValue: 0, useNativeDriver: ND, stiffness: 260, damping: 16 }).start();
      const i = nearest(clamp(start.current + g.dx / itemW));
      if (i !== live.current.state.index) go(i); else settle(i);
    },
    onPanResponderTerminate: () => {
      Animated.spring(hold, { toValue: 0, useNativeDriver: ND }).start();
      settle(live.current.state.index);
    },
  }), [itemW, n, center]);

  const lensW = itemW - 2;
  const lensH = BAR_H - 12;
  const translateX = pos.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [PAD + 1, PAD + 1 + Math.max(1, n - 1) * itemW] });
  const scaleX = Animated.add(1, Animated.add(Animated.multiply(stretch, 0.24), Animated.multiply(hold, 0.12)));
  const scaleY = Animated.add(1, Animated.add(Animated.multiply(stretch, -0.1), Animated.multiply(hold, 0.12)));

  const dark = t.dark;
  const lens = dark
    ? { backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.22)' }
    : { backgroundColor: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,1)' };
  const webLens = Platform.OS === 'web'
    ? { boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -6px 12px rgba(0,0,0,0.25), 0 6px 18px rgba(0,0,0,0.35)'
      : 'inset 0 1px 1px rgba(255,255,255,1), inset 0 -6px 14px rgba(30,72,214,0.10), 0 6px 18px rgba(18,32,80,0.16)' }
    : { shadowColor: '#000', shadowOpacity: dark ? 0.35 : 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } };
  const outerShadow = Platform.OS === 'web' ? {} : { shadowColor: '#0B1640', shadowOpacity: dark ? 0.5 : 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 14 };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: bottomGap(ins) }}>
      <View style={{ width: barW, height: BAR_H, borderRadius: BAR_H / 2, ...outerShadow }}>
        <Glass dark={dark} dataSet={{ glassTabbar: '1' }} style={{ flex: 1, borderRadius: BAR_H / 2 }} {...pan.panHandlers}>
          {/* Shisha yuzasidagi yorug' aks */}
          <LinearGradient pointerEvents="none" colors={dark ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: BAR_H * 0.55 }} />

          {/* Linza (tanlangan bo'lim) */}
          <Animated.View pointerEvents="none" style={{
            position: 'absolute', top: 6, left: 0, width: lensW, height: lensH, borderRadius: lensH / 2, borderWidth: 1, overflow: 'hidden',
            ...lens, ...webLens, transform: [{ translateX }, { scaleX }, { scaleY }],
          }}>
            <LinearGradient colors={dark ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,1)', 'rgba(255,255,255,0.15)']}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: lensH * 0.6 }} />
          </Animated.View>

          <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: PAD }}>
            {routes.map((route, i) => {
              const opts = descriptors[route.key]?.options || {};
              const label = typeof opts.title === 'string' ? opts.title : route.name;
              if (i === center) {
                return (
                  <Pressable key={route.key} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={label}
                    style={({ pressed }) => ({ width: itemW, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                    <LinearGradient colors={['#7A96FF', '#3D5EF0', '#2242D0']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
                      style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
                        ...(Platform.OS === 'web' ? { boxShadow: '0 6px 18px rgba(39,71,214,0.45), inset 0 1px 1px rgba(255,255,255,0.7)' } : { shadowColor: '#2747D6', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }) }}>
                      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} style={{ position: 'absolute', left: 4, right: 4, top: 2, height: 20, borderRadius: 12 }} />
                      <Ionicons name="add" size={28} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                );
              }
              const focused = state.index === i;
              const mag = pos.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
              const scale = mag.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
              const ty = mag.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });
              const badge = opts.tabBarBadge;
              const name = ICONS[route.name] || 'ellipse';
              return (
                <Pressable key={route.key} onPress={() => go(i)} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }}
                  style={{ width: itemW, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Animated.View style={{ width: 30, height: 26, alignItems: 'center', justifyContent: 'center', transform: [{ scale }, { translateY: ty }] }}>
                    <Animated.View style={{ position: 'absolute', opacity: Animated.subtract(1, mag) }}>
                      <Ionicons name={name + '-outline'} size={23} color={t.muted} />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', opacity: mag }}>
                      <Ionicons name={name} size={23} color={t.accent} />
                    </Animated.View>
                    {badge ? (
                      <View style={{ position: 'absolute', top: -5, right: -9, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: dark ? '#1A201D' : '#FFFFFF' }}>
                        <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{badge > 99 ? '99+' : badge}</Text>
                      </View>
                    ) : null}
                  </Animated.View>
                  <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: focused ? '700' : '600', color: focused ? t.accent : t.muted, maxWidth: itemW - 4 }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Glass>
      </View>
    </View>
  );
}
