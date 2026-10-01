-- =====================================================================
-- Mohir bozor — Supabase ma'lumotlar bazasi
-- Supabase → SQL Editor → New query → shu faylni to'liq joylang → Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Faqat Gmail va iCloud bilan ro'yxatdan o'tish
-- ---------------------------------------------------------------------
create or replace function public.check_email_domain() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) !~ '@(gmail\.com|icloud\.com|me\.com|mac\.com)$' then
    raise exception 'Faqat Gmail yoki iCloud pochtasi bilan ro''yxatdan o''tish mumkin';
  end if;
  return new;
end $$;

drop trigger if exists check_email_domain on auth.users;
create trigger check_email_domain before insert on auth.users
  for each row execute function public.check_email_domain();

-- ---------------------------------------------------------------------
-- 2. Adminlar
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins self" on public.admins;
create policy "admins self" on public.admins for select using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

create or replace function public.admin_exists() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins)
$$;

-- Birinchi kirgan odam (siz) bir marta admin bo'la oladi
create or replace function public.claim_first_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  lock table admins in exclusive mode;
  if exists (select 1 from admins) then return false; end if;
  insert into admins (user_id) values (auth.uid());
  return true;
end $$;

-- ---------------------------------------------------------------------
-- 3. Sozlamalar (narxlar, limitlar, to'lov rekvizitlari)
-- ---------------------------------------------------------------------
create table if not exists public.config (
  id int primary key default 1 check (id = 1),
  prices jsonb not null default '{"top":25000,"vip":49000,"bump":9000,"slots":19000,"extend":5000,"restore":7000}',
  free_ads int not null default 5,
  slot_pack int not null default 5,
  promo_days int not null default 7,
  ad_days int not null default 30,
  pay_text text not null default ''
);
insert into public.config (id) values (1) on conflict do nothing;
alter table public.config enable row level security;
drop policy if exists "config read" on public.config;
create policy "config read" on public.config for select using (true);
drop policy if exists "config admin" on public.config;
create policy "config admin" on public.config for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Profillar (kabinet)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  cat text not null default '',
  region text not null default '',
  district text not null default '',
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Telefon raqami alohida: faqat egasi ko'radi
create table if not exists public.profile_private (
  id uuid primary key references auth.users on delete cascade,
  phone text not null default ''
);
alter table public.profile_private enable row level security;
drop policy if exists "private own" on public.profile_private;
create policy "private own" on public.profile_private for all using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Qo'shimcha e'lon joylari (sotib olingan)
-- ---------------------------------------------------------------------
create table if not exists public.user_slots (
  user_id uuid primary key references auth.users on delete cascade,
  extra int not null default 0
);
alter table public.user_slots enable row level security;
drop policy if exists "slots read" on public.user_slots;
create policy "slots read" on public.user_slots for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 6. E'lonlar
-- ---------------------------------------------------------------------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null default 'xizmat' check (kind in ('xizmat', 'buyurtma')),
  title text not null check (char_length(title) between 5 and 80),
  cat text not null,
  price numeric not null default 0 check (price >= 0),
  cur text not null default 'uzs' check (cur in ('uzs', 'usd')),
  unit text not null default '',
  price_from boolean not null default false,
  negotiable boolean not null default false,
  price_uzs numeric generated always as (nullif(case when cur = 'usd' then price * 12600 else price end, 0)) stored,
  region text not null,
  district text not null default '',
  exp_years text not null default '',
  description text not null check (char_length(description) between 20 and 3000),
  seller_name text not null,
  phone text not null default '',
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'deleted')),
  mod_deleted boolean not null default false,
  deleted_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days',
  top_until timestamptz,
  vip_until timestamptz,
  bumped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ads_feed_idx on public.ads (status, expires_at);
create index if not exists ads_user_idx on public.ads (user_id);
create index if not exists ads_cat_idx on public.ads (cat);

alter table public.ads enable row level security;
drop policy if exists "ads read" on public.ads;
create policy "ads read" on public.ads for select
  using ((status = 'active' and expires_at > now()) or user_id = auth.uid() or public.is_admin());
drop policy if exists "ads insert" on public.ads;
create policy "ads insert" on public.ads for insert with check (user_id = auth.uid());
drop policy if exists "ads update" on public.ads;
create policy "ads update" on public.ads for update
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "ads delete" on public.ads;
create policy "ads delete" on public.ads for delete using (user_id = auth.uid() or public.is_admin());

-- Qoidalar: mavzu, tashqi kontakt, limit, pullik maydonlarni himoya qilish
create or replace function public.ads_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c config;
  lim int;
  cnt int;
  txt text;
begin
  select * into c from config where id = 1;
  txt := coalesce(new.title, '') || ' ' || coalesce(new.description, '');

  if txt ~* '(t\.me/|telegram\.me|telegram(dan|ga| orqali)|instagram\.com/|wa\.me|whatsapp|vatsap|(^|[[:space:](])@[a-z][a-z0-9_]{3,})' then
    raise exception 'Tashqi kontakt (Telegram, Instagram, WhatsApp) yozib bo''lmaydi. Mijozlar ilova ichidagi chat orqali yozadi.';
  end if;
  if txt ~* '(sotiladi|sotaman|ijaraga|arenda|kvartira|kredit|kazino|casino|bukmeker|intim|narkotik|продаю|продам|аренда|квартир|кредит|казино)' then
    raise exception 'Bu bozor faqat ijodiy va marketing xizmatlari uchun (SMM, montaj, dizayn, marketing...).';
  end if;

  if public.is_admin() then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'active';
    new.mod_deleted := false;
    new.deleted_at := null;
    new.expires_at := now() + make_interval(days => c.ad_days);
    new.top_until := null;
    new.vip_until := null;
    new.bumped_at := null;
    new.created_at := now();
    select count(*) into cnt from ads where user_id = auth.uid() and status = 'active' and expires_at > now();
    lim := c.free_ads + coalesce((select extra from user_slots where user_id = auth.uid()), 0);
    if cnt >= lim then
      raise exception 'Bepul e''lonlar limiti tugadi (% ta). Kabinetda limitni oshiring.', lim;
    end if;
  else
    new.user_id := old.user_id;
    new.expires_at := old.expires_at;
    new.top_until := old.top_until;
    new.vip_until := old.vip_until;
    new.bumped_at := old.bumped_at;
    new.created_at := old.created_at;
    new.mod_deleted := old.mod_deleted;
    if old.status = 'deleted' and new.status = 'active' then
      raise exception 'O''chirilgan e''lonni tiklash pullik xizmat.';
    end if;
    if new.status = 'deleted' and old.status <> 'deleted' then
      new.deleted_at := now();
    else
      new.deleted_at := old.deleted_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists ads_guard on public.ads;
create trigger ads_guard before insert or update on public.ads
  for each row execute function public.ads_guard();

-- E'lonlar tarixi
create table if not exists public.ad_events (
  id bigserial primary key,
  ad_id uuid not null references public.ads on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
alter table public.ad_events enable row level security;
drop policy if exists "events read" on public.ad_events;
create policy "events read" on public.ad_events for select
  using (public.is_admin() or exists (select 1 from ads a where a.id = ad_id and a.user_id = auth.uid()));

-- Lenta: faqat faol e'lonlar, VIP/TOP tepada
create or replace view public.ad_feed with (security_invoker = true) as
select a.*,
  case when a.vip_until > now() then 2 when a.top_until > now() then 1 else 0 end as rank,
  greatest(a.created_at, coalesce(a.bumped_at, a.created_at)) as sort_at
from public.ads a
where a.status = 'active' and a.expires_at > now();

-- ---------------------------------------------------------------------
-- 7. To'lovlar va pullik xizmatlar
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null default upper(substr(md5(random()::text), 1, 6)),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  ad_id uuid references public.ads on delete set null,
  svc text not null check (svc in ('top', 'vip', 'bump', 'extend', 'restore', 'slots')),
  price numeric not null default 0,
  payer text not null check (char_length(payer) between 2 and 60),
  receipt_path text,
  status text not null default 'pending' check (status in ('pending', 'ok', 'no')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.orders enable row level security;
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders for insert with check (user_id = auth.uid());

create or replace function public.orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.status := 'pending';
  new.decided_at := null;
  new.price := coalesce((select (prices ->> new.svc)::numeric from config where id = 1), 0);
  if new.svc <> 'slots' and not exists (select 1 from ads where id = new.ad_id and user_id = auth.uid()) then
    raise exception 'E''lon topilmadi';
  end if;
  return new;
end $$;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert on public.orders
  for each row execute function public.orders_guard();

create or replace function public.apply_service(p_ad uuid, p_user uuid, p_svc text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c config;
  d interval;
  ad_d interval;
begin
  select * into c from config where id = 1;
  d := make_interval(days => c.promo_days);
  ad_d := make_interval(days => c.ad_days);
  if p_svc = 'slots' then
    insert into user_slots (user_id, extra) values (p_user, c.slot_pack)
      on conflict (user_id) do update set extra = user_slots.extra + c.slot_pack;
    return;
  end if;
  if p_svc = 'vip' then
    update ads set vip_until = greatest(coalesce(vip_until, now()), now()) + d,
                   top_until = greatest(coalesce(top_until, now()), now()) + d where id = p_ad;
  elsif p_svc = 'top' then
    update ads set top_until = greatest(coalesce(top_until, now()), now()) + d where id = p_ad;
  elsif p_svc = 'bump' then
    update ads set bumped_at = now() where id = p_ad;
  elsif p_svc = 'extend' then
    update ads set expires_at = greatest(expires_at, now()) + ad_d where id = p_ad;
  elsif p_svc = 'restore' then
    update ads set status = 'active', mod_deleted = false, deleted_at = null,
                   expires_at = now() + ad_d, bumped_at = now() where id = p_ad;
  end if;
  insert into ad_events (ad_id, kind) values (p_ad, p_svc);
end $$;
revoke execute on function public.apply_service(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.approve_order(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  select * into o from orders where id = p_id for update;
  if o.id is null or o.status <> 'pending' then raise exception 'Bu to''lov allaqachon ko''rib chiqilgan'; end if;
  perform apply_service(o.ad_id, o.user_id, o.svc);
  update orders set status = 'ok', decided_at = now() where id = p_id;
end $$;

create or replace function public.reject_order(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update orders set status = 'no', decided_at = now() where id = p_id and status = 'pending';
end $$;

create or replace function public.admin_activate(p_ad uuid, p_svc text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  perform apply_service(p_ad, (select user_id from ads where id = p_ad), p_svc);
end $$;

create or replace function public.admin_delete_ad(p_ad uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update ads set status = 'deleted', mod_deleted = true where id = p_ad;
  insert into ad_events (ad_id, kind) values (p_ad, 'moderator');
end $$;

-- ---------------------------------------------------------------------
-- 8. Chat
-- ---------------------------------------------------------------------
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references public.ads on delete set null,
  buyer_id uuid not null references auth.users on delete cascade,
  seller_id uuid not null references auth.users on delete cascade,
  last_at timestamptz not null default now(),
  last_text text not null default '',
  last_sender uuid,
  buyer_read_at timestamptz not null default now(),
  seller_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (ad_id, buyer_id)
);
alter table public.threads enable row level security;
drop policy if exists "threads read" on public.threads;
create policy "threads read" on public.threads for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_admin());

create table if not exists public.messages (
  id bigserial primary key,
  thread_id uuid not null references public.threads on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages (thread_id, id);
alter table public.messages enable row level security;
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select using (
  exists (select 1 from threads t where t.id = thread_id and (auth.uid() in (t.buyer_id, t.seller_id) or public.is_admin())));
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from threads t where t.id = thread_id and auth.uid() in (t.buyer_id, t.seller_id)));

create or replace function public.on_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update threads set last_at = new.created_at, last_text = left(new.body, 140), last_sender = new.sender_id,
    buyer_read_at = case when buyer_id = new.sender_id then new.created_at else buyer_read_at end,
    seller_read_at = case when seller_id = new.sender_id then new.created_at else seller_read_at end
  where id = new.thread_id;
  return new;
end $$;
drop trigger if exists on_message on public.messages;
create trigger on_message after insert on public.messages
  for each row execute function public.on_message();

create or replace function public.start_thread(p_ad uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare s uuid; tid uuid;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select user_id into s from ads where id = p_ad and status = 'active';
  if s is null then raise exception 'E''lon topilmadi'; end if;
  if s = auth.uid() then raise exception 'Bu o''zingizning e''loningiz'; end if;
  insert into threads (ad_id, buyer_id, seller_id) values (p_ad, auth.uid(), s)
    on conflict (ad_id, buyer_id) do update set ad_id = excluded.ad_id
    returning id into tid;
  return tid;
end $$;

create or replace function public.mark_read(p_thread uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update threads set buyer_read_at = now() where id = p_thread and buyer_id = auth.uid();
  update threads set seller_read_at = now() where id = p_thread and seller_id = auth.uid();
end $$;

-- ---------------------------------------------------------------------
-- 9. Hisobni o'chirish (App Store talabi)
-- ---------------------------------------------------------------------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------
-- 10. Rasmlar (Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('ads', 'ads', true), ('avatars', 'avatars', true), ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "mohir upload own" on storage.objects;
create policy "mohir upload own" on storage.objects for insert to authenticated
  with check (bucket_id in ('ads', 'avatars', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "mohir delete own" on storage.objects;
create policy "mohir delete own" on storage.objects for delete to authenticated
  using (bucket_id in ('ads', 'avatars', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "mohir receipts read" on storage.objects;
create policy "mohir receipts read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------------
-- 11. Jonli yangilanishlar (chat va to'lovlar)
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.threads; exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
end $$;

-- ---------------------------------------------------------------------
-- 12. Funksiyalarga ruxsatlar (xavfsizlik)
-- ---------------------------------------------------------------------
revoke execute on function public.check_email_domain() from public, anon, authenticated;
revoke execute on function public.ads_guard() from public, anon, authenticated;
revoke execute on function public.orders_guard() from public, anon, authenticated;
revoke execute on function public.on_message() from public, anon, authenticated;
revoke execute on function public.admin_activate(uuid, text) from public, anon;
revoke execute on function public.admin_delete_ad(uuid) from public, anon;
revoke execute on function public.approve_order(uuid) from public, anon;
revoke execute on function public.reject_order(uuid) from public, anon;
revoke execute on function public.claim_first_admin() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
revoke execute on function public.mark_read(uuid) from public, anon;
revoke execute on function public.start_thread(uuid) from public, anon;
revoke execute on function public.admin_exists() from public, anon;
grant execute on function public.admin_activate(uuid, text), public.admin_delete_ad(uuid), public.approve_order(uuid),
  public.reject_order(uuid), public.claim_first_admin(), public.delete_my_account(), public.mark_read(uuid),
  public.start_thread(uuid), public.admin_exists(), public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;
