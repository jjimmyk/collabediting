-- Per-recipient ICS-233 action notifications (assignment, status updates)

create table if not exists public.ics233_action_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  recipient_email text not null,
  title text not null,
  summary text not null,
  severity text not null default 'Medium',
  action_row_id integer,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists ics233_action_notifications_recipient_idx
  on public.ics233_action_notifications (lower(recipient_email), created_at desc);

create index if not exists ics233_action_notifications_workspace_id_idx
  on public.ics233_action_notifications (workspace_id);

alter table public.ics233_action_notifications enable row level security;

drop policy if exists "Users can read their ics233 action notifications" on public.ics233_action_notifications;
create policy "Users can read their ics233 action notifications"
  on public.ics233_action_notifications for select
  using (
    public.current_user_is_org_admin()
    or lower(recipient_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
  );

drop policy if exists "Members can insert ics233 action notifications" on public.ics233_action_notifications;
create policy "Members can insert ics233 action notifications"
  on public.ics233_action_notifications for insert
  with check (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

do $$ begin
  alter publication supabase_realtime add table public.ics233_action_notifications;
exception when duplicate_object then null;
end $$;
