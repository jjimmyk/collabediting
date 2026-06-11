import type { Ics234MatrixItemRef, Ics234SectionId } from '@/features/ics234/types'

export const ICS234_SECTION_LABELS: Record<Ics234SectionId, string> = {
  'incident-info': 'Incident Information',
  'work-analysis-matrix': 'Objectives, Strategies & Tactics',
  'prepared-by': 'Prepared By',
}

export const ICS234_SECTION_PROMPTS: Record<Ics234SectionId, string> = {
  'incident-info':
    'Draft ICS-234 incident name, location, and operational period for the current workspace.',
  'work-analysis-matrix':
    'Draft operational objectives, strategies, and tactics as named items for the ICS-234 work analysis matrix.',
  'prepared-by':
    'Draft the Prepared By block with Operations Section Chief name, position/title, and date/time.',
}

export const ICS234_MATRIX_ITEM_PROMPTS: Record<Ics234MatrixItemRef['kind'], string> = {
  objective: 'Draft a named operational objective for the ICS-234 work analysis matrix.',
  strategy: 'Draft a named strategy for the parent objective.',
  tactic: 'Draft a named tactic or work assignment for the parent strategy.',
}
