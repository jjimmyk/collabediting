-- Incident Action Plan (IAP) cover sheet: one document per workspace + version history

create table if not exists public.iap_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  form_data jsonb not null,
  latest_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id)
);

create table if not exists public.iap_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.iap_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_color text not null,
  snapshot jsonb not null,
  signatures jsonb not null default '[]'::jsonb,
  section_id text,
  constraint iap_versions_signatures_array check (jsonb_typeof(signatures) = 'array')
);

alter table public.iap_documents
  drop constraint if exists iap_documents_latest_version_id_fkey;

alter table public.iap_documents
  add constraint iap_documents_latest_version_id_fkey
  foreign key (latest_version_id) references public.iap_versions (id) on delete set null;

create index if not exists iap_documents_workspace_id_idx
  on public.iap_documents (workspace_id);

create index if not exists iap_versions_document_id_created_at_idx
  on public.iap_versions (document_id, created_at desc);

alter table public.iap_documents enable row level security;
alter table public.iap_versions enable row level security;

drop policy if exists "Members can read iap documents in their workspace" on public.iap_documents;
create policy "Members can read iap documents in their workspace"
  on public.iap_documents for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Members can insert iap documents in their workspace" on public.iap_documents;
create policy "Members can insert iap documents in their workspace"
  on public.iap_documents for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can update iap documents in their workspace" on public.iap_documents;
create policy "Members can update iap documents in their workspace"
  on public.iap_documents for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_can_edit_ics201(workspace_id)
  );

drop policy if exists "Members can read iap versions" on public.iap_versions;
create policy "Members can read iap versions"
  on public.iap_versions for select
  using (
    exists (
      select 1
      from public.iap_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_has_active_workspace_membership(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can insert iap versions" on public.iap_versions;
create policy "Members can insert iap versions"
  on public.iap_versions for insert
  with check (
    exists (
      select 1
      from public.iap_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );

drop policy if exists "Members can update iap versions" on public.iap_versions;
create policy "Members can update iap versions"
  on public.iap_versions for update
  using (
    exists (
      select 1
      from public.iap_documents d
      where d.id = document_id
        and (
          public.current_user_is_org_admin()
          or public.current_user_can_edit_ics201(d.workspace_id)
        )
    )
  );
