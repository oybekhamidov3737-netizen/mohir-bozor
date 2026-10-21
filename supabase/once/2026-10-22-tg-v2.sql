-- Bot 2.0: foydalanuvchi tili va mutaxassis ishiga baho
alter table public.tg_users add column if not exists lang text;
create table if not exists public.tg_ratings (
  id bigserial primary key,
  chat_id bigint not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);
alter table public.tg_ratings enable row level security;
revoke all on public.tg_ratings from anon, authenticated;
select 'NATIJA tg v2 tayyor';
