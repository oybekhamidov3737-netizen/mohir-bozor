// Supabase Edge Function: kirish kodini Gmail orqali yuborish.
// Gmail login va ilova paroli bazadagi mail_settings jadvalida saqlanadi (bu faylda yo'q).
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ALLOWED = /^[^\s@]+@(gmail\.com|icloud\.com|me\.com|mac\.com)$/i;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const html = (code: string) => `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#141D19">
<div style="display:inline-block;background:#1E48D6;color:#fff;font-weight:800;border-radius:10px;padding:6px 12px;font-size:16px">mohir</div>
<h2 style="margin:20px 0 8px;font-size:22px">Kirish kodingiz</h2>
<p style="margin:0 0 16px;color:#5C6862;font-size:15px">Mohir bozor ilovasida shu kodni kiriting:</p>
<div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#E3E9FF;color:#1E48D6;border-radius:14px;padding:16px;text-align:center">${code}</div>
<p style="margin:20px 0 0;color:#5C6862;font-size:13px">Kod 1 soat amal qiladi. Agar siz so'ramagan bo'lsangiz, bu xatga e'tibor bermang.</p>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!ALLOWED.test(email)) return json({ error: "Faqat Gmail yoki iCloud pochtasi bilan kirish mumkin." }, 400);

    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: allowed, error: aErr } = await sb.rpc("otp_allow", { p_email: email });
    if (aErr) return json({ error: "Server xatosi (limit)" }, 500);
    if (!allowed) return json({ error: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring." }, 429);

    const created = await sb.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      return json({ error: created.error.message }, 400);
    }
    const { data: link, error: lErr } = await sb.auth.admin.generateLink({ type: "magiclink", email });
    if (lErr || !link?.properties?.email_otp) return json({ error: lErr?.message || "Kod yaratilmadi" }, 500);
    const code = link.properties.email_otp;

    const { data: cfg, error: cErr } = await sb.rpc("get_mail_settings");
    if (cErr || !cfg?.smtp_user) return json({ error: "Pochta sozlanmagan" }, 500);

    const tr = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    });
    await tr.sendMail({
      from: `"Mohir bozor" <${cfg.smtp_user}>`,
      to: email,
      subject: `Mohir bozor: kirish kodi ${code}`,
      text: `Mohir bozor kirish kodingiz: ${code}\nKod 1 soat amal qiladi.`,
      html: html(code),
    });
    return json({ ok: true });
  } catch (e) {
    return json({ error: "Xat yuborilmadi: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
