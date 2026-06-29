-- Organization-scoped member profiles and free-form qualifications

create table if not exists public.organization_member_profiles (
  organization_member_id uuid primary key references public.organization_members (id) on delete cascade,
  phone text,
  address text,
  default_radio_contact text,
  home_aor_node_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_member_qualifications (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid not null references public.organization_members (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint organization_member_qualifications_label_nonempty check (char_length(trim(label)) > 0)
);

create index if not exists organization_member_qualifications_member_idx
  on public.organization_member_qualifications (organization_member_id, sort_order);

create or replace function public.current_user_can_manage_organization_member_profile(
  p_organization_member_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.id = p_organization_member_id
      and om.status in ('active', 'invited')
      and (
        public.current_user_is_platform_org_admin()
        or om.user_id = auth.uid()
        or public.current_user_is_org_admin_for_organization(om.organization_id)
      )
  );
$$;

create or replace function public.current_user_can_read_organization_member_profile(
  p_organization_member_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.id = p_organization_member_id
      and (
        public.current_user_is_platform_org_admin()
        or public.current_user_can_read_organization(om.organization_id)
      )
  );
$$;

grant execute on function public.current_user_can_manage_organization_member_profile(uuid) to authenticated;
grant execute on function public.current_user_can_read_organization_member_profile(uuid) to authenticated;

alter table public.organization_member_profiles enable row level security;
alter table public.organization_member_qualifications enable row level security;

drop policy if exists "Org members can read member profiles" on public.organization_member_profiles;
create policy "Org members can read member profiles"
  on public.organization_member_profiles for select
  using (public.current_user_can_read_organization_member_profile(organization_member_id));

drop policy if exists "Members and admins can manage member profiles" on public.organization_member_profiles;
create policy "Members and admins can manage member profiles"
  on public.organization_member_profiles for all
  using (public.current_user_can_manage_organization_member_profile(organization_member_id))
  with check (public.current_user_can_manage_organization_member_profile(organization_member_id));

drop policy if exists "Org members can read member qualifications" on public.organization_member_qualifications;
create policy "Org members can read member qualifications"
  on public.organization_member_qualifications for select
  using (public.current_user_can_read_organization_member_profile(organization_member_id));

drop policy if exists "Members and admins can manage member qualifications" on public.organization_member_qualifications;
create policy "Members and admins can manage member qualifications"
  on public.organization_member_qualifications for all
  using (public.current_user_can_manage_organization_member_profile(organization_member_id))
  with check (public.current_user_can_manage_organization_member_profile(organization_member_id));

grant select, insert, update, delete on public.organization_member_profiles to authenticated;
grant select, insert, update, delete on public.organization_member_qualifications to authenticated;
grant select, insert, update, delete on public.organization_member_profiles to service_role;
grant select, insert, update, delete on public.organization_member_qualifications to service_role;
