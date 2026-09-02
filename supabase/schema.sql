create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_profile_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute procedure public.handle_profile_upsert();

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  rows integer not null check (rows > 0),
  columns integer not null check (columns > 0),
  painted_cells integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.charts add column if not exists row_heights integer[];
alter table public.charts add column if not exists column_widths integer[];
alter table public.charts add column if not exists technique text not null default 'filet';
alter table public.charts add column if not exists cell_symbols jsonb not null default '{}'::jsonb;
alter table public.charts add column if not exists cell_colors jsonb not null default '{}'::jsonb;

create index if not exists charts_user_id_updated_at_idx on public.charts (user_id, updated_at desc);

create or replace function public.touch_chart_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists charts_touch_updated_at on public.charts;
create trigger charts_touch_updated_at
before update on public.charts
for each row execute procedure public.touch_chart_updated_at();

alter table public.profiles enable row level security;
alter table public.charts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "charts_select_own" on public.charts;
create policy "charts_select_own"
on public.charts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "charts_insert_own" on public.charts;
create policy "charts_insert_own"
on public.charts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "charts_update_own" on public.charts;
create policy "charts_update_own"
on public.charts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "charts_delete_own" on public.charts;
create policy "charts_delete_own"
on public.charts for delete
to authenticated
using (auth.uid() = user_id);
