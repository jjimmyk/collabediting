import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { assignExistingMembersEmptyMessage } from '@/features/roster/position-roster-messages'

type PositionRosterDetailPanelProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  canManageRoster: boolean
  isPermissionBusy: boolean
  isAssignBusy: boolean
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

export function PositionRosterDetailPanel({
  entry,
  assignable,
  canManageRoster,
  isPermissionBusy,
  isAssignBusy,
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: PositionRosterDetailPanelProps) {
  const assignExistingEmptyMessage = assignExistingMembersEmptyMessage(entry, assignable.length)

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
            This position activates on the next operational period. Assignments are saved now.
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

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Assigned</p>
        {entry.members.length === 0 ? (
          <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
            No members assigned yet.
          </p>
        ) : (
          entry.members.map((member) => (
            <div
              key={`panel-${entry.position}-${member.id}`}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{member.email}</p>
                <Badge
                  variant={member.status === 'active' ? 'default' : 'outline'}
                  className="mt-0.5 h-4 px-1.5 text-[9px]"
                >
                  {member.status === 'active' ? 'Active' : 'Invited'}
                </Badge>
              </div>
              {canManageRoster ? (
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
              ) : null}
            </div>
          ))
        )}
      </div>

      {canManageRoster ? (
        <>
          <div className="space-y-1 border-t pt-2">
            <p className="text-xs font-medium text-muted-foreground">Assign existing member</p>
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
        </>
      ) : null}
    </div>
  )
}
