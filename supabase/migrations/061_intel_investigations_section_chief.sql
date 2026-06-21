-- Intel/Investigations Section Chief position catalog + workspace seeds

insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
select w.id, 'Intel/Investigations Section Chief', 'edit_ics201'
from public.workspaces w
on conflict do nothing;

insert into public.workspace_position_settings (workspace_id, position_name, allow_work_assignment)
select w.id, 'Intel/Investigations Section Chief', true
from public.workspaces w
on conflict do nothing;

create or replace function public.seed_workspace_position_permissions(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
  select p_workspace_id, position_name, 'edit_ics201'
  from (
    values
      ('Incident Commander'),
      ('Public Information Officer'),
      ('Safety Officer'),
      ('Liaison Officer'),
      ('Operations Section Chief'),
      ('Planning Section Chief'),
      ('Logistics Section Chief'),
      ('Finance/Admin Section Chief'),
      ('Intel/Investigations Section Chief'),
      ('Situation Unit Leader'),
      ('Resources Unit Leader'),
      ('Documentation Unit Leader'),
      ('Display Unit Leader'),
      ('Demobilization Unit Leader'),
      ('Technical Specialist'),
      ('Agency Representative')
  ) as positions (position_name)
  on conflict do nothing;
end;
$$;

create or replace function public.seed_workspace_position_settings(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_position_settings (workspace_id, position_name, allow_work_assignment)
  select p_workspace_id, position_name, true
  from (
    values
      ('Incident Commander'),
      ('Public Information Officer'),
      ('Safety Officer'),
      ('Liaison Officer'),
      ('Operations Section Chief'),
      ('Planning Section Chief'),
      ('Logistics Section Chief'),
      ('Finance/Admin Section Chief'),
      ('Intel/Investigations Section Chief'),
      ('Situation Unit Leader'),
      ('Resources Unit Leader'),
      ('Documentation Unit Leader'),
      ('Display Unit Leader'),
      ('Demobilization Unit Leader'),
      ('Technical Specialist'),
      ('Agency Representative')
  ) as positions (position_name)
  on conflict do nothing;
end;
$$;
