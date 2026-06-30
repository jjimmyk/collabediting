import type {
  RosterTemplateCustomPositionSeed,
  RosterTemplateDefinition,
} from '@/features/roster/roster-template-types'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'

export const HWCG_SOURCE_CONTROL_TEMPLATE_SLUG = 'hwcg-source-control'

export const HWCG_SOURCE_CONTROL_STANDARD_POSITIONS = [
  'Incident Commander',
  'Finance Section Chief',
  'Logistics Section Chief',
  'Operations Section Chief',
  'Planning Section Chief',
] as const

const INCIDENT_COMMANDER = 'Incident Commander'
const OPERATIONS_SECTION_CHIEF = 'Operations Section Chief'
const SOURCE_CONTROL_BRANCH = 'Source Control Branch'
const SIMOPS_GROUP = 'SIMOPS Group'
const ENGINEERING_SUPPORT_GROUP = 'Engineering Support Group'
const CAPPING_GROUP = 'Capping Group'
const CONTAINMENT_GROUP = 'Containment Group'
const INTERIM_CONTAINMENT_TASK_FORCE = 'Interim Containment Task Force'
const EXTENDED_CONTAINMENT_TASK_FORCE = 'Extended Containment Task Force'
const DISPOSAL_TASK_FORCE = 'Disposal Task Force'
const RELIEF_WELL_GROUP = 'Relief Well Group'

function hwcgSeed(
  name: string,
  reportsTo: string,
  positionType: WorkspacePositionType
): RosterTemplateCustomPositionSeed {
  return { name, reportsTo, positionType, customTypeLabel: null }
}

export const HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS: RosterTemplateCustomPositionSeed[] = [
  hwcgSeed('Command Staff', INCIDENT_COMMANDER, 'group'),
  hwcgSeed('Supporting Government Officials (FOSC)', INCIDENT_COMMANDER, 'group'),
  hwcgSeed('OSR Branch (QI/SMT)', OPERATIONS_SECTION_CHIEF, 'branch'),
  hwcgSeed(SOURCE_CONTROL_BRANCH, OPERATIONS_SECTION_CHIEF, 'branch'),
  hwcgSeed('HWCG Crisis Management Team', OPERATIONS_SECTION_CHIEF, 'group'),
  hwcgSeed('SIMOPS Group', SOURCE_CONTROL_BRANCH, 'group'),
  hwcgSeed('Vessel Management Team', SIMOPS_GROUP, 'group'),
  hwcgSeed('Safety Support', SIMOPS_GROUP, 'group'),
  hwcgSeed('Operations Planning', SIMOPS_GROUP, 'group'),
  hwcgSeed(ENGINEERING_SUPPORT_GROUP, SOURCE_CONTROL_BRANCH, 'group'),
  hwcgSeed(CAPPING_GROUP, SOURCE_CONTROL_BRANCH, 'group'),
  hwcgSeed(CONTAINMENT_GROUP, SOURCE_CONTROL_BRANCH, 'group'),
  hwcgSeed(RELIEF_WELL_GROUP, SOURCE_CONTROL_BRANCH, 'group'),
  hwcgSeed('Geosciences Unit', ENGINEERING_SUPPORT_GROUP, 'group'),
  hwcgSeed('Drilling Engineering Unit', ENGINEERING_SUPPORT_GROUP, 'group'),
  hwcgSeed('Flow Assurance Unit', ENGINEERING_SUPPORT_GROUP, 'group'),
  hwcgSeed('Marine Unit', ENGINEERING_SUPPORT_GROUP, 'group'),
  hwcgSeed('ROV Unit', ENGINEERING_SUPPORT_GROUP, 'group'),
  hwcgSeed('Subsea Survey Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed('BOP Intervention Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed('Debris Removal Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed('Dispersion Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed('Capping Operations Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed('Offset Installation Task Force', CAPPING_GROUP, 'task_force'),
  hwcgSeed(INTERIM_CONTAINMENT_TASK_FORCE, CONTAINMENT_GROUP, 'task_force'),
  hwcgSeed(EXTENDED_CONTAINMENT_TASK_FORCE, CONTAINMENT_GROUP, 'task_force'),
  hwcgSeed(DISPOSAL_TASK_FORCE, CONTAINMENT_GROUP, 'task_force'),
  hwcgSeed('Interim Containment Operations Unit', INTERIM_CONTAINMENT_TASK_FORCE, 'group'),
  hwcgSeed(
    'Interim Surface Processing System Unit (Capture Vessel)',
    INTERIM_CONTAINMENT_TASK_FORCE,
    'group'
  ),
  hwcgSeed('Interim Riser Systems Unit', INTERIM_CONTAINMENT_TASK_FORCE, 'group'),
  hwcgSeed('Extended Containment Operations Unit', EXTENDED_CONTAINMENT_TASK_FORCE, 'group'),
  hwcgSeed('Extended Subsea Systems Unit', EXTENDED_CONTAINMENT_TASK_FORCE, 'group'),
  hwcgSeed(
    'Extended Surface Processing System Unit (Capture Vessel)',
    EXTENDED_CONTAINMENT_TASK_FORCE,
    'group'
  ),
  hwcgSeed('Extended Riser Systems Unit', EXTENDED_CONTAINMENT_TASK_FORCE, 'group'),
  hwcgSeed('Export Systems Unit', DISPOSAL_TASK_FORCE, 'group'),
  hwcgSeed('Lightering / Offloading Unit', DISPOSAL_TASK_FORCE, 'group'),
  hwcgSeed('Well Construction Task Force', RELIEF_WELL_GROUP, 'task_force'),
  hwcgSeed('Well Interception Task Force', RELIEF_WELL_GROUP, 'task_force'),
  hwcgSeed('Well Kill Task Force', RELIEF_WELL_GROUP, 'task_force'),
  hwcgSeed('Rig Operations Task Force', RELIEF_WELL_GROUP, 'task_force'),
]

export const HWCG_SOURCE_CONTROL_DEFINITION: RosterTemplateDefinition = {
  positions: [...HWCG_SOURCE_CONTROL_STANDARD_POSITIONS],
  singleResourceSlots: [],
  customPositions: HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS,
}

export function templateCustomPositionId(templateSlug: string, positionName: string): string {
  const slug = positionName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${templateSlug}-custom-${slug}`
}
