-- Add Sean, Carlton, and Michael as default Incident Commanders on every workspace (idempotent)

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
    'jamespking47@gmail.com',
    'sean@disastertech.com',
    'carlton.landry@disastertech.com',
    'michael.baccigalopi@disastertech.com'
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
where lower(email) in (
  'sean@disastertech.com',
  'carlton.landry@disastertech.com',
  'michael.baccigalopi@disastertech.com'
);

select public.sync_default_roster_user('sean@disastertech.com');
select public.sync_default_roster_user('carlton.landry@disastertech.com');
select public.sync_default_roster_user('michael.baccigalopi@disastertech.com');
