-- Admin ikki bosqichli himoyasini qayta tiklash (egasi kodni saqlamagan). Keyin ilovada yangidan yoqiladi.
delete from auth.mfa_factors where id = 'fc4adb24-0a03-48c9-96a5-dcf52a3a1d8c';
select 'NATIJA qolgan omillar=' || count(*) from auth.mfa_factors;
