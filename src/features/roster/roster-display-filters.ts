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
