import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Ics202ReadOnlyField } from '@/features/ics202/Ics202SectionToolbar'
import { WorkAssignmentTargetPicker } from '@/features/work-assignments/WorkAssignmentTargetPicker'
import { Ics215HaveAssetLinkDialog } from '@/features/ics215/Ics215HaveAssetLinkDialog'
import { Ics215HaveCell } from '@/features/ics215/Ics215HaveCell'
import { isHaveLinkedToAssets } from '@/features/ics215/ics215-have-asset-link'
import { useIcs215HaveAssetLink } from '@/features/ics215/useIcs215HaveAssetLink'
import type { Ics215ResourceValue } from '@/features/ics215/types'
import {
  EMPTY_RESOURCE_VALUE,
  ICS215_OVERFLOW_COLUMNS,
  type Ics215WorkAssignmentsTableBaseProps,
  useIcs215WorkAssignmentsTable,
} from '@/features/ics215/ics215-work-assignments-table-shared'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { mergeLegacyWorkAssignmentTargetOptions } from '@/lib/work-assignment-target-options'
import { normalizeWorkAssignmentTargetValue } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type Ics215WorkAssignmentsLegacyTableProps = Ics215WorkAssignmentsTableBaseProps & {
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  roster?: WorkspaceRosterMember[]
  competencyOptions?: string[]
}

const RHN_ROWS = [
  { field: 'required' as const, label: 'REQ' },
  { field: 'have' as const, label: 'HAVE' },
  { field: 'need' as const, label: 'NEED' },
]

const TOTAL_ROWS = [
  { field: 'required' as const, label: '12. Total Required' },
  { field: 'have' as const, label: '13. Total On Hand' },
  { field: 'need' as const, label: '14. Total Needed' },
]

function LegacyResourceValueCell({
  value,
  field,
  editing,
  canLinkAssets = false,
  columnLabel,
  onChange,
  onManualHaveChange,
  onOpenHaveLinkDialog,
}: {
  value: Ics215ResourceValue
  field: 'required' | 'have' | 'need'
  editing: boolean
  canLinkAssets?: boolean
  columnLabel: string
  onChange: (nextValue: string) => void
  onManualHaveChange?: (have: string) => void
  onOpenHaveLinkDialog?: () => void
}) {
  if (field === 'have') {
    return (
      <Ics215HaveCell
        value={value}
        editing={editing}
        canLinkAssets={canLinkAssets}
        columnLabel={columnLabel}
        onManualChange={onManualHaveChange ?? onChange}
        onOpenLinkDialog={onOpenHaveLinkDialog ?? (() => undefined)}
      />
    )
  }

  const display = value[field].trim()
  if (!editing) {
    return (
      <span className="block px-1 py-1 text-[11px] leading-tight">
        {display.length > 0 ? display : '—'}
      </span>
    )
  }

  return (
    <input
      value={value[field]}
      onChange={(event) => onChange(event.target.value)}
      className="h-7 w-full rounded border bg-transparent px-1 text-center text-[11px] outline-none"
    />
  )
}

function renderOverflowCell(
  row: Ics215WorkAssignmentsTableBaseProps['workAssignments'][number],
  columnKey: (typeof ICS215_OVERFLOW_COLUMNS)[number]['key'],
  editing: boolean,
  overflowColumnClass: string,
  onPatch: (patch: Partial<typeof row>) => void
) {
  return (
    <td key={columnKey} className={cn(overflowColumnClass, 'px-2 py-2')}>
      {editing ? (
        columnKey === 'specialEquipmentSupplies' ? (
          <Textarea
            value={row[columnKey]}
            onChange={(event) => onPatch({ [columnKey]: event.target.value })}
            className="min-h-12 text-xs"
          />
        ) : (
          <input
            value={row[columnKey]}
            onChange={(event) => onPatch({ [columnKey]: event.target.value })}
            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
          />
        )
      ) : (
        <Ics202ReadOnlyField value={row[columnKey]} />
      )}
    </td>
  )
}

export function Ics215WorkAssignmentsLegacyTable({
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
  onPersistWorkAssignments,
  tableLayout = 'default',
}: Ics215WorkAssignmentsLegacyTableProps) {
  const {
    hideAssigneeColumn,
    columnTotals,
    patchRow,
    patchResourceField,
    patchResourceValue,
    fillColumnHave,
    deleteAssignment,
    deleteResourceColumn,
    patchColumnLabel,
    fixedColumnClass,
    legacyResourceColumnClass,
    overflowColumnClass,
    rhnStubColumnClass,
    legacyTableMinWidthPx,
    leadingColumnCount,
    autoFillHaveFromAssets: autoFillEnabled,
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

  const rhnColumnCount = 1
  const totalColSpan =
    leadingColumnCount +
    rhnColumnCount +
    resourceColumns.length +
    ICS215_OVERFLOW_COLUMNS.length +
    (editing ? 1 : 0)

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

  const legacyTotalsFoot =
    workAssignments.length > 0 ? (
      <tfoot>
        {TOTAL_ROWS.map((totalRow, totalIndex) => (
          <tr
            key={totalRow.field}
            className={cn(
              'border-t bg-muted/20',
              totalIndex < TOTAL_ROWS.length - 1 ? 'border-b border-dashed' : ''
            )}
          >
            {totalIndex === 0 ? (
              <td
                colSpan={leadingColumnCount}
                rowSpan={TOTAL_ROWS.length}
                className="px-2 py-2 text-[10px] font-semibold leading-tight"
              >
                Totals
              </td>
            ) : null}
            <td
              className={cn(
                rhnStubColumnClass,
                'border-r bg-muted/10 px-1 py-1 text-center text-[8px] font-semibold leading-tight text-muted-foreground'
              )}
            >
              {totalRow.label}
            </td>
            {resourceColumns.map((column) => {
              const totals = columnTotals[column.id] ?? EMPTY_RESOURCE_VALUE
              return (
                <td
                  key={column.id}
                  className={cn(legacyResourceColumnClass, 'border-x px-1 py-1')}
                >
                  <span className="block px-1 py-1 text-[11px] leading-tight">
                    {totals[totalRow.field].trim().length > 0 ? totals[totalRow.field] : '—'}
                  </span>
                </td>
              )
            })}
            <td colSpan={ICS215_OVERFLOW_COLUMNS.length + (editing ? 1 : 0)} />
          </tr>
        ))}
      </tfoot>
    ) : null

  return (
    <>
    <div
      className={cn(
        'min-w-0 w-full max-w-full space-y-2',
        isMaximized && 'flex min-h-0 flex-1 flex-col'
      )}
    >
      <div
        className={cn(
          'min-w-0 w-full max-w-full overflow-hidden rounded-md border',
          isMaximized && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <div
          ref={bodyScrollRef}
          onScroll={() => {
            if (isMaximized) syncHorizontalScroll('body')
          }}
          className={cn(
            'w-0 min-w-full overscroll-x-contain touch-pan-x [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]',
            isMaximized ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto'
          )}
          tabIndex={0}
          aria-label="Work assignments table — scroll horizontally to view additional columns"
        >
          <table
            className="w-full border-collapse text-xs"
            style={{ minWidth: `${legacyTableMinWidthPx}px` }}
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
                <th className={cn(rhnStubColumnClass, 'px-1 py-2 text-center font-semibold')} />
                {resourceColumns.length > 0 ? (
                  <th
                    colSpan={resourceColumns.length}
                    className="border-x px-2 py-2 text-center font-semibold"
                  >
                    Kinds of Resources
                  </th>
                ) : (
                  <th className="px-2 py-2 text-left font-semibold">Kinds of Resources</th>
                )}
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
              {resourceColumns.length > 0 ? (
                <tr className="border-b bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {!hideAssigneeColumn ? <th className={fixedColumnClass} /> : null}
                  <th className={fixedColumnClass} />
                  <th className={rhnStubColumnClass} />
                  {resourceColumns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(legacyResourceColumnClass, 'px-1 py-2 font-semibold')}
                    >
                      {editing ? (
                        <div className="flex flex-col items-stretch gap-1 normal-case">
                          <div className="flex items-center gap-0.5">
                            <input
                              value={column.label}
                              onChange={(event) =>
                                patchColumnLabel(column.id, event.target.value)
                              }
                              onBlur={() => {
                                if (autoFillEnabled) {
                                  fillColumnHave(column.id, column.label, false)
                                }
                              }}
                              className="h-7 min-w-0 flex-1 rounded border bg-transparent px-1 text-[10px] font-semibold outline-none"
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
                        </div>
                      ) : (
                        <span className="block normal-case">{column.label}</span>
                      )}
                    </th>
                  ))}
                  {ICS215_OVERFLOW_COLUMNS.map((column) => (
                    <th key={column.key} className={overflowColumnClass} />
                  ))}
                  {editing ? <th /> : null}
                </tr>
              ) : null}
            </thead>
            <tbody>
              {workAssignments.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className="px-3 py-6 text-center text-muted-foreground">
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

                  return RHN_ROWS.map((rhnRow, rhnIndex) => (
                    <tr
                      key={`${row.id}-${rhnRow.field}`}
                      className={cn(
                        'align-top',
                        rhnIndex === RHN_ROWS.length - 1 ? 'border-b' : 'border-b border-dashed'
                      )}
                    >
                      {!hideAssigneeColumn && rhnIndex === 0 ? (
                        <td rowSpan={3} className={cn(fixedColumnClass, 'border-b px-2 py-2')}>
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
                      {rhnIndex === 0 ? (
                        <td rowSpan={3} className={cn(fixedColumnClass, 'border-b px-2 py-2')}>
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
                      ) : null}
                      <td
                        className={cn(
                          rhnStubColumnClass,
                          'border-r bg-muted/10 px-1 py-1 text-center text-[9px] font-semibold uppercase text-muted-foreground'
                        )}
                      >
                        {rhnRow.label}
                      </td>
                      {resourceColumns.map((column) => {
                        const value = row.resourceValues[column.id] ?? EMPTY_RESOURCE_VALUE
                        return (
                          <td
                            key={column.id}
                            className={cn(legacyResourceColumnClass, 'border-x px-1 py-1')}
                          >
                            <LegacyResourceValueCell
                              value={value}
                              field={rhnRow.field}
                              editing={editing}
                              canLinkAssets={canLinkAssets}
                              columnLabel={column.label}
                              onChange={(nextValue) =>
                                patchResourceField(row.id, column.id, rhnRow.field, nextValue)
                              }
                              onManualHaveChange={(have) =>
                                haveLink.patchManualHave(row.id, column.id, have)
                              }
                              onOpenHaveLinkDialog={() =>
                                openHaveLinkWithEdit({
                                  rowId: row.id,
                                  columnId: column.id,
                                  columnLabel: column.label,
                                  mode: isHaveLinkedToAssets(value) ? 'review' : 'create',
                                  workAssignmentContext,
                                })
                              }
                            />
                          </td>
                        )
                      })}
                      {rhnIndex === 0
                        ? ICS215_OVERFLOW_COLUMNS.map((column) =>
                            renderOverflowCell(
                              row,
                              column.key,
                              editing,
                              overflowColumnClass,
                              (patch) => patchRow(row.id, patch)
                            )
                          )
                        : null}
                      {rhnIndex === 0 && editing ? (
                        <td rowSpan={3} className="border-b px-1 py-2">
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
                  ))
                })
              )}
            </tbody>
            {!isMaximized ? legacyTotalsFoot : null}
          </table>
        </div>
        {isMaximized && legacyTotalsFoot ? (
          <div
            ref={totalsScrollRef}
            onScroll={() => syncHorizontalScroll('totals')}
            className="shrink-0 overflow-x-auto border-t bg-muted/20 [scrollbar-gutter:stable]"
            aria-label="Work assignments totals"
          >
            <table
              className="w-full border-collapse text-xs"
              style={{ minWidth: `${legacyTableMinWidthPx}px` }}
            >
              {legacyTotalsFoot}
            </table>
          </div>
        ) : null}
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
