import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, adPhoto, errText } from '../src/supabase';
import { SVC } from '../src/data';
import { adState, ago, fmtNum, isTop, isVip, locLabel, shortDate } from '../src/format';
import { fetchProfiles } from '../src/api';
import { Badge, Btn, Cover, Empty, Field, H, Loading, Note, Pill } from '../src/ui';

export default function Admin() {
  const t = useT();
  const router = useRouter();
  const { isAdmin, config, loadConfig, toast } = useApp();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState(null);
  const [ads, setAds] = useState(null);
  const [threads, setThreads] = useState(null);
  const [profs, setProfs] = useState({});
  const [adFilter, setAdFilter] = useState('all');
  const [receipt, setReceipt] = useState(null);
  const [sure, setSure] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cfg, setCfg] = useState(null);

  const load = useCallback(async () => {
    const [o, a, th] = await Promise.all([
      supabase.from('orders').select('*, ads(title)').order('created_at', { ascending: false }).limit(300),
      supabase.from('ads').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('threads').select('*, ads(title,photos,cat)').neq('last_text', '').order('last_at', { ascending: false }).limit(200),
    ]);
    setOrders(o.data || []); setAds(a.data || []); setThreads(th.data || []);
    const ids = [...(o.data || []).map((x) => x.user_id), ...(th.data || []).flatMap((x) => [x.buyer_id, x.seller_id])];
    setProfs(await fetchProfiles(ids));
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { if (isAdmin) load(); }, [isAdmin, load]));
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, load]);
  useEffect(() => { setCfg({ ...config, ...Object.fromEntries(Object.entries(config.prices).map(([k, v]) => ['p_' + k, String(v)])) }); }, [config]);

  if (!isAdmin) return <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}><Empty title="Ruxsat yo'q" text="Bu bo'lim faqat bozor egasi uchun." /></View>;

  const confirm = (key, fn) => { if (sure !== key) { setSure(key); setTimeout(() => setSure((s) => (s === key ? '' : s)), 3500); return; } setSure(''); fn(); };
  const rpc = async (name, args, ok) => { const { error } = await supabase.rpc(name, args); if (error) toast(errText(error)); else { toast(ok); load(); } };
  const showReceipt = async (path) => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 600);
    if (data?.signedUrl) setReceipt(data.signedUrl); else toast("Chekni ochib bo'lmadi");
  };

  const mk = new Date().toISOString().slice(0, 7);
  const okOrders = (orders || []).filter((o) => o.status === 'ok');
  const month = okOrders.filter((o) => (o.decided_at || o.created_at || '').slice(0, 7) === mk).reduce((s, o) => s + +o.price, 0);
  const total = okOrders.reduce((s, o) => s + +o.price, 0);
  const pending = (orders || []).filter((o) => o.status === 'pending');
  const promoted = (ads || []).filter((a) => adState(a) === 'live' && isTop(a)).length;

  const kpi = (label, value, money) => (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: t.muted }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: money ? t.price : t.ink, marginTop: 4 }} numberOfLines={1}>{value}</Text>
    </View>
  );

  const adsShown = (ads || []).filter((a) => {
    const s = adState(a);
    return adFilter === 'all' || (adFilter === 'promo' ? s === 'live' && isTop(a) : s === adFilter);
  });

  const saveCfg = async () => {
    const n = (k) => Math.max(0, Math.round(+String(cfg[k]).replace(/\D/g, '') || 0));
    const row = {
      pay_text: String(cfg.pay_text || '').trim(),
      prices: { vip: n('p_vip'), top: n('p_top'), bump: n('p_bump'), slots: n('p_slots'), extend: n('p_extend'), restore: n('p_restore') },
      free_ads: n('free_ads'), slot_pack: Math.max(1, n('slot_pack')), promo_days: Math.max(1, n('promo_days')), ad_days: Math.max(1, n('ad_days')),
    };
    const { error } = await supabase.from('config').update(row).eq('id', 1);
    if (error) toast(errText(error)); else { toast('Sozlamalar saqlandi'); loadConfig(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, padding: 16, paddingBottom: 8 }}>
        <Pill title="To'lovlar" on={tab === 'orders'} onPress={() => setTab('orders')} count={pending.length || undefined} />
        <Pill title="Barcha e'lonlar" on={tab === 'ads'} onPress={() => setTab('ads')} />
        <Pill title="Suhbatlar" on={tab === 'chats'} onPress={() => setTab('chats')} />
        <Pill title="Sozlamalar" on={tab === 'cfg'} onPress={() => setTab('cfg')} />
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
        {orders === null ? <Loading /> : tab === 'orders' ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {kpi('SHU OY TUSHUM', fmtNum(month), true)}
              {kpi('JAMI TUSHUM', fmtNum(total), true)}
              {kpi("KUTILAYOTGAN TO'LOV", pending.length)}
              {kpi('FAOL TOP / VIP', promoted)}
            </View>
            {!config.pay_text ? <Note kind="gold">Foydalanuvchilar to'lov qila olishi uchun "Sozlamalar" bo'limida to'lov rekvizitlarini kiriting.</Note> : null}
            <H right={`${orders.length} ta`}>To'lovlar</H>
            {orders.length ? [...pending, ...orders.filter((o) => o.status !== 'pending')].map((o) => (
              <View key={o.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: o.status === 'pending' ? t.gold : t.line, borderRadius: 14, padding: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: t.ink }}>{o.code}</Text>
                  <Badge kind={o.status === 'ok' ? 'ok' : o.status === 'no' ? 'no' : 'wait'}>{o.status === 'ok' ? 'TASDIQLANGAN' : o.status === 'no' ? 'RAD ETILGAN' : 'KUTILMOQDA'}</Badge>
                </View>
                <Text style={{ fontWeight: '700', color: t.ink }}>{SVC[o.svc]} — {fmtNum(o.price)} so'm</Text>
                {o.ads?.title ? <Text style={{ color: t.muted }} numberOfLines={1}>{o.ads.title}</Text> : null}
                <Text style={{ color: t.muted, fontSize: 13 }}>To'lovchi: {o.payer} · {profs[o.user_id]?.name || ''} · {ago(o.created_at)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {o.receipt_path ? <Btn small kind="sec" icon="receipt-outline" title="Chekni ko'rish" onPress={() => showReceipt(o.receipt_path)} /> : null}
                  {o.status === 'pending' ? (
                    <>
                      <Btn small title="Tasdiqlash" icon="checkmark" onPress={() => rpc('approve_order', { p_id: o.id }, 'Tasdiqlandi, xizmat yoqildi')} />
                      <Btn small kind="dng" title={sure === 'no' + o.id ? 'Ha, rad etish' : 'Rad etish'} onPress={() => confirm('no' + o.id, () => rpc('reject_order', { p_id: o.id }, 'Rad etildi'))} />
                    </>
                  ) : null}
                </View>
              </View>
            )) : <Empty title="Hozircha to'lovlar yo'q" text="Foydalanuvchilar TOP, VIP, uzaytirish yoki tiklash so'raganda shu yerda chiqadi. Pul tushganini tekshirib, tasdiqlaysiz." />}
          </>
        ) : tab === 'ads' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[['all', 'Hammasi'], ['live', 'Faol'], ['promo', 'TOP/VIP'], ['expired', 'Tugagan'], ['deleted', "O'chirilgan"]].map(([k, l]) => <Pill key={k} title={l} on={adFilter === k} onPress={() => setAdFilter(k)} />)}
            </ScrollView>
            {adsShown.length ? adsShown.map((a) => {
              const s = adState(a), img = adPhoto(a);
              return (
                <View key={a.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 10, gap: 8 }}>
                  <Pressable onPress={() => router.push(`/ad/${a.id}`)} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', backgroundColor: t.chip }}>
                      {img ? <Image source={{ uri: img }} style={{ width: 56, height: 56 }} /> : <Cover cat={a.cat} />}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontWeight: '700', color: t.ink }} numberOfLines={1}>{a.title}</Text>
                      <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{a.seller_name} · {locLabel(a)}</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {s === 'deleted' ? <Badge kind="no">O'CHIRILGAN</Badge> : s === 'expired' ? <Badge kind="wait">TUGAGAN</Badge> : isVip(a) ? <Badge kind="vip">VIP</Badge> : isTop(a) ? <Badge kind="top">TOP</Badge> : <Badge kind="ok">FAOL</Badge>}
                        <Text style={{ color: t.muted, fontSize: 11 }}>{shortDate(a.created_at)} → {shortDate(a.expires_at)}</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {s === 'deleted' ? <Btn small title="Tiklash" onPress={() => rpc('admin_activate', { p_ad: a.id, p_svc: 'restore' }, 'Tiklandi')} />
                      : s === 'expired' ? <Btn small title="Uzaytirish" onPress={() => rpc('admin_activate', { p_ad: a.id, p_svc: 'extend' }, 'Uzaytirildi')} />
                        : <Btn small kind="dng" title={sure === 'd' + a.id ? 'Ha, olib tashlash' : "O'chirish"} onPress={() => confirm('d' + a.id, () => rpc('admin_delete_ad', { p_ad: a.id }, 'Olib tashlandi'))} />}
                  </View>
                </View>
              );
            }) : <Empty title="Bu bo'limda e'lon yo'q" />}
          </>
        ) : tab === 'chats' ? (
          <>
            <Note>Suhbatlarni faqat shikoyat yoki firibgarlikni tekshirish uchun oching. Foydalanuvchilar bu haqda chat oynasida ogohlantirilgan.</Note>
            {threads.length ? threads.map((th) => (
              <Pressable key={th.id} onPress={() => router.push(`/chat/${th.id}`)} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 12, gap: 3 }}>
                <Text style={{ fontWeight: '700', color: t.ink }} numberOfLines={1}>{profs[th.seller_id]?.name || 'Sotuvchi'} ↔ {profs[th.buyer_id]?.name || 'Xaridor'}</Text>
                <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{th.ads?.title || "E'lon o'chirilgan"}</Text>
                <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>{th.last_text} · {ago(th.last_at)}</Text>
              </Pressable>
            )) : <Empty title="Hozircha suhbatlar yo'q" />}
          </>
        ) : cfg ? (
          <View style={{ gap: 12 }}>
            <Field label="To'lov rekvizitlari" value={cfg.pay_text} onChangeText={(v) => setCfg({ ...cfg, pay_text: v })} multiline maxLength={400}
              placeholder="Karta raqami va egasining ismi yoki Click/Payme yo'riqnomasi" hint="Bu matn to'lov qilayotgan foydalanuvchilarga ko'rinadi." />
            {[['p_vip', 'VIP narxi'], ['p_top', 'TOP narxi'], ['p_bump', "Ko'tarish narxi"], ['p_extend', 'Uzaytirish narxi'], ['p_restore', 'Tiklash narxi'], ['p_slots', "+e'lon joylari narxi"],
              ['free_ads', "Bepul e'lonlar limiti"], ['slot_pack', 'Bir paketda nechta joy'], ['promo_days', 'TOP/VIP muddati (kun)'], ['ad_days', "E'lon muddati (kun)"]].map(([k, l]) => (
              <Field key={k} label={l + (k.startsWith('p_') ? " (so'm)" : '')} value={String(cfg[k] ?? '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, [k]: v.replace(/\D/g, '') })} />
            ))}
            <Btn title="Saqlash" onPress={saveCfg} />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!receipt} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <Pressable onPress={() => setReceipt(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.85)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {receipt ? <Image source={{ uri: receipt }} style={{ width: '100%', height: '85%' }} contentFit="contain" /> : null}
          <Text style={{ color: '#fff', marginTop: 12 }}>Yopish uchun bosing</Text>
        </Pressable>
      </Modal>
    </View>
  );
}
