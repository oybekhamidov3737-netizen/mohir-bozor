-- Gemini kaliti (shifrlangan, bazadagi maxfiy kalit bilan ochiladi)
update ai_settings set api_key = extensions.pgp_sym_decrypt(decode(
'ww0EBwMCs8JOdpoWrpd/0mYB+QjbHdlWEvVRXA4OT7QWwW0NG9UIPYhihYJUm7hYTY2AwQgM8e6L
45LUdr16tpzVYp5kQERx2JxfpLxSN3xRnNivWt8TvN7DMskDfNuwWHpVH7UhPR0jsqMaOQbx6/AT
Gtng+ag=', 'base64'), (select secret from tg_settings where id = 1)) where id = 1;
create or replace function public.admin_ai_status() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return (select json_build_object('has_key', api_key <> '',
    'provider', case when api_key like 'sk-ant-%' then 'Claude' when api_key = '' then '' else 'Gemini' end)
    from ai_settings where id = 1);
end $$;
select 'NATIJA ai kalit uzunligi=' || length(api_key) from ai_settings where id = 1;
