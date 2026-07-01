import { Check, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Ics201SectionEditActionsProps = {
  isEditing: boolean
  isSaving?: boolean
  saveDisabled?: boolean
  generateLabel?: string
  className?: string
  onGenerate?: () => void
  onCancel: () => void
  onSave: () => void
}

export function Ics201SectionEditActions({
  isEditing,
  isSaving = false,
  saveDisabled = false,
  generateLabel = 'Generate Section Content',
  className,
  onGenerate,
  onCancel,
  onSave,
}: Ics201SectionEditActionsProps) {
  if (!isEditing) {
    return null
  }

  return (
    <div className={cn('flex items-center justify-end gap-1.5', className)}>
      {onGenerate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={onGenerate}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {generateLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 gap-1 text-xs"
        disabled={isSaving}
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-7 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
        disabled={isSaving || saveDisabled}
        onClick={onSave}
      >
        <Check className="h-3.5 w-3.5" />
        Save
      </Button>
    </div>
  )
}
