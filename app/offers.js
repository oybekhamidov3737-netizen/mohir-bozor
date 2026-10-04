// Takliflar ro'yxati (mening buyurtmalarimga yozganlar) va Mening murojaatlarim (men yozgan buyurtmalar)
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase } from '../src/supabase';
import { fetchProfiles } from '../src/api';
import { Empty, Loading } from '../src/ui';
import { ThreadRow } from '../src/lists';
import { tr } from '../src/i18n';

export default function Offers() {
  const t = useT();
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const mine = mode !== 'applications'; // true: mening buyurtmalarimga kelgan takliflar
  const { uid } = useApp();
  const [rows, setRows] = useState(null);

  const load = useCallback(async () => {
    if (!uid) { setRows([]); return; }
    const { data } = await supabase.from('threads').select('*, ads!inner(id,title,photos,cat,kind)')
      .eq(mine ? 'seller_id' : 'buyer_id', uid).eq('ads.kind', 'buyurtma').order('last_at', { ascending: false });
    const th = data || [];
    const profs = await fetchProfiles(th.map((x) => (x.buyer_id === uid ? x.seller_id : x.buyer_id)));
    setRows(th.map((x) => {
      const other = x.buyer_id === uid ? x.seller_id : x.buyer_id;
      const readAt = x.buyer_id === uid ? x.buyer_read_at : x.seller_read_at;
      return { ...x, other: profs[other], unread: x.last_sender && x.last_sender !== uid && x.last_at > readAt };
    }));
  }, [uid, mine]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ title: mine ? tr("Takliflar ro'yxati") : tr('Mening murojaatlarim') }} />
      <FlatList
        data={rows || []}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={<Text style={{ color: t.muted, lineHeight: 19, marginBottom: 4 }}>{mine
          ? tr("Buyurtma e'lonlaringizga ijodkorlar yuborgan takliflar. Narx va muddatni chatda kelishing.")
          : tr("Siz yozgan buyurtma e'lonlari. Buyurtmachi javob bersa, shu yerda ko'rinadi.")}</Text>}
        renderItem={({ item }) => <ThreadRow item={item} uid={uid} onPress={() => router.push(`/chat/${item.id}`)} />}
        ListEmptyComponent={rows === null ? <Loading /> : mine
          ? <Empty title={tr("Hozircha takliflar yo'q")} text={tr("Buyurtma e'lonini joylang: «Ijodkor qidiryapman» turini tanlang, ijodkorlar o'zi yozadi.")} action={tr("Buyurtma joylash")} onAction={() => router.push('/post')} />
          : <Empty title={tr("Hozircha murojaatlar yo'q")} text={tr("«Siz uchun buyurtmalar» bo'limidan mos buyurtmani toping va yozing.")} action={tr('Siz uchun buyurtmalar')} onAction={() => router.push('/jobs')} />}
      />
    </View>
  );
}
