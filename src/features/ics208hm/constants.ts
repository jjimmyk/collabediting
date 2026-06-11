import type { Ics208hmSectionId } from '@/features/ics208hm/types'

export const ICS208HM_DEFAULT_ENTRY_TEAM_COUNT = 4
export const ICS208HM_DEFAULT_MATERIAL_COUNT = 1

export const ICS208HM_SECTION_LABELS: Record<Ics208hmSectionId, string> = {
  'incident-info': 'Incident Information',
  'site-information': 'Section I — Site Information',
  organization: 'Section II — Organization',
  'hazard-risk-analysis': 'Section III — Hazard/Risk Analysis',
  'hazard-monitoring': 'Section IV — Hazard Monitoring',
  'decontamination-procedures': 'Section V — Decontamination Procedures',
  'site-communications': 'Section VI — Site Communications',
  'medical-assistance': 'Section VII — Medical Assistance',
  'site-map': 'Section VIII — Site Map',
  'entry-objectives': 'Section IX — Entry Objectives',
  'sop-safe-work-practices': 'Section X — SOPs and Safe Work Practices',
  'emergency-procedures': 'Section XI — Emergency Procedures',
  'safety-briefing': 'Section XII — Safety Briefing',
}

export const ICS208HM_SECTION_PROMPTS: Record<Ics208hmSectionId, string> = {
  'incident-info':
    'Draft ICS-208HM incident name, date prepared, and operational period date/time for the current hazardous materials incident.',
  'site-information':
    'Draft ICS-208HM site information including incident location address and/or map coordinates.',
  organization:
    'Draft ICS-208HM organization assignments for all HM Group positions, entry team buddy pairs, and decontamination element personnel with PPE levels.',
  'hazard-risk-analysis':
    'Draft ICS-208HM hazard/risk analysis material rows with container type, quantity, physical state, and chemical properties (pH, IDLH, flash point, LEL/UEL, etc.).',
  'hazard-monitoring':
    'Draft ICS-208HM hazard monitoring instruments for LEL, O₂, toxicity/PPM, and radiological detection.',
  'decontamination-procedures':
    'Draft ICS-208HM standard decontamination procedures including YES/NO and comments on modifications or solution types.',
  'site-communications':
    'Draft ICS-208HM site communications frequencies for command, tactical, and entry nets.',
  'medical-assistance':
    'Draft ICS-208HM medical assistance including medical monitoring and treatment/transport in-place YES/NO with comments.',
  'site-map':
    'Draft ICS-208HM site map sketch notes and identify weather, command post, zones, assembly areas, escape routes, and other map elements.',
  'entry-objectives':
    'Draft ICS-208HM entry objectives for Exclusion Zone operations and parameters that will alter or stop entry.',
  'sop-safe-work-practices':
    'Draft ICS-208HM SOP and safe work practice modifications YES/NO with comments.',
  'emergency-procedures':
    'Draft ICS-208HM emergency procedures for personnel within the Exclusion Zone.',
  'safety-briefing':
    'Draft ICS-208HM safety briefing signatures for Asst. Safety Officer - HM, HM Group Supervisor, and Incident Commander with briefing completion time.',
}
