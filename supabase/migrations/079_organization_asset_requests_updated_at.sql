-- Track last update time for organization asset requests.

alter table public.organization_asset_requests
  add column if not exists updated_at timestamptz not null default now();

update public.organization_asset_requests
set updated_at = created_at
where updated_at is null;
