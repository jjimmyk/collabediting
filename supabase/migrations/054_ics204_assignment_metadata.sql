-- Persist ICS-204 assignment state on documents

alter table public.ics204_documents
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by uuid references public.profiles (id) on delete set null,
  add column if not exists assigned_unit text;
