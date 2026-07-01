-- Append-only audit log for ICS-201 live saves (IL4-friendly change trace)

create table if not exists public.ics201_edit_audit (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ics201_documents (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  section_id text,
  event_type text not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  constraint ics201_edit_audit_event_type_check check (
    event_type in ('form_patch', 'crdt_persist', 'checkpoint_version')
  )
);

create index if not exists ics201_edit_audit_document_id_created_at_idx
  on public.ics201_edit_audit (document_id, created_at desc);

alter table public.ics201_edit_audit enable row level security;

drop policy if exists "Members can read ics201 edit audit" on public.ics201_edit_audit;
create policy "Members can read ics201 edit audit"
  on public.ics201_edit_audit for select
  using (
    exists (
      select 1
      from public.ics201_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_has_active_workspace_membership(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can insert ics201 edit audit" on public.ics201_edit_audit;
create policy "Members can insert ics201 edit audit"
  on public.ics201_edit_audit for insert
  with check (
    exists (
      select 1
      from public.ics201_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_has_active_workspace_membership(d.workspace_id)
        )
    )
  );
