import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { PositionOpAdvanceLabelSelect } from '@/features/roster/PositionOpAdvanceLabelSelect'
import { assignExistingMembersEmptyMessage } from '@/features/roster/position-roster-messages'
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
  onAssignExistingMember: (memberId: string, position: string) => void
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

function MemberRow({
  member,
  badgeLabel,
  canManage,
  isBusy,
  removeLabel,
  onRemove,
}: {
  member: WorkspaceRosterMember
  badgeLabel: string
  canManage: boolean
  isBusy: boolean
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{member.email}</p>
        <Badge variant="outline" className="mt-0.5 h-4 px-1.5 text-[9px]">
          {badgeLabel}
        </Badge>
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
  onAssignExistingMember,
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
}: PositionRosterDetailPanelProps) {
  const policy = entry.memberSchedulePolicy
  const assignExistingEmptyMessage = assignExistingMembersEmptyMessage(entry, assignable.length)
  const canAssignNow = policy.allowActiveAssignment
  const canScheduleAssign = policy.allowScheduleAssign
  const canScheduleUnassign = policy.allowScheduleUnassign

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

      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
        <Label htmlFor={`edit-ics201-panel-${entry.position}`} className="text-xs">
          Edit ICS-201
        </Label>
        <Switch
          id={`edit-ics201-panel-${entry.position}`}
          size="sm"
          checked={entry.editIcs201}
          disabled={!canManageRoster || isPermissionBusy}
          onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
        />
      </div>

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

      <div className="space-y-1.5">
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
            />
          ))
        )}
      </div>

      {entry.scheduledAssignees.length > 0 || canScheduleAssign ? (
        <div className="space-y-1.5">
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
              />
            ))
          )}
        </div>
      ) : null}

      {entry.scheduledUnassignees.length > 0 || canScheduleUnassign ? (
        <div className="space-y-1.5">
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
              />
            ))
          )}
        </div>
      ) : null}

      {canManageRoster ? (
        <>
          {canAssignNow ? (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs font-medium text-muted-foreground">Assign existing member now</p>
              {assignable.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-muted-foreground">
                  {assignExistingEmptyMessage}
                </p>
              ) : (
                assignable.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start truncate text-xs"
                    disabled={isAssignBusy}
                    onClick={() => onAssignExistingMember(member.id, entry.position)}
                  >
                    {member.email}
                  </Button>
                ))
              )}
            </div>
          ) : null}

          {canScheduleAssign ? (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Schedule assign for next OP
              </p>
              {scheduleAssignable.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-muted-foreground">
                  No roster members available to schedule.
                </p>
              ) : (
                scheduleAssignable.map((member) => (
                  <Button
                    key={`schedule-assign-${member.id}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start truncate text-xs"
                    disabled={isAssignBusy}
                    onClick={() => onScheduleAssignMember(member.id, entry.position)}
                  >
                    {member.email}
                  </Button>
                ))
              )}
            </div>
          ) : null}

          {canScheduleUnassign ? (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Schedule unassign for next OP
              </p>
              {scheduleUnassignable.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-muted-foreground">
                  No assigned members can be scheduled to unassign.
                </p>
              ) : (
                scheduleUnassignable.map((member) => (
                  <Button
                    key={`schedule-unassign-${member.id}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start truncate text-xs"
                    disabled={isAssignBusy}
                    onClick={() => onScheduleUnassignMember(member.id, entry.position)}
                  >
                    {member.email}
                  </Button>
                ))
              )}
            </div>
          ) : null}

          {canAssignNow ? (
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 w-full gap-1 text-xs"
              disabled={isAssignBusy}
              onClick={() => onInviteToPosition(entry.position)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add new user
            </Button>
          ) : canScheduleAssign ? (
            <p className="text-[11px] text-muted-foreground">
              Add new users to another position first, then schedule them here for next OP.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
