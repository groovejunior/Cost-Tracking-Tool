-- Spend bugfix hardening (run manually in Supabase SQL Editor)
-- Safe to re-run: uses DROP IF EXISTS / CREATE OR REPLACE where applicable.
-- App code works before and after; fx_rates writes fail gracefully once insert/update are revoked.
-- Runs as one transaction: if any statement fails, nothing is changed.

begin;

-- ---------------------------------------------------------------------------
-- Advisor: immutable search_path on Spend trigger functions;
-- callable trigger function should not be executable by clients
-- ---------------------------------------------------------------------------
create or replace function public.spend_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.spend_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.spend_handle_new_user() from public, anon, authenticated;

-- Leftover generic helper: drop it only if nothing (e.g. another app's trigger) still uses it.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null
     and not exists (
       select 1 from pg_depend
       where refobjid = to_regprocedure('public.set_updated_at()') and deptype = 'n'
     ) then
    drop function public.set_updated_at();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Advisor: RLS initplan — compare to (select auth.uid())
-- ---------------------------------------------------------------------------
drop policy if exists "Users read own expenses" on public.expenses;
create policy "Users read own expenses"
  on public.expenses for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own expenses" on public.expenses;
create policy "Users insert own expenses"
  on public.expenses for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own expenses" on public.expenses;
create policy "Users update own expenses"
  on public.expenses for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own expenses" on public.expenses;
create policy "Users delete own expenses"
  on public.expenses for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own settings" on public.user_settings;
create policy "Users read own settings"
  on public.user_settings for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own settings" on public.user_settings;
create policy "Users insert own settings"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own settings" on public.user_settings;
create policy "Users update own settings"
  on public.user_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own categories" on public.categories;
create policy "Users read own categories"
  on public.categories for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own categories" on public.categories;
create policy "Users insert own categories"
  on public.categories for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own categories" on public.categories;
create policy "Users update own categories"
  on public.categories for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own categories" on public.categories;
create policy "Users delete own categories"
  on public.categories for delete
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- B13: fx_rates readable by clients; writes only via dashboard / service role
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated insert fx rates" on public.fx_rates;
drop policy if exists "Authenticated update fx rates" on public.fx_rates;

-- Keep select policy as-is (authenticated users read shared rates).

commit;
