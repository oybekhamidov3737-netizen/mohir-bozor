# Mohir bozor

SMM mutaxassislari, montajchilar, dizaynerlar va marketologlar uchun O'zbekiston bo'ylab e'lonlar bozori.
Bitta kod bazasidan **iPhone**, **Android** ilovasi va **veb-sayt** quriladi (Expo + Supabase).

## Imkoniyatlar

- Gmail / iCloud pochtasiga 6 xonali kod orqali kirish (parolsiz)
- Kabinet: profil, rasm, yo'nalish, hudud
- 14 hudud va barcha tumanlar bo'yicha qidiruv va filtr
- Rasmli e'lonlar (6 tagacha), muddati (30 kun), arxiv va tarix
- Ilova ichidagi chat (jonli), Telegram va boshqa tashqi kontaktlar taqiqlangan
- Mavzudan tashqari e'lonlar server tomonida bloklanadi
- Pullik xizmatlar: VIP, TOP, Ko'tarish, Uzaytirish, Tiklash, qo'shimcha e'lon joylari
- Boshqaruv paneli: to'lovlarni tasdiqlash, tushum, barcha e'lonlar, suhbatlar, narxlar
- Hisobni o'chirish va maxfiylik siyosati (App Store / Play Market talabi)

## O'rnatish (hammasi telefondan)

### 1. Supabase (ma'lumotlar bazasi)
1. supabase.com → yangi loyiha.
2. **SQL Editor** → `supabase/schema.sql` faylining hammasini joylang → **Run**.
3. **Authentication → Sign In / Providers → Email** yoqilgan bo'lsin.
4. **Authentication → Email Templates → Magic Link** shablonida kod chiqishi uchun matnga `{{ .Token }}` qo'shing, masalan:
   `Mohir bozor tasdiqlash kodi: {{ .Token }}`
5. **Project Settings → API** dan *Project URL* va *anon public* kalitni olib, `src/config.js` ga yozing.
   `service_role` kalitni hech qachon kodga yozmang.

### 2. Veb-sayt (GitHub Pages)
Repozitoriy **Settings → Pages → Source: GitHub Actions**. Har `main` ga yuklashda sayt avtomatik yangilanadi:
`https://oybekhamidov3737-netizen.github.io/mohir-bozor/`

### 3. Ilova (Expo EAS)
1. expo.dev da akkaunt oching → **Access tokens** → yangi token.
2. GitHub repozitoriy **Settings → Secrets and variables → Actions** → `EXPO_TOKEN` nomi bilan saqlang.
3. **Actions → "Ilova yig'ish" → Run workflow** → `android` + `preview` → expo.dev da APK tayyor bo'ladi.

### 4. Birinchi kirish
Ilovaga o'z pochtangiz bilan kiring → Kabinet → **"Men bozor egasiman"** tugmasi. Bu bir marta ishlaydi va sizni admin qiladi.
Keyin **Boshqaruv paneli → Sozlamalar** da to'lov rekvizitlari va narxlarni kiriting.

## Tuzilma

```
app/            ekranlar (Expo Router)
  (tabs)/       Asosiy, Saralangan, Joylash, Xabarlar, Kabinet
  ad/[id].js    e'lon sahifasi
  chat/[id].js  suhbat
  post.js       e'lon joylash / tahrirlash
  promo/[id].js pullik xizmatlar va to'lov
  admin.js      boshqaruv paneli
src/            umumiy kod (dizayn, ma'lumotlar, Supabase)
supabase/       ma'lumotlar bazasi va xavfsizlik qoidalari
```
