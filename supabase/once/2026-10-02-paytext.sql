-- To'lov rekvizitidan "Izohga e'lon nomini yozing" qatorini olib tashlash
update public.config set pay_text = E'Karta: 9860 1201 2508 3127\nEgasi: Oybek X' where id = 1;
do $$ begin raise notice 'NATIJA pay_text=%', replace((select pay_text from public.config where id = 1), E'\n', ' | '); end $$;
