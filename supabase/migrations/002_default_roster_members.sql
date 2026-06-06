-- Default roster members seeded on every workspace (idempotent)

create or replace function public.seed_default_workspace_roster(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  default_email constant text := 'jimmy.king@disastertech.com';
  default_position constant text := 'Incident Commander';
  profile_id uuid;
begin
  select id into profile_id
  from public.profiles
  where lower(email) = default_email
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
    default_email,
    default_position,
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

create or replace function public.seed_default_workspace_roster_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_workspace_roster(new.id);
  return new;
end;
$$;

drop trigger if exists seed_default_workspace_roster on public.workspaces;
create trigger seed_default_workspace_roster
  after insert on public.workspaces
  for each row execute function public.seed_default_workspace_roster_on_insert();

-- Backfill all existing workspaces
select public.seed_default_workspace_roster(w.id)
from public.workspaces w;

create or replace function public.activate_my_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return;
  end if;

  update public.workspace_members
  set
    user_id = auth.uid(),
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where lower(email) = user_email
    and status in ('invited', 'active')
    and (user_id is null or user_id = auth.uid());
end;
$$;

-- Ensure Jimmy is org admin when profile exists (full workspace visibility + roster management)
update public.profiles
set is_org_admin = true
where lower(email) = 'jimmy.king@disastertech.com';
