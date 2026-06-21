import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

export type RosterDisplayFilters = {
  showPositionsWithCurrentAssignees: boolean
  showPositionsWithoutCurrentAssignees: boolean
  showPositionsWithScheduledAssignees: boolean
  showPositionsWithoutScheduledAssignees: boolean
  showCurrentSingleResources: boolean
  showScheduledSingleResources: boolean
}

export const DEFAULT_ROSTER_DISPLAY_FILTERS: RosterDisplayFilters = {
  showPositionsWithCurrentAssignees: true,
  showPositionsWithoutCurrentAssignees: true,
  showPositionsWithScheduledAssignees: true,
  showPositionsWithoutScheduledAssignees: true,
  showCurrentSingleResources: true,
  showScheduledSingleResources: true,
}

export const ROSTER_DISPLAY_FILTER_LABELS: Record<keyof RosterDisplayFilters, string> = {
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
    .map((key) => ROSTER_DISPLAY_FILTER_LABELS[key])

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
  filters: RosterDisplayFilters
): boolean {
  return (
    positionMatchesCurrentAssigneeFilters(entry, filters) &&
    positionMatchesScheduledAssigneeFilters(entry, filters)
  )
}

export function resolveVisibleRosterPositions(
  entries: PositionRosterEntry[],
  filters: RosterDisplayFilters
): Set<string> {
  return new Set(
    entries
      .filter((entry) => positionMatchesRosterDisplayFilters(entry, filters))
      .map((entry) => entry.position)
  )
}

export function singleResourceNodeVisible(
  scheduled: boolean | undefined,
  filters: RosterDisplayFilters
): boolean {
  return scheduled ? filters.showScheduledSingleResources : filters.showCurrentSingleResources
}
