-- SMS orqali kirish (Eskiz.uz). Login/parol faqat shu jadvalda, ochiq kodda yo'q.
create table if not exists public.sms_settings (
  id int primary key default 1 check (id = 1),
  eskiz_email text not null default '',
  eskiz_password text not null default '',
  sender text not null default '4546',
  token text not null default '',
  token_at timestamptz
);
insert into public.sms_settings (id) values (1) on conflict (id) do nothing;
alter table public.sms_settings enable row level security;
revoke all on public.sms_settings from anon, authenticated;

-- Ilova sozlamasi: SMS orqali kirish yoqilganmi (foydalanuvchilarga ko'rinadi)
alter table public.config add column if not exists sms_login boolean not null default false;

-- Edge function (service_role) uchun
create or replace function public.get_sms_settings() returns json
language sql security definer set search_path = public as $$
  select json_build_object('email', eskiz_email, 'password', eskiz_password, 'sender', sender, 'token', token, 'token_at', token_at)
  from sms_settings where id = 1
$$;
revoke execute on function public.get_sms_settings() from public, anon, authenticated;
grant execute on function public.get_sms_settings() to service_role;

create or replace function public.set_sms_token(p_token text) returns void
language sql security definer set search_path = public as $$
  update sms_settings set token = coalesce(p_token, ''), token_at = now() where id = 1
$$;
revoke execute on function public.set_sms_token(text) from public, anon, authenticated;
grant execute on function public.set_sms_token(text) to service_role;

-- Admin panel: Eskiz login/parolini saqlash (qaytarib o'qib bo'lmaydi)
create or replace function public.admin_set_sms(p_email text, p_password text, p_sender text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  update sms_settings set
    eskiz_email = coalesce(nullif(trim(p_email), ''), eskiz_email),
    eskiz_password = coalesce(nullif(p_password, ''), eskiz_password),
    sender = coalesce(nullif(trim(p_sender), ''), sender),
    token = '', token_at = null
  where id = 1;
  insert into admin_log (action, note) values ('sms_settings', 'SMS sozlamalari o''zgartirildi');
end $$;
revoke execute on function public.admin_set_sms(text, text, text) from public, anon;
grant execute on function public.admin_set_sms(text, text, text) to authenticated;

create or replace function public.admin_sms_status() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('email', eskiz_email, 'has_password', eskiz_password <> '', 'sender', sender) from sms_settings where id = 1);
end $$;
revoke execute on function public.admin_sms_status() from public, anon;
grant execute on function public.admin_sms_status() to authenticated;

select 'NATIJA sms_settings tayyor';
