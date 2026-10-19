-- Qo'lda kartaga o'tkazma o'chirildi: faqat Payme / Click
update config set pay_text = '';
select 'NATIJA pay_text bo''sh=' || (coalesce(pay_text,'') = '') from config;
