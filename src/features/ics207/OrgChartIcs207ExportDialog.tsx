import { FileDown, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'
import {
  downloadIcs207FromPreview,
  generateIcs207OrgChartPreview,
} from '@/features/ics207/export-org-chart-ics207'
import type { Ics207ExportPreview } from '@/features/ics207/types'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

type OrgChartIcs207ExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operationalPeriodsEnabled: boolean
  exportInput: Omit<ExportOrgChartIcs207Input, 'scope'> | null
  onExportComplete?: () => void
}

function Ics207PreviewForm({ preview }: { preview: Ics207ExportPreview }) {
  const { context, pngDataUrl } = preview

  return (
    <div className="overflow-hidden rounded-md border border-zinc-900 bg-white text-[11px] text-zinc-900">
      <div className="border-b border-zinc-900 px-3 py-2 text-center">
        <div>DEPARTMENT OF HOMELAND SECURITY</div>
        <div className="font-semibold">U.S. COAST GUARD</div>
        <div className="font-semibold">INCIDENT ORGANIZATION CHART (ICS 207-CG)</div>
      </div>

      <div className="grid grid-cols-3 border-b border-zinc-900">
        <div className="border-r border-zinc-900 p-2">
          <div className="font-semibold">1. Incident Name:</div>
          <div className="mt-1 min-h-4">{context.incidentName}</div>
        </div>
        <div className="border-r border-zinc-900 p-2">
          <div className="font-semibold">2. Incident Location:</div>
          <div className="mt-1 min-h-4">{context.incidentLocation || '—'}</div>
        </div>
        <div className="p-2">
          <div className="font-semibold">3. Operational Period (Date/Time):</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Date: </span>
              {context.operationalPeriodDate || '—'}
            </div>
            <div>
              <span className="font-semibold">Time: </span>
              {context.operationalPeriodTime || '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-b border-zinc-900">
        <div className="absolute left-2 top-2 font-semibold">4.</div>
        <div className="flex min-h-[280px] items-center justify-center bg-white p-3 pl-6">
          <img
            src={pngDataUrl}
            alt="Org chart preview"
            className="max-h-[360px] max-w-full object-contain"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 p-2">
        <div className="col-span-4 font-semibold">5. Prepared By:</div>
        <div>
          <span className="font-semibold">Name: </span>
          {context.preparedByName || '—'}
        </div>
        <div>
          <span className="font-semibold">Position Title: </span>
          {context.preparedByPositionTitle || '—'}
        </div>
        <div>
          <span className="font-semibold">Signature: </span>
        </div>
        <div>
          <span className="font-semibold">Date/Time: </span>
          {context.preparedByDateTime}
        </div>
      </div>
    </div>
  )
}

export function OrgChartIcs207ExportDialog({
  open,
  onOpenChange,
  operationalPeriodsEnabled,
  exportInput,
  onExportComplete,
}: OrgChartIcs207ExportDialogProps) {
  const [scope, setScope] = useState<OrgChartExportScope>('current_op')
  const [preview, setPreview] = useState<Ics207ExportPreview | null>(null)
  const [previewScope, setPreviewScope] = useState<OrgChartExportScope | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setPreviewScope(null)
      setPreviewError(null)
      setPreviewLoading(false)
      setScope('current_op')
      return
    }

    if (!exportInput) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setPreviewLoading(true)
    setPreviewError(null)
    setPreview(null)
    setPreviewScope(null)

    void generateIcs207OrgChartPreview({ ...exportInput, scope })
      .then((nextPreview) => {
        if (requestIdRef.current !== requestId) return
        setPreview(nextPreview)
        setPreviewScope(scope)
        setPreviewError(null)
      })
      .catch((error: unknown) => {
        if (requestIdRef.current !== requestId) return
        setPreview(null)
        setPreviewScope(null)
        setPreviewError(
          error instanceof Error ? error.message : 'Could not capture org chart preview.'
        )
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return
        setPreviewLoading(false)
      })
  }, [open, exportInput, scope])

  const previewMatchesScope = preview !== null && previewScope === scope
  const canExport = previewMatchesScope && !previewLoading && !isExporting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export ICS-207</DialogTitle>
          <DialogDescription>
            Preview the ICS 207-CG form with a 60% zoom org chart screenshot in box 4, then export
            the PDF.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(value) => {
            if (value === 'current_op' || value === 'next_op') {
              setScope(value)
            }
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <RadioGroupItem value="current_op" id="ics207-current-op" className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="ics207-current-op" className="font-medium">
                This operational period
              </Label>
              <p className="text-xs text-muted-foreground">
                Current positions and current assignees only.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <RadioGroupItem
              value="next_op"
              id="ics207-next-op"
              className="mt-0.5"
              disabled={!operationalPeriodsEnabled}
            />
            <div className="space-y-1">
              <Label
                htmlFor="ics207-next-op"
                className={
                  operationalPeriodsEnabled ? 'font-medium' : 'font-medium text-muted-foreground'
                }
              >
                Next operational period
              </Label>
              <p className="text-xs text-muted-foreground">
                Non-retiring current positions and assignees, plus scheduled positions and
                assignees.
              </p>
            </div>
          </div>
        </RadioGroup>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/20 p-2">
          {previewLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Capturing org chart at 60% zoom…
            </div>
          ) : previewError ? (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-destructive">
              {previewError}
            </div>
          ) : previewMatchesScope && preview ? (
            <Ics207PreviewForm preview={preview} />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
              Select a scope to generate preview.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canExport}
            onClick={() => {
              if (!preview || !previewMatchesScope) return
              setIsExporting(true)
              void downloadIcs207FromPreview(preview)
                .then(() => {
                  onExportComplete?.()
                  onOpenChange(false)
                })
                .catch(() => {
                  setPreviewError('Could not export ICS-207 PDF. Try again.')
                })
                .finally(() => {
                  setIsExporting(false)
                })
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
