-- Per-user expense categories (variable + fixed spending)
-- Run in Supabase Dashboard → SQL Editor on existing projects.

create table if not exists public.categories (
  user_id uuid references auth.users(id) on delete cascade not null,
  id text not null,
  name text not null,
  color text not null,
  icon text not null,
  fixed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.spend_set_updated_at();

alter table public.categories enable row level security;

drop policy if exists "Users read own categories" on public.categories;
create policy "Users read own categories"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own categories" on public.categories;
create policy "Users insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own categories" on public.categories;
create policy "Users update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own categories" on public.categories;
create policy "Users delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);
