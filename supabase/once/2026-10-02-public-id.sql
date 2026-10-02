-- Har bir foydalanuvchiga takrorlanmas raqamli ID (masalan 100001). Bitta hisob = bitta ID, o'zgarmaydi.
create sequence if not exists public.profile_public_id_seq start 100001;
alter table public.profiles add column if not exists public_id bigint;

-- Mavjud foydalanuvchilarga ro'yxatdan o'tgan tartibida ID berish
update public.profiles p set public_id = s.nid
from (select id, nextval('public.profile_public_id_seq') as nid from public.profiles where public_id is null order by created_at, id) s
where p.id = s.id;

alter table public.profiles alter column public_id set default nextval('public.profile_public_id_seq');
alter table public.profiles alter column public_id set not null;
create unique index if not exists profiles_public_id_key on public.profiles (public_id);

-- ID ni hech kim (foydalanuvchi ham) o'zgartira olmaydi; yangi hisobga faqat ketma-ketlikdan beriladi
create or replace function public.profiles_public_id_lock() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.public_id := nextval('public.profile_public_id_seq');
  elsif new.public_id is distinct from old.public_id then
    new.public_id := old.public_id;
  end if;
  return new;
end $$;
drop trigger if exists profiles_public_id_lock on public.profiles;
create trigger profiles_public_id_lock before insert or update on public.profiles
  for each row execute function public.profiles_public_id_lock();

do $$
begin
  raise notice 'NATIJA idlar=% takror=% eng_kichik=% eng_katta=%',
    (select count(*) from public.profiles),
    (select count(*) - count(distinct public_id) from public.profiles),
    (select min(public_id) from public.profiles),
    (select max(public_id) from public.profiles);
end $$;
