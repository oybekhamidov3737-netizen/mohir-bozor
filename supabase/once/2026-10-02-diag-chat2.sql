-- Tekshiruv (faqat o'qish)
do $$
declare r record;
begin
  raise notice 'NATIJA suhbatlar=% xabarlar=% triggerlar=% profillar_faol=%',
    (select count(*) from threads), (select count(*) from messages),
    (select string_agg(tgname::text || ':' || tgenabled::text, ',') from pg_trigger where tgrelid = 'public.messages'::regclass and not tgisinternal),
    (select count(*) from profiles where last_seen is not null);
  for r in select m.thread_id, left(m.body, 15) b, m.created_at, p.name from messages m join profiles p on p.id = m.sender_id order by m.id desc limit 3 loop
    raise notice 'NATIJA xabar [%] %: % (%)', left(r.thread_id::text, 6), r.name, r.b, to_char(r.created_at at time zone 'Asia/Samarkand', 'HH24:MI:SS');
  end loop;
  for r in select left(id::text, 6) i, left(coalesce(last_text,''), 15) lt, to_char(last_at at time zone 'Asia/Samarkand', 'HH24:MI:SS') la from threads order by created_at desc limit 5 loop
    raise notice 'NATIJA suhbat [%] last=% vaqt=%', r.i, r.lt, r.la;
  end loop;
end $$;
