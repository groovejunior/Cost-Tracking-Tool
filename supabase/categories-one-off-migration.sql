-- One-off / unique expenses (shoes, bags, etc.) — outside variable budget;
-- included in Analysis except weekend vs weekday.
alter table public.categories
  add column if not exists one_off boolean not null default false;

comment on column public.categories.one_off is
  'True for unique one-off purchases; excluded from variable budget and core Analysis charts.';
