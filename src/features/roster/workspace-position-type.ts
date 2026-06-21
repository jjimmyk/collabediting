import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

export type WorkspacePositionType =
  | 'branch'
  | 'division'
  | 'group'
  | 'strike_team'
  | 'task_force'
  | 'custom_type'

export const WORKSPACE_POSITION_TYPES: WorkspacePositionType[] = [
  'branch',
  'division',
  'group',
  'strike_team',
  'task_force',
  'custom_type',
]

export const WORKSPACE_POSITION_TYPE_LABELS: Record<WorkspacePositionType, string> = {
  branch: 'Branch',
  division: 'Division',
  group: 'Group',
  strike_team: 'Strike Team',
  task_force: 'Task Force',
  custom_type: 'Custom Type',
}

export const DEFAULT_NEW_CUSTOM_POSITION_TYPE: WorkspacePositionType = 'group'

const DEFAULT_STANDARD_POSITION_TYPES: Record<string, WorkspacePositionType> = {
  'Incident Commander': 'branch',
  'Public Information Officer': 'group',
  'Safety Officer': 'group',
  'Liaison Officer': 'group',
  'Legal Officer': 'group',
  'Operations Section Chief': 'branch',
  'Staging Area Manager': 'group',
  'Planning Section Chief': 'branch',
  'Logistics Section Chief': 'branch',
  'Finance Section Chief': 'branch',
  'Intel/Investigations Section Chief': 'branch',
}

export function isAssignablePositionType(value: string): value is WorkspacePositionType {
  return WORKSPACE_POSITION_TYPES.includes(value as WorkspacePositionType)
}

export function inferDefaultPositionType(
  positionName: string,
  catalog: WorkspacePositionCatalog
): WorkspacePositionType | null {
  if (DEFAULT_STANDARD_POSITION_TYPES[positionName]) {
    return DEFAULT_STANDARD_POSITION_TYPES[positionName]
  }
  if (catalog.customPositionNames.has(positionName)) {
    return 'group'
  }
  if (positionName.includes('Branch')) return 'branch'
  if (positionName.includes('Division')) return 'division'
  if (positionName.endsWith(' Unit Leader')) return 'group'
  return null
}

export function formatPositionTypeLabel(
  positionType: WorkspacePositionType | null | undefined,
  customTypeLabel?: string | null
): string | null {
  if (!positionType) return null
  if (positionType === 'custom_type') {
    return customTypeLabel?.trim() || WORKSPACE_POSITION_TYPE_LABELS.custom_type
  }
  return WORKSPACE_POSITION_TYPE_LABELS[positionType]
}

export function parseWorkspacePositionType(value: string): WorkspacePositionType | null {
  return isAssignablePositionType(value) ? value : null
}

export function validatePositionTypeSelection(
  positionType: WorkspacePositionType,
  customTypeLabel: string | null | undefined
): string | null {
  if (positionType === 'custom_type' && !customTypeLabel?.trim()) {
    return 'Enter a custom type label.'
  }
  return null
}
