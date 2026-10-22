-- Tasdiqlanmagan (chala qolgan) 2FA yozuvlarini o'chirish
delete from auth.mfa_factors where status = 'unverified';
select 'NATIJA 2FA faktorlar: ' || count(*) from auth.mfa_factors;
