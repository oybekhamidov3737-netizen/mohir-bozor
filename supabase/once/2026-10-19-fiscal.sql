-- Fiskal chek: MXIK "Dasturiy ta'minotda mijoz tomonidan taqdim etilgan reklama va e'lonlarni joylashtirish xizmatlari"
update config set fiscal_mxik = '10305008004000000', fiscal_vat = 0 where id = 1;
select 'NATIJA mxik=' || fiscal_mxik || ' vat=' || coalesce(fiscal_vat::text,'-') || ' package=' || coalesce(fiscal_package,'-') from config;
