-- Pratus workspace roster + auth foundation (idempotent)

do $$ begin
  create type workspace_kind as enum ('incident', 'exercise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type workspace_member_status as enum ('invited', 'active', 'removed');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  is_org_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind workspace_kind not null,
  legacy_id integer not null,
  name text not null,
  region text,
  summary text,
  created_at timestamptz not null default now(),
  unique (kind, legacy_id)
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  ics_position text not null,
  status workspace_member_status not null default 'invited',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (workspace_id, email)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index if not exists workspace_members_email_idx on public.workspace_members (lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

create or replace function public.promote_first_org_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where is_org_admin = true) then
    update public.profiles set is_org_admin = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists promote_first_org_admin on public.profiles;
create trigger promote_first_org_admin
  after insert on public.profiles
  for each row execute function public.promote_first_org_admin();

create or replace function public.activate_my_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return;
  end if;

  update public.workspace_members
  set
    user_id = auth.uid(),
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = user_email
    and status = 'invited';
end;
$$;

grant execute on function public.activate_my_invites() to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Org admins can read all profiles" on public.profiles;
create policy "Org admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_org_admin = true
    )
  );

drop policy if exists "Members can read accessible workspaces" on public.workspaces;
create policy "Members can read accessible workspaces"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_org_admin = true
    )
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.status = 'active'
    )
  );

drop policy if exists "Members can read roster in their workspace" on public.workspace_members;
create policy "Members can read roster in their workspace"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_org_admin = true
    )
    or exists (
      select 1 from public.workspace_members me
      where me.workspace_id = workspace_members.workspace_id
        and me.user_id = auth.uid()
        and me.status = 'active'
    )
  );

drop policy if exists "Roster managers can update roster" on public.workspace_members;
create policy "Roster managers can update roster"
  on public.workspace_members for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_org_admin = true
    )
    or exists (
      select 1 from public.workspace_members me
      where me.workspace_id = workspace_members.workspace_id
        and me.user_id = auth.uid()
        and me.status = 'active'
        and me.ics_position in (
          'Incident Commander',
          'Planning Section Chief',
          'Operations Section Chief'
        )
    )
  );

insert into public.workspaces (id, kind, legacy_id, name, region, summary) values
  ('a1000001-0001-4000-8000-000000000001', 'incident', 1, 'Cherry Point Refinery Fire — Process Unit Response', 'USCG District 13 — Pacific Northwest', 'Process unit fire at BP Cherry Point Refinery.'),
  ('a1000001-0001-4000-8000-000000000002', 'incident', 2, 'BP Mad Dog Process Area Gas Release', 'USCG District 8 — Gulf', 'Elevated gas readings in Mad Dog process area.'),
  ('a1000001-0001-4000-8000-000000000003', 'incident', 3, 'FIFA World Cup 2026 — MetLife Stadium Security Coordination', 'USCG District 5 — Mid-Atlantic', 'World Cup 2026 match-day security coordination.'),
  ('a1000002-0002-4000-8000-000000000002', 'exercise', 2, 'PHMSA Hazmat Rail Response Functional Exercise', 'USCG District 8 — Gulf', 'Functional exercise simulating anhydrous ammonia release.'),
  ('a1000002-0002-4000-8000-000000000003', 'exercise', 3, 'CAL FIRE Red Flag Coordination Drill', 'USCG District 11 — Pacific', 'Drill validating Red Flag pre-positioning triggers.')
on conflict (kind, legacy_id) do update
  set name = excluded.name,
      region = excluded.region,
      summary = excluded.summary;

insert into public.workspaces (id, kind, legacy_id, name, region, summary) values
  ('a1000002-0002-4000-8000-000000000001', 'exercise', 1, 'Gulf Coast Unified Command Tabletop — Edgar Scenario', 'USCG District 7 — Southeast', 'Full-scale tabletop exercising ESF-1 contraflow decision points.')
on conflict (kind, legacy_id) do update
  set name = excluded.name,
      region = excluded.region,
      summary = excluded.summary;
