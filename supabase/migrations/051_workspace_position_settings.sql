-- Position settings (distinct from member permissions)

create table if not exists public.workspace_position_settings (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  allow_work_assignment boolean not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, position_name)
);

create index if not exists workspace_position_settings_workspace_id_idx
  on public.workspace_position_settings (workspace_id);

-- Migrate allow_work_assignment from permissions into position settings
insert into public.workspace_position_settings (workspace_id, position_name, allow_work_assignment)
select workspace_id, ics_position, true
from public.workspace_position_permissions
where permission = 'allow_work_assignment'
on conflict (workspace_id, position_name) do update
  set allow_work_assignment = excluded.allow_work_assignment,
      updated_at = now();

delete from public.workspace_position_permissions
where permission = 'allow_work_assignment';

alter table public.workspace_position_permissions
  drop constraint if exists workspace_position_permissions_permission_check;

alter table public.workspace_position_permissions
  add constraint workspace_position_permissions_permission_check
  check (permission in ('edit_ics201'));

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

grant execute on function public.seed_workspace_position_settings(uuid) to authenticated;
grant execute on function public.seed_workspace_position_settings(uuid) to service_role;

alter table public.workspace_position_settings enable row level security;

drop policy if exists "Members can read position settings in their workspace" on public.workspace_position_settings;
create policy "Members can read position settings in their workspace"
  on public.workspace_position_settings for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position settings" on public.workspace_position_settings;
create policy "Roster managers can manage position settings"
  on public.workspace_position_settings for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );
