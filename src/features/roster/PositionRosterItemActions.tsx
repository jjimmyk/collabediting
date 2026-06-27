import { Trash2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleForNextOpButton } from '@/features/roster/ScheduleForNextOpButton'

export function PositionRosterItemActions({
  disabled = false,
  showScheduleForNextOp = false,
  onScheduleForNextOp,
  showRemove = false,
  onRemove,
  removeLabel,
  stopActionPropagation = false,
}: {
  disabled?: boolean
  showScheduleForNextOp?: boolean
  onScheduleForNextOp?: () => void
  showRemove?: boolean
  onRemove?: () => void
  removeLabel?: string
  stopActionPropagation?: boolean
}) {
  if (!showScheduleForNextOp && !showRemove) {
    return null
  }

  const wrapClick =
    (handler: () => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      if (stopActionPropagation) {
        event.stopPropagation()
      }
      handler()
    }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      {showScheduleForNextOp && onScheduleForNextOp ? (
        <ScheduleForNextOpButton
          compact
          disabled={disabled}
          onClick={wrapClick(onScheduleForNextOp)}
        />
      ) : null}
      {showRemove && onRemove ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={removeLabel ?? 'Remove'}
          disabled={disabled}
          onClick={wrapClick(onRemove)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
