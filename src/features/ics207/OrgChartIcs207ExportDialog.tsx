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
import {
  downloadIcs207FromPreview,
  type ExportOrgChartIcs207BaseInput,
} from '@/features/ics207/export-org-chart-ics207'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'
import { Ics207PreviewOrgChartPanel } from '@/features/ics207/Ics207PreviewOrgChartPanel'
import { useOrgChartPaintReady } from '@/features/ics207/use-org-chart-paint-ready'
import {
  ICS202_PREVIEW_STACK_CLASS,
  ics202PreviewSegmentRowClass,
} from '@/features/ics202/export-box-stack'
import { ICS207_PDF_CHART_ASPECT_RATIO } from '@/features/ics207/export-template-constants'
import { captureIcs207Box4ForPdf, pngBytesToDataUrl } from '@/features/roster/org-chart-export-capture'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

type OrgChartIcs207ExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operationalPeriodsEnabled: boolean
  exportInput: ExportOrgChartIcs207BaseInput | null
  onExportComplete?: () => void
}

function renderPreviewBlock(
  block: Ics207ExportLayoutBlock,
  index: number,
  options: {
    isFirstInStack: boolean
    box4ContainerRef: (node: HTMLDivElement | null) => void
    exportInput: ExportOrgChartIcs207Input | null
    exportError: string | null
    isGeneratingPdf: boolean
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
            <div key={cell.label} className="border-r border-zinc-900 p-2 last:border-r-0">
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
    case 'org-chart-live':
      return (
        <div key={`ics207-${index}`} className={`relative ${rowClass}`}>
          <div className="absolute left-2 top-2 z-10 text-[10px] font-semibold">4.</div>
          <div
            ref={options.box4ContainerRef}
            data-ics207-box-4-chart=""
            className="relative min-h-[280px] overflow-auto bg-white p-3 pl-6"
            style={{ aspectRatio: ICS207_PDF_CHART_ASPECT_RATIO }}
          >
            {options.exportInput ? (
              <Ics207PreviewOrgChartPanel exportInput={options.exportInput} />
            ) : null}
            {options.isGeneratingPdf ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 text-[11px] text-zinc-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating PDF…
              </div>
            ) : null}
          </div>
          {options.exportError ? (
            <p className="px-3 pb-2 text-[11px] text-red-700">{options.exportError}</p>
          ) : null}
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
  const [box4Container, setBox4Container] = useState<HTMLDivElement | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const box4ContainerRef = useCallback((node: HTMLDivElement | null) => {
    setBox4Container(node)
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

  const paintReadyKey = `${scope}-${open ? 'open' : 'closed'}`
  const chartPaintReady = useOrgChartPaintReady(
    open ? box4Container : null,
    paintReadyKey
  )

  const layoutBlocks = useMemo(() => {
    if (!context) return []
    return buildIcs207ExportLayout(context)
  }, [context])

  const canExport = Boolean(context && scopedExportInput && chartPaintReady && !isExporting)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setScope('current_op')
          setBox4Container(null)
          setExportError(null)
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
            USCG ICS 207-CG preview. Box 4 shows the org chart as it appears in the roster at your
            current zoom and filters. PDF export captures this preview when you click Export PDF.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(value) => {
            if (value === 'current_op' || value === 'next_op') {
              setScope(value)
              setExportError(null)
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
                    box4ContainerRef,
                    exportInput: scopedExportInput,
                    exportError,
                    isGeneratingPdf: isExporting,
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
              if (!context || !scopedExportInput || !box4Container) return
              setExportError(null)
              setIsExporting(true)
              void captureIcs207Box4ForPdf({ box4Container })
                .then((pngBytes) =>
                  downloadIcs207FromPreview({
                    scope,
                    context,
                    pngBytes,
                    pngDataUrl: pngBytesToDataUrl(pngBytes),
                  })
                )
                .then(() => {
                  onExportComplete?.()
                  onOpenChange(false)
                })
                .catch((error: unknown) => {
                  setExportError(
                    error instanceof Error
                      ? error.message
                      : 'Could not export ICS-207 PDF. Try again.'
                  )
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
