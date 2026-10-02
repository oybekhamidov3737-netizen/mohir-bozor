-- Foydalanuvchini bloklash (App Store 1.2 talabi: haqoratli foydalanuvchini bloklash imkoniyati)
create table if not exists public.blocks (
  blocker uuid not null default auth.uid() references auth.users on delete cascade,
  blocked uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.blocks enable row level security;
drop policy if exists "blocks own" on public.blocks;
create policy "blocks own" on public.blocks for all to authenticated
  using (blocker = auth.uid()) with check (blocker = auth.uid());
grant select, insert, delete on public.blocks to authenticated;

-- Bloklangan bo'lsa xabar yuborib bo'lmaydi (qo'llab-quvvatlash suhbatidan tashqari)
create or replace function public.messages_block_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare t record; other uuid;
begin
  select * into t from threads where id = new.thread_id;
  if t.ad_id is null then return new; end if;
  other := case when t.buyer_id = new.sender_id then t.seller_id else t.buyer_id end;
  if exists (select 1 from blocks where (blocker = other and blocked = new.sender_id)
                                     or (blocker = new.sender_id and blocked = other)) then
    raise exception 'Bu foydalanuvchi bilan yozishib bo''lmaydi (bloklangan)';
  end if;
  return new;
end $$;
revoke execute on function public.messages_block_guard() from public, anon, authenticated;
drop trigger if exists messages_block_guard on public.messages;
create trigger messages_block_guard before insert on public.messages
  for each row execute function public.messages_block_guard();

do $$
begin
  raise notice 'NATIJA bloklash=% trigger=%',
    (select count(*) from pg_tables where tablename = 'blocks'),
    (select count(*) from pg_trigger where tgname = 'messages_block_guard');
end $$;
