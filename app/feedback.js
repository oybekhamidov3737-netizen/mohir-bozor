// Teskari aloqa: taklif yoki shikoyat ma'muriyatga chat orqali yetkaziladi
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp, useRequire } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { Btn, Field } from '../src/ui';
import { Stars } from '../src/lists';
import { tr } from '../src/i18n';

const KINDS = [['idea', 'Taklif', 'bulb'], ['bug', 'Xatolik', 'bug'], ['praise', 'Maqtov', 'heart'], ['other', 'Boshqa', 'chatbubble-ellipses']];

export default function Feedback() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { toast } = useApp();
  const [kind, setKind] = useState('idea');
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!need('/feedback')) return;
    if (text.trim().length < 5) { toast(tr('Fikringizni yozing')); return; }
    setBusy(true);
    const { data: tid, error } = await supabase.rpc('start_support_thread');
    if (error) { setBusy(false); toast(errText(error)); return; }
    const label = KINDS.find((k) => k[0] === kind)?.[1] || '';
    const body = `[Teskari aloqa · ${label}${stars ? ' · ' + '★'.repeat(stars) : ''}]\n${text.trim()}`;
    const { error: e2 } = await supabase.from('messages').insert({ thread_id: tid, body: body.slice(0, 2000) });
    setBusy(false);
    if (e2) { toast(errText(e2)); return; }
    toast(tr('Rahmat! Fikringiz yuborildi'));
    router.replace(`/chat/${tid}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr('Teskari aloqa') }} />
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>{tr('Ilovani birga yaxshilaymiz')}</Text>
      <Text style={{ color: t.muted, lineHeight: 20 }}>{tr("Nima yoqdi, nima yoqmadi, nimani qo'shishimiz kerak? Har bir fikrni o'qiymiz.")}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {KINDS.map(([k, l, ic]) => {
          const on = kind === k;
          return (
            <Pressable key={k} onPress={() => setKind(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 999, borderWidth: 1.5, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accentSoft : t.surface }}>
              <Ionicons name={ic} size={16} color={on ? t.accent : t.muted} />
              <Text style={{ color: on ? t.accent : t.ink, fontWeight: '700' }}>{tr(l)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 14, gap: 8, alignItems: 'center' }}>
        <Text style={{ color: t.ink, fontWeight: '700' }}>{tr('Ilovani baholang')}</Text>
        <Stars value={stars} size={34} onPick={setStars} />
      </View>
      <Field label={tr('Fikringiz')} value={text} onChangeText={setText} multiline maxLength={1500} placeholder={tr('Batafsil yozing…')} />
      <Btn title={tr('Yuborish')} icon="send" onPress={send} loading={busy} />
    </ScrollView>
  );
}
