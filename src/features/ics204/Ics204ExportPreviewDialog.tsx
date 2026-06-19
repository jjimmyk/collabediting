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
import { ICS204_FORM_TITLE_LINES } from '@/features/ics204/constants'
import type { Ics204SignatureFooter } from '@/features/ics204/export-layout'
import type { Ics204PhysicalPage, Ics204PhysicalPageSegment } from '@/features/ics204/export-pagination'

type Ics204ExportPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  pages: Ics204PhysicalPage[]
  onExportWord: () => void
  onExportPdf: () => void
}

function PreviewBox({
  label,
  children,
  className,
}: {
  label?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`border border-zinc-900 ${className ?? ''}`}>
      {label ? (
        <div className="border-b border-zinc-900 px-2 py-1 text-[11px] font-semibold">{label}</div>
      ) : null}
      <div className="px-2 py-2">{children}</div>
    </div>
  )
}

function renderPreviewSegment(segment: Ics204PhysicalPageSegment, index: number) {
  switch (segment.kind) {
    case 'personnel-table':
      return (
        <PreviewBox key={`ics204-seg-${index}`} label={segment.label}>
          <div className="mb-1 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-[10px] font-semibold">
            <span>Position</span>
            <span>Name</span>
            <span>Contact Information</span>
          </div>
          <div className="space-y-1">
            {segment.rows.map((row) => (
              <div
                key={row.position}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-[11px]"
              >
                <span>{row.position}</span>
                <span className="whitespace-pre-wrap">{row.name.trim() || ' '}</span>
                <span className="whitespace-pre-wrap">{row.contact.trim() || ' '}</span>
              </div>
            ))}
          </div>
        </PreviewBox>
      )
    case 'resources-table':
      return (
        <PreviewBox key={`ics204-seg-${index}`} label={segment.label}>
          {segment.showTableHeader ? (
            <div className="mb-1 grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_3rem_minmax(0,0.9fr)_minmax(0,1fr)_2.5rem] gap-1 text-[9px] font-semibold">
              <span>Resource Identifier</span>
              <span>Leader</span>
              <span># of Persons</span>
              <span>Contact Information</span>
              <span>Reporting Info / Notes</span>
              <span>204A</span>
            </div>
          ) : null}
          <div className="space-y-1">
            {segment.rows.length === 0 ? (
              <p className="min-h-[2rem] text-[11px]"> </p>
            ) : (
              segment.rows.map((row, rowIndex) => (
                <div
                  key={`${row.resourceIdentifier}-${rowIndex}`}
                  className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_3rem_minmax(0,0.9fr)_minmax(0,1fr)_2.5rem] gap-1 text-[10px]"
                >
                  <span className="whitespace-pre-wrap">{row.resourceIdentifier || ' '}</span>
                  <span className="whitespace-pre-wrap">{row.leader || ' '}</span>
                  <span>{row.personCount || ' '}</span>
                  <span className="whitespace-pre-wrap">{row.contactInformation || ' '}</span>
                  <span className="whitespace-pre-wrap">{row.reportingInfoNotes || ' '}</span>
                  <span>{row.has204A ? '[X]' : '[ ]'}</span>
                </div>
              ))
            )}
          </div>
        </PreviewBox>
      )
    case 'text-box':
      return (
        <PreviewBox key={`ics204-seg-${index}`} label={segment.label}>
          <p className="min-h-[2rem] whitespace-pre-wrap text-[11px] leading-snug">
            {segment.bodyLines.join('\n').trim().length > 0 ? segment.bodyLines.join('\n') : ' '}
          </p>
        </PreviewBox>
      )
    case 'communications':
      return (
        <PreviewBox key={`ics204-seg-${index}`} label={segment.label}>
          {segment.showTableHeader ? (
            <div className="mb-1 grid grid-cols-2 gap-2 text-[10px] font-semibold">
              <span>Name / Function</span>
              <span>Contact Information</span>
            </div>
          ) : null}
          <div className="space-y-1">
            {segment.rows.map((row, rowIndex) => (
              <div key={`${row.nameFunction}-${rowIndex}`} className="grid grid-cols-2 gap-2 text-[11px]">
                <span className="whitespace-pre-wrap">{row.nameFunction || ' '}</span>
                <span className="whitespace-pre-wrap">{row.contactInformation || ' '}</span>
              </div>
            ))}
          </div>
          {segment.showEmergency ? (
            <div className="mt-2 border-t border-zinc-300 pt-2">
              <p className="text-[10px] font-semibold">Emergency Communications:</p>
              <p className="mt-1 whitespace-pre-wrap text-[11px]">
                {segment.emergencyLines.join('\n').trim().length > 0
                  ? segment.emergencyLines.join('\n')
                  : 'Medical: ____________   Evacuation: ____________   Other: ____________'}
              </p>
            </div>
          ) : null}
        </PreviewBox>
      )
    default:
      return null
  }
}

function renderPreviewSignatureFooter(footer: Ics204SignatureFooter) {
  const boxes = [footer.preparedBy, footer.reviewedPsc, footer.reviewedOsc]
  return (
    <div className="grid grid-cols-3 border border-zinc-900">
      {boxes.map((box) => (
        <div key={box.label} className="border-r border-zinc-900 px-2 py-2 last:border-r-0">
          <p className="text-[10px] font-semibold">{box.label}</p>
          <p className="mt-2 text-[10px] font-semibold">Name:</p>
          <p className="mt-1 whitespace-pre-wrap text-[11px]">{box.name.trim() || ' '}</p>
          <p className="mt-2 text-[10px] font-semibold">Date / Time:</p>
          <p className="mt-1 whitespace-pre-wrap text-[11px]">{box.dateTime.trim() || ' '}</p>
        </div>
      ))}
    </div>
  )
}

function renderPreviewPage(page: Ics204PhysicalPage, index: number) {
  return (
    <div
      key={`ics204-page-${page.displayPageNumber}-${index}`}
      className="flex min-h-[720px] flex-col border-2 border-zinc-900 bg-white p-4 shadow-sm dark:bg-zinc-100"
    >
      <div className="space-y-0.5 text-center">
        {ICS204_FORM_TITLE_LINES.map((line, lineIndex) => (
          <p
            key={line}
            className={
              lineIndex === ICS204_FORM_TITLE_LINES.length - 1
                ? 'text-sm font-bold'
                : 'text-[11px] font-semibold'
            }
          >
            {line}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-3 border border-zinc-900">
        {page.headerCells.map((cell) => (
          <div key={cell.label} className="border-r border-zinc-900 px-2 py-1 last:border-r-0">
            <p className="text-[10px] font-semibold">{cell.label}</p>
            {cell.subLabels?.map((sub) => (
              <p key={sub} className="text-right text-[9px] text-zinc-600">
                {sub}
              </p>
            ))}
            <p className="mt-1 whitespace-pre-wrap text-[11px]">{cell.value || ' '}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex-1 space-y-2">{page.segments.map(renderPreviewSegment)}</div>
      <div className="mt-auto space-y-2 border-t border-zinc-300 pt-2">
        {renderPreviewSignatureFooter(page.signatureFooter)}
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>{page.footerLeft}</span>
          <span>
            Page {page.displayPageNumber} of {page.totalPages}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Ics204ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  pages,
  onExportWord,
  onExportPdf,
}: Ics204ExportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            USCG ICS 204-CG boxed layout preview. Continuation sections repeat their label; signature
            boxes and the ICS expiration line appear in the page footer on export.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-6 text-[13px] leading-relaxed text-zinc-900">
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
