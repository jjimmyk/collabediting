import type { Ics204SectionId } from '@/features/ics204/types'

export const ICS204_ASSIGNED_UNIT_OPTIONS = [
  'Division A Task Force',
  'Division B Task Force',
  'Medical Group',
  'Evacuation Group',
  'Infrastructure Group',
] as const

export const ICS204_SECTION_LABELS: Record<Ics204SectionId, string> = {
  'assignment-info': 'Assignment Information',
  'resources-assigned': 'Resources Assigned',
  'work-assignments': 'Work Assignments',
  'special-instructions': 'Special Instructions',
  communications: 'Communications',
}

export const ICS204_SECTION_PROMPTS: Record<Ics204SectionId, string> = {
  'assignment-info':
    'Draft the ICS-204 Assignment Information fields (Section Chief, Branch Director, Division/Group Supervisor, Branch, Division, Group, and Staging Area) using the current incident posture, roster assignments, and operational period.',
  'resources-assigned':
    'Draft the Resources Assigned entries for this ICS-204 using checked-in resources, current assignments, and staging area posture. Include reporting info/notes and 204A attachment flags where appropriate.',
  'work-assignments':
    'Draft Work Assignments for this ICS-204 including assignment text, priority, resource requirements, overhead positions, special equipment, reporting location, and requested arrival time.',
  'special-instructions':
    'Draft Special Instructions for this ICS-204 covering safety, accountability, coordination, and any constraints responders must follow during the operational period.',
  communications:
    'Draft the Communications plan for this ICS-204 including primary and alternate channels, call signs, and escalation paths for the assigned unit. Include Emergency Communications for medical, evacuation, and other emergency contacts.',
}
