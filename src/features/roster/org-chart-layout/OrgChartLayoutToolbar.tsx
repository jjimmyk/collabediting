import { LayoutGrid, RotateCcw, Save, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type OrgChartLayoutToolbarProps = {
  editMode: boolean
  canEdit: boolean
  hasUnsavedChanges: boolean
  isSaving: boolean
  onEnterEdit: () => void
  onSave: () => void
  onReset: () => void
  onCancel: () => void
  onFitView: () => void
}

export function OrgChartLayoutToolbar({
  editMode,
  canEdit,
  hasUnsavedChanges,
  isSaving,
  onEnterEdit,
  onSave,
  onReset,
  onCancel,
  onFitView,
}: OrgChartLayoutToolbarProps) {
  if (!canEdit && !editMode) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={onFitView}>
        <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
        Fit to screen
      </Button>
    )
  }

  if (!editMode) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onFitView}>
          <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
          Fit to screen
        </Button>
        {canEdit ? (
          <Button type="button" size="sm" variant="outline" onClick={onEnterEdit}>
            Edit layout
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasUnsavedChanges ? (
        <Badge variant="secondary" className="text-[10px]">
          Unsaved layout changes
        </Badge>
      ) : null}
      <Button type="button" size="sm" variant="outline" onClick={onFitView}>
        <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
        Fit
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={isSaving}>
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Reset
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
        <X className="mr-1.5 h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
        <Save className="mr-1.5 h-3.5 w-3.5" />
        {isSaving ? 'Saving…' : 'Save layout'}
      </Button>
    </div>
  )
}
