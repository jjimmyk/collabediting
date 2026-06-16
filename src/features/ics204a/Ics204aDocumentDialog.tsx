import { useEffect, useMemo, useState } from 'react'
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
import { Ics204aFormFields } from '@/features/ics204a/Ics204aFormFields'
import {
  buildIcs204aDocxBlocks,
  type Ics204aDocxBlock,
  type Ics204aExportContext,
} from '@/features/ics204a/export'
import type { Ics204aFormState } from '@/features/ics204a/types'
import { cn } from '@/lib/utils'

type Ics204aDocumentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  resourceName: string
  form: Ics204aFormState | null
  readOnly: boolean
  exportContext: Ics204aExportContext
  onSave: (form: Ics204aFormState) => void
  onExportWord: (form: Ics204aFormState, blocks: Ics204aDocxBlock[]) => void
  onExportPdf: (form: Ics204aFormState, blocks: Ics204aDocxBlock[]) => void
}

function Ics204aPreviewBlocks({ blocks }: { blocks: Ics204aDocxBlock[] }) {
  if (blocks.length === 0) {
    return <div className="py-8 text-center text-sm text-zinc-500">Nothing to preview yet.</div>
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.kind === 'title') {
          return (
            <h1
              key={`ics204a-preview-${index}`}
              className="border-b border-zinc-300 pb-2 text-center text-xl font-bold"
            >
              {block.text}
            </h1>
          )
        }
        if (block.kind === 'subtitle') {
          return (
            <p
              key={`ics204a-preview-${index}`}
              className="pb-3 text-center text-sm italic text-zinc-600"
            >
              {block.text}
            </p>
          )
        }
        if (block.kind === 'heading') {
          return (
            <h2
              key={`ics204a-preview-${index}`}
              className="mt-5 border-b border-zinc-200 pb-1 text-sm font-semibold uppercase tracking-wide text-zinc-700"
            >
              {block.text}
            </h2>
          )
        }
        if (block.kind === 'bullet') {
          return (
            <div key={`ics204a-preview-${index}`} className="flex gap-2 pl-3 text-[13px] leading-snug">
              <span aria-hidden="true">•</span>
              <span className="whitespace-pre-wrap">{block.text}</span>
            </div>
          )
        }
        return (
          <p key={`ics204a-preview-${index}`} className="whitespace-pre-wrap text-[13px] leading-snug">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

export function Ics204aDocumentDialog({
  open,
  onOpenChange,
  title,
  resourceName,
  form,
  readOnly,
  exportContext,
  onSave,
  onExportWord,
  onExportPdf,
}: Ics204aDocumentDialogProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [draft, setDraft] = useState<Ics204aFormState | null>(form)

  const previewBlocks = useMemo(
    () => (draft ? buildIcs204aDocxBlocks(draft, exportContext) : []),
    [draft, exportContext]
  )

  useEffect(() => {
    if (open && form) {
      setDraft(form)
      setActiveTab('edit')
    }
    if (!open) {
      setDraft(null)
    }
  }, [open, form])

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-[72vw] !max-w-[72vw] sm:!max-w-[72vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            ICS 204A-CG assignment list attachment for {resourceName}.
            {readOnly ? ' This ICS-204 is locked; the attachment is view-only.' : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'edit' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setActiveTab('edit')}
          >
            {readOnly ? 'View form' : 'Edit'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </Button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto">
          {draft ? (
            activeTab === 'edit' ? (
              <Ics204aFormFields form={draft} readOnly={readOnly} onChange={setDraft} />
            ) : (
              <div className="mx-auto w-full max-w-3xl rounded-md border bg-white p-8 text-[13px] leading-relaxed text-zinc-900 shadow-sm dark:bg-zinc-100">
                <div className="mb-4 border-b border-dashed border-zinc-300 pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  ICS 204A-CG preview
                </div>
                <Ics204aPreviewBlocks blocks={previewBlocks} />
              </div>
            )
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No 204A document loaded.</div>
          )}
        </div>

        <DialogFooter className={cn('flex flex-row items-center justify-end gap-2 sm:justify-end')}>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleOpenChange(false)}>
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
          {!readOnly && draft ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
              onClick={() => {
                if (!draft) return
                onSave(draft)
                handleOpenChange(false)
              }}
            >
              Save 204A
            </Button>
          ) : null}
          {draft ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => onExportWord(draft, previewBlocks)}
              >
                <FileText className="h-3.5 w-3.5" />
                Export Word
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
                onClick={() => onExportPdf(draft, previewBlocks)}
              >
                <FileText className="h-3.5 w-3.5" />
                Export PDF
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
