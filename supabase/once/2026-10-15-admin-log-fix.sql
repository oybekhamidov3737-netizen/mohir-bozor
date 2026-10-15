-- admin_log_trg: plpgsql AND'ni qisqa tutashtirmaydi, boshqa jadvalda new.status xato berardi
create or replace function public.admin_log_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then return coalesce(new, old); end if;
  if tg_table_name = 'orders' then
    if new.status is distinct from old.status then
      insert into admin_log (action, target, note) values ('order_' || new.status, new.id::text, new.svc || ' ' || new.price);
    end if;
  elsif tg_table_name = 'ads' then
    if new.mod_deleted and not coalesce(old.mod_deleted, false) then
      insert into admin_log (action, target, note) values ('ad_delete', new.id::text, left(new.title, 80));
    end if;
  elsif tg_table_name = 'config' then
    insert into admin_log (action, target, note) values ('config', '1', 'Sozlamalar o''zgartirildi');
  elsif tg_table_name = 'bonus_log' then
    if new.kind = 'admin' then
      insert into admin_log (action, target, note) values ('wallet_adjust', new.user_id::text, new.amount || ' ' || coalesce(new.note, ''));
    end if;
  end if;
  return coalesce(new, old);
end $$;
select 'NATIJA admin_log_trg tuzatildi';
