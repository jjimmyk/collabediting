import { Check } from 'lucide-react'
import type { HubAorProfileOption } from '@/features/hub/aor/hub-aor-profile-options'
import { cn } from '@/lib/utils'

type ActivationAorOptionListProps = {
  options: HubAorProfileOption[]
  selectedIds: string[]
  onToggle: (nodeId: string) => void
  emptyMessage?: string
  className?: string
}

export function ActivationAorOptionList({
  options,
  selectedIds,
  onToggle,
  emptyMessage = 'No matching AOR entries.',
  className,
}: ActivationAorOptionListProps) {
  if (options.length === 0) {
    return (
      <p className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.value)
        return (
          <div
            key={option.value}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            className={cn(
              'flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-muted',
              isSelected && 'bg-primary/10 ring-1 ring-primary'
            )}
            onClick={() => onToggle(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle(option.value)
              }
            }}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
              )}
              aria-hidden="true"
            >
              {isSelected ? <Check className="size-3" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-[10px] text-muted-foreground">{option.group}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
