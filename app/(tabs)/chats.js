import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase, adPhoto } from '../../src/supabase';
import { fetchProfiles } from '../../src/api';
import { ago } from '../../src/format';
import { Avatar, Btn, Cover, Empty, Loading } from '../../src/ui';

export default function Chats() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { uid, loadUnread } = useApp();
  const [rows, setRows] = useState(null);

  const load = useCallback(async () => {
    if (!uid) { setRows([]); return; }
    const { data } = await supabase.from('threads').select('*, ads(id,title,photos,cat,seller_name)')
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`).neq('last_text', '').order('last_at', { ascending: false });
    const th = data || [];
    const profs = await fetchProfiles(th.map((x) => (x.buyer_id === uid ? x.seller_id : x.buyer_id)));
    setRows(th.map((x) => {
      const other = x.buyer_id === uid ? x.seller_id : x.buyer_id;
      const readAt = x.buyer_id === uid ? x.buyer_read_at : x.seller_read_at;
      return { ...x, other: profs[other], unread: x.last_sender && x.last_sender !== uid && x.last_at > readAt };
    }));
    loadUnread();
  }, [uid, loadUnread]);

  useFocusEffect(useCallback(() => {
    load();
    if (!uid) return;
    const ch = supabase.channel('chats-list-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, uid]));

  if (!uid) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: ins.top + 16, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink, marginBottom: 12 }}>Xabarlar</Text>
        <Empty title="Hisobingizga kiring" text="Sotuvchi va xaridorlar bilan yozishish uchun kiring." action="Kirish" onAction={() => router.push('/login')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: ins.top }}>
      <FlatList
        data={rows || []}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={<Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink, paddingBottom: 6 }}>Xabarlar</Text>}
        renderItem={({ item }) => {
          const img = adPhoto(item.ads);
          return (
            <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 10 }}>
              <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: t.chip }}>
                {!item.ad_id ? <View style={{ flex: 1, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="headset" size={26} color={t.accentInk} /></View>
                  : img ? <Image source={{ uri: img }} style={{ width: 56, height: 56 }} contentFit="cover" /> : <Cover cat={item.ads?.cat} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Avatar profile={item.other} size={18} />
                  <Text style={{ fontWeight: '700', color: t.ink, flex: 1 }} numberOfLines={1}>{!item.ad_id && item.buyer_id === uid ? 'Mohir bozor jamoasi' : item.other?.name || 'Foydalanuvchi'}</Text>
                </View>
                <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={1}>{!item.ad_id ? (item.buyer_id === uid ? "Qo'llab-quvvatlash" : 'Murojaat') : item.ads?.title || "E'lon o'chirilgan"}</Text>
                <Text style={{ fontSize: 13, color: item.unread ? t.ink : t.muted, fontWeight: item.unread ? '700' : '400' }} numberOfLines={1}>
                  {item.last_sender === uid ? 'Siz: ' : ''}{item.last_text}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ fontSize: 11, color: t.muted }}>{ago(item.last_at).replace(/^Bugun /, '')}</Text>
                {item.unread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.danger }} /> : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={rows === null ? <Loading /> : (
          <Empty title="Hozircha xabarlar yo'q" text={'Yoqqan e\'lonni ochib "Yozish" tugmasini bosing. Suhbatlar shu yerda saqlanadi.'} action="E'lonlarga o'tish" onAction={() => router.push('/')} />
        )}
        ListFooterComponent={rows && rows.length ? (
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={14} color={t.muted} />
            <Text style={{ fontSize: 11, color: t.muted, textAlign: 'center' }}>Firibgarlik va shikoyatlarni tekshirish uchun suhbatlarni ma'muriyat ko'rishi mumkin.</Text>
          </View>
        ) : null}
      />
    </View>
  );
}
