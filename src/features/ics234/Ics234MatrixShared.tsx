import { Check, Pencil, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  Ics234MatrixItemDraft,
  Ics234MatrixItemEditState,
  Ics234MatrixItemRef,
  Ics234ObjectiveRow,
} from '@/features/ics234/types'
import { ics234MatrixItemRefsMatch } from '@/features/ics234/utils'
import { cn } from '@/lib/utils'

export function displayIcs234MatrixItemName(name: string, fallback: string) {
  const trimmed = name.trim()
  return trimmed || fallback
}

export function getIcs234MatrixItemDraftName(
  ref: Ics234MatrixItemRef,
  fallback: string,
  editingItem: Ics234MatrixItemEditState | null
) {
  if (
    editingItem &&
    ics234MatrixItemRefsMatch(editingItem.ref, ref) &&
    editingItem.draft.kind === ref.kind
  ) {
    return editingItem.draft.name
  }
  return fallback
}

type Ics234MatrixInlineNameFieldProps = {
  name: string
  editing: boolean
  placeholder: string
  readOnly?: boolean
  onChange: (name: string) => void
  className?: string
}

export function Ics234MatrixInlineNameField({
  name,
  editing,
  placeholder,
  readOnly = false,
  onChange,
  className,
}: Ics234MatrixInlineNameFieldProps) {
  if (editing && !readOnly) {
    return (
      <input
        value={name}
        placeholder={placeholder}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm font-medium outline-none',
          className
        )}
      />
    )
  }

  return (
    <span className={cn('text-sm font-medium', className)}>
      {displayIcs234MatrixItemName(name, placeholder)}
    </span>
  )
}

type Ics234MatrixItemEditControlsProps = {
  ref: Ics234MatrixItemRef
  itemLabel: string
  canMutate: boolean
  isSaving: boolean
  editingItem: Ics234MatrixItemEditState | null
  disabled?: boolean
  onStartItemEdit: (ref: Ics234MatrixItemRef) => void
  onCancelItemEdit: () => void
  onSaveItem: () => void
  onGenerateItem: (ref: Ics234MatrixItemRef) => void
  onEditClick?: (ref: Ics234MatrixItemRef) => void
  compact?: boolean
}

export function Ics234MatrixItemEditControls({
  ref,
  itemLabel,
  canMutate,
  isSaving,
  editingItem,
  disabled = false,
  onStartItemEdit,
  onCancelItemEdit,
  onSaveItem,
  onGenerateItem,
  onEditClick,
  compact = false,
}: Ics234MatrixItemEditControlsProps) {
  if (!canMutate || disabled) {
    return null
  }

  const editing = !!editingItem && ics234MatrixItemRefsMatch(editingItem.ref, ref)

  if (editing) {
    return (
      <div
        className={cn('flex shrink-0 items-center gap-1', compact && 'flex-wrap')}
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onGenerateItem(ref)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs"
          disabled={isSaving}
          onClick={onCancelItemEdit}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 gap-1 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
          disabled={isSaving}
          onClick={onSaveItem}
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      aria-label={`Edit ${itemLabel}`}
      onClick={(event) => {
        event.stopPropagation()
        onStartItemEdit(ref)
        onEditClick?.(ref)
      }}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  )
}

export type Ics234WorkAnalysisMatrixProps = {
  objectives: Ics234ObjectiveRow[]
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingItem: Ics234MatrixItemEditState | null
  onStartItemEdit: (ref: Ics234MatrixItemRef) => void
  onCancelItemEdit: () => void
  onPatchItemDraft: (draft: Ics234MatrixItemDraft) => void
  onSaveItem: () => void
  onGenerateItem: (ref: Ics234MatrixItemRef) => void
  onAddObjective: () => void
  onAddStrategy: (objectiveId: number) => void
  onAddTactic: (objectiveId: number, strategyId: number) => void
  onDeleteObjective: (objectiveId: number) => void
  onDeleteStrategy: (objectiveId: number, strategyId: number) => void
  onDeleteTactic: (objectiveId: number, strategyId: number, tacticId: number) => void
  onReorderObjectives: (fromIndex: number, toIndex: number) => void
}
