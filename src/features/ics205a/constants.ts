import type { Ics205aSectionId } from '@/features/ics205a/types'

export const ICS205A_SECTION_LABELS: Record<Ics205aSectionId, string> = {
  'incident-info': 'Incident Information',
  'local-communications-info': 'Basic Local Communications Information',
  'prepared-by': 'Prepared By',
}

export const ICS205A_SECTION_PROMPTS: Record<Ics205aSectionId, string> = {
  'incident-info':
    'Draft ICS-205A Incident Information including incident name and operational period date/time from/to for the current workspace.',
  'local-communications-info':
    'Draft ICS-205A Basic Local Communications Information with incident assigned position, name, and methods of contact (phone, pager, cell, radio, etc.) for each person.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, signature, and date/time for the Communications Unit.',
}

export const ICS205A_DEFAULT_CONTACT_ROW_COUNT = 10
