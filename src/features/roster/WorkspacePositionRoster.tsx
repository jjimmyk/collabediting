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
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  layoutMode?: RosterPanelLayoutMode
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

export function WorkspacePositionRoster({
  entries,
  assignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  layoutMode = 'wide',
  onToggleEditIcs201,
  onAssignExistingMember,
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
          canManageRoster={canManageRoster}
          glassItemBorderClasses={glassItemBorderClasses}
          isPermissionBusy={isUpdatingPermission === entry.position}
          isAssignBusy={isAssigningPosition === entry.position}
          variant="grid"
          layoutMode={layoutMode}
          onToggleEditIcs201={onToggleEditIcs201}
          onAssignExistingMember={onAssignExistingMember}
          onInviteToPosition={onInviteToPosition}
          onUnassignMember={onUnassignMember}
        />
      ))}
    </div>
  )
}
