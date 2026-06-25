-- SITREP document persistence + version history per workspace or AOR

create table if not exists public.sitrep_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  fema_aor_id text,
  form_data jsonb not null,
  latest_version_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint sitrep_documents_scope_check check (
    (
      workspace_id is not null
      and organization_id is null
      and fema_aor_id is null
    )
    or (
      workspace_id is null
      and organization_id is not null
      and fema_aor_id is not null
    )
  )
);

create unique index if not exists sitrep_documents_workspace_id_uidx
  on public.sitrep_documents (workspace_id)
  where workspace_id is not null;

create unique index if not exists sitrep_documents_org_aor_uidx
  on public.sitrep_documents (organization_id, fema_aor_id)
  where organization_id is not null and fema_aor_id is not null;

create table if not exists public.sitrep_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.sitrep_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_color text not null,
  author_role text not null default '',
  snapshot jsonb not null,
  signatures jsonb not null default '[]'::jsonb,
  section_id text,
  creator_name text,
  creator_color text,
  creator_role text,
  creator_created_at timestamptz,
  submitted_for_review_to jsonb,
  submitted_for_review_at timestamptz,
  ai_generated_sections jsonb,
  constraint sitrep_versions_signatures_array check (jsonb_typeof(signatures) = 'array')
);

alter table public.sitrep_documents
  drop constraint if exists sitrep_documents_latest_version_id_fkey;

alter table public.sitrep_documents
  add constraint sitrep_documents_latest_version_id_fkey
  foreign key (latest_version_id) references public.sitrep_versions (id) on delete set null;

create index if not exists sitrep_documents_workspace_id_idx
  on public.sitrep_documents (workspace_id);

create index if not exists sitrep_documents_org_aor_idx
  on public.sitrep_documents (organization_id, fema_aor_id);

create index if not exists sitrep_versions_document_id_created_at_idx
  on public.sitrep_versions (document_id, created_at desc);

alter table public.sitrep_documents enable row level security;
alter table public.sitrep_versions enable row level security;

drop policy if exists "Members can read sitrep documents in their workspace" on public.sitrep_documents;
create policy "Members can read sitrep documents in their workspace"
  on public.sitrep_documents for select
  using (
    (
      workspace_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_has_active_workspace_membership(workspace_id)
      )
    )
    or (
      organization_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_can_read_organization(organization_id)
      )
    )
  );

drop policy if exists "Members can insert sitrep documents in their workspace" on public.sitrep_documents;
create policy "Members can insert sitrep documents in their workspace"
  on public.sitrep_documents for insert
  with check (
    (
      workspace_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_has_active_workspace_membership(workspace_id)
      )
    )
    or (
      organization_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_can_read_organization(organization_id)
      )
    )
  );

drop policy if exists "Members can update sitrep documents in their workspace" on public.sitrep_documents;
create policy "Members can update sitrep documents in their workspace"
  on public.sitrep_documents for update
  using (
    (
      workspace_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_has_active_workspace_membership(workspace_id)
      )
    )
    or (
      organization_id is not null
      and (
        public.current_user_is_org_admin()
        or public.current_user_can_read_organization(organization_id)
      )
    )
  );

drop policy if exists "Members can read sitrep versions" on public.sitrep_versions;
create policy "Members can read sitrep versions"
  on public.sitrep_versions for select
  using (
    exists (
      select 1
      from public.sitrep_documents d
      where d.id = document_id
        and (
          (
            d.workspace_id is not null
            and (
              public.current_user_is_org_admin()
              or public.current_user_has_active_workspace_membership(d.workspace_id)
            )
          )
          or (
            d.organization_id is not null
            and (
              public.current_user_is_org_admin()
              or public.current_user_can_read_organization(d.organization_id)
            )
          )
        )
    )
  );

drop policy if exists "Members can insert sitrep versions" on public.sitrep_versions;
create policy "Members can insert sitrep versions"
  on public.sitrep_versions for insert
  with check (
    exists (
      select 1
      from public.sitrep_documents d
      where d.id = document_id
        and (
          (
            d.workspace_id is not null
            and (
              public.current_user_is_org_admin()
              or public.current_user_has_active_workspace_membership(d.workspace_id)
            )
          )
          or (
            d.organization_id is not null
            and (
              public.current_user_is_org_admin()
              or public.current_user_can_read_organization(d.organization_id)
            )
          )
        )
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.sitrep_documents;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.sitrep_versions;
exception when duplicate_object then null;
end $$;
