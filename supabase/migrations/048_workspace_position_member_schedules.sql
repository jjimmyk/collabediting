-- Per-position member schedules for operational period advance

create table if not exists public.workspace_position_member_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  member_id uuid not null references public.workspace_members (id) on delete cascade,
  schedule_action text not null
    check (schedule_action in ('assign_on_op_advance', 'unassign_on_op_advance')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id, position_name, member_id, schedule_action)
);

create index if not exists workspace_position_member_schedules_workspace_idx
  on public.workspace_position_member_schedules (workspace_id);

create index if not exists workspace_position_member_schedules_position_idx
  on public.workspace_position_member_schedules (workspace_id, position_name);

alter table public.workspace_position_member_schedules enable row level security;

drop policy if exists "Members can read position member schedules" on public.workspace_position_member_schedules;
create policy "Members can read position member schedules"
  on public.workspace_position_member_schedules for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position member schedules" on public.workspace_position_member_schedules;
create policy "Roster managers can manage position member schedules"
  on public.workspace_position_member_schedules for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.workspace_position_member_schedules to authenticated;
grant select, insert, update, delete on public.workspace_position_member_schedules to service_role;

-- Planned positions must not have active assignments before schedule-only workflow
delete from public.workspace_member_positions wmp
using public.workspace_custom_positions wcp, public.workspace_members wm
where wmp.member_id = wm.id
  and wm.workspace_id = wcp.workspace_id
  and wmp.ics_position = wcp.name
  and wcp.lifecycle_status = 'planned_create';

do $$
declare
  member_record record;
begin
  for member_record in
    select distinct wm.id as member_id
    from public.workspace_members wm
    join public.workspace_member_positions wmp on wmp.member_id = wm.id
    where wm.status <> 'removed'
  loop
    perform public.sync_workspace_member_primary_position(member_record.member_id);
  end loop;
end;
$$;
