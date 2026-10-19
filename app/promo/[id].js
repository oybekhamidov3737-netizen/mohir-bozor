import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase, errText } from '../../src/supabase';
import { SVC, svcDesc } from '../../src/data';
import { adState, fmtNum } from '../../src/format';
import { Btn, Loading, Note } from '../../src/ui';
import { PAYMENTS_IN_APP, onlinePayUrl, openPay } from '../../src/pay';
import { tr } from '../../src/i18n';

export default function Promo() {
  const { id, svc: want } = useLocalSearchParams();
  const t = useT();
  const router = useRouter();
  const { uid, isAdmin, config, toast } = useApp();
  const [ad, setAd] = useState(id === 'slots' ? null : undefined);
  const [svc, setSvc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [bonus, setBonus] = useState(0);
  const [mainBal, setMainBal] = useState(0);
  useEffect(() => { if (uid) supabase.from('wallets').select('bonus, balance').eq('user_id', uid).maybeSingle().then(({ data }) => { setBonus(data?.bonus || 0); setMainBal(data?.balance || 0); }); }, [uid]);

  useEffect(() => {
    if (id === 'slots') { setSvc('slots'); return; }
    supabase.from('ads').select('*').eq('id', id).maybeSingle().then(({ data }) => setAd(data || null));
  }, [id]);

  const opts = id === 'slots' ? ['slots'] : !ad ? [] : adState(ad) === 'deleted' ? ['restore'] : adState(ad) === 'expired' ? ['extend'] : ['vip', 'top', 'bump', 'extend'];
  useEffect(() => { if (opts.length && !svc) setSvc(opts.includes(want) ? want : opts[0]); }, [opts.join(), want]);

  if (ad === undefined || !svc) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;
  const price = config.prices[svc] || 0;

  const activateNow = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_activate', { p_ad: ad.id, p_svc: svc });
    setBusy(false);
    if (error) { toast(errText(error)); return; }
    toast(SVC[svc] + ' yoqildi'); router.back();
  };

  // Payme / Click: buyurtma yaratib, to'lov sahifasini ochish
  const payOnline = async (provider) => {
    setBusy(true); setErr('');
    try {
      const { data: o, error } = await supabase.from('orders')
        .insert({ ad_id: id === 'slots' ? null : ad.id, svc, payer: provider, provider }).select('id, price').single();
      if (error) throw error;
      const url = onlinePayUrl(provider, o, config);
      setPayUrl(url);
      toast(tr("To'lov sahifasi ochilmoqda…"));
      await openPay(url);
      // Veb'da router.back() sahifa almashishini bekor qilib qo'yardi
      if (Platform.OS !== 'web') router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const payBonus = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('pay_from_wallet', { p_ad: id === 'slots' ? null : ad.id, p_svc: svc });
    setBusy(false);
    if (error) { setErr(errText(error)); return; }
    toast(SVC[svc] + tr(" balansdan yoqildi 🎉")); router.back();
  };
  const hasPayme = !!config.payme_merchant_id;
  const hasClick = !!(config.click_service_id && config.click_merchant_id);


  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      {ad ? <Text style={{ color: t.muted }} numberOfLines={2}>{ad.title}</Text> : null}
      {opts.map((k) => {
        const on = svc === k;
        const gold = k === 'vip';
        return (
          <Pressable key={k} onPress={() => setSvc(k)} style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: on ? 2 : 1, borderColor: on ? (gold ? t.gold : t.accent) : t.line, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? (gold ? t.gold : t.accent) : t.muted} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '800', color: t.ink, fontSize: 15 }}>{SVC[k]}</Text>
              <Text style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>{svcDesc(k, config)}</Text>
            </View>
            <Text style={{ fontWeight: '800', color: t.price }}>{fmtNum(config.prices[k])} {tr("so'm")}</Text>
          </Pressable>
        );
      })}

      {isAdmin && ad ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Siz bozor egasisiz")}</Text>
          <Text style={{ color: t.muted }}>{tr("Xizmatni to'lovsiz, darhol yoqishingiz mumkin.")}</Text>
          <Btn title={tr("Hozir faollashtirish")} onPress={activateNow} loading={busy} />
        </View>
      ) : null}

      {!(isAdmin && ad) ? (
        <View style={{ backgroundColor: t.accentSoft, borderRadius: 16, padding: 14, gap: 8 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Balansingiz:")}{' '}{fmtNum(mainBal + bonus)} {tr("so'm")}</Text>
          {bonus > 0 ? <Text style={{ color: t.muted, fontSize: 12 }}>{tr("Asosiy:")}{' '}{fmtNum(mainBal)} {tr("· Bonus:")}{' '}{fmtNum(bonus)} {tr("(avval bonus ishlatiladi)")}</Text> : null}
          {mainBal + bonus >= price ? <Btn icon="wallet-outline" title={tr("Balansdan to'lash · {0} so'm", fmtNum(price))} onPress={payBonus} loading={busy} />
            : <>
                <Text style={{ color: t.muted, fontSize: 13 }}>{tr("Yana")}{' '}{fmtNum(price - mainBal - bonus)} {tr("so'm yetishmaydi.")}</Text>
                {PAYMENTS_IN_APP ? <Btn kind="sec" icon="add-circle-outline" title={tr("Hisobni to'ldirish")} onPress={() => router.push('/topup')} /> : null}
              </>}
        </View>
      ) : null}

      {PAYMENTS_IN_APP && !(isAdmin && ad) && (hasPayme || hasClick) ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Tez to'lov · xizmat darhol yoqiladi")}</Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{fmtNum(price)} {tr("so'm")}</Text>
          {hasPayme ? <Btn title={tr("Payme orqali to'lash")} onPress={() => payOnline('payme')} loading={busy} style={{ backgroundColor: '#00CCCC' }} /> : null}
          {hasClick ? <Btn title={tr("Click orqali to'lash")} onPress={() => payOnline('click')} loading={busy} style={{ backgroundColor: '#0077FF' }} /> : null}
          <Text style={{ color: t.muted, fontSize: 12 }}>{tr("Humo va Uzcard kartalari qabul qilinadi. To'lov qilish orqali")}{' '}<Text style={{ color: t.accent }} onPress={() => router.push('/offer')}>{tr("ommaviy oferta")}</Text> {tr("shartlariga rozilik bildirasiz.")}</Text>
        </View>
      ) : null}

      {isAdmin && ad ? null : !PAYMENTS_IN_APP ? null : !(hasPayme || hasClick) ? (
        <Note kind="gold">{tr("To'lov hali ulanmagan. Tez orada ishga tushadi.")}</Note>
      ) : null}
      {payUrl ? (
        <Note>{tr("To'lov sahifasi ochilmasa, shu tugmani bosing:")}{' '}<Text style={{ color: t.accent, fontWeight: '800' }} onPress={() => Linking.openURL(payUrl).catch(() => {})}>{tr("To'lov sahifasini ochish")}</Text></Note>
      ) : null}
      {err ? <Note kind="bad">{err}</Note> : null}
    </ScrollView>
  );
}
