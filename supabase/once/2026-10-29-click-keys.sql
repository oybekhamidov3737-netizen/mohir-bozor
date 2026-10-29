-- Click: Service ID va Secret key (shifrlangan). Merchant ID keyin qo'shiladi — ungacha saytda Click tugmasi chiqmaydi.
update payment_secrets set click_secret = extensions.pgp_sym_decrypt(decode(
'ww0EBwMCPiXSND6lEZ5g0jsBQVYvbngsJxQ7sZvTfuRZPw2GDoEDB7ifEH9cBdOltu1kXDjO8a36
aQfREVndTUtEMfZzkixAKTdKFQ==', 'base64'), (select secret from tg_settings where id = 1));
update config set click_service_id = '114502' where id = 1;
select 'NATIJA kalit uzunligi=' || length(click_secret) || ' sid=' || (select click_service_id from config where id=1) from payment_secrets;
