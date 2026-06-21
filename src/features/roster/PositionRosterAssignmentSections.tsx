import { useState, type ReactNode } from 'react'
import { CalendarClock, Plus, Trash2, Truck, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  assignableAssetsEmptyMessage,
  assignExistingMembersEmptyMessage,
  assignNowCombinedEmptyMessage,
  scheduleAssignCombinedEmptyMessage,
  scheduleAssignMembersEmptyMessage,
  scheduleOrgChartCombinedEmptyMessage,
  scheduleUnassignAssetsEmptyMessage,
  scheduleUnassignCombinedEmptyMessage,
  scheduleUnassignMembersEmptyMessage,
  type PositionRosterInlineInviteProps,
  type RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import { PositionRosterInviteForm } from '@/features/roster/PositionRosterInviteForm'
import {
  PositionAssetPickerPopover,
  type PositionRosterAssetHandlers,
} from '@/features/roster/PositionRosterAssetSections'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'

function PositionAssignmentLifecycleSection({
  title,
  icon,
  emptyMessage,
  visible,
  children,
  actions,
}: {
  title: string
  icon?: ReactNode
  emptyMessage: string
  visible: boolean
  children: ReactNode
  actions?: ReactNode
}) {
  if (!visible) return null

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
      <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
      </p>
      {emptyMessage ? (
        <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
      {actions}
    </div>
  )
}

export function PositionMemberRow({
  member,
  badgeLabel,
  canManage,
  isBusy,
  removeLabel,
  onRemove,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
}: {
  member: WorkspaceRosterMember
  badgeLabel: string
  canManage: boolean
  isBusy: boolean
  removeLabel: string
  onRemove: () => void
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{member.email}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
            User
          </Badge>
          <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
            {badgeLabel}
          </Badge>
          {showCheckInStatus && onCheckInStatusChange ? (
            <RosterMemberCheckInStatusSelect
              memberId={member.id}
              value={member.checkInStatus}
              canEdit={canEditCheckInStatus}
              isUpdating={updatingCheckInMemberId === member.id}
              compact
              onChange={onCheckInStatusChange}
            />
          ) : null}
        </div>
      </div>
      {canManage ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={removeLabel}
          disabled={isBusy}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function MemberPickerPopover({
  label,
  members,
  disabled,
  onSelect,
}: {
  label: string
  members: WorkspaceRosterMember[]
  disabled: boolean
  onSelect: (memberId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 min-w-[6.5rem] flex-1 gap-1 px-2 text-[11px]"
          disabled={disabled || members.length === 0}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {members.map((member) => (
            <Button
              key={member.id}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start truncate text-xs"
              onClick={() => {
                onSelect(member.id)
                setOpen(false)
              }}
            >
              {member.email}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NewUserInviteControl({
  position,
  mode,
  disabled,
  expanded,
  inlinePositionInvite,
  onToggle,
  onInviteToPosition,
}: {
  position: string
  mode: RosterInviteAssignmentMode
  disabled: boolean
  expanded: boolean
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onToggle: () => void
  onInviteToPosition?: (position: string, mode: RosterInviteAssignmentMode) => void
}) {
  if (inlinePositionInvite) {
    return (
      <div className="min-w-[6.5rem] flex-1 space-y-1">
        <Button
          type="button"
          size="sm"
          variant={expanded ? 'secondary' : 'default'}
          className="h-7 w-full gap-1 px-2 text-[11px]"
          disabled={disabled}
          onClick={onToggle}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          {expanded ? 'Cancel' : 'New user'}
        </Button>
        {expanded ? (
          <PositionRosterInviteForm
            position={position}
            mode={mode}
            isSupabaseEnabled={inlinePositionInvite.isSupabaseEnabled}
            isSubmitting={inlinePositionInvite.isSubmitting}
            onCancel={onToggle}
            onSubmit={async (params) => {
              const result = await inlinePositionInvite.onSubmit(params)
              if (result === 'success') {
                onToggle()
              }
              return result
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      className="h-7 min-w-[6.5rem] flex-1 gap-1 px-2 text-[11px]"
      disabled={disabled}
      onClick={() => onInviteToPosition?.(position, mode)}
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      New user
    </Button>
  )
}

function PositionAssignmentActionBar({
  showAssetActions,
  showNewUser,
  disabled,
  assignableMembers,
  assignableAssets,
  pocMembers,
  requireAssetPoc,
  memberEmptyMessage,
  assetEmptyMessage,
  onSelectMember,
  onSelectAsset,
  position,
  inviteMode,
  expandedInviteMode,
  inlinePositionInvite,
  onToggleInvite,
  onInviteToPosition,
}: {
  showAssetActions: boolean
  showNewUser: boolean
  disabled: boolean
  assignableMembers: WorkspaceRosterMember[]
  assignableAssets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  requireAssetPoc: boolean
  memberEmptyMessage: string
  assetEmptyMessage: string
  onSelectMember: (memberId: string) => void
  onSelectAsset?: (assetKey: string, pointOfContactMemberId?: string) => void
  position: string
  inviteMode: RosterInviteAssignmentMode
  expandedInviteMode: RosterInviteAssignmentMode | null
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onToggleInvite: (mode: RosterInviteAssignmentMode) => void
  onInviteToPosition?: (position: string, mode: RosterInviteAssignmentMode) => void
}) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex flex-wrap gap-1.5">
        <MemberPickerPopover
          label="Existing user"
          members={assignableMembers}
          disabled={disabled}
          onSelect={onSelectMember}
        />
        {showNewUser ? (
          <NewUserInviteControl
            position={position}
            mode={inviteMode}
            disabled={disabled}
            expanded={expandedInviteMode === inviteMode}
            inlinePositionInvite={inlinePositionInvite}
            onToggle={() => onToggleInvite(inviteMode)}
            onInviteToPosition={onInviteToPosition}
          />
        ) : null}
        {showAssetActions && onSelectAsset ? (
          <PositionAssetPickerPopover
            label="Asset"
            assets={assignableAssets}
            pocMembers={pocMembers}
            requirePoc={requireAssetPoc}
            disabled={disabled}
            emptyMessage={assetEmptyMessage}
            compact
            onSelect={onSelectAsset}
          />
        ) : null}
      </div>
      {memberEmptyMessage ? (
        <p className="px-1 text-[11px] text-muted-foreground">{memberEmptyMessage}</p>
      ) : null}
      {showAssetActions && assignableAssets.length === 0 && assetEmptyMessage ? (
        <p className="px-1 text-[11px] text-muted-foreground">{assetEmptyMessage}</p>
      ) : null}
    </div>
  )
}

export type PositionRosterUnifiedAssignmentSectionsProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  scheduleAssignable: WorkspaceRosterMember[]
  scheduleUnassignable: WorkspaceRosterMember[]
  assignableAssets: ResourceListItemData[]
  scheduleAssignableAssets: ResourceListItemData[]
  scheduleUnassignableAssets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
  glassItemBorderClasses?: string
  onFocusAsset?: (asset: ResourceListItemData) => void
  canManageRoster: boolean
  isBusy: boolean
  showPositionAssets: boolean
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
} & PositionRosterAssetHandlers

export function PositionRosterUnifiedAssignmentSections({
  entry,
  assignable,
  scheduleAssignable,
  scheduleUnassignable,
  assignableAssets,
  scheduleAssignableAssets,
  scheduleUnassignableAssets,
  pocMembers,
  assetsByKey = {},
  glassItemBorderClasses = '',
  onFocusAsset,
  canManageRoster,
  isBusy,
  showPositionAssets,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  onAssignExistingMember,
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
  inlinePositionInvite,
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
}: PositionRosterUnifiedAssignmentSectionsProps) {
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)
  const [expandedInviteMode, setExpandedInviteMode] = useState<RosterInviteAssignmentMode | null>(
    null
  )
  const policy = entry.memberSchedulePolicy
  const canAssignNow = policy.allowActiveAssignment
  const canScheduleAssign = policy.allowScheduleAssign
  const canScheduleUnassign = policy.allowScheduleUnassign
  const assetsEnabled = showPositionAssets

  const toggleInlineInvite = (mode: RosterInviteAssignmentMode) => {
    setExpandedInviteMode((previous) => (previous === mode ? null : mode))
  }

  const memberRowCheckInProps = {
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
  }

  const assignNowEmpty = assignNowCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleAssignEmpty = scheduleAssignCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleOrgChartEmpty = scheduleOrgChartCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleUnassignEmpty = scheduleUnassignCombinedEmptyMessage(entry, assetsEnabled)

  const assignNowHasRows = entry.members.length > 0 || (assetsEnabled && entry.assets.length > 0)
  const scheduleAssignHasRows =
    entry.scheduledAssignees.length > 0 ||
    (assetsEnabled && entry.scheduledAssignAssets.length > 0)
  const scheduleOrgChartHasRows =
    entry.scheduledOrgChartMembers.length > 0 ||
    (assetsEnabled && entry.scheduledOrgChartAssets.length > 0)
  const scheduleUnassignHasRows =
    entry.scheduledUnassignees.length > 0 ||
    (assetsEnabled && entry.scheduledUnassignAssets.length > 0)

  const renderAssetListItem = (
    asset: (typeof entry.assets)[number],
    config: {
      badgeLabel: string
      secondaryBadgeLabel?: string
      showPoc: boolean
      canEditPoc: boolean
      canManageRow: boolean
      removeLabel: string
      onRemove: () => void
    }
  ) => (
    <RosterAssetResourceListItem
      key={`${config.badgeLabel}-asset-${entry.position}-${asset.assetKey}`}
      asset={asset}
      resource={assetsByKey[asset.assetKey]}
      glassItemBorderClasses={glassItemBorderClasses}
      badgeLabel={config.badgeLabel}
      secondaryBadgeLabel={config.secondaryBadgeLabel}
      showPoc={config.showPoc}
      pocMembers={pocMembers}
      canManage={config.canManageRow}
      canEditPoc={config.canEditPoc}
      isBusy={isBusy}
      removeLabel={config.removeLabel}
      onRemove={config.onRemove}
      onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
      onFocusMap={
        onFocusAsset && assetsByKey[asset.assetKey]
          ? () => onFocusAsset(assetsByKey[asset.assetKey]!)
          : undefined
      }
      open={expandedAssetKey === asset.assetKey}
      onOpenChange={(open) => setExpandedAssetKey(open ? asset.assetKey : null)}
    />
  )

  return (
    <>
      <PositionAssignmentLifecycleSection
        title="Assigned now"
        emptyMessage={assignNowHasRows ? '' : assignNowEmpty}
        visible
        actions={
          canManageRoster && canAssignNow ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser
              disabled={isBusy}
              assignableMembers={assignable}
              assignableAssets={assignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc
              memberEmptyMessage={assignExistingMembersEmptyMessage(entry, assignable.length)}
              assetEmptyMessage={assignableAssetsEmptyMessage(assetsEnabled)}
              onSelectMember={(memberId) => onAssignExistingMember(memberId, entry.position)}
              onSelectAsset={
                assetsEnabled
                  ? (assetKey, pointOfContactMemberId) =>
                      onAssignAsset(assetKey, entry.position, pointOfContactMemberId)
                  : undefined
              }
              position={entry.position}
              inviteMode="assign_now"
              expandedInviteMode={expandedInviteMode}
              inlinePositionInvite={inlinePositionInvite}
              onToggleInvite={toggleInlineInvite}
              onInviteToPosition={onInviteToPosition}
            />
          ) : null
        }
      >
        {entry.members.map((member) => (
          <PositionMemberRow
            key={`assign-now-member-${entry.position}-${member.id}`}
            member={member}
            badgeLabel={member.status === 'active' ? 'Active' : 'Invited'}
            canManage={canManageRoster && canAssignNow}
            isBusy={isBusy}
            removeLabel={`Remove ${member.email} from ${entry.position}`}
            onRemove={() => onUnassignMember(member.id, entry.position)}
            {...memberRowCheckInProps}
          />
        ))}
        {assetsEnabled
          ? entry.assets.map((asset) =>
              renderAssetListItem(asset, {
                badgeLabel: 'Assigned',
                showPoc: true,
                canEditPoc: canManageRoster,
                canManageRow: canManageRoster && canAssignNow,
                removeLabel: `Remove ${asset.name} from ${entry.position}`,
                onRemove: () => onUnassignAsset(asset.assetKey, entry.position),
              })
            )
          : null}
      </PositionAssignmentLifecycleSection>

      <PositionAssignmentLifecycleSection
        title="Scheduled assign (next OP)"
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        emptyMessage={scheduleAssignHasRows ? '' : scheduleAssignEmpty}
        visible={scheduleAssignHasRows || canScheduleAssign}
        actions={
          canManageRoster && canScheduleAssign ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser
              disabled={isBusy}
              assignableMembers={scheduleAssignable}
              assignableAssets={scheduleAssignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc={false}
              memberEmptyMessage={scheduleAssignMembersEmptyMessage(scheduleAssignable.length)}
              assetEmptyMessage={assignableAssetsEmptyMessage(assetsEnabled)}
              onSelectMember={(memberId) => onScheduleAssignMember(memberId, entry.position)}
              onSelectAsset={
                assetsEnabled
                  ? (assetKey) => onScheduleAssignAsset(assetKey, entry.position)
                  : undefined
              }
              position={entry.position}
              inviteMode="schedule_on_op_advance"
              expandedInviteMode={expandedInviteMode}
              inlinePositionInvite={inlinePositionInvite}
              onToggleInvite={toggleInlineInvite}
              onInviteToPosition={onInviteToPosition}
            />
          ) : null
        }
      >
        {entry.scheduledAssignees.map((member) => (
          <PositionMemberRow
            key={`sched-assign-member-${entry.position}-${member.id}`}
            member={member}
            badgeLabel="Next OP"
            canManage={canManageRoster}
            isBusy={isBusy}
            removeLabel={`Remove ${member.email} from next OP assign schedule`}
            onRemove={() => onRemoveScheduledAssign(member.id, entry.position)}
            {...memberRowCheckInProps}
          />
        ))}
        {assetsEnabled
          ? entry.scheduledAssignAssets.map((asset) =>
              renderAssetListItem(asset, {
                badgeLabel: 'Next OP',
                showPoc: true,
                canEditPoc: canManageRoster,
                canManageRow: canManageRoster,
                removeLabel: `Remove ${asset.name} from next OP assign schedule`,
                onRemove: () => onRemoveScheduledAssignAsset(asset.assetKey, entry.position),
              })
            )
          : null}
      </PositionAssignmentLifecycleSection>

      <PositionAssignmentLifecycleSection
        title="Scheduled org chart (next OP)"
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        emptyMessage={scheduleOrgChartHasRows ? '' : scheduleOrgChartEmpty}
        visible={scheduleOrgChartHasRows}
      >
        {entry.scheduledOrgChartMembers.map((member) => (
          <PositionMemberRow
            key={`sched-org-chart-member-${entry.position}-${member.id}`}
            member={member}
            badgeLabel="Org chart · Next OP"
            canManage={canManageRoster}
            isBusy={isBusy}
            removeLabel={`Remove ${member.email} from next OP org chart schedule`}
            onRemove={() => onRemoveScheduledAssign(member.id, entry.position)}
            {...memberRowCheckInProps}
          />
        ))}
        {assetsEnabled
          ? entry.scheduledOrgChartAssets.map((asset) =>
              renderAssetListItem(asset, {
                badgeLabel: 'Org chart · Next OP',
                showPoc: false,
                canEditPoc: false,
                canManageRow: canManageRoster,
                removeLabel: `Remove ${asset.name} from next OP org chart schedule`,
                onRemove: () => onRemoveScheduledAssignAsset(asset.assetKey, entry.position),
              })
            )
          : null}
      </PositionAssignmentLifecycleSection>

      <PositionAssignmentLifecycleSection
        title="Scheduled unassign (next OP)"
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        emptyMessage={scheduleUnassignHasRows ? '' : scheduleUnassignEmpty}
        visible={scheduleUnassignHasRows || canScheduleUnassign}
        actions={
          canManageRoster && canScheduleUnassign ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser={false}
              disabled={isBusy}
              assignableMembers={scheduleUnassignable}
              assignableAssets={scheduleUnassignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc={false}
              memberEmptyMessage={scheduleUnassignMembersEmptyMessage(entry, scheduleUnassignable.length)}
              assetEmptyMessage={scheduleUnassignAssetsEmptyMessage()}
              onSelectMember={(memberId) => onScheduleUnassignMember(memberId, entry.position)}
              onSelectAsset={
                assetsEnabled
                  ? (assetKey) => onScheduleUnassignAsset(assetKey, entry.position)
                  : undefined
              }
              position={entry.position}
              inviteMode="schedule_on_op_advance"
              expandedInviteMode={expandedInviteMode}
              inlinePositionInvite={inlinePositionInvite}
              onToggleInvite={toggleInlineInvite}
              onInviteToPosition={onInviteToPosition}
            />
          ) : null
        }
      >
        {entry.scheduledUnassignees.map((member) => (
          <PositionMemberRow
            key={`sched-unassign-member-${entry.position}-${member.id}`}
            member={member}
            badgeLabel="Next OP"
            canManage={canManageRoster}
            isBusy={isBusy}
            removeLabel={`Remove ${member.email} from next OP unassign schedule`}
            onRemove={() => onRemoveScheduledUnassign(member.id, entry.position)}
            {...memberRowCheckInProps}
          />
        ))}
        {assetsEnabled
          ? entry.scheduledUnassignAssets.map((asset) =>
              renderAssetListItem(asset, {
                badgeLabel: 'Next OP',
                showPoc: true,
                canEditPoc: canManageRoster,
                canManageRow: canManageRoster,
                removeLabel: `Remove ${asset.name} from next OP unassign schedule`,
                onRemove: () => onRemoveScheduledUnassignAsset(asset.assetKey, entry.position),
              })
            )
          : null}
      </PositionAssignmentLifecycleSection>
    </>
  )
}
