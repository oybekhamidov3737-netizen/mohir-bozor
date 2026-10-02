// Asosiy sahifa bloklari: gradient banner, statistika, kategoriya kartalari,
// "Qanday ishlaydi" va top ijodkorlar.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { CATS, GRAD, REG_NAMES } from './data';
import { supabase } from './supabase';
import { fmtNum } from './format';
import { Avatar, Press } from './ui';

const ND = Platform.OS !== 'web';
const WORDS = ['SMMchi', 'montajchi', 'mobilograf', 'targetolog', 'dizayner', 'kopirayter', 'fotograf', 'bloger'];

function Rotator() {
  const [i, setI] = useState(0);
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(a, { toValue: 0, duration: 200, useNativeDriver: ND }).start(() => {
        setI((x) => (x + 1) % WORDS.length);
        Animated.spring(a, { toValue: 1, friction: 6, tension: 120, useNativeDriver: ND }).start();
      });
    }, 2200);
    return () => clearInterval(id);
  }, [a]);
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFC43D', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, marginVertical: 4, transform: [{ rotate: '-2deg' }] }}>
      <Animated.Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#1A1405', opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
        {WORDS[i]}
      </Animated.Text>
    </View>
  );
}

// Banner ichida suzib yuruvchi kategoriya belgilari
function Floater({ icon, size, x, y, delay, dur, bg }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(a, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    l.start();
    return () => l.stop();
  }, [a]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', right: x, top: y, width: size, height: size, borderRadius: size * 0.32,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      transform: [
        { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
        { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) },
      ],
    }}>
      <Ionicons name={icon} size={size * 0.5} color="#fff" />
    </Animated.View>
  );
}

// Raqam 0 dan sanab chiqadi
function CountUp({ value, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value) { setN(0); return; }
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <Text style={style}>{fmtNum(n)}</Text>;
}

export function useStats() {
  const [s, setS] = useState({ ads: 0, users: 0, cats: {} });
  useEffect(() => {
    (async () => {
      try {
        const [a, u, c] = await Promise.all([
          supabase.from('ad_feed').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('ad_feed').select('cat').limit(3000),
        ]);
        const cats = {};
        (c.data || []).forEach((r) => { cats[r.cat] = (cats[r.cat] || 0) + 1; });
        setS({ ads: a.count || 0, users: u.count || 0, cats });
      } catch (e) {}
    })();
  }, []);
  return s;
}

export function Hero({ stats, onPost, onRegion }) {
  return (
    <LinearGradient colors={['#4A6CFF', '#2747D6', '#1631B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ marginTop: 14, borderRadius: 26, padding: 20, paddingBottom: 18, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: 40, bottom: -90, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <Floater icon="film" size={44} x={18} y={18} delay={0} dur={1800} bg="rgba(255,161,85,0.95)" />
      <Floater icon="camera" size={36} x={76} y={64} delay={400} dur={2100} bg="rgba(52,219,165,0.95)" />
      <Floater icon="color-palette" size={34} x={14} y={88} delay={800} dur={1900} bg="rgba(255,119,174,0.95)" />
      <Floater icon="sparkles" size={28} x={70} y={10} delay={200} dur={1600} bg="rgba(255,207,85,0.95)" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#34DBA5' }} />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Ijodkorlar bozori · O'zbekiston</Text>
      </View>
      <Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#fff', lineHeight: 32 }}>Kerakli</Text>
      <Rotator />
      <Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#fff', lineHeight: 32 }}>shu yerda</Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8, marginBottom: 16, lineHeight: 20, maxWidth: 300 }}>
        Barcha viloyat va tumanlardagi ijodkorlar. Narxni ko'ring, ilova ichida yozing.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Press onPress={onPost} style={{ backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="add-circle" size={18} color="#2747D6" />
          <Text style={{ color: '#2747D6', fontWeight: '800' }}>E'lon joylash</Text>
        </Press>
        <Press onPress={onRegion} style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, paddingHorizontal: 16, height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>Hudud</Text>
        </Press>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: 16, paddingVertical: 12 }}>
        {[[stats.ads, "e'lon"], [stats.users, 'ijodkor'], [12, 'viloyat']].map(([v, l], i) => (
          <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: 'rgba(255,255,255,0.15)' }}>
            <CountUp value={v} style={{ fontFamily: FONT.display, fontSize: 20, color: '#fff' }} />
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' }}>{l}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

export function CatRow({ counts, onPick }) {
  const t = useT();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
      {CATS.map((c) => (
        <Press key={c.id} onPress={() => onPick(c.id)} style={{ width: 118 }}>
          <LinearGradient colors={GRAD[c.c]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ height: 120, borderRadius: 20, padding: 12, justifyContent: 'space-between', overflow: 'hidden' }}>
            <View pointerEvents="none" style={{ position: 'absolute', right: -24, bottom: -24, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.16)' }} />
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={c.icon.replace('-outline', '')} size={22} color="#fff" />
            </View>
            <View>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }} numberOfLines={2}>{c.n}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>{counts[c.id] ? `${counts[c.id]} ta e'lon` : 'Yangi'}</Text>
            </View>
          </LinearGradient>
        </Press>
      ))}
    </ScrollView>
  );
}

export function HowItWorks() {
  const t = useT();
  const steps = [
    ['search', 'Toping', "Kategoriya va hudud bo'yicha ijodkorni tanlang"],
    ['chatbubbles', 'Yozing', 'Ilova ichidagi chatda narx va muddatni kelishing'],
    ['rocket', 'Natija', "Ishni oling, keyingi safar yana shu yerdan toping"],
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {steps.map(([ic, h, d], i) => (
        <View key={h} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 18, padding: 12, gap: 6, borderWidth: 1, borderColor: t.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={ic} size={18} color={t.accent} />
            </View>
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: t.line }}>{i + 1}</Text>
          </View>
          <Text style={{ color: t.ink, fontWeight: '800', fontSize: 14 }}>{h}</Text>
          <Text style={{ color: t.muted, fontSize: 11.5, lineHeight: 15 }}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

export function TopCreators({ people, onOpen }) {
  const t = useT();
  if (!people.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
      {people.map((p) => (
        <Pressable key={p.id} onPress={() => onOpen(p)} style={{ width: 74, alignItems: 'center', gap: 6 }}>
          <LinearGradient colors={['#FFC43D', '#FF77AE', '#6A8BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 2.5, borderRadius: 24 }}>
            <View style={{ backgroundColor: t.bg, padding: 2, borderRadius: 22 }}>
              <Avatar profile={p} name={p.name} size={60} />
            </View>
          </LinearGradient>
          <Text style={{ color: t.ink, fontSize: 12, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{(p.name || '').split(' ')[0]}</Text>
          <Text style={{ color: t.muted, fontSize: 10.5, marginTop: -4 }} numberOfLines={1}>{p.n} ta e'lon</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Uzum uslubidagi "stories" doirachalari (kategoriyalar)
export function Stories({ onPick }) {
  const t = useT();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16, paddingVertical: 12 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
      {CATS.map((c) => (
        <Press key={c.id} onPress={() => onPick(c.id)} style={{ width: 70, alignItems: 'center', gap: 6 }}>
          <LinearGradient colors={['#FFC43D', '#FF5E8A', '#7B5CFF']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ padding: 2.5, borderRadius: 999 }}>
            <View style={{ backgroundColor: t.bg, padding: 2.5, borderRadius: 999 }}>
              <LinearGradient colors={GRAD[c.c]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={c.icon.replace('-outline', '')} size={26} color="#fff" />
              </LinearGradient>
            </View>
          </LinearGradient>
          <Text style={{ fontSize: 11, fontWeight: '600', color: t.ink, textAlign: 'center' }} numberOfLines={1}>{c.n.split(',')[0]}</Text>
        </Press>
      ))}
    </ScrollView>
  );
}

// Avtomatik aylanuvchi reklama bannerlari
export function PromoCarousel({ width, slides }) {
  const t = useT();
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const touching = useRef(false);
  const W = width;
  useEffect(() => {
    const id = setInterval(() => {
      if (touching.current) return;
      setI((x) => {
        const n = (x + 1) % slides.length;
        ref.current?.scrollTo({ x: n * W, animated: true });
        return n;
      });
    }, 3800);
    return () => clearInterval(id);
  }, [W, slides.length]);
  return (
    <View style={{ marginTop: 4 }}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: W, borderRadius: 24 }}
        onTouchStart={() => { touching.current = true; }} onTouchEnd={() => { touching.current = false; }}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / W))}
        onScroll={Platform.OS === 'web' ? (e) => { const n = Math.round(e.nativeEvent.contentOffset.x / W); if (n !== i) setI(n); } : undefined} scrollEventThrottle={64}>
        {slides.map((s, k) => (
          <Pressable key={k} onPress={s.onPress} style={{ width: W }}>
            <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 168, borderRadius: 24, padding: 18, overflow: 'hidden', justifyContent: 'space-between' }}>
              <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <View pointerEvents="none" style={{ position: 'absolute', right: 18, top: 26, width: 96, height: 96, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] }}>
                <Ionicons name={s.icon} size={52} color="#fff" />
              </View>
              {s.tag ? <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{s.tag}</Text></View> : <View />}
              <View style={{ maxWidth: W - 150 }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 19, color: '#fff', lineHeight: 24 }}>{s.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12.5, marginTop: 4 }} numberOfLines={2}>{s.text}</Text>
              </View>
              <View style={{ alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: s.colors[s.colors.length - 1], fontWeight: '800', fontSize: 12.5 }}>{s.cta} →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 }}>
        {slides.map((_, k) => <View key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? t.accent : t.line }} />)}
      </View>
    </View>
  );
}

// Banner ostidagi kichik statistika qatori
export function StatStrip({ stats }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderRadius: 18, paddingVertical: 12, marginTop: 12 }}>
      {[[stats.ads, "faol e'lon", 'megaphone', '#2747D6'], [stats.users, 'ijodkor', 'people', '#0C9A6A'], [12, 'viloyat', 'map', '#F0532E']].map(([v, l, ic, c], k) => (
        <View key={l} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderLeftWidth: k ? 1 : 0, borderColor: t.line }}>
          <Ionicons name={ic} size={18} color={c} />
          <View>
            <CountUp value={v} style={{ fontFamily: FONT.display, fontSize: 16, color: t.ink }} />
            <Text style={{ color: t.muted, fontSize: 10.5, fontWeight: '600' }}>{l}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
