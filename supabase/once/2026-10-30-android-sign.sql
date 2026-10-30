-- Android imzo kaliti (upload key) uchun parol — shifrlangan. Kalit fayli .github/signing/android-signing.enc da (AES).
alter table payment_secrets add column if not exists android_sign_key text;
update payment_secrets set android_sign_key = extensions.pgp_sym_decrypt(decode(
'ww0EBwMC5mspuPfT6HRt0nEBa99sTmwGXoFPgOJd+h6Oj7xMyDALx7clwhN/4uRi1XqaY5LZEpOV
KW9e4Tjg99zKu/S0HwvbT7x/8q+jl/lnShVavt2PnH7/ipEM8BwHcfgIPyBMqoK6NlgBQ5I0OrSz
5y32T5FYPyJX69c+Eif2oQ==', 'base64'), (select secret from tg_settings where id = 1));
select 'NATIJA android kalit uzunligi=' || length(android_sign_key) from payment_secrets;
