-- Live co-editing CRDT state per ICS-201 section (Yjs binary updates)

create table if not exists public.ics201_section_crdt (
  document_id uuid not null references public.ics201_documents (id) on delete cascade,
  section_id text not null,
  state bytea not null default ''::bytea,
  updated_at timestamptz not null default now(),
  primary key (document_id, section_id)
);

create index if not exists ics201_section_crdt_document_id_idx
  on public.ics201_section_crdt (document_id);

alter table public.ics201_section_crdt enable row level security;

drop policy if exists "Members can read ics201 section crdt" on public.ics201_section_crdt;
create policy "Members can read ics201 section crdt"
  on public.ics201_section_crdt for select
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

drop policy if exists "Members can insert ics201 section crdt" on public.ics201_section_crdt;
create policy "Members can insert ics201 section crdt"
  on public.ics201_section_crdt for insert
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

drop policy if exists "Members can update ics201 section crdt" on public.ics201_section_crdt;
create policy "Members can update ics201 section crdt"
  on public.ics201_section_crdt for update
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
