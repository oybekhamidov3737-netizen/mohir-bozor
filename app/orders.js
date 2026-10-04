// To'lovlar tarixi va sotib olingan to'plamlar
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase } from '../src/supabase';
import { SVC } from '../src/data';
import { ago, fmtNum } from '../src/format';
import { Badge, Empty, Loading } from '../src/ui';
import { tr } from '../src/i18n';

const ICON = { vip: 'diamond', top: 'trending-up', bump: 'arrow-up-circle', extend: 'time', restore: 'refresh', slots: 'albums', topup: 'wallet' };

export default function Orders() {
  const t = useT();
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const packs = filter === 'packages';
  const { uid } = useApp();
  const [rows, setRows] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    let q = supabase.from('orders').select('*, ads(id,title)').eq('user_id', uid).order('created_at', { ascending: false }).limit(200);
    q = packs ? q.eq('status', 'ok').neq('svc', 'topup') : q.neq('status', 'unpaid');
    const { data } = await q;
    setRows(data || []); setRefreshing(false);
  }, [uid, packs]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = (rows || []).filter((o) => o.status === 'ok').reduce((s, o) => s + Number(o.price || 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <Stack.Screen options={{ title: packs ? tr("Sotib olingan to'plamlar") : tr("To'lovlar tarixi") }} />
      {rows === null ? <Loading /> : rows.length ? (
        <>
          <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: t.muted, fontWeight: '700' }}>{packs ? tr('Jami xizmatlar: {0}', rows.length) : tr('Jami to\'langan')}</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: t.ink }}>{fmtNum(total)} {tr("so'm")}</Text>
          </View>
          {rows.map((o) => (
            <View key={o.id} style={{ backgroundColor: t.surface, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={ICON[o.svc] || 'receipt'} size={20} color={t.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: '800', color: t.ink }} numberOfLines={1}>{SVC[o.svc]}</Text>
                <Text style={{ color: t.muted, fontSize: 12.5 }} numberOfLines={1}>{o.ads?.title ? o.ads.title + ' · ' : ''}{o.code} · {ago(o.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontWeight: '800', color: t.ink }}>{fmtNum(o.price)}</Text>
                <Badge kind={o.status === 'ok' ? 'ok' : o.status === 'no' ? 'no' : 'wait'}>{o.status === 'ok' ? tr('FAOLLASHTIRILDI') : o.status === 'no' ? tr('RAD ETILDI') : tr('TEKSHIRILMOQDA')}</Badge>
              </View>
            </View>
          ))}
        </>
      ) : (
        <Empty title={packs ? tr("Hali xizmat sotib olmagansiz") : tr("Hozircha to'lovlar yo'q")}
          text={tr("TOP, VIP va qo'shimcha joylar e'loningizni ko'proq mijozga ko'rsatadi.")} action={tr("Mening e'lonlarim")} onAction={() => router.push('/my-ads')} />
      )}
    </ScrollView>
  );
}
