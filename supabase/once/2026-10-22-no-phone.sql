-- Qo'llab-quvvatlash telefoni olib tashlandi (o'rniga Telegram bot)
update public.config set support_phone = '' where id = 1;
select 'NATIJA telefon=[' || support_phone || '] bot=' || tg_bot from public.config where id = 1;
