-- Deferred single-resource org chart placement (activates on operational period advance)

create table if not exists public.workspace_member_pending_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  member_id uuid not null references public.workspace_members (id) on delete cascade,
  org_chart_reports_to text not null,
  schedule_action text not null default 'activate_on_op_advance'
    check (schedule_action in ('activate_on_op_advance')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, member_id, schedule_action)
);

create index if not exists workspace_member_pending_assignments_workspace_idx
  on public.workspace_member_pending_assignments (workspace_id);

alter table public.workspace_member_pending_assignments enable row level security;

drop policy if exists "Members can read pending member assignments" on public.workspace_member_pending_assignments;
create policy "Members can read pending member assignments"
  on public.workspace_member_pending_assignments for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage pending member assignments" on public.workspace_member_pending_assignments;
create policy "Roster managers can manage pending member assignments"
  on public.workspace_member_pending_assignments for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.workspace_member_pending_assignments to authenticated;
grant select, insert, update, delete on public.workspace_member_pending_assignments to service_role;
