// Ommaviy oferta: Payme va Click saytni tekshirganda talab qiladi
// (xizmat tavsifi, narxlar, to'lov va qaytarish tartibi, sotuvchi rekvizitlari, aloqa).
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { SVC, svcDesc } from '../src/data';
import { fmtNum } from '../src/format';
import { WEB_URL } from '../src/config';

export default function Offer() {
  const t = useT();
  const { config } = useApp();
  const c = config || {};
  const seller = c.legal_name || '— (rekvizitlar kiritilmoqda)';
  const P = ({ children }) => <Text style={{ color: t.ink, lineHeight: 22, fontSize: 15 }}>{children}</Text>;
  const Hh = ({ children }) => <Text style={{ fontFamily: FONT.displayM, fontSize: 16, color: t.ink, marginTop: 12 }}>{children}</Text>;
  const priced = ['top', 'vip', 'bump', 'extend', 'restore', 'slots'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 8, maxWidth: 680, width: '100%', alignSelf: 'center', paddingBottom: 40 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>Ommaviy oferta</Text>
      <Text style={{ color: t.muted }}>Pullik xizmatlar ko'rsatish shartnomasi · 2026-yil 2-oktabr</Text>

      <Hh>1. Umumiy qoidalar</Hh>
      <P>Ushbu hujjat {seller} (keyingi o'rinlarda — «Ijrochi») tomonidan «Mohir bozor» platformasida ({WEB_URL}) pullik xizmatlarni ko'rsatish bo'yicha ommaviy taklif (oferta) hisoblanadi. Foydalanuvchi pullik xizmat uchun to'lovni amalga oshirishi bilan ushbu oferta shartlarini to'liq qabul qilgan hisoblanadi (aksept).</P>

      <Hh>2. Xizmat predmeti</Hh>
      <P>Ijrochi Foydalanuvchiga platformada e'lonlarni joylashtirish va ko'rinishini oshirish bo'yicha raqamli xizmatlarni ko'rsatadi. Platforma ijrochi va mijozlarni bog'laydi; foydalanuvchilar o'rtasidagi kelishuvlarga Ijrochi tomon emas.</P>

      <Hh>3. Xizmatlar va narxlar</Hh>
      <View style={{ borderWidth: 1, borderColor: t.line, borderRadius: 12, overflow: 'hidden' }}>
        {priced.map((k, i) => (
          <View key={k} style={{ padding: 12, gap: 3, backgroundColor: i % 2 ? t.bg : t.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ color: t.ink, fontWeight: '700', flex: 1 }}>{SVC[k]}</Text>
              <Text style={{ color: t.price, fontWeight: '800' }}>{fmtNum(c.prices?.[k])} so'm</Text>
            </View>
            <Text style={{ color: t.muted, fontSize: 13 }}>{svcDesc(k, c)}</Text>
          </View>
        ))}
      </View>
      <P>Oddiy e'lon joylash bepul ({c.free_ads ?? 5} tagacha faol e'lon). Narxlar O'zbekiston so'mida ko'rsatilgan. Hisobni oldindan to'ldirish ham mumkin; hisobdagi mablag' faqat platforma xizmatlariga sarflanadi.</P>

      <Hh>4. To'lov tartibi</Hh>
      <P>To'lov Payme, Click yoki Uzcard/Humo kartasi orqali amalga oshiriladi. To'lov tasdiqlangandan keyin xizmat avtomatik ravishda darhol yoqiladi. To'lov tizimi elektron fiskal chekni beradi.</P>

      <Hh>5. Pulni qaytarish</Hh>
      <P>Xizmat yoqilgandan keyin u bajarilgan hisoblanadi va pul qaytarilmaydi. Agar to'lov o'tib, xizmat texnik sabab bilan yoqilmagan bo'lsa yoki pul ikki marta yechilgan bo'lsa, 14 kun ichida qo'llab-quvvatlashga murojaat qiling — mablag' 10 ish kuni ichida to'lov qilingan kartaga qaytariladi. Hisobga to'ldirilgan, lekin ishlatilmagan mablag' ham so'rov bo'yicha qaytariladi.</P>

      <Hh>6. Tomonlarning javobgarligi</Hh>
      <P>Foydalanuvchi e'lon mazmuni uchun o'zi javob beradi. Qoidaga zid e'lonlar (foydalanish shartlariga qarang) olib tashlanadi; bu holda ushbu e'longa sarflangan pullik xizmat qaytarilmaydi. Ijrochi platformaning uzluksiz ishlashi uchun oqilona choralarni ko'radi.</P>

      <Hh>7. Nizolar</Hh>
      <P>Nizolar muzokara yo'li bilan, kelishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq hal qilinadi.</P>

      <Hh>8. Ijrochi rekvizitlari va aloqa</Hh>
      <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12, gap: 4 }}>
        <P>{seller}</P>
        {c.legal_inn ? <P>STIR (INN): {c.legal_inn}</P> : null}
        {c.legal_address ? <P>Manzil: {c.legal_address}</P> : null}
        {c.legal_bank ? <P>{c.legal_bank}</P> : null}
        <P>Telefon: {c.support_phone || '+998 91 001 88 18'}</P>
        <P>Sayt: {WEB_URL}</P>
      </View>
    </ScrollView>
  );
}
