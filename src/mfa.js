// Ikki bosqichli himoya (TOTP): pochta kodidan tashqari telefondagi 6 xonali kod.
// iPhone'da kodlar "Parollar" (Passwords) ilovasida saqlanadi — alohida ilova shart emas.
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { useApp } from './app-context';
import { supabase, errText } from './supabase';
import { copyText } from './copy';
import { Btn, Field, Note } from './ui';
import { tr } from './i18n';

// Kirgandan keyin kod so'ralishi kerakmi?
export function useMfaNeeded() {
  const { uid } = useApp();
  const [need, setNeed] = useState(false);
  const check = useCallback(async () => {
    if (!uid) { setNeed(false); return; }
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setNeed(data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2');
    } catch (e) { setNeed(false); }
  }, [uid]);
  useEffect(() => { check(); }, [check]);
  return [need, check];
}

const card = (t) => ({ backgroundColor: t.surface, borderRadius: 20, padding: 16, gap: 10, marginTop: 12 });

// Kod so'rash (kirishning 2-bosqichi)
export function MfaChallenge({ onDone }) {
  const t = useT();
  const { loadProfile, toast } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const verify = async () => {
    setBusy(true); setErr('');
    try {
      const { data: f } = await supabase.auth.mfa.listFactors();
      const factor = (f?.totp || [])[0];
      if (!factor) { setErr(tr("Himoya topilmadi")); setBusy(false); return; }
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.replace(/\D/g, '') });
      if (error) { setErr(tr("Kod noto'g'ri yoki eskirgan. Yangi kodni kiriting.")); setBusy(false); return; }
      await loadProfile();
      toast(tr("Tasdiqlandi"));
      onDone && onDone();
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };
  return (
    <View style={[card(t), { borderWidth: 2, borderColor: t.accent }]}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Ionicons name="shield-checkmark" size={22} color={t.accent} />
        <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink, flex: 1 }}>{tr("Ikki bosqichli tasdiq")}</Text>
      </View>
      <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Telefoningizdagi \"Parollar\" ilovasida Mohir bozor uchun 6 xonali kodni oching va shu yerga yozing.")}</Text>
      <Field value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad"
        autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} onSubmitEditing={verify} />
      {err ? <Note kind="bad">{err}</Note> : null}
      <Btn title={tr("Tasdiqlash")} onPress={verify} loading={busy} disabled={code.length < 6} />
    </View>
  );
}

// Himoyani yoqish (faqat admin uchun ko'rsatiladi)
export function MfaSetup() {
  const t = useT();
  const { toast, loadProfile } = useApp();
  const [state, setState] = useState(null); // null=yuklanmoqda, 'on', 'off', {id, secret, uri}
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setState((data?.totp || []).length ? 'on' : 'off');
    } catch (e) { setState('off'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async () => {
    setBusy(true); setErr('');
    try {
      const { data: all } = await supabase.auth.mfa.listFactors();
      for (const f of all?.all || []) { if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id }); }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Mohir bozor admin', issuer: 'Mohir bozor' });
      if (error) throw error;
      setState({ id: data.id, secret: data.totp.secret, uri: data.totp.uri });
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };
  const confirm = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: state.id, code: code.replace(/\D/g, '') });
    setBusy(false);
    if (error) { setErr(tr("Kod noto'g'ri. Parollar ilovasidagi yangi kodni yozing.")); return; }
    toast(tr("Ikki bosqichli himoya yoqildi"));
    setCode(''); await loadProfile(); load();
  };

  if (state === null) return null;
  if (state === 'on') {
    return (
      <View style={[card(t), { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <Ionicons name="shield-checkmark" size={24} color={t.price} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontWeight: '800' }}>{tr("Ikki bosqichli himoya yoqilgan")}</Text>
          <Text style={{ color: t.muted, fontSize: 12.5 }}>{tr("Admin panelga faqat telefoningizdagi kod bilan kiriladi.")}</Text>
        </View>
      </View>
    );
  }
  if (state === 'off') {
    return (
      <View style={[card(t), { borderWidth: 1.5, borderColor: t.gold }]}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="warning" size={22} color={t.gold} />
          <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink, flex: 1 }}>{tr("Admin hisobini himoyalang")}</Text>
        </View>
        <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Hozir admin panelga faqat pochta kodi bilan kiriladi. Ikki bosqichli himoyani yoqing: kimdir pochtangizga kirib olsa ham, telefoningizdagi koddan boshqa yo'l bilan to'lovlar va pullarni boshqara olmaydi.")}</Text>
        {err ? <Note kind="bad">{err}</Note> : null}
        <Btn title={tr("Himoyani yoqish")} icon="shield-checkmark-outline" onPress={start} loading={busy} />
      </View>
    );
  }
  return (
    <View style={[card(t), { borderWidth: 1.5, borderColor: t.accent }]}>
      <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink }}>{tr("Himoyani sozlash")}</Text>
      <Text style={{ color: t.ink, lineHeight: 21 }}>{tr("1. Pastdagi tugmani bosing — iPhone \"Parollar\" ilovasi ochilib, kod qo'shishni taklif qiladi. \"Saqlash\"ni bosing.")}</Text>
      <Btn kind="sec" icon="key-outline" title={tr("Parollar ilovasiga qo'shish")} onPress={() => Linking.openURL(state.uri).catch(() => toast(tr("Ochilmadi — pastdagi kalitni qo'lda kiriting")))} />
      <Text style={{ color: t.muted, fontSize: 12.5, lineHeight: 18 }}>{tr("Agar ochilmasa: Parollar → Mohir bozor (yoki yangi yozuv) → \"Tasdiqlash kodini sozlash\" → \"Sozlash kalitini kiritish\" va shu kalitni joylang:")}</Text>
      <Btn kind="ghost" small icon="copy-outline" title={state.secret} onPress={() => { copyText(state.secret); toast(tr("Kalit nusxalandi")); }} />
      <Text style={{ color: t.ink, lineHeight: 21 }}>{tr("2. Parollar ilovasida chiqqan 6 xonali kodni yozing:")}</Text>
      <Field value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad"
        autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} onSubmitEditing={confirm} />
      {err ? <Note kind="bad">{err}</Note> : null}
      <Btn title={tr("Tasdiqlash va yoqish")} onPress={confirm} loading={busy} disabled={code.length < 6} />
    </View>
  );
}
