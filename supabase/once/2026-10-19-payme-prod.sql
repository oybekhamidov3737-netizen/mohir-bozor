-- Payme: asosiy (prod) rejimga o'tish.
-- Prod kalit shifrlangan holda (ochiq repoda ochiq matn yo'q); bazadagi joriy kalit bilan ochiladi.
update payment_secrets set payme_key = extensions.pgp_sym_decrypt(decode(
'ww0EBwMC7IAd5wapdwtu0lUBs5poPV6h0OkSSlrLzrhoDArfxZooPuADr+j9H7Q7TRQJedMmfmQp
fVKe40m4goKq5wy887T5k4qcq3Qb2G6t6kqFalm/H4kTQm90OdFZPu9UeaTX', 'base64'), payme_key)
where payme_key like 'HA0S%';
update config set payme_test = false;
select 'NATIJA kalit_uzunligi=' || length(payme_key) || ' prod=' || (payme_key like 'yd8Q%') from payment_secrets;
select 'NATIJA test_rejim=' || payme_test || ' merchant=' || payme_merchant_id from config;
