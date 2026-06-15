import { useMemo, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResourceListItemData } from '@/features/resources/types'
import { ICS_ORG_CHART_ROOT_POSITION } from '@/features/roster/ics-org-chart-structure'
import { validateAssetOrgChartReportsTo } from '@/features/roster/workspace-asset-org-chart'
import { buildReportsToOptions, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'

type AddAssetToOrgChartDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: ResourceListItemData[]
  catalog: WorkspacePositionCatalog
  isSaving?: boolean
  onSubmit: (assetKey: string, reportsTo: string) => Promise<void>
}

export function AddAssetToOrgChartDialog({
  open,
  onOpenChange,
  assets,
  catalog,
  isSaving = false,
  onSubmit,
}: AddAssetToOrgChartDialogProps) {
  const [assetKeyDraft, setAssetKeyDraft] = useState('')
  const [reportsToDraft, setReportsToDraft] = useState<string>(ICS_ORG_CHART_ROOT_POSITION)
  const [error, setError] = useState<string | null>(null)

  const reportsToOptions = useMemo(() => buildReportsToOptions(catalog), [catalog])

  const resetDraft = () => {
    setAssetKeyDraft(assets[0]?.assetKey ?? '')
    setReportsToDraft(ICS_ORG_CHART_ROOT_POSITION)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!assetKeyDraft) {
      setError('Select an asset to place on the org chart.')
      return
    }
    const reportsToError = validateAssetOrgChartReportsTo(reportsToDraft, catalog)
    if (reportsToError) {
      setError(reportsToError)
      return
    }

    setError(null)
    try {
      await onSubmit(assetKeyDraft, reportsToDraft)
      resetDraft()
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add asset to org chart.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) {
          setAssetKeyDraft(assets[0]?.assetKey ?? '')
          setReportsToDraft(ICS_ORG_CHART_ROOT_POSITION)
          setError(null)
        } else {
          resetDraft()
        }
      }}
    >
      <DialogContent className="!w-[28rem] !max-w-[28rem] sm:!max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Add asset to org chart</DialogTitle>
          <DialogDescription>
            Choose an assigned asset and the position it reports to. The asset will appear under that
            position in the org chart.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-2">
            <Label htmlFor="org-chart-asset-select">Asset</Label>
            <Select value={assetKeyDraft} onValueChange={setAssetKeyDraft}>
              <SelectTrigger id="org-chart-asset-select">
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.assetKey} value={asset.assetKey}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-chart-asset-reports-to">Reports to</Label>
            <Select value={reportsToDraft} onValueChange={setReportsToDraft}>
              <SelectTrigger id="org-chart-asset-reports-to">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {reportsToOptions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || assets.length === 0 || assetKeyDraft.length === 0}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? 'Adding…' : 'Add to org chart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
