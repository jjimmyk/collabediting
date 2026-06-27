import { Button } from '@/components/ui/button'
import { Ics233AssigneeSelect } from '@/features/ics233/Ics233AssigneeSelect'
import { Ics233StatusSelect } from '@/features/ics233/Ics233StatusSelect'
import {
  getIcs233AssignmentValue,
  type Ics233ActionStatus,
  type Ics233AssignmentOption,
  type Ics233TaskRow,
} from '@/lib/ics233-workflow'

type Ics233ActionComposeRowProps = {
  draft: Ics233TaskRow
  assignmentOptions: Ics233AssignmentOption[]
  pointOfContactOptions: readonly string[]
  onUpdateField: <K extends keyof Omit<Ics233TaskRow, 'id'>>(
    field: K,
    value: Ics233TaskRow[K]
  ) => void
  onUpdateAssignment: (assignmentValue: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function Ics233ActionComposeRow({
  draft,
  assignmentOptions,
  pointOfContactOptions,
  onUpdateField,
  onUpdateAssignment,
  onCommit,
  onCancel,
}: Ics233ActionComposeRowProps) {
  return (
    <tr className="border-b bg-primary/5 align-top">
      <td className="px-2 py-2">
        <input
          value={draft.task}
          onChange={(event) => onUpdateField('task', event.target.value)}
          placeholder="Describe the action..."
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
          autoFocus
        />
      </td>
      <td className="px-2 py-2">
        <Ics233AssigneeSelect
          value={getIcs233AssignmentValue(draft)}
          options={assignmentOptions}
          onChange={onUpdateAssignment}
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={draft.pointOfContact}
          onChange={(event) => onUpdateField('pointOfContact', event.target.value)}
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
        >
          <option value="">Select POC...</option>
          {pointOfContactOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          value={draft.pocBriefed}
          onChange={(event) =>
            onUpdateField('pocBriefed', event.target.value as 'Yes' | 'No')
          }
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <input
          type="datetime-local"
          value={draft.start}
          onChange={(event) => onUpdateField('start', event.target.value)}
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="datetime-local"
          value={draft.deadline}
          onChange={(event) => onUpdateField('deadline', event.target.value)}
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
        />
      </td>
      <td className="px-2 py-2">
        <Ics233StatusSelect
          value={draft.status}
          isAssignedToCurrentUser={false}
          onChange={(status) => onUpdateField('status', status as Ics233ActionStatus)}
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <Button type="button" size="sm" onClick={onCommit}>
            Assign
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  )
}
