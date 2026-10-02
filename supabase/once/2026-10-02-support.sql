-- Qo'llab-quvvatlash va shikoyatlar
alter table public.config add column if not exists support_phone text not null default '+998 91 001 88 18';
update public.config set support_phone = '+998 91 001 88 18' where id = 1;

create or replace function public.start_support_thread() returns uuid
language plpgsql security definer set search_path = public as $$
declare a uuid; tid uuid;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select user_id into a from admins order by user_id limit 1;
  if a is null then raise exception 'Qo''llab-quvvatlash hali ulanmagan'; end if;
  if a = auth.uid() then raise exception 'Siz adminsiz: murojaatlar Xabarlar bo''limida'; end if;
  select id into tid from threads where ad_id is null and buyer_id = auth.uid() and seller_id = a limit 1;
  if tid is null then
    insert into threads (ad_id, buyer_id, seller_id) values (null, auth.uid(), a) returning id into tid;
  end if;
  return tid;
end $$;
revoke execute on function public.start_support_thread() from public, anon;
grant execute on function public.start_support_thread() to authenticated;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  reason text not null check (reason in ('fraud','offtopic','contact','spam','offensive','other')),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open','done')),
  created_at timestamptz not null default now(),
  unique (ad_id, user_id)
);
alter table public.reports enable row level security;
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "reports read" on public.reports;
create policy "reports read" on public.reports for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reports admin" on public.reports;
create policy "reports admin" on public.reports for update using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.reports to authenticated;

do $$
declare p text; f boolean; r boolean;
begin
  select support_phone into p from public.config where id = 1;
  select exists(select 1 from pg_proc where proname = 'start_support_thread') into f;
  select exists(select 1 from pg_tables where tablename = 'reports') into r;
  raise notice 'NATIJA telefon=% funksiya=% shikoyatlar=%', p, f, r;
end $$;
