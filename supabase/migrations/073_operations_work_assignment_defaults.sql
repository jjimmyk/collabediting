-- Default Allow Work Assignment to Operations Section Chief subtree only.

create or replace function public.standard_position_reports_to(p_position text)
returns text
language sql
immutable
as $$
  select case trim(regexp_replace(coalesce(p_position, ''), '\s+', ' ', 'g'))
    when 'Incident Commander' then null
    when 'Public Information Officer' then 'Incident Commander'
    when 'Safety Officer' then 'Incident Commander'
    when 'Liaison Officer' then 'Incident Commander'
    when 'Legal Officer' then 'Incident Commander'
    when 'Operations Section Chief' then 'Incident Commander'
    when 'Staging Area Manager' then 'Operations Section Chief'
    when 'Planning Section Chief' then 'Incident Commander'
    when 'Resources Unit Leader' then 'Planning Section Chief'
    when 'Situation Unit Leader' then 'Planning Section Chief'
    when 'Documentation Unit Leader' then 'Planning Section Chief'
    when 'Demobilization Unit Leader' then 'Planning Section Chief'
    when 'Technical Specialist' then 'Planning Section Chief'
    when 'Logistics Section Chief' then 'Incident Commander'
    when 'Service Branch Director' then 'Logistics Section Chief'
    when 'Support Branch Director' then 'Logistics Section Chief'
    when 'Communications Unit Leader' then 'Service Branch Director'
    when 'Food Unit Leader' then 'Service Branch Director'
    when 'Medical Unit Leader' then 'Service Branch Director'
    when 'Facilities Unit Leader' then 'Support Branch Director'
    when 'Ground Support Unit Leader' then 'Support Branch Director'
    when 'Supply Unit Leader' then 'Support Branch Director'
    when 'Vessel Support Unit Leader' then 'Support Branch Director'
    when 'Finance Section Chief' then 'Incident Commander'
    when 'Finance/Admin Section Chief' then 'Incident Commander'
    when 'Compensation Unit Leader' then 'Finance Section Chief'
    when 'Cost Unit Leader' then 'Finance Section Chief'
    when 'Procurement Unit Leader' then 'Finance Section Chief'
    when 'Time Unit Leader' then 'Finance Section Chief'
    when 'Intel/Investigations Section Chief' then 'Incident Commander'
    when 'Intelligence Group Supervisor' then 'Intel/Investigations Section Chief'
    when 'Investigative Operations Group Supervisor' then 'Intel/Investigations Section Chief'
    when 'Display Unit Leader' then 'Planning Section Chief'
    when 'Agency Representative' then 'Incident Commander'
    else null
  end;
$$;

create or replace function public.is_within_operations_subtree(
  p_position_name text,
  p_workspace_id uuid default null,
  p_initial_reports_to text default null
)
returns boolean
language plpgsql
stable
as $$
declare
  ops constant text := 'Operations Section Chief';
  ic constant text := 'Incident Commander';
  normalized text := trim(regexp_replace(coalesce(p_position_name, ''), '\s+', ' ', 'g'));
  parent text;
  visited text[] := array[]::text[];
  custom_parent text;
begin
  if normalized = ops then
    return true;
  end if;

  if p_initial_reports_to is not null and trim(p_initial_reports_to) <> '' then
    parent := trim(p_initial_reports_to);
  else
    parent := public.standard_position_reports_to(normalized);
  end if;

  while parent is not null and not (parent = any(visited)) loop
    if parent = ops then
      return true;
    end if;
    if parent = ic then
      return false;
    end if;
    visited := visited || parent;

    custom_parent := null;
    if p_workspace_id is not null then
      select cp.reports_to
      into custom_parent
      from public.workspace_custom_positions cp
      where cp.workspace_id = p_workspace_id
        and cp.name = parent
      limit 1;
    end if;

    if custom_parent is not null then
      parent := custom_parent;
    else
      parent := public.standard_position_reports_to(parent);
    end if;
  end loop;

  return false;
end;
$$;

-- Backfill existing workspace position settings.
update public.workspace_position_settings wps
set allow_work_assignment = public.is_within_operations_subtree(
  wps.position_name,
  wps.workspace_id,
  cp.reports_to
)
from public.workspace_custom_positions cp
where cp.workspace_id = wps.workspace_id
  and cp.name = wps.position_name;

update public.workspace_position_settings wps
set allow_work_assignment = public.is_within_operations_subtree(
  wps.position_name,
  wps.workspace_id,
  null
)
where not exists (
  select 1
  from public.workspace_custom_positions cp
  where cp.workspace_id = wps.workspace_id
    and cp.name = wps.position_name
);

create or replace function public.seed_workspace_position_settings(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_position_settings (workspace_id, position_name, allow_work_assignment)
  select
    p_workspace_id,
    position_name,
    public.is_within_operations_subtree(position_name, p_workspace_id, null)
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
      ('Finance/Admin Section Chief'),
      ('Compensation Unit Leader'),
      ('Cost Unit Leader'),
      ('Procurement Unit Leader'),
      ('Time Unit Leader'),
      ('Intel/Investigations Section Chief'),
      ('Intelligence Group Supervisor'),
      ('Investigative Operations Group Supervisor'),
      ('Display Unit Leader'),
      ('Agency Representative')
  ) as positions (position_name)
  on conflict do nothing;
end;
$$;
