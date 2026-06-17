import { useState } from 'react'
import { CalendarClock, Plus, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { PositionOpAdvanceLabelSelect } from '@/features/roster/PositionOpAdvanceLabelSelect'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import {
  assignExistingMembersEmptyMessage,
  scheduleAssignMembersEmptyMessage,
  scheduleUnassignMembersEmptyMessage,
  type PositionRosterInlineInviteProps,
  type RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import { PositionRosterInviteForm } from '@/features/roster/PositionRosterInviteForm'
import {
  PositionPermissionsSection,
  PositionPropertiesSection,
} from '@/features/roster/PositionRosterPropertySections'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'

type PositionRosterDetailPanelProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  scheduleAssignable: WorkspaceRosterMember[]
  scheduleUnassignable: WorkspaceRosterMember[]
  canManageRoster: boolean
  isPermissionBusy: boolean
  isAssignBusy: boolean
  showOpAdvanceLabels?: boolean
  positionMeta?: WorkspacePositionMeta
  isUpdatingOpAdvanceLabel?: boolean
  onOpAdvanceLabelChange?: (label: PositionOpAdvanceLabel) => void
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
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
}

function MemberRow({
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
  emptyMessage,
  onSelect,
}: {
  label: string
  members: WorkspaceRosterMember[]
  disabled: boolean
  emptyMessage: string
  onSelect: (memberId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1 pt-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-full gap-1 text-xs"
            disabled={disabled || members.length === 0}
            aria-haspopup="dialog"
            aria-expanded={open}
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
      {members.length === 0 && emptyMessage ? (
        <p className="px-1 text-[11px] text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </div>
  )
}

function SectionInviteButton({
  label,
  disabled,
  expanded,
  onClick,
}: {
  label: string
  disabled: boolean
  expanded: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={expanded ? 'secondary' : 'default'}
      className="mt-1 h-7 w-full gap-1 text-xs"
      disabled={disabled}
      onClick={onClick}
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      {expanded ? 'Cancel' : label}
    </Button>
  )
}

function SectionInlineInvite({
  position,
  mode,
  expanded,
  disabled,
  inlinePositionInvite,
  onToggle,
}: {
  position: string
  mode: RosterInviteAssignmentMode
  expanded: boolean
  disabled: boolean
  inlinePositionInvite: PositionRosterInlineInviteProps
  onToggle: () => void
}) {
  return (
    <>
      <SectionInviteButton
        label="Assign new user"
        disabled={disabled}
        expanded={expanded}
        onClick={onToggle}
      />
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
    </>
  )
}

export function PositionRosterDetailPanel({
  entry,
  assignable,
  scheduleAssignable,
  scheduleUnassignable,
  canManageRoster,
  isPermissionBusy,
  isAssignBusy,
  showOpAdvanceLabels = false,
  positionMeta,
  isUpdatingOpAdvanceLabel = false,
  onOpAdvanceLabelChange,
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
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
}: PositionRosterDetailPanelProps) {
  const [expandedInviteMode, setExpandedInviteMode] = useState<RosterInviteAssignmentMode | null>(
    null
  )
  const policy = entry.memberSchedulePolicy
  const assignExistingEmptyMessage = assignExistingMembersEmptyMessage(entry, assignable.length)
  const scheduleAssignEmptyMessage = scheduleAssignMembersEmptyMessage(scheduleAssignable.length)
  const scheduleUnassignEmptyMessage = scheduleUnassignMembersEmptyMessage(
    entry,
    scheduleUnassignable.length
  )
  const canAssignNow = policy.allowActiveAssignment
  const canScheduleAssign = policy.allowScheduleAssign
  const canScheduleUnassign = policy.allowScheduleUnassign

  const toggleInlineInvite = (mode: RosterInviteAssignmentMode) => {
    setExpandedInviteMode((previous) => (previous === mode ? null : mode))
  }

  const memberRowCheckInProps = {
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{entry.position}</p>
        <PositionLifecycleBadges entry={entry} />
        <p className="text-xs text-muted-foreground">
          {canManageRoster
            ? 'Manage assignees and permissions for this position.'
            : 'View assignees and permissions for this position.'}
        </p>
        {entry.isPlanned ? (
          <p className="text-[11px] text-muted-foreground">
            This position activates on the next operational period. Schedule members for next OP
            instead of assigning them now.
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

      <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
        <p className="text-xs font-medium text-muted-foreground">Assigned now</p>
        {entry.members.length === 0 ? (
          <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
            No members assigned yet.
          </p>
        ) : (
          entry.members.map((member) => (
            <MemberRow
              key={`panel-now-${entry.position}-${member.id}`}
              member={member}
              badgeLabel={member.status === 'active' ? 'Active' : 'Invited'}
              canManage={canManageRoster && canAssignNow}
              isBusy={isAssignBusy}
              removeLabel={`Remove ${member.email} from ${entry.position}`}
              onRemove={() => onUnassignMember(member.id, entry.position)}
              {...memberRowCheckInProps}
            />
          ))
        )}
        {canManageRoster && canAssignNow ? (
          <>
            <MemberPickerPopover
              label="Assign existing member"
              members={assignable}
              disabled={isAssignBusy}
              emptyMessage={assignExistingEmptyMessage}
              onSelect={(memberId) => onAssignExistingMember(memberId, entry.position)}
            />
            {inlinePositionInvite ? (
              <SectionInlineInvite
                position={entry.position}
                mode="assign_now"
                expanded={expandedInviteMode === 'assign_now'}
                disabled={isAssignBusy}
                inlinePositionInvite={inlinePositionInvite}
                onToggle={() => toggleInlineInvite('assign_now')}
              />
            ) : (
              <SectionInviteButton
                label="Assign new user"
                disabled={isAssignBusy}
                expanded={false}
                onClick={() => onInviteToPosition(entry.position, 'assign_now')}
              />
            )}
          </>
        ) : null}
      </div>

      {entry.scheduledAssignees.length > 0 || canScheduleAssign ? (
        <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled assign (next OP)
          </p>
          {entry.scheduledAssignees.length === 0 ? (
            <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
              No members scheduled to assign.
            </p>
          ) : (
            entry.scheduledAssignees.map((member) => (
              <MemberRow
                key={`panel-sched-assign-${entry.position}-${member.id}`}
                member={member}
                badgeLabel="Next OP"
                canManage={canManageRoster}
                isBusy={isAssignBusy}
                removeLabel={`Remove ${member.email} from next OP assign schedule`}
                onRemove={() => onRemoveScheduledAssign(member.id, entry.position)}
                {...memberRowCheckInProps}
              />
            ))
          )}
          {canManageRoster && canScheduleAssign ? (
            <>
              <MemberPickerPopover
                label="Schedule assign for next OP"
                members={scheduleAssignable}
                disabled={isAssignBusy}
                emptyMessage={scheduleAssignEmptyMessage}
                onSelect={(memberId) => onScheduleAssignMember(memberId, entry.position)}
              />
              {inlinePositionInvite ? (
                <SectionInlineInvite
                  position={entry.position}
                  mode="schedule_on_op_advance"
                  expanded={expandedInviteMode === 'schedule_on_op_advance'}
                  disabled={isAssignBusy}
                  inlinePositionInvite={inlinePositionInvite}
                  onToggle={() => toggleInlineInvite('schedule_on_op_advance')}
                />
              ) : (
                <SectionInviteButton
                  label="Assign new user"
                  disabled={isAssignBusy}
                  expanded={false}
                  onClick={() => onInviteToPosition(entry.position, 'schedule_on_op_advance')}
                />
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {entry.scheduledUnassignees.length > 0 || canScheduleUnassign ? (
        <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled unassign (next OP)
          </p>
          {entry.scheduledUnassignees.length === 0 ? (
            <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
              No members scheduled to unassign.
            </p>
          ) : (
            entry.scheduledUnassignees.map((member) => (
              <MemberRow
                key={`panel-sched-unassign-${entry.position}-${member.id}`}
                member={member}
                badgeLabel="Next OP"
                canManage={canManageRoster}
                isBusy={isAssignBusy}
                removeLabel={`Remove ${member.email} from next OP unassign schedule`}
                onRemove={() => onRemoveScheduledUnassign(member.id, entry.position)}
                {...memberRowCheckInProps}
              />
            ))
          )}
          {canManageRoster && canScheduleUnassign ? (
            <MemberPickerPopover
              label="Schedule unassign for next OP"
              members={scheduleUnassignable}
              disabled={isAssignBusy}
              emptyMessage={scheduleUnassignEmptyMessage}
              onSelect={(memberId) => onScheduleUnassignMember(memberId, entry.position)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
