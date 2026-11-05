-- RESET SCRIPT — Spend tables only (safe alongside other Supabase tables)
-- ⚠️  Deletes Spend expenses + settings. Does NOT touch profiles, categories, etc.
--
-- Safe to run even when Spend tables don't exist yet.

-- Spend signup trigger only (leaves other auth.users triggers alone)
drop trigger if exists spend_on_auth_user_created on auth.users;

-- Spend tables (CASCADE removes triggers on these tables)
drop table if exists public.shared_expense_shares cascade;
drop table if exists public.shared_expenses cascade;
drop table if exists public.shared_invites cascade;
drop table if exists public.shared_group_members cascade;
drop table if exists public.shared_groups cascade;
drop table if exists public.expenses cascade;
drop table if exists public.user_settings cascade;

-- Spend-only helper functions (does NOT drop shared set_updated_at used elsewhere)
drop function if exists public.spend_handle_new_user();
drop function if exists public.spend_set_updated_at();
drop function if exists public.spend_write_shared_expense(uuid, uuid, text, numeric, text, numeric, uuid, text, timestamptz, text, jsonb);
drop function if exists public.spend_accept_invite(uuid, text);
drop schema if exists spend_private cascade;
