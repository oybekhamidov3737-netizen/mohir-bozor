-- Telegram bot uchun sun'iy intellekt (support). Kalit faqat shu jadvalda.
create table if not exists public.ai_settings (
  id int primary key default 1 check (id = 1),
  api_key text not null default ''
);
insert into public.ai_settings (id) values (1) on conflict (id) do nothing;
alter table public.ai_settings enable row level security;
revoke all on public.ai_settings from anon, authenticated;

-- Suhbat tarixi (kontekst uchun) va kunlik limit
create table if not exists public.tg_chat_log (
  id bigserial primary key,
  chat_id bigint not null,
  role text not null check (role in ('user', 'bot')),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists tg_chat_log_chat on public.tg_chat_log (chat_id, created_at desc);
alter table public.tg_chat_log enable row level security;
revoke all on public.tg_chat_log from anon, authenticated;

create or replace function public.get_ai_key() returns text
language sql security definer set search_path = public as $$ select api_key from ai_settings where id = 1 $$;
revoke execute on function public.get_ai_key() from public, anon, authenticated;
grant execute on function public.get_ai_key() to service_role;

create or replace function public.admin_set_ai_key(p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update ai_settings set api_key = trim(coalesce(p_key, '')) where id = 1;
  insert into admin_log (action, note) values ('ai_key', 'AI kaliti o''zgartirildi');
end $$;
revoke execute on function public.admin_set_ai_key(text) from public, anon;
grant execute on function public.admin_set_ai_key(text) to authenticated;

create or replace function public.admin_ai_status() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('has_key', api_key <> '',
    'provider', case when api_key like 'sk-ant-%' then 'Claude' when api_key like 'AIza%' then 'Gemini' when api_key = '' then '' else '?' end)
    from ai_settings where id = 1);
end $$;
revoke execute on function public.admin_ai_status() from public, anon;
grant execute on function public.admin_ai_status() to authenticated;

select 'NATIJA ai tayyor';
