import { FileDown } from 'lucide-react'
import { useState } from 'react'
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
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

type OrgChartIcs207ExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operationalPeriodsEnabled: boolean
  isExporting: boolean
  onExport: (scope: OrgChartExportScope) => void
}

export function OrgChartIcs207ExportDialog({
  open,
  onOpenChange,
  operationalPeriodsEnabled,
  isExporting,
  onExport,
}: OrgChartIcs207ExportDialogProps) {
  const [scope, setScope] = useState<OrgChartExportScope>('current_op')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export ICS-207</DialogTitle>
          <DialogDescription>
            Download an ICS 207-CG organization chart PDF. Box 4 contains a screenshot of the
            roster org chart for the selected operational period scope.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(value) => {
            if (value === 'current_op' || value === 'next_op') {
              setScope(value)
            }
          }}
          className="gap-3"
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
                className={operationalPeriodsEnabled ? 'font-medium' : 'font-medium text-muted-foreground'}
              >
                Next operational period
              </Label>
              <p className="text-xs text-muted-foreground">
                Non-retiring current positions and assignees, plus scheduled positions and
                assignees.
              </p>
              {!operationalPeriodsEnabled ? (
                <p className="text-xs text-muted-foreground">
                  Enable operational periods in workspace settings to export a next OP projection.
                </p>
              ) : null}
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onExport(scope)}
            disabled={isExporting || (scope === 'next_op' && !operationalPeriodsEnabled)}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
