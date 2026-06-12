-- Persist ICS workflow format and sequential workflow metadata on workspaces.

alter table public.workspaces
  add column if not exists workspace_format text,
  add column if not exists incident_complexity text,
  add column if not exists has_sequential_workflow boolean not null default false,
  add column if not exists sequential_workflow_type text;

comment on column public.workspaces.workspace_format is
  'ICS workflow format slug, e.g. uscg-ics';
comment on column public.workspaces.incident_complexity is
  'Incident complexity tier slug, e.g. planning-p or initial-response';
comment on column public.workspaces.has_sequential_workflow is
  'When true, the workspace uses a guided sequential ICS workflow';
comment on column public.workspaces.sequential_workflow_type is
  'Sequential workflow variant, e.g. planning-p for Planning P';

alter table public.workspaces
  drop constraint if exists workspaces_sequential_workflow_type_check;

alter table public.workspaces
  add constraint workspaces_sequential_workflow_type_check
  check (
    sequential_workflow_type is null
    or sequential_workflow_type in ('planning-p')
  );
