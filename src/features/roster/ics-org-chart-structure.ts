export type OrgChartColor =
  | 'red'
  | 'blue'
  | 'orange'
  | 'green'
  | 'neutral'
  | 'tan'
  | 'yellow'
  | 'hwcg_ic'
  | 'hwcg_section'
  | 'hwcg_ops_branch'
  | 'hwcg_group'
  | 'hwcg_task_force'
  | 'hwcg_unit'
  | 'hwcg_advisory'

export type OrgChartConnectorStyle = 'solid' | 'dashed'

export type OrgChartNode =
  | {
      kind: 'position'
      position: string
      color?: OrgChartColor
      connectorStyle?: OrgChartConnectorStyle
      children?: OrgChartNode[]
    }
  | {
      kind: 'stack'
      color?: OrgChartColor
      children: OrgChartNode[]
    }
  | {
      kind: 'fork'
      color?: OrgChartColor
      forkVariant?: 'default' | 'hwcg_ops' | 'hwcg_source_control'
      children: OrgChartNode[]
    }
  | {
      kind: 'asset'
      assetKey: string
      label: string
      assetType?: string
      color?: OrgChartColor
      scheduled?: boolean
    }
  | {
      kind: 'single_resource'
      memberId: string
      label: string
      email: string
      color?: OrgChartColor
      scheduled?: boolean
    }
  | {
      kind: 'group'
      label: string
      type: 'Section' | 'Command Staff'
      color: OrgChartColor
      children: OrgChartNode[]
    }

export const ICS_ORG_CHART_ROOT_POSITION = 'Incident Commander' as const

export const ICS_ORG_CHART_ROOT: OrgChartNode = {
  kind: 'position',
  position: ICS_ORG_CHART_ROOT_POSITION,
}

export const ICS_ORG_CHART_COMMAND_STAFF_POSITIONS = [
  'Public Information Officer',
  'Safety Officer',
  'Liaison Officer',
  'Legal Officer',
] as const

/** ICS 207 spine layout — command staff on left/right of the center spine. */
export const ICS_COMMAND_STAFF_SPINE_LEFT = [
  'Public Information Officer',
  'Legal Officer',
] as const

export const ICS_COMMAND_STAFF_SPINE_RIGHT = [
  'Liaison Officer',
  'Safety Officer',
] as const

export function partitionCommandStaffForSpine(positions: string[]): {
  left: string[]
  right: string[]
} {
  const visible = new Set(positions)
  const left: string[] = ICS_COMMAND_STAFF_SPINE_LEFT.filter((position) =>
    visible.has(position)
  )
  const right: string[] = ICS_COMMAND_STAFF_SPINE_RIGHT.filter((position) =>
    visible.has(position)
  )
  for (const position of positions) {
    if (
      !(ICS_COMMAND_STAFF_SPINE_LEFT as readonly string[]).includes(position) &&
      !(ICS_COMMAND_STAFF_SPINE_RIGHT as readonly string[]).includes(position)
    ) {
      right.push(position)
    }
  }
  return { left, right }
}

export const ICS_ORG_CHART_COMMAND_STAFF_BRANCH: Extract<OrgChartNode, { kind: 'group' }> = {
  kind: 'group',
  label: 'Command Staff',
  type: 'Command Staff',
  color: 'neutral',
  children: ICS_ORG_CHART_COMMAND_STAFF_POSITIONS.map((position) => ({
    kind: 'position' as const,
    position,
    color: 'neutral' as const,
  })),
}

const PLANNING_UNIT_STACK: Extract<OrgChartNode, { kind: 'stack' }> = {
  kind: 'stack',
  color: 'blue',
  children: [
    { kind: 'position', position: 'Resources Unit Leader', color: 'blue' },
    { kind: 'position', position: 'Situation Unit Leader', color: 'blue' },
    { kind: 'position', position: 'Documentation Unit Leader', color: 'blue' },
    { kind: 'position', position: 'Demobilization Unit Leader', color: 'blue' },
    { kind: 'position', position: 'Technical Specialist', color: 'yellow' },
  ],
}

const FINANCE_UNIT_STACK: Extract<OrgChartNode, { kind: 'stack' }> = {
  kind: 'stack',
  color: 'green',
  children: [
    { kind: 'position', position: 'Compensation Unit Leader', color: 'green' },
    { kind: 'position', position: 'Cost Unit Leader', color: 'green' },
    { kind: 'position', position: 'Procurement Unit Leader', color: 'green' },
    { kind: 'position', position: 'Time Unit Leader', color: 'green' },
  ],
}

const INTEL_UNIT_STACK: Extract<OrgChartNode, { kind: 'stack' }> = {
  kind: 'stack',
  color: 'tan',
  children: [
    { kind: 'position', position: 'Intelligence Group Supervisor', color: 'tan' },
    {
      kind: 'position',
      position: 'Investigative Operations Group Supervisor',
      color: 'tan',
    },
  ],
}

const LOGISTICS_BRANCH_FORK: Extract<OrgChartNode, { kind: 'fork' }> = {
  kind: 'fork',
  color: 'orange',
  children: [
    {
      kind: 'position',
      position: 'Service Branch Director',
      color: 'orange',
      children: [
        {
          kind: 'stack',
          color: 'orange',
          children: [
            { kind: 'position', position: 'Communications Unit Leader', color: 'orange' },
            { kind: 'position', position: 'Food Unit Leader', color: 'orange' },
            { kind: 'position', position: 'Medical Unit Leader', color: 'orange' },
          ],
        },
      ],
    },
    {
      kind: 'position',
      position: 'Support Branch Director',
      color: 'orange',
      children: [
        {
          kind: 'stack',
          color: 'orange',
          children: [
            { kind: 'position', position: 'Facilities Unit Leader', color: 'orange' },
            { kind: 'position', position: 'Ground Support Unit Leader', color: 'orange' },
            { kind: 'position', position: 'Supply Unit Leader', color: 'orange' },
            { kind: 'position', position: 'Vessel Support Unit Leader', color: 'orange' },
          ],
        },
      ],
    },
  ],
}

export const ICS_ORG_CHART_SECTION_BRANCHES: Extract<OrgChartNode, { kind: 'group' }>[] = [
  {
    kind: 'group',
    label: 'Operations Section',
    type: 'Section',
    color: 'red',
    children: [
      {
        kind: 'position',
        position: 'Operations Section Chief',
        color: 'red',
        children: [{ kind: 'position', position: 'Staging Area Manager', color: 'red' }],
      },
    ],
  },
  {
    kind: 'group',
    label: 'Planning Section',
    type: 'Section',
    color: 'blue',
    children: [
      {
        kind: 'position',
        position: 'Planning Section Chief',
        color: 'blue',
        children: [PLANNING_UNIT_STACK],
      },
    ],
  },
  {
    kind: 'group',
    label: 'Logistics Section',
    type: 'Section',
    color: 'orange',
    children: [
      {
        kind: 'position',
        position: 'Logistics Section Chief',
        color: 'orange',
        children: [LOGISTICS_BRANCH_FORK],
      },
    ],
  },
  {
    kind: 'group',
    label: 'Finance Section',
    type: 'Section',
    color: 'green',
    children: [
      {
        kind: 'position',
        position: 'Finance Section Chief',
        color: 'green',
        children: [FINANCE_UNIT_STACK],
      },
    ],
  },
  {
    kind: 'group',
    label: 'Intel/Investigations Section',
    type: 'Section',
    color: 'tan',
    children: [
      {
        kind: 'position',
        position: 'Intel/Investigations Section Chief',
        color: 'tan',
        children: [INTEL_UNIT_STACK],
      },
    ],
  },
]

export const ICS_ORG_CHART_BRANCHES: Extract<OrgChartNode, { kind: 'group' }>[] = [
  ...ICS_ORG_CHART_SECTION_BRANCHES,
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
]

export function collectOrgChartPositions(nodes: OrgChartNode[]): string[] {
  const positions: string[] = []
  for (const node of nodes) {
    if (node.kind === 'position') {
      positions.push(node.position)
      if (node.children) {
        positions.push(...collectOrgChartPositions(node.children))
      }
    } else if (node.kind === 'group' || node.kind === 'stack' || node.kind === 'fork') {
      positions.push(...collectOrgChartPositions(node.children))
    }
  }
  return positions
}

export const ICS_ORG_CHART_POSITIONS: readonly string[] = [
  ICS_ORG_CHART_ROOT_POSITION,
  ...collectOrgChartPositions(ICS_ORG_CHART_BRANCHES),
]

let standardPositionParentMapCache: Map<string, string> | null = null

function buildStandardPositionParentMap(): Map<string, string> {
  const map = new Map<string, string>()

  function walk(nodes: OrgChartNode[], parent: string | null) {
    for (const node of nodes) {
      if (node.kind === 'position') {
        if (parent) {
          map.set(node.position, parent)
        }
        if (node.children?.length) {
          walk(node.children, node.position)
        }
      } else if (node.kind === 'group' || node.kind === 'stack' || node.kind === 'fork') {
        walk(node.children, parent)
      }
    }
  }

  walk(ICS_ORG_CHART_COMMAND_STAFF_BRANCH.children, ICS_ORG_CHART_ROOT_POSITION)
  for (const branch of ICS_ORG_CHART_SECTION_BRANCHES) {
    walk(branch.children, ICS_ORG_CHART_ROOT_POSITION)
  }

  return map
}

function getStandardPositionParentMap(): Map<string, string> {
  if (!standardPositionParentMapCache) {
    standardPositionParentMapCache = buildStandardPositionParentMap()
  }
  return standardPositionParentMapCache
}

export function resolveStandardPositionReportsTo(positionName: string): string | null {
  const normalized = positionName.trim().replace(/\s+/g, ' ')
  if (normalized === ICS_ORG_CHART_ROOT_POSITION) {
    return null
  }
  return getStandardPositionParentMap().get(normalized) ?? null
}

export function orgChartColorUsesLightText(color: OrgChartColor | undefined): boolean {
  switch (color) {
    case 'hwcg_ic':
    case 'hwcg_section':
    case 'hwcg_ops_branch':
    case 'hwcg_group':
      return true
    default:
      return false
  }
}

export function orgChartHwcgSecondaryTextClasses(color: OrgChartColor | undefined): string {
  return orgChartColorUsesLightText(color) ? '!text-white' : '!text-slate-900'
}

export function orgChartColorClasses(color: OrgChartColor | undefined): string {
  switch (color) {
    case 'red':
      return 'border-red-500/70 bg-red-500/5'
    case 'blue':
      return 'border-blue-500/70 bg-blue-500/5'
    case 'orange':
      return 'border-orange-500/70 bg-orange-500/5'
    case 'green':
      return 'border-green-600/70 bg-green-600/5'
    case 'neutral':
      return 'border-slate-400/70 bg-slate-500/5'
    case 'tan':
      return 'border-amber-700/60 bg-amber-100/30'
    case 'yellow':
      return 'border-yellow-500/70 bg-yellow-500/5'
    case 'hwcg_ic':
      return 'border-slate-900 bg-slate-900 text-white'
    case 'hwcg_section':
      return 'border-blue-900 bg-blue-900 text-white'
    case 'hwcg_ops_branch':
      return 'border-blue-800 bg-blue-800 text-white'
    case 'hwcg_group':
      return 'border-blue-600 bg-blue-600 text-white'
    case 'hwcg_task_force':
      return 'border-blue-400 bg-blue-300 text-slate-900'
    case 'hwcg_unit':
      return 'border-blue-500 bg-white text-slate-900'
    case 'hwcg_advisory':
      return 'border-dashed border-slate-400 bg-white text-slate-900'
    default:
      return 'border-primary/50 bg-primary/5'
  }
}
