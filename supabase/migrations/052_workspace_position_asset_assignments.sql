-- Position-level asset assignments, next-OP schedules, and workspace-scoped POC

alter table public.workspace_asset_assignments
  add column if not exists point_of_contact_member_id uuid
    references public.workspace_members (id) on delete set null;

create index if not exists workspace_asset_assignments_poc_member_idx
  on public.workspace_asset_assignments (workspace_id, point_of_contact_member_id)
  where point_of_contact_member_id is not null;

create table if not exists public.workspace_position_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  asset_key text not null references public.workspace_asset_assignments (asset_key) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id, position_name, asset_key)
);

create index if not exists workspace_position_asset_assignments_workspace_idx
  on public.workspace_position_asset_assignments (workspace_id);

create index if not exists workspace_position_asset_assignments_position_idx
  on public.workspace_position_asset_assignments (workspace_id, position_name);

create table if not exists public.workspace_position_asset_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  asset_key text not null references public.workspace_asset_assignments (asset_key) on delete cascade,
  schedule_action text not null
    check (schedule_action in ('assign_on_op_advance', 'unassign_on_op_advance')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id, position_name, asset_key, schedule_action)
);

create index if not exists workspace_position_asset_schedules_workspace_idx
  on public.workspace_position_asset_schedules (workspace_id);

create index if not exists workspace_position_asset_schedules_position_idx
  on public.workspace_position_asset_schedules (workspace_id, position_name);

alter table public.workspace_position_asset_assignments enable row level security;
alter table public.workspace_position_asset_schedules enable row level security;

drop policy if exists "Members can read position asset assignments" on public.workspace_position_asset_assignments;
create policy "Members can read position asset assignments"
  on public.workspace_position_asset_assignments for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position asset assignments" on public.workspace_position_asset_assignments;
create policy "Roster managers can manage position asset assignments"
  on public.workspace_position_asset_assignments for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

drop policy if exists "Members can read position asset schedules" on public.workspace_position_asset_schedules;
create policy "Members can read position asset schedules"
  on public.workspace_position_asset_schedules for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position asset schedules" on public.workspace_position_asset_schedules;
create policy "Roster managers can manage position asset schedules"
  on public.workspace_position_asset_schedules for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.workspace_position_asset_assignments to authenticated;
grant select on public.workspace_position_asset_schedules to authenticated;
grant select, insert, update, delete on public.workspace_position_asset_assignments to service_role;
grant select, insert, update, delete on public.workspace_position_asset_schedules to service_role;
