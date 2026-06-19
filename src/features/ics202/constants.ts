import type { Ics202CommunityLifelineId, Ics202ObjectiveKind, Ics202SectionId } from '@/features/ics202/types'

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
    'Draft ICS-202-CG Incident Objectives as clear, prioritized statements. Mark each as Operational (O), Managerial (M), or Operational and Managerial (O&M).',
  'command-emphasis':
    'Draft Operational Period Command Emphasis including safety message, priorities, and key command decisions or directions for this operational period.',
  'site-safety-plan':
    'Indicate whether a Site Safety Plan is required (Yes/No) and where the approved plan is located for review.',
  'prepared-by':
    'Prepared By is filled automatically from the latest version editor and signing workflow.',
  'critical-information-requirements':
    'Draft Critical Information Requirements (CIRs) needed by command for this operational period.',
  'limitations-constraints':
    'Draft Limitations and Constraints affecting incident operations for this operational period.',
  'key-decisions-procedures':
    'Draft Key Decisions and Procedures established or required for this operational period.',
}

export const ICS202_OBJECTIVE_KIND_OPTIONS: ReadonlyArray<{
  value: Ics202ObjectiveKind
  label: string
}> = [
  { value: 'O', label: 'O' },
  { value: 'M', label: 'M' },
  { value: 'O&M', label: 'O&M' },
]

export const ICS202_OBJECTIVE_KIND_TOOLTIP =
  'Indicates whether an objective is operational (O), managerial (M), or operational and managerial (O&M).'

export const ICS202_PREPARED_BY_SIGNATURE_TOOLTIP =
  'You must create a signed version and sign to create a Signature.'
