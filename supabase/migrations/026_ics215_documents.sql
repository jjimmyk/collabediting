-- ICS-215 operational planning worksheet: one document per workspace + version history

create table if not exists public.ics215_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  form_data jsonb not null,
  latest_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id)
);

create table if not exists public.ics215_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ics215_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_color text not null,
  snapshot jsonb not null,
  signatures jsonb not null default '[]'::jsonb,
  section_id text,
  constraint ics215_versions_signatures_array check (jsonb_typeof(signatures) = 'array')
);

alter table public.ics215_documents
  drop constraint if exists ics215_documents_latest_version_id_fkey;

alter table public.ics215_documents
  add constraint ics215_documents_latest_version_id_fkey
  foreign key (latest_version_id) references public.ics215_versions (id) on delete set null;

create index if not exists ics215_documents_workspace_id_idx
  on public.ics215_documents (workspace_id);

create index if not exists ics215_versions_document_id_created_at_idx
  on public.ics215_versions (document_id, created_at desc);

alter table public.ics215_documents enable row level security;
alter table public.ics215_versions enable row level security;

drop policy if exists "Members can read ics215 documents in their workspace" on public.ics215_documents;
create policy "Members can read ics215 documents in their workspace"
  on public.ics215_documents for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Members can insert ics215 documents in their workspace" on public.ics215_documents;
create policy "Members can insert ics215 documents in their workspace"
  on public.ics215_documents for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can update ics215 documents in their workspace" on public.ics215_documents;
create policy "Members can update ics215 documents in their workspace"
  on public.ics215_documents for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can read ics215 versions" on public.ics215_versions;
create policy "Members can read ics215 versions"
  on public.ics215_versions for select
  using (
    exists (
      select 1
      from public.ics215_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_has_active_workspace_membership(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can insert ics215 versions" on public.ics215_versions;
create policy "Members can insert ics215 versions"
  on public.ics215_versions for insert
  with check (
    exists (
      select 1
      from public.ics215_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can update ics215 versions" on public.ics215_versions;
create policy "Members can update ics215 versions"
  on public.ics215_versions for update
  using (
    exists (
      select 1
      from public.ics215_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );
