import { Check, ChevronDown, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { Ics233ActionComposeRow } from '@/features/ics233/Ics233ActionComposeRow'
import { Ics233AssigneeSelect } from '@/features/ics233/Ics233AssigneeSelect'
import { Ics233StatusSelect } from '@/features/ics233/Ics233StatusSelect'
import { cn } from '@/lib/utils'
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

type Ics233CellEditField =
  | keyof Pick<
      Ics233TaskRow,
      'task' | 'pointOfContact' | 'pocBriefed' | 'start' | 'deadline' | 'status'
    >
  | 'assignment'

type Ics233ActionsPanelProps = {
  viewMode: 'table' | 'list'
  rows: Ics233TaskRow[]
  filteredRows: Ics233TaskRow[]
  totalRowCount: number
  composeDraft: Ics233TaskRow | null
  filters: {
    task: string
    assignee: string
    pointOfContact: string
    pocBriefed: string
    startMode: string
    start: string
    deadlineMode: string
    deadline: string
    status: string
  }
  assignmentOptions: Ics233AssignmentOption[]
  pointOfContactOptions: readonly string[]
  roster: WorkspaceRosterMember[]
  assignmentContext: Ics233AssignmentContext
  profileEmail: string | null | undefined
  glassItemBorderClasses: string
  activeCellEdit: { rowId: number; field: Ics233CellEditField } | null
  taskDraftEdit: { rowId: number; value: string } | null
  expandedRowId: number | null
  onFiltersChange: (
    updater: (previous: Ics233ActionsPanelProps['filters']) => Ics233ActionsPanelProps['filters']
  ) => void
  onSelectRow: (rowId: number) => void
  onUpdateRow: <K extends keyof Omit<Ics233TaskRow, 'id'>>(
    rowId: number,
    field: K,
    value: Ics233TaskRow[K]
  ) => void
  onAssignRow: (rowId: number, assignmentValue: string) => void
  onUpdateStatus: (rowId: number, status: Ics233ActionStatus) => void
  onDeleteRow: (rowId: number) => void
  onSetActiveCellEdit: (edit: { rowId: number; field: Ics233CellEditField } | null) => void
  onSetTaskDraftEdit: (edit: { rowId: number; value: string } | null) => void
  onSetExpandedRowId: (rowId: number | null) => void
  onUpdateComposeField: <K extends keyof Omit<Ics233TaskRow, 'id'>>(
    field: K,
    value: Ics233TaskRow[K]
  ) => void
  onUpdateComposeAssignment: (assignmentValue: string) => void
  onCommitCompose: () => void
  onCancelCompose: () => void
}

export function Ics233ActionsPanel({
  viewMode,
  rows,
  filteredRows,
  totalRowCount,
  composeDraft,
  filters,
  assignmentOptions,
  pointOfContactOptions,
  roster,
  assignmentContext,
  profileEmail,
  glassItemBorderClasses,
  activeCellEdit,
  taskDraftEdit,
  expandedRowId,
  onFiltersChange,
  onSelectRow,
  onUpdateRow,
  onAssignRow,
  onUpdateStatus,
  onDeleteRow,
  onSetActiveCellEdit,
  onSetTaskDraftEdit,
  onSetExpandedRowId,
  onUpdateComposeField,
  onUpdateComposeAssignment,
  onCommitCompose,
  onCancelCompose,
}: Ics233ActionsPanelProps) {
  if (viewMode === 'table') {
    return (
      <div className="px-3 py-2.5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1540px] border-collapse text-xs">
            <colgroup>
              <col className="w-[30rem]" />
              <col className="w-[16rem]" />
              <col className="w-[18rem]" />
              <col className="w-[10rem]" />
              <col className="w-[13rem]" />
              <col className="w-[13rem]" />
              <col className="w-[12rem]" />
              <col className="w-[10rem]" />
            </colgroup>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-2 py-2 font-semibold">Task</th>
                <th className="px-2 py-2 font-semibold">Assignee</th>
                <th className="px-2 py-2 font-semibold">Point of Contact</th>
                <th className="px-2 py-2 font-semibold">POC Briefed</th>
                <th className="px-2 py-2 font-semibold">Start</th>
                <th className="px-2 py-2 font-semibold">Deadline</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold" />
              </tr>
              <tr className="border-b bg-muted/20">
                <th className="px-2 py-2">
                  <input
                    value={filters.task}
                    onChange={(event) =>
                      onFiltersChange((previous) => ({
                        ...previous,
                        task: event.target.value,
                      }))
                    }
                    placeholder="Filter task..."
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.assignee}
                    onChange={(event) =>
                      onFiltersChange((previous) => ({
                        ...previous,
                        assignee: event.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="all">All</option>
                    {assignmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.pointOfContact}
                    onChange={(event) =>
                      onFiltersChange((previous) => ({
                        ...previous,
                        pointOfContact: event.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="all">All</option>
                    {pointOfContactOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.pocBriefed}
                    onChange={(event) =>
                      onFiltersChange((previous) => ({
                        ...previous,
                        pocBriefed: event.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="all">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </th>
                <th className="px-2 py-2">
                  <div className="space-y-1">
                    <select
                      value={filters.startMode}
                      onChange={(event) =>
                        onFiltersChange((previous) => ({
                          ...previous,
                          startMode: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="all">All</option>
                      <option value="before">Before</option>
                      <option value="after">After</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={filters.start}
                      onChange={(event) =>
                        onFiltersChange((previous) => ({
                          ...previous,
                          start: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  </div>
                </th>
                <th className="px-2 py-2">
                  <div className="space-y-1">
                    <select
                      value={filters.deadlineMode}
                      onChange={(event) =>
                        onFiltersChange((previous) => ({
                          ...previous,
                          deadlineMode: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="all">All</option>
                      <option value="before">Before</option>
                      <option value="after">After</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={filters.deadline}
                      onChange={(event) =>
                        onFiltersChange((previous) => ({
                          ...previous,
                          deadline: event.target.value,
                        }))
                      }
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  </div>
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.status}
                    onChange={(event) =>
                      onFiltersChange((previous) => ({
                        ...previous,
                        status: event.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="all">All</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Complete">Complete</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {composeDraft && (
                <Ics233ActionComposeRow
                  draft={composeDraft}
                  assignmentOptions={assignmentOptions}
                  pointOfContactOptions={pointOfContactOptions}
                  onUpdateField={onUpdateComposeField}
                  onUpdateAssignment={onUpdateComposeAssignment}
                  onCommit={onCommitCompose}
                  onCancel={onCancelCompose}
                />
              )}
              {filteredRows.length === 0 && !composeDraft && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-xs text-muted-foreground">
                    {rows.length === 0
                      ? 'No actions yet. Click + Add Action to create one.'
                      : 'No rows match the current filters.'}
                  </td>
                </tr>
              )}
              {filteredRows.map((row) => {
                const rowAssigneeLabel = formatIcs233AssigneeLabel(row, roster, assignmentContext)
                const isAssignedToCurrentUser = isCurrentUserAssignedToIcs233Action(
                  row,
                  profileEmail,
                  roster,
                  assignmentContext
                )
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b align-top last:border-b-0 hover:bg-muted/35"
                    onClick={() => onSelectRow(row.id)}
                  >
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id && activeCellEdit.field === 'task' ? (
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            value={
                              taskDraftEdit?.rowId === row.id ? taskDraftEdit.value : row.task
                            }
                            onChange={(event) =>
                              onSetTaskDraftEdit({ rowId: row.id, value: event.target.value })
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                onUpdateRow(
                                  row.id,
                                  'task',
                                  taskDraftEdit?.rowId === row.id ? taskDraftEdit.value : row.task
                                )
                                onSetActiveCellEdit(null)
                                onSetTaskDraftEdit(null)
                              }
                              if (event.key === 'Escape') {
                                onSetActiveCellEdit(null)
                                onSetTaskDraftEdit(null)
                              }
                            }}
                            className="h-8 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Save task edit"
                            className="h-8 w-8"
                            onClick={() => {
                              onUpdateRow(
                                row.id,
                                'task',
                                taskDraftEdit?.rowId === row.id ? taskDraftEdit.value : row.task
                              )
                              onSetActiveCellEdit(null)
                              onSetTaskDraftEdit(null)
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Cancel task edit"
                            className="h-8 w-8"
                            onClick={() => {
                              onSetActiveCellEdit(null)
                              onSetTaskDraftEdit(null)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'task' })
                            onSetTaskDraftEdit({ rowId: row.id, value: row.task })
                          }}
                        >
                          {row.task}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id &&
                      activeCellEdit.field === 'assignment' ? (
                        <Ics233AssigneeSelect
                          value={getIcs233AssignmentValue(row)}
                          options={assignmentOptions}
                          onChange={(value) => {
                            onAssignRow(row.id, value)
                            onSetActiveCellEdit(null)
                          }}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'assignment' })
                          }}
                        >
                          {rowAssigneeLabel}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id &&
                      activeCellEdit.field === 'pointOfContact' ? (
                        <select
                          value={row.pointOfContact}
                          onChange={(event) => {
                            onUpdateRow(row.id, 'pointOfContact', event.target.value)
                            onSetActiveCellEdit(null)
                          }}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          autoFocus
                        >
                          {pointOfContactOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'pointOfContact' })
                          }}
                        >
                          {row.pointOfContact}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id && activeCellEdit.field === 'pocBriefed' ? (
                        <select
                          value={row.pocBriefed}
                          onChange={(event) => {
                            onUpdateRow(row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                            onSetActiveCellEdit(null)
                          }}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          autoFocus
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'pocBriefed' })
                          }}
                        >
                          {row.pocBriefed}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id && activeCellEdit.field === 'start' ? (
                        <input
                          type="datetime-local"
                          value={row.start}
                          onChange={(event) => onUpdateRow(row.id, 'start', event.target.value)}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'start' })
                          }}
                        >
                          {row.start.replace('T', ' ')}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id && activeCellEdit.field === 'deadline' ? (
                        <input
                          type="datetime-local"
                          value={row.deadline}
                          onChange={(event) => onUpdateRow(row.id, 'deadline', event.target.value)}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'deadline' })
                          }}
                        >
                          {row.deadline.replace('T', ' ')}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {activeCellEdit?.rowId === row.id && activeCellEdit.field === 'status' ? (
                        <Ics233StatusSelect
                          value={row.status}
                          isAssignedToCurrentUser={isAssignedToCurrentUser}
                          onChange={(nextStatus) => {
                            if (isAssignedToCurrentUser) {
                              onUpdateStatus(row.id, nextStatus)
                            } else {
                              onUpdateRow(row.id, 'status', nextStatus)
                            }
                            onSetActiveCellEdit(null)
                          }}
                          onBlur={() => onSetActiveCellEdit(null)}
                          onClick={(event) => event.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full pt-1 text-left text-xs"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetActiveCellEdit({ rowId: row.id, field: 'status' })
                          }}
                        >
                          {row.status}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Delete ICS-233 row"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteRow(row.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 border-t px-3 py-2.5">
      {composeDraft && (
        <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
          <div className="space-y-2 px-3 py-2.5">
            <ItemTitle className="text-sm">New Action</ItemTitle>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={composeDraft.task}
                onChange={(event) => onUpdateComposeField('task', event.target.value)}
                placeholder="Task"
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none md:col-span-2"
                autoFocus
              />
              <Ics233AssigneeSelect
                value={getIcs233AssignmentValue(composeDraft)}
                options={assignmentOptions}
                onChange={onUpdateComposeAssignment}
              />
              <select
                value={composeDraft.pointOfContact}
                onChange={(event) => onUpdateComposeField('pointOfContact', event.target.value)}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              >
                <option value="">Select POC...</option>
                {pointOfContactOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={composeDraft.pocBriefed}
                onChange={(event) =>
                  onUpdateComposeField('pocBriefed', event.target.value as 'Yes' | 'No')
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <input
                type="datetime-local"
                value={composeDraft.start}
                onChange={(event) => onUpdateComposeField('start', event.target.value)}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
              <input
                type="datetime-local"
                value={composeDraft.deadline}
                onChange={(event) => onUpdateComposeField('deadline', event.target.value)}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
              <Ics233StatusSelect
                value={composeDraft.status}
                isAssignedToCurrentUser={false}
                onChange={(status) => onUpdateComposeField('status', status)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={onCommitCompose}>
                Assign
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onCancelCompose}>
                Cancel
              </Button>
            </div>
          </div>
        </Item>
      )}
      {filteredRows.map((row) => {
        const isOpen = expandedRowId === row.id
        const rowAssigneeLabel = formatIcs233AssigneeLabel(row, roster, assignmentContext)
        const isAssignedToCurrentUser = isCurrentUserAssignedToIcs233Action(
          row,
          profileEmail,
          roster,
          assignmentContext
        )
        return (
          <Item
            key={row.id}
            variant="outline"
            className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}
          >
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => onSetExpandedRowId(open ? row.id : null)}
            >
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                onClick={() => onSetExpandedRowId(isOpen ? null : row.id)}
              >
                <ItemContent>
                  <ItemTitle>{row.task || `Task #${row.id}`}</ItemTitle>
                  <ItemDescription>
                    {rowAssigneeLabel} • {row.status}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Delete ICS-233 row"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteRow(row.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Toggle ICS-233 row details"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </ItemActions>
              </div>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-2 border-t px-3 py-2.5 md:grid-cols-2">
                  <input
                    value={row.task}
                    onChange={(event) => onUpdateRow(row.id, 'task', event.target.value)}
                    placeholder="Task"
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <Ics233AssigneeSelect
                    value={getIcs233AssignmentValue(row)}
                    options={assignmentOptions}
                    onChange={(value) => onAssignRow(row.id, value)}
                  />
                  <select
                    value={row.pointOfContact}
                    onChange={(event) => onUpdateRow(row.id, 'pointOfContact', event.target.value)}
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    {pointOfContactOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.pocBriefed}
                    onChange={(event) =>
                      onUpdateRow(row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={row.start}
                    onChange={(event) => onUpdateRow(row.id, 'start', event.target.value)}
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <input
                    type="datetime-local"
                    value={row.deadline}
                    onChange={(event) => onUpdateRow(row.id, 'deadline', event.target.value)}
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <Ics233StatusSelect
                    value={row.status}
                    isAssignedToCurrentUser={isAssignedToCurrentUser}
                    onChange={(nextStatus) => {
                      if (isAssignedToCurrentUser) {
                        onUpdateStatus(row.id, nextStatus)
                      } else {
                        onUpdateRow(row.id, 'status', nextStatus)
                      }
                    }}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
      {filteredRows.length === 0 && !composeDraft && (
        <Item variant="outline" className={glassItemBorderClasses}>
          <ItemContent>
            <ItemTitle>{totalRowCount === 0 ? 'No actions yet' : 'No matching tasks'}</ItemTitle>
            <ItemDescription>
              {totalRowCount === 0
                ? 'Click + Add Action to create an open action for this workspace.'
                : 'Adjust the table filters to broaden results.'}
            </ItemDescription>
          </ItemContent>
        </Item>
      )}
    </div>
  )
}
