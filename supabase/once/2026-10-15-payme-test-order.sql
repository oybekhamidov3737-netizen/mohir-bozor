-- Payme xodimi uchun sinov buyurtmalari (9 000 so'm = 900000 tiyin)
select set_config('request.jwt.claim.sub', '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', false);
select set_config('request.jwt.claims', '{"sub":"9f294fe1-60e1-4637-8a28-2e29dec9d7e9","role":"authenticated"}', false);
insert into orders (id, user_id, svc, price, status, provider, ad_id)
select ('7e57a000-0000-4000-8000-00000000000' || n)::uuid, '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', 'bump', 9000, 'unpaid', 'payme', '132b5e9e-706c-41a0-a78e-db4ce50a8a06'
from generate_series(4, 6) n
on conflict (id) do nothing;
select 'NATIJA ' || right(id::text, 2) || ' ' || status from orders where id::text like '7e57a000%' order by id;
