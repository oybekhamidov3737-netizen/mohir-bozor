-- Umumiy hamyon: asosiy hisob (pul) + bonus; hisobni to'ldirish
alter table public.wallets add column if not exists balance int not null default 0;
do $$ begin
  alter table public.wallets add constraint wallets_balance_nonneg check (balance >= 0);
exception when duplicate_object then null; end $$;
alter table public.bonus_log add column if not exists wallet text not null default 'bonus';

-- Buyurtma turlariga "topup" qo'shish
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.orders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%svc%' loop
    execute format('alter table public.orders drop constraint %I', c);
  end loop;
end $$;
alter table public.orders add constraint orders_svc_check check (svc in ('top','vip','bump','extend','restore','slots','topup'));

create or replace function public.wallet_add(p_user uuid, p_wallet text, p_amount int, p_kind text, p_note text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  if p_wallet = 'main' then
    update wallets set balance = balance + p_amount where user_id = p_user;
  else
    update wallets set bonus = bonus + p_amount where user_id = p_user;
  end if;
  insert into bonus_log (user_id, amount, kind, note, wallet) values (p_user, p_amount, p_kind, coalesce(p_note, ''), p_wallet);
end $$;

create or replace function public.orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.decided_at := null;
  new.paid_at := null;
  if new.svc = 'topup' then
    if new.price is null or new.price < 5000 or new.price > 10000000 then
      raise exception 'To''ldirish summasi 5 000 dan 10 000 000 so''mgacha bo''lishi kerak';
    end if;
    new.price := round(new.price);
    new.ad_id := null;
  else
    new.price := coalesce((select (prices ->> new.svc)::numeric from config where id = 1), 0);
  end if;
  if new.provider in ('payme', 'click') then
    new.status := 'unpaid';
    new.payer := initcap(new.provider);
    new.receipt_path := null;
  else
    new.provider := 'manual';
    new.status := 'pending';
  end if;
  if new.svc not in ('slots', 'topup') and not exists (select 1 from ads where id = new.ad_id and user_id = auth.uid()) then
    raise exception 'E''lon topilmadi';
  end if;
  return new;
end $$;

create or replace function public.approve_order(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  select * into o from orders where id = p_id for update;
  if o.id is null or o.status <> 'pending' then raise exception 'Bu to''lov allaqachon ko''rib chiqilgan'; end if;
  if o.svc = 'topup' then
    perform wallet_add(o.user_id, 'main', o.price::int, 'topup', o.code);
  else
    perform apply_service(o.ad_id, o.user_id, o.svc);
  end if;
  update orders set status = 'ok', decided_at = now() where id = p_id;
end $$;

create or replace function public.pay_complete(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where id = p_order for update;
  if o.id is null or o.status = 'ok' then return; end if;
  if o.svc = 'topup' then
    perform wallet_add(o.user_id, 'main', o.price::int, 'topup', o.code || ' ' || initcap(o.provider));
  else
    perform apply_service(o.ad_id, o.user_id, o.svc);
  end if;
  update orders set status = 'ok', paid_at = now(), decided_at = now() where id = p_order;
end $$;

-- Hamyondan to'lash: avval bonus, keyin asosiy hisob
create or replace function public.pay_from_wallet(p_ad uuid, p_svc text) returns json
language plpgsql security definer set search_path = public as $$
declare price int; b int; m int; use_b int; use_m int;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_svc not in ('top','vip','bump','extend','restore','slots') then raise exception 'Noma''lum xizmat'; end if;
  if p_svc <> 'slots' and not exists (select 1 from ads where id = p_ad and user_id = auth.uid()) then raise exception 'E''lon topilmadi'; end if;
  select coalesce((prices ->> p_svc)::int, 0) into price from config where id = 1;
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

-- Admin: foydalanuvchi hisobini qo'lda to'g'rilash (masalan, qaytarish)
create or replace function public.admin_wallet_adjust(p_user uuid, p_amount int, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  perform wallet_add(p_user, 'main', p_amount, 'admin', p_note);
end $$;

revoke execute on function public.wallet_add(uuid, text, int, text, text) from public, anon, authenticated;
revoke execute on function public.orders_guard() from public, anon, authenticated;
revoke execute on function public.pay_complete(uuid) from public, anon, authenticated;
revoke execute on function public.pay_from_wallet(uuid, text) from public, anon;
revoke execute on function public.admin_wallet_adjust(uuid, int, text) from public, anon;
revoke execute on function public.approve_order(uuid) from public, anon;
grant execute on function public.pay_complete(uuid) to service_role;
grant execute on function public.pay_from_wallet(uuid, text), public.admin_wallet_adjust(uuid, int, text), public.approve_order(uuid) to authenticated;

do $$ begin
  raise notice 'NATIJA hamyonlar=% balans_ustuni=% topup_ruxsat=%',
    (select count(*) from public.wallets),
    (select exists(select 1 from information_schema.columns where table_name='wallets' and column_name='balance')),
    (select exists(select 1 from pg_constraint where conname='orders_svc_check' and pg_get_constraintdef(oid) like '%topup%'));
end $$;
