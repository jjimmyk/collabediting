import type { ReactNode } from 'react'
import { Check, Pencil, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ICS214_SECTION_LABELS } from '@/features/ics214/constants'
import type { Ics214SectionId } from '@/features/ics214/types'
import { cn } from '@/lib/utils'

type Ics214SectionHeaderProps = {
  sectionId: Ics214SectionId
  title?: string
  isEditing: boolean
  canEdit: boolean
  disabled?: boolean
  onStartEdit: () => void
}

export function Ics214SectionHeader({
  sectionId,
  title,
  isEditing,
  canEdit,
  disabled = false,
  onStartEdit,
}: Ics214SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold">{title ?? ICS214_SECTION_LABELS[sectionId]}</p>
      {canEdit && !disabled && !isEditing ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          aria-label={`Edit ${ICS214_SECTION_LABELS[sectionId].toLowerCase()}`}
          onClick={onStartEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

type Ics214SectionEditActionsProps = {
  isEditing: boolean
  isSaving?: boolean
  generateLabel?: string
  onGenerate: () => void
  onCancel: () => void
  onSave: () => void
}

export function Ics214SectionEditActions({
  isEditing,
  isSaving = false,
  generateLabel = 'Generate Section Content',
  onGenerate,
  onCancel,
  onSave,
}: Ics214SectionEditActionsProps) {
  if (!isEditing) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
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
        disabled={isSaving}
        onClick={onSave}
      >
        <Check className="h-3.5 w-3.5" />
        Save
      </Button>
    </div>
  )
}

export function Ics214ReadOnlyField({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
      {value.trim().length > 0 ? value : <span className="text-muted-foreground">—</span>}
    </div>
  )
}

export function Ics214ReadOnlyTextBlock({ value }: { value: string }) {
  return (
    <div className="min-h-20 rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs whitespace-pre-wrap">
      {value.trim().length > 0 ? value : <span className="text-muted-foreground">—</span>}
    </div>
  )
}

export function Ics214FieldLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-[11px] font-medium text-muted-foreground', className)}>{children}</p>
  )
}
