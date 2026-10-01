import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { ALLOWED_EMAIL } from '../src/config';
import { Btn, Field, Note } from '../src/ui';

export default function Login() {
  const t = useT();
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { loadProfile, toast } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!ALLOWED_EMAIL.test(e)) { setErr('Faqat Gmail (@gmail.com) yoki iCloud (@icloud.com) pochtasini kiriting.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) { setErr(errText(error)); return; }
    setStep('code');
    toast('Kod pochtangizga yuborildi');
  };

  const verify = async () => {
    const c = code.replace(/\D/g, '');
    if (c.length < 6) { setErr('Pochtangizga kelgan 6 xonali kodni kiriting.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: c, type: 'email' });
    if (error) { setBusy(false); setErr(errText(error)); return; }
    const prof = await loadProfile();
    setBusy(false);
    toast('Xush kelibsiz!');
    if (!prof) router.replace({ pathname: '/profile', params: { next: next || '' } });
    else if (next) router.replace(next);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <Ionicons name={step === 'email' ? 'mail-outline' : 'key-outline'} size={30} color={t.accent} />
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{step === 'email' ? 'Kirish yoki ro\'yxatdan o\'tish' : 'Kodni kiriting'}</Text>
        <Text style={{ color: t.muted, lineHeight: 21 }}>
          {step === 'email'
            ? "Gmail yoki iCloud pochtangizni kiriting. Unga 6 xonali tasdiqlash kodi yuboramiz. Parol shart emas."
            : `${email.trim()} manziliga kod yuborildi. Kelmasa, "Spam" papkasini tekshiring.`}
        </Text>
        {step === 'email' ? (
          <Field label="Elektron pochta" value={email} onChangeText={setEmail} placeholder="ism@gmail.com" keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" onSubmitEditing={send} />
        ) : (
          <Field label="Tasdiqlash kodi" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
            keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} onSubmitEditing={verify} />
        )}
        {err ? <Note kind="bad">{err}</Note> : null}
        <Btn title={step === 'email' ? 'Kod yuborish' : 'Tasdiqlash'} onPress={step === 'email' ? send : verify} loading={busy} />
        {step === 'code' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn style={{ flex: 1 }} kind="ghost" small title="Pochtani o'zgartirish" onPress={() => { setStep('email'); setCode(''); setErr(''); }} />
            <Btn style={{ flex: 1 }} kind="ghost" small title="Kodni qayta yuborish" onPress={send} disabled={busy} />
          </View>
        ) : null}
        <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }} onPress={() => router.push('/privacy')}>
          Davom etish orqali siz maxfiylik siyosatiga rozilik bildirasiz. <Text style={{ color: t.accent }}>Maxfiylik siyosati</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
