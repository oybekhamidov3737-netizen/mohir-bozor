import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { ALLOWED_EMAIL } from '../src/config';
import { Btn, Field, Note, Seg } from '../src/ui';
import { tr } from '../src/i18n';

export default function Login() {
  const t = useT();
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { loadProfile, toast, config } = useApp();
  const smsOn = !!config?.sms_login;
  const [via, setVia] = useState(smsOn ? 'phone' : 'email');
  const [phone, setPhone] = useState('');
  useEffect(() => { if (smsOn) setVia('phone'); }, [smsOn]);
  const [otpEmail, setOtpEmail] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pass, setPass] = useState('');

  const sending = useRef(false);
  const digits = phone.replace(/\D/g, '').replace(/^998/, '');
  const send = async () => {
    const isPhone = via === 'phone' && smsOn;
    const e = email.trim().toLowerCase();
    if (isPhone) {
      if (digits.length !== 9) { setErr(tr("Telefon raqamni to'liq kiriting: 9 ta raqam, masalan 90 123 45 67")); return; }
    } else if (!ALLOWED_EMAIL.test(e)) { setErr(tr("Faqat Gmail (@gmail.com) yoki iCloud (@icloud.com) pochtasini kiriting.")); return; }
    if (sending.current) return; // ikki marta bosilsa, ikkinchi so'rov yuborilmaydi
    sending.current = true;
    setBusy(true); setErr('');
    setOtpEmail(isPhone ? `p998${digits}@tel.mohirbozor.uz` : e);
    const { data, error } = isPhone
      ? await supabase.functions.invoke('send-sms', { body: { phone: '998' + digits } })
      : await supabase.functions.invoke('send-code', { body: { email: e } });
    setBusy(false); sending.current = false;
    if (error || !data?.ok) {
      let msg = data?.error;
      try { if (!msg && error?.context) msg = (await error.context.json()).error; } catch (x) {}
      // Kod yaqinda yuborilgan bo'lsa — kod kiritish oynasiga o'tamiz (avvalgi kod amal qiladi)
      if (error?.context?.status === 429 || /urinish/i.test(String(msg || ''))) {
        setStep('code');
        toast(isPhone ? tr("Kod allaqachon yuborilgan — SMS'larni tekshiring") : tr("Kod allaqachon yuborilgan — pochtangizni (Spam papkasini ham) tekshiring"));
        return;
      }
      setErr(msg || errText(error));
      return;
    }
    setStep('code');
    toast(isPhone ? tr("Kod SMS orqali yuborildi") : tr("Kod pochtangizga yuborildi"));
  };

  // App Store / Google Play tekshiruvchilari uchun: pochta + parol
  const passLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!ALLOWED_EMAIL.test(e) || !pass) { setErr(tr("Pochta va parolni kiriting.")); return; }
    setBusy(true); setErr('');
    const { data, error } = await supabase.functions.invoke('send-code', { body: { email: e, password: pass } });
    if (error || !data?.otp) {
      let msg = data?.error;
      try { if (!msg && error?.context) msg = (await error.context.json()).error; } catch (x) {}
      setBusy(false); setErr(msg || errText(error));
      return;
    }
    verify(data.otp);
  };

  const verify = async (auto) => {
    const c = (typeof auto === 'string' ? auto : code).replace(/\D/g, '');
    if (c.length < 6) { setErr(tr("Kelgan 6 xonali kodni kiriting.")); return; }
    setBusy(true); setErr('');
    const em = (typeof auto === 'string' ? email.trim().toLowerCase() : otpEmail) || email.trim().toLowerCase();
    let { error } = await supabase.auth.verifyOtp({ email: em, token: c, type: 'email' });
    if (error) ({ error } = await supabase.auth.verifyOtp({ email: em, token: c, type: 'magiclink' }));
    if (error) { setBusy(false); setErr(errText(error)); return; }
    const prof = await loadProfile();
    setBusy(false);
    toast(tr("Xush kelibsiz!"));
    if (!prof) router.replace({ pathname: '/profile', params: { next: next || '' } });
    else if (next) router.replace(next);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <Ionicons name={step === 'code' ? 'key-outline' : step === 'pass' ? 'lock-closed-outline' : via === 'phone' && smsOn ? 'phone-portrait-outline' : 'mail-outline'} size={30} color={t.accent} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{step === 'email' ? tr("Kirish yoki ro'yxatdan o'tish") : step === 'pass' ? tr("Parol bilan kirish") : tr("Kodni kiriting")}</Text>
        <Text style={{ color: t.muted, lineHeight: 21 }}>
          {step === 'email'
            ? (via === 'phone' && smsOn ? tr("Telefon raqamingizni kiriting. Unga SMS orqali kirish kodi yuboramiz. Parol shart emas.") : tr("Gmail yoki iCloud pochtangizni kiriting. Unga kirish kodi yuboramiz. Parol shart emas."))
            : step === 'pass' ? tr("Faqat maxsus sinov hisobi uchun (App Store / Google Play tekshiruvi). Oddiy foydalanuvchilar pochtaga kelgan kod bilan kiradi.")
            : otpEmail.endsWith('@tel.mohirbozor.uz') ? tr("+998 {0} raqamiga SMS orqali kod yuborildi. Kodni pastga yozing.", digits)
            : tr("{0} manziliga \"Mohir bozor\" nomidan kod yuborildi. Kodni pastga yozing. Xat kelmasa, \"Spam\" papkasini tekshiring.", email.trim())}
        </Text>
        {step === 'pass' ? (
          <>
            <Field label={tr("Elektron pochta")} value={email} onChangeText={setEmail} placeholder={tr("ism@gmail.com")} keyboardType="email-address"
              autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" />
            <Field label={tr("Parol")} value={pass} onChangeText={setPass} placeholder="••••••••" secureTextEntry
              autoCapitalize="none" autoCorrect={false} textContentType="password" onSubmitEditing={passLogin} />
          </>
        ) : step === 'email' ? (
          <>
            {smsOn ? <Seg value={via} onChange={(v) => { setVia(v); setErr(''); }} options={[['phone', tr('Telefon')], ['email', tr('Pochta')]]} /> : null}
            {via === 'phone' && smsOn ? (
              <Field label={tr("Telefon raqam")} value={phone} onChangeText={(v) => setPhone(v.replace(/[^\d+ ]/g, '').slice(0, 17))} placeholder="+998 90 123 45 67"
                keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" onSubmitEditing={send} />
            ) : (
              <Field label={tr("Elektron pochta")} value={email} onChangeText={setEmail} placeholder={tr("ism@gmail.com")} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" onSubmitEditing={send} />
            )}
          </>
        ) : (
          <Field label={tr("Tasdiqlash kodi")} value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))} placeholder="123456"
            keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={8} onSubmitEditing={verify} />
        )}
        {err ? <Note kind="bad">{err}</Note> : null}
        <Btn title={step === 'email' ? tr("Kod yuborish") : step === 'pass' ? tr("Kirish") : tr("Kodni tasdiqlash")} onPress={step === 'email' ? send : step === 'pass' ? passLogin : verify} loading={busy} />
        {step === 'code' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn style={{ flex: 1 }} kind="ghost" small title={otpEmail.endsWith('@tel.mohirbozor.uz') ? tr("Raqamni o'zgartirish") : tr("Pochtani o'zgartirish")} onPress={() => { setStep('email'); setCode(''); setErr(''); }} />
            <Btn style={{ flex: 1 }} kind="ghost" small title={tr("Kodni qayta yuborish")} onPress={send} disabled={busy} />
          </View>
        ) : null}
        <Text onPress={() => { setStep(step === 'pass' ? 'email' : 'pass'); setErr(''); setPass(''); }}
          style={{ color: t.muted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
          {step === 'pass' ? tr("Pochta kodi bilan kirish") : tr("Sinov hisobi bilan kirish")}
        </Text>
        <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
          {tr("Davom etish orqali siz")}{' '}<Text style={{ color: t.accent }} onPress={() => router.push('/terms')}>{tr("foydalanish shartlari")}</Text>{' ' + tr('va') + ' '}<Text style={{ color: t.accent }} onPress={() => router.push('/privacy')}>{tr("maxfiylik siyosati")}</Text>{tr("ga rozilik bildirasiz.")}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
