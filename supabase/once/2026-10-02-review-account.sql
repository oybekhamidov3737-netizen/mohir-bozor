-- Apple / Google tekshiruvchilari uchun sinov hisobi (parol faqat bazada, serverda tekshiriladi)
alter table public.mail_settings add column if not exists review_email text not null default '';
alter table public.mail_settings add column if not exists review_pass text not null default '';
update public.mail_settings set review_email = 'mohir.review@gmail.com', review_pass = 'Mohir-8NqnL9AFqz' where id = 1;

create or replace function public.get_mail_settings() returns json
language sql security definer set search_path = public as $$
  select json_build_object('smtp_user', smtp_user, 'smtp_pass', smtp_pass, 'review_email', review_email, 'review_pass', review_pass)
  from mail_settings where id = 1
$$;
revoke execute on function public.get_mail_settings() from public, anon, authenticated;
grant execute on function public.get_mail_settings() to service_role;

do $$ begin raise notice 'NATIJA sinov_hisobi=%', (select review_email from public.mail_settings where id = 1); end $$;
