-- Reyting: mijoz ijrochiga (va aksincha) suhbatdan keyin baho qo'yadi.
-- Faqat haqiqiy suhbat qatnashchisi, bir suhbatga bitta baho, o'ziga baho qo'yib bo'lmaydi.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads on delete cascade,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  target_id uuid not null references auth.users on delete cascade,
  stars int not null check (stars between 1 and 5),
  body text not null default '' check (char_length(body) <= 500),
  created_at timestamptz not null default now(),
  unique (thread_id, author_id)
);
create index if not exists reviews_target_idx on public.reviews (target_id, created_at desc);
alter table public.reviews enable row level security;
drop policy if exists "reviews read" on public.reviews;
create policy "reviews read" on public.reviews for select using (true);
drop policy if exists "reviews insert" on public.reviews;
create policy "reviews insert" on public.reviews for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "reviews delete" on public.reviews;
create policy "reviews delete" on public.reviews for delete to authenticated using (author_id = auth.uid() or public.is_admin());
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

create or replace function public.reviews_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare t threads;
begin
  new.author_id := auth.uid();
  select * into t from threads where id = new.thread_id;
  if t.id is null or t.ad_id is null then raise exception 'Suhbat topilmadi'; end if;
  if auth.uid() not in (t.buyer_id, t.seller_id) then raise exception 'Faqat suhbat qatnashchisi baho qo''ya oladi'; end if;
  new.target_id := case when auth.uid() = t.buyer_id then t.seller_id else t.buyer_id end;
  if new.target_id = auth.uid() then raise exception 'O''zingizga baho qo''yib bo''lmaydi'; end if;
  -- kamida ikki tomon ham yozgan bo'lishi kerak (soxta baholarga qarshi)
  if (select count(distinct sender_id) from messages where thread_id = t.id) < 2 then
    raise exception 'Baho qo''yish uchun avval suhbatlashing';
  end if;
  if tg_op = 'UPDATE' then new.thread_id := old.thread_id; new.created_at := old.created_at; end if;
  return new;
end $$;
revoke execute on function public.reviews_guard() from public, anon, authenticated;
drop trigger if exists reviews_guard on public.reviews;
create trigger reviews_guard before insert or update on public.reviews for each row execute function public.reviews_guard();

-- Profilda o'rtacha baho va soni (tez o'qish uchun)
alter table public.profiles add column if not exists rating numeric(3,2) not null default 0;
alter table public.profiles add column if not exists rating_count int not null default 0;
create or replace function public.reviews_aggregate() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := coalesce(new.target_id, old.target_id);
begin
  perform set_config('mohir.trusted', '1', true);
  update profiles set
    rating = coalesce((select round(avg(stars)::numeric, 2) from reviews where target_id = uid), 0),
    rating_count = (select count(*) from reviews where target_id = uid)
  where id = uid;
  perform set_config('mohir.trusted', '0', true);
  return null;
end $$;
revoke execute on function public.reviews_aggregate() from public, anon, authenticated;
drop trigger if exists reviews_aggregate on public.reviews;
create trigger reviews_aggregate after insert or update or delete on public.reviews for each row execute function public.reviews_aggregate();

-- Foydalanuvchi o'zi reytingini o'zgartira olmasin
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('mohir.trusted', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    new.ref_code := public.gen_ref_code();
    new.referred_by := null;
    new.ref_rewarded := false;
    new.rating := 0;
    new.rating_count := 0;
  else
    new.ref_code := coalesce(old.ref_code, public.gen_ref_code());
    new.referred_by := old.referred_by;
    new.ref_rewarded := old.ref_rewarded;
    new.rating := old.rating;
    new.rating_count := old.rating_count;
  end if;
  return new;
end $$;

-- "Istagan ishim": qaysi yo'nalish va hududdagi buyurtmalar tavsiya qilinsin
alter table public.profiles add column if not exists pref_cats text[] not null default '{}';
alter table public.profiles add column if not exists pref_regions text[] not null default '{}';

do $$
begin
  raise notice 'NATIJA reviews=% trigger=% rating_ustun=%',
    (select count(*) from pg_tables where tablename = 'reviews'),
    (select count(*) from pg_trigger where tgname in ('reviews_guard', 'reviews_aggregate')),
    (select count(*) from information_schema.columns where table_name = 'profiles' and column_name in ('rating', 'rating_count', 'pref_cats', 'pref_regions'));
end $$;
