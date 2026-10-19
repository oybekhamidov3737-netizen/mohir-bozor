-- Fiskal chek: package_code (Payme xodimi bergan)
update config set fiscal_package = '1546606' where id = 1;
select 'NATIJA mxik=' || fiscal_mxik || ' package=' || coalesce(fiscal_package,'-') from config;
