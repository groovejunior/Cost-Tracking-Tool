-- Spend app — personal-account schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
--
-- If you see: column "expense_date" does not exist
--   → An old expenses table already exists. Run reset.sql first, then run this again.

-- ---------------------------------------------------------------------------
-- Expenses (one row per expense, owned by a single user)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id text not null,          -- matches CATS ids in app.js ("groceries", etc.)
  amount numeric(10, 2) not null check (amount > 0),
  note text not null default '',
  expense_date timestamptz not null,    -- "date" in the app (renamed to avoid SQL keyword)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, expense_date desc);

-- ---------------------------------------------------------------------------
-- Per-user settings (budget, currency — categories stay in app code for now)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  variable_budget numeric(10, 2) not null default 600,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create settings row when someone signs up
-- (spend_* names avoid clashing with other tables/functions in your project)
-- ---------------------------------------------------------------------------
create or replace function public.spend_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists spend_on_auth_user_created on auth.users;
create trigger spend_on_auth_user_created
  after insert on auth.users
  for each row execute function public.spend_handle_new_user();

-- Keep updated_at fresh on edits (Spend-only function name)
create or replace function public.spend_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.spend_set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.spend_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — users only see their own data
-- ---------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "Users read own expenses" on public.expenses;
create policy "Users read own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own expenses" on public.expenses;
create policy "Users insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own expenses" on public.expenses;
create policy "Users update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own expenses" on public.expenses;
create policy "Users delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own settings" on public.user_settings;
create policy "Users read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own settings" on public.user_settings;
create policy "Users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
