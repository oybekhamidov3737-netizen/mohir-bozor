// Sozlamalar: til, ko'rinish, xavfsizlik, chiqish va hisobni o'chirish
import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { AppearanceCard } from '../src/appearance';
import { MfaSetup } from '../src/mfa';
import { H, MenuGroup } from '../src/ui';
import { tr } from '../src/i18n';

// Yangi xabar va e'lon muddati haqida pochta / Telegram orqali xabar berish
function NotifyToggle() {
  const t = useT();
  const { uid, toast } = useApp();
  const [on, setOn] = useState(null);
  useEffect(() => {
    if (!uid) return;
    supabase.from('profile_private').select('notify').eq('id', uid).maybeSingle()
      .then(({ data, error }) => setOn(error ? true : data ? data.notify !== false : true));
  }, [uid]);
  const flip = async (v) => {
    setOn(v);
    const { error } = await supabase.from('profile_private').upsert({ id: uid, notify: v });
    if (error) { setOn(!v); toast(errText(error)); return; }
    toast(v ? tr("Bildirishnomalar yoqildi") : tr("Bildirishnomalar o'chirildi"));
  };
  return (
    <View style={{ backgroundColor: t.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#F0532E', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="notifications" size={19} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.ink, fontWeight: '700', fontSize: 15 }}>{tr("Bildirishnomalar")}</Text>
        <Text style={{ color: t.muted, fontSize: 12, marginTop: 1, lineHeight: 16 }}>{tr("Yangi xabar kelganda va e'lon muddati tugayotganda pochta yoki Telegram orqali xabar beramiz")}</Text>
      </View>
      <Switch value={!!on} disabled={on === null} onValueChange={flip} trackColor={{ true: t.accent, false: t.line }} thumbColor="#fff"
        accessibilityLabel={tr("Bildirishnomalar")} />
    </View>
  );
}

export default function Settings() {
  const t = useT();
  const router = useRouter();
  const { session, isAdmin, signOut, toast } = useApp();
  const [sure, setSure] = useState(false);
  const deleteAccount = async () => {
    if (!sure) { setSure(true); setTimeout(() => setSure(false), 4000); return; }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { toast(errText(error)); return; }
    await signOut(); toast(tr("Hisobingiz o'chirildi")); router.replace('/');
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Stack.Screen options={{ title: tr('Sozlamalar') }} />
      <H style={{ paddingTop: 4 }}>{tr("Til va ko'rinish")}</H>
      <AppearanceCard />
      {session ? (
        <>
          <H>{tr('Hisob')}</H>
          <MenuGroup items={[
            { icon: 'person', title: tr('Profilni tahrirlash'), sub: /@tel\.mohirbozor\.uz$/.test(session.user.email || '') ? (session.user.user_metadata?.phone || '') : session.user.email, color: '#2747D6', onPress: () => router.push('/profile') },
            { icon: 'briefcase', title: tr('Istagan ishim'), color: '#0C9A6A', onPress: () => router.push('/prefs') },
          ]} />
          <NotifyToggle />
          {isAdmin ? <MfaSetup /> : null}
          <View style={{ height: 10 }} />
          <MenuGroup items={[
            { icon: 'log-out', title: tr('Chiqish'), color: '#5C6862', onPress: async () => { await signOut(); router.replace('/'); } },
            { icon: 'trash', title: sure ? tr("Ha, hisobim va e'lonlarim o'chirilsin") : tr("Hisobni o'chirish"), sub: tr("Profil, e'lonlar va yozishmalar butunlay o'chadi"), color: '#E5484D', danger: true, onPress: deleteAccount },
          ]} />
        </>
      ) : null}
    </ScrollView>
  );
}
