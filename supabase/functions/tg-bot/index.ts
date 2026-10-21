// Telegram bot (webhook) + ilova uchun kirish holati.
//  • Telegram -> POST (sarlavhada maxfiy kalit): /start <token> -> raqamni ulashish tugmasi -> kontakt -> kirish kodi
//  • Ilova   -> POST {action:'status', token}  -> {email, otp} (bir marta) — avtomatik kirish
//  • Admin   -> POST {action:'setup'} (admin JWT bilan) -> webhookni o'rnatish
// Bot tokeni bazadagi tg_settings jadvalida (bu faylda yo'q).
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

async function tg(token: string, method: string, body: unknown) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return r.json().catch(() => ({}));
}


// ---------- Sun'iy intellekt (support) ----------
async function knowledge() {
  const { data: c } = await sb.from("config").select("prices,free_ads,slot_pack,promo_days,ad_days").eq("id", 1).maybeSingle();
  const p = c?.prices || {};
  const so = (n: number) => `${Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
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
Inson (mutaxassis) bilan bog'lanish: shu botda "👨‍💼 Mutaxassis bilan bog'lanish" tugmasi yoki ilovada Kabinet -> Yordam. Telefon raqam yo'q. Javobni bilmasang yoki muammo (to'lov, xato, shikoyat) bo'lsa mutaxassis tugmasini bosishni tavsiya qil.
Qoidalar: oddiy matn (Markdown, ** belgilari ishlatma; ro'yxat uchun • yoki 1) ishlat). Oddiy savolga qisqa (2-4 gap), maslahat so'ralsa batafsil va aniq (raqamlar, misollar, qadamlar bilan) javob ber. Samimiy, jonli, robotdek emas. Oldingi xabarlarni hisobga ol. "Men botman, tayyorman" kabi bo'sh gaplarni takrorlama, foydalanuvchi qaysi tilda yozsa o'sha tilda (o'zbek lotin, o'zbek kirill, rus, ingliz) javob ber. Bilmagan narsangni to'qima — "Kabinet -> Yordam" ga yozishni tavsiya qil. Shaxsiy ma'lumot, parol, karta raqami so'rama. Narxlar va qoidalarni faqat yuqoridagi ma'lumotdan ol, o'ylab topma.`;
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
  // Tezkor model birinchi (fikrlash o'chirilgan), band bo'lsa keyingisi
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


// Kalitsiz ishlaydigan oddiy javoblar (AI ulanmagan yoki javob bermasa)
async function faqAnswer(text: string) {
  const t = text.toLowerCase();
  const { data: c } = await sb.from("config").select("prices,free_ads,slot_pack,promo_days,ad_days").eq("id", 1).maybeSingle();
  const p = c?.prices || {};
  const so = (n: number) => `${Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const out: string[] = [];
  if (has("narx", "qancha", "nech pul", "necha pul", "цена", "сколько", "стоим", "price", "cost", "top", "vip", "ко'тар", "kotar", "ko'tar", "поднят")) {
    out.push(`💰 Narxlar:\n• TOP — ${so(p.top)} (${c?.promo_days ?? 7} kun qidiruv tepasida)\n• VIP — ${so(p.vip)} (${c?.promo_days ?? 7} kun bosh sahifada, oltin ramka)\n• Ko'tarish — ${so(p.bump)}\n• Uzaytirish — ${so(p.extend)}\n• Tiklash — ${so(p.restore)}\n• +${c?.slot_pack ?? 5} ta e'lon joyi — ${so(p.slots)}\nOddiy e'lon joylash bepul (${c?.free_ads ?? 5} tagacha).`);
  }
  if (has("joyla", "e'lon ber", "elon ber", "e'lon qo", "elon qo", "разместить", "объявлен", "post", "listing")) {
    out.push(`📝 E'lon joylash: ilovada pastdagi «+» tugmasi → kategoriya, sarlavha, tavsif, narx, hudud va rasmlar → «Joylash». Bepul, ${c?.free_ads ?? 5} tagacha faol e'lon, har biri ${c?.ad_days ?? 30} kun turadi.`);
  }
  if (has("to'lov", "tolov", "payme", "click", "karta", "оплат", "плат", "pay")) {
    out.push("💳 To'lov Payme orqali (Uzcard/Humo). To'lovdan keyin xizmat darhol avtomatik yoqiladi. Kabinetda hisobni to'ldirib, balansdan ham to'lash mumkin.");
  }
  if (has("qaytar", "возврат", "вернуть", "refund")) {
    out.push("↩️ Xizmat yoqilgach pul qaytarilmaydi. Texnik xato yoki pul ikki marta yechilgan bo'lsa — 14 kun ichida Kabinet → Yordam ga yozing, 10 ish kunida qaytariladi.");
  }
  if (has("kir", "login", "parol", "kod", "войти", "вход", "код", "пароль")) {
    out.push(`🔐 Kirish: saytda «Telegram orqali kirish» (raqamni ulashasiz) yoki Gmail/iCloud pochtaga keladigan kod bilan. Parol kerak emas. ${SITE}`);
  }
  if (has("telegram", "instagram", "kontakt", "raqam yoz", "контакт", "номер")) {
    out.push("ℹ️ E'longa tashqi kontakt (Telegram, Instagram, WhatsApp, @username) yozib bo'lmaydi — mijozlar ilova ichidagi chat orqali yozadi.");
  }
  if (has("baho", "reyting", "отзыв", "рейтинг", "review")) {
    out.push("⭐ Baholarni faqat ijodkor bilan chatda yozishgan foydalanuvchilar qoldira oladi: chatdagi «…» → «Baho qoldirish».");
  }
  if (has("salom", "assalom", "привет", "здравств", "hello")) {
    out.push("👋 Assalomu alaykum! Ilova haqida savolingizni yozing: narxlar, e'lon joylash, to'lov, kirish...");
  }
  if (!out.length) return "";
  return out.join("\n\n") + `\n\nBoshqa savol bo'lsa — yozing. Inson bilan: ${SITE} → Kabinet → Yordam.`;
}

const FALLBACK = `Savolingiz uchun rahmat! Javobni ilovadagi qo'llab-quvvatlashdan olasiz: ${SITE} → Kabinet → Yordam.`;

async function support(cfg: any, chat: number, text: string) {
  const since = new Date(Date.now() - 86400e3).toISOString();
  const { count } = await sb.from("tg_chat_log").select("id", { count: "exact", head: true }).eq("chat_id", chat).eq("role", "user").gt("created_at", since);
  if ((count || 0) >= 30) {
    await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Bugungi savollar limiti tugadi. Ertaga yozing yoki ${SITE} → Kabinet → Yordam.` });
    return;
  }
  const [, { data: prev }, { data: key }, sys] = await Promise.all([
    tg(cfg.token, "sendChatAction", { chat_id: chat, action: "typing" }),
    sb.from("tg_chat_log").select("role,text").eq("chat_id", chat).order("id", { ascending: false }).limit(16),
    sb.rpc("get_ai_key"),
    knowledge(),
  ]);
  const hist = [...(prev || []).reverse(), { role: "user", text: text.slice(0, 1500) }];
  while (hist.length && hist[0].role !== "user") hist.shift();
  let answer = "";
  try { if (key) answer = (await askAI(String(key), sys, hist)).replace(/\*\*/g, "").trim(); } catch (_) { answer = ""; }
  if (!answer) answer = await faqAnswer(text);
  if (!answer) answer = FALLBACK;
  await Promise.all([
    tg(cfg.token, "sendMessage", { chat_id: chat, text: answer.slice(0, 4000), link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: "📋 Savollar", callback_data: "faq" }, { text: "👨‍💼 Mutaxassis", callback_data: "op" }]] } }),
    sb.from("tg_chat_log").insert([{ chat_id: chat, role: "user", text: text.slice(0, 1500) }, { chat_id: chat, role: "bot", text: answer.slice(0, 3000) }]),
  ]);
}

// ---------- Shablon savollar va mutaxassis ----------
const BTN_FAQ = "📋 Ko'p so'raladigan savollar";
const BTN_OP = "👨‍💼 Mutaxassis bilan bog'lanish";
const BTN_END = "✅ Murojaatni yakunlash";
const MENU = { keyboard: [[{ text: BTN_FAQ }], [{ text: BTN_OP }]], resize_keyboard: true, is_persistent: true };
const OP_MENU = { keyboard: [[{ text: BTN_END }]], resize_keyboard: true, is_persistent: true };
const OP_HOURS = 24;

async function faqList() {
  const { data: c } = await sb.from("config").select("prices,free_ads,slot_pack,promo_days,ad_days").eq("id", 1).maybeSingle();
  const p = c?.prices || {};
  const so = (n: number) => `${Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ")} so'm`;
  const d = c?.promo_days ?? 7;
  return [
    ["Mohir bozor nima?", `Mohir bozor — O'zbekistondagi ijodkorlar bozori: SMM, video montaj, mobilografiya, dizayn, target reklama, kopirayting, fotograf va boshqa xizmatlar. Ijodkor xizmatini joylaydi, mijoz uni topib, ilova ichidagi chatda yozadi.\n\n${SITE}`],
    ["Qanday ro'yxatdan o'taman?", `Saytga kiring (${SITE}) → «Kirish». Ikki yo'l bor:\n• «Telegram orqali kirish» — botda raqamingizni ulashasiz, kirish avtomatik bo'ladi.\n• Gmail/iCloud pochta — pochtaga 6 xonali kod keladi.\nParol kerak emas.`],
    ["E'lon qanday joylanadi?", `Pastdagi «+» tugmasi → kategoriya, sarlavha, tavsif, narx, hudud va rasmlar → «Joylash». E'lon darhol ko'rinadi.\n\nBepul: ${c?.free_ads ?? 5} tagacha faol e'lon, har biri ${c?.ad_days ?? 30} kun turadi.`],
    ["E'lon joylash pullikmi?", `Yo'q, oddiy e'lon bepul (${c?.free_ads ?? 5} tagacha). Pullik xizmatlar faqat e'lonni ko'proq odamga ko'rsatish uchun: TOP, VIP, Ko'tarish.\nKo'proq e'lon kerak bo'lsa: +${c?.slot_pack ?? 5} ta joy — ${so(p.slots)}.`],
    ["TOP va VIP nima, narxi qancha?", `• TOP — ${so(p.top)}: e'lon ${d} kun qidiruv natijalari tepasida turadi.\n• VIP — ${so(p.vip)}: ${d} kun bosh sahifada oltin ramka bilan alohida blokda.\n• Ko'tarish — ${so(p.bump)}: e'lon bir martada ro'yxat boshiga chiqadi.\n\nE'loningizni oching → «Reklama» tugmasi.`],
    ["Qanday to'lov qilaman?", "To'lov Payme orqali (Uzcard yoki Humo karta). To'lovdan keyin xizmat darhol avtomatik yoqiladi.\nKabinetda hisobni oldindan to'ldirib, balansdan ham to'lash mumkin."],
    ["To'lov qildim, xizmat yoqilmadi", "Odatda xizmat bir necha soniyada yoqiladi. Sahifani yangilang. 10 daqiqada yoqilmasa — pastdagi «👨‍💼 Mutaxassis bilan bog'lanish» tugmasini bosing va to'lov chekini (skrinshot) yuboring."],
    ["Pulni qaytarish mumkinmi?", "Xizmat yoqilgandan keyin pul qaytarilmaydi. Agar texnik xato bo'lsa yoki pul ikki marta yechilgan bo'lsa — 14 kun ichida mutaxassisga yozing, pul 10 ish kunida kartangizga qaytariladi."],
    ["Nega e'lonimga Telegram/Instagram yozib bo'lmaydi?", "Xavfsizlik uchun: tashqi kontaktlar (Telegram, Instagram, WhatsApp, @username, telefon) e'longa yozilmaydi. Mijozlar sizga ilova ichidagi chat orqali yozadi — bu firibgarlikdan himoya qiladi."],
    ["E'lonim nega o'chirildi?", "Bozor faqat ijodiy xizmatlar uchun (SMM, montaj, dizayn, marketing va h.k.). Ko'chmas mulk, kredit, kazino, mahsulot sotish kabi e'lonlar va tashqi kontakt yozilgan e'lonlar o'chiriladi. Savol bo'lsa — mutaxassisga yozing."],
    ["Mijozlar meni qanday topadi?", `Mijozlar kategoriya, hudud va qidiruv orqali topadi. Ko'proq mijoz uchun:\n• Sifatli rasmlar va portfolio qo'ying\n• Tavsifda aniq nima qilishingiz va narxni yozing\n• Profilni to'ldiring\n• TOP yoki VIP bilan e'lonni oldinga chiqaring`],
    ["Buyurtmachi sifatida ijodkor qanday topaman?", "Bosh sahifada kategoriya tanlang yoki qidiruvdan foydalaning, e'lonni ochib «Yozish» tugmasini bosing. Yoki o'zingiz «Buyurtma» e'loni joylang — ijodkorlar sizga o'zlari taklif yuboradi."],
    ["Baho (reyting) qanday qoldiriladi?", "Baho faqat ijodkor bilan chatda yozishgan foydalanuvchilar qoldira oladi: chatni oching → yuqoridagi «…» → «Baho qoldirish»."],
    ["Firibgarga duch keldim", "Chatdagi «…» → «Shikoyat qilish» ni bosing va mutaxassisga yozing. Maslahat: oldindan to'liq pul o'tkazmang, ishni bosqichma-bosqich to'lang va hamma kelishuvni ilova chatida qiling."],
    ["Hisobimni qanday o'chiraman?", "Kabinet → Sozlamalar → Hisob → «Hisobni o'chirish». Profil, e'lonlar va yozishmalar o'chiriladi."],
  ] as [string, string][];
}

async function sendFaqMenu(cfg: any, chat: number, intro?: string) {
  const list = await faqList();
  await tg(cfg.token, "sendMessage", {
    chat_id: chat, text: intro || "📋 Savolingizni tanlang:",
    reply_markup: { inline_keyboard: [...list.map(([q], i) => [{ text: q, callback_data: "f:" + i }]), [{ text: BTN_OP, callback_data: "op" }]] },
  });
}

async function setUser(from: any, chat: number, patch: Record<string, unknown> = {}) {
  await sb.from("tg_users").upsert({
    chat_id: chat, name: [from?.first_name, from?.last_name].filter(Boolean).join(" ").slice(0, 80),
    username: String(from?.username || ""), updated_at: new Date().toISOString(), ...patch,
  });
}

const who = (from: any, chat: number) => {
  const n = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
  return `${n}${from?.username ? " @" + from.username : ""} · ID ${chat}`;
};

async function startOperator(cfg: any, chat: number, from: any, firstText?: string) {
  if (!cfg.admin_chat) {
    await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Mutaxassis hozir Telegramda ulanmagan. Iltimos, ilovada yozing: ${SITE} → Kabinet → Yordam.`, reply_markup: MENU });
    return;
  }
  await setUser(from, chat, { op_until: new Date(Date.now() + OP_HOURS * 3600e3).toISOString() });
  await tg(cfg.token, "sendMessage", {
    chat_id: chat, reply_markup: OP_MENU,
    text: "👨‍💼 Siz mutaxassis bilan bog'landingiz.\n\nSavolingizni batafsil yozing (rasm yoki skrinshot ham yuborsa bo'ladi). Mutaxassis shu yerda javob beradi.\n\nTugatgach «✅ Murojaatni yakunlash» ni bosing.",
  });
  const r = await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `🆕 Yangi murojaat\n👤 ${who(from, chat)}${firstText ? "\n\n" + firstText : ""}\n\n↩️ Javob berish uchun shu xabarga «Reply» qiling.` });
  if (r?.result?.message_id) await sb.from("tg_relay").upsert({ admin_msg_id: r.result.message_id, user_chat: chat });
}

async function relayToAdmin(cfg: any, msg: any) {
  const chat = msg.chat.id;
  const head = await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `👤 ${who(msg.from, chat)}${msg.text ? "\n\n" + msg.text : ""}` });
  const ids: number[] = [];
  if (head?.result?.message_id) ids.push(head.result.message_id);
  if (!msg.text) {
    const cp = await tg(cfg.token, "copyMessage", { chat_id: cfg.admin_chat, from_chat_id: chat, message_id: msg.message_id });
    if (cp?.result?.message_id) ids.push(cp.result.message_id);
  }
  if (ids.length) await sb.from("tg_relay").upsert(ids.map((id) => ({ admin_msg_id: id, user_chat: chat })));
  await setUser(msg.from, chat, { op_until: new Date(Date.now() + OP_HOURS * 3600e3).toISOString() });
}

async function adminReply(cfg: any, msg: any) {
  const ref = msg.reply_to_message?.message_id;
  if (!ref) {
    await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "ℹ️ Foydalanuvchiga javob berish uchun uning xabariga «Reply» (javob berish) qilib yozing." });
    return;
  }
  const { data: row } = await sb.from("tg_relay").select("user_chat").eq("admin_msg_id", ref).maybeSingle();
  if (!row) { await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "Bu xabar qaysi foydalanuvchiga tegishli ekanini topa olmadim." }); return; }
  let ok: any;
  if (msg.text) ok = await tg(cfg.token, "sendMessage", { chat_id: row.user_chat, text: "👨‍💼 Mutaxassis:\n\n" + msg.text });
  else ok = await tg(cfg.token, "copyMessage", { chat_id: row.user_chat, from_chat_id: msg.chat.id, message_id: msg.message_id });
  await tg(cfg.token, "setMessageReaction", { chat_id: msg.chat.id, message_id: msg.message_id, reaction: [{ type: "emoji", emoji: ok?.ok ? "👍" : "👎" }] });
  if (!ok?.ok) await tg(cfg.token, "sendMessage", { chat_id: msg.chat.id, text: "Yuborilmadi: foydalanuvchi botni bloklagan bo'lishi mumkin." });
}

async function handleCallback(cfg: any, q: any) {
  const chat = q.message?.chat?.id;
  await tg(cfg.token, "answerCallbackQuery", { callback_query_id: q.id });
  if (!chat) return;
  const data = String(q.data || "");
  if (data === "op") { await startOperator(cfg, chat, q.from); return; }
  if (data === "faq") { await sendFaqMenu(cfg, chat); return; }
  if (data.startsWith("f:")) {
    const list = await faqList();
    const item = list[Number(data.slice(2))];
    if (!item) return;
    await tg(cfg.token, "sendMessage", {
      chat_id: chat, text: `❓ ${item[0]}\n\n${item[1]}`, link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: "📋 Boshqa savollar", callback_data: "faq" }], [{ text: BTN_OP, callback_data: "op" }]] },
    });
  }
}

async function handleUpdate(cfg: any, u: any) {
  if (u?.callback_query) { await handleCallback(cfg, u.callback_query); return; }
  const msg = u?.message;
  if (!msg?.chat?.id || msg.chat.type !== "private") return;
  const chat = msg.chat.id;
  const text = String(msg.text || "");
  const isAdminChat = cfg.admin_chat && Number(cfg.admin_chat) === chat;

  if (text.startsWith("/start")) {
    const tok = text.split(" ")[1] || "";
    if (tok.startsWith("op_")) {
      if (cfg.op_token && tok.slice(3) === cfg.op_token) {
        await sb.from("tg_settings").update({ admin_chat: chat, op_token: "" }).eq("id", 1);
        await tg(cfg.token, "sendMessage", { chat_id: chat, text: "✅ Siz mutaxassis sifatida ulandingiz.\n\nFoydalanuvchilar «Mutaxassis bilan bog'lanish» ni bosganda murojaatlar shu yerga keladi. Javob berish uchun xabarga «Reply» qilib yozing.", reply_markup: { remove_keyboard: true } });
      } else {
        await tg(cfg.token, "sendMessage", { chat_id: chat, text: "Havola eskirgan. Admin paneldan qaytadan oching." });
      }
      return;
    }
    if (/^[A-Za-z0-9_-]{24,64}$/.test(tok)) {
      await sb.from("tg_logins").upsert({ token: tok, chat_id: chat, used: false, created_at: new Date().toISOString() });
      await tg(cfg.token, "sendMessage", {
        chat_id: chat,
        text: "👋 Mohir bozor'ga xush kelibsiz!\n\nKirish uchun pastdagi «📱 Raqamni ulashish» tugmasini bosing.",
        reply_markup: { keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
      });
      return;
    }
    await setUser(msg.from, chat);
    await tg(cfg.token, "sendMessage", { chat_id: chat, reply_markup: MENU, text: `👋 Assalomu alaykum! Men Mohir bozor yordamchisiman.\n\nSavolingizni yozing yoki pastdan tanlang. Javob topilmasa — mutaxassis bilan bog'laning.\n\nIlova: ${SITE}`, link_preview_options: { is_disabled: true } });
    await sendFaqMenu(cfg, chat);
    return;
  }

  if (msg.contact) {
    const c = msg.contact;
    if (c.user_id !== msg.from?.id) {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: "Iltimos, o'zingizning raqamingizni ulashing (pastdagi tugma orqali)." });
      return;
    }
    const { data: row } = await sb.from("tg_logins").select("*").eq("chat_id", chat).eq("used", false)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!row || Date.now() - new Date(row.created_at).getTime() > TTL) {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Kirish so'rovi eskirgan. Ilovada «Telegram orqali kirish» ni qayta bosing: ${SITE}`, reply_markup: MENU });
      return;
    }
    const phone = String(c.phone_number || "").replace(/\D/g, "");
    if (phone.length < 9) return;
    const email = `p${phone}@tel.mohirbozor.uz`; // SMS bilan bir xil hisob
    const created = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { phone: "+" + phone, tg_id: msg.from.id } });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring." });
      return;
    }
    const { data: link } = await sb.auth.admin.generateLink({ type: "magiclink", email });
    const otp = link?.properties?.email_otp;
    if (!otp) return;
    await sb.from("tg_logins").update({ email, otp }).eq("token", row.token);
    await tg(cfg.token, "sendMessage", {
      chat_id: chat, parse_mode: "HTML",
      text: `✅ Tayyor! Ilovaga qayting — kirish avtomatik bo'ladi.\n\nAgar so'ralsa, kod: <code>${otp}</code>\nKodni hech kimga bermang.`,
      reply_markup: MENU,
    });
    return;
  }

  // Mutaxassis (admin) javobi
  if (isAdminChat && !text.startsWith("/")) { await adminReply(cfg, msg); return; }

  if (text === BTN_FAQ || text === "/savollar") { await sendFaqMenu(cfg, chat); return; }
  if (text === BTN_OP || text === "/mutaxassis") { await startOperator(cfg, chat, msg.from); return; }
  if (text === BTN_END) {
    await setUser(msg.from, chat, { op_until: null });
    await tg(cfg.token, "sendMessage", { chat_id: chat, text: "✅ Murojaat yakunlandi. Rahmat! Yana savol bo'lsa — yozing.", reply_markup: MENU });
    if (cfg.admin_chat) await tg(cfg.token, "sendMessage", { chat_id: cfg.admin_chat, text: `✅ Murojaat yakunlandi: ${who(msg.from, chat)}` });
    return;
  }
  if (text === "/yordam" || text === "/help") { await sendFaqMenu(cfg, chat, "Savolingizni yozing yoki ro'yxatdan tanlang:"); return; }
  if (text.startsWith("/")) return;

  // Mutaxassis rejimida — xabar adminga boradi
  const { data: tu } = await sb.from("tg_users").select("op_until").eq("chat_id", chat).maybeSingle();
  if (cfg.admin_chat && tu?.op_until && new Date(tu.op_until).getTime() > Date.now()) {
    await relayToAdmin(cfg, msg);
    await tg(cfg.token, "setMessageReaction", { chat_id: chat, message_id: msg.message_id, reaction: [{ type: "emoji", emoji: "👌" }] });
    return;
  }

  // "odam/operator bilan gaplashmoqchiman"
  if (/(mutaxassis|operator|odam bilan|admin bilan|jonli|оператор|специалист|человек)/i.test(text)) {
    await startOperator(cfg, chat, msg.from, text);
    return;
  }

  if (text) await support(cfg, chat, text);
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
      await tg(cfg.token, "setMyDescription", { description: "Mohir bozor — ijodkorlar bozori. Ilovaga Telegram orqali tez va xavfsiz kirish." });
      await tg(cfg.token, "setMyCommands", { commands: [{ command: "start", description: "Boshlash" }, { command: "savollar", description: "Ko'p so'raladigan savollar" }, { command: "mutaxassis", description: "Mutaxassis bilan bog'lanish" }] });
      await sb.from("tg_logins").delete().lt("created_at", new Date(Date.now() - 86400e3).toISOString());
      return json({ ok: true, username: me.result.username });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
