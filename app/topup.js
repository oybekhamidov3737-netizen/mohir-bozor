import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useT, FONT } from '../src/theme';
import { useApp, useRequire } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { fmtNum } from '../src/format';
import { pickImages, uploadImage, newName } from '../src/images';
import { onlinePayUrl, openPay, hasPayme, hasClick, PAYMENTS_IN_APP } from '../src/pay';
import { Btn, Field, Note } from '../src/ui';
import { PayDetails } from '../src/paydetails';

const PRESETS = [10000, 25000, 50000, 100000, 200000];
const MIN = 5000, MAX = 10000000;

// Hisobni to'ldirish
export default function TopUp() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { uid, config, toast } = useApp();
  const [amount, setAmount] = useState('50000');
  const [payer, setPayer] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sum = parseInt(String(amount).replace(/\D/g, ''), 10) || 0;
  const valid = sum >= MIN && sum <= MAX;
  const online = hasPayme(config) || hasClick(config);

  const check = () => {
    if (!need('/topup')) return false;
    if (!valid) { setErr(`Summa ${fmtNum(MIN)} dan ${fmtNum(MAX)} so'mgacha bo'lishi kerak.`); return false; }
    return true;
  };

  const payOnline = async (provider) => {
    if (!check()) return;
    setBusy(true); setErr('');
    try {
      const { data: o, error } = await supabase.from('orders').insert({ svc: 'topup', price: sum, payer: provider, provider }).select('id, price').single();
      if (error) throw error;
      toast("To'lov sahifasi ochilmoqda…");
      await openPay(onlinePayUrl(provider, o, config));
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  const submitManual = async () => {
    if (!check()) return;
    if (payer.trim().length < 2) { setErr("To'lovchi ismini yoki karta raqami oxirgi 4 raqamini kiriting."); return; }
    setBusy(true); setErr('');
    try {
      let receipt_path = null;
      if (receipt) receipt_path = await uploadImage('receipts', `${uid}/${newName()}`, receipt);
      const { error } = await supabase.from('orders').insert({ svc: 'topup', price: sum, payer: payer.trim(), receipt_path });
      if (error) throw error;
      toast("So'rov yuborildi. Pul tushgani tasdiqlangach hisobingiz to'ladi.");
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  if (!PAYMENTS_IN_APP) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
        <Note>Bu bo'lim ilovada mavjud emas.</Note>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>Hisobni to'ldirish</Text>
      <Text style={{ color: t.muted, lineHeight: 20 }}>Hisobingizdagi pul bilan TOP, VIP, ko'tarish va boshqa xizmatlarni bir bosishda yoqasiz.</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PRESETS.map((p) => {
          const on = sum === p;
          return (
            <Pressable key={p} onPress={() => { setAmount(String(p)); setErr(''); }}
              style={{ paddingHorizontal: 14, height: 42, borderRadius: 12, justifyContent: 'center', borderWidth: on ? 2 : 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accentSoft : t.surface }}>
              <Text style={{ fontWeight: '800', color: on ? t.accent : t.ink }}>{fmtNum(p)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="Summa (so'm)" value={sum ? fmtNum(sum) : ''} onChangeText={(v) => { setAmount(v.replace(/\D/g, '')); setErr(''); }} keyboardType="number-pad" placeholder="50 000"
        hint={`Kamida ${fmtNum(MIN)} so'm`} />

      {online ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>Tez to'ldirish · darhol tushadi</Text>
          {hasPayme(config) ? <Btn title={`Payme · ${fmtNum(sum)} so'm`} onPress={() => payOnline('payme')} loading={busy} style={{ backgroundColor: '#00CCCC' }} /> : null}
          {hasClick(config) ? <Btn title={`Click · ${fmtNum(sum)} so'm`} onPress={() => payOnline('click')} loading={busy} style={{ backgroundColor: '#0077FF' }} /> : null}
          <Text style={{ color: t.muted, fontSize: 12 }}>Humo va Uzcard kartalari qabul qilinadi. To'lov qilish orqali <Text style={{ color: t.accent }} onPress={() => router.push('/offer')}>ommaviy oferta</Text> shartlariga rozilik bildirasiz.</Text>
        </View>
      ) : null}

      {config.pay_text ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 12 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{online ? "Yoki kartaga o'tkazma (qo'lda tasdiqlanadi)" : "Kartaga o'tkazma"}</Text>
          <PayDetails text={config.pay_text} />
          <Field label="To'lovchi ismi yoki karta oxirgi 4 raqami" value={payer} onChangeText={setPayer} placeholder="Masalan: Aziz, 4417" maxLength={60} />
          <View style={{ gap: 8 }}>
            {receipt ? <Image source={{ uri: receipt.uri }} style={{ width: 120, height: 160, borderRadius: 10 }} contentFit="cover" /> : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Btn small kind="sec" icon="image-outline" title={receipt ? 'Boshqa chek tanlash' : 'Chekni yuklash'}
                onPress={async () => { try { const [r] = await pickImages({ max: 1, width: 1100 }); if (r) setReceipt(r); } catch (e) { toast(e.message); } }} />
            </View>
          </View>
          <Btn title={`O'tkazdim — ${fmtNum(sum)} so'm`} onPress={submitManual} loading={busy} disabled={!valid} />
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 17 }}>Pul tushgani tekshirilgach hisobingizga qo'shiladi. Holatini Kabinet → To'lovlarim'da ko'rasiz.</Text>
        </View>
      ) : !online ? <Note kind="gold">To'ldirish hali ulanmagan. Tez orada ishga tushadi.</Note> : null}

      {err ? <Note kind="bad">{err}</Note> : null}
    </ScrollView>
  );
}
