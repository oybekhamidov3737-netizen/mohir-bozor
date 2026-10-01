import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { catOf } from './data';
import { adPhoto, publicUrl } from './supabase';
import { initials, isTop, isVip, locLabel, priceText, ago } from './format';

const ND = Platform.OS !== 'web';

// Bosilganda biroz kichrayadigan tugma asosi
export function Press({ onPress, style, children, disabled, hitSlop, accessibilityLabel }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: ND, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => to(0.96)} onPressOut={() => to(1)}
      hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale: s }] }, disabled && { opacity: 0.55 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = 'pri', icon, small, loading, disabled, style }) {
  const t = useT();
  const bg = { pri: t.accent, sec: t.surface, ghost: 'transparent', dng: t.dangerSoft, gold: t.gold }[kind];
  const fg = { pri: t.accentInk, sec: t.ink, ghost: t.ink, dng: t.danger, gold: t.goldInk }[kind];
  return (
    <Press onPress={onPress} disabled={disabled || loading} style={[{
      height: small ? 38 : 50, paddingHorizontal: small ? 12 : 18, borderRadius: small ? 10 : 14, backgroundColor: bg,
      borderWidth: kind === 'sec' || kind === 'ghost' ? 1 : 0, borderColor: t.line,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }} numberOfLines={1}>{title}</Text>
    </Press>
  );
}

export function Pill({ title, on, onPress, icon, count }) {
  const t = useT();
  return (
    <Press onPress={onPress} style={{
      height: 36, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1,
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

export function Field({ label, error, hint, style, multiline, ...props }) {
  const t = useT();
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink }}>{label}</Text> : null}
      <TextInput placeholderTextColor={t.muted} multiline={multiline} {...props}
        style={{
          minHeight: multiline ? 120 : 48, borderRadius: 12, borderWidth: 1, borderColor: error ? t.danger : t.line,
          backgroundColor: t.surface, color: t.ink, paddingHorizontal: 13, paddingVertical: multiline ? 11 : 0,
          fontSize: 16, textAlignVertical: multiline ? 'top' : 'center',
        }} />
      {hint ? <Text style={{ fontSize: 12, color: t.muted }}>{hint}</Text> : null}
      {error ? <Text style={{ fontSize: 12, color: t.danger, fontWeight: '600' }}>{error}</Text> : null}
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
      {error ? <Text style={{ fontSize: 12, color: t.danger, fontWeight: '600' }}>{error}</Text> : null}
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
      <Text style={{ fontFamily: FONT.displayM, fontSize: 18, color: t.ink, flexShrink: 1 }}>{children}</Text>
      {right ? <Text style={{ fontSize: 13, color: t.muted }}>{right}</Text> : null}
    </View>
  );
}

export function Note({ children, kind }) {
  const t = useT();
  const bg = kind === 'gold' ? t.goldSoft : kind === 'bad' ? t.dangerSoft : t.chip;
  return <View style={{ backgroundColor: bg, borderRadius: 12, padding: 12, marginVertical: 8 }}><Text style={{ color: kind === 'bad' ? t.danger : t.ink, fontSize: 13, lineHeight: 19 }}>{children}</Text></View>;
}

export function Empty({ title, text, action, onAction }) {
  const t = useT();
  return (
    <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line, borderRadius: 16, padding: 22, gap: 10, backgroundColor: t.surface }}>
      <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink }}>{title}</Text>
      {text ? <Text style={{ color: t.muted, lineHeight: 20 }}>{text}</Text> : null}
      {action ? <View style={{ alignSelf: 'flex-start' }}><Btn small title={action} onPress={onAction} /></View> : null}
    </View>
  );
}

export function Cover({ cat, big = false, style }) {
  const t = useT();
  const c = catOf(cat);
  return (
    <View style={[{ backgroundColor: t.cover[c.c], padding: 12, justifyContent: 'flex-end', overflow: 'hidden' }, StyleSheet.absoluteFill, style]}>
      <Ionicons name={c.icon} size={big ? 130 : 84} color={t.coverInk} style={{ position: 'absolute', right: -12, top: -10, opacity: 0.16 }} />
      <Text style={{ fontFamily: FONT.display, fontSize: big ? 32 : 17, color: t.coverInk, letterSpacing: -0.5 }} numberOfLines={2}>{c.big}</Text>
    </View>
  );
}

export function Avatar({ profile, name, size = 46 }) {
  const t = useT();
  const url = profile?.avatar_url ? publicUrl('avatars', profile.avatar_url) : null;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {url ? <Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="cover" />
        : <Text style={{ fontFamily: FONT.display, color: t.accent, fontSize: size * 0.34 }}>{initials(profile?.name || name)}</Text>}
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
    <Press onPress={onPress} style={{
      width, backgroundColor: t.surface, borderRadius: 14, overflow: 'hidden',
      borderWidth: vip ? 2 : 1, borderColor: vip ? t.gold : t.line, flexDirection: row ? 'row' : 'column',
    }}>
      <View style={{ width: row ? 120 : '100%', aspectRatio: row ? 1 : 4 / 3, backgroundColor: t.chip }}>
        {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : <Cover cat={ad.cat} />}
        <View style={{ position: 'absolute', left: 8, top: 8, flexDirection: 'row', gap: 4 }}>
          {vip ? <Badge kind="vip">VIP</Badge> : top ? <Badge kind="top">TOP</Badge> : null}
          {ad.kind === 'buyurtma' ? <Badge kind="req">BUYURTMA</Badge> : null}
        </View>
        {ad.photos?.length > 1 ? (
          <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="camera" size={11} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{ad.photos.length}</Text>
          </View>
        ) : null}
        {onFav ? (
          <Pressable onPress={onFav} hitSlop={8} style={{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? t.danger : t.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ padding: 10, gap: 4, flex: 1 }}>
        <Text style={{ color: t.ink, fontWeight: '600', fontSize: 14, lineHeight: 18, minHeight: row ? 0 : 36 }} numberOfLines={2}>{ad.title}</Text>
        <Text style={{ color: t.price, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{priceText(ad)}</Text>
        <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{locLabel(ad)} · {ago(ad.sort_at || ad.created_at)}</Text>
      </View>
    </Press>
  );
}

export function Loading() {
  const t = useT();
  return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>;
}
