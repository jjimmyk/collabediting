import type { ReactNode } from 'react'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type {
  PositionRosterInlineInviteProps,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import type { PositionRosterUnifiedAssignmentSectionsProps } from '@/features/roster/PositionRosterAssignmentSections'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'

export type OrgChartWideRenderProps = {
  layoutMode: RosterPanelLayoutMode
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isUpdatingOpAdvanceLabel: string | null
  showOpAdvanceLabels: boolean
  positionMetaByName: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (userId: string, position: string) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveAssetFromOrgChart?: (assetKey: string) => void
  onRemoveSingleResourceFromOrgChart?: (memberId: string) => void
  showCheckInStatus: boolean
  canEditCheckInStatus: boolean
  updatingCheckInMemberId: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  showAllowWorkAssignment: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  showPositionAssets: boolean
  assignableAssetsByPosition: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition: Record<string, ResourceListItemData[]>
  pocMembers: WorkspaceRosterMember[]
  onAssignAsset?: (assetKey: string, position: string, pointOfContactMemberId?: string) => void
  onUnassignAsset?: (assetKey: string, position: string) => void
  onScheduleAssignAsset?: (assetKey: string, position: string) => void
  onScheduleUnassignAsset?: (assetKey: string, position: string) => void
  onRemoveScheduledAssignAsset?: (assetKey: string, position: string) => void
  onRemoveScheduledUnassignAsset?: (assetKey: string, position: string) => void
  onUpdateAssetPointOfContact?: (assetKey: string, memberId: string | null) => void
  onRemovePositionFromRoster?: (position: string) => void
  removingPositionFromRoster?: string | null
  canRemovePositionFromRoster?: (entry: PositionRosterEntry) => boolean
  positionRemovalBlockedReason?: (entry: PositionRosterEntry) => string | null
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
  onOpenOrgChartAssetDetail: (assetKey: string) => void
  onOpenSingleResourceDetail: (memberId: string) => void
  competencyOptions: string[]
  canEditCompetencyFunction: boolean
  updatingCompetencyKey: string | null
  onMemberCompetencyFunctionChange?: (input: {
    memberId: string
    positionName: string
    scope:
      | 'active'
      | 'scheduled_assign'
      | 'scheduled_unassign'
      | 'scheduled_org_chart'
    value: string | null
  }) => void
  memberScheduleCompetencyByKey: Record<string, string | null>
  onAssetCompetencyFunctionChange?: PositionRosterUnifiedAssignmentSectionsProps['onAssetCompetencyFunctionChange']
  onSingleResourceCompetencyFunctionChange?: (
    memberId: string,
    value: string | null,
    scheduled: boolean
  ) => void
  orgChartTemplateSlug?: string | null
  renderLeafNode: (
    node: OrgChartNode,
    options: {
      parentColor?: OrgChartColor
      suppressChildren?: boolean
      connectorAnchorId?: string
    }
  ) => ReactNode
}
