// Istagan ishim: qaysi yo'nalish va hududdagi buyurtmalar ko'rsatilsin
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { CATS, REG_NAMES } from '../src/data';
import { shortReg } from '../src/format';
import { Btn, H } from '../src/ui';
import { tr } from '../src/i18n';

export default function Prefs() {
  const t = useT();
  const router = useRouter();
  const { uid, profile, loadProfile, toast } = useApp();
  const [cats, setCats] = useState(profile?.pref_cats?.length ? profile.pref_cats : profile?.cat ? [profile.cat] : []);
  const [regs, setRegs] = useState(profile?.pref_regions || []);
  const [busy, setBusy] = useState(false);
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const chip = (on, label, onPress, icon) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 999, borderWidth: 1.5, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accentSoft : t.surface }}>
      {icon ? <Ionicons name={icon} size={15} color={on ? t.accent : t.muted} /> : null}
      <Text style={{ color: on ? t.accent : t.ink, fontWeight: '700', fontSize: 13 }}>{label}</Text>
      {on ? <Ionicons name="checkmark" size={15} color={t.accent} /> : null}
    </Pressable>
  );

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ pref_cats: cats, pref_regions: regs }).eq('id', uid);
    setBusy(false);
    if (error) { toast(errText(error)); return; }
    await loadProfile();
    toast(tr('Saqlandi'));
    router.replace('/jobs');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Stack.Screen options={{ title: tr('Istagan ishim') }} />
      <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Qaysi yo'nalishda va qayerda ishlashni xohlaysiz? Shunga mos buyurtmalar «Siz uchun buyurtmalar» bo'limida chiqadi.")}</Text>
      <H right={cats.length ? tr('{0} ta tanlandi', cats.length) : tr('hammasi')}>{tr("Yo'nalishlar")}</H>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATS.map((c) => chip(cats.includes(c.id), c.n, () => toggle(cats, setCats, c.id), c.icon))}
      </View>
      <H right={regs.length ? tr('{0} ta tanlandi', regs.length) : tr("butun O'zbekiston")}>{tr('Hududlar')}</H>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {REG_NAMES.map((r) => chip(regs.includes(r), shortReg(r), () => toggle(regs, setRegs, r)))}
      </View>
      <Text style={{ color: t.muted, fontSize: 12, marginTop: 10 }}>{tr("Hech narsa tanlanmasa — hammasi ko'rsatiladi. Onlayn buyurtmalar har doim chiqadi.")}</Text>
      <Btn style={{ marginTop: 16 }} title={tr('Saqlash')} onPress={save} loading={busy} />
    </ScrollView>
  );
}
