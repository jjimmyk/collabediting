-- Soft-archive workspaces (incidents/exercises retained in DB, hidden from default UI)
alter table public.workspaces
  add column if not exists archived_at timestamptz;

create index if not exists workspaces_archived_at_idx
  on public.workspaces (archived_at)
  where archived_at is not null;

create or replace function public.set_workspace_archived(
  p_workspace_id uuid,
  p_archived boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(p_workspace_id)
  ) then
    raise exception 'Not authorized to archive this workspace.';
  end if;

  update public.workspaces
  set archived_at = case when p_archived then now() else null end
  where id = p_workspace_id;
end;
$$;

grant execute on function public.set_workspace_archived(uuid, boolean) to authenticated;
grant execute on function public.set_workspace_archived(uuid, boolean) to service_role;
