-- Onlayn holati (oxirgi faollik vaqti)
alter table public.profiles add column if not exists last_seen timestamptz;

create or replace function public.touch_seen() returns void
language sql security definer set search_path = public as $$
  update profiles set last_seen = now()
  where id = auth.uid() and (last_seen is null or last_seen < now() - interval '30 seconds');
$$;
revoke execute on function public.touch_seen() from public, anon;
grant execute on function public.touch_seen() to authenticated;

-- O'qildi belgisi jonli yangilanishi uchun suhbatlar realtime'da bo'lishi kerak
do $$ begin
  begin alter publication supabase_realtime add table public.threads; exception when others then null; end;
end $$;

do $$ begin raise notice 'NATIJA last_seen=% touch_seen=%',
  (select exists(select 1 from information_schema.columns where table_name='profiles' and column_name='last_seen')),
  (select exists(select 1 from pg_proc where proname='touch_seen')); end $$;
