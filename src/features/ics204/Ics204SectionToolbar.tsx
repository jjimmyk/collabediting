import { Check, Pencil, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ICS204_ASSIGNED_UNIT_OPTIONS, ICS204_SECTION_LABELS } from '@/features/ics204/constants'
import type { Ics204SectionId } from '@/features/ics204/types'
import { cn } from '@/lib/utils'

type Ics204AssignedUnitFieldProps = {
  value: string
  editable: boolean
  onChange: (value: string) => void
}

export function Ics204AssignedUnitField({
  value,
  editable,
  onChange,
}: Ics204AssignedUnitFieldProps) {
  const displayTitle = value.trim().length > 0 ? value : 'Unassigned Unit'

  if (!editable) {
    return <p className="truncate text-sm font-semibold leading-tight">{displayTitle}</p>
  }

  return (
    <select
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation()
        onChange(event.target.value)
      }}
      className="h-8 w-full max-w-md rounded-md border bg-transparent px-2 text-sm font-semibold outline-none"
    >
      <option value="">Select Assigned Unit</option>
      {ICS204_ASSIGNED_UNIT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

type Ics204SectionHeaderProps = {
  sectionId: Ics204SectionId
  title?: string
  isEditing: boolean
  canEdit: boolean
  disabled?: boolean
  onStartEdit: () => void
}

export function Ics204SectionHeader({
  sectionId,
  title,
  isEditing,
  canEdit,
  disabled = false,
  onStartEdit,
}: Ics204SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold">{title ?? ICS204_SECTION_LABELS[sectionId]}</p>
      {canEdit && !disabled && !isEditing ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          aria-label={`Edit ${ICS204_SECTION_LABELS[sectionId].toLowerCase()}`}
          onClick={onStartEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

type Ics204SectionEditActionsProps = {
  isEditing: boolean
  isSaving?: boolean
  onGenerate: () => void
  onCancel: () => void
  onSave: () => void
}

export function Ics204SectionEditActions({
  isEditing,
  isSaving = false,
  onGenerate,
  onCancel,
  onSave,
}: Ics204SectionEditActionsProps) {
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
        Generate Section Content
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

export function Ics204ReadOnlyField({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
      {value.trim().length > 0 ? value : <span className="text-muted-foreground">—</span>}
    </div>
  )
}

export function Ics204ReadOnlyTextBlock({
  value,
  compact = false,
}: {
  value: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs whitespace-pre-wrap',
        compact ? 'min-h-8' : 'min-h-20'
      )}
    >
      {value.trim().length > 0 ? value : <span className="text-muted-foreground">—</span>}
    </div>
  )
}
