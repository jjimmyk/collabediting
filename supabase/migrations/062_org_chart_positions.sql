-- Org chart position catalog: rename Finance chief, remove Display Unit Leader, add subordinate roles.

-- Rename Finance/Admin Section Chief -> Finance Section Chief
update public.workspace_members
set ics_position = 'Finance Section Chief'
where ics_position = 'Finance/Admin Section Chief';

update public.workspace_member_positions
set ics_position = 'Finance Section Chief'
where ics_position = 'Finance/Admin Section Chief';

update public.workspace_position_permissions
set ics_position = 'Finance Section Chief'
where ics_position = 'Finance/Admin Section Chief';

update public.workspace_position_settings
set position_name = 'Finance Section Chief'
where position_name = 'Finance/Admin Section Chief';

update public.workspace_position_member_schedules
set position_name = 'Finance Section Chief'
where position_name = 'Finance/Admin Section Chief';

update public.workspace_position_asset_assignments
set position_name = 'Finance Section Chief'
where position_name = 'Finance/Admin Section Chief';

update public.workspace_position_asset_schedules
set position_name = 'Finance Section Chief'
where position_name = 'Finance/Admin Section Chief';

-- Remove Display Unit Leader assignments and catalog rows
update public.workspace_members
set
  ics_position = case
    when ics_position = 'Display Unit Leader' then coalesce(
      (
        select wmp.ics_position
        from public.workspace_member_positions wmp
        where wmp.member_id = workspace_members.id
          and wmp.ics_position <> 'Display Unit Leader'
        order by wmp.ics_position asc
        limit 1
      ),
      ''
    )
    else ics_position
  end
where ics_position = 'Display Unit Leader';

delete from public.workspace_member_positions
where ics_position = 'Display Unit Leader';

delete from public.workspace_position_permissions
where ics_position = 'Display Unit Leader';

delete from public.workspace_position_settings
where position_name = 'Display Unit Leader';

delete from public.workspace_position_member_schedules
where position_name = 'Display Unit Leader';

delete from public.workspace_position_asset_assignments
where position_name = 'Display Unit Leader';

delete from public.workspace_position_asset_schedules
where position_name = 'Display Unit Leader';

-- Seed new standard positions
insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
select w.id, position_name, 'edit_ics201'
from public.workspaces w
cross join (
  values
    ('Legal Officer'),
    ('Staging Area Manager'),
    ('Technical Specialist'),
    ('Service Branch Director'),
    ('Support Branch Director'),
    ('Communications Unit Leader'),
    ('Food Unit Leader'),
    ('Medical Unit Leader'),
    ('Facilities Unit Leader'),
    ('Ground Support Unit Leader'),
    ('Supply Unit Leader'),
    ('Vessel Support Unit Leader'),
    ('Finance Section Chief'),
    ('Compensation Unit Leader'),
    ('Cost Unit Leader'),
    ('Procurement Unit Leader'),
    ('Time Unit Leader'),
    ('Intelligence Group Supervisor'),
    ('Investigative Operations Group Supervisor')
) as positions (position_name)
on conflict do nothing;

insert into public.workspace_position_settings (workspace_id, position_name, allow_work_assignment)
select w.id, position_name, true
from public.workspaces w
cross join (
  values
    ('Legal Officer'),
    ('Staging Area Manager'),
    ('Technical Specialist'),
    ('Service Branch Director'),
    ('Support Branch Director'),
    ('Communications Unit Leader'),
    ('Food Unit Leader'),
    ('Medical Unit Leader'),
    ('Facilities Unit Leader'),
    ('Ground Support Unit Leader'),
    ('Supply Unit Leader'),
    ('Vessel Support Unit Leader'),
    ('Finance Section Chief'),
    ('Compensation Unit Leader'),
    ('Cost Unit Leader'),
    ('Procurement Unit Leader'),
    ('Time Unit Leader'),
    ('Intelligence Group Supervisor'),
    ('Investigative Operations Group Supervisor')
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
  select p_workspace_id, position_name, 'edit_ics201'
  from (
    values
      ('Incident Commander'),
      ('Public Information Officer'),
      ('Safety Officer'),
      ('Liaison Officer'),
      ('Legal Officer'),
      ('Operations Section Chief'),
      ('Staging Area Manager'),
      ('Planning Section Chief'),
      ('Resources Unit Leader'),
      ('Situation Unit Leader'),
      ('Documentation Unit Leader'),
      ('Demobilization Unit Leader'),
      ('Technical Specialist'),
      ('Logistics Section Chief'),
      ('Service Branch Director'),
      ('Support Branch Director'),
      ('Communications Unit Leader'),
      ('Food Unit Leader'),
      ('Medical Unit Leader'),
      ('Facilities Unit Leader'),
      ('Ground Support Unit Leader'),
      ('Supply Unit Leader'),
      ('Vessel Support Unit Leader'),
      ('Finance Section Chief'),
      ('Compensation Unit Leader'),
      ('Cost Unit Leader'),
      ('Procurement Unit Leader'),
      ('Time Unit Leader'),
      ('Intel/Investigations Section Chief'),
      ('Intelligence Group Supervisor'),
      ('Investigative Operations Group Supervisor'),
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
      ('Legal Officer'),
      ('Operations Section Chief'),
      ('Staging Area Manager'),
      ('Planning Section Chief'),
      ('Resources Unit Leader'),
      ('Situation Unit Leader'),
      ('Documentation Unit Leader'),
      ('Demobilization Unit Leader'),
      ('Technical Specialist'),
      ('Logistics Section Chief'),
      ('Service Branch Director'),
      ('Support Branch Director'),
      ('Communications Unit Leader'),
      ('Food Unit Leader'),
      ('Medical Unit Leader'),
      ('Facilities Unit Leader'),
      ('Ground Support Unit Leader'),
      ('Supply Unit Leader'),
      ('Vessel Support Unit Leader'),
      ('Finance Section Chief'),
      ('Compensation Unit Leader'),
      ('Cost Unit Leader'),
      ('Procurement Unit Leader'),
      ('Time Unit Leader'),
      ('Intel/Investigations Section Chief'),
      ('Intelligence Group Supervisor'),
      ('Investigative Operations Group Supervisor'),
      ('Agency Representative')
  ) as positions (position_name)
  on conflict do nothing;
end;
$$;
