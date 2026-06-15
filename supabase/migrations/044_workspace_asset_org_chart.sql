-- Optional org chart placement for workspace-assigned assets

alter table public.workspace_asset_assignments
  add column if not exists org_chart_reports_to text,
  add column if not exists org_chart_sort_order int not null default 0;

create index if not exists workspace_asset_assignments_org_chart_reports_to_idx
  on public.workspace_asset_assignments (workspace_id, org_chart_reports_to)
  where org_chart_reports_to is not null;
