-- Taklif kodini kengaytmasiz yaratish (har qanday search_path'da ishlaydi)
create or replace function public.gen_ref_code() returns text
language plpgsql set search_path = public as $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where ref_code = c);
  end loop;
  return c;
end $$;
revoke execute on function public.gen_ref_code() from public, anon, authenticated;
do $$ begin raise notice 'NATIJA namuna_kod=%', public.gen_ref_code(); end $$;
