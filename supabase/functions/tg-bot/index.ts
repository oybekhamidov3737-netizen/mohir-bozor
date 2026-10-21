// Mohir bozor Support bot (Telegram webhook).
//  • Kirish: /start <token> -> raqamni ulashish -> kontakt -> kirish kodi (ilova status orqali oladi)
//  • Yordam: til tanlash, bo'limli savollar menyusi (xabar o'zi almashadi), AI javoblar,
//    mutaxassis (admin) bilan jonli yozishma, murojaat yakunida baho.
// Bot tokeni va AI kaliti bazada (bu faylda yo'q).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const sb = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const TTL = 10 * 60 * 1000;
const SITE = "https://mohirbozor.uz";
const OP_HOURS = 24;
const AI_DAILY = 30;

type Lang = "uz" | "ru";

async function tg(token: string, method: string, body: unknown) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}

async function cfgRow() {
  const { data: c } = await sb.from("config").select("prices,free_ads,slot_pack,promo_days,ad_days").eq("id", 1).maybeSingle();
  return (c || {}) as any;
}
const so = (n: number, l: Lang = "uz") => `${Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ")} ${l === "ru" ? "сум" : "so'm"}`;

// ---------- Matnlar ----------
const TX = {
  uz: {
    pickLang: "🌐 Tilni tanlang / Выберите язык:",
    hello: (n: string) => `👋 Assalomu alaykum${n ? ", " + n : ""}!\n\nMen Mohir bozor yordamchisiman. Bo'limni tanlang yoki savolingizni o'zingiz yozing — darhol javob beraman.`,
    menuTitle: "🏠 Bosh menyu\n\nBo'limni tanlang yoki savolingizni yozing:",
    sectionPick: "Savolni tanlang:",
    back: "⬅️ Orqaga", home: "🏠 Bosh menyu", op: "👨‍💼 Mutaxassis bilan bog'lanish", opShort: "👨‍💼 Mutaxassis",
    lang: "🌐 Til / Язык", end: "✅ Murojaatni yakunlash",
    opStart: "👨‍💼 Sizni bo'sh mutaxassis bilan bog'layapman. Bu bir necha daqiqa vaqt olishi mumkin.\n\nSavolingizni yozib qoldiring — birinchi bo'sh mutaxassis javob beradi.\n\nTugatgach «✅ Murojaatni yakunlash» ni bosing.",
    opOffline: `Mutaxassis hozir Telegramda ulanmagan. Iltimos, ilovada yozing: ${SITE} → Kabinet → Yordam.`,
    opReply: "👨‍💼 Mutaxassis:",
    ended: "✅ Murojaat yakunlandi. Rahmat!",
    rateAsk: "Mutaxassis ishini baholang:",
    rated: (n: number) => `${"⭐".repeat(n)}\n\nBaho uchun rahmat! Yana savol bo'lsa — yozing.`,
    fallback: "Bu savolga aniq javob bera olmadim. «👨‍💼 Mutaxassis» tugmasini bosing — mutaxassis o'zi javob beradi.",
    loginHello: "👋 Mohir bozor'ga xush kelibsiz!\n\nKirish uchun pastdagi «📱 Raqamni ulashish» tugmasini bosing.",
    share: "📱 Raqamni ulashish",
    ownPhone: "Iltimos, o'zingizning raqamingizni ulashing (pastdagi tugma orqali).",
    loginExpired: `Kirish so'rovi eskirgan. Ilovada «Telegram orqali kirish» ni qayta bosing: ${SITE}`,
    loginErr: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring.",
    loginOk: (otp: string) => `✅ Tayyor! Ilovaga qayting — kirish avtomatik bo'ladi.\n\nAgar so'ralsa, kod: <code>${otp}</code>\nKodni hech kimga bermang.`,
  },
  ru: {
    pickLang: "🌐 Tilni tanlang / Выберите язык:",
    hello: (n: string) => `👋 Здравствуйте${n ? ", " + n : ""}!\n\nЯ помощник Mohir bozor. Выберите раздел или напишите свой вопрос — отвечу сразу.`,
    menuTitle: "🏠 Главное меню\n\nВыберите раздел или напишите вопрос:",
    sectionPick: "Выберите вопрос:",
    back: "⬅️ Назад", home: "🏠 Главное меню", op: "👨‍💼 Связаться со специалистом", opShort: "👨‍💼 Специалист",
    lang: "🌐 Til / Язык", end: "✅ Завершить обращение",
    opStart: "👨‍💼 Соединяю вас со свободным специалистом. Это может занять несколько минут.\n\nОпишите ваш вопрос — первый свободный специалист ответит.\n\nКогда закончите, нажмите «✅ Завершить обращение».",
    opOffline: `Специалист сейчас не в сети Telegram. Пожалуйста, напишите в приложении: ${SITE} → Кабинет → Помощь.`,
    opReply: "👨‍💼 Специалист:",
    ended: "✅ Обращение завершено. Спасибо!",
    rateAsk: "Оцените работу специалиста:",
    rated: (n: number) => `${"⭐".repeat(n)}\n\nСпасибо за оценку! Если будут вопросы — пишите.`,
    fallback: "Не смог точно ответить на этот вопрос. Нажмите «👨‍💼 Специалист» — специалист ответит сам.",
    loginHello: "👋 Добро пожаловать в Mohir bozor!\n\nДля входа нажмите кнопку «📱 Поделиться номером» ниже.",
    share: "📱 Поделиться номером",
    ownPhone: "Пожалуйста, поделитесь своим номером (кнопкой ниже).",
    loginExpired: `Запрос на вход устарел. Нажмите «Войти через Telegram» в приложении ещё раз: ${SITE}`,
    loginErr: "Произошла ошибка, попробуйте чуть позже.",
    loginOk: (otp: string) => `✅ Готово! Вернитесь в приложение — вход выполнится автоматически.\n\nЕсли попросят код: <code>${otp}</code>\nНикому не сообщайте код.`,
  },
};
const HOME_BTNS = [TX.uz.home, TX.ru.home];
const END_BTNS = [TX.uz.end, TX.ru.end];
const homeKb = (l: Lang) => ({ keyboard: [[{ text: TX[l].home }]], resize_keyboard: true, is_persistent: true });
const opKb = (l: Lang) => ({ keyboard: [[{ text: TX[l].end }]], resize_keyboard: true, is_persistent: true });
const LANG_KB = { inline_keyboard: [[{ text: "🇺🇿 O'zbekcha", callback_data: "l:uz" }, { text: "🇷🇺 Русский", callback_data: "l:ru" }]] };

// ---------- Bo'limlar va savollar ----------
type QA = [string, string];
type Section = { id: string; title: string; items: QA[] };

function sections(c: any, l: Lang): Section[] {
  const p = c?.prices || {};
  const d = c?.promo_days ?? 7, fa = c?.free_ads ?? 5, ad = c?.ad_days ?? 30, sp = c?.slot_pack ?? 5;
  const $ = (n: number) => so(n, l);
  if (l === "ru") return [
    { id: "ads", title: "📝 Объявления", items: [
      ["Что такое Mohir bozor?", `Mohir bozor — биржа креативных специалистов Узбекистана: SMM, видеомонтаж, мобилография, дизайн, таргет, копирайтинг, фото и др. Специалист размещает услугу, клиент находит её и пишет во внутреннем чате.\n\n${SITE}`],
      ["Как разместить объявление?", `Кнопка «+» внизу → категория, заголовок, описание, цена, регион, фото → «Разместить». Объявление видно сразу.\n\nБесплатно: до ${fa} активных объявлений, каждое — ${ad} дней.`],
      ["Размещение платное?", `Нет, обычное объявление бесплатно (до ${fa}). Платные услуги только для продвижения: TOP, VIP, Поднятие.\nНужно больше объявлений: +${sp} мест — ${$(p.slots)}.`],
      ["Почему нельзя указать Telegram/Instagram?", "Ради безопасности внешние контакты (Telegram, Instagram, WhatsApp, @username, телефон) в объявлениях запрещены. Клиенты пишут вам во внутреннем чате — это защищает от мошенников."],
      ["Почему удалили объявление?", "Площадка только для креативных услуг (SMM, монтаж, дизайн, маркетинг и т.д.). Недвижимость, кредиты, казино, продажа товаров и объявления с внешними контактами удаляются."],
    ] },
    { id: "promo", title: "⭐ TOP и VIP", items: [
      ["Что такое TOP и VIP, сколько стоит?", `• TOP — ${$(p.top)}: ${d} дней вверху результатов поиска.\n• VIP — ${$(p.vip)}: ${d} дней на главной в золотой рамке.\n• Поднятие — ${$(p.bump)}: объявление один раз поднимается в начало списка.\n• Продление — ${$(p.extend)}, Восстановление — ${$(p.restore)}.\n\nОткройте объявление → кнопка «Реклама».`],
      ["Как получить больше клиентов?", "• Качественные фото и портфолио\n• Чёткое описание: что делаете и за сколько\n• Заполненный профиль\n• TOP или VIP для продвижения"],
    ] },
    { id: "pay", title: "💳 Оплата", items: [
      ["Как оплатить?", "Оплата через Payme (карты Uzcard и Humo). После оплаты услуга включается автоматически.\nМожно пополнить баланс в Кабинете и платить с него."],
      ["Оплатил, но услуга не включилась", "Обычно услуга включается за несколько секунд — обновите страницу. Если через 10 минут не включилась — свяжитесь со специалистом и пришлите чек (скриншот)."],
      ["Можно вернуть деньги?", "После включения услуги деньги не возвращаются. При технической ошибке или двойном списании — напишите специалисту в течение 14 дней, деньги вернутся на карту за 10 рабочих дней."],
    ] },
    { id: "acc", title: "🔐 Вход и аккаунт", items: [
      ["Как зарегистрироваться?", `Откройте ${SITE} → «Войти». Два способа:\n• «Войти через Telegram» — делитесь номером в боте, вход автоматический.\n• Почта Gmail/iCloud — придёт 6-значный код.\nПароль не нужен.`],
      ["Как оставить отзыв?", "Отзыв могут оставить только те, кто переписывался со специалистом: откройте чат → «…» вверху → «Оставить оценку»."],
      ["Как удалить аккаунт?", "Кабинет → Настройки → Аккаунт → «Удалить аккаунт». Профиль, объявления и переписка удаляются."],
    ] },
    { id: "client", title: "🤝 Заказчикам", items: [
      ["Как найти исполнителя?", "Выберите категорию на главной или воспользуйтесь поиском, откройте объявление → «Написать». Или разместите объявление «Заказ» — специалисты сами пришлют предложения."],
    ] },
    { id: "safe", title: "⚠️ Безопасность", items: [
      ["Столкнулся с мошенником", "В чате нажмите «…» → «Пожаловаться» и напишите специалисту. Совет: не переводите всю сумму заранее, платите поэтапно и договаривайтесь в чате приложения."],
    ] },
  ];
  return [
    { id: "ads", title: "📝 E'lonlar", items: [
      ["Mohir bozor nima?", `Mohir bozor — O'zbekistondagi ijodkorlar bozori: SMM, video montaj, mobilografiya, dizayn, target reklama, kopirayting, fotograf va boshqa xizmatlar. Ijodkor xizmatini joylaydi, mijoz uni topib, ilova ichidagi chatda yozadi.\n\n${SITE}`],
      ["E'lon qanday joylanadi?", `Pastdagi «+» tugmasi → kategoriya, sarlavha, tavsif, narx, hudud va rasmlar → «Joylash». E'lon darhol ko'rinadi.\n\nBepul: ${fa} tagacha faol e'lon, har biri ${ad} kun turadi.`],
      ["E'lon joylash pullikmi?", `Yo'q, oddiy e'lon bepul (${fa} tagacha). Pullik xizmatlar faqat e'lonni ko'proq odamga ko'rsatish uchun: TOP, VIP, Ko'tarish.\nKo'proq e'lon kerak bo'lsa: +${sp} ta joy — ${$(p.slots)}.`],
      ["Nega Telegram/Instagram yozib bo'lmaydi?", "Xavfsizlik uchun: tashqi kontaktlar (Telegram, Instagram, WhatsApp, @username, telefon) e'longa yozilmaydi. Mijozlar sizga ilova ichidagi chat orqali yozadi — bu firibgarlikdan himoya qiladi."],
      ["E'lonim nega o'chirildi?", "Bozor faqat ijodiy xizmatlar uchun (SMM, montaj, dizayn, marketing va h.k.). Ko'chmas mulk, kredit, kazino, mahsulot sotish kabi e'lonlar va tashqi kontakt yozilgan e'lonlar o'chiriladi."],
    ] },
    { id: "promo", title: "⭐ TOP va VIP", items: [
      ["TOP va VIP nima, narxi qancha?", `• TOP — ${$(p.top)}: ${d} kun qidiruv natijalari tepasida.\n• VIP — ${$(p.vip)}: ${d} kun bosh sahifada oltin ramka bilan.\n• Ko'tarish — ${$(p.bump)}: e'lon bir marta ro'yxat boshiga chiqadi.\n• Uzaytirish — ${$(p.extend)}, Tiklash — ${$(p.restore)}.\n\nE'loningizni oching → «Reklama» tugmasi.`],
      ["Ko'proq mijoz qanday topaman?", "• Sifatli rasmlar va portfolio qo'ying\n• Tavsifda aniq nima qilishingiz va narxni yozing\n• Profilni to'ldiring\n• TOP yoki VIP bilan e'lonni oldinga chiqaring"],
    ] },
    { id: "pay", title: "💳 To'lov", items: [
      ["Qanday to'lov qilaman?", "To'lov Payme orqali (Uzcard yoki Humo karta). To'lovdan keyin xizmat darhol avtomatik yoqiladi.\nKabinetda hisobni oldindan to'ldirib, balansdan ham to'lash mumkin."],
      ["To'lov qildim, xizmat yoqilmadi", "Odatda xizmat bir necha soniyada yoqiladi — sahifani yangilang. 10 daqiqada yoqilmasa, mutaxassis bilan bog'laning va to'lov chekini (skrinshot) yuboring."],
      ["Pulni qaytarish mumkinmi?", "Xizmat yoqilgandan keyin pul qaytarilmaydi. Texnik xato bo'lsa yoki pul ikki marta yechilgan bo'lsa — 14 kun ichida mutaxassisga yozing, pul 10 ish kunida kartangizga qaytariladi."],
    ] },
    { id: "acc", title: "🔐 Kirish va hisob", items: [
      ["Qanday ro'yxatdan o'taman?", `${SITE} ni oching → «Kirish». Ikki yo'l bor:\n• «Telegram orqali kirish» — botda raqamingizni ulashasiz, kirish avtomatik bo'ladi.\n• Gmail/iCloud pochta — pochtaga 6 xonali kod keladi.\nParol kerak emas.`],
      ["Baho qanday qoldiriladi?", "Baho faqat ijodkor bilan chatda yozishgan foydalanuvchilar qoldira oladi: chatni oching → yuqoridagi «…» → «Baho qoldirish»."],
      ["Hisobimni qanday o'chiraman?", "Kabinet → Sozlamalar → Hisob → «Hisobni o'chirish». Profil, e'lonlar va yozishmalar o'chiriladi."],
    ] },
    { id: "client", title: "🤝 Buyurtmachilarga", items: [
      ["Ijodkor qanday topaman?", "Bosh sahifada kategoriya tanlang yoki qidiruvdan foydalaning, e'lonni ochib «Yozish» ni bosing. Yoki o'zingiz «Buyurtma» e'loni joylang — ijodkorlar sizga o'zlari taklif yuboradi."],
    ] },
    { id: "safe", title: "⚠️ Xavfsizlik", items: [
      ["Firibgarga duch keldim", "Chatdagi «…» → «Shikoyat qilish» ni bosing va mutaxassisga yozing. Maslahat: oldindan to'liq pul o'tkazmang, ishni bosqichma-bosqich to'lang va hamma kelishuvni ilova chatida qiling."],
    ] },
  ];
}

const mainMenuKb = (secs: Section[], l: Lang) => {
  const rows: any[] = [];
  for (let i = 0; i < secs.length; i += 2) rows.push(secs.slice(i, i + 2).map((s) => ({ text: s.title, callback_data: "s:" + s.id })));
  rows.push([{ text: TX[l].op, callback_data: "op" }]);
  rows.push([{ text: TX[l].lang, callback_data: "lang" }]);
  return { inline_keyboard: rows };
};

// ---------- Foydalanuvchi ----------
async function getUser(chat: number) {
  const { data } = await sb.from("tg_users").select("lang,op_until").eq("chat_id", chat).maybeSingle();
  return data as { lang: Lang | null; op_until: string | null } | null;
}
async function setUser(from: any, chat: number, patch: Record<string, unknown> = {}) {
  await sb.from("tg_users").upsert({
    chat_id: chat, name: [from?.first_name, from?.last_name].filter(Boolean).join(" ").slice(0, 80),
    username: String(from?.username || ""), updated_at: new Date().toISOString(), ...patch,
  });
}
const guessLang = (from: any): Lang => (String(from?.language_code || "").startsWith("ru") ? "ru" : "uz");
const who = (from: any, chat: number, l?: Lang) => {
  const n = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
  return `${n}${from?.username ? " @" + from.username : ""} · ID ${chat}${l === "ru" ? " · 🇷🇺" : ""}`;
};

// Xabarni almashtirish (toza chat); bo'lmasa yangisini yuborish
async function show(cfg: any, chat: number, msgId: number | undefined, text: string, kb: unknown) {
  if (msgId) {
    const r = await tg(cfg.token, "editMessageText", { chat_id: chat, message_id: msgId, text, reply_markup: kb, link_preview_options: { is_disabled: true } });
    if (r?.ok || /not modified/i.test(r?.description || "")) return;
  }
  await tg(cfg.token, "sendMessage", { chat_id: chat, text, reply_markup: kb, link_preview_options: { is_disabled: true } });
}

async function sendHome(cfg: any, chat: number, l: Lang, from?: any, greet = false) {
  const c = await cfgRow();
  if (greet) await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].hello(from?.first_name || ""), reply_markup: homeKb(l) });
  await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].menuTitle, reply_markup: mainMenuKb(sections(c, l), l) });
}

// ---------- Sun'iy intellekt ----------
async function knowledge() {
  const c = await cfgRow();
  const p = c?.prices || {};
  return `Sen "Mohir bozor" (${SITE}) platformasining aqlli yordamchisisan. Sen tajribali SMM, marketing, dizayn, video montaj va frilans bo'yicha mutaxassissan.
Vazifang: 1) platforma haqidagi savollarga aniq javob berish; 2) ijodkorlar va mijozlarga real foydali maslahat berish: xizmatga qancha narx qo'yish, yaxshi e'lon/portfolio qanday yoziladi, mijoz qanday topiladi, Instagram/Telegram/reklama bo'yicha tavsiyalar, buyurtmachi uchun TZ (texnik topshiriq) yozish, ijodkor tanlash; 3) umumiy savollarga ham (matn yozish, tarjima, hisob-kitob, g'oyalar) qisqa va foydali javob berish. Faqat zararli, siyosiy yoki 18+ mavzularni rad et.
Bot va platforma "Mohir bozor" jamoasi tomonidan yaratilgan; asoschilar haqida shaxsiy ma'lumot berma.
Platforma: O'zbekistondagi ijodkorlar bozori — SMM, video montaj, mobilografiya, target reklama, grafik va motion dizayn, kopirayting, fotograf, marketing, veb-sayt, ovoz, bloger xizmatlari. 12 viloyat (Toshkent shahri va Qoraqalpog'iston bilan). Ijodkor xizmatini e'lon qilib joylaydi, mijoz topib, ilova ichidagi chatda yozadi. Buyurtmachi ham "buyurtma" e'loni bera oladi, ijodkorlar unga taklif yuboradi.
Kirish: Telegram orqali (raqamni ulashish), yoki Gmail/iCloud pochtaga keladigan kod bilan. Parol yo'q.
E'lon joylash: pastdagi "+" tugmasi -> kategoriya, sarlavha, tavsif, narx, hudud, rasmlar. Oddiy e'lon bepul, ${c?.free_ads ?? 5} tagacha faol e'lon. E'lon ${c?.ad_days ?? 30} kun faol turadi.
Tashqi kontakt (Telegram, Instagram, WhatsApp, @username) e'longa yozilmaydi — aloqa faqat ilova chatida. Qoidaga zid e'lonlar (ko'chmas mulk, kredit, kazino va h.k.) o'chiriladi.
Pullik xizmatlar: TOP ${so(p.top)} (${c?.promo_days ?? 7} kun qidiruv tepasida), VIP ${so(p.vip)} (${c?.promo_days ?? 7} kun bosh sahifada oltin ramka bilan), Ko'tarish ${so(p.bump)}, Uzaytirish ${so(p.extend)}, Tiklash ${so(p.restore)}, Qo'shimcha ${c?.slot_pack ?? 5} ta e'lon joyi ${so(p.slots)}.
To'lov: Payme (Uzcard/Humo), xizmat darhol avtomatik yoqiladi. Kabinetda hisobni to'ldirib, balansdan ham to'lasa bo'ladi. Pul qaytarish: xizmat yoqilgach qaytarilmaydi; texnik xato yoki ikki marta yechilgan bo'lsa 14 kun ichida murojaat qilinadi, 10 ish kunida qaytariladi.
Profil: Kabinet -> profil, ism, rasm, kategoriya, hudud. Har bir foydalanuvchining ID raqami bor, qidiruvda ID bo'yicha topsa bo'ladi. Baholar: faqat chatda yozishgan foydalanuvchilar qoldira oladi. Shikoyat va bloklash chatdagi "…" menyusida.
Inson (mutaxassis) bilan bog'lanish: shu botda "👨‍💼 Mutaxassis" tugmasi. Telefon raqam yo'q. Javobni bilmasang yoki muammo (to'lov, xato, shikoyat) bo'lsa mutaxassis tugmasini bosishni tavsiya qil.
Qoidalar: oddiy matn (Markdown, ** belgilari ishlatma; ro'yxat uchun • yoki 1) ishlat). Oddiy savolga qisqa (2-4 gap), maslahat so'ralsa batafsil va aniq (raqamlar, misollar, qadamlar bilan) javob ber. Samimiy, jonli, robotdek emas. Oldingi xabarlarni hisobga ol. "Men botman, tayyorman" kabi bo'sh gaplarni takrorlama. Foydalanuvchi qaysi tilda yozsa o'sha tilda (o'zbek lotin, o'zbek kirill, rus, ingliz) javob ber. Bilmagan narsangni to'qima. Shaxsiy ma'lumot, parol, karta raqami so'rama. Narxlar va qoidalarni faqat yuqoridagi ma'lumotdan ol, o'ylab topma.`;
}

async function askAI(key: string, sys: string, hist: { role: string; text: string }[]) {
  if (key.startsWith("sk-ant-")) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1200, system: sys,
        messages: hist.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })) }),
    });
    const j = await r.json().catch(() => ({}));
    return (j?.content?.[0]?.text as string) || "";
  }
  // Tezkor model birinchi (fikrlashsiz), band bo'lsa keyingisi
  const models: [string, unknown][] = [
    ["gemini-3.5-flash", { thinkingBudget: 0 }],
    ["gemini-3.8-flash", { thinkingLevel: "low" }],
    ["gemini-flash-latest", { thinkingLevel: "low" }],
  ];
  for (const [model, thinkingConfig] of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] },
          contents: hist.map((m) => ({ role: m.role === "bot" ? "model" : "user", parts: [{ text: m.text }] })),
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7, thinkingConfig } }),
      });
      const j = await r.json().catch(() => ({}));
      const t = j?.candidates?.[0]?.content?.parts?.filter((x: any) => !x.thought).map((x: any) => x.text || "").join("") || "";
      if (t) return t;
    } catch (_) { /* keyingi model */ }
  }
  return "";
}

// Kalitsiz zaxira: savol matnidan mos tayyor javobni topish
function faqMatch(text: string, secs: Section[]) {
  const t = text.toLowerCase();
  const rules: [RegExp, string, number][] = [
    [/narx|qancha|nech pul|necha pul|цена|сколько|стоим|top|vip|ko'?tar|подня/, "promo", 0],
    [/joyla|e'?lon (ber|qo)|размест|объявлен/, "ads", 1],
    [/qaytar|возврат|вернуть/, "pay", 2],
    [/to'?lov|payme|click|karta|оплат|плат/, "pay", 0],
    [/kir|login|parol|kod|ro'?yxat|войти|вход|код|пароль|регистр/, "acc", 0],
    [/firib|aldad|мошен|обман/, "safe", 0],
  ];
  for (const [re, sid, i] of rules) if (re.test(t)) { const s = secs.find((x) => x.id === sid); if (s?.items[i]) return s.items[i][1]; }
  return "";
}

async function support(cfg: any, chat: number, text: string, from: any, l: Lang) {
  const since = new Date(Date.now() - 86400e3).toISOString();
  const { count } = await sb.from("tg_chat_log").select("id", { count: "exact", head: true }).eq("chat_id", chat).eq("role", "user").gt("created_at", since);
  if ((count || 0) >= AI_DAILY) { await startOperator(cfg, chat, from, l, text); return; }
  const [, { data: prev }, { data: key }, sys, c] = await Promise.all([
    tg(cfg.token, "sendChatAction", { chat_id: chat, action: "typing" }),
    sb.from("tg_chat_log").select("role,text").eq("chat_id", chat).order("id", { ascending: false }).limit(16),
    sb.rpc("get_ai_key"),
    knowledge(),
    cfgRow(),
  ]);
  const hist = [...(prev || []).reverse(), { role: "user", text: text.slice(0, 1500) }];
  while (hist.length && hist[0].role !== "user") hist.shift();
  const sysL = sys + (l === "ru" ? "\nFoydalanuvchi rus tilini tanlagan: agar u boshqa tilda yozmasa, ruscha javob ber." : "");
  let answer = "";
  try { if (key) answer = (await askAI(String(key), sysL, hist)).replace(/\*\*/g, "").trim(); } catch (_) { answer = ""; }
  if (!answer) answer = faqMatch(text, sections(c, l));
  if (!answer) answer = TX[l].fallback;
  await Promise.all([
    tg(cfg.token, "sendMessage", { chat_id: chat, text: answer.slice(0, 4000), link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: TX[l].home, callback_data: "m" }, { text: TX[l].opShort, callback_data: "op" }]] } }),
    sb.from("tg_chat_log").insert([{ chat_id: chat, role: "user", text: text.slice(0, 1500) }, { chat_id: chat, role: "bot", text: answer.slice(0, 3000) }]),
  ]);
}

// ---------- Mutaxassis ----------
async function startOperator(cfg: any, chat: number, from: any, l: Lang, firstText?: string) {
  if (!cfg.admin_chat) {
    await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].opOffline, reply_markup: homeKb(l) });
    return;
  }
  await setUser(from, chat, { op_until: new Date(Date.now() + OP_HOURS * 3600e3).toISOString() });
  await tg(cfg.token, "sendMessage", { chat_id: chat, reply_markup: opKb(l), text: TX[l].opStart });
  const r = await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `🆕 Yangi murojaat\n👤 ${who(from, chat, l)}${firstText ? "\n\n" + firstText : ""}\n\n↩️ Javob berish uchun shu xabarga «Reply» qiling.` });
  if (r?.result?.message_id) await sb.from("tg_relay").upsert({ admin_msg_id: r.result.message_id, user_chat: chat });
}

async function relayToAdmin(cfg: any, msg: any, l: Lang) {
  const chat = msg.chat.id;
  const head = await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `👤 ${who(msg.from, chat, l)}${msg.text ? "\n\n" + msg.text : ""}` });
  const ids: number[] = [];
  if (head?.result?.message_id) ids.push(head.result.message_id);
  if (!msg.text) {
    const cp = await tg(cfg.token, "copyMessage", { chat_id: cfg.admin_chat, from_chat_id: chat, message_id: msg.message_id });
    if (cp?.result?.message_id) ids.push(cp.result.message_id);
  }
  if (ids.length) await sb.from("tg_relay").upsert(ids.map((id) => ({ admin_msg_id: id, user_chat: chat })));
  await setUser(msg.from, chat, { op_until: new Date(Date.now() + OP_HOURS * 3600e3).toISOString() });
  await tg(cfg.token, "setMessageReaction", { chat_id: chat, message_id: msg.message_id, reaction: [{ type: "emoji", emoji: "👌" }] });
}

async function adminReply(cfg: any, msg: any) {
  const ref = msg.reply_to_message?.message_id;
  if (!ref) {
    await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "ℹ️ Foydalanuvchiga javob berish uchun uning xabariga «Reply» (javob berish) qilib yozing." });
    return;
  }
  const { data: row } = await sb.from("tg_relay").select("user_chat").eq("admin_msg_id", ref).maybeSingle();
  if (!row) { await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "Bu xabar qaysi foydalanuvchiga tegishli ekanini topa olmadim." }); return; }
  const u = await getUser(row.user_chat);
  const l: Lang = u?.lang === "ru" ? "ru" : "uz";
  let ok: any;
  if (msg.text) ok = await tg(cfg.token, "sendMessage", { chat_id: row.user_chat, text: `${TX[l].opReply}\n\n${msg.text}` });
  else ok = await tg(cfg.token, "copyMessage", { chat_id: row.user_chat, from_chat_id: msg.chat.id, message_id: msg.message_id });
  await tg(cfg.token, "setMessageReaction", { chat_id: msg.chat.id, message_id: msg.message_id, reaction: [{ type: "emoji", emoji: ok?.ok ? "👍" : "👎" }] });
  if (!ok?.ok) await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "Yuborilmadi: foydalanuvchi botni bloklagan bo'lishi mumkin." });
}

async function endOperator(cfg: any, chat: number, from: any, l: Lang) {
  await setUser(from, chat, { op_until: null });
  await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].ended, reply_markup: homeKb(l) });
  await tg(cfg.token, "sendMessage", {
    chat_id: chat, text: TX[l].rateAsk,
    reply_markup: { inline_keyboard: [[1, 2, 3, 4, 5].map((n) => ({ text: `${n} ⭐`, callback_data: "r:" + n }))] },
  });
  if (cfg.admin_chat) await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `✅ Murojaat yakunlandi: ${who(from, chat, l)}` });
}

// ---------- Tugmalar (callback) ----------
async function handleCallback(cfg: any, q: any) {
  const chat = q.message?.chat?.id;
  const mid = q.message?.message_id;
  await tg(cfg.token, "answerCallbackQuery", { callback_query_id: q.id });
  if (!chat) return;
  const data = String(q.data || "");
  const u = await getUser(chat);
  const l: Lang = (u?.lang as Lang) || guessLang(q.from);

  if (data.startsWith("l:")) {
    const nl: Lang = data === "l:ru" ? "ru" : "uz";
    await setUser(q.from, chat, { lang: nl });
    await tg(cfg.token, "deleteMessage", { chat_id: chat, message_id: mid });
    await sendHome(cfg, chat, nl, q.from, true);
    return;
  }
  if (data === "lang") { await show(cfg, chat, mid, TX[l].pickLang, LANG_KB); return; }
  if (data === "op") { await startOperator(cfg, chat, q.from, l); return; }
  if (data.startsWith("r:")) {
    const n = Math.min(5, Math.max(1, Number(data.slice(2)) || 0));
    await sb.from("tg_ratings").insert({ chat_id: chat, rating: n });
    await show(cfg, chat, mid, TX[l].rated(n), { inline_keyboard: [] });
    if (cfg.admin_chat) await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `${"⭐".repeat(n)} (${n}/5) — baho: ${who(q.from, chat, l)}` });
    return;
  }

  const secs = sections(await cfgRow(), l);
  if (data === "m") { await show(cfg, chat, mid, TX[l].menuTitle, mainMenuKb(secs, l)); return; }
  if (data.startsWith("s:")) {
    const s = secs.find((x) => x.id === data.slice(2));
    if (!s) return;
    await show(cfg, chat, mid, `${s.title}\n\n${TX[l].sectionPick}`, {
      inline_keyboard: [...s.items.map(([qq], i) => [{ text: qq, callback_data: `q:${s.id}:${i}` }]), [{ text: TX[l].back, callback_data: "m" }]],
    });
    return;
  }
  if (data.startsWith("q:")) {
    const [, sid, idx] = data.split(":");
    const s = secs.find((x) => x.id === sid);
    const item = s?.items[Number(idx)];
    if (!s || !item) return;
    await show(cfg, chat, mid, `❓ ${item[0]}\n\n${item[1]}`, {
      inline_keyboard: [[{ text: TX[l].back, callback_data: "s:" + sid }, { text: TX[l].home, callback_data: "m" }], [{ text: TX[l].op, callback_data: "op" }]],
    });
  }
}

// ---------- Xabarlar ----------
async function handleUpdate(cfg: any, u: any) {
  if (u?.callback_query) { await handleCallback(cfg, u.callback_query); return; }
  const msg = u?.message;
  if (!msg?.chat?.id || msg.chat.type !== "private") return;
  const chat = msg.chat.id;
  const text = String(msg.text || "");
  const isAdminChat = cfg.admin_chat && Number(cfg.admin_chat) === chat;
  const usr = await getUser(chat);
  const l: Lang = (usr?.lang as Lang) || guessLang(msg.from);

  if (text.startsWith("/start")) {
    const tok = text.split(" ")[1] || "";
    if (tok.startsWith("op_")) {
      if (cfg.op_token && tok.slice(3) === cfg.op_token) {
        await sb.from("tg_settings").update({ admin_chat: chat, op_token: "" }).eq("id", 1);
        await tg(cfg.token, "sendMessage", { chat_id: chat, text: "✅ Siz mutaxassis sifatida ulandingiz.\n\nFoydalanuvchilar «Mutaxassis» ni bosganda murojaatlar shu yerga keladi. Javob berish uchun xabarga «Reply» qilib yozing.\n\nMijozlar baholari ham shu yerga keladi.", reply_markup: { remove_keyboard: true } });
      } else {
        await tg(cfg.token, "sendMessage", { chat_id: chat, text: "Havola eskirgan. Admin paneldan qaytadan oching." });
      }
      return;
    }
    if (/^[A-Za-z0-9_-]{24,64}$/.test(tok)) {
      await sb.from("tg_logins").upsert({ token: tok, chat_id: chat, used: false, created_at: new Date().toISOString() });
      await tg(cfg.token, "sendMessage", {
        chat_id: chat, text: TX[l].loginHello,
        reply_markup: { keyboard: [[{ text: TX[l].share, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
      });
      return;
    }
    await setUser(msg.from, chat);
    if (!usr?.lang) { await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX.uz.pickLang, reply_markup: LANG_KB }); return; }
    await sendHome(cfg, chat, l, msg.from, true);
    return;
  }

  if (msg.contact) {
    const c = msg.contact;
    if (c.user_id !== msg.from?.id) { await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].ownPhone }); return; }
    const { data: row } = await sb.from("tg_logins").select("*").eq("chat_id", chat).eq("used", false)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row || Date.now() - new Date(row.created_at).getTime() > TTL) {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].loginExpired, reply_markup: homeKb(l) });
      return;
    }
    const phone = String(c.phone_number || "").replace(/\D/g, "");
    if (phone.length < 9) return;
    const email = `p${phone}@tel.mohirbozor.uz`; // SMS bilan bir xil hisob
    const created = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { phone: "+" + phone, tg_id: msg.from.id } });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX[l].loginErr });
      return;
    }
    const { data: link } = await sb.auth.admin.generateLink({ type: "magiclink", email });
    const otp = link?.properties?.email_otp;
    if (!otp) return;
    await sb.from("tg_logins").update({ email, otp }).eq("token", row.token);
    await tg(cfg.token, "sendMessage", { chat_id: chat, parse_mode: "HTML", text: TX[l].loginOk(otp), reply_markup: homeKb(l) });
    return;
  }

  // Mutaxassis (admin) javobi
  if (isAdminChat && !text.startsWith("/")) { await adminReply(cfg, msg); return; }

  if (HOME_BTNS.includes(text) || ["/menu", "/savollar", "/yordam", "/help"].includes(text)) { await sendHome(cfg, chat, l); return; }
  if (text === "/mutaxassis") { await startOperator(cfg, chat, msg.from, l); return; }
  if (text === "/til" || text === "/lang") { await tg(cfg.token, "sendMessage", { chat_id: chat, text: TX.uz.pickLang, reply_markup: LANG_KB }); return; }
  if (END_BTNS.includes(text)) { await endOperator(cfg, chat, msg.from, l); return; }
  if (text.startsWith("/")) return;

  // Mutaxassis rejimida — xabar adminga boradi
  if (cfg.admin_chat && usr?.op_until && new Date(usr.op_until).getTime() > Date.now()) { await relayToAdmin(cfg, msg, l); return; }

  // "odam/operator bilan gaplashmoqchiman"
  if (/(mutaxassis|operator|odam bilan|admin bilan|jonli|оператор|специалист|человек)/i.test(text)) {
    await startOperator(cfg, chat, msg.from, l, text);
    return;
  }

  if (text) await support(cfg, chat, text, msg.from, l);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);
  try {
    const { data: cfg } = await sb.rpc("get_tg_settings");
    const secretHdr = req.headers.get("x-telegram-bot-api-secret-token");

    // 1) Telegram webhook
    if (secretHdr !== null) {
      if (!cfg?.token || secretHdr !== cfg.secret) return new Response("forbidden", { status: 403 });
      await handleUpdate(cfg, await req.json().catch(() => null));
      return new Response("ok");
    }

    const body = await req.json().catch(() => ({}));

    // 2) Ilova: kirish holati
    if (body.action === "status") {
      const tok = String(body.token || "");
      if (!/^[A-Za-z0-9_-]{24,64}$/.test(tok)) return json({ error: "token" }, 400);
      const { data: row } = await sb.from("tg_logins").select("*").eq("token", tok).maybeSingle();
      if (!row || row.used || Date.now() - new Date(row.created_at).getTime() > TTL) return json({ ready: false, expired: !!row });
      if (!row.otp) return json({ ready: false, opened: !!row.chat_id });
      await sb.from("tg_logins").update({ used: true }).eq("token", tok);
      return json({ ready: true, email: row.email, otp: row.otp });
    }

    // 3) Admin: webhookni o'rnatish
    if (body.action === "setup") {
      const auth = req.headers.get("authorization") || "";
      const userSb = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
      const { data: isAdmin } = await userSb.rpc("is_admin");
      if (!isAdmin) return json({ error: "Ruxsat yo'q" }, 403);
      if (!cfg?.token) return json({ error: "Bot tokeni kiritilmagan" }, 400);
      const me = await tg(cfg.token, "getMe", {});
      if (!me?.ok) return json({ error: "Bot tokeni noto'g'ri" }, 400);
      const wh = await tg(cfg.token, "setWebhook", {
        url: `${URL_}/functions/v1/tg-bot`, secret_token: cfg.secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true,
      });
      if (!wh?.ok) return json({ error: "Webhook o'rnatilmadi: " + (wh?.description || "") }, 400);
      await sb.from("tg_settings").update({ bot_username: me.result.username }).eq("id", 1);
      await sb.from("config").update({ tg_bot: me.result.username }).eq("id", 1);
      // Nomi, tavsifi, rasmi va buyruqlari alohida o'rnatilgan (dns-check workflow) — bu yerda o'zgartirilmaydi
      await sb.from("tg_logins").delete().lt("created_at", new Date(Date.now() - 86400e3).toISOString());
      return json({ ok: true, username: me.result.username });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
