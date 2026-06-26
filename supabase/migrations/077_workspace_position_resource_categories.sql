-- Named resource category slots per position (fillable with member or asset)

create table if not exists public.workspace_position_resource_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  name text not null,
  lifecycle text not null
    check (lifecycle in ('active', 'scheduled_assign', 'scheduled_unassign')),
  filled_member_id uuid references public.workspace_members (id) on delete set null,
  filled_asset_key text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id, position_name, lifecycle, name),
  check (
    (filled_member_id is null and filled_asset_key is null)
    or (filled_member_id is not null and filled_asset_key is null)
    or (filled_member_id is null and filled_asset_key is not null)
  )
);

create index if not exists workspace_position_resource_categories_workspace_idx
  on public.workspace_position_resource_categories (workspace_id);

create index if not exists workspace_position_resource_categories_position_idx
  on public.workspace_position_resource_categories (workspace_id, position_name);

alter table public.workspace_position_resource_categories enable row level security;

drop policy if exists "Members can read position resource categories" on public.workspace_position_resource_categories;
create policy "Members can read position resource categories"
  on public.workspace_position_resource_categories for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position resource categories" on public.workspace_position_resource_categories;
create policy "Roster managers can manage position resource categories"
  on public.workspace_position_resource_categories for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.workspace_position_resource_categories to authenticated;
grant select, insert, update, delete on public.workspace_position_resource_categories to service_role;
