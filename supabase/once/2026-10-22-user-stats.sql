-- Admin: ro'yxatdan o'tganlar statistikasi (O'zbekiston vaqti bilan)
create or replace function public.admin_user_stats() returns json
language plpgsql security definer set search_path = public, auth as $$
declare tz text := 'Asia/Samarkand'; d0 date := (now() at time zone tz)::date;
begin
  if not public.is_admin() then raise exception 'Ruxsat yo''q'; end if;
  return json_build_object(
    'today', (select count(*) from auth.users where (created_at at time zone tz)::date = d0),
    'yesterday', (select count(*) from auth.users where (created_at at time zone tz)::date = d0 - 1),
    'week', (select count(*) from auth.users where (created_at at time zone tz)::date > d0 - 7),
    'month', (select count(*) from auth.users where (created_at at time zone tz)::date > d0 - 30),
    'total', (select count(*) from auth.users),
    'days', (select json_agg(json_build_object('d', g::date, 'n', (select count(*) from auth.users u where (u.created_at at time zone tz)::date = g::date)) order by g desc)
             from generate_series(d0 - 13, d0, interval '1 day') g)
  );
end $$;
revoke execute on function public.admin_user_stats() from public, anon;
grant execute on function public.admin_user_stats() to authenticated;
select 'NATIJA ' || (select count(*) from auth.users) || ' ta foydalanuvchi';
