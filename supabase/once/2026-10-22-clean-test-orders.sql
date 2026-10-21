-- Payme ulash paytidagi sinov buyurtmalarini o'chirish (bekor qilingan / to'lanmagan)
delete from public.orders where provider = 'payme' and status in ('no', 'unpaid');
select 'NATIJA qoldi: ' || count(*) || ' ta buyurtma' from public.orders;
