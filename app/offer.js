// Ommaviy oferta: Payme va Click talab qiladi (xizmat tavsifi, narxlar, to'lov va qaytarish tartibi, sotuvchi ma'lumotlari, aloqa).
// Sotuvchi haqida faqat qonun talab qiladigan minimum ko'rsatiladi: nomi, STIR, ro'yxatdan o'tgan hudud va aloqa.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT, FONT } from '../src/theme';
import { useApp } from '../src/app-context';
import { SVC, svcDesc } from '../src/data';
import { fmtNum } from '../src/format';
import { WEB_URL } from '../src/config';
import { tr } from '../src/i18n';

export default function Offer() {
  const t = useT();
  const { config } = useApp();
  const c = config || {};
  const seller = c.legal_name || tr('Mohir bozor');
  const priced = ['top', 'vip', 'bump', 'extend', 'restore', 'slots'];
  const phone = c.support_phone || '+998 91 001 88 18';

  const Card = ({ icon, title, children }) => (
    <View style={{ backgroundColor: t.surface, borderRadius: 18, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={17} color={t.accent} />
        </View>
        <Text style={{ fontFamily: FONT.displayM, fontSize: 15.5, color: t.ink, flex: 1 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
  const P = ({ children }) => <Text style={{ color: t.ink, lineHeight: 22, fontSize: 14.5 }}>{children}</Text>;
  const Row = ({ k, v }) => (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderColor: t.line }}>
      <Text style={{ color: t.muted, fontSize: 13.5, width: 108 }}>{k}</Text>
      <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600', flex: 1 }}>{v}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 680, width: '100%', alignSelf: 'center', paddingBottom: 40 }}>
      <Stack.Screen options={{ title: tr('Ommaviy oferta') }} />
      <View style={{ gap: 4, paddingHorizontal: 4, paddingBottom: 4 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>{tr('Ommaviy oferta')}</Text>
        <Text style={{ color: t.muted, fontSize: 13 }}>{tr("Pullik xizmatlar ko'rsatish shartnomasi · 2026-yil 2-oktabr")}</Text>
      </View>

      <Card icon="document-text" title={tr('1. Umumiy qoidalar')}>
        <P>{tr("Ushbu hujjat")}{' '}{seller} {tr("(keyingi o'rinlarda — «Ijrochi») tomonidan «Mohir bozor» platformasida (")}{WEB_URL}{tr(") pullik xizmatlarni ko'rsatish bo'yicha ommaviy taklif (oferta) hisoblanadi. Foydalanuvchi pullik xizmat uchun to'lovni amalga oshirishi bilan ushbu oferta shartlarini to'liq qabul qilgan hisoblanadi (aksept).")}</P>
      </Card>

      <Card icon="sparkles" title={tr('2. Xizmat predmeti')}>
        <P>{tr("Ijrochi Foydalanuvchiga platformada e'lonlarni joylashtirish va ko'rinishini oshirish bo'yicha raqamli xizmatlarni ko'rsatadi. Platforma ijrochi va mijozlarni bog'laydi; foydalanuvchilar o'rtasidagi kelishuvlarga Ijrochi tomon emas.")}</P>
      </Card>

      <Card icon="pricetags" title={tr('3. Xizmatlar va narxlar')}>
        <View style={{ gap: 0 }}>
          {priced.map((k) => (
            <View key={k} style={{ paddingVertical: 10, gap: 3, borderTopWidth: 1, borderColor: t.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ color: t.ink, fontWeight: '700', flex: 1 }}>{SVC[k]}</Text>
                <Text style={{ color: t.price, fontWeight: '800' }}>{fmtNum(c.prices?.[k])} {tr("so'm")}</Text>
              </View>
              <Text style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>{svcDesc(k, c)}</Text>
            </View>
          ))}
        </View>
        <P>{tr("Oddiy e'lon joylash bepul (")}{c.free_ads ?? 5} {tr("tagacha faol e'lon). Narxlar O'zbekiston so'mida ko'rsatilgan. Hisobni oldindan to'ldirish ham mumkin; hisobdagi mablag' faqat platforma xizmatlariga sarflanadi.")}</P>
      </Card>

      <Card icon="card" title={tr("4. To'lov tartibi")}>
        <P>{tr("To'lov Payme yoki Click orqali Uzcard/Humo kartasi bilan amalga oshiriladi. To'lov tasdiqlangandan keyin xizmat avtomatik ravishda darhol yoqiladi. To'lov tizimi elektron fiskal chekni beradi.")}</P>
      </Card>

      <Card icon="refresh-circle" title={tr('5. Pulni qaytarish')}>
        <P>{tr("Xizmat yoqilgandan keyin u bajarilgan hisoblanadi va pul qaytarilmaydi. Agar to'lov o'tib, xizmat texnik sabab bilan yoqilmagan bo'lsa yoki pul ikki marta yechilgan bo'lsa, 14 kun ichida qo'llab-quvvatlashga murojaat qiling — mablag' 10 ish kuni ichida to'lov qilingan kartaga qaytariladi. Hisobga to'ldirilgan, lekin ishlatilmagan mablag' ham so'rov bo'yicha qaytariladi.")}</P>
      </Card>

      <Card icon="shield-checkmark" title={tr('6. Tomonlarning javobgarligi')}>
        <P>{tr("Foydalanuvchi e'lon mazmuni uchun o'zi javob beradi. Qoidaga zid e'lonlar (foydalanish shartlariga qarang) olib tashlanadi; bu holda ushbu e'longa sarflangan pullik xizmat qaytarilmaydi. Ijrochi platformaning uzluksiz ishlashi uchun oqilona choralarni ko'radi.")}</P>
      </Card>

      <Card icon="people" title={tr('7. Nizolar')}>
        <P>{tr("Nizolar muzokara yo'li bilan, kelishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq hal qilinadi.")}</P>
      </Card>

      <Card icon="business" title={tr('8. Ijrochi va aloqa')}>
        <View>
          <Row k={tr('Ijrochi')} v={seller} />
          {c.legal_inn ? <Row k={tr('STIR')} v={c.legal_inn} /> : null}
          {c.legal_address ? <Row k={tr("Ro'yxatdan o'tgan")} v={c.legal_address} /> : null}
          <Row k={tr('Telefon')} v={phone} />
          <Row k={tr('Sayt')} v={WEB_URL.replace('https://', '')} />
        </View>
      </Card>
    </ScrollView>
  );
}
