-- Idempotent: constrain display currency on user_settings (safe if column already exists).
-- Run in Supabase Dashboard → SQL Editor if your project predates the currency column.

alter table public.user_settings
  add column if not exists currency text not null default 'AUD';

alter table public.user_settings alter column currency set default 'AUD';

update public.user_settings
set currency = 'AUD'
where currency is null or currency = '';

alter table public.user_settings drop constraint if exists user_settings_currency_check;

alter table public.user_settings
  add constraint user_settings_currency_check check (currency in ('AUD', 'EUR'));
