// Bir nechta sahifada ishlatiladigan ro'yxat elementlari: suhbat qatori, o'z e'loni, yulduzcha baho
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT } from './theme';
import { adPhoto } from './supabase';
import { ago, isOnline } from './format';
import { Avatar, Cover } from './ui';
import { tr } from './i18n';

export function Stars({ value = 0, size = 14, onPick, color = '#F5A623' }) {
  return (
    <View style={{ flexDirection: 'row', gap: size > 20 ? 6 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline';
        const icon = <Ionicons name={name} size={size} color={color} />;
        return onPick ? <Pressable key={i} onPress={() => onPick(i)} hitSlop={6} accessibilityLabel={tr('{0} yulduz', i)}>{icon}</Pressable> : <View key={i}>{icon}</View>;
      })}
    </View>
  );
}

export function RatingLine({ profile, size = 13 }) {
  const t = useT();
  if (!profile?.rating_count) return <Text style={{ color: t.muted, fontSize: size - 1 }}>{tr('Hali baho yo\'q')}</Text>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Stars value={Number(profile.rating)} size={size} />
      <Text style={{ color: t.ink, fontWeight: '800', fontSize: size }}>{Number(profile.rating).toFixed(1)}</Text>
      <Text style={{ color: t.muted, fontSize: size - 1 }}>({profile.rating_count})</Text>
    </View>
  );
}

// Suhbat qatori (xabarlar, takliflar, murojaatlar ro'yxati uchun)
export function ThreadRow({ item, uid, onPress }) {
  const t = useT();
  const img = adPhoto(item.ads);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.surface, borderRadius: 20, padding: 10, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ width: 58, height: 58, borderRadius: 18, overflow: 'hidden', backgroundColor: t.chip }}>
        {img ? <Image source={{ uri: img }} style={{ width: 58, height: 58 }} contentFit="cover" /> : <Cover cat={item.ads?.cat} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View>
            <Avatar profile={item.other} size={18} />
            {isOnline(item.other?.last_seen) ? <View style={{ position: 'absolute', right: -2, bottom: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: t.price, borderWidth: 1.5, borderColor: t.surface }} /> : null}
          </View>
          <Text style={{ fontWeight: '700', color: t.ink, flex: 1 }} numberOfLines={1}>{item.other?.name || tr('Foydalanuvchi')}</Text>
        </View>
        <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={1}>{item.ads?.title || tr("E'lon o'chirilgan")}</Text>
        <Text style={{ fontSize: 13, color: item.unread ? t.ink : t.muted, fontWeight: item.unread ? '700' : '400' }} numberOfLines={1}>{item.last_text || tr('Hali xabar yo\'q')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ fontSize: 11, color: t.muted }}>{item.last_at ? ago(item.last_at).replace(/^(Bugun|Сегодня|Today) /, '') : ''}</Text>
        {item.unread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2747D6' }} /> : <Ionicons name="chevron-forward" size={16} color={t.muted} />}
      </View>
    </Pressable>
  );
}
