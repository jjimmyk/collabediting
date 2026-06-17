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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { RosterInviteAssignmentMode } from '@/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  filterPositionRosterEntriesByAssignment,
  filterPositionRosterMembers,
  formatPositionAssignmentCount,
} from '@/features/roster/workspace-position-roster'
import { PositionOpAdvanceLabelSelect } from '@/features/roster/PositionOpAdvanceLabelSelect'
import { PositionRosterDetailPanel } from '@/features/roster/PositionRosterDetailPanel'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import { cn } from '@/lib/utils'

type WorkspacePositionRosterTableProps = {
  entries: PositionRosterEntry[]
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
  onAssignExistingMember: (memberId: string, position: string) => void
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  onDeleteCustomPosition?: (position: string) => void
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
}

function AssignedMembersList({
  entry,
  assignedSearchQuery,
  canManageRoster,
  isAssigningPosition,
  onUnassignMember,
}: {
  entry: PositionRosterEntry
  assignedSearchQuery: string
  canManageRoster: boolean
  isAssigningPosition: string | null
  onUnassignMember: (memberId: string, position: string) => void
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
          <div className="min-w-0">
            <p className="truncate text-xs">{member.email}</p>
            <Badge
              variant={member.status === 'active' ? 'default' : 'outline'}
              className="mt-0.5 h-4 px-1.5 text-[9px]"
            >
              {member.status === 'active' ? 'Active' : 'Invited'}
            </Badge>
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
  onDeleteCustomPosition,
  onOpAdvanceLabelChange,
}: WorkspacePositionRosterTableProps) {
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(() => new Set())
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('')
  const [assignedStatusFilter, setAssignedStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>(
    'all'
  )

  const filteredEntries = useMemo(
    () =>
      filterPositionRosterEntriesByAssignment(entries, {
        searchQuery: assignedSearchQuery,
        status: assignedStatusFilter,
      }),
    [assignedSearchQuery, assignedStatusFilter, entries]
  )

  const hasActiveAssignedFilters =
    assignedSearchQuery.trim().length > 0 || assignedStatusFilter !== 'all'

  const clearAssignedFilters = () => {
    setAssignedSearchQuery('')
    setAssignedStatusFilter('all')
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
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
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
                  <Select
                    value={assignedStatusFilter}
                    onValueChange={(value: 'all' | 'assigned' | 'unassigned') =>
                      setAssignedStatusFilter(value)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All positions</SelectItem>
                      <SelectItem value="assigned">Assigned only</SelectItem>
                      <SelectItem value="unassigned">Unassigned only</SelectItem>
                    </SelectContent>
                  </Select>
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
            <TableHead className="w-[7rem] align-bottom">Edit ICS-201</TableHead>
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
                colSpan={canManageRoster ? (showOpAdvanceLabels ? 5 : 4) : showOpAdvanceLabels ? 4 : 3}
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
              const isExpanded = expandedPositions.has(entry.position)
              const scheduledCount =
                entry.scheduledAssignees.length + entry.scheduledUnassignees.length
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
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`edit-ics201-table-${entry.position}`}
                        size="sm"
                        checked={entry.editIcs201}
                        disabled={!canManageRoster || isUpdatingPermission === entry.position}
                        onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
                      />
                      <Label
                        htmlFor={`edit-ics201-table-${entry.position}`}
                        className="sr-only"
                      >
                        Edit ICS-201 for {entry.position}
                      </Label>
                    </div>
                  </TableCell>
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
                          <PopoverContent align="start" className="w-72 p-3">
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
                              onAssignExistingMember={onAssignExistingMember}
                              onScheduleAssignMember={onScheduleAssignMember}
                              onScheduleUnassignMember={onScheduleUnassignMember}
                              onRemoveScheduledAssign={onRemoveScheduledAssign}
                              onRemoveScheduledUnassign={onRemoveScheduledUnassign}
                              onInviteToPosition={onInviteToPosition}
                              onUnassignMember={onUnassignMember}
                            />
                          </PopoverContent>
                        </Popover>
                        {entry.isCustom && onDeleteCustomPosition ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-[11px] text-destructive hover:text-destructive"
                            disabled={isDeletingCustomPosition === entry.position}
                            onClick={() => onDeleteCustomPosition(entry.position)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
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
