import type { WorkspaceMemberCheckInStatus } from '@/lib/workspace-types'

export const WORKSPACE_MEMBER_CHECK_IN_STATUSES = [
  'not_arrived',
  'checked_in',
  'checked_out',
  'demobilizing',
  'demobilized',
] as const satisfies readonly WorkspaceMemberCheckInStatus[]

export const CHECK_IN_STATUS_OPTIONS: Array<{
  value: WorkspaceMemberCheckInStatus
  label: string
}> = [
  { value: 'not_arrived', label: 'Not Arrived' },
  { value: 'checked_in', label: 'Checked-In' },
  { value: 'checked_out', label: 'Checked-Out' },
  { value: 'demobilizing', label: 'Demobilizing' },
  { value: 'demobilized', label: 'Demobilized' },
]

export function isWorkspaceMemberCheckInStatus(
  value: unknown
): value is WorkspaceMemberCheckInStatus {
  return (
    typeof value === 'string' &&
    WORKSPACE_MEMBER_CHECK_IN_STATUSES.includes(value as WorkspaceMemberCheckInStatus)
  )
}

export function parseWorkspaceMemberCheckInStatus(
  value: unknown
): WorkspaceMemberCheckInStatus {
  return isWorkspaceMemberCheckInStatus(value) ? value : 'not_arrived'
}

export function formatCheckInStatusLabel(status: WorkspaceMemberCheckInStatus): string {
  return (
    CHECK_IN_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Not Arrived'
  )
}
