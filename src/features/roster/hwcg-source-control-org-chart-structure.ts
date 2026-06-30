import {
  collectOrgChartPositions,
  ICS_ORG_CHART_ROOT_POSITION,
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'

function hwcgPosition(
  position: string,
  color: OrgChartColor,
  children?: OrgChartNode[],
  connectorStyle?: 'solid' | 'dashed'
): Extract<OrgChartNode, { kind: 'position' }> {
  return {
    kind: 'position',
    position,
    color,
    ...(connectorStyle ? { connectorStyle } : {}),
    ...(children?.length ? { children } : {}),
  }
}

function hwcgStack(color: OrgChartColor, positions: string[], positionColor: OrgChartColor) {
  return {
    kind: 'stack' as const,
    color,
    children: positions.map((position) => hwcgPosition(position, positionColor)),
  }
}

function hwcgTaskForceWithUnits(
  taskForce: string,
  units: string[]
): Extract<OrgChartNode, { kind: 'position' }> {
  return hwcgPosition(taskForce, 'hwcg_task_force', [hwcgStack('hwcg_unit', units, 'hwcg_unit')])
}

const SIMOPS_STACK = hwcgStack(
  'hwcg_task_force',
  ['Vessel Management Team', 'Safety Support', 'Operations Planning'],
  'hwcg_task_force'
)

const ENGINEERING_STACK = hwcgStack(
  'hwcg_unit',
  [
    'Geosciences Unit',
    'Drilling Engineering Unit',
    'Flow Assurance Unit',
    'Marine Unit',
    'ROV Unit',
  ],
  'hwcg_unit'
)

const CAPPING_STACK = hwcgStack(
  'hwcg_task_force',
  [
    'Subsea Survey Task Force',
    'BOP Intervention Task Force',
    'Debris Removal Task Force',
    'Dispersion Task Force',
    'Capping Operations Task Force',
    'Offset Installation Task Force',
  ],
  'hwcg_task_force'
)

const CONTAINMENT_STACK: Extract<OrgChartNode, { kind: 'stack' }> = {
  kind: 'stack',
  color: 'hwcg_task_force',
  children: [
    hwcgTaskForceWithUnits('Interim Containment Task Force', [
      'Interim Containment Operations Unit',
      'Interim Surface Processing System Unit (Capture Vessel)',
      'Interim Riser Systems Unit',
    ]),
    hwcgTaskForceWithUnits('Extended Containment Task Force', [
      'Extended Containment Operations Unit',
      'Extended Subsea Systems Unit',
      'Extended Surface Processing System Unit (Capture Vessel)',
      'Extended Riser Systems Unit',
    ]),
    hwcgTaskForceWithUnits('Disposal Task Force', [
      'Export Systems Unit',
      'Lightering / Offloading Unit',
    ]),
  ],
}

const RELIEF_WELL_STACK = hwcgStack(
  'hwcg_task_force',
  [
    'Well Construction Task Force',
    'Well Interception Task Force',
    'Well Kill Task Force',
    'Rig Operations Task Force',
  ],
  'hwcg_task_force'
)

const SOURCE_CONTROL_GROUPS_FORK: Extract<OrgChartNode, { kind: 'fork' }> = {
  kind: 'fork',
  color: 'hwcg_group',
  forkVariant: 'hwcg_source_control',
  children: [
    hwcgPosition('SIMOPS Group', 'hwcg_group', [SIMOPS_STACK]),
    hwcgPosition('Engineering Support Group', 'hwcg_group', [ENGINEERING_STACK]),
    hwcgPosition('Capping Group', 'hwcg_group', [CAPPING_STACK]),
    hwcgPosition('Containment Group', 'hwcg_group', [CONTAINMENT_STACK]),
    hwcgPosition('Relief Well Group', 'hwcg_group', [RELIEF_WELL_STACK]),
  ],
}

const OPERATIONS_BRANCH_FORK: Extract<OrgChartNode, { kind: 'fork' }> = {
  kind: 'fork',
  color: 'hwcg_ops_branch',
  forkVariant: 'hwcg_ops',
  children: [
    hwcgPosition('OSR Branch (QI/SMT)', 'hwcg_ops_branch'),
    hwcgPosition('Source Control Branch', 'hwcg_ic', [SOURCE_CONTROL_GROUPS_FORK]),
    hwcgPosition('HWCG Crisis Management Team', 'hwcg_advisory'),
  ],
}

export const HWCG_SOURCE_CONTROL_ADVISORY_POSITIONS = [
  'Command Staff',
  'Supporting Government Officials (FOSC)',
] as const

export const HWCG_SOURCE_CONTROL_ADVISORY_BRANCH: Extract<OrgChartNode, { kind: 'group' }> = {
  kind: 'group',
  label: 'Advisory',
  type: 'Command Staff',
  color: 'hwcg_advisory',
  children: HWCG_SOURCE_CONTROL_ADVISORY_POSITIONS.map((position) =>
    hwcgPosition(position, 'hwcg_advisory', undefined, 'dashed')
  ),
}

export const HWCG_SOURCE_CONTROL_SECTION_BRANCHES: Extract<OrgChartNode, { kind: 'group' }>[] = [
  {
    kind: 'group',
    label: 'Finance Section',
    type: 'Section',
    color: 'hwcg_section',
    children: [hwcgPosition('Finance Section Chief', 'hwcg_section')],
  },
  {
    kind: 'group',
    label: 'Logistics Section',
    type: 'Section',
    color: 'hwcg_section',
    children: [hwcgPosition('Logistics Section Chief', 'hwcg_section')],
  },
  {
    kind: 'group',
    label: 'Operations Section',
    type: 'Section',
    color: 'hwcg_section',
    children: [
      hwcgPosition('Operations Section Chief', 'hwcg_section', [OPERATIONS_BRANCH_FORK]),
    ],
  },
  {
    kind: 'group',
    label: 'Planning Section',
    type: 'Section',
    color: 'hwcg_section',
    children: [hwcgPosition('Planning Section Chief', 'hwcg_section')],
  },
]

export const HWCG_SOURCE_CONTROL_ROOT: Extract<OrgChartNode, { kind: 'position' }> = hwcgPosition(
  ICS_ORG_CHART_ROOT_POSITION,
  'hwcg_ic'
)

export const HWCG_SOURCE_CONTROL_ORG_CHART_POSITIONS: ReadonlySet<string> = new Set(
  collectOrgChartPositions([
    ...HWCG_SOURCE_CONTROL_SECTION_BRANCHES,
    HWCG_SOURCE_CONTROL_ADVISORY_BRANCH,
  ])
)

export function isHwcgSourceControlOrgChartPosition(positionName: string): boolean {
  return HWCG_SOURCE_CONTROL_ORG_CHART_POSITIONS.has(positionName)
}
