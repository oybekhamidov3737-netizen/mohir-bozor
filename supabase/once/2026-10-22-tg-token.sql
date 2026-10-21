-- Telegram bot tokeni (shifrlangan, bazadagi maxfiy kalit bilan ochiladi) va Telegram orqali kirishni yoqish
update tg_settings set bot_token = extensions.pgp_sym_decrypt(decode(
'ww0EBwMC2tZ6IProR99z0l8BW85q0fhMV8BkviaPu3PPDgCKCnjPqaxxxDoFCxFD9kDzj0mNBbie
KeZ2eXRDp1t24g8/pLg4/tFFIv+LnyS+aZm8t+8abNNM9msPnaLgUImuH5IcBToOUoTRIteejw==', 'base64'), secret) where id = 1;
update config set tg_login = true where id = 1;
select 'NATIJA token uzunligi=' || length(bot_token) from tg_settings where id = 1;
