-- Add additional default roster members on every workspace (idempotent)

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
      joined_at = coalesce(public.workspace_members.joined_at, excluded.joined_at);
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
  foreach default_email in array array[
    'jimmy.king@disastertech.com',
    'jamespking47@gmail.com'
  ]
  loop
    perform public.seed_default_workspace_roster_member(
      p_workspace_id,
      default_email,
      'Incident Commander'
    );
  end loop;
end;
$$;

-- Backfill all existing workspaces for new default members
select public.seed_default_workspace_roster(w.id)
from public.workspaces w;

update public.profiles
set is_org_admin = true
where lower(email) in ('jimmy.king@disastertech.com', 'jamespking47@gmail.com');
