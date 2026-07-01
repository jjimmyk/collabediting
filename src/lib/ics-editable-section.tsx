import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type IcsEditableSectionContentProps = {
  enabled: boolean
  ariaLabel: string
  onStartEdit: () => void
  children: ReactNode
  className?: string
}

function handleEditableKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  onStartEdit: () => void
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onStartEdit()
  }
}

export function IcsEditableSectionContent({
  enabled,
  ariaLabel,
  onStartEdit,
  children,
  className,
}: IcsEditableSectionContentProps) {
  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        'cursor-pointer rounded-md transition-colors hover:bg-muted/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={onStartEdit}
      onKeyDown={(event) => handleEditableKeyDown(event, onStartEdit)}
    >
      {children}
    </div>
  )
}
