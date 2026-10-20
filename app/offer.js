// Ommaviy oferta (Payme va Click talab qiladi). Oddiy hujjat ko'rinishida: sotuvchi ma'lumotlari
// matn ichida, ajratib ko'rsatilmaydi (qonun talab qiladigan minimum: nomi, STIR, hudud, aloqa).
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { SVC } from '../src/data';
import { fmtNum } from '../src/format';
import { WEB_URL } from '../src/config';
import { tr } from '../src/i18n';

export default function Offer() {
  const t = useT();
  const { config } = useApp();
  const c = config || {};
  const site = WEB_URL.replace('https://', '');
  const phone = c.support_phone || '+998 91 001 88 18';
  const seller = c.legal_name || '';
  const priced = ['top', 'vip', 'bump', 'extend', 'restore', 'slots'];
  const prices = priced.map((k) => `${SVC[k]} — ${fmtNum(c.prices?.[k])} ${tr("so'm")}`).join('; ');

  const H = ({ children }) => <Text style={{ fontFamily: FONT.displayM, fontSize: 14.5, color: t.ink, marginTop: 14 }}>{children}</Text>;
  const P = ({ children }) => <Text style={{ color: t.muted, lineHeight: 20, fontSize: 13.5 }}>{children}</Text>;

  const S = [
    [tr('1. Umumiy qoidalar'), [
      `1.1. Ushbu hujjat «Mohir bozor» onlayn platformasi (${site}, keyingi o'rinlarda — «Platforma») egasi tomonidan (keyingi o'rinlarda — «Ijrochi») Platformadagi pullik raqamli xizmatlarni ko'rsatish bo'yicha ommaviy taklif (oferta) hisoblanadi.`,
      "1.2. O'zbekiston Respublikasi Fuqarolik kodeksiga muvofiq, Foydalanuvchi pullik xizmat uchun to'lovni amalga oshirishi ushbu oferta shartlarini to'liq va so'zsiz qabul qilganini (aksept) bildiradi.",
      "1.3. Ijrochi oferta shartlarini Platformada yangi tahririni e'lon qilish orqali o'zgartirishi mumkin. Yangi tahrir e'lon qilingan kundan kuchga kiradi va undan keyin qilingan to'lovlarga qo'llaniladi.",
    ]],
    [tr('2. Atamalar'), [
      "2.1. Foydalanuvchi — Platformada ro'yxatdan o'tgan va uning xizmatlaridan foydalanadigan jismoniy yoki yuridik shaxs.",
      "2.2. E'lon — Foydalanuvchi tomonidan Platformada joylashtirilgan xizmat taklifi yoki buyurtma haqidagi ma'lumot.",
      "2.3. Pullik xizmat — e'lonni ko'tarish, TOP va VIP holatini berish, muddatini uzaytirish, tiklash, qo'shimcha e'lon joylari va hisobni to'ldirish.",
      "2.4. Hisob (balans) — Foydalanuvchining Platformadagi ichki hisobi; undagi mablag' faqat Platforma xizmatlariga sarflanadi va naqd pulga almashtirilmaydi.",
    ]],
    [tr('3. Xizmat predmeti'), [
      "3.1. Ijrochi Foydalanuvchiga Platformada e'lonlarni joylashtirish va ularning ko'rinishini oshirish bo'yicha raqamli xizmatlarni ko'rsatadi.",
      "3.2. Platforma ijodkorlar va mijozlarni bog'lovchi vosita hisoblanadi. Foydalanuvchilar o'rtasidagi kelishuvlar, ish sifati va hisob-kitoblar uchun Ijrochi tomon emas va javob bermaydi.",
    ]],
    [tr('4. Xizmatlar narxi'), [
      `4.1. Pullik xizmatlar narxi: ${prices}.`,
      `4.2. Oddiy e'lon joylash bepul (${c.free_ads ?? 5} tagacha faol e'lon). Narxlar O'zbekiston so'mida ko'rsatilgan va Platformada e'lon qilinadi.`,
      "4.3. Ijrochi narxlarni o'zgartirishi mumkin; o'zgarish to'lov qilib bo'lingan xizmatlarga ta'sir qilmaydi.",
    ]],
    [tr("5. To'lov tartibi"), [
      "5.1. To'lov Payme yoki Click to'lov tizimlari orqali Uzcard/Humo kartalari bilan amalga oshiriladi.",
      "5.2. To'lov tasdiqlangandan keyin xizmat avtomatik ravishda darhol yoqiladi. To'lov tizimi elektron fiskal chekni beradi.",
      "5.3. Karta ma'lumotlari faqat to'lov tizimi tomonida qayta ishlanadi va Ijrochiga berilmaydi.",
    ]],
    [tr('6. Pulni qaytarish'), [
      "6.1. Xizmat yoqilgandan keyin u to'liq bajarilgan hisoblanadi va uning uchun to'langan pul qaytarilmaydi.",
      "6.2. Agar to'lov o'tib, xizmat texnik sabab bilan yoqilmagan bo'lsa yoki pul ikki marta yechilgan bo'lsa, Foydalanuvchi 14 kun ichida qo'llab-quvvatlashga murojaat qiladi; mablag' 10 ish kuni ichida to'lov qilingan kartaga qaytariladi.",
      "6.3. Hisobga to'ldirilgan, lekin ishlatilmagan mablag' Foydalanuvchining yozma so'roviga ko'ra qaytariladi.",
    ]],
    [tr('7. Tomonlarning huquq va majburiyatlari'), [
      "7.1. Ijrochi Platformaning uzluksiz ishlashi uchun oqilona choralarni ko'radi, to'langan xizmatni o'z vaqtida yoqadi va murojaatlarga javob beradi.",
      "7.2. Ijrochi qoidaga zid e'lonlarni ogohlantirmasdan olib tashlashi va qoidabuzar hisobini cheklashi mumkin; bunda ushbu e'longa sarflangan xizmat qaytarilmaydi.",
      "7.3. Foydalanuvchi e'lon mazmunining to'g'riligi va qonuniyligi uchun o'zi javob beradi, uchinchi shaxslarning huquqlarini buzmaydi.",
    ]],
    [tr("8. Shaxsiy ma'lumotlar"), [
      "8.1. Foydalanuvchi ma'lumotlari «Shaxsga doir ma'lumotlar to'g'risida»gi qonunga va Platformaning maxfiylik siyosatiga muvofiq qayta ishlanadi.",
      "8.2. Ma'lumotlar faqat xizmat ko'rsatish maqsadida ishlatiladi va qonunda belgilangan hollardan tashqari uchinchi shaxslarga berilmaydi.",
    ]],
    [tr('9. Javobgarlik va fors-major'), [
      "9.1. Ijrochi aloqa uzilishi, to'lov tizimlari yoki uchinchi shaxs xizmatlaridagi nosozliklar natijasidagi kechikishlar uchun javob bermaydi, lekin ularni tezroq bartaraf etishga harakat qiladi.",
      "9.2. Tomonlar yengib bo'lmaydigan kuchlar (tabiiy ofat, davlat organlari qarorlari va boshqalar) ta'sirida majburiyatni bajarmaganlik uchun javobgar bo'lmaydi.",
    ]],
    [tr('10. Nizolarni hal qilish'), [
      "10.1. Nizolar avval muzokara yo'li bilan hal qilinadi; da'vo 10 ish kuni ichida ko'rib chiqiladi.",
      "10.2. Kelishilmasa, nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sudda hal qilinadi.",
    ]],
    [tr('11. Amal qilish muddati'), [
      "11.1. Oferta Platformada e'lon qilingan kundan boshlab muddatsiz amal qiladi va Ijrochi uni bekor qilgunga qadar kuchda bo'ladi.",
    ]],
    [tr('12. Ijrochi rekvizitlari'), [
      `12.1. Ijrochi: ${seller}${c.legal_inn ? `, STIR ${c.legal_inn}` : ''}${c.legal_address ? `, ${c.legal_address}` : ''}. Aloqa: ${phone}, ${site}.`,
    ]],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 18, gap: 6, maxWidth: 680, width: '100%', alignSelf: 'center', paddingBottom: 48 }}>
      <Stack.Screen options={{ title: tr('Ommaviy oferta') }} />
      <Text style={{ fontFamily: FONT.display, fontSize: 20, color: t.ink }}>{tr('Ommaviy oferta')}</Text>
      <Text style={{ color: t.muted, fontSize: 12.5 }}>{tr("Pullik xizmatlar ko'rsatish shartnomasi · 2026-yil 2-oktabr")}</Text>
      {S.map(([h, ps]) => (
        <View key={h} style={{ gap: 6 }}>
          <H>{h}</H>
          {ps.map((p) => <P key={p.slice(0, 20)}>{p}</P>)}
        </View>
      ))}
    </ScrollView>
  );
}
