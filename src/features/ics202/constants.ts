import type { Ics202SectionId } from '@/features/ics202/types'

export const ICS202_SECTION_LABELS: Record<Ics202SectionId, string> = {
  'incident-info': 'Incident Information',
  objectives: 'Objectives',
  'command-emphasis': 'Operational Period Command Emphasis',
  'site-safety-plan': 'Site Safety Plan',
  'prepared-by': 'Prepared By',
}

export const ICS202_SECTION_PROMPTS: Record<Ics202SectionId, string> = {
  'incident-info':
    'Draft ICS-202 Incident Information (incident name, location, and operational period dates/times) for the current workspace and operational period.',
  objectives:
    'Draft ICS-202 Objectives as clear, prioritized statements. Mark each as Operational (O) or Management (M) and use letter labels (A, B, C, etc.).',
  'command-emphasis':
    'Draft Operational Period Command Emphasis including safety message, priorities, and key command decisions or directions for this operational period.',
  'site-safety-plan':
    'Indicate whether a Site Safety Plan is required and where the approved plan is located for review.',
  'prepared-by':
    'Draft the Prepared By block with the Planning Section Chief name and date/time prepared.',
}

export const ICS202_OBJECTIVE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
