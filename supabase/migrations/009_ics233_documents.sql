-- ICS-233 open actions persistence per workspace (shared across roster members)

create table if not exists public.ics233_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  rows_data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (workspace_id),
  constraint ics233_documents_rows_array check (jsonb_typeof(rows_data) = 'array')
);

create index if not exists ics233_documents_workspace_id_idx
  on public.ics233_documents (workspace_id);

alter table public.ics233_documents enable row level security;

drop policy if exists "Members can read ics233 documents in their workspace" on public.ics233_documents;
create policy "Members can read ics233 documents in their workspace"
  on public.ics233_documents for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Members can insert ics233 documents in their workspace" on public.ics233_documents;
create policy "Members can insert ics233 documents in their workspace"
  on public.ics233_documents for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Members can update ics233 documents in their workspace" on public.ics233_documents;
create policy "Members can update ics233 documents in their workspace"
  on public.ics233_documents for update
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

do $$ begin
  alter publication supabase_realtime add table public.ics233_documents;
exception when duplicate_object then null;
end $$;
