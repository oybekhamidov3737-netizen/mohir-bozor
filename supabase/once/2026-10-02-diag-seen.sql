-- Tekshiruv: touch_seen foydalanuvchi nomidan ishlaydimi (o'zgarish bekor qilinadi)
begin;
select set_config('request.jwt.claims', json_build_object('sub', (select id::text from profiles where name = 'Oybek' limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;
select public.touch_seen();
reset role;
do $$ begin raise notice 'NATIJA oybek_last_seen=%', (select last_seen from profiles where name = 'Oybek' limit 1); end $$;
rollback;
