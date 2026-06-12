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
import type { Ics215aDocxBlock } from '@/features/ics215a/export'

type Ics215aExportPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  blocks: Ics215aDocxBlock[]
  onExportWord: () => void
  onExportPdf: () => void
}

export function Ics215aExportPreviewDialog({
  open,
  onOpenChange,
  title,
  blocks,
  onExportWord,
  onExportPdf,
}: Ics215aExportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Placeholder rendering of the ICS-215A export. Layout, fonts, and pagination will differ
            in the final Word or PDF file.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl rounded-md border bg-white p-8 text-[13px] leading-relaxed text-zinc-900 shadow-sm dark:bg-zinc-100">
            <div className="mb-4 border-b border-dashed border-zinc-300 pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Document preview · Flexible Structure
            </div>
            {blocks.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">Nothing to preview yet.</div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, index) => {
                  if (block.kind === 'title') {
                    return (
                      <h1
                        key={`ics215a-preview-${index}`}
                        className="border-b border-zinc-300 pb-2 text-center text-xl font-bold"
                      >
                        {block.text}
                      </h1>
                    )
                  }
                  if (block.kind === 'subtitle') {
                    return (
                      <p
                        key={`ics215a-preview-${index}`}
                        className="pb-3 text-center text-sm italic text-zinc-600"
                      >
                        {block.text}
                      </p>
                    )
                  }
                  if (block.kind === 'heading') {
                    return (
                      <h2
                        key={`ics215a-preview-${index}`}
                        className="mt-5 border-b border-zinc-200 pb-1 text-sm font-semibold uppercase tracking-wide text-zinc-700"
                      >
                        {block.text}
                      </h2>
                    )
                  }
                  if (block.kind === 'bullet') {
                    return (
                      <div
                        key={`ics215a-preview-${index}`}
                        className="flex gap-2 pl-3 text-[13px] leading-snug"
                      >
                        <span aria-hidden="true">•</span>
                        <span className="whitespace-pre-wrap">{block.text}</span>
                      </div>
                    )
                  }
                  return (
                    <p
                      key={`ics215a-preview-${index}`}
                      className="whitespace-pre-wrap text-[13px] leading-snug"
                    >
                      {block.text}
                    </p>
                  )
                })}
              </div>
            )}
            <div className="mt-6 border-t border-dashed border-zinc-300 pt-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              End of preview placeholder
            </div>
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
