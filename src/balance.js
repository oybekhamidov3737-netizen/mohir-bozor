import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from './theme';
import { useApp } from './app-context';
import { supabase } from './supabase';
import { ago, fmtNum } from './format';
import { SVC } from './data';

const KIND = { invitee: "Taklif orqali ro'yxatdan o'tish", inviter: "Do'stingiz faol bo'ldi", spend: 'Xizmat uchun sarflandi', admin: "Ma'muriyat tomonidan" };

// Kabinet tepasidagi balans kartasi (har doim ko'rinadi)
export function BalanceCard() {
  const t = useT();
  const { uid } = useApp();
  const [bal, setBal] = useState(null);
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const [w, l] = await Promise.all([
      supabase.from('wallets').select('bonus').eq('user_id', uid).maybeSingle(),
      supabase.from('bonus_log').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
    ]);
    setBal(w.error ? 0 : w.data?.bonus || 0);
    setLog(l.data || []);
  }, [uid]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ marginTop: 12, backgroundColor: t.accent, borderRadius: 18, padding: 16, gap: 10, overflow: 'hidden' }}>
      <Ionicons name="wallet" size={96} color={t.accentInk} style={{ position: 'absolute', right: -10, top: -14, opacity: 0.12 }} />
      <Text style={{ color: t.accentInk, opacity: 0.85, fontSize: 13, fontWeight: '700' }}>BONUS BALANS</Text>
      <Text style={{ color: t.accentInk, fontFamily: FONT.display, fontSize: 30 }}>{bal === null ? '…' : fmtNum(bal)} <Text style={{ fontSize: 16 }}>so'm</Text></Text>
      <Text style={{ color: t.accentInk, opacity: 0.85, fontSize: 12, lineHeight: 17 }}>E'loningizdagi "Reklama" tugmasi orqali TOP, VIP va boshqa xizmatlarga sarflanadi. Do'stlaringizni taklif qilib to'ldiring.</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => setOpen(!open)} style={{ borderWidth: 1, borderColor: t.accentInk, borderRadius: 10, paddingHorizontal: 12, height: 36, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: t.accentInk, fontWeight: '700', fontSize: 13 }}>Tarix</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={t.accentInk} />
        </Pressable>
      </View>
      {open ? (
        <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 10, gap: 8 }}>
          {log.length ? log.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{x.kind === 'spend' ? (SVC[x.note] || 'Xizmat') : KIND[x.kind] || x.kind}</Text>
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
