-- Extended catalog fields for organization-managed assets (JSONB)

alter table public.organization_assets
  add column if not exists catalog_fields jsonb not null default '{}'::jsonb;

drop policy if exists "Org members can update organization assets" on public.organization_assets;
create policy "Org members can update organization assets"
  on public.organization_assets for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

grant update on public.organization_assets to authenticated;
