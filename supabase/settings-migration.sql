-- Per-user settings: allow insert + update defaults for spending limit
-- Run in Supabase SQL Editor if your project was created before this feature.

drop policy if exists "Users insert own settings" on public.user_settings;
create policy "Users insert own settings"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Optional: align defaults for new signups (existing rows keep their current value)
alter table public.user_settings alter column variable_budget set default 1000;
alter table public.user_settings alter column currency set default 'AUD';
