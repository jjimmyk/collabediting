import { Eye, FileDown, Loader2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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
import {
  ICS207_FORM_TITLE_LINES,
  buildIcs207ExportLayout,
  type Ics207ExportLayoutBlock,
} from '@/features/ics207/export-layout-blocks'
import {
  buildIcs207ExportContext,
  resolveIcs207PreparedByName,
} from '@/features/ics207/export-layout'
import { downloadIcs207FromPreview } from '@/features/ics207/export-org-chart-ics207'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'
import { Ics207PreviewOrgChartPanel } from '@/features/ics207/Ics207PreviewOrgChartPanel'
import { useIcs207OrgChartCapture } from '@/features/ics207/use-ics207-org-chart-capture'
import {
  ICS202_PREVIEW_STACK_CLASS,
  ics202PreviewSegmentRowClass,
} from '@/features/ics202/export-box-stack'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

type OrgChartIcs207ExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operationalPeriodsEnabled: boolean
  exportInput: Omit<ExportOrgChartIcs207Input, 'scope'> | null
  onExportComplete?: () => void
}

function renderPreviewBlock(
  block: Ics207ExportLayoutBlock,
  index: number,
  options: {
    isFirstInStack: boolean
    chartContainerRef: (node: HTMLDivElement | null) => void
    showLiveChart: boolean
    exportInput: ExportOrgChartIcs207Input | null
    captureWaiting: boolean
    captureError: string | null
  }
) {
  const rowClass = ics202PreviewSegmentRowClass(options.isFirstInStack)

  switch (block.kind) {
    case 'form-title':
      return (
        <div key={`ics207-${index}`} className={`px-2 py-2 text-center ${rowClass}`}>
          {ICS207_FORM_TITLE_LINES.map((line) => (
            <div
              key={line}
              className={line.includes('INCIDENT ORGANIZATION') ? 'font-semibold' : undefined}
            >
              {line}
            </div>
          ))}
        </div>
      )
    case 'header-row':
      return (
        <div key={`ics207-${index}`} className={`grid grid-cols-3 ${rowClass}`}>
          {block.cells.map((cell) => (
            <div
              key={cell.label}
              className="border-r border-zinc-900 p-2 last:border-r-0"
            >
              <div className="text-[10px] font-semibold">{cell.label}</div>
              {cell.subFields ? (
                <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                  {cell.subFields.map((field) => (
                    <div key={field.label}>
                      <span className="font-semibold">{field.label} </span>
                      {field.value || ' '}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 min-h-[1rem] whitespace-pre-wrap text-[11px]">
                  {cell.value || ' '}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    case 'org-chart-image':
      return (
        <div key={`ics207-${index}`} className={`relative ${rowClass}`}>
          <div className="absolute left-2 top-2 text-[10px] font-semibold">4.</div>
          <div className="flex min-h-[280px] items-center justify-center bg-white p-3 pl-6">
            {block.dataUrl ? (
              <img
                src={block.dataUrl}
                alt={block.alt}
                className="max-h-[420px] max-w-full object-contain"
              />
            ) : (
              <span className="text-[11px] text-zinc-500"> </span>
            )}
          </div>
        </div>
      )
    case 'org-chart-live':
      return (
        <div key={`ics207-${index}`} className={`relative ${rowClass}`}>
          <div className="absolute left-2 top-2 z-10 text-[10px] font-semibold">4.</div>
          <div
            ref={options.showLiveChart ? options.chartContainerRef : undefined}
            data-ics207-box-4-chart=""
            className="relative min-h-[280px] overflow-auto bg-white p-3 pl-6"
          >
            {options.exportInput ? (
              <>
                <Ics207PreviewOrgChartPanel exportInput={options.exportInput} />
                {options.captureError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 text-center text-[11px] text-red-700">
                    {options.captureError}
                  </div>
                ) : options.captureWaiting ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-[11px] text-zinc-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Capturing org chart at 60% zoom…
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )
    case 'prepared-by':
      return (
        <div key={`ics207-${index}`} className={`p-2 ${rowClass}`}>
          <div className="mb-1 text-[10px] font-semibold">5. Prepared By:</div>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="font-semibold">Name: </span>
              {block.fields.name || ' '}
            </div>
            <div>
              <span className="font-semibold">Position Title: </span>
              {block.fields.positionTitle || ' '}
            </div>
            <div>
              <span className="font-semibold">Signature: </span>
            </div>
            <div>
              <span className="font-semibold">Date/Time: </span>
              {block.fields.dateTime || ' '}
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export function OrgChartIcs207ExportDialog({
  open,
  onOpenChange,
  operationalPeriodsEnabled,
  exportInput,
  onExportComplete,
}: OrgChartIcs207ExportDialogProps) {
  const [scope, setScope] = useState<OrgChartExportScope>('current_op')
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const chartContainerRef = useCallback((node: HTMLDivElement | null) => {
    setChartContainer(node)
  }, [])

  const scopedExportInput = useMemo<ExportOrgChartIcs207Input | null>(() => {
    if (!exportInput) return null
    return { ...exportInput, scope }
  }, [exportInput, scope])

  const context = useMemo(() => {
    if (!scopedExportInput) return null
    return buildIcs207ExportContext({
      scope: scopedExportInput.scope,
      incidentName: scopedExportInput.incidentName,
      incidentLocation: scopedExportInput.incidentLocation,
      operationalPeriodFrom: scopedExportInput.operationalPeriodFrom,
      operationalPeriodTo: scopedExportInput.operationalPeriodTo,
      preparedByName: resolveIcs207PreparedByName(
        scopedExportInput.profileEmail,
        scopedExportInput.profileDisplayName
      ),
      preparedByPositionTitle: scopedExportInput.preparedByPositionTitle,
    })
  }, [scopedExportInput])

  const captureKey = `${scope}-${open ? 'open' : 'closed'}`
  const capture = useIcs207OrgChartCapture(chartContainer, captureKey, open && chartContainer !== null)

  const showCapturedImage = capture.status === 'ready'
  const capturedDataUrl = capture.status === 'ready' ? capture.pngDataUrl : undefined
  const layoutBlocks = useMemo(() => {
    if (!context) return []
    return buildIcs207ExportLayout(
      context,
      capturedDataUrl ? { dataUrl: capturedDataUrl } : undefined
    )
  }, [capturedDataUrl, context])

  const canExport = showCapturedImage && !isExporting

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setScope('current_op')
          setChartContainer(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4" />
            Export ICS-207
          </DialogTitle>
          <DialogDescription className="text-xs">
            USCG ICS 207-CG boxed layout preview. Box 4 renders the org chart at 60% zoom, then
            captures it for PDF export.
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

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl text-[13px] leading-relaxed text-zinc-900">
            {!context || layoutBlocks.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">Nothing to preview yet.</div>
            ) : (
              <div className={`${ICS202_PREVIEW_STACK_CLASS} bg-white`}>
                {layoutBlocks.map((block, index) =>
                  renderPreviewBlock(block, index, {
                    isFirstInStack: index === 0,
                    chartContainerRef,
                    showLiveChart: !showCapturedImage,
                    exportInput: scopedExportInput,
                    captureWaiting: capture.status === 'waiting' && !showCapturedImage,
                    captureError: capture.status === 'error' ? capture.message : null,
                  })
                )}
              </div>
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
            disabled={isExporting}
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
            disabled={!canExport}
            onClick={() => {
              if (capture.status !== 'ready' || !context) return
              setIsExporting(true)
              void downloadIcs207FromPreview({
                scope,
                context,
                pngBytes: capture.pngBytes,
                pngDataUrl: capture.pngDataUrl,
              })
                .then(() => {
                  onExportComplete?.()
                  onOpenChange(false)
                })
                .finally(() => {
                  setIsExporting(false)
                })
            }}
          >
            <FileDown className="h-3.5 w-3.5" />
            {isExporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
