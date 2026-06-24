import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { positionMatchesSectionFilters } from '@/features/roster/roster-org-chart-sections'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export type RosterTimeHorizon = OrgChartExportScope

export type RosterBooleanDisplayFilterKey = Exclude<keyof RosterDisplayFilters, 'rosterTimeHorizon'>

export type RosterDisplayFilters = {
  rosterTimeHorizon: RosterTimeHorizon
  showPositionsWithCurrentAssignees: boolean
  showPositionsWithoutCurrentAssignees: boolean
  showPositionsWithScheduledAssignees: boolean
  showPositionsWithoutScheduledAssignees: boolean
  showCurrentSingleResources: boolean
  showScheduledSingleResources: boolean
  showIncidentCommander: boolean
  showCommandStaff: boolean
  showOperationsSection: boolean
  showPlanningSection: boolean
  showLogisticsSection: boolean
  showFinanceSection: boolean
  showIntelInvestigationsSection: boolean
}

export const DEFAULT_ROSTER_DISPLAY_FILTERS: RosterDisplayFilters = {
  rosterTimeHorizon: 'current_op',
  showPositionsWithCurrentAssignees: true,
  showPositionsWithoutCurrentAssignees: true,
  showPositionsWithScheduledAssignees: true,
  showPositionsWithoutScheduledAssignees: true,
  showCurrentSingleResources: true,
  showScheduledSingleResources: true,
  showIncidentCommander: true,
  showCommandStaff: true,
  showOperationsSection: true,
  showPlanningSection: true,
  showLogisticsSection: true,
  showFinanceSection: true,
  showIntelInvestigationsSection: true,
}

export const ROSTER_DISPLAY_FILTER_LABELS: Record<
  | 'showPositionsWithCurrentAssignees'
  | 'showPositionsWithoutCurrentAssignees'
  | 'showPositionsWithScheduledAssignees'
  | 'showPositionsWithoutScheduledAssignees'
  | 'showCurrentSingleResources'
  | 'showScheduledSingleResources',
  string
> = {
  showPositionsWithCurrentAssignees: 'Positions with current assignees',
  showPositionsWithoutCurrentAssignees: 'Positions without current assignees',
  showPositionsWithScheduledAssignees: 'Positions with scheduled assignees',
  showPositionsWithoutScheduledAssignees: 'Positions without scheduled assignees',
  showCurrentSingleResources: 'Current single resources',
  showScheduledSingleResources: 'Scheduled single resources',
}

const BOOLEAN_FILTER_KEYS = (
  Object.keys(DEFAULT_ROSTER_DISPLAY_FILTERS) as (keyof RosterDisplayFilters)[]
).filter((key): key is RosterBooleanDisplayFilterKey => key !== 'rosterTimeHorizon')

export function isRosterTimeHorizonProjected(filters: RosterDisplayFilters): boolean {
  return filters.rosterTimeHorizon === 'next_op'
}

export function summarizeActiveDisplayFilters(filters: RosterDisplayFilters): {
  activeCount: number
  totalCount: number
  inactiveLabels: string[]
  isDefault: boolean
} {
  const activeBooleanCount = BOOLEAN_FILTER_KEYS.filter((key) => filters[key]).length
  const horizonActive = filters.rosterTimeHorizon === 'current_op' ? 1 : 0
  const activeCount = activeBooleanCount + horizonActive
  const totalCount = BOOLEAN_FILTER_KEYS.length + 1

  const inactiveLabels = BOOLEAN_FILTER_KEYS.filter((key) => !filters[key])
    .map((key) => ROSTER_DISPLAY_FILTER_LABELS[key as keyof typeof ROSTER_DISPLAY_FILTER_LABELS])
    .filter(Boolean)

  if (filters.rosterTimeHorizon === 'next_op') {
    inactiveLabels.unshift('Next operational period projection')
  }

  return {
    activeCount,
    totalCount,
    inactiveLabels,
    isDefault: filters.rosterTimeHorizon === 'current_op' && activeBooleanCount === BOOLEAN_FILTER_KEYS.length,
  }
}

export function positionMatchesCurrentAssigneeFilters(
  entry: PositionRosterEntry,
  filters: RosterDisplayFilters
): boolean {
  const hasCurrent = entry.members.length > 0
  return (
    (filters.showPositionsWithCurrentAssignees && hasCurrent) ||
    (filters.showPositionsWithoutCurrentAssignees && !hasCurrent)
  )
}

export function positionMatchesScheduledAssigneeFilters(
  entry: PositionRosterEntry,
  filters: RosterDisplayFilters
): boolean {
  if (isRosterTimeHorizonProjected(filters)) {
    return true
  }
  const hasScheduled = entry.scheduledAssignees.length > 0
  return (
    (filters.showPositionsWithScheduledAssignees && hasScheduled) ||
    (filters.showPositionsWithoutScheduledAssignees && !hasScheduled)
  )
}

export function positionMatchesRosterDisplayFilters(
  entry: PositionRosterEntry,
  filters: RosterDisplayFilters,
  catalog: WorkspacePositionCatalog
): boolean {
  return (
    positionMatchesCurrentAssigneeFilters(entry, filters) &&
    positionMatchesScheduledAssigneeFilters(entry, filters) &&
    positionMatchesSectionFilters(entry.position, filters, catalog)
  )
}

export function resolveVisibleRosterPositions(
  entries: PositionRosterEntry[],
  filters: RosterDisplayFilters,
  catalog: WorkspacePositionCatalog
): Set<string> {
  return new Set(
    entries
      .filter((entry) => positionMatchesRosterDisplayFilters(entry, filters, catalog))
      .map((entry) => entry.position)
  )
}

export function singleResourceNodeVisible(
  scheduled: boolean | undefined,
  filters: RosterDisplayFilters,
  isProjected = false
): boolean {
  if (isProjected) {
    return filters.showCurrentSingleResources
  }
  return scheduled ? filters.showScheduledSingleResources : filters.showCurrentSingleResources
}

export function resolveEffectiveRosterTimeHorizon(
  filters: RosterDisplayFilters,
  operationalPeriodsEnabled: boolean,
  isViewingHistoricalRoster: boolean
): RosterTimeHorizon {
  if (!operationalPeriodsEnabled || isViewingHistoricalRoster) {
    return 'current_op'
  }
  return filters.rosterTimeHorizon
}
