import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

export type HaveLinkPickMode = {
  columnLabel: string
  selectedRefs: Set<string>
  linkedToThisCellRefs: Set<string>
  linkedRefLocations: Map<string, Ics215HaveLinkLocation>
  activeHaveCell: { rowId: number; columnId: string }
  onToggleRef: (ref: string) => void
  onTogglePositionRefs: (refs: string[], select: boolean) => void
  onUnlinkFromOtherCell?: (location: Ics215HaveLinkLocation, ref: string) => void
  highlightedHaveRef: string | null
  onHighlightRef: (ref: string | null) => void
  optionByValue: Map<string, WorkAssignmentTargetOption>
  rosterActions?: HaveLinkRosterActions
  positionRosterEntries: PositionRosterEntry[]
  roster: WorkspaceRosterMember[]
  assetsByKey: Record<string, ResourceListItemData>
  showPositionAssets: boolean
}
