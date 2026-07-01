import { GripVertical } from 'lucide-react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { cn } from '@/lib/utils'

type IcsSortableDragHandleProps = {
  ariaLabel: string
  className?: string
  disabled?: boolean
  isDragging?: boolean
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
}

export function IcsSortableDragHandle({
  ariaLabel,
  className,
  disabled = false,
  isDragging = false,
  setActivatorNodeRef,
  attributes,
  listeners,
}: IcsSortableDragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40',
        isDragging && 'cursor-grabbing',
        className
      )}
      aria-label={ariaLabel}
      disabled={disabled}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}
