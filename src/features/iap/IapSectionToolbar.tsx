import type { ReactNode } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IAP_SECTION_LABELS } from '@/features/iap/constants'
import type { IapSectionId } from '@/features/iap/types'
import { cn } from '@/lib/utils'

type IapSectionHeaderProps = {
  sectionId: IapSectionId
  title?: string
  isEditing: boolean
  canEdit: boolean
  disabled?: boolean
  onStartEdit: () => void
}

export function IapSectionHeader({
  sectionId,
  title,
  isEditing,
  canEdit,
  disabled = false,
  onStartEdit,
}: IapSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold">{title ?? IAP_SECTION_LABELS[sectionId]}</p>
      {canEdit && !disabled && !isEditing ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          aria-label={`Edit ${IAP_SECTION_LABELS[sectionId].toLowerCase()}`}
          onClick={onStartEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

type IapSectionEditActionsProps = {
  isEditing: boolean
  isSaving?: boolean
  onCancel: () => void
  onSave: () => void
}

export function IapSectionEditActions({
  isEditing,
  isSaving = false,
  onCancel,
  onSave,
}: IapSectionEditActionsProps) {
  if (!isEditing) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
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

export function IapReadOnlyField({ value }: { value: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
      {value.trim().length > 0 ? value : <span className="text-muted-foreground">—</span>}
    </div>
  )
}

export function IapFieldLabel({
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
