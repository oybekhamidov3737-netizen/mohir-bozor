// Payme Merchant API (JSON-RPC). Payme shu manzilga so'rov yuboradi:
// https://<project>.supabase.co/functions/v1/payme
// Kalit (Payme Business kassasi "Ключ") bazadagi payment_secrets jadvalida.
import { createClient } from "npm:@supabase/supabase-js@2";

const TIMEOUT = 43_200_000; // 12 soat
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const msg = (uz: string, ru: string, en: string) => ({ uz, ru, en });
const reply = (id: unknown, body: Record<string, unknown>) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, ...body }), {
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
const fail = (id: unknown, code: number, message: Record<string, string>, data?: string) =>
  reply(id, { error: { code, message, data } });

const E = {
  auth: (id: unknown) => fail(id, -32504, msg("Ruxsat yo'q", "Недостаточно привилегий", "Insufficient privileges")),
  method: (id: unknown) => fail(id, -32601, msg("Metod topilmadi", "Метод не найден", "Method not found")),
  parse: (id: unknown) => fail(id, -32700, msg("JSON xato", "Ошибка разбора JSON", "Parse error")),
  amount: (id: unknown) => fail(id, -31001, msg("Summa noto'g'ri", "Неверная сумма", "Invalid amount")),
  order: (id: unknown) => fail(id, -31050, msg("Buyurtma topilmadi", "Заказ не найден", "Order not found"), "order_id"),
  busy: (id: unknown) => fail(id, -31051, msg("Buyurtma to'lov kutmoqda", "Заказ ожидает оплаты", "Order is awaiting payment"), "order_id"),
  notFound: (id: unknown) => fail(id, -31003, msg("Tranzaksiya topilmadi", "Транзакция не найдена", "Transaction not found")),
  cantPerform: (id: unknown) => fail(id, -31008, msg("Amalni bajarib bo'lmaydi", "Невозможно выполнить операцию", "Unable to perform operation")),
  cantCancel: (id: unknown) => fail(id, -31007, msg("Bekor qilib bo'lmaydi", "Невозможно отменить транзакцию", "Unable to cancel transaction")),
};

async function getOrder(account: Record<string, unknown> | undefined) {
  const oid = String(account?.order_id ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(oid)) return null;
  const { data } = await sb.from("orders").select("*").eq("id", oid).maybeSingle();
  return data;
}
const txOut = (t: Record<string, any>) => ({
  create_time: Number(t.create_time), perform_time: Number(t.perform_time), cancel_time: Number(t.cancel_time),
  transaction: t.id, state: t.state, reason: t.reason ?? null,
});

Deno.serve(async (req) => {
  let id: unknown = null;
  try {
    const { data: sec } = await sb.rpc("pay_secrets");
    const key = (sec?.payme_key || "").trim();
    const auth = req.headers.get("authorization") || "";
    const expected = "Basic " + btoa("Paycom:" + key);
    let body: any;
    try { body = await req.json(); } catch { return E.parse(null); }
    id = body?.id ?? null;
    if (!key || auth !== expected) return E.auth(id);

    const p = body.params || {};
    switch (body.method) {
      case "CheckPerformTransaction": {
        const o = await getOrder(p.account);
        if (!o || o.provider !== "payme") return E.order(id);
        if (o.status !== "unpaid") return E.cantPerform(id);
        if (Math.round(Number(o.price) * 100) !== Number(p.amount)) return E.amount(id);
        return reply(id, { result: { allow: true } });
      }
      case "CreateTransaction": {
        const { data: ex } = await sb.from("payme_tx").select("*").eq("id", p.id).maybeSingle();
        if (ex) {
          if (ex.state !== 1) return E.cantPerform(id);
          if (Date.now() - Number(ex.create_time) > TIMEOUT) {
            await sb.from("payme_tx").update({ state: -1, reason: 4, cancel_time: Date.now() }).eq("id", ex.id);
            return E.cantPerform(id);
          }
          return reply(id, { result: { create_time: Number(ex.create_time), transaction: ex.id, state: 1 } });
        }
        const o = await getOrder(p.account);
        if (!o || o.provider !== "payme") return E.order(id);
        if (o.status !== "unpaid") return E.cantPerform(id);
        if (Math.round(Number(o.price) * 100) !== Number(p.amount)) return E.amount(id);
        const { data: other } = await sb.from("payme_tx").select("id").eq("order_id", o.id).eq("state", 1).maybeSingle();
        if (other) return E.busy(id);
        const t = { id: p.id, order_id: o.id, amount: Number(p.amount), state: 1, create_time: Date.now() };
        const { error } = await sb.from("payme_tx").insert(t);
        if (error) return E.cantPerform(id);
        return reply(id, { result: { create_time: t.create_time, transaction: t.id, state: 1 } });
      }
      case "PerformTransaction": {
        const { data: t } = await sb.from("payme_tx").select("*").eq("id", p.id).maybeSingle();
        if (!t) return E.notFound(id);
        if (t.state === 2) return reply(id, { result: { transaction: t.id, perform_time: Number(t.perform_time), state: 2 } });
        if (t.state !== 1) return E.cantPerform(id);
        if (Date.now() - Number(t.create_time) > TIMEOUT) {
          await sb.from("payme_tx").update({ state: -1, reason: 4, cancel_time: Date.now() }).eq("id", t.id);
          return E.cantPerform(id);
        }
        const { error } = await sb.rpc("pay_complete", { p_order: t.order_id });
        if (error) return E.cantPerform(id);
        const perform_time = Date.now();
        await sb.from("payme_tx").update({ state: 2, perform_time }).eq("id", t.id);
        return reply(id, { result: { transaction: t.id, perform_time, state: 2 } });
      }
      case "CancelTransaction": {
        const { data: t } = await sb.from("payme_tx").select("*").eq("id", p.id).maybeSingle();
        if (!t) return E.notFound(id);
        if (t.state === -1 || t.state === -2) {
          return reply(id, { result: { transaction: t.id, cancel_time: Number(t.cancel_time), state: t.state } });
        }
        // Xizmat yoqilgandan keyin pulni qaytarish faqat qo'lda (admin orqali)
        if (t.state === 2) return E.cantCancel(id);
        const cancel_time = Date.now();
        await sb.from("payme_tx").update({ state: -1, reason: p.reason ?? null, cancel_time }).eq("id", t.id);
        return reply(id, { result: { transaction: t.id, cancel_time, state: -1 } });
      }
      case "CheckTransaction": {
        const { data: t } = await sb.from("payme_tx").select("*").eq("id", p.id).maybeSingle();
        if (!t) return E.notFound(id);
        return reply(id, { result: txOut(t) });
      }
      case "GetStatement": {
        const { data } = await sb.from("payme_tx").select("*")
          .gte("create_time", Number(p.from) || 0).lte("create_time", Number(p.to) || Date.now()).order("create_time");
        return reply(id, {
          result: {
            transactions: (data || []).map((t: any) => ({
              id: t.id, time: Number(t.create_time), amount: Number(t.amount), account: { order_id: t.order_id },
              ...txOut(t),
            })),
          },
        });
      }
      default:
        return E.method(id);
    }
  } catch (_e) {
    return E.cantPerform(id);
  }
});
