import type { Ics202CommunityLifelineId, Ics202SectionId } from '@/features/ics202/types'

export const ICS202_FORM_TITLE_LINES = [
  'DEPARTMENT OF HOMELAND SECURITY',
  'U.S. COAST GUARD',
  'INCIDENT BRIEFING (ICS 202-CG)',
] as const

export const ICS202_COMMUNITY_LIFELINES: ReadonlyArray<{
  id: Ics202CommunityLifelineId
  label: string
}> = [
  { id: 'safety-security', label: 'Safety and Security' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'hazardous-materials', label: 'Hazardous Materials' },
  { id: 'health-medical', label: 'Health and Medical' },
  { id: 'energy', label: 'Energy' },
  { id: 'communications', label: 'Communications' },
  { id: 'food-hydration-shelter', label: 'Food, Hydration, Shelter' },
  { id: 'water-systems', label: 'Water Systems' },
]

export const ICS202_SECTION_LABELS: Record<Ics202SectionId, string> = {
  'incident-info': '1–3. Incident Information',
  'community-lifelines': '4. Community Lifelines',
  'incident-priorities': '5. Incident Priorities',
  objectives: '6. Incident Objectives',
  'command-emphasis': '7. Operational Period Command Emphasis (Safety, Direction)',
  'site-safety-plan': '8–9. Site Safety Plan',
  'prepared-by': '10. Prepared By',
  'critical-information-requirements': '11. Critical Information Requirements',
  'limitations-constraints': '12. Limitations and Constraints',
  'key-decisions-procedures': '13. Key Decisions and Procedures',
}

export const ICS202_SECTION_ORDER: Ics202SectionId[] = [
  'incident-info',
  'community-lifelines',
  'incident-priorities',
  'objectives',
  'command-emphasis',
  'site-safety-plan',
  'prepared-by',
  'critical-information-requirements',
  'limitations-constraints',
  'key-decisions-procedures',
]

export const ICS202_SECTION_PROMPTS: Record<Ics202SectionId, string> = {
  'incident-info':
    'Draft ICS-202-CG incident name, location, and operational period date/time (From/To) for the current workspace and operational period.',
  'community-lifelines':
    'Select the Community Lifelines impacted or prioritized for this operational period on the ICS-202-CG Incident Briefing.',
  'incident-priorities':
    'Draft ICS-202-CG Incident Priorities as clear, ordered statements for the current operational period.',
  objectives:
    'Draft ICS-202-CG Incident Objectives as clear, prioritized statements. Mark each as Operational (O) or Management (M) and use letter labels (A, B, C, etc.).',
  'command-emphasis':
    'Draft Operational Period Command Emphasis including safety message, priorities, and key command decisions or directions for this operational period.',
  'site-safety-plan':
    'Indicate whether a Site Safety Plan is required (Yes/No) and where the approved plan is located for review.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, signature, and date/time prepared.',
  'critical-information-requirements':
    'Draft Critical Information Requirements (CIRs) needed by command for this operational period.',
  'limitations-constraints':
    'Draft Limitations and Constraints affecting incident operations for this operational period.',
  'key-decisions-procedures':
    'Draft Key Decisions and Procedures established or required for this operational period.',
}

export const ICS202_OBJECTIVE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
