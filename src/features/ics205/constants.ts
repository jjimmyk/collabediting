import type { Ics205SectionId } from '@/features/ics205/types'

export const ICS205_SECTION_LABELS: Record<Ics205SectionId, string> = {
  'incident-info': 'Incident Information',
  'basic-radio-channels': 'Basic Radio Channel Use',
  'special-instructions': 'Special Instructions',
  'prepared-by': 'Prepared By (Communications Unit Leader)',
}

export const ICS205_SECTION_PROMPTS: Record<Ics205SectionId, string> = {
  'incident-info':
    'Draft ICS-205 Incident Information including incident name, date/time prepared, and operational period date/time from/to for the current workspace.',
  'basic-radio-channels':
    'Draft ICS-205 Basic Radio Channel Use rows with zone, group, channel number, function, channel name/talkgroup, assignment, RX/TX frequencies and tones, mode (A/D/M), and remarks.',
  'special-instructions':
    'Draft ICS-205 Special Instructions for cross-band repeaters, secure voice, encoders, PL tones, or other emergency communications needs.',
  'prepared-by':
    'Draft the Prepared By block for the Communications Unit Leader with name, signature, and date/time.',
}

export const ICS205_DEFAULT_RADIO_CHANNEL_COUNT = 8
