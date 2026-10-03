-- Xavfsizlikni kuchaytirish (2026-10-03)

-- 1) Fayllar: faqat rasm (cheklar uchun rasm yoki PDF), hajmi cheklangan.
--    Aks holda kimdir ochiq papkaga HTML/virus yuklab, saytimiz nomidan tarqatishi mumkin edi.
update storage.buckets set file_size_limit = 8 * 1024 * 1024,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif']
where id in ('ads', 'avatars');
update storage.buckets set file_size_limit = 10 * 1024 * 1024,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
where id = 'receipts';

-- 2) "Birinchi admin bo'lish" funksiyasi endi kerak emas (admin bor) — hech kim chaqira olmaydi.
revoke execute on function public.claim_first_admin() from public, anon, authenticated;
-- Eski bonus bilan to'lash funksiyasi ishlatilmaydi — yopiladi.
revoke execute on function public.pay_with_bonus(uuid, text) from public, anon, authenticated;

-- 3) Hamyondan to'lash: narx 0 yoki noto'g'ri bo'lsa, xizmat bepul yoqilib ketmasin.
create or replace function public.pay_from_wallet(p_ad uuid, p_svc text)
returns json language plpgsql security definer set search_path = public as $$
declare price int; b int; m int; use_b int; use_m int;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_svc not in ('top','vip','bump','extend','restore','slots') then raise exception 'Noma''lum xizmat'; end if;
  if p_svc <> 'slots' and not exists (select 1 from ads where id = p_ad and user_id = auth.uid()) then raise exception 'E''lon topilmadi'; end if;
  select coalesce((prices ->> p_svc)::int, 0) into price from config where id = 1;
  if price is null or price <= 0 then raise exception 'Xizmat narxi sozlanmagan'; end if;
  insert into wallets (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select bonus, balance into b, m from wallets where user_id = auth.uid() for update;
  if b + m < price then raise exception 'Balans yetarli emas. Hisobni to''ldiring.'; end if;
  use_b := least(b, price);
  use_m := price - use_b;
  update wallets set bonus = bonus - use_b, balance = balance - use_m where user_id = auth.uid();
  if use_b > 0 then insert into bonus_log (user_id, amount, kind, note, wallet) values (auth.uid(), -use_b, 'spend', p_svc, 'bonus'); end if;
  if use_m > 0 then insert into bonus_log (user_id, amount, kind, note, wallet) values (auth.uid(), -use_m, 'spend', p_svc, 'main'); end if;
  perform apply_service(p_ad, auth.uid(), p_svc);
  return json_build_object('bonus', use_b, 'main', use_m);
end $$;

-- 4) Hamyon manfiy bo'lib qolmasin (har qanday holatda)
do $$ begin
  alter table public.wallets add constraint wallets_nonneg check (balance >= 0 and bonus >= 0);
exception when duplicate_object then null; end $$;

-- 5) Chatda spam: daqiqasiga 20, kuniga 500 tadan ortiq xabar yuborib bo'lmaydi
create or replace function public.messages_rate_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Juda tez yozyapsiz. Bir oz kuting.';
  end if;
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '1 day') >= 500 then
    raise exception 'Bugungi xabarlar limiti tugadi.';
  end if;
  return new;
end $$;
revoke execute on function public.messages_rate_guard() from public, anon, authenticated;
create index if not exists messages_sender_time_idx on public.messages (sender_id, created_at);
drop trigger if exists messages_rate_guard on public.messages;
create trigger messages_rate_guard before insert on public.messages
  for each row execute function public.messages_rate_guard();

-- 6) Shikoyat va e'lon spami: kuniga 30 ta shikoyat, soatiga 10 ta yangi e'lon
create or replace function public.reports_rate_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where user_id = auth.uid() and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Bugungi shikoyatlar limiti tugadi.';
  end if;
  return new;
end $$;
revoke execute on function public.reports_rate_guard() from public, anon, authenticated;
drop trigger if exists reports_rate_guard on public.reports;
create trigger reports_rate_guard before insert on public.reports
  for each row execute function public.reports_rate_guard();

create or replace function public.ads_rate_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if (select count(*) from ads where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Bir soatda 10 tadan ortiq e''lon joylab bo''lmaydi.';
  end if;
  return new;
end $$;
revoke execute on function public.ads_rate_guard() from public, anon, authenticated;
drop trigger if exists ads_rate_guard on public.ads;
create trigger ads_rate_guard before insert on public.ads
  for each row execute function public.ads_rate_guard();

-- 7) Ruxsatlarni toraytirish: kirmagan (anonim) foydalanuvchi hech narsa yoza olmaydi,
--    hech kim jadvalni butunlay tozalay (TRUNCATE) olmaydi.
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'v', 'm') loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', r.relname);
    execute format('revoke insert, update, delete on public.%I from anon', r.relname);
  end loop;
end $$;
-- Maxfiy jadvallar: faqat server (service_role) ko'radi
revoke all on public.payment_secrets, public.mail_settings, public.otp_log, public.payme_tx, public.click_tx from anon, authenticated;
-- Anonim foydalanuvchiga shaxsiy jadvallarni o'qish ham kerak emas
revoke select on public.wallets, public.bonus_log, public.orders, public.threads, public.messages,
  public.profile_private, public.user_slots, public.blocks, public.admins, public.ad_events, public.reports from anon;

-- 8) Admin harakatlari jurnali: kim, qachon, nima qildi (faqat admin ko'radi)
create table if not exists public.admin_log (
  id bigserial primary key,
  admin_id uuid default auth.uid(),
  action text not null,
  target text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_log enable row level security;
drop policy if exists "admin log read" on public.admin_log;
create policy "admin log read" on public.admin_log for select to authenticated using (public.is_admin());
revoke all on public.admin_log from anon;
grant select on public.admin_log to authenticated;

create or replace function public.admin_log_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then return coalesce(new, old); end if;
  if tg_table_name = 'orders' and new.status is distinct from old.status then
    insert into admin_log (action, target, note) values ('order_' || new.status, new.id::text, new.svc || ' ' || new.price);
  elsif tg_table_name = 'ads' and new.mod_deleted and not coalesce(old.mod_deleted, false) then
    insert into admin_log (action, target, note) values ('ad_delete', new.id::text, left(new.title, 80));
  elsif tg_table_name = 'config' then
    insert into admin_log (action, target, note) values ('config', '1', 'Sozlamalar o''zgartirildi');
  elsif tg_table_name = 'bonus_log' and new.kind = 'admin' then
    insert into admin_log (action, target, note) values ('wallet_adjust', new.user_id::text, new.amount || ' ' || coalesce(new.note, ''));
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function public.admin_log_trg() from public, anon, authenticated;
drop trigger if exists admin_log_orders on public.orders;
create trigger admin_log_orders after update on public.orders for each row execute function public.admin_log_trg();
drop trigger if exists admin_log_ads on public.ads;
create trigger admin_log_ads after update on public.ads for each row execute function public.admin_log_trg();
drop trigger if exists admin_log_config on public.config;
create trigger admin_log_config after update on public.config for each row execute function public.admin_log_trg();
drop trigger if exists admin_log_bonus on public.bonus_log;
create trigger admin_log_bonus after insert on public.bonus_log for each row execute function public.admin_log_trg();

-- 9) Gmail ilova parolini admin panelning o'zida almashtirish (chatga yozmasdan)
create or replace function public.admin_set_mail_password(p_pass text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  if char_length(regexp_replace(coalesce(p_pass, ''), '\s', '', 'g')) <> 16 then
    raise exception 'Google ilova paroli 16 ta harfdan iborat bo''ladi';
  end if;
  update mail_settings set smtp_pass = regexp_replace(p_pass, '\s', '', 'g') where id = 1;
  insert into admin_log (action, note) values ('mail_password', 'Pochta paroli almashtirildi');
end $$;
revoke execute on function public.admin_set_mail_password(text) from public, anon;
grant execute on function public.admin_set_mail_password(text) to authenticated;

-- 10) Ikki bosqichli himoya: admin telefondagi kod (TOTP) bilan tasdiqlamaguncha admin huquqi ishlamaydi
--     (faqat himoyani yoqgan bo'lsa; yoqmagan bo'lsa avvalgidek ishlaydi)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
    and (
      coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
    )
$$;

do $$
begin
  raise notice 'NATIJA buckets=% admin_claim_yopiq=% chat_limit=% jurnal=%',
    (select string_agg(id || ':' || coalesce(file_size_limit::text, 'yo''q'), ',') from storage.buckets),
    not has_function_privilege('authenticated', 'public.claim_first_admin()', 'execute'),
    (select count(*) from pg_trigger where tgname = 'messages_rate_guard'),
    (select count(*) from pg_tables where tablename = 'admin_log');
end $$;
