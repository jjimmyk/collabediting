import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionRosterCard } from '@/features/roster/PositionRosterCard'
import {
  rosterGridClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'

type WorkspacePositionRosterProps = {
  entries: PositionRosterEntry[]
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  layoutMode?: RosterPanelLayoutMode
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

export function WorkspacePositionRoster({
  entries,
  assignableByPosition,
  scheduleAssignableByPosition,
  scheduleUnassignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  layoutMode = 'wide',
  onToggleEditIcs201,
  onAssignExistingMember,
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
}: WorkspacePositionRosterProps) {
  return (
    <div className={rosterGridClassName(layoutMode)}>
      {entries.map((entry) => (
        <PositionRosterCard
          key={entry.position}
          entry={entry}
          assignable={assignableByPosition[entry.position] ?? []}
          scheduleAssignable={scheduleAssignableByPosition[entry.position] ?? []}
          scheduleUnassignable={scheduleUnassignableByPosition[entry.position] ?? []}
          canManageRoster={canManageRoster}
          glassItemBorderClasses={glassItemBorderClasses}
          isPermissionBusy={isUpdatingPermission === entry.position}
          isAssignBusy={isAssigningPosition === entry.position}
          variant="grid"
          layoutMode={layoutMode}
          onToggleEditIcs201={onToggleEditIcs201}
          onAssignExistingMember={onAssignExistingMember}
          onScheduleAssignMember={onScheduleAssignMember}
          onScheduleUnassignMember={onScheduleUnassignMember}
          onRemoveScheduledAssign={onRemoveScheduledAssign}
          onRemoveScheduledUnassign={onRemoveScheduledUnassign}
          onInviteToPosition={onInviteToPosition}
          onUnassignMember={onUnassignMember}
        />
      ))}
    </div>
  )
}
