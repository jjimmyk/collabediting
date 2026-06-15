-- Track which ICS-204 document a workspace-assigned asset is attached to

alter table public.workspace_asset_assignments
  add column if not exists ics204_document_id uuid references public.ics204_documents (id) on delete set null;

create index if not exists workspace_asset_assignments_ics204_document_id_idx
  on public.workspace_asset_assignments (ics204_document_id)
  where ics204_document_id is not null;
