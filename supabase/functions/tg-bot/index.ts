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
Inson bilan bog'lanish: ilovada Kabinet -> Yordam (support chat). Telefon raqam yo'q, qo'ng'iroq markazi yo'q.
Qoidalar: oddiy matn (Markdown, ** belgilari ishlatma; ro'yxat uchun • yoki 1) ishlat). Oddiy savolga qisqa (2-4 gap), maslahat so'ralsa batafsil va aniq (raqamlar, misollar, qadamlar bilan) javob ber. Samimiy, jonli, robotdek emas. Oldingi xabarlarni hisobga ol. "Men botman, tayyorman" kabi bo'sh gaplarni takrorlama, foydalanuvchi qaysi tilda yozsa o'sha tilda (o'zbek lotin, o'zbek kirill, rus, ingliz) javob ber. Bilmagan narsangni to'qima — "Kabinet -> Yordam" ga yozishni tavsiya qil. Shaxsiy ma'lumot, parol, karta raqami so'rama. Narxlar va qoidalarni faqat yuqoridagi ma'lumotdan ol, o'ylab topma.`;
}

async function askAI(key: string, sys: string, hist: { role: string; text: string }[]) {
  if (key.startsWith("sk-ant-")) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 500, system: sys,
        messages: hist.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })) }),
    });
    const j = await r.json().catch(() => ({}));
    return (j?.content?.[0]?.text as string) || "";
  }
  for (const model of ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"]) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] },
        contents: hist.map((m) => ({ role: m.role === "bot" ? "model" : "user", parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 } }),
    });
    const j = await r.json().catch(() => ({}));
    const t = j?.candidates?.[0]?.content?.parts?.map((x: any) => x.text).join("") || "";
    if (t) return t;
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
  await tg(cfg.token, "sendChatAction", { chat_id: chat, action: "typing" });
  const { data: prev } = await sb.from("tg_chat_log").select("role,text").eq("chat_id", chat).order("id", { ascending: false }).limit(16);
  const hist = [...(prev || []).reverse(), { role: "user", text: text.slice(0, 1500) }];
  while (hist.length && hist[0].role !== "user") hist.shift();
  const { data: key } = await sb.rpc("get_ai_key");
  let answer = "";
  try { if (key) answer = (await askAI(String(key), await knowledge(), hist)).replace(/\*\*/g, "").trim(); } catch (_) { answer = ""; }
  if (!answer) answer = await faqAnswer(text);
  if (!answer) answer = FALLBACK;
  await sb.from("tg_chat_log").insert([{ chat_id: chat, role: "user", text: text.slice(0, 1500) }, { chat_id: chat, role: "bot", text: answer.slice(0, 3000) }]);
  await tg(cfg.token, "sendMessage", { chat_id: chat, text: answer.slice(0, 4000), link_preview_options: { is_disabled: true } });
}

async function handleUpdate(cfg: any, u: any) {
  const msg = u?.message;
  if (!msg?.chat?.id) return;
  const chat = msg.chat.id;
  const text = String(msg.text || "");

  if (text.startsWith("/start")) {
    const tok = text.split(" ")[1] || "";
    if (/^[A-Za-z0-9_-]{24,64}$/.test(tok)) {
      await sb.from("tg_logins").upsert({ token: tok, chat_id: chat, used: false, created_at: new Date().toISOString() });
      await tg(cfg.token, "sendMessage", {
        chat_id: chat,
        text: "👋 Mohir bozor'ga xush kelibsiz!\n\nKirish uchun pastdagi «📱 Raqamni ulashish» tugmasini bosing.",
        reply_markup: { keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
      });
    } else {
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: `👋 Assalomu alaykum! Men Mohir bozor yordamchisiman.\n\nIlova haqida istalgan savolingizni yozing — e'lon joylash, narxlar, to'lov, TOP/VIP va boshqalar.\n\nIlova: ${SITE}` });
    }
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
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Kirish so'rovi eskirgan. Ilovada «Telegram orqali kirish» ni qayta bosing: ${SITE}`, reply_markup: { remove_keyboard: true } });
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
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (text && !text.startsWith("/")) await support(cfg, chat, text);
  else if (text === "/yordam" || text === "/help") {
    await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Savolingizni oddiy xabar qilib yozing — javob beraman.\nInson bilan bog'lanish: ${SITE} → Kabinet → Yordam.` });
  }
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
        url: `${URL_}/functions/v1/tg-bot`, secret_token: cfg.secret, allowed_updates: ["message"], drop_pending_updates: true,
      });
      if (!wh?.ok) return json({ error: "Webhook o'rnatilmadi: " + (wh?.description || "") }, 400);
      await sb.from("tg_settings").update({ bot_username: me.result.username }).eq("id", 1);
      await sb.from("config").update({ tg_bot: me.result.username }).eq("id", 1);
      await tg(cfg.token, "setMyDescription", { description: "Mohir bozor — ijodkorlar bozori. Ilovaga Telegram orqali tez va xavfsiz kirish." });
      await tg(cfg.token, "setMyCommands", { commands: [{ command: "start", description: "Boshlash" }, { command: "yordam", description: "Yordam" }] });
      await sb.from("tg_logins").delete().lt("created_at", new Date(Date.now() - 86400e3).toISOString());
      return json({ ok: true, username: me.result.username });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
