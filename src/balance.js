import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { useApp } from './app-context';
import { supabase } from './supabase';
import { ago, fmtNum } from './format';
import { SVC } from './data';

const KIND = { invitee: "Taklif bonusi", inviter: "Do'stingiz faol bo'ldi", spend: 'Xizmat uchun', admin: "Ma'muriyat tomonidan", topup: "Hisob to'ldirildi" };

// Kabinet tepasidagi balans kartasi (har doim ko'rinadi)
export function BalanceCard() {
  const t = useT();
  const router = useRouter();
  const { uid } = useApp();
  const [bal, setBal] = useState(null);
  const [main, setMain] = useState(0);
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const [w, l] = await Promise.all([
      supabase.from('wallets').select('bonus, balance').eq('user_id', uid).maybeSingle(),
      supabase.from('bonus_log').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
    ]);
    setBal(w.error ? 0 : w.data?.bonus || 0);
    setMain(w.error ? 0 : w.data?.balance || 0);
    setLog(l.data || []);
  }, [uid]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ marginTop: 12, backgroundColor: t.accent, borderRadius: 18, padding: 16, gap: 10, overflow: 'hidden' }}>
      <Ionicons name="wallet" size={96} color={t.accentInk} style={{ position: 'absolute', right: -10, top: -14, opacity: 0.12 }} />
      <Text style={{ color: t.accentInk, opacity: 0.85, fontSize: 13, fontWeight: '700' }}>UMUMIY BALANS</Text>
      <Text style={{ color: t.accentInk, fontFamily: FONT.display, fontSize: 32 }}>{bal === null ? '…' : fmtNum(main + bal)} <Text style={{ fontSize: 16 }}>so'm</Text></Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: 10 }}>
          <Text style={{ color: t.accentInk, opacity: 0.8, fontSize: 11, fontWeight: '700' }}>ASOSIY HISOB</Text>
          <Text style={{ color: t.accentInk, fontSize: 17, fontWeight: '800' }}>{fmtNum(main)} so'm</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: 10 }}>
          <Text style={{ color: t.accentInk, opacity: 0.8, fontSize: 11, fontWeight: '700' }}>BONUS</Text>
          <Text style={{ color: t.accentInk, fontSize: 17, fontWeight: '800' }}>{fmtNum(bal || 0)} so'm</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push('/topup')} accessibilityRole="button"
        style={{ backgroundColor: t.accentInk, borderRadius: 12, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Ionicons name="add-circle" size={20} color={t.accent} />
        <Text style={{ color: t.accent, fontWeight: '800', fontSize: 15 }}>Hisobni to'ldirish</Text>
      </Pressable>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 2 }}>
        <Text style={{ color: t.accentInk, fontWeight: '700', fontSize: 13 }}>Harakatlar tarixi</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={t.accentInk} />
      </Pressable>
      {open ? (
        <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 10, gap: 8 }}>
          {log.length ? log.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{x.kind === 'spend' ? (SVC[x.note] || 'Xizmat') : KIND[x.kind] || x.kind}{x.wallet === 'bonus' ? ' · bonus' : ''}</Text>
                <Text style={{ color: t.muted, fontSize: 11 }}>{ago(x.created_at)}</Text>
              </View>
              <Text style={{ fontWeight: '800', color: x.amount < 0 ? t.danger : t.price }}>{x.amount > 0 ? '+' : ''}{fmtNum(x.amount)}</Text>
            </View>
          )) : <Text style={{ color: t.muted, fontSize: 13 }}>Hozircha harakat yo'q.</Text>}
        </View>
      ) : null}
    </View>
  );
}
