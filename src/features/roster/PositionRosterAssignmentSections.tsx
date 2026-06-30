import { useState, type ReactNode } from 'react'
import { CalendarClock, Plus, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { PositionMemberAssignPicker } from '@/features/roster/PositionMemberAssignPicker'
import {
  PositionAssetPickerPopover,
  type PositionRosterAssetHandlers,
} from '@/features/roster/PositionRosterAssetSections'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import { CompetencyFunctionSelect } from '@/features/roster/CompetencyFunctionSelect'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { ResourceCategoryLifecycle } from '@/lib/workspace-resource-category-types'
import {
  filterResourceCategoriesByLifecycle,
  PositionResourceCategoryCreateButton,
  PositionResourceCategoryCreateForm,
  PositionResourceCategoryRow,
} from '@/features/roster/PositionResourceCategoryRow'
import { cn } from '@/lib/utils'
import { assignmentSectionLabels, type RosterSchedulingPhase } from '@/lib/roster-scheduling-phase'
import type { OrgMemberPickerMode } from '@/features/roster/position-member-assign-picker'
import { PositionRosterItemActions } from '@/features/roster/PositionRosterItemActions'
import {
  canAssetContinueToNextOp,
  canMemberContinueToNextOp,
  canResourceCategoryContinueToNextOp,
} from '@/lib/work-assignment-roster-eligibility'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { RosterHaveLinkIndicator } from '@/features/roster/RosterHaveLinkIndicator'
import {
  lookupHaveLinkLocation,
  resolveMemberHaveRef,
  resolvePositionAssetHaveRef,
  resolveResourceCategoryHaveRef,
} from '@/features/roster/resolve-roster-have-ref'

export type PositionAssignmentSectionsLayout = 'stacked' | 'timeline'

function PositionAssignmentSectionsLayout({
  layout,
  assignedNow,
  scheduledAssign,
  scheduledOrgChart,
  scheduledUnassign,
  rosterSchedulingPhase = 'live_ops',
}: {
  layout: PositionAssignmentSectionsLayout
  assignedNow: ReactNode
  scheduledAssign: ReactNode
  scheduledOrgChart: ReactNode
  scheduledUnassign: ReactNode
  rosterSchedulingPhase?: RosterSchedulingPhase
}) {
  const sectionLabels = assignmentSectionLabels(rosterSchedulingPhase)

  if (layout === 'stacked') {
    return (
      <div className="space-y-3">
        {assignedNow}
        {scheduledAssign}
        {scheduledOrgChart}
        {scheduledUnassign}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="hidden gap-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-2">
        <span>{sectionLabels.timelineNow}</span>
        <span>{sectionLabels.timelineNext}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:items-start">
        <div className="min-h-[12rem]">{assignedNow}</div>
        <div className="space-y-3">
          {scheduledAssign}
          {scheduledOrgChart}
          {scheduledUnassign}
        </div>
      </div>
    </div>
  )
}

function PositionAssignmentLifecycleSection({
  title,
  icon,
  emptyMessage,
  visible,
  children,
  actions,
  className,
}: {
  title: string
  icon?: ReactNode
  emptyMessage: string
  visible: boolean
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  if (!visible) return null

  return (
    <div className={cn('space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2', className)}>
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
  competencyFunction = null,
  canEditCompetencyFunction = false,
  competencyOptions = [],
  isUpdatingCompetency = false,
  onCompetencyFunctionChange,
  showAlsoScheduleForNextOp = false,
  onAlsoScheduleForNextOp,
  haveLinkLocation,
  activeHaveCell = null,
  highlightedHaveRef = null,
  memberHaveRef,
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
  competencyFunction?: string | null
  canEditCompetencyFunction?: boolean
  competencyOptions?: string[]
  isUpdatingCompetency?: boolean
  onCompetencyFunctionChange?: (value: string | null) => void
  showAlsoScheduleForNextOp?: boolean
  onAlsoScheduleForNextOp?: () => void
  haveLinkLocation?: Ics215HaveLinkLocation | null
  activeHaveCell?: { rowId: number; columnId: string } | null
  highlightedHaveRef?: string | null
  memberHaveRef?: string
}) {
  const isHighlighted = Boolean(memberHaveRef && highlightedHaveRef === memberHaveRef)

  return (
    <div
      className={cn(
        'space-y-1.5 rounded-md border px-2 py-1.5',
        isHighlighted && 'ring-2 ring-primary/40 ring-offset-1'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{member.email}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              User
            </Badge>
            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
              {badgeLabel}
            </Badge>
            <RosterHaveLinkIndicator
              location={haveLinkLocation}
              activeHaveCell={activeHaveCell}
              compact
            />
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
        <PositionRosterItemActions
          disabled={isBusy}
          showScheduleForNextOp={showAlsoScheduleForNextOp}
          onScheduleForNextOp={onAlsoScheduleForNextOp}
          showRemove={canManage}
          onRemove={onRemove}
          removeLabel={removeLabel}
        />
      </div>
      {onCompetencyFunctionChange ? (
        <CompetencyFunctionSelect
          value={competencyFunction}
          options={competencyOptions}
          disabled={!canEditCompetencyFunction}
          compact
          isUpdating={isUpdatingCompetency}
          onChange={onCompetencyFunctionChange}
        />
      ) : null}
    </div>
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
          {expanded ? 'Cancel' : 'New Person'}
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
      New Person
    </Button>
  )
}

export function PositionAssignmentActionBar({
  showAssetActions,
  showNewUser,
  showResourceCategory,
  disabled,
  assignableMembers,
  assignableAssets,
  pocMembers,
  requireAssetPoc,
  memberEmptyMessage,
  assetEmptyMessage,
  onSelectMember,
  onSearchOrgMembers,
  onAssignOrgMember,
  rosterMembersForOrgDedupe,
  draftMembersForOrgDedupe = [],
  onSelectAsset,
  onCreateResourceCategory,
  position,
  inviteMode,
  expandedInviteMode,
  inlinePositionInvite,
  onToggleInvite,
  onInviteToPosition,
  orgPickerMode = 'assign_to_position',
}: {
  showAssetActions: boolean
  showNewUser: boolean
  showResourceCategory?: boolean
  disabled: boolean
  assignableMembers: WorkspaceRosterMember[]
  assignableAssets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  requireAssetPoc: boolean
  memberEmptyMessage: string
  assetEmptyMessage: string
  onSelectMember: (memberId: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (userId: string, email: string) => void
  rosterMembersForOrgDedupe?: WorkspaceRosterMember[]
  draftMembersForOrgDedupe?: import('@/features/roster/roster-template-types').BuildTeamDraftMember[]
  onSelectAsset?: (assetKey: string, pointOfContactMemberId?: string) => void
  onCreateResourceCategory?: (name: string) => void
  position: string
  inviteMode: RosterInviteAssignmentMode
  expandedInviteMode: RosterInviteAssignmentMode | null
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onToggleInvite: (mode: RosterInviteAssignmentMode) => void
  onInviteToPosition?: (position: string, mode: RosterInviteAssignmentMode) => void
  orgPickerMode?: OrgMemberPickerMode
}) {
  const [resourceCategoryFormOpen, setResourceCategoryFormOpen] = useState(false)

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex flex-wrap gap-1.5">
        {showResourceCategory && onCreateResourceCategory && !resourceCategoryFormOpen ? (
          <PositionResourceCategoryCreateButton
            disabled={disabled}
            onClick={() => setResourceCategoryFormOpen(true)}
          />
        ) : null}
        <PositionMemberAssignPicker
          label="Existing Person"
          disabled={disabled}
          position={position}
          assignableMembers={assignableMembers}
          rosterMembersForDedupe={rosterMembersForOrgDedupe}
          draftMembersForDedupe={draftMembersForOrgDedupe}
          onSelectRosterMember={onSelectMember}
          onSearchOrgMembers={onSearchOrgMembers}
          onSelectOrgMember={onAssignOrgMember}
          orgPickerMode={orgPickerMode}
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
      {showResourceCategory && onCreateResourceCategory && resourceCategoryFormOpen ? (
        <PositionResourceCategoryCreateForm
          disabled={disabled}
          onCreate={(name) => {
            onCreateResourceCategory(name)
            setResourceCategoryFormOpen(false)
          }}
          onCancel={() => setResourceCategoryFormOpen(false)}
        />
      ) : null}
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
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  updatingCompetencyKey?: string | null
  memberScheduleCompetencyByKey?: Record<string, string | null>
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
  onAssetCompetencyFunctionChange?: (input: {
    assetKey: string
    positionName: string
    scope: 'active' | 'scheduled_assign' | 'scheduled_unassign' | 'scheduled_org_chart' | 'org_chart'
    value: string | null
  }) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (
    userId: string,
    position: string,
    mode?: RosterInviteAssignmentMode,
    email?: string
  ) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
  draftMembersForOrgDedupe?: import('@/features/roster/roster-template-types').BuildTeamDraftMember[]
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onCreateResourceCategory?: (position: string, name: string, lifecycle: ResourceCategoryLifecycle) => void
  onDeleteResourceCategory?: (categoryId: string) => void
  onScheduleResourceCategoryForNextOp?: (categoryId: string, position: string) => void
  onFillResourceCategoryMember?: (categoryId: string, memberId: string) => void
  onFillResourceCategoryAsset?: (categoryId: string, assetKey: string) => void
  onClearResourceCategoryFill?: (categoryId: string) => void
  assignmentSectionsLayout?: PositionAssignmentSectionsLayout
  haveLinkIndexByRef?: Map<string, Ics215HaveLinkLocation>
  activeHaveCell?: { rowId: number; columnId: string } | null
  highlightedHaveRef?: string | null
  rosterSchedulingPhase?: RosterSchedulingPhase
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
  competencyOptions = [],
  canEditCompetencyFunction = false,
  updatingCompetencyKey = null,
  memberScheduleCompetencyByKey = {},
  onMemberCompetencyFunctionChange,
  onAssetCompetencyFunctionChange,
  onAssignExistingMember,
  onSearchOrgMembers,
  onAssignOrgMember,
  workspaceRosterMembers = [],
  draftMembersForOrgDedupe = [],
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
  onCreateResourceCategory,
  onDeleteResourceCategory,
  onScheduleResourceCategoryForNextOp,
  onFillResourceCategoryMember,
  onFillResourceCategoryAsset,
  onClearResourceCategoryFill,
  assignmentSectionsLayout = 'stacked',
  haveLinkIndexByRef,
  activeHaveCell = null,
  highlightedHaveRef = null,
  rosterSchedulingPhase = 'live_ops',
}: PositionRosterUnifiedAssignmentSectionsProps) {
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)
  const [expandedInviteMode, setExpandedInviteMode] = useState<RosterInviteAssignmentMode | null>(
    null
  )
  const sectionLabels = assignmentSectionLabels(rosterSchedulingPhase)
  const orgSearchEnabled = Boolean(onSearchOrgMembers && onAssignOrgMember)
  const orgPickerMode: OrgMemberPickerMode =
    rosterSchedulingPhase === 'pre_first_op' ? 'pre_workspace' : 'assign_to_position'
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

  const memberRowCompetencyProps = {
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
  }

  const competencyKey = (
    kind: 'member' | 'asset',
    id: string,
    scope: string
  ) => `${kind}::${id}::${entry.position}::${scope}`

  const assignNowEmpty = assignNowCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleAssignEmpty = scheduleAssignCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleOrgChartEmpty = scheduleOrgChartCombinedEmptyMessage(entry, assetsEnabled)
  const scheduleUnassignEmpty = scheduleUnassignCombinedEmptyMessage(entry, assetsEnabled)

  const assignNowHasRows =
    entry.members.length > 0 ||
    (assetsEnabled && entry.assets.length > 0) ||
    filterResourceCategoriesByLifecycle(entry.resourceCategories, 'active').length > 0
  const scheduleAssignHasRows =
    entry.scheduledAssignees.length > 0 ||
    (assetsEnabled && entry.scheduledAssignAssets.length > 0) ||
    filterResourceCategoriesByLifecycle(entry.resourceCategories, 'scheduled_assign').length > 0
  const scheduleOrgChartHasRows =
    entry.scheduledOrgChartMembers.length > 0 ||
    (assetsEnabled && entry.scheduledOrgChartAssets.length > 0)
  const scheduleUnassignHasRows =
    entry.scheduledUnassignees.length > 0 ||
    (assetsEnabled && entry.scheduledUnassignAssets.length > 0) ||
    filterResourceCategoriesByLifecycle(entry.resourceCategories, 'scheduled_unassign').length > 0

  const rosterMembers = workspaceRosterMembers ?? []

  const memberHaveLinkProps = (
    memberId: string,
    competencyFunction?: string | null
  ) => {
    const ref = resolveMemberHaveRef(memberId, entry.position, rosterMembers, competencyFunction)
    return {
      memberHaveRef: ref,
      haveLinkLocation: lookupHaveLinkLocation(haveLinkIndexByRef, ref),
      activeHaveCell,
      highlightedHaveRef,
    }
  }

  const assetHaveLinkProps = (assetKey: string) => {
    const ref = resolvePositionAssetHaveRef(
      assetKey,
      entry.position,
      rosterMembers,
      assetsByKey ?? {}
    )
    return {
      assetHaveRef: ref,
      haveLinkLocation: lookupHaveLinkLocation(haveLinkIndexByRef, ref),
      activeHaveCell,
      highlightedHaveRef,
    }
  }

  const categoryHaveLinkProps = (categoryId: string) => {
    const ref = resolveResourceCategoryHaveRef(categoryId)
    return {
      categoryHaveRef: ref,
      haveLinkLocation: lookupHaveLinkLocation(haveLinkIndexByRef, ref),
      activeHaveCell,
      highlightedHaveRef,
    }
  }

  const renderResourceCategoryRows = (
    lifecycle: ResourceCategoryLifecycle,
    lifecycleLabel: string,
    canManageSection: boolean,
    assignableMembersForFill: WorkspaceRosterMember[],
    assignableAssetsForFill: ResourceListItemData[]
  ) =>
    filterResourceCategoriesByLifecycle(entry.resourceCategories, lifecycle).map((category) => {
      const haveLinkProps = categoryHaveLinkProps(category.id)
      return (
      <PositionResourceCategoryRow
        key={`resource-category-${lifecycle}-${entry.position}-${category.id}`}
        category={category}
        position={entry.position}
        lifecycleLabel={lifecycleLabel}
        canManage={canManageRoster && canManageSection}
        isBusy={isBusy}
        assignableMembers={assignableMembersForFill}
        assignableAssets={assignableAssetsForFill}
        pocMembers={pocMembers}
        assetsEnabled={assetsEnabled}
        onDelete={() => onDeleteResourceCategory?.(category.id)}
        showAlsoScheduleForNextOp={
          lifecycle === 'active' &&
          canManageRoster &&
          canScheduleAssign &&
          canResourceCategoryContinueToNextOp(category, entry)
        }
        onAlsoScheduleForNextOp={() =>
          onScheduleResourceCategoryForNextOp?.(category.id, entry.position)
        }
        onFillMember={(memberId) => onFillResourceCategoryMember?.(category.id, memberId)}
        onFillAsset={(assetKey) => onFillResourceCategoryAsset?.(category.id, assetKey)}
        onClearFill={() => onClearResourceCategoryFill?.(category.id)}
        {...haveLinkProps}
      />
      )
    })

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
      showAlsoScheduleForNextOp?: boolean
      onAlsoScheduleForNextOp?: () => void
      scope: 'active' | 'scheduled_assign' | 'scheduled_unassign' | 'scheduled_org_chart' | 'org_chart'
    }
  ) => {
    const haveLinkProps = assetHaveLinkProps(asset.assetKey)
    return (
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
      showAlsoScheduleForNextOp={config.showAlsoScheduleForNextOp}
      onAlsoScheduleForNextOp={config.onAlsoScheduleForNextOp}
      onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
      competencyOptions={competencyOptions}
      canEditCompetencyFunction={canEditCompetencyFunction}
      isUpdatingCompetency={updatingCompetencyKey === competencyKey('asset', asset.assetKey, config.scope)}
      onUpdateAssetCompetencyFunction={
        onAssetCompetencyFunctionChange
          ? (value) =>
              onAssetCompetencyFunctionChange({
                assetKey: asset.assetKey,
                positionName: entry.position,
                scope: config.scope,
                value,
              })
          : undefined
      }
      onFocusMap={
        onFocusAsset && assetsByKey[asset.assetKey]
          ? () => onFocusAsset(assetsByKey[asset.assetKey]!)
          : undefined
      }
      open={expandedAssetKey === asset.assetKey}
      onOpenChange={(open) => setExpandedAssetKey(open ? asset.assetKey : null)}
      {...haveLinkProps}
    />
    )
  }

  return (
    <PositionAssignmentSectionsLayout
      layout={assignmentSectionsLayout}
      rosterSchedulingPhase={rosterSchedulingPhase}
      assignedNow={
      <PositionAssignmentLifecycleSection
        title={sectionLabels.assignedNowTitle}
        emptyMessage={assignNowHasRows ? '' : assignNowEmpty}
        visible
        actions={
          canManageRoster && canAssignNow ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser
              showResourceCategory
              disabled={isBusy}
              assignableMembers={assignable}
              assignableAssets={assignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc
              memberEmptyMessage={assignExistingMembersEmptyMessage(entry, assignable.length, {
                rosterSchedulingPhase,
                orgSearchEnabled,
              })}
              assetEmptyMessage={assignableAssetsEmptyMessage(assetsEnabled)}
              onCreateResourceCategory={
                onCreateResourceCategory
                  ? (name) => onCreateResourceCategory(entry.position, name, 'active')
                  : undefined
              }
              onSelectMember={(memberId) => onAssignExistingMember(memberId, entry.position)}
              onSearchOrgMembers={onSearchOrgMembers}
              onAssignOrgMember={
                onAssignOrgMember
                  ? (userId, email) => onAssignOrgMember(userId, entry.position, 'assign_now', email)
                  : undefined
              }
              rosterMembersForOrgDedupe={workspaceRosterMembers}
              draftMembersForOrgDedupe={draftMembersForOrgDedupe}
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
              orgPickerMode={orgPickerMode}
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
            showAlsoScheduleForNextOp={
              canManageRoster &&
              canScheduleAssign &&
              canMemberContinueToNextOp(member, entry)
            }
            onAlsoScheduleForNextOp={() => onScheduleAssignMember(member.id, entry.position)}
            competencyFunction={member.competencyByPosition?.[entry.position] ?? null}
            {...memberHaveLinkProps(
              member.id,
              member.competencyByPosition?.[entry.position] ?? null
            )}
            isUpdatingCompetency={
              updatingCompetencyKey === competencyKey('member', member.id, 'active')
            }
            onCompetencyFunctionChange={
              onMemberCompetencyFunctionChange
                ? (value) =>
                    onMemberCompetencyFunctionChange({
                      memberId: member.id,
                      positionName: entry.position,
                      scope: 'active',
                      value,
                    })
                : undefined
            }
            {...memberRowCheckInProps}
            {...memberRowCompetencyProps}
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
                showAlsoScheduleForNextOp:
                  canManageRoster &&
                  canScheduleAssign &&
                  canAssetContinueToNextOp(asset.assetKey, entry),
                onAlsoScheduleForNextOp: () =>
                  onScheduleAssignAsset(asset.assetKey, entry.position),
                scope: 'active',
              })
            )
          : null}
        {renderResourceCategoryRows('active', sectionLabels.assignedNowTitle, canAssignNow, assignable, assignableAssets)}
      </PositionAssignmentLifecycleSection>
      }
      scheduledAssign={
      <PositionAssignmentLifecycleSection
        title={sectionLabels.scheduledAssignTitle}
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        emptyMessage={scheduleAssignHasRows ? '' : scheduleAssignEmpty}
        visible={scheduleAssignHasRows || canScheduleAssign}
        actions={
          canManageRoster && canScheduleAssign ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser
              showResourceCategory
              disabled={isBusy}
              assignableMembers={scheduleAssignable}
              assignableAssets={scheduleAssignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc={false}
              memberEmptyMessage={scheduleAssignMembersEmptyMessage(scheduleAssignable.length, {
                orgSearchEnabled,
              })}
              assetEmptyMessage={assignableAssetsEmptyMessage(assetsEnabled)}
              onCreateResourceCategory={
                onCreateResourceCategory
                  ? (name) => onCreateResourceCategory(entry.position, name, 'scheduled_assign')
                  : undefined
              }
              onSelectMember={(memberId) => onScheduleAssignMember(memberId, entry.position)}
              onSearchOrgMembers={onSearchOrgMembers}
              onAssignOrgMember={
                onAssignOrgMember
                  ? (userId, email) =>
                      onAssignOrgMember(userId, entry.position, 'schedule_on_op_advance', email)
                  : undefined
              }
              rosterMembersForOrgDedupe={workspaceRosterMembers}
              draftMembersForOrgDedupe={draftMembersForOrgDedupe}
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
              orgPickerMode={orgPickerMode}
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
            competencyFunction={
              memberScheduleCompetencyByKey[
                `${member.id}::${entry.position}::assign_on_op_advance`
              ] ?? null
            }
            {...memberHaveLinkProps(
              member.id,
              memberScheduleCompetencyByKey[
                `${member.id}::${entry.position}::assign_on_op_advance`
              ] ?? null
            )}
            isUpdatingCompetency={
              updatingCompetencyKey === competencyKey('member', member.id, 'scheduled_assign')
            }
            onCompetencyFunctionChange={
              onMemberCompetencyFunctionChange
                ? (value) =>
                    onMemberCompetencyFunctionChange({
                      memberId: member.id,
                      positionName: entry.position,
                      scope: 'scheduled_assign',
                      value,
                    })
                : undefined
            }
            {...memberRowCheckInProps}
            {...memberRowCompetencyProps}
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
                scope: 'scheduled_assign',
              })
            )
          : null}
        {renderResourceCategoryRows(
          'scheduled_assign',
          sectionLabels.scheduledAssignTitle,
          canScheduleAssign,
          scheduleAssignable,
          scheduleAssignableAssets
        )}
      </PositionAssignmentLifecycleSection>
      }
      scheduledOrgChart={
      <PositionAssignmentLifecycleSection
        title={sectionLabels.scheduledOrgChartTitle}
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
            competencyFunction={member.pendingCompetencyFunction ?? null}
            {...memberHaveLinkProps(member.id, member.pendingCompetencyFunction ?? null)}
            isUpdatingCompetency={
              updatingCompetencyKey === competencyKey('member', member.id, 'scheduled_org_chart')
            }
            onCompetencyFunctionChange={
              onMemberCompetencyFunctionChange
                ? (value) =>
                    onMemberCompetencyFunctionChange({
                      memberId: member.id,
                      positionName: entry.position,
                      scope: 'scheduled_org_chart',
                      value,
                    })
                : undefined
            }
            {...memberRowCheckInProps}
            {...memberRowCompetencyProps}
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
                scope: 'scheduled_org_chart',
              })
            )
          : null}
      </PositionAssignmentLifecycleSection>
      }
      scheduledUnassign={
      <PositionAssignmentLifecycleSection
        title={sectionLabels.scheduledUnassignTitle}
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        emptyMessage={scheduleUnassignHasRows ? '' : scheduleUnassignEmpty}
        visible={scheduleUnassignHasRows || canScheduleUnassign}
        actions={
          canManageRoster && canScheduleUnassign ? (
            <PositionAssignmentActionBar
              showAssetActions={assetsEnabled}
              showNewUser={false}
              showResourceCategory
              disabled={isBusy}
              assignableMembers={scheduleUnassignable}
              assignableAssets={scheduleUnassignableAssets}
              pocMembers={pocMembers}
              requireAssetPoc={false}
              memberEmptyMessage={scheduleUnassignMembersEmptyMessage(entry, scheduleUnassignable.length)}
              assetEmptyMessage={scheduleUnassignAssetsEmptyMessage()}
              onCreateResourceCategory={
                onCreateResourceCategory
                  ? (name) => onCreateResourceCategory(entry.position, name, 'scheduled_unassign')
                  : undefined
              }
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
            competencyFunction={
              memberScheduleCompetencyByKey[
                `${member.id}::${entry.position}::unassign_on_op_advance`
              ] ?? null
            }
            {...memberHaveLinkProps(
              member.id,
              memberScheduleCompetencyByKey[
                `${member.id}::${entry.position}::unassign_on_op_advance`
              ] ?? null
            )}
            isUpdatingCompetency={
              updatingCompetencyKey === competencyKey('member', member.id, 'scheduled_unassign')
            }
            onCompetencyFunctionChange={
              onMemberCompetencyFunctionChange
                ? (value) =>
                    onMemberCompetencyFunctionChange({
                      memberId: member.id,
                      positionName: entry.position,
                      scope: 'scheduled_unassign',
                      value,
                    })
                : undefined
            }
            {...memberRowCheckInProps}
            {...memberRowCompetencyProps}
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
                scope: 'scheduled_unassign',
              })
            )
          : null}
        {renderResourceCategoryRows(
          'scheduled_unassign',
          'Scheduled unassign',
          canScheduleUnassign,
          scheduleUnassignable,
          scheduleUnassignableAssets
        )}
      </PositionAssignmentLifecycleSection>
      }
    />
  )
}
