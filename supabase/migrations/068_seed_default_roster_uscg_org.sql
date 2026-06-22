-- Seed default workspace roster users into United States Coast Guard organization

create or replace function public.default_workspace_roster_emails()
returns text[]
language sql
immutable
as $$
  select array[
    'jimmy.king@disastertech.com',
    'jamespking47@gmail.com',
    'sean@disastertech.com',
    'carlton.landry@disastertech.com',
    'michael.baccigalopi@disastertech.com',
    'daniel.dunn190@gmail.com',
    'nicolle.bogden@disastertech.com'
  ]::text[];
$$;

create or replace function public.seed_default_uscg_organization_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  uscg_organization_id uuid;
  profile_id uuid;
  profile_is_org_admin boolean := false;
  member_role organization_member_role := 'member';
  member_status organization_member_status := 'invited';
begin
  if normalized_email = '' then
    return;
  end if;

  if not (normalized_email = any (public.default_workspace_roster_emails())) then
    return;
  end if;

  select id
  into uscg_organization_id
  from public.organizations
  where slug = 'uscg'
  limit 1;

  if uscg_organization_id is null then
    return;
  end if;

  select p.id, p.is_org_admin
  into profile_id, profile_is_org_admin
  from public.profiles p
  where lower(p.email) = normalized_email
  limit 1;

  if profile_id is not null then
    member_status := 'active';
    if profile_is_org_admin then
      member_role := 'admin';
    end if;
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    email,
    role,
    status,
    joined_at
  )
  values (
    uscg_organization_id,
    profile_id,
    normalized_email,
    member_role,
    member_status,
    case when profile_id is null then null else now() end
  )
  on conflict (organization_id, email) do update
    set
      user_id = coalesce(excluded.user_id, public.organization_members.user_id),
      role = case
        when excluded.role = 'admin' then 'admin'::organization_member_role
        when public.organization_members.role = 'admin' then 'admin'::organization_member_role
        else excluded.role
      end,
      status = case
        when excluded.user_id is not null then 'active'::organization_member_status
        when public.organization_members.status = 'active' then 'active'::organization_member_status
        else excluded.status
      end,
      joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at);
end;
$$;

create or replace function public.seed_default_workspace_roster_member(
  p_workspace_id uuid,
  p_email text,
  p_ics_position text default 'Incident Commander'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  profile_id uuid;
  v_member_id uuid;
begin
  if normalized_email = '' then
    return;
  end if;

  select id into profile_id
  from public.profiles
  where lower(email) = normalized_email
  limit 1;

  insert into public.workspace_members (
    workspace_id,
    email,
    ics_position,
    status,
    user_id,
    joined_at
  )
  values (
    p_workspace_id,
    normalized_email,
    p_ics_position,
    case when profile_id is null then 'invited'::workspace_member_status else 'active'::workspace_member_status end,
    profile_id,
    case when profile_id is null then null else now() end
  )
  on conflict (workspace_id, email) do update
    set
      ics_position = excluded.ics_position,
      status = case
        when public.workspace_members.status = 'removed' then excluded.status
        when public.workspace_members.user_id is not null then 'active'::workspace_member_status
        else excluded.status
      end,
      user_id = coalesce(public.workspace_members.user_id, excluded.user_id),
      joined_at = coalesce(public.workspace_members.joined_at, excluded.joined_at)
  returning id into v_member_id;

  insert into public.workspace_member_positions (member_id, ics_position)
  values (v_member_id, p_ics_position)
  on conflict (member_id, ics_position) do nothing;

  perform public.seed_default_uscg_organization_member(normalized_email);
end;
$$;

create or replace function public.seed_default_workspace_roster(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  default_email text;
begin
  foreach default_email in array public.default_workspace_roster_emails()
  loop
    perform public.seed_default_workspace_roster_member(
      p_workspace_id,
      default_email,
      'Incident Commander'
    );
  end loop;
end;
$$;

create or replace function public.sync_default_roster_user(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  profile_id uuid;
begin
  if normalized_email = '' then
    return;
  end if;

  perform public.seed_default_uscg_organization_member(normalized_email);

  select id into profile_id
  from public.profiles
  where lower(email) = normalized_email
  limit 1;

  if profile_id is null then
    return;
  end if;

  update public.profiles
  set is_org_admin = true,
      updated_at = now()
  where id = profile_id;

  perform public.seed_default_workspace_roster_member(
    workspace_row.id,
    normalized_email,
    'Incident Commander'
  )
  from public.workspaces workspace_row;

  update public.workspace_members
  set
    user_id = profile_id,
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = normalized_email;

  perform public.seed_default_uscg_organization_member(normalized_email);
end;
$$;

grant execute on function public.default_workspace_roster_emails() to authenticated, service_role;
grant execute on function public.seed_default_uscg_organization_member(text) to service_role;

select public.seed_default_uscg_organization_member(email)
from unnest(public.default_workspace_roster_emails()) as email;

insert into public.organization_members (
  organization_id,
  user_id,
  email,
  role,
  status,
  joined_at
)
select distinct
  o.id,
  p.id,
  lower(wm.email),
  case when coalesce(p.is_org_admin, false) then 'admin'::organization_member_role else 'member'::organization_member_role end,
  case when p.id is null then 'invited'::organization_member_status else 'active'::organization_member_status end,
  case when p.id is null then null else coalesce(wm.joined_at, now()) end
from public.workspace_members wm
join public.workspaces w on w.id = wm.workspace_id
join public.organizations o on o.id = w.organization_id and o.slug = 'uscg'
left join public.profiles p on lower(p.email) = lower(wm.email)
where wm.status <> 'removed'
  and lower(wm.email) = any (public.default_workspace_roster_emails())
on conflict (organization_id, email) do update
  set
    user_id = coalesce(excluded.user_id, public.organization_members.user_id),
    role = case
      when excluded.role = 'admin' then 'admin'::organization_member_role
      when public.organization_members.role = 'admin' then 'admin'::organization_member_role
      else excluded.role
    end,
    status = case
      when excluded.user_id is not null then 'active'::organization_member_status
      when public.organization_members.status = 'active' then 'active'::organization_member_status
      else excluded.status
    end,
    joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at);

select public.sync_default_roster_user(email)
from unnest(public.default_workspace_roster_emails()) as email;
