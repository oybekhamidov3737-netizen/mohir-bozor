import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useT, FONT } from '../src/theme';
import { useApp, useRequire } from '../src/app-context';
import { supabase, errText } from '../src/supabase';
import { Btn, H } from '../src/ui';

const FAQ = [
  ["Qanday e'lon joylayman?", "Pastdagi \"Joylash\" tugmasini bosing. Avval kabinet ochasiz, keyin rasmlar, narx va tavsifni kiritasiz. E'lon darhol ko'rinadi."],
  ["E'lonim nega qabul qilinmadi?", "Bozor faqat SMM, montaj, dizayn, marketing va boshqa ijodiy xizmatlar uchun. Telegram, Instagram yoki WhatsApp manzillarini yozib bo'lmaydi: mijozlar ilova ichidagi chat orqali yozadi."],
  ["TOP va VIP nima?", "TOP e'lonni qidiruvning tepasiga chiqaradi. VIP bundan tashqari bosh sahifadagi alohida oltin blokda ko'rsatadi. E'loningizda \"Reklama\" tugmasini bosing."],
  ["To'lov qildim, xizmat yoqilmadi", "Kartaga o'tkazma bilan to'lasangiz, bozor egasi tekshirib tasdiqlaydi (odatda bir necha soat ichida). Payme yoki Click orqali to'lov darhol yoqiladi. Kechiksa, quyidagi chat orqali yozing."],
  ["Firibgarga duch keldim", "E'lon sahifasidagi \"Shikoyat qilish\" tugmasini bosing va bizga yozing. Oldindan to'liq pul o'tkazmang, ishni bosqichma-bosqich to'lang."],
  ["Hisobimni qanday o'chiraman?", "Kabinet → Hisob → \"Hisobni o'chirish\". Profil, e'lonlar va yozishmalar o'chiriladi."],
];

export default function Support() {
  const t = useT();
  const router = useRouter();
  const need = useRequire();
  const { config, isAdmin, toast } = useApp();
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const phone = config.support_phone || '+998 91 001 88 18';
  const tel = 'tel:' + phone.replace(/[^\d+]/g, '');

  const chat = async () => {
    if (isAdmin) { router.push('/chats'); return; }
    if (!need('/support')) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('start_support_thread');
    setBusy(false);
    if (error) { toast(errText(error)); return; }
    router.push(`/chat/${data}`);
  };
  const call = () => Linking.openURL(tel).catch(async () => {
    try { await Clipboard.setStringAsync(phone); toast('Raqam nusxalandi'); } catch (e) {}
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
      <View style={{ backgroundColor: t.accent, borderRadius: 20, padding: 20, gap: 8 }}>
        <Ionicons name="headset-outline" size={34} color={t.accentInk} />
        <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.accentInk }}>Sizga qanday yordam beraylik?</Text>
        <Text style={{ color: t.accentInk, opacity: 0.85, lineHeight: 20 }}>Har kuni 9:00 dan 21:00 gacha javob beramiz.</Text>
      </View>

      <Pressable onPress={call} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 16, padding: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="call" size={22} color={t.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.muted, fontSize: 12 }}>Qo'ng'iroq qilish</Text>
          <Text selectable style={{ color: t.ink, fontSize: 18, fontWeight: '800' }}>{phone}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.muted} />
      </Pressable>

      <Btn title="Ilovada yozish" icon="chatbubble-ellipses-outline" onPress={chat} loading={busy} />

      <H>Ko'p beriladigan savollar</H>
      {FAQ.map(([q, a], i) => (
        <Pressable key={q} onPress={() => setOpen(open === i ? null : i)} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={{ flex: 1, color: t.ink, fontWeight: '700', fontSize: 15 }}>{q}</Text>
            <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={t.muted} />
          </View>
          {open === i ? <Text style={{ color: t.muted, lineHeight: 21 }}>{a}</Text> : null}
        </Pressable>
      ))}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Btn style={{ flex: 1 }} small kind="sec" title="Foydalanish shartlari" onPress={() => router.push('/terms')} />
        <Btn style={{ flex: 1 }} small kind="sec" title="Maxfiylik siyosati" onPress={() => router.push('/privacy')} />
      </View>
    </ScrollView>
  );
}
