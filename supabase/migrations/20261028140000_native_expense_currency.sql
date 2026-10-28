-- Native currency on expenses (amount is always in this currency).
-- Safe to run before or after app update; existing rows default to AUD.
--
-- Rollout: run this in Supabase Dashboard → SQL Editor when deploying PR #4 rework.
-- Until then, the app defaults missing columns/fields to AUD and retries writes without
-- currency if the column is not present yet.

alter table public.expenses
  add column if not exists currency text not null default 'AUD';

alter table public.expenses alter column currency set default 'AUD';

update public.expenses
set currency = 'AUD'
where currency is null or currency = '';

alter table public.expenses drop constraint if exists expenses_currency_check;

alter table public.expenses
  add constraint expenses_currency_check check (currency in ('AUD', 'EUR'));

-- user_settings.currency (display + budget currency) — idempotent if already applied
alter table public.user_settings
  add column if not exists currency text not null default 'AUD';

alter table public.user_settings alter column currency set default 'AUD';

update public.user_settings
set currency = 'AUD'
where currency is null or currency = '';

alter table public.user_settings drop constraint if exists user_settings_currency_check;

alter table public.user_settings
  add constraint user_settings_currency_check check (currency in ('AUD', 'EUR'));
