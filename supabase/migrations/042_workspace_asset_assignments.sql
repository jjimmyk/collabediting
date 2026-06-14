-- Workspace asset assignments (one workspace per asset)

create table if not exists public.workspace_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_asset_assignments_workspace_id_idx
  on public.workspace_asset_assignments (workspace_id);

alter table public.workspace_asset_assignments enable row level security;

drop policy if exists "Authenticated users can read asset assignments" on public.workspace_asset_assignments;
create policy "Authenticated users can read asset assignments"
  on public.workspace_asset_assignments for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert asset assignments" on public.workspace_asset_assignments;
create policy "Authenticated users can insert asset assignments"
  on public.workspace_asset_assignments for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update asset assignments" on public.workspace_asset_assignments;
create policy "Authenticated users can update asset assignments"
  on public.workspace_asset_assignments for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete asset assignments" on public.workspace_asset_assignments;
create policy "Authenticated users can delete asset assignments"
  on public.workspace_asset_assignments for delete
  to authenticated
  using (auth.uid() is not null);

grant select, insert, update, delete on public.workspace_asset_assignments to authenticated;
grant select, insert, update, delete on public.workspace_asset_assignments to service_role;
