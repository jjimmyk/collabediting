import type { Ics215aSectionId } from '@/features/ics215a/types'

export const ICS215A_SECTION_LABELS: Record<Ics215aSectionId, string> = {
  'incident-info': 'Incident Information',
  'operational-period': 'Operational Period',
  'safety-analysis': 'Safety Analysis',
  'prepared-by': 'Prepared By',
}

export const ICS215A_SECTION_PROMPTS: Record<Ics215aSectionId, string> = {
  'incident-info':
    'Draft ICS-215A Incident Information (incident name, location, and date/time prepared) for the current workspace.',
  'operational-period':
    'Draft ICS-215A Operational Period start and end dates/times (24-hour clock) for the current operational period.',
  'safety-analysis':
    'Draft ICS-215A Safety Analysis rows listing incident areas, hazards/risks, mitigations, and risk/gain levels (L/M/H) for each assignment area.',
  'prepared-by':
    'Draft the Prepared By block with Safety Officer name, position/title, signature, and date/time prepared.',
}

export const ICS215A_DEFAULT_SAFETY_ANALYSIS_ROW_COUNT = 4

export const ICS215A_RISK_GAIN_LEVELS = ['L', 'M', 'H'] as const
