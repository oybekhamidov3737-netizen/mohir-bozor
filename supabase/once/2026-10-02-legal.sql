-- Qonuniy to'lov: sotuvchi rekvizitlari (oferta uchun) va fiskal chek (MXIK) sozlamalari
alter table public.config add column if not exists legal_name text not null default '';
alter table public.config add column if not exists legal_inn text not null default '';
alter table public.config add column if not exists legal_address text not null default '';
alter table public.config add column if not exists legal_bank text not null default '';
alter table public.config add column if not exists fiscal_mxik text not null default '';
alter table public.config add column if not exists fiscal_package text not null default '';
alter table public.config add column if not exists fiscal_vat int not null default 0;

do $$
begin
  raise notice 'NATIJA rekvizit_ustunlari=%',
    (select count(*) from information_schema.columns where table_name = 'config'
      and column_name in ('legal_name','legal_inn','legal_address','legal_bank','fiscal_mxik','fiscal_package','fiscal_vat'));
end $$;
