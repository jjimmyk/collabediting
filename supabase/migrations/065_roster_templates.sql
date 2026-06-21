-- Global roster templates and per-workspace activation plans

create table if not exists public.roster_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_default boolean not null default false,
  sort_order int not null default 0,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_roster_plans (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  roster_template_id uuid not null references public.roster_templates (id),
  effect_timing text not null
    check (effect_timing in ('immediate', 'op_period_1')),
  draft_plan jsonb not null,
  applied_at timestamptz,
  invites_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_roster_plans_template_id_idx
  on public.workspace_roster_plans (roster_template_id);

create table if not exists public.workspace_roster_single_resource_slots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  label text not null,
  reports_to text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists workspace_roster_single_resource_slots_workspace_id_idx
  on public.workspace_roster_single_resource_slots (workspace_id);

alter table public.roster_templates enable row level security;
alter table public.workspace_roster_plans enable row level security;
alter table public.workspace_roster_single_resource_slots enable row level security;

drop policy if exists "Authenticated users can read roster templates" on public.roster_templates;
create policy "Authenticated users can read roster templates"
  on public.roster_templates for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Members can read workspace roster plans" on public.workspace_roster_plans;
create policy "Members can read workspace roster plans"
  on public.workspace_roster_plans for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage workspace roster plans" on public.workspace_roster_plans;
create policy "Roster managers can manage workspace roster plans"
  on public.workspace_roster_plans for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

drop policy if exists "Members can read roster single resource slots" on public.workspace_roster_single_resource_slots;
create policy "Members can read roster single resource slots"
  on public.workspace_roster_single_resource_slots for select
  using (
    public.current_user_is_org_admin()
    or public.current_user_has_active_workspace_membership(workspace_id)
  );

drop policy if exists "Roster managers can manage roster single resource slots" on public.workspace_roster_single_resource_slots;
create policy "Roster managers can manage roster single resource slots"
  on public.workspace_roster_single_resource_slots for all
  using (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  )
  with check (
    public.current_user_is_org_admin()
    or public.current_user_is_roster_manager(workspace_id)
  );

grant select on public.roster_templates to authenticated;
grant select, insert, update, delete on public.workspace_roster_plans to authenticated;
grant select, insert, update, delete on public.workspace_roster_single_resource_slots to authenticated;
grant select on public.roster_templates to service_role;
grant select, insert, update, delete on public.workspace_roster_plans to service_role;
grant select, insert, update, delete on public.workspace_roster_single_resource_slots to service_role;

insert into public.roster_templates (slug, name, description, is_default, sort_order, definition)
values
  (
    'full-ics-roster',
    'Full ICS Roster',
    'Complete ICS org chart with all standard sections, branches, and unit leaders.',
    true,
    0,
    '{"positions":["Incident Commander","Public Information Officer","Safety Officer","Liaison Officer","Legal Officer","Operations Section Chief","Staging Area Manager","Planning Section Chief","Resources Unit Leader","Situation Unit Leader","Documentation Unit Leader","Demobilization Unit Leader","Technical Specialist","Logistics Section Chief","Service Branch Director","Support Branch Director","Communications Unit Leader","Food Unit Leader","Medical Unit Leader","Facilities Unit Leader","Ground Support Unit Leader","Supply Unit Leader","Vessel Support Unit Leader","Finance Section Chief","Compensation Unit Leader","Cost Unit Leader","Procurement Unit Leader","Time Unit Leader","Intel/Investigations Section Chief","Intelligence Group Supervisor","Investigative Operations Group Supervisor"],"singleResourceSlots":[]}'::jsonb
  ),
  (
    'simple-ics',
    'Simple ICS',
    'Incident Commander only — for small incidents or pre-activation staging.',
    false,
    1,
    '{"positions":["Incident Commander"],"singleResourceSlots":[]}'::jsonb
  ),
  (
    'command-and-general-staff',
    'Command & General Staff',
    'Command team and section chiefs without branch or unit leader depth.',
    false,
    2,
    '{"positions":["Incident Commander","Public Information Officer","Safety Officer","Liaison Officer","Legal Officer","Operations Section Chief","Staging Area Manager","Planning Section Chief","Logistics Section Chief","Finance Section Chief","Intel/Investigations Section Chief"],"singleResourceSlots":[{"label":"Agency Representative","reportsTo":"Incident Commander"}]}'::jsonb
  )
on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    is_default = excluded.is_default,
    sort_order = excluded.sort_order,
    definition = excluded.definition,
    updated_at = now();
