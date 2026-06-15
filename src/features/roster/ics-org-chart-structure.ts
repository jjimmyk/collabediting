import { WORKSPACE_ROSTER_POSITIONS } from '@/lib/ics-positions'

export type OrgChartColor = 'red' | 'blue' | 'orange' | 'green' | 'neutral'

export type OrgChartNode =
  | {
      kind: 'position'
      position: string
      color?: OrgChartColor
      children?: OrgChartNode[]
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

export const ICS_ORG_CHART_COMMAND_STAFF_BRANCH: Extract<OrgChartNode, { kind: 'group' }> = {
  kind: 'group',
  label: 'Command Staff',
  type: 'Command Staff',
  color: 'neutral',
  children: [
    { kind: 'position', position: 'Public Information Officer', color: 'neutral' },
    { kind: 'position', position: 'Safety Officer', color: 'neutral' },
    { kind: 'position', position: 'Liaison Officer', color: 'neutral' },
  ],
}

export const ICS_ORG_CHART_SECTION_BRANCHES: Extract<OrgChartNode, { kind: 'group' }>[] = [
  {
    kind: 'group',
    label: 'Operations Section',
    type: 'Section',
    color: 'red',
    children: [{ kind: 'position', position: 'Operations Section Chief', color: 'red' }],
  },
  {
    kind: 'group',
    label: 'Planning Section',
    type: 'Section',
    color: 'blue',
    children: [
      { kind: 'position', position: 'Planning Section Chief', color: 'blue' },
      { kind: 'position', position: 'Resources Unit Leader', color: 'blue' },
      { kind: 'position', position: 'Situation Unit Leader', color: 'blue' },
      { kind: 'position', position: 'Documentation Unit Leader', color: 'blue' },
      { kind: 'position', position: 'Display Unit Leader', color: 'blue' },
      { kind: 'position', position: 'Demobilization Unit Leader', color: 'blue' },
    ],
  },
  {
    kind: 'group',
    label: 'Logistics Section',
    type: 'Section',
    color: 'orange',
    children: [{ kind: 'position', position: 'Logistics Section Chief', color: 'orange' }],
  },
  {
    kind: 'group',
    label: 'Finance/Admin Section',
    type: 'Section',
    color: 'green',
    children: [{ kind: 'position', position: 'Finance/Admin Section Chief', color: 'green' }],
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
    } else {
      positions.push(...collectOrgChartPositions(node.children))
    }
  }
  return positions
}

export const ICS_ORG_CHART_POSITIONS: readonly string[] = [
  ICS_ORG_CHART_ROOT_POSITION,
  ...collectOrgChartPositions(ICS_ORG_CHART_BRANCHES),
]

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
    default:
      return 'border-primary/50 bg-primary/5'
  }
}
