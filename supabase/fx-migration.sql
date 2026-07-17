-- Optional migration: store the EUR/AUD rate that was active when an expense was saved.
-- Run in Supabase SQL Editor if you already created the expenses table from an older schema.sql.
--
-- Expenses logged in March keep March's rate even after April's rate updates.

alter table public.expenses
  add column if not exists fx_rate numeric(10, 4);
