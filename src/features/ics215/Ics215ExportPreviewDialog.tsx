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

function PreviewBox({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-zinc-900">
      {label ? (
        <div className="border-b border-zinc-900 px-2 py-1 text-[11px] font-semibold">{label}</div>
      ) : null}
      <div className="overflow-x-auto px-2 py-2">{children}</div>
    </div>
  )
}

function renderWorkAssignmentsTable(segment: Ics215WorkAssignmentsTableSegment, index: number) {
  const resourceCount = segment.resourceColumns.length
  const gridTemplate =
    resourceCount > 0
      ? `minmax(5rem,0.9fr) minmax(7rem,1.2fr) repeat(${resourceCount * 3}, minmax(2.5rem,0.55fr)) minmax(5rem,0.9fr) minmax(5rem,0.9fr) minmax(5rem,0.9fr) minmax(4rem,0.7fr)`
      : 'minmax(5rem,0.9fr) minmax(7rem,1.2fr) minmax(5rem,0.9fr) minmax(5rem,0.9fr) minmax(5rem,0.9fr) minmax(4rem,0.7fr)'

  return (
    <PreviewBox key={`ics215-seg-${index}`} label={segment.label}>
      {segment.showTableHeader ? (
        <>
          <div
            className="mb-1 grid gap-1 text-[8px] font-semibold"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span>5. Division/Group</span>
            <span>6. Work Assignments</span>
            {resourceCount > 0 ? (
              segment.resourceColumns.map((column) => (
                <span key={column.id} className="col-span-3 text-center">
                  7. {column.label}
                </span>
              ))
            ) : null}
            <span>8. Overhead</span>
            <span>9. Special Equip</span>
            <span>10. Reporting</span>
            <span>11. Arrival</span>
          </div>
          {resourceCount > 0 ? (
            <div
              className="mb-1 grid gap-1 text-[8px] font-semibold"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <span />
              <span />
              {segment.resourceColumns.flatMap((column) => [
                <span key={`${column.id}-req`} className="text-center">
                  Req
                </span>,
                <span key={`${column.id}-have`} className="text-center">
                  Have
                </span>,
                <span key={`${column.id}-need`} className="text-center">
                  Need
                </span>,
              ])}
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </>
      ) : null}
      <div className="space-y-1">
        {segment.rows.length === 0 ? (
          <p className="min-h-[2rem] text-[10px]"> </p>
        ) : (
          segment.rows.map((row, rowIndex) => (
            <div
              key={`ics215-row-${rowIndex}`}
              className="grid gap-1 text-[9px]"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <span className="whitespace-pre-wrap">{row.assignee || ' '}</span>
              <span className="whitespace-pre-wrap">{row.workAssignment || ' '}</span>
              {segment.resourceColumns.flatMap((column) => {
                const value = row.resourceValues[column.id]
                return [
                  <span key={`${column.id}-req`} className="text-center">
                    {value?.required || ' '}
                  </span>,
                  <span key={`${column.id}-have`} className="text-center">
                    {value?.have || ' '}
                  </span>,
                  <span key={`${column.id}-need`} className="text-center">
                    {value?.need || ' '}
                  </span>,
                ]
              })}
              <span className="whitespace-pre-wrap">{row.overheadPositions || ' '}</span>
              <span className="whitespace-pre-wrap">{row.specialEquipmentSupplies || ' '}</span>
              <span className="whitespace-pre-wrap">{row.reportingLocation || ' '}</span>
              <span className="whitespace-pre-wrap">{row.requestedArrivalTime || ' '}</span>
            </div>
          ))
        )}
      </div>
      {segment.showColumnTotals ? (
        <div
          className="mt-1 grid gap-1 border-t border-zinc-300 pt-1 text-[9px] font-semibold"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <span>Column Totals</span>
          <span />
          {segment.resourceColumns.flatMap((column) => {
            const totals = segment.columnTotals[column.id]
            return [
              <span key={`${column.id}-req-t`} className="text-center">
                {totals?.required || ' '}
              </span>,
              <span key={`${column.id}-have-t`} className="text-center">
                {totals?.have || ' '}
              </span>,
              <span key={`${column.id}-need-t`} className="text-center">
                {totals?.need || ' '}
              </span>,
            ]
          })}
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {segment.showGrandTotals && segment.grandTotals ? (
        <div className="mt-2 space-y-1 border-t border-zinc-300 pt-1 text-[9px]">
          <p>
            <span className="font-semibold">12. Total Resources Required:</span>{' '}
            {segment.grandTotals.totalResourcesRequired || ' '}
          </p>
          <p>
            <span className="font-semibold">13. Total Resources Have on Hand:</span>{' '}
            {segment.grandTotals.totalResourcesHaveOnHand || ' '}
          </p>
          <p>
            <span className="font-semibold">14. Total Resources Need to Order:</span>{' '}
            {segment.grandTotals.totalResourcesNeedToOrder || ' '}
          </p>
        </div>
      ) : null}
    </PreviewBox>
  )
}

function renderPreparedByFooter(footer: Ics215PreparedByFooter) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2 border border-zinc-900 text-[9px]">
      <div className="border-r border-zinc-900 p-2">
        <p className="font-semibold">{footer.label}</p>
        <p className="mt-1 font-semibold">Name:</p>
        <p className="whitespace-pre-wrap">{footer.name.trim() || ' '}</p>
        <p className="mt-1 font-semibold">Date/Time:</p>
        <p className="whitespace-pre-wrap">{footer.dateTime.trim() || ' '}</p>
      </div>
      <div className="border-r border-zinc-900 p-2">
        <p className="font-semibold">Position/Title:</p>
        <p className="whitespace-pre-wrap">{footer.positionTitle.trim() || ' '}</p>
      </div>
      <div className="border-r border-zinc-900 p-2">
        <p className="font-semibold">Signature:</p>
        <p className="whitespace-pre-wrap">{footer.signature.trim() || ' '}</p>
      </div>
      <div className="p-2" />
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
      <div className="mb-3 grid grid-cols-3 gap-2 border border-zinc-900 text-[10px]">
        {page.headerCells.map((cell) => (
          <div key={cell.label} className="border-r border-zinc-900 p-2 last:border-r-0">
            <p className="font-semibold">{cell.label}</p>
            <p className="whitespace-pre-wrap">{cell.value.trim() || ' '}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 border border-zinc-900 p-2 text-[10px]">
        <p className="font-semibold">4. Operational Period (Date/Time):</p>
        <p className="whitespace-pre-wrap">{page.operationalPeriod.trim() || ' '}</p>
      </div>
      <div className="space-y-4">
        {page.segments.map((segment, index) => renderWorkAssignmentsTable(segment, index))}
      </div>
      {renderPreparedByFooter(page.preparedByFooter)}
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
            USCG ICS 215-CG boxed layout preview. Resource columns may continue on additional pages;
            prepared-by and the ICS form line appear in the page footer on export.
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
