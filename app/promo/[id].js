import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useT, FONT } from '../../src/theme';
import { useApp } from '../../src/app-context';
import { supabase, errText } from '../../src/supabase';
import { SVC, svcDesc } from '../../src/data';
import { adState, fmtNum } from '../../src/format';
import { pickImages, uploadImage, newName } from '../../src/images';
import { WEB_URL } from '../../src/config';
import { Btn, Field, Loading, Note } from '../../src/ui';

export default function Promo() {
  const { id, svc: want } = useLocalSearchParams();
  const t = useT();
  const router = useRouter();
  const { uid, isAdmin, config, toast } = useApp();
  const [ad, setAd] = useState(id === 'slots' ? null : undefined);
  const [svc, setSvc] = useState(null);
  const [payer, setPayer] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [bonus, setBonus] = useState(0);
  useEffect(() => { if (uid) supabase.from('wallets').select('bonus').eq('user_id', uid).maybeSingle().then(({ data }) => setBonus(data?.bonus || 0)); }, [uid]);

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

  const submit = async () => {
    if (payer.trim().length < 2) { setErr("To'lovchi ismini yoki karta raqami oxirgi 4 raqamini kiriting."); return; }
    setBusy(true); setErr('');
    try {
      let receipt_path = null;
      if (receipt) receipt_path = await uploadImage('receipts', `${uid}/${newName()}`, receipt);
      const { error } = await supabase.from('orders').insert({ ad_id: id === 'slots' ? null : ad.id, svc, payer: payer.trim(), receipt_path });
      if (error) throw error;
      toast("Yuborildi. Tasdiqlangach xizmat avtomatik yoqiladi.");
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  // Payme / Click: buyurtma yaratib, to'lov sahifasini ochish
  const b64 = (str) => (typeof btoa === 'function' ? btoa(str) : globalThis.Buffer.from(str).toString('base64'));
  const payOnline = async (provider) => {
    setBusy(true); setErr('');
    try {
      const { data: o, error } = await supabase.from('orders')
        .insert({ ad_id: id === 'slots' ? null : ad.id, svc, payer: provider, provider }).select('id, price').single();
      if (error) throw error;
      const back = WEB_URL + '/cabinet';
      let url;
      if (provider === 'payme') {
        const base = config.payme_test ? 'https://checkout.test.paycom.uz/' : 'https://checkout.paycom.uz/';
        url = base + b64(`m=${config.payme_merchant_id};ac.order_id=${o.id};a=${Math.round(+o.price * 100)};c=${back};l=uz`);
      } else {
        url = 'https://my.click.uz/services/pay?' + new URLSearchParams({
          service_id: config.click_service_id, merchant_id: config.click_merchant_id,
          amount: String(+o.price), transaction_param: o.id, return_url: back,
        }).toString();
      }
      toast("To'lov sahifasi ochilmoqda…");
      if (Platform.OS === 'web') window.location.href = url; else await Linking.openURL(url);
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const payBonus = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('pay_with_bonus', { p_ad: id === 'slots' ? null : ad.id, p_svc: svc });
    setBusy(false);
    if (error) { setErr(errText(error)); return; }
    toast(SVC[svc] + ' bonus hisobidan yoqildi 🎉'); router.back();
  };
  const hasPayme = !!config.payme_merchant_id;
  const hasClick = !!(config.click_service_id && config.click_merchant_id);

  const copy = async () => { try { await Clipboard.setStringAsync(config.pay_text); toast('Nusxalandi'); } catch (e) {} };

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
            <Text style={{ fontWeight: '800', color: t.price }}>{fmtNum(config.prices[k])} so'm</Text>
          </Pressable>
        );
      })}

      {isAdmin && ad ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>Siz bozor egasisiz</Text>
          <Text style={{ color: t.muted }}>Xizmatni to'lovsiz, darhol yoqishingiz mumkin.</Text>
          <Btn title="Hozir faollashtirish" onPress={activateNow} loading={busy} />
        </View>
      ) : null}

      {!(isAdmin && ad) && bonus > 0 ? (
        <View style={{ backgroundColor: t.goldSoft, borderRadius: 16, padding: 14, gap: 8 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>Bonus balansingiz: {fmtNum(bonus)} so'm</Text>
          {bonus >= price ? <Btn kind="gold" icon="gift-outline" title={`Bonus bilan to'lash (${fmtNum(price)} so'm)`} onPress={payBonus} loading={busy} />
            : <Text style={{ color: t.muted, fontSize: 13 }}>Bu xizmat uchun yana {fmtNum(price - bonus)} so'm bonus kerak. Do'stlaringizni taklif qiling!</Text>}
        </View>
      ) : null}

      {!(isAdmin && ad) && (hasPayme || hasClick) ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>Tez to'lov · xizmat darhol yoqiladi</Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{fmtNum(price)} so'm</Text>
          {hasPayme ? <Btn title="Payme orqali to'lash" onPress={() => payOnline('payme')} loading={busy} style={{ backgroundColor: '#00CCCC' }} /> : null}
          {hasClick ? <Btn title="Click orqali to'lash" onPress={() => payOnline('click')} loading={busy} style={{ backgroundColor: '#0077FF' }} /> : null}
          <Text style={{ color: t.muted, fontSize: 12 }}>Humo va Uzcard kartalari qabul qilinadi.</Text>
        </View>
      ) : null}

      {isAdmin && ad ? null : !config.pay_text ? (
        (hasPayme || hasClick) ? null : <Note kind="gold">To'lov hali ulanmagan. Bozor egasi to'lov rekvizitlarini kiritganidan keyin bu xizmatdan foydalana olasiz.</Note>
      ) : (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 12 }}>
          <View>
            <Text style={{ color: t.muted, fontSize: 12 }}>To'lanadigan summa</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 26, color: t.ink }}>{fmtNum(price)} so'm</Text>
          </View>
          <Text style={{ fontWeight: '700', color: t.ink }}>{hasPayme || hasClick ? "Yoki kartaga o'tkazing (qo'lda tasdiqlanadi)" : "Quyidagi rekvizitlarga o'tkazing"}</Text>
          <Text selectable style={{ backgroundColor: t.chip, borderRadius: 10, padding: 12, color: t.ink, fontSize: 15, lineHeight: 22 }}>{config.pay_text}</Text>
          <View style={{ alignSelf: 'flex-start' }}><Btn small kind="sec" icon="copy-outline" title="Nusxalash" onPress={copy} /></View>
          <Field label="To'lovchi ismi yoki karta oxirgi 4 raqami" value={payer} onChangeText={setPayer} placeholder="Masalan: Aziz, 4417" maxLength={60} />
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '700', color: t.ink, fontSize: 13 }}>To'lov cheki (skrinshot)</Text>
            {receipt ? <Image source={{ uri: receipt.uri }} style={{ width: 120, height: 160, borderRadius: 10 }} contentFit="cover" /> : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Btn small kind="sec" icon="image-outline" title={receipt ? 'Boshqa chek tanlash' : 'Chekni yuklash'}
                onPress={async () => { try { const [r] = await pickImages({ max: 1, width: 1100 }); if (r) setReceipt(r); } catch (e) { toast(e.message); } }} />
            </View>
            <Text style={{ color: t.muted, fontSize: 12 }}>Chek tasdiqlashni tezlashtiradi.</Text>
          </View>
          {err ? <Note kind="bad">{err}</Note> : null}
          <Btn title="To'ladim — tasdiqlashga yuborish" onPress={submit} loading={busy} />
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 17 }}>Bozor egasi to'lovni tekshirib, xizmatni yoqadi. Holatini Kabinet → To'lovlarim bo'limida ko'rasiz.</Text>
        </View>
      )}
    </ScrollView>
  );
}
