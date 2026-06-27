import { useMemo, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Ics202ReadOnlyField } from '@/features/ics202/Ics202SectionToolbar'
import { WorkAssignmentTargetPicker } from '@/features/work-assignments/WorkAssignmentTargetPicker'
import { Ics215HaveRosterLinkDialog } from '@/features/ics215/Ics215HaveAssetLinkDialog'
import { Ics215HaveCell, HaveLinkSparkleButton } from '@/features/ics215/Ics215HaveCell'
import type { Ics215ResourceValue } from '@/features/ics215/types'
import {
  EMPTY_RESOURCE_VALUE,
  applyIcs215NeedRecalc,
  computeIcs215Need,
  formatResourceValueDisplay,
  ICS215_OVERFLOW_COLUMNS,
  type Ics215WorkAssignmentsTableBaseProps,
  useIcs215WorkAssignmentsTable,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import { useIcs215HaveRosterLink } from '@/features/ics215/useIcs215HaveAssetLink'
import { isHaveLinkedToRoster, resolveHaveDisplayValue } from '@/features/ics215/ics215-have-asset-link'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { mergeLegacyWorkAssignmentTargetOptions } from '@/lib/work-assignment-target-options'
import { normalizeWorkAssignmentTargetValue } from '@/lib/work-assignment-target'
import { validateWorkAssignmentAssigneeSelection } from '@/lib/work-assignment-target-options'
import { toast } from 'sonner'
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
  onRequiredChange,
  onManualHaveChange,
  onOpenHaveLinkDialog,
}: {
  value: Ics215ResourceValue
  editing: boolean
  canLinkAssets?: boolean
  columnLabel: string
  onRequiredChange: (next: string) => void
  onManualHaveChange: (have: string) => void
  onOpenHaveLinkDialog: () => void
}) {
  if (!editing) {
    const linked = isHaveLinkedToRoster(value)
    const display = formatResourceValueDisplay(value)
    if (linked && resolveHaveDisplayValue(value).length > 0) {
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
      <input
        value={value.required}
        onChange={(event) => onRequiredChange(event.target.value)}
        placeholder="R"
        title="Required"
        className="h-7 w-full rounded border bg-transparent px-1 text-[11px] outline-none"
      />
      <Ics215HaveCell
        value={value}
        editing={editing}
        canLinkAssets={canLinkAssets}
        columnLabel={columnLabel}
        onManualChange={onManualHaveChange}
        onOpenLinkDialog={onOpenHaveLinkDialog}
      />
      <span
        title="Need (Required − Have)"
        className="flex h-7 items-center rounded border border-transparent bg-muted/20 px-1 text-[11px] text-muted-foreground"
      >
        {computeIcs215Need(value.required, resolveHaveDisplayValue(value)) || '—'}
      </span>
    </div>
  )
}

export function Ics215WorkAssignmentsSpreadsheetTable({
  resourceColumns,
  workAssignments,
  workAssignmentTargetOptions,
  roster = [],
  positionRosterEntries = [],
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
  onPersistWorkAssignments,
  createHaveLinkRosterActions,
  showPositionAssets = true,
  tableLayout = 'default',
}: Ics215WorkAssignmentsSpreadsheetTableProps) {
  const {
    hideAssigneeColumn,
    columnTotals,
    patchRow,
    patchResourceValue,
    patchResourceField,
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

  const assetsByKey = useMemo(
    () => Object.fromEntries(workspaceAssets.map((asset) => [asset.assetKey, asset])),
    [workspaceAssets]
  )

  const haveLink = useIcs215HaveRosterLink({
    workAssignments,
    resourceColumns,
    workspaceAssets,
    workAssignmentTargetOptions,
    roster,
    positionRosterEntries,
    assetsByKey,
    showPositionAssets,
    workspaceId,
    isSupabaseEnabled,
    getAccessToken,
    onApplyWorkAssignmentsDraft: onChange,
    onPersistWorkAssignments,
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

  const isMaximized = tableLayout === 'maximized'
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const totalsScrollRef = useRef<HTMLDivElement>(null)

  const syncHorizontalScroll = (source: 'body' | 'totals') => {
    const bodyEl = bodyScrollRef.current
    const totalsEl = totalsScrollRef.current
    if (!bodyEl || !totalsEl) return
    if (source === 'body') {
      totalsEl.scrollLeft = bodyEl.scrollLeft
    } else {
      bodyEl.scrollLeft = totalsEl.scrollLeft
    }
  }

  const spreadsheetTotalsFoot =
    workAssignments.length > 0 ? (
      <tfoot>
        <tr className="border-t bg-muted/20">
          <td colSpan={leadingColumnCount} className="px-2 py-2 text-[11px] font-semibold">
            Totals
          </td>
          {resourceColumns.map((column) => (
            <td key={column.id} className={cn(resourceColumnClass, 'px-2 py-2')}>
              <ResourceValueCell
                value={applyIcs215NeedRecalc(columnTotals[column.id] ?? EMPTY_RESOURCE_VALUE)}
                editing={false}
                columnLabel={column.label}
                onRequiredChange={() => undefined}
                onManualHaveChange={() => undefined}
                onOpenHaveLinkDialog={() => undefined}
              />
            </td>
          ))}
          <td colSpan={ICS215_OVERFLOW_COLUMNS.length + (editing ? 1 : 0)} />
        </tr>
      </tfoot>
    ) : null

  return (
    <>
      <div
        className={cn(
          'min-w-0 w-full max-w-full',
          isMaximized ? 'flex h-full min-h-0 flex-1 flex-col' : 'space-y-2'
        )}
      >
        <div
          className={cn(
            'min-w-0 w-full max-w-full overflow-hidden rounded-md border',
            isMaximized && 'flex h-full min-h-0 flex-1 flex-col'
          )}
        >
          <div
            ref={bodyScrollRef}
            onScroll={() => {
              if (isMaximized) syncHorizontalScroll('body')
            }}
            className={cn(
              'w-0 min-w-full overscroll-x-contain touch-pan-x [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]',
              isMaximized ? 'h-0 min-h-0 flex-1 overflow-auto' : 'overflow-x-auto'
            )}
            tabIndex={0}
            aria-label="Work assignments table — scroll horizontally to view additional columns"
          >
            <table
              className="w-full border-collapse text-xs"
              style={{ minWidth: `${tableMinWidthPx}px` }}
            >
              <thead>
                <tr
                  className={cn(
                    'border-b bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground',
                    isMaximized && 'sticky top-0 z-10'
                  )}
                >
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
                          <span className="block normal-case">{column.label}</span>
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
                                onChange={(value) => {
                                  const validationError = validateWorkAssignmentAssigneeSelection(
                                    value,
                                    targetOptionsForRow
                                  )
                                  if (validationError) {
                                    toast.error(validationError)
                                    return
                                  }
                                  patchRow(row.id, {
                                    assignee: normalizeWorkAssignmentTargetValue(value, roster),
                                  })
                                }}
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
                              onRequiredChange={(next) =>
                                patchResourceField(row.id, column.id, 'required', next)
                              }
                              onManualHaveChange={(have) =>
                                haveLink.patchManualHave(row.id, column.id, have)
                              }
                              onOpenHaveLinkDialog={() =>
                                openHaveLinkWithEdit({
                                  rowId: row.id,
                                  columnId: column.id,
                                  columnLabel: column.label,
                                  mode: isHaveLinkedToRoster(
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
              {!isMaximized ? spreadsheetTotalsFoot : null}
            </table>
          </div>
          {isMaximized && spreadsheetTotalsFoot ? (
            <div
              ref={totalsScrollRef}
              onScroll={() => syncHorizontalScroll('totals')}
              className="shrink-0 overflow-x-auto border-t bg-muted/20 [scrollbar-gutter:stable]"
              aria-label="Work assignments totals"
            >
              <table
                className="w-full border-collapse text-xs"
                style={{ minWidth: `${tableMinWidthPx}px` }}
              >
                {spreadsheetTotalsFoot}
              </table>
            </div>
          ) : null}
        </div>
        {!isMaximized ? (
          <p className="text-[10px] text-muted-foreground">
            Scroll horizontally to view additional columns.
          </p>
        ) : null}
      </div>

      <Ics215HaveRosterLinkDialog
        open={haveLink.dialogOpen}
        onOpenChange={(open) => {
          if (!open) haveLink.closeHaveLinkDialog()
        }}
        columnLabel={haveLink.dialogState?.columnLabel ?? ''}
        workAssignmentContext={haveLink.dialogState?.workAssignmentContext}
        workspaceAssets={workspaceAssets}
        haveLinkTargetOptions={haveLink.haveLinkTargetOptions}
        positionRosterEntries={positionRosterEntries}
        roster={roster}
        initialSelectedRefs={haveLink.dialogInitialSelectedRefs}
        suggestedRefs={haveLink.suggestedRefs}
        staleLinkedRefs={haveLink.staleLinkedRefs}
        linkedRefLocations={haveLink.linkedRefLocations}
        mode={haveLink.dialogState?.mode ?? 'create'}
        isLoading={haveLink.isRanking}
        rankingEngine={haveLink.rankingEngine}
        onConfirm={haveLink.confirmHaveLink}
        onUnlinkFromOtherCell={haveLink.unlinkRefFromOtherCell}
        createHaveLinkRosterActions={createHaveLinkRosterActions}
        showPositionAssets={showPositionAssets}
      />
    </>
  )
}
