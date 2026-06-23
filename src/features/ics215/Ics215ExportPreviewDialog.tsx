import { Eye, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ICS215_FORM_TITLE_LINES } from '@/features/ics215/constants'
import {
  ICS215_PREVIEW_STACK_CLASS,
  ics215PreviewSegmentRowClass,
} from '@/features/ics215/export-box-stack'
import {
  ICS215_LEGACY_KINDS_HEADER_LABEL,
  ICS215_LEGACY_RHN_FIELDS,
  ICS215_LEGACY_RHN_LABELS,
  ICS215_LEGACY_TOTAL_ROWS,
} from '@/features/ics215/export-legacy-table'
import type { Ics215PreparedByFooter } from '@/features/ics215/export-layout'
import type {
  Ics215PhysicalPage,
  Ics215WorkAssignmentsTableSegment,
} from '@/features/ics215/export-pagination'

type Ics215ExportPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  pages: Ics215PhysicalPage[]
  onExportWord: () => void
  onExportPdf: () => void
}

const verticalHeaderClass =
  '[writing-mode:vertical-rl] [text-orientation:mixed] inline-flex items-center justify-center px-0.5 py-2'

function renderWorkAssignmentsTable(
  segment: Ics215WorkAssignmentsTableSegment,
  index: number,
  isFirstInStack: boolean,
  preparedByFooter?: Ics215PreparedByFooter
) {
  const resourceCount = segment.resourceColumns.length
  const gridTemplate =
    resourceCount > 0
      ? `minmax(4.5rem,0.85fr) minmax(6rem,1.1fr) minmax(1.25rem,0.25fr) minmax(1.25rem,0.25fr) repeat(${resourceCount}, minmax(1.25rem,0.25fr)) minmax(4rem,0.75fr) minmax(4rem,0.75fr) minmax(4rem,0.75fr) minmax(3.5rem,0.6fr)`
      : 'minmax(4.5rem,0.85fr) minmax(6rem,1.1fr) minmax(1.25rem,0.25fr) minmax(1.25rem,0.25fr) minmax(4rem,0.75fr) minmax(4rem,0.75fr) minmax(4rem,0.75fr) minmax(3.5rem,0.6fr)'

  const showContinuedLabel = segment.label.includes('(Continued)')

  return (
    <div
      key={`ics215-seg-${index}`}
      className={ics215PreviewSegmentRowClass(isFirstInStack)}
    >
      {showContinuedLabel ? (
        <div className="mb-1 px-1 text-[10px] font-semibold">{segment.label}</div>
      ) : null}
      <div className="overflow-x-auto">
        {segment.showTableHeader ? (
          <div
            className="grid gap-0 border border-b-0 border-zinc-900 text-[8px] font-semibold"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span className="border-r border-zinc-900 p-1">5. Division/Group</span>
            <span className="border-r border-zinc-900 p-1">6. Work Assignments</span>
            <span className={`border-r border-zinc-900 ${verticalHeaderClass}`}>
              {ICS215_LEGACY_KINDS_HEADER_LABEL}
            </span>
            <span className="border-r border-zinc-900 p-1" />
            {segment.resourceColumns.map((column) => (
              <span key={column.id} className={`border-r border-zinc-900 ${verticalHeaderClass}`}>
                {column.label}
              </span>
            ))}
            <span className="border-r border-zinc-900 p-1">8. Overhead</span>
            <span className="border-r border-zinc-900 p-1">9. Special Equip</span>
            <span className="border-r border-zinc-900 p-1">10. Reporting</span>
            <span className="p-1">11. Arrival</span>
          </div>
        ) : null}
        <div>
          {segment.rows.length === 0 ? (
            <p className="min-h-[2rem] border border-zinc-900 p-1 text-[10px]"> </p>
          ) : (
            <table className="w-full border-collapse border border-zinc-900 text-[9px]">
              <tbody>
                {segment.rows.flatMap((row, rowIndex) =>
                  ICS215_LEGACY_RHN_FIELDS.map((field, rhnIndex) => (
                    <tr
                      key={`ics215-row-${rowIndex}-${field}`}
                      className="border-b border-solid border-zinc-900"
                    >
                      {rhnIndex === 0 ? (
                        <td
                          rowSpan={3}
                          className="border-r border-zinc-900 p-1 align-top whitespace-pre-wrap"
                        >
                          {row.assignee || ' '}
                        </td>
                      ) : null}
                      {rhnIndex === 0 ? (
                        <td
                          rowSpan={3}
                          className="border-r border-zinc-900 p-1 align-top whitespace-pre-wrap"
                        >
                          {row.workAssignment || ' '}
                        </td>
                      ) : null}
                      {rhnIndex === 0 ? (
                        <td rowSpan={3} className="border-r border-zinc-900 p-1" />
                      ) : null}
                      <td className="border-r border-zinc-900 bg-zinc-50 p-1 text-right font-semibold uppercase">
                        {ICS215_LEGACY_RHN_LABELS[rhnIndex]}
                      </td>
                      {segment.resourceColumns.map((column) => {
                        const value = row.resourceValues[column.id]
                        return (
                          <td
                            key={`${column.id}-${field}`}
                            className="border-r border-zinc-900 p-1 text-center"
                          >
                            {value?.[field]?.trim() || ' '}
                          </td>
                        )
                      })}
                      {rhnIndex === 0 ? (
                        <>
                          <td
                            rowSpan={3}
                            className="border-r border-zinc-900 p-1 align-top whitespace-pre-wrap"
                          >
                            {row.overheadPositions || ' '}
                          </td>
                          <td
                            rowSpan={3}
                            className="border-r border-zinc-900 p-1 align-top whitespace-pre-wrap"
                          >
                            {row.specialEquipmentSupplies || ' '}
                          </td>
                          <td
                            rowSpan={3}
                            className="border-r border-zinc-900 p-1 align-top whitespace-pre-wrap"
                          >
                            {row.reportingLocation || ' '}
                          </td>
                          <td rowSpan={3} className="p-1 align-top whitespace-pre-wrap">
                            {row.requestedArrivalTime || ' '}
                          </td>
                        </>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {segment.showResourceTotalsFooter ? (
          <div>
            {ICS215_LEGACY_TOTAL_ROWS.map((totalRow) => (
              <div
                key={totalRow.field}
                className="grid gap-0 border border-t-0 border-zinc-900 text-[9px] font-semibold last:border-t"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <span className="col-span-2 border-r border-zinc-900 p-1">{totalRow.label}</span>
                <span className="border-r border-zinc-900 p-1" />
                <span className="border-r border-zinc-900 bg-zinc-50 p-1 text-right uppercase">
                  {ICS215_LEGACY_RHN_LABELS[ICS215_LEGACY_RHN_FIELDS.indexOf(totalRow.field)]}
                </span>
                {segment.resourceColumns.map((column) => {
                  const totals = segment.columnTotals[column.id]
                  return (
                    <span
                      key={`${column.id}-${totalRow.field}`}
                      className="border-r border-zinc-900 p-1 text-center"
                    >
                      {totals?.[totalRow.field]?.trim() || ' '}
                    </span>
                  )
                })}
                <span className="border-r border-zinc-900 p-1" />
                <span className="border-r border-zinc-900 p-1" />
                <span className="border-r border-zinc-900 p-1" />
                <span className="p-1" />
              </div>
            ))}
          </div>
        ) : null}
        {segment.showPreparedByFooter && preparedByFooter ? (
          <div
            className="grid gap-0 border border-t-0 border-zinc-900 text-[9px]"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span
              className="border-r border-zinc-900 p-1"
              style={{ gridColumn: `span ${4 + resourceCount}` }}
            />
            <span
              className="col-span-4 border-zinc-900 p-2"
              style={{ gridColumn: `span 4` }}
            >
              <p className="font-semibold">{preparedByFooter.label}</p>
              <p className="font-semibold">Name:</p>
              <p className="whitespace-pre-wrap">{preparedByFooter.name.trim() || ' '}</p>
              <p className="font-semibold">Position/Title:</p>
              <p className="whitespace-pre-wrap">{preparedByFooter.positionTitle.trim() || ' '}</p>
              <p className="font-semibold">Date/Time:</p>
              <p className="whitespace-pre-wrap">{preparedByFooter.dateTime.trim() || ' '}</p>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function renderHeaderInfoGrid(page: Ics215PhysicalPage) {
  return (
    <div className="mb-0 border border-b-0 border-zinc-900 text-[10px]">
      <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-zinc-900">
        <div className="border-r border-zinc-900 p-2">
          <p className="font-semibold">{page.headerCells[0].label}</p>
          <p className="whitespace-pre-wrap">{page.headerCells[0].value.trim() || ' '}</p>
        </div>
        <div className="border-r border-zinc-900 p-2">
          <p className="font-semibold">{page.headerCells[2].label}</p>
          <p className="whitespace-pre-wrap">{page.headerCells[2].value.trim() || ' '}</p>
        </div>
        <div className="p-2">
          <p className="font-semibold">4. Operational Period (Date/Time):</p>
          <p className="whitespace-pre-wrap">{page.operationalPeriod.trim() || ' '}</p>
        </div>
      </div>
      <div className="grid grid-cols-[2fr_1fr_1fr]">
        <div className="border-r border-zinc-900 p-2">
          <p className="font-semibold">{page.headerCells[1].label}</p>
          <p className="whitespace-pre-wrap">{page.headerCells[1].value.trim() || ' '}</p>
        </div>
        <div className="col-span-2 p-2" />
      </div>
    </div>
  )
}

function renderPreviewPage(page: Ics215PhysicalPage) {
  return (
    <div
      key={`ics215-page-${page.displayPageNumber}`}
      className="border border-zinc-400 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 space-y-1 text-center">
        {ICS215_FORM_TITLE_LINES.map((line, index) => (
          <p
            key={line}
            className={
              index === ICS215_FORM_TITLE_LINES.length - 1
                ? 'text-sm font-bold'
                : 'text-[10px] uppercase tracking-wide'
            }
          >
            {line}
          </p>
        ))}
      </div>
      {renderHeaderInfoGrid(page)}
      <div className={ICS215_PREVIEW_STACK_CLASS}>
        {page.segments.map((segment, index) =>
          renderWorkAssignmentsTable(segment, index, index === 0, page.preparedByFooter)
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-600">
        <span>{page.footerLeft}</span>
        <span>
          Page {page.displayPageNumber} of {page.totalPages}
        </span>
      </div>
    </div>
  )
}

export function Ics215ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  pages,
  onExportWord,
  onExportPdf,
}: Ics215ExportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            USCG ICS 215-CG legacy layout preview. REQ / HAVE / NEED stack vertically per
            assignment; resource kinds continue on additional pages when needed.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-6 text-[13px] leading-relaxed text-zinc-900">
            {pages.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">Nothing to preview yet.</div>
            ) : (
              pages.map(renderPreviewPage)
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-row items-center justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            onClick={onExportWord}
          >
            <FileText className="h-3.5 w-3.5" />
            Export Word
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
            onClick={onExportPdf}
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
