-- Operational periods for Planning-P incident workspaces (immutable form snapshots per period)

alter table public.workspaces
  add column if not exists started_operational_period_count integer not null default 0,
  add column if not exists working_operational_period_number integer not null default 1;

comment on column public.workspaces.started_operational_period_count is
  'Number of operational periods that have been started (frozen snapshots).';
comment on column public.workspaces.working_operational_period_number is
  'The operational period number currently being planned in live workspace forms.';

create table if not exists public.workspace_operational_periods (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  period_number integer not null,
  started_at timestamptz not null default now(),
  started_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id, period_number)
);

create table if not exists public.workspace_operational_period_form_snapshots (
  id uuid primary key default gen_random_uuid(),
  operational_period_id uuid not null references public.workspace_operational_periods (id) on delete cascade,
  form_key text not null,
  document_id uuid,
  snapshot jsonb not null,
  source_version_id uuid,
  created_at timestamptz not null default now(),
  unique (operational_period_id, form_key, document_id)
);

create index if not exists workspace_operational_periods_workspace_id_idx
  on public.workspace_operational_periods (workspace_id, period_number desc);

create index if not exists workspace_operational_period_form_snapshots_period_id_idx
  on public.workspace_operational_period_form_snapshots (operational_period_id, form_key);

alter table public.workspace_operational_periods enable row level security;
alter table public.workspace_operational_period_form_snapshots enable row level security;

drop policy if exists "Members can read workspace operational periods" on public.workspace_operational_periods;
create policy "Members can read workspace operational periods"
  on public.workspace_operational_periods for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Members can read operational period form snapshots" on public.workspace_operational_period_form_snapshots;
create policy "Members can read operational period form snapshots"
  on public.workspace_operational_period_form_snapshots for select
  using (
    exists (
      select 1
      from public.workspace_operational_periods p
      where p.id = operational_period_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_has_active_workspace_membership(p.workspace_id)
        )
    )
  );
