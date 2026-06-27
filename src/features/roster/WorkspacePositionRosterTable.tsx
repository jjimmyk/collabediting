import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, UserPlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import {
  filterPositionRosterMembers,
  formatPositionAssignmentCount,
} from '@/features/roster/workspace-position-roster'
import {
  positionMatchesRosterDisplayFilters,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'
import {
  type PositionRosterAssetHandlers,
} from '@/features/roster/PositionRosterAssetSections'
import type { ResourceListItemData } from '@/features/resources/types'
import { formatPositionAssetAssignmentCount } from '@/lib/workspace-position-asset-roster'
import { PositionOpAdvanceLabelSelect } from '@/features/roster/PositionOpAdvanceLabelSelect'
import { PositionRosterDetailPanel } from '@/features/roster/PositionRosterDetailPanel'
import {
  PositionMemberRow,
  type PositionRosterUnifiedAssignmentSectionsProps,
} from '@/features/roster/PositionRosterAssignmentSections'
import {
  PositionPermissionsSection,
  PositionPropertiesSection,
} from '@/features/roster/PositionRosterPropertySections'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { WorkspacePositionCatalog, WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import { cn } from '@/lib/utils'

type WorkspacePositionRosterTableProps = {
  entries: PositionRosterEntry[]
  displayFilters: RosterDisplayFilters
  positionCatalog: WorkspacePositionCatalog
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isDeletingCustomPosition?: string | null
  showOpAdvanceLabels?: boolean
  positionMetaByName?: Record<string, WorkspacePositionMeta>
  isUpdatingOpAdvanceLabel?: string | null
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
  onRemovePositionFromRoster?: (position: string) => void
  canRemovePositionFromRoster?: (entry: PositionRosterEntry) => boolean
  positionRemovalBlockedReason?: (entry: PositionRosterEntry) => string | null
  onDeleteCustomPosition?: (position: string) => void
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
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
  assignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  pocMembers?: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
  onFocusAsset?: (asset: ResourceListItemData) => void
  isUpdatingPositionIdentity?: string | null
  onSaveCustomPosition?: (input: {
    positionId: string
    currentName: string
    name?: string
    reportsTo?: string
  }) => void | Promise<void>
  onCreateResourceCategory?: (
    position: string,
    name: string,
    lifecycle: import('@/lib/workspace-resource-category-types').ResourceCategoryLifecycle
  ) => void
  onDeleteResourceCategory?: (categoryId: string) => void
  onScheduleResourceCategoryForNextOp?: (categoryId: string, position: string) => void
  onFillResourceCategoryMember?: (categoryId: string, memberId: string) => void
  onFillResourceCategoryAsset?: (categoryId: string, assetKey: string) => void
  onClearResourceCategoryFill?: (categoryId: string) => void
  haveLinkIndexByRef?: PositionRosterUnifiedAssignmentSectionsProps['haveLinkIndexByRef']
  activeHaveCell?: PositionRosterUnifiedAssignmentSectionsProps['activeHaveCell']
  highlightedHaveRef?: PositionRosterUnifiedAssignmentSectionsProps['highlightedHaveRef']
  haveLinkPickMode?: import('@/features/ics215/have-link-pick-mode').HaveLinkPickMode
  assignmentSectionsLayout?: import('@/features/roster/PositionRosterAssignmentSections').PositionAssignmentSectionsLayout
} & Partial<PositionRosterAssetHandlers>

function AssignedMembersList({
  entry,
  assignedSearchQuery,
  canManageRoster,
  isAssigningPosition,
  onUnassignMember,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  competencyOptions = [],
  canEditCompetencyFunction = false,
  updatingCompetencyKey = null,
  onMemberCompetencyFunctionChange,
}: {
  entry: PositionRosterEntry
  assignedSearchQuery: string
  canManageRoster: boolean
  isAssigningPosition: string | null
  onUnassignMember: (memberId: string, position: string) => void
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  updatingCompetencyKey?: string | null
  onMemberCompetencyFunctionChange?: import('@/features/roster/PositionRosterAssignmentSections').PositionRosterUnifiedAssignmentSectionsProps['onMemberCompetencyFunctionChange']
}) {
  const canUnassignNow = entry.memberSchedulePolicy.allowActiveAssignment
  const visibleMembers = useMemo(
    () => filterPositionRosterMembers(entry.members, assignedSearchQuery),
    [assignedSearchQuery, entry.members]
  )

  if (entry.members.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-2 py-2 text-[11px] text-muted-foreground">
        No members assigned to this position.
      </p>
    )
  }

  if (visibleMembers.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-2 py-2 text-[11px] text-muted-foreground">
        No assigned members match the current filter.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      {visibleMembers.map((member) => (
        <PositionMemberRow
          key={`${entry.position}-${member.id}`}
          member={member}
          badgeLabel={member.status === 'active' ? 'Active' : 'Invited'}
          canManage={canManageRoster && canUnassignNow}
          isBusy={isAssigningPosition === entry.position}
          removeLabel={`Remove ${member.email} from ${entry.position}`}
          onRemove={() => onUnassignMember(member.id, entry.position)}
          competencyFunction={member.competencyByPosition?.[entry.position] ?? null}
          competencyOptions={competencyOptions}
          canEditCompetencyFunction={canEditCompetencyFunction}
          isUpdatingCompetency={
            updatingCompetencyKey === `member::${member.id}::${entry.position}::active`
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
          showCheckInStatus={showCheckInStatus}
          canEditCheckInStatus={canEditCheckInStatus}
          updatingCheckInMemberId={updatingCheckInMemberId}
          onCheckInStatusChange={onCheckInStatusChange}
        />
      ))}
    </div>
  )
}

export function WorkspacePositionRosterTable({
  entries,
  displayFilters,
  positionCatalog,
  assignableByPosition,
  scheduleAssignableByPosition,
  scheduleUnassignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  isDeletingCustomPosition = null,
  showOpAdvanceLabels = false,
  positionMetaByName = {},
  isUpdatingOpAdvanceLabel = null,
  onToggleEditIcs201,
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
  onRemovePositionFromRoster,
  canRemovePositionFromRoster,
  positionRemovalBlockedReason,
  onDeleteCustomPosition,
  onOpAdvanceLabelChange,
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
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
  onPositionTypeChange,
  showPositionAssets = false,
  assignableAssetsByPosition = {},
  scheduleAssignableAssetsByPosition = {},
  scheduleUnassignableAssetsByPosition = {},
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
  isUpdatingPositionIdentity = null,
  onSaveCustomPosition,
  onCreateResourceCategory,
  onDeleteResourceCategory,
  onScheduleResourceCategoryForNextOp,
  onFillResourceCategoryMember,
  onFillResourceCategoryAsset,
  onClearResourceCategoryFill,
  haveLinkIndexByRef,
  activeHaveCell = null,
  highlightedHaveRef = null,
  haveLinkPickMode,
  assignmentSectionsLayout = 'stacked',
}: WorkspacePositionRosterTableProps) {
  const tableColumnCount =
    3 +
    (showPositionAssets ? 1 : 0) +
    (showAllowWorkAssignment || onPositionTypeChange ? 1 : 0) +
    (showOpAdvanceLabels ? 1 : 0) +
    (canManageRoster ? 1 : 0)
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(() => new Set())
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('')
  const [managedPosition, setManagedPosition] = useState<string | null>(null)

  const managedEntry = useMemo(
    () =>
      managedPosition
        ? entries.find((entry) => entry.position === managedPosition) ?? null
        : null,
    [entries, managedPosition]
  )

  useEffect(() => {
    if (managedPosition && !managedEntry) {
      setManagedPosition(null)
    }
  }, [managedEntry, managedPosition])

  const filteredEntries = useMemo(() => {
    const normalizedQuery = assignedSearchQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (!positionMatchesRosterDisplayFilters(entry, displayFilters, positionCatalog)) {
        return false
      }
      if (!normalizedQuery) return true
      if (entry.position.toLowerCase().includes(normalizedQuery)) return true
      return [...entry.members, ...entry.scheduledAssignees].some((member) =>
        [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })
  }, [assignedSearchQuery, displayFilters, entries, positionCatalog])

  const hasActiveAssignedFilters = assignedSearchQuery.trim().length > 0

  const clearAssignedFilters = () => {
    setAssignedSearchQuery('')
  }

  const toggleExpanded = (position: string) => {
    setExpandedPositions((current) => {
      const next = new Set(current)
      if (next.has(position)) {
        next.delete(position)
      } else {
        next.add(position)
      }
      return next
    })
  }

  return (
    <div className={cn('overflow-hidden rounded-md border', glassItemBorderClasses)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[12rem] align-bottom">Position</TableHead>
            <TableHead className="min-w-[16rem] align-bottom">
              <div className="space-y-2">
                <span>Assigned</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="space-y-1">
                    <Label htmlFor="roster-assigned-search" className="sr-only">
                      Search assigned members
                    </Label>
                    <Input
                      id="roster-assigned-search"
                      value={assignedSearchQuery}
                      onChange={(event) => setAssignedSearchQuery(event.target.value)}
                      placeholder="Search assigned…"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                {hasActiveAssignedFilters ? (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      Showing {filteredEntries.length} of {entries.length} positions
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={clearAssignedFilters}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                ) : null}
              </div>
            </TableHead>
            <TableHead className="min-w-[9rem] align-bottom">Permissions</TableHead>
            {showPositionAssets ? (
              <TableHead className="min-w-[8rem] align-bottom">Assets</TableHead>
            ) : null}
            {showAllowWorkAssignment || onPositionTypeChange ? (
              <TableHead className="min-w-[11rem] align-bottom">Position Properties</TableHead>
            ) : null}
            {showOpAdvanceLabels ? (
              <TableHead className="min-w-[10rem] align-bottom">Next OP period</TableHead>
            ) : null}
            {canManageRoster ? (
              <TableHead className="min-w-[10rem] align-bottom">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={tableColumnCount}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No positions match the assigned filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedPositions.has(entry.position)
              const assetCount =
                entry.assets.length +
                entry.scheduledAssignAssets.length +
                entry.scheduledUnassignAssets.length +
                entry.scheduledOrgChartAssets.length
              const assetSummary = formatPositionAssetAssignmentCount(entry.assets.length)
              const scheduledCount =
                entry.scheduledAssignees.length +
                entry.scheduledUnassignees.length +
                entry.scheduledOrgChartMembers.length
              const assignmentSummary =
                scheduledCount > 0
                  ? `${formatPositionAssignmentCount(entry.members.length).replace('Unassigned', '0 assigned')} · ${scheduledCount} scheduled next OP`
                  : formatPositionAssignmentCount(entry.members.length)

              return (
                <TableRow key={entry.position}>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.position}</span>
                      {entry.isCustom ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Custom
                        </Badge>
                      ) : null}
                      {entry.isPlanned ? (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          Planned
                        </Badge>
                      ) : null}
                      {entry.opAdvanceLabel === 'retire_on_op_advance' ? (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          Retiring
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto min-w-0 justify-start gap-1.5 px-1 py-1 text-left text-xs font-normal"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} assigned members for ${entry.position}`}
                        onClick={() => toggleExpanded(entry.position)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            entry.members.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {assignmentSummary}
                        </span>
                      </Button>

                      {isExpanded ? (
                        <AssignedMembersList
                          entry={entry}
                          assignedSearchQuery={assignedSearchQuery}
                          canManageRoster={canManageRoster}
                          isAssigningPosition={isAssigningPosition}
                          onUnassignMember={onUnassignMember}
                          showCheckInStatus={showCheckInStatus}
                          canEditCheckInStatus={canEditCheckInStatus}
                          updatingCheckInMemberId={updatingCheckInMemberId}
                          onCheckInStatusChange={onCheckInStatusChange}
                          competencyOptions={competencyOptions}
                          canEditCompetencyFunction={canEditCompetencyFunction}
                          updatingCompetencyKey={updatingCompetencyKey}
                          onMemberCompetencyFunctionChange={onMemberCompetencyFunctionChange}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <PositionPermissionsSection
                      entry={entry}
                      canManageRoster={canManageRoster}
                      isBusy={isUpdatingPermission === entry.position}
                      onToggleEditIcs201={onToggleEditIcs201}
                      variant="table"
                    />
                  </TableCell>
                  {showPositionAssets ? (
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{assetSummary}</p>
                        {assetCount > entry.assets.length ? (
                          <p className="text-[10px] text-muted-foreground">
                            {assetCount - entry.assets.length} scheduled next OP
                          </p>
                        ) : null}
                        {canManageRoster ? (
                          <p className="text-[10px] text-muted-foreground">Use Manage for assets.</p>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                  {showAllowWorkAssignment || onPositionTypeChange ? (
                    <TableCell className="align-top">
                      <PositionPropertiesSection
                        entry={entry}
                        canManageRoster={canManageRoster}
                        isBusy={isUpdatingPermission === entry.position}
                        showAllowWorkAssignment={showAllowWorkAssignment}
                        onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
                        onPositionTypeChange={onPositionTypeChange}
                        variant="table"
                      />
                    </TableCell>
                  ) : null}
                  {showOpAdvanceLabels ? (
                    <TableCell className="align-top">
                      {onOpAdvanceLabelChange ? (
                        <PositionOpAdvanceLabelSelect
                          positionName={entry.position}
                          meta={positionMetaByName[entry.position]}
                          value={entry.opAdvanceLabel ?? null}
                          disabled={
                            !canManageRoster || isUpdatingOpAdvanceLabel === entry.position
                          }
                          onChange={(label) => onOpAdvanceLabelChange(entry.position, label)}
                        />
                      ) : null}
                    </TableCell>
                  ) : null}
                  {canManageRoster ? (
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-[11px]"
                          disabled={isAssigningPosition === entry.position}
                          onClick={() => setManagedPosition(entry.position)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Manage
                        </Button>
                        {onRemovePositionFromRoster &&
                        canRemovePositionFromRoster?.(entry) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px] text-destructive hover:text-destructive"
                            disabled={isDeletingCustomPosition === entry.position}
                            title={positionRemovalBlockedReason?.(entry) ?? undefined}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove "${entry.position}" from this roster? This cannot be undone without re-adding the position.`
                                )
                              ) {
                                onRemovePositionFromRoster(entry.position)
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <Dialog
        open={managedPosition !== null}
        onOpenChange={(open) => {
          if (!open) setManagedPosition(null)
        }}
      >
        <DialogContent
          overlayClassName="bg-black/20 backdrop-blur-sm"
          className="flex max-h-[min(80vh,44rem)] w-full !max-w-[min(48rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[min(48rem,calc(100%-2rem))] !w-[48rem]"
        >
          {managedEntry ? (
            <>
              <DialogHeader className="shrink-0 space-y-2 border-b px-4 py-3 text-left">
                <DialogTitle>{managedEntry.position}</DialogTitle>
                <PositionLifecycleBadges entry={managedEntry} />
                <DialogDescription>
                  {canManageRoster
                    ? 'Manage assignees, assets, and permissions for this position.'
                    : 'View assignees, assets, and permissions for this position.'}
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                <PositionRosterDetailPanel
                  entry={managedEntry}
                  assignmentSectionsLayout="timeline"
                  assignable={assignableByPosition[managedEntry.position] ?? []}
                  scheduleAssignable={scheduleAssignableByPosition[managedEntry.position] ?? []}
                  scheduleUnassignable={scheduleUnassignableByPosition[managedEntry.position] ?? []}
                  canManageRoster={canManageRoster}
                  isPermissionBusy={isUpdatingPermission === managedEntry.position}
                  isAssignBusy={isAssigningPosition === managedEntry.position}
                  showOpAdvanceLabels={showOpAdvanceLabels}
                  positionMeta={positionMetaByName[managedEntry.position]}
                  isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel === managedEntry.position}
                  onOpAdvanceLabelChange={
                    onOpAdvanceLabelChange
                      ? (label) => onOpAdvanceLabelChange(managedEntry.position, label)
                      : undefined
                  }
                  onToggleEditIcs201={onToggleEditIcs201}
                  showAllowWorkAssignment={showAllowWorkAssignment}
                  onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
                  onPositionTypeChange={onPositionTypeChange}
                  onAssignExistingMember={onAssignExistingMember}
                  onSearchOrgMembers={onSearchOrgMembers}
                  onAssignOrgMember={onAssignOrgMember}
                  workspaceRosterMembers={workspaceRosterMembers}
                  onScheduleAssignMember={onScheduleAssignMember}
                  onScheduleUnassignMember={onScheduleUnassignMember}
                  onRemoveScheduledAssign={onRemoveScheduledAssign}
                  onRemoveScheduledUnassign={onRemoveScheduledUnassign}
                  onInviteToPosition={onInviteToPosition}
                  onUnassignMember={onUnassignMember}
                  showCheckInStatus={showCheckInStatus}
                  canEditCheckInStatus={canEditCheckInStatus}
                  updatingCheckInMemberId={updatingCheckInMemberId}
                  onCheckInStatusChange={onCheckInStatusChange}
                  competencyOptions={competencyOptions}
                  canEditCompetencyFunction={canEditCompetencyFunction}
                  updatingCompetencyKey={updatingCompetencyKey}
                  memberScheduleCompetencyByKey={memberScheduleCompetencyByKey}
                  onMemberCompetencyFunctionChange={onMemberCompetencyFunctionChange}
                  onAssetCompetencyFunctionChange={onAssetCompetencyFunctionChange}
                  showPositionAssets={showPositionAssets}
                  assignableAssets={assignableAssetsByPosition[managedEntry.position] ?? []}
                  scheduleAssignableAssets={
                    scheduleAssignableAssetsByPosition[managedEntry.position] ?? []
                  }
                  scheduleUnassignableAssets={
                    scheduleUnassignableAssetsByPosition[managedEntry.position] ?? []
                  }
                  pocMembers={pocMembers}
                  assetsByKey={assetsByKey}
                  glassItemBorderClasses={glassItemBorderClasses}
                  onFocusAsset={onFocusAsset}
                  onAssignAsset={onAssignAsset}
                  onUnassignAsset={onUnassignAsset}
                  onScheduleAssignAsset={onScheduleAssignAsset}
                  onScheduleUnassignAsset={onScheduleUnassignAsset}
                  onRemoveScheduledAssignAsset={onRemoveScheduledAssignAsset}
                  onRemoveScheduledUnassignAsset={onRemoveScheduledUnassignAsset}
                  onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
                  hidePositionTitle
                  positionCatalog={positionCatalog}
                  isUpdatingPositionIdentity={
                    isUpdatingPositionIdentity === managedEntry.position
                  }
                  onSaveCustomPosition={onSaveCustomPosition}
                  onCreateResourceCategory={onCreateResourceCategory}
                  onDeleteResourceCategory={onDeleteResourceCategory}
                  onScheduleResourceCategoryForNextOp={onScheduleResourceCategoryForNextOp}
                  onFillResourceCategoryMember={onFillResourceCategoryMember}
                  onFillResourceCategoryAsset={onFillResourceCategoryAsset}
                  onClearResourceCategoryFill={onClearResourceCategoryFill}
                  haveLinkIndexByRef={haveLinkIndexByRef}
                  activeHaveCell={activeHaveCell}
                  highlightedHaveRef={highlightedHaveRef}
                  haveLinkPickMode={haveLinkPickMode}
                  canRemoveFromRoster={canRemovePositionFromRoster?.(managedEntry) ?? false}
                  removalBlockedReason={positionRemovalBlockedReason?.(managedEntry) ?? null}
                  isRemovingFromRoster={isDeletingCustomPosition === managedEntry.position}
                  onRemoveFromRoster={
                    onRemovePositionFromRoster
                      ? () => {
                          onRemovePositionFromRoster(managedEntry.position)
                          setManagedPosition(null)
                        }
                      : undefined
                  }
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
