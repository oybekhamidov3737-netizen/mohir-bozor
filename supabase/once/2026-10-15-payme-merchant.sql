-- Payme kassa ID (ochiq ma'lumot, sir emas) va sinov rejimi
update config set payme_merchant_id = '6ad0b712329182586b8c5b17', payme_test = true;
select 'NATIJA merchant=' || payme_merchant_id || ' test=' || payme_test from config;
select 'NATIJA kalit kiritilgan=' || (coalesce(payme_key,'') <> '') from payment_secrets;
