-- Roster position lifecycle labels for operational period advance

alter table public.workspace_custom_positions
  add column if not exists lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'planned_create', 'retire_on_op_advance', 'archived')),
  add column if not exists archived_at timestamptz,
  add column if not exists activated_at timestamptz;

create table if not exists public.workspace_standard_position_lifecycle (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  position_name text not null,
  op_advance_label text not null
    check (op_advance_label in ('retire_on_op_advance')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, position_name)
);

create index if not exists workspace_standard_position_lifecycle_workspace_id_idx
  on public.workspace_standard_position_lifecycle (workspace_id);

alter table public.workspace_standard_position_lifecycle enable row level security;

drop policy if exists "Authenticated users can read standard position lifecycle" on public.workspace_standard_position_lifecycle;
create policy "Authenticated users can read standard position lifecycle"
  on public.workspace_standard_position_lifecycle for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert standard position lifecycle" on public.workspace_standard_position_lifecycle;
create policy "Authenticated users can insert standard position lifecycle"
  on public.workspace_standard_position_lifecycle for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update standard position lifecycle" on public.workspace_standard_position_lifecycle;
create policy "Authenticated users can update standard position lifecycle"
  on public.workspace_standard_position_lifecycle for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete standard position lifecycle" on public.workspace_standard_position_lifecycle;
create policy "Authenticated users can delete standard position lifecycle"
  on public.workspace_standard_position_lifecycle for delete
  to authenticated
  using (auth.uid() is not null);

grant select, insert, update, delete on public.workspace_standard_position_lifecycle to authenticated;
grant select, insert, update, delete on public.workspace_standard_position_lifecycle to service_role;
