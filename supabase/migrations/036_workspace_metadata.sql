-- Extended workspace fields for Name & Location settings (category, template, location, etc.)
alter table public.workspaces
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.workspaces.metadata is
  'Extended workspace settings: category, templateId, relatedEventIds, locationMethod, geometrySummary, aors, address, location coords.';
