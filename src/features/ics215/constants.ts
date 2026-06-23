import type { Ics215ResourceColumn, Ics215SectionId } from '@/features/ics215/types'

export const ICS215_FORM_TITLE_LINES = [
  'DEPARTMENT OF HOMELAND SECURITY',
  'U.S. COAST GUARD',
  'OPERATIONAL PLANNING WORKSHEET (ICS 215-CG)',
] as const

export const ICS215_EXPORT_FOOTER_LEFT = 'ICS 215-CG (11/24)'

/** Max resource kind columns per horizontal page slice (legacy export = 1 col each). */
export const ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE = 8

export const ICS215_DEFAULT_RESOURCE_COLUMNS: Ics215ResourceColumn[] = [
  { id: 'helicopter', label: 'Helicopter' },
  { id: 'small-boat', label: 'Small Boat' },
  { id: 'large-boat', label: 'Large Boat' },
]

export const ICS215_SECTION_LABELS: Record<Ics215SectionId, string> = {
  'incident-info': 'Incident Information',
  'work-assignments': 'Work Assignments',
  'prepared-by': 'Prepared By',
}

export const ICS215_SECTION_PROMPTS: Record<Ics215SectionId, string> = {
  'incident-info':
    'Draft ICS-215 Incident Information (incident name and operational period date/time from/to) for the current workspace and operational period.',
  'work-assignments':
    'Draft ICS-215 Work Assignments with assignee (roster position), work assignment, resource requirements per column (Req/Have/Need), overhead positions, special equipment, reporting location, requested arrival time, and status.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, and date/time prepared.',
}

export const ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT = 6
