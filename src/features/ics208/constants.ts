import type { Ics208SectionId } from '@/features/ics208/types'

export const ICS208_SECTION_LABELS: Record<Ics208SectionId, string> = {
  'incident-info': 'Incident Information',
  'safety-message-plan': 'Safety Message / Plan',
  'site-safety-plan': 'Site Safety Plan',
  'prepared-by': 'Prepared By',
}

export const ICS208_SECTION_PROMPTS: Record<Ics208SectionId, string> = {
  'incident-info':
    'Draft ICS-208 Incident Information including incident name and operational period date/time from/to for the current workspace.',
  'safety-message-plan':
    'Draft ICS-208 Safety Message/Plan with clear safety priorities, known hazards, precautions, and key command emphasis for this operational period.',
  'site-safety-plan':
    'Draft ICS-208 Site Safety Plan requirements including whether a site safety plan is required and where approved plan(s) are located.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, signature, and date/time for the Safety Officer.',
}
