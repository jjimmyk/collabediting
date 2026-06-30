import { HWCG_SOURCE_CONTROL_DEFINITION } from '@/features/roster/hwcg-source-control-roster-template'
import { ICS_ORG_CHART_POSITIONS } from '@/features/roster/ics-org-chart-structure'
import type {
  RosterTemplateDefinition,
  RosterTemplateRecord,
} from '@/features/roster/roster-template-types'

export const DEFAULT_ROSTER_TEMPLATE_SLUG = 'full-ics-roster'

const FULL_ICS_DEFINITION: RosterTemplateDefinition = {
  positions: [...ICS_ORG_CHART_POSITIONS],
  singleResourceSlots: [],
}

const SIMPLE_ICS_DEFINITION: RosterTemplateDefinition = {
  positions: ['Incident Commander'],
  singleResourceSlots: [],
}

const COMMAND_AND_GENERAL_STAFF_DEFINITION: RosterTemplateDefinition = {
  positions: [
    'Incident Commander',
    'Public Information Officer',
    'Safety Officer',
    'Liaison Officer',
    'Legal Officer',
    'Operations Section Chief',
    'Staging Area Manager',
    'Planning Section Chief',
    'Logistics Section Chief',
    'Finance Section Chief',
    'Intel/Investigations Section Chief',
  ],
  singleResourceSlots: [{ label: 'Agency Representative', reportsTo: 'Incident Commander' }],
}

/** Built-in catalog mirrored by DB seed in 065_roster_templates.sql */
export const ROSTER_TEMPLATE_CATALOG: RosterTemplateRecord[] = [
  {
    id: 'builtin-full-ics-roster',
    slug: 'full-ics-roster',
    name: 'Full ICS Roster',
    description:
      'Complete ICS org chart with all standard sections, branches, and unit leaders.',
    isDefault: true,
    sortOrder: 0,
    definition: FULL_ICS_DEFINITION,
  },
  {
    id: 'builtin-simple-ics',
    slug: 'simple-ics',
    name: 'Simple ICS',
    description: 'Incident Commander only — for small incidents or pre-activation staging.',
    isDefault: false,
    sortOrder: 1,
    definition: SIMPLE_ICS_DEFINITION,
  },
  {
    id: 'builtin-command-and-general-staff',
    slug: 'command-and-general-staff',
    name: 'Command & General Staff',
    description: 'Command team and section chiefs without branch or unit leader depth.',
    isDefault: false,
    sortOrder: 2,
    definition: COMMAND_AND_GENERAL_STAFF_DEFINITION,
  },
  {
    id: 'builtin-hwcg-source-control',
    slug: 'hwcg-source-control',
    name: 'HWCG Source Control',
    description:
      'HWCG ICS 2.0 incident management organogram focused on Source Control operations.',
    isDefault: false,
    sortOrder: 3,
    definition: HWCG_SOURCE_CONTROL_DEFINITION,
  },
]

export function getRosterTemplateBySlug(slug: string): RosterTemplateRecord | null {
  return ROSTER_TEMPLATE_CATALOG.find((template) => template.slug === slug) ?? null
}

export function getDefaultRosterTemplate(): RosterTemplateRecord {
  return (
    ROSTER_TEMPLATE_CATALOG.find((template) => template.isDefault) ?? ROSTER_TEMPLATE_CATALOG[0]
  )
}
