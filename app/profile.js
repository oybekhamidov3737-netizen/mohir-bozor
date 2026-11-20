import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, publicUrl, errText } from '../src/supabase';
import { CATS, ONLINE, catOf } from '../src/data';
import { shortReg } from '../src/format';
import { pickImages, uploadImage, newName } from '../src/images';
import { RegionPicker, ListPicker } from '../src/pickers';
import { Avatar, Btn, Field, Loading, Note, Select } from '../src/ui';
import { PAYMENTS_IN_APP } from '../src/pay';
import { getStoredRef, clearStoredRef, cleanRef } from '../src/referral';
import { fmtNum } from '../src/format';
import { tr } from '../src/i18n';

// Kabinet ochish va profilni tahrirlash
export default function ProfileScreen() {
  const t = useT();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { uid, profile, loadProfile, toast } = useApp();
  const [f, setF] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(null);
  const [ref, setRef] = useState('');
  useEffect(() => { getStoredRef().then((c) => c && setRef(c)); }, []);
  const isNew = !profile;

  useEffect(() => {
    if (!uid) { router.replace('/login'); return; }
    if (profile === undefined) return;
    setF({ name: profile?.name || '', phone: profile?.phone || '', cat: profile?.cat || '', region: profile?.region || '', district: profile?.district || '', bio: profile?.bio || '' });
  }, [uid, profile]);

  if (!f) return <View style={{ flex: 1, backgroundColor: t.bg }}><Loading /></View>;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const pickAvatar = async () => {
    try { const [img] = await pickImages({ max: 1, width: 400 }); if (img) setAvatar(img); } catch (e) { toast(e.message); }
  };

  const save = async () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Ismingizni kiriting.';
    if (f.phone.replace(/\D/g, '').length < 9) e.phone = "Telefon raqamini to'liq kiriting.";
    if (!f.region) e.region = 'Hududni tanlang.';
    if (/(t\.me\/|@[A-Za-z][A-Za-z0-9_]{3,}|instagram\.com|telegram|whatsapp)/i.test(f.bio)) e.bio = "Bu yerga tashqi kontakt yozib bo'lmaydi.";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      let avatar_url = profile?.avatar_url || '';
      if (avatar) avatar_url = await uploadImage('avatars', `${uid}/${newName()}`, avatar);
      const row = { id: uid, name: f.name.trim(), cat: f.cat, region: f.region, district: f.district || '', bio: f.bio.trim(), avatar_url, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('profiles').upsert(row);
      if (error) throw error;
      const { error: e2 } = await supabase.from('profile_private').upsert({ id: uid, phone: f.phone.trim() });
      if (e2) throw e2;
      let bonusMsg = '';
      if (isNew && cleanRef(ref).length >= 4) {
        const { data: rd, error: rErr } = await supabase.rpc('claim_referral', { p_code: cleanRef(ref) });
        if (!rErr && rd?.bonus) bonusMsg = tr(" +{0} so'm bonus!", fmtNum(rd.bonus));
        else if (rErr) toast(errText(rErr));
        clearStoredRef();
      }
      await loadProfile();
      toast(isNew ? tr("Kabinet ochildi 🎉") + bonusMsg : tr("Profil saqlandi"));
      if (next) router.replace(next); else router.back();
    } catch (err) { toast(errText(err)); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isNew ? tr("Kabinet ochish") : tr("Profilni tahrirlash") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 30, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        {isNew ? (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 24, color: t.ink }}>{tr("Kabinetingizni oching")}</Text>
            <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Bir daqiqada profil yarating: rasmli e'lonlar joylaysiz, mijozlar bilan ilova ichida yozishasiz.")}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {avatar ? <Image source={{ uri: avatar.uri }} style={{ width: 72, height: 72, borderRadius: 20 }} /> : <Avatar profile={profile} name={f.name} size={72} />}
          <Btn kind="sec" small icon="camera-outline" title={tr("Rasm tanlash")} onPress={pickAvatar} />
        </View>
        <Field label={tr("Ism yoki studiya nomi")} value={f.name} onChangeText={set('name')} maxLength={60} placeholder={tr("Masalan: Xamidov SMM")} error={errs.name} />
        <Field label={tr("Telefon raqami")} value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={20} placeholder="+998 90 123 45 67" error={errs.phone} hint={tr("Faqat sizga ko'rinadi. E'lon joylashda avtomatik to'ldiriladi.")} />
        <Select label={tr("Asosiy yo'nalishingiz")} value={f.cat ? catOf(f.cat).n : tr('Men xizmat buyurtma qilaman')} onPress={() => setPicker('cat')} />
        <Select label={tr("Hudud")} value={f.region ? (f.region === ONLINE ? tr('Onlayn (masofadan)') : (f.district ? f.district + ', ' : '') + shortReg(f.region)) : ''} placeholder={tr("Viloyat va tuman")} onPress={() => setPicker('region')} error={errs.region} />
        <Field label={tr("O'zingiz haqingizda")} value={f.bio} onChangeText={set('bio')} multiline maxLength={300} placeholder={tr("Tajribangiz, qanday loyihalar qilgansiz…")} error={errs.bio} />
        {isNew && PAYMENTS_IN_APP ? <Field label={tr("Taklif kodi (ixtiyoriy)")} value={ref} onChangeText={(v) => setRef(cleanRef(v))} autoCapitalize="characters" placeholder={tr("Masalan: K7M2QX")} hint={tr("Do'stingiz bergan kod bo'lsa, bonus olasiz.")} /> : null}
        <Btn title={isNew ? tr("Kabinetni ochish") : tr("Saqlash")} onPress={save} loading={busy} />
      </ScrollView>
      <ListPicker visible={picker === 'cat'} onClose={() => setPicker(null)} title={tr("Yo'nalish")} value={f.cat} onPick={set('cat')} items={[['', tr("Men xizmat buyurtma qilaman")], ...CATS.map((c) => [c.id, c.n])]} />
      <RegionPicker visible={picker === 'region'} onClose={() => setPicker(null)} current={f} onPick={(r, d) => { setF((x) => ({ ...x, region: r, district: d })); setPicker(null); }} />
    </KeyboardAvoidingView>
  );
}
