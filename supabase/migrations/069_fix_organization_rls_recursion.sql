-- Fix RLS infinite recursion introduced by organization policies (067)

create or replace function public.current_user_email()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select lower(email)
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.current_user_can_read_organization(p_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_is_platform_org_admin()
    or public.current_user_is_org_admin_for_organization(p_organization_id)
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = p_organization_id
        and om.user_id = auth.uid()
        and om.status in ('active', 'invited')
    );
$$;

create or replace function public.current_user_is_org_admin_for_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and me.role = 'admin'
      and me.status = 'active'
      and them.user_id = p_profile_id
      and them.status in ('active', 'invited')
  );
$$;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.current_user_can_read_organization(uuid) to authenticated;
grant execute on function public.current_user_is_org_admin_for_profile(uuid) to authenticated;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
  on public.organizations for select
  using (public.current_user_can_read_organization(id));

drop policy if exists "Members can read organization membership" on public.organization_members;
create policy "Members can read organization membership"
  on public.organization_members for select
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_belongs_to_organization(organization_id)
    or public.current_user_is_org_admin_for_organization(organization_id)
  );

drop policy if exists "Org admins can read all profiles" on public.profiles;
create policy "Org admins can read all profiles"
  on public.profiles for select
  using (
    public.current_user_is_platform_org_admin()
    or public.current_user_is_org_admin_for_profile(id)
  );

drop policy if exists "Users can read their hub notifications" on public.hub_user_notifications;
create policy "Users can read their hub notifications"
  on public.hub_user_notifications for select
  using (
    public.current_user_is_org_admin()
    or lower(recipient_email) = coalesce(public.current_user_email(), '')
  );

drop policy if exists "Users can read their ics233 action notifications" on public.ics233_action_notifications;
create policy "Users can read their ics233 action notifications"
  on public.ics233_action_notifications for select
  using (
    public.current_user_is_org_admin()
    or lower(recipient_email) = coalesce(public.current_user_email(), '')
  );

drop policy if exists "Users can read their ics204 assignment notifications" on public.ics204_assignment_notifications;
create policy "Users can read their ics204 assignment notifications"
  on public.ics204_assignment_notifications for select
  using (
    public.current_user_is_org_admin()
    or lower(recipient_email) = coalesce(public.current_user_email(), '')
  );
