// Sozlamalar: til, ko'rinish, xavfsizlik, chiqish va hisobni o'chirish
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useT } from '../src/theme';
import { useApp } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { AppearanceCard } from '../src/appearance';
import { MfaSetup } from '../src/mfa';
import { H, MenuGroup } from '../src/ui';
import { tr } from '../src/i18n';

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
            { icon: 'person', title: tr('Profilni tahrirlash'), sub: session.user.email, color: '#2747D6', onPress: () => router.push('/profile') },
            { icon: 'briefcase', title: tr('Istagan ishim'), color: '#0C9A6A', onPress: () => router.push('/prefs') },
          ]} />
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
