-- Tekshiruv (faqat o'qish): oxirgi suhbatlar va onlayn holati
do $$
declare r record;
begin
  for r in
    select t.id, left(t.last_text, 20) lt, t.last_at, t.buyer_read_at, t.seller_read_at,
           pb.name bn, pb.last_seen bs, ps.name sn, ps.last_seen ss,
           (select name from profiles where id = t.last_sender) sender
    from threads t
    join profiles pb on pb.id = t.buyer_id
    join profiles ps on ps.id = t.seller_id
    order by t.last_at desc limit 3
  loop
    raise notice 'NATIJA [%] yuboruvchi=% matn=% vaqt=% | xaridor % o''qidi=% faol=% | sotuvchi % o''qidi=% faol=%',
      left(r.id::text, 6), r.sender, r.lt, to_char(r.last_at at time zone 'Asia/Samarkand', 'HH24:MI:SS'),
      r.bn, to_char(r.buyer_read_at at time zone 'Asia/Samarkand', 'HH24:MI:SS'), coalesce(to_char(r.bs at time zone 'Asia/Samarkand', 'HH24:MI'), 'yoq'),
      r.sn, to_char(r.seller_read_at at time zone 'Asia/Samarkand', 'HH24:MI:SS'), coalesce(to_char(r.ss at time zone 'Asia/Samarkand', 'HH24:MI'), 'yoq');
  end loop;
end $$;
