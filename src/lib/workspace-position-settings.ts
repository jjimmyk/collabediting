import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export type WorkspacePositionSettingsMap = Record<
  string,
  {
    allowWorkAssignment: boolean
  }
>

export function defaultAllowWorkAssignment(
  positionName: string,
  catalog: WorkspacePositionCatalog
): boolean {
  return !catalog.customPositionNames.has(positionName)
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

export function settingsFromRows(
  rows: Array<{ position_name: string; allow_work_assignment: boolean }>
): WorkspacePositionSettingsMap {
  const map: WorkspacePositionSettingsMap = {}
  for (const row of rows) {
    map[row.position_name] = { allowWorkAssignment: row.allow_work_assignment }
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
