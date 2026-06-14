-- Allow service/API writes to operational period tables (reads already covered in 037).

drop policy if exists "Editors can insert workspace operational periods" on public.workspace_operational_periods;
create policy "Editors can insert workspace operational periods"
  on public.workspace_operational_periods for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Editors can insert operational period form snapshots" on public.workspace_operational_period_form_snapshots;
create policy "Editors can insert operational period form snapshots"
  on public.workspace_operational_period_form_snapshots for insert
  with check (
    exists (
      select 1
      from public.workspace_operational_periods p
      where p.id = operational_period_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(p.workspace_id)
        )
    )
  );
