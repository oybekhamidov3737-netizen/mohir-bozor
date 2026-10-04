// Mening e'lonlarim: Faol / To'lanmagan / Yakunlangan
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, adPhoto, errText } from '../src/supabase';
import { SVC } from '../src/data';
import { adState, ago, fmtNum, isTop, isVip, priceText, shortDate } from '../src/format';
import { Badge, Btn, Cover, Empty, Loading, Seg } from '../src/ui';
import { PAYMENTS_IN_APP } from '../src/pay';
import { tr } from '../src/i18n';

const EV = { top: 'TOP', vip: 'VIP', bump: "ko'tarildi", extend: 'uzaytirildi', restore: 'tiklandi', moderator: "moderator o'chirdi" };

export default function MyAds() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid, isAdmin, config, toast } = useApp();
  const [tab, setTab] = useState(params.tab === 'unpaid' || params.tab === 'done' ? params.tab : 'live');
  const [ads, setAds] = useState(null);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState({});
  const [slots, setSlots] = useState(0);
  const [sure, setSure] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const [a, o, s] = await Promise.all([
      supabase.from('ads').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('orders').select('*, ads(id,title,photos,cat)').eq('user_id', uid).in('status', ['unpaid', 'pending']).order('created_at', { ascending: false }).limit(50),
      supabase.from('user_slots').select('extra').eq('user_id', uid).maybeSingle(),
    ]);
    const list = a.data || [];
    setAds(list); setOrders(o.data || []); setSlots(s.data?.extra || 0);
    if (list.length) {
      const { data: ev } = await supabase.from('ad_events').select('*').in('ad_id', list.map((x) => x.id)).order('created_at');
      const m = {}; (ev || []).forEach((e) => { (m[e.ad_id] = m[e.ad_id] || []).push(e); });
      setEvents(m);
    }
    setRefreshing(false);
  }, [uid]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirm = (key, fn) => { if (sure !== key) { setSure(key); setTimeout(() => setSure((x) => (x === key ? '' : x)), 3500); return; } setSure(''); fn(); };
  const del = (a) => confirm('del' + a.id, async () => {
    const { error } = await supabase.from('ads').update({ status: 'deleted' }).eq('id', a.id);
    if (error) toast(errText(error)); else { toast(tr("E'lon arxivga o'tkazildi")); load(); }
  });
  const purge = (a) => confirm('purge' + a.id, async () => {
    if (a.photos?.length) await supabase.storage.from('ads').remove(a.photos);
    const { error } = await supabase.from('ads').delete().eq('id', a.id);
    if (error) toast(errText(error)); else { toast(tr("E'lon butunlay o'chirildi")); load(); }
  });

  const live = (ads || []).filter((a) => adState(a) === 'live');
  const done = (ads || []).filter((a) => adState(a) !== 'live');
  const lim = isAdmin ? Infinity : config.free_ads + slots;
  const paid = PAYMENTS_IN_APP || isAdmin;

  const hist = (a) => {
    const p = [tr('Joylangan {0}', shortDate(a.created_at))];
    (events[a.id] || []).slice(-3).forEach((e) => p.push(`${tr(EV[e.kind] || e.kind)} ${shortDate(e.created_at)}`));
    const s = adState(a);
    if (s === 'deleted') p.push(`${a.mod_deleted ? tr("moderator o'chirgan") : tr("o'chirilgan")} ${shortDate(a.deleted_at)}`);
    else p.push(s === 'expired' ? tr('tugagan {0}', shortDate(a.expires_at)) : tr('faol {0} gacha', shortDate(a.expires_at)));
    return p.join(' · ');
  };

  const adCard = (a) => {
    const img = adPhoto(a);
    const s = adState(a);
    return (
      <View key={a.id} style={{ backgroundColor: t.surface, borderRadius: 18, padding: 10, gap: 10 }}>
        <Pressable onPress={() => router.push(`/ad/${a.id}`)} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: t.chip }}>
            {img ? <Image source={{ uri: img }} style={{ width: 72, height: 72 }} contentFit="cover" /> : <Cover cat={a.cat} />}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontWeight: '700', color: t.ink }} numberOfLines={1}>{a.title}</Text>
            <Text style={{ color: t.price, fontWeight: '800' }}>{priceText(a)}</Text>
            <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
              {s === 'deleted' ? <Badge kind="no">{a.mod_deleted ? tr("MODERATOR O'CHIRGAN") : tr('ARXIVDA')}</Badge>
                : s === 'expired' ? <Badge kind="wait">{tr('MUDDATI TUGAGAN')}</Badge>
                  : isVip(a) ? <Badge kind="vip">VIP · {shortDate(a.vip_until)}</Badge>
                    : isTop(a) ? <Badge kind="top">TOP · {shortDate(a.top_until)}</Badge> : <Badge kind="ok">{tr('FAOL')}</Badge>}
            </View>
            <Text style={{ color: t.muted, fontSize: 11 }}>{hist(a)}</Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {s === 'live' ? (
            <>
              {paid ? <Btn small title={tr('Reklama')} icon="rocket-outline" onPress={() => router.push(`/promo/${a.id}`)} /> : null}
              <Btn small kind="sec" title={tr('Tahrirlash')} onPress={() => router.push({ pathname: '/post', params: { id: a.id } })} />
              <Btn small kind="dng" title={sure === 'del' + a.id ? tr("Ha, o'chirish") : tr("O'chirish")} onPress={() => del(a)} />
            </>
          ) : s === 'expired' ? (
            <>
              {paid ? <Btn small title={tr("Uzaytirish · {0} so'm", fmtNum(config.prices.extend))} onPress={() => router.push({ pathname: `/promo/${a.id}`, params: { svc: 'extend' } })} /> : null}
              <Btn small kind="dng" title={sure === 'del' + a.id ? tr("Ha, o'chirish") : tr("O'chirish")} onPress={() => del(a)} />
            </>
          ) : (
            <>
              {!a.mod_deleted && paid ? <Btn small title={tr("Tiklash · {0} so'm", fmtNum(config.prices.restore))} onPress={() => router.push({ pathname: `/promo/${a.id}`, params: { svc: 'restore' } })} /> : null}
              <Btn small kind="dng" title={sure === 'purge' + a.id ? tr("Butunlay o'chirilsinmi?") : tr("Butunlay o'chirish")} onPress={() => purge(a)} />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <Stack.Screen options={{ title: tr("Mening e'lonlarim") }} />
      <Seg value={tab} onChange={setTab} options={[['live', tr('Faol ({0})', live.length)], ['unpaid', tr("To'lanmagan ({0})", orders.length)], ['done', tr('Yakunlangan ({0})', done.length)]]} />
      {ads === null ? <Loading /> : tab === 'live' ? (
        <>
          {lim !== Infinity ? (
            <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 12, gap: 8 }}>
              <Text style={{ color: t.ink, fontSize: 13 }}>{tr("Faol e'lonlar: {0} / {1}. Har bir e'lon {2} kun faol turadi.", live.length, lim, config.ad_days)}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, (live.length / lim) * 100)}%`, height: 6, backgroundColor: t.accent }} />
              </View>
              {paid && live.length >= lim - 1 ? <View style={{ alignSelf: 'flex-start' }}><Btn small kind="sec" title={tr('Limitni oshirish')} onPress={() => router.push('/promo/slots')} /></View> : null}
            </View>
          ) : null}
          {live.length ? live.map(adCard) : <Empty title={tr("Faol e'lonlar yo'q")} text={tr("Xizmatingizni rasmlar bilan joylang yoki buyurtma e'lonini bering.")} action={tr("E'lon joylash")} onAction={() => router.push('/post')} />}
        </>
      ) : tab === 'done' ? (
        done.length ? done.map(adCard) : <Empty title={tr("Yakunlangan e'lonlar yo'q")} text={tr("Muddati tugagan va o'chirilgan e'lonlar shu yerda saqlanadi.")} />
      ) : (
        <>
          <Text style={{ color: t.muted, lineHeight: 19 }}>{tr("Bu xizmatlar to'lov kutmoqda. Faollashtirish uchun to'lovni yakunlang yoki chek yuborgan bo'lsangiz, tasdiqlanishini kuting.")}</Text>
          {orders.length ? orders.map((o) => (
            <Pressable key={o.id} onPress={() => o.status === 'unpaid' && paid ? router.push(o.svc === 'topup' ? '/topup' : `/promo/${o.ad_id || 'slots'}`) : null}
              style={{ backgroundColor: t.surface, borderRadius: 18, padding: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontWeight: '800', color: t.ink, flex: 1 }} numberOfLines={1}>{SVC[o.svc]}{o.ads?.title ? ' · ' + o.ads.title : ''}</Text>
                <Badge kind="wait">{o.status === 'pending' ? tr('TEKSHIRILMOQDA') : tr("TO'LANMAGAN")}</Badge>
              </View>
              <Text style={{ color: t.muted, fontSize: 13 }}>{fmtNum(o.price)} {tr("so'm")} · {o.code} · {ago(o.created_at)}</Text>
            </Pressable>
          )) : <Empty title={tr("To'lanmagan xizmatlar yo'q")} />}
        </>
      )}
    </ScrollView>
  );
}
