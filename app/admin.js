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
import { tr } from '../src/i18n';

export default function Admin() {
  const t = useT();
  const router = useRouter();
  const { isAdmin, config, loadConfig, toast } = useApp();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState(null);
  const [ads, setAds] = useState(null);
  const [threads, setThreads] = useState(null);
  const [reports, setReports] = useState([]);
  const [profs, setProfs] = useState({});
  const [adFilter, setAdFilter] = useState('all');
  const [receipt, setReceipt] = useState(null);
  const [sure, setSure] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [paySt, setPaySt] = useState(null);
  const [keys, setKeys] = useState({ payme: '', click: '', mail: '' });

  const load = useCallback(async () => {
    const { data: rp } = await supabase.from('reports').select('*, ads(id,title,seller_name,status)').order('created_at', { ascending: false }).limit(200);
    setReports(rp || []);
    const [o, a, th] = await Promise.all([
      supabase.from('orders').select('*, ads(title)').neq('status', 'unpaid').order('created_at', { ascending: false }).limit(300),
      supabase.from('ads').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('threads').select('*, ads(title,photos,cat)').neq('last_text', '').order('last_at', { ascending: false }).limit(200),
    ]);
    setOrders(o.data || []); setAds(a.data || []); setThreads(th.data || []);
    const ids = [...(o.data || []).map((x) => x.user_id), ...(th.data || []).flatMap((x) => [x.buyer_id, x.seller_id])];
    setProfs(await fetchProfiles(ids));
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { if (isAdmin) { load(); supabase.rpc('admin_payment_status').then(({ data }) => setPaySt(data)); } }, [isAdmin, load]));
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, load]);
  useEffect(() => { setCfg({ ...config, ...Object.fromEntries(Object.entries(config.prices).map(([k, v]) => ['p_' + k, String(v)])) }); }, [config]);

  if (!isAdmin) return <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}><Empty title={tr("Ruxsat yo'q")} text={tr("Bu bo'lim faqat bozor egasi uchun.")} /></View>;

  const confirm = (key, fn) => { if (sure !== key) { setSure(key); setTimeout(() => setSure((s) => (s === key ? '' : s)), 3500); return; } setSure(''); fn(); };
  const rpc = async (name, args, ok) => { const { error } = await supabase.rpc(name, args); if (error) toast(errText(error)); else { toast(ok); load(); } };
  const showReceipt = async (path) => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 600);
    if (data?.signedUrl) setReceipt(data.signedUrl); else toast(tr("Chekni ochib bo'lmadi"));
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
      ref_bonus_inviter: n('ref_bonus_inviter'), ref_bonus_invitee: n('ref_bonus_invitee'),
      free_ads: n('free_ads'), slot_pack: Math.max(1, n('slot_pack')), promo_days: Math.max(1, n('promo_days')), ad_days: Math.max(1, n('ad_days')),
      payme_merchant_id: String(cfg.payme_merchant_id || '').trim(), payme_test: !!cfg.payme_test,
      click_service_id: String(cfg.click_service_id || '').replace(/\D/g, ''), click_merchant_id: String(cfg.click_merchant_id || '').replace(/\D/g, ''),
      legal_name: String(cfg.legal_name || '').trim(), legal_inn: String(cfg.legal_inn || '').replace(/\D/g, ''),
      legal_address: String(cfg.legal_address || '').trim(), legal_bank: String(cfg.legal_bank || '').trim(),
      fiscal_mxik: String(cfg.fiscal_mxik || '').replace(/\D/g, ''), fiscal_package: String(cfg.fiscal_package || '').replace(/\D/g, ''),
      fiscal_vat: Math.min(100, n('fiscal_vat')),
    };
    if (keys.mail) {
      const { error: mErr } = await supabase.rpc('admin_set_mail_password', { p_pass: keys.mail });
      if (mErr) { toast(errText(mErr)); return; }
    }
    if (keys.payme || keys.click) {
      const { error: kErr } = await supabase.rpc('admin_set_payment_secrets', { p_payme_key: keys.payme || null, p_click_secret: keys.click || null });
      if (kErr) { toast(errText(kErr)); return; }
      setKeys({ payme: '', click: '', mail: '' });
      supabase.rpc('admin_payment_status').then(({ data }) => setPaySt(data));
    }
    if (keys.mail) setKeys((k) => ({ ...k, mail: '' }));
    const { error } = await supabase.from('config').update(row).eq('id', 1);
    if (error) toast(errText(error)); else { toast(tr("Sozlamalar saqlandi")); loadConfig(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, padding: 16, paddingBottom: 8 }}>
        <Pill title={tr("To'lovlar")} on={tab === 'orders'} onPress={() => setTab('orders')} count={pending.length || undefined} />
        <Pill title={tr("Barcha e'lonlar")} on={tab === 'ads'} onPress={() => setTab('ads')} />
        <Pill title={tr("Shikoyatlar")} on={tab === 'reports'} onPress={() => setTab('reports')} count={reports.filter((r) => r.status === 'open').length || undefined} />
        <Pill title={tr("Suhbatlar")} on={tab === 'chats'} onPress={() => setTab('chats')} />
        <Pill title={tr("Sozlamalar")} on={tab === 'cfg'} onPress={() => setTab('cfg')} />
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => { setRefreshing(true); load(); }} />}>
        {orders === null ? <Loading /> : tab === 'orders' ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {kpi(tr("SHU OY TUSHUM"), fmtNum(month), true)}
              {kpi(tr("JAMI TUSHUM"), fmtNum(total), true)}
              {kpi(tr("KUTILAYOTGAN TO'LOV"), pending.length)}
              {kpi(tr("FAOL TOP / VIP"), promoted)}
            </View>
            {!config.pay_text ? <Note kind="gold">{tr("Foydalanuvchilar to'lov qila olishi uchun \"Sozlamalar\" bo'limida to'lov rekvizitlarini kiriting.")}</Note> : null}
            <H right={tr("{0} ta", orders.length)}>{tr("To'lovlar")}</H>
            {orders.length ? [...pending, ...orders.filter((o) => o.status !== 'pending')].map((o) => (
              <View key={o.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: o.status === 'pending' ? t.gold : t.line, borderRadius: 14, padding: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: t.ink }}>{o.code}</Text>
                  <Badge kind={o.status === 'ok' ? 'ok' : o.status === 'no' ? 'no' : 'wait'}>{o.status === 'ok' ? tr("TASDIQLANGAN") : o.status === 'no' ? tr("RAD ETILGAN") : tr("KUTILMOQDA")}</Badge>
                </View>
                <Text style={{ fontWeight: '700', color: t.ink }}>{SVC[o.svc]} — {fmtNum(o.price)} {tr("so'm")}</Text>
                {o.ads?.title ? <Text style={{ color: t.muted }} numberOfLines={1}>{o.ads.title}</Text> : null}
                <Text style={{ color: t.muted, fontSize: 13 }}>{o.provider && o.provider !== 'manual' ? tr("{0} · avtomatik · ", o.provider === 'payme' ? 'Payme' : 'Click') : ''}{tr("To'lovchi:")}{' '}{o.payer} · {profs[o.user_id]?.name || ''}{profs[o.user_id]?.public_id ? tr(" (ID {0})", profs[o.user_id].public_id) : ''} · {ago(o.created_at)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {o.receipt_path ? <Btn small kind="sec" icon="receipt-outline" title={tr("Chekni ko'rish")} onPress={() => showReceipt(o.receipt_path)} /> : null}
                  {o.status === 'pending' ? (
                    <>
                      <Btn small title={tr("Tasdiqlash")} icon="checkmark" onPress={() => rpc('approve_order', { p_id: o.id }, 'Tasdiqlandi, xizmat yoqildi')} />
                      <Btn small kind="dng" title={sure === 'no' + o.id ? tr("Ha, rad etish") : tr("Rad etish")} onPress={() => confirm('no' + o.id, () => rpc('reject_order', { p_id: o.id }, 'Rad etildi'))} />
                    </>
                  ) : null}
                </View>
              </View>
            )) : <Empty title={tr("Hozircha to'lovlar yo'q")} text={tr("Foydalanuvchilar TOP, VIP, uzaytirish yoki tiklash so'raganda shu yerda chiqadi. Pul tushganini tekshirib, tasdiqlaysiz.")} />}
          </>
        ) : tab === 'ads' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[['all', tr("Hammasi")], ['live', tr("Faol")], ['promo', tr("TOP/VIP")], ['expired', tr("Tugagan")], ['deleted', tr("O'chirilgan")]].map(([k, l]) => <Pill key={k} title={l} on={adFilter === k} onPress={() => setAdFilter(k)} />)}
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
                        {s === 'deleted' ? <Badge kind="no">{tr("O'CHIRILGAN")}</Badge> : s === 'expired' ? <Badge kind="wait">{tr("TUGAGAN")}</Badge> : isVip(a) ? <Badge kind="vip">{tr("VIP")}</Badge> : isTop(a) ? <Badge kind="top">{tr("TOP")}</Badge> : <Badge kind="ok">{tr("FAOL")}</Badge>}
                        <Text style={{ color: t.muted, fontSize: 11 }}>{shortDate(a.created_at)} → {shortDate(a.expires_at)}</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {s === 'deleted' ? <Btn small title={tr("Tiklash")} onPress={() => rpc('admin_activate', { p_ad: a.id, p_svc: 'restore' }, 'Tiklandi')} />
                      : s === 'expired' ? <Btn small title={tr("Uzaytirish")} onPress={() => rpc('admin_activate', { p_ad: a.id, p_svc: 'extend' }, 'Uzaytirildi')} />
                        : <Btn small kind="dng" title={sure === 'd' + a.id ? tr("Ha, olib tashlash") : tr("O'chirish")} onPress={() => confirm('d' + a.id, () => rpc('admin_delete_ad', { p_ad: a.id }, 'Olib tashlandi'))} />}
                  </View>
                </View>
              );
            }) : <Empty title={tr("Bu bo'limda e'lon yo'q")} />}
          </>
        ) : tab === 'reports' ? (
          <>
            {reports.length ? reports.map((r) => (
              <View key={r.id} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: r.status === 'open' ? t.danger : t.line, borderRadius: 14, padding: 12, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontWeight: '800', color: t.ink, flex: 1 }} numberOfLines={1}>{r.ads?.title || tr("E'lon o'chirilgan")}</Text>
                  <Badge kind={r.status === 'open' ? 'no' : 'ok'}>{r.status === 'open' ? tr("YANGI") : tr("KO'RILDI")}</Badge>
                </View>
                <Text style={{ color: t.muted, fontSize: 13 }}>{({ fraud: 'Firibgarlik', offtopic: "Mavzuga aloqasi yo'q", contact: 'Tashqi kontakt', spam: 'Spam', offensive: 'Haqoratli', other: 'Boshqa' })[r.reason]} · {r.ads?.seller_name || ''} · {ago(r.created_at)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {r.ads ? <Btn small kind="sec" title={tr("Ko'rish")} onPress={() => router.push(`/ad/${r.ad_id}`)} /> : null}
                  {r.ads && r.ads.status === 'active' ? <Btn small kind="dng" title={sure === 'r' + r.id ? tr("Ha, olib tashlash") : tr("E'lonni o'chirish")} onPress={() => confirm('r' + r.id, async () => {
                    const { error } = await supabase.rpc('admin_delete_ad', { p_ad: r.ad_id });
                    if (error) { toast(errText(error)); return; }
                    await supabase.from('reports').update({ status: 'done' }).eq('ad_id', r.ad_id);
                    toast(tr("E'lon olib tashlandi")); load();
                  })} /> : null}
                  {r.status === 'open' ? <Btn small title={tr("Ko'rildi")} onPress={async () => { await supabase.from('reports').update({ status: 'done' }).eq('id', r.id); load(); }} /> : null}
                </View>
              </View>
            )) : <Empty title={tr("Shikoyatlar yo'q")} text={tr("Foydalanuvchilar e'longa shikoyat qilsa, shu yerda chiqadi.")} />}
          </>
        ) : tab === 'chats' ? (
          <>
            <Note>{tr("Suhbatlarni faqat shikoyat yoki firibgarlikni tekshirish uchun oching. Foydalanuvchilar bu haqda chat oynasida ogohlantirilgan.")}</Note>
            {threads.length ? threads.map((th) => (
              <Pressable key={th.id} onPress={() => router.push(`/chat/${th.id}`)} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 12, gap: 3 }}>
                <Text style={{ fontWeight: '700', color: t.ink }} numberOfLines={1}>{profs[th.seller_id]?.name || tr("Sotuvchi")} ↔ {profs[th.buyer_id]?.name || tr("Xaridor")}</Text>
                <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{!th.ad_id ? tr("Qo'llab-quvvatlash murojaati") : th.ads?.title || tr("E'lon o'chirilgan")}</Text>
                <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>{th.last_text} · {ago(th.last_at)}</Text>
              </Pressable>
            )) : <Empty title={tr("Hozircha suhbatlar yo'q")} />}
          </>
        ) : cfg ? (
          <View style={{ gap: 12 }}>
            <Field label={tr("To'lov rekvizitlari")} value={cfg.pay_text} onChangeText={(v) => setCfg({ ...cfg, pay_text: v })} multiline maxLength={400}
              placeholder={tr("Karta raqami va egasining ismi yoki Click/Payme yo'riqnomasi")} hint={tr("Bu matn to'lov qilayotgan foydalanuvchilarga ko'rinadi.")} />
            {[['p_vip', tr("VIP narxi")], ['p_top', tr("TOP narxi")], ['p_bump', tr("Ko'tarish narxi")], ['p_extend', tr("Uzaytirish narxi")], ['p_restore', tr("Tiklash narxi")], ['p_slots', tr("+e'lon joylari narxi")],
              ['ref_bonus_inviter', tr("Taklif qilganga bonus (so'm)")], ['ref_bonus_invitee', tr("Yangi foydalanuvchiga bonus (so'm)")],
              ['free_ads', tr("Bepul e'lonlar limiti")], ['slot_pack', tr("Bir paketda nechta joy")], ['promo_days', tr("TOP/VIP muddati (kun)")], ['ad_days', tr("E'lon muddati (kun)")]].map(([k, l]) => (
              <Field key={k} label={l + (k.startsWith('p_') ? tr(" (so'm)") : '')} value={String(cfg[k] ?? '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, [k]: v.replace(/\D/g, '') })} />
            ))}
            <H>{tr("Xavfsizlik")}</H>
            <Field label={tr("Gmail ilova parolini almashtirish")} value={keys.mail} onChangeText={(v) => setKeys({ ...keys, mail: v })} secureTextEntry autoCapitalize="none"
              placeholder={tr("Yangi 16 harfli parol")} hint={tr("Google hisobi → Xavfsizlik → Ilova parollari. Eski parolni o'chirib, yangisini shu yerga yozing. Chatga hech kimga yubormang.")} />
            <H>{tr("Rekvizitlar (oferta uchun)")}</H>
            <Field label={tr("Sotuvchi (YaTT F.I.Sh. yoki MChJ nomi)")} value={String(cfg.legal_name || '')} onChangeText={(v) => setCfg({ ...cfg, legal_name: v })} placeholder={tr("YaTT Hamidov Oybek")} />
            <Field label={tr("STIR (INN)")} value={String(cfg.legal_inn || '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, legal_inn: v })} />
            <Field label={tr("Manzil")} value={String(cfg.legal_address || '')} onChangeText={(v) => setCfg({ ...cfg, legal_address: v })} placeholder={tr("Buxoro sh., ...")} />
            <Field label={tr("Bank rekvizitlari")} value={String(cfg.legal_bank || '')} onChangeText={(v) => setCfg({ ...cfg, legal_bank: v })} placeholder={tr("H/r: 2020 8000 ... · Bank · MFO")} />
            <H>{tr("Fiskal chek (soliq)")}</H>
            <Field label={tr("MXIK (IKPU) kodi")} value={String(cfg.fiscal_mxik || '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, fiscal_mxik: v })} hint={tr("tasnif.soliq.uz saytidan xizmatingiz kodi (17 raqam)")} />
            <Field label={tr("Qadoq (o'lchov) kodi")} value={String(cfg.fiscal_package || '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, fiscal_package: v })} hint={tr("Shu MXIK kodiga biriktirilgan o'lchov kodi")} />
            <Field label={tr("QQS foizi")} value={String(cfg.fiscal_vat ?? 0)} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, fiscal_vat: v.replace(/\D/g, '') })} hint={tr("QQS to'lovchisi bo'lmasangiz 0")} />
            <H>{tr("Payme (avtomatik to'lov)")}</H>
            <Field label={tr("Merchant ID (kassa ID)")} value={String(cfg.payme_merchant_id || '')} onChangeText={(v) => setCfg({ ...cfg, payme_merchant_id: v })} autoCapitalize="none" />
            <Field label={tr("Kassa kaliti (Ключ)") + (paySt?.payme_key ? tr(" · kiritilgan ✓") : '')} value={keys.payme} onChangeText={(v) => setKeys({ ...keys, payme: v })} secureTextEntry autoCapitalize="none"
              placeholder={paySt?.payme_key ? tr("O'zgartirish uchun yangisini yozing") : tr("Kalitni joylang")} />
            <Pressable onPress={() => setCfg({ ...cfg, payme_test: !cfg.payme_test })} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name={cfg.payme_test ? 'checkbox' : 'square-outline'} size={22} color={t.accent} />
              <Text style={{ color: t.ink }}>{tr("Sinov rejimi (test.paycom.uz)")}</Text>
            </Pressable>
            <Note>Payme kabinetida "Endpoint URL": https://qtvyjmiqoknpnlilpfpf.supabase.co/functions/v1/payme · Hisob maydoni: order_id</Note>
            <H>{tr("Click (avtomatik to'lov)")}</H>
            <Field label={tr("Service ID")} value={String(cfg.click_service_id || '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, click_service_id: v })} />
            <Field label={tr("Merchant ID")} value={String(cfg.click_merchant_id || '')} keyboardType="number-pad" onChangeText={(v) => setCfg({ ...cfg, click_merchant_id: v })} />
            <Field label={tr("Secret key") + (paySt?.click_secret ? tr(" · kiritilgan ✓") : '')} value={keys.click} onChangeText={(v) => setKeys({ ...keys, click: v })} secureTextEntry autoCapitalize="none"
              placeholder={paySt?.click_secret ? tr("O'zgartirish uchun yangisini yozing") : tr("Kalitni joylang")} />
            <Note>Click kabinetida Prepare va Complete URL: https://qtvyjmiqoknpnlilpfpf.supabase.co/functions/v1/click</Note>
            <Btn title={tr("Saqlash")} onPress={saveCfg} />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!receipt} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <Pressable onPress={() => setReceipt(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.85)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {receipt ? <Image source={{ uri: receipt }} style={{ width: '100%', height: '85%' }} contentFit="contain" /> : null}
          <Text style={{ color: '#fff', marginTop: 12 }}>{tr("Yopish uchun bosing")}</Text>
        </Pressable>
      </Modal>
    </View>
  );
}
