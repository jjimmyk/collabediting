-- Deferred single-resource org chart placement for workspace assets (activates on OP advance)

create table if not exists public.workspace_asset_pending_org_chart (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  asset_key text not null references public.workspace_asset_assignments (asset_key) on delete cascade,
  org_chart_reports_to text not null,
  schedule_action text not null default 'activate_on_op_advance'
    check (schedule_action in ('activate_on_op_advance')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, asset_key, schedule_action)
);

create index if not exists workspace_asset_pending_org_chart_workspace_idx
  on public.workspace_asset_pending_org_chart (workspace_id);

alter table public.workspace_asset_pending_org_chart enable row level security;

drop policy if exists "Members can read pending asset org chart" on public.workspace_asset_pending_org_chart;
create policy "Members can read pending asset org chart"
  on public.workspace_asset_pending_org_chart for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage pending asset org chart" on public.workspace_asset_pending_org_chart;
create policy "Roster managers can manage pending asset org chart"
  on public.workspace_asset_pending_org_chart for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.workspace_asset_pending_org_chart to authenticated;
grant select, insert, update, delete on public.workspace_asset_pending_org_chart to service_role;
