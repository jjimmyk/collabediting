-- Link default roster users to all workspaces (idempotent)

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
end;
$$;

select public.sync_default_roster_user('jimmy.king@disastertech.com');
select public.sync_default_roster_user('jamespking47@gmail.com');
