-- Bot: mutaxassis (operator) bilan bog'lash. Admin Telegram chati tg_settings da.
alter table public.tg_settings add column if not exists admin_chat bigint;
alter table public.tg_settings add column if not exists op_token text not null default '';

-- Foydalanuvchi holati: mutaxassis rejimida (op_until gacha)
create table if not exists public.tg_users (
  chat_id bigint primary key,
  name text not null default '',
  username text not null default '',
  op_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.tg_users enable row level security;
revoke all on public.tg_users from anon, authenticated;

-- Admin chatidagi xabar -> qaysi foydalanuvchiga tegishli (reply orqali javob berish uchun)
create table if not exists public.tg_relay (
  admin_msg_id bigint primary key,
  user_chat bigint not null,
  created_at timestamptz not null default now()
);
alter table public.tg_relay enable row level security;
revoke all on public.tg_relay from anon, authenticated;

create or replace function public.get_tg_settings() returns json
language sql security definer set search_path = public as $$
  select json_build_object('token', bot_token, 'username', bot_username, 'secret', secret,
    'admin_chat', admin_chat, 'op_token', op_token) from tg_settings where id = 1
$$;
revoke execute on function public.get_tg_settings() from public, anon, authenticated;
grant execute on function public.get_tg_settings() to service_role;

-- Admin panel: botda "operator" bo'lish uchun bir martalik havola kodi
create or replace function public.admin_tg_op_link() returns text
language plpgsql security definer set search_path = public as $$
declare tok text := encode(extensions.gen_random_bytes(12), 'hex');
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update tg_settings set op_token = tok where id = 1;
  return tok;
end $$;
revoke execute on function public.admin_tg_op_link() from public, anon;
grant execute on function public.admin_tg_op_link() to authenticated;

create or replace function public.admin_tg_status() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('username', bot_username, 'has_token', bot_token <> '', 'has_operator', admin_chat is not null) from tg_settings where id = 1);
end $$;
revoke execute on function public.admin_tg_status() from public, anon;
grant execute on function public.admin_tg_status() to authenticated;

select 'NATIJA operator tayyor';
