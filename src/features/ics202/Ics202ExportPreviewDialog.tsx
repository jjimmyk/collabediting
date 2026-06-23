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
import {
  ICS202_PREVIEW_STACK_CLASS,
  ics202PreviewSegmentRowClass,
} from '@/features/ics202/export-box-stack'
import { ICS202_FORM_TITLE_LINES } from '@/features/ics202/export-layout'
import type { Ics202PagePreparedBy, Ics202PhysicalPage, Ics202PhysicalPageSegment } from '@/features/ics202/export-pagination'

type Ics202ExportPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  pages: Ics202PhysicalPage[]
  onExportWord: () => void
  onExportPdf: () => void
}

function StackSection({
  label,
  children,
  isFirstInStack,
}: {
  label?: string
  children: React.ReactNode
  isFirstInStack: boolean
}) {
  return (
    <div className={ics202PreviewSegmentRowClass(isFirstInStack)}>
      {label ? (
        <div className="border-b border-zinc-900 px-2 py-1 text-[11px] font-semibold">{label}</div>
      ) : null}
      <div className="px-2 py-2">{children}</div>
    </div>
  )
}

function renderPreviewSegment(
  segment: Ics202PhysicalPageSegment,
  index: number,
  isFirstInStack: boolean
) {
  switch (segment.kind) {
    case 'lifelines':
      return (
        <StackSection key={`ics202-seg-${index}`} label={segment.label} isFirstInStack={isFirstInStack}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] xl:grid-cols-4">
            {segment.options.map((opt) => (
              <span key={opt.id}>
                {opt.checked ? '[X]' : '[ ]'} {opt.label}
              </span>
            ))}
          </div>
        </StackSection>
      )
    case 'text-box':
      return (
        <StackSection key={`ics202-seg-${index}`} label={segment.label} isFirstInStack={isFirstInStack}>
          <p className="min-h-[2rem] whitespace-pre-wrap text-[11px] leading-snug">
            {segment.bodyLines.join('\n').trim().length > 0 ? segment.bodyLines.join('\n') : ' '}
          </p>
        </StackSection>
      )
    case 'objectives':
      return (
        <StackSection key={`ics202-seg-${index}`} label={segment.label} isFirstInStack={isFirstInStack}>
          {segment.showTableHeader ? (
            <div className="mb-1 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 text-[10px] font-semibold">
              <span>O/M</span>
              <span>Objective</span>
            </div>
          ) : null}
          <div className="space-y-1">
            {segment.rows.length === 0 ? (
              <p className="min-h-[2rem] text-[11px]"> </p>
            ) : (
              segment.rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 text-[11px]">
                  <span className="font-medium">{row.kind || ' '}</span>
                  <span className="whitespace-pre-wrap">{row.objective.trim().length > 0 ? row.objective : ' '}</span>
                </div>
              ))
            )}
          </div>
        </StackSection>
      )
    case 'site-safety-plan':
      if (segment.continued) {
        return (
          <StackSection
            key={`ics202-seg-${index}`}
            label="9. Site Safety Plan located at: (Continued):"
            isFirstInStack={isFirstInStack}
          >
            <p className="whitespace-pre-wrap text-[11px]">
              {segment.locationLines.join('\n').trim().length > 0
                ? segment.locationLines.join('\n')
                : ' '}
            </p>
          </StackSection>
        )
      }
      return (
        <div
          key={`ics202-seg-${index}`}
          className={`grid grid-cols-2 ${ics202PreviewSegmentRowClass(isFirstInStack)}`}
        >
          <div className="border-r border-zinc-900 px-2 py-2">
            <p className="border-b border-zinc-900 pb-1 text-[10px] font-semibold">
              8. Site Safety Plan Required:
            </p>
            <p className="mt-1 text-[11px]">
              Yes {segment.required ? '[X]' : '[ ]'} &nbsp; No {segment.required ? '[ ]' : '[X]'}
            </p>
          </div>
          <div className="px-2 py-2">
            <p className="border-b border-zinc-900 pb-1 text-[10px] font-semibold">
              9. Site Safety Plan located at:
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[11px]">
              {segment.locationLines.join('\n').trim().length > 0
                ? segment.locationLines.join('\n')
                : ' '}
            </p>
          </div>
        </div>
      )
    default:
      return null
  }
}

function renderPreviewPreparedBy(preparedBy: Ics202PagePreparedBy, isFirstInStack: boolean) {
  return (
    <StackSection label={preparedBy.label} isFirstInStack={isFirstInStack}>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        {(
          [
            ['Name:', preparedBy.fields.name],
            ['Position Title:', preparedBy.fields.positionTitle],
            ['Signature:', preparedBy.fields.signature],
            ['Date/Time:', preparedBy.fields.dateTime],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <p className="font-semibold">{label}</p>
            <p className="mt-1 whitespace-pre-wrap">{value.trim().length > 0 ? value : ' '}</p>
          </div>
        ))}
      </div>
    </StackSection>
  )
}

function renderPreviewPage(page: Ics202PhysicalPage, index: number) {
  return (
    <div
      key={`ics202-page-${page.displayPageNumber}-${index}`}
      className="flex min-h-[720px] flex-col bg-white p-4 shadow-sm dark:bg-zinc-100"
    >
      <div className="mb-2 space-y-0.5 text-center">
        {ICS202_FORM_TITLE_LINES.map((line, lineIndex) => (
          <p
            key={line}
            className={
              lineIndex === ICS202_FORM_TITLE_LINES.length - 1
                ? 'text-sm font-bold'
                : 'text-[11px] font-semibold'
            }
          >
            {line}
          </p>
        ))}
      </div>
      <div className={`flex-1 ${ICS202_PREVIEW_STACK_CLASS}`}>
        <div className="grid grid-cols-3 border-b border-zinc-900">
          {page.headerCells.map((cell) => (
            <div key={cell.label} className="border-r border-zinc-900 px-2 py-1 last:border-r-0">
              <p className="text-[10px] font-semibold">{cell.label}</p>
              {cell.subLabels?.map((sub) => (
                <p key={sub} className="text-[9px] text-zinc-600">
                  {sub}
                </p>
              ))}
              <p className="mt-1 whitespace-pre-wrap text-[11px]">{cell.value || ' '}</p>
            </div>
          ))}
        </div>
        {page.segments.map((segment, segmentIndex) =>
          renderPreviewSegment(segment, segmentIndex, segmentIndex === 0)
        )}
        {renderPreviewPreparedBy(page.preparedBy, page.segments.length === 0)}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
        <span>{page.footerLeft}</span>
        <span>
          Page {page.displayPageNumber} of {page.totalPages}
        </span>
      </div>
    </div>
  )
}

export function Ics202ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  pages,
  onExportWord,
  onExportPdf,
}: Ics202ExportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            USCG ICS 202-CG boxed layout preview. Sections share borders with no vertical gaps;
            continuation segments repeat their label when content overflows a page.
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
