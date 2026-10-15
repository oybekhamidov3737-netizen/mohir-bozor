-- Payme pesochnitsasi uchun yangi sinov buyurtmalari (9 000 so'm, e'lonni ko'tarish)
select set_config('request.jwt.claim.sub', '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', false);
select set_config('request.jwt.claims', '{"sub":"9f294fe1-60e1-4637-8a28-2e29dec9d7e9","role":"authenticated"}', false);
insert into orders (id, user_id, svc, price, status, provider, ad_id) values
 ('7e57a000-0000-4000-8000-000000000002', '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', 'bump', 9000, 'unpaid', 'payme', '132b5e9e-706c-41a0-a78e-db4ce50a8a06'),
 ('7e57a000-0000-4000-8000-000000000003', '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', 'bump', 9000, 'unpaid', 'payme', '132b5e9e-706c-41a0-a78e-db4ce50a8a06')
on conflict (id) do nothing;
select 'NATIJA ' || right(id::text, 1) || ' ' || status from orders where id::text like '7e57a000%' order by id;
