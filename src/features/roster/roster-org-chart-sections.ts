import {
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
  collectOrgChartPositions,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'
import type {
  RosterBooleanDisplayFilterKey,
  RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export type RosterOrgChartSectionKey =
  | 'incidentCommander'
  | 'commandStaff'
  | 'operations'
  | 'planning'
  | 'logistics'
  | 'finance'
  | 'intelInvestigations'

export const ROSTER_ORG_CHART_SECTION_LABELS: Record<RosterOrgChartSectionKey, string> = {
  incidentCommander: 'Incident Commander',
  commandStaff: 'Command Staff',
  operations: 'Operations Section',
  planning: 'Planning Section',
  logistics: 'Logistics Section',
  finance: 'Finance Section',
  intelInvestigations: 'Intel/Investigations Section',
}

export const ROSTER_ORG_CHART_SECTION_FILTER_KEYS: Record<
  RosterOrgChartSectionKey,
  RosterBooleanDisplayFilterKey
> = {
  incidentCommander: 'showIncidentCommander',
  commandStaff: 'showCommandStaff',
  operations: 'showOperationsSection',
  planning: 'showPlanningSection',
  logistics: 'showLogisticsSection',
  finance: 'showFinanceSection',
  intelInvestigations: 'showIntelInvestigationsSection',
}

const SECTION_BRANCH_LABEL_TO_KEY: Record<string, RosterOrgChartSectionKey> = {
  'Operations Section': 'operations',
  'Planning Section': 'planning',
  'Logistics Section': 'logistics',
  'Finance Section': 'finance',
  'Intel/Investigations Section': 'intelInvestigations',
}

const STANDARD_POSITION_SECTION_BY_NAME = buildStandardPositionSectionMap()

function buildStandardPositionSectionMap(): Map<string, RosterOrgChartSectionKey> {
  const map = new Map<string, RosterOrgChartSectionKey>()
  map.set(ICS_ORG_CHART_ROOT_POSITION, 'incidentCommander')

  for (const position of ICS_ORG_CHART_COMMAND_STAFF_POSITIONS) {
    map.set(position, 'commandStaff')
  }

  for (const branch of ICS_ORG_CHART_SECTION_BRANCHES) {
    const sectionKey = SECTION_BRANCH_LABEL_TO_KEY[branch.label]
    if (!sectionKey) continue
    for (const position of collectOrgChartPositions(branch.children)) {
      map.set(position, sectionKey)
    }
  }

  return map
}

export function orgChartBranchSectionKey(
  branch: Extract<OrgChartNode, { kind: 'group' }>
): RosterOrgChartSectionKey | null {
  return SECTION_BRANCH_LABEL_TO_KEY[branch.label] ?? null
}

export function resolvePositionOrgChartSection(
  positionName: string,
  catalog: WorkspacePositionCatalog,
  visited: Set<string> = new Set()
): RosterOrgChartSectionKey | null {
  if (visited.has(positionName)) return null
  visited.add(positionName)

  const direct = STANDARD_POSITION_SECTION_BY_NAME.get(positionName)
  if (direct) return direct

  const meta = catalog.positionMetaByName[positionName]
  if (!meta?.reportsTo) return null

  return resolvePositionOrgChartSection(meta.reportsTo, catalog, visited)
}

export function orgChartSectionFilterEnabled(
  section: RosterOrgChartSectionKey,
  filters: RosterDisplayFilters
): boolean {
  return filters[ROSTER_ORG_CHART_SECTION_FILTER_KEYS[section]]
}

export function positionMatchesSectionFilters(
  positionName: string,
  filters: RosterDisplayFilters,
  catalog: WorkspacePositionCatalog
): boolean {
  const section = resolvePositionOrgChartSection(positionName, catalog)
  if (!section) return true
  return orgChartSectionFilterEnabled(section, filters)
}
