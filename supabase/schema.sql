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
  fx_rate numeric(10, 4),               -- EUR→AUD snapshot for the expense month (conversion)
  currency text not null default 'AUD' check (currency in ('AUD', 'EUR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, expense_date desc);

-- ---------------------------------------------------------------------------
-- Monthly EUR→AUD rates (shared — same market rate for every user)
-- ---------------------------------------------------------------------------
create table if not exists public.fx_rates (
  month_key text primary key check (month_key ~ '^\d{4}-\d{2}$'),
  eur_to_aud numeric(10, 4) not null check (eur_to_aud > 0),
  fetched_at timestamptz not null default now(),
  source text not null default 'frankfurter'
);

-- ---------------------------------------------------------------------------
-- Per-user expense categories (variable + fixed spending)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  user_id uuid references auth.users(id) on delete cascade not null,
  id text not null,
  name text not null,
  color text not null,
  icon text not null,
  fixed boolean not null default false,
  one_off boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists categories_user_sort_idx
  on public.categories (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- Per-user settings (budget, currency)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  variable_budget numeric(10, 2) not null default 1000,
  currency text not null default 'AUD' check (currency in ('AUD', 'EUR')),
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

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.spend_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — users only see their own data
-- ---------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.user_settings enable row level security;
alter table public.categories enable row level security;
alter table public.fx_rates enable row level security;

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

drop policy if exists "Users insert own settings" on public.user_settings;
create policy "Users insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own settings" on public.user_settings;
create policy "Users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

drop policy if exists "Authenticated read fx rates" on public.fx_rates;
create policy "Authenticated read fx rates"
  on public.fx_rates for select
  to authenticated
  using (true);

-- Inserts/updates: service role or SQL editor only (see migrations/20261006120000_bugfix_hardening.sql)
-- Shared groups (Tricount-style trip ledgers).
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.

create schema if not exists spend_private;
revoke all on schema spend_private from public;
grant usage on schema spend_private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.shared_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  currency text not null default 'AUD' check (currency in ('AUD', 'EUR')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  role text not null default 'member' check (role in ('owner', 'member')),
  invite_email text,
  joined_at timestamptz not null default now()
);

create unique index if not exists shared_group_members_user_unique
  on public.shared_group_members (group_id, user_id)
  where user_id is not null;

create index if not exists shared_group_members_user_idx
  on public.shared_group_members (user_id)
  where user_id is not null;

create index if not exists shared_group_members_group_idx
  on public.shared_group_members (group_id);

create table if not exists public.shared_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  member_id uuid references public.shared_group_members(id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create unique index if not exists shared_invites_pending_email_idx
  on public.shared_invites (group_id, lower(email))
  where status = 'pending';

create index if not exists shared_invites_email_idx
  on public.shared_invites (lower(email));

create table if not exists public.shared_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('AUD', 'EUR')),
  fx_rate numeric(10, 4) check (fx_rate is null or fx_rate > 0),
  paid_by uuid not null references public.shared_group_members(id) on delete restrict,
  split_mode text not null check (split_mode in ('equal', 'shares')),
  kind text not null default 'expense' check (kind in ('expense', 'transfer')),
  expense_date timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_expenses_group_date_idx
  on public.shared_expenses (group_id, expense_date desc);

create table if not exists public.shared_expense_shares (
  expense_id uuid not null references public.shared_expenses(id) on delete cascade,
  member_id uuid not null references public.shared_group_members(id) on delete restrict,
  shares numeric(8, 2) not null check (shares > 0),
  primary key (expense_id, member_id)
);

create index if not exists shared_expense_shares_member_idx
  on public.shared_expense_shares (member_id);

-- ---------------------------------------------------------------------------
-- Helpers (private schema — not exposed through the Data API)
-- Membership checks are security definer so policies can read members
-- without recursive RLS.
-- ---------------------------------------------------------------------------
create or replace function spend_private.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shared_group_members m
    where m.group_id = gid
      and m.user_id = auth.uid()
  );
$$;

create or replace function spend_private.is_group_owner(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shared_group_members m
    where m.group_id = gid
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

create or replace function spend_private.current_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
$$;

revoke all on function spend_private.is_group_member(uuid) from public;
revoke all on function spend_private.is_group_owner(uuid) from public;
revoke all on function spend_private.current_email() from public;
grant execute on function spend_private.is_group_member(uuid) to authenticated, service_role;
grant execute on function spend_private.is_group_owner(uuid) to authenticated, service_role;
grant execute on function spend_private.current_email() to authenticated, service_role;

create or replace function spend_private.guard_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.group_id is distinct from old.group_id or new.role is distinct from old.role or new.id is distinct from old.id then
    raise exception 'Cannot change this member';
  end if;
  if new.user_id is distinct from old.user_id then
    if old.user_id is not null or new.user_id is distinct from auth.uid() then
      raise exception 'Cannot reassign this account';
    end if;
    if not exists (
      select 1
      from public.shared_invites i
      where i.member_id = old.id
        and i.group_id = old.group_id
        and i.status = 'pending'
        and lower(i.email) = spend_private.current_email()
        and spend_private.current_email() <> ''
    ) then
      raise exception 'An invite is required to join this account';
    end if;
  end if;
  if new.invite_email is distinct from old.invite_email
     and old.user_id is not null
     and old.user_id is distinct from auth.uid() then
    raise exception 'Cannot change this email';
  end if;
  new.display_name = btrim(new.display_name);
  if new.invite_email is not null then
    new.invite_email = lower(btrim(new.invite_email));
  end if;
  return new;
end;
$$;

create or replace function spend_private.guard_member_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner' then
    raise exception 'The group owner stays in the group';
  end if;
  return old;
end;
$$;

create or replace function spend_private.guard_expense_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.group_id is distinct from old.group_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Cannot change this expense';
  end if;
  new.title = btrim(new.title);
  return new;
end;
$$;

drop trigger if exists shared_expenses_guard on public.shared_expenses;
create trigger shared_expenses_guard
  before update on public.shared_expenses
  for each row execute function spend_private.guard_expense_update();

create or replace function spend_private.normalize_member()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.display_name = btrim(new.display_name);
  if new.invite_email is not null then
    new.invite_email = lower(btrim(new.invite_email));
    if new.invite_email = '' then
      new.invite_email = null;
    end if;
  end if;
  return new;
end;
$$;

create or replace function spend_private.normalize_invite()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email = lower(btrim(new.email));
  if new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address';
  end if;
  return new;
end;
$$;

create or replace function spend_private.guard_invite_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.group_id is distinct from old.group_id
     or new.email is distinct from old.email
     or new.member_id is distinct from old.member_id
     or new.invited_by is distinct from old.invited_by
     or new.id is distinct from old.id then
    raise exception 'Invite cannot be edited';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Invite is already closed';
  end if;
  return new;
end;
$$;

drop trigger if exists shared_group_members_normalize on public.shared_group_members;
create trigger shared_group_members_normalize
  before insert or update on public.shared_group_members
  for each row execute function spend_private.normalize_member();

drop trigger if exists shared_group_members_guard on public.shared_group_members;
create trigger shared_group_members_guard
  before update on public.shared_group_members
  for each row execute function spend_private.guard_member_update();

drop trigger if exists shared_group_members_guard_delete on public.shared_group_members;
create trigger shared_group_members_guard_delete
  before delete on public.shared_group_members
  for each row execute function spend_private.guard_member_delete();

drop trigger if exists shared_invites_normalize on public.shared_invites;
create trigger shared_invites_normalize
  before insert or update on public.shared_invites
  for each row execute function spend_private.normalize_invite();

drop trigger if exists shared_invites_guard on public.shared_invites;
create trigger shared_invites_guard
  before update on public.shared_invites
  for each row execute function spend_private.guard_invite_update();

drop trigger if exists shared_groups_set_updated_at on public.shared_groups;
create trigger shared_groups_set_updated_at
  before update on public.shared_groups
  for each row execute function public.spend_set_updated_at();

drop trigger if exists shared_expenses_set_updated_at on public.shared_expenses;
create trigger shared_expenses_set_updated_at
  before update on public.shared_expenses
  for each row execute function public.spend_set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic expense write (security invoker — RLS still applies)
-- ---------------------------------------------------------------------------
create or replace function public.spend_write_shared_expense(
  p_expense_id uuid,
  p_group_id uuid,
  p_title text,
  p_amount numeric,
  p_currency text,
  p_fx_rate numeric,
  p_paid_by uuid,
  p_split_mode text,
  p_expense_date timestamptz,
  p_kind text,
  p_shares jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  eid uuid;
  gid uuid;
  share jsonb;
  mid uuid;
  weight numeric;
  seen uuid[] := '{}';
  n int;
begin
  if auth.uid() is null then
    raise exception 'Sign in to change a shared group';
  end if;
  if p_kind not in ('expense', 'transfer') then
    raise exception 'Invalid expense kind';
  end if;
  if p_split_mode not in ('equal', 'shares') then
    raise exception 'Invalid split';
  end if;
  if p_currency not in ('AUD', 'EUR') then
    raise exception 'Unsupported currency';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter an amount';
  end if;
  if p_shares is null or jsonb_typeof(p_shares) <> 'array' then
    raise exception 'Choose who shares this cost';
  end if;
  n := jsonb_array_length(p_shares);
  if n < 1 or n > 40 then
    raise exception 'Choose who shares this cost';
  end if;
  if p_kind = 'transfer' and n <> 1 then
    raise exception 'A transfer goes to one person';
  end if;

  if p_expense_id is null then
    if p_group_id is null or not spend_private.is_group_member(p_group_id) then
      raise exception 'You are not in this group';
    end if;
    gid := p_group_id;
    insert into public.shared_expenses (
      group_id, title, amount, currency, fx_rate, paid_by, split_mode, kind, expense_date, created_by
    ) values (
      gid,
      btrim(p_title),
      round(p_amount, 2),
      p_currency,
      p_fx_rate,
      p_paid_by,
      p_split_mode,
      p_kind,
      coalesce(p_expense_date, now()),
      auth.uid()
    )
    returning id into eid;
  else
    select group_id into gid from public.shared_expenses where id = p_expense_id;
    if gid is null then
      raise exception 'Expense not found';
    end if;
    if p_group_id is not null and p_group_id is distinct from gid then
      raise exception 'Cannot move an expense to another group';
    end if;
    update public.shared_expenses
      set title = btrim(p_title),
          amount = round(p_amount, 2),
          currency = p_currency,
          fx_rate = p_fx_rate,
          paid_by = p_paid_by,
          split_mode = p_split_mode,
          kind = p_kind,
          expense_date = coalesce(p_expense_date, expense_date)
      where id = p_expense_id
      returning id into eid;
    if eid is null then
      raise exception 'Expense not found';
    end if;
    delete from public.shared_expense_shares where expense_id = eid;
  end if;

  if not exists (
    select 1 from public.shared_group_members m
    where m.id = p_paid_by and m.group_id = gid
  ) then
    raise exception 'Choose an account in this group';
  end if;

  for share in select value from jsonb_array_elements(p_shares)
  loop
    begin
      mid := (share->>'member_id')::uuid;
      weight := round((share->>'shares')::numeric, 2);
    exception when others then
      raise exception 'Invalid share';
    end;
    if weight is null or weight <= 0 then
      raise exception 'Shares must be greater than zero';
    end if;
    if mid = any(seen) then
      raise exception 'Each person can only be listed once';
    end if;
    seen := array_append(seen, mid);
    if not exists (
      select 1 from public.shared_group_members m
      where m.id = mid and m.group_id = gid
    ) then
      raise exception 'Choose people in this group';
    end if;
    if p_kind = 'transfer' and mid = p_paid_by then
      raise exception 'A transfer goes to someone else';
    end if;
    insert into public.shared_expense_shares (expense_id, member_id, shares)
    values (eid, mid, weight);
  end loop;

  return eid;
end;
$$;

create or replace function public.spend_accept_invite(
  p_invite_id uuid,
  p_display_name text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  inv public.shared_invites%rowtype;
  mid uuid;
  label text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to join a group';
  end if;
  if spend_private.current_email() = '' then
    raise exception 'Your account has no email to match this invite';
  end if;

  select * into inv
  from public.shared_invites
  where id = p_invite_id and status = 'pending';
  if not found then
    raise exception 'Invite not found';
  end if;
  if lower(inv.email) is distinct from spend_private.current_email() then
    raise exception 'This invite is for a different email';
  end if;

  label := btrim(coalesce(p_display_name, ''));
  if label = '' then
    label := split_part(inv.email, '@', 1);
  end if;

  select id into mid
  from public.shared_group_members
  where group_id = inv.group_id and user_id = auth.uid();

  if mid is not null then
    update public.shared_invites set status = 'accepted' where id = inv.id;
    return mid;
  end if;

  if inv.member_id is not null then
    update public.shared_group_members
      set user_id = auth.uid(),
          display_name = label
      where id = inv.member_id
        and group_id = inv.group_id
        and user_id is null
      returning id into mid;
    if mid is null then
      select id into mid
      from public.shared_group_members
      where id = inv.member_id and user_id = auth.uid();
      if mid is null then
        raise exception 'This place in the group is already taken';
      end if;
    end if;
  else
    insert into public.shared_group_members (group_id, user_id, display_name, role, invite_email)
    values (inv.group_id, auth.uid(), label, 'member', inv.email)
    returning id into mid;
  end if;

  update public.shared_invites set status = 'accepted' where id = inv.id;
  return mid;
end;
$$;

grant execute on function spend_private.guard_member_update() to authenticated, service_role;
grant execute on function spend_private.guard_member_delete() to authenticated, service_role;
grant execute on function spend_private.guard_expense_update() to authenticated, service_role;
grant execute on function spend_private.normalize_member() to authenticated, service_role;
grant execute on function spend_private.normalize_invite() to authenticated, service_role;
grant execute on function spend_private.guard_invite_update() to authenticated, service_role;

revoke all on function public.spend_write_shared_expense(uuid, uuid, text, numeric, text, numeric, uuid, text, timestamptz, text, jsonb) from public, anon;
revoke all on function public.spend_accept_invite(uuid, text) from public, anon;
grant execute on function public.spend_write_shared_expense(uuid, uuid, text, numeric, text, numeric, uuid, text, timestamptz, text, jsonb) to authenticated, service_role;
grant execute on function public.spend_accept_invite(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.shared_groups enable row level security;
alter table public.shared_group_members enable row level security;
alter table public.shared_invites enable row level security;
alter table public.shared_expenses enable row level security;
alter table public.shared_expense_shares enable row level security;

grant select, insert, update, delete on table
  public.shared_groups,
  public.shared_group_members,
  public.shared_invites,
  public.shared_expenses,
  public.shared_expense_shares
to authenticated;

revoke all on table
  public.shared_groups,
  public.shared_group_members,
  public.shared_invites,
  public.shared_expenses,
  public.shared_expense_shares
from anon;

drop policy if exists "Members read groups" on public.shared_groups;
create policy "Members read groups"
  on public.shared_groups for select
  to authenticated
  using (
    spend_private.is_group_member(id)
    or created_by = auth.uid()
    or exists (
      select 1 from public.shared_invites i
      where i.group_id = id
        and i.status = 'pending'
        and lower(i.email) = spend_private.current_email()
        and spend_private.current_email() <> ''
    )
  );

drop policy if exists "Users create groups" on public.shared_groups;
create policy "Users create groups"
  on public.shared_groups for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Owner updates group" on public.shared_groups;
create policy "Owner updates group"
  on public.shared_groups for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "Owner deletes group" on public.shared_groups;
create policy "Owner deletes group"
  on public.shared_groups for delete
  to authenticated
  using (created_by = auth.uid());

drop policy if exists "Members read members" on public.shared_group_members;
create policy "Members read members"
  on public.shared_group_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or spend_private.is_group_member(group_id)
    or exists (
      select 1 from public.shared_groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

drop policy if exists "Join or add members" on public.shared_group_members;
create policy "Join or add members"
  on public.shared_group_members for insert
  to authenticated
  with check (
    (
      role = 'owner'
      and user_id = auth.uid()
      and exists (
        select 1 from public.shared_groups g
        where g.id = group_id and g.created_by = auth.uid()
      )
    )
    or (
      role = 'member'
      and user_id is null
      and spend_private.is_group_member(group_id)
    )
    or (
      role = 'member'
      and user_id = auth.uid()
      and exists (
        select 1 from public.shared_invites i
        where i.group_id = shared_group_members.group_id
          and i.status = 'pending'
          and i.member_id is null
          and lower(i.email) = spend_private.current_email()
          and spend_private.current_email() <> ''
      )
    )
  );

drop policy if exists "Edit own or placeholder name" on public.shared_group_members;
create policy "Edit own or placeholder name"
  on public.shared_group_members for update
  to authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and spend_private.is_group_member(group_id))
  )
  with check (
    (user_id = auth.uid() and spend_private.is_group_member(group_id))
    or (user_id is null and spend_private.is_group_member(group_id))
    or user_id = auth.uid()
  );

drop policy if exists "Claim invited place" on public.shared_group_members;
create policy "Claim invited place"
  on public.shared_group_members for update
  to authenticated
  using (
    user_id is null
    and exists (
      select 1 from public.shared_invites i
      where i.member_id = shared_group_members.id
        and i.status = 'pending'
        and lower(i.email) = spend_private.current_email()
        and spend_private.current_email() <> ''
    )
  )
  with check (user_id = auth.uid());

drop policy if exists "Leave or remove member" on public.shared_group_members;
create policy "Leave or remove member"
  on public.shared_group_members for delete
  to authenticated
  using (
    (user_id = auth.uid() and role <> 'owner')
    or (
      spend_private.is_group_owner(group_id)
      and (user_id is null or user_id is distinct from auth.uid())
    )
  );

drop policy if exists "Read invites" on public.shared_invites;
create policy "Read invites"
  on public.shared_invites for select
  to authenticated
  using (
    spend_private.is_group_member(group_id)
    or (
      lower(email) = spend_private.current_email()
      and spend_private.current_email() <> ''
    )
  );

drop policy if exists "Members invite" on public.shared_invites;
create policy "Members invite"
  on public.shared_invites for insert
  to authenticated
  with check (
    status = 'pending'
    and invited_by = auth.uid()
    and spend_private.is_group_member(group_id)
  );

drop policy if exists "Invitee answers invite" on public.shared_invites;
create policy "Invitee answers invite"
  on public.shared_invites for update
  to authenticated
  using (
    status = 'pending'
    and lower(email) = spend_private.current_email()
    and spend_private.current_email() <> ''
  )
  with check (
    status in ('accepted', 'declined')
    and lower(email) = spend_private.current_email()
  );

drop policy if exists "Members cancel invites" on public.shared_invites;
create policy "Members cancel invites"
  on public.shared_invites for delete
  to authenticated
  using (spend_private.is_group_member(group_id));

drop policy if exists "Members read expenses" on public.shared_expenses;
create policy "Members read expenses"
  on public.shared_expenses for select
  to authenticated
  using (spend_private.is_group_member(group_id));

drop policy if exists "Members insert expenses" on public.shared_expenses;
create policy "Members insert expenses"
  on public.shared_expenses for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and spend_private.is_group_member(group_id)
  );

drop policy if exists "Members update expenses" on public.shared_expenses;
create policy "Members update expenses"
  on public.shared_expenses for update
  to authenticated
  using (spend_private.is_group_member(group_id))
  with check (spend_private.is_group_member(group_id));

drop policy if exists "Members delete expenses" on public.shared_expenses;
create policy "Members delete expenses"
  on public.shared_expenses for delete
  to authenticated
  using (spend_private.is_group_member(group_id));

drop policy if exists "Members read shares" on public.shared_expense_shares;
create policy "Members read shares"
  on public.shared_expense_shares for select
  to authenticated
  using (
    exists (
      select 1 from public.shared_expenses e
      where e.id = expense_id
        and spend_private.is_group_member(e.group_id)
    )
  );

drop policy if exists "Members insert shares" on public.shared_expense_shares;
create policy "Members insert shares"
  on public.shared_expense_shares for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shared_expenses e
      where e.id = expense_id
        and spend_private.is_group_member(e.group_id)
    )
  );

drop policy if exists "Members delete shares" on public.shared_expense_shares;
create policy "Members delete shares"
  on public.shared_expense_shares for delete
  to authenticated
  using (
    exists (
      select 1 from public.shared_expenses e
      where e.id = expense_id
        and spend_private.is_group_member(e.group_id)
    )
  );

-- Shared groups are included above from the migration body appended for fresh installs.
