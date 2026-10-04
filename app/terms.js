import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useT, FONT } from '../src/theme';
import { tr } from '../src/i18n';

// Til almashganda qayta hisoblanishi uchun funksiya
const S = () => [
  ['Umumiy', tr("Mohir bozor — SMM mutaxassislari, montajchilar, dizaynerlar, marketologlar va boshqa ijodkorlar o'z xizmatlarini taklif qiladigan va mijozlar ularni topadigan e'lonlar platformasi. Ilovadan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.")],
  [tr("Ruxsat etilgan e'lonlar"), tr("Faqat ijodiy, raqamli va marketing xizmatlari: SMM, video montaj, mobilografiya, target reklama, grafik va motion dizayn, kopirayting, fotografiya, marketing, veb-sayt, ovoz va dublyaj, bloger reklamasi. Tovar, ko'chmas mulk, kredit, qimor, 18+ va noqonuniy xizmatlar taqiqlanadi.")],
  [tr("Taqiqlangan harakatlar"), tr("Tashqi kontaktlarni (Telegram, Instagram, WhatsApp) e'longa yozish, boshqalarning ishini o'zinikidek ko'rsatish, yolg'on narx yoki ma'lumot, haqoratli matn, spam va firibgarlik. Qoidabuzar e'lonlar ogohlantirishsiz olib tashlanadi, takrorlansa hisob bloklanadi.")],
  ['Mas\'uliyat', tr("Mohir bozor ijrochi va mijozni bog'laydi, lekin ular o'rtasidagi kelishuv tomoni emas. Xizmat sifati, muddati va to'lovi bo'yicha kelishuvga tomonlarning o'zi javob beradi. Ehtiyot uchun ishni bosqichma-bosqich to'lang va oldindan to'liq pul o'tkazmang.")],
  [tr("Pullik xizmatlar"), tr("TOP, VIP, ko'tarish, uzaytirish, tiklash va qo'shimcha e'lon joylari raqamli xizmat hisoblanadi va to'lov tasdiqlangandan keyin darhol yoqiladi. Xizmat yoqilgandan keyin pul qaytarilmaydi, bundan texnik xato holatlari mustasno: bunday holatda qo'llab-quvvatlashga murojaat qiling.")],
  ['Moderatsiya', tr("E'lonlar avtomatik va qo'lda tekshiriladi. Firibgarlik va shikoyatlarni tekshirish maqsadida ma'muriyat yozishmalarni ko'rishi mumkin.")],
  ["O'zgarishlar", tr("Shartlar yangilanishi mumkin. Muhim o'zgarishlar haqida ilovada xabar beriladi.")],
];

export default function Terms() {
  const t = useT();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 10, maxWidth: 680, width: '100%', alignSelf: 'center', paddingBottom: 40 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>{tr("Foydalanish shartlari")}</Text>
      <Text style={{ color: t.muted }}>{tr("Oxirgi yangilanish: 2026-yil 2-oktabr")}</Text>
      {S().map(([h, b]) => (
        <React.Fragment key={h}>
          <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink, marginTop: 10 }}>{tr(h)}</Text>
          <Text style={{ color: t.ink, lineHeight: 22, fontSize: 15 }}>{b}</Text>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}
