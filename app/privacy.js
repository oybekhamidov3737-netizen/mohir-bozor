import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useT, FONT } from '../src/theme';

const S = [
  ['Qanday ma\'lumot yig\'amiz', "Elektron pochta manzilingiz (kirish uchun), profil ma'lumotlaringiz (ism, rasm, hudud, yo'nalish, o'zingiz haqingizda), telefon raqamingiz, joylagan e'lonlaringiz va rasmlari, ilova ichidagi yozishmalar hamda to'lov so'rovlaringiz (to'lovchi ismi va chek rasmi)."],
  ['Nima uchun ishlatamiz', "Hisobingizni yaratish va himoya qilish, e'lonlaringizni boshqa foydalanuvchilarga ko'rsatish, xaridor va sotuvchini bog'lash, pullik xizmatlarni faollashtirish hamda firibgarlik va qoidabuzarliklarga qarshi kurashish uchun."],
  ["Kim ko'radi", "E'lonlaringiz va profilingiz (ism, rasm, hudud, o'zingiz haqingizda) hammaga ochiq. Telefon raqamingiz faqat e'longa o'zingiz yozgan bo'lsangiz ko'rinadi. Yozishmalarni faqat suhbat ishtirokchilari ko'radi; shikoyat yoki firibgarlikni tekshirish uchun bozor ma'muriyati ham ko'rishi mumkin. To'lov cheklari faqat sizga va ma'muriyatga ko'rinadi."],
  ['Saqlash', "Ma'lumotlar Supabase bulut xizmatida shifrlangan aloqa orqali saqlanadi. Biz ma'lumotlaringizni sotmaymiz va reklama kompaniyalariga bermaymiz."],
  ["Hisobni o'chirish", "Kabinet → Hisob → \"Hisobni o'chirish\" tugmasi orqali hisobingizni va unga bog'liq barcha ma'lumotlarni (profil, e'lonlar, yozishmalar) istalgan vaqtda o'chirishingiz mumkin."],
  ['Aloqa', "Savollar bo'lsa, ilova ichidagi chat orqali bozor ma'muriyatiga murojaat qiling."],
];

export default function Privacy() {
  const t = useT();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 10, maxWidth: 680, width: '100%', alignSelf: 'center', paddingBottom: 40 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>Mohir bozor maxfiylik siyosati</Text>
      <Text style={{ color: t.muted }}>Oxirgi yangilanish: 2026-yil 1-oktabr</Text>
      {S.map(([h, b]) => (
        <React.Fragment key={h}>
          <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink, marginTop: 10 }}>{h}</Text>
          <Text style={{ color: t.ink, lineHeight: 22, fontSize: 15 }}>{b}</Text>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}
