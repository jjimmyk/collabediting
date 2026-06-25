import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Ics202ReadOnlyField } from '@/features/ics202/Ics202SectionToolbar'
import { WorkAssignmentTargetPicker } from '@/features/work-assignments/WorkAssignmentTargetPicker'
import { ResourceHaveFillButton } from '@/features/resources/ResourceHaveFillButton'
import { Ics215HaveAssetLinkDialog } from '@/features/ics215/Ics215HaveAssetLinkDialog'
import { Ics215HaveCell, HaveLinkSparkleButton } from '@/features/ics215/Ics215HaveCell'
import type { Ics215ResourceValue } from '@/features/ics215/types'
import {
  EMPTY_RESOURCE_VALUE,
  formatResourceValueDisplay,
  ICS215_OVERFLOW_COLUMNS,
  type Ics215WorkAssignmentsTableBaseProps,
  useIcs215WorkAssignmentsTable,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import { useIcs215HaveAssetLink } from '@/features/ics215/useIcs215HaveAssetLink'
import { isHaveLinkedToAssets } from '@/features/ics215/ics215-have-asset-link'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { mergeLegacyWorkAssignmentTargetOptions } from '@/lib/work-assignment-target-options'
import { normalizeWorkAssignmentTargetValue } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type Ics215WorkAssignmentsSpreadsheetTableProps = Ics215WorkAssignmentsTableBaseProps & {
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  roster?: WorkspaceRosterMember[]
  competencyOptions?: string[]
}

function ResourceValueCell({
  value,
  editing,
  canLinkAssets = false,
  columnLabel,
  onChange,
  onManualHaveChange,
  onOpenHaveLinkDialog,
}: {
  value: Ics215ResourceValue
  editing: boolean
  canLinkAssets?: boolean
  columnLabel: string
  onChange: (next: Ics215ResourceValue) => void
  onManualHaveChange: (have: string) => void
  onOpenHaveLinkDialog: () => void
}) {
  if (!editing) {
    const linked = isHaveLinkedToAssets(value)
    const display = formatResourceValueDisplay(value)
    if (linked && value.have.trim().length > 0) {
      return (
        <div className="flex items-start gap-0.5">
          {canLinkAssets ? (
            <HaveLinkSparkleButton
              columnLabel={columnLabel}
              onOpenLinkDialog={onOpenHaveLinkDialog}
            />
          ) : null}
          <button
            type="button"
            className="block min-w-0 flex-1 px-1 py-1 text-left text-[11px] leading-tight underline decoration-dotted underline-offset-2 hover:bg-muted/40"
            onClick={onOpenHaveLinkDialog}
          >
            {display}
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-start gap-0.5">
        {canLinkAssets ? (
          <HaveLinkSparkleButton
            columnLabel={columnLabel}
            onOpenLinkDialog={onOpenHaveLinkDialog}
          />
        ) : null}
        <span className="block min-w-0 flex-1 px-1 py-1 text-[11px] leading-tight">{display}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {(['required', 'have', 'need'] as const).map((field) =>
        field === 'have' ? (
          <Ics215HaveCell
            key={field}
            value={value}
            editing={editing}
            canLinkAssets={canLinkAssets}
            columnLabel={columnLabel}
            onManualChange={onManualHaveChange}
            onOpenLinkDialog={onOpenHaveLinkDialog}
          />
        ) : (
          <input
            key={field}
            value={value[field]}
            onChange={(event) => onChange({ ...value, [field]: event.target.value })}
            placeholder={field === 'required' ? 'R' : 'N'}
            title={field === 'required' ? 'Required' : 'Need'}
            className="h-7 w-full rounded border bg-transparent px-1 text-[11px] outline-none"
          />
        )
      )}
    </div>
  )
}

export function Ics215WorkAssignmentsSpreadsheetTable({
  resourceColumns,
  workAssignments,
  workAssignmentTargetOptions,
  roster = [],
  competencyOptions = [],
  workspaceAssets = [],
  workspaceId = null,
  isSupabaseEnabled = false,
  getAccessToken,
  autoFillHaveFromAssets = false,
  lockedAssignee,
  editing,
  canLinkAssets = false,
  onRequestEdit,
  onChange,
  onHaveFillComplete,
}: Ics215WorkAssignmentsSpreadsheetTableProps) {
  const {
    hideAssigneeColumn,
    columnTotals,
    patchRow,
    patchResourceValue,
    fillColumnHave,
    deleteAssignment,
    deleteResourceColumn,
    patchColumnLabel,
    fixedColumnClass,
    resourceColumnClass,
    overflowColumnClass,
    tableMinWidthPx,
    leadingColumnCount,
  } = useIcs215WorkAssignmentsTable({
    resourceColumns,
    workAssignments,
    workspaceAssets,
    autoFillHaveFromAssets,
    lockedAssignee,
    roster,
    editing,
    onChange,
    onHaveFillComplete,
  })

  const haveLink = useIcs215HaveAssetLink({
    workAssignments,
    resourceColumns,
    workspaceAssets,
    workAssignmentTargetOptions,
    workspaceId,
    isSupabaseEnabled,
    getAccessToken,
    patchResourceValue,
  })

  const openHaveLinkWithEdit = (
    params: Parameters<typeof haveLink.openHaveLinkDialog>[0]
  ) => {
    if (!editing) {
      onRequestEdit?.()
    }
    window.setTimeout(() => {
      void haveLink.openHaveLinkDialog(params)
    }, 0)
  }

  const buildWorkAssignmentContext = (assignee: string, workAssignment: string) => {
    const assigneeLabel =
      workAssignmentTargetOptions.find((option) => option.value === assignee)?.label ?? assignee
    const assignmentText = workAssignment.trim()
    return [assigneeLabel, assignmentText].filter(Boolean).join(' · ')
  }

  return (
    <>
      <div className="min-w-0 w-full max-w-full space-y-2">
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-md border">
          <div
            className="w-0 min-w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
            tabIndex={0}
            aria-label="Work assignments table — scroll horizontally to view additional columns"
          >
            <table
              className="w-full border-collapse text-xs"
              style={{ minWidth: `${tableMinWidthPx}px` }}
            >
              <thead>
                <tr className="border-b bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {!hideAssigneeColumn ? (
                    <th className={cn(fixedColumnClass, 'px-2 py-2 text-left font-semibold')}>
                      Assignee
                    </th>
                  ) : null}
                  <th className={cn(fixedColumnClass, 'px-2 py-2 text-left font-semibold')}>
                    Work Assignment
                  </th>
                  {resourceColumns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(resourceColumnClass, 'px-2 py-2 text-left font-semibold')}
                    >
                      <div className="space-y-1">
                        {editing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={column.label}
                              onChange={(event) => patchColumnLabel(column.id, event.target.value)}
                              onBlur={() => {
                                if (autoFillHaveFromAssets) {
                                  fillColumnHave(column.id, column.label, false)
                                }
                              }}
                              className="h-7 min-w-[5.5rem] flex-1 rounded border bg-transparent px-1 text-[11px] font-semibold normal-case outline-none"
                            />
                            <ResourceHaveFillButton
                              resourceName={column.label}
                              workspaceAssets={workspaceAssets}
                              onFill={() => haveLink.previewColumnMatches(column.label)}
                            />
                            {resourceColumns.length > 1 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${column.label} column`}
                                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => deleteResourceColumn(column.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 normal-case">
                            <span className="block">{column.label}</span>
                            {canLinkAssets ? (
                              <ResourceHaveFillButton
                                resourceName={column.label}
                                workspaceAssets={workspaceAssets}
                                onFill={() => haveLink.previewColumnMatches(column.label)}
                              />
                            ) : null}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-1 text-[9px] font-normal normal-case">
                          <span>Req</span>
                          <span>Have</span>
                          <span>Need</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  {ICS215_OVERFLOW_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={cn(overflowColumnClass, 'px-2 py-2 text-left font-semibold')}
                    >
                      {column.label}
                    </th>
                  ))}
                  {editing ? <th className="w-10 px-1 py-2" aria-label="Row actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {workAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        resourceColumns.length +
                        ICS215_OVERFLOW_COLUMNS.length +
                        leadingColumnCount +
                        (editing ? 1 : 0)
                      }
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No work assignments.
                    </td>
                  </tr>
                ) : (
                  workAssignments.map((row) => {
                    const targetOptionsForRow = mergeLegacyWorkAssignmentTargetOptions(
                      workAssignmentTargetOptions,
                      row.assignee,
                      roster
                    )
                    const workAssignmentContext = buildWorkAssignmentContext(
                      row.assignee,
                      row.workAssignment
                    )

                    return (
                      <tr key={row.id} className="border-b align-top">
                        {!hideAssigneeColumn ? (
                          <td className={cn(fixedColumnClass, 'px-2 py-2')}>
                            {editing ? (
                              <WorkAssignmentTargetPicker
                                value={row.assignee}
                                options={targetOptionsForRow}
                                editable
                                roster={roster}
                                competencyOptions={competencyOptions}
                                showMemberCompetencyEditor
                                selectClassName="text-xs font-normal"
                                onChange={(value) =>
                                  patchRow(row.id, {
                                    assignee: normalizeWorkAssignmentTargetValue(value, roster),
                                  })
                                }
                              />
                            ) : (
                              <Ics202ReadOnlyField
                                value={
                                  targetOptionsForRow.find((option) => option.value === row.assignee)
                                    ?.label ?? row.assignee
                                }
                              />
                            )}
                          </td>
                        ) : null}
                        <td className={cn(fixedColumnClass, 'px-2 py-2')}>
                          {editing ? (
                            <Textarea
                              value={row.workAssignment}
                              onChange={(event) =>
                                patchRow(row.id, { workAssignment: event.target.value })
                              }
                              className="min-h-16 text-xs"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap text-xs leading-relaxed">
                              {row.workAssignment.trim().length > 0 ? row.workAssignment : '—'}
                            </p>
                          )}
                        </td>
                        {resourceColumns.map((column) => (
                          <td key={column.id} className={cn(resourceColumnClass, 'px-2 py-2')}>
                            <ResourceValueCell
                              value={row.resourceValues[column.id] ?? EMPTY_RESOURCE_VALUE}
                              editing={editing}
                              canLinkAssets={canLinkAssets}
                              columnLabel={column.label}
                              onChange={(value) => patchResourceValue(row.id, column.id, value)}
                              onManualHaveChange={(have) =>
                                haveLink.patchManualHave(row.id, column.id, have)
                              }
                              onOpenHaveLinkDialog={() =>
                                openHaveLinkWithEdit({
                                  rowId: row.id,
                                  columnId: column.id,
                                  columnLabel: column.label,
                                  mode: isHaveLinkedToAssets(
                                    row.resourceValues[column.id] ?? EMPTY_RESOURCE_VALUE
                                  )
                                    ? 'review'
                                    : 'create',
                                  workAssignmentContext,
                                })
                              }
                            />
                          </td>
                        ))}
                        {ICS215_OVERFLOW_COLUMNS.map((column) => (
                          <td key={column.key} className={cn(overflowColumnClass, 'px-2 py-2')}>
                            {editing ? (
                              column.key === 'specialEquipmentSupplies' ? (
                                <Textarea
                                  value={row[column.key]}
                                  onChange={(event) =>
                                    patchRow(row.id, { [column.key]: event.target.value })
                                  }
                                  className="min-h-12 text-xs"
                                />
                              ) : (
                                <input
                                  value={row[column.key]}
                                  onChange={(event) =>
                                    patchRow(row.id, { [column.key]: event.target.value })
                                  }
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                              )
                            ) : (
                              <Ics202ReadOnlyField value={row[column.key]} />
                            )}
                          </td>
                        ))}
                        {editing ? (
                          <td className="px-1 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Delete work assignment"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteAssignment(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    )
                  })
                )}
              </tbody>
              {workAssignments.length > 0 ? (
                <tfoot>
                  <tr className="border-t bg-muted/20">
                    <td colSpan={leadingColumnCount} className="px-2 py-2 text-[11px] font-semibold">
                      Totals
                    </td>
                    {resourceColumns.map((column) => (
                      <td key={column.id} className={cn(resourceColumnClass, 'px-2 py-2')}>
                        <ResourceValueCell
                          value={columnTotals[column.id] ?? EMPTY_RESOURCE_VALUE}
                          editing={false}
                          columnLabel={column.label}
                          onChange={() => undefined}
                          onManualHaveChange={() => undefined}
                          onOpenHaveLinkDialog={() => undefined}
                        />
                      </td>
                    ))}
                    <td colSpan={ICS215_OVERFLOW_COLUMNS.length + (editing ? 1 : 0)} />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Scroll horizontally to view additional columns.
        </p>
      </div>

      <Ics215HaveAssetLinkDialog
        open={haveLink.dialogOpen}
        onOpenChange={(open) => {
          if (!open) haveLink.closeHaveLinkDialog()
        }}
        columnLabel={haveLink.dialogState?.columnLabel ?? ''}
        workAssignmentContext={haveLink.dialogState?.workAssignmentContext}
        workspaceAssets={workspaceAssets}
        initialSelectedKeys={haveLink.dialogInitialSelectedKeys}
        suggestedKeys={haveLink.suggestedKeys}
        staleLinkedKeys={haveLink.staleLinkedKeys}
        linkedAssetLocations={haveLink.linkedAssetLocations}
        mode={haveLink.dialogState?.mode ?? 'create'}
        isLoading={haveLink.isRanking}
        rankingEngine={haveLink.rankingEngine}
        onConfirm={haveLink.confirmHaveLink}
        onUnlinkFromOtherCell={haveLink.unlinkAssetFromOtherCell}
      />
    </>
  )
}
