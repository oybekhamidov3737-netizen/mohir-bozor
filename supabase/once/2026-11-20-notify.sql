-- Bildirishnomalar: yangi xabar kelganda va e'lon muddati tugayotganda foydalanuvchiga
-- pochta (yoki Telegram orqali kirganlarga — bot) orqali xabar beriladi.
-- Xabar "notify" edge funksiyasi orqali yuboriladi; funksiya maxfiy kalit bilan himoyalangan.

create table if not exists public.notify_settings (
  id int primary key default 1 check (id = 1),
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  enabled boolean not null default true
);
insert into public.notify_settings (id) values (1) on conflict (id) do nothing;
alter table public.notify_settings enable row level security;
revoke all on public.notify_settings from anon, authenticated;

-- Takroriy xabar yubormaslik uchun jurnal (kalit: 'msg:<suhbat>:<foydalanuvchi>' yoki 'exp:<e'lon>:<tur>:<muddat>')
create table if not exists public.notify_log (
  key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.notify_log enable row level security;
revoke all on public.notify_log from anon, authenticated;

-- Foydalanuvchi bildirishnomalarni o'chirib qo'yishi mumkin (Sozlamalar)
alter table public.profile_private add column if not exists notify boolean not null default true;

-- Faqat edge funksiya uchun
create or replace function public.get_notify_secret() returns text
language sql security definer set search_path = public as $$ select secret from notify_settings where id = 1 $$;
revoke execute on function public.get_notify_secret() from public, anon, authenticated;
grant execute on function public.get_notify_secret() to service_role;

-- Bir xil bildirishnomani qisqa vaqtda qayta yubormaslik: kalit "band" qilinsa true qaytaradi
create or replace function public.notify_claim(p_key text, p_minutes int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into notify_log (key, sent_at) values (p_key, now())
  on conflict (key) do update set sent_at = now()
    where notify_log.sent_at < now() - make_interval(mins => p_minutes);
  return found;
end $$;
revoke execute on function public.notify_claim(text, int) from public, anon, authenticated;
grant execute on function public.notify_claim(text, int) to service_role;

create or replace function public.notify_release(p_key text) returns void
language sql security definer set search_path = public as $$ delete from notify_log where key = p_key $$;
revoke execute on function public.notify_release(text) from public, anon, authenticated;
grant execute on function public.notify_release(text) to service_role;

-- Yangi xabar: funksiyani fon rejimida chaqirish (xabar yuborish tezligiga ta'sir qilmaydi)
create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare s notify_settings;
begin
  select * into s from notify_settings where id = 1;
  if s.id is null or not s.enabled then return new; end if;
  perform net.http_post(
    url := 'https://qtvyjmiqoknpnlilpfpf.supabase.co/functions/v1/notify',
    body := jsonb_build_object('type', 'message', 'id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', s.secret),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  return new; -- bildirishnoma ketmasa ham xabar saqlanadi
end $$;
revoke execute on function public.notify_new_message() from public, anon, authenticated;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_new_message();

-- Tezlik uchun: tashqi kalitlarga indekslar (Supabase maslahati)
create index if not exists ad_events_ad_id_idx on public.ad_events (ad_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked);
create index if not exists bonus_log_user_id_idx on public.bonus_log (user_id);
create index if not exists click_tx_order_id_idx on public.click_tx (order_id);
create index if not exists orders_ad_id_idx on public.orders (ad_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists payme_tx_order_id_idx on public.payme_tx (order_id);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);
create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reviews_author_id_idx on public.reviews (author_id);
create index if not exists threads_buyer_id_idx on public.threads (buyer_id);
create index if not exists threads_seller_id_idx on public.threads (seller_id);

select 'NATIJA bildirishnoma: ' || (select count(*) from notify_settings) || ' sozlama, trigger: '
  || (select count(*) from pg_trigger where tgname = 'messages_notify') || ', notify ustuni: '
  || (select count(*) from information_schema.columns where table_name = 'profile_private' and column_name = 'notify');
