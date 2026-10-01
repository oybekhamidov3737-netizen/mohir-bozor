-- Payme/Click sinovidan qolgan vaqtinchalik ma'lumotlarni o'chirish
delete from public.click_tx where order_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
delete from public.payme_tx where order_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
delete from public.orders where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
update public.payment_secrets set payme_key = '', click_secret = '' where id = 1 and payme_key = 'TESTKEY_mohir_1';
update public.config set click_service_id = '' where id = 1 and click_service_id = '99999';
do $$
declare n int; s boolean; c text;
begin
  select count(*) into n from public.orders where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
  select payme_key = '' and click_secret = '' into s from public.payment_secrets where id = 1;
  select click_service_id into c from public.config where id = 1;
  raise notice 'NATIJA test_buyurtmalar=% kalitlar_tozalangan=% click_id=%', n, s, coalesce(nullif(c, ''), '(bosh)');
end $$;
