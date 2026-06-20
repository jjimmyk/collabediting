-- Single-resource roster members (org chart leaf nodes without ICS position assignment)

alter table public.workspace_members
  add column if not exists assignment_kind text not null default 'ics_position'
    check (assignment_kind in ('ics_position', 'single_resource'));

alter table public.workspace_members
  add column if not exists org_chart_reports_to text;

alter table public.workspace_members
  add column if not exists org_chart_sort_order int not null default 0;

create index if not exists workspace_members_org_chart_reports_to_idx
  on public.workspace_members (workspace_id, org_chart_reports_to)
  where org_chart_reports_to is not null;

create or replace function public.enforce_workspace_member_has_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
  member_status workspace_member_status;
  member_assignment_kind text;
begin
  if tg_op = 'DELETE' then
    select wm.status, wm.assignment_kind
    into member_status, member_assignment_kind
    from public.workspace_members wm
    where wm.id = old.member_id;

    if member_status is null or member_status = 'removed' then
      return old;
    end if;

    if member_assignment_kind = 'single_resource' then
      return old;
    end if;

    select count(*) into remaining
    from public.workspace_member_positions wmp
    where wmp.member_id = old.member_id
      and wmp.id <> old.id;

    if remaining < 1 then
      raise exception 'Each roster member must have at least one ICS position.';
    end if;

    perform public.sync_workspace_member_primary_position(old.member_id);
    return old;
  end if;

  return coalesce(new, old);
end;
$$;
