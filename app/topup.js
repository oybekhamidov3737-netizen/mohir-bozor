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
import { tr } from '../src/i18n';

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
    if (!valid) { setErr(tr("Summa {0} dan {1} so'mgacha bo'lishi kerak.", fmtNum(MIN), fmtNum(MAX))); return false; }
    return true;
  };

  const payOnline = async (provider) => {
    if (!check()) return;
    setBusy(true); setErr('');
    try {
      const { data: o, error } = await supabase.from('orders').insert({ svc: 'topup', price: sum, payer: provider, provider }).select('id, price').single();
      if (error) throw error;
      toast(tr("To'lov sahifasi ochilmoqda…"));
      await openPay(onlinePayUrl(provider, o, config));
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  const submitManual = async () => {
    if (!check()) return;
    if (payer.trim().length < 2) { setErr(tr("To'lovchi ismini yoki karta raqami oxirgi 4 raqamini kiriting.")); return; }
    setBusy(true); setErr('');
    try {
      let receipt_path = null;
      if (receipt) receipt_path = await uploadImage('receipts', `${uid}/${newName()}`, receipt);
      const { error } = await supabase.from('orders').insert({ svc: 'topup', price: sum, payer: payer.trim(), receipt_path });
      if (error) throw error;
      toast(tr("So'rov yuborildi. Pul tushgani tasdiqlangach hisobingiz to'ladi."));
      router.back();
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  if (!PAYMENTS_IN_APP) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
        <Note>{tr("Bu bo'lim ilovada mavjud emas.")}</Note>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>{tr("Hisobni to'ldirish")}</Text>
      <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Hisobingizdagi pul bilan TOP, VIP, ko'tarish va boshqa xizmatlarni bir bosishda yoqasiz.")}</Text>

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
      <Field label={tr("Summa (so'm)")} value={sum ? fmtNum(sum) : ''} onChangeText={(v) => { setAmount(v.replace(/\D/g, '')); setErr(''); }} keyboardType="number-pad" placeholder="50 000"
        hint={tr("Kamida {0} so'm", fmtNum(MIN))} />

      {online ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 10 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{tr("Tez to'ldirish · darhol tushadi")}</Text>
          {hasPayme(config) ? <Btn title={tr("Payme · {0} so'm", fmtNum(sum))} onPress={() => payOnline('payme')} loading={busy} style={{ backgroundColor: '#00CCCC' }} /> : null}
          {hasClick(config) ? <Btn title={tr("Click · {0} so'm", fmtNum(sum))} onPress={() => payOnline('click')} loading={busy} style={{ backgroundColor: '#0077FF' }} /> : null}
          <Text style={{ color: t.muted, fontSize: 12 }}>{tr("Humo va Uzcard kartalari qabul qilinadi. To'lov qilish orqali")}{' '}<Text style={{ color: t.accent }} onPress={() => router.push('/offer')}>{tr("ommaviy oferta")}</Text> {tr("shartlariga rozilik bildirasiz.")}</Text>
        </View>
      ) : null}

      {config.pay_text ? (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14, gap: 12 }}>
          <Text style={{ fontWeight: '800', color: t.ink }}>{online ? tr("Yoki kartaga o'tkazma (qo'lda tasdiqlanadi)") : tr("Kartaga o'tkazma")}</Text>
          <PayDetails text={config.pay_text} />
          <Field label={tr("To'lovchi ismi yoki karta oxirgi 4 raqami")} value={payer} onChangeText={setPayer} placeholder={tr("Masalan: Aziz, 4417")} maxLength={60} />
          <View style={{ gap: 8 }}>
            {receipt ? <Image source={{ uri: receipt.uri }} style={{ width: 120, height: 160, borderRadius: 10 }} contentFit="cover" /> : null}
            <View style={{ alignSelf: 'flex-start' }}>
              <Btn small kind="sec" icon="image-outline" title={receipt ? tr("Boshqa chek tanlash") : tr("Chekni yuklash")}
                onPress={async () => { try { const [r] = await pickImages({ max: 1, width: 1100 }); if (r) setReceipt(r); } catch (e) { toast(e.message); } }} />
            </View>
          </View>
          <Btn title={tr("O'tkazdim — {0} so'm", fmtNum(sum))} onPress={submitManual} loading={busy} disabled={!valid} />
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 17 }}>{tr("Pul tushgani tekshirilgach hisobingizga qo'shiladi. Holatini Kabinet → To'lovlarim'da ko'rasiz.")}</Text>
        </View>
      ) : !online ? <Note kind="gold">{tr("To'ldirish hali ulanmagan. Tez orada ishga tushadi.")}</Note> : null}

      {err ? <Note kind="bad">{err}</Note> : null}
    </ScrollView>
  );
}
