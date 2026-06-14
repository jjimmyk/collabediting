-- Enable Planning-P sequential workflow flags for USCG ICS exercise workspaces

update public.workspaces
set
  has_sequential_workflow = true,
  sequential_workflow_type = 'planning-p'
where kind = 'exercise'
  and workspace_format = 'uscg-ics'
  and incident_complexity = 'planning-p'
  and (
    coalesce(has_sequential_workflow, false) is not true
    or sequential_workflow_type is distinct from 'planning-p'
  );
