import { isPositionWithinOrBelowOperationsSectionChief } from '@/features/roster/operations-work-assignment-scope'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  formatPositionTypeLabel,
  inferDefaultPositionType,
  parseWorkspacePositionType,
  type WorkspacePositionType,
} from '@/features/roster/workspace-position-type'

export type WorkspacePositionSettingsRow = {
  allowWorkAssignment: boolean
  positionType?: WorkspacePositionType | null
  customTypeLabel?: string | null
}

export type WorkspacePositionSettingsMap = Record<string, WorkspacePositionSettingsRow>

export function defaultAllowWorkAssignment(
  positionName: string,
  catalog: WorkspacePositionCatalog,
  options: { reportsTo?: string | null } = {}
): boolean {
  return isPositionWithinOrBelowOperationsSectionChief(positionName, catalog, options)
}

export function resolveAllowWorkAssignment(
  positionName: string,
  settings: WorkspacePositionSettingsMap,
  catalog: WorkspacePositionCatalog
): boolean {
  const stored = settings[positionName]
  if (stored !== undefined) {
    return stored.allowWorkAssignment
  }
  return defaultAllowWorkAssignment(positionName, catalog)
}

export function resolvePositionType(
  positionName: string,
  settings: WorkspacePositionSettingsMap,
  catalog: WorkspacePositionCatalog
): {
  positionType: WorkspacePositionType | null
  customTypeLabel: string | null
  displayLabel: string | null
} {
  const stored = settings[positionName]
  const positionType = stored?.positionType ?? inferDefaultPositionType(positionName, catalog)
  const customTypeLabel = stored?.customTypeLabel ?? null

  return {
    positionType,
    customTypeLabel,
    displayLabel: formatPositionTypeLabel(positionType, customTypeLabel),
  }
}

export function settingsFromRows(
  rows: Array<{
    position_name: string
    allow_work_assignment: boolean
    position_type?: string | null
    custom_type_label?: string | null
  }>
): WorkspacePositionSettingsMap {
  const map: WorkspacePositionSettingsMap = {}
  for (const row of rows) {
    map[row.position_name] = {
      allowWorkAssignment: row.allow_work_assignment,
      positionType: row.position_type
        ? parseWorkspacePositionType(row.position_type)
        : null,
      customTypeLabel: row.custom_type_label ?? null,
    }
  }
  return map
}

export function isPositionEligibleForWorkAssignment(
  positionName: string,
  catalog: WorkspacePositionCatalog,
  settings: WorkspacePositionSettingsMap
): boolean {
  return resolveAllowWorkAssignment(positionName, settings, catalog)
}
