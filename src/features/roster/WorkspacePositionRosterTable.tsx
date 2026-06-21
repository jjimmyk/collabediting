import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
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
  PositionPermissionsSection,
  PositionPropertiesSection,
} from '@/features/roster/PositionRosterPropertySections'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import { cn } from '@/lib/utils'

type WorkspacePositionRosterTableProps = {
  entries: PositionRosterEntry[]
  displayFilters: RosterDisplayFilters
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
  onAssignExistingMember: (memberId: string, position: string) => void
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
  showPositionAssets?: boolean
  assignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  pocMembers?: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
  onFocusAsset?: (asset: ResourceListItemData) => void
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
        <div
          key={`${entry.position}-${member.id}`}
          className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2 py-1"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs">{member.email}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant={member.status === 'active' ? 'default' : 'outline'}
                className="h-4 px-1.5 text-[9px]"
              >
                {member.status === 'active' ? 'Active' : 'Invited'}
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
          {canManageRoster && canUnassignNow && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${member.email} from ${entry.position}`}
              disabled={isAssigningPosition === entry.position}
              onClick={() => onUnassignMember(member.id, entry.position)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

export function WorkspacePositionRosterTable({
  entries,
  displayFilters,
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
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
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
}: WorkspacePositionRosterTableProps) {
  const tableColumnCount =
    3 +
    (showPositionAssets ? 1 : 0) +
    (showAllowWorkAssignment ? 1 : 0) +
    (showOpAdvanceLabels ? 1 : 0) +
    (canManageRoster ? 1 : 0)
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(() => new Set())
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('')

  const filteredEntries = useMemo(() => {
    const normalizedQuery = assignedSearchQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (!positionMatchesRosterDisplayFilters(entry, displayFilters)) {
        return false
      }
      if (!normalizedQuery) return true
      if (entry.position.toLowerCase().includes(normalizedQuery)) return true
      return [...entry.members, ...entry.scheduledAssignees].some((member) =>
        [member.email, member.status, member.addedAt].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })
  }, [assignedSearchQuery, displayFilters, entries])

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
            {showAllowWorkAssignment ? (
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
              const assignable = assignableByPosition[entry.position] ?? []
              const scheduleAssignable = scheduleAssignableByPosition[entry.position] ?? []
              const scheduleUnassignable = scheduleUnassignableByPosition[entry.position] ?? []
              const assignableAssets = assignableAssetsByPosition[entry.position] ?? []
              const scheduleAssignableAssets =
                scheduleAssignableAssetsByPosition[entry.position] ?? []
              const scheduleUnassignableAssets =
                scheduleUnassignableAssetsByPosition[entry.position] ?? []
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
                  {showAllowWorkAssignment && onToggleAllowWorkAssignment ? (
                    <TableCell className="align-top">
                      <PositionPropertiesSection
                        entry={entry}
                        canManageRoster={canManageRoster}
                        isBusy={isUpdatingPermission === entry.position}
                        showAllowWorkAssignment={showAllowWorkAssignment}
                        onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
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
                        {entry.memberSchedulePolicy.allowActiveAssignment ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            className="h-7 gap-1 px-2 text-[11px]"
                            disabled={isAssigningPosition === entry.position}
                            onClick={() => onInviteToPosition(entry.position, 'assign_now')}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add user
                          </Button>
                        ) : null}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2 text-[11px]"
                              disabled={isAssigningPosition === entry.position}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Manage
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-[min(32rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto p-3"
                          >
                            <PositionRosterDetailPanel
                              entry={entry}
                              assignable={assignable}
                              scheduleAssignable={scheduleAssignable}
                              scheduleUnassignable={scheduleUnassignable}
                              canManageRoster={canManageRoster}
                              isPermissionBusy={isUpdatingPermission === entry.position}
                              isAssignBusy={isAssigningPosition === entry.position}
                              showOpAdvanceLabels={showOpAdvanceLabels}
                              positionMeta={positionMetaByName[entry.position]}
                              isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel === entry.position}
                              onOpAdvanceLabelChange={
                                onOpAdvanceLabelChange
                                  ? (label) => onOpAdvanceLabelChange(entry.position, label)
                                  : undefined
                              }
                              onToggleEditIcs201={onToggleEditIcs201}
                              showAllowWorkAssignment={showAllowWorkAssignment}
                              onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
                              onAssignExistingMember={onAssignExistingMember}
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
                              showPositionAssets={showPositionAssets}
                              assignableAssets={assignableAssets}
                              scheduleAssignableAssets={scheduleAssignableAssets}
                              scheduleUnassignableAssets={scheduleUnassignableAssets}
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
                            />
                          </PopoverContent>
                        </Popover>
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
    </div>
  )
}
