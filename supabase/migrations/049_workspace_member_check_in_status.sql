-- Per-workspace member check-in status (one value per workspace_members row)

do $$ begin
  create type workspace_member_check_in_status as enum (
    'not_arrived',
    'checked_in',
    'checked_out',
    'demobilizing',
    'demobilized'
  );
exception when duplicate_object then null;
end $$;

alter table public.workspace_members
  add column if not exists check_in_status workspace_member_check_in_status not null default 'not_arrived';

comment on column public.workspace_members.check_in_status is
  'Incident/exercise roster check-in status for this member in this workspace.';
