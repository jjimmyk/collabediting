-- Tabletop exercise MSEL inject deliveries (schedule send → notification + received list)

create table if not exists public.exercise_msel_inject_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  inject_id integer not null,
  recipient_email text not null,
  title text not null,
  summary text not null,
  severity text not null default 'Medium',
  inject_snapshot jsonb not null,
  sent_by_email text,
  hub_notification_id uuid references public.hub_user_notifications (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists exercise_msel_deliveries_workspace_idx
  on public.exercise_msel_inject_deliveries (workspace_id, created_at desc);

create index if not exists exercise_msel_deliveries_inject_idx
  on public.exercise_msel_inject_deliveries (workspace_id, inject_id, created_at desc);

create index if not exists exercise_msel_deliveries_recipient_idx
  on public.exercise_msel_inject_deliveries (workspace_id, lower(recipient_email), created_at desc);

alter table public.exercise_msel_inject_deliveries enable row level security;

drop policy if exists "Workspace members read msel inject deliveries" on public.exercise_msel_inject_deliveries;
create policy "Workspace members read msel inject deliveries"
  on public.exercise_msel_inject_deliveries for select
  using (
    public.current_user_is_org_admin()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = exercise_msel_inject_deliveries.workspace_id
        and wm.user_id = auth.uid()
        and wm.status = 'active'
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.exercise_msel_inject_deliveries;
exception when duplicate_object then null;
end $$;
