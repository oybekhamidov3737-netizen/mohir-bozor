-- Click Merchant ID (endi saytda Click tugmasi chiqadi)
update config set click_merchant_id = '66068' where id = 1;
select 'NATIJA click ' || click_service_id || '/' || click_merchant_id from config where id = 1;
