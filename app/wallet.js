// Hisob: umumiy balans, to'ldirish, harakatlar tarixi va do'st taklif qilish
import React from 'react';
import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useT } from '../src/theme';
import { BalanceCard } from '../src/balance';
import { InviteCard } from '../src/invite';
import { PAYMENTS_IN_APP } from '../src/pay';
import { Empty } from '../src/ui';
import { tr } from '../src/i18n';

export default function Wallet() {
  const t = useT();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Stack.Screen options={{ title: tr('Hisob') }} />
      {PAYMENTS_IN_APP ? (<><BalanceCard /><InviteCard /></>) : <Empty title={tr('Bu bo\'lim ilovada mavjud emas.')} />}
    </ScrollView>
  );
}
