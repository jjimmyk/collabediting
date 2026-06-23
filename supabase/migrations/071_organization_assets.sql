-- Organization-scoped custom assets merged with hub seed catalog in the client

create table if not exists public.organization_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  asset_key text not null,
  name text not null,
  type text not null,
  owner text not null default '',
  asset_status text not null default 'FMC',
  location text not null default '',
  notes text not null default '',
  area_key text not null default 'atlantic',
  map_lng double precision not null default 0,
  map_lat double precision not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, asset_key)
);

create index if not exists organization_assets_org_idx
  on public.organization_assets (organization_id);

alter table public.organization_assets enable row level security;

drop policy if exists "Org members can read organization assets" on public.organization_assets;
create policy "Org members can read organization assets"
  on public.organization_assets for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

drop policy if exists "Org members can create organization assets" on public.organization_assets;
create policy "Org members can create organization assets"
  on public.organization_assets for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

grant select, insert on public.organization_assets to authenticated;
grant select, insert, update, delete on public.organization_assets to service_role;
