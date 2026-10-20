// Supabase Edge Function: telefon raqamga SMS orqali kirish kodi (Eskiz.uz).
// Har bir raqam uchun ichki hisob: p998XXXXXXXXX@tel.mohirbozor.uz (pochta bilan kirish tizimidan foydalanadi).
// Eskiz login/paroli bazadagi sms_settings jadvalida (bu faylda yo'q).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const API = "https://notify.eskiz.uz/api";

const phoneEmail = (p: string) => `p${p}@tel.mohirbozor.uz`;

async function eskizLogin(email: string, password: string) {
  const f = new FormData();
  f.append("email", email); f.append("password", password);
  const r = await fetch(`${API}/auth/login`, { method: "POST", body: f });
  const j = await r.json().catch(() => ({}));
  return j?.data?.token as string | undefined;
}

async function eskizSend(token: string, phone: string, text: string, sender: string) {
  const f = new FormData();
  f.append("mobile_phone", phone); f.append("message", text); f.append("from", sender || "4546");
  const r = await fetch(`${API}/message/sms/send`, { method: "POST", body: f, headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    let phone = String(body.phone || "").replace(/\D/g, "");
    if (phone.length === 9) phone = "998" + phone;
    if (!/^998\d{9}$/.test(phone)) return json({ error: "Telefon raqamni to'g'ri kiriting: +998 XX XXX XX XX" }, 400);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const email = phoneEmail(phone);

    const { data: allowed, error: aErr } = await sb.rpc("otp_allow", { p_email: email });
    if (aErr) return json({ error: "Server xatosi (limit)" }, 500);
    if (!allowed) return json({ error: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring." }, 429);

    const { data: cfg } = await sb.rpc("get_sms_settings");
    if (!cfg?.email || !cfg?.password) return json({ error: "SMS xizmati hali sozlanmagan" }, 503);

    const created = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { phone: "+" + phone } });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) return json({ error: created.error.message }, 400);
    const { data: link, error: lErr } = await sb.auth.admin.generateLink({ type: "magiclink", email });
    if (lErr || !link?.properties?.email_otp) return json({ error: lErr?.message || "Kod yaratilmadi" }, 500);
    const code = link.properties.email_otp;
    const text = `Mohir bozor: kirish kodi ${code}. Kodni hech kimga bermang.`;

    // Token 25 kun saqlanadi (Eskiz tokeni 30 kun amal qiladi)
    let token = cfg.token as string;
    const fresh = cfg.token_at && Date.now() - new Date(cfg.token_at).getTime() < 25 * 86400e3;
    if (!token || !fresh) {
      token = (await eskizLogin(cfg.email, cfg.password)) || "";
      if (!token) return json({ error: "SMS xizmatiga ulanib bo'lmadi" }, 502);
      await sb.rpc("set_sms_token", { p_token: token });
    }
    let res = await eskizSend(token, phone, text, cfg.sender);
    if (res.status === 401) {
      token = (await eskizLogin(cfg.email, cfg.password)) || "";
      if (token) { await sb.rpc("set_sms_token", { p_token: token }); res = await eskizSend(token, phone, text, cfg.sender); }
    }
    if (res.status >= 300) {
      console.log("eskiz", res.status, JSON.stringify(res.body).slice(0, 300));
      return json({ error: "SMS yuborilmadi. Birozdan keyin qayta urinib ko'ring." }, 502);
    }
    return json({ ok: true, email });
  } catch (e) {
    return json({ error: "SMS yuborilmadi: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
