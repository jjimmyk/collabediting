-- Frozen roster snapshots captured when an operational period starts

create table if not exists public.workspace_operational_period_roster_snapshots (
  id uuid primary key default gen_random_uuid(),
  operational_period_id uuid not null references public.workspace_operational_periods (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  period_number integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (operational_period_id)
);

create index if not exists workspace_operational_period_roster_snapshots_workspace_idx
  on public.workspace_operational_period_roster_snapshots (workspace_id, period_number desc);

alter table public.workspace_operational_period_roster_snapshots enable row level security;

drop policy if exists "Members can read operational period roster snapshots" on public.workspace_operational_period_roster_snapshots;
create policy "Members can read operational period roster snapshots"
  on public.workspace_operational_period_roster_snapshots for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

grant select on public.workspace_operational_period_roster_snapshots to authenticated;
grant select, insert, update, delete on public.workspace_operational_period_roster_snapshots to service_role;
