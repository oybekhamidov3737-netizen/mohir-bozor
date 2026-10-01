// Click SHOP API (Prepare / Complete). Click kabinetida ikkala manzil ham shu:
// https://<project>.supabase.co/functions/v1/click
// Secret key bazadagi payment_secrets jadvalida.
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1/hex";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const md5 = async (s: string) => encodeHex(await crypto.subtle.digest("MD5", new TextEncoder().encode(s)));
const out = (b: Record<string, unknown>) =>
  new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json; charset=UTF-8" } });

const NOTE: Record<number, string> = {
  0: "Success", [-1]: "SIGN CHECK FAILED!", [-2]: "Incorrect parameter amount", [-3]: "Action not found",
  [-4]: "Already paid", [-5]: "User does not exist", [-6]: "Transaction does not exist",
  [-7]: "Failed to update user", [-8]: "Error in request from click", [-9]: "Transaction cancelled",
};

async function params(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json();
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v ?? "")]));
  }
  const f = new URLSearchParams(await req.text());
  return Object.fromEntries(f.entries());
}

Deno.serve(async (req) => {
  let p: Record<string, string> = {};
  const res = (error: number, extra: Record<string, unknown> = {}) =>
    out({ click_trans_id: Number(p.click_trans_id) || 0, merchant_trans_id: p.merchant_trans_id || "", error, error_note: NOTE[error], ...extra });
  try {
    p = await params(req);
    const need = ["click_trans_id", "service_id", "merchant_trans_id", "amount", "action", "sign_time", "sign_string"];
    if (need.some((k) => p[k] === undefined || p[k] === "")) return res(-8);

    const [{ data: sec }, { data: cfg }] = await Promise.all([
      sb.rpc("pay_secrets"),
      sb.from("config").select("click_service_id").eq("id", 1).maybeSingle(),
    ]);
    const secret = (sec?.click_secret || "").trim();
    if (!secret || String(cfg?.click_service_id || "") !== String(p.service_id)) return res(-1);

    const action = Number(p.action);
    const base = p.click_trans_id + p.service_id + secret + p.merchant_trans_id;
    const expect = action === 1
      ? await md5(base + p.merchant_prepare_id + p.amount + p.action + p.sign_time)
      : await md5(base + p.amount + p.action + p.sign_time);
    if (expect !== String(p.sign_string).toLowerCase()) return res(-1);
    if (action !== 0 && action !== 1) return res(-3);

    const oid = p.merchant_trans_id;
    if (!/^[0-9a-f-]{36}$/i.test(oid)) return res(-5);
    const { data: o } = await sb.from("orders").select("*").eq("id", oid).maybeSingle();
    if (!o || o.provider !== "click") return res(-5);
    if (Math.abs(Number(o.price) - Number(p.amount)) > 0.01) return res(-2);

    if (action === 0) {
      if (o.status === "ok") return res(-4);
      if (o.status !== "unpaid") return res(-9);
      const { data: row, error } = await sb.from("click_tx")
        .upsert({ click_trans_id: Number(p.click_trans_id), order_id: o.id, amount: Number(p.amount), status: "prepared" }, { onConflict: "click_trans_id" })
        .select("id").single();
      if (error || !row) return res(-7);
      return res(0, { merchant_prepare_id: row.id });
    }

    // Complete
    const { data: tx } = await sb.from("click_tx").select("*").eq("id", Number(p.merchant_prepare_id)).maybeSingle();
    if (!tx || String(tx.click_trans_id) !== String(p.click_trans_id)) return res(-6);
    if (tx.status === "done") return res(-4, { merchant_confirm_id: tx.id });
    if (tx.status === "cancelled") return res(-9);
    if (Number(p.error) < 0) {
      await sb.from("click_tx").update({ status: "cancelled" }).eq("id", tx.id);
      return res(-9);
    }
    if (o.status === "ok") return res(-4, { merchant_confirm_id: tx.id });
    const { error } = await sb.rpc("pay_complete", { p_order: o.id });
    if (error) return res(-7);
    await sb.from("click_tx").update({ status: "done" }).eq("id", tx.id);
    return res(0, { merchant_confirm_id: tx.id });
  } catch (_e) {
    return res(-8);
  }
});
