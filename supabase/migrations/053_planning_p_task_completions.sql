-- Planning-P per-user task completions scoped to operational period

create table if not exists public.planning_p_task_completions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  operational_period_number integer not null check (operational_period_number > 0),
  task_id text not null,
  completed_at timestamptz not null default now(),
  unique (workspace_id, user_id, operational_period_number, task_id)
);

create index if not exists planning_p_task_completions_workspace_user_period_idx
  on public.planning_p_task_completions (workspace_id, user_id, operational_period_number);

alter table public.planning_p_task_completions enable row level security;

drop policy if exists "Users can read their planning-p task completions" on public.planning_p_task_completions;
create policy "Users can read their planning-p task completions"
  on public.planning_p_task_completions for select
  using (
    user_id = auth.uid()
    and (
      public.current_user_is_org_admin()
      or public.current_user_has_active_workspace_membership(workspace_id)
    )
  );

drop policy if exists "Users can insert their planning-p task completions" on public.planning_p_task_completions;
create policy "Users can insert their planning-p task completions"
  on public.planning_p_task_completions for insert
  with check (
    user_id = auth.uid()
    and (
      public.current_user_is_org_admin()
      or public.current_user_has_active_workspace_membership(workspace_id)
    )
  );

drop policy if exists "Users can update their planning-p task completions" on public.planning_p_task_completions;
create policy "Users can update their planning-p task completions"
  on public.planning_p_task_completions for update
  using (
    user_id = auth.uid()
    and (
      public.current_user_is_org_admin()
      or public.current_user_has_active_workspace_membership(workspace_id)
    )
  )
  with check (
    user_id = auth.uid()
    and (
      public.current_user_is_org_admin()
      or public.current_user_has_active_workspace_membership(workspace_id)
    )
  );

drop policy if exists "Users can delete their planning-p task completions" on public.planning_p_task_completions;
create policy "Users can delete their planning-p task completions"
  on public.planning_p_task_completions for delete
  using (
    user_id = auth.uid()
    and (
      public.current_user_is_org_admin()
      or public.current_user_has_active_workspace_membership(workspace_id)
    )
  );

comment on table public.planning_p_task_completions is
  'Per-user Planning-P checklist completions for a workspace operational period.';
