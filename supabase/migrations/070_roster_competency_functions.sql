-- Competency/Function on roster assignments and organization-scoped catalog

create table if not exists public.organization_roster_competency_functions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null,
  normalized_label text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, normalized_label)
);

create index if not exists organization_roster_competency_functions_org_idx
  on public.organization_roster_competency_functions (organization_id);

alter table public.workspace_members
  add column if not exists competency_function text;

alter table public.workspace_member_positions
  add column if not exists competency_function text;

alter table public.workspace_position_member_schedules
  add column if not exists competency_function text;

alter table public.workspace_member_pending_assignments
  add column if not exists competency_function text;

alter table public.workspace_position_asset_assignments
  add column if not exists competency_function text;

alter table public.workspace_position_asset_schedules
  add column if not exists competency_function text;

alter table public.workspace_asset_assignments
  add column if not exists competency_function text;

alter table public.workspace_asset_pending_org_chart
  add column if not exists competency_function text;

alter table public.organization_roster_competency_functions enable row level security;

drop policy if exists "Org members can read competency catalog" on public.organization_roster_competency_functions;
create policy "Org members can read competency catalog"
  on public.organization_roster_competency_functions for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

drop policy if exists "Org admins and roster managers can manage competency catalog" on public.organization_roster_competency_functions;
create policy "Org admins and roster managers can manage competency catalog"
  on public.organization_roster_competency_functions for insert
  with check (
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_roster_competency_functions.organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and om.status = 'active'
    )
  );

grant select on public.organization_roster_competency_functions to authenticated;
grant select, insert, update, delete on public.organization_roster_competency_functions to service_role;
