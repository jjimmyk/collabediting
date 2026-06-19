import type { Ics215ResourceColumn, Ics215SectionId } from '@/features/ics215/types'

export const ICS215_DEFAULT_RESOURCE_COLUMNS: Ics215ResourceColumn[] = [
  { id: 'helicopter', label: 'Helicopter' },
  { id: 'small-boat', label: 'Small Boat' },
  { id: 'large-boat', label: 'Large Boat' },
]

export const ICS215_SECTION_LABELS: Record<Ics215SectionId, string> = {
  'incident-info': 'Incident Information',
  'work-assignments': 'Work Assignments',
  'resource-totals': 'Resource Totals',
  'prepared-by': 'Prepared By',
}

export const ICS215_SECTION_PROMPTS: Record<Ics215SectionId, string> = {
  'incident-info':
    'Draft ICS-215 Incident Information (incident name and operational period date/time from/to) for the current workspace and operational period.',
  'work-assignments':
    'Draft ICS-215 Work Assignments with assignee (roster position), work assignment, resource requirements per column (Req/Have/Need), overhead positions, special equipment, reporting location, requested arrival time, and status.',
  'resource-totals':
    'Draft ICS-215 Resource Totals summarizing total resources required, on hand, and need to order for this operational period.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, signature, and date/time prepared.',
}

export const ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT = 6
