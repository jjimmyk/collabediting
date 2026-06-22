-- Organizations: USCG default tenant, org membership, org-scoped access helpers

do $$ begin
  create type organization_member_role as enum ('admin', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type organization_member_status as enum ('invited', 'active', 'removed');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  role organization_member_role not null default 'member',
  status organization_member_status not null default 'invited',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (organization_id, email)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);
create index if not exists organization_members_organization_id_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_email_idx
  on public.organization_members (lower(email));

alter table public.workspaces
  add column if not exists organization_id uuid references public.organizations (id) on delete restrict;

create index if not exists workspaces_organization_id_idx
  on public.workspaces (organization_id);

insert into public.organizations (id, name, slug)
values (
  '00000000-0000-4000-8000-000000000001',
  'United States Coast Guard',
  'uscg'
)
on conflict (slug) do update
  set name = excluded.name,
      updated_at = now();

update public.workspaces
set organization_id = (
  select id from public.organizations where slug = 'uscg' limit 1
)
where organization_id is null;

alter table public.workspaces
  alter column organization_id set not null;

insert into public.organization_members (
  organization_id,
  user_id,
  email,
  role,
  status,
  joined_at
)
select
  o.id,
  p.id,
  p.email,
  case when p.is_org_admin then 'admin'::organization_member_role else 'member'::organization_member_role end,
  'active'::organization_member_status,
  coalesce(p.created_at, now())
from public.profiles p
cross join public.organizations o
where o.slug = 'uscg'
on conflict (organization_id, email) do update
  set
    user_id = excluded.user_id,
    role = excluded.role,
    status = excluded.status,
    joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at);

create or replace function public.current_user_is_platform_org_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_org_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_user_is_org_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_is_platform_org_admin();
$$;

create or replace function public.current_user_is_org_admin_for_organization(p_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_is_platform_org_admin()
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = p_organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and om.status = 'active'
    );
$$;

create or replace function public.current_user_belongs_to_organization(p_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.current_user_can_administer_workspace(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_is_platform_org_admin()
    or public.current_user_is_org_admin_for_organization(
      (select w.organization_id from public.workspaces w where w.id = p_workspace_id)
    );
$$;

grant execute on function public.current_user_is_platform_org_admin() to authenticated;
grant execute on function public.current_user_is_org_admin_for_organization(uuid) to authenticated;
grant execute on function public.current_user_belongs_to_organization(uuid) to authenticated;
grant execute on function public.current_user_can_administer_workspace(uuid) to authenticated;

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

  update public.organization_members
  set
    user_id = auth.uid(),
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = user_email
    and status = 'invited';

  update public.workspace_members
  set
    user_id = auth.uid(),
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = user_email
    and status = 'invited';
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
  on public.organizations for select
  using (
    public.current_user_is_platform_org_admin()
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and om.status in ('active', 'invited')
    )
  );

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);

drop policy if exists "Org admins can update organizations" on public.organizations;
create policy "Org admins can update organizations"
  on public.organizations for update
  using (public.current_user_is_org_admin_for_organization(id));

drop policy if exists "Members can read organization membership" on public.organization_members;
create policy "Members can read organization membership"
  on public.organization_members for select
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_belongs_to_organization(organization_id)
    or public.current_user_is_org_admin_for_organization(organization_id)
    or exists (
      select 1
      from public.organization_members me
      where me.organization_id = organization_members.organization_id
        and me.user_id = auth.uid()
        and me.status in ('active', 'invited')
    )
  );

drop policy if exists "Org admins can manage organization membership" on public.organization_members;
create policy "Org admins can manage organization membership"
  on public.organization_members for all
  using (public.current_user_is_org_admin_for_organization(organization_id))
  with check (public.current_user_is_org_admin_for_organization(organization_id));

drop policy if exists "Org admins can read all profiles" on public.profiles;
create policy "Org admins can read all profiles"
  on public.profiles for select
  using (
    public.current_user_is_platform_org_admin()
    or exists (
      select 1
      from public.organization_members me
      join public.organization_members them
        on them.organization_id = me.organization_id
      where me.user_id = auth.uid()
        and me.role = 'admin'
        and me.status = 'active'
        and them.user_id = profiles.id
        and them.status in ('active', 'invited')
    )
  );

drop policy if exists "Members can read accessible workspaces" on public.workspaces;
create policy "Members can read accessible workspaces"
  on public.workspaces for select
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_is_org_admin_for_organization(organization_id)
    or public.current_user_has_active_workspace_membership(id)
  );

drop policy if exists "Members can read roster in their workspace" on public.workspace_members;
create policy "Members can read roster in their workspace"
  on public.workspace_members for select
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_can_administer_workspace(workspace_id)
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can update roster" on public.workspace_members;
create policy "Roster managers can update roster"
  on public.workspace_members for update
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_can_administer_workspace(workspace_id)
    or public.current_user_is_roster_manager(workspace_id)
  );
