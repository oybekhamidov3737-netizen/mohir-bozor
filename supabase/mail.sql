-- Kirish kodini Gmail orqali yuborish uchun yordamchi jadvallar.
-- Parol bu faylda YO'Q: u faqat Supabase bazasidagi mail_settings jadvalida saqlanadi.
create table if not exists public.mail_settings (id int primary key default 1 check (id = 1), smtp_user text not null, smtp_pass text not null);
alter table public.mail_settings enable row level security;
revoke all on public.mail_settings from anon, authenticated;
create table if not exists public.otp_log (id bigserial primary key, email text not null, created_at timestamptz not null default now());
create index if not exists otp_log_email_idx on public.otp_log (email, created_at);
alter table public.otp_log enable row level security;
revoke all on public.otp_log from anon, authenticated;
create or replace function public.otp_allow(p_email text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from otp_log where created_at < now() - interval '2 days';
  if exists (select 1 from otp_log where email = p_email and created_at > now() - interval '60 seconds') then return false; end if;
  if (select count(*) from otp_log where email = p_email and created_at > now() - interval '1 hour') >= 6 then return false; end if;
  if (select count(*) from otp_log where created_at > now() - interval '1 day') >= 450 then return false; end if;
  insert into otp_log (email) values (p_email);
  return true;
end $$;
create or replace function public.get_mail_settings() returns json language sql security definer set search_path = public as $$
  select json_build_object('smtp_user', smtp_user, 'smtp_pass', smtp_pass) from mail_settings where id = 1
$$;
revoke execute on function public.otp_allow(text) from public, anon, authenticated;
revoke execute on function public.get_mail_settings() from public, anon, authenticated;
grant execute on function public.otp_allow(text) to service_role;
grant execute on function public.get_mail_settings() to service_role;
