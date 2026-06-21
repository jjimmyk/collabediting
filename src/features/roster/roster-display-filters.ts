import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { positionMatchesSectionFilters } from '@/features/roster/roster-org-chart-sections'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export type RosterDisplayFilters = {
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

export function summarizeActiveDisplayFilters(filters: RosterDisplayFilters): {
  activeCount: number
  totalCount: number
  inactiveLabels: string[]
  isDefault: boolean
} {
  const keys = Object.keys(DEFAULT_ROSTER_DISPLAY_FILTERS) as (keyof RosterDisplayFilters)[]
  const activeCount = keys.filter((key) => filters[key]).length
  const inactiveLabels = keys
    .filter((key) => !filters[key])
    .map((key) => {
      if (key in ROSTER_DISPLAY_FILTER_LABELS) {
        return ROSTER_DISPLAY_FILTER_LABELS[key as keyof typeof ROSTER_DISPLAY_FILTER_LABELS]
      }
      return key
    })

  return {
    activeCount,
    totalCount: keys.length,
    inactiveLabels,
    isDefault: activeCount === keys.length,
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
  filters: RosterDisplayFilters
): boolean {
  return scheduled ? filters.showScheduledSingleResources : filters.showCurrentSingleResources
}
