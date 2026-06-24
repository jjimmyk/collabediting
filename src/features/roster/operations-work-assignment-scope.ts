import {
  ICS_ORG_CHART_ROOT_POSITION,
  resolveStandardPositionReportsTo,
} from '@/features/roster/ics-org-chart-structure'
import {
  normalizePositionName,
  resolvePositionReportsTo,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export const OPERATIONS_SECTION_CHIEF_POSITION = 'Operations Section Chief' as const

export function isPositionWithinOrBelowOperationsSectionChief(
  positionName: string,
  catalog: WorkspacePositionCatalog,
  options: { reportsTo?: string | null } = {}
): boolean {
  const normalized = normalizePositionName(positionName)
  if (normalized === OPERATIONS_SECTION_CHIEF_POSITION) {
    return true
  }

  let current: string | null =
    options.reportsTo?.trim() ||
    resolvePositionReportsTo(normalized, catalog) ||
    null
  const visited = new Set<string>()

  while (current && !visited.has(current)) {
    if (current === OPERATIONS_SECTION_CHIEF_POSITION) {
      return true
    }
    if (current === ICS_ORG_CHART_ROOT_POSITION) {
      return false
    }
    visited.add(current)
    current = resolvePositionReportsTo(current, catalog)
  }

  return false
}

export function isOrgChartParentWithinOperationsSubtree(
  reportsTo: string | null | undefined,
  catalog: WorkspacePositionCatalog
): boolean {
  const parent = reportsTo?.trim()
  if (!parent) return false
  return isPositionWithinOrBelowOperationsSectionChief(parent, catalog)
}

/** Default allow-work-assignment for standard positions using the canonical org chart only. */
export function isStandardPositionWithinOperationsSubtree(positionName: string): boolean {
  const normalized = normalizePositionName(positionName)
  if (normalized === OPERATIONS_SECTION_CHIEF_POSITION) {
    return true
  }

  let current: string | null = resolveStandardPositionReportsTo(normalized)
  const visited = new Set<string>()

  while (current && !visited.has(current)) {
    if (current === OPERATIONS_SECTION_CHIEF_POSITION) {
      return true
    }
    if (current === ICS_ORG_CHART_ROOT_POSITION) {
      return false
    }
    visited.add(current)
    current = resolveStandardPositionReportsTo(current)
  }

  return false
}
