-- Fallback sync for ICS-201 section CRDT when broadcast fan-out is missed.

do $$
begin
  alter publication supabase_realtime add table public.ics201_section_crdt;
exception
  when duplicate_object then null;
end $$;
