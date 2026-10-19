-- Tashlab ketilgan (to'lanmagan) va sinov buyurtmalarini tozalash; Payme tranzaksiyasi borlari tarix uchun qoladi
delete from orders o where o.status = 'unpaid'
  and not exists (select 1 from payme_tx t where t.order_id = o.id);
select 'NATIJA qolgan unpaid=' || count(*) from orders where status = 'unpaid';
