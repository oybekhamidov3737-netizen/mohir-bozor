-- Payme va Click avtomatik to'lovlari uchun jadvallar va funksiyalar.
-- Maxfiy kalitlar faqat payment_secrets jadvalida (bu faylda yo'q).
alter table public.orders add column if not exists provider text not null default 'manual';
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending','ok','no','unpaid'));
alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check check (provider in ('manual','payme','click'));
alter table public.config add column if not exists payme_merchant_id text not null default '';
alter table public.config add column if not exists payme_test boolean not null default false;
alter table public.config add column if not exists click_service_id text not null default '';
alter table public.config add column if not exists click_merchant_id text not null default '';
create table if not exists public.payment_secrets (id int primary key default 1 check (id = 1), payme_key text not null default '', click_secret text not null default '');
insert into public.payment_secrets (id) values (1) on conflict do nothing;
alter table public.payment_secrets enable row level security;
revoke all on public.payment_secrets from anon, authenticated;
create table if not exists public.payme_tx (id text primary key, order_id uuid not null references public.orders on delete cascade, amount bigint not null, state int not null default 1, create_time bigint not null, perform_time bigint not null default 0, cancel_time bigint not null default 0, reason int);
alter table public.payme_tx enable row level security;
revoke all on public.payme_tx from anon, authenticated;
create table if not exists public.click_tx (id bigserial primary key, click_trans_id bigint not null unique, order_id uuid not null references public.orders on delete cascade, amount numeric not null, status text not null default 'prepared', created_at timestamptz not null default now());
alter table public.click_tx enable row level security;
revoke all on public.click_tx from anon, authenticated;

create or replace function public.orders_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid(); new.decided_at := null; new.paid_at := null;
  new.price := coalesce((select (prices ->> new.svc)::numeric from config where id = 1), 0);
  if new.provider in ('payme', 'click') then new.status := 'unpaid'; new.payer := initcap(new.provider); new.receipt_path := null;
  else new.provider := 'manual'; new.status := 'pending'; end if;
  if new.svc <> 'slots' and not exists (select 1 from ads where id = new.ad_id and user_id = auth.uid()) then raise exception 'E''lon topilmadi'; end if;
  return new;
end $$;
create or replace function public.pay_complete(p_order uuid) returns void language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where id = p_order for update;
  if o.id is null or o.status = 'ok' then return; end if;
  perform apply_service(o.ad_id, o.user_id, o.svc);
  update orders set status = 'ok', paid_at = now(), decided_at = now() where id = p_order;
end $$;
create or replace function public.pay_secrets() returns json language sql security definer set search_path = public as $$
  select json_build_object('payme_key', payme_key, 'click_secret', click_secret) from payment_secrets where id = 1 $$;
create or replace function public.admin_set_payment_secrets(p_payme_key text default null, p_click_secret text default null) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update payment_secrets set payme_key = coalesce(nullif(trim(p_payme_key), ''), payme_key), click_secret = coalesce(nullif(trim(p_click_secret), ''), click_secret) where id = 1;
end $$;
create or replace function public.admin_payment_status() returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('payme_key', payme_key <> '', 'click_secret', click_secret <> '') from payment_secrets where id = 1);
end $$;
revoke execute on function public.orders_guard() from public, anon, authenticated;
revoke execute on function public.pay_complete(uuid) from public, anon, authenticated;
revoke execute on function public.pay_secrets() from public, anon, authenticated;
revoke execute on function public.admin_set_payment_secrets(text, text) from public, anon;
revoke execute on function public.admin_payment_status() from public, anon;
grant execute on function public.pay_complete(uuid), public.pay_secrets() to service_role;
grant execute on function public.admin_set_payment_secrets(text, text), public.admin_payment_status() to authenticated;
grant select, insert, update on public.payme_tx, public.click_tx to service_role;
grant usage, select on sequence public.click_tx_id_seq to service_role;
