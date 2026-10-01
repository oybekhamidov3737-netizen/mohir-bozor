import React, { useCallback, useState } from 'react';
import { FlatList, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase } from '../../src/supabase';
import { AdCard, Empty, Loading } from '../../src/ui';

export default function Favorites() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { fav, toggleFav } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.min(width, 1100);
  const cols = W < 640 ? 2 : W < 960 ? 3 : 4;
  const cardW = (W - 32 - 10 * (cols - 1)) / cols;
  const [items, setItems] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    if (!fav.length) { setItems([]); return; }
    supabase.from('ads').select('*').in('id', fav.slice(0, 200)).then(({ data }) => {
      if (!alive) return;
      const m = {}; (data || []).forEach((a) => { m[a.id] = a; });
      setItems(fav.map((id) => m[id]).filter((a) => a && a.status === 'active'));
    });
    return () => { alive = false; };
  }, [fav]));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: ins.top }}>
      <FlatList
        key={'f' + cols}
        data={items || []}
        numColumns={cols}
        keyExtractor={(a) => a.id}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={<Text style={{ fontFamily: FONT.displayM, fontSize: 20, color: t.ink, paddingBottom: 6 }}>Saralangan e'lonlar</Text>}
        renderItem={({ item }) => <AdCard ad={item} width={cardW} onPress={() => router.push(`/ad/${item.id}`)} fav onFav={() => toggleFav(item.id)} />}
        ListEmptyComponent={items === null ? <Loading /> : (
          <Empty title="Saralanganlar bo'sh" text="Yoqqan e'londagi yurakcha belgisini bosing, u shu yerda saqlanadi." action="E'lonlarga o'tish" onAction={() => router.push('/')} />
        )}
      />
    </View>
  );
}
