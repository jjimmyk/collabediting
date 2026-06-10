-- Hub-level user notifications (create notification from Notifications tab)

create table if not exists public.hub_user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  title text not null,
  summary text not null,
  severity text not null default 'Medium',
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists hub_user_notifications_recipient_idx
  on public.hub_user_notifications (lower(recipient_email), created_at desc);

alter table public.hub_user_notifications enable row level security;

drop policy if exists "Users can read their hub notifications" on public.hub_user_notifications;
create policy "Users can read their hub notifications"
  on public.hub_user_notifications for select
  using (
    public.current_user_is_org_admin()
    or lower(recipient_email) = lower(
      coalesce(
        (select email from public.profiles where id = auth.uid()),
        ''
      )
    )
  );

drop policy if exists "Authenticated users can send hub notifications" on public.hub_user_notifications;
create policy "Authenticated users can send hub notifications"
  on public.hub_user_notifications for insert
  with check (auth.uid() is not null);

do $$ begin
  alter publication supabase_realtime add table public.hub_user_notifications;
exception when duplicate_object then null;
end $$;
