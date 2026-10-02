-- Referal (taklif) tizimi va bonus hamyon
alter table public.config add column if not exists ref_bonus_inviter int not null default 10000;
alter table public.config add column if not exists ref_bonus_invitee int not null default 5000;

alter table public.profiles add column if not exists ref_code text;
alter table public.profiles add column if not exists referred_by uuid references auth.users on delete set null;
alter table public.profiles add column if not exists ref_rewarded boolean not null default false;
create unique index if not exists profiles_ref_code_idx on public.profiles (ref_code);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users on delete cascade,
  bonus int not null default 0 check (bonus >= 0)
);
alter table public.wallets enable row level security;
drop policy if exists "wallet own" on public.wallets;
create policy "wallet own" on public.wallets for select using (user_id = auth.uid() or public.is_admin());
grant select on public.wallets to authenticated;

create table if not exists public.bonus_log (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  amount int not null,
  kind text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.bonus_log enable row level security;
drop policy if exists "bonus log own" on public.bonus_log;
create policy "bonus log own" on public.bonus_log for select using (user_id = auth.uid() or public.is_admin());
grant select on public.bonus_log to authenticated;

create or replace function public.gen_ref_code() returns text
language plpgsql as $$
declare c text;
begin
  loop
    c := upper(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when length(c) = 6 and not exists (select 1 from public.profiles where ref_code = c);
  end loop;
  return c;
end $$;

create or replace function public.add_bonus(p_user uuid, p_amount int, p_kind text, p_note text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into wallets (user_id, bonus) values (p_user, greatest(p_amount, 0))
    on conflict (user_id) do update set bonus = wallets.bonus + p_amount;
  insert into bonus_log (user_id, amount, kind, note) values (p_user, p_amount, p_kind, p_note);
end $$;

-- Profil: referal maydonlarini foydalanuvchi o'zi o'zgartira olmaydi
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('mohir.trusted', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    new.ref_code := public.gen_ref_code();
    new.referred_by := null;
    new.ref_rewarded := false;
  else
    new.ref_code := coalesce(old.ref_code, public.gen_ref_code());
    new.referred_by := old.referred_by;
    new.ref_rewarded := old.ref_rewarded;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- Mavjud profillarga kod berish
do $$
declare r record;
begin
  perform set_config('mohir.trusted', '1', true);
  for r in select id from public.profiles where ref_code is null loop
    update public.profiles set ref_code = public.gen_ref_code() where id = r.id;
  end loop;
  perform set_config('mohir.trusted', '0', true);
end $$;

-- Taklif kodini qo'llash (yangi foydalanuvchi, 7 kun ichida, bir marta)
create or replace function public.claim_referral(p_code text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare inviter uuid; me profiles; created timestamptz; c config;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'Avval kabinet oching'; end if;
  if me.referred_by is not null then raise exception 'Taklif kodi allaqachon qo''llangan'; end if;
  select created_at into created from auth.users where id = auth.uid();
  if created < now() - interval '7 days' then raise exception 'Taklif kodi faqat yangi foydalanuvchilar uchun'; end if;
  select id into inviter from profiles where ref_code = upper(trim(p_code));
  if inviter is null then raise exception 'Taklif kodi topilmadi'; end if;
  if inviter = auth.uid() then raise exception 'O''z kodingizni qo''llab bo''lmaydi'; end if;
  select * into c from config where id = 1;
  perform set_config('mohir.trusted', '1', true);
  update profiles set referred_by = inviter where id = auth.uid();
  perform set_config('mohir.trusted', '0', true);
  if c.ref_bonus_invitee > 0 then
    perform add_bonus(auth.uid(), c.ref_bonus_invitee, 'invitee', 'Taklif orqali ro''yxatdan o''tish');
  end if;
  return json_build_object('bonus', c.ref_bonus_invitee);
end $$;

-- Taklif qilingan odam birinchi e'lonini joylaganda taklif qilganga bonus
create or replace function public.ads_referral_reward() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles; c config; n int;
begin
  select * into p from profiles where id = new.user_id;
  if p.referred_by is null or p.ref_rewarded then return new; end if;
  select * into c from config where id = 1;
  -- kuniga ko'pi bilan 10 ta bonus (suiiste'molga qarshi)
  select count(*) into n from bonus_log where user_id = p.referred_by and kind = 'inviter' and created_at > now() - interval '1 day';
  perform set_config('mohir.trusted', '1', true);
  update profiles set ref_rewarded = true where id = p.id;
  perform set_config('mohir.trusted', '0', true);
  if n < 10 and c.ref_bonus_inviter > 0 then
    perform add_bonus(p.referred_by, c.ref_bonus_inviter, 'inviter', 'Do''stingiz ' || p.name || ' birinchi e''lonini joyladi');
  end if;
  return new;
end $$;
drop trigger if exists ads_referral_reward on public.ads;
create trigger ads_referral_reward after insert on public.ads
  for each row execute function public.ads_referral_reward();

-- Bonus bilan xizmat sotib olish
create or replace function public.pay_with_bonus(p_ad uuid, p_svc text) returns void
language plpgsql security definer set search_path = public as $$
declare price int; bal int;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_svc not in ('top','vip','bump','extend','restore','slots') then raise exception 'Noma''lum xizmat'; end if;
  if p_svc <> 'slots' and not exists (select 1 from ads where id = p_ad and user_id = auth.uid()) then raise exception 'E''lon topilmadi'; end if;
  select coalesce((prices ->> p_svc)::int, 0) into price from config where id = 1;
  select bonus into bal from wallets where user_id = auth.uid() for update;
  if coalesce(bal, 0) < price then raise exception 'Bonus yetarli emas'; end if;
  update wallets set bonus = bonus - price where user_id = auth.uid();
  insert into bonus_log (user_id, amount, kind, note) values (auth.uid(), -price, 'spend', p_svc);
  perform apply_service(p_ad, auth.uid(), p_svc);
end $$;

-- Taklif statistikasi
create or replace function public.my_referrals() returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'code', (select ref_code from profiles where id = auth.uid()),
    'bonus', coalesce((select bonus from wallets where user_id = auth.uid()), 0),
    'invited', (select count(*) from profiles where referred_by = auth.uid()),
    'active', (select count(*) from profiles where referred_by = auth.uid() and ref_rewarded),
    'earned', coalesce((select sum(amount) from bonus_log where user_id = auth.uid() and kind in ('inviter','invitee')), 0),
    'referred', (select referred_by is not null from profiles where id = auth.uid())
  )
$$;

revoke execute on function public.gen_ref_code() from public, anon, authenticated;
revoke execute on function public.add_bonus(uuid, int, text, text) from public, anon, authenticated;
revoke execute on function public.profiles_guard() from public, anon, authenticated;
revoke execute on function public.ads_referral_reward() from public, anon, authenticated;
revoke execute on function public.claim_referral(text) from public, anon;
revoke execute on function public.pay_with_bonus(uuid, text) from public, anon;
revoke execute on function public.my_referrals() from public, anon;
grant execute on function public.claim_referral(text), public.pay_with_bonus(uuid, text), public.my_referrals() to authenticated;

do $$
declare n int; m int;
begin
  select count(*) into n from public.profiles where ref_code is not null;
  select count(*) into m from public.profiles;
  raise notice 'NATIJA kodli_profillar=%/% bonus_taklif_qilgan=% bonus_yangi=%', n, m,
    (select ref_bonus_inviter from public.config where id = 1), (select ref_bonus_invitee from public.config where id = 1);
end $$;
