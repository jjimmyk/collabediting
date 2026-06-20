import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type {
  PositionRosterInlineInviteProps,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import { type PositionRosterAssetHandlers } from '@/features/roster/PositionRosterAssetSections'
import type { WorkspaceOrgChartLayout, WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import { OrgChartCanvas } from '@/features/roster/org-chart-layout/OrgChartCanvas'
import {
  OrgChartNodeRenderProvider,
  type OrgChartNodeRenderContextValue,
} from '@/features/roster/org-chart-layout/OrgChartNodeRenderContext'
import type { OrgChartPersistedLayout } from '@/features/roster/org-chart-layout/types'

type WorkspaceOrgChartRosterProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isUpdatingOpAdvanceLabel?: string | null
  workspaceLabel: string
  layoutMode?: RosterPanelLayoutMode
  showOpAdvanceLabels?: boolean
  positionMetaByName?: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
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
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  showPositionAssets?: boolean
  assignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  pocMembers?: WorkspaceRosterMember[]
  savedLayout: OrgChartPersistedLayout | null
  editMode: boolean
  readOnly?: boolean
  fitViewSignal?: number
  onDraftChange?: (layout: OrgChartPersistedLayout) => void
} & Partial<PositionRosterAssetHandlers>

export function WorkspaceOrgChartRoster({
  orgChartLayout,
  entriesByPosition,
  assetsByKey,
  rosterById,
  visiblePositions,
  assignableByPosition,
  scheduleAssignableByPosition,
  scheduleUnassignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  isUpdatingOpAdvanceLabel = null,
  workspaceLabel,
  layoutMode = 'medium',
  showOpAdvanceLabels = false,
  positionMetaByName = {},
  onToggleEditIcs201,
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
  onAssignExistingMember,
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
  inlinePositionInvite,
  onOpAdvanceLabelChange,
  onFocusAsset,
  onRemoveAssetFromOrgChart,
  onRemoveSingleResourceFromOrgChart,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  showPositionAssets = false,
  assignableAssetsByPosition = {},
  scheduleAssignableAssetsByPosition = {},
  scheduleUnassignableAssetsByPosition = {},
  pocMembers = [],
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
  savedLayout,
  editMode,
  readOnly = false,
  fitViewSignal = 0,
  onDraftChange,
}: WorkspaceOrgChartRosterProps) {
  const renderContext: OrgChartNodeRenderContextValue = {
    layoutMode,
    entriesByPosition,
    assetsByKey,
    rosterById,
    visiblePositions,
    assignableByPosition,
    scheduleAssignableByPosition,
    scheduleUnassignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    isUpdatingOpAdvanceLabel,
    showOpAdvanceLabels,
    positionMetaByName,
    onToggleEditIcs201,
    onAssignExistingMember,
    onScheduleAssignMember,
    onScheduleUnassignMember,
    onRemoveScheduledAssign,
    onRemoveScheduledUnassign,
    onInviteToPosition,
    onUnassignMember,
    inlinePositionInvite,
    onOpAdvanceLabelChange,
    onFocusAsset,
    onRemoveAssetFromOrgChart,
    onRemoveSingleResourceFromOrgChart,
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
    showAllowWorkAssignment,
    onToggleAllowWorkAssignment,
    showPositionAssets,
    assignableAssetsByPosition,
    scheduleAssignableAssetsByPosition,
    scheduleUnassignableAssetsByPosition,
    pocMembers,
    onAssignAsset,
    onUnassignAsset,
    onScheduleAssignAsset,
    onScheduleUnassignAsset,
    onRemoveScheduledAssignAsset,
    onRemoveScheduledUnassignAsset,
    onUpdateAssetPointOfContact,
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pt-px">
      <div className="space-y-1 text-center">
        <h3 className="text-sm font-semibold">{workspaceLabel} Roster</h3>
        <p className="text-xs text-muted-foreground">
          Organizational Chart — Incident Command Structure
        </p>
        {editMode ? (
          <p className="text-[11px] text-muted-foreground">
            Drag boxes to rearrange. Reporting relationships are unchanged.
          </p>
        ) : null}
      </div>

      <OrgChartNodeRenderProvider value={renderContext}>
        <OrgChartCanvas
          orgChartLayout={orgChartLayout}
          visiblePositions={visiblePositions}
          savedLayout={savedLayout}
          editMode={editMode}
          readOnly={readOnly}
          fitViewSignal={fitViewSignal}
          onDraftChange={onDraftChange}
        />
      </OrgChartNodeRenderProvider>
    </div>
  )
}
