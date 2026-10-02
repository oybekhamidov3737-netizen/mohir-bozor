-- Apple / Google tekshiruvchilari uchun sinov hisobi.
-- Bazada parolning o'zi emas, faqat SHA-256 xeshi saqlanadi.
alter table public.mail_settings add column if not exists review_email text not null default '';
alter table public.mail_settings add column if not exists review_pass text not null default '';
update public.mail_settings set review_email = 'mohir.review@gmail.com', review_pass = 'sha256:63734d950c14192620b7e0cff40f20e550901c2a288577c502ae960d68b18cd2' where id = 1;

create or replace function public.get_mail_settings() returns json
language sql security definer set search_path = public as $$
  select json_build_object('smtp_user', smtp_user, 'smtp_pass', smtp_pass, 'review_email', review_email, 'review_pass', review_pass)
  from mail_settings where id = 1
$$;
revoke execute on function public.get_mail_settings() from public, anon, authenticated;
grant execute on function public.get_mail_settings() to service_role;

do $$ begin raise notice 'NATIJA sinov_hisobi=% xesh=%', (select review_email from public.mail_settings where id = 1), (select left(review_pass, 14) from public.mail_settings where id = 1); end $$;
