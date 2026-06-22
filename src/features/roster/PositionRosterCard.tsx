import { useState } from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemDescription, ItemTitle } from '@/components/ui/item'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type {
  PositionRosterInlineInviteProps,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { PositionRosterDetailPanel } from '@/features/roster/PositionRosterDetailPanel'
import {
  PositionPermissionsSection,
  PositionPropertiesSection,
} from '@/features/roster/PositionRosterPropertySections'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterAssetHandlers } from '@/features/roster/PositionRosterAssetSections'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import {
  ORG_CHART_POSITION_CARD_MAX_WIDTH,
  ORG_CHART_POSITION_CARD_MIN_WIDTH,
} from '@/features/roster/org-chart-layout-tokens'
import {
  orgChartColorClasses,
  type OrgChartColor,
} from '@/features/roster/ics-org-chart-structure'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'

type PositionRosterCardProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  scheduleAssignable: WorkspaceRosterMember[]
  scheduleUnassignable: WorkspaceRosterMember[]
  canManageRoster: boolean
  glassItemBorderClasses: string
  isPermissionBusy: boolean
  isAssignBusy: boolean
  variant?: 'grid' | 'org'
  color?: OrgChartColor
  layoutMode?: RosterPanelLayoutMode
  showOpAdvanceLabels?: boolean
  positionMeta?: WorkspacePositionMeta
  isUpdatingOpAdvanceLabel?: boolean
  onOpAdvanceLabelChange?: (label: PositionOpAdvanceLabel) => void
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
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
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  updatingCompetencyKey?: string | null
  memberScheduleCompetencyByKey?: Record<string, string | null>
  onMemberCompetencyFunctionChange?: import('@/features/roster/PositionRosterAssignmentSections').PositionRosterUnifiedAssignmentSectionsProps['onMemberCompetencyFunctionChange']
  onAssetCompetencyFunctionChange?: import('@/features/roster/PositionRosterAssignmentSections').PositionRosterUnifiedAssignmentSectionsProps['onAssetCompetencyFunctionChange']
  showPositionAssets?: boolean
  assignableAssets?: ResourceListItemData[]
  scheduleAssignableAssets?: ResourceListItemData[]
  scheduleUnassignableAssets?: ResourceListItemData[]
  pocMembers?: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveScheduledUnassignAsset?: (assetKey: string, position: string) => void
  onUpdateAssetPointOfContact?: (assetKey: string, memberId: string | null) => void
  canRemoveFromRoster?: boolean
  removalBlockedReason?: string | null
  isRemovingFromRoster?: boolean
  onRemoveFromRoster?: () => void
} & Partial<PositionRosterAssetHandlers>

export function PositionRosterCard({
  entry,
  assignable,
  scheduleAssignable,
  scheduleUnassignable,
  canManageRoster,
  glassItemBorderClasses,
  isPermissionBusy,
  isAssignBusy,
  variant = 'grid',
  color,
  layoutMode = 'wide',
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
  workspaceRosterMembers = [],
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
  competencyOptions = [],
  canEditCompetencyFunction = false,
  updatingCompetencyKey = null,
  memberScheduleCompetencyByKey = {},
  onMemberCompetencyFunctionChange,
  onAssetCompetencyFunctionChange,
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
}: PositionRosterCardProps) {
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const leaderEmail = entry.members[0]?.email ?? null
  const isOrg = variant === 'org'

  const panelProps = {
    entry,
    assignable,
    scheduleAssignable,
    scheduleUnassignable,
    canManageRoster,
    isPermissionBusy,
    isAssignBusy,
    onToggleEditIcs201,
    showAllowWorkAssignment,
    onToggleAllowWorkAssignment,
    onPositionTypeChange,
    onAssignExistingMember,
    onSearchOrgMembers,
    onAssignOrgMember,
    workspaceRosterMembers,
    onScheduleAssignMember,
    onScheduleUnassignMember,
    onRemoveScheduledAssign,
    onRemoveScheduledUnassign,
    onInviteToPosition,
    onUnassignMember,
    inlinePositionInvite,
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
    memberScheduleCompetencyByKey,
    onMemberCompetencyFunctionChange,
    onAssetCompetencyFunctionChange,
    showPositionAssets,
    assignableAssets,
    scheduleAssignableAssets,
    scheduleUnassignableAssets,
    pocMembers,
    assetsByKey,
    onFocusAsset,
    onAssignAsset,
    onUnassignAsset,
    onScheduleAssignAsset,
    onScheduleUnassignAsset,
    onRemoveScheduledAssignAsset,
    onRemoveScheduledUnassignAsset,
    onUpdateAssetPointOfContact,
  }

  if (isOrg) {
    return (
      <>
        <button
          type="button"
          aria-label={`Manage ${entry.position}`}
          aria-haspopup="dialog"
          aria-expanded={orgModalOpen}
          onClick={() => setOrgModalOpen(true)}
          className={cn(
            'flex min-w-0 flex-col items-stretch rounded-lg border p-0 text-left shadow-sm outline-none transition',
            'hover:ring-2 hover:ring-ring/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'w-full max-w-full min-w-0 overflow-hidden',
            layoutMode === 'wide'
              ? cn(ORG_CHART_POSITION_CARD_MIN_WIDTH, ORG_CHART_POSITION_CARD_MAX_WIDTH)
              : 'min-w-0',
            orgChartColorClasses(color)
          )}
        >
          <div className="space-y-2 overflow-hidden px-2 py-2">
            <div className="space-y-1">
              <ItemTitle className="text-xs leading-snug">{entry.position}</ItemTitle>
              <PositionLifecycleBadges entry={entry} size="org" />
              <ItemDescription className="text-[10px]">
                {entry.members.length === 0
                  ? '0 assigned'
                  : `${entry.members.length} assigned`}
              </ItemDescription>
              {leaderEmail ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  Leader: {leaderEmail}
                </p>
              ) : null}
              {entry.positionTypeLabel ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  Type: {entry.positionTypeLabel}
                </p>
              ) : null}
            </div>
          </div>
        </button>
        <Dialog open={orgModalOpen} onOpenChange={setOrgModalOpen}>
          <DialogContent className="!w-[56rem] !max-w-[min(56rem,calc(100%-2rem))] sm:!max-w-[56rem] max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">{entry.position}</DialogTitle>
            <PositionRosterDetailPanel
              {...panelProps}
              glassItemBorderClasses={glassItemBorderClasses}
              showOpAdvanceLabels={showOpAdvanceLabels}
              positionMeta={positionMeta}
              isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel}
              onOpAdvanceLabelChange={onOpAdvanceLabelChange}
              canRemoveFromRoster={canRemoveFromRoster}
              removalBlockedReason={removalBlockedReason}
              isRemovingFromRoster={isRemovingFromRoster}
              onRemoveFromRoster={onRemoveFromRoster}
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const cardBody = (
    <div className="space-y-3 px-3 py-3">
      <div className="space-y-1">
        <ItemTitle className="text-sm leading-snug">{entry.position}</ItemTitle>
        <ItemDescription>
          {entry.members.length === 0
            ? '0 assigned'
            : `${entry.members.length} assigned`}
        </ItemDescription>
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

      <div className="space-y-1.5">
        {entry.members.length === 0 ? (
          <p className="rounded-md border border-dashed px-2 py-3 text-center text-[11px] text-muted-foreground">
            Assign a roster member to this position.
          </p>
        ) : (
          entry.members.map((member) => (
            <div
              key={`${entry.position}-${member.id}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{member.email}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'outline'}
                    className="h-4 px-1.5 text-[9px]"
                  >
                    {member.status === 'active' ? 'Active' : 'Invited'}
                  </Badge>
                </div>
              </div>
              {canManageRoster && entry.memberSchedulePolicy.allowActiveAssignment && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${member.email} from ${entry.position}`}
                  disabled={isAssignBusy}
                  onClick={() => onUnassignMember(member.id, entry.position)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {canManageRoster && (
        <div className="space-y-1">
          {entry.memberSchedulePolicy.allowActiveAssignment ? (
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 w-full min-w-0 gap-1 px-1.5 text-xs leading-tight"
              disabled={isAssignBusy}
              onClick={() => onInviteToPosition(entry.position, 'assign_now')}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Add new user</span>
            </Button>
          ) : null}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 w-full min-w-0 gap-1 px-1.5 text-xs leading-tight"
                disabled={
                  isAssignBusy ||
                  (assignable.length === 0 &&
                    scheduleAssignable.length === 0 &&
                    scheduleUnassignable.length === 0 &&
                    !entry.memberSchedulePolicy.allowScheduleAssign &&
                    !entry.memberSchedulePolicy.allowScheduleUnassign)
                }
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Manage members</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              collisionPadding={12}
              className="w-72 max-w-[calc(100vw-2rem)] p-3"
            >
              <PositionRosterDetailPanel {...panelProps} glassItemBorderClasses={glassItemBorderClasses} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}>
      {cardBody}
    </Item>
  )
}
