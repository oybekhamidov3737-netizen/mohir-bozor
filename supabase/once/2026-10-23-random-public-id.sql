-- Foydalanuvchi ID raqamlari tasodifiy (7 xonali, aralash), takrorlanmaydi.
create or replace function public.gen_public_id() returns bigint
language plpgsql set search_path = public as $$
declare v bigint;
begin
  loop
    v := 1000000 + floor(random() * 9000000)::bigint;
    -- ketma-ket yoki bir xil raqamlardan iborat "chiroyli" sonlarni chetlab o'tish
    continue when v::text ~ '^(\d)\1+$' or v::text in ('1234567', '7654321');
    exit when not exists (select 1 from profiles where public_id = v);
  end loop;
  return v;
end $$;

create or replace function public.profiles_public_id_lock() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.public_id := public.gen_public_id();
  elsif new.public_id is distinct from old.public_id then
    new.public_id := old.public_id;
  end if;
  return new;
end $$;
alter table public.profiles alter column public_id set default public.gen_public_id();

-- Mavjud foydalanuvchilarga ham yangi tasodifiy ID
alter table public.profiles disable trigger profiles_public_id_lock;
do $$ declare r record; begin
  for r in select id from public.profiles loop
    update public.profiles set public_id = public.gen_public_id() where id = r.id;
  end loop;
end $$;
alter table public.profiles enable trigger profiles_public_id_lock;

select 'NATIJA ' || string_agg(public_id::text, ', ' order by created_at) from public.profiles;
