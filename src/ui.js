import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useT, FONT, cardShadow } from './theme';
import { catOf, CAT_COLORS } from './data';
import { LinearGradient } from 'expo-linear-gradient';
import { adPhoto, publicUrl } from './supabase';
import { initials, isTop, isVip, locLabel, priceText, ago } from './format';
import { tr } from './i18n';

const ND = Platform.OS !== 'web';

// Bosilganda yengil siqiladi va darhol amal bajariladi (kechikishsiz). Telefonda yengil tebranish.
// Tasodifiy ikki marta bosilish 350 ms ichida e'tiborga olinmaydi.
export function Press({ onPress, style, children, disabled, hitSlop, accessibilityLabel, haptic = true }) {
  const s = useRef(new Animated.Value(1)).current;
  const lastAt = useRef(0);
  const down = () => Animated.spring(s, { toValue: 0.96, useNativeDriver: ND, speed: 60, bounciness: 0 }).start();
  const up = () => Animated.spring(s, { toValue: 1, useNativeDriver: ND, speed: 20, bounciness: 6 }).start();
  const press = (e) => {
    if (!onPress) return;
    const now = Date.now();
    if (now - lastAt.current < 350) return;
    lastAt.current = now;
    if (haptic && ND) { try { Haptics.selectionAsync(); } catch (x) {} }
    onPress(e);
  };
  return (
    <Pressable onPress={press} disabled={disabled} onPressIn={down} onPressOut={up}
      hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale: s }], opacity: s.interpolate({ inputRange: [0.96, 1], outputRange: [0.88, 1] }) }, disabled && { opacity: 0.5 }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Yurakcha: bosilganda "puf" bo'lib kattalashadi va atrofga uchqunlar sochiladi
export function HeartBtn({ on, onPress, style }) {
  const s = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const tap = () => {
    const will = !on;
    s.setValue(0.6);
    Animated.spring(s, { toValue: 1, friction: 3, tension: 200, useNativeDriver: ND }).start();
    if (will) {
      burst.setValue(0);
      Animated.timing(burst, { toValue: 1, duration: 520, useNativeDriver: ND }).start();
      try { if (ND) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (x) {}
    }
    onPress && onPress();
  };
  return (
    <Pressable onPress={tap} hitSlop={8} accessibilityLabel={tr("Saralanganga qo'shish")} style={[{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }, style]}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2;
        return (
          <Animated.View key={i} pointerEvents="none" style={{
            position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: i % 2 ? '#FFC43D' : '#E5484D',
            opacity: burst.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * 26] }) },
              { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * 26] }) },
              { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
            ],
          }} />
        );
      })}
      <Animated.View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: s }],
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }) }}>
        <Ionicons name={on ? 'heart' : 'heart-outline'} size={18} color={on ? '#FF2D55' : '#0B0B0F'} />
      </Animated.View>
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = 'pri', icon, small, loading, disabled, style }) {
  const t = useT();
  const bg = { pri: t.accent, sec: t.surface, ghost: 'transparent', dng: t.dangerSoft, gold: t.gold }[kind];
  const fg = { pri: t.accentInk, sec: t.ink, ghost: t.ink, dng: t.danger, gold: t.goldInk }[kind];
  return (
    <Press onPress={onPress} disabled={disabled || loading} style={[{
      height: small ? 38 : 52, paddingHorizontal: small ? 14 : 20, borderRadius: small ? 12 : 16, backgroundColor: bg,
      borderWidth: kind === 'sec' || kind === 'ghost' ? StyleSheet.hairlineWidth * 2 : 0, borderColor: t.line,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13.5 : 16, letterSpacing: -0.2 }} numberOfLines={1}>{title}</Text>
    </Press>
  );
}

export function Pill({ title, on, onPress, icon, count }) {
  const t = useT();
  return (
    <Press onPress={onPress} style={{
      height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.surface,
      flexDirection: 'row', alignItems: 'center', gap: 6,
    }}>
      {icon ? <Ionicons name={icon} size={15} color={on ? t.bg : t.ink} /> : null}
      <Text style={{ color: on ? t.bg : t.ink, fontWeight: '600', fontSize: 13 }}>{title}</Text>
      {count ? <View style={{ backgroundColor: t.accent, borderRadius: 999, paddingHorizontal: 6 }}><Text style={{ color: t.accentInk, fontSize: 11, fontWeight: '700' }}>{count}</Text></View> : null}
    </Press>
  );
}

export function Seg({ value, options, onChange }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.chip, borderRadius: 12, padding: 3 }}>
      {options.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable key={k} onPress={() => onChange(k)} style={{ flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: on ? t.surface : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.ink : t.muted, textAlign: 'center' }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, error, hint, style, multiline, onFocus, onBlur, ...props }) {
  const t = useT();
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink }}>{label}</Text> : null}
      <TextInput placeholderTextColor={t.muted} multiline={multiline} {...props}
        onFocus={(e) => { setFocus(true); onFocus?.(e); }} onBlur={(e) => { setFocus(false); onBlur?.(e); }}
        style={{
          outlineStyle: 'none', outlineWidth: 0,
          minHeight: multiline ? 120 : 48, borderRadius: 12, borderWidth: focus ? 1.5 : 1, borderColor: error ? t.danger : focus ? t.accent : t.line,
          backgroundColor: t.surface, color: t.ink, paddingHorizontal: 13, paddingVertical: multiline ? 11 : 0,
          fontSize: 16, textAlignVertical: multiline ? 'top' : 'center',
        }} />
      {hint ? <Text style={{ fontSize: 12, color: t.muted }}>{hint}</Text> : null}
      {error ? <Text style={{ fontSize: 12, color: t.danger, fontWeight: '600' }}>{tr(error)}</Text> : null}
    </View>
  );
}

export function Select({ label, value, placeholder, onPress, error }) {
  const t = useT();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink }}>{label}</Text> : null}
      <Pressable onPress={onPress} style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: error ? t.danger : t.line, backgroundColor: t.surface, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 15, color: value ? t.ink : t.muted }} numberOfLines={1}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={t.muted} />
      </Pressable>
      {error ? <Text style={{ fontSize: 12, color: t.danger, fontWeight: '600' }}>{tr(error)}</Text> : null}
    </View>
  );
}

export function Check({ label, value, onChange }) {
  const t = useT();
  return (
    <Pressable onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: value ? t.accent : t.line, backgroundColor: value ? t.accent : t.surface, alignItems: 'center', justifyContent: 'center' }}>
        {value ? <Ionicons name="checkmark" size={16} color={t.accentInk} /> : null}
      </View>
      <Text style={{ color: t.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function H({ children, right, style }) {
  const t = useT();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 10, gap: 10 }, style]}>
      <Text style={{ ...FONT.display, fontSize: 21, color: t.ink, flexShrink: 1 }}>{children}</Text>
      {right ? <Text style={{ fontSize: 13.5, color: t.muted, fontWeight: '500' }}>{right}</Text> : null}
    </View>
  );
}

export function Note({ children, kind }) {
  const t = useT();
  const bg = kind === 'gold' ? t.goldSoft : kind === 'bad' ? t.dangerSoft : t.chip;
  return <View style={{ backgroundColor: bg, borderRadius: 12, padding: 12, marginVertical: 8 }}><Text style={{ color: kind === 'bad' ? t.danger : t.ink, fontSize: 13, lineHeight: 19 }}>{typeof children === 'string' ? tr(children) : children}</Text></View>;
}

export function Empty({ title, text, action, onAction }) {
  const t = useT();
  return (
    <View style={{ borderRadius: 22, padding: 22, gap: 10, backgroundColor: t.surface, ...cardShadow(t) }}>
      <Text style={{ ...FONT.displayM, fontSize: 18, color: t.ink }}>{title}</Text>
      {text ? <Text style={{ color: t.muted, lineHeight: 21, fontSize: 15 }}>{text}</Text> : null}
      {action ? <View style={{ alignSelf: 'flex-start' }}><Btn small title={action} onPress={onAction} /></View> : null}
    </View>
  );
}

// Rasmsiz e'lon muqovasi: yumshoq fon, kategoriya belgisi rangli kvadratda
export function Cover({ cat, big = false, style }) {
  const t = useT();
  const c = catOf(cat);
  const col = CAT_COLORS[c.c % CAT_COLORS.length];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.dark ? '#1C1C1E' : '#F4F5F8', alignItems: 'center', justifyContent: 'center', gap: big ? 14 : 8 }, style]}>
      <View style={{ width: big ? 96 : 50, height: big ? 96 : 50, borderRadius: big ? 30 : 15, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={c.icon.replace('-outline', '')} size={big ? 46 : 25} color="#fff" />
      </View>
      <Text style={{ fontSize: big ? 15 : 11.5, fontWeight: '600', color: t.muted }} numberOfLines={1}>{c.n}</Text>
    </View>
  );
}

export function Avatar({ profile, name, size = 46 }) {
  const t = useT();
  const url = profile?.avatar_url ? publicUrl('avatars', profile.avatar_url) : null;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {url ? <Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="cover" />
        : <Text style={{ ...FONT.display, color: t.accent, fontSize: size * 0.34 }}>{initials(profile?.name || name)}</Text>}
    </View>
  );
}

export function Badge({ kind, children }) {
  const t = useT();
  const s = {
    vip: [t.gold, t.goldInk], top: [t.accent, t.accentInk], req: [t.ink, t.bg],
    ok: [t.chip, t.price], wait: [t.goldSoft, t.gold], no: [t.dangerSoft, t.danger], plain: [t.surface, t.ink],
  }[kind] || [t.chip, t.muted];
  return (
    <View style={{ backgroundColor: s[0], borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: s[1], fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{children}</Text>
    </View>
  );
}

export function AdCard({ ad, onPress, fav, onFav, width, row }) {
  const t = useT();
  const img = adPhoto(ad);
  const vip = isVip(ad), top = isTop(ad);
  return (
    <Press onPress={onPress} style={[{
      width, backgroundColor: t.surface, borderRadius: 20, overflow: 'hidden',
      borderWidth: vip ? 1.5 : 0, borderColor: t.gold, flexDirection: row ? 'row' : 'column',
    }, cardShadow(t)]}>
      <View style={{ width: row ? 120 : '100%', aspectRatio: row ? 1 : 4 / 3, backgroundColor: t.chip }}>
        {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <Cover cat={ad.cat} />}
        <View style={{ position: 'absolute', left: 8, top: 8, flexDirection: 'row', gap: 4 }}>
          {vip ? <Badge kind="vip">{tr("★ VIP")}</Badge> : top ? <Badge kind="top">{tr("TOP")}</Badge> : null}
          {ad.kind === 'buyurtma' ? <Badge kind="req">{tr("BUYURTMA")}</Badge> : null}
        </View>
        {ad.photos?.length > 1 ? (
          <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="images" size={11} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{ad.photos.length}</Text>
          </View>
        ) : null}
        {onFav ? <HeartBtn on={fav} onPress={onFav} /> : null}
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 3, flex: 1 }}>
        <Text style={{ color: t.ink, fontWeight: '800', fontSize: 16, letterSpacing: -0.3 }} numberOfLines={1}>{priceText(ad)}</Text>
        <Text style={{ color: t.ink, fontWeight: '500', fontSize: 14, lineHeight: 18.5, minHeight: row ? 0 : 37 }} numberOfLines={2}>{ad.title}</Text>
        <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{locLabel(ad)} · {ago(ad.sort_at || ad.created_at)}</Text>
      </View>
    </Press>
  );
}

// Yuklanayotganda ko'rinadigan "skelet" kartochka (yaltirab turadi)
export function Skeleton({ width }) {
  const t = useT();
  const a = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: ND }),
      Animated.timing(a, { toValue: 0, duration: 700, useNativeDriver: ND }),
    ]));
    l.start();
    return () => l.stop();
  }, [a]);
  const op = a.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const bar = (w, h = 12) => <Animated.View style={{ width: w, height: h, borderRadius: 6, backgroundColor: t.chip, opacity: op }} />;
  return (
    <View style={{ width, backgroundColor: t.surface, borderRadius: 20, overflow: 'hidden' }}>
      <Animated.View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: t.chip, opacity: op }} />
      <View style={{ padding: 11, gap: 8 }}>{bar('90%')}{bar('60%')}{bar('45%', 14)}</View>
    </View>
  );
}

// Ro'yxatda paydo bo'lganda pastdan suzib chiqish
export function FadeIn({ index = 0, children, style }) {
  const a = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 260, delay: Math.min(index, 6) * 35, useNativeDriver: ND }).start();
  }, [a, index]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// Uzum uslubidagi menyu: rangli belgi, nom, o'ng tomonda strelka
export function MenuGroup({ items }) {
  const t = useT();
  return (
    <View style={{ backgroundColor: t.surface, borderRadius: 18, overflow: 'hidden', ...cardShadow(t) }}>
      {items.filter(Boolean).map((it, i) => (
        <Pressable key={it.title} onPress={it.onPress} accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, paddingLeft: 14, paddingRight: 12, paddingVertical: 12, backgroundColor: pressed ? t.chip : 'transparent' })}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: it.color || t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={it.icon} size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: it.danger ? t.danger : t.ink, fontWeight: '600', fontSize: 16, letterSpacing: -0.2 }}>{it.title}</Text>
            {it.sub ? <Text style={{ color: t.muted, fontSize: 12.5, marginTop: 1 }} numberOfLines={1}>{it.sub}</Text> : null}
          </View>
          {it.right ? <Text style={{ color: t.muted, fontSize: 14, fontWeight: '500' }}>{it.right}</Text> : null}
          <Ionicons name="chevron-forward" size={17} color={t.dark ? '#5A5A5F' : '#C4C4C8'} />
          {i ? <View style={{ position: 'absolute', top: 0, right: 0, left: 59, height: StyleSheet.hairlineWidth, backgroundColor: t.line }} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function Loading() {
  const t = useT();
  return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>;
}
