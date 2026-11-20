// Supabase Edge Function: bildirishnomalar.
//  • type=message — yangi xabar kelganda qabul qiluvchiga pochta yoki Telegram orqali xabar
//    (ilovada onlayn bo'lsa yoki 30 daqiqa ichida shu suhbat bo'yicha xabar berilgan bo'lsa — yuborilmaydi).
//  • type=expiry  — e'lon muddati 3 kun ichida tugasa yoki kecha tugagan bo'lsa (kuniga bir marta chaqiriladi).
// Chaqiruv faqat bazadagi maxfiy kalit (x-notify-secret) bilan qabul qilinadi.
// Telegram orqali kirganlar (p<raqam>@tel.mohirbozor.uz) — botdan, qolganlar — pochtadan xabar oladi.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SITE = "https://mohirbozor.uz";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s: unknown, n: number) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length > n ? x.slice(0, n - 1).trimEnd() + "…" : x; };
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const dayText = (iso: string) => { const d = new Date(new Date(iso).getTime() + 5 * 3600e3); return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}`; };

// ---------- Yuborish kanallari ----------
let mailCfg: any = null, tgCfg: any = null;
async function sendMail(to: string, subject: string, title: string, lines: string[], button: [string, string]) {
  if (!mailCfg) mailCfg = (await sb.rpc("get_mail_settings")).data;
  if (!mailCfg?.smtp_user) return false;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#141D19">
<div style="display:inline-block;background:#1E48D6;color:#fff;font-weight:800;border-radius:10px;padding:6px 12px;font-size:16px">mohir</div>
<h2 style="margin:20px 0 10px;font-size:20px">${esc(title)}</h2>
${lines.map((l) => `<p style="margin:0 0 10px;color:#33403A;font-size:15px;line-height:1.5">${l}</p>`).join("")}
<a href="${esc(button[1])}" style="display:inline-block;margin-top:8px;background:#1E48D6;color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 20px">${esc(button[0])}</a>
<p style="margin:24px 0 0;color:#8A938E;font-size:12px;line-height:1.5">Bunday xabarlarni ilovada Kabinet → Sozlamalar → «Bildirishnomalar» orqali o'chirishingiz mumkin.<br>Уведомления можно отключить: Кабинет → Настройки → «Уведомления».</p>
</div>`;
  const text = `${title}\n\n${lines.map((l) => l.replace(/<[^>]+>/g, "")).join("\n")}\n\n${button[0]}: ${button[1]}`;
  const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: mailCfg.smtp_user, pass: mailCfg.smtp_pass } });
  await tr.sendMail({ from: `"Mohir bozor" <${mailCfg.smtp_user}>`, to, subject, text, html });
  return true;
}

async function sendTg(chatId: number, text: string, button: [string, string]) {
  if (!tgCfg) tgCfg = (await sb.rpc("get_tg_settings")).data;
  if (!tgCfg?.token) return false;
  const r = await fetch(`https://api.telegram.org/bot${tgCfg.token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: button[0], url: button[1] }]] } }),
  }).then((x) => x.json()).catch(() => null);
  return !!r?.ok;
}

// Foydalanuvchiga uning kirish usuliga qarab yuborish
async function deliver(userId: string, mail: { subject: string; title: string; lines: string[] }, tgText: string, button: [string, string]) {
  try {
    const { data: pp } = await sb.from("profile_private").select("notify").eq("id", userId).maybeSingle();
    if (pp && pp.notify === false) return "off";
    const { data: u } = await sb.auth.admin.getUserById(userId);
    const email = String(u?.user?.email || "");
    if (/@tel\.mohirbozor\.uz$/i.test(email)) {
      const tgId = Number(u?.user?.user_metadata?.tg_id || 0);
      return tgId && await sendTg(tgId, tgText, button) ? "tg" : "no-tg";
    }
    if (!email) return "no-email";
    return await sendMail(email, mail.subject, mail.title, mail.lines, button) ? "mail" : "no-mail";
  } catch (e) {
    console.log("deliver error", (e as Error)?.message);
    return "error";
  }
}

// ---------- Yangi xabar ----------
async function onMessage(id: number) {
  const { data: m } = await sb.from("messages").select("id,thread_id,sender_id,body").eq("id", id).maybeSingle();
  if (!m) return { skip: "message" };
  const { data: th } = await sb.from("threads").select("id,ad_id,buyer_id,seller_id,ads(title)").eq("id", m.thread_id).maybeSingle();
  if (!th) return { skip: "thread" };
  const to = m.sender_id === th.buyer_id ? th.seller_id : th.buyer_id;
  if (!to || to === m.sender_id) return { skip: "self" };

  // Qabul qiluvchi hozir ilovada bo'lsa — xabarni o'zi ko'radi
  const { data: rp } = await sb.from("profiles").select("last_seen").eq("id", to).maybeSingle();
  if (rp?.last_seen && Date.now() - Date.parse(rp.last_seen) < 2 * 60e3) return { skip: "online" };

  const key = `msg:${th.id}:${to}`;
  const { data: claimed } = await sb.rpc("notify_claim", { p_key: key, p_minutes: 30 });
  if (!claimed) return { skip: "recent" };

  const { data: sp } = await sb.from("profiles").select("name").eq("id", m.sender_id).maybeSingle();
  const sender = clip(sp?.name || "Foydalanuvchi", 40);
  const about = th.ad_id ? clip((th as any).ads?.title || "", 60) : "Qo'llab-quvvatlash";
  const preview = clip(m.body, 220);
  const link = `${SITE}/chat/${th.id}`;
  const res = await deliver(to, {
    subject: `${sender} sizga yozdi — Mohir bozor`,
    title: `${sender} sizga yangi xabar yubordi`,
    lines: [about ? `E'lon: <b>${esc(about)}</b>` : "", `«${esc(preview)}»`, "Javob berish uchun suhbatni oching. / Откройте чат, чтобы ответить."].filter(Boolean),
  }, `💬 <b>${esc(sender)}</b> sizga yozdi${about ? `\n«${esc(about)}»` : ""}\n\n${esc(preview)}`, ["Javob berish", link]);
  if (!["mail", "tg"].includes(res)) await sb.rpc("notify_release", { p_key: key });
  return { sent: res };
}

// ---------- E'lon muddati ----------
async function onExpiry() {
  const now = Date.now();
  const { data: ads } = await sb.from("ads").select("id,user_id,title,expires_at,status,mod_deleted")
    .eq("status", "active").eq("mod_deleted", false)
    .gt("expires_at", new Date(now - 86400e3).toISOString()).lt("expires_at", new Date(now + 3 * 86400e3).toISOString())
    .limit(300);
  const out: Record<string, number> = {};
  for (const a of ads || []) {
    const ended = Date.parse(a.expires_at) <= now;
    const kind = ended ? "ended" : "soon";
    const { data: claimed } = await sb.rpc("notify_claim", { p_key: `exp:${a.id}:${kind}:${a.expires_at}`, p_minutes: 525600 });
    if (!claimed) continue;
    const title = clip(a.title, 70);
    const link = `${SITE}/my-ads${ended ? "?tab=done" : ""}`;
    const res = ended
      ? await deliver(a.user_id, {
        subject: `E'loningiz muddati tugadi: ${title}`,
        title: "E'loningiz muddati tugadi",
        lines: [`«<b>${esc(title)}</b>» endi qidiruvda ko'rinmaydi.`, "Uni uzaytiring yoki yangi e'lon joylang — mijozlar sizni topishda davom etsin.", "Срок объявления истёк — продлите его, чтобы клиенты снова его видели."],
      }, `⏰ «<b>${esc(title)}</b>» e'loningiz muddati tugadi va qidiruvda ko'rinmayapti.\n\nUzaytiring yoki yangi e'lon joylang.`, ["E'lonlarimni ochish", link])
      : await deliver(a.user_id, {
        subject: `E'loningiz ${dayText(a.expires_at)} kuni tugaydi: ${title}`,
        title: `E'loningiz ${dayText(a.expires_at)} kuni tugaydi`,
        lines: [`«<b>${esc(title)}</b>» e'loningiz muddati ${dayText(a.expires_at)} kuni tugaydi.`, "Uzaytirsangiz, e'lon qidiruvda ko'rinishda davom etadi.", "Срок объявления скоро закончится — продлите его заранее."],
      }, `⏳ «<b>${esc(title)}</b>» e'loningiz muddati ${dayText(a.expires_at)} kuni tugaydi.\n\nUzaytirsangiz, mijozlar sizni topishda davom etadi.`, ["E'lonlarimni ochish", link]);
    if (res === "error") await sb.rpc("notify_release", { p_key: `exp:${a.id}:${kind}:${a.expires_at}` });
    out[res] = (out[res] || 0) + 1;
  }
  return { checked: (ads || []).length, ...out };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);
  const { data: secret } = await sb.rpc("get_notify_secret");
  if (!secret || req.headers.get("x-notify-secret") !== secret) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  try {
    if (body.type === "message") return json(await onMessage(Number(body.id)));
    if (body.type === "expiry") return json(await onExpiry());
    return json({ error: "type" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});
