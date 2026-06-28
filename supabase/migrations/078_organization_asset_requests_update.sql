-- Allow org members to update organization asset request payloads (e.g. transfer asset replacement)

drop policy if exists "Org members can update organization asset requests" on public.organization_asset_requests;
create policy "Org members can update organization asset requests"
  on public.organization_asset_requests for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_read_organization(organization_id)
  );

grant update on public.organization_asset_requests to authenticated;
