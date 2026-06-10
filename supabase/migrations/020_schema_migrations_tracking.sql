-- Tracks which supabase/migrations/*.sql files have been applied (one row per file).
create table if not exists public.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);

comment on table public.schema_migrations is
  'Applied SQL migration filenames from supabase/migrations (managed by scripts/migration-runner.mjs).';
