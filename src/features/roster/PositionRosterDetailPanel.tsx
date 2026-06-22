import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { PositionOpAdvanceLabelSelect } from '@/features/roster/PositionOpAdvanceLabelSelect'
import type { PositionRosterInlineInviteProps, RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import {
  PositionPermissionsSection,
  PositionPropertiesSection,
} from '@/features/roster/PositionRosterPropertySections'
import type { PositionRosterAssetHandlers } from '@/features/roster/PositionRosterAssetSections'
import { PositionRosterUnifiedAssignmentSections } from '@/features/roster/PositionRosterAssignmentSections'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'

type PositionRosterDetailPanelProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  scheduleAssignable: WorkspaceRosterMember[]
  scheduleUnassignable: WorkspaceRosterMember[]
  canManageRoster: boolean
  isPermissionBusy: boolean
  isAssignBusy: boolean
  glassItemBorderClasses?: string
  showOpAdvanceLabels?: boolean
  positionMeta?: WorkspacePositionMeta
  isUpdatingOpAdvanceLabel?: boolean
  onOpAdvanceLabelChange?: (label: PositionOpAdvanceLabel) => void
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onPositionTypeChange?: (
    position: string,
    positionType: import('@/features/roster/workspace-position-type').WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (userId: string, position: string) => void
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  showPositionAssets?: boolean
  assignableAssets?: ResourceListItemData[]
  scheduleAssignableAssets?: ResourceListItemData[]
  scheduleUnassignableAssets?: ResourceListItemData[]
  pocMembers?: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
  onFocusAsset?: (asset: ResourceListItemData) => void
  canRemoveFromRoster?: boolean
  removalBlockedReason?: string | null
  isRemovingFromRoster?: boolean
  onRemoveFromRoster?: () => void
} & Partial<PositionRosterAssetHandlers>

export function PositionRosterDetailPanel({
  entry,
  assignable,
  scheduleAssignable,
  scheduleUnassignable,
  canManageRoster,
  isPermissionBusy,
  isAssignBusy,
  glassItemBorderClasses = '',
  showOpAdvanceLabels = false,
  positionMeta,
  isUpdatingOpAdvanceLabel = false,
  onOpAdvanceLabelChange,
  onToggleEditIcs201,
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
  onPositionTypeChange,
  onAssignExistingMember,
  onSearchOrgMembers,
  onAssignOrgMember,
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
  inlinePositionInvite,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  showPositionAssets = false,
  assignableAssets = [],
  scheduleAssignableAssets = [],
  scheduleUnassignableAssets = [],
  pocMembers = [],
  assetsByKey = {},
  onFocusAsset,
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
  canRemoveFromRoster = false,
  removalBlockedReason = null,
  isRemovingFromRoster = false,
  onRemoveFromRoster,
}: PositionRosterDetailPanelProps) {
  const assetsHandlersReady = Boolean(
    onAssignAsset &&
      onUnassignAsset &&
      onScheduleAssignAsset &&
      onScheduleUnassignAsset &&
      onRemoveScheduledAssignAsset &&
      onRemoveScheduledUnassignAsset &&
      onUpdateAssetPointOfContact
  )

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{entry.position}</p>
        <PositionLifecycleBadges entry={entry} />
        <p className="text-xs text-muted-foreground">
          {canManageRoster
            ? 'Manage assignees, assets, and permissions for this position.'
            : 'View assignees, assets, and permissions for this position.'}
        </p>
        {entry.isPlanned ? (
          <p className="text-[11px] text-muted-foreground">
            This position activates on the next operational period. Schedule users and assets for
            next OP instead of assigning them now.
          </p>
        ) : entry.opAdvanceLabel === 'retire_on_op_advance' ? (
          <p className="text-[11px] text-muted-foreground">
            This position retires on the next operational period. Member schedules are not
            available.
          </p>
        ) : null}
      </div>

      <PositionPermissionsSection
        entry={entry}
        canManageRoster={canManageRoster}
        isBusy={isPermissionBusy}
        onToggleEditIcs201={onToggleEditIcs201}
      />

      <PositionPropertiesSection
        entry={entry}
        canManageRoster={canManageRoster}
        isBusy={isPermissionBusy}
        showAllowWorkAssignment={showAllowWorkAssignment}
        onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
        onPositionTypeChange={onPositionTypeChange}
      />

      {showOpAdvanceLabels && onOpAdvanceLabelChange ? (
        <div className="space-y-1.5 rounded-md border bg-muted/20 px-2.5 py-2">
          <Label htmlFor={`op-advance-label-panel-${entry.position}`} className="text-xs">
            Next OP period
          </Label>
          <PositionOpAdvanceLabelSelect
            positionName={entry.position}
            meta={positionMeta}
            value={entry.opAdvanceLabel ?? null}
            disabled={!canManageRoster || isUpdatingOpAdvanceLabel}
            onChange={onOpAdvanceLabelChange}
          />
        </div>
      ) : null}

      <PositionRosterUnifiedAssignmentSections
        entry={entry}
        assignable={assignable}
        scheduleAssignable={scheduleAssignable}
        scheduleUnassignable={scheduleUnassignable}
        assignableAssets={assignableAssets}
        scheduleAssignableAssets={scheduleAssignableAssets}
        scheduleUnassignableAssets={scheduleUnassignableAssets}
        pocMembers={pocMembers}
        assetsByKey={assetsByKey}
        glassItemBorderClasses={glassItemBorderClasses}
        onFocusAsset={onFocusAsset}
        canManageRoster={canManageRoster}
        isBusy={isAssignBusy}
        showPositionAssets={showPositionAssets && assetsHandlersReady}
        showCheckInStatus={showCheckInStatus}
        canEditCheckInStatus={canEditCheckInStatus}
        updatingCheckInMemberId={updatingCheckInMemberId}
        onCheckInStatusChange={onCheckInStatusChange}
        onAssignExistingMember={onAssignExistingMember}
        onSearchOrgMembers={onSearchOrgMembers}
        onAssignOrgMember={onAssignOrgMember}
        onScheduleAssignMember={onScheduleAssignMember}
        onScheduleUnassignMember={onScheduleUnassignMember}
        onRemoveScheduledAssign={onRemoveScheduledAssign}
        onRemoveScheduledUnassign={onRemoveScheduledUnassign}
        onInviteToPosition={onInviteToPosition}
        onUnassignMember={onUnassignMember}
        inlinePositionInvite={inlinePositionInvite}
        onAssignAsset={onAssignAsset ?? (() => {})}
        onUnassignAsset={onUnassignAsset ?? (() => {})}
        onScheduleAssignAsset={onScheduleAssignAsset ?? (() => {})}
        onScheduleUnassignAsset={onScheduleUnassignAsset ?? (() => {})}
        onRemoveScheduledAssignAsset={onRemoveScheduledAssignAsset ?? (() => {})}
        onRemoveScheduledUnassignAsset={onRemoveScheduledUnassignAsset ?? (() => {})}
        onUpdateAssetPointOfContact={onUpdateAssetPointOfContact ?? (() => {})}
      />

      {canManageRoster && onRemoveFromRoster ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
          <p className="text-xs font-medium text-destructive">Remove from roster</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {canRemoveFromRoster
              ? 'This position has no current or scheduled assignees and can be removed from the roster.'
              : (removalBlockedReason ??
                'This position cannot be removed while it has assignees or dependencies.')}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 h-7 gap-1 px-2 text-[11px] text-destructive hover:text-destructive"
            disabled={!canRemoveFromRoster || isRemovingFromRoster}
            onClick={() => {
              if (
                window.confirm(
                  `Remove "${entry.position}" from this roster? This cannot be undone without re-adding the position.`
                )
              ) {
                onRemoveFromRoster()
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isRemovingFromRoster ? 'Removing…' : 'Remove from roster'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
