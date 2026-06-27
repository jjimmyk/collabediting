import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Ics233AssigneeSelect } from '@/features/ics233/Ics233AssigneeSelect'
import { Ics233StatusSelect } from '@/features/ics233/Ics233StatusSelect'
import {
  formatIcs233AssigneeLabel,
  getIcs233AssignmentValue,
  isCurrentUserAssignedToIcs233Action,
  type Ics233ActionStatus,
  type Ics233AssignmentContext,
  type Ics233AssignmentOption,
  type Ics233TaskRow,
} from '@/lib/ics233-workflow'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type Ics233ActionDetailDialogProps = {
  row: Ics233TaskRow | null
  isEditing: boolean
  assignmentOptions: Ics233AssignmentOption[]
  pointOfContactOptions: readonly string[]
  roster: WorkspaceRosterMember[]
  assignmentContext: Ics233AssignmentContext
  profileEmail: string | null | undefined
  onOpenChange: (open: boolean) => void
  onToggleEditing: () => void
  onDelete: (rowId: number) => void
  onUpdateField: <K extends keyof Omit<Ics233TaskRow, 'id'>>(
    rowId: number,
    field: K,
    value: Ics233TaskRow[K]
  ) => void
  onAssign: (rowId: number, assignmentValue: string) => void
  onUpdateStatus: (rowId: number, status: Ics233ActionStatus) => void
}

export function Ics233ActionDetailDialog({
  row,
  isEditing,
  assignmentOptions,
  pointOfContactOptions,
  roster,
  assignmentContext,
  profileEmail,
  onOpenChange,
  onToggleEditing,
  onDelete,
  onUpdateField,
  onAssign,
  onUpdateStatus,
}: Ics233ActionDetailDialogProps) {
  if (!row) {
    return null
  }

  const assigneeLabel = formatIcs233AssigneeLabel(row, roster, assignmentContext)
  const isAssignedToCurrentUser = isCurrentUserAssignedToIcs233Action(
    row,
    profileEmail,
    roster,
    assignmentContext
  )

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[68vw] !max-w-[68vw] sm:!max-w-[68vw]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">ICS-233 Task Detail</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={onToggleEditing}>
                {isEditing ? 'Done' : 'Edit'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(row.id)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2 space-y-1">
              <p className="font-semibold">Task</p>
              {isEditing ? (
                <input
                  value={row.task}
                  onChange={(event) => onUpdateField(row.id, 'task', event.target.value)}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <p className="rounded-md border px-2 py-2">{row.task}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Assignee</p>
              {isEditing ? (
                <Ics233AssigneeSelect
                  value={getIcs233AssignmentValue(row)}
                  options={assignmentOptions}
                  onChange={(value) => onAssign(row.id, value)}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <p className="rounded-md border px-2 py-2">{assigneeLabel}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Point of Contact</p>
              {isEditing ? (
                <select
                  value={row.pointOfContact}
                  onChange={(event) =>
                    onUpdateField(row.id, 'pointOfContact', event.target.value)
                  }
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                >
                  {pointOfContactOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-md border px-2 py-2">{row.pointOfContact}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">POC Briefed</p>
              {isEditing ? (
                <select
                  value={row.pocBriefed}
                  onChange={(event) =>
                    onUpdateField(row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                  }
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <p className="rounded-md border px-2 py-2">{row.pocBriefed}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Start</p>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={row.start}
                  onChange={(event) => onUpdateField(row.id, 'start', event.target.value)}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <p className="rounded-md border px-2 py-2">{row.start.replace('T', ' ')}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Deadline</p>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={row.deadline}
                  onChange={(event) => onUpdateField(row.id, 'deadline', event.target.value)}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <p className="rounded-md border px-2 py-2">{row.deadline.replace('T', ' ')}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Status</p>
              {isEditing || isAssignedToCurrentUser ? (
                <Ics233StatusSelect
                  value={row.status}
                  isAssignedToCurrentUser={isAssignedToCurrentUser}
                  onChange={(status) => {
                    if (isAssignedToCurrentUser) {
                      onUpdateStatus(row.id, status)
                    } else {
                      onUpdateField(row.id, 'status', status)
                    }
                  }}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <p className="rounded-md border px-2 py-2">{row.status}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
