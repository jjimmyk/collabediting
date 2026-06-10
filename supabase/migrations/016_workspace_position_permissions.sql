-- ICS position assignments (multi-position roster) + position-scoped permissions

create table if not exists public.workspace_member_positions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workspace_members (id) on delete cascade,
  ics_position text not null,
  created_at timestamptz not null default now(),
  unique (member_id, ics_position)
);

create index if not exists workspace_member_positions_member_id_idx
  on public.workspace_member_positions (member_id);

create table if not exists public.workspace_position_permissions (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  ics_position text not null,
  permission text not null check (permission in ('edit_ics201')),
  primary key (workspace_id, ics_position, permission)
);

create index if not exists workspace_position_permissions_workspace_id_idx
  on public.workspace_position_permissions (workspace_id);

-- Backfill one position per existing roster member
insert into public.workspace_member_positions (member_id, ics_position)
select wm.id, wm.ics_position
from public.workspace_members wm
where wm.status <> 'removed'
on conflict (member_id, ics_position) do nothing;

-- Default: every standard position may edit the ICS-201 form
insert into public.workspace_position_permissions (workspace_id, ics_position, permission)
select w.id, position_name, 'edit_ics201'
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

create or replace function public.sync_workspace_member_primary_position(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_primary text;
begin
  select wmp.ics_position
  into next_primary
  from public.workspace_member_positions wmp
  where wmp.member_id = p_member_id
  order by wmp.ics_position asc
  limit 1;

  update public.workspace_members
  set ics_position = coalesce(next_primary, ics_position)
  where id = p_member_id;
end;
$$;

create or replace function public.enforce_workspace_member_has_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
  member_status workspace_member_status;
begin
  if tg_op = 'DELETE' then
    select wm.status into member_status
    from public.workspace_members wm
    where wm.id = old.member_id;

    if member_status is null or member_status = 'removed' then
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

drop trigger if exists workspace_member_positions_require_one on public.workspace_member_positions;
create trigger workspace_member_positions_require_one
  after delete on public.workspace_member_positions
  for each row execute function public.enforce_workspace_member_has_position();

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

create or replace function public.current_user_is_roster_manager(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.workspace_member_positions wmp on wmp.member_id = wm.id
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and wmp.ics_position in (
        'Incident Commander',
        'Planning Section Chief',
        'Operations Section Chief'
      )
  );
$$;

create or replace function public.current_user_can_edit_ics201(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.workspace_members wm
      join public.workspace_member_positions wmp on wmp.member_id = wm.id
      join public.workspace_position_permissions wpp
        on wpp.workspace_id = wm.workspace_id
       and wpp.ics_position = wmp.ics_position
       and wpp.permission = 'edit_ics201'
      where wm.workspace_id = p_workspace_id
        and wm.user_id = auth.uid()
        and wm.status = 'active'
    );
$$;

create or replace function public.get_my_workspace_permissions(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  position_list jsonb;
  permission_list jsonb;
  can_edit boolean;
begin
  if public.current_user_is_org_admin() then
    return jsonb_build_object(
      'positions', to_jsonb(array['Org Admin']::text[]),
      'permissions', to_jsonb(array['edit_ics201']::text[]),
      'can_edit_ics201_form', true
    );
  end if;

  select coalesce(jsonb_agg(distinct wmp.ics_position), '[]'::jsonb)
  into position_list
  from public.workspace_members wm
  join public.workspace_member_positions wmp on wmp.member_id = wm.id
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active';

  select
    coalesce(jsonb_agg(distinct wpp.permission), '[]'::jsonb),
    coalesce(bool_or(wpp.permission = 'edit_ics201'), false)
  into permission_list, can_edit
  from public.workspace_members wm
  join public.workspace_member_positions wmp on wmp.member_id = wm.id
  join public.workspace_position_permissions wpp
    on wpp.workspace_id = wm.workspace_id
   and wpp.ics_position = wmp.ics_position
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active';

  return jsonb_build_object(
    'positions', coalesce(position_list, '[]'::jsonb),
    'permissions', coalesce(permission_list, '[]'::jsonb),
    'can_edit_ics201_form', coalesce(can_edit, false)
  );
end;
$$;

grant execute on function public.current_user_can_edit_ics201(uuid) to authenticated;
grant execute on function public.get_my_workspace_permissions(uuid) to authenticated;
grant execute on function public.seed_workspace_position_permissions(uuid) to authenticated;

alter table public.workspace_member_positions enable row level security;
alter table public.workspace_position_permissions enable row level security;

drop policy if exists "Members can read roster positions in their workspace" on public.workspace_member_positions;
create policy "Members can read roster positions in their workspace"
  on public.workspace_member_positions for select
  using (
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.id = workspace_member_positions.member_id
        and public.current_user_has_active_workspace_membership(wm.workspace_id)
    )
  );

drop policy if exists "Roster managers can manage roster positions" on public.workspace_member_positions;
create policy "Roster managers can manage roster positions"
  on public.workspace_member_positions for all
  using (
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.id = workspace_member_positions.member_id
        and public.current_user_is_roster_manager(wm.workspace_id)
    )
  )
  with check (
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.id = workspace_member_positions.member_id
        and public.current_user_is_roster_manager(wm.workspace_id)
    )
  );

drop policy if exists "Members can read position permissions in their workspace" on public.workspace_position_permissions;
create policy "Members can read position permissions in their workspace"
  on public.workspace_position_permissions for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage position permissions" on public.workspace_position_permissions;
create policy "Roster managers can manage position permissions"
  on public.workspace_position_permissions for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

-- ICS-201 writes require edit_ics201 permission
drop policy if exists "Members can insert ics201 documents in their workspace" on public.ics201_documents;
create policy "Members can insert ics201 documents in their workspace"
  on public.ics201_documents for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can update ics201 documents in their workspace" on public.ics201_documents;
create policy "Members can update ics201 documents in their workspace"
  on public.ics201_documents for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can insert ics201 versions" on public.ics201_versions;
create policy "Members can insert ics201 versions"
  on public.ics201_versions for insert
  with check (
    exists (
      select 1
      from public.ics201_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can insert ics201 section crdt" on public.ics201_section_crdt;
create policy "Members can insert ics201 section crdt"
  on public.ics201_section_crdt for insert
  with check (
    exists (
      select 1
      from public.ics201_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can update ics201 section crdt" on public.ics201_section_crdt;
create policy "Members can update ics201 section crdt"
  on public.ics201_section_crdt for update
  using (
    exists (
      select 1
      from public.ics201_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );
