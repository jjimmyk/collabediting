-- Per-asset check-in status on workspace assignments

alter table public.workspace_asset_assignments
  add column if not exists check_in_status text not null default 'not_arrived';

alter table public.workspace_asset_assignments
  drop constraint if exists workspace_asset_assignments_check_in_status_check;

alter table public.workspace_asset_assignments
  add constraint workspace_asset_assignments_check_in_status_check
  check (
    check_in_status in (
      'not_arrived',
      'checked_in',
      'checked_out',
      'demobilizing',
      'demobilized'
    )
  );

comment on column public.workspace_asset_assignments.check_in_status is
  'Asset check-in lifecycle status within the assigned workspace.';
