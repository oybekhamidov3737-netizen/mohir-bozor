-- Telegram orqali kirish: bot tokeni faqat shu jadvalda (ochiq kodda yo'q)
create table if not exists public.tg_settings (
  id int primary key default 1 check (id = 1),
  bot_token text not null default '',
  bot_username text not null default '',
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex')
);
insert into public.tg_settings (id) values (1) on conflict (id) do nothing;
alter table public.tg_settings enable row level security;
revoke all on public.tg_settings from anon, authenticated;

-- Kirish so'rovlari (bir martalik, 10 daqiqa)
create table if not exists public.tg_logins (
  token text primary key,
  chat_id bigint,
  email text,
  otp text,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.tg_logins enable row level security;
revoke all on public.tg_logins from anon, authenticated;

alter table public.config add column if not exists tg_login boolean not null default false;
alter table public.config add column if not exists tg_bot text not null default '';

create or replace function public.get_tg_settings() returns json
language sql security definer set search_path = public as $$
  select json_build_object('token', bot_token, 'username', bot_username, 'secret', secret) from tg_settings where id = 1
$$;
revoke execute on function public.get_tg_settings() from public, anon, authenticated;
grant execute on function public.get_tg_settings() to service_role;

create or replace function public.admin_set_tg(p_token text, p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare u text := regexp_replace(coalesce(p_username, ''), '^@', '');
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  if coalesce(p_token, '') <> '' and p_token !~ '^\d+:[A-Za-z0-9_-]{30,}$' then
    raise exception 'Bot tokeni noto''g''ri ko''rinishda';
  end if;
  update tg_settings set
    bot_token = coalesce(nullif(trim(p_token), ''), bot_token),
    bot_username = coalesce(nullif(trim(u), ''), bot_username)
  where id = 1;
  update config set tg_bot = (select bot_username from tg_settings where id = 1) where id = 1;
  insert into admin_log (action, note) values ('tg_settings', 'Telegram bot sozlamalari o''zgartirildi');
end $$;
revoke execute on function public.admin_set_tg(text, text) from public, anon;
grant execute on function public.admin_set_tg(text, text) to authenticated;

create or replace function public.admin_tg_status() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('username', bot_username, 'has_token', bot_token <> '') from tg_settings where id = 1);
end $$;
revoke execute on function public.admin_tg_status() from public, anon;
grant execute on function public.admin_tg_status() to authenticated;

select 'NATIJA telegram tayyor';
