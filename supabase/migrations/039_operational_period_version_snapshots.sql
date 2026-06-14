-- Store full form version history when an operational period is started

alter table public.workspace_operational_period_form_snapshots
  add column if not exists version_snapshots jsonb not null default '[]'::jsonb;

alter table public.workspace_operational_period_form_snapshots
  drop constraint if exists workspace_operational_period_form_snapshots_versions_array;

alter table public.workspace_operational_period_form_snapshots
  add constraint workspace_operational_period_form_snapshots_versions_array
  check (jsonb_typeof(version_snapshots) = 'array');

comment on column public.workspace_operational_period_form_snapshots.version_snapshots is
  'Frozen copy of all signed and unsigned form versions captured when the operational period started.';
