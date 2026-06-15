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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildReportsToOptions,
  validateCustomPositionName,
  validateReportsToPosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import { ICS_ORG_CHART_ROOT_POSITION } from '@/features/roster/ics-org-chart-structure'

type AddWorkspacePositionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: WorkspacePositionCatalog
  isSaving?: boolean
  onSubmit: (name: string, reportsTo: string) => Promise<void>
}

export function AddWorkspacePositionDialog({
  open,
  onOpenChange,
  catalog,
  isSaving = false,
  onSubmit,
}: AddWorkspacePositionDialogProps) {
  const [nameDraft, setNameDraft] = useState('')
  const [reportsToDraft, setReportsToDraft] = useState<string>(ICS_ORG_CHART_ROOT_POSITION)
  const [error, setError] = useState<string | null>(null)

  const reportsToOptions = useMemo(() => buildReportsToOptions(catalog), [catalog])

  const resetDraft = () => {
    setNameDraft('')
    setReportsToDraft(ICS_ORG_CHART_ROOT_POSITION)
    setError(null)
  }

  const handleSubmit = async () => {
    const nameError = validateCustomPositionName(nameDraft, catalog)
    if (nameError) {
      setError(nameError)
      return
    }
    const reportsToError = validateReportsToPosition(reportsToDraft, catalog, nameDraft)
    if (reportsToError) {
      setError(reportsToError)
      return
    }

    setError(null)
    try {
      await onSubmit(nameDraft, reportsToDraft)
      resetDraft()
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add position.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          resetDraft()
        }
      }}
    >
      <DialogContent className="!w-[28rem] !max-w-[28rem] sm:!max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Add position</DialogTitle>
          <DialogDescription>
            Define a workspace-specific position and choose which existing position it reports to.
            This controls where it appears in the org chart.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <div className="grid gap-2">
            <Label htmlFor="custom-position-name">Position name</Label>
            <Input
              id="custom-position-name"
              value={nameDraft}
              onChange={(event) => {
                setNameDraft(event.target.value)
                setError(null)
              }}
              placeholder="Staging Area Manager"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custom-position-reports-to">Reports to</Label>
            <Select
              value={reportsToDraft}
              onValueChange={(value) => {
                setReportsToDraft(value)
                setError(null)
              }}
            >
              <SelectTrigger id="custom-position-reports-to">
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
          <Button type="button" disabled={isSaving || nameDraft.trim().length === 0} onClick={() => void handleSubmit()}>
            {isSaving ? 'Adding…' : 'Add position'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
