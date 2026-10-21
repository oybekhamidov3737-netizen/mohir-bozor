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
      await tg(cfg.token, "sendMessage", { chat_id: chat, text: `Mohir bozor — ijodkorlar bozori.\nIlovaga kirish: ${SITE}` });
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
      await sb.from("tg_logins").delete().lt("created_at", new Date(Date.now() - 86400e3).toISOString());
      return json({ ok: true, username: me.result.username });
    }

    return json({ error: "action" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
