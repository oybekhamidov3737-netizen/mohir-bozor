// Pastki menyu — Apple iOS 26 "Liquid Glass" tab bar uslubida.
//  • Panel ekran chetidan ajralib suzib turadi: shaffof shisha, orqadagi kontent xira ko'rinadi.
//  • Tanlangan bo'lim — yumshoq kulrang "kapsula" ichida, rangli belgi bilan.
//  • Barmoq tekkanda kapsula shisha tomchiga (lupa) aylanib kattalashadi va ostidagi belgilarni
//    kattalashtirib ko'rsatadi; barmoq bilan surilsa tomchi ergashadi, qo'yib yuborilganda o'sha bo'lim ochiladi.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useT } from './theme';
import { Glass } from './glass';

const ND = Platform.OS !== 'web';
const WEB = Platform.OS === 'web';
const BAR_H = 64;
const PAD = 4;
const PILL_H = BAR_H - 10;
const LIFT = 0.34; // tomchi qancha kattalashadi (lupa)
const ICONS = { index: 'home', favorites: 'heart', chats: 'chatbubble', cabinet: 'person' };

const bottomGap = (ins) => Math.max(10, ins.bottom - 4);

// Panel ostida qolib ketmasligi uchun sahifalarning pastki bo'sh joyi
export function useTabBarSpace() {
  const ins = useSafeAreaInsets();
  return BAR_H + bottomGap(ins) + 20;
}

const haptic = (kind) => {
  if (!ND) return;
  try { kind === 'light' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : Haptics.selectionAsync(); } catch (e) {}
};

export function GlassTabBar({ state, descriptors, navigation }) {
  const t = useT();
  const ins = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const routes = state.routes;
  const n = routes.length;
  const barW = Math.min(width - 24, 520);
  const itemW = (barW - PAD * 2) / n;
  const pillW = Math.min(itemW - 4, 96);
  const center = routes.findIndex((r) => r.name === 'new');
  const dark = t.dark;

  const pos = useRef(new Animated.Value(state.index)).current;   // tomchi joyi (bo'lim raqami, kasr ham)
  const hold = useRef(new Animated.Value(0)).current;             // 0 — kapsula, 1 — ko'tarilgan tomchi (lupa)
  const stretch = useRef(new Animated.Value(0)).current;          // sirpanishdagi suyuq cho'zilish
  const live = useRef({ state, navigation });
  live.current = { state, navigation };
  const start = useRef(state.index);
  const cancelTimer = useRef(null);

  const springTo = (v, toValue, cfg = {}) => Animated.spring(v, { toValue, useNativeDriver: ND, stiffness: 320, damping: 26, mass: 0.9, ...cfg });
  const slide = (i) => {
    Animated.parallel([
      springTo(pos, i, { stiffness: 260, damping: 24 }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1, duration: 110, useNativeDriver: ND }),
        springTo(stretch, 0, { stiffness: 260, damping: 13 }),
      ]),
    ]).start();
  };
  const lift = (on) => springTo(hold, on ? 1 : 0, on ? { stiffness: 420, damping: 24 } : { stiffness: 300, damping: 14 }).start();

  const last = useRef(state.index);
  useEffect(() => {
    if (last.current !== state.index) { last.current = state.index; slide(state.index); }
  }, [state.index]);

  const go = (i) => {
    const { state: st, navigation: nav } = live.current;
    const route = st.routes[i];
    if (!route) return;
    const ev = nav.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!ev.defaultPrevented && st.index !== i) { nav.navigate(route.name, route.params); haptic(); }
  };

  // Barmoq bilan surish
  const clamp = (v) => Math.max(0, Math.min(n - 1, v));
  const nearest = (p) => {
    let i = Math.round(p);
    if (i === center) i = p < center ? center - 1 : center + 1;
    return Math.max(0, Math.min(n - 1, i));
  };
  const pan = useMemo(() => {
    const want = (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4;
    return PanResponder.create({
      onMoveShouldSetPanResponder: want,
      onMoveShouldSetPanResponderCapture: want,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        clearTimeout(cancelTimer.current);
        pos.stopAnimation((v) => { start.current = v; });
        lift(true);
        haptic('light');
      },
      onPanResponderMove: (_, g) => { pos.setValue(clamp(start.current + g.dx / itemW)); },
      onPanResponderRelease: (_, g) => {
        const i = nearest(clamp(start.current + g.dx / itemW));
        lift(false);
        springTo(pos, i, { stiffness: 260, damping: 22 }).start();
        if (i !== live.current.state.index) go(i);
      },
      onPanResponderTerminate: () => { lift(false); slide(live.current.state.index); },
    });
  }, [itemW, n, center]);

  // Bosilganda: tomchi o'sha bo'limga sirpanib, kattalashadi; qo'yib yuborilganda kapsulaga qaytadi
  const pressIn = (i) => {
    clearTimeout(cancelTimer.current);
    if (i === center) return;
    lift(true);
    springTo(pos, i, { stiffness: 300, damping: 24 }).start();
  };
  const pressOut = (i) => {
    if (i === center) return;
    lift(false);
    // Bosish bekor qilinsa (masalan, sahifa surildi) — tanlangan bo'limga qaytish
    cancelTimer.current = setTimeout(() => { if (live.current.state.index !== i) slide(live.current.state.index); }, 160);
  };

  const pillX0 = PAD + (itemW - pillW) / 2;
  const lensX = pos.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [pillX0, pillX0 + Math.max(1, n - 1) * itemW] });
  const scale = Animated.add(1, Animated.multiply(hold, LIFT));
  const scaleX = Animated.add(1, Animated.multiply(stretch, 0.22));
  const lensTransform = [{ translateX: lensX }, { scale }, { scaleX }];

  // Ranglar (Apple: tanlanmagan belgi — asosiy matn rangi, tanlangan — aksent)
  const baseInk = t.muted;
  const pillFill = t.accentSoft;
  const dropFill = dark ? '#43494F' : '#FFFFFF';
  const barBg = dark ? 'rgba(28,32,34,0.55)' : 'rgba(255,255,255,0.5)';

  const renderItem = (route, i, tone) => {
    const opts = descriptors[route.key]?.options || {};
    const label = typeof opts.title === 'string' ? opts.title : route.name;
    if (i === center) {
      return (
        <View key={route.key + tone} style={{ width: itemW, height: BAR_H, alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#5A7BFF', '#2747D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
            ...(WEB ? { boxShadow: '0 6px 16px rgba(39,71,214,0.45)' } : { shadowColor: '#2747D6', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }) }}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </View>
      );
    }
    const on = tone === 'accent';
    const color = on ? t.accent : baseInk;
    const badge = opts.tabBarBadge;
    const name = ICONS[route.name] || 'ellipse';
    return (
      <View key={route.key + tone} style={{ width: itemW, height: BAR_H, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <View style={{ width: 30, height: 27, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={on ? name : name + '-outline'} size={24} color={color} />
          {badge ? (
            <View style={{ position: 'absolute', top: -4, right: -9, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: on ? '700' : '600', color, maxWidth: itemW - 2 }}>{label}</Text>
      </View>
    );
  };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: bottomGap(ins) }}>
      <View style={{ width: barW, height: BAR_H }}>
        {/* 1) Shisha panel va oddiy (tanlanmagan) belgilar */}
        <Glass dark={dark} dataSet={{ glassTabbar: '1' }} {...pan.panHandlers}
          style={{ position: 'absolute', left: 0, top: 0, width: barW, height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: barBg,
            borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)',
            ...(WEB ? { boxShadow: dark
              ? '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)'
              : '0 10px 30px rgba(15,25,60,0.14), 0 1px 3px rgba(15,25,60,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.4)' }
              : { shadowColor: '#0B1640', shadowOpacity: dark ? 0.5 : 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 }) }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: PAD }}>
            {routes.map((route, i) => {
              const opts = descriptors[route.key]?.options || {};
              const label = typeof opts.title === 'string' ? opts.title : route.name;
              return (
                <Pressable key={route.key} onPress={() => go(i)} onPressIn={() => pressIn(i)} onPressOut={() => pressOut(i)}
                  accessibilityRole={i === center ? 'button' : 'tab'} accessibilityLabel={label} accessibilityState={i === center ? undefined : { selected: state.index === i }}
                  style={({ pressed }) => ({ width: itemW, height: BAR_H, transform: i === center && pressed ? [{ scale: 0.92 }] : undefined })}>
                  {renderItem(route, i, 'base')}
                </Pressable>
              );
            })}
          </View>
        </Glass>

        {/* 2) Ko'tarilgan tomchining soyasi */}
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: 5, left: 0, width: pillW, height: PILL_H, borderRadius: PILL_H / 2, backgroundColor: dropFill, opacity: hold,
          transform: lensTransform,
          ...(WEB ? { boxShadow: dark ? '0 10px 26px rgba(0,0,0,0.55)' : '0 10px 26px rgba(15,25,60,0.22)' } : { shadowColor: '#000', shadowOpacity: dark ? 0.5 : 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }),
        }} />

        {/* 3) Kapsula / lupa: ichida tanlangan (rangli) belgilar — tomchi kattalashganda ular ham kattalashadi */}
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: 5, left: 0, width: pillW, height: PILL_H, borderRadius: PILL_H / 2, overflow: 'hidden', backgroundColor: pillFill,
          transform: lensTransform,
        }}>
          <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: dropFill, opacity: hold }} />
          <Animated.View style={{ position: 'absolute', top: -5, left: 0, width: barW, height: BAR_H, flexDirection: 'row', paddingHorizontal: PAD,
            transform: [{ translateX: Animated.multiply(lensX, -1) }] }}>
            {routes.map((route, i) => renderItem(route, i, 'accent'))}
          </Animated.View>
          {/* Shisha tomchining yorug' qirrasi va sinish (refraksiya) aksi */}
          <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: hold }}>
            <LinearGradient colors={dark ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
              style={{ position: 'absolute', left: 6, right: 6, top: 1, height: PILL_H * 0.42, borderRadius: PILL_H / 2 }} />
            <LinearGradient start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              colors={dark ? ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)'] : ['rgba(20,40,90,0.08)', 'rgba(20,40,90,0)', 'rgba(20,40,90,0)', 'rgba(20,40,90,0.08)']}
              locations={[0, 0.22, 0.78, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: PILL_H / 2, borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,1)',
              ...(WEB ? { boxShadow: dark ? 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.3)' : 'inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 8px rgba(20,40,90,0.08)' } : {}) }} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
