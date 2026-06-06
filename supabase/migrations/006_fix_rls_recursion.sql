-- Fix RLS infinite recursion (profiles/workspaces policies querying profiles under RLS)

create or replace function public.current_user_is_org_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_org_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_user_has_active_workspace_membership(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
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
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and wm.ics_position in (
        'Incident Commander',
        'Planning Section Chief',
        'Operations Section Chief'
      )
  );
$$;

grant execute on function public.current_user_is_org_admin() to authenticated;
grant execute on function public.current_user_has_active_workspace_membership(uuid) to authenticated;
grant execute on function public.current_user_is_roster_manager(uuid) to authenticated;

drop policy if exists "Org admins can read all profiles" on public.profiles;
create policy "Org admins can read all profiles"
  on public.profiles for select
  using (public.current_user_is_org_admin());

drop policy if exists "Members can read accessible workspaces" on public.workspaces;
create policy "Members can read accessible workspaces"
  on public.workspaces for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(id)
  );

drop policy if exists "Members can read roster in their workspace" on public.workspace_members;
create policy "Members can read roster in their workspace"
  on public.workspace_members for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can update roster" on public.workspace_members;
create policy "Roster managers can update roster"
  on public.workspace_members for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );
