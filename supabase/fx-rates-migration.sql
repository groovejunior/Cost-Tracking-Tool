-- Monthly EUR→AUD rates (shared across all Spend users)
-- Run in Supabase Dashboard → SQL Editor if you already deployed an older schema.
--
-- One row per calendar month. When any device fetches a rate from Frankfurter,
-- it upserts here so every other device gets the same number.

create table if not exists public.fx_rates (
  month_key text primary key check (month_key ~ '^\d{4}-\d{2}$'),
  eur_to_aud numeric(10, 4) not null check (eur_to_aud > 0),
  fetched_at timestamptz not null default now(),
  source text not null default 'frankfurter'
);

alter table public.fx_rates enable row level security;

drop policy if exists "Authenticated read fx rates" on public.fx_rates;
create policy "Authenticated read fx rates"
  on public.fx_rates for select
  to authenticated
  using (true);

drop policy if exists "Authenticated insert fx rates" on public.fx_rates;
create policy "Authenticated insert fx rates"
  on public.fx_rates for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update fx rates" on public.fx_rates;
create policy "Authenticated update fx rates"
  on public.fx_rates for update
  to authenticated
  using (true)
  with check (true);
