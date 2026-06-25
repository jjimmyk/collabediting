-- Organization-scoped ICS 213RR asset requests (hub Assets → Asset Requests)

create table if not exists public.organization_asset_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payload jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists organization_asset_requests_org_idx
  on public.organization_asset_requests (organization_id);

create index if not exists organization_asset_requests_created_at_idx
  on public.organization_asset_requests (organization_id, created_at);

alter table public.organization_asset_requests enable row level security;

drop policy if exists "Org members can read organization asset requests" on public.organization_asset_requests;
create policy "Org members can read organization asset requests"
  on public.organization_asset_requests for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

drop policy if exists "Org members can create organization asset requests" on public.organization_asset_requests;
create policy "Org members can create organization asset requests"
  on public.organization_asset_requests for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

grant select, insert on public.organization_asset_requests to authenticated;
grant select, insert, update, delete on public.organization_asset_requests to service_role;
