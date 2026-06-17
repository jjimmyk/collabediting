-- Per-position "Allow Work Assignment" permission (incident/exercise roster)

alter table public.workspace_position_permissions
  drop constraint if exists workspace_position_permissions_permission_check;

alter table public.workspace_position_permissions
  add constraint workspace_position_permissions_permission_check
  check (permission in ('edit_ics201', 'allow_work_assignment'));

insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
select w.id, position_name, 'allow_work_assignment'
from public.workspaces w
cross join (
  values
    ('Incident Commander'),
    ('Public Information Officer'),
    ('Safety Officer'),
    ('Liaison Officer'),
    ('Operations Section Chief'),
    ('Planning Section Chief'),
    ('Logistics Section Chief'),
    ('Finance/Admin Section Chief'),
    ('Situation Unit Leader'),
    ('Resources Unit Leader'),
    ('Documentation Unit Leader'),
    ('Display Unit Leader'),
    ('Demobilization Unit Leader'),
    ('Technical Specialist'),
    ('Agency Representative')
) as positions (position_name)
on conflict do nothing;

create or replace function public.seed_workspace_position_permissions(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
  select p_workspace_id, position_name, permission_name
  from (
    values
      ('Incident Commander', 'edit_ics201'),
      ('Public Information Officer', 'edit_ics201'),
      ('Safety Officer', 'edit_ics201'),
      ('Liaison Officer', 'edit_ics201'),
      ('Operations Section Chief', 'edit_ics201'),
      ('Planning Section Chief', 'edit_ics201'),
      ('Logistics Section Chief', 'edit_ics201'),
      ('Finance/Admin Section Chief', 'edit_ics201'),
      ('Situation Unit Leader', 'edit_ics201'),
      ('Resources Unit Leader', 'edit_ics201'),
      ('Documentation Unit Leader', 'edit_ics201'),
      ('Display Unit Leader', 'edit_ics201'),
      ('Demobilization Unit Leader', 'edit_ics201'),
      ('Technical Specialist', 'edit_ics201'),
      ('Agency Representative', 'edit_ics201'),
      ('Incident Commander', 'allow_work_assignment'),
      ('Public Information Officer', 'allow_work_assignment'),
      ('Safety Officer', 'allow_work_assignment'),
      ('Liaison Officer', 'allow_work_assignment'),
      ('Operations Section Chief', 'allow_work_assignment'),
      ('Planning Section Chief', 'allow_work_assignment'),
      ('Logistics Section Chief', 'allow_work_assignment'),
      ('Finance/Admin Section Chief', 'allow_work_assignment'),
      ('Situation Unit Leader', 'allow_work_assignment'),
      ('Resources Unit Leader', 'allow_work_assignment'),
      ('Documentation Unit Leader', 'allow_work_assignment'),
      ('Display Unit Leader', 'allow_work_assignment'),
      ('Demobilization Unit Leader', 'allow_work_assignment'),
      ('Technical Specialist', 'allow_work_assignment'),
      ('Agency Representative', 'allow_work_assignment')
  ) as positions (position_name, permission_name)
  on conflict do nothing;
end;
$$;
