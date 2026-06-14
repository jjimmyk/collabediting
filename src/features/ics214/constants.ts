import type { Ics214SectionId } from '@/features/ics214/types'

export const ICS214_SECTION_LABELS: Record<Ics214SectionId, string> = {
  'incident-info': 'Incident Information',
  'activity-log': 'Activity Log',
  'prepared-by': 'Prepared By',
}

export const ICS214_SECTION_PROMPTS: Record<Ics214SectionId, string> = {
  'incident-info':
    'Draft ICS-214 Incident Information (incident name, unit name, operational period, and date of activity) for the current workspace and operational period.',
  'activity-log':
    'Draft ICS-214 Activity Log entries with completed by, completed at, and notable activities for this operational period.',
  'prepared-by':
    'Draft the Prepared By block with the unit leader name and date/time prepared.',
}
