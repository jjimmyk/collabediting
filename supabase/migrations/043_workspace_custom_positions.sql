-- Workspace-specific custom ICS positions (extends standard roster positions)

create table if not exists public.workspace_custom_positions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  reports_to text not null,
  sort_order int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_custom_positions_workspace_name_idx
  on public.workspace_custom_positions (workspace_id, lower(trim(name)));

create index if not exists workspace_custom_positions_workspace_id_idx
  on public.workspace_custom_positions (workspace_id);

alter table public.workspace_custom_positions enable row level security;

drop policy if exists "Authenticated users can read workspace custom positions" on public.workspace_custom_positions;
create policy "Authenticated users can read workspace custom positions"
  on public.workspace_custom_positions for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert workspace custom positions" on public.workspace_custom_positions;
create policy "Authenticated users can insert workspace custom positions"
  on public.workspace_custom_positions for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update workspace custom positions" on public.workspace_custom_positions;
create policy "Authenticated users can update workspace custom positions"
  on public.workspace_custom_positions for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete workspace custom positions" on public.workspace_custom_positions;
create policy "Authenticated users can delete workspace custom positions"
  on public.workspace_custom_positions for delete
  to authenticated
  using (auth.uid() is not null);

grant select, insert, update, delete on public.workspace_custom_positions to authenticated;
grant select, insert, update, delete on public.workspace_custom_positions to service_role;
