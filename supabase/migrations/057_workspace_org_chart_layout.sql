-- Persisted visual layout for workspace org chart (positions only; hierarchy unchanged)

create table if not exists public.workspace_org_chart_layouts (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  layout jsonb not null default '{"version":1,"nodes":{}}'::jsonb,
  viewport jsonb not null default '{"x":0,"y":0,"zoom":1}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.workspace_org_chart_layouts enable row level security;

drop policy if exists "Authenticated users can read workspace org chart layouts" on public.workspace_org_chart_layouts;
create policy "Authenticated users can read workspace org chart layouts"
  on public.workspace_org_chart_layouts for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert workspace org chart layouts" on public.workspace_org_chart_layouts;
create policy "Authenticated users can insert workspace org chart layouts"
  on public.workspace_org_chart_layouts for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update workspace org chart layouts" on public.workspace_org_chart_layouts;
create policy "Authenticated users can update workspace org chart layouts"
  on public.workspace_org_chart_layouts for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete workspace org chart layouts" on public.workspace_org_chart_layouts;
create policy "Authenticated users can delete workspace org chart layouts"
  on public.workspace_org_chart_layouts for delete
  to authenticated
  using (auth.uid() is not null);

grant select, insert, update, delete on public.workspace_org_chart_layouts to authenticated;
grant select, insert, update, delete on public.workspace_org_chart_layouts to service_role;
