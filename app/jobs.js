// Siz uchun buyurtmalar: "Istagan ishim"dagi yo'nalish va hududlarga mos buyurtma e'lonlari
import React, { useCallback, useState } from 'react';
import { FlatList, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase } from '../src/supabase';
import { CATS, ONLINE } from '../src/data';
import { shortReg } from '../src/format';
import { AdCard, Btn, Empty, Loading } from '../src/ui';
import { tr } from '../src/i18n';

export default function Jobs() {
  const t = useT();
  const router = useRouter();
  const { profile, fav, toggleFav, uid } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.min(width, 1100);
  const cols = W < 640 ? 2 : W < 960 ? 3 : 4;
  const cardW = (W - 32 - 10 * (cols - 1)) / cols;
  const [items, setItems] = useState(null);

  const cats = profile?.pref_cats?.length ? profile.pref_cats : profile?.cat ? [profile.cat] : [];
  const regs = profile?.pref_regions || [];

  const load = useCallback(async () => {
    let q = supabase.from('ad_feed').select('*').eq('kind', 'buyurtma');
    if (cats.length) q = q.in('cat', cats);
    if (regs.length) q = q.in('region', [...regs, ONLINE]);
    if (uid) q = q.neq('user_id', uid);
    const { data } = await q.order('rank', { ascending: false }).order('sort_at', { ascending: false }).limit(60);
    setItems(data || []);
  }, [cats.join(','), regs.join(','), uid]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const what = cats.length ? cats.map((c) => CATS.find((x) => x.id === c)?.n).filter(Boolean).join(', ') : tr('Barcha yo\'nalishlar');
  const where = regs.length ? regs.map(shortReg).join(', ') : tr("Butun O'zbekiston");

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ title: tr('Siz uchun buyurtmalar') }} />
      <FlatList
        key={'c' + cols}
        data={items || []}
        numColumns={cols}
        keyExtractor={(a) => a.id}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, maxWidth: 1100, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14, gap: 8, marginBottom: 4 }}>
            <Text style={{ color: t.ink, fontWeight: '800' }}>{what}</Text>
            <Text style={{ color: t.muted, fontSize: 13 }}>{where}</Text>
            <View style={{ alignSelf: 'flex-start' }}><Btn small kind="sec" icon="options-outline" title={tr('Istagan ishimni sozlash')} onPress={() => router.push('/prefs')} /></View>
          </View>
        }
        renderItem={({ item }) => <AdCard ad={item} width={cardW} onPress={() => router.push(`/ad/${item.id}`)} fav={fav.includes(item.id)} onFav={() => toggleFav(item.id)} />}
        ListEmptyComponent={items === null ? <Loading /> : <Empty title={tr("Hozircha mos buyurtma yo'q")} text={tr("Yo'nalish yoki hududni kengaytirib ko'ring. Yangi buyurtmalar har kuni qo'shiladi.")} />}
      />
    </View>
  );
}
