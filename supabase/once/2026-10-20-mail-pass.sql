-- Gmail ilova paroli yangilandi (shifrlangan, joriy parol bilan ochiladi; ochiq matn yo'q)
update mail_settings set smtp_pass = extensions.pgp_sym_decrypt(decode(
'ww0EBwMCoKOevkwvRJB80kEBfxlYNSFcezxG0OsJeuadt9ChKEZDkUUb7Dnl0zo8hUWjoKZrfonr
bEHdRXjrYdAH9GUOpVCagmywH1Pqy93cIA==', 'base64'), smtp_pass)
where id = 1 and smtp_pass like 'ma%';
select 'NATIJA uzunlik=' || length(smtp_pass) || ' yangi=' || (smtp_pass like 'vf%') from mail_settings where id = 1;
