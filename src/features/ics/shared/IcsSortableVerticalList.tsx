import { type ReactNode, useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { IcsSortableDragHandle } from './IcsSortableDragHandle'

export type IcsSortableDragHandleProps = {
  ariaLabel: string
  disabled?: boolean
}

type IcsSortableVerticalListProps<T extends { id: string | number }> = {
  items: readonly T[]
  disabled?: boolean
  onReorder: (fromIndex: number, toIndex: number) => void
  renderItem: (
    item: T,
    index: number,
    dragHandle: ReactNode
  ) => ReactNode
  getDragHandleLabel?: (item: T, index: number) => string
  className?: string
  itemClassName?: string
}

function SortableItem({
  id,
  disabled,
  dragHandleLabel,
  className,
  children,
}: {
  id: string | number
  disabled?: boolean
  dragHandleLabel: string
  className?: string
  children: (dragHandle: ReactNode) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandle = (
    <IcsSortableDragHandle
      ariaLabel={dragHandleLabel}
      disabled={disabled}
      isDragging={isDragging}
      setActivatorNodeRef={setActivatorNodeRef}
      attributes={attributes}
      listeners={listeners}
    />
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'relative z-10 opacity-60 shadow-md',
        className
      )}
    >
      {children(dragHandle)}
    </div>
  )
}

export function IcsSortableVerticalList<T extends { id: string | number }>({
  items,
  disabled = false,
  onReorder,
  renderItem,
  getDragHandleLabel = (_item, index) => `Reorder objective ${index + 1}`,
  className,
  itemClassName,
}: IcsSortableVerticalListProps<T>) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const fromIndex = items.findIndex((item) => item.id === active.id)
    const toIndex = items.findIndex((item) => item.id === over.id)
    if (fromIndex === -1 || toIndex === -1) {
      return
    }

    onReorder(fromIndex, toIndex)
  }

  if (disabled || items.length <= 1) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id} className={itemClassName}>
            {renderItem(
              item,
              index,
              <IcsSortableDragHandle ariaLabel={getDragHandleLabel(item, index)} disabled />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              dragHandleLabel={getDragHandleLabel(item, index)}
              className={itemClassName}
            >
              {(dragHandle) => renderItem(item, index, dragHandle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
