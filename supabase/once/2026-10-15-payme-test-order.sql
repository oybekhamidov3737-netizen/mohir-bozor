-- Payme pesochnitsasi uchun sinov buyurtmasi (9 000 so'm, e'lonni ko'tarish)
insert into orders (id, user_id, svc, price, status, provider, ad_id)
values ('7e57a000-0000-4000-8000-000000000001', '9f294fe1-60e1-4637-8a28-2e29dec9d7e9', 'bump', 9000, 'unpaid', 'payme', '132b5e9e-706c-41a0-a78e-db4ce50a8a06')
on conflict (id) do update set status = 'unpaid', price = 9000;
select 'NATIJA order=' || id || ' price=' || price || ' status=' || status from orders where id = '7e57a000-0000-4000-8000-000000000001';
